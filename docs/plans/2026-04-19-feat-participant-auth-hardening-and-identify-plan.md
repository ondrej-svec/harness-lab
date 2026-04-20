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

## Session handoff (2026-04-20)

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
5. **Pre-entered participants don't retype themselves.** If the roster for the instance has at least one participant with an email, the redeem flow asks for email, and matches it against the roster server-side. If the roster has no emails (or the participant doesn't have one listed), the prompt becomes name-with-autocomplete that queries the roster as you type (min 2 chars, capped results). Neither path ever ships the full roster to the client. Walk-in flow ("I'm not on the list, add me") stays available.
6. **Session collision is surfaced.** When `bindParticipantToSession` returns `already_bound`, the UI shows an explicit error ("this session is already identified as [name]") instead of silently redirecting to the hub.
7. **Audit log captures the new paths.** Every email match, autocomplete-miss, and `already_bound` rejection appends an audit row.
8. **Existing tests green, new regression tests for each change.** Including e2e coverage of the lang-switch fix.

## Scope and Non-Goals

**In scope:**
- Link-target fix on `SiteHeader` participant usage (and `/admin/instances/[id]/participant/page.tsx` mirror).
- Moving rate-limit / origin / bot guards inside `redeemEventCode()` so both paths share them.
- `secure` flag on session + language cookies in production.
- HMAC upgrade for event code hashing, with a dual-hash read-time migration.
- New identify prompt with two modes: email-first (when roster has emails) or name-with-autocomplete (otherwise).
- Roster autocomplete endpoint with rate-limit + min-chars + result-cap.
- Surfacing `already_bound` to the user as an explicit error state.
- Test coverage: unit, Playwright e2e regression for the lang bug.

**Not in scope:**
- Per-participant invite codes (Option E from the conversation) — doctrine change, separate plan if ever.
- Roster "pick from full list" (Option A) — rejected for privacy reasons.
- Silent name match (Option D) — rejected because first-name-only entries create false positives.
- SSO / OAuth per participant — out of Q5 doctrine.
- CSRF tokens beyond Next's built-in server-action protocol.
- Rewriting `parseParticipantPaste`'s format (already accepts `displayName, email, tag`).
- Facilitator-side roster import UI changes beyond what's needed for email capture.
- Email opt-in / follow-up delivery infrastructure.
- Display-name collision policy ("two Johns" in the walk-in path) — existing behavior preserved, tracked as followup.
- Event code rotation / TTL policy — handled elsewhere.

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

### Phase 5 — Identify flow revamp

The facilitator's roster decision drives the participant prompt.

**Server-side decision at page load** (`app/participant/page.tsx` when `!participantSession.participantId`):

1. Load the instance's participants. If any has `email != null`, route to **email-first mode**. Otherwise route to **name-with-autocomplete mode**.
2. If the instance has no pre-entered participants at all, route to **walk-in mode** (current "what's your name?" unchanged, no autocomplete).

**Email-first mode** (`ParticipantIdentifyByEmailPrompt`):
- Input: type="email", label "Your email", required.
- Submit flow: server action finds participant by exact `email` match (case-insensitive).
- If matched: bind session, done.
- If no match: return to the prompt with a secondary affordance: "We don't see that email. If you're a walk-in, add yourself by name." → switches to walk-in mode for that participant only.
- Validate: email format on the client (`type="email"`), re-validate server-side. No user enumeration signal in error text (same message for "not on list" and "typed wrong"; rely on the walk-in fallback to succeed).

**Name-with-autocomplete mode** (`ParticipantIdentifyByNamePrompt`):
- Input: type="text" with a live `combobox` pattern. As the user types (min 2 chars), the client calls `GET /api/event-access/identify/suggest?q=<prefix>` with the session cookie.
- Suggest endpoint: scoped to the session's `instanceId`, returns up to 5 participants whose `displayName` matches case-insensitively (prefix or substring — prefix only to start, substring if we see misses). Rate-limited by session-token fingerprint (no more than 20 calls per minute per session). Returns only `{ id, displayName }` — not emails, not tags.
- Submit flow: if the user picked a suggestion, server action binds by `participantId`. If the user typed something and hit enter without picking, treat as walk-in: call `findOrCreateParticipant` with the typed name.
- Optional tiny UX: show "or add yourself as a new participant" button under the suggestion list so the create-new intent is always visible.

