---
title: "fix: decouple facilitator login bootstrap from instance context"
type: plan
date: 2026-04-08
status: in_progress
brainstorm: null
confidence: medium
---

# Facilitator Login Bootstrap Decoupling Plan

Separate facilitator identity bootstrap from instance-scoped authorization so `harness auth login` can succeed without requiring `HARNESS_WORKSHOP_INSTANCE_ID` to already exist as a runtime record.

## Problem Statement

The current facilitator device login flow is coupled too early to the active workshop instance:

- `startDeviceAuthorization()` immediately binds device auth records to `getCurrentWorkshopInstanceId()`
- that instance id currently comes from `HARNESS_WORKSHOP_INSTANCE_ID`
- in Neon mode, `facilitator_device_auth.instance_id` has a foreign key to `workshop_instances(id)`
- if the configured instance row does not exist yet, facilitator login fails before identity is established

This is the wrong trust boundary. The repo’s documented model is:

- facilitator identity is global
- facilitator authorization is per instance grant

Today’s implementation collapses those concerns into one bootstrap step. The result is operationally brittle:

- auth fails because workshop data is missing
- a facilitator cannot log in to inspect or repair instance state
- first-use and deployment bootstrap are harder than they need to be
- the CLI login path depends on runtime instance seeding instead of identity availability

## Proposed Solution

Refactor facilitator auth and command targeting into three explicit layers:

1. **Platform authentication**
   - `harness auth login` creates a global facilitator device authorization and a global CLI session
   - no pre-existing workshop instance row is required
   - audit entries for login bootstrap may have `instanceId: null`
   - successful login means only: the facilitator is authenticated to the platform

2. **Workshop selection**
   - workshop operations resolve a target instance explicitly or from a default-selection rule
   - preferred resolution order:
     1. explicit command argument such as `--instance-id`
     2. route parameter or selected control-room instance in the dashboard
     3. deployment default such as `HARNESS_WORKSHOP_INSTANCE_ID`
     4. repository-backed fallback such as `getDefaultInstanceId()` only where that behavior is explicitly intended
   - selection failure should produce a clear “no target workshop selected” or “instance not found” error

3. **Workshop authorization**
   - grant lookup and first-user owner bootstrap happen only when a command or page targets a concrete instance
   - successful auth does not imply access to any particular workshop
   - missing grant blocks the operation, not login itself

The compatibility rule should be:

- keep `HARNESS_WORKSHOP_INSTANCE_ID` only as a deployment default or operation fallback
- remove it as a hard prerequisite for facilitator login bootstrap
- preserve instance-scoped grants and owner/operator/observer semantics
- make workshop targeting explicit in the CLI and legible in the dashboard workspace/control-room model

## Detailed Plan Level

This is a **detailed** plan because it changes a high-risk boundary: auth bootstrap, CLI session semantics, authorization guards, schema assumptions, and the documented facilitator control model.

## Decision Rationale

### Why decouple login from instance state

- identity and authorization are different concerns
- facilitators should be able to authenticate even when workshop runtime state is missing, misconfigured, or being repaired
- the current coupling produces a circular bootstrap dependency: login requires an instance, but instance repair may require login

### Why introduce workshop selection as its own layer

- the current code treats “current instance context” as too global
- facilitators may legitimately have access to many workshops
- a selected workshop is user or command context, not identity
- making selection explicit clarifies failure modes:
  - not logged in
  - logged in but no workshop selected
  - workshop selected but no grant
  - workshop selected but instance does not exist

### Why keep instance grants instance-scoped

- the workshop model intentionally allows one facilitator identity to have different access on different workshop instances
- owner auto-bootstrap and grant management remain meaningful only at the instance boundary
- the bug is not that authorization is instance-scoped; the bug is that login bootstrap is

### Why demote `HARNESS_WORKSHOP_INSTANCE_ID` to a default instead of removing it entirely

- deployments and focused workshop control rooms still benefit from a sensible default instance
- the admin workspace already has the concept of many instances plus a chosen control room
- the repo already has `getDefaultInstanceId()` and instance-listing seams, so the model can evolve without inventing an entirely new surface
- the problem is overloading the env var as an auth key, not using it as a default selector

### Why not fix this by auto-creating the configured instance during login

Rejected because it keeps the wrong boundary and turns login into a hidden mutation path over workshop state. Authentication should not silently create workshop runtime records.

