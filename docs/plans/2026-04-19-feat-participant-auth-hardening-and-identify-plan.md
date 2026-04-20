---
title: "feat: participant auth hardening and identify flow revamp"
type: plan
date: 2026-04-19
status: in_progress
brainstorm: docs/brainstorms/2026-04-16-harness-lab-product-shape-and-participant-management-brainstorm.md
confidence: medium
---

# Participant auth hardening and identify flow revamp

**One-line summary:** close the submit-review security gaps (rate-limit bypass, cookie secure flag, unsalted code hash), fix the language-switcher link that drops participants onto the public page, and reshape the identify flow so pre-entered participants don't have to retype their own identity — email-first when the roster has emails, name-with-autocomplete otherwise, walk-in path unchanged.

## Session handoff (2026-04-20 · v2 · scope expanded)

**What changed between v1 and v2:** Phase 5 used to be "name-autocomplete OR email-first, dispatched from roster contents, walk-in fallback always open." After reviewing the v1 preview, Ondrej reshaped it:

- **Name-first is now the default for everyone.** Single name match on the roster → authenticate. Multiple matches → disambiguate by `tag` first, masked email only when tag isn't enough. Email is never the primary identifier.
- **Participants get real credentials via Neon Auth.** `role = "participant"` on `neon_auth."user"`. Replaces the session-cookie-only binding with a password participants set on first identify. Solves re-login after cookie clear without adding email infrastructure.
- **Event code stays.** Room key first, personal password second. Re-login needs both.
- **Walk-in policy becomes a facilitator toggle.** `allow_walk_ins: true` preserves today's "type a new name, get added" behavior. `allow_walk_ins: false` rejects unknown names with "ask your facilitator to add you."
- **Facilitator can reset participant passwords in-app** via a one-time code (no email flow).

The phases 1–4 security work in v1 is unaffected — event code hashing, guard centralization, and cookie hardening all still hold, they're independent of the auth identity model.

**Status when this session paused:** Phases 1, 2, 3, 4 shipped to main (`17a17dd`, `cf0a414`, `f4f8f67`, `1e1f865`). Phase 5 replanned to the v2 shape above; preview artifact + code still pending. Phases 6, 7 still pending.

---

## Session handoff (2026-04-20 · v1 · superseded)

**Status when this session paused:** Phase 1 shipped. Phase 3 partially covered by a parallel-session commit (`976ab6b fix: harden dashboard auth boundaries`). Phases 2, 4, 5, 6, 7 still pending.

**What landed during this session:**
- Phase 1 (lang switcher) — this plan's own commit — see below.
- Parallel commits that overlap this plan's scope:
  - `e298ab9` — landing copy tightening (unrelated to auth, noted).
  - `ec8b1b2` — agenda surface split proof slice (unrelated to auth, noted).
  - `976ab6b` — auth boundaries hardening. Added `getParticipantSessionCookieOptions` helper, `lib/participant-team-access.ts`, `facilitator-auth-service.neon.test.ts`, participant-team access guard on check-in route, and `docs/plans/2026-04-19-fix-dashboard-owasp-security-remediation-plan.md`. Does NOT replace this plan — its focus was facilitator/team boundaries + cookie helper, not rate-limit centralization or HMAC.

