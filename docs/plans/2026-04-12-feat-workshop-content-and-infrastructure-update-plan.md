---
title: "feat: workshop content and infrastructure update (from brainstorm review)"
type: plan
date: 2026-04-12
status: in_progress
brainstorm: docs/plans/2026-04-12-brainstorm-workshop-agenda-content-review.md
confidence: medium
---

# Workshop Content and Infrastructure Update

Apply the decisions from the 2026-04-12 brainstorm across the workshop content, skills, CLI, dashboard, and operator docs. This is not only an `agenda.json` edit — it spans six systems and requires three database migrations, a new `chromePreset`, a new content generator, and operator-guide rewrites.

## Problem Statement

The 2026-04-12 brainstorm walked all ten phases of the Harness Lab workshop and produced ~33 reshaped scenes, five revised project briefs, a new rotation mechanic, and a new narrative spine (`Today you learn to shape the work so anyone — or any agent — can carry it` → `The Craft Underneath` → `Humans steer. Agents execute.` → rotation → `Go use it`). The brainstorm also surfaced infrastructure gaps — team check-ins overwrite instead of accumulating, participants can't edit their team card, there's no presenter chrome for showing all team trails at once, briefs and inventory drift, and two talk files are English stubs pointing at Czech sources.

Without this plan, the content changes can't be applied safely because:

- The `agenda.json` pipeline demands bilingual generation and schema-version 3 compliance. Hand-editing 212KB without a checklist will introduce `cs_reviewed` drift, invalid block types, or broken generator output.
- Several scenes (5.3, 9.3, 10.3) depend on a presenter chrome that doesn't exist yet.
- The "team card remembers the day's story" narrative is load-bearing for Phases 5, 7, 9, and 10 — and today's single-string `checkpoint` field overwrites that story.
- Participants need to write check-ins themselves, and today's API and UI are read-only from the participant side.
- The rotation mechanic is physical (scatter count-off) and needs no dashboard feature, but the resulting new team compositions have to be recorded somewhere (the team card).
- Briefs hand-written in `agenda.json` inventory drift from the richer markdown sources — a generator needs to exist before the next content update.

## Target End State

When this plan lands:

- All ten phases and the brief review interlude from the brainstorm are applied to `workshop-content/agenda.json` (both `en` and `cs` sides), with regenerated per-language views committed.
- All five project briefs are revised in `content/project-briefs/locales/en/*.md` and Czech counterparts, and the `agenda.json` inventory is generated from those markdowns as a build step (no more hand-maintained drift).
- `doc-generator` is registered as the fifth brief.
- Full English versions of `context-is-king.md` and `codex-demo-script.md` exist under `content/talks/locales/en/` (replacing the 7-line stubs).
- Team data model supports append-only check-ins across phases, plus a persistent team anchor field.
- Participants can edit their team's check-in from the `/participant` page. Edits are scoped to the participant's own team, enforced at the API layer.
- A new presenter chrome preset renders all team check-in trails on the big screen for Scenes 5.3, 9.3, and 10.3.
- `harness demo-setup` CLI command scaffolds the Phase 3 contrast demo folders reliably.
- `workshop briefs` (plural) and `workshop commitment` commands exist in the skill, backed by the CLI where live data is needed.
- The workshop-bundle shipped in `harness-cli/assets/workshop-bundle/` reflects all the above.
- `workshop-blueprint/operator-guide.md` has new sections on the silent-gate lunch practice, the rotation count-off protocol, and a pre-workshop facilitator checklist.
- The opening phase has passed a cold-read facilitator gate (inherited from the 2026-04-09 workshop-blueprint-content-excellence plan).
- `npm run verify:content`, `npm run test`, and `npm run lint` all pass.
- An internal dry-run workshop with a 4–6 person test cohort surfaced no blockers.

## Scope and Non-Goals

### In scope

- Content edits to `workshop-content/agenda.json` (both `en` and `cs`) across all 10 phases.
- Brief markdown revisions in `content/project-briefs/locales/en/` (English canonical) and their Czech counterparts.
- Full English talk files for `context-is-king.md` and `codex-demo-script.md` (+ the other two stubbed files).
- A markdown-to-inventory generator for briefs, wired into the content pipeline.
- Team data model migrations: append-only check-ins, anchor field.
- New participant-facing API route and UI for team check-in editing, with per-team authorization.
- New presenter `chromePreset` for team trail rendering, plus the associated component.
- Agenda schema decision and implementation for the Build 2 split (nested phase vs. sibling phases).
- New `harness demo-setup` CLI command with tests.
- New skill commands (`workshop briefs`, `workshop commitment`) and supporting CLI handlers if needed.
- New skill reference doc: verification ladder (tracer bullets, end-to-end tests, automated reviews, self-validation trap).
- Operator guide updates: silent-gate, rotation protocol, pre-workshop checklist.
- Workshop-bundle regeneration via `npm run sync:workshop-bundle`.
- Test updates for scene IDs, titles, and any fixtures that changed.
- Cold-read facilitator gate on the revised opening phase.

### Non-goals (explicitly out of scope)

- **Scene variable substitution engine.** Scene 6.1's `[return-time]` uses the existing instance-local scene override mechanism; the facilitator hand-edits the override on the day. No template engine.
- **Rotation algorithm dashboard feature.** The scatter count-off is physical; no computed rotation or per-participant assignment rendering.
- **Real-time SSE or WebSocket upgrade.** The existing 30-second participant polling is sufficient for check-in updates during intermezzos.
- **Per-participant identity.** Team-level identity is still the unit; commitments are stored locally in the skill, not centrally attributed to individuals.
- **New design system tokens or visual refresh.** We reuse existing chrome and typography; only the team-trail preset is new, and it can borrow from the existing `checkpoint` preset's visual vocabulary.
- **Backporting content to existing running instances.** Changes land in the blueprint; existing instances keep their imported snapshot. Only new instances (and manually-reset existing ones) get the new content.
- **Public homepage changes.** The brainstorm's scope was the facilitator/participant experience inside an instance, not the marketing surface.
- **Replacing the Czech editorial review workflow.** `cs_reviewed` flags and the existing czech-editorial-review-checklist stay. This plan regenerates Czech from revised English; it does not change how translations are authored or reviewed.

## Proposed Solution

Six phases, loosely sequenced, with clear dependencies. Phases A and E can run in parallel with each other; everything else follows the critical path `A → B → D → F`.

- **Phase A — Foundations.** Unblock everything else by making architectural decisions and landing schema migrations first. Build 2 split decision, new chromePreset, team check-in migration, anchor field, markdown-to-inventory generator.
- **Phase B — Content pipeline.** Apply every content edit from the brainstorm. Agenda scenes (en + cs), brief revisions (en + cs), full English talk files, doc-generator registration, regenerated views.
- **Phase C — Dashboard features.** Participant-editable check-in, presenter team-trail rendering. Depends on Phase A migrations.
- **Phase D — CLI and skill.** New `harness demo-setup`, new skill commands and reference docs, bundle sync. Depends on Phase B content.
- **Phase E — Operator and physical prep.** Guide updates, pre-workshop checklist, physical props documentation. Independent of other phases.
- **Phase F — Quality gates.** Tests, verification, cold-read gate, internal dry run. Depends on everything.

## Decision Rationale

### Decision 1 — Build 2 split: sibling phases, not nested

**Options considered:**
- **(a) Nest Phase 9 Intermezzo 2 inside Phase 8 Build 2.** Requires schema support for phase nesting, which doesn't exist today.
- **(b) Split Phase 8 into two sibling phases — "Build 2 · first push" (13:45–14:30) and "Build 2 · second push" (14:50–15:30) — with Phase 9 Intermezzo 2 between them.** Simpler schema, adds one phase to the day's count (10 → 11).

**Chosen: (b).** The schema currently treats phases as flat siblings with `order: number`. Option (a) would require a recursive `children` field on phases, new validation, new loader logic, new presenter selection logic. Option (b) fits the existing model — we re-number the phase order field and add one phase. The only cost is "the day has 11 phases in the schedule scene instead of 10," which is a non-issue.

**Tradeoff accepted:** The day-schedule scene (Phase 1 Scene 1.3) will list two "Build Phase 2" entries (first push / second push). This is mildly redundant visually but is the honest representation of what's happening.

### Decision 2 — Briefs generator: markdown is canonical, `agenda.json` inventory is generated