### Why not only loosen the foreign key or make `instance_id` nullable without changing the flow

Rejected as an incomplete patch. It would mask the immediate failure but still leave login behavior conceptually instance-bound and would keep grant checks and approval semantics in the wrong phase.

### Why keep command-time default instance resolution

- current CLI and dashboard code already rely on `HARNESS_WORKSHOP_INSTANCE_ID` as a convenient default
- preserving that behavior avoids forcing explicit `--instance-id` everywhere in the first fix slice
- the important change is moving instance resolution out of login bootstrap, not removing defaults entirely

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Facilitator identity should be global while authorization remains per instance | Verified | [`docs/workshop-instance-runbook.md`](../workshop-instance-runbook.md) states “facilitator identity is global, but authorization remains per instance grant”; [`docs/adr/2026-04-06-facilitator-identity-simplification.md`](../adr/2026-04-06-facilitator-identity-simplification.md) adopts Neon Auth as the single identity source |
| `HARNESS_WORKSHOP_INSTANCE_ID` is currently a default instance selector, not a fundamental identity key | Verified | [`dashboard/lib/instance-context.ts`](../../dashboard/lib/instance-context.ts) resolves the current instance from env or seed state |
| Current login failure is caused by login bootstrap depending on a valid workshop instance row | Verified | `startDeviceAuthorization()` writes `facilitator_device_auth.instance_id` from `getCurrentWorkshopInstanceId()` in [`dashboard/lib/facilitator-cli-auth-repository.ts`](../../dashboard/lib/facilitator-cli-auth-repository.ts) |
| Existing CLI and dashboard operation guards can be refactored to accept a resolved target instance at command time | Verified | [`dashboard/lib/facilitator-access.ts`](../../dashboard/lib/facilitator-access.ts) and [`dashboard/lib/facilitator-session.ts`](../../dashboard/lib/facilitator-session.ts) already take `instanceId` as a parameter with a default |
| The repo already has enough primitives to support explicit workshop selection without a full redesign | Verified | [`dashboard/app/api/workshop/instances/route.ts`](../../dashboard/app/api/workshop/instances/route.ts) lists instances and [`dashboard/lib/workshop-instance-repository.ts`](../../dashboard/lib/workshop-instance-repository.ts) exposes `getDefaultInstanceId()` |
| Login/bootstrap audit events can safely exist without an instance id | Unverified | Current audit helpers assume `instanceId: string`; schema and downstream reporting expectations need review |
| First-user owner bootstrap can move from device approval time to first instance-targeted operation without confusing facilitators | Unverified | Current auto-grant behavior is documented, but the user-facing implications of moving that moment need confirmation in CLI/UI copy |
| Existing persisted CLI sessions can be invalidated or migrated without unacceptable operator friction | Unverified | Session storage is local and short-lived, but migration behavior has not yet been exercised |
| CLI users can tolerate a more explicit targeting model for multi-workshop operations | Unverified | Current commands lean on implicit context and have not yet been exercised with a platform-style “select or pass instance” workflow |

Unverified assumptions should become explicit implementation tasks and test cases rather than hidden guesses.

## Risk Analysis

### Risk: Login succeeds but subsequent commands fail in less obvious ways

If login becomes global but operation-time instance selection and authz errors are vague, facilitators may trade one confusing failure for another.

Mitigation:

- add explicit error shapes for:
  - no workshop selected
  - missing target instance
  - missing instance grant
  - invalid default instance context
- make CLI output distinguish clearly between auth success and operation authorization failure

### Risk: The plan fixes auth bootstrap but leaves instance targeting conceptually muddy

If `HARNESS_WORKSHOP_INSTANCE_ID` remains the de facto hidden selector everywhere, the platform model will still be unclear even if login stops failing.

Mitigation:

- define one target-instance resolution order and use it consistently
- introduce explicit CLI targeting support where commands can operate on many workshops
- document the difference between deployment default, selected workshop, and authorized workshops

### Risk: Existing broker-token sessions become incompatible with the new lookup rules

Current CLI sessions are keyed by `instanceId` during token lookup. Changing that contract can invalidate active sessions or create mixed-mode behavior.

Mitigation:

- treat legacy CLI sessions as expired after the schema/lookup change
- document the need to log in again after deployment
- add compatibility handling only if it materially reduces deployment risk

### Risk: First-user owner bootstrap regresses

