---
title: "fix: room-safe presenter scene separation and opening reset"
type: plan
date: 2026-04-09
status: in_progress
brainstorm: ../brainstorms/2026-04-09-workshop-scene-richness-and-presentation-system-brainstorm.md
confidence: medium
---

# Room-Safe Presenter Scene Separation And Opening Reset Plan

Correct the presenter content model so the room projection shows only room-facing narrative scenes, move facilitator support and source material out of projection mode, and rebuild the `opening` pack around harness engineering rather than early handoff telegraphing.

## Problem Statement

The current presenter system is failing at the most important product boundary: what belongs on the room screen versus what belongs to the facilitator.

Recent review of the live `opening` scenes exposed three real problems:

- the room projection still includes backstage artifacts such as source material strips and participant-oriented framing
- the canonical blueprint treats one agenda-owned scene pack as a hybrid of room projection, facilitator coaching support, and participant mirror content
- the `opening` content itself over-indexes on handoff/continuation language too early and does not teach harness engineering sharply enough

This is not only a copy-quality issue.

The current canonical blueprint explicitly encodes facilitator-style scenes such as `Facilitátorské otázky`, handoff-heavy framing, and a `participant-view` scene inside the same `opening` pack in [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json). The room-facing presenter route also renders `scene.sourceRefs` directly in projection mode in [`dashboard/app/admin/instances/[id]/presenter/page.tsx`](../../dashboard/app/admin/instances/[id]/presenter/page.tsx).

As a result:

- the facilitator cannot trust that “open projection” means “show the room the actual presentation”
- the room sees operational scaffolding instead of a focused scene sequence
- the participant mirror concept leaks into the room deck
- imported Czech workshop instances can preserve this flawed model until they are reset or recreated

If this is left unchanged, every new workshop instance will continue to import a room-facing experience that feels like an admin-derived hybrid rather than a premium facilitator presentation.

## Current State Review

The current repo state matters because this is not a blank-slate redesign.

What is already true:

- the agenda-centered control room work is complete in [`2026-04-09-feat-control-room-agenda-presenter-unification-plan.md`](./archive/2026-04-09-feat-control-room-agenda-presenter-unification-plan.md)
- the canonical blueprint is agenda-owned and scene-backed in [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json)
- the presenter route is already scene-first in layout terms, but still renders room-unsafe support material in [`dashboard/app/admin/instances/[id]/presenter/page.tsx`](../../dashboard/app/admin/instances/[id]/presenter/page.tsx)
- the source-of-truth doc currently treats `presenterScenes` as carrying room blocks, facilitator notes, and source refs together in [`docs/facilitator-agenda-source-of-truth.md`](../facilitator-agenda-source-of-truth.md)
- Czech runtime instances are copied from the blueprint at import time and are not automatically re-merged from the blueprint on read, as shown by [`dashboard/lib/workshop-data.ts`](../../dashboard/lib/workshop-data.ts) and [`dashboard/lib/workshop-store.ts`](../../dashboard/lib/workshop-store.ts)

That means the current problem has two layers:

1. the canonical scene/content contract is wrong for the job
2. once imported, Czech workshop instances can stay stale until explicitly reset or recreated

The stale-instance issue matters operationally, but it is not the primary diagnosis. Recreating instances now would mostly reproduce the same flawed projector model because the blueprint itself still encodes it.

## Proposed Solution

Treat this as a **room-safety contract correction** plus an `opening` narrative reset.

The corrective solution has five parts:

1. redefine the agenda-owned content contract so room projection, facilitator support, and participant mirror are no longer one blended scene pack
2. make the presenter route strictly room-safe by default
3. move source material, facilitator prompts, and coaching support back into the control-room workbench
4. rebuild the `opening` projection pack as an actual facilitator presentation for that moment of the day
5. reset or recreate live workshop instances only after the corrected blueprint/model is in place

The core product rule after this change should be:

- `open projection` means room-facing presentation only
- `participant 1:1` means participant mirror only
- facilitator support stays in the protected control-room context

