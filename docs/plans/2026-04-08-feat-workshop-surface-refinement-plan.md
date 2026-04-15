---
title: "feat: workshop surface refinement"
type: plan
date: 2026-04-08
status: complete
brainstorm: ../brainstorms/2026-04-08-facilitator-presenter-rich-content-redesign-brainstorm.md
confidence: medium
---

# Workshop Surface Refinement Plan

Refine the participant room, presenter participant scenes, and facilitator control-room agenda so the newly rich workshop content also feels calm, intentional, and easy to use under live workshop pressure.

## Problem Statement

The rich agenda and presenter-content architecture is now in place, but the product is not fully finished at the interaction-design level.

Current state:

- the participant room finally has real agenda-backed guidance, but mobile density is still uneven
- some participant views still repeat the same state in multiple blocks, which makes the page longer than it needs to be
- the presenter participant scenes and the public participant room now share the same content model, but they do not yet feel fully harmonized as one visual system
- the control-room agenda is content-rich, but still heavier than ideal for live facilitation under time pressure
- copy is materially better than before, but some labels and helper moments still read as system output rather than deliberately authored workshop guidance

This matters because the workshop is now structurally correct. The remaining risk is not wrong architecture, but live usability:

- participants should see one obvious next step without digging through repeated context
- facilitators should feel that the control room and room screen are a coherent operating system, not separate tools with the same data
- projected and mobile surfaces should feel intentionally designed, not merely content-complete

## Proposed Solution

Run a focused refinement pass across the three workshop surfaces that matter most during delivery:

1. participant room
2. presenter participant scenes
3. control-room agenda detail

The rule for this pass is:

- do not reopen the content ownership model
- do not invent a second content system
- do not add product scope like notes mode, slideware, or new runtime concepts
- do tighten hierarchy, density, grouping, and wording so the existing rich model becomes easier to operate

## Plan Level

This is a **standard** plan because the architecture and source-of-truth model are already settled, but there are still multiple valid UX refinements and tradeoffs across mobile density, facilitator speed, and visual consistency.

## Implementation Tasks

- [x] Audit the live surface pain points and lock the refinement rubric.
  - Capture the current participant mobile room, presenter participant scene, and control-room agenda states as the baseline.
  - Write a short review rubric for this pass: `one obvious next step`, `no repeated state unless it serves a different job`, `mobile-first`, `projection-safe`, `facilitator calm under pressure`.
  - Identify the top duplicated or low-signal regions in the current participant room and agenda detail.

- [x] Refine the participant room information hierarchy.
  - Reduce repeated state between the top phase card, participant preview blocks, and shared-room-notes regions.
  - Tighten the first-screen mobile experience so the participant sees `now`, `next`, and one strong guidance cue before lower-priority room details.
  - Rebalance section order and spacing so learner guidance feels primary and team metadata feels secondary.
  - Keep the participant room aligned with the dashboard-surface model: phase-aware before feature-rich.

- [x] Refine the participant block rendering system.
  - Normalize the visual rhythm of `hero`, `bullet-list`, `steps`, `checklist`, `participant-preview`, and `callout` blocks.
  - Introduce clearer distinctions between orientation blocks, action blocks, and informational blocks.
  - Ensure that participant fallback packs remain visibly lower-ceremony than explicitly authored phase packs without feeling broken or generic.

- [x] Refine the presenter participant-scene experience.
  - Align the participant-view presenter scenes more closely with the public participant room so the facilitator is teaching from a recognizable room-equivalent surface.
  - Remove any unnecessary repeated chrome or duplicated summaries that do not help the room.
  - Preserve projection-safe typography and hierarchy while improving continuity between presenter and participant surfaces.

- [x] Refine control-room agenda ergonomics.
  - Re-chunk selected agenda detail into faster-scanning facilitator groups such as `run this moment`, `watch for`, `checkpoint prompts`, and `source refs`.
  - Reduce the “document viewer” feeling in the agenda section without stripping away the rich content that now exists.
  - Improve the mobile and desktop reading rhythm so the control room stays calm under pressure.

- [x] Tighten wording and workshop-language consistency.
  - Review Czech and English copy for labels that still sound like generic system scaffolding instead of workshop guidance.
  - Make sure participant-room wording, presenter participant scenes, and workshop-skill language still reinforce the same learner-facing concepts.
  - Prefer short, operational phrasing for live workshop moments over explanatory prose where the room only needs one clear cue.

- [x] Expand regression and review coverage for the refinement pass.
  - Update focused unit tests where the participant view model or rendering rules change.
  - Update Playwright expectations and visual baselines only for intentional design changes.
  - Repeat browser review on participant mobile, presenter participant scene, and control-room agenda before considering the pass done.

## Acceptance Criteria

