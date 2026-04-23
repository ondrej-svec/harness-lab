---
title: "feat: minimal facilitator UI & blueprint-as-data (with CLI envelope)"
type: plan
date: 2026-04-23
status: in_progress
brainstorm: docs/brainstorms/2026-04-23-minimal-facilitator-ui-and-instance-override-model-brainstorm.md
confidence: medium
---

# feat: Minimal Facilitator UI & Blueprint-as-Data

**One-line:** Turn Harness Lab into a live cockpit with CLI-primary authoring — blueprints become runtime-editable data, the UI shrinks to what actually matters live, and the `workshop-facilitator` skill becomes the teaching envelope around the CLI. One workshop, one language.

## Problem Statement

The facilitator dashboard has grown into a multi-section admin/authoring surface that duplicates capabilities the CLI could own, while the content model itself blocks the one thing most wanted: running the same app as a full-day, half-day, or Czech workshop with no code change. Five problems need to be solved together:

1. UI does too much — agenda, scenes, teams, and settings live in the dashboard as editors, not just operations.
2. Content is not runtime-customisable — blueprint imports are hardcoded in `dashboard/lib/workshop-data.ts:1-44`; only one template exists; `startTime: "09:10"` strings block duration-based variants.
3. CLI has five capability-class gaps (per-item agenda CRUD, per-scene authoring, presenter runtime writes already covered by UI, walk-ins/grants/password/team-mode/export).
4. Facilitator-private "nodes" compete with projector content for dashboard real estate.
5. Bilingual runtime infrastructure (CS+EN parallel content) exists despite nobody running multilingual workshops.

See the full brainstorm for convergence history: `docs/brainstorms/2026-04-23-minimal-facilitator-ui-and-instance-override-model-brainstorm.md`.

## Target End State

When this plan is done, the following are all simultaneously true:

1. A facilitator pushes a half-day blueprint via `harness blueprint push ./my-half-day.json --as my-half-day`, creates an instance from it, and runs the full live ritual. No code change. No redeploy.
2. A facilitator in Prague pushes a Czech blueprint and runs a CS-only workshop. No language switch in the runtime; no parallel CS/EN content paths being maintained.
3. The dashboard facilitator view has exactly four sections (Run, People, Settings, Summary) plus the Presenter route and Device-approval page. `app/admin/instances/[id]/_components/sections/{agenda,teams,signals}-section.tsx` are deleted.
4. Run shows the whole agenda outline, every phase is jumpable, every scene is reviewable (read-only). Live-reactive writes stay. No authoring controls.
5. A new facilitator (not Ondrej) asks the `workshop-facilitator` skill "how do I run a half-day workshop?" and gets a concrete CLI flow with dry-run previews.
6. GDPR operations (consent, Art. 20 export, soft-delete, password reset, facilitator grants) are UI-primary with full CLI parity.
7. Schema: `blueprints` table exists in DB, seeded on empty from `workshop-blueprint/default.json`; `durationMinutes` is the source of truth for phase durations; `startTime` is gone from the runtime contract (kept only in generated outputs during the expand phase, removed in the contract phase).

## Scope and Non-Goals

**In scope:**
- `blueprints` table + seed-from-repo on empty
- `durationMinutes` schema change (expand → contract across two deploys per `docs/migration-policy.md`)
- CLI surface buildout: blueprint/agenda/scene/grants/walk-ins/team-mode/export commands
- UI cuts: remove agenda/teams/signals sections; fold Access into Run; slim Settings
- Run agenda outline preserved; add read-only scene preview
- `workshop-facilitator` skill expansion: CLI teaching, authoring guidance, dry-run, onboarding
- Bilingual collapse: workshop content single-language per instance; shell i18n layer kept & extensible

**Non-goals (explicit):**
- Presenter motion/transitions (shared-element morph vs route launch — this plan confirms route; morph is a later motion pass)
- Participant-surface redesign — covered by `docs/brainstorms/2026-04-19-agenda-scene-surface-split-and-lightweight-interaction-brainstorm.md`
- Team dynamic rework (assignment algorithm, rotation rules) — deferred per user direction
- Scene rail vs scene launcher UX — not resolved here
- Monetisation, multi-tenant hosting, billing
- Rich-content authoring tooling in UI — CLI + JSON file is the path
- Blueprint versioning and diff/merge UX (metadata anchors exist; semantics deferred)

## Proposed Solution

Six phases, staged around the migration policy's expand→contract rule and the dependency graph. Phases 4 and 5 run in parallel after Phase 3 completes.

```
 Phase 1  Schema foundation (expand, no behavior change)
    │
 Phase 2  Runtime switches to durationMinutes
    │
 Phase 3  CLI expand — blueprint + per-item edit commands
    │
    ├───────────────────┐
 Phase 4            Phase 5
 UI cuts +          Skill expansion
 Run redesign       (CLI envelope)
    │                   │
    └───────────────────┘
              │
 Phase 6  Bilingual collapse
    │
 Phase 7  Contract — drop startTime, retire legacy paths
```