**Options considered:**
- **(a) Keep hand-maintained briefs in `agenda.json` inventory and markdown as separate documentation.** Status quo. Creates drift. Already bit us (doc-generator is orphaned from inventory).
- **(b) Make `agenda.json` inventory the canonical source and delete the markdown files.** Loses the richer structure and the ability to read briefs outside the dashboard.
- **(c) Make markdown the canonical source and generate the `agenda.json` inventory at build time.** Adds a generator script, removes the drift.

**Chosen: (c).** The markdown briefs are richer (more user stories, more architecture notes, more acceptance criteria) and are what the workshop skill already prefers as fallback (per `SKILL.md:124`). Making them canonical matches the English-canonical-Czech-reviewed architecture that's already locked for the agenda. Generating the inventory as a build step prevents drift permanently.

**Tradeoff accepted:** One new generator script, one new `npm run generate:briefs` target (or bundled into `generate:content`), one new verification check in pre-commit. Modest cost for permanent elimination of drift.

### Decision 3 — Team check-in: append-only JSON array on the existing team payload, no backwards-compat wrapping

**Options considered:**
- **(a) Single-string overwrite.** Status quo. Breaks the brainstorm's "the repo remembers" narrative.
- **(b) New `team_checkpoint_history` table with `(team_id, instance_id, phase_id, content, created_at)`.** Proper normalized schema. Good for querying.
- **(c) Migrate `checkpoint` to `checkIns: Array<{ phaseId, content, writtenAt, writtenBy }>` stored as JSON on the existing team payload.** Inherits the existing JSONB storage model. No new table.
- **(d) Keep both `checkpoint` (legacy string) and `checkIns` (array), wrap reads so old data is upgraded on load.** Preserves existing running instances.

**Chosen: (c) clean schema change, no backwards-compat wrapping.** The existing team storage is already JSONB payload in the teams table. Adding an array field to the payload is a small migration compared to a new table. Query needs are modest — we never need to cross-team-aggregate check-ins; we only ever render one team's trail at a time.

**Directive from Ondrej during implementation:** "I don't think we need to wrap any legacies and stuff. Let's make it proper." So the implementation does not carry a legacy reader. Existing seed fixtures and data files (`dashboard/data/*/workshop-state.json`, `seedWorkshopState` in `workshop-data.ts`) are updated in place to the new shape as part of the A3 task. Any running production instance with the old shape is considered expendable — it will be reset before the next workshop.

**Tradeoff accepted:** Existing running workshops with old-shape data won't load after the migration. This is acceptable because no real workshops have run yet and test instances are easily recreated from seed data.

**Note:** `writtenBy` stores the participant name or free-text identifier — no per-participant identity is introduced. The field is for self-accountability ("this is who on our team wrote this"), not authentication.

### Decision 4 — Scene 6.1 `[return-time]`: use instance-local scene override, no template engine

**Options considered:**
- **(a) Build a variable substitution engine.** `${return-time}` or `{{return-time}}` substituted at render time, with a facilitator admin UI to set variable values.
- **(b) Use the existing instance-local scene override mechanism.** Facilitator edits Scene 6.1's body directly on the day via the admin scene editor.

**Chosen: (b).** The dashboard already supports instance-local scene overrides (per the 2026-04-07 instance-lifecycle plan). Facilitators already use the scene editor UI for instance-specific tweaks. Adding a variable engine adds complexity for a single use case.

**Tradeoff accepted:** Facilitator has to open the scene editor and edit the body text on workshop day. Documented in the operator guide as part of the pre-lunch checklist.

### Decision 5 — Participant check-in editing: new API route with team-scoped auth

**Options considered:**
- **(a) Extend the existing admin `PATCH /api/admin/teams` route to also accept participant sessions.** Mixes auth models.
- **(b) New participant-facing route `PATCH /api/participant/teams/[teamId]/check-in` that requires a participant session AND verifies the requester belongs to the team.** Clean auth separation.
- **(c) Skip API changes entirely and have participants edit via a facilitator-prompted mechanism.** Defeats the whole point.

**Chosen: (b).** Clean separation between admin and participant mutation surfaces is the existing pattern (per the team card research). The new route is scoped to its own concern (appending a check-in to your own team) and reuses the existing `requireParticipantSession()` helper. Authorization check is "session.eventCode matches team.eventCode AND session.teamId === teamId."

**Tradeoff accepted:** One new route, one new Server Action or form handler in the participant-room-surface component.

### Decision 6 — Rotation algorithm: none (physical count-off)

**Already resolved in the brainstorm.** The scatter count-off is physical, runs in the room, and requires zero dashboard feature. This decision is captured here for completeness — the plan does not include any rotation-algorithm tooling, and future contributors should not try to add one without re-opening this decision.

### Decision 7 — Commitment storage: local skill notes, optional anonymous push

**Options considered:**
- **(a) Store commitments centrally in the dashboard DB attributed to individuals.** Requires per-participant identity, which we don't have.
- **(b) Store commitments team-locally on the team card.** Team is too coarse — commitments are personal.
- **(c) Store commitments on the participant's own machine via the workshop skill, optional anonymous push to a shared workshop notes channel.** Personal, local, no identity required. The skill persists on the participant's machine after the workshop, so the commitment lives with them.

**Chosen: (c).** The skill is installed on each participant's machine for the duration of the workshop (per the portable-participant-skill plan). It's the natural home for personal state. The optional anonymous push is a nice-to-have for facilitator retrospectives and does not require individual identity — commitments are aggregated, not attributed.

**Tradeoff accepted:** Facilitators don't get per-person retrospective data unless participants opt in to the anonymous push. This is a feature, not a bug — it respects participant privacy.

## Constraints and Boundaries

From past plans that must not be re-opened in this one:

- **English is canonical, Czech is a reviewed first-class locale.** All content changes go through English first; Czech is regenerated and marked with `cs_reviewed: false` until reviewed. The `cs_reviewed` flag is load-bearing for the generator.
- **Schema version stays at 3.** No breaking schema version bump. Additive changes only.
- **Block taxonomy is locked.** Use existing block types: `hero`, `rich-text`, `bullet-list`, `quote`, `steps`, `checklist`, `image`, `link-list`, `callout`, `participant-preview`. No new block types.
- **Facilitator mental model is agenda-centered.** Scene edits go through the existing control-room pattern; no new parallel editing UX.
- **Instance-local overrides stay separate from blueprint edits.** Content changes land in `workshop-content/agenda.json` (blueprint). Existing running instances retain their imported snapshot until they're reset or new instances are created from the updated blueprint.
- **The theme system is the only styling path.** New presenter chrome uses semantic tokens from `globals.css`, not hardcoded colors.
- **Opening phase is the quality proof benchmark** (2026-04-09 excellence plan). Heavy content changes to the opening must pass the cold-read facilitator gate before shipping.

## Assumptions

Each assumption classified as verified (evidence cited), unverified (needs investigation before the dependent phase starts), or risk (flagged in Risk Analysis).

| Assumption | Status | Evidence / Action |
|---|---|---|
| `workshop-content/agenda.json` is the canonical source for blueprint content | Verified | Research agent report on agenda pipeline; `generate-views.ts` reads from here. |
| `schemaVersion: 3` supports adding additional phases without migration | Verified | The phases array is flat; adding a phase is an append operation. |
| Block types `hero`, `callout`, `steps`, `checklist`, `quote`, `participant-preview` are all that brainstorm content needs | Verified | Walked the brainstorm; all block references use these existing types. |
| Existing chromePresets (`minimal`, `agenda`, `checkpoint`, `participant`) cover all brainstorm scenes except team-trail | Verified | Walked the brainstorm; only 5.3, 9.3, 10.3 need a new chrome. |
| Team data is stored as JSONB payload in the teams table | Verified | Research agent found `dashboard/db/migrations/2026-04-06-private-workshop-instance-runtime.sql`. |
| `requireParticipantSession` helper enforces event-code scoped auth | Verified | Research agent found the helper in use on GET routes. |
| Instance-local scene overrides already support editing Scene 6.1 body text | Verified | The scene-block-editor.tsx component supports editing scene body; instance-lifecycle plan documented local overrides. |
| Markdown briefs in `content/project-briefs/locales/en/` are richer than `agenda.json` inventory entries | Verified | Confirmed during brief review interlude — markdown has 5 user stories and 5 acceptance criteria per brief, inventory has 3 and 3. |
| Czech review workflow exists and is run by a native speaker | Verified | `content/czech-editorial-review-checklist.md` documents the workflow. |
| Existing tests will break when scene IDs, titles, or counts change | Unverified | **Task in Phase F1:** run `npm run test` against the new content and fix broken fixtures. |
| The workshop skill can store local commitment notes without a new skill-state mechanism | Unverified | **Task in Phase D3:** verify the `.agents/notes/` convention is honoured by Claude Code in the skill's runtime; otherwise document a fallback storage path. |
| The `harness-cli/assets/workshop-bundle/` sync script picks up new markdown files automatically | Unverified | **Task in Phase D5:** verify that adding a new brief file and running sync produces the expected bundle. |
| The `cs_reviewed` flag behavior on regeneration preserves downstream workflow | Risk | Flagged in Risk Analysis — changing English without updating Czech temporarily sets the flag to `false`, which may trigger verification failures. |
| The team checkpoint migration preserves existing data in running instances | Risk | Flagged — migrations must be backwards-compatible with string payload, not break on load. |
| Physical anchor props can be sourced for workshops with 5+ teams | Verified (trivially) | Lego bricks, numbered cards, or similar cost < $20 per workshop. |
| The rotation count-off produces evenly-distributed new teams with varying original team sizes | Verified (mathematically) | For any team size, counting 1–N within each original team then regrouping by number guarantees at most one person per original team in each new team. Uneven sizes handled with a single facilitator directive. |

