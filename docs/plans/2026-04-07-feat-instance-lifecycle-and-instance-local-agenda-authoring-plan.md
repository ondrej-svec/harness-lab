---
title: "feat: facilitator instance lifecycle, local agenda authoring, and team operations UX"
type: plan
date: 2026-04-07
status: complete
brainstorm: ../brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md
confidence: medium
---

# Instance Lifecycle And Instance-Local Agenda Authoring Plan

Add the missing workshop-instance lifecycle to Harness Lab: facilitators must be able to create, prepare, switch, remove, and operate instances from the dashboard and from `workshop-skill/`, while each instance keeps its own editable agenda snapshot that can diverge from the public blueprint safely and the team surface becomes team-first instead of blank-form-first.

## Problem Statement

Harness Lab now teaches a blueprint-versus-runtime model, but the actual product stops short of the operations that model requires.

Today:

- `/admin` can switch among existing instances, but it cannot create or remove one.
- `workshop-skill` documents `/workshop facilitator create-instance`, but the current route behind it does not implement create.
- the current `POST /api/workshop` behavior is really "reset current instance from template", not instance creation.
- the runtime model still treats template ids and instance ids too similarly, which is acceptable for samples but unsafe for real workshop operations.
- agenda authoring is still effectively blueprint-only, which is too rigid for real event preparation where one hackathon needs local time, wording, or order changes.
- the teams section is form-first instead of team-first: editing a team requires manually re-entering or matching ids and names rather than acting directly on the team record in context.
- deletion semantics are undefined, even though a multi-instance system without removal will accumulate stale workshop records immediately.

This matters because the intended operational model is:

- blueprint defines the reusable workshop day
- instance imports that blueprint
- facilitators adjust instance-local details without mutating the shared blueprint
- dashboard and skill use the same runtime capabilities

The current implementation supports only the middle of that lifecycle.

## Proposed Solution

Implement the missing lifecycle and authoring model in five coordinated slices:

1. make workshop instances first-class runtime records with explicit create, list, prepare, reset, and safe-remove operations
2. store an instance-local agenda snapshot in runtime state as an editable copy imported from the blueprint at create/reset time
3. expose those lifecycle and agenda operations through shared runtime services and protected API routes used by both dashboard and `workshop-skill/`
4. redesign the facilitator surface so instance management and agenda authoring are visible, understandable, and clearly separated from blueprint editing
5. redesign team operations around actual teams, with direct edit affordances and prefilled forms instead of disconnected raw-input forms

The product rule becomes:

- blueprint edits change the reusable workshop design for future imports
- instance edits change only the selected workshop event
- removing an instance hides it from active operations without silently destroying archival history

## Detailed Plan Level

This is a **detailed** plan because it changes runtime contracts, storage adapters, API shape, facilitator UX, skill contracts, and deletion safety rules.

## Decision Rationale

### Why instance-local agenda authoring is required

- Real workshops need local adaptations.
- Editing the public blueprint for one event is the wrong trust boundary.
- The current "blueprint only" agenda posture is too rigid for the exact use case the dashboard is supposed to support.

### Why blueprint import should create a local agenda snapshot

- The participant and facilitator surfaces already render `state.agenda`, which means the runtime model already has the right seam.
- A snapshot preserves the chosen blueprint at import time while still allowing local edits later.
- Existing instances should not retroactively change when the public blueprint changes.

### Why instance lifecycle must become explicit instead of piggybacking on reset

- Create and reset are different operations.
- The current reset flow conflates template and instance identity, which is fine for sample data but wrong for real instances.
- A multi-instance system needs an explicit registry and lifecycle state, not just a current-instance environment variable plus sample lists.

### Why dashboard and skill must share the same operations

- The skill docs already promise lifecycle operations.
- If dashboard and skill drift, facilitators will get different answers depending on which control surface they use.
- One runtime service/API model is easier to test and easier to explain.

### Why delete should be a safe remove, not default hard-delete

- The schema doctrine already prefers soft deletion for operational records.
- In the current Neon schema, hard-deleting `workshop_instances` would cascade-delete `instance_archives`, sessions, teams, checkpoints, and monitoring.
- Facilitators need "remove from active use", not accidental destruction of audit and archive history.

### Why team operations should be team-first

- Team management is an operational workflow around known teams, not a raw data-entry exercise.
- The current section makes edit and create look like the same blank form, which increases mismatch risk around ids, names, and repo links.
- The facilitator should be able to act from a team card or row and see current checkpoint, repo, and membership in the same place they edit it.

### Alternatives considered

#### Alternative 1: Keep agenda authoring blueprint-only