## Constraints and Boundaries

Fixed constraints that govern every task:

- **Forward-only migrations.** `docs/migration-policy.md:7-21`. No DOWN sections. Expand → contract across at least two deploys. Migration + code ship in the same commit.
- **Filename convention.** `YYYY-MM-DD-<slug>.sql` under `dashboard/db/migrations/`. `IF NOT EXISTS` / `IF EXISTS` mandatory.
- **Backfills inline** in the same SQL file as the `ALTER`, unless >30s. A seed of one row from a bundled JSON is well under.
- **Trunk-based development.** Commit to `main`. No feature branches for this work.
- **Deploys via Git push**, not manual `vercel --prod`. `harness-lab-dashboard` deploys from commits to `main`.
- **Bundle-drift is a hard fail.** Any edit under `workshop-skill/` or `workshop-blueprint/` must be followed by `npm run sync:workshop-bundle` in the same commit; CI verifies via `verify:workshop-bundle`.
- **Shape-guard pattern for jsonb.** Use zod `.loose()` at the top-level guard + field-level normalizer with defaults + `HARNESS_RUNTIME_ALERT` on parse failure. Same pattern as `dashboard/lib/schemas/workshop-state-schema.ts:28-80`.
- **Device-auth CLI flow** must continue working throughout. All new commands use `requireFacilitatorSession` (`harness-cli/src/run-cli.js:816`).
- **Preview + commit-token** is the mandatory shape for any destructive/mutating blueprint or bulk operation. Reuse the pattern from `handleWorkshopTeamRandomize` (`run-cli.js:3285-3325`).

## Subjective Contract

Phase 4 is design-heavy (Run redesign) and touches facilitator ritual. These rules apply:

- **Target outcome:** Run feels like a live cockpit, agenda is glanceable not busy, the agenda outline answers "where are we and where can I jump" in under two seconds. Scene preview answers "did my CLI edit land" in under five.
- **Anti-goals:** Run growing any authoring affordances (inline rename, add-item, etc.). Scene preview becoming an editor. Agenda outline competing visually with the focus card.
- **References (positive):** `docs/brainstorms/2026-04-19-facilitator-ui-revamp-brainstorm.md`, `docs/facilitator-dashboard-design-rules.md`, existing `TimelineRow` implementation at `run-section.tsx:745-821`, `OutlineRail` at `_components/outline-rail.tsx:38-130`.
- **Anti-references:** `agenda-section.tsx` (754 LOC editor), `scene-block-editor.tsx`, `agenda-sheets.tsx` — the patterns we are removing.
- **Tone / taste rules:** live-reactive writes must be mid-scene fast (high contrast, single-tap, undoable). Scene preview must use low chrome — `<details>`/drawer, not a modal. Agenda outline stays at current visual weight; do not elevate it above the focus card.
- **Rejection criteria:** half-day instance still requires a redeploy; per-instance customisation requires UI; dashboard grows back an authoring section; a facilitator has to alt-tab between UI and CLI mid-scene; scene preview accidentally writes.
- **Required preview artifact (before Phase 4 autonomous `/work` starts):** a static HTML mockup or ASCII wireframe of the new Run layout showing focus card + agenda outline + scene preview drawer, reviewed by Ondrej. Failure condition: reviewer says "this doesn't feel like a cockpit" → return to planning, not implementation.
- **Representative proof slice:** push a second blueprint (`harness-lab-half-day`) via CLI, create an instance from it, run the full live ritual. If this round-trips, the model is real.
- **Rollout rule:** do not remove a UI section before its CLI equivalents exist and have been dogfooded against a real workshop run-through. The sequence is CLI-first, UI-removal-second.

## Assumptions