**Walk-in mode** (`ParticipantIdentifyPrompt`, existing):
- Unchanged "what's your name?" flow. This is what runs today when no roster exists.

**Backend changes:**
- `lib/event-access.ts` gains `bindParticipantByEmail(session, tokenHash, email)` — parallel to `bindParticipantToSession`, but matches the roster by email instead of creating. Returns `{ ok: true, participantId }` or `{ ok: false, reason: "no_match" | "already_bound" | "invalid_email" }`.
- `lib/event-access.ts` gains `bindParticipantById(session, tokenHash, participantId)` for the autocomplete-picked case. Validates that the participant is in the same instance.
- `app/api/event-access/identify/suggest/route.ts` — new endpoint, rate-limited, scoped by session instance.
- Audit log: `participant_identify_by_email`, `participant_identify_by_roster_pick`, `participant_identify_not_found` (email mode fall-through).

### Phase 6 — Surface `already_bound`

`submitIdentifyAction` in `app/components/participant-identify-prompt.tsx` already branches on `invalid_display_name`. Add a branch for `already_bound` that redirects back with `?identify=already_bound`, and render an explicit error state on the prompt ("This session is already identified as someone else. If that's not you, use Log out in the room header and start over.") — preserves the defensive behavior, makes it visible. Applies to all three prompts (email, name-autocomplete, walk-in).

### Phase 7 — Tests and docs

- Playwright e2e: lang switch preserves session + path.
- Unit tests: rate-limit guard inside `redeemEventCode` (both paths hit it), HMAC upgrade migration, suggest endpoint rate-limit and scoping, `already_bound` surfacing.
- `docs/adr/`: one new ADR for "roster-aware identify flow" that records the B+C decision and explicitly rejects A/D/E with reasons. Cross-reference in the 2026-04-16 brainstorm as the Q5 extension.
- Update `docs/private-workshop-instance-data-classification.md` if email handling boundary changes require it.

## Decision Rationale

### Why B+C over A, D, E

- **A (full roster list)**: rejected. Exposes the attendee list to anyone who has the code — potentially including anyone a code was shared with "by accident." Unacceptable for any workshop with external attendees.
- **D (silent name match)**: rejected by the user this session — first-name-only entries ("Jan") collide across multiple real people, binding the wrong session to the wrong record silently. Data integrity bug.
- **E (per-participant invite codes)**: rejected as out-of-scope. Heavy change to Q5 doctrine (single shared event code); requires out-of-band distribution infrastructure (email/SMS); adds per-person secret management. Good feature later, not now.
- **B alone (email only)**: rejected. Some rosters are pasted as names only; forcing email collection up front creates friction at the roster-import step.
- **C alone (name autocomplete only)**: rejected. For rosters with emails already captured, email is a stronger identifier than a name prefix and avoids the "which Jan" problem.
- **B+C**: the server decides based on what the roster actually contains. Cheap to implement, degrades gracefully to walk-in mode when neither applies. Keeps the attendee list private in both modes.

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
| Next.js server actions go through a specific POST transport that lets us read the underlying Request headers | Assumed | Server actions in Next 16 can call `headers()` / `cookies()` from `next/headers`. The x-forwarded-for / user-agent values needed by `getClientFingerprint` are accessible via that path. Needs verification in Phase 2. |
| `HARNESS_EVENT_CODE_SECRET` can be provisioned ahead of deploy | Assumed | Vercel env vars support this; need explicit doc in README. |
| The facilitator paste intake today captures emails when pasted | Unverified | Need to confirm `parseParticipantPaste`'s current grammar handles `Jan Novák <jan@acme.com>` and `Jan Novák, jan@acme.com`. Investigation task in Phase 5. |
| Rate limit by session-token fingerprint is acceptable for the suggest endpoint (same user, many queries as they type) | Assumed | 20 queries/min is generous for normal typing. Validate empirically in Phase 5. |
| No existing production deploys have event codes that would be disrupted by the HMAC migration | Assumed | Single active event currently; dual-hash fallback would cover any edge case even if this is wrong. |
| `sameSite: "lax"` is still appropriate after `secure` is added | Verified | Lax + secure is the standard combo for first-party session cookies. |

