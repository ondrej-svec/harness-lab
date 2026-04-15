---
title: "feat: opening and talk reset with facilitator runner"
type: plan
date: 2026-04-09
status: in_progress
brainstorm: ../brainstorms/2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md
confidence: medium
---

# Opening And Talk Reset With Facilitator Runner Plan

Reset the workshop opening as a true room-facing launch for the whole day, then add a phone-usable facilitator runner in the app so the canonical guide is available where facilitation actually happens.

## Problem Statement

The room-safe presenter fix solved the boundary problem, but it did not yet solve the experience problem.

The current `opening` is cleaner than before, yet it still under-delivers on the real job of the first workshop block:

- it frames discipline faster than it frames possibility
- it explains operating rules before it creates excitement for the day
- it still reads like a compact operating brief instead of a strong workshop opening
- it uses visual patterns such as checkbox-like rows that feel like UI controls rather than presentation language
- it focuses too narrowly on repo/handoff mechanics instead of the whole-day story of learning, building, steering, and continuing with coding agents

There is a second problem behind the content problem:

- the facilitator guide exists in repo docs, but not yet as a strong in-app running surface
- the app can show the room deck, but it is still weaker at telling the facilitator exactly what to say, show, do, and watch right now from a phone-sized screen
- some memorable workshop moves the live facilitation wants, such as the Lego-duck-style framing around creative constraint and the movement-based experience grouping, are not yet canonically authored into the blueprint and guide system

This means the workshop currently has an asymmetry:

- the room sees content that is too flat
- the facilitator still depends too much on memory, GitHub, or private interpretation

If left unchanged, the workshop will keep feeling structurally correct but experientially thin.

## Current State Review

What is already true:

- the presenter now enforces room-safe versus participant-safe content in [`docs/facilitator-agenda-source-of-truth.md`](../facilitator-agenda-source-of-truth.md)
- the day arc is clearly described in [`workshop-blueprint/day-structure.md`](../../workshop-blueprint/day-structure.md)
- the stronger workshop thesis already exists in [`content/talks/context-is-king.md`](../../content/talks/context-is-king.md)
- the facilitation guide already contains milestone logic, checkpoint questions, and continuation doctrine in [`content/facilitation/master-guide.md`](../../content/facilitation/master-guide.md)

What is missing or weak:

- the room-facing `opening` still does not carry the whole-day arc with enough authority, inspiration, or memorable anchors
- the current opening/talk boundary is too rigid; the workshop story wants them to behave like one continuous launch module
- the canonical materials do not yet encode the memorable activation beats the workshop wants to use early in the day
- the app still lacks a proper facilitator runner that is easy to use while standing, walking, or holding a phone

Important evidence from repo review:

- [`content/facilitation/master-guide.md`](../../content/facilitation/master-guide.md) contains the workshop doctrine, but it does not yet encode the Lego-duck-style analogy or the movement-based experience-grouping beat
- [`content/talks/context-is-king.md`](../../content/talks/context-is-king.md) already contains stronger opening-grade lines than the current projector sequence uses
- the brainstorm record explicitly called for “Ondrej frames, experts anchor,” stronger authority quotes, richer narrative peaks, and a premium room experience in [`2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md`](../brainstorms/2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md)

## Target End State

When this lands:

- the first workshop block feels like a real opening, not a compressed rules card
- the `opening` and `talk` together create a clear day-level story: what today is, why harness engineering matters now, what participants will experience, and how the room will move
- the room deck uses presentation-native patterns rather than faux form controls
- the workshop has at least one memorable early analogy and one explicit movement/activation beat authored into the canonical system
- the facilitator can run the current agenda item from an in-app runner on a phone or small tablet without needing to fall back to GitHub for the normal path
- the facilitator guide, agenda model, and room scenes stay aligned rather than drifting into separate truths

## Scope

This plan covers:

- editorial reset of `opening`
- likely companion rewrite of `talk` where needed to form one coherent launch module
- room-scene pattern upgrades needed to support better workshop presentation
- in-app facilitator runner design and implementation planning
- alignment of long-form facilitation guidance with the agenda-owned runtime structure

This plan does not cover:

- rewriting the whole workshop day in one pass
- a generic slide builder
- a second standalone facilitator app
- premium motion/animation work beyond what the existing presenter can reasonably support
- replacing repo-authored guidance with runtime-only content

## Proposed Solution

Treat the next slice as one integrated workshop-launch system, not a copy cleanup.

The solution has four linked parts:

1. **Reframe `opening` and `talk` as one launch arc**
   - `opening` should establish what kind of day this is, why it matters, and what the room is about to do
   - `talk` should deepen the thesis with the harness-engineering explanation, not restart from zero
   - the morning should feel like a guided build-up from inspiration to concrete operating method

2. **Author the missing memorable beats into the canonical workshop**
   - add one early analogy scene or beat inspired by the Lego-duck exercise: same ingredients, many viable constructions, quality shaped by context and imagination
   - add one explicit movement/experience-grouping beat so the opening signals that the day is participatory, not just projected
   - make these part of the blueprint and facilitator guidance, not oral folklore

3. **Upgrade room-scene patterns from “admin cards” to workshop presentation**
   - replace checkbox-looking presentation blocks with patterns that read as principles, commitments, moves, contrasts, or milestones
   - use attributed quotes where they genuinely strengthen the frame
   - ensure each launch scene has one dominant idea and one visible reason to exist

4. **Add a facilitator runner inside the app**
   - agenda remains the source spine
   - the selected agenda item should expose a concise run sheet for facilitation:
     - what to say
     - what to show
     - what movement or exercise happens now
     - what the room should understand by the end of this beat
     - what to watch for
     - what fallback to use if time or energy slips
   - Git remains the authored source of truth, but the app becomes the normal operating surface for live facilitation

## Target Outcome

The felt result should be:

- the opening feels premium, intentional, and slightly exciting
- participants understand that they are here to learn how to build with coding agents, not merely obey a workshop process
- the facilitator feels guided rather than burdened
- the room output and the facilitator operating layer feel like two parts of one designed system

## Anti-Goals

This work must not become:

- a denser pile of text with more cards
- a room deck that spoils the continuation reveal too early
- a checkbox-heavy pseudo-app projected on the wall
- a facilitator runner that is just the GitHub markdown pasted into the dashboard
- a workshop opening that talks only about handoff discipline and forgets inspiration, curiosity, or craft

## Detailed Plan Level

This is a **detailed** plan because it combines editorial redesign, content-model alignment, control-room UX, and live-operating ergonomics in one slice.

## Implementation Tasks

- [x] Re-baseline the launch module around the whole day, not just the morning contract.
  - Write a compact launch narrative covering:
    - what kind of day this is
    - why harness engineering matters now
    - what participants will do today
    - what the room should believe before build work starts
  - Treat `opening` and `talk` as one connected module with a deliberate handoff, not two isolated agenda cards.
  - Update the active editorial continuation plan in [`2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md`](./archive/2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md) to reference this launch reset as the new front edge of content work.

- [x] Audit and rewrite the current `opening` scene pack from first principles.
  - Remove lines that sound like “we are testing” when the real frame is learning and building.
  - Replace the narrow lunch-oriented framing with a day-level promise.
  - Introduce a better early-room sequence, likely including:
    - one day-opening scene
    - one why-now / why-this-matters scene
    - one analogy or contrast scene
    - one room movement / activation scene
    - one first working rule or contract scene
  - Keep continuation quality visible without making the afternoon twist feel pre-spoiled.

