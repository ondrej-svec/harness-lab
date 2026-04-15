---
title: "fix: facilitator runtime context and presenter follow-up"
type: plan
date: 2026-04-08
status: complete
confidence: high
---

# Facilitator Runtime Context And Presenter Follow-up Plan

Address the three remaining review findings from the facilitator live/presenter refinement slice: restore persistent runtime context across the facilitator shell, remove duplicated participant walkthrough copy on the projected surface, and re-lock the contextual handoff contract with a stronger end-to-end assertion.

## Problem Statement

The latest refinement pass improved the control room, but the follow-up review found three remaining issues:

- the facilitator shell no longer keeps core live runtime state visible outside the `live` section
- participant walkthrough scenes still repeat the same guidance copy in both the scene-context layer and the dominant cue block
- the updated browser coverage no longer proves that the contextual handoff card disappears after the facilitator moves past the rotation moment

These are not cosmetic gaps. They weaken the core operating contracts:

- facilitators need persistent orientation even when they are working in `agenda`, `teams`, `signals`, or `access`
- projected participant walkthrough needs one clear room-facing message, not duplicated framing
- contextual controls need regression coverage that proves they appear only when they should

## Proposed Solution

Make one bounded follow-up pass in three implementation slices:

1. restore a compact persistent runtime-status strip in the facilitator shell so live phase, participant-surface state, and team count remain visible across sections without rebuilding the old duplicated hero stack
2. simplify participant walkthrough rendering so the scene body is shown once as the dominant cue while the supporting context layer becomes metadata-only or otherwise non-duplicative
3. strengthen regression coverage so the `live` route explicitly proves the handoff card is absent again after moving beyond the rotation moment

Keep the scope narrow:

- no new facilitator sections
- no redesign of the presenter system
- no new dashboard content model
- no reopening of the broader design-system remediation work

## Plan Level

This is a **standard** plan because the scope is clear, the code paths are known, and the work is a bounded correction of one recent refinement slice rather than a fresh architectural redesign.

## Decision Rationale

### Why restore runtime context in the persistent shell

The review is correct that current phase, participant-surface state, and team count are facilitator-orientation signals, not `live`-section-only content. The fix should restore those signals to the shared shell instead of duplicating them separately inside each section. That keeps the facilitator oriented across `agenda`, `teams`, `signals`, `access`, and `settings` without rebuilding the old oversized top-of-page narrative.

### Why remove duplicate participant body text from the context layer

The projected participant walkthrough should have one dominant instruction. Right now the context card and the cue card compete by restating the same message. The right correction is to keep the cue card dominant and reduce the surrounding context to framing that does not restate the same body copy.

### Why restore an explicit handoff-disappearance assertion

The contextual handoff contract is behavioral, not visual taste. The current e2e flow still proves that the fallback works in `settings`, but it no longer proves that `handoff moment` disappears from `live` after the workshop moves on. That specific assertion should come back so the route cannot silently drift into another permanent control wall.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Facilitators need current phase, participant-surface state, and team count visible outside the `live` section | Verified | [`docs/facilitator-dashboard-design-rules.md`](../facilitator-dashboard-design-rules.md) says status stays persistent in the control room |
| Restoring persistent runtime context does not require bringing back the large duplicated `live` hero structure | Verified | The regression is about missing persistent signals, not about removing the smaller live-first IA improvements |
| Participant walkthrough should show `scene.body` once as the main room-facing cue | Verified | [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md) says participant walkthrough stays cue-first and should not default to dashboard-like chrome |
| The current duplicated walkthrough copy comes from both `ParticipantSceneContext` and `ParticipantPreview` using the same scene body | Verified | [`dashboard/app/admin/instances/[id]/presenter/page.tsx`](../../dashboard/app/admin/instances/[id]/presenter/page.tsx) renders `scene.body` in both places for `participant` scenes |
| The handoff card should disappear from `live` once the runtime is no longer at the handoff moment and it is not next | Verified | The existing `contextualHandoffItem` logic is intentionally current-or-next only, and the review specifically identified missing proof of that behavior |
| A compact shell-level runtime strip can fit cleanly on iPad-class layouts without reintroducing clutter | Unverified | The intended density is clear, but the exact presentation still needs implementation judgment in the control-room header |

The one unverified assumption should be resolved during implementation by favoring the smallest persistent status presentation that still reads clearly on iPad-width viewports.

