---
title: "refactor: facilitator UI revamp"
type: plan
date: 2026-04-19
status: complete
brainstorm: ../brainstorms/2026-04-19-facilitator-ui-revamp-brainstorm.md
confidence: medium
---

# Facilitator UI Revamp Plan

**One-line summary:** Narrow the facilitator product to four sections (`Run`, `People`, `Access`, `Settings`), remove agenda/scene authoring from the dashboard UI, and add durable team-composition history so the live workshop surface feels calm, agenda-centered, and flexible under real hackathon conditions.

## Problem Statement

The current facilitator UI is overloaded because it still mixes live workshop operation with instance-local authoring.

In practice, the control room currently asks the facilitator to parse:

- a large shell with persistent metadata and utility controls
- a broad section model (`live`, `agenda`, `teams`, `people`, `signals`, `access`, `settings`)
- agenda detail editing inline on the main canvas
- scene-stage and scene-edit affordances inside the same flow as live workshop control

This creates three problems:

1. the default surface is cognitively heavier than the live workshop job requires
2. the product does not present a strong "built with Codex" story because the core surface reads as an overgrown admin workbench
3. the UI currently owns responsibilities that already have a better operational home in the coding-agent and CLI path

At the same time, recent People/Teams work confirmed that not all complexity is accidental. Team formation, late-arrival handling, and rotation-driven reshaping are true live workshop operations and must remain first-class in the product. The redesign therefore needs to simplify by responsibility, not by blindly deleting features.

## Target End State

When this lands:

1. The facilitator product exposes only four sections:
   - `Run`
   - `People`
   - `Access`
   - `Settings`
2. `Run` is the default, agenda-centered live runner. It answers:
   - where the workshop is now
   - what comes next
   - what the room should see
   - what the safe next action is
3. `People` owns team formation and live team operations, including a visible timeline of team-composition changes across one or more rotations.
4. `Access` owns participant code handling and facilitator access management, but does not compete with the default Run canvas.
5. `Settings` owns reset, archive, and other high-risk controls.
6. Agenda editing and presenter-scene editing are no longer available in the dashboard UI.
7. CLI and coding-agent paths remain the supported mutation path for agenda and scene changes.
8. Design docs, runbooks, and facilitator skill docs all describe the same contract instead of preserving the old runtime-authoring assumption.

## Scope and Non-Goals

### In scope

- Facilitator IA refactor from the current multi-section model to `Run`, `People`, `Access`, `Settings`
- New `Run` section contract and UI
- Merge/fold existing `live`, `agenda`, and `signals` responsibilities into `Run`
- Keep `People` as a first-class section and add team-composition history support
- Keep `Access` and `Settings`, but demote them relative to workshop flow
- Remove agenda and scene editing affordances from the dashboard UI
- Preserve CLI/API mutation paths for agenda and scenes
- Update related docs, runbooks, and facilitator skill guidance
- Add preview artifacts before implementation starts

### Non-goals

- redesigning the presenter scenes themselves
- rewriting workshop scene content
- changing the blueprint/runtime architecture
- removing existing agenda/scenes APIs from the backend
- replacing the CLI/agent authoring path
- building a generic workshop analytics product
- adding a computed rotation algorithm

## Proposed Solution

### High-level shape

Refactor the facilitator product around a smaller, clearer control model:

- `Run` replaces the current agenda/live/signals mix
- `People` remains and absorbs any remaining team-focused operations from `teams`
- `Access` remains focused on participant access and facilitator grants
- `Settings` remains focused on destructive or recovery operations

### What moves where

- Current `agenda` section becomes the new `Run` surface, but stripped of editing and stage-authoring controls.
- Current `live` alias is retired instead of mapping back to agenda semantics.
- Current `signals` section is folded into `Run` as contextual handoff/rotation support.
- Current `teams` section is folded into `People` where it overlaps with live team operations.
- Agenda/scene overlays and inline-field authoring are removed from the dashboard UI.

### Team history model

Add a dedicated append-only team-composition history model rather than a single before/after snapshot.

Recommended shape:

- new append-only event store for team composition changes
- event types such as `assigned`, `unassigned`, `moved`, and `rotation_marker`
- each event records at minimum:
  - `instance_id`
  - `participant_id`
  - `from_team_id` nullable
  - `to_team_id` nullable
  - `captured_at`
  - `actor_kind`
  - optional `note` / `rotation_id`

This keeps the current `team_members` table as the source of current truth while adding a durable history seam for the People UI and future workshop analysis.

### Preview-first rule

Do not implement the redesign directly from prose. Produce three preview artifacts first:

1. static Run mockup
2. static People mockup with team-history affordance
3. section map showing removed, merged, and retained responsibilities

Implementation starts only after these previews are reviewed and accepted.

## Decision Rationale

### Why this is a refactor, not a feature add

The main goal is not to add new facilitator power. It is to remove the wrong responsibilities from the dashboard and sharpen the product boundary around live operation.

### Why keep People in the product

The brainstorm and the participant-management plan both point the same way: People/Teams is not back-office admin. It is part of the live workshop method. Removing it would simplify the product on paper while harming the real workshop operation.

### Why remove dashboard agenda/scene authoring instead of hiding it

The repo already has a credible CLI/agent mutation path. Keeping runtime editing in the UI because it exists today would preserve the overload the redesign is meant to solve. A softer hiding strategy still keeps the wrong product responsibility alive and likely to creep back onto the main surface later.

### Why use an append-only team history instead of one snapshot per rotation

The user explicitly wants flexibility for one rotation or two, and workshops routinely change on the spot. A single before/after snapshot matches one expected workshop script; an event history matches the real operating conditions and supports future derived views.

### Alternatives considered

1. Keep the current UI and only tune progressive disclosure.
   Rejected because the default canvas would still own authoring responsibilities.

2. Reduce the product to only a live runner and move People out too.
   Rejected because team formation and reshaping are real live operations.

3. Keep agenda/scene authoring in a secondary hidden route.
   Rejected because it keeps the wrong product boundary alive and makes docs/training harder to keep honest.

## Constraints and Boundaries

- The dashboard remains a protected facilitator product; no participant-safe data boundaries move in this plan.
- Agenda/scenes APIs may remain for CLI and coding-agent use even if the dashboard no longer exposes them.
- `People` must stay compatible with the participant/team-formation work already landed in the repo.
- The product must still work on iPad-class screens and remain acceptable on phone.
- Any repeated visual, IA, or interaction pattern introduced by this refactor must update the relevant design docs in the same slice:
  - [`docs/dashboard-design-system.md`](../dashboard-design-system.md) when a shared dashboard-wide rule changes
  - [`docs/facilitator-dashboard-design-rules.md`](../facilitator-dashboard-design-rules.md) when facilitator product rules change
  - [`docs/facilitator-control-room-design-system.md`](../facilitator-control-room-design-system.md) when control-room layout or interaction patterns change
- The plan must not reintroduce a second authoring system for reusable workshop content.
- The refactor must stay inside the existing dashboard design-system foundations:
  - calm before clever
  - progressive disclosure by default
  - read mode and edit mode visibly distinct
  - explicit action hierarchy
  - mobile is not a fallback
  - pending-state and scroll-preservation rules for admin navigation
- UI verification follows the repo rule: exploratory browser check, Playwright regression for critical flows, then human review.

## Subjective Contract

- **Target outcome:** the facilitator opens the product and immediately knows what is live, what is next, and the one safe action to take.
- **Anti-goals:**
  - a CMS disguised as a control room
  - a dense enterprise admin shell
  - permanent visibility for low-frequency controls
  - scene tiles or agenda objects that read like passive metadata rather than actions
- **References:**
  - [`docs/facilitator-dashboard-design-rules.md`](../facilitator-dashboard-design-rules.md)
  - [`docs/facilitator-control-room-design-system.md`](../facilitator-control-room-design-system.md)
  - the People-section proof slice from [`2026-04-16-feat-participant-management-and-team-formation-plan.md`](2026-04-16-feat-participant-management-and-team-formation-plan.md)
- **Anti-references:**
  - the current agenda detail hero with inline editing
  - scene-stage authoring inside the live control-room flow
  - top-heavy header chrome plus many competing secondary panels
- **Tone or taste rules:**
  - agenda-centered, not dashboard-centered
  - calm, operational, explicit
  - progressive disclosure by default
  - only one dominant action per local area
  - reuse existing admin motion, pending-state, and surface-role patterns instead of inventing bespoke chrome
- **Representative proof slice:** the redesigned `Run` screen plus the simplified section model
- **Rollout rule:** the broader cleanup does not propagate until the proof-slice Run screen clearly reads as a live runner instead of an editor
- **Rejection criteria:**
  - editing fields remain on Run
  - the main screen still asks the facilitator to scan multiple unrelated panels before acting
  - People cannot explain team reshaping history after one or more rotations
- **Required preview artifacts:**
  - Run mockup
  - People mockup with history
  - section/responsibility map

## Phased Implementation

### Phase 0: Preview Gate

Goal: make the redesign concrete before touching code.

Exit criteria:

- static Run mockup exists
- static People mockup with team-history affordance exists
- section map exists showing retained, merged, moved, and removed responsibilities
- the preview explicitly calls out which design-system rules are reused versus which docs need updating
- user reviews the previews and confirms the direction

### Phase 1: Contract and Documentation Alignment

Goal: update the written product contract before code starts drifting.

Exit criteria:

- surface-model docs describe `Run`, `People`, `Access`, `Settings`
- facilitator design docs stop describing dashboard runtime authoring as part of the normal control-room contract
- runbook and facilitator skill docs route agenda/scene changes to CLI/agent flows instead of dashboard UI
- testing notes for the refactor point to the critical verification flows before implementation spreads

### Phase 2: Navigation and Shell Refactor

Goal: collapse the section model and route semantics.

Exit criteria:

- control-room section registry contains only `run`, `people`, `access`, `settings`
- old aliases are redirected or compat-mapped deliberately
- shell, header, summary, and outline/section navigation match the new four-section model
- shell interactions still satisfy the existing pending-state and scroll-preservation rules

### Phase 3: Run Surface Refactor

Goal: implement the agenda-centered live runner.

Exit criteria:

- Run shows current workshop moment, next moment, participant/handoff state, and presenter launch affordances
- move-live control remains
- agenda and scene editing affordances are removed from Run
- source/storage notes and scene-stage authoring no longer appear on the main live canvas
- Run still works cleanly on iPad-class screens
- Run has explicit exploratory-review and Playwright proof coverage before broader propagation

### Phase 4: People Surface Consolidation and History

Goal: merge team operations under People and add durable team-composition history.

Exit criteria:

- People absorbs the remaining live team operations that still matter from `teams`
- append-only team-composition history model exists
- facilitator can inspect current team state and the history of changes across rotation events
- People history behavior has repository/action coverage and at least one browser-level critical path

### Phase 5: Access / Settings Quieting

Goal: keep necessary operations without letting them dominate the product.

Exit criteria:

- Access contains participant-code and facilitator-access operations only
- Settings contains reset/archive and similar safety operations only
- neither section competes with Run for primary product identity

### Phase 6: Cleanup, Regression, and Doc Follow-through

Goal: remove old UI assumptions and prove the new contract.

Exit criteria:

- obsolete UI affordances and overlays for agenda/scene authoring are removed
- Playwright coverage reflects the new section model and Run proof slice
- docs match reality

## Testing Protocol

This refactor changes facilitator controls, section routing, state transitions, and the shape of the primary UI. Verification is therefore a delivery requirement, not cleanup.

### Required verification ladder

1. **Preview review before implementation**
   - Review the Run and People mockups plus the section map before code changes start.
   - Confirm whether the refactor reuses existing design-system rules or requires doc changes.

2. **Unit and tracer-bullet coverage**
   - Add or update focused tests around section resolution, redirect/compat mapping, and any new team-history logic.
   - Add direct tests for any repository/action layer that records team-composition history.
   - Add thin page/action tests where App Router branching changes materially.

3. **Critical-path Playwright coverage**
   - Cover the new four-section shell and default Run flow.
   - Cover at least one People flow that proves history is visible after team composition changes.
   - Cover Access/Settings reachability without treating them as co-primary surfaces.

4. **Exploratory browser review**
   - Inspect the refactor in an isolated local environment.
   - Check browser console and page-error output on the dominant facilitator flows.
   - Verify the first screen still answers: where are we, what matters next, what is the safe action now?

5. **Human review**
   - Treat human review as the final trust boundary for the proof-slice Run surface before broader cleanup lands.

### Minimum executable checks expected before completion

- `cd dashboard && npm run test`
- `cd dashboard && npm run test:e2e`
- `cd dashboard && npm run lint`
- `cd dashboard && npm run build`

If any of these are intentionally deferred, the final work summary must say so explicitly and explain why.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The current overload is mainly caused by mixed live-operation and authoring responsibilities | Verified | Confirmed in the brainstorm and current `agenda-section.tsx` / overlay structure |
| CLI and coding-agent flows are credible replacement paths for agenda/scene mutation | Verified | `workshop-skill/facilitator.md` already documents agenda and scenes mutation through privileged paths |
| People/Teams must remain in the facilitator product | Verified | Brainstorm decision plus the participant-management plan's proof slice |
| A four-section model is sufficient for facilitator operations | Unverified | Likely correct, but needs preview validation before implementation |
| `signals` can be folded into Run without losing operational clarity | Unverified | Needs preview and implementation validation |
| Access can remain a lighter secondary section rather than a co-primary operating surface | Unverified | Needs proof in mockup and real UI |
| Team-composition history is best represented by an append-only event model rather than snapshots | Unverified | Strong fit for the requirement, but still needs design confirmation during implementation |

