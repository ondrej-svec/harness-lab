---
title: "feat: facilitator room screen and presenter flow"
type: plan
date: 2026-04-08
status: completed
brainstorm: /Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-08-facilitator-room-screen-and-presenter-flow-brainstorm.md
confidence: medium
---

# Facilitator Room Screen And Presenter Flow Plan

Add an agenda-driven presenter surface that the facilitator launches from the control room, with blueprint-default room scenes, instance-local overrides, and a clean room-facing route that can show participant walkthroughs, best-practice cues, and shared workshop transitions without requiring a separate deck.

## Problem Statement

Harness Lab already has:

- a participant surface at [`dashboard/app/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/page.tsx)
- a facilitator workspace and control room at [`dashboard/app/admin/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/page.tsx) and [`dashboard/app/admin/instances/[id]/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/instances/[id]/page.tsx)
- a runtime agenda model in [`dashboard/lib/workshop-data.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-data.ts) and [`dashboard/lib/workshop-store.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-store.ts)

What it does not have is a first-class answer to:

- what the room should see right now
- how the facilitator launches that room-facing output from the control room
- where best-practice teaching beats, transitions, and shared prompts live in the product
- how agenda edits should affect the shared screen

This matters because the workshop promise is not just “dashboard plus docs.” It is a facilitator operating system that reduces stress on the day, keeps the room oriented, and turns the workshop method into something reusable and instance-aware.

## Proposed Solution

Implement presenter flow as a first-class extension of the existing blueprint/runtime model.

Day-one product shape:

1. add a presenter-scene model attached to agenda items
2. keep blueprint-owned default scenes in repo-native workshop blueprint data
3. allow instance-local override, reorder, enable/disable, and default-scene selection at runtime
4. expose all scene and agenda editing operations through shared facilitator APIs rather than UI-only server actions
5. update facilitator-skill contracts so a coding agent can inspect, create, reorder, edit, and remove scenes through the same runtime model
6. add a presenter-safe room-facing route that renders the current scene as a web page rather than a slide deck
7. let the facilitator launch presenter mode from the control room and jump across scenes or agenda items when needed
8. treat `participant-view` as one scene type, not the whole system
9. keep facilitator notes and second-screen workflows out of day-one scope unless the implementation proves they are essential

This should extend the current architecture rather than bypass it:

- blueprint remains canonical for reusable workshop design
- runtime remains canonical for the live workshop instance
- presenter flow reads from the active instance first and falls back to blueprint-imported defaults
- facilitator admin remains the operational control plane
- facilitator skill and admin use the same editable runtime APIs for agenda and scenes

## Detailed Plan Level

This is a **detailed** plan because it changes product behavior across blueprint content, runtime state, admin IA, routing, UI rendering, and regression coverage. It also has a real risk of scope drift into a presentation product, so the plan needs explicit guardrails.

## Decision Rationale

### Why extend the agenda model instead of building a parallel presentation system

The existing runtime model already treats agenda as the operational skeleton of the workshop. Presenter flow should inherit that backbone rather than introduce a second timeline with separate state and authoring rules.

### Why use scene-based web pages instead of slides

The brainstorm and external evidence both support visible agenda, deliberate transitions, and live demonstration. Those are better served by clear room-facing pages than by rebuilding slide mechanics inside the dashboard.

### Why launch presenter mode from the control room

The facilitator should not have to remember a second operational surface. The control room already owns live phase, agenda, and instance-local edits. Presenter mode should be one more action from that same surface.

### Why require API-first editing instead of admin-only scene management

Harness Lab already expects facilitator operations to work through shared runtime APIs and CLI-backed skill access. If scene authoring exists only in the admin UI, the facilitator skill cannot reliably configure the workshop through a coding agent, and the product would drift into two inconsistent control paths.

### Why use blueprint defaults plus runtime overrides

The workshop method should be reusable across events, but real events need adaptation. The repo already chose this boundary for agenda and instance state, so presenter scenes should follow the same rule.

### Why keep day-one scope intentionally narrow

There are too many tempting expansions:

- second-screen notes
- arbitrary deck authoring
- remote presenter control
- analytics-heavy stage tooling

Those are downstream concerns. Day one needs to prove that agenda-driven scenes reduce facilitator stress without creating a content-management burden.

### Alternatives considered

#### Alternative 1: Add only a “show participant view” shortcut

Rejected because it solves walkthroughs but not opening, best-practice framing, checkpoint prompts, rotation transitions, or reflection moments.

#### Alternative 2: Build a lightweight slide editor in admin

Rejected because it creates a second authoring product too early and weakens the blueprint/runtime discipline.

#### Alternative 3: Keep presenter content entirely in markdown/docs and switch manually

Rejected because it preserves the current fragmentation problem and fails the “always know what to show next” goal.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The runtime agenda is the correct backbone for presenter flow | Verified | Chosen in the brainstorm and already reflected in [`dashboard/lib/workshop-blueprint-agenda.json`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-blueprint-agenda.json) plus [`dashboard/lib/workshop-store.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-store.ts) |
| Presenter mode should be launched from the facilitator control room | Verified | Explicit brainstorm decision and aligns with the current control-room route in [`dashboard/app/admin/instances/[id]/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/instances/[id]/page.tsx) |
| Presenter scenes should be room-safe web pages, not a slide engine | Verified | Explicit brainstorm decision and external live-coding / workshop facilitation evidence |
| Blueprint defaults plus instance-local overrides is the right ownership model | Verified | Already chosen in prior blueprint/runtime work and reinforced by the brainstorm |
| Facilitator-editable scene operations should ship through shared APIs so the skill can drive them | Verified | Existing agenda editing already follows this pattern via [`dashboard/app/api/workshop/instances/[id]/agenda/route.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/api/workshop/instances/[id]/agenda/route.ts) and [`workshop-skill/facilitator.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-skill/facilitator.md) |
| Existing agenda item shape can absorb scene references without breaking current participant and admin reads | Unverified | [`dashboard/lib/workshop-data.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-data.ts) currently models agenda items as title/time/description only |
| The current control-room IA can accommodate a presenter launcher without overcrowding the `live` section | Unverified | [`dashboard/lib/admin-page-view-model.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/admin-page-view-model.ts) already has a `live` default section, but no presenter affordance yet |
| The number of scenes per agenda item can stay disciplined enough for blueprint authoring | Unverified | No scene model exists yet; this needs an explicit day-one scene taxonomy and limits |
| Day-one can omit second-screen facilitator notes without undermining usefulness | Unverified | The brainstorm left this open; it needs a deliberate v1 scoping call |
| Intermezzo can remain implicit or be cleanly promoted into the blueprint agenda without destabilizing current workshop flow | Unverified | [`content/facilitation/master-guide.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/content/facilitation/master-guide.md) treats intermezzo as operationally important, but [`dashboard/lib/workshop-blueprint-agenda.json`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-blueprint-agenda.json) does not encode it explicitly |