- On a mobile participant viewport, the room surface clearly shows the current moment, the next step, and one strong guidance cue without forcing the user through obvious repeated state.
- Every participant-view presenter scene feels like a room-facing companion to the public participant surface rather than a separate generic shell.
- The control-room agenda remains rich, but the selected agenda item can be scanned quickly during live facilitation without feeling like a long document dump.
- Participant blocks have a more deliberate visual hierarchy, with different block types visibly serving different jobs.
- Copy across participant room, presenter participant scenes, and related skill-facing wording remains consistent and workshop-native.
- `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e` all pass after the refinement work.

## Decision Rationale

### Why this should be a refinement pass, not another architecture pass

The hard part is done: there is now one workshop-day model shared across blueprint, runtime, presenter, and participant surfaces. Reopening that model now would slow progress and create churn in the area that was just stabilized.

### Why the participant room is the highest-value refinement target

The participant room is the surface most likely to suffer from mobile density problems and repeated informational blocks. It also sets the visual language for participant-view presenter scenes, so improving it pays off twice.

### Why control-room agenda ergonomics belong in the same pass

The dashboard now contains the right information, but the facilitator experience still depends on how quickly that information can be scanned in a live room. Content completeness without ergonomic chunking is not enough for the control plane.

### Why this plan should avoid new product scope

There are tempting expansions such as presenter notes mode, deck-style sequencing, or additional participant capabilities. Those are different bets. This plan is about making the current model feel excellent, not making it broader.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The rich agenda and presenter-content source-of-truth model is stable enough that refinement should focus on UX rather than structure | Verified | The rich agenda implementation is now committed and the dashboard verification suite is green |
| The participant surface should prioritize one obvious next step over exhaustive room context in the first screenful | Verified | [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md) explicitly says the participant surface should orient participants and give one obvious next step |
| The facilitator surface should optimize for calm and scanning speed under pressure | Verified | [`docs/facilitator-dashboard-design-rules.md`](../facilitator-dashboard-design-rules.md) establishes calm, grouping, and scanning speed as core design rules |
| Explicit participant-view scenes should remain the primary design path even if fallback guidance still exists | Verified | The current blueprint now contains an explicit participant-view scene for every agenda phase |
| The current Playwright and screenshot coverage is sufficient to protect this refinement pass if updated intentionally | Verified | Existing E2E coverage already exercises participant mobile, facilitator mobile, presenter launch, and participant walkthrough flows |
| Mobile density can be improved without hiding workshop-critical information | Unverified | This is the main design tradeoff of the pass and must be validated through browser review |
| Control-room agenda chunking can become faster to scan without making the rich content feel fragmented | Unverified | The right grouping is not fully proven yet |
| Presenter participant scenes and public participant room can share stronger visual language without hurting projection readability | Unverified | Likely true, but needs implementation and review to confirm |

## Risk Analysis

### Risk: The pass reduces density by removing information the room actually needs

If trimming repeated or secondary blocks goes too far, the room may become cleaner but less useful.

Mitigation:

- treat `current moment`, `next step`, and `shared room signal` as the non-negotiable participant core
- remove duplication before removing unique information
- validate against real mobile screenshots rather than judging from code structure alone

### Risk: Participant and presenter surfaces converge too far and lose their distinct jobs

If the presenter participant scenes become literal mirrors of the participant room, the projected surface may stop helping the facilitator teach.

Mitigation:

- align visual language, not job boundaries
- keep presenter scenes projection-safe and teaching-oriented
- keep participant room optimized for handheld use and self-service orientation

### Risk: Control-room agenda polish turns into another redesign spiral

If the agenda refinement becomes a broad admin redesign, this pass will lose focus.

Mitigation:

- limit the work to selected-agenda detail chunking, hierarchy, and scanning rhythm
- keep navigation and control model stable unless a clear blocker emerges
- use the current design-rule docs as the constraint boundary

### Risk: Copy polish drifts away from workshop-skill language

If dashboard wording improves locally but diverges from the participant skill, the product starts telling two slightly different stories again.

Mitigation:

- review participant-facing terminology across room surface, presenter participant scenes, and skill docs during the pass
- prefer shared workshop terms over surface-specific reinvention

## References

- [2026-04-08-facilitator-presenter-rich-content-redesign-brainstorm.md](../brainstorms/2026-04-08-facilitator-presenter-rich-content-redesign-brainstorm.md)
- [2026-04-08-feat-rich-facilitator-agenda-and-presenter-content-plan.md](2026-04-08-feat-rich-facilitator-agenda-and-presenter-content-plan.md)
- [2026-04-08-feat-facilitator-room-screen-and-presenter-flow-plan.md](2026-04-08-feat-facilitator-room-screen-and-presenter-flow-plan.md)
- [dashboard-surface-model.md](../dashboard-surface-model.md)
- [facilitator-dashboard-design-rules.md](../facilitator-dashboard-design-rules.md)
- Current participant room in [page.tsx](../../dashboard/app/page.tsx)
- Current participant view model in [public-page-view-model.ts](../../dashboard/lib/public-page-view-model.ts)
- Canonical agenda scenes in [workshop-blueprint-agenda.json](../../dashboard/lib/workshop-blueprint-agenda.json)
