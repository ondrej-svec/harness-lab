---
title: "refactor: presenter scene density and coverage refinement"
type: plan
date: 2026-04-14
status: in_progress
brainstorm: ../brainstorms/2026-04-12-brainstorm-workshop-agenda-content-review.md
confidence: medium
---

# Presenter Scene Density And Coverage Refinement Plan

Reduce room-screen scrollbar drift by splitting or tightening the scenes that currently carry too much content for the projection baseline, while preserving the workshop's teaching arc and adding only the missing beats that still genuinely earn a scene.

## Problem Statement

Presentation mode currently allows vertical scrolling by design, and some scenes are using that fallback instead of fitting the intended room-facing budget. This creates two linked problems:

1. the room-safe presenter contract says scenes should feel projection-friendly and scene-first, but several current scenes read as stacked documents rather than one beat on one screen
2. because the presenter shell tolerates `overflow-y-auto`, density regressions do not fail fast; an overloaded scene can still "work" technically while degrading the facilitation moment

The current agenda is much stronger than the earlier April drafts, but the research pass shows that a small set of scenes still carry two jobs at once:

- evidence + interpretation
- timeline + baseline + teaching doctrine
- commitment prompt + storage mechanics + tool-agnostic close

That is exactly the failure mode the scene-authoring doctrine warns about.

## Relationship To Prior Work

This plan does not reopen the presenter architecture.

It builds on:

- [`docs/brainstorms/2026-04-10-expert-panel-scene-updates-brainstorm.md`](../brainstorms/2026-04-10-expert-panel-scene-updates-brainstorm.md)
- [`docs/plans/archive/2026-04-10-feat-expert-panel-scene-updates-plan.md`](archive/2026-04-10-feat-expert-panel-scene-updates-plan.md)
- [`docs/brainstorms/2026-04-12-brainstorm-workshop-agenda-content-review.md`](../brainstorms/2026-04-12-brainstorm-workshop-agenda-content-review.md)
- [`docs/presenter-rich-scene-authoring.md`](../presenter-rich-scene-authoring.md)

The April 10 and April 12 work solved the agenda's narrative structure and missing teaching beats. This plan is a refinement pass from current state: the room story is mostly correct, but a subset of scenes still needs to be redistributed across the scene stack so the projection surface stops relying on scroll.

## Current-State Findings

### Verified baseline

- Presenter visual baselines are currently protected at `1024x768` in [`dashboard/e2e/dashboard.spec.ts`](../../dashboard/e2e/dashboard.spec.ts).
- Presenter slides are intentionally `h-screen` and `overflow-y-auto` in [`dashboard/app/admin/instances/[id]/_components/presenter-shell.tsx`](../../dashboard/app/admin/instances/%5Bid%5D/_components/presenter-shell.tsx).
- The design docs define presenter output as projection-friendly and scene-first, not as a scrolling admin surface.

### High-density scene audit

The heaviest current scenes in `workshop-content/agenda.json` are:

| Priority | Scene | Current load | Reading |
|---|---|---:|---|
| 1 | `talk-argued-about-prompts` | 3 blocks / ~2454 chars | Too dense; clearly carries evidence parade plus "why now" weather beat |
| 2 | `build-2a-eighty-five` | 4 blocks / ~1822 chars | Too dense; tries to carry first push, intermezzo, second push, cleanup, and self-validation |
| 3 | `build-1-next-65-minutes` | 4 blocks / ~1669 chars | Too dense for an ambient participant/projection scene |
| 4 | `reveal-one-thing` | 5 blocks / ~1549 chars | Too dense; commitment prompt and storage mechanics should not compete on one screen |
| 5 | `talk-how-to-build` | 4 blocks / ~1418 chars | Too dense; four pillars plus role-shift teaching plus recap checklist |
| 6 | `opening-team-formation` | 3 blocks / ~1328 chars | Borderline; kinetic instructions and rationale are competing |
| 7 | `demo-first-ten-minutes` | 4 blocks / ~1285 chars | Borderline; startup instructions and "ambition" framing should be separated |
| 8 | `talk-got-a-name` | 4 blocks / ~1194 chars | Borderline; quote, analogy, and reframe may be one beat too many |
| 9 | `rotation-read-the-room` | 3 blocks / ~1142 chars | Borderline; theory + protocol + emotional reframing |

### Doctrine mismatch

The strongest conflicts with the authoring doctrine are:

- `talk-argued-about-prompts`: one scene trying to do proof, trend report, and urgency framing
- `talk-how-to-build`: one scene trying to do explanation, taxonomy, and identity shift
- `build-1-next-65-minutes`: one scene trying to do schedule, repo baseline, and verification philosophy
- `build-2a-eighty-five`: one scene trying to do the whole afternoon's first half and second half at once
- `reveal-one-thing`: one scene trying to do writing prompt, storage decision, specificity coaching, and tool-agnostic reassurance

