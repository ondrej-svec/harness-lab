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

### Decision 3 — Team check-in: append-only JSON array on the existing team payload, not a new table

**Options considered:**
- **(a) Single-string overwrite.** Status quo. Breaks the brainstorm's "the repo remembers" narrative.
- **(b) New `team_checkpoint_history` table with `(team_id, instance_id, phase_id, content, created_at)`.** Proper normalized schema. Good for querying.
- **(c) Migrate `checkpoint` to `checkpoints: Array<{ phase_id, content, written_at, written_by }>` stored as JSON on the existing team payload.** Inherits the existing JSONB storage model. No new table.

**Chosen: (c).** The existing team storage is already JSONB payload in the teams table (per the dashboard team card research). Adding an array field to the payload is a small migration compared to a new table. Query needs are modest — we never need to cross-team-aggregate check-ins; we only ever render one team's trail at a time. The JSON array is simpler and faster to ship.

**Tradeoff accepted:** Slightly worse queryability if we ever want analytics. Not a concern for the current workshop use case.

**Note:** `written_by` stores the participant name or identifier only as free text — no per-participant identity is introduced. The field is for self-accountability ("this is who on our team wrote this"), not authentication.

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

- [ ] **A1 — Build 2 split schema decision.** Write a short ADR (`docs/adr/YYYY-MM-DD-build-2-sibling-phases.md`) capturing Decision 1. Decision is "sibling phases," implemented by adding a new phase to the agenda and re-ordering Phase 9+ accordingly. No code change yet — this task is the decision doc.
- [ ] **A2 — Add new chromePreset value for team trails.** Update `dashboard/lib/types/bilingual-agenda.ts` to add a new `chromePreset` value. Naming suggestion: `team-trail` or `reflection`. Update the TypeScript union type and any switch statements that exhaustively match on chromePreset. Keep it additive — do not remove or rename existing values.
- [ ] **A3 — Team check-in append-only migration.** Update the team data model (wherever `Team.checkpoint: string` lives) to `Team.checkIns: Array<{ phaseId: string; content: string; writtenAt: string; writtenBy: string | null }>`. The migration must be backwards-compatible — read old data by wrapping the legacy string in an array with a synthetic phase id (`"legacy"`) if needed. Update `workshop-store.ts` `updateCheckpoint()` to append, not overwrite. Add a new `appendCheckIn(teamId, phaseId, content, writtenBy)` function. Keep the old function signature alive (as a wrapper that appends to the latest phase) so existing code doesn't break.
- [ ] **A4 — Team anchor field migration.** Add `Team.anchor: string | null` to the team payload. The anchor is a short label ("red brick," "number 3," "blue duck") claimed during Phase 1 team formation and persisted for the rest of the day. No UI editing yet — facilitator sets it via the admin team editor.
- [ ] **A5 — Markdown-to-inventory brief generator.** Write `scripts/content/generate-briefs-inventory.ts` that reads `content/project-briefs/locales/en/*.md`, parses the frontmatter and section headers (problem, user stories, architecture notes, done when, first step), and writes the result as `.inventory.briefs[]` in `workshop-content/agenda.json`. Bilingual: also reads Czech markdown and populates the `cs` side. Mark `cs_reviewed: false` on any brief whose English changed since the last run.
- [ ] **A6 — Wire A5 into the content pipeline.** Add `generate:briefs` to `package.json` scripts. Make `generate:content` depend on it. Make `verify:content` include brief inventory verification.
- [ ] **A7 — Tests for A2, A3, A4, A5.** Unit tests for the new migrations, new store functions, new generator. Use the existing test patterns (in-memory store, fixture seeds).

**Exit criteria for Phase A:**
- All migrations applied and tested.
- `npm run generate:briefs` produces a valid `agenda.json` inventory from markdowns.
- `npm run verify:content` still passes with the old content (no regressions).

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
- [ ] **B12 — Brief markdown revisions.** Apply the medium-depth revisions from the brainstorm to all five English brief markdowns: promote handoff test to Done-when #1, tighten problem statements, sharpen first-agent prompts. Do not add "Not in scope" sections (the brainstorm explicitly rejected these).
- [ ] **B13 — Register doc-generator in inventory.** This now happens automatically via the A5 brief generator — just ensure `doc-generator.md` exists in `content/project-briefs/locales/en/` and run `npm run generate:briefs`.
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
| **Team check-in migration breaks existing running instances.** If an instance already has team data with `checkpoint: "some string"` in the payload, the new code expecting `checkIns: array` will crash or silently drop data. | High | High | Migration code MUST read both shapes — wrap a legacy string in `[{ phaseId: "legacy", content: <string>, writtenAt: <instance.createdAt>, writtenBy: null }]`. Test this path explicitly with a fixture containing old-shape data. |
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
- [ ] A3 — Team check-in append-only migration
- [ ] A4 — Team anchor field migration
- [ ] A5 — Markdown-to-inventory brief generator
- [ ] A6 — Wire A5 into content pipeline (`generate:briefs`, `verify:content`)
- [ ] A7 — Tests for A2, A3, A4, A5

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
- [ ] B12 — Brief markdown revisions
- [ ] B13 — Register doc-generator (via A5)
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