Unverified assumptions must turn into early design tasks or explicit risks rather than staying implicit.

## Risk Analysis

### Risk: Presenter scenes become an unbounded content system

If the schema is too flexible on day one, blueprint authoring will sprawl and every event will become a one-off.

Mitigation:

- define a small scene taxonomy for v1
- set a narrow content contract per scene type
- keep arbitrary “custom” scenes behind explicit justification or defer them

### Risk: The feature drifts into building slideware

If implementation starts optimizing for slide metaphors instead of room outcomes, the product will accumulate sequencing, animation, and authoring complexity that does not improve workshop delivery.

Mitigation:

- anchor the model around agenda + scenes + room-safe pages
- reject deck-style features unless they solve a specific workshop problem
- keep notes view, transitions, and design polish subordinate to core flow

### Risk: Presenter flow forks the source of truth from agenda/runtime state

If presenter state becomes a second timeline, the facilitator will have to reconcile two systems during live operation.

Mitigation:

- derive presenter defaults from the current agenda item
- keep manual scene switching explicit and reversible
- avoid separate “presentation phase” state

### Risk: Scene editing ships in admin first and the facilitator skill lags behind

If the admin UI grows scene-management features before the runtime API and skill contract are defined, the coding-agent workflow will become second-class and later retrofits will be awkward.