## Target End State

When this lands:

- default room-facing scenes that are meant to be read in one beat fit cleanly at `1024x768` without vertical scrolling
- scrolling remains an explicit fallback or exception for `team-trail` and any deliberately dense participant-support surfaces, not the quiet default for flagship room scenes
- every room-facing scene has one dominant idea and one clear next move
- supporting detail moves either to:
  - the next scene in the sequence
  - facilitator notes / facilitator runner
  - participant-support surfaces
  - source docs
- the talk, build, and reveal arcs still feel complete after the splits; the fix is not "make scenes shorter by making them thinner"

## Scope

### In scope

- room-facing scene audit and classification
- targeted scene splits, trims, and minor reorderings in `workshop-content/agenda.json`
- limited addition of new scenes where the extra beat is load-bearing
- facilitator-note and runner redistribution when projected detail should become backstage detail
- presenter-content verification additions for vertical fit on selected scenes
- doc updates where the fit contract becomes a recurring rule

### Out of scope

- a new presenter renderer or generic deck system
- wholesale rewrite of the workshop story
- rewriting all scene copy from scratch
- making every presenter page globally "no scroll" regardless of scene type
- broad dashboard redesign work unrelated to scene density

## Proposed Solution

Treat this as a bounded content-architecture refinement pass with one explicit rule:

> For room-facing scenes, scrolling is fallback, not the design target.

The plan has four moves:

1. Define a scene-fit contract and exception list.
2. Split only the scenes that currently carry two real beats.
3. Trim or demote detail where a second scene would be noise instead of progress.
4. Add proof-scene viewport checks so the same problem does not quietly return.

## Candidate Scene Changes

### Must split

1. `talk-argued-about-prompts`
   - Working direction: split into an evidence scene and a separate urgency/why-now scene, or cut the "weather" material if it cannot justify its own beat.
   - Reason: current scene combines external voices, workshop thesis setup, and macro uncertainty.

2. `talk-how-to-build`
   - Working direction: split the "four pillars" teaching from the "managing instead of chatting" role shift.
   - Reason: the current scene teaches both the system parts and the engineer identity change.

3. `build-1-next-65-minutes`
   - Working direction: split ambient timeline from repo baseline / verification doctrine.
   - Reason: one ambient scene should not have to act as both schedule and philosophy handout.

4. `build-2a-eighty-five`
   - Working direction: make the first-push scene describe only quiet read, friction capture, and first push; let the already-existing `build-2-second-push` phase own the second half. Keep self-validation either as its own support scene or a shorter checkpoint callout.
   - Reason: current scene still reads like a compressed half-day schedule.

5. `reveal-one-thing`
   - Working direction: split "write the commitment" from "pick where it lives", or move storage options off the projected scene entirely.
   - Reason: writing the sentence is the beat; storage mechanics are secondary.

### Likely trim or demote, not split

1. `opening-team-formation`
   - Keep the kinetic flow, but move "why mix experience" out of the visible scene unless it still earns the room's attention in preview.

2. `demo-first-ten-minutes`
   - Keep the four startup moves on the scene.
   - Demote or relocate the ambition callout unless preview proves it still lands without making the slide top-heavy.

3. `talk-got-a-name`
   - Prefer replacing the long analogy paragraph with a shorter line or a visual-backed treatment before adding another scene.

4. `talk-humans-steer`
   - Keep as one beat, but likely reduce from two supporting quotes to one if it feels crowded in preview.

5. `rotation-read-the-room`
   - Keep as one scene unless the quiet-start protocol still scrolls after the heavier build scenes are fixed; if it does, split theory from protocol.

### Potential added scenes that likely earn their place

These are working ids and may change during implementation:

- `talk-why-now` or `talk-the-weather`
  - only if the current urgency content is kept instead of cut
- `talk-managing-agents`
  - if the role-shift message needs its own scene after the four pillars split
- `build-1-by-lunch`
  - if the repo baseline deserves its own ambient beat separate from the timeline
- `build-2a-first-push`
  - likely replaces the current overloaded first Build 2 ambient scene
- `reveal-save-the-commitment`
  - only if storage mechanics remain visible on the room screen after preview

## Decision Rationale

### Why split instead of only trimming

Some scenes are not merely verbose. They contain two separate teaching moves that each deserve a moment:

- evidence, then interpretation
- workflow timeline, then repo baseline
- reflection prompt, then commitment-storage choice

If those pairs stay merged, trimming will only hide the conflict, not solve it.

### Why not split everything that is long

