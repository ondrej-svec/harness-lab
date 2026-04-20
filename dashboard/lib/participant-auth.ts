import { auth } from "./auth/server";
import { getNeonSql } from "./neon-db";
import { isNeonRuntimeMode } from "./runtime-auth-configuration";

/**
 * Thin wrapper around Neon Auth (built on better-auth) for the
 * participant role. One integration point — if we ever swap auth
 * backends or move off the admin-session model, we do it here.
 *
 * See docs/brainstorms/2026-04-20-neon-auth-participant-role-spike.md
 * for the research that grounded these choices:
 * - `admin.createUser` is the only admin method callable without a
 *   pre-existing admin session, so it's how we mint participant users
 *   server-side.
 * - Email is the canonical identifier — real ones only; no synthetic
 *   fallback. Roster entries without email collect one at first
 *   identify.
 * - Role is set during creation via the admin.createUser `role`
 *   argument so `hasFacilitatorPlatformAccess` never sees a
 *   participant as admin.
 * - Password reset has two paths: facilitator-issued in-room code
 *   (requires a system admin session) and Neon-sent email link.
 */

export type CreateParticipantAccountInput = {
  email: string;
  password: string;
  displayName: string;
};

export type CreateParticipantFailureReason =
  | "email_taken"
  | "weak_password"
  | "invalid_email"
  | "unavailable"
  | "unknown";

export type CreateParticipantAccountResult =
  | { ok: true; neonUserId: string }
  | { ok: false; reason: CreateParticipantFailureReason; message?: string };

export type AuthenticateParticipantInput = {
  email: string;
  password: string;
};

export type AuthenticateParticipantFailureReason =
  | "wrong_credentials"
  | "rate_limited"
  | "unavailable"
  | "unknown";

export type AuthenticateParticipantResult =
  | { ok: true; neonUserId: string }
  | { ok: false; reason: AuthenticateParticipantFailureReason; message?: string };

type NeonAuthCallShape = {
  admin: {
    createUser: (input: { email: string; password: string; name: string; role: string }) => Promise<unknown>;
    setUserPassword: (input: { userId: string; newPassword: string }) => Promise<unknown>;
    revokeUserSessions: (input: { userId: string }) => Promise<unknown>;
  };
  signIn: { email: (input: { email: string; password: string }) => Promise<unknown> };
  getSession: () => Promise<{ data?: { user?: { id?: string } } | null }>;
  requestPasswordReset: (input: { email: string; redirectTo: string }) => Promise<unknown>;
};

function requireAuth(): NeonAuthCallShape {
  if (!isNeonRuntimeMode()) {
    throw new Error("participant-auth requires HARNESS_STORAGE_MODE=neon");
  }
  if (!auth) {
    throw new Error("participant-auth requires NEON_AUTH_BASE_URL + NEON_AUTH_COOKIE_SECRET");
  }
  return auth as unknown as NeonAuthCallShape;
}

function normalizeEmail(email: string): string {
  return email.trim().toLocaleLowerCase();
}

function classifyCreateError(message: string | undefined): CreateParticipantFailureReason {
  const lower = (message ?? "").toLowerCase();
  if (lower.includes("already") && lower.includes("exist")) return "email_taken";
  if (lower.includes("email") && lower.includes("taken")) return "email_taken";
  if (lower.includes("password") && (lower.includes("weak") || lower.includes("short") || lower.includes("min"))) {
    return "weak_password";
  }
  if (lower.includes("invalid") && lower.includes("email")) return "invalid_email";
  return "unknown";
}

function classifyAuthError(message: string | undefined): AuthenticateParticipantFailureReason {
  const lower = (message ?? "").toLowerCase();
  if (lower.includes("rate") || lower.includes("too many")) return "rate_limited";
  if (lower.includes("invalid") || lower.includes("wrong") || lower.includes("incorrect")) {
    return "wrong_credentials";
  }
  if (lower.includes("not found") || lower.includes("no user")) return "wrong_credentials";
  return "unknown";
}

/**
 * Create a participant's Neon Auth account. Runs admin.createUser with
 * `role = "participant"` — works without a pre-existing admin session
 * per better-auth's admin plugin semantics. Does NOT sign the user in;
 * the caller pairs this with `authenticateParticipant` inside the same
 * server action to issue the Neon session cookie.
 */
