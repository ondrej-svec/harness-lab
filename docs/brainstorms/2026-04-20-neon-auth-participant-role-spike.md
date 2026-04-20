---
title: "spike: neon auth participant role + emails + cookie namespace"
type: brainstorm
date: 2026-04-20
status: complete · revised for real-email path
related_plan: docs/plans/2026-04-19-feat-participant-auth-hardening-and-identify-plan.md
---

## Revision note (2026-04-20, same day)

Original spike assumed we'd synthesize identifiers like `p-<id>@<instance>.harness.local` to avoid email infrastructure. Ondrej confirmed Neon Auth has a shared email provider (`auth@mail.myneon.app`) — emails work. Revised to use **real emails as the canonical identifier**, with Neon handling verification and password-reset emails.

Changes below are inline. Original TL;DR kept for history, revised decisions are the authoritative ones for Phase 5.2.


# Neon Auth participant-role spike

Phase 5.0 of the participant auth hardening plan. Four questions to resolve before writing any Phase 5 code.

## TL;DR

**All four questions resolve favorably.** Neon Auth (`@neondatabase/auth` 0.2.0-beta.1, built on top of `better-auth`) exposes everything Phase 5 needs, with two operator-level follow-ups for Ondrej to check on the Neon dashboard side.

| Question | Answer |
|---|---|
| Server-side user creation with `role = "participant"`? | **Yes**, via `auth.signUp.email()` + direct SQL `UPDATE neon_auth."user" SET role = 'participant'`. `admin.createUser` also exists as an alternative. |
| Non-email identifiers? | **Not at the SDK level** — only `signIn.email` / `signUp.email` are exposed. Decision: synthesize `<participant-slug>@<instance-slug>.harness.local` as the Neon identifier when no real email is provided. Never sent to, never displayed to the user. |
| Cookie namespace with two concurrent roles? | **Shared single cookie** (`__Secure-neon-auth.session_token`). One browser = one Neon session at a time. App-layer `role === "admin"` check is already strict, so the security boundary holds. Document the "one role per browser" rule. |
| Failed-signin rate limiting? | **Built-in via better-auth**. Neon Auth inherits the limits. Supplement with our own per-participant limiter on the first-factor (name pick) rather than the second-factor (password) if we want tighter control. |

## Detailed findings

### Source of truth

- Package: `@neondatabase/auth@0.2.0-beta.1`, see `dashboard/node_modules/@neondatabase/auth/dist/next/server/index.d.mts` (~537 lines).
- Neon Auth wraps `better-auth` (`better-auth-react-adapter` + `adapter-core` chunks). Our pnpm override pins `better-auth >= 1.6.2`.
- Existing integration pattern: `dashboard/lib/auth/server.ts` → `createNeonAuth({ baseUrl, cookies: { secret, sessionDataTtl } })` returns a singleton used from server actions, API routes, and middleware.
- Existing usage: `dashboard/app/admin/sign-in/page.tsx` uses `auth.signIn.email()`, `auth.getSession()`, `auth.requestPasswordReset()`.

### Q1 — Server-side user creation with `role = "participant"`

**Exposed API surface** (top-level keys on the `auth` client):

```
signIn.email              signUp.email              signOut
getSession                refreshToken              listAccounts
updateUser                deleteUser                changePassword
sendVerificationEmail     verifyEmail               resetPassword
requestPasswordReset      token                     jwks
admin.createUser          admin.setRole             admin.setUserPassword
admin.listUsers           admin.updateUser          admin.banUser / unbanUser
admin.listUserSessions    admin.revokeUserSession   admin.revokeUserSessions
admin.removeUser          admin.impersonateUser     admin.hasPermission
organization.*            emailOtp.*
```

**Two viable creation paths:**

1. **Self-signup path.** Participant submits name + password. Server action calls `auth.signUp.email({ email: syntheticIdentifier, password, name: displayName })`. This auto-creates a session (assuming the Neon Auth instance is configured without mandatory email verification — see "Open items" below). After signup, we run `UPDATE neon_auth."user" SET role = 'participant' WHERE id = $1` via `getNeonSql()`.

2. **Admin createUser path.** Harness backend calls `auth.admin.createUser({ email, password, role: "participant", name })`. Requires an admin session in the calling context — we'd need a service account, or we run this inside a facilitator request (which doesn't fit the first-time participant flow since the participant is the caller).

**Decision: Path 1 (self-signup + SQL role update).** Matches existing code conventions (direct SQL on `neon_auth."user"` is established in `facilitator-session.ts:46`). No service account infrastructure. One SQL write per first-time participant. Role update happens inside the same server action, transactional enough for workshop throughput.

### Q2 — Non-email identifiers

**Not natively.** The SDK only exposes `signIn.email` and `signUp.email`. `better-auth`'s `username` plugin exists but is not surfaced through Neon Auth's current API.

