---
title: "refactor: retire HARNESS_WORKSHOP_INSTANCE_ID singleton"
type: plan
date: 2026-04-20
status: complete
brainstorm: null
confidence: high
---

# Retire the `HARNESS_WORKSHOP_INSTANCE_ID` singleton

One-line: Every route and library call derives `instanceId` from request context (URL, body, query, or authenticated session). Delete the env-var fallback and the `getCurrentWorkshopInstanceId()` helper. Align the CLI, workshop skills, and docs with the new contract so the full stack (API → CLI → skill → docs) agrees.

## Coordination with in-flight plans

This plan overlaps with `docs/plans/2026-04-19-feat-participant-auth-hardening-and-identify-plan.md` (status: `in_progress`, phases 1–4 shipped, phase 5 pending preview artifact).

**What already shipped** (from the auth plan) that this refactor builds on:
- `f4f8f67 fix: centralize redeem guards inside guardedRedeemEventCode` — guards moved inside `redeemEventCode`. `redeem-rate-limit.ts` still uses `getCurrentWorkshopInstanceId()` as a bucket key (verified by reading the file). My Phase 5 (rate-limit rekey) still applies.
- `1e1f865 feat: hmac-hash event codes with legacy sha256 migration` — introduced `HARNESS_EVENT_CODE_SECRET` requirement (caused tonight's crash; already fixed by setting the secret).
- `cf0a414 fix: thread secure cookie helper through server-action redeem + lang cookie` — secure cookie helper. No conflict.

**What's pending in the auth plan** that this refactor must coordinate with:
- **Phase 5 — Name-first identify + Neon Auth participants + walk-in policy.** Adds new server surface:
  - `workshop_instances.allow_walk_ins` column (migration already shipped per auth plan line 496).
  - New facilitator endpoint for toggling walk-ins. The auth plan sketches `app/admin/instances/[id]/access/toggle-walk-ins/` — **already `[id]`-scoped**, so aligned. This plan adds a constraint: any new auth-related endpoint lands under `/api/workshop/instances/[id]/...` or an `[id]`-scoped server action, **never** under the flat `/api/admin/...` structure.
  - `GET /api/event-access/identify/suggest?q=` — auth plan spec says it derives `instanceId` from session. Already aligned with this plan's session-scoped pattern.
  - New `lib/participant-repository.ts` methods — auth plan adds `listByDisplayNamePrefix(instanceId, prefix, limit)`. Already instance-scoped. Aligned.
- **`lib/privilege-boundary.test.ts`** — auth plan's Phase 5 adds a parametrized test that enumerates every facilitator API route and asserts participant-role sessions get 401/403. If this plan's Phase 4 moves `/api/admin/facilitators` → `/api/workshop/instances/[id]/facilitators`, the boundary test parameter list must move with it. Coordination task: whichever plan gets to the test first owns updating it; the other plan adds its URLs during its phase.
- **Phase 6 (auth plan) — surface `already_bound`** and **Phase 7 (auth plan) — tests/docs.** No conflict.

**Sequencing rule:**
- Phases 0–1 of **this** plan tonight (env var fix + mechanical defaults). Independent of auth plan state.
- Auth plan's Phase 5 can proceed in parallel or before any other phase of this plan as long as every new endpoint lands `[id]`-scoped. Auth plan's preview artifact is the gating item for its Phase 5 — this plan does not block on it.
- This plan's Phases 2–8 resume after the 21.4 workshop. If auth plan's Phase 5 ships first, this plan's Phase 3 (flat route migration) inherits the new endpoints as already-correct.

**Single-file update needed in the auth plan** when this plan ships Phase 4: replace references to `/api/admin/facilitators` with `/api/workshop/instances/[id]/facilitators` in the auth plan's privilege-boundary test task. Tracked as an explicit item in this plan's Phase 4.

## Problem Statement

`HARNESS_WORKSHOP_INSTANCE_ID` is a leftover from the single-workshop era (pre 2026-04-06 per-instance architecture plan, see `docs/plans/archive/2026-04-06-feat-private-workshop-instance-architecture-plan.md`). The app is now per-instance — admin UI lives at `/admin/instances/[id]`, participant sessions carry `instanceId` from redeem time — but the env var and its helper `getCurrentWorkshopInstanceId()` (in `dashboard/lib/instance-context.ts`) still guard ~30 library defaults and ~10 API routes as a silent fallback.

Why this matters:
1. **Correctness:** the singleton points at one instance. In a multi-instance deployment (Brno 21.4, Praha 24.4, etc.) the fallback routes silently return data from the wrong workshop.
2. **Crash surface:** when the env var points at a removed instance (as happened tonight after cleaning up old instances), every legacy caller 404s or throws "default workshop instance is not available."
3. **Hidden dependency:** the env var ultimately falls back to `seedWorkshopState.workshopId = "sample-studio-a"` — a sample id that doesn't exist in Neon.
4. **Rate-limit key pollution:** `redeem-rate-limit.ts` keys buckets by the singleton instanceId, meaning failure counts don't isolate by workshop.

## Target End State

When this plan lands:

- `dashboard/lib/instance-context.ts` is deleted. No caller imports `getCurrentWorkshopInstanceId`.
- `HARNESS_WORKSHOP_INSTANCE_ID` is removed from `.env.example`, Vercel env (all environments), `.vercel/.env.production.local`, and any other config.
- Every `app/api/**` route derives `instanceId` from one of: URL `[id]` param, request body, query string, or authenticated participant/facilitator session.
- `lib/workshop-store.ts`: the ~30 functions that took `instanceId = <default>` now take `instanceId: string` as a required argument. TypeScript compile enforces all call-sites supply one.
- `lib/redeem-rate-limit.ts` + `lib/redeem-guard.ts` key buckets by fingerprint (+ optional sentinel namespace), not by a phantom singleton instanceId.
- The shipped CLI (`@harness-lab/cli` 0.8.0) continues to work unchanged against the migrated server — all CLI-called routes derive instanceId from session/url, so the CLI never needs to learn a new contract in this cleanup.
- `pnpm --filter dashboard typecheck` and `pnpm --filter dashboard test` pass. A Playwright smoke-run on the participant redeem→brief path passes.
- Production `lab.ondrejsvec.com` is deployed and verified green with the 21.4 instance live.

## Scope and Non-Goals

**In scope:**
- Removing the env var, the helper, and every call-site.
- Adding participant-session-based `instanceId` derivation to flat CLI-called routes (`/api/briefs`, `/api/challenges`, `/api/workshop GET`, `/api/agenda GET`, `/api/rotation GET`, `/api/monitoring GET`).
- Restructuring the two admin facilitators routes under `/api/workshop/instances/[id]/facilitators` + `/facilitators/[grantId]`.
- Making `instanceId` required in body/query on all admin participant/team routes.
- Re-keying redeem rate-limit and guard.
- **CLI alignment** (`harness-cli/`): delete dead client methods, replace fallback branches that relied on the singleton with hard errors requiring explicit `instance select`, bump version, re-sync the bundled workshop-skill assets. Full list in Phase 7.
- **Skill alignment** (`workshop-skill/` + synced copy in `harness-cli/assets/workshop-bundle/`): update `facilitator.md` references to `HARNESS_WORKSHOP_INSTANCE_ID` and any flat API paths. Full list in Phase 7.
- **Docs alignment** (repo-root `docs/`, `dashboard/.env.example`, `harness-cli/README.md`): retire env-var references; mark historical architecture docs as superseded. Full list in Phase 8.
- Updating tests that break from signature tightening.

**Explicitly out of scope:**
- Redesigning how participant sessions are minted or how event codes hash (the HMAC migration from commit `1e1f865` already shipped).
- Changing workshop blueprint / agenda authoring flow.
- Audit-log schema changes beyond dropping the phantom default in one audit write.
- Any UI copy or design work.
- The auth plan's Phase 5 feature scope (Neon Auth participant role, walk-in toggle UI, password reset). This plan only ensures those endpoints land on the migrated `[id]`-scoped pattern.

## Proposed Solution

The app already has the correct end-state wiring for the per-instance paths: `/admin/instances/[id]/...` pages pass the id explicitly, and participant sessions carry `instanceId`. We just need to finish the migration for the handful of routes and library defaults that never got updated.

Approach: **require the id to flow through**, never infer from env. Three patterns cover all cases:

1. **URL-param routes** (admin pages, most `workshop/instances/[id]/...` routes): already correct. Only cleanup is removing the now-dead `= getCurrentWorkshopInstanceId()` defaults in the library functions they call.
2. **Session-scoped participant routes** (CLI-called flat routes like `/api/briefs`): add `requireParticipantSession(request)` at top, derive `instanceId` from `access.session.instanceId`, pass it through to `getWorkshopState(instanceId)` and similar.
3. **Facilitator flat routes** (like `POST /api/checkpoints`, `POST /api/admin/teams`): require `instanceId` in the body, return 400 if missing. These have few CLI consumers and admin UI consumers already send it.

**Rate-limit re-keying:** drop instanceId from the `redeem-rate-limit` key. Buckets are per-fingerprint across all instances — since participants don't know the instance at redeem time, a global-by-fingerprint bucket is semantically correct and strictly stricter (doesn't let a fingerprint hammer by rotating codes). `redeem-guard` alerts use `"redeem"` as a sentinel namespace before the match, and the real instanceId from `result.session.instanceId` after a successful match.