## Phased Implementation

### Phase A — Foundations

Land the architectural decisions, schema migrations, and the brief generator. Everything downstream depends on this.

**Reference findings from the Session 1 codebase research** (do not re-research these):

- Team schema lives in `dashboard/lib/workshop-data.ts` around line 501 (search for `type Team = `). `checkpoint: string` is the field to replace.
- Storage is JSONB payload in the `teams` table. Migration file: `dashboard/db/migrations/2026-04-06-private-workshop-instance-runtime.sql`.
- `seedWorkshopState` in `workshop-data.ts` has example team shapes that must be updated in lockstep.
- Existing data fixtures at `dashboard/data/workshop-state.json` and `dashboard/data/sample-*/workshop-state.json` have the old `checkpoint: "..."` shape. Update these to the new shape (or delete and let them regenerate from seed — check how instance bootstrapping works).
- Test files with hardcoded `checkpoint: "string"` in team fixtures: at least `__tests__/api/admin/teams/route.test.ts` line 73. Grep for more: `grep -rn "checkpoint:" __tests__ lib/*.test.ts dashboard/data`.
- Brief markdown files live at `content/project-briefs/locales/en/*.md` (English canonical) and `content/project-briefs/*.md` (Czech source). The existing generator is `scripts/content/generate-views.ts` — study its pattern before writing the brief generator.
- Schema version is 3 (`BilingualAgenda.schemaVersion`). Additive changes only; do not bump.
- Valid `sceneType` values: `briefing`, `demo`, `participant-view`, `checkpoint`, `reflection`, `transition`, `custom`.
- Valid `chromePreset` values (after A2): `minimal`, `agenda`, `checkpoint`, `participant`, `team-trail`.
- Block types: `hero`, `rich-text`, `bullet-list`, `quote`, `steps`, `checklist`, `image`, `link-list`, `callout`, `participant-preview`.

**Verification commands run from `dashboard/`** (working directory matters — scripts resolve paths relative to `dashboard/`):

- Typecheck: `./node_modules/.bin/tsc --noEmit`
- Unit tests: `./node_modules/.bin/vitest run`
- Lint: `./node_modules/.bin/eslint .`
- Content generation + verification: `npm run verify:content` (runs `generate-views.ts --verify` against the committed per-language views)

#### A1 — Build 2 split schema decision ✅ DONE (commit 46e0da8)

ADR at `docs/adr/2026-04-12-build-2-sibling-phases.md`. No code change — the decision doc justifies splitting Phase 8 into two sibling phases around Intermezzo 2 rather than introducing phase nesting. When Phase B lands the content edit, it will add a new phase row to the `phases` array in `workshop-content/agenda.json` with `order: 9` (after the Intermezzo 2 pause) and re-number Reveal from 10 to 11.

#### A2 — Add new chromePreset value for team trails ✅ DONE (commit 46e0da8)

Added `"team-trail"` to the `PresenterChromePreset` union in `dashboard/lib/workshop-data.ts` (lines 146–151) and to the runtime `presenterChromePresets` array (lines 404–410). Also added to `presenterChromePresetOptions` in `dashboard/app/admin/instances/[id]/page.tsx` so it appears in the facilitator scene-editor dropdown.

No exhaustive switch statement on `chromePreset` exists — `deriveSceneChromePreset` in `workshop-store.ts` has a `default: return "minimal"` so new values fall through safely. Scenes set the preset explicitly; nothing derives it from `sceneType`.

Verification: `tsc --noEmit` → 0 errors. `eslint .` → 0 warnings. `vitest run` → 280 passed.

#### A3 — Team check-in append-only migration (PENDING — NEXT TASK)

**Goal:** Replace `Team.checkpoint: string` with `Team.checkIns: Array<CheckIn>` across the entire surface. Clean break — no backwards-compat wrapping per Decision 3 directive.

**New types** (in `dashboard/lib/workshop-data.ts`, near the existing `Team` type):

```ts
export type TeamCheckIn = {
  phaseId: string;
  content: string;
  writtenAt: string; // ISO 8601
  writtenBy: string | null; // free-text participant label; null for facilitator
};

export type Team = {
  id: string;
  name: string;
  city: string;
  members: string[];
  repoUrl: string;
  projectBriefId: string;
  checkIns: TeamCheckIn[]; // was: checkpoint: string
};
```

**Store surface** (in `dashboard/lib/workshop-store.ts`):

- Remove the old `updateCheckpoint(teamId, checkpoint)` function entirely. No wrapper.
- Add new `appendCheckIn(teamId: string, entry: Omit<TeamCheckIn, "writtenAt">, instanceId?: string): Promise<WorkshopState>`. Implementation calls `updateWorkshopState` and pushes a new entry onto the team's `checkIns` array with `writtenAt: new Date().toISOString()`.
- Any callers of `updateCheckpoint` need to be found and switched to `appendCheckIn`. Grep: `grep -rn "updateCheckpoint" lib app __tests__`.

**Files that touch the team shape and need updates:**

- `dashboard/lib/workshop-data.ts` — type definition, `seedWorkshopState` team entries (search for `"Anna"`, `"Tým"`, `checkpoint:`).
- `dashboard/lib/workshop-store.ts` — `updateCheckpoint` removal, `appendCheckIn` addition, any code path that reads `team.checkpoint`.
- `dashboard/lib/runtime-contracts.ts` — `TeamRecord` is a type alias for `Team`; no direct change expected but grep to confirm.
- `dashboard/app/components/participant-room-surface.tsx` — line 121 renders `team.checkpoint`; change to render the latest check-in or the full trail.
- `dashboard/app/admin/instances/[id]/page.tsx` — admin team editor form submits a `checkpoint` field; switch to posting a new check-in.
- `dashboard/app/api/admin/teams/route.ts` — mutation handler uses `updateCheckpoint`; switch to `appendCheckIn`.
- `dashboard/app/api/checkpoints/route.ts` — sprint updates API; may or may not read `team.checkpoint`; audit.
- Data files: `dashboard/data/workshop-state.json`, `dashboard/data/sample-studio-a/workshop-state.json`, `dashboard/data/sample-studio-b/workshop-state.json`, `dashboard/data/sample-lab-c/workshop-state.json`, `dashboard/data/sample-lab-d/workshop-state.json`, and any `archives.json` in those directories. Convert `checkpoint: "..."` to `checkIns: []` or a single seeded entry. For seed data, an empty array is fine — real check-ins get written at runtime.
- Test files with hardcoded team fixtures referencing `checkpoint:`. Known files from earlier grep: all test files that construct a team in `__tests__/api/admin/teams/route.test.ts`. Full list: `grep -l "checkpoint:" __tests__ lib/*.test.ts`.

**Tests to add or update (in `dashboard/lib/workshop-store.test.ts` or a new focused test file):**

1. `appendCheckIn` adds a new entry with the current timestamp.
2. `appendCheckIn` preserves existing entries (does not overwrite).
3. `appendCheckIn` throws or returns an error when `teamId` does not exist.
4. `appendCheckIn` accepts `writtenBy: null` and stores it.
5. Multiple `appendCheckIn` calls across different phase ids all show up in the final array, in insertion order.
6. Reading a fresh team from `seedWorkshopState` shows `checkIns: []` (no legacy data).

**Tests to update for the shape change** (not new logic, just fixture updates):

