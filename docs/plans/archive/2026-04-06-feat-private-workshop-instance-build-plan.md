---
title: "feat: build private workshop-instance runtime"
type: plan
date: 2026-04-06
status: complete
brainstorm: ../brainstorms/2026-04-06-private-workshop-instance-model-brainstorm.md
confidence: medium
---

# Private Workshop-Instance Runtime Build Plan

Build the first production-capable implementation of the private workshop-instance model so the public Harness Lab repo can run real events from private runtime storage instead of file-backed state and sample-only auth.

## Problem Statement

Harness Lab now has the architecture and doctrine for a public repo plus private runtime model, but the application still runs on local file-backed repositories and lightweight sample auth patterns.

Current implementation gaps:

- workshop state is stored through a file adapter in [`workshop-state-repository.ts`](../../dashboard/lib/workshop-state-repository.ts)
- participant sessions are stored through a file adapter in [`event-access-repository.ts`](../../dashboard/lib/event-access-repository.ts)
- participant event access in [`event-access.ts`](../../dashboard/lib/event-access.ts) is single-event and sample-code oriented rather than instance-scoped
- facilitator protection in [`admin-auth.ts`](../../dashboard/lib/admin-auth.ts) and [`middleware.ts`](../../dashboard/middleware.ts) is global basic auth rather than facilitator identity plus per-instance grants
- the repo has a written public-launch cleanup plan, but no migration off repo-backed live state and no verified history scrub

This matters because the current code can demonstrate the concept, but it cannot safely operate real workshops under the runtime model chosen in the original brainstorm.

## Proposed Solution

Implement the private workshop-instance runtime in staged slices:

1. create production repository/service interfaces around `instance_id`
2. add Neon-backed persistence for workshop instances, event access, participant sessions, teams, checkpoints, monitoring, and audit logs
3. migrate participant event access from one global sample code to instance-scoped event-code redemption and session validation
4. replace global basic-auth protection with facilitator identity, per-instance grants, and protected operator APIs
5. keep public template content in repo files, but compose it with private instance state server-side at runtime
6. enforce the documented tests and security gates as the runtime becomes real
7. once runtime migration is complete, execute the public-safe repo cleanup and git-history scrub

The build should preserve the existing public participant surface and current route vocabulary where possible, but move the data and permission model underneath it.

## Detailed Plan Level

This is a **detailed** plan because it includes database schema work, auth and session changes, API migration, deployment configuration, security checks, and git-history cleanup.

## Decision Rationale

### Why build in slices instead of swapping everything at once

- The repo already has working routes, tests, and UI expectations.
- The main risk is breaking participant and facilitator flows while changing storage and auth simultaneously.
- A staged migration lets file-backed adapters remain the fallback development path while production adapters land behind the same interfaces.

### Why start with repository boundaries and tests

- Current code centralizes state behind store and repository seams already.
- Strengthening those seams first reduces the blast radius of the Neon migration.
- It creates a controlled place to enforce `instance_id` scoping and audit expectations.

### Why postpone git-history cleanup until after runtime migration

- History rewriting before the replacement runtime exists creates a gap where operators still need repo-backed live data.
- The safer sequence is: move live state out of repo-backed paths, verify the private runtime works, then scrub history and tighten public-safe policy.

### Why keep public template content repo-native

- The brainstorm explicitly chose composition of public content plus private runtime state.
- Moving reusable public markdown into the database would add operational burden without improving security.
- The private database should store keys and runtime selections, not duplicate the whole template corpus.

### Why keep facilitator operations API-first

- The chosen operating model is skill-enabled and API-first, not admin-UI-heavy.
- The current middleware-based protection is too coarse, but the route structure already gives a migration path toward explicit protected APIs.

### Why prefer Neon Auth for facilitator identity evaluation

- Neon now offers managed auth that lives directly in the database and branches with each Neon branch, which aligns well with the preview-environment model chosen for this project.
- The official Next.js server integration reduces the amount of custom session plumbing the repo would otherwise need to build and maintain for facilitators.
- Facilitator auth is a closer fit for a normal identity system than participant shared room-entry codes are.

Default planning posture:

- evaluate Neon Auth first for facilitator identity and operator sessions
- keep participant shared event-code redemption as a separate instance-scoped access mechanism unless Neon Auth can support it cleanly without inventing fake participant accounts

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The existing store/repository seams are sufficient to introduce production adapters without a full dashboard rewrite | Verified | [`workshop-store.ts`](../../dashboard/lib/workshop-store.ts), [`workshop-state-repository.ts`](../../dashboard/lib/workshop-state-repository.ts), and [`event-access-repository.ts`](../../dashboard/lib/event-access-repository.ts) already isolate persistence concerns |
| Public participant routes can keep their current UX while the underlying source of truth changes | Verified | Existing event-context routes in [`route.ts`](../../dashboard/app/api/event-context/core/route.ts) and [`route.ts`](../../dashboard/app/api/event-context/teams/route.ts) already separate public and participant-authenticated reads |
| `instance_id` can be introduced without breaking the public template model | Verified | The architecture docs explicitly require runtime composition of repo content plus instance state and do not require public content duplication |
| Participant event access should remain shared-event-code based in the first production version | Verified | Accepted in the original brainstorm and reinforced by [`2026-04-06-workshop-event-access-model.md`](../adr/2026-04-06-workshop-event-access-model.md) |
| Neon Auth is a viable first-choice solution for facilitator identity and sessions | Unverified | Current Neon docs describe managed branchable auth with Next.js server support, but this repo has not validated the exact fit for its facilitator workflow yet |
| The first production facilitator path can still fall back to custom auth if Neon Auth proves too constraining | Unverified | The architecture pack allows this temporarily, but the long-term security and maintenance tradeoff is still not proven |
| The current route split is good enough to migrate incrementally rather than redesigning all endpoints first | Unverified | The repo has a workable split today, but some routes such as [`route.ts`](../../dashboard/app/api/teams/route.ts) mix participant reads and facilitator writes |
| Neon preview branches plus protected previews will be available and practical for this repo’s workflow | Unverified | The deployment spec assumes this path, but the repository has not exercised it yet |
| Existing demo/test fixtures can be cleanly separated from any future real event data without destabilizing tests | Unverified | Test and seed data patterns exist, but no production migration has happened yet |

Unverified assumptions should be resolved in early implementation phases before production rollout.

## Risk Analysis

### Risk: mixed participant and facilitator routes create authorization mistakes during migration

Current code exposes participant `GET` and facilitator write operations from some of the same route files.

Mitigation:

- split mixed routes into explicit participant-read and facilitator-write handlers where the boundary is currently muddy
- add authz tests before changing storage underneath those routes
- default to deny-by-default authorization for new protected paths

### Risk: instance scoping is added inconsistently

If some repositories or queries keep global assumptions, data from one workshop instance can leak into another.

Mitigation:

- require `instance_id` in every private repository interface
- add repository and integration tests for mismatched instance access
- log denied cross-instance access attempts

### Risk: participant session migration breaks the dashboard login flow

The current event-access logic is simple and stateful; changing it alongside storage can easily cause expiry, cookie, or renewal regressions.

Mitigation:

- preserve the current route contract while changing internals first
- add tracer-bullet tests around redemption, session validation, expiry, and logout before migrating storage
- migrate to hashed session and event-code records without changing user-facing flow initially

### Risk: facilitator auth is underbuilt

Replacing one global basic-auth check with custom facilitator identity and grants can become a silent security weakness if implemented casually.

Mitigation:

- isolate facilitator auth behind a dedicated service interface
- ship audit logging and grant checks in the same slice as protected mutations
- keep the path to managed identity open if the custom implementation proves weak

### Risk: git-history cleanup is attempted too early or too late

Too early creates operational gaps; too late leaves the repo not truly public-safe.

Mitigation:

- make history cleanup a distinct late phase with explicit preconditions
- block public launch until runtime migration and cleanup verification are both complete

### Risk: security gates remain aspirational

If the runtime lands before CI, browser checks, and review rules are enforced, the repo will repeat the same gap the architecture plan just closed.

Mitigation:

- treat CI/security enforcement as a shipping dependency, not optional polish
- require at least one protected-preview/browser-validation path before production use

## Phased Implementation

### Phase 1: Stabilize boundaries and add migration tests

Goal: make the current code safe to refactor by freezing the expected contracts in tests and extracting clearer interfaces.

Tasks:
- [x] Add tracer-bullet tests for participant event-code redemption, session expiry, logout, and protected event-context reads.
- [x] Add authz tests for facilitator-protected routes, including denied participant access and denied cross-instance access placeholders.
- [x] Refactor mixed route surfaces where needed so participant reads and facilitator writes have clearer boundaries.
- [x] Introduce explicit service/repository interfaces for workshop instances, participant access, facilitator auth, audit logging, and monitoring snapshots.
- [x] Keep current file-backed adapters working as development adapters behind the new interfaces.

