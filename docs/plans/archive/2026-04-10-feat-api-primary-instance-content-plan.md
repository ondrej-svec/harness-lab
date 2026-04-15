---
title: "feat: API-primary instance content — briefs and challenges from blueprint, not seed data"
type: plan
date: 2026-04-10
status: complete
confidence: high
---

# API-Primary Instance Content

**One-line summary:** Make the dashboard API the primary source for instance-specific briefs and challenges, sourced from the blueprint at reset time, with static bundle files as offline-only fallback.

## Problem Statement

Briefs and challenges are always hardcoded seed data. `createWorkshopInventory(contentLang)` returns one of two static arrays regardless of which blueprint was used. `projectLocalizedWorkshopState` unconditionally overwrites `state.briefs` for English instances. The `BlueprintAgenda` type has no field for briefs or challenges.

This means:
- A facilitator who creates a workshop from a custom blueprint still gets the default briefs/challenges
- Participants always see the same content regardless of the instance they joined
- The `--from-local` reset flow only customizes agenda phases, not the rest of the inventory

The in-progress participant CLI plan (`2026-04-10-refactor-participant-cli-architecture-plan.md`) already assumes `GET /api/briefs` and `GET /api/challenges` serve live instance data. This plan makes that assumption true on the server side.

## Target End State

1. `BlueprintAgenda` accepts an optional `inventory` section with briefs and challenges
2. When a facilitator resets an instance with a blueprint that includes inventory, those briefs/challenges are stored in the instance state
3. When no inventory is provided in the blueprint, the existing seed data is used (backwards compatible)
4. `projectLocalizedWorkshopState` preserves stored briefs instead of overwriting them
5. Participants calling `/api/briefs`, `/api/challenges`, or `/api/event-context/core` get instance-specific content
6. The SKILL.md routes briefs/challenges through the API (via CLI) as primary, local files as fallback
7. The canonical `workshop-blueprint/agenda.json` includes an `inventory` section with the default brief/challenge set

## Scope and Non-Goals

**In scope:**
- Extend `BlueprintAgenda` type with optional inventory
- Thread inventory through `createWorkshopInventory` and `createWorkshopStateFromInstance`
- Fix `projectLocalizedWorkshopState` brief overwrite
- Add inventory to the public blueprint JSON
- Propagate inventory through the generate-views script
- Update SKILL.md content routing doctrine

**Non-goals:**
- Dashboard UI changes
- New API routes (existing `/api/briefs`, `/api/challenges`, `/api/event-context/core` already serve the right shape)
- CLI changes (the participant CLI plan handles that separately)
- Content markdown restructuring (the markdown briefs stay as-is for offline fallback)
- Bilingual inventory in the blueprint source (`workshop-content/agenda.json`) — briefs/challenges already have separate per-language seed arrays; the blueprint carries the language-resolved set

## Proposed Solution

Extend the blueprint schema with an optional `inventory` field. Thread it through the state construction path so instance resets use blueprint inventory when present, seed data when not. Stop the localization pass from overwriting stored briefs. Update the content generation pipeline and skill routing.

No database migration needed — `WorkshopState` already has `briefs: ProjectBrief[]` and `challenges: Challenge[]`.

---

## Implementation Tasks

### Phase 1: Data Layer (workshop-data.ts)

- [x] **1.1** Define explicit `BlueprintAgenda` type with optional `inventory`:
  - Currently inferred from `typeof blueprintAgendaCs` — change to an explicit interface
  - Add `inventory?: { briefs?: ProjectBrief[]; challenges?: Omit<Challenge, "completedBy">[] }`
  - Keep all existing fields (`version`, `blueprintId`, `title`, `subtitle`, `principles`, `phases`)
  - The generated JSON imports must satisfy this type (they will, since `inventory` is optional)

- [x] **1.2** Update `createWorkshopInventory` signature to accept optional blueprint:
  ```
  createWorkshopInventory(contentLang, externalBlueprint?) →
    if externalBlueprint?.inventory?.briefs → use those
    if externalBlueprint?.inventory?.challenges → use those
    otherwise → existing seed data
  ```
  Ticker and setupPaths remain seed-only (not blueprint-variable).

- [x] **1.3** Thread `externalBlueprint` into `createWorkshopInventory` call in `createWorkshopStateFromInstance` (line ~1387):
  ```
  const inventory = createWorkshopInventory(instance.workshopMeta.contentLang, externalBlueprint);
  ```

### Phase 2: Fix Localization Overwrite (workshop-store.ts)

- [x] **2.1** In `projectLocalizedWorkshopState` (~line 359), change:
  ```
  briefs: localizedInventory.briefs,
  ```
  to:
  ```
  briefs: state.briefs,
  ```
  Rationale: stored briefs are already in the correct language (set at reset time from language-resolved seed or blueprint). The localization pass should not replace them.

- [x] **2.2** Verify that `mergeLocalizedChallenges` preserves custom challenge content, not just `completedBy`. If it overwrites title/description from seed, apply the same fix: preserve `state.challenges` and only merge runtime tracking fields (`completedBy`).

### Phase 3: Blueprint Schema + Generation Pipeline

- [x] **3.1** Add `inventory` section to `workshop-blueprint/agenda.json`:
  ```json
  "inventory": {
    "briefs": [
      { "id": "devtoolbox-cli", "title": "...", "problem": "...", ... },
      ...
    ],
    "challenges": [
      { "id": "context-window-audit", "title": "...", ... },
      ...
    ]
  }
  ```
  Use the English seed data as the source (this is the public-readable mirror). The brief shape matches `ProjectBrief`; the challenge shape matches `Challenge` minus `completedBy`.