export async function createParticipantAccount(
  input: CreateParticipantAccountInput,
): Promise<CreateParticipantAccountResult> {
  const client = requireAuth();
  const email = normalizeEmail(input.email);

  try {
    const response = await client.admin.createUser({
      email,
      password: input.password,
      name: input.displayName,
      role: "participant",
    });

    const error = (response as { error?: { message?: string } }).error;
    if (error) {
      return { ok: false, reason: classifyCreateError(error.message), message: error.message };
    }

    const user = (response as { data?: { user?: { id?: string } } }).data?.user;
    if (!user?.id) {
      return { ok: false, reason: "unknown", message: "createUser returned no user id" };
    }

    return { ok: true, neonUserId: user.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: classifyCreateError(message), message };
  }
}

/**
 * Sign a participant in with their email + password. Issues the Neon
 * Auth session cookie as a side effect (the SDK writes it into the
 * ambient response).
 */
export async function authenticateParticipant(
  input: AuthenticateParticipantInput,
): Promise<AuthenticateParticipantResult> {
  const client = requireAuth();
  const email = normalizeEmail(input.email);

  try {
    const response = await client.signIn.email({ email, password: input.password });
    const error = (response as { error?: { message?: string } }).error;
    if (error) {
      return { ok: false, reason: classifyAuthError(error.message), message: error.message };
    }

    // signIn.email doesn't always return the user id — fetch the session we just established.
    const { data: session } = await client.getSession();
    if (!session?.user?.id) {
      return { ok: false, reason: "unknown", message: "signIn succeeded but no session was created" };
    }
    return { ok: true, neonUserId: session.user.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: classifyAuthError(message), message };
  }
}

/**
 * In-room password reset. The caller MUST be running inside a
 * facilitator's request context — their Neon Auth session cookie
 * provides the admin role that `auth.admin.setUserPassword` +
 * `auth.admin.revokeUserSessions` check for. No service admin user
 * needed; we ride the facilitator's existing authority.
 *
 * The facilitator generates the new password (typically 3 random words
 * from the event-code wordlist) and reads it aloud to the participant.
 * This function rotates it in Neon Auth and kills any existing sessions
 * so the stale session can't outlive the reset.
 */
export async function resetParticipantPasswordAsAdmin(opts: {
  neonUserId: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; reason: "not_admin" | "not_found" | "unknown"; message?: string }> {
  const client = requireAuth();

  try {
    const setResp = await client.admin.setUserPassword({
      userId: opts.neonUserId,
      newPassword: opts.newPassword,
    });
    const setErr = (setResp as { error?: { message?: string } }).error;
    if (setErr) {
      const msg = (setErr.message ?? "").toLowerCase();
      if (msg.includes("unauthorized") || msg.includes("forbidden") || msg.includes("admin")) {
        return { ok: false, reason: "not_admin", message: setErr.message };
      }
      if (msg.includes("not found") || msg.includes("no user")) {
        return { ok: false, reason: "not_found", message: setErr.message };
      }
      return { ok: false, reason: "unknown", message: setErr.message };
    }

    // Best-effort session revoke. If it fails, the password was still
    // rotated, so the stale session dies at its expiry at the latest.
    await client.admin.revokeUserSessions({ userId: opts.neonUserId }).catch(() => {});
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: "unknown", message };
  }
}

/**
 * Facilitator-initiated password reset that uses Neon Auth's email
 * link. Fallback when the participant isn't in the room to receive a
 * spoken code. Does NOT require an admin session; `requestPasswordReset`
 * is public.
 */
export async function sendParticipantPasswordResetEmail(opts: {
  email: string;
  redirectTo: string;
}): Promise<{ ok: true } | { ok: false; message?: string }> {
  const client = requireAuth();

  try {
    const response = await client.requestPasswordReset({
      email: normalizeEmail(opts.email),
      redirectTo: opts.redirectTo,
    });
    const error = (response as { error?: { message?: string } }).error;
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, message };
  }
}

/**
 * Verify that a Neon Auth user has role = "participant" (i.e., is NOT
 * an admin). Used as a defense-in-depth check on any endpoint that
 * needs the participant boundary — even though the facilitator path is
 * already role-gated by `hasFacilitatorPlatformAccess`, we check the
 * other direction explicitly.
 */
export async function isNeonUserParticipant(neonUserId: string): Promise<boolean> {
  if (!isNeonRuntimeMode()) return false;

  const sql = getNeonSql();
  const rows = (await sql.query(
    `SELECT role FROM neon_auth."user" WHERE id::text = $1 LIMIT 1`,
    [neonUserId],
  )) as Array<{ role: string | null }>;

  return rows[0]?.role === "participant";
}