| Assumption | Status | Evidence / mitigation |
|---|---|---|
| Migration tool + forward-only policy + expand/contract is stable | **Verified** | 23 migrations applied; policy at `docs/migration-policy.md`; deploys fail closed on unapplied SQL via `dashboard/vercel.json` |
| jsonb shape-guard pattern scales to a second jsonb table | **Verified** | `dashboard/lib/schemas/workshop-state-schema.ts:28-80` is the pattern; `blueprints` mirrors it |
| Device-auth CLI flow handles new commands without change | **Verified** | `requireFacilitatorSession` at `run-cli.js:816` already used across 20+ handlers |
| `startTime` → `durationMinutes` swap can be made at `workshop-data.ts:1042` without contract break downstream | **Verified** | Downstream consumers read `AgendaItem.time: string`; swapping source preserves contract |
| Seed-on-empty pattern can be done inline in the creating migration | **Verified** | `docs/migration-policy.md:14` endorses inline seed; `dashboard/scripts/seed-neon-test-instance.mjs` uses the same `ON CONFLICT DO NOTHING` shape |
| Preview + commit-token (60s TTL) scales to blueprint push | **Unverified** | Existing TTL works for team-randomize preview; blueprint push may need a human to inspect 30+ scenes. Mitigation: parametrise TTL per command, default 60s, raise to 300s for blueprint ops. Task 3.4c. |
| CLI ergonomics hold up as authoring-primary for a 30-scene blueprint | **Unverified** | Inherited from brainstorm. Escape hatch: `harness blueprint push ./file.json` bulk path. Validate in practice on first real half-day instance. Task 8.2. |
| Facilitators other than Ondrej will use the skill to learn the CLI | **Weak** | Dogfood-driven guess. Accept the risk; observe on first non-Ondrej run-through. |
| Running existing instances survive blueprints table introduction | **Verified** | `workshop_state` jsonb is instance-authoritative today; new `blueprints` table does not mutate existing instances. No backfill needed for live state. |
| Copy-editor lockfile (`.copy-editor.lock.json`) paths can be renamed in the same commit as the schema change | **Verified** | 11 entries with `pathHint: phases.startTime`; rename is mechanical, committed together |
| `workshop-bundle` sync catches any drift between `workshop-skill/` source and `harness-cli/assets/workshop-bundle/` | **Verified** | `harness-cli/AGENTS.md:19,26` defines drift as hard fail; `scripts/verify-workshop-bundle.mjs` in `npm test` |

## Risk Analysis

| Risk | Severity | Mitigation |
|---|---|---|
| `blueprints` jsonb schema drift breaks live workshop reads | High | `.loose()` top-level guard + field-level normalizer + `HARNESS_RUNTIME_ALERT` on parse failure. Same shape as existing `workshop-state-schema.ts`. |
| `startTime` removal before all consumers are updated | High | Strict expand→contract: Phase 2 makes `durationMinutes` source and keeps `startTime` as legacy output; Phase 7 removes `startTime` only after two clean deploys with no consumers. Blast-radius list in plan (see Phase 2.1). |
| CLI preview TTL too short for human-reviewed blueprint push | Medium | Parametrise TTL per command; default 60s, blueprint ops 300s. Document in help text. |
| Workshop-bundle drift between source and bundled skill causes CI fail mid-merge | Medium | `npm run sync:workshop-bundle` is a pre-commit habit. Add to Phase 5 task list explicitly. |
| Phase 4 UI cuts ship before Phase 3 CLI is complete → capability regression | High | Sequence gate: Phase 4 exit criterion requires Phase 3 fully landed AND a dogfooded workshop run. No ambiguity. |
| Bilingual collapse (Phase 6) breaks an upcoming Czech workshop | High | If a Czech workshop is scheduled during Phase 6, the CS blueprint must be pushed via CLI and validated before retiring the runtime toggle. Acceptance criterion in Phase 6. |
| Read-only `SceneStageRail` drifts from authoring version then diverges | Low | Strip to a new component `ScenePreviewRail` that shares types only. Do not keep a flag-based dual-mode component. |
| Dashboard build-time blueprint imports (`workshop-data.ts:1-44`) remain and silently shadow DB | Medium | Phase 2 retires the build-time import; generator instead emits a seed JSON consumed only by the migration. Test: `getBlueprintAgenda` deleted; callers updated. |
| Forward-only migration applied to prod but rollback needed | Medium | Policy forbids rollback migrations. Mitigation: expand phase is additive-only; if bad, a follow-up expand migration corrects. No destructive writes until contract phase. |
| A running live workshop during deploy gets state drift | Medium | Expand migrations are backward-compatible. Phase 7 contract only runs during a quiet window (no active instance). Instance lifecycle check in deploy runbook. |

## Phased Implementation

### Phase 1 — Data model foundation (expand, no behavior change)

**Goal:** Schema exists, seeded. No behavior changes yet.

- [x] **1.1** Write migration `dashboard/db/migrations/2026-04-23-blueprints-table.sql` — create `blueprints` table: `id text primary key, name text unique not null, version integer not null default 1, body jsonb not null, metadata jsonb not null default '{}'::jsonb, language text not null, team_mode boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()`. Use `IF NOT EXISTS`.
- [x] **1.2** In the same migration, inline seed the `harness-lab-default` row: `INSERT INTO blueprints (id, name, body, language, team_mode) VALUES ('harness-lab-default', 'harness-lab-default', $bundled_json, 'en', true) ON CONFLICT (id) DO NOTHING;` — where `$bundled_json` is the contents of the new `workshop-blueprint/default.json` (see 1.4).
- [x] **1.3** Add `BlueprintRecord` zod schema at `dashboard/lib/schemas/blueprint-schema.ts`. Top-level `.loose()` guard; field-level normalizer with defaults; `HARNESS_RUNTIME_ALERT` on parse failure. Mirror `workshop-state-schema.ts:28-80`.
- [x] **1.4** Produce `workshop-blueprint/default.json` as the canonical seed — the current full-day EN agenda distilled into the new schema. Schema: `{ name, language, teamMode, phases: [{ id, label, durationMinutes, startTime (legacy), scenes: [...], goal, roomSummary, prompts, watchFors, checkpointQuestions }] }`. Both `durationMinutes` and `startTime` present during expand.
- [x] **1.5** Add `BlueprintRepository` at `dashboard/lib/blueprint-repository.ts`, two implementations behind `HARNESS_STORAGE_MODE` matching `workshop-state-repository.ts:193`. Methods: `list()`, `get(id)`, `put(record)` (upsert), `delete(id)`, `fork(sourceId, newId, newName)`.
- [x] **1.6** API routes under `dashboard/app/api/admin/blueprints/` — GET list, GET by id, POST upsert, POST fork, DELETE. `requireFacilitatorRequest` gate.
- [x] **1.7** Unit tests for repository + routes (zod edge cases, conflict, missing, large body).
- [x] **1.8** Add `BlueprintListResponse`/`BlueprintShowResponse` types; wire into `harness-cli/src/client.js` (list/get only; write comes in Phase 3).