- [x] **3.2** Update `scripts/content/generate-views.ts` to propagate `inventory` from the bilingual source into the generated `agenda-cs.json` and `agenda-en.json`. This is the key step that makes `readLocalBlueprint` in the CLI pick up inventory for free — no CLI code changes needed.

- [x] **3.3** Regenerate `dashboard/lib/generated/agenda-cs.json` and `agenda-en.json` by running the generation script. Verify the TypeScript compiler accepts the new shape against the explicit `BlueprintAgenda` type.

### Phase 4: Skill Routing Update

- [x] **4.1** Update `.claude/skills/workshop/SKILL.md` sources-of-truth section (~lines 53-74):
  - Move "challenge cards" and "project briefs" from the repo-native tier to the live dashboard tier
  - Keep them in repo-native as explicit fallback: "If the CLI/API is unreachable, fall back to local content files"

- [x] **4.2** Update the `workshop brief` command section (~line 121):
  - Primary: `harness --json workshop brief` (via CLI, which calls `/api/briefs`)
  - Fallback: `content/project-briefs/locales/<locale>/<brief>.md`

- [x] **4.3** Update the `workshop challenges` command section (~line 129):
  - Primary: `harness --json workshop challenges` (via CLI, which calls `/api/challenges`)
  - Fallback: `content/challenge-cards/locales/<locale>/deck.md`

- [x] **4.4** Sync the workshop bundle: `node scripts/sync-workshop-bundle.mjs`

---

## Acceptance Criteria

1. A blueprint with an `inventory` section produces instance state with those briefs/challenges
2. A blueprint without `inventory` produces instance state with seed data (backwards compatible)
3. `GET /api/briefs` returns instance-specific briefs after a custom-blueprint reset
4. `GET /api/event-context/core` returns instance-specific briefs/challenges
5. English instances no longer have their briefs overwritten by `projectLocalizedWorkshopState`
6. The workshop skill routes brief/challenge requests through the CLI as primary source
7. Existing tests pass — no regressions in the 51+ existing test suite
8. `readLocalBlueprint` in the CLI picks up inventory from generated JSON without CLI code changes

## Decision Rationale

**Why extend the blueprint rather than create a separate inventory config?**
The blueprint already represents "what this workshop instance looks like." Briefs and challenges are part of that definition. A separate config would split the instance identity across two files with no clear benefit.

**Why stop overwriting briefs in the localization pass?**
The overwrite was a shortcut when briefs were always seed data — it ensured the "right" language appeared. With instance-specific briefs, the right data is whatever was stored at reset time. The reset already resolves language via `contentLang`.

**Why not store briefs separately (like teams have a repository)?**
Briefs and challenges don't change during a workshop — they're set at reset and read-only after that. They belong in the `WorkshopState` blob, not in a separate table. Teams change continuously (registrations, repo URLs), justifying their own repository.

**Why optional inventory on the type?**
Backwards compatibility. Existing generated JSONs have no `inventory` field. Making it optional means the TypeScript compiler accepts them until the generation script is updated.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| `WorkshopState.briefs` and `.challenges` are already persisted in the DB | Verified | They're part of the `WorkshopState` blob saved by `saveState()` |
| Generated JSON files are the only import path for `BlueprintAgenda` in dashboard code | Verified | `import blueprintAgendaCs from "./generated/agenda-cs.json"` at top of workshop-data.ts |
| `readLocalBlueprint` reads the generated JSON and passes it as-is to the API | Verified | run-cli.js:169-193 — JSON.parse of the generated file, passed as `blueprint` in PATCH body |
| Removing the brief overwrite in localization won't break Czech instances | Verified | Czech path returns `state` unchanged (line 349: `if (contentLang === "cs") return state`) |
| The generate-views script can access brief/challenge source data | Needs verification | Script currently only handles agenda. Need to check if it can import from workshop-content or seed arrays |

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Generate-views script is complex to extend for inventory | Low | Medium | The inventory data already exists as seed arrays; worst case, manually add to generated JSONs |
| `mergeLocalizedChallenges` does more than preserve `completedBy` | Medium | Low | Task 2.2 explicitly verifies this before changing behavior |
| Existing instances have seed briefs that differ from blueprint briefs | None | None | Existing instances were never reset with custom blueprints — this is a new capability |
| Type mismatch between blueprint inventory and `ProjectBrief`/`Challenge` | Low | Low | The blueprint carries the same shape; `completedBy` is added at state construction time |

## Coordination with Participant CLI Plan

The participant CLI plan (`2026-04-10-refactor-participant-cli-architecture-plan.md`, status: in_progress) adds CLI commands that call `/api/briefs` and `/api/challenges`. That plan's non-goals explicitly state "Dashboard API changes" are out of scope. This plan provides the server-side changes that make those CLI commands return instance-specific data.

**Sequencing:** This plan can land independently. The CLI plan's Phase 3 (participant data commands) will benefit from these changes but doesn't depend on them — the API shape is unchanged, only the content becomes instance-aware.

## References

- Participant CLI plan: `docs/plans/2026-04-10-refactor-participant-cli-architecture-plan.md`
- Bilingual content model plan (completed): `docs/plans/2026-04-10-refactor-unified-bilingual-content-model-plan.md`
- Private instance schema: `docs/private-workshop-instance-schema.md`
- Blueprint source: `workshop-blueprint/agenda.json`
- Generation script: `scripts/content/generate-views.ts`
