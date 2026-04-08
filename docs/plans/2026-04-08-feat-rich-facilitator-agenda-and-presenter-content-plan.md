---
title: "feat: rich facilitator agenda and presenter content model"
type: plan
date: 2026-04-08
status: complete
brainstorm: ../brainstorms/2026-04-08-facilitator-presenter-rich-content-redesign-brainstorm.md
confidence: medium
---

# Rich Facilitator Agenda And Presenter Content Plan

Replace the current thin phase timeline with a richer workshop-day model so the facilitator dashboard, presenter surface, and facilitator skill all operate from the same agenda-backed source of truth.

## Problem Statement

Harness Lab currently splits the facilitator’s real operating model across three places:

- a thin runtime agenda in [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json)
- richer workshop method content in [`content/facilitation/master-guide.md`](../../content/facilitation/master-guide.md)
- talk and demo detail in [`content/talks/context-is-king.md`](../../content/talks/context-is-king.md) and [`content/talks/codex-demo-script.md`](../../content/talks/codex-demo-script.md)

That split makes the dashboard feel incomplete in real use:

- the control room timeline only shows a skeleton of the day
- intermezzos and other operational beats are missing from the explicit agenda
- presenter scenes are too thin to carry the workshop method already present in the repo
- the facilitator skill and control room are not yet anchored to the same rich agenda structure

This matters because Harness Lab is supposed to be a facilitator operating system. The dashboard should not be a thin runtime panel that forces the facilitator back into docs to run the workshop.

## Proposed Solution

Promote the workshop day into a richer canonical agenda model and make that model the shared backbone for:

- control-room agenda and live operations
- presenter packs and room-facing scenes
- facilitator skill commands and references
- reusable workshop content authored in the repo

Core shape:

1. keep agenda items as the top-level runtime skeleton
2. make intermezzos and other operationally important beats explicit agenda items
3. upgrade each agenda item from `title/time/description` into a richer facilitator pack
4. model presenter scenes as structured block-based content with separate facilitator notes
5. attach source references from agenda items/scenes back to the originating content docs
6. make dashboard and facilitator skill consume the same agenda ids and presenter-pack semantics
7. preserve the blueprint/runtime split: repo-native defaults remain canonical, instance-local overrides remain runtime-only

## Detailed Plan Level

This is a **detailed** plan because it changes the workshop’s core source-of-truth model across content, dashboard runtime data, presenter rendering, API contracts, facilitator skill behavior, and regression coverage. It also has a real risk of creating either content duplication or a second authoring system if the ownership boundaries are not explicit.

## Implementation Tasks

- [x] Define the canonical workshop-day model and ownership boundaries.
  - Decide the v1 agenda-item contract: `id`, `time`, `title`, `intent`, `goal`, `roomSummary`, `facilitatorPrompts`, `watchFors`, `checkpointQuestions`, `sourceRefs`, `presenterPack`.
  - Decide the v1 presenter-scene block contract and facilitator-notes split.
  - Decide which content stays in repo-native long-form docs versus which content must be structured directly in the blueprint.
  - Lock the rule that the dashboard and facilitator skill read the same agenda ids and pack structure.

- [x] Redesign the canonical blueprint agenda to represent the real workshop day.
  - Replace the current 5-phase skeleton with the actual operational sequence, including explicit intermezzos and any other day-critical beats.
  - Rebuild the agenda from existing workshop materials instead of inventing weaker presenter-only copy.
  - Add source references from each agenda item and presenter scene to the originating facilitation/talk content.
  - Keep the blueprint public-safe and reusable.

- [x] Extend the runtime data model and import/reset semantics.
  - Expand the workshop blueprint/runtime types in [`dashboard/lib/workshop-data.ts`](../../dashboard/lib/workshop-data.ts) to carry the richer agenda and presenter-pack shape.
  - Update import/reset behavior so the richer blueprint agenda is copied into runtime instances cleanly.
  - Preserve traceability for blueprint-owned versus runtime-local agenda and scene content.
  - Define how instance-local overrides work for pack fields, scene ordering, scene enablement, and facilitator notes.

- [x] Update facilitator APIs to expose the richer agenda model coherently.
  - Keep instance agenda routes as the mutation seam, but expand them to support the richer agenda item and presenter-pack payloads.
  - Avoid creating a second parallel API family for workshop content that forks from agenda ownership.
  - Ensure presenter-scene routes and agenda-edit routes share the same runtime model and validation strategy.
  - Decide whether source references are immutable blueprint metadata or instance-local editable fields.

