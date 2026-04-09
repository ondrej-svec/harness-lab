---
title: "feat: workshop scene editorial rollout and copy excellence"
type: plan
date: 2026-04-09
status: in_progress
brainstorm: ../brainstorms/2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md
confidence: medium
---

# Workshop Scene Editorial Rollout And Copy Excellence Plan

Finish the rich-scene rollout by treating the remaining work as an editorial and narrative sweep across the whole workshop day, not as a block-expansion exercise. The next slice should make every important room-facing scene clear, memorable, cold-readable, and workshop-voice correct in Czech.

## Problem Statement

The presenter shell is no longer the only bottleneck, but the scene contract still needs one correction.

The control-room and projector shell work is complete, the blueprint already contains explicit scene packs across all 10 workshop phases, and the `opening` pack established a stronger proof slice. But the day is still uneven:

- the previous rich-presenter plan still describes a mostly-thin blueprint, which is no longer true
- the current scene model still mixes room projection, participant mirror, and facilitator support more than it should
- the remaining quality gap is editorial: narrative arc, scene usefulness, copy precision, and voice discipline
- several important scenes are still structurally present but editorially weak
- the current block mix is still dominated by `hero` and `bullet-list`, which is a smell when the workshop is supposed to feel premium and self-sufficient
- the proof gate for `opening` is still unfinished, so the content pattern has not yet been validated by another facilitator

The continuation therefore should not ask “how do we make the scenes richer?” It should ask:

- does the room-facing story build across the day?
- does each scene earn its place?
- can another facilitator run it without reading Ondrej’s mind?
- does the Czech copy sound natural, sharp, and workshop-grade?

This plan assumes the room-safe separation fix in [`2026-04-09-fix-room-safe-presenter-scene-separation-and-opening-reset-plan.md`](./2026-04-09-fix-room-safe-presenter-scene-separation-and-opening-reset-plan.md) lands first or alongside any further `opening` propagation.

## Current State Review

What is already true in the repo today:

- the agenda-centered control room and scene-first projector plan is complete in [`2026-04-09-feat-control-room-agenda-presenter-unification-plan.md`](./2026-04-09-feat-control-room-agenda-presenter-unification-plan.md)
- the blueprint now defines explicit scene packs across all 10 phases in [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json)
- the blueprint currently contains 28 scenes across:
  - `opening` 5
  - `talk` 3
  - `demo` 3
  - `build-1` 3
  - `intermezzo-1` 2
  - `lunch-reset` 2
  - `rotation` 3
  - `build-2` 2
  - `intermezzo-2` 2
  - `reveal` 3
- the block mix shows structural variety, but still over-indexes on list-driven scenes:
  - `hero` 14
  - `bullet-list` 12
  - `callout` 11
  - `participant-preview` 10
  - `steps` 8
  - `checklist` 5
  - `quote` 2
  - `image` 1
  - `link-list` 1
- likely weak or thin scenes remain in important moments:
  - `talk-framing`
  - `build-1-coaching`
  - `build-2-handoff-work`
  - `intermezzo-2-reflection`
  - `reveal-1-2-4-all`

This means the rollout is already structurally broad. The remaining work is to make the day coherent and excellent.

## Proposed Solution

Run one editorial continuation slice with five goals:

1. close the unfinished `opening` proof gate so the flagship pattern is actually validated
2. define a day-wide narrative spine from opening through reveal so the scenes build energy instead of reading like isolated cards
3. rewrite the weakest scene packs using existing workshop source material before inventing anything new
4. enforce a stricter copy bar for Czech workshop delivery using the repo’s style guide, editorial checklist, and spoken-readability check
5. use richer scene devices only when they materially improve comprehension, memory, authority, or facilitation

The continuation should explicitly avoid two failure modes:

- blind “block inflation” where every weak scene gets more blocks but not better meaning
- generic AI polish where the prose becomes smoother but less grounded in the workshop method

Execution note:

- the launch reset tracked in [`2026-04-09-feat-opening-talk-reset-and-facilitator-runner-plan.md`](./2026-04-09-feat-opening-talk-reset-and-facilitator-runner-plan.md) is now the front edge of the editorial continuation
- broader editorial propagation should follow the launch module proof, not run ahead of it

## Detailed Plan Level

This is a **detailed** plan because it affects the canonical workshop blueprint across the whole day, relies on multiple source documents, and carries subjective quality risk around narrative, voice, and facilitation self-sufficiency.

## Editorial Quality Standard

This continuation slice should use a stronger bar than “scene has more content.”

Every important room-facing scene should pass all of these tests:

1. **One dominant idea**
   The room can say what the scene is for in one sentence.
2. **Narrative contribution**
   The scene advances the workshop story instead of repeating adjacent scenes.
3. **Facilitation usefulness**
   Another facilitator can infer what to say, what to emphasize, and what the room should take away.
4. **Copy quality**
   The Czech sounds like an experienced peer, not a translated slide or AI filler.
5. **Memorable anchor**
   The scene contains a line, contrast, question, quote, image, checklist, or other anchor worth remembering a week later.
6. **Restraint**
   Nothing decorative survives. Every sentence earns its place.

## Implementation Tasks

- [x] Re-baseline the rich-scene continuation around the actual current state.
  - Treat this plan as the successor to the unfinished propagation work in [`2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md`](./2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md), not as a parallel duplicate.
  - Keep the earlier plan as history of the proof slice and authoring/rendering work.
  - Use the completed control-room/projector work as a fixed assumption, not a work item.

- [ ] Close the `opening` proof gate before broad editorial propagation.
  - Run the non-Ondrej cold-read on the rebuilt `opening` pack.
  - Run the explicit vibe-check on the same pack.
  - Record which specific lines, scene beats, or facilitator notes failed.
  - Apply only the corrections that improve clarity, self-sufficiency, or tone.

- [x] Define the day-wide narrative spine for the canonical workshop blueprint.
  - Write a compact narrative contract for each phase: what shifts here, what the room should now believe, and what tension or expectation carries into the next phase.
  - Make sure the day moves cleanly through: opening frame, context thesis, demo proof, build pressure, intermezzo reflection, rotation handoff, second build, final reveal, and takeaway.
  - Prevent duplicate scenes that restate the same truth without changing the room’s understanding.

- [x] Audit all 28 scenes against the editorial quality standard.
  - Classify each scene as `keep`, `tighten`, `split`, `rewrite`, or `cut`.
  - Flag scenes that are only a `hero` plus `bullet-list` and confirm whether they truly deserve that shape.
  - Flag scenes whose room-facing copy says the same thing the facilitator notes already say.
  - Flag participant-view scenes that are useful mirrors versus scenes that just paraphrase the room projection.

- [x] Rewrite the remaining weak flagship moments using the existing source material first.
  - `talk`: derive stronger room-facing scenes from [`content/talks/context-is-king.md`](../../content/talks/context-is-king.md), especially the key line, micro-exercise framing, and “co chci, aby si adoptovali” section.
  - `demo`: tighten scenes around the story and “pointa pro místnost” in [`content/talks/codex-demo-script.md`](../../content/talks/codex-demo-script.md), keeping it one story rather than a feature tour.
  - `build-1`, `rotation`, `build-2`, `reveal`, and intermezzo phases: pull stronger room cues, milestone logic, coaching prompts, and reflection frames from [`content/facilitation/master-guide.md`](../../content/facilitation/master-guide.md).
  - Rewrite the current thin scenes first:
    - `talk-framing`
    - `build-1-coaching`
    - `build-2-handoff-work`
    - `intermezzo-2-reflection`
    - `reveal-1-2-4-all`

- [x] Enforce scene-level voice discipline across the whole day.
  - Keep “Ondrej frames, experts anchor” as the default pattern from the brainstorm.
  - Ensure each scene has one dominant voice.
  - Use expert quotes only where they add authority or contrast, not as decoration.
  - Remove scenes that sound like blended workshop copy plus generic AI polish.

- [x] Raise the Czech copy bar to workshop-ready quality.
  - Use [`content/style-guide.md`](../../content/style-guide.md) as the baseline writing rule set.
  - Run the full [`content/czech-editorial-review-checklist.md`](../../content/czech-editorial-review-checklist.md) on every newly rewritten phase pack.
  - Add a spoken-readability pass for every edited scene pack, not just the `opening`.
  - Prefer cuts over smoothing when a sentence feels vague, translated, or over-produced.

- [x] Add richer anchors selectively where they materially improve the scene.
  - Prefer quotes, images, callouts, steps, checklists, or evidence moments only when they sharpen the scene’s point.
  - Do not add images or quotes to “make it feel rich” if the narrative gain is weak.
  - Expand beyond the current single-image / two-quote footprint only where the source material and scene purpose justify it.

- [x] Re-check participant-facing mirrors as part of the same editorial sweep.
  - Confirm that participant-view scenes help teams orient, not just duplicate the facilitator projection.
  - Tighten participant copy so it stays action-oriented and workshop-safe.
  - Keep participant surfaces aligned with the new agenda-centered control room without reintroducing hidden backstage assumptions.