Rejected because it pushes event-local adaptations into the wrong layer and forces facilitators to mutate shared workshop design for one event.

#### Alternative 2: Let delete be a hard physical delete in the dashboard

Rejected because the current foreign keys would destroy archival history, and because it conflicts with the schema’s soft-delete guidance.

#### Alternative 3: Keep instance creation as a skill-only or script-only action

Rejected because the dashboard is supposed to be the runtime control plane. Hiding instance lifecycle outside the product would keep the system fragile and confusing.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Each workshop instance should own its own runtime agenda copy | Verified | Current participant and facilitator views already read from `WorkshopState.agenda`, not directly from the blueprint |
| Blueprint changes should not automatically rewrite existing instance agendas | Verified | Explicit blueprint/runtime decision in the brainstorm and import-model docs |
| Dashboard and `workshop-skill/` should use the same runtime capabilities | Verified | Existing doctrine and skill docs already require this |
| The current reset flow incorrectly blurs template identity and instance identity for real-world lifecycle work | Verified | `createWorkshopStateFromTemplate()` currently produces sample-instance-shaped state rather than creating a new instance record |
| File mode can support a local instance registry in addition to per-instance state files | Unverified | Current file mode persists per-instance state but has no instance registry abstraction yet |
| The existing `workshop_instances` table can be extended to support safe removal without breaking current adapters | Unverified | Schema has `status` already, but no `deleted_at` or tombstone semantics yet |
| Adding local agenda item CRUD and reorder will not break the single-current-phase invariant | Unverified | Current code assumes a stable imported agenda order and only updates statuses |
| Facilitators should be able to remove stale instances from the dashboard list without requiring database access | Verified | User requirement in this thread |
| Per-instance agenda authoring must also be available through the skill path | Verified | User requirement in this thread |

Unverified assumptions become explicit early tasks and test targets below.

## Risk Analysis

### Risk: Instance creation and reset continue to share the same contract and preserve the current identity confusion

If create and reset are not separated, the system will keep mutating the notion of "current instance" rather than creating a new event record.

Mitigation:

- add explicit instance repository lifecycle methods
- introduce explicit create and reset service functions
- test that reset preserves `instance_id` while create generates or records a new one

### Risk: Delete removes operational history

If delete maps to `DELETE FROM workshop_instances`, the current schema will cascade-remove archives and other related data.

Mitigation:

- define dashboard and skill "remove instance" as soft removal/tombstoning
- hide removed instances from normal lists but keep them queryable for audit/archive use
- defer physical purge to a narrower maintenance path, not day-one facilitator UI

### Risk: Agenda editing breaks the live-phase marker

If facilitators reorder or remove the current item without guardrails, the runtime may end up with no current phase or inconsistent statuses.

Mitigation:

- enforce exactly one `current` item or an explicit fallback rule
- normalize statuses after every agenda mutation
- test edit, reorder, delete-current, and add-before-current scenarios

### Risk: Dashboard and skill implement similar operations through different contracts

If dashboard server actions call one path and the skill calls another, copy and behavior will diverge again.

Mitigation:

- define one shared domain service layer
- expose one protected API contract for skill use
- update skill docs only after the route contract exists

### Risk: File mode and Neon mode drift

If instance lifecycle exists only in Neon, local development and demo workflows will remain misleading.

Mitigation:

- add lifecycle support to both adapters
- keep integration and route tests in file-mode memory adapters
- add one Neon integration test for instance lifecycle once the repository exists

### Risk: Team edits remain error-prone even after lifecycle work ships

If the team page remains form-first, facilitators will still have to manually map blank inputs to existing teams under time pressure.

Mitigation:

- redesign the teams section around team cards or rows with direct edit actions
- prefill all editable values from the selected team
- separate "create new team" from "edit existing team"

## Phased Implementation

### Phase 1: Normalize the instance model and persistence seams

Goal: separate blueprint/template concepts from real runtime instance records.

Tasks:
- [x] Extend the workshop-instance domain model so `WorkshopInstanceRecord` represents a real event record rather than a sample/template wrapper.
- [x] Add explicit instance fields needed for lifecycle and UI, at minimum:
  - `id`
  - `templateId`
  - `status`
  - `displayName`
  - `city`
  - `dateRange`
  - `blueprintId`
  - `blueprintVersion` or commit ref
  - `importedAt`
  - `removedAt` nullable
- [x] Split sample templates from instance records so template selection no longer doubles as instance identity.
- [x] Extend `WorkshopInstanceRepository` with create, update, list-active, list-all, and soft-remove methods.
- [x] Implement the instance repository for file mode and Neon mode.
- [x] Keep sample/demo fixtures as bootstrap data only, not as the production-shaped repository implementation.

