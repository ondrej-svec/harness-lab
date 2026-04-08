---
title: "fix: dashboard design-system audit remediations"
type: plan
date: 2026-04-08
status: in_progress
confidence: medium
---

# Dashboard Design-System Audit Remediations Plan

Remediate the cross-surface issues found in the dashboard audit so the homepage, participant room, facilitator workspace/control room, and presenter surface all match the current design-system and trust-boundary rules.

## Problem Statement

The dashboard redesign materially improved the overall UX, but the audit found five issues that still cut across the product:

- the presenter surface still exposes facilitator chrome and control affordances in a room-facing context
- authored guidance supports links and CTAs in the content model, but the participant and presenter surfaces render them as inert text
- the participant room still leaks facilitator navigation after room access is redeemed
- destructive workspace actions are still one-step and under-signaled relative to the control-room safety rules
- the control-room agenda/editor surfaces still leak raw English/internal wording inside a Czech-first facilitator experience
- the facilitator `live` screen still mixes too many unrelated jobs: live moment reading, phase movement, continuation reveal, rotation context, presenter launch, safety actions, and blueprint references all compete on the same default canvas
- the current facilitator experience still reads too desktop-first even though the real operating context is likely walking around with an iPad or phone, then projecting the same flow into a room-facing screen
- presenter content requirements are richer than the current polish plan captures: room-safe scenes should support attributed quotes and image-backed blocks sourced from internal materials, not only plain text cards

The audit also found a verification gap:

- browser regression is green, but `npm test` is red in facilitator auth/session coverage, which weakens the repo’s stated trust boundary for future dashboard work

This matters because the design system is not only visual polish. It is also the operating model:

- presenter must be room-safe
- participant guidance must be actionable
- facilitator mutations must be explicit and safe
- the live screen must privilege the one action that matters now instead of behaving like a general-purpose control dump
- facilitator control must feel native on iPad-class and phone-class devices, not like a compressed desktop console
- projection flow must stay smooth when the facilitator uses the same device flow and shares it to a bigger room screen
- copy must feel like one product
- verification must be credible before further UI work lands

## Proposed Solution

Make the remediation in five dependency-ordered slices:

1. restore the dashboard unit-test baseline so implementation work can proceed behind a trustworthy local signal
2. repair the participant/presenter content affordance gap so authored links and CTAs become interactive, visible next steps
3. refactor the facilitator `live` screen into an iPad-first “run this moment” surface with contextual control grouping
4. strip facilitator chrome from the presenter surface, keep room-facing rendering projection-safe by default, and tighten the shared presenter-content block contract
5. tighten participant/facilitator boundary cues, destructive-action safety, copy, and regression/docs follow-through

Keep the scope focused:

- no new dashboard product areas
- no redesign of the auth model
- no new presenter authoring system
- no reopening of the blueprint/runtime ownership model

## Detailed Plan Level

This is a **detailed** plan because it crosses all major dashboard surfaces, touches trust boundaries as well as UI, and depends on both browser regression and lower-level facilitator-auth coverage being credible again.

## Decision Rationale

### Why restore the unit-test baseline first

The audit found current browser coverage is green, but the repo’s lower trust boundary is already red. If implementation starts on top of that, every follow-on change loses fast confidence in facilitator auth/session behavior.

### Why treat content affordances as a design-system remediation instead of content cleanup

The content model already encodes links and CTAs. The gap is in rendering. That makes this a product-system defect, not an authoring issue.

### Why separate presenter purity from general facilitator cleanup

The presenter surface has the strongest trust-boundary problem: it is a room-facing page still carrying admin navigation and control chrome. That should be fixed as a dedicated slice so the room-safe contract becomes explicit.

### Why the facilitator problem is mainly page IA, not only the shared design system

The shared visual system is directionally fine: the screenshots already look calmer and more coherent than the earlier dashboard. The failure is that the `live` section still applies the design system too loosely. It lacks a stricter surface contract for what the default canvas is allowed to contain.

That means the remediation should do two things:

- fix the specific page IA in the control room
- sharpen the control-room design rules so the same overloading pattern does not return later

### Why the facilitator surface should be optimized for iPad-class devices first

