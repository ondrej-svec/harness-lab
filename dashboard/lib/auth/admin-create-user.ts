import { getNeonSql } from "../neon-db";

/**
 * Server-side Neon Auth user creation via the Neon control-plane API.
 *
 * Why this and not `auth.signUp.email` or `auth.admin.createUser`:
 *   - signUp.email is disabled at the Neon Auth instance level
 *     (EMAIL_AND_PASSWORD_SIGN_UP_IS_NOT_ENABLED) — the workshop has
 *     no public signup, ever.
 *   - admin.createUser requires an admin session in the calling
 *     context. Walk-in participants have no admin session.
 *   - The control-plane API authenticates with NEON_API_KEY (project-
 *     scoped credential, same one Inverso uses), accepts {email, name},
 *     and creates the row in neon_auth.user + an empty credential
 *     account row in neon_auth.account. Password is set later via the
 *     server-side reset-token flow (see server-set-password.ts).
 *
 * The default role on creation is "user". We immediately UPDATE to
 * "participant" so the privilege boundary (hasFacilitatorPlatformAccess
 * checks role === "admin") never sees the new user as facilitator-
 * eligible.
 *
 * Requires HARNESS_NEON_PROJECT_ID + HARNESS_NEON_BRANCH_ID
 * (control-plane writes are branch-scoped) + NEON_API_KEY in the
 * server env. All three are asserted at first call.
 */

export type AdminCreateUserInput = {
  email: string;
  name: string;
};

export type AdminCreateUserResult =
  | { ok: true; neonUserId: string }
  | { ok: false; reason: AdminCreateUserFailureReason; message?: string };

export type AdminCreateUserFailureReason =
  | "email_taken"
  | "invalid_email"
  | "missing_credentials"
  | "control_plane_error"
  | "role_update_failed";

type ControlPlaneCreateBody = { id: string };
type ControlPlaneError = { code?: string; message?: string };

const NEON_CONTROL_PLANE = "https://console.neon.tech/api/v2";

function readEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.length > 0 ? value : null;
}

function requireCredentials(): { apiKey: string; projectId: string; branchId: string } | null {
  const apiKey = readEnv("NEON_API_KEY");
  const projectId = readEnv("HARNESS_NEON_PROJECT_ID");
  const branchId = readEnv("HARNESS_NEON_BRANCH_ID");
  if (!apiKey || !projectId || !branchId) return null;
  return { apiKey, projectId, branchId };
}

/**
 * Create a passwordless Neon Auth user with role = "participant".
 * The caller chains this with `setParticipantPasswordViaResetToken`
 * to give the new user a usable credential.
 */
export async function adminCreateParticipantUser(
  input: AdminCreateUserInput,
): Promise<AdminCreateUserResult> {
  const credentials = requireCredentials();
  if (!credentials) {
    return {
      ok: false,
      reason: "missing_credentials",
      message: "NEON_API_KEY + HARNESS_NEON_PROJECT_ID + HARNESS_NEON_BRANCH_ID are required",
    };
  }

  const email = input.email.trim().toLocaleLowerCase();
  if (email.length === 0 || email.indexOf("@") <= 0) {
    return { ok: false, reason: "invalid_email" };
  }

  const url = `${NEON_CONTROL_PLANE}/projects/${credentials.projectId}/branches/${credentials.branchId}/auth/users`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ email, name: input.name }),
    });
  } catch (e) {
    return {
      ok: false,
      reason: "control_plane_error",
      message: e instanceof Error ? e.message : String(e),
    };
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ControlPlaneError;
    if (response.status === 409 || /exists/i.test(body.message ?? "")) {
      return { ok: false, reason: "email_taken", message: body.message };
    }
    return {
      ok: false,
      reason: "control_plane_error",
      message: body.message ?? `${response.status} ${response.statusText}`,
    };
  }

  const created = (await response.json()) as ControlPlaneCreateBody;
  if (!created.id) {
    return {
      ok: false,
      reason: "control_plane_error",
      message: "control plane returned no id",
    };
  }

  // Demote the freshly-created user from the default "user" role to
  // "participant". The privilege-boundary suite asserts this row never
  // satisfies hasFacilitatorPlatformAccess.
  try {
    const sql = getNeonSql();
    await sql.query(
      `UPDATE neon_auth."user" SET role = 'participant' WHERE id::text = $1`,
      [created.id],
    );
  } catch (e) {
    return {
      ok: false,
      reason: "role_update_failed",
      message: e instanceof Error ? e.message : String(e),
    };
  }

  return { ok: true, neonUserId: created.id };
}