Mitigation:

- design scene operations as instance-scoped facilitator APIs from the start
- update facilitator skill docs and command surface in the same implementation slice
- add API coverage for scene CRUD, ordering, and default-scene selection before treating the feature as complete

### Risk: Public-safe and facilitator-safe boundaries become blurry

Some presenter scenes may need richer content than the public participant surface, but the room-facing surface must still not depend on privileged admin chrome.

Mitigation:

- define presenter scene data classification explicitly
- require room-facing routes to render without facilitator controls
- keep any privileged data out of presenter payloads by default

### Risk: The launcher and navigation are elegant but not operationally fast

A buried launcher or over-designed navigation would fail the real facilitator need even if the content model is sound.

Mitigation:

- place the launcher in the default `live` control-room workflow
- support current scene + scene list + agenda jump at minimum
- add browser coverage for the main launch and jump flows

### Risk: Baseline workshop content is not structured enough to drive good scenes

Current talk notes and facilitation guides are rich, but they are written for humans, not for direct structured rendering.

Mitigation:

- map current blueprint phases to explicit v1 scene types before implementation
- capture only the structured fields needed for room-facing delivery
- leave long-form facilitation prose in docs and pull only the essential room-facing signals into scene data

## Phased Implementation

### Phase 1: Define the presenter-scene contract and scope guardrails

Goal: lock the content model and stop the feature from turning into a generic presentation product.

Tasks:

- [x] Define the day-one scene taxonomy, likely including `briefing`, `demo`, `participant-view`, `checkpoint`, and `reflection`.
- [x] Define the minimal presenter-scene schema: identity, scene type, label, room-facing title/body, optional CTA/next-step prompt, optional participant-surface link target, and order.
- [x] Decide where scenes attach: directly on agenda items, or through a parallel per-phase scene collection keyed by agenda item id.
- [x] Define how default scene selection works for each agenda item and how manual override/jump behaves during a live session.
- [x] Define the facilitator API contract for scene inspection and mutation so the admin UI and facilitator skill share one model.
- [x] Decide the v1 stance on second-screen notes: explicitly out of scope or intentionally minimal.
- [x] Decide whether `intermezzo` becomes an explicit blueprint phase or remains encoded as scenes under existing phases.

Exit criteria:

- scene taxonomy is explicit
- schema is small and intentionally constrained
- unresolved “slides vs scenes vs notes” questions are closed for v1

### Phase 2: Extend blueprint and runtime data models

Goal: make presenter scenes a first-class part of the blueprint/runtime import model.

Tasks:

- [x] Add presenter-scene defaults to the blueprint-owned workshop model currently rooted in [`dashboard/lib/workshop-blueprint-agenda.json`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-blueprint-agenda.json) or move that blueprint to a richer structure if needed.
- [x] Extend the workshop state and instance projection types in [`dashboard/lib/workshop-data.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-data.ts) to represent imported scene defaults plus runtime overrides.
- [x] Define how runtime-local overrides are stored: reorder, enable/disable, replace text, change default scene, and add instance-only scenes if allowed.
- [x] Update blueprint-import / reset semantics in [`dashboard/lib/workshop-data.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-data.ts) and [`dashboard/lib/workshop-store.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-store.ts) so reset re-imports blueprint scenes and discards runtime-only changes.
- [x] Record enough metadata to trace whether a scene is blueprint-derived or instance-local.
- [x] Expose the scene-aware runtime model through instance-scoped API payloads instead of keeping it page-local.

Exit criteria:

- blueprint and runtime ownership are explicit
- reset semantics are clear
- presenter scenes fit the existing import model without introducing a second source of truth

### Phase 3: Create presenter read model and room-facing routes

Goal: render presenter scenes as a clean room-facing surface.

Tasks:

- [x] Add presenter read helpers that resolve the active agenda item, active default scene, and any requested manual override for a given instance.
- [x] Add instance-scoped facilitator API routes for scene listing and mutation, aligned with the existing agenda-editing route shape.
- [x] Add a presenter-safe route for the room-facing surface, likely nested under the instance scope rather than under public participant routes.
- [x] Add support for rendering at least the day-one scene types as intentionally designed web pages rather than generic markdown dumps.
- [x] Implement `participant-view` as a scene type that hands off to or mirrors the participant surface without exposing facilitator controls.
- [x] Ensure room-facing rendering uses projection-friendly visual rules: large type, simple hierarchy, low distraction, and obvious next step.

Exit criteria:

- a facilitator can open a clean room-facing scene for an instance
- the route can render current default scene and manual scene selection
- participant walkthrough scene works as a first-class scene type
- scene data is reachable and editable through API calls suitable for facilitator skill usage

### Phase 4: Integrate presenter flow into the control room

Goal: make presenter mode part of the normal facilitator workflow rather than a hidden utility.

Tasks:

- [x] Add a presenter launcher to the `live` section of the control room in [`dashboard/app/admin/instances/[id]/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/instances/[id]/page.tsx).
- [x] Surface the current default scene and the next recommended room-facing action in the control room summary.
- [x] Add scene navigation controls appropriate for live facilitation: open current scene, jump to another scene in the same agenda item, jump to another agenda item when needed.
- [x] Add lightweight scene-management affordances for instance-local override if they are in day-one scope; otherwise, explicitly defer editing UI and keep launcher read-only first.
- [x] Keep the launcher and scene state visible on mobile without crowding out urgent runtime controls.
- [x] Keep admin editing behavior aligned with the shared scene APIs rather than introducing UI-only mutation paths.

Exit criteria:

- presenter flow is discoverable from the control room in under a few seconds
- facilitators can recover from “I need to show something earlier” without leaving the system
- presenter integration does not overload the control room

### Phase 5: Map existing workshop content into scene defaults

Goal: turn the current workshop method into reusable presenter-ready structure.

Tasks:

- [x] Map current blueprint phases to default scene sets using [`content/facilitation/master-guide.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/content/facilitation/master-guide.md), [`content/talks/codex-demo-script.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/content/talks/codex-demo-script.md), and [`content/talks/context-is-king.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/content/talks/context-is-king.md).
- [x] Extract only the room-facing essentials into scene data: title, prompt, key takeaway, next action, and optional walkthrough target.
- [x] Keep longer facilitator doctrine in docs and link to it from admin where useful rather than duplicating it inside scenes.
- [x] Verify that each current shared phase has a sensible default room-facing scene and that team phases have either scene defaults or explicit “no room scene by default” behavior.
- [x] Decide whether to encode intermezzo as its own blueprint phase or as a scene attached to adjacent phases based on authoring clarity.

Exit criteria:

- the workshop has a coherent default presenter flow
- best-practice teaching beats are attached to agenda moments rather than floating in docs only
- blueprint content remains maintainable

### Phase 6: Add regression coverage and documentation

Goal: ship the presenter flow with trustable behavior and clear operating guidance.

Tasks:

- [x] Add unit coverage for scene resolution, default selection, override behavior, and reset/import semantics.
- [x] Add API coverage for scene CRUD, reordering, enable/disable, and default-scene selection.
- [x] Extend browser coverage in [`dashboard/e2e/dashboard.spec.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/e2e/dashboard.spec.ts) for:
  - control-room launcher visibility
  - presenter route load
  - current-scene launch
  - manual jump to another scene or agenda item
  - participant-view scene behavior
- [x] Add at least one mobile-focused presenter regression check.
- [x] Update design/architecture docs to describe the presenter surface as a first-class room-facing extension of the participant/facilitator model.
- [x] Update [`workshop-skill/SKILL.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-skill/SKILL.md) and [`workshop-skill/facilitator.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-skill/facilitator.md) so the facilitator skill knows how to inspect and mutate scenes, defaults, and agenda-linked presenter content.
- [x] Define day-one facilitator skill commands or subcommands for presenter scenes, for example scene list/show/create/update/reorder/remove/set-default.
- [x] Document explicit non-goals so future work does not quietly expand into a slide editor.

