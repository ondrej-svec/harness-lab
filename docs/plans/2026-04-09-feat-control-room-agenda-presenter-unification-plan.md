---
title: "feat: agenda-centered control room and scene-first projector"
type: plan
date: 2026-04-09
status: complete
brainstorm: ../brainstorms/2026-04-08-facilitator-room-screen-and-presenter-flow-brainstorm.md
confidence: medium
---

# Agenda-Centered Control Room And Scene-First Projector Plan

Refocus the facilitator UX around one agenda-centered control room where the agenda is the workshop spine, the selected agenda item is the current operating object, and the projector becomes a scene-first room surface with minimal system chrome.

## Problem Statement

The current direction still carries too much product structure that the facilitator should not have to think about during a live workshop.

Right now the experience is split in ways that feel artificial:

- the facilitator conceptually moves between `live` and `agenda`, even though the real workshop is one continuous agenda-driven flow
- agenda context, agenda editing, and presenter controls are distributed across separate interaction models
- selecting an agenda item and editing it do not feel like one coherent action
- the presenter launcher still reads as a technical control card instead of an extension of the selected workshop moment
- the room projector still shows too much dashboard-derived chrome, which weakens the richer scene content already being authored

The workshop itself gives the answer: almost everything meaningful should orbit the agenda.

The product therefore needs to become simpler:

- one main control room
- one visible workshop spine
- one selected moment
- one obvious set of actions for that moment

## Proposed Solution

Replace the conceptual `live` vs `agenda` split with one agenda-centered control room.

The main surface should work like this:

1. show a strong top summary with event context and current position in the workshop
2. make the agenda timeline the primary navigation and mental model
3. treat the selected agenda item as the current object
4. show a detail pane for that selected item with:
   - room-facing summary
   - scene pack
   - `open projection`
   - `open participant 1:1`
   - in-place editing for agenda content
   - scene actions where needed
5. move low-frequency and safety controls out of the main workshop flow
6. make the projector route scene-first, not control-first

The projector should be explicitly re-scoped:

- the room should primarily see the scene itself
- internal agenda labels and scene-management chrome should not lead the screen
- source strips and system metadata should be hidden or heavily demoted by default
- rich authored content should feel like the product, not like content trapped inside an admin wrapper

## Detailed Plan Level

This is a **detailed** plan because it changes facilitator IA, page structure, presenter launch behavior, projection chrome, and regression coverage across the control room and presenter surfaces.

## Decision Rationale

### Why one agenda-centered control room is better than `live` plus `agenda`

The workshop is already agenda-driven in the data model and in real facilitation practice. Creating a conceptual split between “live operation” and “agenda work” adds product structure that does not match the facilitator’s actual job.

In practice, the facilitator always needs some combination of the same questions:

- where are we now?
- what is next?
- what should the room see for this moment?
- do I need to adjust this moment?

Those are not separate products. They are one workflow.

### Why the agenda should be the spine of the UX

The agenda is already the clearest durable object:

- it defines the workshop sequence
- it already owns presenter scenes in the runtime model
- it is the natural place to anchor transitions, projection, participant mirror, and local edits

A good control room should therefore spin around the agenda rather than ask the facilitator to switch mental frames.

### Why the selected agenda item should be the current operating object

Once one agenda item is selected, the facilitator should be able to do everything relevant for that moment in one place:

- understand the moment
- see its room-facing scene pack
- open the projector
- mirror the participant view
- edit the moment if needed

That is much simpler than holding one context in the page body and another in an overlay.

### Why the projector must become scene-first

The point of the richer presenter work was not just “more blocks.” It was to make the room experience feel intentional and premium. That goal fails if the projector still leads with facilitator metadata such as agenda labels, scene labels, or source-management framing.

The projector should therefore default to:

- almost no admin chrome
- minimal or no internal process labels
- the scene itself as the dominant artifact

### Why only one participant action should stay primary

The main operational distinction is clear:

- show the room projection
- show participants exactly what their surface looks like

Scene-level participant walkthrough remains legitimate, but it should not compete in the primary launcher area if it reads as a near-duplicate.

## Assumptions