**Known red tests in the repo at pause time** (NOT caused by this plan's work):
- 6 Playwright failures from the parallel agent's work that need its own follow-up:
  - `dashboard.spec.ts:82, 431, 448` — visual snapshots need regeneration after their copy changes.
  - `dashboard.spec.ts:141` — "Checkpoint saved." test fails because the new team-access guard blocks the walk-in Test Participant; the test needs to assign the participant to a team first, or the guard needs a walk-in accommodation.
  - `dashboard.spec.ts:560` — presenter scene, likely snapshot-adjacent.
  - `participant-signal-flow.spec.ts:10` — parallel agent's new test, failing for their reasons.
- Unit suite: 374 / 374 green.
- This plan's own new `participant-lang-switch.spec.ts`: green.

**Next-session pickup:**
1. Start with Phase 3's remaining item — `app/page.tsx:32-37` still uses inline cookie options without `secure`. One-line swap to `getParticipantSessionCookieOptions`. Lowest-risk next step.
2. Then Phase 2 — centralize rate-limit / origin / bot guards inside `redeemEventCode`. Biggest single security gain.
3. Phase 4 (HMAC) is independent — can go before or after Phase 2.
4. Phase 5 (identify revamp) still blocked on a preview artifact per the Subjective Contract — Ondrej reviews before any code.
5. Cross-reference `docs/plans/2026-04-19-fix-dashboard-owasp-security-remediation-plan.md` before starting — may have already extended to scope this plan needs.

---

## Problem Statement

Today's participant auth surface has three unrelated problems hiding in plain sight:

1. **Language switcher throws participants back to the public page.** The `SiteHeader` defaults `csHref`/`enHref` to `/`; `app/participant/page.tsx:63,92` doesn't override them. Clicking `cs` or `en` from the participant surface navigates to the public landing even though the session cookie is still valid. Fresh participants re-enter the event code, believing their login expired. Confirmed via Chrome session: cookie survives, only the link target is wrong.

2. **Abuse protections live on one path, not the other.** `/api/event-access/redeem/route.ts` wraps `redeemEventCode` with `isTrustedOrigin`, `checkBotId`, and `isRedeemRateLimited` (5 failures per 10 min per client fingerprint). The `redeemEventCodeAction` server action in `app/page.tsx:21-40` calls the same underlying function with **none** of those guards. Attackers can POST the Next.js server-action endpoint at full rate with zero throttling. Event codes are three-word strings — brute-forceable under the 10 hours a code is typically live.

3. **The identify flow treats every participant as a walk-in.** Q5 in the 2026-04-16 participant-management brainstorm resolved that sessions stay anonymous and participants self-identify after redeem. That's right for walk-ins. But when the facilitator has **already pre-entered a roster** — the current paste intake supports display name + optional email + optional tag — asking each pre-entered participant to retype their name is redundant and error-prone (two "Jan"s get silently merged with no disambiguation). The current flow offers no private way to match a returning human to their pre-entered record.

Three smaller issues compound:

4. **Cookies are missing `secure: true`.** Both session-cookie setters in `app/page.tsx` and `app/participant/page.tsx` use `httpOnly: true, sameSite: "lax"` but no `secure` flag. In production on HTTPS, an HTTP variant of the domain (or a mixed-content downgrade) leaks the session cookie.

5. **Event codes are stored as plain SHA-256 hashes.** `lib/participant-event-access-repository.ts:31-33` uses `createHash("sha256")`. If the access repo ever leaks, an attacker can rainbow-table back to the plaintext three-word codes because the keyspace is small.

6. **`bindParticipantToSession` returns `already_bound` but the UI swallows it.** `participant-identify-prompt.tsx`'s server action only branches on `invalid_display_name`. `already_bound` quietly falls into the success path, so a session-hijack attempt is invisible to the real owner.

All six matter for the same reason: the participant surface is the one trust boundary the workshop absolutely has to get right, and its flaws are currently distributed across "link bug," "forgotten guard," "rushed crypto," and "identity friction."

## Target End State

When this lands:

1. **The lang switcher works.** Clicking `cs` or `en` on `/participant` or its facilitator mirror keeps you on the participant surface at the new language. Session cookie unchanged. No re-login.
2. **Both redeem paths carry the same guards.** `isTrustedOrigin`, `checkBotId`, and `isRedeemRateLimited` protect *every* code submission, whether via server action or API route. Rate-limiter is authoritative: 5 failures per client fingerprint per 10 minutes regardless of entry point.
3. **Cookies are `secure` in production.** Both the participant session cookie and the language cookie set `secure: true` when running under HTTPS; dev over HTTP still works.
4. **Event codes are HMAC-hashed.** New codes are hashed with `hmac("sha256", HARNESS_EVENT_CODE_SECRET, code)`. Existing SHA-256 hashes are migrated at read-time with a dual-hash window — no forced re-seed.
5. **Pre-entered participants don't retype themselves.** Name-first everywhere. The participant types their name, the server suggests up to 5 roster matches (min 2 chars, no email/tag shipped unless needed), and the participant picks one. The roster is never shipped to the client as a whole.
6. **Name collisions resolve privately.** When two or more roster entries share the typed name, the listbox adds a soft disambiguator per option — `tag` first (team or role), masked email only if tag isn't enough (`j***@acme.com`). No full emails, no preview of attendees outside the current query.
7. **Participants have real credentials via Neon Auth.** Picking a roster identity for the first time prompts "set your password" (Neon Auth `role = "participant"`). Returning participants authenticate with their password — event code still required as the room key. Facilitator-initiated password reset uses a one-time code read aloud in the room (no email infrastructure).
8. **Walk-ins are a facilitator choice, not a system default.** `workshop_instance.allow_walk_ins` toggle. When on, unknown names can "add yourself" and set a password. When off, unknown names are refused politely ("ask your facilitator to add you"); only facilitator-pasted roster members can self-select.
9. **The privilege boundary is strict.** Participant Neon users cannot reach any facilitator surface. Every facilitator-side guard checks `role === "admin"` via `hasFacilitatorPlatformAccess`, never "has Neon session."
10. **Session collision is surfaced.** When `bindParticipantToSession` returns `already_bound`, the UI shows an explicit error ("this session is already identified as [name]") instead of silently redirecting to the hub.
11. **Audit log captures the new paths.** Roster pick, password set, password auth, password reset, walk-in creation, walk-in refusal, `already_bound` rejection — each appends an audit row.
12. **Existing tests green, new regression tests for each change.** Including the participant ↔ facilitator privilege boundary as an explicit OWASP regression suite, plus e2e coverage of the lang-switch fix.

## Scope and Non-Goals

**In scope:**
- Link-target fix on `SiteHeader` participant usage (and `/admin/instances/[id]/participant/page.tsx` mirror). ✅ shipped
- Moving rate-limit / origin / bot guards inside `redeemEventCode()` so both paths share them. ✅ shipped
- `secure` flag on session + language cookies in production. ✅ shipped
- HMAC upgrade for event code hashing, with a dual-hash read-time migration. ✅ shipped
- Name-first identify prompt with `tag` / masked-email disambiguation when roster names collide.
- Roster suggest endpoint with rate-limit + min-chars + result-cap, returning only `{ id, displayName, disambiguator? }`.
- Participant credentials via Neon Auth (`role = "participant"`): password set on first identify, password prompt on re-login.
- Facilitator-initiated password reset via a one-time in-app code (no email).
- `workshop_instance.allow_walk_ins` toggle + facilitator UI control.
- Walk-in flow (when enabled): "add yourself as new" → set password.
- Walk-in refusal flow (when disabled): "ask your facilitator to add you" — no create affordance.
- Surfacing `already_bound` to the user as an explicit error state.
- OWASP regression suite for the participant ↔ facilitator privilege boundary.
- Test coverage: unit, Playwright e2e regression for the lang bug + full identify-and-re-login round-trip.

**Not in scope:**
- Email delivery infrastructure — password reset is in-room via one-time code, not email.
- SSO / OAuth per participant — rejected; event code + personal password is the doctrine.
- MFA for participants — password + event code is already a two-factor story (know the room, know yourself).
- CSRF tokens beyond Next's built-in server-action protocol.
- Rewriting `parseParticipantPaste`'s format (already accepts `displayName, email, tag`).
- Email opt-in / follow-up delivery infrastructure.
- Cross-instance participant identity (same person joining two workshops reuses a single Neon user) — out of scope for this plan, tracked as followup if needed.
- Event code rotation / TTL policy — handled elsewhere.
- Neon user merge/move between instances — followup if we see real demand.

## Proposed Solution

Five phases, dependency-ordered.

### Phase 1 — Lang switcher fix (the reported bug)

Two lines in `app/participant/page.tsx` at both `SiteHeader` call sites:

```tsx
<SiteHeader
  isParticipant
  lang={lang}
  copy={copy}
  csHref={withLang("/participant", "cs")}
  enHref={withLang("/participant", "en")}
/>
```

Same fix on `app/admin/instances/[id]/participant/page.tsx`. Make `csHref`/`enHref` required (not defaulted to `/`) when `isParticipant` is true, so this can't be re-introduced. Add a Playwright test that redeems, clicks `cs` on the participant surface, and asserts the URL stays at `/participant?lang=cs` and the session cookie is unchanged.

### Phase 2 — Rate-limit + origin + bot guards on server action

Refactor `redeemEventCode()` in `lib/event-access.ts` to accept a `Request` (or a caller-supplied fingerprint + origin tuple) and run the three guards inside the function before the DB lookup. Both the server action and the API route then pass their request through. The guards move from being called at the route boundary to being called at the function boundary — one source of truth.

Alternative approach considered: keep `redeemEventCode()` pure and require every caller to add the guards. Rejected because "every caller" is too easy to forget and the proof is already in our bug ledger.

Audit: after landing, grep `redeemEventCode` and confirm every caller passes request context.

### Phase 3 — Cookie `secure` flag

Add a small helper `sessionCookieOptions({ expires })` in `lib/event-access.ts` that returns the full options object with `secure` conditionally set based on `process.env.NODE_ENV === "production"` (or, better, the `x-forwarded-proto` header when available — Vercel forwards it). Apply to:

- `app/page.tsx:32` (redeem)
- `app/participant/page.tsx:32` (logout — empties the cookie)
- The API route at `app/api/event-access/redeem/route.ts:80`
- Also update `proxy.ts:82` for the language cookie (httpOnly stays false, secure still useful).

Preserve `httpOnly: true, sameSite: "lax", path: "/"`.

### Phase 4 — HMAC event codes with dual-hash migration

1. Add a new exported function `hashEventCode(code: string)` in `lib/participant-event-access-repository.ts` that uses `createHmac("sha256", key).update(code).digest("hex")` where `key = process.env.HARNESS_EVENT_CODE_SECRET`. In dev, fall back to a stable dev key with a console warning.
2. Keep `hashSecret` (plain SHA-256) for session tokens — tokens are already 128-bit CSPRNG UUIDs, rainbow tables don't help.
3. In `redeemEventCode()`, compute both the HMAC and SHA-256 hashes of the submitted code. On match, if the stored hash is SHA-256, upgrade the stored row to HMAC.
4. Event code seeding / issuance writes HMAC hashes only.
5. Migration surface:
   - File mode: seeded on first run from `HARNESS_EVENT_CODE` env var. On first redeem after upgrade, the row's `codeHash` is rewritten with HMAC. No facilitator action needed.
   - Neon mode: per-instance access rows get upgraded on first successful redeem. Old rows that never see a successful redeem stay SHA-256 until they expire — that's acceptable; they're already time-limited.
6. Document the new env var in `.env.example` and require it for production deployment. A deploy-time guard in `lib/runtime-auth-configuration.ts` asserts the key exists and has sufficient entropy (≥32 bytes, base64 or hex).

### Phase 5 — Name-first identify + Neon Auth participants + walk-in policy

The v1 "dispatch by roster contents" sketch is superseded. The v2 flow is one prompt for everyone, with ambiguity resolved only when the roster actually forces it, and real credentials once the participant picks an identity.

#### 5.1 The single identify prompt

`app/components/participant-identify-prompt.tsx` becomes a name-first `combobox`:

1. Participant types their name. After 2+ characters, the client calls `GET /api/event-access/identify/suggest?q=<prefix>` with the session cookie. The endpoint is rate-limited to 20/min per session, returns up to 5 matches.
2. Each suggestion is `{ id, displayName, disambiguator?, hasPassword }`:
   - `disambiguator` is present only when ≥2 roster entries share the typed name. Value is `tag` when any matching entry has one (e.g. "team bravo"); otherwise masked email (`j***@acme.com`). Never both. Never raw email.
   - `hasPassword` tells the client whether to render "set your password" or "enter your password" once the participant picks.
3. Picking a suggestion calls a server action that either binds the session directly (if `hasPassword === false`, proceeds to set-password sub-view) or prompts for the password (if `hasPassword === true`).

#### 5.2 Password set / authenticate

First-time identify on a roster row:

- Sub-view asks "set your password" with a single password field (min 8 chars, no other constraints — workshop doctrine is pragmatic, not bank-grade).
- Server action creates a Neon Auth user with `role = "participant"` and links `participant.neon_user_id` to the new user id. Uses Neon Auth's hashing + rate-limit primitives directly; we never touch raw password bytes beyond the submit.
- Binds the event-code session to the participant id. Emits `participant_password_created`.

Returning identify:

- Sub-view asks "enter your password".
- Server action authenticates via Neon Auth (`auth.signIn({ identifier, password })`). On success, bind the event-code session to the participant id and emit `participant_password_auth_success`. On failure, emit `participant_password_auth_failure` and return a generic "that didn't match" message. Neon Auth's own rate limiter throttles brute force.

The participant's Neon Auth cookie lives alongside the event-code session cookie. Both are required to reach `/participant`; if either is missing, the flow restarts at its correct step (event code first, identify second).

#### 5.3 Walk-in policy

New field: `workshop_instance.allow_walk_ins` (boolean, default `true` to preserve today's behavior).

Facilitator toggle lives in the access panel on `/admin/instances/[id]`.

When `allow_walk_ins === true`:
- The suggest listbox includes a trailing "＋ add 'Jan' as a new participant" option when the typed name doesn't match the roster.
- Choosing it creates a new `participant` row (existing `findOrCreateParticipant` path), then proceeds to the set-password sub-view.

When `allow_walk_ins === false`:
- The trailing "add as new" option is absent.
- If the participant types a name that has no roster match and submits, the prompt renders a polite refusal: "we don't have you on the roster — ask your facilitator to add you." No other navigation.
- Emits `participant_identify_walk_in_refused`.

#### 5.4 Name collision disambiguation

The suggest endpoint computes disambiguation server-side:

```ts
function computeDisambiguator(matches: ParticipantRecord[]): Record<ParticipantId, Disambiguator | null> {
  const byNormalizedName = groupBy(matches, (p) => p.displayName.toLocaleLowerCase());
  const result: Record<string, Disambiguator | null> = {};
  for (const group of Object.values(byNormalizedName)) {
    if (group.length < 2) {
      for (const p of group) result[p.id] = null;
      continue;
    }
    for (const p of group) {
      if (p.tag) result[p.id] = { kind: "tag", value: p.tag };
      else if (p.email) result[p.id] = { kind: "masked_email", value: maskEmail(p.email) };
      else result[p.id] = { kind: "order", value: `#${p.id.slice(-4)}` };
    }
  }
  return result;
}
```

Client renders the `disambiguator.value` as a small secondary line beneath the name when present. The raw email never leaves the server.

#### 5.5 Facilitator password reset (in-app)

New facilitator action on the People section:

- "reset password" on a participant row generates a 3-word one-time code (reuses the event-code word list for familiarity), stores only its HMAC hash in `participant_password_reset_tokens`, expires in 15 minutes.
- Facilitator reads the code aloud to the participant.
- Participant redeems: on the identify prompt, after picking their name, a tiny "forgot?" link surfaces a "enter one-time code" flow. Submitting a valid code dispatches straight into the set-password sub-view.
- Redeemed codes are invalidated immediately. Rate-limit: 5 attempts per 10 minutes per session fingerprint, same primitive as event-code redeem.

#### 5.6 Privilege boundary audit

The existing `hasFacilitatorPlatformAccess(neonUserId)` already checks `role === "admin"`. Before Phase 5 ships, every facilitator route / server action is audited to confirm it calls `hasFacilitatorPlatformAccess` (not just `getAuthenticatedFacilitator`). A new `lib/privilege-boundary.test.ts` asserts that a participant-role Neon session cannot read or mutate any facilitator endpoint.

#### 5.7 Backend surface summary

- `lib/event-access.ts` gains `bindParticipantAfterAuth(session, tokenHash, participantId)` — called after Neon Auth succeeds.
- `lib/participant-auth.ts` (new) — thin wrapper around Neon Auth for participant role: `createParticipantPassword`, `authenticateParticipant`, `issueParticipantResetToken`, `consumeParticipantResetToken`.
- `lib/participant-repository.ts` gains `listByDisplayNamePrefix(instanceId, prefix, limit)` and updates the schema to include `neon_user_id: string | null`.
- `app/api/event-access/identify/suggest/route.ts` — new endpoint, rate-limited, returns `{ id, displayName, disambiguator, hasPassword }`.
- `app/api/event-access/identify/set-password/route.ts` — new endpoint for first-time password.
- `app/api/event-access/identify/authenticate/route.ts` — new endpoint for returning password.
- `app/api/event-access/identify/reset-token/redeem/route.ts` — new endpoint for the one-time reset code.
- `app/api/admin/participants/[id]/reset-password/route.ts` — facilitator-only, issues the one-time code.
- `app/admin/instances/[id]/access/toggle-walk-ins/` — facilitator server action for the walk-in toggle.
- Audit log additions: `participant_identify_by_roster_pick`, `participant_password_created`, `participant_password_auth_success`, `participant_password_auth_failure`, `participant_password_reset_issued`, `participant_password_reset_redeemed`, `participant_identify_walk_in_created`, `participant_identify_walk_in_refused`.

### Phase 6 — Surface `already_bound`

`submitIdentifyAction` in `app/components/participant-identify-prompt.tsx` already branches on `invalid_display_name`. Add a branch for `already_bound` that redirects back with `?identify=already_bound`, and render an explicit error state on the prompt ("This session is already identified as someone else. If that's not you, use Log out in the room header and start over.") — preserves the defensive behavior, makes it visible. Applies to all three prompts (email, name-autocomplete, walk-in).

### Phase 7 — Tests and docs

- Playwright e2e: lang switch preserves session + path.
- Unit tests: rate-limit guard inside `redeemEventCode` (both paths hit it), HMAC upgrade migration, suggest endpoint rate-limit and scoping, `already_bound` surfacing.
- `docs/adr/`: one new ADR for "roster-aware identify flow" that records the B+C decision and explicitly rejects A/D/E with reasons. Cross-reference in the 2026-04-16 brainstorm as the Q5 extension.
- Update `docs/private-workshop-instance-data-classification.md` if email handling boundary changes require it.

## Decision Rationale

### Why name-first over email-first or dispatch-by-roster

The v1 plan dispatched on roster contents (email-first when emails existed, name-autocomplete otherwise). That's two prompts to build, two trust stories, and it forces participants to remember *which shape* applies to their workshop. Name-first-with-disambiguation is one prompt. Single match is the common case and becomes "type, pick, password" — three user actions, no conditional UI.

Rejected alternatives:

- **Email-first**: some rosters are names only. Email as primary identifier forces the facilitator to chase emails at roster paste time, which is the friction we were trying to remove.
- **Full roster list**: exposes the attendee list to anyone with the event code. Unacceptable for any workshop with external attendees.
- **Silent name match**: binding to the only-matching-Jan is a data-integrity bug the moment two Jans exist.
- **Name-first + disambiguate by email always**: leaks email domains when tag would have been enough. Tag-first keeps workplace privacy intact for the common case.

### Why Neon Auth for participants instead of passwordless revival

The v1 plan accepted that re-login (cleared cookies, new device, closed tab) meant re-walking-in as a fresh identity, and guarded data integrity with the `already_bound` surface only. That didn't match Ondrej's actual mental model — if a participant's identity matters enough to pre-load the roster, it matters enough to survive a browser close.

Alternatives considered:

- **One-time revival code shown on first identify**: one secret the participant has to remember. If lost, re-walk-in. Light, but doesn't let the facilitator recover someone who forgot it.
- **Facilitator-approved claim per session**: needs facilitator attention every time the participant loses their cookie. Bad UX the second time.
- **Per-person invite codes emailed in advance**: requires email infra we don't have and doesn't exist yet.
- **Real user accounts via Neon Auth** (chosen): the infrastructure is already there for facilitators. Adding `role = "participant"` reuses the password hashing, session management, and brute-force protection Neon Auth already provides. The privilege boundary is already schema-level (`hasFacilitatorPlatformAccess` checks `role === "admin"`), so the blast radius of mixing participant and facilitator identities in the same auth store is bounded by an audit of facilitator-side guards — not a new security primitive.

The honest name for this is "real user management." It's 4–6 days of work, not weeks, because we're not building password hashing or session management — we're wiring Neon Auth into a second role.

### Why the facilitator controls the walk-in toggle

Some workshops are invite-only (corporate training, external-attendee retros) and should refuse unknown names. Others are open (meetups, hackathons with on-the-door signups) and shouldn't require roster pre-entry. A per-instance toggle matches both realities without forcing a global policy. Default `true` preserves today's behavior for anyone who upgrades.

### Why a one-time reset code instead of email reset

Email reset requires email infrastructure we don't have and don't want yet. The facilitator is physically in the room, has the participant's attention, and can say "your reset code is lantern-relay-north" in fifteen seconds. Same word list as event codes (the participants already trust this vocabulary). Expires in 15 minutes, HMAC-hashed in storage, rate-limited on redeem. Matches the workshop's actual trust model.

### Why move guards into `redeemEventCode` instead of adding to the server action

Centralizing at the function boundary means:
- Future callers (CLI? mobile? integration tests?) get protection by default.
- The code path in `app/page.tsx` stays a thin server action, which is what React 19 wants.
- The audit trail records every attempt uniformly.

The trade-off is a slightly heavier function signature — it needs request context. Worth it.

### Why dual-hash migration instead of forcing rehash

Forcing facilitators to rotate every active event code on deploy is hostile to live workshops mid-day. Dual-hash reads only on the first successful redeem, then write-upgrades transparently. Old unused codes never get upgraded and expire naturally. Zero operator surface.

### Why `secure` depends on `NODE_ENV`, not always-on

Dev server runs over HTTP (localhost). `secure: true` would break dev login completely. Production uses HTTPS via Vercel / proxy; `secure: true` is correct there. Gating on `process.env.NODE_ENV === "production"` is the standard Next.js idiom for this.

### Why separate Phases 1 and 5

Phase 1 (lang fix) ships in minutes and closes the user-visible bug that triggered this plan. Phases 2–4 are security hardening with testable surface but no visible UX. Phase 5 is the big UX change that needs design review. Keeping them separate means the fix ships today and the revamp ships when it's ready — they don't block each other.

## Constraints and Boundaries

- **Preserves Q5 doctrine.** Sessions stay anonymous, self-identify stays soft. We're refining the self-identify step when a roster exists, not replacing anonymous sessions.
- **No new libraries.** Node `crypto.createHmac`, existing fetch, React 19 `useFormStatus`, no new deps.
- **No user enumeration.** Error messages never reveal whether an email/name is on the roster. The walk-in fallback always succeeds with a new record.
- **Audit log for every identify transition.** Four new event types; facilitator can see who joined how.
- **Trunk-based.** Each phase commits direct to `main`.
- **Backwards compatible at the session-cookie level.** Participants with live sessions during deploy keep their cookies. HMAC migration is read-time.
- **Email is optional forever.** Roster without emails is a first-class configuration; walk-in events never need email; privacy-first defaults.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| `parseParticipantPaste` already accepts email in the paste text | Verified | `participants.ts:42-43` reads `entry.email` from parser output; entries include `displayName, email, tag` triple. |
| `ParticipantRecord` already has `email: string \| null` | Verified | `runtime-contracts.ts:40` — field exists with opt-in flag. |
| Server actions can read request headers via `next/headers` | Verified | Phases 1–4 already use this via `buildServerActionRequest` in `lib/redeem-guard.ts`. |
| `HARNESS_EVENT_CODE_SECRET` can be provisioned ahead of deploy | Verified | `.env.example` documents it; Playwright config injects a stable test key. |
| Neon Auth supports adding users with `role = "participant"` alongside the existing `role = "admin"` | Verified | `facilitator-session.ts:54` already checks `role === "admin"`; the column exists on `neon_auth."user"` and is the schema-level discriminator. |
| Neon Auth session cookies for facilitator and participant live in the same namespace (`__Secure-neon-auth.session_token`) | Assumed | Requires a 20-minute spike in Phase 5.0 to confirm and decide whether the app-layer role check is strict enough, or whether we need a per-role cookie split. |
| Neon Auth accepts a username-style identifier (not mandatory email) for sign-in | Unverified | Need to confirm in Phase 5.0. Fallback: synthesize `<slug>@<instance>.harness.local` as the Neon identifier when the participant has no email. |
| Neon Auth exposes a server-side API for creating users with a chosen password (not an email-verified signup flow) | Unverified | Need to confirm in Phase 5.0. If only a signup flow exists, we call that flow server-side with a synthetic verify-skip path or wrap it with a service account that auto-confirms. |
| Neon Auth provides per-identifier rate limiting on failed signin | Assumed | Documented in Neon Auth; confirm the limits match our threat model. Supplement with our own `redeem-attempt-repository`-style limiter if needed. |
| Facilitator password reset for participants can happen without email delivery | Decided | Workshop doctrine — in-room one-time code is the mechanism. |
| Rate limit by session-token fingerprint is acceptable for the suggest endpoint | Assumed | 20 queries/min is generous for normal typing. Validate empirically in Phase 5. |
| No existing production deploys have participants bound to sessions that would need migration on this change | Assumed | Today's `participant.neon_user_id` is a new column; pre-Phase-5 participants get `null` and are transparently prompted to set a password on next identify. |
| `sameSite: "lax"` is still appropriate after `secure` is added | Verified | Lax + secure is the standard combo for first-party session cookies. |

Unverified assumptions above are investigation tasks pinned to Phase 5.0 (pre-flight spike).

## Risk Analysis

| Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|
| HMAC migration misses a code path and a live code becomes unverifiable | Low | High | ✅ Shipped. Dual-hash window checks both. Tests cover SHA-256 redeem + in-place upgrade. |
| Autocomplete endpoint becomes a roster scraper for anyone with a live session | Medium | Medium | Rate-limit 20/min per session. Min 2 chars. Cap 5 results. No raw email ever — only masked form when disambiguation requires it. |
| A participant-role Neon user reaches a facilitator surface | Medium | High | Every facilitator guard audited to use `hasFacilitatorPlatformAccess` (role check), not `getAuthenticatedFacilitator` (presence check). New `lib/privilege-boundary.test.ts` asserts participant cannot touch any admin endpoint. Code review gate: any new admin route MUST reference the test. |
| Facilitator and participant Neon Auth sessions collide in the same browser | Medium | Low | Document the "one Neon session at a time per browser" rule. The app-layer role check is strict, so the worst case is one of them has to sign out — not a security issue. Consider a per-role cookie split only if empirically painful. |
| Participant forgets password, facilitator isn't available | Medium | Low | One-time reset code can be issued by any facilitator on the instance. 15-minute window, HMAC-hashed, rate-limited. If truly stuck, facilitator archives the participant row and re-issues. |
| Walk-in creation becomes a password-creation funnel for the curious | Medium | Low | `allow_walk_ins` toggle means hosts who don't want this can turn it off. When on, rate limits on identify + event-code prevent abuse. |
| Password min-length (8) is too weak or too strong for the room | Low | Low | 8 chars is a pragmatic workshop floor. Matches ergonomics of "pick something you'll remember for the next 8 hours." Not bank-grade; that's not the threat model. |
| Neon Auth API changes or throttles us unexpectedly | Low | Medium | Wrap all Neon Auth calls behind `lib/participant-auth.ts` so the integration point is one file. If we need to swap, we swap there. |
| Phase 5 UX looks bureaucratic ("set a password? I just came here to code") | Medium | Medium | Preview artifact (this document's Subjective Contract) reviewed before any code lands. Password screen is one field, one button, lowercase copy, no account-creation framing. |

## Phased Implementation

Each phase ships as its own PR.

### Phase 1 — Lang switcher fix

**Exit:** clicking cs/en on /participant or the facilitator mirror preserves path + session. Playwright regression test green.

### Phase 2 — Rate-limit + origin + bot guards in redeemEventCode

**Exit:** `redeemEventCodeAction` server action produces the same 429 as the API route on abuse. Unit test covers both paths hitting the guard. Full test suite green.

### Phase 3 — Cookie secure flag

**Exit:** running under `NODE_ENV=production` sets `secure: true` on session + lang cookies. Dev over HTTP still works. Manual verification via `curl -I` against a production-built server.

### Phase 4 — HMAC event codes + dual-hash migration

**Exit:** new codes are HMAC'd. Existing SHA-256 codes still redeem and get upgraded to HMAC on first success. `.env.example` documents the new key. `runtime-auth-configuration.ts` asserts its presence in prod. Tests cover both hash families + migration.

### Phase 5 — Name-first identify + Neon Auth participants + walk-in policy

**Sub-phases:**

- **5.0 — Pre-flight spike.** Confirm Neon Auth supports (a) non-email identifiers (or we commit to synthetic identifiers), (b) server-side user creation with a chosen password, (c) rate limits on failed signin. Resolve the "cookie namespace shared" question. One page of notes, committed to the plan before code.
- **5.1 — Preview artifact v2.** Redrawn HTML preview showing the single name-first prompt, the disambiguation sub-view, the set-password and enter-password sub-views, the walk-in creation / refusal states, and the facilitator walk-in toggle. Reviewed by Ondrej. No code before this passes.
- **5.2 — Schema + Neon Auth integration.** Add `participant.neon_user_id`, `workshop_instance.allow_walk_ins`, `participant_password_reset_tokens` table. Add `lib/participant-auth.ts` wrapping Neon Auth. Migrations + unit coverage.
- **5.3 — Backend surfaces.** Suggest endpoint with disambiguation, set-password endpoint, authenticate endpoint, reset-token issue + redeem endpoints, walk-in toggle action.
- **5.4 — Frontend.** New name-first prompt with disambiguation, password sub-views, reset-flow entry, walk-in toggle in facilitator access panel, password reset button in People section row.
- **5.5 — Privilege boundary audit.** Read every facilitator route / server action; confirm each calls `hasFacilitatorPlatformAccess`. Add `lib/privilege-boundary.test.ts` asserting a participant-role session cannot reach any admin surface.
- **5.6 — End-to-end tests.** Playwright: redeem → name-pick → set password → complete; re-login → enter password → complete; reset flow end-to-end; walk-in creation path; walk-in refusal path.

**Exit:** a pre-entered participant can identify with name-first + password on first visit, re-login with password only on return, and cannot reach any facilitator surface. Walk-ins work when allowed, fail politely when not. Facilitator can reset a participant's password in the room. Preview artifact reviewed before the code lands.

### Phase 6 — Tests + docs

**Exit:** ADR committed. All assertions covered. Existing + new Playwright tests green.

## Implementation Tasks

### Phase 1 — Lang switcher ✅ COMPLETE

- [x] In `dashboard/app/components/site-header.tsx`, documented that `csHref` and `enHref` must be overridden when `isParticipant` is true (docblock at top of component).
- [x] In `dashboard/app/participant/page.tsx:63` and `:92`, pass `csHref={withLang("/participant", "cs")} enHref={withLang("/participant", "en")}`.
- [x] `/admin/instances/[id]/participant/page.tsx` already overrides correctly to `/admin/instances/{id}/participant` — verified, no change needed.
- [x] New Playwright spec `dashboard/e2e/participant-lang-switch.spec.ts`: redeem code, click `cs`, assert URL stays at `/participant` and session cookie is unchanged.
- [x] Verified live via Chrome DevTools MCP: `cs` → `http://localhost:3003/participant`, `en` → `http://localhost:3003/participant?lang=en`, session preserved.
- [x] Playwright spec passes (1/1).
- [ ] ⎘ Commit: `fix: preserve participant path when switching language`.