**Decision: synthetic identifier scheme.** For every participant row we create a Neon Auth user with:

```
email = `p-${participantShortId}@${instanceSlug}.harness.local`
name  = participant.displayName
```

Properties:
- Never deliverable → no accidental email sends. `.local` is an RFC-reserved TLD for non-routable names.
- Unique per participant per instance → isolates users across workshops.
- Stable → participant can re-sign-in without the facilitator reshuffling identifiers.
- When the participant has a real email in the roster, it's preserved in `participants.email` for display only — still never used as the Neon identifier. This keeps cross-instance user reuse explicitly out of scope.

`lib/participant-identifier.ts` (new file in Phase 5.2) encapsulates the synthesis.

### Q3 — Cookie namespace with two roles

**Single shared cookie.** `createNeonAuth` issues one `__Secure-neon-auth.session_token` per browser. Same browser cannot hold both a facilitator session and a participant session simultaneously.

**Practical implications:**
- Not a security issue — the app-layer `hasFacilitatorPlatformAccess(neonUserId)` check in `facilitator-session.ts:54` reads `role` from `neon_auth."user"` every request. A participant-role Neon session authenticating as a facilitator returns `false` immediately. The boundary is role-based, not cookie-based.
- UX edge case: a facilitator demoing from a participant seat must sign out of admin first. This is rare enough that we just document it. No per-role cookie namespace split needed.
- Sign-in / sign-up flows for participant and facilitator go to the same underlying Neon Auth service — only the UI and the synthetic identifier differ.

**Decision: single cookie, role-strict guards, documented "one role per browser" rule.** Keep `proxy.ts` as-is — participant routes still only check for the event-code session cookie, not the Neon Auth cookie. Neon Auth presence is checked only by server-side surfaces that care (set-password / authenticate / reset endpoints).

### Q4 — Failed-signin rate limiting

**Better-auth defaults apply.** Neon Auth inherits better-auth's built-in per-identifier rate limiter. Exact thresholds are configured server-side on the Neon Auth instance.

**Decision: layer our own limiter on the first factor, trust Neon's limiter on the second factor.**

The name-pick step (the suggest endpoint) already gets a 20/min per session rate limit in Phase 5. That's the attack surface for enumeration — a brute-forcer guessing names. The password step is bounded by better-auth's own throttling.

If better-auth's default is too loose, we wrap `auth.signIn.email` in `lib/participant-auth.ts` and layer our existing `redeem-attempt-repository` primitive. Decide empirically — don't stack defenses preemptively.

## Implementation shape for Phase 5.2

```ts
// lib/participant-identifier.ts
export function synthesizeNeonIdentifier(opts: {
  participantShortId: string;  // stable per participant
  instanceSlug: string;
}): string {
  return `p-${opts.participantShortId}@${opts.instanceSlug}.harness.local`;
}

// lib/participant-auth.ts
export async function createParticipantPassword(opts: {
  neonIdentifier: string;
  password: string;
  displayName: string;
}): Promise<{ neonUserId: string }>

export async function authenticateParticipant(opts: {
  neonIdentifier: string;
  password: string;
}): Promise<{ ok: true; neonUserId: string } | { ok: false; reason: "wrong_credentials" | "rate_limited" }>

export async function resetParticipantPassword(opts: {
  neonUserId: string;
  newPassword: string;
}): Promise<void>  // admin.setUserPassword + revokeUserSessions

export async function setParticipantRole(neonUserId: string): Promise<void>
// UPDATE neon_auth."user" SET role = 'participant' WHERE id = $1
// Run inside the same server action as createParticipantPassword.
```

Facilitator-initiated password reset (plan §5.5) becomes:

```ts
// 1. Facilitator clicks "reset password" → app generates a 3-word one-time code
//    (same wordlist as event codes), stores HMAC in participant_password_reset_tokens,
//    returns plaintext once for the facilitator to read aloud.
// 2. Participant redeems: enters code + new password on the identify prompt's
//    "forgot?" sub-view.
// 3. Server validates the code, then calls resetParticipantPassword(neonUserId, newPassword)
//    — which calls auth.admin.setUserPassword(...) + auth.admin.revokeUserSessions(...).
// 4. Auto-signs the participant in with the new password.
```

The admin API calls in step 3 require an admin session or service token. We use a **system admin Neon user** whose credentials sit in env vars (`HARNESS_NEON_ADMIN_EMAIL`, `HARNESS_NEON_ADMIN_PASSWORD`) — the app signs in as this user, does the admin call, signs out. This is fragile (session overhead per call) but avoids standing up a separate service-token infrastructure.

**Alternative:** check whether Neon Auth exposes a service-token / server-to-server admin API in 0.2.0-beta.1 release notes. Added to "Open items" below.

## Open items (require Ondrej's Neon dashboard access)

