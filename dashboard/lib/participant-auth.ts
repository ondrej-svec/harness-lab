import { adminCreateParticipantUser, findParticipantUserForRecovery } from "./auth/admin-create-user";
import {
  admin as proxyAdmin,
  requestPasswordReset as proxyRequestPasswordReset,
} from "./auth/neon-auth-proxy";
import { setParticipantPasswordViaResetToken } from "./auth/server-set-password";
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

function requireNeonMode(): void {
  if (!isNeonRuntimeMode()) {
    throw new Error("participant-auth requires HARNESS_STORAGE_MODE=neon");
  }
  if (!process.env.NEON_AUTH_BASE_URL) {
    throw new Error("participant-auth requires NEON_AUTH_BASE_URL");
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLocaleLowerCase();
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
 * Create a participant's Neon Auth account, server-side, without
 * email or out-of-band codes.
 *
 * Two-step flow:
 *   1. `adminCreateParticipantUser` hits the Neon control-plane API
 *      (POST /projects/{id}/branches/{id}/auth/users) with NEON_API_KEY.
 *      Creates the user row + an empty credential account + sets role
 *      to "participant" via SQL. The control-plane endpoint silently
 *      drops any `password` parameter, so step 2 is required.
 *   2. `setParticipantPasswordViaResetToken` mints a reset-password
 *      verification row directly, then calls /auth/reset-password with
 *      the token + the participant's chosen password. Email stays out
 *      of the loop entirely.
 *
 * On failure of either step, surface the classified reason for the
 * server action to map to user-facing copy. Public signup remains
 * disabled at the Neon Auth instance level forever — NEON_API_KEY is
 * the only privileged credential. No service-admin user, no
 * out-of-band code, no email.
 *
 * The session cookie is NOT issued here — the caller chains
 * `authenticateParticipant` to log the new participant in, which
 * issues the Neon Auth session cookie via the ambient response.
 */
export async function createParticipantAccount(
  input: CreateParticipantAccountInput,
): Promise<CreateParticipantAccountResult> {
  if (!isNeonRuntimeMode()) {
    throw new Error("participant-auth requires HARNESS_STORAGE_MODE=neon");
  }

  const email = normalizeEmail(input.email);

  // Step 1: control-plane create.
  const created = await adminCreateParticipantUser({
    email,
    name: input.displayName,
  });
  if (!created.ok) {
    if (created.reason === "email_taken") {
      // Two possibilities behind email_taken:
      //   (a) a real existing account — do NOT reset their password;
      //       surface email_taken so the UI tells them to sign in.
      //   (b) an orphan from a prior attempt where step 1 succeeded
      //       but step 2 failed — safe to recover by setting a password
      //       for the caller's chosen value.
      // Distinguish by checking whether the existing user has a
      // password set in neon_auth.account.
      const recovery = await recoverOrphanedAccount(email, input.password);
      if (recovery) return recovery;
      return { ok: false, reason: "email_taken", message: created.message };
    }
    if (created.reason === "invalid_email") {
      return { ok: false, reason: "invalid_email", message: created.message };
    }
    if (created.reason === "missing_credentials") {
      return { ok: false, reason: "unavailable", message: created.message };
    }
    return { ok: false, reason: "unknown", message: created.message };
  }

  // Step 2: set password via reset-token bypass (no email).
  const passwordSet = await setParticipantPasswordViaResetToken({
    neonUserId: created.neonUserId,
    newPassword: input.password,
  });
  if (!passwordSet.ok) {
    if (passwordSet.reason === "weak_password") {
      return { ok: false, reason: "weak_password", message: passwordSet.message };
    }
    if (passwordSet.reason === "missing_neon_auth") {
      return { ok: false, reason: "unavailable", message: passwordSet.message };
    }
    // Step 1 succeeded, step 2 failed — user row exists without a
    // usable password. The next attempt with the same email will hit
    // the email_taken branch above, which calls recoverOrphanedAccount
    // to complete the setup.
    return {
      ok: false,
      reason: "unknown",
      message: `password-set-failed: ${passwordSet.message}`,
    };
  }

  return { ok: true, neonUserId: created.neonUserId };
}

/**
 * If `email` matches a Neon Auth user who has NO password set, set the
 * password and return a success result. This is the orphan-recovery
 * path for failed createParticipantAccount attempts whose step-1 (user
 * create) succeeded but step-2 (password set) did not.
 *
 * Returns `null` in two cases: the user doesn't exist (caller should
 * surface email_taken as a bug signal), or the user exists WITH a
 * password (real existing account — caller must surface email_taken
 * so the UI prompts sign-in).
 */
async function recoverOrphanedAccount(
  email: string,
  newPassword: string,
): Promise<CreateParticipantAccountResult | null> {
  const existing = await findParticipantUserForRecovery(email);
  if (!existing) return null;
  if (existing.hasPassword) return null;
  const passwordSet = await setParticipantPasswordViaResetToken({
    neonUserId: existing.neonUserId,
    newPassword,
  });
  if (!passwordSet.ok) {
    if (passwordSet.reason === "weak_password") {
      return { ok: false, reason: "weak_password", message: passwordSet.message };
    }
    if (passwordSet.reason === "missing_neon_auth") {
      return { ok: false, reason: "unavailable", message: passwordSet.message };
    }
    return {
      ok: false,
      reason: "unknown",
      message: `recovery-failed: ${passwordSet.message}`,
    };
  }
  return { ok: true, neonUserId: existing.neonUserId };
}

/**
 * Sign a participant in with their email + password.
 *
 * Implementation note: we hit better-auth's /sign-in/email endpoint
 * via raw fetch instead of the SDK because the SDK's server-side
 * code doesn't reliably forward an Origin header, and Neon Auth's
 * CSRF check rejects requests without one ("Invalid origin"). Raw
 * fetch lets us send the canonical origin (the auth base URL itself,
 * which is always trusted) and stay decoupled from SDK quirks.
 *
 * This call does NOT propagate a session cookie back to the
 * participant's browser — the response body carries the bearer
 * token. Callers that need the participant signed in via the Neon
 * Auth cookie must handle that explicitly (today, the event-code
 * session is the authoritative session for /participant routes; the
 * Neon Auth session is checked only on auth-sensitive surfaces).
 */
export async function authenticateParticipant(
  input: AuthenticateParticipantInput,
): Promise<AuthenticateParticipantResult> {
  if (!isNeonRuntimeMode()) {
    throw new Error("participant-auth requires HARNESS_STORAGE_MODE=neon");
  }

  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!baseUrl) {
    return { ok: false, reason: "unavailable", message: "NEON_AUTH_BASE_URL not set" };
  }

  const email = normalizeEmail(input.email);
  const origin = new URL(baseUrl).origin;

  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email, password: input.password }),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: classifyAuthError(message), message };
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
    if (response.status === 429 || /rate|too many/i.test(body.message ?? "")) {
      return { ok: false, reason: "rate_limited", message: body.message };
    }
    return { ok: false, reason: "wrong_credentials", message: body.message ?? body.code };
  }

  const body = (await response.json().catch(() => ({}))) as { user?: { id?: string } };
  if (!body.user?.id) {
    return { ok: false, reason: "unknown", message: "signIn succeeded but no user id was returned" };
  }
  return { ok: true, neonUserId: body.user.id };
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
  requireNeonMode();

  const setResult = await proxyAdmin.setUserPassword({
    userId: opts.neonUserId,
    newPassword: opts.newPassword,
  });
  if (!setResult.ok) {
    return { ok: false, reason: setResult.reason ?? "unknown", message: setResult.error };
  }

  // Best-effort session revoke. If it fails, the password was still
  // rotated, so the stale session dies at its expiry at the latest.
  await proxyAdmin.revokeUserSessions({ userId: opts.neonUserId }).catch(() => {});
  return { ok: true };
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
  requireNeonMode();
  const result = await proxyRequestPasswordReset({
    email: normalizeEmail(opts.email),
    redirectTo: opts.redirectTo,
  });
  return result.ok ? { ok: true } : { ok: false, message: result.error };
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