The opposite risk is chatter: too many scenes, too many flips, too little weight. The right rule is:

- split when the second beat changes what the room should think or do
- trim when the second block is support material, not a separate beat
- move backstage detail off the projected scene when it mainly helps the facilitator rather than the room

### Why keep scroll support in the shell

The presenter shell's scroll behavior is useful for legitimate exceptions:

- `team-trail` scenes
- participant-support surfaces with intentional accumulated context
- future instance-local experiments

The bug is not that the shell can scroll. The bug is that flagship room scenes have no explicit fit gate.

## Constraints And Boundaries

- `workshop-content/agenda.json` remains the bilingual source of truth.
- Generated outputs must still be refreshed with `npm run generate:content` and verified with `npm run verify:content`.
- Visible Czech changes require deterministic typography audit, Layer 2 review pass, and Czech-fluent human signoff per [`docs/workshop-content-qa.md`](../workshop-content-qa.md).
- Presenter scenes stay agenda-linked web pages, not a freeform slide authoring system.
- Facilitator guidance that is useful only for delivery should move into `facilitatorNotes` or `facilitatorRunner`, not stay on the room screen out of habit.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| `1024x768` is still the practical presenter proof viewport | Verified | Current screenshot baselines in `dashboard/e2e/dashboard.spec.ts` use that viewport for presenter scenes |
| Current scrollbars are content-budget failures, not unknown viewport targeting | Verified | Presenter shell uses `h-screen` + `overflow-y-auto`; no vertical-fit content gate exists |
| Not every long scene needs a new scene; some only need demotion of supporting detail | Verified | `docs/presenter-rich-scene-authoring.md` favors restraint and one dominant beat over density |
| A small increase in scene count is acceptable if it improves pacing and legibility | Unverified | Needs proof-slice facilitator preview |
| `team-trail` and some participant-support views should remain allowed to scroll | Unverified | Needs explicit exception decision during verification design |

Unverified assumptions become explicit preview gates below.

## Risk Analysis

### Risk: over-splitting makes the deck feel fussy

Mitigation:

- require every proposed new scene to state its own dominant beat
- reject any split where the second scene is only a leftover paragraph
- start with a proof slice before propagating the pattern

### Risk: content moves off the screen and disappears from delivery

Mitigation:

- whenever projected content is demoted, assign its new home explicitly:
  - facilitator note
  - facilitator runner
  - participant surface
  - long-form source doc

### Risk: viewport-fit tests become brittle

Mitigation:

- add no-scroll assertions only for designated proof scenes
- keep documented exceptions for `team-trail` and any intentionally scrollable surfaces
- pair fit assertions with screenshots, not with raw layout math alone

### Risk: Czech review overhead slows the whole slice

Mitigation:

- run a proof slice first
- batch the remaining scene updates after the pattern is stable
- keep the visible-copy delta small where a demotion or cut works better than a rewrite

## Target Outcome

The room should feel like it is moving scene to scene, not reading through a stacked content page. A facilitator should be able to advance one scene and know what the room should notice now, not scan for which block matters most.

## Anti-Goals

- a mechanically "shorter" agenda that loses substance
- a much larger deck that solves density by fragmentation
- turning participant-support scenes into vague poster slogans
- solving room-scene density by pushing too much hidden burden onto facilitator improvisation

## Tone And Taste Rules

- One dominant idea per scene.
- Prefer cuts over smoothing.
- A room scene may carry one memorable supporting device: one quote, one image, one checklist, one callout rhythm. Not all of them by default.
- Timeline scenes should orient and pace, not lecture.
- Participant scenes should stay more imperative and operational than the talk scenes.

## Representative Proof Slice

Use a three-part proof slice before broader rollout:

1. talk
   - `talk-argued-about-prompts`
   - `talk-how-to-build`
   - `talk-humans-steer`
2. one ambient build scene
   - `build-1-next-65-minutes`
3. one reveal scene
   - `reveal-one-thing`

Why this slice:

- it covers the three most overloaded content shapes in the agenda:
  - evidence-led talk scene
  - ambient timeline scene
  - commitment scene
- if the split strategy works there, it is likely safe to propagate

## Rollout Rule

Do not propagate scene-count changes across the rest of the agenda until the proof slice passes all of these:

- no-scroll projection preview at `1024x768`
- room-legibility screenshot review
- facilitator cold-read check
- visible Czech review note for touched scenes

## Rejection Criteria

The refinement is wrong even if it compiles when:

- a new scene exists only because the previous scene was long, not because the new beat earns its own moment
- the presenter route still scrolls on proof scenes at `1024x768`
- a split forces the facilitator to explain backstage logic that used to be obvious
- demoted content no longer exists anywhere durable

## Required Preview Artifacts

