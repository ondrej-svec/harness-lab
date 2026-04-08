---
title: "fix: architecture review follow-up hardening"
type: plan
date: 2026-04-08
status: complete
confidence: medium
---

# Architecture Review Follow-Up Hardening Plan

Reconcile the 2026-04-08 full architecture review with the repo as it actually exists, then implement the highest-value hardening work without weakening the project’s public-safe and auth-boundary rules.

## Problem Statement

The coworker architecture review surfaced several real issues, but it also mixed them with recommendations that are incomplete or mis-scoped for this repo:

- security headers are genuinely missing
- shared `workshop_state` writes are still last-write-wins
- sample/default auth and event-access fallbacks still exist in code paths that should stay local/demo only
- device auth has an abuse surface that was not fully framed in the review
- `GET /api/workshop` leaks more than instance ids because it returns full instance records
- the proposed public `/api/health` payload would leak runtime metadata if implemented literally
- the review frames CI as lacking type checking even though `next build` already type-checks the dashboard

This matters because a rushed “fix the review” pass could easily make the system worse:

- adding a public diagnostic endpoint could violate the public-safe trust boundary
- requiring the wrong env vars would not actually fail Neon auth closed
- filtering `/api/workshop` by lifecycle state alone would still leak event metadata

The work needs to preserve the useful findings, correct the misleading ones, and then ship the hardening changes in dependency order.

## Proposed Solution

Handle the follow-up in five ordered slices:

1. correct the review-derived backlog so the team is implementing repo-verified fixes, not a flawed interpretation of the system
2. harden the public HTTP surface with minimal response headers and a safer contract for workshop metadata exposure
3. make Neon runtime auth/bootstrap fail closed without breaking local file-mode demo workflows
4. add optimistic concurrency to the shared workshop-state write path and decide whether adjacent bulk-replace paths belong in the same slice
5. apply secondary operational hardening only after the trust-boundary fixes are settled

This plan is intentionally narrower than “implement the architecture review as written.” The goal is to improve the system, not to copy an external review into code.

## Detailed Plan Level

This is a **detailed** plan because it crosses trust boundaries, runtime configuration, public-vs-private exposure, and shared-state correctness. A flat task list would hide important sequencing and decision points.

## Decision Rationale

### Why correct the backlog before implementation

The review contains some valid findings, but several recommended fixes would be unsafe or incomplete if applied literally. The execution plan needs one corrected source of truth first.

### Why public-surface hardening comes before health monitoring

The current bigger exposure risk is public metadata leakage, not the absence of an uptime probe. Tightening exposed route contracts and headers is lower-risk and more urgent than adding a new public endpoint.

### Why Neon fail-closed work is about auth mode selection, not just env presence

The important failure mode is not “missing `HARNESS_ADMIN_PASSWORD`.” The real problem is that Neon mode can still end up on Basic Auth behavior if the managed-auth config is incomplete. The fix has to target the actual runtime seam.

### Why optimistic locking is still the highest-value correctness change

The current `updateWorkshopState()` path still reads, mutates, and saves the shared state document without a version guard. That is the most direct route to silent facilitator data loss during live use.

### Why secondary hardening is deferred behind the trust-boundary fixes

Items like explicit `tsc --noEmit`, a global error boundary, or broader device-auth throttling are useful, but they should not outrank fixes to public metadata exposure, auth fallback behavior, or state correctness.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Minimal security headers can be added centrally in `next.config.ts` without changing the current UI architecture | Verified | [`next.config.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/next.config.ts) is minimal and currently adds no custom headers |
| The public homepage does not depend on the current `GET /api/workshop` payload | Verified | [`page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/page.tsx) renders from server-side state and [`public-page-view-model.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/public-page-view-model.ts) does not call `/api/workshop` |
| Neon mode should never silently fall back to local/demo auth behavior when managed auth config is incomplete | Verified | [`private-workshop-instance-env-matrix.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-env-matrix.md) explicitly says demo defaults must not be reused outside local file mode |
| A public health endpoint is required for the workshop runtime to be operable | Unverified | The review recommends one, but the repo currently has no documented requirement that anonymous uptime checks must expose runtime diagnostics |
| Optimistic locking can be layered onto the `workshop_instances`/`workshop_state` write path without changing current read contracts | Unverified | [`workshop-store.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-store.ts) and [`workshop-state-repository.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-state-repository.ts) do not currently carry a version field through reads/writes |
| The delete-and-reinsert repository patterns for teams/checkpoints belong in the same implementation slice as workshop-state optimistic locking | Unverified | Those write paths are real, but they are adjacent to, not identical with, the shared-state overwrite problem |

