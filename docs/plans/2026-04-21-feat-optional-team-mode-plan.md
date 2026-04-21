---
title: "feat: optional team mode (participant-first toggle)"
type: plan
date: 2026-04-21
status: in_progress
brainstorm: docs/brainstorms/2026-04-21-optional-team-mode-brainstorm.md
confidence: medium
---

## Implementation log (2026-04-21)

Infrastructure shipped in five phased commits on `main`:

| Phase | Commit | Scope |
|---|---|---|
| 1 | `e34fc7a` | `team_mode_enabled` column + schema-drift probe + admin toggle UI + server action |
| 2 | `5dc4647` | `ProgressSubject` type, `checkpoints.participant_id` + XOR constraint, `workshop_state.participantCheckIns`, `appendParticipantCheckIn`, normalization |
| 3 | `27d1c92` | `requireParticipantScopedWrite`, `isTeamModeEnabled`, new `/api/participant/check-in` route, team-mode guards on existing team-scoped routes |
| 4 | `b3a5a23` | Participant room + form + feed mode gating; admin `PeopleSection` / `SettingsSection` / `RunSection` hide team-only surfaces |
| 5 | `ebd6b13` | Agenda generator mode parameter; participant-variant JSON artifacts; loader picks by instance mode; phases with `kind: "team"` filtered in participant variant |
| 5.4–5.8 | (this commit) | Per-field `participantVariant` override mechanism on source content types; 65 overrides authored across phases, scenes, participant moments, and project briefs; voice-rule guard test (`workshop-data.agenda-voice.test.ts`) runs green |

**Verification**
- All 555 unit tests pass (11 new voice-guard tests added). No regression in the rest of the suite. No new TS errors in touched files.
- HTTP smoke confirms the dev server boots and endpoints return correct status codes (401 unauth, 307 redirects to locale/sign-in).
- Browser-based visual validation was not performed — the user's main browser profile was not available for automation and the sign-in flow is not easily scriptable from curl. The proof-slice screenshots listed in the subjective contract still need to be captured.

**Known gaps (follow-ups, not blockers for the infrastructure):**
1. **Proof-slice screenshots** (Phase 6.1–6.3) — create an instance with `team_mode_enabled = false`, complete the participant flow in CS and EN, capture screenshots. This is a user-involved step.
2. **Memory updated** ✓ — `feedback_participant_copy_voice.md` now carries Rule 2b for the participant-mode triad alongside the existing team-mode rule, with the status note refreshed to reflect Phase 5 shipped.

---

# feat: optional team mode (participant-first toggle)

One admin-level boolean `team_mode_enabled` per workshop instance. OFF = pure participant experience (teams invisible). Architecture: `ProgressSubject` abstraction for checkpoints/progress/room; rotation + randomizer + composition history stay team-only and are hidden in off-mode.

**Confidence: medium.** Decisions are locked from brainstorm and data/auth shape is known. Open unknown: agenda copy-generation pipeline and scale of voice-review work (~220 CS+EN matches). Scope may grow if the agenda source lacks a mode-variant hook.

## Problem Statement

The workshop was designed team-first — shared repos, upfront rotation, team-level checkpoints, team progression. In practice, strict team mechanics are hard to arrange: remote participants, odd group sizes, inability to commit to rotation. Participant-mode is expected to be the common case. Currently participants without a team can't write check-ins (auth rejects), and the participant UI renders team-assuming copy in every scene.

## Target End State

When this lands:

- Facilitators can toggle `team_mode_enabled` per instance from the admin UI.
- New instances default to `team_mode_enabled = false` (participant mode). Existing instances backfill to `true` (team mode preserved).
- In participant mode: participant signs in, sees a room with no team references (CS + EN), writes a check-in, views a participant-scoped feed, advances through scenes — all without hitting a "you must be on a team" wall.
- In team mode: indistinguishable from current behavior.
- Admin team-only panels (teams section, randomizer, rotation controls) hide in participant mode.
- Both voice rules (defocus-rescue, triad naming) apply cleanly in both modes; participant mode gets its own sanctioned triad (CS `další účastník, člověk nebo agent` / EN `another participant, teammate, or agent`).