1. **Email verification toggle.** Confirm the Neon Auth instance at `NEON_AUTH_BASE_URL` has email verification *disabled* for signup, OR decide we'll use `admin.createUser` exclusively (requires service-admin infrastructure). If verification is mandatory and we use `signUp.email`, synthetic identifiers land users in a "pending verification" state and they can't sign in.

2. **Service admin pattern.** Confirm whether Neon Auth 0.2.0-beta exposes a non-session service token for admin operations. If yes, use it. If no, create a dedicated `HARNESS_NEON_ADMIN_EMAIL` user and document the pattern in `docs/private-workshop-instance-env-matrix.md`.

3. **Rate-limit defaults.** Check better-auth's default failed-signin limits in the version Neon Auth pins. If the defaults are less strict than 5 per 10 minutes per identifier, layer our own limiter.

4. **Role column constraint.** Confirm `neon_auth."user".role` has no CHECK constraint that restricts values to the current set (`user`, `admin`). If it does, extend it to include `participant`. If it's open text, we just write.

5. **`admin.*` authorization source.** Confirm whether `admin.*` calls check the caller's role via the session cookie or accept a bearer token. Affects the service-admin pattern above.

## Decisions (to be copied into Phase 7 ADR)

- Synthetic-identifier scheme: `p-<participantShortId>@<instanceSlug>.harness.local`.
- Creation path: `signUp.email` + SQL `UPDATE neon_auth."user" SET role = 'participant'`, run atomically in the set-password server action.
- One Neon session per browser — documented limitation, no cookie-split workaround.
- Admin operations (password reset, session revoke) use a `HARNESS_NEON_ADMIN_*` service account pattern *unless* Open Item #2 surfaces a service-token option.
- `participant.neon_user_id` stores the authoritative link; Neon Auth remains a dumb identity store from the app's perspective.

## Next step

Unblock Phase 5.1 (preview v2 approval) and Phase 5.2 (schema + `lib/participant-auth.ts`). Open items 1 & 2 need Ondrej's Neon dashboard access before 5.2 can ship; they don't block 5.2's schema/migration/test work, only the wiring to Neon.

---

## Round 2 · Revised direction (2026-04-20)

After confirming Neon Auth's shared email provider is available, the spike's decisions shift:

### Findings from round-2 research

- **Email verification is a dashboard-only toggle** (Neon Console → Auth → Configuration). Not settable per-signup from code. When ON, `signUp.email` creates a row with `emailVerified: false` and blocks `signIn.email` until the link is clicked. When OFF, the row is created and immediately usable.
- **`admin.createUser` is the only admin method that works without a pre-existing admin session.** `admin.setRole`, `admin.setUserPassword`, `admin.revokeUserSessions`, etc., all require the caller's cookie session to have `role === "admin"`. There is no service-token mode in better-auth 1.6.x or Neon Auth 0.2.0-beta.
- **Better-auth's default rate limit on `signIn.email` is 3 requests per 10 seconds per IP.** Tight for a workshop room where multiple participants share an IP. Configurable via Neon dashboard rate-limit settings.
- **`neon_auth."user".role` schema**: cannot verify from code whether there's a CHECK constraint. Run a SQL probe against the live Neon DB before Phase 5.2 ships (below).

### Revised decisions (supersede the originals in "Decisions" section)

- **Canonical identifier is `participants.email`**, not a synthetic value. Every participant row that will authenticate needs an email at the point of first password-set.
  - Roster entries pasted *with* email: email is pre-populated in the first-time card.
  - Roster entries pasted *without* email: the first-time card has both "your email" and "set your password" fields.
  - Walk-ins: same as name-only roster entries — email is collected at first-identify.
- **User creation: `auth.admin.createUser({ email, password, role: "participant", name })`.** This is the only admin call that works without an existing admin session, and it creates the user with `emailVerified: false` but **signable-in immediately** (bypasses verification). Link `participant.neon_user_id` in the same server action.
- **Session acquisition after creation: follow createUser with `auth.signIn.email({ email, password })`** to issue the Neon Auth cookie. One extra round-trip but it stays inside the same server action.
- **Role set during creation** via the `role` argument — no post-hoc SQL update needed (admin.createUser honors the role argument and stores it).
- **Password reset: offer both paths.** The in-room one-time code stays (fastest for workshop-day recovery, no email dependency). In addition, `auth.requestPasswordReset({ email, redirectTo })` becomes available for participants who miss the room — facilitator can choose per-participant which to issue. Add this as a fast-follow, not a Phase 5 blocker.
- **Email verification: leave it OFF at the Neon Console** for now. Workshop-day friction ("click the link in your email") is not what we want. If we later want verified emails for stronger participant identity, flip the toggle — the code path already works either way (verified or not, `signIn.email` succeeds as long as the password matches).
- **Rate limit: raise the Neon dashboard setting** to 10 attempts per 60 seconds per IP, and stack our own per-identifier limiter on top via the existing `redeem-attempt-repository` primitive. Workshop rooms share IPs; per-IP is the wrong shape alone.

