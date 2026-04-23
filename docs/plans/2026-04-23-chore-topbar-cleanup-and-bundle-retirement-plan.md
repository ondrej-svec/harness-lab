---
title: "chore: topbar cleanup + compiled-bundle retirement"
type: plan
date: 2026-04-23
status: approved
parent: docs/plans/2026-04-23-feat-minimal-ui-and-blueprint-as-data-plan.md
confidence: high
---

# chore: Topbar cleanup + compiled-bundle retirement

Follow-up cleanup to the 2026-04-23 minimal-UI plan. Two independent
workstreams:

- **Part A — Topbar UX** — the control-room header still carries
  duplicated copy after the 4-section collapse. A workshop title
  appears three times (header, left-rail header, "active instance"
  KPI), session info competes with Settings metadata, and the Run
  section prints an "run" title + description on top of an already-
  selected tab. Simplify.
- **Part B — Compiled-bundle retirement** — the paired
  `dashboard/lib/generated/agenda-{cs,en,cs-participant,en-participant}.json`
  files and `getBlueprintAgenda(contentLang, mode)` resolver stay on
  disk as a file-mode fallback. Retire them now that every production
  path materializes from the DB blueprints table.

## Problem Statement

### A — Topbar is still over-full

Post Phase 4, the control-room header has visible redundancy:

1. Workshop title + slug appear in Row 1.
2. OutlineRail shows `active instance` eyebrow + slug on top of the
   section nav — same slug, different place.
3. Row 3 (context strip) has 4 KPI cards; the "active instance" card
   duplicates Row 1's title, and "current phase" duplicates the
   live-now card Run already shows.
4. Row below Row 3 renders `signed in as: Ondrej · owner · Latest
   archive: … · retention until …` — a 2-line runon that Settings
   already owns.
5. RunSection prints a "run" eyebrow + "run" title + multi-line
   description at the top of the section — but the user clicked the
   Run tab; the title is noise.

These are minor individually; together they crowd the hero.

### B — Compiled bundle is architecturally redundant

After Phase 6 core (`97ea10c`), `createWorkshopInstance` resolves
blueprints from the DB by default (explicit `blueprintId` if passed,
otherwise `harness-lab-default`). The compiled CS/EN bundle
(`getBlueprintAgenda`) is touched only on DB lookup failure — a
legacy safety net for file-mode dev flows and `sampleWorkshopInstances`.
Leaving it in place costs ongoing bundle-sync churn and preserves
dual code paths that disagree about the same data.

## Target End State

- Control-room header has one place each for: workshop title, instance
  slug, schedule/where/owner. No duplicate "active instance" header
  block in the left rail. 3 KPI cards (current phase, participant
  surface, teams). Session info moves to Settings; header loses the
  trailing archive/session row.
- RunSection's agenda panel no longer prints a redundant "run" eyebrow
  or description above its content.
- `getBlueprintAgenda` is deleted. Its callers consume blueprint
  records directly via `BlueprintRepository.get()` and the
  `blueprintRecordToAgenda` adapter.
- `dashboard/lib/generated/agenda-{cs,en,cs-participant,en-participant}.json`
  removed. Generator stops emitting them (still emits
  `workshop-blueprint/agenda.json` for the public mirror).
- `sampleWorkshopInstances` + `createWorkshopInstanceRecord` no longer
  reference compiled-bundle constants; they either require a blueprint
  record upfront or carry their own minimal inline defaults.

## Scope and Non-Goals

**In scope:**
- Topbar simplification per screenshot (5 concrete cuts).
- Retire `getBlueprintAgenda`, remove compiled JSON files, migrate
  callers in `workshop-data.ts` + `workshop-store.ts` +
  `admin-page-loader.ts` wherever they reach for the compiled bundle.
- Keep the BilingualPhase authoring source (`workshop-content/agenda.json`)
  and the generator → public blueprint JSON path for the open-source
  reference blueprint.

