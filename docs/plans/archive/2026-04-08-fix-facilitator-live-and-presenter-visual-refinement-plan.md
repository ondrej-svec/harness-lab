---
title: "fix: facilitator live and presenter visual refinement"
type: plan
date: 2026-04-08
status: complete
confidence: high
---

# Facilitator Live And Presenter Visual Refinement Plan

Fix the review findings around facilitator `live` usability and presenter projection behavior so the control room becomes genuinely iPad-first, preserves a safe recovery path for continuation reveal, and keeps the room-facing screen focused on one shared cue instead of a mini-dashboard.

## Problem Statement

The dashboard remediation pass improved the system, but the review found three remaining issues that materially affect workshop operation:

- the continuation reveal/hide control is now only available when the current or next agenda item is the handoff moment, which removes the facilitator’s recovery path after that moment passes
- the facilitator `live` screen still spends too much viewport height on duplicated header/hero/status storytelling before the first meaningful control appears
- the presenter participant walkthrough still renders like a compact dashboard, with metrics and team cards competing with the room-facing cue

This matters because the current product contract is operational, not decorative:

- the facilitator needs a persistent way to recover participant-surface state without manipulating the live marker as a workaround
- the default `live` screen has to privilege the one action that matters now on iPad-class viewports
- the presenter surface has to answer one question quickly: what should the room see right now?

The visual refinement issue is therefore not “theme weakness.” It is still mostly page architecture and disclosure discipline.

## Proposed Solution

Implement the follow-up in four dependency-ordered slices:

1. restore the continuation-state contract so contextual handoff remains primary without losing a secondary recovery path
2. refactor the facilitator `live` shell into an iPad-first operating surface with less duplicated top-of-page chrome
3. simplify presenter participant walkthrough scenes so the projected surface is room-facing and cue-first rather than dashboard-like
4. add the visual and behavioral regression coverage needed to keep these contracts from drifting again

Keep the scope intentionally narrow:

- no new dashboard product areas
- no new presenter authoring system
- no redesign of workspace cockpit or auth flows
- no reopening of the blueprint/runtime ownership model

## Detailed Plan Level

This is a **detailed** plan because it changes facilitator control behavior, live-screen IA, presenter rendering density, and the verification strategy for visual regressions across real device-class viewports.

## Decision Rationale

### Why restore a recovery path instead of returning to a permanent global continuation card

The review was correct that the always-visible continuation card did not belong on the default `live` canvas. But the current implementation over-corrected by deleting the facilitator’s fallback path entirely. The right model is:

- contextual promotion on the `live` screen when handoff is current or next
- secondary recovery path elsewhere in the facilitator product when it is not

That preserves the “run this moment” contract without making the state impossible to recover.

### Why treat the facilitator problem as page IA, not design-token work

The current design system and tokens are already directionally coherent. The remaining problem is that the `live` route still duplicates the same story in the header, hero, stats strip, and timeline before the first action block. That is why the smaller viewport screenshots feel better: they accidentally reduce simultaneous narratives.

The correct fix is to remove duplicated state storytelling and give the first viewport to:

- current moment
- next transition
- primary action
- one contextual action group

### Why simplify presenter participant walkthrough instead of polishing its existing dashboard cards

The participant walkthrough is projected room content, not facilitator monitoring. Metrics and team checkpoint cards belong to the control room unless there is a very deliberate reason to project them. The presenter route should default to a cue-first composition and only keep context that helps the room understand the current moment.

### Why add stronger visual verification in this slice

The review findings include behavior plus viewport hierarchy. Current browser coverage proves flows work, but it does not yet protect the specific presenter and iPad-class visual contracts that just regressed. This slice should lock those layouts with explicit screenshots and focused interaction checks.

### Alternatives considered

#### Alternative 1: Put the continuation toggle back on the default `live` screen permanently

Rejected because it would reintroduce the original clutter and detach continuation from the actual handoff moment.

#### Alternative 2: Fix only the persistent continuation control and leave the current live-shell layout intact

Rejected because the user’s screenshots and the review both show the top-of-page information architecture is still the main UX issue.

#### Alternative 3: Keep the presenter participant walkthrough rich because the facilitator may project it from an iPad

