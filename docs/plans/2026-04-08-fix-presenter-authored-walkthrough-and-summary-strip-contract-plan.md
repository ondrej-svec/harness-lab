---
title: "fix: presenter authored walkthrough and summary-strip contract"
type: plan
date: 2026-04-08
status: complete
confidence: high
---

# Presenter Authored Walkthrough And Summary-strip Contract Plan

Address the two remaining review findings from the latest facilitator/presenter follow-up slice: make participant walkthrough simplification apply to authored presenter scenes instead of only fallback rendering, and bring the facilitator summary strip back into alignment with the documented instance-identity contract.

## Problem Statement

The latest refinement slice closed most of the UX/DX review findings, but two contract gaps remain:

- participant walkthrough simplification currently applies only to generated fallback scenes, while the authored blueprint scenes still render a long-form `hero` block plus a `participant-preview` cue block, leaving the projected surface more repetitive than intended
- the facilitator summary strip now omits instance identity even though the documented control-room rule says the persistent strip must keep instance identity, live phase, participant-surface state, and team count visible

These are not cosmetic loose ends:

- the presenter route still risks projecting two competing instructional narratives for the same participant moment
- the facilitator shell and the documented design rules now disagree about what the top summary strip is responsible for

If this stays unresolved, the next refinement pass will be working against unstable surface contracts again.

## Proposed Solution

Make one narrow follow-up pass in three slices:

1. align participant walkthrough rendering with the intended cue-first contract for authored scenes, not only fallback-generated scenes
2. restore instance identity to the persistent facilitator summary strip while preserving the slimmer live-screen IA
3. strengthen tests so both contracts are protected at the renderer and surface levels

Keep the scope intentionally narrow:

- no new presenter block types
- no redesign of the facilitator shell
- no reopening of the broader live-screen or presenter architecture work
- no changes to participant/public routes

## Plan Level

This is a **standard** plan because the scope is clear and bounded, but the renderer/content-model interaction and the design-doc/code mismatch both need explicit reasoning so the next implementation does not solve only the current fixtures again.

## Decision Rationale

### Why fix authored participant scenes instead of only tightening fallback behavior further

The current product behavior is driven by authored agenda scenes in `workshop-blueprint-agenda.json`, not only by fallback block generation. A fix that only simplifies fallback output is too weak because it leaves the real shipped scenes free to repeat the same instructional story in multiple blocks.

The correction therefore needs one explicit authored-scene contract:

- participant walkthrough gets one dominant cue
- surrounding context may orient the room, but it must not restate the same instruction in another long-form block

### Why restore instance identity to the summary strip instead of weakening the design rule

The new shell already shows event identity elsewhere, but the current rule explicitly says instance identity is part of the persistent strip. Since the strip is meant to be the compact shared orientation layer across all sections, the cleaner correction is to bring the strip back into contract rather than redefining the rule downward after implementation.

### Why pair renderer changes with stronger tests

The last slice technically “fixed” duplication in one code path, but the review showed that the real authored scenes still escaped that contract. The follow-up needs tests that prove authored participant walkthrough scenes render one dominant instructional cue and that the facilitator strip includes all four required signals.

### Alternatives considered

#### Alternative 1: Leave authored scene content alone and rewrite the review/test expectations

Rejected because the current authored blueprint clearly contains both a descriptive `hero` body and a second `participant-preview` body. Reframing the tests would only hide the mismatch.

#### Alternative 2: Remove `participant-preview` blocks entirely from authored scenes

Rejected because the preview block still serves a useful cue-first role. The problem is duplication, not the existence of the block type.

#### Alternative 3: Update the design rule to say instance identity may live elsewhere in the shell

Rejected because that weakens a documented contract to match an accidental regression instead of restoring a consistent control-room model.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Authored participant walkthrough scenes are the primary product path and must be the contract of record | Verified | The blueprint defines participant-view scenes with explicit `hero` and `participant-preview` blocks in [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json) |
| The intended presenter rule is one dominant room-facing cue, not two long-form guidance blocks | Verified | [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md) says participant walkthrough should stay cue-first |
| The current implementation only simplifies fallback participant-view rendering, not authored block rendering | Verified | [`dashboard/app/admin/instances/[id]/presenter/page.tsx`](../../dashboard/app/admin/instances/[id]/presenter/page.tsx) changes `buildFallbackBlocks()` but still renders authored `hero` and `participant-preview` blocks unchanged |
| The facilitator summary strip is still supposed to include instance identity | Verified | [`docs/facilitator-dashboard-design-rules.md`](../facilitator-dashboard-design-rules.md) explicitly says instance identity plus live phase, participant-surface state, and team count stay visible in the strip |
| Restoring instance identity to the strip can be done without rebuilding the older duplicated live-summary wall | Verified | The current review issue is about one missing summary signal, not a request to restore the removed compact row inside the `live` canvas |
| A single renderer rule for participant-view authored blocks can cover all current blueprint scenes without needing new block types | Unverified | The blueprint currently repeats the pattern consistently, but implementation should confirm no authored participant scene depends on both long-form bodies remaining visible |