**Exit criteria:**
- Migration applied on preview; `harness-lab-default` row present and parses clean.
- `GET /api/admin/blueprints` returns the seeded row.
- No behavior change in running workshops; old build-time blueprint path still used by runtime.

---

### Phase 2 — Runtime switches to `durationMinutes`

**Goal:** Runtime computes `AgendaItem.time` from `instance.startAt + Σ durations`. `startTime` becomes legacy output only.

- [x] **2.1** Update `dashboard/lib/workshop-data.ts:1042` — change `time: phase.startTime` to derive from `instance.startAt` + cumulative `durationMinutes`. Fall back to `phase.startTime` when `durationMinutes` missing (defensive). Add helper `computeAgendaItemTime(phases, index, instanceStartAt)`.
- [x] **2.2** Update `dashboard/lib/workshop-data.ts:108` type `WorkshopBlueprintPhase` — add `durationMinutes: number`, keep `startTime?: string`.
- [x] **2.3** Update `dashboard/lib/types/bilingual-agenda.ts:186` — same additive change.
- [x] **2.4** Update `scripts/content/generate-views.ts:134, 285` — generator computes and emits both `durationMinutes` and `startTime` per phase. `durationMinutes` is source; `startTime` derived for legacy consumers.
- [x] **2.5** Regenerate `dashboard/lib/generated/agenda-{cs,en,cs-participant,en-participant}.json`, `workshop-content/agenda.json`, `workshop-blueprint/agenda.json`, and bundle sync (`npm run sync:workshop-bundle`).
- [/] **2.6** CLI fallback chain at `run-cli.js:244` already handles durationMinutes-bearing phases correctly (derived time flows through as phase.startTime at the runtime boundary); revisit in Phase 7 contract when startTime is removed.
- [/] **2.7** CLI tests unchanged — the expand keeps startTime as source for the CLI pathway. Revisit in Phase 7 contract.
- [/] **2.8** `.copy-editor.lock.json` unchanged — both startTime and durationMinutes are present during expand; pathHints stay valid.
- [x] **2.9** Existing instance jsonb rows continue to parse — the `.loose()` shape guard at `workshop-state-schema.ts:45` already absorbs unknown fields. Verified by the full test suite passing (813 tests) with the type additions.

**Exit criteria:**
- New instance created with the seeded blueprint shows wall-clock times derived from `durationMinutes`, not `startTime`.
- Changing `durationMinutes` on the blueprint (test) shifts downstream wall-clock times correctly across all phases.
- All existing instances still load and display without warnings.
- `npm test` passes including `verify:workshop-bundle`.

---

### Phase 3 — CLI expand: blueprint and per-item edit commands

**Goal:** Every authoring task is possible via CLI. No UI change yet.

- [ ] **3.1** Add client methods to `harness-cli/src/client.js`:
  - `listBlueprints()`, `getBlueprint(id)`, `upsertBlueprint(record)`, `forkBlueprint(sourceId, newId, newName)`, `deleteBlueprint(id)`
  - `agenda.add(instanceId, body)`, `agenda.edit(instanceId, phaseId, patch)`, `agenda.move(instanceId, phaseId, newIndex)`, `agenda.remove(instanceId, phaseId)`
  - `scene.add(instanceId, phaseId, body)`, `scene.edit(instanceId, sceneId, patch)`, `scene.move(instanceId, sceneId, newIndex)`, `scene.remove(instanceId, sceneId)`, `scene.setDefault(instanceId, sceneId)`, `scene.toggleEnabled(instanceId, sceneId)`
  - `instance.set(instanceId, patch)` for `teamMode`, `language`, `walkIns` (thin wrapper over existing update).
  - `grants.list(instanceId)`, `grants.add(instanceId, email, role)`, `grants.revoke(instanceId, email)`
  - `participants.export(instanceId, participantId)` (returns Art. 20 JSON)