The unverified assumptions should become explicit early decisions during implementation, not silent premises.

## Risk Analysis

### Risk: the cleanup over-corrects and breaks legitimate facilitator or preview behavior

If `/api/workshop` is simply locked down or removed without tracing current callers, the admin surface or downstream tooling could regress.

Mitigation:

- audit all current callers before changing the route contract
- prefer splitting public-safe and facilitator-only projections over silently changing one route for everyone
- add route-level tests for both anonymous and facilitator access paths

### Risk: fail-closed auth changes accidentally break local demo mode

The repo intentionally keeps sample credentials and sample event-code seeding for file-mode development. A blunt config guard could remove that workflow.

Mitigation:

- scope fail-closed behavior to Neon mode only
- keep file-mode behavior intact and explicitly documented
- add tests proving file mode still works while incomplete Neon mode fails

### Risk: optimistic locking adds user-visible conflicts without a recovery path

A correct concurrency guard can still be operationally rough if the caller only sees a generic failure.

Mitigation:

- return a clear conflict contract from the shared write path
- handle the conflict in routes/actions with a retry-or-refresh instruction
- add focused tests for overlapping facilitator mutations

### Risk: a health endpoint becomes a new metadata leak

If `/api/health` returns storage mode, instance id, or DB connectivity details anonymously, it weakens the public-safe boundary.

Mitigation:

- decide first whether anonymous health is even required
- if yes, keep the anonymous response minimal (`ok`, optional coarse status only)
- move detailed diagnostics behind facilitator auth or existing platform logs

### Risk: device-auth hardening chases the wrong endpoint

The review focused on `/api/auth/device/approve`, but the broader open surface includes `/api/auth/device/start` as well.

Mitigation:

- decide the abuse model for the whole device-auth flow, not one endpoint in isolation
- add throttling where it materially reduces risk
- keep the implementation proportional to the workshop threat model

## Phased Implementation

### Phase 1: Correct the reviewed backlog

Goal: turn the coworker review into a repo-verified remediation list.

Tasks:

- [x] Update the architecture review document or add a companion note that distinguishes verified findings from rejected or corrected recommendations.
- [x] Decide the intended contract for `GET /api/workshop`: facilitator-only, split into public/admin projections, or replaced by a narrower public endpoint.
- [x] Decide whether anonymous health checks are truly required for this workshop runtime.
- [x] Decide whether repository bulk-replace safety is in scope for this pass or explicitly deferred after workshop-state optimistic locking.

Exit criteria:

- one written remediation source of truth exists
- no implementation task depends on a recommendation already shown to be mis-scoped

### Phase 2: Harden the public HTTP surface

Goal: reduce accidental public exposure without changing the user-facing workshop model.

Tasks:

- [x] Add a minimal header set in [`next.config.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/next.config.ts) for clickjacking, MIME sniffing, and referrer hardening.
- [x] Change `GET /api/workshop` so anonymous callers cannot retrieve full workshop instance records.
- [x] If a public workshop endpoint remains, ensure its response is explicitly public-safe and limited to fields already acceptable on public routes.
- [x] Document the health-endpoint decision for this pass: no new anonymous diagnostic endpoint ships unless a later operational requirement appears.
- [x] Add route-level tests that prove anonymous callers cannot access facilitator-grade workshop metadata.

Exit criteria:

- the app emits a baseline security-header set
- public callers cannot enumerate or inspect full workshop instance records
- no new anonymous endpoint leaks instance ids, storage mode, or DB diagnostics unintentionally

### Phase 3: Fail closed in Neon runtime mode

Goal: ensure managed-auth workshop instances cannot silently drift into local/demo fallback behavior.

Tasks:

- [x] Define one explicit Neon runtime readiness check covering `HARNESS_STORAGE_MODE=neon`, managed-auth env completeness, and any other required server-side secrets.
- [x] Refactor facilitator auth mode detection so incomplete Neon auth configuration does not silently fall back to Basic Auth in production-like runtimes.
- [x] Prevent sample event-code seeding from activating in Neon mode unless an explicit, documented bootstrap mode is intended.
- [x] Update environment and deployment docs so the fail-closed rule is operationally clear.
- [x] Add tests for complete Neon config, incomplete Neon config, and file-mode local demo behavior.

Exit criteria:

- incomplete Neon auth/runtime config fails closed
- local file mode still works as the sample/demo path
- sample event-access seeding no longer appears as an accidental production fallback

### Phase 4: Add shared-state concurrency protection

Goal: stop blind overwrites on the main facilitator state write path.

Tasks:

- [x] Introduce a versioning strategy for the `workshop_state` owner row in [`workshop-state-repository.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-state-repository.ts).
- [x] Thread the version through read and write contracts so [`updateWorkshopState()`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-store.ts) can reject stale writes.
- [x] Return an explicit conflict outcome that routes/actions can surface as retryable rather than generic failure.
- [x] Add concurrency-focused tests covering overlapping facilitator mutations to shared workshop state.
- [x] Decide whether `replaceTeams()` / `replaceCheckpoints()` transactional safety is addressed here or documented as adjacent debt.