### Implementation shape for Phase 5.2 (revised)

```ts
// lib/participant-auth.ts

import { auth } from "./auth/server";

export async function createParticipantAccount(opts: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ ok: true; neonUserId: string } | { ok: false; reason: "email_taken" | "weak_password" | "invalid_email" }> {
  const result = await auth.admin.createUser({
    email: opts.email,
    password: opts.password,
    name: opts.displayName,
    role: "participant",
  });
  // ... normalize errors, return neonUserId
}

export async function authenticateParticipant(opts: {
  email: string;
  password: string;
}): Promise<{ ok: true; neonUserId: string } | { ok: false; reason: "wrong_credentials" | "rate_limited" }> {
  const { error } = await auth.signIn.email({ email: opts.email, password: opts.password });
  // ... normalize errors, return neonUserId from getSession()
}

export async function resetParticipantPasswordByEmail(email: string, redirectTo: string): Promise<void> {
  // Async · Neon sends the email. Facilitator has done their part by clicking "reset".
  await auth.requestPasswordReset({ email, redirectTo });
}

export async function resetParticipantPasswordInRoom(opts: {
  neonUserId: string;
  newPassword: string;
}): Promise<void> {
  // Requires a system-admin session — see "Open item: admin session" below.
  await auth.admin.setUserPassword({ userId: opts.neonUserId, newPassword: opts.newPassword });
  await auth.admin.revokeUserSessions({ userId: opts.neonUserId });
}
```

### Open item: admin session for in-room reset

`admin.createUser` works without a session — signed-out server calls succeed. `admin.setUserPassword` does NOT — it requires the caller to already have `role === "admin"`.

Two paths for the in-room reset (participant enters one-time code + new password):

1. **Server-side admin signin.** App signs in as a system admin user (credentials from `HARNESS_NEON_ADMIN_EMAIL` / `HARNESS_NEON_ADMIN_PASSWORD` env vars), calls `admin.setUserPassword`, signs out. One extra session round-trip per reset. Adds env configuration burden.
2. **Lean on email reset instead.** The facilitator clicks "reset by email", Neon sends the link, participant clicks and sets a new password. No in-room reset flow at all. Simpler but slower — participant has to switch to their inbox.

**Decision: both.** The in-room reset uses path 1 (signature `HARNESS_NEON_ADMIN_*` documented in `.env.example`, required only for Neon mode). Email reset (path 2) is available as the facilitator's alternative. Two buttons in the People section row: "reset in room" and "reset via email".

### Test coverage (new items for Phase 5.6)

- Integration test: `createParticipantAccount → authenticateParticipant` round-trip creates a Neon user with `role = "participant"` and immediately authenticates.
- Integration test: email verification OFF path — user can signIn before verifying.
- Integration test: email verification ON path — signIn blocked until verification; verifies the code still handles the "pending" state without throwing.
- Integration test: `resetParticipantPasswordInRoom` requires the system admin env vars.
- Integration test: participant-role Neon user cannot reach `hasFacilitatorPlatformAccess` via any path.
- Unit test: rate-limit wrapper layers over better-auth's per-IP.

All integration tests gated on `HARNESS_TEST_DATABASE_URL` being set (existing pattern from `lib/neon-auth.integration.test.ts`).

### Updated open items for Ondrej

1. **Email verification toggle.** Confirm it's OFF on the Neon Auth instance. If ON, flip it — otherwise participants can't sign in immediately after setup.
2. **Role CHECK constraint.** Run `SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'neon_auth.user'::regclass;` against the live DB (or your preferred DB tool). If the `role` column has a CHECK constraint that excludes `'participant'`, we extend it in Phase 5.2's migration. I can generate the exact migration once I know the constraint shape.
3. **System admin Neon user.** Decide: do we want a dedicated `HARNESS_NEON_ADMIN_*` service user for in-room password resets, or skip the in-room reset and rely on email reset only? If service user, Ondrej creates one in the Neon Console and drops credentials into env vars.
4. **Rate-limit dashboard setting.** Raise `signIn.email` from default 3/10s to 10/60s (or similar), since workshop rooms share IPs.

### Revised decisions copy for Phase 7 ADR

- Participants authenticate with real emails via Neon Auth (not synthetic).
- Role is set via `admin.createUser({ role: "participant" })`, not post-hoc SQL.
- Email verification stays OFF for workshop-day friction; re-evaluate for v2.
- Password reset: in-room code (path 1) and email link (path 2) both supported.
- Admin session needed for in-room reset — provided by a `HARNESS_NEON_ADMIN_*` service user.
