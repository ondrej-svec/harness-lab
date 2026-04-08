---
title: "fix: presenter review remediations"
type: plan
date: 2026-04-08
status: complete
confidence: high
---

# Presenter Review Remediations Plan

Fix the two correctness issues and one content constraint issue identified in review: participant walkthrough scenes must respect the selected presenter agenda context, scene mutation APIs must fail loudly instead of silently no-oping, and room-facing Czech copy must stop leaking English placeholders.

## Problem Statement

The presenter feature is implemented, but the review found three issues that affect trust in the facilitator workflow:

- `participant-view` scenes can show the wrong agenda context when the facilitator jumps to an earlier or different agenda item.
- the scene mutation API currently returns success even when the target agenda item or scene id does not exist.
- multiple projected/facilitator-facing labels in the Czech locale are still in English despite the repo’s content rules.

This matters because the feature’s core promise is operational reliability:

- the facilitator must be able to show something earlier without changing the live phase
- a coding agent must be able to configure scenes through the API without false success signals
- projected workshop content should match the repo’s Czech facilitation/content rules

## Proposed Solution

Make the remediation in four dependency-ordered slices:

1. fix presenter read-state selection so `participant-view` uses the selected presenter agenda item rather than the live runtime phase
2. harden shared scene mutation behavior so missing targets become explicit failures rather than silent no-ops
3. align room-facing Czech copy with the project language rules
4. expand tests to cover the exact failure cases that triggered the review findings

Keep the scope tight:

- no product redesign
- no new scene types
- no new editing UI
- no auth model changes

## Decision Rationale

### Why fix the presenter read model first

The presenter preview bug breaks the primary facilitator use case directly. It should be fixed before API cleanup because it affects what the room actually sees.

### Why harden the shared store/API instead of only patching the route

The user explicitly wants scene configuration to work through facilitator skills and coding-agent flows. That means the shared mutation layer is the trust boundary. If only the HTTP route validates existence while the shared store still silently no-ops, the next caller will reintroduce the same bug.

### Why treat Czech copy as part of the remediation instead of a later polish pass

This is not cosmetic drift. The repo rules explicitly require participant-facing and facilitation content in Czech, and the presenter surface is projected workshop content.

### Alternatives considered

#### Alternative 1: Leave `participant-view` as a live participant mirror

Rejected unless the product contract is rewritten explicitly. The current route shape and scene-selection model imply that jumping to another agenda item should change what the presenter page shows.

#### Alternative 2: Accept scene API no-ops and rely on clients to diff returned state

Rejected because agent-driven workflows need a crisp success/failure contract. Silent no-ops make automation unsafe.

#### Alternative 3: Defer Czech copy until a broader localization pass

Rejected because the newly added presenter strings are the introduced regression and can be corrected in the same remediation slice.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| `participant-view` is intended to follow the selected presenter agenda item, not always the live phase | Verified | Review finding and current presenter route/query shape imply manual scene jumps should change visible output |
| Shared scene mutations should report invalid target ids as failures | Verified | The feature was explicitly positioned as API-first for facilitator skills and coding agents |
| Czech presenter strings belong under the same content/language rules as other facilitation content | Verified | [`AGENTS.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/AGENTS.md) states all facilitation content must be in Czech |
| Existing presenter route and tests are the correct place to encode the selected-agenda behavior | Verified | [`dashboard/app/admin/instances/[id]/presenter/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/instances/[id]/presenter/page.tsx) already owns presenter rendering and has dedicated tests |
| The API should use a standard not-found style response for stale agenda/scene ids | Unverified | Current agenda route mostly uses `400` for malformed input but has no precedent yet for stale nested ids |

The one unverified assumption should be resolved during implementation by choosing and documenting one explicit failure contract, preferably `404` for unknown agenda item / scene ids and `400` only for malformed payloads.

## Risk Analysis

### Risk: fixing `participant-view` accidentally changes the intended live-mirror behavior