The real facilitator job is mobile-in-room, not desk-bound administration. The facilitator is likely moving, checking status on an iPad or phone, and occasionally projecting the same flow into the room. That means the primary ergonomics should be:

- single-column or low-complexity two-zone reading
- touch-first control density
- obvious section switching
- projection-safe launch from the same device flow

Large desktop layouts still matter, but they should be responsive expansions of that operating model, not the source of truth.

### Why presenter content requirements belong in this remediation plan

The workshop needs richer room-safe scenes than plain text cards alone. Attributed quotes and image-backed blocks sourced from internal materials are part of the presenter experience, not a separate future content system.

That means the plan should ensure:

- quotes always carry visible attribution
- images can be used intentionally in presenter scenes
- those assets remain tied to internal/source references rather than becoming untraceable decoration

### Why keep destructive-action safety in the same remediation pass

The workspace already treats instances as operational event records. One-click removal inside the event card works against the new safety hierarchy and should be corrected while the facilitator control model is still fresh.

### Alternatives considered

#### Alternative 1: Fix only the presenter surface and leave the other audit findings for later

Rejected because the most obvious presenter issue is only one part of the same system drift. The participant/content affordance gap and control-room wording drift would still leave the product internally inconsistent.

#### Alternative 2: Roll the audit findings into a broader “dashboard polish” pass

Rejected because the remaining issues are specific enough to plan directly. A broad polish pass would weaken prioritization and make verification less concrete.

#### Alternative 3: Ignore the red unit suite because browser tests currently pass

Rejected because the repo doctrine explicitly treats executable verification as the trust boundary. Green E2E plus red unit tests is not a stable enough base for more dashboard work.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The presenter page should be room-facing by default, not an admin-style control surface | Verified | [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md) and [`docs/dashboard-design-system.md`](../dashboard-design-system.md) both define presenter as projection-safe and free of facilitator controls by default |
| `link-list` items and scene-level CTA fields are intended to be actionable in the UI | Verified | [`dashboard/lib/workshop-data.ts`](../../dashboard/lib/workshop-data.ts) models `href` and `ctaHref`, but the participant and presenter renderers currently do not use them |
| The participant surface should remove facilitator-only concepts after room access is redeemed | Verified | [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md) says facilitator-only controls/concepts should be removed from participant views |
| Instance removal should use a confirmation step rather than a one-click inline action | Verified | [`docs/facilitator-control-room-design-system.md`](../facilitator-control-room-design-system.md) says destructive intent belongs in explicit confirmation, not routine canvas flow |
| The current English/raw labels in agenda editing are unintentional design drift rather than a product decision | Verified | Repo language rules in [`AGENTS.md`](../../AGENTS.md) and current `adminCopy` centralization in [`dashboard/lib/ui-language.ts`](../../dashboard/lib/ui-language.ts) point to copy-system consistency as the expected model |
| Fixing the current red unit suite is necessary before treating later UI changes as fully verified | Verified | [`docs/dashboard-testing-strategy.md`](../dashboard-testing-strategy.md) treats executable checks as the default trust boundary for participant, facilitator, auth, and state-transition work |
| Continuation reveal belongs closer to the agenda transition / rotation moment than to a permanent standalone control card | Verified | The current live-screen friction comes from treating it as a global always-visible control instead of a moment-specific runtime transition |
| The facilitator’s primary operating device is more likely to be an iPad or phone than a large desktop monitor during the workshop day | Verified | User operating context for live facilitation in-room is mobile/walking-first and should drive the default UX priorities |
| Presenter content should support attributed quotes and image-backed scenes from internal materials without inventing a separate slide system | Verified | User requirement for richer room-facing content aligns with the existing presenter block model and internal-source workflow |
| The presenter route may still need a facilitator-scoped launch or utility path somewhere, even after room-facing chrome is removed | Unverified | The audit confirms the current default page is too admin-heavy, but the exact minimal facilitator utility affordances for presenter mode still need implementation-level validation |

The one unverified assumption should be resolved during implementation by deciding whether presenter utilities belong behind query-param toggles, a launch shell, or only inside the control room before opening the room-facing page.

## Risk Analysis