Exit criteria:
- instance ids and template ids are distinct everywhere
- both storage modes can list and persist instance records
- the runtime has a real notion of active versus removed instances

### Phase 2: Add shared lifecycle services and protected instance APIs

Goal: make create, prepare, reset, list, and remove real runtime operations.

Tasks:
- [x] Add shared store/service functions for:
  - `createWorkshopInstance`
  - `prepareWorkshopInstance`
  - `resetWorkshopInstance`
  - `listWorkshopInstances`
  - `removeWorkshopInstance`
- [x] Define one protected API contract for skill and CLI use.
- [x] Prefer explicit instance lifecycle routes over overloading the current reset route. Recommended shape:
  - `GET /api/workshop/instances`
  - `POST /api/workshop/instances`
  - `PATCH /api/workshop/instances/:id`
- [x] Preserve `POST /api/workshop` only if needed as a compatibility shim; otherwise deprecate it and update docs.
- [x] Make create import blueprint-owned fields into a new runtime instance snapshot.
- [x] Make reset re-import the selected blueprint into the same instance id.
- [x] Make remove owner-only and soft-delete by status/tombstone rather than physical row deletion.
- [x] Ensure access checks are instance-scoped and consistent with current facilitator grants.

Exit criteria:
- a facilitator can create a new instance without scripts
- reset preserves the instance id
- remove hides an instance from the active list without destroying archive history
- the skill path has a stable API contract to call

### Phase 3: Implement instance-local agenda authoring

Goal: make the imported agenda editable inside one instance without touching the blueprint.

Tasks:
- [x] Extend the runtime agenda model so each item can preserve source metadata and stable ordering. Recommended additions:
  - `order`
  - `sourceBlueprintPhaseId` nullable
  - optional `kind` or `isCustom`
- [x] Keep blueprint import responsible for generating the initial agenda snapshot for create/reset.
- [x] Add shared agenda mutation operations for:
  - update item fields
  - reorder items
  - add custom item
  - remove item
  - set current item
- [x] Normalize agenda statuses after every mutation so there is exactly one live phase.
- [x] Define a protected agenda API used by the skill and suitable for the dashboard UI.
- [x] Update reset behavior so it replaces local agenda edits with a fresh import from the selected blueprint, while ordinary edits remain instance-local.

Exit criteria:
- a facilitator can change order, labels, times, and descriptions for one instance
- those changes appear on participant and admin surfaces for that instance only
- blueprint edits still affect only future imports or explicit resets

### Phase 4: Redesign the facilitator dashboard around lifecycle and local agenda editing

Goal: make the missing operations visible and obvious in `/admin`.

Tasks:
- [x] Add an explicit instance-management surface in the dashboard.
- [x] Support create-instance from the UI with:
  - template selection
  - instance id or slug
  - display label
  - participant-facing date/venue metadata as needed
- [x] Support remove-instance from the UI with explicit danger copy and owner-only access.
- [x] After create, switch the facilitator into the new instance automatically.
- [x] Update the agenda section so it distinguishes:
  - move live phase
  - edit this instance’s agenda
  - edit the reusable blueprint
- [x] Add agenda authoring controls for item edits and order changes.
- [x] Show the imported blueprint reference and explain that reset discards instance-local agenda edits.

Exit criteria:
- a facilitator can create and remove instances in `/admin`
- the agenda page makes local editing versus blueprint editing obvious
- the UI no longer implies that the only agenda control is moving the live marker

### Phase 5: Redesign team operations around real teams

Goal: make team management feel like operating teams, not filling an unrelated form.

Tasks:
- [x] Split "create new team" from "edit existing team".
- [x] Make the primary team surface team-first:
  - one card or row per team
  - visible repo, project brief, members, and checkpoint
  - direct actions for edit, checkpoint update, and optional archive/remove
- [x] Add a selected-team edit form that preloads the team’s current values instead of requiring manual id/name matching.
- [x] Auto-generate or protect stable team ids so facilitators do not need to hand-maintain ids during ordinary edits.
- [x] Fold checkpoint editing into the team context so the facilitator can see which team they are editing while writing the checkpoint.
- [x] Add direct links or copy actions for repo URLs where helpful.
- [x] Ensure the same team update operations remain available to the skill/API path.

Exit criteria:
- facilitators can edit a team by acting on that team directly
- ordinary team edits do not require retyping or memorizing ids
- checkpoint editing is visually and functionally tied to the selected team