- updated presenter screenshots for each proof-slice scene at `1024x768`
- one `1920x1080` presenter spot-check for the same proof slice
- one participant/mobile capture if a `participant` chrome scene changes materially
- a review note under `docs/reviews/workshop-content/` covering:
  - fit
  - scene quality
  - facilitator cold-read
  - Czech visible-surface status

## Implementation Tasks

### Phase 0: Establish the scene-fit contract

- [x] Document a presenter-content rule in [`docs/presenter-rich-scene-authoring.md`](../presenter-rich-scene-authoring.md): room-facing proof scenes should fit the baseline viewport unless explicitly marked as scroll-allowed.
- [x] Add an exception list for scene families that may intentionally scroll, at minimum `team-trail` and any explicitly designated participant-support views.
- [x] Create a current-state audit table in the implementation slice showing which scenes are `fit-required`, `trim-needed`, `split-needed`, or `scroll-allowed`.

### Phase 1: Proof slice on the talk arc

- [x] Split `talk-argued-about-prompts` into two beats or cut the "weather" material if preview shows it does not earn its own scene.
- [x] Split `talk-how-to-build` so the four-pillar system and the role-shift message stop competing on one screen.
- [x] Tighten `talk-got-a-name` and `talk-humans-steer` so each keeps one supporting device too few rather than one too many.
- [x] Update facilitator notes and runner text where moved content would otherwise be lost.

### Phase 2: Tighten the kinetic and kickoff scenes

- [x] Rework `opening-team-formation` so the visible scene carries the movement cleanly and the rationale appears only if it still earns projection space.
- [x] Tighten `demo-first-ten-minutes`; keep the startup moves, relocate or cut the ambition framing if it burdens the screen.

### Phase 3: Rebuild the ambient build scenes

- [x] Split `build-1-next-65-minutes` into a timeline scene and a separate repo-baseline / proof scene if preview confirms the current combined scene still scrolls.
- [x] Refactor `build-2a-eighty-five` so the first-push ambient scene stops describing the entire remaining afternoon.
- [x] Re-check `build-2b-second-push-timeline` after the Build 2 first-push rewrite so the two ambient scenes feel like a pair rather than a duplication bug.
- [x] Reassess `rotation-read-the-room` after the build refactors; split only if it remains too dense.

### Phase 4: Rework the reveal commitment beat

- [x] Split `reveal-one-thing` into writing and storage beats, or move storage mechanics out of the projected scene entirely.
- [x] Keep the commitment scene anchored to "the next time I work with an agent" rather than calendar-day language.
- [x] Ensure the closing still lands as a craft commitment rather than an app-instructions screen.

### Phase 5: Verification and review gates

- [x] Add Playwright coverage that asserts designated proof scenes do not vertically overflow at `1024x768`.
- [x] Update or add screenshot baselines for the proof slice.
- [x] Run `npm run generate:content` and `npm run verify:content`.
- [x] Run the Czech deterministic typography audit for affected visible Czech surfaces.
- [x] Create a review note in `docs/reviews/workshop-content/` with viewport-fit and visible-Czech status.

### Phase 6: Broad rollout, only if proof slice passes

- [x] Apply the same split/trim logic to the remaining flagged scenes.
- [x] Update any long-form talk or facilitation docs whose scene summaries no longer match the agenda sequence.
- [x] Re-run preview and review gates for the propagated scenes.

## Acceptance Criteria

- Proof-slice room scenes fit at `1024x768` without vertical scrolling.
- Any scene explicitly allowed to scroll is documented as an exception.
- `talk-argued-about-prompts`, `talk-how-to-build`, and `reveal-one-thing` no longer carry two independent teaching beats on one screen.
- Ambient build scenes stop combining schedule, repo baseline, and teaching doctrine into one card unless preview proves the combined version fits cleanly.
- Any content removed from room-facing scenes still has a durable home.
- Updated screenshot baselines and review artifacts exist for the proof slice.

## References

- [`docs/presenter-rich-scene-authoring.md`](../presenter-rich-scene-authoring.md)
- [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md)
- [`docs/workshop-content-qa.md`](../workshop-content-qa.md)
- [`docs/workshop-content-language-architecture.md`](../workshop-content-language-architecture.md)
- [`workshop-blueprint/day-structure.md`](../../workshop-blueprint/day-structure.md)
- [`dashboard/app/admin/instances/[id]/_components/presenter-shell.tsx`](../../dashboard/app/admin/instances/%5Bid%5D/_components/presenter-shell.tsx)
- [`dashboard/e2e/dashboard.spec.ts`](../../dashboard/e2e/dashboard.spec.ts)
- [`workshop-content/agenda.json`](../../workshop-content/agenda.json)