Unverified assumptions are investigation tasks in the phases below.

## Risk Analysis

| Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|
| HMAC migration misses a code path and a live code becomes unverifiable | Low | High | Dual-hash window checks both. Playwright + unit test covering SHA-256 stored code still redeeming successfully post-migration. |
| Secret env var leaks in dev | Medium | Low | Console-warn in dev when the fallback dev key is used; ensure `.env*` files remain git-ignored. |
| Rate limit inside `redeemEventCode` breaks existing Playwright test fixtures | Low | Low | Tests already tolerate the 429 path via the API route. Confirm by running Playwright after Phase 2; adjust test-mode hook if needed. |
| Autocomplete endpoint becomes a roster scraper for anyone with a live session | Medium | Medium | Rate-limit by session fingerprint (20/min). Minimum 2 chars. Cap 5 results. No email/tag in response. Short cache TTL. |
| Email-first mode frustrates participants without email in roster | Medium | Low | Fall-through to walk-in on no-match is always one click away. |
| `secure: true` breaks a non-Vercel HTTPS deploy that uses a non-standard proxy header | Low | Medium | Gate on `NODE_ENV === "production"` as the primary signal; `x-forwarded-proto` as the secondary. Document the choice. |
| `already_bound` error surface confuses legitimate users who share a device | Medium | Low | Error text explicitly offers the logout path. Acceptable cost for the security signal. |
| Phase 5 UX change looks worse than current "What's your name?" minimal card | Medium | Medium | Preview artifact required before landing (see Subjective Contract). |

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

### Phase 5 — Identify flow revamp

**Exit:** three modes (email-first, name-autocomplete, walk-in) dispatch correctly based on roster contents. Autocomplete endpoint rate-limited. `already_bound` surfaces. Preview artifact reviewed before the code lands.

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

- [ ] Add `hashEventCode(code, { keyOverride }?)` in `lib/participant-event-access-repository.ts`. Read key from `process.env.HARNESS_EVENT_CODE_SECRET`. Dev fallback: a stable constant with `console.warn` if env var is missing and NODE_ENV !== production.
- [ ] Add production-only guard in `lib/runtime-auth-configuration.ts`: asserts `HARNESS_EVENT_CODE_SECRET` is set and ≥32 bytes when `isNeonRuntimeMode() === true`.
- [ ] In `redeemEventCode` (now passed a request), compute both `hashEventCode(code)` and `hashSecret(code)` (legacy SHA-256). Compare with `safeCompare` to each stored `codeHash`. If SHA-256 matches but HMAC doesn't, upgrade the stored row's `codeHash` to HMAC.
- [ ] In `buildSeedAccess` (file mode) and the equivalent Neon seeding path, switch to HMAC at creation time.
- [ ] Add `.env.example` entry for `HARNESS_EVENT_CODE_SECRET`.
- [ ] Document in `docs/private-workshop-instance-schema.md` (or equivalent): the stored `codeHash` is HMAC-SHA256 with a server-side key; legacy rows are accepted and upgraded on first redeem.
- [ ] Unit tests: (a) HMAC path matches on redeem; (b) SHA-256 legacy row matches on redeem and gets upgraded in-place; (c) seeded code writes HMAC directly.
- [ ] Full test suite green including Playwright (which uses `HARNESS_EVENT_CODE` env for its seeded code — ensure the Playwright config also sets `HARNESS_EVENT_CODE_SECRET`).
- [ ] ⎘ Commit: `feat: hmac-hash event codes with legacy sha256 migration`.

### Phase 5 — Identify flow revamp

#### 5a. Preview artifact (required before code)

- [ ] Sketch the three prompt modes (email-first, name-autocomplete, walk-in) as an authored HTML artifact (Rosé Pine tokens, cockpit panel style). Show keyboard focus order, error states, the walk-in fallback affordance. Publish via `/babel-fish:visualize` and review before writing code.