## Detailed Plan Level

This is a **detailed** plan because it changes the shared agenda/presenter contract, touches blueprint/runtime behavior, requires migration or normalization of existing scene semantics, and resets the editorial direction of the workshop opener.

## Implementation Tasks

- [x] Re-baseline the content contract around three distinct outputs.
  - Update the presenter/source-of-truth doctrine in [`docs/facilitator-agenda-source-of-truth.md`](../facilitator-agenda-source-of-truth.md) so agenda items explicitly own:
    - room-facing projection content
    - participant-facing mirror content
    - facilitator-only support content
  - Update [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md) so the presenter surface is clearly room-safe and does not imply source-strip or participant-scene leakage.
  - Update the active editorial plan in [`2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md`](./archive/2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md) so it no longer assumes the current mixed scene model is the right substrate.

- [x] Choose and document the corrected runtime shape.
  - Decide whether to model the separation as:
    - distinct agenda-owned fields such as `roomScenes`, `participantMirror`, and `facilitatorSupport`, or
    - a strongly typed audience/visibility split that still preserves backward compatibility with current scene storage
  - Prefer the option that makes “room-safe by default” enforceable in code rather than editorially implied.
  - Write down the chosen migration/normalization rule before implementation so instance-local overrides do not get silently corrupted.

- [x] Remove backstage material from the presenter route.
  - Stop rendering scene `sourceRefs` by default on the room projection.
  - Ensure participant-oriented context blocks are not part of the room scene sequence.
  - Keep scene paging low-chrome and subordinate, but do not let it expose facilitator metadata or support content.
  - Preserve any room-safe CTA behavior only if it is genuinely presentation-worthy.

- [x] Move facilitator support into the agenda workbench where it belongs.
  - Surface facilitator notes, coaching questions, prompts, and source material in the selected agenda item detail pane rather than the projector.
  - Keep those materials easy to scan during facilitation without letting them masquerade as room content.
  - Preserve access to source materials as facilitator tools, not projection artifacts.

- [x] Separate participant mirror from room-scene sequencing.
  - Remove `participant-view` scenes from the default room projection pack or convert them into a dedicated participant configuration path.
  - Keep `participant 1:1` as the primary participant action from the control room.
  - Ensure participant-oriented orientation still has an explicit authoring home, but not inside the room presentation sequence.

- [x] Rebuild the `opening` room-facing pack from first principles.
  - Cut facilitator-only scenes such as `Facilitátorské otázky` and `Facilitátorský tah` out of the room projection sequence.
  - Reduce or remove early handoff reveal language so the morning frame does not spoil the post-lunch continuation beat.
  - Reframe `opening` around harness engineering fundamentals:
    - what this workshop is and is not
    - why context and instructions must live in the repo
    - what the room should understand about the day’s operating model
  - Replace the current opening visual if it still reads as a generic “handoff loop” explainer rather than a strong workshop-specific anchor.
  - Keep the room pack concise enough to feel like a presentation, not a stack of coaching cards.

- [x] Run a corrective audit on the rest of the agenda for the same category error.
  - Identify scenes in `talk`, `demo`, `build`, `rotation`, `intermezzo`, and `reveal` that are actually facilitator support or participant mirror content disguised as room scenes.
  - Classify each flagged scene as `move to facilitator support`, `move to participant mirror`, `rewrite as room scene`, or `cut`.
  - Do not expand the full-day editorial rewrite until this separation rule is clean.

- [ ] Plan and execute runtime reset verification after the model/content fix.
  - Verify the corrected blueprint imports cleanly into a fresh Czech instance.
  - Reset or recreate the workshop instances only after the new room-safe contract is landed.
  - Confirm that a recreated instance no longer shows the mixed-content `opening` pack on projection.

- [x] Add focused verification at the trust boundary.
  - Add unit coverage for the new room-scene/support separation semantics.
  - Add route-level or presenter-level assertions that source material and participant mirror content do not appear on the room-facing projection by default.
  - Add or update focused Playwright coverage for the corrected `opening` projection sequence.