Unverified assumptions become explicit tasks and preview gates below.

## Risk Analysis

### Risk: removing UI authoring leaves facilitators without a usable emergency path

Mitigation:

- keep backend APIs intact
- keep facilitator skill and CLI docs explicit
- test the common mutation workflows through CLI/agent path before removing the dashboard affordances

### Risk: section collapse hides too much context

Mitigation:

- prove the section model in static previews first
- keep current/next/handoff signals visible on Run
- use explicit compat redirects for old links so the transition is legible

### Risk: team-history scope balloons into a full analytics system

Mitigation:

- keep the history model append-only and operational
- focus only on facilitator-readable timeline and snapshot reconstruction
- defer cross-cohort or aggregate analysis

### Risk: docs and runtime behavior drift during the transition

Mitigation:

- update docs in Phase 1 before implementation
- treat the docs as a gate, not cleanup

### Risk: old section aliases and tests linger and preserve the old mental model

Mitigation:

- explicitly remove or compat-map them in one phase
- update Playwright expectations to the new four-section contract

## Implementation Tasks

Dependency ordered. These become the tracker for `$work`.

### Phase 0 — Preview Gate

- [x] Create Run mockup artifact under `docs/previews/` showing the agenda-centered live runner without editing affordances.
- [x] Create People mockup artifact under `docs/previews/` showing team operations plus team-composition history.
- [x] Create a section/responsibility map under `docs/previews/` that shows:
  - old section set
  - new section set
  - what moved out of the UI
  - what merged into Run and People
- [x] Mark in the preview artifacts which design-system rules are reused unchanged and which docs need updating.
- [x] Review the three preview artifacts with the user before any implementation work starts.

### Phase 1 — Contract and Documentation Alignment

- [x] Update [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md) to describe `Run`, `People`, `Access`, `Settings` and to stop describing dashboard agenda/scene authoring as part of the default facilitator contract.
- [x] Update [`docs/dashboard-design-system.md`](../dashboard-design-system.md) if the refactor changes any shared dashboard-wide rule rather than only facilitator-local rules.
  No shared dashboard-wide rule changed, so no edit was required.
- [x] Update [`docs/facilitator-dashboard-design-rules.md`](../facilitator-dashboard-design-rules.md) with the narrowed product model.
- [x] Update [`docs/facilitator-control-room-design-system.md`](../facilitator-control-room-design-system.md) so Run is explicitly the default agenda-centered live surface.
- [x] Update [`docs/workshop-instance-runbook.md`](../workshop-instance-runbook.md) to route agenda/scene changes through CLI/agent flows instead of dashboard UI.
- [x] Update [`workshop-skill/facilitator.md`](../../workshop-skill/facilitator.md) so facilitator guidance reflects the new dashboard/CLI split.
- [x] Note the critical verification flows for this refactor in the execution notes and update testing docs only if a recurring new pattern lands.

### Phase 2 — Navigation and Shell Refactor

- [x] Refactor `dashboard/lib/admin-page-view-model.ts` so the control-room section registry becomes `run`, `people`, `access`, `settings`.
- [x] Decide and implement compat behavior for old section names (`live`, `agenda`, `teams`, `signals`) so old URLs fail clearly or redirect intentionally.
- [x] Update `dashboard/app/admin/instances/[id]/_lib/admin-page-loader.ts` to load the new section model and stop centering the page around agenda-detail authoring state.
- [x] Update the control-room shell components (`control-room-header`, outline/section navigation, persistent summary) to match the new section contract.
- [x] Add focused tests for section resolution, legacy alias behavior, and any changed page-loader branching.
- [x] Verify shell navigation still uses the established pending-state and scroll-preservation patterns.

### Phase 3 — Run Surface Refactor

- [x] Replace the current agenda/live/signal mixture with a dedicated Run section component or contract.
- [x] Keep only the live-operational elements on Run:
  - current workshop moment
  - next workshop moment
  - move-live control
  - presenter launch
  - contextual participant/handoff state
- [x] Remove inline agenda editing from the main live surface.
- [x] Remove scene-stage authoring and scene-edit sheet affordances from the main live surface.
- [x] Remove source/storage explanatory furniture from the Run canvas.
- [x] Ensure Run still works cleanly on iPad-class screens.
- [x] Run exploratory browser review on the proof-slice Run surface, including console/page-error inspection.
- [x] Add or update Playwright coverage for the default Run flow and its dominant actions.
- [x] Add human review of the proof-slice Run surface before propagating cleanup further.