#### 5b. Backend

- [ ] Verify `parseParticipantPaste` accepts `Name <email>` and/or `Name, email` formats. If not, extend it (new ADR note, not a breaking schema change).
- [ ] Add `bindParticipantByEmail(session, tokenHash, email)` in `lib/event-access.ts`. Match against `ParticipantRepository.findParticipantByEmail(instanceId, email)` (add this method to the repo interface + file/neon impls). Case-insensitive. Returns `{ ok, reason }`.
- [ ] Add `bindParticipantById(session, tokenHash, participantId)` in `lib/event-access.ts`. Validates participant belongs to the same instance.
- [ ] Add server action `submitIdentifyByEmailAction` in `app/components/participant-identify-by-email-prompt.tsx` (new). Server action calls `bindParticipantByEmail`; on miss, redirect to `/participant?identify=walk_in_offer` to show the fallback.
- [ ] Add server action `submitIdentifyByPickAction` for the autocomplete-picked path. Validates `participantId` is roster-owned.
- [ ] Add `app/api/event-access/identify/suggest/route.ts`: GET endpoint, reads session cookie → instance, reads `q` query, returns up to 5 `{ id, displayName }` matches. Rate-limit 20/min/session-fingerprint. `q.length < 2` returns empty array. Trust boundary: only same-instance roster; never emails/tags.
- [ ] Audit log entries: `participant_identify_by_email_success`, `participant_identify_by_email_miss`, `participant_identify_by_roster_pick`, `participant_identify_walkin_created`.

#### 5c. Frontend

- [ ] Dispatcher in `app/participant/page.tsx` (in the `!participantSession.participantId` branch): query `getParticipantRepository().listParticipants(instanceId)`, compute `hasAnyEmail = some(p => p.email)`, `hasAnyRoster = items.length > 0`. Route to the right prompt.
- [ ] New `ParticipantIdentifyByEmailPrompt` (client boundary as needed). Uses `SubmitButton`. Shows inline "add yourself as new" affordance on miss.
- [ ] New `ParticipantIdentifyByNamePrompt` with `combobox` pattern, React-managed state for the suggestion list. Uses `InlineSpinner` for the fetch-while-typing indicator. Debounced 250 ms. Keyboard: Arrow up/down traverse suggestions, Enter submits (picks highlighted suggestion, or falls through to create-new if nothing highlighted).
- [ ] Preserve `ParticipantIdentifyPrompt` for the walk-in path (no autocomplete, original minimal card).
- [ ] Copy additions in `lib/ui-language.ts`: prompts, error messages, the walk-in fallback label.

#### 5d. Tests

- [ ] Unit: `bindParticipantByEmail` exact-match, case-insensitive match, no-match, already-bound, invalid-email.
- [ ] Unit: suggest endpoint honors min-chars, cap, instance scoping, rate limit.
- [ ] Page test: dispatcher picks email-first mode when roster has ≥1 email, name-autocomplete when roster is all name-only, walk-in when roster is empty.
- [ ] Playwright: redeem → email-first flow → exact match → room. Redeem → email-first flow → no-match → walk-in fallback. Redeem → name-autocomplete → pick suggestion. Redeem → name-autocomplete → type + submit new → create.
- [ ] Full test suite green.
- [ ] ⎘ Commits (one per sub-phase is fine): `feat: roster-aware identify prompts (backend)` then `feat: identify prompts UI (email-first + autocomplete)`.

### Phase 6 — Surface already_bound

- [ ] Update `submitIdentifyAction`, `submitIdentifyByEmailAction`, `submitIdentifyByPickAction` to redirect with `?identify=already_bound` when the repo returns that reason.
- [ ] Update all three prompt components to render the explicit error state when that query param is present.
- [ ] Playwright: simulate an already-bound session submitting a different name/email, assert the error renders and nothing in the DB changed.
- [ ] ⎘ Commit: `fix: surface participant already_bound state explicitly`.

### Phase 7 — Docs