## Scope and Non-Goals

### In scope
- New boolean column on `workshop_instances`, admin toggle UI, server action
- `ProgressSubject` type + XOR schema constraint on `checkpoints`
- Participant-scoped auth helper (no team membership required)
- Participant UI gating (`participant-room-surface.tsx` and children)
- Admin UI gating (hide team-only sections in off-mode)
- Agenda copy mode-awareness (CS + EN) — strategy decided in Phase 5
- Memory update for voice rules

### Out of scope
- Per-mechanic toggles (separate switches for repo / rotation / checkpoints)
- Loose team labels in off-mode (teams are either fully on or fully invisible)
- Mid-workshop toggle when status=`running` — locked
- UI for migrating an existing team-mode workshop to participant-mode mid-flight — create a new instance instead
- A third mode beyond team / participant
- Rotation, team randomizer, composition history in participant mode — hidden, not generalized
- Backward-compat for old checkpoint shapes (breaking migration acceptable per archived plan Decision 3)

## Proposed Solution

Six phases, dependency-ordered. Phase 4 (UI) and Phase 5 (copy) can overlap once Phases 1-3 land.

1. **Instance toggle foundation** — migration + admin switch (Phase 1)
2. **`ProgressSubject` data layer** — schema XOR + types + repo updates (Phase 2)
3. **Auth fork** — participant-scoped write helper (Phase 3)
4. **UI sweep** — participant-room gating + admin panel gating (Phase 4)
5. **Copy sweep** — agenda mode-awareness in CS + EN (Phase 5)
6. **Proof slice + memory update** — end-to-end verification, voice-rule memory extended (Phase 6)

## Decision Rationale

### D1: New-instance default is FALSE; existing instances backfill to TRUE

Separate defaults because the populations have different needs. Existing instances are mid-workshop or configured for team use — flipping them breaks configuration. New instances reflect the expected common case (participant mode). Implementation: column `DEFAULT TRUE` in migration, application code passes `teamModeEnabled: false` on new-instance creation paths.

**Rejected:** uniform default TRUE (forces facilitator to opt out for common case); uniform default FALSE (breaks in-flight workshops).

### D2: Schema is nullable `team_id` + nullable `participant_id` + XOR check constraint

No polymorphic FK precedents in the codebase. Three shapes were viable:
- **Nullable `team_id` + nullable `participant_id` + XOR CHECK** ✓
- Polymorphic `(subject_type, subject_id)` columns — loses named references, requires more app-layer dispatch
- Dedicated `progress_subjects` table with FK — more tables, adds a join, unnecessary indirection

Chosen shape matches the existing "nullable `team_id` TEXT with no FK" convention (present in `participant_feedback`, `participant_poll_responses`, `rotation_signals`). XOR constraint is explicit and enforced by the database.

### D3: `ProgressSubject` is a read-time TypeScript abstraction, not a DB join

Concrete type: `type ProgressSubject = { kind: 'team'; teamId: string } | { kind: 'participant'; participantId: string }`. Lives in `lib/runtime-contracts.ts` alongside the existing `CheckpointRecord`. Code that reads/writes progress operates on `ProgressSubject` and the repository translates to the right columns.

**Rejected:** subject table with FK (over-engineered for two variants); untagged unions (loses type narrowing).

### D4: Participant-scoped auth is a new helper, not a conditional in the existing one

Create `requireParticipantScopedWrite({ instanceId, participantId })` as a sibling to `requireParticipantTeamAccess`. Routes that need to work in both modes dispatch based on `teamModeEnabled`. Keeps the team-mode helper untouched (zero regression risk for team-mode writes) and makes the participant-mode path auditable.

**Rejected:** branching inside `requireParticipantTeamAccess` (entangles modes, harder to test, adds risk to proven team-mode path).

### D5: Mid-workshop toggle is locked when `status = 'running'`

Mid-flight toggle would require data migration (check-in re-scoping), UI re-render mid-session, and audit-log complexity. The facilitator use case ("I picked the wrong mode") is covered by archiving the instance and creating a fresh one. Admin UI renders the toggle form in a disabled state when status is running, with a helper note.