### Risk: removing presenter chrome also removes facilitator-useful context that is still needed during launch

Mitigation:

- keep launch and scene selection in the control room
- preserve only room-safe agenda framing on the presenter page
- if utility affordances are still needed, make them explicitly secondary and facilitator-scoped rather than default room chrome

### Risk: an iPad-first refactor makes the desktop control room feel underpowered

Mitigation:

- treat desktop as an expansion of the iPad operating model, not as a different product
- allow wider layouts only when they clarify the same primary reading/action flow
- keep the acceptance criteria centered on device-class coherence rather than maximum desktop density

### Risk: making links/CTAs interactive exposes unsafe or inconsistent destinations in authored content

Mitigation:

- define allowed rendering behavior for internal anchors, repo links, and external links
- add tests for rendered affordances rather than trusting the data shape alone
- keep unsafe or missing URLs visibly non-interactive instead of silently pretending everything is clickable

### Risk: richer presenter blocks become decorative instead of operational

Mitigation:

- require quote attribution whenever a quote block is shown
- tie presenter images to source references or internal materials rather than ad hoc uploads with no provenance
- preserve the “what should the room see now?” rule so media blocks support the current moment instead of bloating it

### Risk: adding confirmation for workspace removal slows legitimate facilitator workflows too much

Mitigation:

- use a lightweight confirmation dialog, not a full authoring sheet
- keep archive context visible in the confirmation copy
- ensure the primary workflow remains entering and operating an instance, not removal

### Risk: making continuation agenda-linked hides a control the facilitator still needs quickly

Mitigation:

- keep the continuation state visible in the live summary, but move the mutation affordance into the relevant agenda/run-moment context
- if a global override is still required, place it in a secondary runtime panel rather than the primary `live` stack
- cover both “during the handoff moment” and “outside the handoff moment” behavior in tests

### Risk: copy cleanup turns into a broad localization sweep

Mitigation:

- limit this pass to strings surfaced by the audited dashboard paths
- move recurring labels into `ui-language.ts`
- treat non-dashboard copy drift as out of scope unless it blocks one of these surfaces

### Risk: the red unit-suite failures are partly due to test drift rather than product behavior

Mitigation:

- first determine whether each failure reflects a legitimate product contract change or stale mocks/setup
- update tests only when the current implementation is intentionally correct
- if implementation is wrong, fix production behavior before re-baselining the tests

## Phased Implementation

### Phase 1: Restore verification baseline

Goal: make the dashboard unit suite trustworthy again before remediation work starts landing.

Tasks:

- [x] Triage the current `npm test` failures in facilitator access, facilitator auth bootstrap, and facilitator session handling.
- [x] Decide which failures are stale test expectations versus current product regressions.
- [x] Fix production behavior or tests so the dashboard unit suite is green again.
- [x] Document any changed facilitator-auth contract in the same slice if the implementation behavior is intentionally different now.

Exit criteria:

- `cd dashboard && npm test` passes
- facilitator auth/session expectations are explicit rather than implicitly drifting

### Phase 2: Repair participant and presenter content affordances

Goal: make authored room guidance interactive where the content model already declares it should be.

Tasks:

- [x] Implement `href` rendering for `link-list` blocks on the participant surface.
- [x] Implement `href` rendering for `link-list` blocks on the presenter surface.
- [x] Render scene-level `ctaLabel` + `ctaHref` as an actual link/button when both are present.
- [x] Define fallback rendering for missing or null `href` values so non-clickable items remain legible but not misleading.
- [x] Decide how attributed quotes and image-backed presenter blocks should render so they remain source-aware and room-safe.
- [x] Add focused tests for actionable link-list items and CTA rendering on both surfaces.

Exit criteria:

- authored actionable guidance is rendered as actionable guidance
- links clearly read as links on participant and presenter surfaces

### Phase 3: Refactor the facilitator live screen into an iPad-first operating surface

Goal: make the default control-room canvas answer “what is live, what happens next, and what should I do now?” on iPad-class and phone-class devices without mixing in unrelated authoring or safety concerns.

Tasks:

- [x] Define the default `live` canvas contract explicitly in the control-room design doc.
- [x] Reframe facilitator device priorities in the design docs: iPad first, phone acceptable, desktop expansive but secondary.
- [x] Reduce the `live` screen to one primary operating narrative: current moment, next transition, room signal, and the single most relevant runtime action.
- [x] Remove safety actions such as archive/reset and blueprint-edit references from the default `live` screen and place them under `settings` or another explicitly secondary surface.
- [x] Re-evaluate presenter launch placement so it appears as a contextual room action, not as one more permanent control card competing with phase control.
- [x] Rework continuation handling so its mutation control is agenda-linked or handoff-moment-linked instead of living forever as a generic standalone card.
- [x] Decide how rotation and continuation should be presented together: as one run-moment card, one agenda-linked operation panel, or another tightly scoped pattern.
- [x] Update browser tests and screenshots so the live screen is protected against drifting back into a multi-purpose control wall on iPad, phone, and desktop breakpoints.

Exit criteria:

- the `live` screen privileges one operating story instead of many unrelated blocks
- safety and low-frequency actions are no longer part of the default live canvas
- continuation control is contextual to the relevant workshop moment
- the primary facilitator flow feels native on iPad without needing a large desktop mental model

### Phase 4: Make presenter default rendering room-safe

Goal: align the presenter page with the room-facing trust boundary.

Tasks:

- [x] Remove facilitator back-link header chrome from the default presenter canvas.
- [x] Remove agenda-rail and scene-switcher controls from the room-facing default presenter rendering.
- [x] Keep only projection-safe agenda framing and selected-scene content in the default presenter output.
- [x] Decide where facilitator scene-switching utilities live after the cleanup: control room only, or an explicitly facilitator-scoped presenter utility mode.
- [x] Define presenter-scene content rules for attributed quote blocks and image-backed blocks sourced from internal references.
- [x] Ensure quote blocks always show attribution clearly and remain legible when projected.
- [x] Ensure image blocks work cleanly on iPad-driven projection and do not depend on desktop-only layout assumptions.
- [x] Update presenter tests and e2e coverage so room-facing rendering no longer depends on admin chrome being present.

Exit criteria:

- the presenter page answers “what should the room see now?” without exposing facilitator controls
- facilitators still retain a clear launch/switch flow from the control room
- attributed quotes and images are first-class room-safe content patterns rather than ad hoc exceptions

### Phase 5: Tighten participant/facilitator boundaries, copy, coverage, and docs

Goal: finish the remaining cross-surface contract fixes in participant and facilitator flows.

Tasks:

- [x] Remove facilitator-login navigation from the unlocked participant room header.
- [x] Re-check participant first-screen hierarchy after that change so `now`, `next`, and room notes remain primary.
- [x] Replace one-click workspace instance removal with an explicit confirmation overlay/dialog.
- [x] Update removal copy so it explains archive behavior and consequence clearly.
- [x] Ensure destructive controls remain visible but clearly secondary to “enter control room”.
- [x] Move remaining raw English/internal labels in the agenda/editor flow into the shared copy system.
- [x] Align Czech wording in agenda detail, agenda sheet forms, and presenter-scene summaries with the established facilitator vocabulary.
- [x] Extend page/unit/e2e coverage for the newly remediated live-screen IA, presenter, participant, and destructive-action paths across iPad, phone, and desktop breakpoints where the workflow meaningfully changes.
- [x] Update the relevant design docs if the remediation introduces recurring patterns for iPad-first facilitator canvases, room-safe presenter pages, contextual continuation controls, attributed quotes, image-backed scenes, or destructive-action confirmation in facilitator workspace flows.

Exit criteria:

- the audited surfaces share one copy system and one interaction language
- regression coverage exists for the newly fixed behavior
- docs match the implemented patterns

## Implementation Tasks

1. **Re-baseline verification**
- [x] Make `cd dashboard && npm test` green again before landing UI remediation work.
- [x] Capture whether each fixed failure represented stale test coverage or a real product regression.

2. **Restore actionable room guidance**
- [x] Render `link-list` items as links on participant and presenter surfaces.
- [x] Render scene CTAs with actual navigation behavior when `ctaHref` is present.
- [x] Define and test attributed quote and image-backed presenter rendering rules.
- [x] Add focused tests for actionable guidance rendering.