- [x] Rewrite the `talk` pack as the second half of the same launch arc.
  - Use [`content/talks/context-is-king.md`](../../content/talks/context-is-king.md) as the primary source.
  - Preserve the strongest line about not learning to “prompt better” but to build a repo and workflow another team can continue.
  - Move any duplicated operating-rule content out of `opening` or `talk` so each scene advances the room’s understanding.
  - Explicitly connect the talk to the first build phase and to the later continuation shift.

- [x] Author the missing workshop activation beats into canonical sources.
  - Decide the exact opening analogy beat inspired by the Lego-duck exercise and encode it in both scene content and facilitation guidance.
  - Decide the early movement/experience-grouping beat and encode:
    - its purpose
    - what the facilitator says
    - how the room moves
    - what it teaches
  - Ensure these beats live in repo-authored sources and are not dependent on Ondrej’s memory.

- [x] Upgrade the launch-scene visual grammar.
  - Define which existing block patterns are acceptable for room projection and which are not.
  - Replace checkbox-like room visuals with presentation-native structures.
  - Add quote usage rules:
    - only attributed
    - only when they add authority or contrast
    - short enough to scan from a room
  - If the current block taxonomy is insufficient, identify the minimum bounded addition needed rather than reopening the whole block system.

- [x] Plan and implement the facilitator runner in the app.
  - Define the run-sheet shape per agenda item:
    - `say`
    - `show`
    - `do`
    - `watch`
    - `fallback`
    - `goal`
  - Decide where it lives in the control room so it is fast on phone and tablet while staying coherent on desktop.
  - Keep it agenda-owned so the selected agenda item remains the operating object.
  - Preserve Git-authored source material as the canonical authoring home, with runtime display derived from it.

- [x] Align the long-form facilitation guide with the agenda/runtime model.
  - Update [`content/facilitation/master-guide.md`](../../content/facilitation/master-guide.md) so the first blocks of the day match the actual opening/talk/module sequence.
  - Ensure every live beat in the opening module has a corresponding facilitator description.
  - Avoid duplication by deciding what belongs in:
    - agenda-owned runtime guidance
    - long-form guide
    - source talk documents

- [x] Define the source-of-truth and publish-back rule for facilitation guidance.
  - Document how Git-authored facilitation content becomes app-visible runner content.
  - Keep the repo as canonical.
  - Do not let the control room become a silent second authoring system for critical workshop method.

- [ ] Add proof artifacts at the actual trust boundary.
  - Produce preview-ready opening and talk scenes for review.
  - Add focused UI verification for any new launch-scene block patterns or facilitator-runner states.
  - Require one human review pass that checks both:
    - room impact
    - facilitator usability on a phone-sized surface
  - Implemented this slice's proof artifacts and automated checks:
    - updated opening and talk scene packs in the agenda blueprint
    - in-app facilitator runner in the control room detail view
    - focused unit and Playwright coverage for runner and presenter rendering
  - Remaining gate before this plan can be marked complete:
    - one human review pass on room impact and phone-sized facilitator usability

## Acceptance Criteria

- The room-facing opening explains the whole day, not just the immediate contract.
- The `opening` and `talk` packs form one coherent launch arc without obvious duplication.
- The room deck no longer uses checkbox-like visuals for non-interactive workshop principles.
- At least one memorable analogy beat and one movement/activation beat are canonically authored into the workshop system.
- The facilitator can open the selected agenda item and run the normal path from an in-app runner on a phone or small tablet.
- The long-form facilitator guide and runtime agenda guidance describe the same opening sequence.
- The updated launch module feels more like a designed workshop presentation than an internal operating memo.

## Decision Rationale

### Why `opening` and `talk` should be reset together

The current weakness is not just a few bad lines in `opening`. The real problem is that the launch energy and the harness-engineering thesis are split awkwardly across two adjacent modules. If only `opening` is rewritten, `talk` is likely to duplicate or flatten the same message again. Treating them as one launch arc gives each one a clearer job.

### Why the facilitator runner matters in the same slice

The workshop is live facilitation, not only projected content. If the room deck gets stronger while the facilitator still has to mentally stitch the method together from repo docs and memory, the system remains incomplete. The runner is part of the workshop product, not secondary polish.