## Acceptance Criteria

- The presenter route no longer renders source material strips or other facilitator support content by default on the room-facing projection.
- `open projection` and `participant 1:1` are clearly distinct outputs with different content contracts.
- The canonical agenda/presenter docs describe room scenes, participant mirror, and facilitator support as separate concerns rather than one blended scene pack.
- The `opening` projection pack reads as a real facilitator presentation for the room, not a stack of coaching aids.
- The `opening` room scenes teach the workshop frame and harness-engineering logic without heavily telegraphing the continuation/handoff reveal.
- At least one fresh Czech workshop instance proves that a reset/recreate picks up the corrected model and content.
- Verification coverage exists for the separation rule, not just for copy presence.

## Decision Rationale

### Why this cannot be solved by copy edits alone

The current issue is structural before it is editorial.

If the content model still allows room scenes, participant mirror, source strips, and facilitator coaching aids to live in one blended projection sequence, better copy will still produce a confused product. The room will continue to see things it should never see, just phrased more elegantly.

### Why separation is better than “just hide a few blocks on the presenter route”

A presenter-only filter would reduce the visible damage, but it would leave the wrong mental model in the blueprint and editor:

- authors would still create mixed-purpose scenes
- the control room would still think in terms of one blended scene pack
- future agenda items would repeat the same confusion

The better fix is to separate the contract explicitly, then enforce it in the renderer.

### Why `opening` needs a reset before broader scene rollout continues

The current `opening` pack is the strongest proof of the wrong assumption, because it reveals the product mistake most clearly:

- facilitator-only coaching content is being projected
- participant-mirror logic is mixed into the room deck
- handoff is over-signaled too early
- the visual anchor is doing too much explanatory work without enough workshop-specific authority

If `opening` is not corrected first, the rest of the scene-rollout work will continue on the wrong foundation.

### Why live instance recreation should happen after the fix, not before it

The code makes clear that Czech instances import blueprint content when they are created and do not re-merge canonical content on read. That means resets are operationally necessary after the fix. But recreating instances before the fix would only re-seed the same flawed room-facing content.

So the correct order is:

1. fix the content contract and `opening`
2. verify the import/reset path
3. reset or recreate the real workshop instances

## Assumptions

| Assumption | Status | Evidence |
| --- | --- | --- |
| The current presenter issue is primarily a contract/model problem, not just stale data | Verified | The current canonical blueprint already contains facilitator-oriented and participant-oriented scenes inside `opening` in [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json) |
| Existing Czech workshop instances can stay stale until reset or recreation | Verified | Czech runtime state is copied from the blueprint at import time and `cs` state is not re-merged from canonical blueprint on read in [`dashboard/lib/workshop-data.ts`](../../dashboard/lib/workshop-data.ts) and [`dashboard/lib/workshop-store.ts`](../../dashboard/lib/workshop-store.ts) |
| The control-room workbench can hold facilitator support without needing a second presenter-facing support surface | Mostly verified | The agenda-centered control-room design already assumes the selected agenda item is the facilitator workbench, but the exact support-layout shape still needs implementation validation |
| Participant mirror should remain a first-class output, but not part of the room projection sequence | Verified by product intent | Recent facilitator feedback and the completed control-room plan both point toward one primary participant action separate from the room screen |
| The `opening` narrative can be strengthened while reducing explicit handoff telegraphing | Unverified | Strong product inference, but must be tested in a fresh room-facing rewrite and live facilitator review |
| Existing scene-local overrides can be preserved safely during model correction | Unverified | Depends on the migration or normalization approach chosen for runtime scene state |

## Risk Analysis

### Risk: The separation introduces a migration mess for existing runtime scene state

If the new contract changes where participant or facilitator content lives, instance-local overrides could become inconsistent or partially lost.

Mitigation:

- choose the corrected runtime shape before implementation
- write an explicit normalization/migration rule
- verify on both fresh imports and an existing customized instance

### Risk: Facilitator support becomes harder to reach once it leaves projection mode