### Phase 2 — Guards in redeemEventCode

- [x] Refactor guard orchestration into `lib/redeem-guard.ts:guardedRedeemEventCode`. Runs `isTrustedOrigin` + `checkBotId` + `isRedeemRateLimited` before `redeemEventCode`, records the attempt after. New failure reasons: `untrusted_origin`, `rate_limited`. (Kept `redeemEventCode` pure — tests and background callers unchanged; HTTP-surface callers funnel through `guardedRedeemEventCode`.)
- [x] Update `app/api/event-access/redeem/route.ts` to use `guardedRedeemEventCode`; dropped the inline origin/bot/rate-limit/attempt calls.
- [x] Update `app/page.tsx:redeemEventCodeAction` to build a `Request` via `buildServerActionRequest()` (reads `next/headers`) and call `guardedRedeemEventCode`.
- [x] `!result.ok` branch: server action redirects with `?eventAccess=<reason>` for every reason, including `rate_limited` and `untrusted_origin`.
- [x] `lib/ui-language.ts` gains `rateLimitedCode` (cs + en); `formatEventAccessError` maps `rate_limited`.
- [x] Unit tests: `lib/redeem-guard.test.ts` covers untrusted origin, rate-limit threshold, success path, and failure-attempt recording. Existing route tests still pass.
- [x] Full unit suite green (378 / 378).
- [ ] Playwright sweep deferred to end-of-phase verification.
- [ ] ⎘ Commit: `fix: centralize redeem guards inside redeemEventCode`.