- [x] Preserve localization integrity while editing the canonical scene content.
  - Keep reviewed Czech delivery first-class.
  - Ensure any changes to English/source overlays and localized content stay semantically aligned.
  - If a scene cannot be made strong in Czech because the source itself is weak, rewrite the source idea before translating polish onto it.

- [x] Expand verification only where the editorial sweep changes behavior or structure meaningfully.
  - Add or update tests for any new scene/block combinations that become load-bearing.
  - Update focused presenter e2e coverage when revised flagship scenes materially change layout expectations.
  - Avoid snapshot churn for pure copy changes unless the visual structure meaningfully changes.

## Acceptance Criteria

- The continuation slice no longer treats the remaining work as “make scenes richer,” but demonstrably improves narrative coherence and copy quality across the day.
- `opening` passes the cold-read and vibe-check gate, with corrections recorded and applied.
- Every flagship phase pack has at least one memorable room-facing anchor and no obvious placeholder or bullet-dump scene.
- The current weak scenes are either substantially improved, split into better scenes, or removed.
- A non-Ondrej facilitator can understand the purpose and expected beat of each important phase from the scene pack plus notes.
- Edited Czech scene copy passes the style guide, editorial checklist, and spoken-readability check.
- Additional quotes, imagery, or richer block usage appear only where they materially improve comprehension or authority.
- Participant-view scenes remain useful and action-oriented instead of becoming weak duplicates of the room projection.

## Decision Rationale

### Why a new continuation plan is needed

The previous rich-content plan was correct for the proof slice, but it is no longer the best tracker for the next work. It still assumes most of the blueprint needs structural richness. The current blueprint already has explicit scenes across the day. What it lacks now is editorial sharpness and day-wide coherence.

### Why the next slice should be editorial first

The shell is strong enough now. If the next work goes back to renderer mechanics or generic “richness,” it will miss the actual product risk: scenes that are technically structured but emotionally flat, repetitive, or weakly written.

### Why source-first rewriting matters

The repo already contains stronger workshop substance in talks and facilitation guides. Re-deriving scenes from those sources is higher-integrity than inventing new presenter copy from scratch. It keeps the workshop method intact while improving delivery.

### Why Czech copy quality needs to be explicit in the plan

The workshop is actually delivered in Czech. “Good enough” translated structure is not enough. If the copy does not sound natural when spoken aloud to a room of developers, the rich-scene system still fails its real job.

## Assumptions

| Assumption | Status | Evidence |
| --- | --- | --- |
| The control-room and projector shell is strong enough that content quality is now the main bottleneck | Verified | [`2026-04-09-feat-control-room-agenda-presenter-unification-plan.md`](./2026-04-09-feat-control-room-agenda-presenter-unification-plan.md) is complete |
| The blueprint already contains enough structural scene coverage for the next slice to focus on editorial quality | Verified | [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json) defines 28 scenes across all 10 phases |
| Several important scenes are still weak even though they are structurally present | Verified | Thin scenes remain in `talk`, `build-1`, `build-2`, `intermezzo-2`, and `reveal` with minimal block variety and list-heavy composition |
| The repo’s source material is strong enough to support better scene packs without inventing a new workshop method | Verified | [`content/talks/context-is-king.md`](../../content/talks/context-is-king.md), [`content/talks/codex-demo-script.md`](../../content/talks/codex-demo-script.md), and [`content/facilitation/master-guide.md`](../../content/facilitation/master-guide.md) already contain stronger ideas than the weakest current scenes expose |
| The `opening` proof pattern will generalize to the rest of the day after a real proof gate | Unverified | The pack is implemented, but the cold-read and vibe-check are still unfinished |
| The current Czech voice guidance is strong enough to serve as the final editorial bar for presenter scenes | Mostly verified | The style guide and editorial checklist are clear, but they still need to be applied consistently to room-facing scene packs |
| Participant-view scenes can stay distinct and useful during the editorial sweep | Unverified | Some current participant scenes may still be too close to room-projection restatements |

## Risk Analysis

### Risk: We confuse “more” with “better”

If every weak scene gets another block, quote, or image, the workshop becomes denser without becoming clearer.

Mitigation:

- audit scenes before rewriting
- cut or split scenes where needed
- require a narrative and facilitation reason for every richer anchor

### Risk: We polish the Czech but weaken the method

Smoother copy can still become generic if it drifts away from the repo-centered discipline of the workshop.

Mitigation:

- source from workshop talks and facilitation docs first
- keep the workshop’s core tensions visible: handoff, verification, repo as shared memory
- reject “AI slop” phrasing even when it sounds fluent