- [x] Redesign the control-room agenda UX around facilitator usefulness.
  - Make the agenda section feel like a live facilitator pack, not just a list of phases.
  - For the selected agenda item, show the rich operational detail directly in the dashboard: goal, what to say, what to watch for, checkpoint prompts, pack scenes, and linked source material.
  - Make intermezzos visible and actionable in the day timeline.
  - Keep high-impact runtime actions separate from content editing so live operations remain calm under pressure.

- [x] Redesign the presenter surface around structured room scenes.
  - Replace the current thin `title/body/cta` rendering model with a block-based scene renderer.
  - Remove generic operational chrome from room scenes by default and replace it with scene-controlled presets.
  - Build richer presenter packs for opening, Context is King, demo, Build Phase 1, intermezzos, rotation, reveal, and reflection.
  - Keep `participant-preview` as one scene block/scene type inside a richer presenter sequence rather than the primary model.

- [x] Align the facilitator skill with the richer workshop-day model.
  - Update [`workshop-skill/facilitator.md`](../../workshop-skill/facilitator.md) so facilitator commands refer to agenda items, presenter packs, and explicit workshop moments rather than a thin timeline.
  - Add or refine commands/prompts that let the facilitator inspect and operate the rich agenda structure through the same runtime APIs.
  - Ensure the skill falls back to repo-native content only when runtime data is unavailable, and says so explicitly.
  - Keep CLI/API examples aligned with the canonical agenda ids and data contract.

- [x] Add regression coverage and documentation for the richer model.
  - Extend blueprint, runtime, API, and presenter tests for the richer agenda shape.
  - Add dashboard coverage for explicit intermezzo visibility and rich agenda detail rendering.
  - Add presenter coverage for block rendering and room-safe chrome rules.
  - Document the source-of-truth model so future edits do not reintroduce the docs/dashboard split.

## Acceptance Criteria

- The canonical blueprint agenda explicitly represents the real workshop day, including intermezzos and other operationally important beats.
- A facilitator using the control room can inspect the selected agenda item and see enough detail to run that workshop moment without switching to separate guide docs for the normal path.
- Presenter packs for shared moments carry structured, projection-safe content that is visibly derived from the repo’s facilitation and talk materials.
- The presenter surface no longer depends on generic operational tiles for its default chrome.
- The facilitator skill and the dashboard use the same agenda ids and shared runtime semantics for workshop-day content.
- Reset/import behavior preserves the blueprint/runtime boundary and can restore the richer agenda model for an instance.
- Tests cover blueprint import, runtime projection, agenda detail rendering, presenter rendering, and the shared API path.

## Decision Rationale

### Why the agenda must become the primary source of truth

The agenda already owns live workshop sequencing and runtime state. Splitting the real facilitator logic into separate docs while the dashboard owns only a thin timeline guarantees drift and weakens the operating system claim. Extending the agenda is less risky than inventing a second facilitator-content model.

### Why intermezzos should become explicit agenda items

Intermezzos are operationally important, not optional flavor. The facilitation guide already treats them as repeatable checkpoints in the day. If they remain implicit, the dashboard will continue to misrepresent the workshop.

### Why the presenter model must become block-based rather than longer strings

The current scene schema cannot express milestone boards, demo sequences, quotes, screenshots, curated links, or structured checklists. Longer prose blobs would preserve the same usability problem with worse layout control.

### Why the dashboard and facilitator skill must share one model

Harness Lab teaches harness discipline. If the dashboard and skill each maintain their own partial workshop-day understanding, the product violates its own premise. Shared agenda ids and shared runtime semantics are the minimum bar.

### Why the plan does not propose a general presentation builder

The problem is not lack of deck tooling. The problem is lack of an operationally useful workshop-day model. A structured presenter system is justified; a freeform slide product is not.

### Alternatives Considered

#### Alternative 1: Keep the current 5-phase skeleton and only enrich the presenter scenes

Rejected because it would leave the facilitator dashboard itself structurally misleading. The control room would still hide intermezzos and other operational beats.

#### Alternative 2: Keep rich detail only in docs and add links from the dashboard

Rejected because this preserves the fragmented workflow. Linking out to the guide is a fallback, not a primary operating model.

#### Alternative 3: Parse markdown docs dynamically into the presenter/dashboard at runtime