Exit criteria:
- the current behavior is covered well enough that storage and auth internals can change without guesswork
- private runtime concerns are behind explicit interfaces rather than spread through route handlers

### Phase 2: Build the Neon schema and production adapters

Goal: land the production data layer without flipping the whole app at once.

Tasks:
- [x] Implement the initial Neon schema and migration set for workshop instances, participant access, participant sessions, teams, checkpoints, monitoring snapshots, facilitator identities, instance grants, archives, and audit logs.
- [x] Create production repository adapters for the private runtime layer, enforcing `instance_id` at the boundary.
- [x] Add integration tests that run repository behaviors against the production schema.
- [x] Introduce configuration for selecting file-backed adapters in local/demo mode and Neon-backed adapters in production-like mode.
- [x] Add seed/bootstrap mechanics for creating a demo instance without writing real event data into tracked files.

Exit criteria:
- production adapters can serve the existing domain operations from Neon
- development/demo mode still works without requiring live private event data in the repo

### Phase 3: Migrate participant event access to instance-scoped runtime auth

Goal: replace the single global sample-event model with real instance-scoped participant access.

Tasks:
- [x] Replace `HARNESS_EVENT_CODE`-only logic with instance-scoped participant event access records.
- [x] Store event-code hashes and participant session records in the private runtime layer instead of repo-backed files.
- [x] Update participant session validation to use hashed/rotatable session records with idle and absolute expiry rules.
- [x] Preserve current dashboard routes for redeem, logout, and event-context reads while migrating their internals.
- [x] Add audit logging for redemption success/failure, session issuance, session expiry, and revocation.

Exit criteria:
- participant event access is scoped to a real workshop instance
- no participant session state for real events lives in repo-backed files

### Phase 4: Implement facilitator identity and protected operator paths

Goal: replace global basic auth with facilitator identity and per-instance grants.

Tasks:
- [x] Validate Neon Auth against the facilitator use case and decide whether it is the primary implementation path or only a reference option.
- [x] If Neon Auth fits, integrate Neon Auth for facilitator identity and operator sessions; otherwise implement a custom auth service behind the same interface seam.
- [x] Build facilitator identity storage and per-instance grant enforcement, reusing Neon Auth identities when available.
- [x] Replace middleware-only credential checks with a facilitator auth service that supports identity lookup, session validation, and grant checks.
- [x] Update protected facilitator routes and admin surfaces to require explicit instance-scoped authorization.
- [x] Add audit logging for facilitator login attempts, grant checks, write mutations, exports, and archive actions.
- [x] Decide whether any current route needs to split further to avoid participant/facilitator ambiguity.

Exit criteria:
- facilitator authorization is instance-scoped and auditable
- participant auth can no longer reach facilitator routes through coarse path assumptions

### Phase 5: Wire runtime composition into the dashboard and skill contracts

Goal: keep the public template experience while serving real private state from the runtime layer.

Tasks:
- [x] Ensure participant core bundle and team lookup data compose public template content with instance-scoped private state.
- [x] Update domain services so template keys and runtime state join server-side rather than through ad hoc route logic.
- [x] Verify that public routes still render useful demo/sample content when no live instance context is present.
- [x] Align the dashboard event-context responses with the documented workshop-skill contract.
- [x] Add or update e2e coverage for participant and facilitator critical flows against the new runtime-backed behavior.

Exit criteria:
- the dashboard and skill share one runtime mental model
- public-safe fallback behavior still works without leaking private instance state

### Phase 6: Enforce deployment and security gates

Goal: make the runtime operable and reviewable, not just implemented.

Tasks:
- [x] Add CI checks for auth-sensitive tests, integration tests, linting, and production build.
- [x] Add code scanning, dependency review, and secret scanning aligned with the documented security gate.
- [x] Configure protected preview environments and the preview database-branch workflow.
- [x] Write the operator/bootstrap steps for creating, preparing, running, and archiving a workshop instance against the real runtime.
- [x] Verify the required exploratory browser pass and Playwright coverage for participant mobile entry and facilitator protected flows.

Exit criteria:
- a branch can move through preview validation with explicit checks
- production promotion is gated by automated and human review sensors

### Phase 7: Remove repo-backed live state and execute public-safety cleanup