| Assumption | Status | Evidence |
| --- | --- | --- |
| The agenda is already the strongest backbone for facilitator workflow | Verified | The control-room route and presenter model already key off agenda item selection in [`dashboard/app/admin/instances/[id]/page.tsx`](../../dashboard/app/admin/instances/[id]/page.tsx) and [`dashboard/lib/presenter-view-model.ts`](../../dashboard/lib/presenter-view-model.ts) |
| Splitting the main facilitator flow into `live` and `agenda` adds friction rather than clarity | Unverified | Strongly supported by current user feedback and current page structure, but still needs implementation validation |
| The selected agenda item can serve as the parent object for projection, participant mirror, and editing | Verified | Current presenter and scene behavior is already agenda-owned in the runtime model |
| The current room projection shows too much system chrome for the intended premium feel | Verified | Recent feedback on the presenter route plus the currently visible agenda/scene framing in the room-facing surface |
| Rich scene content already exists but is being undercut by the presenter wrapper | Verified | The April 9 rich-presenter proof slice added stronger `opening` content in [`docs/plans/2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md`](./2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md), while the presenter route still exposes strong wrapper chrome |
| A simpler single-surface control room will reduce facilitator confusion without hiding needed actions | Unverified | Good product inference, but must be checked against real usage and browser regression |
| Source strips and internal labels are not needed on the projected room surface by default | Unverified | Likely true for room-facing delivery, but the exact default/toggle policy still needs validation |

## Risk Analysis

### Risk: The simplification still leaves too much UI on the main control room

If every capability remains visible at once, the page will still feel busy even if the IA language improves.

Mitigation:

- keep the agenda as the primary spine
- let the selected item own the detail pane
- move secondary and safety actions out of the main workshop flow

### Risk: “Agenda-centered” turns into a dense editor instead of a calm operating view

If the detail pane becomes a long stack of editable forms by default, the product will feel like an internal CMS instead of a live workshop operating system.

Mitigation:

- default the selected-item pane to a clear overview mode
- reveal editing progressively and in place
- show only one primary detail mode at a time

### Risk: The projector loses too much context when chrome is removed

Some chrome may still be useful for certain facilitator behaviors.

Mitigation:

- remove or demote chrome by default, not irreversibly
- preserve operational context in the control room
- add a toggle only if real use proves it necessary

### Risk: Removing the main participant walkthrough button hides a useful path

If facilitators do need that distinction often, simplification could go too far.

Mitigation:

- keep participant walkthrough available at the scene level
- simplify only the primary launcher row
- verify through usage and e2e coverage

### Risk: This work drifts into another full admin redesign

Because control-room IA is involved, the task could expand beyond the workshop-flow problem.

Mitigation:

- keep the route structure intact unless implementation proves otherwise
- focus only on agenda-centered workshop operation and projector behavior
- do not reopen unrelated access/settings/workspace concerns in this slice

## Phased Implementation

### Phase 1: Define the simplified control-room model

Goal: lock the mental model before implementation.

Tasks:

- [x] Define the control room as one agenda-centered workshop surface rather than `live` plus `agenda`
- [x] Define the fixed top summary contract: where we are now, what is next, and event context
- [x] Define the agenda spine contract: list, selection state, and current/upcoming signals
- [x] Define the selected-item detail-pane contract
- [x] Define which controls leave the main workshop flow

Exit criteria:

- one clear page mental model exists
- the agenda is explicitly the backbone of the UX

### Phase 2: Rebuild the main control room around agenda selection

Goal: make agenda selection the primary control-room interaction.

Tasks:

- [x] Refactor the main route so the agenda timeline/list becomes the primary workshop navigation
- [x] Keep current event context and workshop status visible without creating a second “live product” above the agenda
- [x] Ensure the selected item drives the right-side detail pane
- [x] Remove the detached feeling between agenda context and agenda operations

Exit criteria:

- a facilitator can understand the workshop from one screen anchored by the agenda
- there is no conceptual need to switch between separate operational modes for normal workshop flow

### Phase 3: Make the selected-item detail pane the workbench

Goal: keep all moment-specific work together.

Tasks:

- [x] Default the detail pane to a clear overview of the selected agenda item
- [x] Add in-place progressive editing for agenda content
- [x] Show the selected item’s scene pack directly in the same pane
- [x] Put `open projection` and `open participant 1:1` directly in that item-level context
- [x] Keep scene edit/add access nested under the same item-level workbench

Exit criteria:

- selecting a workshop moment gives one obvious place to work on that moment
- agenda editing and presenter operations feel like one continuous flow

### Phase 4: Simplify launcher behavior and participant actions

Goal: remove redundant top-level controls.

Tasks:

- [x] Reduce primary presenter actions to room projection and participant 1:1 mirror
- [x] Move participant walkthrough out of the primary launcher row and into scene-level context
- [x] Remove duplicated presenter context that can already be inferred from the selected agenda item

Exit criteria:

- the primary controls are easy to scan under workshop pressure
- participant actions no longer read as duplicates

### Phase 5: Re-scope the projector as a scene-first surface

Goal: make the room output feel rich and intentional.

Tasks:

- [x] Remove or heavily demote internal agenda/scene chrome from the presenter route
- [x] Reevaluate source-strip defaults for room projection
- [x] Ensure the projector visually leads with scene title, narrative blocks, imagery, and core message rather than management metadata
- [x] Validate that the richer authored scene packs now actually read as premium on projection

Exit criteria:

- the projector feels like a room-facing narrative surface
- scene richness is visible in the product, not only in the content model

### Phase 6: Regression coverage and documentation

Goal: ship the simplified model without losing reliability.

Tasks:

- [x] Update server-rendered route tests for the agenda-centered control room
- [x] Add or refresh e2e coverage for agenda selection, in-place edit flow, and presenter launch behavior
- [x] Refresh any visual baselines affected by projector chrome changes
- [x] Update relevant docs if the control-room operating model changes materially

Exit criteria:

- the simplified workshop-flow model is protected by tests
- the next maintainer can understand the new operating model from the repo

## Completion Notes

- The default control-room route now resolves to the agenda-centered operating surface and treats `live` as a compatibility alias rather than a separate product.
- The selected agenda item now owns projection launch, participant 1:1 mirror, inline item editing, and the scene pack in one workbench.
- The presenter route now leads with the scene itself, keeps source material subordinate, and includes low-chrome previous / next scene navigation inside the scene pack.
- Verification ran with `npm run lint`, `npm run build`, `npm run test`, and targeted Playwright coverage for the affected facilitator and presenter slice.

## Implementation Tasks

1. **Lock the mental model**
- [x] Define the one-page agenda-centered operating contract
- [x] Define what leaves the main workshop flow

2. **Refactor the control room**
- [x] Make the agenda the primary navigation spine
- [x] Make the selected item own the main detail pane

3. **Unify item-level actions**
- [x] Inline agenda editing into the selected-item pane
- [x] Show scene pack and projection actions in the same item-level context

4. **Simplify the presenter controls**
- [x] Keep only room projection plus participant 1:1 as primary actions
- [x] Move walkthrough-specific access to scene-level context

5. **De-adminify the projector**
- [x] Remove telegraphing chrome
- [x] Rebalance source-strip behavior
- [x] Make rich scenes the visible product

6. **Verify and document**
- [x] Update tests and baselines
- [x] Update relevant docs

## Acceptance Criteria

- The facilitator can run the workshop from one agenda-centered control room without mentally switching between separate `live` and `agenda` products.
- The agenda is the primary navigation and comprehension spine of the workshop UI.
- The selected agenda item provides one coherent place to understand, edit, and project that moment.
- The main projection controls are simple and non-redundant.
- The room projector feels scene-first and premium rather than admin-derived.
- The richer scene content already authored in the repo is materially more visible in the projected experience.

## References

- [`dashboard/app/admin/instances/[id]/page.tsx`](../../dashboard/app/admin/instances/[id]/page.tsx)
- [`dashboard/lib/presenter-view-model.ts`](../../dashboard/lib/presenter-view-model.ts)
- [`dashboard/app/admin/admin-ui.tsx`](../../dashboard/app/admin/admin-ui.tsx)
- [`docs/plans/2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md`](./2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md)
- [`docs/plans/2026-04-08-feat-facilitator-room-screen-and-presenter-flow-plan.md`](./2026-04-08-feat-facilitator-room-screen-and-presenter-flow-plan.md)
- [`docs/plans/2026-04-07-feat-facilitator-cockpit-ia-and-ux-redesign-plan.md`](./2026-04-07-feat-facilitator-cockpit-ia-and-ux-redesign-plan.md)
- [`docs/brainstorms/2026-04-08-facilitator-room-screen-and-presenter-flow-brainstorm.md`](../brainstorms/2026-04-08-facilitator-room-screen-and-presenter-flow-brainstorm.md)
- [`docs/brainstorms/2026-04-09-presenter-blueprint-rich-content-direction-brainstorm.md`](../brainstorms/2026-04-09-presenter-blueprint-rich-content-direction-brainstorm.md)