## Constraints and Boundaries

- **CLI compatibility:** the shipped `@harness-lab/cli` 0.8.0 uses `/api/workshop`, `/api/briefs`, `/api/challenges`, `/api/checkpoints GET`, `/api/agenda`, `/api/workshop/archive`. These URLs stay stable; only internal handler logic changes. The CLI sends participant session cookie via `session.cookieHeader` — handlers must accept that for participant scopes.
- **No new required query params on CLI-called routes** — derive from session instead.
- **No breaking change to participant redeem API** — `/api/event-access/redeem` contract unchanged.
- **Trunk-based:** work lands directly on `main` in small checkpointed commits (see memory: "Trunk-based development"). Each phase is one commit.
- **Proof slice rule:** Phase 2 migrates **only one route** (`/api/briefs`) first; it's verified end-to-end before the other five flat routes follow the same pattern. If the pattern needs adjustment, we catch it on one route, not six.
- **Workshop-eve risk:** Phases 0–1 must land tonight (they're reversible and don't touch CLI paths). Phases 2–6 can ship before/after the 21.4 workshop depending on time; if time runs out, Phase 0 alone keeps production healthy.
- **Audit-log continuity:** existing audit-log rows for the singleton instance stay; no backfill.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| Participant session cookie is reliably set by CLI for participant commands | Verified | `harness-cli/src/client.js` sends `session.cookieHeader` on all requests; `lib/event-access.ts:redeemEventCode` writes the cookie after successful redeem |
| Admin UI always navigates through `/admin/instances/[id]` pages — never the bare `/admin` for instance-scoped work | Verified | Route structure in `app/admin/instances/[id]/...`; `[id]/_components/sections/*` all receive `instanceId` prop |
| `participantSession.instanceId` is always set on a validated session | Verified | `redeemEventCode` in `event-access.ts:168-169` binds `matchedAccess.instanceId` into the new session record; session validation in `getParticipantSession` returns null if expired/missing, never partial |
| Removing the `= getCurrentWorkshopInstanceId()` defaults in `workshop-store.ts` won't silently break a caller not caught by grep | Unverified | TypeScript compile will catch all remaining call-sites — if build passes, we're safe. Task: "run `pnpm --filter dashboard typecheck`" blocks Phase 5 completion. |
| `HARNESS_WORKSHOP_INSTANCE_ID` isn't referenced in any skill file, facilitator doc, or workshop-content seed | Unverified | Task: grep whole repo (not just `dashboard/`) before final removal. |
| The `/api/workshop GET` handler (called by CLI `verifyAccess`) is safe to scope to the participant's session instance | Needs judgement | Currently returns meta for the singleton instance. Scoping to session's instance is a stricter, more correct behaviour — the CLI's `verifyAccess` should inherently be instance-scoped. Confirm with a CLI smoke test before shipping Phase 2. |
| Rate-limit key change won't let an attacker bypass throttling | Verified | New key is `(fingerprint)` rather than `(singleton-instanceId, fingerprint)` — strictly stricter because the fingerprint dimension is preserved and the instance dimension was always the same value across all attempts anyway. |
| The 21.4 workshop instance being currently live will still be live when each phase ships | Load-bearing assumption | Workshop is `2026-04-21`; this plan starts `2026-04-20` evening. Phases 0–1 tonight, phases 2–6 can wait until after 21.4 if needed. |