The one unverified assumption should be resolved during implementation by auditing all authored `participant-view` scenes and encoding the simplification in a renderer rule or content normalization step that preserves the intended room-facing meaning.

## Risk Analysis

### Risk: fixing authored participant scenes removes context that some walkthroughs rely on

Mitigation:

- audit all authored `participant-view` scenes before choosing the final renderer rule
- preserve title, agenda context, and short framing where it helps room comprehension
- remove duplication, not orientation

### Risk: restoring instance identity to the summary strip reintroduces header crowding on iPad

Mitigation:

- keep the strip compact and information-dense rather than adding another hero or prose panel
- prefer short labels and one-line values/hints
- verify the iPad control-room screenshot after the strip change

### Risk: tests still prove only one fixture and miss the authored-scene pattern globally

Mitigation:

- add assertions against more than one authored participant walkthrough scene or against the renderer behavior itself
- keep at least one end-to-end projection-path assertion so the rendered page, not just the block data, is covered

## Implementation Tasks

1. **Align authored participant walkthrough rendering**
- [x] Audit the authored `participant-view` scenes in the blueprint/runtime model to confirm the repeated `hero` + `participant-preview` duplication pattern.
- [x] Choose one explicit renderer/content rule for authored participant scenes so there is one dominant cue and no second competing long-form instruction.
- [x] Implement that rule in the presenter renderer or the authored-scene normalization path without introducing new block types.
- [x] Verify that attributed quotes, image blocks, CTA links, and non-participant presenter scenes remain unaffected.

2. **Restore full summary-strip contract**
- [x] Add instance identity back to the facilitator persistent summary strip in a compact form that matches the documented rule.
- [x] Verify that the `live` canvas still avoids the removed duplicated compact snapshot row.
- [x] Reconcile any labels/hints so the strip clearly distinguishes instance identity from current phase and participant-surface state.

3. **Harden verification**
- [x] Update presenter tests so they prove the authored participant walkthrough contract rather than only one repeated sentence count in one fixture.
- [x] Update facilitator page tests so they assert instance identity appears in the persistent summary strip alongside current phase, participant-surface state, and team count.
- [x] Refresh any affected iPad visual baseline only if the intentional summary-strip change alters the stable shell.
- [x] Re-run the relevant dashboard verification set for the touched surface.

## Acceptance Criteria

- Authored participant walkthrough scenes no longer render two competing long-form guidance blocks for the same room moment.
- The presenter route still shows one dominant cue plus lightweight context for participant walkthrough scenes.
- The facilitator persistent summary strip includes instance identity, live phase, participant-surface state, and team count in a compact shared shell layer.
- Restoring instance identity does not recreate the removed duplicated live-summary row inside the `live` canvas.
- Tests protect both contracts: authored participant walkthrough simplification and the full summary-strip signal set.

## References

- Reviewed presenter renderer: [page.tsx](../../dashboard/app/admin/instances/[id]/presenter/page.tsx)
- Reviewed facilitator page: [page.tsx](../../dashboard/app/admin/instances/[id]/page.tsx)
- Summary-strip view model: [admin-page-view-model.ts](../../dashboard/lib/admin-page-view-model.ts)
- Authored participant walkthrough scenes:
  - [workshop-blueprint-agenda.json](../../dashboard/lib/workshop-blueprint-agenda.json)
- Surface/design rules:
  - [dashboard-surface-model.md](../dashboard-surface-model.md)
  - [facilitator-dashboard-design-rules.md](../facilitator-dashboard-design-rules.md)
  - [facilitator-control-room-design-system.md](../facilitator-control-room-design-system.md)
- Related prior plans:
  - [2026-04-08-fix-facilitator-runtime-context-and-presenter-follow-up-plan.md](2026-04-08-fix-facilitator-runtime-context-and-presenter-follow-up-plan.md)
  - [2026-04-08-fix-facilitator-live-and-presenter-visual-refinement-plan.md](2026-04-08-fix-facilitator-live-and-presenter-visual-refinement-plan.md)
  - [2026-04-08-fix-presenter-review-remediations-plan.md](2026-04-08-fix-presenter-review-remediations-plan.md)