Rejected because projected room content and facilitator self-orientation are different jobs. The facilitator can still use the control room for operational richness; the projected route should stay room-safe and cue-first.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Facilitators still need to reveal or hide the continuation window even after the handoff moment is no longer current or next | Verified | Review finding and [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md) list reveal/hide continuation as an ongoing facilitator responsibility |
| The always-visible continuation card should not return to the default `live` canvas | Verified | [`docs/facilitator-control-room-design-system.md`](../facilitator-control-room-design-system.md) and the recent audit both define continuation as contextual rather than permanent |
| The facilitator `live` route should be optimized for iPad-class use first | Verified | User direction plus [`docs/facilitator-control-room-design-system.md`](../facilitator-control-room-design-system.md) explicitly define the control room as iPad-first |
| The current `live` shell duplicates the same state narrative too many times before the first control | Verified | Review evidence in [`dashboard/app/admin/instances/[id]/page.tsx`](../../dashboard/app/admin/instances/[id]/page.tsx) and attached screenshots |
| Presenter participant walkthrough should prioritize one room-facing cue over metrics/team-monitoring chrome | Verified | [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md) defines the presenter surface as one clear shared screen for the current moment |
| The presenter route still needs some lightweight context for certain scene presets | Verified | Current presenter chrome presets (`agenda`, `checkpoint`, `participant`) already imply controlled contextual framing rather than zero context |
| A compact secondary facilitator recovery control can live outside the main `live` stack without hurting discoverability | Unverified | The exact best location still needs implementation validation: likely `settings` or a small runtime-status inset |
| Screenshot coverage at iPad-class and presenter-class viewports will be stable enough to protect these layouts in CI | Unverified | Current screenshot coverage exists for public and facilitator mobile, but presenter-specific visual baselines have not yet been proven |

The two unverified assumptions should be resolved during implementation by choosing one explicit home for non-contextual continuation recovery and by calibrating screenshot scope/masking so the visual tests stay stable.

## Risk Analysis

### Risk: adding a fallback continuation control quietly recreates the original clutter

Mitigation:

- keep the fallback outside the main `live` action stack
- phrase it as state recovery or override, not as a co-primary live action
- preserve the handoff card as the primary place to act during the actual moment

### Risk: collapsing the header too aggressively removes useful facilitator context

Mitigation:

- keep instance identity, sign-out/theme/language utilities, and compact runtime status visible
- remove only duplicated storytelling, not critical scope cues
- validate the first viewport against the control-room question set: what is live, what is next, what matters now?

### Risk: simplifying the presenter participant view removes context the room actually needs

Mitigation:

- keep the participant scene body and one small amount of agenda context where it helps comprehension
- move facilitator-oriented metrics and team checkpoint summaries out of the projected default
- verify on both standalone presenter page and iPad-like projection workflow

### Risk: visual screenshot tests become flaky and create noise

Mitigation:

- snapshot only the stable shell and first viewport
- mask known time/archive/session volatility
- pair screenshots with assertion-based behavioral checks rather than relying on image diffs alone

## Phased Implementation

### Phase 1: Re-establish the continuation control contract

Goal: keep contextual handoff control primary while restoring a safe fallback path.

Tasks:

- [x] Define the continuation-state interaction model explicitly: contextual primary control during handoff, secondary recovery control outside that moment.
- [x] Choose and document the home for the fallback control, likely a compact runtime-state inset rather than the main `live` stack.
- [x] Update facilitator copy so the primary handoff action and fallback recovery action are clearly distinct in meaning.
- [x] Add direct tests for both states: handoff current/next and post-handoff recovery.

Exit criteria:

- facilitators can reveal or hide participant continuation without rewinding the live marker
- the default `live` screen does not regress to a permanent continuation wall

### Phase 2: Refactor the facilitator `live` shell for iPad-first use

Goal: make the first viewport answer the facilitator’s dominant question without duplicated chrome.

Tasks:

- [x] Reduce top-of-page duplication between the global header, hero summary, summary strip, and live-canvas hero.
- [x] Decide which state belongs in the persistent header versus the `live` canvas, and remove repeated storytelling from one of those layers.
- [x] Reorder the `live` canvas so phase control and the one contextual action group land higher in the first viewport on iPad-class widths.
- [x] Re-evaluate whether the full agenda timeline belongs in the first `live` viewport or should start lower / in a lighter secondary presentation.
- [x] Preserve desktop expansion, but make it a calmer extension of the same iPad-first structure rather than a separate narrative layout.
- [x] Update the control-room design docs if the final structure sharpens the system rules.

Exit criteria:

- the first viewport on iPad-class widths clearly shows current moment, next moment, and primary action
- the `live` route no longer repeats the same status story across multiple stacked surfaces

### Phase 3: Simplify presenter participant walkthrough

Goal: make projected participant walkthrough scenes cue-first and room-safe.

Tasks:

- [x] Define the default presenter participant composition: dominant cue, optional minimal agenda context, optional actionable next link.
- [x] Remove facilitator-monitoring elements from projected participant walkthrough by default, including room-pulse metrics and team checkpoint cards unless explicitly justified.
- [x] Verify that attributed quotes, source-aware images, and actionable links still fit the simplified presenter composition cleanly.
- [x] Tighten presenter tests so they assert the absence of dashboard-like facilitator chrome in participant walkthrough mode, not only the absence of nav/back links.
- [x] Update presenter-surface docs to state what contextual elements are allowed on a room-facing walkthrough screen.

Exit criteria:

- presenter participant walkthrough reads as one room-facing story, not a dashboard
- projected content stays useful on mirrored iPad and larger screens

### Phase 4: Lock the behavior and visual hierarchy with regression coverage

Goal: protect the new surface contracts with executable checks.

Tasks:

- [x] Add page-level or integration coverage for continuation fallback behavior outside the handoff moment.
- [x] Add an iPad-class screenshot baseline for the facilitator `live` route that focuses on first-viewport hierarchy.
- [x] Add a presenter screenshot baseline for at least one participant walkthrough scene and one default presenter scene.
- [x] Extend e2e assertions so presenter walkthrough explicitly proves dashboard metrics/team cards are absent when not intended.
- [x] Run and record the dashboard verification set required by the touched surfaces.

Exit criteria:

- regression coverage protects the new facilitator and presenter surface contracts
- future refactors are less likely to reintroduce duplicated live chrome or dashboard-like presenter output

## Implementation Tasks

1. **Restore continuation fallback safely**
- [x] Define the final continuation control model in code and docs.
- [x] Implement one secondary recovery path for reveal/hide outside the handoff moment.
- [x] Keep the contextual handoff card as the promoted primary control during the live transition.
- [x] Add tests for both contextual and fallback paths.

2. **Make facilitator `live` genuinely iPad-first**
- [x] Remove duplicated header/live-summary storytelling.
- [x] Bring phase control into the first viewport on iPad-class widths.
- [x] Reduce the density or placement of the agenda timeline in the default `live` flow.
- [x] Validate that desktop remains coherent without becoming a separate product layout.

3. **Refine presenter participant walkthrough**
- [x] Replace dashboard-like participant walkthrough chrome with a cue-first room-facing composition.
- [x] Keep only minimal contextual framing that helps the room, not facilitator monitoring detail.
- [x] Recheck quote, image, and CTA blocks inside the simplified presenter layout.

4. **Harden verification and docs**
- [x] Add screenshot and behavioral regression coverage for facilitator `live` and presenter walkthrough.
- [x] Update surface-model and facilitator/presenter design docs where the final structure becomes a recurring rule.
- [x] Re-run the relevant dashboard verification set and record any masking/stability conventions needed for screenshots.

## Acceptance Criteria

- A facilitator can hide or reveal the participant continuation state even when the handoff moment is no longer current or next.
- The default `live` screen does not show a permanent continuation control card, but it still provides one clear fallback path elsewhere in the facilitator product.
- On iPad-class widths, the first facilitator viewport shows current moment, next moment, and primary live action without requiring a long scroll through duplicated status chrome.
- The facilitator `live` route no longer repeats the same event/runtime story across multiple stacked panels before the first control.
- Presenter participant walkthrough scenes no longer show dashboard-style room-pulse metrics and team checkpoint cards by default.
- Presenter participant walkthrough still supports actionable links, attributed quotes, and source-aware images where authored.
- Screenshot and assertion-based regression coverage exists for the refined facilitator `live` shell and presenter participant walkthrough.

## References

- Review findings embodied in current code:
  - [control-room page](../../dashboard/app/admin/instances/[id]/page.tsx)
  - [presenter page](../../dashboard/app/admin/instances/[id]/presenter/page.tsx)
- Surface and design-system docs:
  - [dashboard-surface-model.md](../dashboard-surface-model.md)
  - [dashboard-design-system.md](../dashboard-design-system.md)
  - [facilitator-dashboard-design-rules.md](../facilitator-dashboard-design-rules.md)
  - [facilitator-control-room-design-system.md](../facilitator-control-room-design-system.md)
- Related prior plans:
  - [2026-04-08-fix-dashboard-design-system-audit-remediations-plan.md](2026-04-08-fix-dashboard-design-system-audit-remediations-plan.md)
  - [2026-04-07-feat-facilitator-cockpit-ia-and-ux-redesign-plan.md](2026-04-07-feat-facilitator-cockpit-ia-and-ux-redesign-plan.md)
  - [2026-04-08-feat-facilitator-room-screen-and-presenter-flow-plan.md](2026-04-08-feat-facilitator-room-screen-and-presenter-flow-plan.md)