**Non-goals:**
- New languages beyond CS/EN.
- Runtime CS content translation work.
- Further UI changes outside the topbar.

## Proposed Solution

### Part A — Topbar cleanup

Five surgical cuts in existing components:

1. **Drop OutlineRail "active instance" header block** (`outline-rail.tsx`) — remove the eyebrow + slug paragraph at the top; keep only the section nav + nested agenda.
2. **Drop the "active instance" KPI** from `control-room-cockpit.tsx` summary-rows rendering. The summary rows drop from 4 to 3 (current phase, participant surface, teams).
3. **Remove the session info row** from `control-room-cockpit.tsx` Row 3. Session info surfaces in Settings' identity card only.
4. **Remove the RunSection top eyebrow+title+description** from `run-section.tsx:162-165` — the Run tab being active is signal enough.
5. **Keep Row 1 title + slug** — this is the canonical identity.

### Part B — Compiled-bundle retirement

One ordered migration:

1. Update `sampleWorkshopInstances` and `createWorkshopInstanceRecord`
   defaults in `workshop-data.ts` to use a minimal inline constant
   (blueprint-id + version) instead of reading `blueprintAgendaCs.blueprintId`.
2. Rewire the four `getBlueprintAgenda` callers (`workshop-data.ts:61,
   952, 1028, 1525`) to either:
   - take an externalBlueprint parameter and refuse to self-resolve, or
   - use a new `resolveBlueprintAgenda(record)` adapter that wraps
     `blueprintRecordToAgenda`.
3. Update `createWorkshopStateFromInstance` to require its
   `externalBlueprint` (promotes from optional to required in a new
   API; the sync fallback path goes away).
4. Delete `getBlueprintAgenda` and the four compiled-JSON imports at
   `workshop-data.ts:1-44`.
5. Delete `dashboard/lib/generated/agenda-{cs,en,cs-participant,en-participant}.json`.
6. Update generator: skip emission of those four files; keep
   `workshop-blueprint/agenda.json` (public mirror) and the reference
   blueprint emissions.
7. Sync workshop bundle (drift is a hard fail).
8. Typecheck, test, commit.

## Constraints and Boundaries

- Trunk-based: commit to main, no feature branches.
- Deploys via Git push.
- Every commit must keep tests green.
- For Part A, update or retire page.test.tsx assertions that currently
  expect the retired copy.
- For Part B, do not retire the BilingualPhase `startTime` field in
  the authoring source — generator still consumes it to emit
  durations.

## Assumptions

| Assumption | Status |
|---|---|
| `sampleWorkshopInstances` is used only by file-mode dev and a handful of tests — safe to define a minimal inline default | Verified by grep over callers |
| `createWorkshopStateFromInstance` currently has two callers (`workshop-store.createWorkshopInstance` and `admin-page-loader`); both can supply a blueprint record at call time | Verified |
| The public blueprint mirror (`workshop-blueprint/agenda.json`) is still used by the public OS-facing site; must be preserved | Verified — generator's `generatePublicBlueprint` path remains |
| Retiring the paired CS/EN JSON files is safe because every production instance materialized through the DB path since commit `97ea10c` | **Unverified** — no production data to inspect. Mitigated by the seed-from-empty migration; `harness-lab-default` is always present |

## Risk Analysis

| Risk | Severity | Mitigation |
|---|---|---|
| A test asserts on the retired "active instance" copy or the "quick interventions" eyebrow | Medium | Update tests alongside code; page.test.tsx already shows how to check retired copy with `.not.toContain` |
| A caller of `getBlueprintAgenda` is missed during migration | Medium | `tsc` will catch import errors after file deletion; tests exercise the common paths |
| A file-mode dev flow breaks because `sampleWorkshopInstances` used to materialize from compiled bundle | Medium | Inline minimal defaults for sample data; keep the same IDs so tests don't re-shape |
| Public OS consumers rely on `dashboard/lib/generated/agenda-en.json` directly | Low | Those files are app-internal under `dashboard/lib/`; the public mirror is `workshop-blueprint/agenda.json` |