### D6: Copy strategy — parallel agenda files, not runtime override layer

Agenda JSONs live in `dashboard/lib/generated/`. Given the volume (~220 matches across 2 files × 2 languages), the cleanest shape is a parallel `agenda-cs-participant.json` + `agenda-en-participant.json` generated from the same source pipeline, selected at load time by `teamModeEnabled`. This requires finding and updating the generator — flagged as a Phase 5 investigation task.

**Rejected:**
- Runtime per-key override layer — drifts; every new string needs two updates; hard to audit.
- Inline branching `{ team: "...", participant: "..." }` in JSON values — requires schema change in every agenda consumer and loses the ability to tune each mode independently.

## Assumptions

| # | Assumption | Status | Evidence / Action |
|---|---|---|---|
| A1 | Participant session alone (no team membership) carries enough identity to authorize writes | **Verified** | `participantSession.participantId` is set after Neon Auth migration; `/api/participant/feedback` already uses it without team gate |
| A2 | `checkpoints.team_id` is already nullable with no FK; safe to add nullable `participant_id` alongside | **Verified** | Schema confirmed at `2026-04-06-private-workshop-instance-runtime.sql:71-77`; `team_id TEXT` with no FK |
| A3 | Adding new column to `workshop_instances` is safe via the column-support probe pattern | **Verified** | `workshop-instance-repository.ts:213-233` already handles optional columns at runtime |
| A4 | Existing participant workshops won't break on migration | **Unverified** | Task in Phase 1: smoke-test migration against a running local instance before merge |
| A5 | Agenda source has (or can be extended with) a mode-variant hook | **Unverified** | Task in Phase 5: investigate the generator that produces `lib/generated/agenda-*.json` |
| A6 | Other team-referencing tables (`participant_feedback`, `participant_poll_responses`, `rotation_signals`) work fine with null `team_id` | **Mostly verified** | Research confirmed `feedback` and `poll` routes tolerate null `team_id` already. `rotation_signals` is team-mode-only and hidden in participant mode, so irrelevant |
| A7 | `workshop_state.teams[].checkIns` can be supplemented by a parallel `workshop_state.participantCheckIns` without breaking legacy-tolerance | **Unverified** | Task in Phase 2: add read-time normalization for older state documents lacking the new field (per 2026-04-20 schema-drift rule) |
| A8 | ~220 strings × 2 languages × voice-rule compliance can ship within a reasonable cycle | **Unverified** | Task in Phase 5: time-box first pass; budget review for carry-over if needed |

## Risk Analysis

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Agenda-generator pipeline is not easily extensible; Phase 5 blocks or balloons | Medium | High (blocks ship) | Spike investigation at start of Phase 5 before committing to timeline. Fallback: ship infrastructure + room-surface copy first; agenda copy as a follow-up release |
| R2 | Auth rewrite regresses team-mode writes | Low | High (breaks live workshops) | D4 (separate helper) keeps team path untouched. Full regression tests for team-mode writes before merge |
| R3 | Runtime state backfill — older `workshop_state` docs lack `participantCheckIns` structure | Medium | Medium (facilitator UI crash per 2026-04-20 incident) | Add read-time normalization in `workshop-store.ts` alongside existing `rotation.revealed` normalization. Regression test covers legacy shape |
| R4 | Voice rule drift in 220-string sweep; reviewer fatigue | High | Medium (ships with "team" leaks) | Automated lint: reject-list CI check flags any `tým` / `team` / `teammate` in participant-mode agenda JSON. Two-pass review (CS first, EN second). Voice review is a named Phase 5 task, not an afterthought |
| R5 | XOR constraint rejects writes where both IDs are populated by accident | Low | Medium (write fails) | Repository layer enforces XOR pre-write; error messages reference the constraint by name. Integration test covers both write paths |
| R6 | Schema-drift guard regression on the new column | Low | High (app crashes on pre-migration data) | Register `team_mode_enabled` in `loadWorkshopInstanceColumnSupport` and all query builders in the same commit as the migration |
| R7 | Facilitator tries to toggle mid-workshop | Medium | Low (confusion) | Disable toggle form when status=running; helper text explains why |
| R8 | Copy reviewer lacks Czech fluency / English nuance at same quality bar | Medium | Medium (one language ships cleaner than the other) | Dedicated review pass per language with explicit voice-rule checklist referenced |

