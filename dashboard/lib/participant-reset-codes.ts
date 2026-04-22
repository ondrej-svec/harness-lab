import { randomInt } from "node:crypto";

/**
 * Ephemeral participant-reset-code store.
 *
 * Replaces the "return plaintext temporary password in the admin
 * response body" flow with a one-time 3-word code that a participant
 * exchanges for a password of their own choosing.
 *
 * Security properties:
 *   - single-use: consume() removes the code on success
 *   - short-lived: 15-minute expiry, swept on every read
 *   - scoped: the code binds participantId + instanceId + neonUserId,
 *     so a leaked code can't be used against a different participant
 *     or instance
 *   - in-memory only: lost on cold start (participant re-requests
 *     from facilitator — documented in runbook)
 *   - never logged: the code only crosses the wire in the admin
 *     response and the participant redeem request; both are
 *     application-logic values, not written to audit metadata
 *
 * The wordlist matches the one previously used to generate the
 * plaintext temporary password, so the facilitator UX is unchanged
 * from "read three hyphenated words aloud."
 */

const CODE_TTL_MS = 15 * 60 * 1000;

const word1 = [
  "amber", "branch", "circuit", "ember", "harbor", "lantern",
  "matrix", "orbit", "relay", "signal", "sprint", "vector",
] as const;

const word2 = [
  "agenda", "bridge", "canvas", "checkpoint", "context", "handoff",
  "moment", "repo", "review", "rotation", "runner", "trace",
] as const;

const word3 = [
  "delta", "focus", "link", "north", "orbit", "room",
  "shift", "signal", "stack", "studio", "switch", "window",
] as const;

export function generateResetCode(): string {
  return [
    `${word1[randomInt(word1.length)]}${randomInt(1, 10)}`,
    `${word2[randomInt(word2.length)]}${randomInt(1, 10)}`,
    `${word3[randomInt(word3.length)]}${randomInt(1, 10)}`,
  ].join("-");
}

type IssuedCode = {
  participantId: string;
  instanceId: string;
  neonUserId: string;
  expiresAt: number;
};

type CodeStore = Map<string, IssuedCode>;

/**
 * Global store — module-level so all callers in the same function
 * instance share the same map. Vercel Fluid reuses function instances
 * across concurrent requests, so this is effectively "one store per
 * warm function," which is the right scope.
 */
const store: CodeStore = new Map();

function sweepExpired(now: number) {
  for (const [code, entry] of store.entries()) {
    if (entry.expiresAt <= now) store.delete(code);
  }
}

export type IssueResetCodeInput = {
  participantId: string;
  instanceId: string;
  neonUserId: string;
};

export type IssuedResetCode = {
  code: string;
  expiresAt: string;
};

/**
 * Issue a new reset code for a participant. Always returns a fresh
 * code; previously-issued codes for the same participant are
 * explicitly invalidated so a facilitator re-issue replaces the
 * prior code rather than leaving two valid paths.
 */
export function issueResetCode(input: IssueResetCodeInput): IssuedResetCode {
  const now = Date.now();
  sweepExpired(now);

  // Invalidate any prior codes for the same participant on the same
  // instance. Keeps the store to one live code per participant.
  for (const [code, entry] of store.entries()) {
    if (entry.participantId === input.participantId && entry.instanceId === input.instanceId) {
      store.delete(code);
    }
  }

  const code = generateResetCode();
  const expiresAt = now + CODE_TTL_MS;
  store.set(code, {
    participantId: input.participantId,
    instanceId: input.instanceId,
    neonUserId: input.neonUserId,
    expiresAt,
  });
  return { code, expiresAt: new Date(expiresAt).toISOString() };
}

export type ConsumeResetCodeResult =
  | {
      ok: true;
      participantId: string;
      instanceId: string;
      neonUserId: string;
    }
  | { ok: false; reason: "unknown" | "expired" };

/**
 * Look up and consume a reset code. On success, the code is removed
 * from the store (single-use). On failure, returns a discriminated
 * reason the route handler maps to a user-facing error.
 *
 * "unknown" covers both the typo case (code was never issued) and
 * the already-consumed case. Not distinguished on purpose: telling a
 * caller "this was already used" helps an attacker enumerate.
 */
export function consumeResetCode(rawCode: string): ConsumeResetCodeResult {
  const code = rawCode.trim().toLowerCase();
  const now = Date.now();
  // Check for expiry on the direct lookup first so we can differentiate
  // "expired" from "unknown"; run the broader sweep after to keep the
  // store from growing unbounded across repeated consumes.
  const entry = store.get(code);
  if (!entry) {
    sweepExpired(now);
    return { ok: false, reason: "unknown" };
  }
  if (entry.expiresAt <= now) {
    store.delete(code);
    sweepExpired(now);
    return { ok: false, reason: "expired" };
  }
  store.delete(code);
  return {
    ok: true,
    participantId: entry.participantId,
    instanceId: entry.instanceId,
    neonUserId: entry.neonUserId,
  };
}

/**
 * Test hook. Clears the store. Only intended for use in unit tests.
 */
export function clearResetCodeStoreForTests() {
  store.clear();
}