## Implementation Tasks

Tasks are ordered by dependency. Each `## Phase` is one commit on `main`. Check off `[x]` as `/work` completes each.

### Phase 0 — Stabilize production (tonight, before anything else)

- [x] Point `HARNESS_WORKSHOP_INSTANCE_ID` at the live 21.4 instance so legacy fallbacks resolve to a real instance. Run:
  ```bash
  vercel env rm HARNESS_WORKSHOP_INSTANCE_ID production --yes
  echo -n 'developer-hackathon-brno-2026-04-21-dakar' | vercel env add HARNESS_WORKSHOP_INSTANCE_ID production
  vercel redeploy https://lab.ondrejsvec.com --scope svecond2s-projects
  ```
- [x] Verify admin loads at `https://lab.ondrejsvec.com/admin` and `https://lab.ondrejsvec.com/admin/instances/developer-hackathon-brno-2026-04-21-dakar`.
- [x] Verify `GET /api/workshop` returns data for the 21.4 instance via `curl`.

**Exit criteria:** production admin page loads without error; CLI `workshop status` returns 21.4 data. If this fails, stop and fix before Phase 1.

### Phase 1 — Mechanical: drop dead defaults where call-sites already pass explicit id

These functions all have `instanceId = getCurrentWorkshopInstanceId()` defaults but their remaining call-sites (after Phase 0 stabilization) all pass explicit ids. Tightening the signature to `instanceId: string` is a pure type change — no runtime behavior change.