## Implementation Tasks

### Part A — Topbar cleanup

- [ ] **A1** `outline-rail.tsx`: remove the eyebrow + workshop-label paragraph at the top. Keep the sticky container + section nav + nested agenda.
- [ ] **A2** `control-room-cockpit.tsx`: drop the "active instance" row from `summaryRows`. Update `buildControlRoomSummaryStats` accordingly (the underlying view-model no longer needs to produce that row).
- [ ] **A3** `control-room-cockpit.tsx`: remove the session-info + archive-line block (lines ~244-249). Leave the KPI grid as the last row of the header.
- [ ] **A4** `run-section.tsx`: drop the `AdminPanel eyebrow/title/description` wrapper around the content, or keep the panel but empty the copy props. Pick the minimal route that preserves layout spacing.
- [ ] **A5** Update `page.test.tsx` assertions that expected the retired copy; update `outline-rail.test.tsx` where it asserted on `copy.activeInstance` in the rail header.
- [ ] **A6** Typecheck, test, commit.

### Part B — Compiled-bundle retirement

- [ ] **B1** Replace `blueprintAgendaCs.blueprintId` / `.version` references in `workshop-data.ts` (inside `createWorkshopInstanceRecord` and `sampleWorkshopInstances`) with an inline constant `DEFAULT_BLUEPRINT_REF = { blueprintId: "harness-lab-default", version: 1 }`.
- [ ] **B2** Migrate each caller of `getBlueprintAgenda`:
  - `workshop-data.ts:61` (`generateWorkshopMetaFromTemplate` or similar) — inline the title/subtitle constants or thread the blueprint record in.
  - `workshop-data.ts:952` — same treatment.
  - `workshop-data.ts:1028` (`createAgendaFromBlueprint`) — require `externalBlueprint`; callers must provide it.
  - `workshop-data.ts:1525` (`createWorkshopInventory`) — same.
  - `workshop-data.ts:1949` (`createWorkshopStateFromInstance`) — require `externalBlueprint`; remove the `??` fallback.
- [ ] **B3** Update call sites that relied on the optional externalBlueprint to always fetch a blueprint record first (e.g. `workshop-store.createWorkshopInstance` already does this; `admin-page-loader` needs an equivalent path for reads that instantiate agenda for display).
- [ ] **B4** Delete the compiled-bundle imports at `workshop-data.ts:1-4` and the `getBlueprintAgenda` function.
- [ ] **B5** Delete `dashboard/lib/generated/agenda-{cs,en,cs-participant,en-participant}.json`.
- [ ] **B6** Update `scripts/content/generate-views.ts` to skip those four files. Keep `generatePublicBlueprint` → `workshop-blueprint/agenda.json`.
- [ ] **B7** Update `verify:content` to not expect the retired files. Update `.copy-editor.lock.json` if it references them.
- [ ] **B8** Sync workshop bundle.
- [ ] **B9** Typecheck, run full dashboard + CLI tests, commit.

## Acceptance Criteria

- Topbar renders 3 KPI cards, not 4. No "active instance" header paragraph in OutlineRail. No session-info row at the bottom of the header. RunSection has no redundant "run" title on top.
- `git grep "getBlueprintAgenda"` finds zero occurrences in `dashboard/` source (matches in docs/plans are fine).
- `dashboard/lib/generated/agenda-*.json` does not exist.
- Dashboard tests pass.
- CLI tests pass.
- `npm run verify:workshop-bundle` passes.
- `npm run verify:content` passes.

## References

- Parent plan: `docs/plans/2026-04-23-feat-minimal-ui-and-blueprint-as-data-plan.md`
- Screenshot pointing out topbar duplication: provided by Ondrej on 2026-04-23
- Commit that closed Phase 6 core: `97ea10c`