### Phase 6: Align `workshop-skill/` and facilitator docs with the real contract

Goal: make the skill a first-class client of the same lifecycle and agenda APIs.

Tasks:
- [x] Update `workshop-skill/SKILL.md` and `workshop-skill/facilitator.md` to match the actual runtime API contract.
- [x] Add or confirm commands for:
  - `/workshop facilitator instances`
  - `/workshop facilitator create-instance`
  - `/workshop facilitator remove-instance`
  - `/workshop facilitator agenda`
- [x] Make agenda-editing commands explicit about instance-local scope.
- [x] Ensure skill examples include instance identifiers where needed instead of relying on hidden global current-instance assumptions.
- [x] Update runbook and dashboard-surface docs to reflect safe remove semantics and local agenda authoring.

Exit criteria:
- the skill docs no longer advertise endpoints that do not exist
- facilitators can perform the same lifecycle operations from the skill path
- repo docs, dashboard copy, and skill docs use the same terms

### Phase 7: Testing and migration hardening

Goal: establish trust around lifecycle safety and per-instance agenda behavior.

Tasks:
- [x] Add unit tests for instance repository create/list/remove behavior in file mode and memory adapters.
- [x] Add route tests for instance lifecycle endpoints.
- [x] Add route/store tests for agenda CRUD, reorder, and current-phase normalization.
- [x] Extend admin-page tests for instance-management affordances.
- [x] Add admin-page and interaction tests for team-first editing flows.
- [x] Add one Neon integration test for instance creation and safe removal/tombstoning.
- [x] Add migration coverage for any new `workshop_instances` columns or tombstone fields.

Exit criteria:
- lifecycle behavior is covered by automated tests
- agenda edits are verified as instance-local
- deletion safety is covered by tests rather than comments

## Implementation Tasks

- [x] Define the target runtime instance record shape and update contracts first.
- [x] Untangle sample templates from instance records in `dashboard/lib/workshop-data.ts`.
- [x] Add repository support for create/list/update/remove in file and Neon modes.
- [x] Add shared lifecycle store functions and protected instance APIs.
- [x] Add safe remove/tombstone semantics and owner-only authorization.
- [x] Add runtime agenda authoring operations and API coverage.
- [x] Add dashboard instance-management UI and agenda-editing UI.
- [x] Redesign the teams section so create and edit are separate, team-centered flows.
- [x] Update `workshop-skill/` command docs and examples to use the new APIs.
- [x] Add automated tests for lifecycle, agenda editing, and deletion safety.
- [x] Update runbook/surface-model docs to reflect the implemented lifecycle.

## Acceptance Criteria

- Facilitator dashboard includes a visible create-instance flow and a visible remove-instance flow.
- Creating an instance does not overwrite the currently selected instance.
- Reseting an instance keeps the same `instance_id` and re-imports blueprint data into that instance.
- Removing an instance hides it from the active control list without deleting its archive history.
- Facilitators can edit order, labels, times, and descriptions of agenda items for one instance.
- Those agenda edits appear on participant and facilitator surfaces only for that instance.
- Team editing in `/admin` is centered on selected teams, with prefilled values and direct team actions rather than a disconnected blank form.
- Editing `workshop-blueprint/agenda.json` does not change an existing instance until that instance is explicitly reset or recreated.
- `workshop-skill/` documents working commands for listing, creating, removing, and locally editing instance agendas.
- Automated tests cover instance lifecycle, agenda mutation, and removal safety.

## References

- [`docs/brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md`](../brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md)
- [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md)
- [`docs/blueprint-import-model.md`](../blueprint-import-model.md)
- [`docs/workshop-instance-runbook.md`](../workshop-instance-runbook.md)
- [`docs/private-workshop-instance-schema.md`](../private-workshop-instance-schema.md)
- [`dashboard/lib/workshop-data.ts`](../../dashboard/lib/workshop-data.ts)
- [`dashboard/lib/workshop-store.ts`](../../dashboard/lib/workshop-store.ts)
- [`dashboard/lib/workshop-instance-repository.ts`](../../dashboard/lib/workshop-instance-repository.ts)
- [`dashboard/lib/workshop-state-repository.ts`](../../dashboard/lib/workshop-state-repository.ts)
- [`dashboard/app/api/workshop/route.ts`](../../dashboard/app/api/workshop/route.ts)
- [`dashboard/app/admin/page.tsx`](../../dashboard/app/admin/page.tsx)
- [`workshop-skill/SKILL.md`](../../workshop-skill/SKILL.md)
- [`workshop-skill/facilitator.md`](../../workshop-skill/facilitator.md)