### Risk: The day still feels repetitive after local scene rewrites

Strong individual scenes are not enough if adjacent phases all repeat the same lesson.

Mitigation:

- define a day-wide narrative spine before rewriting broad phase packs
- review transitions between phases, not just scenes in isolation

### Risk: `opening` proves weaker than expected under cold-read

If the proof pack does not hold up, scaling it would multiply the wrong pattern.

Mitigation:

- close the `opening` proof gate first
- treat failures as signal for the editorial system, not just for one pack

### Risk: Participant surfaces drift into weak paraphrases

If participant-view scenes simply mirror room projection in softer wording, they consume authoring effort without adding value.

Mitigation:

- explicitly test whether each participant scene answers “what should my team do now?”
- cut or rewrite mirrors that do not add action or orientation

### Risk: Quality remains subjective and stalls execution

“Amazing copy” can become an unfinishable goal if the review bar stays purely intuitive.

Mitigation:

- use the editorial quality standard in this plan
- use the Czech editorial checklist and spoken check as explicit gates
- name concrete weak scenes and rewrite them first

## Phased Implementation

### Phase 0: Re-baseline and lock the quality bar

Goal: stop planning from outdated assumptions and define the editorial standard for the next slice.

Tasks:

- [x] Adopt this plan as the continuation tracker for scene rollout quality work
- [x] Confirm the current weak-scene list and add any other scenes found in the audit
- [x] Freeze the editorial quality standard and Czech review gates

Exit criteria:

- the team is no longer using “needs richer content” as a vague requirement
- the next work is measured against an explicit narrative and copy bar

### Phase 1: Close the `opening` proof gate

Goal: validate the flagship pattern before propagating it.

Tasks:

- [ ] Run non-Ondrej cold-read on `opening`
- [ ] Run vibe-check on `opening`
- [ ] Apply the minimum corrections needed from those checks

Exit criteria:

- `opening` is validated as a real reference pack, not just a promising implementation

### Phase 2: Define the day-wide narrative spine

Goal: give the remaining rewrites a coherent workshop arc.

Tasks:

- [x] Write the phase-by-phase shift statement for all 10 phases
- [x] Check each phase transition for duplication, missing payoff, or flat energy
- [x] Identify where authority should come from Ondrej, expert voices, visual anchors, or explicit room questions

Exit criteria:

- the workshop day reads as one designed journey rather than isolated scene clusters

### Phase 3: Rewrite the weak flagship packs

Goal: improve the moments where the current blueprint is still obviously thin.

Tasks:

- [x] Rewrite `talk`
- [x] Rewrite `demo`
- [x] Rewrite `build-1`
- [x] Rewrite `rotation`
- [x] Rewrite `build-2`
- [x] Rewrite `intermezzo-2`
- [x] Rewrite `reveal`

Exit criteria:

- the current weak scenes are no longer thin, repetitive, or list-dump driven
- each flagship phase contains at least one room-facing moment worth remembering

### Phase 4: Sweep participant mirrors and localization alignment

Goal: keep participant surfaces and locale quality aligned with the improved room scenes.

Tasks:

- [x] Re-check participant-view scenes for action usefulness
- [x] Tighten Czech delivery across edited packs
- [x] Confirm cross-locale alignment where source and localized content interact

Exit criteria:

- participant surfaces remain purposeful
- Czech delivery is workshop-ready, not just structurally aligned

### Phase 5: Verification and finish criteria

Goal: verify the continuation without over-indexing on mechanical checks.

Tasks:

- [x] Update the minimum necessary presenter tests/e2e coverage for changed structures
- [x] Record which checks were run and which remained manual/editorial
- [ ] Mark the earlier rich-content plan’s remaining propagation work as effectively absorbed by this slice when implementation finishes

Exit criteria:

- the continuation is complete with explicit proof, editorial, and verification outcomes

## References

- [`2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md`](./2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md)
- [`2026-04-09-feat-control-room-agenda-presenter-unification-plan.md`](./2026-04-09-feat-control-room-agenda-presenter-unification-plan.md)
- [`2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md`](../brainstorms/2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md)
- [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json)
- [`content/talks/context-is-king.md`](../../content/talks/context-is-king.md)
- [`content/talks/codex-demo-script.md`](../../content/talks/codex-demo-script.md)
- [`content/facilitation/master-guide.md`](../../content/facilitation/master-guide.md)
- [`content/style-guide.md`](../../content/style-guide.md)
- [`content/czech-editorial-review-checklist.md`](../../content/czech-editorial-review-checklist.md)