If source materials and coaching prompts are simply removed from projection without being made more usable in the control room, the facilitator loses operational support.

Mitigation:

- treat facilitator support relocation as a first-class task, not a cleanup detail
- keep support content in the selected agenda item workbench
- verify click-path speed during manual review

### Risk: The `opening` rewrite becomes vaguer while trying not to spoil handoff

There is a danger of removing too much handoff language and ending up with generic “context matters” slides.

Mitigation:

- re-anchor `opening` in harness engineering specifically, not generic AI workshop language
- let the morning promise continuity and repo-discipline without spelling out the afternoon reveal too directly
- review for one dominant idea per scene

### Risk: The corrective work stalls the broader editorial rollout

If the team tries to solve the whole day at once while correcting the model, the work will sprawl.

Mitigation:

- treat this as a corrective slice first
- fix the contract
- rebuild `opening`
- audit the rest of the agenda only for category errors before resuming broader editorial rollout

### Risk: We under-correct and keep a hybrid model hidden behind filters

If the implementation only hides support content in the renderer without changing authoring semantics, the product debt will persist.

Mitigation:

- acceptance criteria must include doctrinal and model-level separation, not just a visual cleanup
- tests should assert separation semantics, not only snapshot the page

## Phased Implementation

### Phase 1: Lock the corrected scene contract

Goal: make the product boundary explicit before implementation.

Tasks:

- [x] define the three-output model: room projection, participant mirror, facilitator support
- [x] decide the runtime shape and migration strategy
- [x] update the source-of-truth and surface-model docs

Exit criteria:

- a new engineer can explain what belongs on each surface without ambiguity
- the docs no longer describe one blended presenter scene pack as the canonical model

### Phase 2: Enforce room-safety in code

Goal: make “open projection” mean room-safe output in practice.

Tasks:

- [x] implement the chosen model/normalization change
- [x] remove source-strip and participant leakage from the presenter route
- [x] expose facilitator support in the control room instead

Exit criteria:

- the room projection renders only room-facing content
- facilitator support remains available without using the projector as a crutch

### Phase 3: Reset the `opening` pack

Goal: produce the first corrected room-facing presentation under the new model.

Tasks:

- [x] rewrite `opening` as a concise room presentation
- [x] cut or relocate the mixed-purpose scenes
- [x] replace or remove the weak opening visual anchor

Exit criteria:

- `opening` no longer feels like a hybrid of notes, participant mirror, and projector content
- the room-facing sequence feels like a real presentation for that workshop moment

### Phase 4: Verify and re-seed

Goal: prove the corrected model survives real instance creation.

Tasks:

- [x] add targeted automated coverage
- [x] verify fresh import/reset behavior for Czech instances
- [ ] reset or recreate the workshop instances used for live validation

Exit criteria:

- a fresh instance shows the corrected opening experience
- the trust boundary is covered by tests and a live validation pass

## References

- Brainstorm: [`2026-04-09-workshop-scene-richness-and-presentation-system-brainstorm.md`](../brainstorms/2026-04-09-workshop-scene-richness-and-presentation-system-brainstorm.md)
- Brainstorm: [`2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md`](../brainstorms/2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md)
- Completed shell plan: [`2026-04-09-feat-control-room-agenda-presenter-unification-plan.md`](./archive/2026-04-09-feat-control-room-agenda-presenter-unification-plan.md)
- Current editorial continuation plan: [`2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md`](./archive/2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md)
- Source-of-truth doc: [`docs/facilitator-agenda-source-of-truth.md`](../facilitator-agenda-source-of-truth.md)
- Presenter route: [`dashboard/app/admin/instances/[id]/presenter/page.tsx`](../../dashboard/app/admin/instances/[id]/presenter/page.tsx)
- Canonical blueprint: [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json)
- Runtime import/state code: [`dashboard/lib/workshop-data.ts`](../../dashboard/lib/workshop-data.ts), [`dashboard/lib/workshop-store.ts`](../../dashboard/lib/workshop-store.ts)