### Phase 3 — Cookie secure flag — PARTIAL

Parallel work (commit `976ab6b`, OWASP security remediation) already added
`getParticipantSessionCookieOptions(expires)` in `lib/event-access.ts:56-64`
and applied it to:
- `app/api/event-access/redeem/route.ts:83` ✅
- `app/api/event-access/logout/route.ts:34` ✅
- `app/participant/page.tsx:33` (logout cookie clear) ✅

Still open for this plan:
- [x] Replace inline cookie options at `app/page.tsx:32-37` (server-action redeem) with `getParticipantSessionCookieOptions`. Today's inline options lack `secure` — the parallel work missed this site.
- [x] Update `proxy.ts:82-86` to set `secure: process.env.NODE_ENV === "production"` on the language cookie.
- [x] Unit test: mock `NODE_ENV` and assert `getParticipantSessionCookieOptions` returns the correct flag in both modes (already existed in `event-access.test.ts:242-265`).
- [ ] Manual test: `pnpm build && pnpm start`, redeem via the server action (homepage form), inspect Set-Cookie — expect `Secure`. (Deferred: covered by NODE_ENV-gated unit test; plan should update manual-verify gate if we want it re-run before ship.)
- [ ] ⎘ Commit: `fix: thread secure cookie helper through server-action redeem + lang cookie`.