Mitigation:

- update tests to assert selected presenter agenda behavior explicitly
- keep the live-phase metric visible only where intentionally desired
- document the behavior in the presenter view model if needed

### Risk: API hardening breaks current callers that assume no-op success

Mitigation:

- audit the current admin and skill callers before changing the response contract
- return explicit error payloads with stable messages
- update facilitator skill docs to match the final failure semantics

### Risk: legacy stored state still bypasses the new invariants

Mitigation:

- reuse the existing state normalization seam in `workshop-store`
- add tests for stale ids and normalized legacy agenda data together, not separately

## Implementation Tasks

1. **Fix presenter agenda selection**
- [x] Refactor presenter page state so the selected presenter agenda item is passed into `ParticipantPreview`.
- [x] Change `ParticipantPreview` to derive current title, description, and next-step context from the selected presenter agenda item rather than from `status === "current"`.
- [x] Decide and document what “next up” means in this mode: next item relative to the selected agenda item, or hidden when the facilitator is off the live path.
- [x] Update presenter page tests to assert that `/presenter?agendaItem=talk&scene=talk-participant-view` shows talk-context content, not live-phase content.

2. **Harden scene mutation correctness**
- [x] Introduce explicit target validation in the shared scene mutation path so missing `agendaItemId` or `sceneId` is detectable before mutation.
- [x] Choose one clear failure contract for stale targets and apply it consistently across `update`, `move`, `set_default`, `set_enabled`, and `delete`.
- [x] Update the scenes API route to return failure status codes and `ok: false` payloads when targets do not exist.
- [x] Ensure successful mutations still return the updated agenda item so existing callers keep their positive-path ergonomics.

3. **Align Czech presenter copy**
- [x] Replace English presenter labels in the Czech locale with Czech equivalents.
- [x] Review the new presenter strings for consistency with the rest of the facilitator/admin vocabulary.
- [x] Verify that the English locale remains intact and unchanged in meaning.

4. **Lock the fixes with regression coverage**
- [x] Add unit or page-level coverage for selected-agenda participant walkthrough behavior.
- [x] Add route coverage for stale `agendaItemId` and stale `sceneId` requests.
- [x] Extend e2e assertions so the walkthrough path proves the selected agenda context is shown.
- [x] Re-run the dashboard verification set: `npm test`, `npm run lint`, `npm run build`, `npm run test:e2e -- e2e/dashboard.spec.ts`.

## Acceptance Criteria

- Opening `/admin/instances/:id/presenter?agendaItem=talk&scene=talk-participant-view` shows the talk scene’s agenda context rather than the live phase’s agenda context.
- A facilitator can jump to an earlier agenda item in presenter mode without the room-facing content silently reverting to the live current phase.
- Scene mutation requests with unknown `agendaItemId` or `sceneId` do not return `ok: true`.
- The scene API returns one explicit, documented failure contract for stale ids across all mutation actions.
- Czech presenter/admin strings no longer expose English placeholders such as `room screen`, `participant walkthrough`, `participant preview`, `scene`, or `control room`.
- Automated tests cover the selected-agenda walkthrough case and stale-id mutation failures.

## References

- Reviewed presenter route: [page.tsx](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/instances/[id]/presenter/page.tsx)
- Reviewed scene API route: [route.ts](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/api/workshop/instances/[id]/scenes/route.ts)
- Shared scene/store logic: [workshop-store.ts](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-store.ts)
- Existing presenter implementation plan: [2026-04-08-feat-facilitator-room-screen-and-presenter-flow-plan.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/plans/2026-04-08-feat-facilitator-room-screen-and-presenter-flow-plan.md)
- Related agenda/runtime plan: [2026-04-07-feat-instance-lifecycle-and-instance-local-agenda-authoring-plan.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/plans/2026-04-07-feat-instance-lifecycle-and-instance-local-agenda-authoring-plan.md)