## Risk Analysis

### Risk: restoring persistent status reintroduces live-screen duplication

Mitigation:

- keep the restored state compact and shell-scoped
- avoid another large hero or duplicated prose block
- treat the persistent strip as orientation only, not a second live summary

### Risk: presenter simplification removes useful orientation from participant walkthrough

Mitigation:

- keep agenda title/time and other lightweight framing where it helps room comprehension
- remove only the repeated instructional body copy
- keep the dominant cue block unchanged as the primary room-facing instruction

### Risk: the new e2e assertion becomes brittle if copy changes

Mitigation:

- anchor the assertion to the presence/absence of the `handoff moment` heading or equivalent stable semantic target
- keep the proof focused on contextual visibility, not screenshot-only evidence

## Implementation Tasks

1. **Restore persistent facilitator runtime context**
- [x] Identify the minimal shared runtime signals that belong in the shell: current phase, participant-surface state, and team count.
- [x] Refactor the control-room header or summary strip so those signals are visible across all sections without recreating the old duplicated live summary stack.
- [x] Verify that the `live` section still keeps its reduced first-viewport hierarchy after the shell context is restored.
- [x] Update facilitator design docs if the final shell pattern becomes a recurring rule.

2. **Deduplicate participant walkthrough messaging**
- [x] Refactor `participant` presenter scenes so `scene.body` is not rendered both in the context panel and the dominant cue block.
- [x] Decide whether the context layer should become metadata-only or use alternate non-duplicative helper copy.
- [x] Update presenter tests so they assert one dominant instructional cue for participant walkthrough mode.
- [x] Confirm that attributed quotes, image blocks, and CTA links still compose correctly around the simplified participant walkthrough layout.

3. **Reinstate the missing contextual handoff proof**
- [x] Update the facilitator e2e flow so it returns to the `live` screen after moving past rotation.
- [x] Add an explicit assertion that the `handoff moment` card is absent once the runtime has advanced beyond that contextual window.
- [x] Keep the existing fallback-path assertion in `settings` so both contracts are covered: contextual on `live`, recoverable in `settings`.

4. **Close the slice with aligned verification**
- [x] Review any affected visual snapshots and refresh only if the intentional shell change alters the stable first viewport.
- [x] Re-run the dashboard checks relevant to the touched files.
- [x] Record any design-rule or testing-rule adjustments in the corresponding docs.

## Acceptance Criteria

- The facilitator shell shows current phase, participant-surface state, and team count in a compact persistent form on non-`live` sections such as `agenda`, `teams`, `signals`, `access`, and `settings`.
- Restoring that runtime context does not recreate the old duplicated `live` hero stack or push primary `live` controls out of the iPad first viewport again.
- Participant walkthrough scenes no longer repeat the same guidance body text in both the context panel and the dominant cue surface.
- Presenter participant walkthrough still reads as one clear room-facing instruction with supporting context, not as a duplicated or dashboard-like composition.
- End-to-end coverage explicitly proves that `handoff moment` appears when the rotation moment is current/next, disappears after the facilitator moves past it, and remains recoverable through the secondary `settings` control.

## References

- Reviewed facilitator page: [page.tsx](../../dashboard/app/admin/instances/[id]/page.tsx)
- Reviewed presenter page: [presenter/page.tsx](../../dashboard/app/admin/instances/[id]/presenter/page.tsx)
- Reviewed browser coverage: [dashboard.spec.ts](../../dashboard/e2e/dashboard.spec.ts)
- Surface and design rules:
  - [dashboard-surface-model.md](../dashboard-surface-model.md)
  - [facilitator-dashboard-design-rules.md](../facilitator-dashboard-design-rules.md)
  - [facilitator-control-room-design-system.md](../facilitator-control-room-design-system.md)
- Related prior plans:
  - [2026-04-08-fix-dashboard-design-system-audit-remediations-plan.md](2026-04-08-fix-dashboard-design-system-audit-remediations-plan.md)
  - [2026-04-08-fix-facilitator-live-and-presenter-visual-refinement-plan.md](2026-04-08-fix-facilitator-live-and-presenter-visual-refinement-plan.md)
  - [2026-04-08-fix-presenter-review-remediations-plan.md](2026-04-08-fix-presenter-review-remediations-plan.md)