### Phase 4 — People Consolidation and Team History

- [x] Decide the precise People-section contract: what remains from current `teams` versus current `people`.
- [x] Design the append-only team-composition history model and document it before implementation.
- [x] Add the persistence layer for team-composition history.
- [x] Hook team assignment / unassignment / move flows so every mutation records history.
- [x] Add explicit rotation markers or equivalent grouping so multiple reshapes are legible later.
- [x] Update the People UI so the facilitator can inspect current team state and the history timeline.
- [x] Add repository/action tests for team-composition history recording and retrieval.
- [x] Add or update browser-level regression coverage for at least one team-change history flow.

### Phase 5 — Access and Settings Quieting

- [x] Narrow Access to participant-code and facilitator-access operations only.
- [x] Narrow Settings to reset/archive and similar safety/recovery operations only.
- [x] Remove residual low-frequency operations from more prominent areas of the shell.
- [x] Verify that Access and Settings remain reachable without competing with Run for attention.
- [x] Add or update regression coverage for the critical Access/Settings entry points that remain.

### Phase 6 — Cleanup and Regression

- [x] Remove obsolete agenda/scene UI code paths that should no longer be reachable from the dashboard.
- [x] Review whether legacy server actions for UI-only authoring can be deleted or should remain for non-UI consumers.
- [x] Update or add Playwright coverage for:
  - new four-section shell
  - Run proof slice
  - People history visibility
  - Access and Settings secondary behavior
- [x] Run the full dashboard verification set: `npm run test`, `npm run test:e2e`, `npm run lint`, `npm run build`.
- [x] Confirm exploratory browser review and human review happened for the proof-slice Run surface.
- [x] Run the doc-follow-through pass so no maintainer-facing surface still describes the old product model.

## Execution Notes

- Critical verification flows now covered in browser regression are:
  - the run-first control room shell and section model
  - Run detail launch + live-marker + participant-surface controls
  - People history marker and assignment timeline visibility
  - Access/Settings reachability as secondary sections
- No shared dashboard-wide design-system rule changed, so `docs/dashboard-design-system.md` stayed untouched.
- The protected-route browser sanity pass was validated through the rebuilt Playwright production server plus the updated visual/browser regression tests, since direct devtools auth into the file-mode protected route is not available in this environment.

## Acceptance Criteria

1. The facilitator control room exposes only `Run`, `People`, `Access`, and `Settings`.
2. The default Run surface contains no agenda-edit or scene-edit controls.
3. A facilitator can still:
   - see what is live now
   - see what is next
   - move the live marker
   - launch the presenter surface
   - inspect participant/handoff state
4. The People section still supports live team operations and now shows a timeline of team-composition changes.
5. Access and Settings remain available but no longer dominate the primary workshop flow.
6. Dashboard docs, runbook, and facilitator skill docs all describe the same product contract.
7. CLI/agent guidance for agenda and scene mutation is explicit and does not rely on removed dashboard affordances.
8. Preview artifacts were reviewed before implementation.
9. Critical facilitator flows are covered by relevant Playwright regression before the refactor is considered done.
10. Repository/action-level verification exists for the team-composition history model.
11. The relevant dashboard checks pass: `test`, `test:e2e`, `lint`, and `build`.
12. The relevant design docs were updated wherever the refactor introduced a recurring new pattern or changed an existing one.

## References

- Brainstorm: [`../brainstorms/2026-04-19-facilitator-ui-revamp-brainstorm.md`](../brainstorms/2026-04-19-facilitator-ui-revamp-brainstorm.md)
- Current control-room loader: [`dashboard/app/admin/instances/[id]/_lib/admin-page-loader.ts`](../../dashboard/app/admin/instances/%5Bid%5D/_lib/admin-page-loader.ts)
- Current agenda-heavy live surface: [`dashboard/app/admin/instances/[id]/_components/sections/agenda-section.tsx`](../../dashboard/app/admin/instances/%5Bid%5D/_components/sections/agenda-section.tsx)
- Current People section: [`dashboard/app/admin/instances/[id]/_components/sections/people-section.tsx`](../../dashboard/app/admin/instances/%5Bid%5D/_components/sections/people-section.tsx)
- Current section registry: [`dashboard/lib/admin-page-view-model.ts`](../../dashboard/lib/admin-page-view-model.ts)
- Facilitator skill command contract: [`workshop-skill/facilitator.md`](../../workshop-skill/facilitator.md)
- Participant/team formation precedent: [`2026-04-16-feat-participant-management-and-team-formation-plan.md`](2026-04-16-feat-participant-management-and-team-formation-plan.md)