Goal: finish the migration by removing remaining live-data dependence on the repo and preparing for public launch.

Tasks:
- [x] Remove or quarantine any remaining paths that could store real workshop state in tracked repo files.
- [x] Replace ambiguous fixtures with clearly fictional sample/demo data where needed.
- [x] Execute the git-history cleanup plan after runtime migration is verified.
- [x] Rotate any credentials or event codes that may have existed in repo history or local operational files.
- [x] Run the final public-safety audit across working tree, retained history, tags, and generated artifacts.

Exit criteria:
- real workshops can run from the private runtime layer without repo-backed live state
- the repo is public-safe in both current state and retained history

## Implementation Tasks

- [x] Freeze current auth and event-context behavior in tests before invasive refactors.
- [x] Extract clear instance-scoped repository and auth service interfaces from current file-backed implementations.
- [x] Implement Neon schema, migrations, and production adapters for private workshop-instance state.
- [x] Migrate participant event-code redemption and session storage to instance-scoped runtime records.
- [x] Implement facilitator identity, sessions, and per-instance grant enforcement.
- [x] Prefer Neon Auth for facilitator identity if the integration satisfies the operator workflow and branching needs.
- [x] Refactor protected routes to use explicit participant/facilitator authorization paths.
- [x] Update dashboard composition so public template content joins with private runtime state server-side.
- [x] Add CI/security/deployment checks required for preview and production promotion.
- [x] Remove repo-backed live operational state and execute git-history cleanup before public launch.

## Acceptance Criteria

- Real workshop instances can be created, prepared, run, archived, and reset from the private runtime layer rather than tracked repo files.
- Participant event access is instance-scoped, uses short-lived runtime sessions, and no longer depends on repo-backed session storage.
- Facilitator operations require facilitator identity plus per-instance authorization rather than one global basic-auth password.
- Participant and facilitator APIs have tested authorization boundaries, including denied cross-instance access.
- The dashboard and `workshop-skill/` can consume the documented participant event-context contract from one shared runtime source of truth.
- Local/demo mode still works with clearly fictional sample data and without requiring real workshop data in the repo.
- Preview and production promotion have enforceable test, browser-validation, and security gates.
- The repo no longer stores live operational state for real workshops, and the history cleanup/public-safety audit is complete before public launch.

## References

- Original brainstorm: [2026-04-06-private-workshop-instance-model-brainstorm.md](../brainstorms/2026-04-06-private-workshop-instance-model-brainstorm.md)
- Architecture plan: [2026-04-06-feat-private-workshop-instance-architecture-plan.md](2026-04-06-feat-private-workshop-instance-architecture-plan.md)
- Runtime topology ADR: [2026-04-06-private-workshop-instance-runtime-topology.md](../adr/2026-04-06-private-workshop-instance-runtime-topology.md)
- Auth boundary ADR: [2026-04-06-private-workshop-instance-auth-boundary.md](../adr/2026-04-06-private-workshop-instance-auth-boundary.md)
- Event access ADR: [2026-04-06-workshop-event-access-model.md](../adr/2026-04-06-workshop-event-access-model.md)
- Event context contract: [workshop-event-context-contract.md](../workshop-event-context-contract.md)
- Schema design: [private-workshop-instance-schema.md](../private-workshop-instance-schema.md)
- Auth model: [private-workshop-instance-auth-model.md](../private-workshop-instance-auth-model.md)
- Deployment spec: [private-workshop-instance-deployment-spec.md](../private-workshop-instance-deployment-spec.md)
- Security gates: [private-workshop-instance-security-gates.md](../private-workshop-instance-security-gates.md)
- History cleanup plan: [public-launch-history-cleanup-plan.md](../public-launch-history-cleanup-plan.md)
- Current state store seam: [workshop-store.ts](../../dashboard/lib/workshop-store.ts)
- Current workshop state repository: [workshop-state-repository.ts](../../dashboard/lib/workshop-state-repository.ts)
- Current event access repository: [event-access-repository.ts](../../dashboard/lib/event-access-repository.ts)
- Current participant session logic: [event-access.ts](../../dashboard/lib/event-access.ts)
- Current facilitator auth and protection: [admin-auth.ts](../../dashboard/lib/admin-auth.ts), [middleware.ts](../../dashboard/middleware.ts)
- Neon Auth overview: https://neon.com/docs/auth/overview
- Neon branchable auth changelog: https://neon.com/docs/changelog/2025-12-12