export type AdminDeleteUserResult =
  | { ok: true; method: "control_plane_delete" }
  | { ok: true; method: "pii_stripped"; note: string }
  | { ok: false; reason: "missing_credentials" | "control_plane_error"; message?: string };

/**
 * Delete a Neon Auth user for GDPR Art. 17 (right to erasure).
 *
 * Tries the control-plane DELETE endpoint first. If Neon rejects the
 * request (method not allowed / not supported), falls back to stripping
 * the user's PII in-place (email, name, image) and zeroing the
 * credential row — which leaves a tombstone row but removes the
 * identifying fields, satisfying Art. 17 when hard-delete is unavailable.
 *
 * The caller MUST ensure the operator is a facilitator for the relevant
 * instance and that every `participant_id` FK row has been cascaded
 * before calling — this function touches the Neon Auth runtime only.
 */
export async function adminDeleteParticipantUser(neonUserId: string): Promise<AdminDeleteUserResult> {
  const credentials = requireCredentials();
  if (!credentials) {
    return {
      ok: false,
      reason: "missing_credentials",
      message: "NEON_API_KEY + HARNESS_NEON_PROJECT_ID + HARNESS_NEON_BRANCH_ID are required",
    };
  }

  const url = `${NEON_CONTROL_PLANE}/projects/${credentials.projectId}/branches/${credentials.branchId}/auth/users/${encodeURIComponent(neonUserId)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
      },
    });
  } catch (e) {
    return {
      ok: false,
      reason: "control_plane_error",
      message: e instanceof Error ? e.message : String(e),
    };
  }

  if (response.ok || response.status === 204) {
    return { ok: true, method: "control_plane_delete" };
  }

  // 404: the user is already gone on the control plane. Treat as success
  // for idempotency — GDPR deletion is the end state, not the call.
  if (response.status === 404) {
    return { ok: true, method: "control_plane_delete" };
  }

  // 405 / 501 / unsupported: fall through to PII-strip. Any other 4xx/5xx
  // is a real error; surface it so the caller logs and retries.
  if (response.status !== 405 && response.status !== 501) {
    const body = (await response.json().catch(() => ({}))) as ControlPlaneError;
    return {
      ok: false,
      reason: "control_plane_error",
      message: body.message ?? `${response.status} ${response.statusText}`,
    };
  }

  try {
    const sql = getNeonSql();
    await sql.query(
      `UPDATE neon_auth."user"
         SET email = 'gdpr-deleted+' || id::text || '@invalid',
             name = 'deleted',
             image = NULL
       WHERE id::text = $1`,
      [neonUserId],
    );
    await sql.query(
      `UPDATE neon_auth.account
         SET password = ''
       WHERE "userId"::text = $1
         AND "providerId" = 'credential'`,
      [neonUserId],
    );
    return {
      ok: true,
      method: "pii_stripped",
      note: "control plane DELETE unsupported; PII stripped in-place",
    };
  } catch (e) {
    return {
      ok: false,
      reason: "control_plane_error",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Look up an existing Neon Auth user by email for orphan-recovery.
 *
 * Returns the user's neonUserId and whether they have a password set
 * in neon_auth.account. If `hasPassword` is false, the user was
 * created by a prior createParticipantAccount attempt whose step-2
 * (password set) failed — safe to recover via
 * setParticipantPasswordViaResetToken with the caller's chosen
 * password.
 *
 * If `hasPassword` is true, the user is a legitimate existing account;
 * the caller must NOT silently overwrite the password. Surface
 * "email_taken" to the participant so they can sign in instead.
 *
 * Returns `null` when the email doesn't match any user (extremely
 * unusual — would only happen if the `email_taken` signal from the
 * control-plane create was itself wrong).
 */
export async function findParticipantUserForRecovery(
  email: string,
): Promise<{ neonUserId: string; hasPassword: boolean } | null> {
  const sql = getNeonSql();
  const rows = (await sql.query(
    `
      SELECT u.id::text AS user_id,
             COALESCE(a.password, '') AS password
      FROM neon_auth."user" u
      LEFT JOIN neon_auth.account a
        ON a."userId" = u.id AND a."providerId" = 'credential'
      WHERE lower(u.email) = lower($1)
      LIMIT 1
    `,
    [email],
  )) as { user_id: string; password: string }[];
  const row = rows[0];
  if (!row) return null;
  return {
    neonUserId: row.user_id,
    hasPassword: row.password !== null && row.password.length > 0,
  };
}