- [ ] New ADR `docs/adr/2026-04-19-roster-aware-identify.md` — records B+C decision, rejects A/D/E with reasons, cross-references the Q5 brainstorm.
- [ ] Update `docs/private-workshop-instance-schema.md` with HMAC note and the new identify paths.
- [ ] Mark this plan `status: complete` in frontmatter.
- [ ] ⎘ Commit: `docs: ADR for roster-aware identify + schema notes`.

## Acceptance Criteria

- [ ] Clicking `cs` or `en` on `/participant` stays at `/participant?lang=cs|en`; session cookie survives; no re-login.
- [ ] Submitting 6 invalid codes in a row via the server action returns HTTP 429 (or redirects with `?eventAccess=rate_limited`) on the 6th, matching the API route behavior.
- [ ] Running `pnpm build && pnpm start` under `NODE_ENV=production`, the Set-Cookie response for a successful redeem contains the `Secure` flag. Under `next dev`, it does not.
- [ ] A stored SHA-256 codeHash still redeems on first attempt; after that attempt the stored row contains an HMAC hash. Grep `lib/event-access.ts` shows no call to `hashSecret` on event-code inputs (sessions keep `hashSecret` — tokens are already CSPRNG).
- [ ] On an instance where ≥1 pre-entered participant has an email, redeeming brings up the email-first prompt. Entering a matching email binds the session in <300 ms. Entering a non-matching email shows the walk-in fallback.
- [ ] On an instance where the roster has only names, the prompt is name-with-autocomplete. Typing 2+ characters returns up to 5 matches. Picking one binds to the existing record; pressing Enter with a new name creates a new record and binds.
- [ ] Walk-in events (no roster) see the unchanged "what's your name?" minimal prompt.
- [ ] Rate-limiting the suggest endpoint returns 429 after 21 queries in a minute from the same session.
- [ ] Attempting to bind a different name to an already-bound session shows the explicit error; the bound participant is unchanged.
- [ ] Suggest endpoint responses never contain `email`, `tag`, or any field other than `id` and `displayName`.
- [ ] Every identify path emits an audit log entry.
- [ ] All unit + Playwright tests green.

## Subjective Contract (Phase 5 only)

Phase 5 is the UX-heavy phase. The target outcome matters as much as the structural change.

**Target outcome:** a pre-entered participant opens the workshop URL, types their email (or first few letters of their name) once, and is in the room. The experience feels like "oh, it knew me" — not "here are all the things I could be."

**Anti-goals:**
- Roster exposed to anyone with a code (rejects Option A).
- Silent identity collision (rejects Option D).
- A UI that shows "loading suggestions…" so slowly the user gives up and types the full name.
- Email prompt that looks intimidating (no "register your account", no caps, no verification).
- Missing walk-in fallback that makes pre-entered workshops unfriendly to last-minute guests.

**References:**
- Today's cockpit compaction (`control-room-cockpit.tsx`): density without coldness.
- `participant-identify-prompt.tsx`'s current minimal card: keep the calm center.
- Rosé Pine tokens, Space Grotesk display, Manrope body, lowercase labels.

**Anti-references:**
- SaaS "sign in or sign up" walls with split buttons.
- Any prompt that reveals more information than strictly needed (how many people are on the list, who they are, whether you're early or late).
- A combobox that looks like a Google search bar.

**Tone rules:**
- One instruction per prompt. "Your email." "Your name." No preambles.
- Error messages neutral — "we don't see that email, add yourself as new?" not "that email wasn't found."
- Lowercase everything (matches product doctrine).

**Representative proof slice:** one HTML preview artifact showing all three modes side-by-side at iPad portrait 834px. Published via the share server before any code in Phase 5 is written.

**Rollout rule:** Phase 5 lands behind no flag — the dispatcher code selects the mode from the roster contents, so empty rosters stay on walk-in. This means old workshops are unaffected and new workshops adopt the new flow by having emails.

**Rejection criteria:** ship back to planning if reviewer feels any of:
- the three modes aren't distinguishable enough that a returning participant recognizes they're in the right one;
- the email fallback flow reads as "you're wrong, try again" rather than "no problem, come in as a walk-in";
- the autocomplete feels like a search box rather than a soft roster match.

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
