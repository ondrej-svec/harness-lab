import { randomBytes, randomUUID } from "node:crypto";
import { getNeonSql } from "../neon-db";

/**
 * Server-side first-password set, without email or out-of-band codes.
 *
 * Strategy:
 *   1. Mint a random reset token, INSERT a row into neon_auth.verification
 *      with identifier = "reset-password:<token>" and value = neonUserId.
 *      This is the same row format better-auth's request-password-reset
 *      would create — we just bypass the email channel.
 *   2. Call POST {NEON_AUTH_BASE_URL}/reset-password with { token, newPassword }.
 *      Better-auth validates the token (expiry, single-use), writes the
 *      hashed password into neon_auth.account.password, deletes the
 *      verification row.
 *   3. Caller follows up with auth.signIn.email to issue the Neon
 *      Auth session cookie via the ambient response context.
 *
 * No private better-auth APIs called — only the standard /reset-password
 * endpoint. The verification table format ("reset-password:<token>") is
 * documented across better-auth issues and stable across the 1.x line.
 *
 * Token TTL is 5 minutes. The mint-and-immediately-redeem pattern
 * means the token only lives during the same server-action handler.
 */

const TOKEN_TTL_MS = 5 * 60 * 1000;
const VERIFICATION_PREFIX = "reset-password:";

export type SetParticipantPasswordInput = {
  neonUserId: string;
  newPassword: string;
};

export type SetParticipantPasswordFailureReason =
  | "weak_password"
  | "token_mint_failed"
  | "reset_failed"
  | "missing_neon_auth";

export type SetParticipantPasswordResult =
  | { ok: true }
  | { ok: false; reason: SetParticipantPasswordFailureReason; message?: string };

function readEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.length > 0 ? value : null;
}

/**
 * Set a first password (or rotate one) for a Neon Auth user, server-
 * side, without sending an email. Caller still needs to sign the user
 * in afterwards if they want a session cookie.
 */
export async function setParticipantPasswordViaResetToken(
  input: SetParticipantPasswordInput,
): Promise<SetParticipantPasswordResult> {
  if (input.newPassword.length < 8) {
    return { ok: false, reason: "weak_password" };
  }

  const baseUrl = readEnv("NEON_AUTH_BASE_URL");
  if (!baseUrl) {
    return { ok: false, reason: "missing_neon_auth", message: "NEON_AUTH_BASE_URL not set" };
  }

  // Mint a token and persist it directly so the reset endpoint accepts
  // it. URL-safe base64 keeps the token round-trippable through
  // application/json bodies without escaping.
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  try {
    const sql = getNeonSql();
    await sql.query(
      `INSERT INTO neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [randomUUID(), `${VERIFICATION_PREFIX}${token}`, input.neonUserId, expiresAt.toISOString()],
    );
  } catch (e) {
    return {
      ok: false,
      reason: "token_mint_failed",
      message: e instanceof Error ? e.message : String(e),
    };
  }

  let response: Response;
  try {
    // Better-auth's reset-password endpoint enforces an Origin header
    // (CSRF defense). The trusted origin list is configured at the
    // Neon Auth instance — we forward our base URL's origin so the
    // request is treated as same-site.
    const origin = new URL(baseUrl).origin;
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/reset-password`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ token, newPassword: input.newPassword }),
    });
  } catch (e) {
    return {
      ok: false,
      reason: "reset_failed",
      message: e instanceof Error ? e.message : String(e),
    };
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    return {
      ok: false,
      reason: "reset_failed",
      message: body.message ?? `${response.status} ${response.statusText}`,
    };
  }

  return { ok: true };
}