- [ ] **3.2** Add/verify API routes:
  - `POST /api/admin/blueprints/:id`, `DELETE /api/admin/blueprints/:id`, `POST /api/admin/blueprints/:id/fork` (Phase 1 covers some)
  - `POST/PATCH/DELETE /api/admin/instances/:id/agenda/...` — some exist at `dashboard/app/admin/instances/[id]/_actions/agenda.ts`; wrap in API endpoints callable by CLI
  - `POST/PATCH/DELETE /api/admin/instances/:id/scenes/...` — wrap `_actions/scenes.ts`
  - `GET/POST/DELETE /api/admin/instances/:id/grants` — wrap `_actions/access.ts:82-118`
  - `GET /api/admin/instances/:id/participants/:pid/export` already exists; confirm CLI-callable
  - `POST /api/admin/instances/:id` patch accepts `teamMode`, `language`, `walkIns`
- [ ] **3.3** Add dispatch blocks in `harness-cli/src/run-cli.js` before the terminal `printUsage(io, ui); return 1;` at line 3721:
  - `blueprint list|show|push|fork|rm` — handlers with `requireFacilitatorSession` + client calls
  - `agenda add|edit|move|remove` — handlers taking `<instance> <phase-id-or-index>` and flag-driven patch
  - `scene add|edit|move|remove|default-set|toggle` — handlers for per-surface body edits (flags: `--body-room`, `--body-participant`, `--notes`)
  - `instance set` — with `--team-mode`, `--language`, `--walk-ins` flags (register in `booleanFlags` Set at line 21)
  - `grants list|add|revoke` — with `--role owner|operator|observer`
  - `participant export` — with `--out <file>` (alias for existing JSON endpoint)
- [ ] **3.4** Add two-step preview + commit-token to high-blast commands:
  - `blueprint push` — `--preview` returns a commit token and diff vs existing blueprint; `--commit-token <token>` commits.
  - `blueprint fork` — same pattern.
  - `scene move|remove` — `--preview` shows before/after ordering; `--commit-token` commits.
  - TTL: default 60s; blueprint ops raise to 300s via `BLUEPRINT_PREVIEW_TTL_MS`. Register `BLUEPRINT_PREVIEW_TTL_MS` in `harness-cli/src/config.js` or its equivalent.
  - Mirror the shape of `handleWorkshopTeamRandomize` at `run-cli.js:3285-3325`.
- [ ] **3.5** Update `printUsage(io, ui)` at `run-cli.js:330-447` — add `ui.section("Blueprint")`, `ui.section("Agenda")`, `ui.section("Scene")`, `ui.section("Grants")` blocks. Extend existing sections for `instance set`, `participant export`.
- [ ] **3.6** Tests in `harness-cli/test/` — mirror `run-cli-participants.test.js`:
  - `run-cli-blueprint.test.js` — list/show/push/fork/rm + preview+commit path
  - `run-cli-agenda.test.js` — add/edit/move/remove
  - `run-cli-scene.test.js` — add/edit/move/remove + preview+commit for move
  - `run-cli-grants.test.js` — list/add/revoke
  - `run-cli-instance-set.test.js` — team-mode, language, walk-ins
  - `run-cli-participant-export.test.js` — JSON round-trip
- [ ] **3.7** Run `npm test` including `verify:workshop-bundle`.

**Exit criteria:**
- `harness blueprint push ./test-half-day.json --as test-half-day --preview` prints a commit token and a structural diff vs the seeded `harness-lab-default`.
- `harness blueprint push ... --commit-token <t>` creates the blueprint row. `harness instance create --blueprint test-half-day` produces a working instance.
- `harness agenda edit <instance> <phase-id> --duration-minutes 45` changes the phase duration and all downstream wall-clock times shift.
- All six test files green.
- CLI authoring flow dogfooded against a fresh test instance end-to-end.

---

### Phase 4 — UI cuts and Run redesign (parallel with Phase 5)

**Goal:** Dashboard has four sections + Presenter + Device. Run shows read-only agenda outline + scene preview. Authoring UI is deleted.

- [ ] **4.1** **Preview artifact first.** Produce a static HTML mockup or ASCII wireframe of the new Run layout (focus card + agenda outline + scene-preview drawer). Reviewed by Ondrej. No implementation starts until this lands. Failure: back to planning, not implementation.
- [ ] **4.2** Create `dashboard/app/admin/instances/[id]/_components/scene-preview-rail.tsx` — read-only variant of `SceneStageRail`. Strip: `updateSceneField`, `movePresenterScene`, `removePresenterScene`, `togglePresenterSceneEnabled`, `setDefaultPresenterScene`, `AddSceneRow`. Keep: tile navigation, stage render of per-surface bodies, selected-scene label card (cloned from `agenda-section.tsx:236-241`). Share types only; no flag-based dual-mode.
- [ ] **4.3** Wire `ScenePreviewRail` into `run-section.tsx` — new `<details>` drawer under the focus card, or adjacent column on wide viewports. Respect tone rules (low chrome, non-modal).
- [ ] **4.4** Keep Run's live-reactive writes untouched — verify all of the following remain: `setParticipantMomentOverrideAction`, `clearParticipantMomentOverrideAction`, `resetActivePollAction`, `promoteParticipantFeedbackAction`, `HandoffMomentCard` (rotation), `addCheckpointFeedAction`, `completeChallengeAction`, per-row and hero `setAgendaAction`.
- [ ] **4.5** Fold Access into Run header:
  - Event code + "rotate code" button visible in Run header (migrate from `sections/access-section.tsx`)
  - Walk-ins toggle visible in Run header (migrate from `_actions/access.ts:149`)