Today the first Neon user on an empty instance can auto-become owner. Moving authz to command time must preserve that behavior for instance operations without recreating login-time coupling.

Mitigation:

- keep `ensureGrantForNeonUser(instanceId, neonUserId)` on the first instance-targeted authz path
- add tests for:
  - empty instance first-use bootstrap
  - existing instance with no matching grant
  - already-granted facilitator on repeated commands

### Risk: Audit log schema or semantics become inconsistent

Current audit append helpers always require an `instanceId`. Global login events may not naturally have one.

Mitigation:

- decide intentionally whether login bootstrap events use:
  - nullable `instanceId`
  - a separate actor-scoped audit path
  - a synthetic auth-scope identifier
- update docs and consumers in the same slice

### Risk: The fix remains half-global and half-instance-scoped

A partial patch could remove the FK failure but still leave approval, poll, and session validation implicitly tied to the current instance context.

Mitigation:

- treat device start, approve, poll, session lookup, and bearer-token validation as one cohesive surface
- review all call sites in the same implementation slice
- require end-to-end login and command tests against the new semantics

## Phased Implementation

### Phase 1: Freeze the target auth and targeting model

Goal: define the intended invariant before touching schema or handlers.

Tasks:
- [x] Write the explicit invariant in the auth/runtime docs:
  - platform login bootstrap is global
  - workshop selection is separate from login
  - workshop authorization is instance-scoped
  - default instance context applies to operations, not login
- [x] Define one target-instance resolution order for CLI and dashboard:
  - explicit instance id
  - route-selected instance
  - deployment default
  - repository default only where intentional
- [x] Decide how global CLI sessions should identify a facilitator:
  - token scoped only to `neonUserId` and role cache
  - token plus optional last-used instance metadata
- [x] Decide audit semantics for bootstrap events without a concrete instance

Exit criteria:
- the repo has one explicit statement of the new auth boundary
- the repo has one explicit statement of the target-instance resolution model
- audit semantics are chosen, not deferred implicitly

### Phase 2: Refactor device-auth and CLI-session persistence

Goal: remove the schema-level dependency that forces login bootstrap to reference a workshop instance.

Tasks:
- [x] Update runtime contracts for `FacilitatorDeviceAuthRecord` and `FacilitatorCliSessionRecord` so login bootstrap does not require `instanceId`
- [ ] Design and apply the schema change for Neon mode:
  - make `instance_id` nullable for bootstrap records or
  - split global auth/session records from instance-scoped records
- [x] Update file-mode repositories to mirror the same semantics
- [x] Review token lookup helpers so bearer tokens are validated independently of `getCurrentWorkshopInstanceId()`

Exit criteria:
- device auth start, poll, and session lookup no longer require an existing workshop instance row
- runtime storage shape is consistent across file and Neon modes

### Phase 3: Move grant resolution to instance-targeted authorization

Goal: keep grants and owner bootstrap at the correct boundary: command-time instance authorization.

Tasks:
- [x] Refactor approval/poll/session validation flow so identity bootstrap completes before instance grant lookup
- [x] Move `ensureGrantForNeonUser(instanceId, neonUserId)` to the first instance-targeted authz path
- [x] Introduce or standardize target-instance resolution helpers so command and page guards do not reach straight for `getCurrentWorkshopInstanceId()` unless they are explicitly using a default
- [x] Update facilitator page/request/action guards to:
  - authenticate globally first
  - resolve a target workshop second
  - authorize against that workshop third
- [x] Preserve `HARNESS_WORKSHOP_INSTANCE_ID` only as the default operation target where explicit instance ids are absent

Exit criteria:
- login works with no seeded instance row for the default context
- targeting behavior is explicit and consistent
- operations still enforce instance-scoped grants
- owner auto-bootstrap still works on first instance use

### Phase 4: Update CLI, dashboard semantics, errors, and operator docs

Goal: make the new model legible to facilitators and agents.

Tasks:
- [x] Update `harness auth login` and `harness auth status` messaging so they describe auth success independently from workshop access
- [x] Decide which CLI commands should require explicit `--instance-id` versus allowing a default selected/deployment instance
- [x] Add or document a discoverable “which workshops can I operate on?” path using the existing instances surface
- [x] Ensure workshop commands surface clear failures for:
  - no workshop selected
  - missing default instance
  - unknown instance
  - missing grant