Exit criteria:

- scene selection and launch behavior are covered by tests
- facilitator scene configuration is possible through the coding-agent path, not just through the admin UI
- the repo explains where presenter content lives and how it relates to blueprint/runtime boundaries
- future contributors can extend the system without reopening the same product questions

## Implementation Tasks

1. **Lock the v1 product boundary**
- [x] Finalize scene taxonomy and schema
- [x] Decide the v1 notes stance
- [x] Decide intermezzo encoding strategy

2. **Extend blueprint and runtime ownership**
- [x] Add blueprint-default presenter-scene data
- [x] Extend workshop state types and import/reset behavior
- [x] Represent runtime overrides explicitly
- [x] Expose scene data through shared facilitator APIs

3. **Build presenter route and rendering**
- [x] Add presenter read model
- [x] Add room-facing route
- [x] Render day-one scene types, including participant-view

4. **Integrate into admin control room**
- [x] Add launcher and current-scene summary
- [x] Add scene jump/navigation affordances
- [x] Keep mobile and live-control ergonomics intact

5. **Populate default workshop scenes**
- [x] Map current facilitation/talk content into structured defaults
- [x] Ensure every relevant phase has a sensible room-facing story

6. **Align facilitator skill and shared APIs**
- [x] Add or extend facilitator API endpoints for scenes
- [x] Update facilitator skill command contract for scene inspection and editing
- [x] Ensure a coding agent can configure scenes, defaults, and related agenda behavior through the CLI-backed facilitator path

7. **Verify and document**
- [x] Add unit and Playwright coverage
- [x] Add API coverage for scene operations
- [x] Update architecture and operating docs
- [x] Document explicit non-goals and follow-up opportunities

## Acceptance Criteria

- Facilitators can launch a presenter-safe room-facing surface from the control room of a workshop instance.
- The room-facing surface defaults to the current agenda item’s default scene.
- Facilitators can jump to another scene in the same agenda item and to a scene tied to a different agenda item without changing the live phase.
- At least one presenter scene can show the participant view as a first-class walkthrough mode.
- Blueprint default scenes are imported into an instance, and reset restores those defaults while discarding runtime-only edits.
- Scene CRUD, ordering, enable/disable behavior, and default-scene selection are available through facilitator APIs rather than existing only in the admin UI.
- The facilitator skill is updated so a coding agent can inspect and configure scenes, related content, and default scene behavior for an instance.
- The presenter flow does not require maintaining a separate deck for the normal workshop path.
- Browser regression coverage exists for the main launcher, scene load, and scene jump flows on at least one desktop and one mobile path.
- Repo docs explain how presenter scenes fit the blueprint/runtime model and explicitly state that the feature is not a general slide authoring system.

## References

- Brainstorm: [2026-04-08-facilitator-room-screen-and-presenter-flow-brainstorm.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-08-facilitator-room-screen-and-presenter-flow-brainstorm.md)
- Facilitator cockpit plan: [2026-04-07-feat-facilitator-cockpit-ia-and-ux-redesign-plan.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/plans/2026-04-07-feat-facilitator-cockpit-ia-and-ux-redesign-plan.md)
- Blueprint/control-model plan: [2026-04-07-feat-workshop-blueprint-and-facilitator-control-model-plan.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/plans/2026-04-07-feat-workshop-blueprint-and-facilitator-control-model-plan.md)
- Agenda blueprint: [workshop-blueprint-agenda.json](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-blueprint-agenda.json)
- Workshop types: [workshop-data.ts](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-data.ts)
- Workshop mutations: [workshop-store.ts](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-store.ts)
- Control-room routing and helpers: [admin-page-view-model.ts](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/admin-page-view-model.ts)
- Participant surface: [page.tsx](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/page.tsx)
- Control room page: [page.tsx](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/instances/[id]/page.tsx)
- Browser coverage baseline: [dashboard.spec.ts](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/e2e/dashboard.spec.ts)