- [ ] **4.6** Slim Settings section `sections/settings-section.tsx`:
  - Keep: `endWorkshop`, facilitator-grants list + add/revoke (migrate from `sections/access-section.tsx:82-118`), instance read-only metadata (blueprint name/version, create date, language, team-mode state)
  - Remove: `resetWorkshop`, `archiveWorkshop`, `changePassword`, `toggleTeamMode` (all move to CLI or auth provider)
- [ ] **4.7** Update `dashboard/lib/admin-page-view-model.ts:4` — section union becomes `"run" | "people" | "settings" | "summary"`. Remove `"access"`, `"agenda-edit"`, `"agenda-add"`, `"scene-edit"`, `"scene-add"`.
- [ ] **4.8** Delete authoring surfaces:
  - `dashboard/app/admin/instances/[id]/_components/sections/agenda-section.tsx`
  - `dashboard/app/admin/instances/[id]/_components/sections/teams-section.tsx`
  - `dashboard/app/admin/instances/[id]/_components/sections/signals-section.tsx`
  - `dashboard/app/admin/instances/[id]/_components/sections/access-section.tsx` (folded; delete file)
  - `dashboard/app/admin/instances/[id]/_components/sheets/agenda-sheets.tsx`
  - `dashboard/app/admin/instances/[id]/_components/sheets/agenda-sheet-overlays.tsx`
  - `dashboard/app/admin/instances/[id]/_components/scene-block-editor.tsx`
  - `dashboard/app/admin/instances/[id]/_actions/operations.ts`
  - Authoring paths in `_actions/agenda.ts` (keep `setAgendaAction` for "move live here" nav; remove add/edit/move/remove actions)
  - Authoring paths in `_actions/scenes.ts` (remove entirely — CLI owns)
  - Authoring paths in `_actions/teams.ts` (remove repo/members/name registration; assign/unassign/randomize move to `_actions/participants.ts` alongside drag-drop)
- [ ] **4.9** Update drag-drop team assignment — confirm `people-section.tsx` + `people-randomize.tsx` continue to cover what `teams-section.tsx` previously provided for live assignment.
- [ ] **4.10** Update `OutlineRail` (`_components/outline-rail.tsx:77-122`) — remove `"access"` and any retired section entries; keep `"run" | "people" | "settings" | "summary"`.
- [ ] **4.11** Update `dashboard/app/admin/instances/[id]/page.tsx` — remove dead section routes.
- [ ] **4.12** Update `docs/facilitator-dashboard-design-rules.md`, `docs/dashboard-surface-model.md`, `docs/facilitator-control-room-design-system.md` — new four-section set (Run/People/Settings/Summary) with agenda-read-in-Run. Replace the Apr-19 Run/People/Access/Settings entry.
- [ ] **4.13** Typecheck, lint, test, manual run-through of live-reactive writes in a test instance.

**Exit criteria:**
- Preview artifact approved before implementation started.
- Four sections visible; three retired sections return 404 or redirect to Run.
- Run shows agenda outline + jump-to-phase + scene preview.
- All live-reactive writes still function (manual test: rotate signal, complete challenge, promote feedback, override participant moment, reset poll).
- No authoring affordance reachable from any dashboard route.
- Phase 3 CLI has been dogfooded for at least one full workshop run-through before Phase 4 ships (gate).

---

### Phase 5 — `workshop-facilitator` skill expansion (parallel with Phase 4)

**Goal:** Skill becomes the teaching and dry-run envelope around the CLI.

- [ ] **5.1** Rewrite `workshop-skill/SKILL-facilitator.md` structure. Keep existing frontmatter; add H2 sections:
  - **CLI Teaching** — NL intent → `harness` command table + "what will happen" explanation template.
  - **Blueprint Authoring Guidance** — step-by-step blueprint creation (language, team mode, phases with durations, scenes per phase, participant/room/facilitator bodies per scene).
  - **Onboarding** — "how do I run a half-day workshop?" end-to-end flow with concrete CLI calls.
  - **Dry-Run & Explain** — documented use of `--preview` + `--commit-token`; when to prefer preview; reading the diff output.
  - **UI ↔ CLI Cross-References** — for each capability, which surface owns it (table form).