### Why the repo must remain canonical

The workshop teaches repo-native context as doctrine. It would be self-defeating to solve facilitation by hiding the best guidance only in runtime UI state. The correct move is Git-authored source material displayed through a better runtime surface.

### Why memorable beats need to be authored back in

The current workshop material is strong on doctrine and weaker on memorable activation. If the Lego-style analogy or the movement exercise matter, they must be formalized into the canonical workshop package. Otherwise they remain private craft, not reusable method.

## Constraints And Boundaries

- The room-safe presenter separation remains a fixed assumption.
- The selected agenda item remains the primary object in the control room.
- Facilitator support stays separate from room projection.
- The repo stays public-safe; no live private workshop data belongs in tracked source files.
- Czech delivery quality remains first-class.
- The continuation shift should still be experienced, not over-explained in the first minutes.

## Assumptions

| Assumption | Status | Evidence |
| --- | --- | --- |
| The current weakness is primarily editorial and facilitation-operational, not a stale-instance issue | Verified | Live instances were reset and still surfaced the same conceptual gap; current blueprint content matches the screenshots |
| `context-is-king.md` contains stronger launch material than the current opening uses | Verified | The talk source already contains the core thesis and stronger wording about harness engineering and continuation |
| The current facilitator guide does not yet encode the Lego-style analogy or early movement beat | Verified | Repo search did not find these beats in the current facilitation sources |
| A phone-usable facilitator runner will materially reduce dependence on memory and GitHub during live facilitation | Likely | Matches the operating reality of walking facilitation, but still needs UX validation |
| The current block model may be enough with better usage and light refinement | Unverified | Needs validation during the scene-pattern audit; a small bounded addition may still be needed |

## Risk Analysis

### Risk: The new opening becomes inspiring but vague

If the reset leans too far toward inspiration, the room may leave the opener energized but unclear about what good work looks like.

Mitigation:

- keep one concrete operating rule in the launch module
- ensure the talk hands cleanly into build expectations
- use the day-structure doctrine as the anchor

### Risk: The workshop spoils the continuation reveal too early

If the opening over-explains the continuation mechanic, the afternoon loses force.

Mitigation:

- promise continuity and durable work without narrating the full reveal
- keep the early framing about survivable engineering, not the exact lunch mechanic

### Risk: The facilitator runner becomes a duplicated second guide

If the app runner and the markdown guide diverge, facilitation becomes less reliable, not more.

Mitigation:

- define a clear publish-back and source-of-truth rule
- keep the long-form guide canonical
- derive runtime guidance from authored source rather than ad hoc dashboard edits

### Risk: The launch module adds too many beats for the available time

A better opening can still fail if it asks too much of the schedule.

Mitigation:

- design the launch as a sequence of concise beats, not a longer lecture
- make every scene justify its existence
- keep movement/activation moments lightweight and clearly purposeful

## Required Preview Artifacts

- updated opening room-scene sequence
- updated talk room-scene sequence
- one facilitator-runner mock or implemented preview for the selected agenda item
- one mobile-sized view of the runner in the control room
- one room-facing preview showing the new non-checkbox launch scene pattern

## References

- [`workshop-blueprint/day-structure.md`](../../workshop-blueprint/day-structure.md)
- [`content/talks/context-is-king.md`](../../content/talks/context-is-king.md)
- [`content/facilitation/master-guide.md`](../../content/facilitation/master-guide.md)
- [`docs/facilitator-agenda-source-of-truth.md`](../facilitator-agenda-source-of-truth.md)
- [`2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md`](../brainstorms/2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md)
- [`2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md`](./archive/2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md)
- [`2026-04-09-fix-room-safe-presenter-scene-separation-and-opening-reset-plan.md`](./2026-04-09-fix-room-safe-presenter-scene-separation-and-opening-reset-plan.md)