- `__tests__/api/admin/teams/route.test.ts` line 73: change the seeded team fixture from `checkpoint: "Původní checkpoint"` to `checkIns: []` or `checkIns: [{ phaseId: "opening", content: "Původní checkpoint", writtenAt: "2026-04-06T12:00:00.000Z", writtenBy: null }]`.
- Any test that asserts on `team.checkpoint` becomes an assertion on `team.checkIns[team.checkIns.length - 1].content` or similar.
- Grep checklist: `grep -rn "team.checkpoint\|\.checkpoint =" dashboard`.

**Verification:**

- `./node_modules/.bin/tsc --noEmit` — 0 errors.
- `./node_modules/.bin/eslint .` — 0 warnings.
- `./node_modules/.bin/vitest run` — all passing, including the new `appendCheckIn` tests.
- Manual smoke test: `npm run dev`, open the admin team editor, submit a check-in, refresh the participant view, verify it appears.

**Commit message template:**
```
Migrate Team.checkpoint to append-only checkIns array

[short description of the shape change]
[short description of the API change]
[note that fixtures and data files are updated in lockstep]
```

#### A4 — Team anchor field migration (PENDING)

**Goal:** Add `Team.anchor: string | null` to the team payload so facilitators can record a physical marker for each team during Phase 1 formation.

**Type update** (in `dashboard/lib/workshop-data.ts`):

```ts
export type Team = {
  // ... existing fields ...
  anchor: string | null; // "red brick", "numbered card 3", "blue duck"
};
```

**Files that need updates:**

- `dashboard/lib/workshop-data.ts` — type and `seedWorkshopState` (add `anchor: null` or a sample value to each seeded team).
- Data files (same list as A3) — add `anchor: null` to each team payload.
- `dashboard/app/admin/instances/[id]/page.tsx` — admin team editor form; add an `anchor` text input next to the existing fields.
- `dashboard/app/api/admin/teams/route.ts` — accept `anchor` in the POST/PATCH body.

**Tests to add:**

1. New team creation accepts and persists `anchor`.
2. Existing team update accepts and persists a new `anchor`.
3. `anchor: null` is valid and persists.

**Tests to update:**

- Any team fixture in tests needs `anchor: null` (or a sample value) added. Grep: `grep -rn "city:\s*\"" __tests__ lib/*.test.ts` to find team literals.

**Verification:** same three commands as A3.

#### A5 — Markdown-to-inventory brief generator (PENDING)

**Goal:** Replace the hand-maintained `inventory.briefs[]` in `workshop-content/agenda.json` with a generator that reads canonical English markdown from `content/project-briefs/locales/en/*.md` and reviewed Czech from `content/project-briefs/*.md`, then writes both into the agenda's inventory section.

**New file:** `scripts/content/generate-briefs-inventory.ts`

**Expected inputs:**
- `content/project-briefs/locales/en/*.md` (English canonical)
- `content/project-briefs/*.md` (Czech source)

**Expected output:**
- Writes to `workshop-content/agenda.json` at the `.inventory.briefs` path.
- Matches the existing `BilingualProjectBrief` shape from `dashboard/lib/types/bilingual-agenda.ts` (read this file to confirm the shape).

**Parser design:**
- Use plain Markdown section-header parsing (no frontmatter today). Section map:
  - `## Problem` → `problem`
  - `## User stories` → `userStories` (split bullet list)
  - `## Architecture notes` → `architectureNotes` (split bullet list)
  - `## Done when` → `acceptanceCriteria` (split bullet list)
  - `## First step for the agent` → `firstAgentPrompt` (prose)
  - Czech equivalents (`## Problém`, `## User stories`, `## Architektonické poznámky`, `## Hotovo když`, `## První krok pro agenta`) for the Czech side.
- ID derivation: the markdown filename (without extension) becomes the brief `id`. The `# Title` header becomes `title`.
- Keep the parser deterministic — same input always produces the same output, sorted by filename.

**`cs_reviewed` flag handling:**
- If the English brief's content hash changed since the last generation and the Czech side did not, set `cs_reviewed: false` on the brief inventory entry.
- Store the hash somewhere stable — inline in the generator output as a comment is fine, or in a separate lockfile like `workshop-content/.brief-hashes.json`.

**Integration:**
- Before rewriting `agenda.json`, read the current file, parse it, replace only the `inventory.briefs` section, and write it back. Preserve formatting as much as possible (use the same JSON indentation as `generate-views.ts`).
- Alternatively: treat `agenda.json` as the canonical source for non-brief content, and have the generator write briefs to a separate file that gets merged at `generate-views.ts` time. (Flag this as a design question — needs alignment with `generate-views.ts` patterns.)

**Tests (new file `scripts/content/generate-briefs-inventory.test.ts`):**

1. Parser extracts problem, user stories, architecture notes, done-when, first-agent prompt from a sample markdown file.
2. Parser handles multi-line bullet items correctly.
3. Parser produces the same output for the same input twice (deterministic).
4. Full pipeline: fixture markdown files → generator → expected JSON structure matching `BilingualProjectBrief`.
5. `cs_reviewed: false` is set when English hash changes and Czech hash does not.
6. `cs_reviewed: true` is preserved when neither side changed.

**Verification:**