Rejected for v1 because it adds a fragile implicit authoring pipeline. A consciously structured canonical agenda model is safer and clearer.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The workshop method already exists in repo-native content strongly enough to author a rich canonical agenda without inventing new substance | Verified | [`content/facilitation/master-guide.md`](../../content/facilitation/master-guide.md), [`content/talks/context-is-king.md`](../../content/talks/context-is-king.md), and [`content/talks/codex-demo-script.md`](../../content/talks/codex-demo-script.md) already contain the missing detail |
| Agenda items remain the right top-level unit for runtime sequencing and presenter packs | Verified | Both brainstorms retained agenda ownership and the current runtime already uses agenda as the live backbone |
| Intermezzos are important enough to deserve first-class agenda representation | Verified | The facilitation guide treats them as repeatable workshop checkpoints, not incidental notes |
| A structured block model is sufficient for v1 rich scenes without needing a full presentation editor | Verified | The brainstorm explicitly selected a bounded block taxonomy that covers the known content types |
| The dashboard and facilitator skill should share agenda ids and runtime semantics | Verified | This follows the repo doctrine and the dashboard surface model’s source-of-truth rules |
| Source references can stay understandable and maintainable without creating authoring duplication debt | Unverified | This depends on how much content must be copied into the structured agenda versus linked back to markdown |
| The richer agenda model can fit into the current control-room UX without overwhelming the operator | Unverified | The agenda section already supports selection/editing, but the richer detail density has not been proven in the UI |
| Runtime overrides for rich presenter packs can remain disciplined and reviewable | Unverified | Current runtime overrides are simpler; richer packs raise the risk of ad hoc event-specific drift |
| The current API and validation shape can absorb richer nested content without becoming too brittle | Unverified | Existing route contracts were designed for flatter agenda/scene objects |

Unverified assumptions must be handled as explicit design tasks or guarded risks during implementation.

## Risk Analysis

### Risk: We create two sources of truth again, just with richer data

If the structured agenda becomes one authoring stream while facilitation/talk docs continue evolving independently, the same mismatch will reappear at a higher level of complexity.

Mitigation:

- define one canonical agenda-owned structured layer
- require source references from agenda items back to long-form materials
- document what belongs in structured agenda data versus long-form explanation

### Risk: Rich content makes the control room harder to use live

If the agenda section turns into a dense document viewer, the operator loses speed under pressure.

Mitigation:

- separate at-a-glance live controls from rich content
- keep selected agenda detail focused and intentionally chunked
- test the agenda section against mobile and desktop control-room workflows

### Risk: Rich presenter packs drift into a generic page-builder product

Too many block types or unconstrained layout freedom would turn this into a content-management project.

Mitigation:

- keep a small bounded block taxonomy
- limit scene presets intentionally
- reject arbitrary layout tooling in v1

### Risk: Runtime overrides become a one-off customization trap

If facilitators can freely rewrite rich packs per event, the reusable workshop method weakens quickly.

Mitigation:

- keep blueprint defaults canonical
- distinguish blueprint-derived versus runtime-local content visibly
- design reset and review affordances around that distinction

### Risk: Skill integration lags behind dashboard implementation

If the dashboard ships a richer model but the facilitator skill still speaks the old thin agenda language, the system will become inconsistent.

Mitigation:

- include skill alignment in the same implementation slice
- use shared runtime APIs and shared ids from the beginning
- add contract-level examples in facilitator skill docs

### Risk: The blueprint redesign breaks existing runtime imports and demo data

The richer model changes the shape of the canonical workshop-day data and may break tests, sample data, and presenter projections if done piecemeal.

Mitigation:

- do the model migration in one bounded slice
- update import/projection tests first
- migrate sample/demo data and presenter fixtures in the same phase

## Phased Implementation

### Phase 1: Lock the canonical workshop-day model

Goal: define the exact source-of-truth boundary before touching UI or rendering.

Tasks:

- [x] Define the v1 rich agenda-item schema and presenter-pack schema.
- [x] Define the block taxonomy, facilitator-notes model, and scene chrome presets.
- [x] Define which workshop moments become explicit agenda items, especially intermezzos.
- [x] Define source-reference semantics and what content is copied versus linked.
- [x] Define how dashboard and skill share ids and runtime semantics.

Exit criteria:

- one explicit canonical schema exists
- intermezzo ownership is resolved
- the docs/dashboard/skill source-of-truth rule is documented