### Phase 4 — HMAC event codes

- [x] Add `hashEventCode(code, { keyOverride }?)` in `lib/participant-event-access-repository.ts`. Reads `HARNESS_EVENT_CODE_SECRET`. In file-mode dev, falls back to a stable constant with a one-shot `console.warn`; in Neon mode or production, missing / short keys throw.
- [x] Production / Neon guard enforced inside `resolveEventCodeKey()` (same file) — throws on first use if the env var is missing or shorter than 32 chars. Avoids a separate one-off assertion in `runtime-auth-configuration.ts` while still failing fast at boot.
- [x] `redeemEventCode` computes both `hashEventCode(code)` and `hashSecret(code)`, matches stored rows against either, and upgrades SHA-256 rows to HMAC in place on first successful redeem.
- [x] `buildSeedAccess` (file mode) and the Neon `ensureSeedAccess` path switched to HMAC at creation time. `issueParticipantEventAccess` now writes HMAC; `resolveRecoverableCurrentCode` recognizes either hash family so existing seeded rows still reveal.
- [x] `.env.example` documents `HARNESS_EVENT_CODE_SECRET`. `playwright.config.ts` sets a stable 32+ char test key so the E2E server has what it needs.
- [x] `docs/private-workshop-instance-schema.md` notes HMAC hashing + dual-hash migration on `code_hash`.
- [x] Unit tests (`event-access.test.ts` / `participant-event-access-repository.test.ts`): HMAC redeem, SHA-256 legacy redeem + upgrade, seed writes HMAC, no-match rejection.
- [x] Full unit suite green (381 / 381).
- [ ] Playwright sweep deferred to end-of-phase verification.
- [ ] ⎘ Commit: `feat: hmac-hash event codes with legacy sha256 migration`.