- `./node_modules/.bin/tsc --noEmit` — 0 errors.
- `./node_modules/.bin/vitest run` — new generator tests pass.
- Manual run: `npx tsx scripts/content/generate-briefs-inventory.ts` from the repo root, diff the output against the current hand-maintained inventory. Expected differences: doc-generator brief gets added (it's currently orphaned), and the inventory now has 5 entries instead of 4. Content differences beyond that should match the revised briefs once Phase B applies them.

#### A6 — Wire A5 into the content pipeline (PENDING)

**Goal:** Add the brief generator to the content pipeline so it runs as part of `npm run generate:content` and `npm run verify:content` catches drift.

**Files to update:**

- `dashboard/package.json` — add `"generate:briefs": "tsx ../scripts/content/generate-briefs-inventory.ts"` to scripts. Make `generate:content` run `generate:briefs` first. Make `verify:content` diff the generated briefs inventory against the committed version.
- Root `package.json` if scripts also live there (check first).

**Tests:** none new — the A5 tests cover the generator's correctness; this task just wires it in. Verify by running `npm run generate:content` and `npm run verify:content` manually.

#### A7 — Test coverage audit for Phase A (PENDING)

**Goal:** Make sure Phase A's test coverage is complete. Not a new task list — a review pass to catch anything A3/A4/A5 missed.

**Checklist:**
- [ ] A3: `appendCheckIn` covered in at least 5 scenarios (happy path, multiple appends, not-found error, `writtenBy: null`, empty initial state).
- [ ] A3: Data file seed roundtrip test — load `seedWorkshopState`, assert every team has `checkIns: []`.
- [ ] A4: Admin form round-trip — submit anchor, verify it persists in store state.
- [ ] A5: Parser tests cover at least happy path, multi-line bullets, deterministic output, `cs_reviewed` flag transitions.
- [ ] A5: Integration test — generator output matches a frozen fixture.
- [ ] All new tests use the existing in-memory repository pattern (`setXForTests`, `MemoryXRepository` mocks).
- [ ] No new tests reference specific scene IDs or scene titles from the brainstorm content — those come in Phase B and should not couple to Phase A tests.

**Verification when A3/A4/A5 are all landed:**

```
./node_modules/.bin/tsc --noEmit  # 0 errors
./node_modules/.bin/eslint .       # 0 warnings
./node_modules/.bin/vitest run     # all green, coverage went up
```

**Exit criteria for Phase A:**
- A1 ✅ committed.
- A2 ✅ committed.
- A3, A4 migrations applied and tested, fixtures and data files updated in lockstep.
- A5 generator produces a valid `agenda.json` inventory from markdowns, deterministically.
- A6 wires the generator into the content pipeline.
- A7 coverage audit clean.
- `npm run verify:content` passes with the new pipeline.
- All three quality gates (tsc, eslint, vitest) are clean.

### Phase B — Content Pipeline

Apply every content edit from the brainstorm. This is where the bulk of the work lives.

**Note on approach:** apply English first for all content; regenerate Czech afterwards. Do not try to edit both at once — the `cs_reviewed` flag is how the workflow tracks staleness.

- [ ] **B1 — Phase 1 Opening scenes.** Apply the new framing hero, drop the Lego analogy scene, replace the room activation with the experience line + team formation scene (including the new "claim your anchor" beat), update the day schedule (Scene 1.3) with the new afternoon times, cut the old participant board scene, update the light landing beat.
- [ ] **B2 — Phase 2 "The Craft Underneath" scenes.** Rename phase. Apply all five new scenes (2.1 While we argued about prompts, 2.2 Last week it got a name + engine/chassis analogy, 2.3 How you actually build one, 2.4 Humans steer agents execute, 2.5 You've been sitting inside one all morning). Move the repo-readiness contrast out of Phase 2 (it moves to Phase 3). Move the Build 1 kickoff checklist out of Phase 2.
- [ ] **B3 — Phase 3 "Let me show you" scenes.** Rename phase. Apply all four scenes (3.1 Same prompt two repos + task drift, 3.2 Now watch it hold together, 3.3 Your toolkit same discipline + live skill install, 3.4 Your first ten minutes).
- [ ] **B4 — Phase 4 Build 1 scenes.** Apply three scenes (4.1 Clock started, 4.2 The next 65 minutes with AGENTS.md-as-map callout and holistic-verification callout, 4.3 Return to the proof).
- [ ] **B5 — Phase 5 Intermezzo 1 scenes.** Apply three scenes (5.1 Write before you speak with new question, 5.2 Your team's check-in, 5.3 The thread). Scene 5.3 uses the new `team-trail` chromePreset from A2.
- [ ] **B6 — Phase 6 Lunch scene.** Rename phase from "Lunch and handoff prep" to "Lunch." Replace both old scenes with the single "Back at [return-time]" scene. Remove all handoff-telegraphing language.
- [ ] **B7 — Phase 7 Rotation scenes.** Apply three scenes (7.1 Your repo is not yours anymore, 7.2 Line up count off walk to the anchor, 7.3 Every fresh agent session is a rotation).
- [ ] **B8 — Phase 8 Build 2 and new Build 2 second half phase.** Apply the Decision 1 sibling-phase split. The current Phase 8 becomes "Build Phase 2 · first push" (13:45–14:30). Insert a new phase after Intermezzo 2 for "Build Phase 2 · second push" (14:50–15:30). Apply Scene 8.1 kickoff, Scene 8.2 timeline with the full 6-step flow (including the mid-point pause reference), the verification callout, and the self-validation trap callout.
- [ ] **B9 — Phase 9 Intermezzo 2 scenes.** Apply three scenes (9.1 Write before you speak with the mid-point question, 9.2 Your team's check-in, 9.3 Back to the work). Update framing to mid-point pause, not endpoint.
- [ ] **B10 — New Phase 8.5 Build 2 second push scenes.** Apply at least a "timeline continuation" scene and a stuck-recovery scene (or reuse Scene 4.3 and 8.3 pattern). Minimum one scene for the phase to exist in the schema.
- [ ] **B11 — Phase 10 Reveal scenes.** Apply five scenes (10.1 Alone pairs fours all, 10.2 Show us what you built, 10.3 What I saw today, 10.4 The one thing you'll change with four storage options, 10.5 Go use it). Remove all Monday framing and all "see you on Monday" language.
- [x] **B12 — Brief markdown revisions.** Apply the medium-depth revisions from the brainstorm to all five English brief markdowns: promote handoff test to Done-when #1, tighten problem statements, sharpen first-agent prompts. Do not add "Not in scope" sections (the brainstorm explicitly rejected these).
- [x] **B13 — Register doc-generator in inventory.** This now happens automatically via the A5 brief generator — just ensure `doc-generator.md` exists in `content/project-briefs/locales/en/` and run `npm run generate:briefs`.
- [ ] **B14 — Full English versions of talk files.** Replace the 7-line stubs in `content/talks/locales/en/context-is-king.md` and `content/talks/locales/en/codex-demo-script.md` with full English translations from the Czech roots. Two more stub files exist under `content/talks/locales/en/` — identify and translate them.
- [ ] **B15 — Regenerate Czech content.** For every phase/scene/brief touched in B1–B14, regenerate the Czech side. Either retranslate directly (native speaker workflow) or mark `cs_reviewed: false` and defer Czech review as a separate follow-up task. Record which approach you take.
- [ ] **B16 — Run `npm run generate:content` and commit generated views.** Ensure `dashboard/lib/generated/agenda-en.json` and `agenda-cs.json` are regenerated and committed. `npm run verify:content` must pass.

**Exit criteria for Phase B:**
- `workshop-content/agenda.json` contains all new content for all 11 phases (original 10 + new Build 2 second push).
- All five briefs revised in markdown; inventory regenerated from markdowns via A5.
- Four stub talk files under `content/talks/locales/en/` replaced with full English content.
- Generated per-language views up to date.
- `npm run verify:content` passes.

### Phase C — Dashboard Features

Ship the presenter team-trail chrome and the participant check-in editor. Depends on Phase A migrations.

- [ ] **C1 — Participant check-in editing API.** New route `PATCH /api/participant/teams/[teamId]/check-in` that accepts `{ content: string; writtenBy?: string }`. Auth: `requireParticipantSession()` plus verification that `session.teamId === teamId`. Implementation calls `appendCheckIn()` from A3, passing the current phase id from workshop state. Reject if no current phase (workshop not active). Return the updated team card data.
- [ ] **C2 — Participant check-in editing UI.** Add an editable check-in form to `dashboard/app/components/participant-room-surface.tsx` (or a child component). Uses a Server Action or client-side fetch to the C1 route. Shows a textarea, a "Record check-in" button, inline error messaging, success acknowledgement. The form appears when the current phase is one that expects a check-in (Intermezzo 1, Build 2 first beat, Intermezzo 2). Hidden otherwise.
- [ ] **C3 — Presenter team-trail component.** New component `dashboard/app/admin/instances/[id]/presenter/team-trail.tsx` that renders all teams' check-in trails in a grid or list layout. Reads from the workshop state, iterates teams, renders each team's anchor + name + accumulated check-ins. Uses semantic tokens from `globals.css`.
- [ ] **C4 — Wire the new chromePreset.** Update the presenter page render path (`dashboard/app/admin/instances/[id]/presenter/page.tsx` and `lib/presenter-scenes.ts`) so that when `scene.chromePreset === "team-trail"` (or whatever name A2 chose), the page renders the C3 component alongside or instead of the normal scene blocks.
- [ ] **C5 — Participant board shows its own team's check-in history.** Update `participant-room-surface.tsx` to render the team's check-in history (latest first, or chronological — pick one) so participants see their own team's trail building up. Not just the current editable form.
- [ ] **C6 — Tests.** New unit tests for C1 (auth rejection on wrong team, successful append, rejection when no current phase). New snapshot tests for C3 with multiple teams. Integration test covering "participant writes check-in → it appears on presenter view."
- [ ] **C7 — Admin team anchor editor.** Minimal addition to the existing admin team management UI — a text input for the `anchor` field added in A4. Facilitator sets it during Phase 1 team formation on the day.

**Exit criteria for Phase C:**
- Participants can write check-ins from `/participant`, scoped to their own team only.
- Presenter view shows all team trails on a new chrome preset.
- Tests green.
- Manual smoke test: participant writes a check-in → refresh presenter view → check-in visible.

### Phase D — CLI and Skill Extensions

- [ ] **D1 — `harness demo-setup` command.** New handler in `harness-cli/src/run-cli.js`. Scaffolds Folder A (bare repo — project brief only, no AGENTS.md) and Folder B (harnessed repo — project brief + AGENTS.md with Goal/Context/Constraints/Done-When template + short plan + workshop skill installed). Accepts `--target <path>` flag for where to create the folders. Produces a summary on stdout. Test in `harness-cli/test/run-cli.test.js` using the memory IO and fetch stub patterns.
- [ ] **D2 — `workshop briefs` (plural) skill command.** Add a section to `workshop-skill/SKILL.md` describing the command: "List all available project briefs. Prefer `harness --json workshop briefs` for live data." Also add `handleWorkshopBriefs()` in `harness-cli/src/run-cli.js` that returns the brief list from the active instance (falling back to bundled content). Tests.
- [ ] **D3 — `workshop commitment` skill command.** Add a section to `workshop-skill/SKILL.md` describing the command: "Store a personal commitment you'll act on the next time you work with an agent. Format: 'The next time I work with an agent, the first thing I'll change is X because Y.' The skill writes it to `.agents/notes/commitment.md`." Verify the `.agents/notes/` storage convention is honoured by Claude Code at skill runtime; document an alternative path if not. No CLI backend required unless facilitator-visible aggregation is a goal (see D6).
- [ ] **D4 — Verification ladder reference doc.** New file `workshop-skill/reference.md` (or append to existing) with content on tracer bullets, end-to-end tests, automated reviews, the "holistic beats granular" principle, and the self-validation trap. Pullable via `workshop reference` skill command. Both English and Czech versions.
- [ ] **D5 — Workshop-bundle sync.** Run `npm run sync:workshop-bundle` to regenerate `harness-cli/assets/workshop-bundle/` with all the new content. Verify the bundle manifest hashes match. Commit the bundle changes.
- [ ] **D6 — (Optional) Anonymous commitment push.** If facilitators want retrospective data, add `workshop commitment --share` flag that pushes an anonymized copy to a workshop notes API endpoint. Low priority; can be deferred.

**Exit criteria for Phase D:**
- `harness demo-setup` scaffolds both folders in < 5 seconds and produces valid starting state for the contrast demo.
- `workshop briefs` lists all five briefs in the active instance (live or bundled fallback).
- `workshop commitment` writes to the documented location.
- `workshop-bundle` regenerated and committed.
- CLI tests green.

### Phase E — Operator Docs and Physical Prep

Independent of other phases — can run in parallel with B/C/D.

- [ ] **E1 — Operator guide: silent-gate practice.** Add a section to `workshop-blueprint/operator-guide.md` describing the Phase 6 (Lunch) silent-gate practice: when to walk the repos, how to identify genuinely broken ones, how to intervene quietly without framing it as a gate or failure, how to avoid surveillance-y energy.
- [ ] **E2 — Operator guide: rotation count-off protocol.** Add a section describing the Phase 7 physical scatter count-off: how to line up original teams, how to count off, how to handle uneven team sizes, how to enforce the silence rule.
- [ ] **E3 — Operator guide: pre-workshop facilitator checklist.** Add a section listing every prep item: run `harness demo-setup`, test-install the workshop skill, record the pre-recorded fallback video for Scene 3.3, pull up the project briefs, lay out team anchors + number cards, source commitment cards, verify dashboard is up, read recent Fowler / OpenAI posts to refresh Phase 2 references.
- [ ] **E4 — Physical props documentation.** Add a physical props list to the operator guide or as a separate checklist doc: anchors (Lego bricks, numbered cards, etc.), number cards for rotation (1 through max team size), commitment cards (~30 per workshop).
- [ ] **E5 — Pre-workshop Phase 2 freshness task.** Document a recurring task for the facilitator: before each workshop, re-check the Phase 2 source references (OpenAI Harness Engineering post, Fowler's harness engineering article, Willison's predictions post, Anthropic Glasswing, Gartner / Forrester predictions). The landscape moves fast; stale references undercut the talk's credibility.

**Exit criteria for Phase E:**
- Operator guide updated with three new sections (silent-gate, rotation protocol, pre-workshop checklist).
- Physical props list documented.
- Phase 2 freshness task captured.

### Phase F — Quality Gates and Dry Run

Depends on Phases A–E.

- [ ] **F1 — Cold-read facilitator gate for the opening phase.** Hand the revised Phase 1 content (all five scenes) to an experienced facilitator who was not involved in the rewrite. Have them read it cold and narrate the opening as they would run it live. If they stumble, rewrite the stumbling parts. This is inherited from the 2026-04-09 workshop-blueprint-content-excellence plan and is the flagship quality gate for opening content.
- [ ] **F2 — Update tests with new scene IDs, titles, and counts.** Run `npm run test` against the new content. Fixtures that reference hardcoded scene IDs (`talk-micro-exercise`, `build-1-milestones`, etc.) will break — update them to reference the new IDs. Tests that count phases (if any) will break because the day now has 11 phases — update them.
- [ ] **F3 — Run `npm run verify:content`.** Must pass. This validates the bilingual agenda, checks `cs_reviewed` flags, and diffs against generated views. Fix any errors before proceeding.
- [ ] **F4 — Run `npm run lint`.** Must pass.
- [ ] **F5 — Manual smoke test of the full day.** Start a new instance from the updated blueprint. Click through all 11 phases on the presenter view. Open a participant view side-by-side and verify each phase's participant surface renders correctly. Specifically verify Scenes 5.3, 9.3, 10.3 render the team-trail chrome. Write check-ins as a participant and verify they appear on the presenter trail.
- [ ] **F6 — Internal dry-run workshop.** Run a shortened version of the workshop (1–2 hours, covering Opening → Context is King → Demo → abbreviated Build 1 → Intermezzo 1 → Rotation → abbreviated Build 2 → Reveal) with 4–6 internal participants as two teams. Use real repos, real agents, real team cards. Surface anything the review missed. Log issues.
- [ ] **F7 — Fix any blocker issues surfaced in the dry run.** Iterate once if needed.
- [ ] **F8 — Schedule the first real workshop.** Only after F1–F7 are clean.

**Exit criteria for Phase F:**
- Cold-read gate passed on opening.
- All tests green.
- Verify/lint clean.
- Manual smoke test clean.
- Dry run complete, blockers resolved.
- First real workshop scheduled.

## Acceptance Criteria

This plan is done when every one of these is measurable true:

1. `workshop-content/agenda.json` contains 11 phases (was 10) and ~34 scenes (was ~33) reflecting the brainstorm's locked content. `schemaVersion: 3` unchanged.
2. `dashboard/lib/generated/agenda-en.json` and `agenda-cs.json` are regenerated and committed; `npm run verify:content` passes.
3. All five project briefs have the medium-depth revisions applied in `content/project-briefs/locales/en/*.md`. `doc-generator.md` is registered in `agenda.json` inventory via the new generator.
4. `content/talks/locales/en/context-is-king.md`, `codex-demo-script.md`, and any other `locales/en/` stub files are full English versions (not 7-line pointers).
5. New chromePreset for team trails exists in `bilingual-agenda.ts` and is used by Scenes 5.3, 9.3, 10.3.
6. Team data model supports `checkIns: Array<{phaseId, content, writtenAt, writtenBy}>` and `anchor: string | null`. Old single-string checkpoint data is readable via the migration wrapper.
7. New API route `PATCH /api/participant/teams/[teamId]/check-in` exists with team-scoped auth. Calling it from another team fails with 403.
8. Participant board shows an editable check-in form during intermezzo phases. Writing a check-in from the participant UI causes it to appear in the presenter team-trail view.
9. `harness demo-setup` CLI command exists, tested, and produces valid Folder A and Folder B when run.
10. `workshop briefs` (plural) skill command is documented in SKILL.md; live data falls back to bundled content.
11. `workshop commitment` skill command is documented; commitments write to a persistent location.
12. `workshop-skill/reference.md` contains the verification ladder reference (tracer bullets, e2e, automated reviews, self-validation trap).
13. `workshop-blueprint/operator-guide.md` has new sections for silent-gate lunch practice, rotation count-off protocol, and pre-workshop facilitator checklist.
14. `harness-cli/assets/workshop-bundle/` is regenerated with the updated content; bundle manifest is valid.
15. `npm run test`, `npm run lint`, `npm run verify:content` all pass.
16. Opening phase passed a cold-read facilitator gate with an experienced facilitator not involved in the rewrite.
17. Internal dry-run workshop with a test cohort completed without blocker issues.
18. One ADR committed at `docs/adr/YYYY-MM-DD-build-2-sibling-phases.md` capturing Decision 1.

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Czech translations lag behind English content.** Content edits are extensive; Czech review takes time. If Czech falls behind, `cs_reviewed: false` on many scenes may trigger verification failures or show untranslated content in Czech instances. | High | Medium | Either block Phase B completion on Czech review, or accept `cs_reviewed: false` state and add a separate follow-up task for Czech review with clear timelines. The generator must support the stale-flag state. Explicitly decide before starting B. |
| **Team check-in migration drops existing data.** Since we are not wrapping legacy single-string checkpoints, any existing instance with the old shape will fail to load after the migration. | Medium | Medium (accepted) | Per Decision 3 directive: no backwards compatibility. All fixtures and data files are updated in place as part of A3. Any running instance with old-shape data is expected to be reset before the next workshop. Document the expected "before first workshop, reset all instances" step in the handoff. |
| **The new chromePreset breaks exhaustive switch statements.** TypeScript's `never` checks in presenter rendering may fail to compile when a new value is added to the union. | Medium | Low | Grep for exhaustive switches on `chromePreset` after A2. Add case handlers. Let the TS compiler enforce completeness. |
| **The brief generator produces inventory that drifts from what the dashboard expects.** Hand-written inventory had subtle field ordering, optional fields, or structural quirks that the generator may not reproduce exactly. | Medium | Medium | Before A5 is complete, diff the generator output against the current hand-written inventory. Any unexpected differences are either bugs in the generator or data to preserve. Iterate until they match (minus the intentional revisions from B12). |
| **The Build 2 sibling-phase split breaks phase-count assumptions elsewhere in the code.** Something somewhere may loop `for i in 1..10` instead of using `phases.length`. | Medium | Medium | Grep for hardcoded phase counts, `.length === 10`, `slice(0, 10)`, etc. Fix found instances. Run all tests after B8 lands. |
| **Live demo fragility in Scene 3.1 and 3.3.** The contrast demo and the live skill install are brittle. A real workshop has happened when these break. | High (over multiple workshops) | Medium (per workshop) | Pre-prepared screenshots for Scene 3.1 contrast (both Folder A and B). Pre-recorded 30-second video for Scene 3.3 skill install. Both documented in the facilitator pre-workshop checklist (E3). Test the install fresh on the facilitator's machine the morning of. |
| **Opening phase cold-read gate fails.** The revised opening is substantial — a facilitator cold-reading it may find it doesn't flow. | Medium | Medium | Built into Phase F1. If the gate fails, iterate the opening content before proceeding to F6 dry run. |
| **Participant check-in UI exposed in wrong phases.** The form appears during phases that don't expect a check-in, confusing participants. | Medium | Low | Explicit phase-id allow-list in the UI component: only render the form when current phase id matches the known check-in phases (Intermezzo 1, Build 2 first beat, Intermezzo 2). Test each case. |
| **Dashboard downtime during the team-checkpoint migration.** If the migration runs against a live production database, users may see errors. | Low (single operator, small team) | Medium | Migration is additive (adds a new field, reads legacy field). No downtime expected. Still, run it during a quiet window and have a rollback query ready. |
| **Rotation count-off fails with large rooms (20+ participants).** The physical mechanic assumes teams can line up and count off quickly. A large noisy room may make this slow and chaotic. | Medium | Medium | Facilitator pre-workshop checklist (E3) includes "sketch the physical count-off on paper for this room size before the day starts." Have a contingency: if the room is too big, facilitator can pre-assign using a grid written on a whiteboard during lunch. |
| **The `.agents/notes/` storage convention for commitments doesn't actually persist on participant machines.** I assumed it does per Claude Code convention, but haven't verified for this specific skill installation path. | Medium | Low | Unverified assumption — task in D3 is to verify. If it doesn't work, fall back to "write to any location the participant picks" with the four storage options from Scene 10.4 taking over. |
| **Workshop-bundle diverges from source content.** Manual sync, easy to forget. | Medium | Medium | `npm run verify:content` should also verify bundle integrity. Add a task in A6 to include bundle verification. |
| **Tests fixate on old content details that no longer exist.** Many tests reference scene IDs, titles, or block counts that will change. | High | Low (just toil) | F2 is the dedicated fixup task. Expect 10–30 test updates. Don't be tempted to skip tests that "look hard to update" — update them. |

## Implementation Tasks (summary tracker for /work)

This is the flat task list for `/work` to consume, grouped by phase. Full context is in the phase sections above.

### Phase A — Foundations
- [x] A1 — Build 2 split ADR
- [x] A2 — New chromePreset for team trails
- [x] A3 — Team check-in append-only migration
- [x] A4 — Team anchor field migration
- [x] A5 — Markdown-to-inventory brief generator
- [x] A6 — Wire A5 into content pipeline (`generate:briefs`, `verify:content`)
- [x] A7 — Tests for A2, A3, A4, A5

### Phase B — Content Pipeline
- [ ] B1 — Phase 1 Opening scenes
- [ ] B2 — Phase 2 "The Craft Underneath" scenes
- [ ] B3 — Phase 3 "Let me show you" scenes
- [ ] B4 — Phase 4 Build 1 scenes
- [ ] B5 — Phase 5 Intermezzo 1 scenes
- [ ] B6 — Phase 6 Lunch scene
- [ ] B7 — Phase 7 Rotation scenes
- [ ] B8 — Phase 8 Build 2 first push + sibling phase split
- [ ] B9 — Phase 9 Intermezzo 2 scenes
- [ ] B10 — New Phase 8.5 Build 2 second push scenes
- [ ] B11 — Phase 10 Reveal scenes
- [x] B12 — Brief markdown revisions
- [x] B13 — Register doc-generator (via A5)
- [ ] B14 — Full English talk files
- [ ] B15 — Czech regeneration
- [ ] B16 — Run generators and commit views

### Phase C — Dashboard Features
- [ ] C1 — Participant check-in API route
- [ ] C2 — Participant check-in UI
- [ ] C3 — Presenter team-trail component
- [ ] C4 — Wire new chromePreset to presenter render
- [ ] C5 — Participant board shows own team's check-in history
- [ ] C6 — Tests for C1–C5
- [ ] C7 — Admin team anchor editor

### Phase D — CLI and Skill
- [ ] D1 — `harness demo-setup` command
- [ ] D2 — `workshop briefs` (plural) skill command
- [ ] D3 — `workshop commitment` skill command
- [ ] D4 — Verification ladder reference doc
- [ ] D5 — Workshop-bundle sync
- [ ] D6 — (Optional) Anonymous commitment push

### Phase E — Operator Docs
- [ ] E1 — Operator guide: silent-gate practice
- [ ] E2 — Operator guide: rotation count-off protocol
- [ ] E3 — Operator guide: pre-workshop checklist
- [ ] E4 — Physical props documentation
- [ ] E5 — Phase 2 freshness recurring task

### Phase F — Quality Gates
- [ ] F1 — Cold-read facilitator gate for opening
- [ ] F2 — Update tests for new content
- [ ] F3 — Run `verify:content`
- [ ] F4 — Run `lint`
- [ ] F5 — Manual smoke test
- [ ] F6 — Internal dry-run workshop
- [ ] F7 — Fix dry-run blockers
- [ ] F8 — Schedule first real workshop

## References

**Inherited from / informed by:**

- [Brainstorm: Workshop Agenda Content Review — 2026-04-12](./2026-04-12-brainstorm-workshop-agenda-content-review.md) (source of all content decisions)
- [feat: workshop content localization and canonical English authoring — 2026-04-08](./2026-04-08-feat-workshop-content-localization-and-canonical-english-authoring-plan.md) (English canonical + Czech reviewed model)
- [feat: rich facilitator agenda and presenter content — 2026-04-08](./2026-04-08-feat-rich-facilitator-agenda-and-presenter-content-plan.md) (block taxonomy, scene structure)
- [feat: facilitator room screen and presenter flow — 2026-04-08](./2026-04-08-feat-facilitator-room-screen-and-presenter-flow-plan.md) (blueprint defaults + instance overrides model)
- [feat: instance lifecycle and instance-local agenda authoring — 2026-04-07](./2026-04-07-feat-instance-lifecycle-and-instance-local-agenda-authoring-plan.md) (how blueprint → instance import works)
- [feat: control room agenda presenter unification — 2026-04-09](./2026-04-09-feat-control-room-agenda-presenter-unification-plan.md) (agenda-centered control room)
- [feat: workshop blueprint rich presenter content — 2026-04-09](./2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md) (cold-read quality gate for opening)
- [feat: workshop skill event access model — 2026-04-06](./2026-04-06-feat-workshop-skill-event-access-model-plan.md) (participant session auth model)
- [feat: portable participant skill distribution — 2026-04-08](./2026-04-08-feat-portable-participant-skill-distribution-and-workshop-ux-plan.md) (how the skill ships)

**Key code locations:**

- `workshop-content/agenda.json` — canonical bilingual blueprint (212KB)
- `dashboard/lib/types/bilingual-agenda.ts` — schema types
- `scripts/content/generate-views.ts` — agenda views generator
- `dashboard/lib/workshop-data.ts` — runtime loader, team schema
- `dashboard/lib/workshop-store.ts` — mutation surface
- `dashboard/lib/presenter-scenes.ts` — scene selection logic
- `dashboard/app/admin/instances/[id]/presenter/page.tsx` — presenter rendering
- `dashboard/app/participant/page.tsx` — participant board
- `dashboard/app/components/participant-room-surface.tsx` — participant UI (read-only today)
- `harness-cli/src/run-cli.js` — CLI entrypoint and command router
- `harness-cli/assets/workshop-bundle/` — bundled content for offline skill fallback
- `workshop-skill/SKILL.md` — skill command definitions
- `workshop-skill/reference.md` — skill reference content (extended in D4)
- `workshop-blueprint/operator-guide.md` — facilitator operations (extended in E1–E3)
- `content/project-briefs/locales/en/*.md` — canonical English briefs (revised in B12)
- `content/talks/locales/en/*.md` — canonical English talks (completed in B14)

---

## Session 1 Handoff Notes

**Session date:** 2026-04-12
**Branch:** `main` (trunk-based — all commits go directly to main per `CLAUDE.md`)
**Working directory for commands:** `dashboard/` (npm scripts resolve paths relative to this dir)

### What was completed

**A1 — Build 2 split ADR** (commit `46e0da8`)
- Decision documented at `docs/adr/2026-04-12-build-2-sibling-phases.md`
- Decision: sibling phases, not nested. Phase 8 Build 2 splits into two entries around Intermezzo 2. Reveal renumbers from 10 to 11.
- No code change in this commit — just the decision doc.

**A2 — New chromePreset for team trails** (commit `46e0da8`, same commit as A1)
- Added `"team-trail"` to `PresenterChromePreset` union in `dashboard/lib/workshop-data.ts` (lines 146–151 type, 404–410 runtime array).
- Added to `presenterChromePresetOptions` in `dashboard/app/admin/instances/[id]/page.tsx` (line 2501) so it appears in the facilitator scene-editor dropdown.
- No exhaustive switches on `chromePreset` exist in the codebase — `deriveSceneChromePreset` in `workshop-store.ts` has a `default: return "minimal"` fallback. Safe to extend.
- Intended consumers: Intermezzo 1 Scene 5.3, Intermezzo 2 Scene 9.3, Reveal Scene 10.3 (from the brainstorm). These scenes are written in Phase B.

**Bonus: pre-existing TypeScript error cleanup** (commit `405a534`)
- The baseline `tsc --noEmit` was carrying 92 errors from stale test imports and incomplete mocks when I started. User directive: "I want you to actually fix that." All 92 fixed in one commit.
- **Type re-exports added** in seven repository modules so test imports work: `audit-log-repository.ts`, `checkpoint-repository.ts`, `facilitator-auth-service.ts`, `instance-archive-repository.ts`, `monitoring-snapshot-repository.ts`, `redeem-attempt-repository.ts`, `team-repository.ts`. Each module now has `export type { X } from "./runtime-contracts";` after its internal import.
- **Mock class completeness** — added missing `hasValidSession` to `AllowFacilitatorAuthService` (5 files) and missing `deleteOlderThan` to `MemoryAuditLogRepository` (5 files), `MemoryRedeemAttemptRepository` (1 file), `MemoryMonitoringSnapshotRepository` (1 file). All stubs are no-op async functions returning `false` / void.
- **`updateAgendaItem` signature** in `dashboard/lib/workshop-store.ts` line 537–544 changed from `Pick<...>` to `Partial<Pick<...>>` because the implementation was already treating fields as optional via `?? item.X` fallbacks.
- **`app/page.test.tsx`** fixtures dropped the obsolete `token` field from `participantSession` and added required `absoluteExpiresAt`.
- **`workshop-store.test.ts`** legacy-item simulation now casts to `Partial<typeof item>` before `delete` rather than calling `delete` on required fields.
- **`catchall-route.test.ts`** now passes mock Request and context to `GET`/`POST` so the union-typed handler accepts the call.
- **`scripts/run-migrations.d.mts`** — new declaration file for the `.mjs` module so tsc can resolve it (`allowJs: false` in tsconfig).

**Plan strengthening** (this session)
- Decision 3 rewritten: no backwards-compat wrapping on the check-in migration, per your directive. Existing instances with old-shape data will need a reset before the next workshop — acceptable because no real workshops have run.
- Risk Analysis entry for "team check-in migration" updated to reflect the clean-break approach.
- Phase A tasks A3–A7 expanded with concrete file lists, test specs, verification commands, and commit templates.
- Phase A now has inline research findings so a fresh session doesn't need to rediscover the team schema location, the chromePreset values, the valid sceneTypes, or the generator pipeline.

### Current quality state (end of Session 1)

All commands run from `dashboard/`:

| Check | Result |
|---|---|
| `./node_modules/.bin/tsc --noEmit` | ✅ 0 errors |
| `./node_modules/.bin/eslint .` | ✅ 0 errors, 0 warnings |
| `./node_modules/.bin/vitest run` | ✅ 67 files, 280 passed, 2 files / 15 tests skipped (skipped count unchanged from baseline) |

### Commits in this session (on `main`)

```
405a534 Fix pre-existing TypeScript errors across test suite
46e0da8 Add Build 2 sibling-phase ADR and team-trail chromePreset
15bed5a Add brainstorm and plan for workshop content and infrastructure update
```

### What's in the working tree at handoff

Uncommitted files (this plan document only):
- `docs/plans/2026-04-12-feat-workshop-content-and-infrastructure-update-plan.md` — the plan with A1/A2 marked done and the handoff section you're reading now. Commit this before continuing with A3.

Pre-existing uncommitted files **NOT mine** (do not touch):
- `docs/plans/2026-04-10-feat-participant-page-redesign-plan.md` (modified)
- `docs/plans/2026-04-11-refactor-participant-route-separation-plan.md` (modified)
- `harness-cli/assets/workshop-bundle/bundle-manifest.json` (modified)
- `.claude/skills/workshop-facilitator/`, `.claude/skills/workshop/workshop-skill/`, `.copy-editor.lock.json` (untracked)
- `docs/reviews/workshop-content/2026-04-12-locale-segmentation-rollout.md` (untracked)

### Where to pick up in Session 2

**Next task: A3 — Team check-in append-only migration.**

Read the updated Phase A section of this plan (`Phased Implementation → Phase A → A3`) — it lists every file that touches the team shape, the new types, the new store surface, the tests to add, and the fixtures to update.

**Recommended sequence inside A3:**

1. Update the type definition in `dashboard/lib/workshop-data.ts` — add `TeamCheckIn` type, replace `checkpoint: string` with `checkIns: TeamCheckIn[]` in the `Team` type.
2. Run `./node_modules/.bin/tsc --noEmit` to get a list of every site that breaks — this is your worklist.
3. Work through the worklist file by file: `seedWorkshopState`, `workshop-store.ts` (remove `updateCheckpoint`, add `appendCheckIn`), consumers in `app/api/admin/teams/route.ts`, `app/components/participant-room-surface.tsx`, `app/admin/instances/[id]/page.tsx`, data fixtures, test fixtures.
4. Add the new `appendCheckIn` tests in `dashboard/lib/workshop-store.test.ts`. Target the 6 scenarios listed in the A3 task.
5. Re-run the three quality gates. All should be clean.
6. Commit with the template in the A3 task description.

**After A3, proceed in order: A4 → A5 → A6 → A7.** A5 is the second-biggest task after A3 and touches the content pipeline; give it its own session if context is tight.

### Open decisions carried forward from Session 1

These are captured elsewhere in the plan but worth surfacing at the handoff:

- **Phase A5 generator integration path** — does the brief generator rewrite `agenda.json` directly, or does it write a sidecar file that `generate-views.ts` merges? Design question. See the A5 task for both options. Default: write directly into `agenda.json`'s `inventory.briefs` section, preserving surrounding formatting, because `generate-views.ts` currently treats `agenda.json` as the canonical source.
- **Czech regeneration workflow in Phase B15** — either retranslate directly (needs a native Czech speaker) or mark `cs_reviewed: false` for all changed scenes and defer review as a separate workstream. Default for first session: set `cs_reviewed: false`, file a follow-up.
- **`.agents/notes/` storage path for the D3 commitment command** — unverified assumption that this convention works at skill runtime. A3 task to investigate. If it doesn't, fall back to the four-option pattern from Scene 10.4.
- **Cold-read facilitator gate for opening (F1)** — requires a human facilitator not involved in the rewrite to read the revised Phase 1 content cold. Out of scope for any AI session. Schedule separately.

### Session 1 lessons worth carrying forward

1. **Run `tsc --noEmit` early and often.** Catching type errors before commit is cheaper than fixing them in bulk later. The 92-error baseline is what happens when tests drift without the compiler's feedback.
2. **Repository modules should re-export their interface types.** The pattern `import type { X } from "./runtime-contracts"; export type { X } from "./runtime-contracts";` is idiomatic for modules that both implement and expose the interface. New repository modules added in this plan should follow the same pattern.
3. **The `dashboard/` working directory trap.** Several tools (`npx tsc`, `npm run X`) behave differently from inside `dashboard/` versus the repo root. Always run from `dashboard/`. Consider adding this to `dashboard/AGENTS.md` as a note.
4. **Commit message style.** No prefix (no `feat:`, no `fix:`). Short imperative subject. Body describes what and why. Co-authored trailer with `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`. See session 1 commits as templates.
5. **User directive on backwards compat: don't.** For this plan, clean schema migrations without legacy wrappers. Update fixtures and data files in lockstep. Existing instances with old data are expendable — reset before the next workshop.

---

*End of plan. Next session starts with A3.*