### Phase 2: Rebuild the blueprint around the real workshop day

Goal: encode the real workshop method as structured blueprint-owned content.

Tasks:

- [x] Rewrite the blueprint agenda to include the actual operational sequence of the day.
- [x] Build presenter packs for opening, talk, demo, Build Phase 1, intermezzos, rotation, reveal, and reflection.
- [x] Attach source references to facilitation/talk content for each agenda item or scene.
- [x] Keep the blueprint public-safe and reusable.

Exit criteria:

- the blueprint agenda matches the real workshop flow
- presenter packs carry meaningful room-ready content
- source references are traceable

### Phase 3: Extend runtime data, APIs, and reset semantics

Goal: make the richer blueprint importable, editable, and resettable inside workshop instances.

Tasks:

- [x] Extend runtime types and normalization logic for rich agenda items and rich presenter packs.
- [x] Update create/import/reset behavior to project the richer blueprint correctly.
- [x] Expand agenda/presenter APIs and validation for the richer nested content.
- [x] Preserve blueprint/runtime ownership metadata on agenda and scene content.

Exit criteria:

- runtime instances can load, edit, and reset the richer agenda model
- API contracts support the new content shape
- ownership boundaries remain explicit

### Phase 4: Redesign facilitator-facing control-room agenda UX

Goal: turn the agenda section into a useful facilitator operating surface.

Tasks:

- [x] Redesign selected agenda-item detail in the control room around real facilitator needs.
- [x] Surface presenter-pack details, source links, checkpoint prompts, and facilitator guidance directly in the dashboard.
- [x] Keep phase-control and safety actions separate from rich content authoring.
- [x] Verify the redesigned agenda flow on desktop and mobile control-room layouts.

Exit criteria:

- facilitators can run a workshop moment from the control room without leaving to guide docs for the normal path
- intermezzos are visible in the timeline
- the agenda UI remains calm under live-use pressure

### Phase 5: Redesign the room-facing presenter surface

Goal: make the room screen actually teachable and projection-safe.

Tasks:

- [x] Replace the current thin scene renderer with a structured block renderer.
- [x] Remove default generic operational chrome and replace it with scene presets.
- [x] Implement richer room scenes for the key shared moments.
- [x] Preserve participant-preview as a supported scene mode within the richer presenter system.

Exit criteria:

- presenter scenes can carry real workshop material
- room chrome supports teaching instead of leaking admin/runtime facts
- presenter packs feel intentionally designed, not placeholder

### Phase 6: Align facilitator skill and regression coverage

Goal: keep the dashboard, presenter flow, and facilitator skill coherent as one system.

Tasks:

- [x] Update facilitator skill contracts and examples for the rich agenda model.
- [x] Add regression coverage for blueprint import, API shape, control-room agenda detail, and presenter rendering.
- [x] Document the new authoring model and maintenance rules.

Exit criteria:

- facilitator skill and dashboard refer to the same workshop-day model
- test coverage protects the new source-of-truth boundary
- future edits have written guidance to avoid re-fragmenting the system

## References

- Primary brainstorm: [2026-04-08-facilitator-presenter-rich-content-redesign-brainstorm.md](../brainstorms/2026-04-08-facilitator-presenter-rich-content-redesign-brainstorm.md)
- Supporting brainstorm: [2026-04-08-facilitator-room-screen-and-presenter-flow-brainstorm.md](../brainstorms/2026-04-08-facilitator-room-screen-and-presenter-flow-brainstorm.md)
- Prior implementation plan: [2026-04-08-feat-facilitator-room-screen-and-presenter-flow-plan.md](2026-04-08-feat-facilitator-room-screen-and-presenter-flow-plan.md)
- Blueprint model: [workshop-blueprint-agenda.json](../../dashboard/lib/workshop-blueprint-agenda.json)
- Runtime types: [workshop-data.ts](../../dashboard/lib/workshop-data.ts)
- Presenter route: [page.tsx](../../dashboard/app/admin/instances/[id]/presenter/page.tsx)
- Facilitator guide: [master-guide.md](../../content/facilitation/master-guide.md)
- Talk content: [context-is-king.md](../../content/talks/context-is-king.md)
- Demo content: [codex-demo-script.md](../../content/talks/codex-demo-script.md)
- Surface rules: [dashboard-surface-model.md](../dashboard-surface-model.md)