### Phase 5 — Name-first identify + Neon Auth participants + walk-in policy

#### 5.0 Pre-flight spike (required before any design or code) — ✅ COMPLETE

See `docs/brainstorms/2026-04-20-neon-auth-participant-role-spike.md` for the full write-up.

- [x] Confirm Neon Auth supports creating users with `role = "participant"` via server-side API — **yes**, via `signUp.email` + direct SQL role update (matches existing pattern). `admin.createUser` also available.
- [x] Non-email identifier decision — **synthesize** `p-<participantShortId>@<instanceSlug>.harness.local`. Never deliverable, never shown, stable per participant per instance.
- [x] Cookie namespace — **single shared cookie** (`__Secure-neon-auth.session_token`). App-layer role check is already strict; "one Neon session per browser" is a documented UX rule, not a security gap.
- [x] Failed-signin rate limiting — **better-auth defaults apply**; layer our own limiter on the first factor (suggest endpoint), trust Neon's on the second factor (password). Revisit if empirical.
- [x] Spike brainstorm committed.

**Open items carried to Ondrej** (Neon dashboard-level, can't verify from code):

- Confirm email verification is *off* on the Neon Auth instance (or we'll switch to the admin-createUser path).
- Confirm whether Neon Auth 0.2.0-beta exposes a service token for admin ops (vs needing a `HARNESS_NEON_ADMIN_*` service user).
- Confirm `neon_auth."user".role` column accepts arbitrary strings (or extend the CHECK constraint to allow `participant`).
- Confirm the failed-signin default threshold on the Neon Auth instance.

These block Phase 5.2's wiring to Neon, but not the schema / migration / local test work.

#### 5.1 Preview artifact v2 (required before any code)

- [ ] Redraw the HTML preview to match the v2 shape: single name-first prompt with disambiguation sub-view, set-password sub-view, enter-password sub-view, reset-flow entry, walk-in creation state, walk-in refusal state, facilitator walk-in toggle. Publish via `/babel-fish:visualize`. Review by Ondrej.

#### 5.2 Schema + Neon Auth integration

- [ ] Add migration: `ALTER TABLE participants ADD COLUMN neon_user_id text NULL`.
- [ ] Add migration: `ALTER TABLE workshop_instance ADD COLUMN allow_walk_ins boolean NOT NULL DEFAULT true`.
- [ ] Add migration: create `participant_password_reset_tokens (id, instance_id, participant_id, token_hash, issued_at, expires_at, consumed_at)`.
- [ ] Add `lib/participant-auth.ts` — the single integration point for Neon Auth in the participant role. Exports `createParticipantPassword(identifier, password, metadata)`, `authenticateParticipant(identifier, password)`, `issueResetToken(participantId, issuedBy)`, `consumeResetToken(token, newPassword)`.
- [ ] Add `lib/participant-identifier.ts` — resolves `participant` → Neon Auth identifier (prefers `email` when present, synthesizes otherwise).
- [ ] Update `lib/participant-repository.ts`: add `listByDisplayNamePrefix(instanceId, prefix, limit)`, `findByNeonUserId(neonUserId)`, `linkNeonUser(participantId, neonUserId)`, `listReserveForSuggest(instanceId, prefix)`.
- [ ] Update `ParticipantRecord` in `runtime-contracts.ts` to include `neonUserId: string | null`.

#### 5.3 Backend surfaces

- [ ] `GET /api/event-access/identify/suggest?q=` — returns `{ id, displayName, disambiguator?: { kind: "tag" | "masked_email" | "order"; value: string }, hasPassword: boolean }[]`. Cap 5. Min 2 chars. Rate-limit 20/min per session. `allow_walk_ins === true` appends a trailing create-new sentinel only when no exact match exists.
- [ ] `POST /api/event-access/identify/set-password` — input: `participantId`, `password`, `displayName` (for walk-in create case). Validates session, checks participant is in session's instance, validates walk-in policy on the create case. Calls `createParticipantPassword`, links `neon_user_id`, binds session.
- [ ] `POST /api/event-access/identify/authenticate` — input: `participantId`, `password`. Calls `authenticateParticipant`. On success binds session. Generic error message on failure.
- [ ] `POST /api/event-access/identify/reset-token/redeem` — input: `participantId`, `token`, `newPassword`. Validates + consumes token, then delegates to `createParticipantPassword` path.
- [ ] `POST /api/admin/participants/[id]/reset-password` — facilitator-only (guarded by `hasFacilitatorPlatformAccess` + per-instance grant). Issues a one-time token, returns the plaintext code once (for the facilitator to read aloud).
- [ ] Walk-in toggle: facilitator server action on the access panel; audit log `facilitator_walk_in_toggle_changed`.
- [ ] Audit log additions (repository already generic): `participant_identify_by_roster_pick`, `participant_password_created`, `participant_password_auth_success`, `participant_password_auth_failure`, `participant_password_reset_issued`, `participant_password_reset_redeemed`, `participant_identify_walk_in_created`, `participant_identify_walk_in_refused`.

#### 5.4 Frontend

- [ ] Rewrite `app/components/participant-identify-prompt.tsx` as a single-page state machine: `typing` → `picking` → `set_password` | `enter_password` | `walk_in_create` | `walk_in_refused` | `reset_flow`. Each sub-view is a thin render of a shared card shell. Uses `InlineSpinner` for async fetches, debounce 250 ms.
- [ ] Suggest calls include the `hasPassword` hint; the UI branches on it before prompting for password.
- [ ] "forgot?" link under the password field routes to the reset-code redemption sub-view.
- [ ] Facilitator-side: walk-in toggle in access panel (`/admin/instances/[id]`), per-row "reset password" action in the People section. The reset action opens a small modal that displays the one-time code once.
- [ ] Copy additions in `lib/ui-language.ts` (cs + en) for every new label, error, and fallback.

#### 5.5 Privilege boundary audit

- [ ] Grep every facilitator route/action handler; confirm `hasFacilitatorPlatformAccess` is called (not just `getAuthenticatedFacilitator`). Fix any drift.
- [ ] Add `lib/privilege-boundary.test.ts` — parametrized test that creates a participant-role Neon session, enumerates every facilitator API route, asserts each returns 401/403.
- [ ] Add an ESLint rule or code review checklist note in `dashboard/AGENTS.md`: "any new `/admin` or facilitator server action must reference the privilege-boundary test."

#### 5.6 Tests

- [ ] Unit: suggest endpoint (min chars, cap, disambiguation logic tag-first then masked-email), `participant-auth.ts` wrapper, walk-in policy gate on set-password path, reset token issue/redeem/expire, walk-in toggle action.
- [ ] Unit: `lib/participant-identifier.ts` (synthetic identifier generation, collision handling).
- [ ] Page test: identify prompt state machine transitions on each input / response.
- [ ] Playwright: (a) redeem → pick-from-roster → set-password → room; (b) re-login → enter password → room; (c) password reset end-to-end (facilitator issues, participant redeems); (d) walk-in enabled → create new → set password → room; (e) walk-in disabled → refusal state; (f) participant-role session cannot reach `/admin` routes.
- [ ] Full test suite green.
- [ ] ⎘ Commits (one per sub-phase): `feat: schema + participant-auth wrapper`, `feat: identify suggest + password endpoints`, `feat: identify prompt state machine + reset flow`, `feat: facilitator walk-in toggle + password reset`, `test: participant privilege boundary regression`.

### Phase 6 — Surface already_bound

- [ ] Update every identify server action (set-password, authenticate, reset-redeem, walk-in-create) to redirect with `?identify=already_bound` when the session already has a `participantId` that doesn't match the submitted choice.
- [ ] Update the identify prompt state machine to render the explicit error state when that query param is present.
- [ ] Playwright: simulate an already-bound session submitting a different name, assert the error renders and no DB write happened.
- [ ] ⎘ Commit: `fix: surface participant already_bound state explicitly`.

### Phase 7 — Docs

- [ ] New ADR `docs/adr/2026-04-19-name-first-identify-with-neon-auth.md` — records the name-first + Neon Auth decision, cross-references the v1 Q5 brainstorm as the doctrine extension.
- [ ] Update `docs/private-workshop-instance-schema.md` with the `neon_user_id`, `allow_walk_ins`, and `participant_password_reset_tokens` additions.
- [ ] Update `docs/private-workshop-instance-data-classification.md` to classify the participant password hashes (handled by Neon Auth, referenced only).
- [ ] Update `docs/adr/2026-04-06-private-workshop-instance-auth-boundary.md` (or add a companion ADR) to note that `neon_auth."user".role` is the privilege discriminator and that every admin guard must check it explicitly.
- [ ] Mark this plan `status: complete` in frontmatter.
- [ ] ⎘ Commit: `docs: ADR for name-first + neon-auth identify model`.

## Acceptance Criteria

Phases 1–4 (shipped):
- [x] Clicking `cs` or `en` on `/participant` stays at `/participant?lang=cs|en`; session cookie survives; no re-login.
- [x] Submitting 6 invalid codes in a row via the server action returns HTTP 429 (or redirects with `?eventAccess=rate_limited`) on the 6th, matching the API route behavior.
- [x] Server-action redeem + language cookie carry `Secure` when `NODE_ENV=production`; dev over HTTP still works.
- [x] A stored SHA-256 codeHash still redeems on first attempt; after that attempt the stored row contains an HMAC hash.

Phase 5 (name-first identify + Neon Auth participants + walk-in policy):
- [ ] Typing 2+ characters in the identify prompt returns up to 5 matches from the roster. The suggest endpoint returns only `{ id, displayName, disambiguator?, hasPassword }` — never raw email, never tag unless promoted to disambiguator, never password state beyond the boolean.
- [ ] When two roster entries share a typed name, the listbox shows a tag beside each (or masked email if tags aren't present). One-match queries never show a disambiguator.
- [ ] A pre-entered participant picks their name, sets a password once, and is in the room. On return (fresh browser, new event-code session), picking the same name prompts for the password and authenticates via Neon Auth.
- [ ] A participant-role Neon session cannot reach any `/admin` route or facilitator server action. The `privilege-boundary.test.ts` suite is green.
- [ ] With `allow_walk_ins = true`, typing a name not on the roster surfaces a "＋ add yourself as new" option; submitting creates a participant and prompts for a password.
- [ ] With `allow_walk_ins = false`, the create option is absent and submitting an unknown name surfaces "ask your facilitator to add you" — no participant row is created.
- [ ] Facilitator "reset password" on a participant row displays a one-time code (3 words, 15-minute expiry); the participant can redeem it inside the identify prompt via a "forgot?" flow, and the new password immediately authenticates.
- [ ] Rate-limiting the suggest endpoint returns 429 after 21 queries in a minute from the same session.
- [ ] Attempting to bind a different name/identity to an already-bound session shows the explicit error; the bound participant is unchanged.
- [ ] Every identify / password path emits an audit log entry.
- [ ] All unit + Playwright tests green, including the full identify → set password → re-login → reset flow round-trip.

## Subjective Contract (Phase 5 only)

Phase 5 is the UX-heavy phase. The target outcome matters as much as the structural change.

**Target outcome:** a pre-entered participant opens the workshop URL, types the first few letters of their name, picks themselves, sets a password once, and is in the room. When they come back the next day (or on a different device) they repeat only the last two steps. Walk-ins work when the facilitator has enabled them and never when disabled. The whole experience feels like "oh, it remembered me" — not "create your account."

**Anti-goals:**
- An identify screen that looks like a SaaS signup page.
- A password prompt that asks for confirmation, recovery email, security questions, or any other credential-management theater.
- A walk-in refusal that feels like rejection rather than routing ("ask your facilitator to add you" is friendly; "access denied" is not).
- Any UI that reveals more of the roster than the current query strictly requires.
- A password field that appears before the participant has picked their identity.

**References:**
- Today's cockpit compaction (`control-room-cockpit.tsx`): density without coldness.
- `participant-identify-prompt.tsx`'s current minimal card: keep the calm center.
- Rosé Pine tokens, Space Grotesk display, Manrope body, lowercase labels.
- Event code redeem card on the homepage — establishes the "one field, one button" pattern the identify surface should extend.

**Anti-references:**
- SaaS "sign in or sign up" walls with split buttons.
- Password managers' "create account" flows with confirmation fields and strength meters.
- Any prompt that reveals more information than strictly needed (how many people are on the list, who they are, whether you're early or late).
- A combobox that looks like a Google search bar.

**Tone rules:**
- One instruction per sub-view. "Your name." "Your password." "Ask your facilitator to add you." No preambles.
- "Set your password" — not "create account", not "register", not "sign up."
- Error messages neutral — "that didn't match" not "wrong password."
- Lowercase everything (matches product doctrine).

**Representative proof slice:** one HTML preview artifact showing the single name-first prompt with every sub-view laid out (typing / picking / set-password / enter-password / walk-in-create / walk-in-refused / reset-flow) at iPad portrait 834px. Published via the share server before any Phase 5 code is written. Supersedes the v1 three-lane preview (`artifact--2026-04-20--22b22049`).

**Rollout rule:** Phase 5 lands without a feature flag per-se — the flow is one shape for everyone. The only configuration is the facilitator's `allow_walk_ins` toggle, defaulted to `true` so existing instances behave like today.

**Rejection criteria:** ship back to planning if reviewer feels any of:
- the identify surface reads as "sign in" rather than "come in";
- the password sub-view feels heavier than the event-code sub-view (they should feel like siblings);
- walk-in refusal reads as rejection rather than redirection;
- disambiguation reveals more than it should (full emails, counts, anything the current query didn't explicitly ask for);
- the overall experience feels like user management has arrived, rather than identity has become survivable.

**Reviewer:** Ondrej. One preview artifact, one pass, then implementation starts.

## References

- **Brainstorm (Q5 origin)**: `docs/brainstorms/2026-04-16-harness-lab-product-shape-and-participant-management-brainstorm.md` — two-layer identity model.
- **Prior plan (participant management)**: `docs/plans/2026-04-16-feat-participant-management-and-team-formation-plan.md` (complete) — `Participant` entity, paste intake, `email` field.
- **Prior plan (auth boundary)**: `docs/plans/2026-04-08-fix-dashboard-design-system-audit-remediations-plan.md` — iPad-first doctrine.
- **Today's cockpit + density plan**: `docs/plans/2026-04-19-refactor-dashboard-density-feedback-and-drift-pass-plan.md` (complete).
- **Submit-feedback work (Phase 1 precedent)**: commit `a9331d9` — where we added `InlineSpinner` and threaded it through every async form.
- **Event-access ADR**: `docs/adr/2026-04-06-workshop-event-access-model.md` — single shared code model we're preserving.
- **Security surface**: `lib/event-access.ts`, `lib/redeem-rate-limit.ts`, `lib/redeem-attempt-repository.ts`, `lib/participant-event-access-repository.ts`, `lib/facilitator-access.ts`, `app/api/event-access/redeem/route.ts`, `app/page.tsx`.
- **Identity UX surface**: `app/components/participant-identify-prompt.tsx`, `app/participant/page.tsx`, `app/admin/instances/[id]/participant/page.tsx`, `app/components/site-header.tsx`, `lib/participant-paste-parser.ts` (verify in Phase 5a).