- [x] `lib/workshop-store.ts`: tighten signatures for the 20 functions flagged "dead default" in the audit. Full list:
  - `getBaseWorkshopState`, `updateWorkshopState` (internal, always called from callers that pass id)
  - `setLiveRoomScene`, `setLiveParticipantMomentOverride`, `clearLiveParticipantMomentOverride`
  - `updateAgendaItem`, `addAgendaItem`, `removeAgendaItem`, `moveAgendaItem`
  - `addPresenterScene`, `updatePresenterScene`, `movePresenterScene`, `removePresenterScene`, `setDefaultPresenterScene`, `setPresenterSceneEnabled`
  - `captureRotationSignal`, `listRotationSignals`
  - `getActivePollSummary`, `submitActivePollResponse`, `submitParticipantFeedback`
- [x] `lib/participant-access-management.ts`: drop defaults on `getFacilitatorParticipantAccessState` and `issueParticipantEventAccess`.
- [~] ~~`lib/event-access.ts`: remove the `getCurrentWorkshopInstanceId` import~~ — audit was wrong; import is still used at line 407 (`revokeParticipantSession` fallback). Deferred to Phase 3 when that fallback is removed.
- [~] ~~`lib/participant-event-access-repository.ts`: remove the `getCurrentWorkshopInstanceId` import~~ — same; used at line 282 (`getEventAccessPreview` default). Deferred to Phase 3.
- [x] `npx tsc --noEmit` — passes (11 pre-existing errors on HEAD, zero new from this change).
- [x] `npm test` — passes (413 passing, 15 skipped, unchanged from before).
- [x] Commit: `0a16424 refactor: drop dead instanceId defaults in workshop-store`.

**Exit criteria:** typecheck and tests green. Production unchanged (no behaviour delta).

### Phase 2 — Proof slice: migrate `/api/briefs` to session-scoped

Picking `/api/briefs` as the representative because (a) it's CLI-called (`harness workshop briefs`), (b) it's the smallest flat route, (c) it's the exact pattern to copy for the other five in Phase 3.

- [ ] `app/api/briefs/route.ts`: add `requireParticipantSession(request)` at top; pass `access.session.instanceId` to `getWorkshopState`. Add integration test covering (i) no cookie → 401, (ii) valid cookie → 200 with briefs from that instance.
- [ ] Manual verification:
  - [ ] Curl with no cookie → 401.
  - [ ] `HARNESS_DASHBOARD_URL=https://lab.ondrejsvec.com node harness-cli/bin/harness.js auth login --code <21.4 code>` then `harness workshop briefs` → returns 21.4 briefs.
- [ ] Commit: `refactor(api): scope /api/briefs to participant session`.

**Exit criteria:** smoke test from CLI passes against prod. If the pattern needs adjustment (e.g. cookie handling), adjust here — not in Phase 3.

### Phase 3 — Roll the proof-slice pattern to the remaining flat CLI routes

Copy the Phase 2 pattern to each. One commit per route (small, easy to revert).

- [ ] `app/api/challenges/route.ts` → session-scoped GET. Commit.
- [ ] `app/api/workshop/route.ts` GET handler → session-scoped (facilitator session OR participant session, since both call it). Decision: if the caller has a facilitator session, return instance from their selected `[id]`-param or current admin page; if participant session, return from `session.instanceId`. Check CLI `verifyAccess` flow to confirm which callers hit this. Commit.
- [ ] `app/api/agenda/route.ts` GET → session-scoped. PATCH → require `body.instanceId`, return 400 if missing. Commit.
- [ ] `app/api/rotation/route.ts` GET → session-scoped. PATCH → require `body.instanceId`. Commit.
- [ ] `app/api/monitoring/route.ts` GET → session-scoped. POST → facilitator-only, require `body.instanceId`. Commit.
- [ ] `app/api/checkpoints/route.ts` POST → require `body.instanceId`. (GET is already session-scoped.) Commit.
- [ ] `app/api/challenges/[id]/complete/route.ts` → require `body.instanceId` (facilitator POST). Commit.
- [ ] `app/api/admin/teams/route.ts` POST and PATCH → require `body.instanceId`. Commit.

**Exit criteria:** each commit independently passes typecheck + tests + CLI smoke (for routes the CLI calls). Production redeployed between commits or at end of phase.

### Phase 4 — Restructure `/api/admin/facilitators` under `[id]`

- [ ] Create `app/api/workshop/instances/[id]/facilitators/route.ts` (GET + POST) that takes `id` from URL params. Mirror the logic from `app/api/admin/facilitators/route.ts` but sourced from URL instead of env.
- [ ] Create `app/api/workshop/instances/[id]/facilitators/[grantId]/route.ts` (DELETE) — pull instanceId from the grant row via `repo.getGrant(grantId)` so revoking is scoped even without URL `id`. (Keeping both `[id]` in URL and grant-sourced check is belt-and-suspenders.)
- [ ] Update admin UI call-sites in `dashboard/app/admin/instances/[id]/_components/sections/access-section.tsx` and any server actions that POST to `/api/admin/facilitators` → now POST to `/api/workshop/instances/${id}/facilitators`.
- [ ] Delete `app/api/admin/facilitators/route.ts` and `app/api/admin/facilitators/[id]/route.ts`.
- [ ] Tests for new routes; remove tests for old routes.
- [ ] Commit: `refactor(api): move admin facilitators under instances/[id]`.