- [ ] **5.2** Add NL→command translation examples for the top 15 tasks (duration edit, phase add, scene body change, team-mode toggle, instance create with custom blueprint, participant export, grants add/revoke, event code rotation, walk-ins toggle, etc.). Each example shows: NL question → concrete `harness` command → expected output shape.
- [ ] **5.3** Add "What will happen" explanation patterns. Template: `<action>` → `<expected changes>` → `<downstream effects>` → `<rollback path>`. Applied per command family.
- [ ] **5.4** Add guardrails and anti-patterns section — explicit "skill never reads local CLI session files" (per `SKILL-facilitator.md:222-223`), "skill never improvises authenticated fetches", "skill always shells out to `harness --json` for live state".
- [ ] **5.5** Run `npm run sync:workshop-bundle`; verify `verify:workshop-bundle` passes (drift = hard fail per `harness-cli/AGENTS.md:19,26`).
- [ ] **5.6** Dogfood: ask the skill as a new facilitator would — "I want to run a half-day Czech workshop for 12 people." Capture any gaps and fix before closing phase.
- [ ] **5.7** Commit the sync'd bundle in the same commit as the skill change (policy requirement).

**Exit criteria:**
- A new facilitator (simulated) can go from zero to running a half-day workshop using only the skill.
- All 15 NL→command examples round-trip (skill suggests the right command; command works).
- Bundle sync clean; CI green.

---

### Phase 6 — Bilingual collapse

**Goal:** Workshop content is single-language per instance. Shell i18n kept. Runtime CS+EN parallel content retires.

- [ ] **6.1** Produce a Czech blueprint file `workshop-blueprint/default-cs.json` (translated from the EN default) if/when needed for a scheduled Czech workshop. Otherwise Phase 6 only sets up the mechanism.
- [ ] **6.2** Update generator `scripts/content/generate-views.ts` — stop emitting paired `agenda-cs.json` + `agenda-en.json` for workshop content. Single `agenda.json` per blueprint instance, in the blueprint's language.
- [ ] **6.3** Runtime: `dashboard/lib/workshop-data.ts:34-44` `getBlueprintAgenda(contentLang, agendaMode)` retires. Replaced by blueprint-specific read. `contentLang` parameter scoped to shell chrome only.
- [ ] **6.4** Participant-facing surfaces read blueprint language from the instance; no runtime flip.
- [ ] **6.5** Shell i18n layer retained (`dashboard/lib/i18n/...` or equivalent). Chrome strings remain EN+CS; fork can add locales by dropping a file.
- [ ] **6.6** Retire `dashboard/lib/generated/agenda-{cs,en,cs-participant,en-participant}.json` — replaced by blueprint-resolved content. Generator scripts updated.
- [ ] **6.7** Tests verify: creating an EN blueprint and an EN instance; creating a CS blueprint and a CS instance; both run independently.
- [ ] **6.8** Update `docs/workshop-content-language-architecture.md` to reflect the new model.

**Exit criteria:**
- No code path in the runtime references CS+EN parallel agenda content.
- Shell still switches EN/CS without affecting the running workshop's language.
- If a Czech workshop is scheduled in the next two weeks, it runs on a CS blueprint via the new pipeline.

---

### Phase 7 — Contract: drop `startTime`, retire legacy

**Goal:** Clean schema. No legacy paths. Ship after Phase 6 has been stable for at least two deploys with no `startTime` consumers.

- [ ] **7.1** Verify no code path reads `phase.startTime` — grep the full tree, confirm every hit is in tests, historical docs, or legacy file comments.
- [ ] **7.2** Update `WorkshopBlueprintPhase` type — remove `startTime?: string`. Update `BilingualPhase` similarly.
- [ ] **7.3** Update generator to stop emitting `startTime`.
- [ ] **7.4** Regenerate all JSON outputs; sync bundle.
- [ ] **7.5** Update CLI tests to drop `startTime` from fixtures.
- [ ] **7.6** Update `.copy-editor.lock.json` — remove stale `phases.startTime` entries.
- [ ] **7.7** Run `npm test` + `verify:workshop-bundle`.

**Exit criteria:**
- Zero references to `startTime` outside of git history.
- All tests green.

---

## Acceptance Criteria (overall)

Measurable and testable. When all are true, the plan is done:

- [ ] `harness blueprint push ./my-half-day.json --as my-half-day` (with `--preview` → `--commit-token`) creates a second blueprint in the DB.
- [ ] `harness instance create --blueprint my-half-day` creates an instance whose agenda matches the half-day blueprint, with wall-clock times derived from `durationMinutes`.
- [ ] A full live workshop ritual (advance, rotation signal, checkpoint, challenge complete, promote feedback, participant-moment override, presenter launch, team assignment) runs against the new half-day instance without any code change or redeploy.
- [ ] `harness agenda edit <instance> <phase-id> --duration-minutes 45` shifts downstream wall-clock times correctly.
- [ ] Dashboard has exactly four sections: Run, People, Settings, Summary. Routes to `?section=agenda`, `?section=teams`, `?section=signals`, `?section=access` no longer render content.
- [ ] Run shows the full agenda outline, every phase is jumpable ("move live here" works on every row), every scene is openable for read-only preview.
- [ ] Scene preview never writes — CLI is the only authoring path.
- [ ] `workshop-facilitator` skill answers "how do I run a half-day Czech workshop?" with a concrete CLI flow that round-trips.
- [ ] GDPR operations (consent, Art. 20 export, soft-delete, password reset, facilitator grants) available in UI AND via CLI at full parity.
- [ ] Running the default EN workshop and a CS workshop on separate instances both work; no runtime CS/EN toggle in the workshop content path.
- [ ] `docs/facilitator-dashboard-design-rules.md`, `docs/dashboard-surface-model.md`, `docs/workshop-content-language-architecture.md` reflect the new model.
- [ ] No `phase.startTime` reads in the runtime code.
- [ ] `npm test` + `npm run verify:workshop-bundle` pass.