3. **Refactor the live screen IA**
- [x] Shrink the default `live` surface to current moment, next moment, room signal, and one relevant action group.
- [x] Move archive/reset/blueprint actions out of `live`.
- [x] Make continuation a contextual runtime action tied to the handoff/rotation moment rather than a permanent generic card.
- [x] Make the primary facilitator flow feel native on iPad and acceptable on phone before optimizing large desktop expansion.

4. **Make presenter room-facing by default**
- [x] Remove facilitator chrome from the default presenter page.
- [x] Keep facilitator launch/switch controls in the control room or another explicitly facilitator-scoped path.
- [x] Support attributed quotes and internal-reference images as projection-safe presenter content patterns.
- [x] Update presenter tests and browser expectations accordingly.

5. **Tighten participant/facilitator safety boundaries**
- [x] Remove facilitator entry links from unlocked participant mode.
- [x] Add explicit confirmation for workspace instance removal.
- [x] Verify the updated action hierarchy still keeps routine facilitator work fast.

6. **Unify copy and regression protection**
- [x] Move remaining agenda/editor wording into `ui-language.ts`.
- [x] Add/adjust unit, page, and Playwright checks for the remediated behavior.
- [x] Update the design-system docs where recurring patterns changed.

## Acceptance Criteria

- `cd dashboard && npm test`, `npm run lint`, `npm run build`, and `npm run test:e2e` all pass after the remediation work.
- The facilitator `live` screen no longer acts as a generic control dump; it presents one clear operating narrative with only runtime-critical actions on the default canvas.
- The facilitator control room is optimized primarily for iPad-class use, remains workable on phone, and expands coherently to larger desktop viewports without changing the core operating model.
- Archive/reset and blueprint-edit actions no longer live on the default `live` screen.
- Continuation reveal is handled as a contextual handoff/rotation operation rather than as a permanent standalone control card.
- The default presenter page no longer shows facilitator navigation, workspace back-links, or scene-selection chrome in the room-facing output.
- `link-list` blocks on participant and presenter surfaces render clickable links when `href` is provided.
- Scene-level CTA content renders as an actual navigational affordance when `ctaHref` is present.
- Presenter quote blocks always display visible attribution.
- Presenter image-backed blocks render cleanly when launched from iPad-class facilitator flows and shown on projected screens.
- The unlocked participant room no longer shows facilitator login/navigation inside participant mode.
- Removing a workshop instance requires an explicit confirmation step and communicates archive consequences clearly.
- Agenda/editor/dashboard wording on the audited flows no longer leaks raw English/internal labels into the Czech facilitator experience.
- Relevant design docs and regression tests reflect the final interaction patterns.

## References

- Shared system rules: [dashboard-design-system.md](../dashboard-design-system.md)
- Surface responsibilities: [dashboard-surface-model.md](../dashboard-surface-model.md)
- Participant/public rules: [public-and-participant-design-rules.md](../public-and-participant-design-rules.md)
- Facilitator rules: [facilitator-dashboard-design-rules.md](../facilitator-dashboard-design-rules.md)
- Control-room interaction rules: [facilitator-control-room-design-system.md](../facilitator-control-room-design-system.md)
- Recent facilitator IA refactor: [2026-04-07-feat-facilitator-cockpit-ia-and-ux-redesign-plan.md](2026-04-07-feat-facilitator-cockpit-ia-and-ux-redesign-plan.md)
- Recent workshop-surface refinement: [2026-04-08-feat-workshop-surface-refinement-plan.md](2026-04-08-feat-workshop-surface-refinement-plan.md)
- Related presenter remediation slice already completed: [2026-04-08-fix-presenter-review-remediations-plan.md](2026-04-08-fix-presenter-review-remediations-plan.md)
- Participant surface implementation: [page.tsx](../../dashboard/app/page.tsx)
- Facilitator workspace implementation: [page.tsx](../../dashboard/app/admin/page.tsx)
- Facilitator control room implementation: [page.tsx](../../dashboard/app/admin/instances/[id]/page.tsx)
- Presenter surface implementation: [page.tsx](../../dashboard/app/admin/instances/[id]/presenter/page.tsx)