**Exit criteria:** admin facilitator management works end-to-end via UI. Old URLs no longer exist (any caller gets 404, which surfaces stale code).

### Phase 5 — Re-key redeem rate-limit and guard

- [ ] `lib/redeem-rate-limit.ts`: change `isRedeemRateLimited` to not take / not pass an instanceId. `getRedeemAttemptRepository().countRecentFailures(fingerprint, since)` — bucket is keyed by fingerprint only. Update repo signature + Neon query.
- [ ] `lib/redeem-guard.ts`: use sentinel `"redeem"` for `emitRuntimeAlert` before match; thread real `result.session.instanceId` for post-match emit.
- [ ] Migration for the `participant_redeem_attempts` (or similar) table: either add a migration to drop the instance_id column, or leave it nullable and stop writing it. Decision: leave column nullable for now; deprecation comment above the repo method. One `TODO(post-cleanup)`.
- [ ] `lib/redeem-rate-limit.test.ts`, `lib/redeem-guard.test.ts`: update to new signatures.
- [ ] Commit: `refactor(auth): re-key redeem rate-limit by fingerprint only`.

**Exit criteria:** participant redeem still works. Replaying the same bad code N times from the same client still trips the rate limit. Tests green.

### Phase 6 — Server-side final removal

- [ ] Delete `dashboard/lib/instance-context.ts`.
- [ ] Remove the `workshopId: "sample-studio-a"` fallback from `lib/workshop-data.ts:seedWorkshopState` if it's no longer used anywhere (verify via grep before deleting).
- [ ] Remove `HARNESS_WORKSHOP_INSTANCE_ID` from `dashboard/.env.example` (line 2).
- [ ] Remove from Vercel: `vercel env rm HARNESS_WORKSHOP_INSTANCE_ID production`, same for preview + development.
- [ ] `pnpm --filter dashboard typecheck` — must pass with zero hits for `getCurrentWorkshopInstanceId`.
- [ ] `pnpm --filter dashboard test` — must pass.
- [ ] `grep -r "getCurrentWorkshopInstanceId" /Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/` returns nothing.
- [ ] `grep -r "HARNESS_WORKSHOP_INSTANCE_ID" /Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/` returns nothing.
- [ ] Full Playwright e2e smoke: facilitator sign-in, open instance, participant redeem + brief + checkin + checkpoint.
- [ ] Commit: `refactor: remove HARNESS_WORKSHOP_INSTANCE_ID singleton (server)`.
- [ ] `vercel redeploy https://lab.ondrejsvec.com --scope svecond2s-projects`.

**Exit criteria:** production builds, deploys, admin + participant flows work end-to-end. Server repo is clean of the singleton.

### Phase 7 — CLI and skill alignment

The shipped `@harness-lab/cli` 0.8.0 has dead methods, fallback branches that silently relied on the singleton, and synced skill assets that reference the retired env var. This phase aligns CLI, skills, and the bundle.

**CLI client cleanup (`harness-cli/src/client.js`):**

- [ ] Delete `getCheckpoints()` at line 185 — never called anywhere in `run-cli.js`. Pure dead code.
- [ ] Delete `getWorkshopStatus()` at line 90 — currently only reached from `handleWorkshopStatus` fallback branch (line 912) when no instance is selected. Delete after fixing the caller (next item).
- [ ] Delete `getAgenda()` at line 108 — same pattern, same caller.
- [ ] Delete `setCurrentPhase()` at line 114 — currently only reached from `handleWorkshopPhaseSet` fallback branch (line 1409). Delete after fixing the caller.
- [ ] Delete `getBriefs()` and `getChallenges()` facilitator-path calls if `run-cli.js:1526, 1548` facilitator branches are removed.

**CLI caller updates (`harness-cli/src/run-cli.js`):**