## Decision Rationale

Captured in the brainstorm (nine Qs resolved). Load-bearing decisions and the alternatives rejected:

- **Blueprint-as-data** was chosen over file-only, declarative profiles, and patch layers. File-only violates "no redeploy for content change." Profiles add complexity ahead of need. Patch layer is redundant with per-instance runtime edits.
- **Seed-from-repo then DB authoritative** was chosen over pure-runtime (extra setup step) and file-reload-on-boot (implies repo file changes hot-reload, which misleads forks).
- **`durationMinutes` forced** — `startTime` strings cannot express half-day variants; there is no alternative that also meets the "any workshop shape" goal.
- **Four sections (Run/People/Settings/Summary)** refined from Apr-19 Run/People/Access/Settings: Access folds into Run because event-code and walk-ins are operational, not config; Summary returns because the post-workshop readout is not authoring.
- **Agenda outline + scene preview stay in Run** — reversed the "agenda entirely gone from UI" read. Rationale: the facilitator's mental model is agenda-shaped; jump-to-phase mid-event is frequent; previewing a CLI-made edit without leaving the cockpit is how you validate the CLI-first workflow. Authoring still leaves. This distinction was explicit in the second round of brainstorming.
- **Skill as CLI envelope** — CLI alone is hostile to anyone who isn't the author of the CLI. OS project means non-Ondrej users must have a learning path. Skill + CLI together is the power move; the skill teaches, the CLI does.
- **Team mode blueprint-default + CLI escape hatch, no UI** — opinionated default with runtime escape matches the overall rule. No UI button because it muddies the blueprint/instance distinction.
- **Bilingual shell i18n kept, workshop content single-language** — reality is German-speaking facilitator runs German workshop; CS+EN runtime infrastructure is infrastructure-without-a-user. Shell i18n is cheap and extensible for forks.

## References

- Brainstorm: `docs/brainstorms/2026-04-23-minimal-facilitator-ui-and-instance-override-model-brainstorm.md`
- Migration policy: `docs/migration-policy.md`
- jsonb shape-guard pattern: `dashboard/lib/schemas/workshop-state-schema.ts:28-80`
- State repository pattern: `dashboard/lib/workshop-state-repository.ts`
- CLI dispatch pattern: `harness-cli/src/run-cli.js:3454-3723`
- CLI preview + commit-token pattern: `harness-cli/src/run-cli.js:3285-3325` (`handleWorkshopTeamRandomize`)
- Run section: `dashboard/app/admin/instances/[id]/_components/sections/run-section.tsx`
- Agenda section (to delete): `dashboard/app/admin/instances/[id]/_components/sections/agenda-section.tsx`
- Scene stage rail (to read-only clone): `dashboard/app/admin/instances/[id]/_components/scene-stage-rail.tsx`
- Skill source: `workshop-skill/SKILL-facilitator.md`
- Bundle sync: `harness-cli/src/workshop-bundle.js`, `harness-cli/scripts/sync-workshop-bundle.mjs`
- Prior facilitator UI brainstorms: `docs/brainstorms/2026-04-07-facilitator-cockpit-ia-and-ux-redesign-brainstorm.md`, `docs/brainstorms/2026-04-13-one-canvas-rework-brainstorm.md`, `docs/brainstorms/2026-04-19-facilitator-ui-revamp-brainstorm.md`, `docs/brainstorms/2026-04-19-agenda-scene-surface-split-and-lightweight-interaction-brainstorm.md`

## Notes on Execution

- **Trunk-based.** Commit to `main` at phase exits (or smaller, coherent units inside phases). Do not cut feature branches.
- **Deploy via Git push.** `harness-lab-dashboard` is wired to `main`. No `vercel --prod` from a local shell.
- **Bundle sync is a per-commit habit** when `workshop-skill/` or `workshop-blueprint/` changes.
- **Phase 4 gated on Phase 3 dogfooding** — do not remove UI surfaces until the CLI has been used through a live-ish run-through.
- **Phase 4 gated on preview artifact** — do not start Run redesign implementation until the wireframe is approved.
- **Phase 7 gated on two clean deploys** — the contract phase is destructive; give expand enough time to prove out.