## Constraints and Boundaries

- **Architectural:** New columns follow the `allow_walk_ins` pattern (first-class boolean, not JSONB). No polymorphic FK via new subject tables. No backward-compat shims for old checkpoint shapes.
- **Operating:** Migrations are additive only (`IF NOT EXISTS`, no DOWN). Column-support probe must know about every new column before the migration runs in production.
- **Voice:** Existing team-mode triad rule unchanged. New participant-mode triad rule parallel: CS `další účastník, člověk nebo agent` / EN `another participant, teammate, or agent`. Defocus-rescue rule applies in both modes.
- **Deploy:** Per memory, deploys go via Git push to `main` (not manual `vercel --prod`). Per memory, trunk-based — commit to `main` directly, no feature branches.
- **Release:** Default FALSE for new instances only takes effect after the migration and instance-creation code both land. Ensure both ship together or the default is TRUE during the gap.

## Subjective Contract and Preview Gate

### Target outcome
A participant in off-mode never sees any team concept on any surface in either language. A participant in on-mode has an unchanged experience. A facilitator toggling the mode sees a coherent admin UI that reflects the chosen mode immediately.

### Anti-goals
- No "team of one" fiction anywhere in data or UX.
- No `tým` / `team` / `teammate` / `parťák` strings visible in participant off-mode.
- No empty-state rendering for hidden features (rotation UI shouldn't render "no rotation" — it should not render at all).
- No settings-page explosion.

### References
- `allow_walk_ins` — pattern for boolean + radio form + server action + participant Server Component read (`access-section.tsx`, `access.ts`, `participant/page.tsx:58-65`).
- Commits `831e7d1`, `cb44fc1`, `148d576` — established voice for team-mode continuation copy.
- `workshop-instance-repository.ts:213-233` — schema-drift probe pattern.

### Anti-references
- Any JSONB settings bag for behavior flags.
- Any `return null` at the top of a component to hide it — use parent-level `{flag && <X />}` or explicit sibling renders.
- Runtime per-key copy overrides.

### Tone / taste rules
1. **Team-mode triad (unchanged):** CS `další tým, člověk nebo agent` / EN `another team, teammate, or agent`.
2. **Participant-mode triad (new sanctioned):** CS `další účastník, člověk nebo agent` / EN `another participant, teammate, or agent`.
3. **Defocus-rescue rule applies in both modes.** Forbidden: `přežije bez záchrany` / `survives without rescue`. Use: `obstojí`, `dokáže pokračovat`, `stand on its own`, `be continued`.
4. Participant-mode strings must not contain: `tým`, `týmu`, `parťák`, `team`, `teammate`, `your team`.

### Representative proof slice
One workshop instance with `team_mode_enabled = false`. One participant completes: sign-in → room view → one participant check-in → view the feed → advance one scene. Full CS, then full EN. Screenshots at each step. Zero team references.

### Required preview artifacts (before autonomous work on Phase 5 starts)
- Screenshot of participant room in team mode (CS + EN baseline)
- Screenshot of participant room in participant mode (CS + EN target) — *mockup acceptable before implementation*
- Copy table: every string that changes, with old → new per language

### Rollout rule
Ship with default FALSE for new instances only after full pipeline (migration + app code + voice review) lands on `main`. Team-mode instances carry zero risk. First real participant-mode workshop run by Ondrej before opening to broader use.

### Rejection criteria
- Any team string leaks in participant off-mode (CS or EN).
- Write attempt fails in participant mode due to missing team membership.
- Migration breaks an existing instance's current UI.
- XOR constraint violated by any code path.
- Voice review fails on participant-mode strings (either triad misapplied or defocus rule violated).

## Phased Implementation

### Phase 1 — Instance toggle foundation

**Exit criteria:** Admin UI shows and edits `team_mode_enabled`. Migration applied. Existing instances backfill TRUE, new instances default FALSE. Column support probe recognizes the new column.

### Phase 2 — `ProgressSubject` data layer

**Exit criteria:** `checkpoints` table accepts writes via either `team_id` or `participant_id` (XOR enforced). `ProgressSubject` type defined. Repositories (Neon + File) updated. Read-time normalization in `workshop-store.ts` tolerates legacy state.

### Phase 3 — Auth fork

**Exit criteria:** `requireParticipantScopedWrite` helper exists. Routes that need dual-mode auth dispatch cleanly. Team-mode write regression tests pass. Participant-mode write succeeds without team membership.

### Phase 4 — UI sweep

**Exit criteria:** Participant room surface renders cleanly in both modes. Admin hides `teams-section`, `people-randomize`, team subsections of `people-section`, rotation in `settings-section`, rotation slots in `run-section` when off. Gating follows `allowWalkIns` pattern.

### Phase 5 — Copy sweep

**Exit criteria:** Agenda source supports mode variants. `agenda-cs-participant.json` and `agenda-en-participant.json` exist (or equivalent). Selected at load time by instance mode. Both languages pass voice review against both rules.

### Phase 6 — Proof slice and memory update

**Exit criteria:** End-to-end smoke test passes in both modes. Screenshots captured. `feedback_participant_copy_voice.md` memory extended with participant-mode triad rule. Ship.

## Implementation Tasks

Tasks are dependency-ordered. Phases are sequential; within a phase, order is recommended but some tasks can interleave.

### Phase 1 — Instance toggle foundation

- [ ] **1.1** Create migration `dashboard/db/migrations/2026-04-21-team-mode-enabled.sql`: `ALTER TABLE workshop_instances ADD COLUMN IF NOT EXISTS team_mode_enabled BOOLEAN NOT NULL DEFAULT TRUE;`
- [ ] **1.2** Register column in `WorkshopInstanceColumnSupport` at `dashboard/lib/workshop-instance-repository.ts:205`; add to `IN (...)` list at line 222; set `teamModeEnabled: columns.has("team_mode_enabled")` at line 232
- [ ] **1.3** Add `teamModeEnabled: boolean` to `WorkshopInstanceRecord` at `dashboard/lib/workshop-data.ts:839-849`
- [ ] **1.4** Update `buildInstanceSelectList`, `buildCreateInstanceQuery`, `buildUpdateInstanceQuery` in `workshop-instance-repository.ts` — mirror the `allowWalkIns` blocks at lines 244, 297, 353
- [ ] **1.5** Flip new-instance creation default to `false` wherever `WorkshopInstanceRecord` is constructed for a new instance (find via grep: `templateId:` + `importedAt:` co-location)
- [ ] **1.6** Create server action `toggleTeamModeAction` in `dashboard/app/admin/instances/[id]/_actions/workshop-mode.ts` (new file); mirror `toggleWalkInsAction` at `_actions/access.ts:122-144`, including audit log
- [ ] **1.7** Decide which admin section hosts the toggle. Proposal: extend `access-section.tsx` with a "Workshop mode" sub-panel, or create a new `workshop-mode-section.tsx` in the same sections dir. Implement the chosen one with radio pair (`"true"` / `"false"`); disable when `status === "running"` with helper note
- [ ] **1.8** Wire the section into the admin instance page at `dashboard/app/admin/instances/[id]/page.tsx`; pass `teamModeEnabled` from `vm.selectedInstance?.teamModeEnabled ?? true`
- [ ] **1.9** Test: migration applies cleanly; existing instance rows read back with `teamModeEnabled: true`; new instances created via creation code default to `false`; toggle form persists the change and writes an audit entry
- [ ] **1.10** Smoke-test against a running local instance (mitigates A4)

### Phase 2 — `ProgressSubject` data layer

- [ ] **2.1** Create migration `dashboard/db/migrations/2026-04-21-checkpoints-participant-subject.sql`:
  - `ALTER TABLE checkpoints ADD COLUMN IF NOT EXISTS participant_id TEXT;`
  - `ALTER TABLE checkpoints ADD CONSTRAINT IF NOT EXISTS checkpoints_subject_xor CHECK ((team_id IS NULL) <> (participant_id IS NULL));`
  - (No index needed yet — `listCheckpoints` queries by `instance_id` only)
- [ ] **2.2** Define `ProgressSubject` type in `dashboard/lib/runtime-contracts.ts`: tagged union `{ kind: 'team'; teamId: string } | { kind: 'participant'; participantId: string }`
- [ ] **2.3** Update `SprintUpdate` / `CheckpointRecord` at `dashboard/lib/workshop-data.ts:757-762` to carry `subject: ProgressSubject` (or nullable `teamId` + `participantId` — pick whichever reads cleaner at call sites). Update all consumers
- [ ] **2.4** Update `NeonCheckpointRepository.appendCheckpoint` at `dashboard/lib/checkpoint-repository.ts:70` to dispatch on subject kind. Parity update in `FileCheckpointRepository`. Both must enforce XOR pre-write with a clear error if violated
- [ ] **2.5** Add participant-scoped progress structure to `workshop_state`. Two options — pick one during implementation:
  - **(a)** New top-level `workshop_state.participantProgress: Record<participantId, { checkIns: CheckIn[] }>` — flat, simple
  - **(b)** Generalize existing `teams[].checkIns` into `subjects[]` with a `kind` — more work, cleaner long-term
  - Recommendation: **(a)** for smaller diff; document the decision in the commit
- [ ] **2.6** Add read-time normalization in `workshop-store.ts` seed/normalize path (alongside existing `rotation.revealed` normalization at lines 654-671) to supply empty `participantProgress` for legacy state documents (mitigates R3, A7)
- [ ] **2.7** Test: checkpoint writes succeed via team subject and participant subject; XOR violation rejects; legacy workshop-state documents load without crashing

### Phase 3 — Auth fork

- [ ] **3.1** Create `requireParticipantScopedWrite({ instanceId, participantId })` in `dashboard/lib/participant-team-access.ts` (or new file `participant-scoped-access.ts`). Checks session validity and instance match; no team_members lookup
- [ ] **3.2** Create a dispatch helper `requireParticipantWriteAccess` that reads `teamModeEnabled` for the instance and routes to either `requireParticipantTeamAccess` (team mode) or `requireParticipantScopedWrite` (participant mode)
- [ ] **3.3** Update `/api/participant/teams/[teamId]/check-in/route.ts:53-63` to use the dispatch helper. In participant mode, reinterpret the write as a participant check-in (writes to `workshop_state.participantProgress[participantId].checkIns` instead of `teams[teamId].checkIns`)
  - **Open question during implementation:** should participant-mode check-ins go through the same route with a dummy `teamId` param, or should there be a separate `/api/participant/check-in` route? Decide on code clarity. If separate, old route returns 404 in participant mode
- [ ] **3.4** Update `/api/event-context/teams/[teamId]/route.ts:54-58` — team-mode only. Returns 404 in participant mode
- [ ] **3.5** Audit `/api/participant/feedback/route.ts:26` and `/api/participant/poll/route.ts:34` — they already tolerate null `teamId`; verify no code downstream crashes when `teamId` is null. Add tests if missing
- [ ] **3.6** Test: in team mode, existing writes still succeed and still reject participants without membership (regression coverage for R2). In participant mode, writes succeed without any team_members row existing

### Phase 4 — UI sweep

- [ ] **4.1** Thread `teamModeEnabled` from `dashboard/app/participant/page.tsx` (read via `getWorkshopInstanceRepository().getInstance`, mirror the `allowWalkIns` pattern at lines 58-65). Pass as prop to `ParticipantRoomSurface`
- [ ] **4.2** In `participant-room-surface.tsx`, gate team-specific sections. Concrete edits:
  - Line 156-162 (`teamLabel` key-value row): render only when `teamModeEnabled`
  - Line 259-324 (team materials section): render only when `teamModeEnabled`
  - Line 332-367 (team check-in form): render team-scoped form when `teamModeEnabled`; render new **participant check-in form** sibling when not
  - Line 369-387 (feed): `defaultScope` becomes `teamModeEnabled ? (activeParticipantTeam ? "team" : "phase") : "participant"`
  - Copy object (lines 446-574): add participant-mode variant for every team-referencing key
- [ ] **4.3** Create `ParticipantCheckInFormSolo` component (or a mode prop on the existing form) that posts to the participant-scoped write path
- [ ] **4.4** Update `ParticipantCheckpointFeed` to support a `"participant"` scope tab (filters `sprintUpdates` by `participantId`)
- [ ] **4.5** Admin section gating — each below renders only when `teamModeEnabled`:
  - `teams-section.tsx` — entire component
  - `people-randomize.tsx` — entire component
  - `people-section.tsx` lines 68-73 (`PeopleRandomize`), 94-100 (`PeopleWorkspace` — decide if roster-only view still useful), 103-108 (`TeamsSection`), 110-117 (`TeamHistoryPanel`)
  - `settings-section.tsx` line 90 (`toggleRotationAction` form)
  - `run-section.tsx` line 314 (rotation slots + rotation signals rendering)
- [ ] **4.6** Ensure admin instance page reads `teamModeEnabled` from the instance record and passes it to all section components (same path as `allowWalkIns`)
- [ ] **4.7** Visual regression check: take screenshots of admin instance page and participant room in both modes; verify no empty states, no "undefined" strings, no leaked team references
- [ ] **4.8** Test: with `teamModeEnabled=false`, `getByText(/team/i)` returns nothing on participant room (EN); equivalent grep for CS. With `teamModeEnabled=true`, pre-change behavior preserved

### Phase 5 — Copy sweep

- [ ] **5.1** **Spike:** find the agenda generator. Start from `dashboard/lib/generated/agenda-cs.json` — search for scripts, markdown source, or generator modules that output to that path. Document the pipeline. Time-box to half a day. **If pipeline is not extensible within budget, escalate: ship UI infrastructure with team-mode agenda, agenda sweep becomes a follow-up release.**
- [ ] **5.2** Based on 5.1, implement mode-variant support at the source. Target outputs: `agenda-cs-participant.json` + `agenda-en-participant.json` (parallel structure to existing files)
- [ ] **5.3** Update agenda loader (search for `agenda-cs.json` / `agenda-en.json` imports) to pick the participant variant when `teamModeEnabled=false`
- [x] **5.4** First-pass copy rewrite: every string in the participant variant that referenced team concepts. Apply both voice rules:
  - Replace team-mode triad with participant-mode triad where used
  - Preserve defocus-rescue rule
  - Remove every `tým` / `team` / `teammate` / `parťák`
  - Replace scene labels: `Formování týmů` → participant-appropriate equivalent (e.g. `Úvod do práce`); `Rotace týmů` → scene hidden or replaced with participant-mode equivalent
  - Check-in moments: "Check-in týmu" → "Tvůj check-in" / "Your check-in"
  - Build-scene copy: "Team lead staví systém" → participant-equivalent framing
- [x] **5.5** Handle `"kind": "team"` scene markers — the phase filter at generator time hides the three team-kind phases entirely in participant mode; no per-scene intervention needed. The few remaining structural `team-` identifiers (scene IDs, block IDs, `team-trail` chrome preset) are intentionally excluded from the voice guard via the `STRUCTURAL_KEYS` allow-list — they are code identifiers, not participant copy
- [x] **5.6** CS voice review pass — 65 per-field overrides applied; guard green (`tým*`, `parťák*`, `přežij*`, `záchran*` all clear in participant-mode CS)
- [x] **5.7** EN voice review pass — guard green (`team*`, `teammate*`, `your team`, `surviv*`, `rescue*` all clear in participant-mode EN)
- [x] **5.8** Voice-rule guard landed as a vitest test (`dashboard/lib/workshop-data.agenda-voice.test.ts`, mirrors `workshop-data.feedback-voice.test.ts`). Runs in the existing test suite — CI blocks on regression

### Phase 6 — Proof slice and memory update

- [ ] **6.1** Create a fresh workshop instance locally with `team_mode_enabled=false`
- [ ] **6.2** Run the proof slice: sign-in → room → participant check-in → feed → scene advance. CS first, then EN
- [ ] **6.3** Capture screenshots at each step (both languages). Attach to PR description
- [ ] **6.4** Run team-mode regression: create a second instance with `team_mode_enabled=true`; confirm current UX unchanged
- [ ] **6.5** Update `~/.claude/projects/-Users-ondrejsvec-projects-Bobo-harness-lab/memory/feedback_participant_copy_voice.md` to include the participant-mode triad rule alongside the team-mode one
- [ ] **6.6** `/compound` candidate: if `ProgressSubject` + XOR constraint pattern worked cleanly, document as a reusable pattern for future polymorphic domain concepts
- [ ] **6.7** Final commit and push to `main` (trunk-based, per repo convention). Vercel deploy triggers from Git push

## Acceptance Criteria

Ship is acceptable when ALL are true:

- [ ] New instance created via the application code path has `team_mode_enabled = false`
- [ ] Existing instances (queried after migration) have `team_mode_enabled = true`
- [ ] Facilitator can toggle `team_mode_enabled` via admin UI when `status != "running"`; form is disabled when status is running
- [ ] In `team_mode_enabled=true` mode: full participant flow works exactly as before (sign-in, room, team check-in, team-scoped feed, scene advance). No regressions observed in E2E smoke
- [ ] In `team_mode_enabled=false` mode: participant can sign in without team membership, view the room, write a participant-scoped check-in, view a participant-scoped feed, advance through scenes
- [ ] In `team_mode_enabled=false` mode, no visible text on any participant surface contains: `tým`, `týmu`, `týmy`, `parťák`, `team`, `teammate`, `team's`, `your team` (automated grep + visual check in CS and EN)
- [ ] In `team_mode_enabled=false` mode, the following admin sections do not render: `teams-section`, `people-randomize`, team subsections of `people-section`, rotation toggle in `settings-section`, rotation slots in `run-section`
- [ ] `checkpoints` table XOR constraint is active; attempting to insert with both or neither ID rejects
- [ ] Column-support probe recognizes `team_mode_enabled` (app runs against a pre-migration schema without crashing)
- [ ] Both voice rules pass review in both modes, both languages
- [ ] Memory file `feedback_participant_copy_voice.md` extended with participant-mode triad rule
- [ ] End-to-end proof slice documented with screenshots in PR

## References

- **Brainstorm:** `docs/brainstorms/2026-04-21-optional-team-mode-brainstorm.md`
- **Reference implementation pattern:** `allow_walk_ins` across `dashboard/db/migrations/2026-04-20-participant-auth.sql`, `dashboard/lib/workshop-instance-repository.ts:213-233`, `dashboard/app/admin/instances/[id]/_components/sections/access-section.tsx:150-178`, `dashboard/app/admin/instances/[id]/_actions/access.ts:122-144`, `dashboard/app/participant/page.tsx:58-87`, `dashboard/app/components/participant-identify-flow.tsx:253-268`
- **Schema-drift tolerance precedent:** `docs/solutions/infrastructure/facilitator-admin-production-state-and-schema-drift.md`
- **Prior plan (related scope):** `docs/plans/2026-04-16-feat-participant-management-and-team-formation-plan.md`
- **ADR on identity:** `docs/adr/2026-04-19-name-first-identify-with-neon-auth.md`
- **Voice rules:** memory `feedback_participant_copy_voice.md`; review doc `docs/reviews/workshop-content/2026-04-20-participant-moments-opening.md`
- **Current checkpoint data shape:** `dashboard/db/migrations/2026-04-06-private-workshop-instance-runtime.sql:71-77`, `dashboard/lib/workshop-data.ts:757-762`, `dashboard/lib/checkpoint-repository.ts`
- **Auth path to fork:** `dashboard/lib/participant-team-access.ts:31`, called from `dashboard/app/api/participant/teams/[teamId]/check-in/route.ts:53-63` and `dashboard/app/api/event-context/teams/[teamId]/route.ts:54-58`