- [ ] `handleWorkshopStatus` (line 912): the `Promise.all([getWorkshopStatus(), getAgenda()])` fallback branch fires when `target.source !== "session"`. Replace with: require `instance select` first; if no instance resolved, print `"Run \`harness instance select <id>\` first."` and exit 2. If resolved, use `Promise.all([getWorkshopInstance(id), getWorkshopAgenda(id)])`.
- [ ] `handleWorkshopPhaseSet` (line 1409): same treatment — the flat-PATCH fallback becomes a hard error requiring explicit instance.
- [ ] `handleWorkshopBrief` (line 1526) and `handleWorkshopChallenges` (line 1548): remove the facilitator branch that calls `getBriefs()` / `getChallenges()`. Facilitators don't need a CLI path to briefs/challenges — the admin UI covers this. If we need to keep a facilitator view, use an instance-scoped endpoint (defer to a follow-up if requested).
- [ ] `handleWorkshopParticipantsList` (line 1645) and siblings (`Add`, `Import`, `TeamAssign`, `TeamUnassign`, `TeamRandomize`): add a guard that errors out when `resolveInstanceFlag(flags)` returns nothing. These routes already accept `instanceId` in body/query — the change is making missing-instance fail loudly instead of silently using the singleton default.

**Skill source updates (`workshop-skill/`):**

- [ ] `workshop-skill/facilitator.md:100` — remove `"or \`HARNESS_WORKSHOP_INSTANCE_ID\`"` from the target-resolution description. Reframe as "whether the target came from persisted selection or the server resolved it from the session."
- [ ] `workshop-skill/facilitator.md:387` — `POST {DASHBOARD_URL}/api/workshop` documentation: confirm it still describes a real endpoint post-migration (the POST dispatcher for `action: "create" | "prepare" | "reset"` stays, per Phase 3 task). If staying, no change. If retired, update to the replacement endpoint.

**Synced bundle re-sync:**

- [ ] After updating sources, run `node ./scripts/sync-workshop-bundle.mjs` (or the equivalent command — verify the script name first) to refresh `harness-cli/assets/workshop-bundle/workshop-skill/facilitator.md` line 100 and `harness-cli/assets/workshop-bundle/docs/harness-cli-foundation.md` line 92. Do not hand-edit the synced copies; they'll be overwritten.

**CLI version + release:**

- [ ] Bump `harness-cli/package.json` from `0.8.0` → `0.9.0` (minor, because we remove methods and change fallback behaviour).
- [ ] Update `harness-cli/CHANGELOG.md` with the breaking changes.
- [ ] Rebuild local tarball (`npm pack --workspace @harness-lab/cli` or equivalent) — sanity-check against a local Harness Lab dashboard.
- [ ] Publish `npm publish --workspace @harness-lab/cli --access public` once end-to-end verified.
- [ ] Note in release notes: workshop participants running 0.8.0 continue to work (no breaking server change for participant commands); facilitators should upgrade to 0.9.0 for the hard-error behaviour.
- [ ] Commit: `chore(cli): align CLI + skill with instance-scoped server contract`.