Exit criteria:

- shared workshop-state mutations reject stale writes instead of silently overwriting them
- the conflict path is covered by tests
- adjacent repository bulk-replace behavior is either improved or explicitly deferred

### Phase 5: Apply secondary operational hardening

Goal: close the remaining worthwhile gaps once the trust-boundary work is stable.

Tasks:

- [x] Add a minimal [`app/global-error.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app) for operator-visible failure handling.
- [x] Decide and document the device-auth abuse posture for this pass, including whether throttling is implemented now or explicitly deferred.
- [x] Decide whether an explicit `tsc --noEmit` step adds enough signal beyond `next build` to justify CI time and maintenance.
- [x] Update runbook, env-matrix, and security docs anywhere the implementation changes the operating contract.
- [x] Run the full dashboard verification set after the trust-boundary changes land.

Exit criteria:

- operator-visible error handling exists for uncaught app failures
- device-auth abuse posture is explicit and encoded
- CI/documentation reflect the final contract rather than the pre-fix assumptions

## Implementation Tasks

Dependency-ordered tracker for `$work`:

- [x] Correct the architecture-review remediation list so only repo-verified fixes survive into implementation.
- [x] Harden the public surface first: headers, workshop metadata exposure, and health-endpoint posture.
- [x] Implement Neon-mode fail-closed behavior without disturbing file-mode demo workflows.
- [x] Add optimistic locking to shared workshop-state writes and lock it with concurrency tests.
- [x] Decide and handle the adjacent repository bulk-replace write patterns.
- [x] Add secondary operational hardening: global error boundary, device-auth posture decision, optional CI signal improvements, and docs updates.
- [x] Run the dashboard verification set and capture any deferred debt explicitly.

## Acceptance Criteria

- Anonymous callers can no longer retrieve full workshop instance records from [`/api/workshop`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/api/workshop/route.ts) unless those records are explicitly reduced to a public-safe projection.
- The app emits a minimal baseline security-header set for all dashboard routes.
- Neon runtime configuration fails closed when managed-auth requirements are incomplete, and file-mode demo behavior remains intact.
- Sample event-code seeding no longer activates accidentally in Neon mode.
- Shared workshop-state writes reject stale concurrent updates instead of silently overwriting them.
- If a health endpoint exists, its anonymous response does not expose instance ids, storage mode, or DB connectivity details.
- Device-auth abuse posture is explicitly implemented or explicitly deferred with rationale.
- Docs and runbooks reflect the corrected architecture and operational rules.

## References

- Reviewed architecture doc: [2026-04-08-harness-lab-architecture-review.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/2026-04-08-harness-lab-architecture-review.md)
- Prior hardening plan: [2026-04-06-feat-private-workshop-instance-hardening-plan.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/plans/2026-04-06-feat-private-workshop-instance-hardening-plan.md)
- Auth model: [private-workshop-instance-auth-model.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-auth-model.md)
- Security gates: [private-workshop-instance-security-gates.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-security-gates.md)
- Env matrix: [private-workshop-instance-env-matrix.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-env-matrix.md)
- Public workshop route: [route.ts](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/api/workshop/route.ts)
- Facilitator auth seam: [facilitator-auth-service.ts](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/facilitator-auth-service.ts)
- Facilitator request guard: [facilitator-access.ts](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/facilitator-access.ts)
- Shared workshop-state write path: [workshop-store.ts](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-store.ts)
- Workshop-state repository: [workshop-state-repository.ts](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-state-repository.ts)
- Device auth start route: [route.ts](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/api/auth/device/start/route.ts)
- Dashboard CI workflow: [dashboard-ci.yml](/Users/ondrejsvec/projects/Bobo/harness-lab/.github/workflows/dashboard-ci.yml)