- [x] Update facilitator docs and runbooks to explain:
  - platform login
  - workshop selection
  - workshop authorization
  - any re-login requirement
- [x] Update ADR/runbook text where it currently implies login depends on active instance state

Exit criteria:
- operator-facing docs match actual runtime behavior
- CLI and dashboard language make the auth/selection/authz layering understandable
- CLI output makes the authz boundary understandable during failures

### Phase 5: Verify with end-to-end and regression coverage

Goal: prove the boundary changed in the intended way and did not regress privileged flows.

Tasks:
- [x] Add unit coverage for:
  - global device-auth start
  - global poll/session lookup
  - instance-targeted grant resolution
  - first-user owner bootstrap on first operation
- [x] Add CLI integration coverage for:
  - login succeeds when `HARNESS_WORKSHOP_INSTANCE_ID` does not exist yet
  - login succeeds before any workshop is selected
  - login + `workshop status` or `create-instance` succeeds once targeting a valid instance
  - clear error when no workshop is selected and no default applies
  - clear authz failure when facilitator lacks a grant
- [ ] Add deployment/runbook verification notes for upgrading an existing environment

Exit criteria:
- the original `facilitator_device_auth_instance_id_fkey` failure is no longer possible during login bootstrap
- auth and authz failures are distinct and intentional

## Implementation Tasks

- [x] Document the new auth boundary and audit expectations.
- [x] Refactor device auth and CLI session contracts so bootstrap is not instance-bound.
- [x] Apply the corresponding Neon/file-mode persistence changes.
- [x] Standardize target-instance resolution so selection is explicit and consistent.
- [x] Move grant lookup and owner auto-bootstrap to instance-targeted authorization paths.
- [x] Update facilitator guards and dashboard semantics to separate login success from workshop selection and workshop authorization.
- [ ] Finish the remaining CLI messaging polish so workshop-selection failures carry command-specific hints.
- [x] Add regression coverage for login bootstrap without a seeded instance and for first-use owner bootstrap.
- [x] Update ADR/runbook/facilitator docs to match the new model.

## Acceptance Criteria

- `harness auth login` can complete successfully even when `HARNESS_WORKSHOP_INSTANCE_ID` does not yet exist in `workshop_instances`.
- Facilitator identity bootstrap no longer writes device-auth or CLI-session rows that require a valid workshop instance FK at login time.
- A facilitator can be authenticated to the platform before selecting or targeting a workshop instance.
- Workshop targeting has one documented resolution order and does not rely on hidden auth-time coupling.
- Instance-scoped workshop commands still require a valid target instance and the correct facilitator grant.
- First-user owner bootstrap still works, but only when a facilitator first targets an instance.
- CLI and dashboard surfaces distinguish clearly between:
  - authenticated facilitator
  - selected target workshop
  - authorized facilitator for a specific instance
- Automated tests cover the prior failure mode and the new command-time authorization model.
- Docs describing facilitator auth and instance access no longer imply that login bootstrap requires an active workshop instance record.

## References

- [`dashboard/lib/facilitator-cli-auth-repository.ts`](../../dashboard/lib/facilitator-cli-auth-repository.ts)
- [`dashboard/lib/facilitator-access.ts`](../../dashboard/lib/facilitator-access.ts)
- [`dashboard/lib/facilitator-session.ts`](../../dashboard/lib/facilitator-session.ts)
- [`dashboard/lib/instance-context.ts`](../../dashboard/lib/instance-context.ts)
- [`dashboard/lib/instance-grant-repository.ts`](../../dashboard/lib/instance-grant-repository.ts)
- [`dashboard/lib/workshop-instance-repository.ts`](../../dashboard/lib/workshop-instance-repository.ts)
- [`dashboard/app/api/workshop/instances/route.ts`](../../dashboard/app/api/workshop/instances/route.ts)
- [`docs/workshop-instance-runbook.md`](../workshop-instance-runbook.md)
- [`docs/harness-cli-foundation.md`](../harness-cli-foundation.md)
- [`docs/adr/2026-04-06-facilitator-identity-simplification.md`](../adr/2026-04-06-facilitator-identity-simplification.md)
- [`docs/plans/2026-04-08-feat-cli-first-facilitator-operations-plan.md`](./2026-04-08-feat-cli-first-facilitator-operations-plan.md)
- [`docs/2026-04-08-harness-lab-architecture-review.md`](../2026-04-08-harness-lab-architecture-review.md)