**Exit criteria:** `grep -rn HARNESS_WORKSHOP_INSTANCE_ID harness-cli/ workshop-skill/` returns zero hits in source files (synced bundle copies are acceptable only if they're regenerated from clean sources). Local `@harness-lab/cli@0.9.0` passes a full participant + facilitator smoke against `lab.ondrejsvec.com`.

### Phase 8 — Documentation alignment

All reference material gets aligned with the migrated stack. No code in this phase.

- [ ] `dashboard/.env.example:2` — delete the `HARNESS_WORKSHOP_INSTANCE_ID=...` line.
- [ ] `harness-cli/README.md:170–176` — update command names to current CLI surface (`harness instance select`, `instance current`, etc. — the old names in the docs are already stale). Remove line 176's `HARNESS_WORKSHOP_INSTANCE_ID` env fallback reference.
- [ ] `docs/harness-cli-foundation.md:92` — remove `3. the deployment default \`HARNESS_WORKSHOP_INSTANCE_ID\`` from the target-selection order list.
- [ ] `docs/self-hosting.md:92` — remove the env var from the hosted variables list, or annotate as retired.
- [ ] `docs/private-workshop-instance-env-matrix.md` — remove lines 19, 47, 54 mentioning the env var, or mark the row deprecated + empty the purpose column.
- [ ] `docs/2026-04-06-private-workshop-instance-architecture-review.md:58–67` — add a short header note: `> Superseded 2026-04-20: flat routes migrated to session-scoped or \`[id]\`-scoped per \`docs/plans/2026-04-20-refactor-retire-current-workshop-instance-singleton-plan.md\`.` Do not edit the historical table itself.
- [ ] `docs/plans/2026-04-19-feat-participant-auth-hardening-and-identify-plan.md` — in the privilege-boundary test task (around Phase 5.5), replace `/api/admin/facilitators` with `/api/workshop/instances/[id]/facilitators` in the URL list. Add a one-line "2026-04-20 update" note referencing this plan.
- [ ] Repo-root `AGENTS.md` and `README.md` — grep first; only edit if they reference the env var or flat routes (audit says neither currently does, but recheck after the migration).
- [ ] `pnpm --filter dashboard test` — confirm still green after doc-only changes (sanity).
- [ ] Commit: `docs: retire HARNESS_WORKSHOP_INSTANCE_ID references`.

**Exit criteria:** global `grep -rn "HARNESS_WORKSHOP_INSTANCE_ID"` across the entire repo returns only historical plan documents (this plan, the 2026-04-06 archived plan, the auth hardening plan's note). No live source, docs, or examples reference it.

## Acceptance Criteria

Each criterion is an independent check a third party could run without guidance.

**Server-side (Phases 0–6):**
1. `grep -rn "HARNESS_WORKSHOP_INSTANCE_ID" /Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/` returns no hits in source (acceptable hits: this plan file, archived plans).
2. `grep -rn "getCurrentWorkshopInstanceId" /Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/` returns no hits.
3. `ls /Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/instance-context.ts` returns "No such file or directory".
4. `vercel env ls production | grep HARNESS_WORKSHOP_INSTANCE_ID` returns nothing.
5. `pnpm --filter dashboard typecheck` passes.
6. `pnpm --filter dashboard test` passes.
7. `curl -sS https://lab.ondrejsvec.com/api/briefs` → 401 without a cookie.
8. `curl -sS https://lab.ondrejsvec.com/api/briefs -H "cookie: harness_event_session=<valid>"` → 200 with briefs from the redeemed instance.
9. Admin UI: sign in, open an instance page, see facilitators list, add and remove a grant — no errors.
10. Participant UI: redeem code, see brief, submit checkin — no errors.

**CLI + skill (Phase 7):**
11. `grep -rn "HARNESS_WORKSHOP_INSTANCE_ID" /Users/ondrejsvec/projects/Bobo/harness-lab/harness-cli/ /Users/ondrejsvec/projects/Bobo/harness-lab/workshop-skill/` returns no hits in source files (synced bundle files are acceptable only if regenerated clean from the updated sources).
12. `harness-cli/package.json` version is `0.9.0`.
13. Dead client methods (`getCheckpoints`, `getWorkshopStatus`, `getAgenda`, `setCurrentPhase`) are removed from `harness-cli/src/client.js`.
14. CLI happy path from the shipped 0.8.0 (participant commands): `harness auth login --code <21.4>` then `harness workshop status` / `workshop briefs` / `workshop challenges` all return 21.4 data.
15. CLI happy path from the new 0.9.0 (facilitator commands): after `harness auth login --auth device` + `harness instance select <id>`, `harness workshop status` returns data; running without `instance select` hard-errors with the new guidance message instead of silently returning singleton data.
16. Published `@harness-lab/cli@0.9.0` installable from npm.

**Docs (Phase 8):**
17. Global `grep -rn "HARNESS_WORKSHOP_INSTANCE_ID" /Users/ondrejsvec/projects/Bobo/harness-lab/` returns hits only in historical plan documents (this plan's file, `docs/plans/archive/2026-04-06-*`, and at most one supersede-note in the auth hardening plan). No hits in `.env.example`, `README.md`, `AGENTS.md`, or any active docs.

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Break shipped CLI by changing flat-route contracts | Medium | **Workshop-breaking** for 21.4 participants | Phase 2 proof-slice against live CLI before Phase 3. Phase 3 commits are per-route so rollback is one `git revert` away. Schedule phases 2+ for after the 21.4 workshop if the night runs short. |
| Forget a call-site that silently relied on the default | Medium | Runtime 500 in production | TypeScript compile catches signature-breaking defaults (Phase 1). For flat-route migration (Phase 2–3), the behaviour change is "return 401 instead of returning singleton data" — a loud failure, not a silent one. |
| Participant session cookie not sent where expected | Low | 401 where caller expected 200 | Phase 2 verifies cookie propagation on the proof slice. All other flat routes use identical pattern. |
| Redeem rate-limit regression (Phase 5) allows abuse | Low | Brute-force redeem vector | New keying is strictly stricter (drops a dimension that was always the same constant). Tests in `redeem-rate-limit.test.ts` assert both "rate-limit triggers at N failures" and "passes clear on fingerprint rotation". |
| Admin facilitators restructure (Phase 4) breaks an in-flight facilitator grant action | Low | Owner locked out of a grant briefly during deploy | Ship Phase 4 outside workshop hours; admin UI redirect from old → new URL for one release cycle if needed. |
| Ship Phase 2+ the same night as the workshop, something subtle breaks at 8am | Medium | Workshop compromised | **Stop-gate:** if any phase smoke test fails or flakes, roll back that commit, leave the env-var fix from Phase 0 in place, resume after the workshop. |
| CLI smoke test reveals the flat `/api/workshop GET` has both facilitator and participant callers | Medium | Need branching auth logic | Phase 3 task for `/api/workshop GET` explicitly calls this out; decision is made there, not up front. |
| Published CLI 0.9.0 introduces a hard-error in a workflow a facilitator relied on at runtime | Low | Facilitator blocked mid-workshop | 0.8.0 kept available on npm; upgrade is opt-in; release notes spell out the new `instance select` requirement. If a live facilitator hits the hard error, rollback is `npm i -g @harness-lab/cli@0.8.0` (0.8.0 works against the migrated server for all participant commands and most facilitator commands that already pass explicit ids). |
| Auth plan's Phase 5 ships new endpoints under flat `/api/admin/...` before this plan's Phase 4 migrates the old ones | Low | Inconsistent URL structure; more work to migrate later | Coordination rule written at the top of this plan: any new auth-related endpoint in the auth plan's Phase 5 lands `[id]`-scoped from day one. Shared understanding; no enforcement mechanism beyond code review. |
| Synced bundle drifts from source because someone hand-edits `harness-cli/assets/workshop-bundle/...` | Low | Doc drift across CLI releases | Phase 7 explicitly says "do not hand-edit synced copies; they'll be overwritten." Long-term: add a pre-commit or CI check that diffs the sources against the synced copies. Out of scope for this plan. |

## Representative Proof Slice

Phase 2's migration of `/api/briefs` is the proof slice. Before rolling the same pattern to the other five flat routes:
1. Deploy Phase 2 to prod.
2. Run the CLI smoke: `harness workshop briefs` against 21.4 instance.
3. Verify 401 without cookie, 200 with cookie, 200 returns 4 briefs matching `workshop-content/agenda.json`.
4. If any step fails: iterate on Phase 2 pattern. Do not proceed to Phase 3 until green.

Reviewer: me (direct verification). Rejection criterion: CLI smoke fails OR the pattern introduces more than 10 lines per route. If we can't migrate a flat route with a ≤10-line diff, the pattern is wrong.

## Rollout Rule

- **Phases 0–1 land tonight** (low risk, no participant path touched).
- **Phases 2–6 land after 21.4 workshop concludes**, unless all of (a) Phase 2 proof slice passes within 60 minutes, (b) CLI smoke test is flawless, (c) it's before 22:00 CET tonight. Otherwise pause after Phase 1 and resume 22.4.
- **Phase 7 (CLI + skill alignment) lands only after Phase 6 is green on prod.** The CLI hard-errors assume the server contract is migrated. Skipping ahead means the CLI errors out against a server that still has singleton fallbacks — worst of both worlds.
- **Phase 8 (docs) can run in parallel with Phase 7** since it's doc-only and can't introduce runtime regressions. One commit, one review.
- No phase ships without typecheck + tests + (for CLI-called routes) a CLI smoke.

## Rejection Criteria

The cleanup is *wrong* even if it compiles, if any of:
- Any CLI command that worked on prod at 08:00 on 2026-04-21 stops working.
- Any participant hits a 5xx during the 21.4 workshop that traces back to this cleanup.
- The new flat-route pattern requires changes to `@harness-lab/cli` to keep working.
- Rate-limit coverage weakens (e.g. fingerprint dimension drops).

## Required Preview Artifacts

None — this is server-side refactor with no UI or copy change. The proof slice (Phase 2 deployed to prod) is the preview.

## References

- Original instance architecture: `docs/plans/archive/2026-04-06-feat-private-workshop-instance-architecture-plan.md`
- Participant auth hardening (in-flight, phases 1–4 shipped, phase 5 pending): `docs/plans/2026-04-19-feat-participant-auth-hardening-and-identify-plan.md`
- HMAC-hash event codes commit: `1e1f865 feat: hmac-hash event codes with legacy sha256 migration`
- Guard centralization commit: `f4f8f67 fix: centralize redeem guards inside guardedRedeemEventCode`
- Secure cookie helper commit: `cf0a414 fix: thread secure cookie helper through server-action redeem + lang cookie`
- Server-side audit: `codebase-analyzer` agent run on 2026-04-20 (summarized across phases)
- CLI + skill audit: `codebase-analyzer` agent run on 2026-04-20 (summarized in Phases 7–8)
- Shipped CLI: `harness-cli/src/client.js`, `harness-cli/src/run-cli.js`, `harness-cli/package.json` (v0.8.0)
- Synced bundle: `harness-cli/assets/workshop-bundle/` (do not hand-edit)

## Confidence

**High.** Requirements are clear (server + CLI + skill + docs all audited). Every call-site is enumerated. Phased rollout with a proof slice, explicit stop-gate, and coordination rules with the in-flight auth plan limits blast radius. The remaining unknowns are small and called out in-phase:

- `/api/workshop GET` facilitator-vs-participant branching (Phase 3 task).
- Exact script name for syncing `harness-cli/assets/workshop-bundle/` (Phase 7 says "verify the script name first").
- Whether auth plan's Phase 5 lands before or after this plan's Phases 2–6 (coordination rule says it doesn't matter as long as new endpoints are `[id]`-scoped).
