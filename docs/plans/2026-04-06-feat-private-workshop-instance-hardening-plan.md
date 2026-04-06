---
title: "feat: harden private workshop-instance runtime"
type: plan
date: 2026-04-06
status: complete
brainstorm: /Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-06-private-workshop-instance-model-brainstorm.md
confidence: medium
---

# Private Workshop-Instance Runtime Hardening Plan

Complete the second implementation slice for the private workshop-instance runtime so the current Vercel + Neon architecture becomes operationally sound under concurrent workshop traffic, privacy-sensitive lifecycle handling, and real shipping gates.

## Problem Statement

The first build plan is complete, but the follow-up architecture review found that the runtime is still only partially migrated and still carries several structural risks:

- mutable workshop operations still write through one shared `workshop_state` document in [`workshop-store.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-store.ts)
- Neon participant session persistence still rewrites the whole session set in [`event-access-repository.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/event-access-repository.ts)
- modeled runtime tables such as `checkpoints`, `monitoring_snapshots`, and `instance_archives` are not the live source of truth yet
- facilitator auth still uses a split model where `/admin` depends on env-gated middleware while APIs/actions depend on repository-backed checks
- privacy lifecycle behavior and shipping gates remain more documented than enforced

This matters because the main production risk is now silent state corruption or operational drift, not the absence of a private runtime layer. The architecture review concluded that correctness under concurrent writes is the critical gap.

## Proposed Solution

Harden the current runtime in five ordered phases:

1. finish the data-model migration so checkpoints and monitoring stop living only inside `workshop_state`
2. remove destructive write patterns for participant sessions and workshop mutations
3. unify facilitator auth around one production identity/session path and define CSRF/origin posture
4. implement archive/export/retention behavior so privacy and closeout flows are real
5. enforce the documented preview and CI gates so risky changes are actually blocked before promotion

The plan keeps the shared Vercel project, Neon runtime, and event-code participant model chosen earlier. It does not redesign the product into a more complex SaaS or participant-account system.

## Detailed Plan Level

This is a **detailed** plan because it touches runtime data modeling, write semantics, auth/session design, privacy lifecycle handling, CI/preview automation, and production readiness.

## Decision Rationale

### Why start with runtime normalization instead of auth

- The architecture review identified whole-document writes and delete/reinsert session persistence as the highest-likelihood operational failure.
- Auth still matters, but split auth sources are easier to reason about once the underlying write model is safer.
- Normalizing live entities first also creates the substrate needed for archive/export and retention work later.

### Why keep `workshop_state` as a read model instead of deleting it immediately

- The UI and route surface already consume a coherent workshop-shaped document.
- Removing it in one cut would create a broad rewrite with little user-facing value.
- A safer intermediate state is to move writes to dedicated repositories and let `workshop_state` become a composed or cached projection.

### Why treat participant session writes as a separate phase

- The participant session race is isolated and high impact.
- It has a clean fix path: record-level operations plus concurrency-focused tests.
- It should be corrected before layering on more auth/session complexity like facilitator sessions or archive invalidation.

### Why unify facilitator auth after write safety, not before

- The current reviewed fix removed the forgeable-cookie flaw, so the immediate auth bug is closed.
- The remaining facilitator issue is architectural duplication between env Basic Auth and DB-backed authorization, not an already-exploitable bypass in the current code.
- That makes auth unification important, but still second to fixing silent data loss.

### Why postpone full operational automation until after runtime entities are real

- CI and preview workflows need something stable to validate.
- It is better to lock in one coherent storage model and archive lifecycle before encoding protected-preview and preview-branch routines around it.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The current `workshop_state` shape can remain the participant/facilitator read contract while writes are moved underneath it | Verified | The architecture review recommended retaining it as a composed read model rather than removing it outright, and current routes already consume it consistently |
| `checkpoints` and `monitoring_snapshots` are the right first entities to normalize out of `workshop_state` | Verified | These tables already exist in [`2026-04-06-private-workshop-instance-runtime.sql`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/db/migrations/2026-04-06-private-workshop-instance-runtime.sql) and were called out as half-migrated in the architecture review |
| Team registry can stay embedded in `workshop_state` for one more slice without blocking the rest of the hardening work | Verified | This slice explicitly kept teams embedded while normalizing checkpoints and monitoring, and the remaining live flows still work through the existing read model and e2e coverage |
| Record-level participant session writes can be added without changing the current participant UX | Verified | Routes already treat session persistence as an internal concern behind [`event-access.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/event-access.ts) and [`event-access-repository.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/event-access-repository.ts) |
| Facilitator auth can be unified behind one production path without breaking the current admin surface | Verified | `/admin` now only bootstraps the Basic Auth challenge while repository-backed credential and grant checks remain the sole production validator across routes and server actions |
| CSRF/origin checks can be added incrementally without redesigning the whole admin UI | Verified | Facilitator mutations and participant redemption/logout now enforce trusted-origin checks without changing the current admin UX |
| Archive/export flows can be implemented without introducing a background queue in this slice | Verified | The archive payload is now created synchronously through runtime repositories and exposed through the protected admin/API surface |
| Protected preview validation and Neon preview-branch usage are practical for this team | Verified | The repo now encodes a dedicated `Private Runtime Preview Gate` workflow for DB/auth-sensitive pull requests plus Neon-backed integration-test wiring |

Unverified assumptions should be resolved during early phases before the plan proceeds to the dependent shipping phases.

## Risk Analysis

### Risk: runtime normalization causes drift between dedicated tables and `workshop_state`

If writes start landing in dedicated repositories while reads still trust only the old document shape, the system can bifurcate into two conflicting sources of truth.

Mitigation:

- choose one direction per entity: write to dedicated repository first, then compose `workshop_state` from that source
- add repository + projection tests for each normalized entity
- avoid transitional dual-write behavior unless it is explicitly tested and temporary

### Risk: concurrency fixes are incomplete and only move the race elsewhere

Changing participant session writes or workshop mutation paths can still leave read-modify-write races if the projection layer stays naive.

Mitigation:

- add explicit concurrent-write tests for participant redeem/logout and facilitator checkpoint/rotation updates
- prefer record-level operations or optimistic version checks over broad overwrite saves
- document exactly which functions are safe for concurrent use at the end of each phase

### Risk: facilitator auth unification destabilizes `/admin`

The current admin surface relies on middleware behavior plus server-action checks. Replacing that path without a careful transition can break the operator control plane.

Mitigation:

- decide the production facilitator auth source of truth before implementation
- keep middleware only for deployment/preview protection if needed
- add e2e coverage for `/admin` page load plus one server action before removing the old assumptions

### Risk: privacy lifecycle work becomes a large undefined export/archive project

“Archive/export/retention” can sprawl if the exact outputs, retention windows, and operator actions are not fixed up front.

Mitigation:

- define the minimum viable archive flow first
- treat export shape, retention, and delete semantics as explicit acceptance criteria
- keep v1 archive behavior operationally useful and auditable rather than overbuilt

### Risk: shipping-gate automation blocks work without stable secrets or preview infra

Adding preview and Neon automation can fail repeatedly if the repository does not yet have the necessary secret/config model.

Mitigation:

- sequence preview automation after the runtime entity model and auth assumptions are stable
- start by making existing gates executable in CI before adding new deployment complexity
- document required secrets and branch behavior as part of the same phase

## Phased Implementation

### Phase 1: Normalize the first runtime entities

Goal: move live checkpoint and monitoring behavior off the shared `workshop_state` blob and onto dedicated runtime repositories.

Tasks:
- [x] Decide whether teams remain embedded for this slice or join the normalization set as a tracked sub-decision.
- [x] Implement dedicated checkpoint repositories backed by the `checkpoints` table for Neon and an equivalent file adapter for local/demo mode.
- [x] Implement dedicated monitoring repositories backed by the `monitoring_snapshots` table for Neon and an equivalent file adapter for local/demo mode.
- [x] Refactor workshop-domain services so checkpoint and monitoring writes no longer mutate `workshop_state` directly.
- [x] Compose participant/facilitator reads from normalized runtime entities into the existing workshop-shaped read model.
- [x] Add repository tests and route-level tests proving the normalized entities remain instance-scoped.

Exit criteria:

- checkpoint and monitoring writes use their dedicated runtime repositories
- `workshop_state` is no longer the write source of truth for those entities
- participant/facilitator read responses still match the current route contracts

### Phase 2: Remove lost-update write patterns

Goal: make participant sessions and facilitator workshop mutations safe under ordinary concurrent use.

Tasks:
- [x] Replace delete-and-reinsert participant session persistence with record-level create/update/delete behavior.
- [x] Separate expiry cleanup from normal participant redeem, validate, and revoke flows.
- [x] Introduce safer workshop mutation boundaries for facilitator writes, using entity-specific repository updates or optimistic concurrency where needed.
- [x] Add concurrency-focused tests covering overlapping participant redeems/logouts and overlapping facilitator checkpoint/rotation/team writes.
- [x] Document the remaining write paths that still depend on broad projection updates and why they are acceptable or deferred.

Exit criteria:

- participant session persistence no longer rewrites the whole session set
- critical facilitator writes no longer depend on one broad full-document overwrite path
- tests reproduce and protect against the previously identified race conditions

### Phase 3: Unify facilitator auth and request integrity

Goal: converge on one production facilitator identity/session model and make request-integrity expectations explicit.

Tasks:
- [x] Decide the production facilitator auth source of truth: managed auth-backed session or one custom DB-backed session model behind the existing auth seam.
- [x] Reduce `/admin` middleware to deployment/preview protection only, or remove production auth responsibility from it entirely.
- [x] Implement the chosen facilitator session validation path for both protected API routes and admin server actions.
- [x] Define and enforce CSRF/origin posture for facilitator mutations and server actions.
- [x] Add participant redemption rate limiting or equivalent throttling protection for event-code attempts.
- [x] Extend e2e and authz tests to cover missing session, revoked grant, cross-instance denial, and admin action integrity checks.

Exit criteria:

- facilitator auth has one production source of truth
- request-integrity posture for facilitator writes is explicitly enforced
- participant event-code redemption has a bounded abuse path

### Phase 4: Implement privacy lifecycle and archive operations

Goal: make archive/export/retention behavior real rather than purely documented.

Tasks:
- [x] Define the minimum viable archive/export payload and where it is stored.
- [x] Implement the `instance_archives` runtime behavior and one operator-triggered archive path.
- [x] Implement participant-session and audit/monitoring retention behavior consistent with the schema and security docs.
- [x] Add one operator-safe export or archive verification path to the admin/API surface.
- [x] Verify that reset/closeout flows do not silently discard runtime data that should be archived first.
- [x] Add tests for archive creation, retention cleanup, and post-archive access behavior.

Exit criteria:

- one real archive/export flow exists
- retention behavior is encoded in code, not just docs
- reset and closeout operations have explicit archive semantics

### Phase 5: Enforce preview and shipping gates

Goal: make the documented production-readiness gates executable.

Tasks:
- [x] Add Playwright to CI for the critical participant + facilitator flow set.
- [x] Decide how Neon integration tests run in automation and wire the required secret/config path.
- [x] Add a protected-preview validation routine for DB/auth-sensitive changes.
- [x] Document and, where feasible, automate the Neon preview-branch workflow for runtime/schema changes.
- [x] Add lightweight runtime monitoring/alerting for server failures and auth anomalies.
- [x] Update runbook/deployment docs if implementation choices changed during earlier phases.

Exit criteria:

- critical browser flows run in CI
- DB-sensitive changes have an explicit preview/integration validation path
- the documented security/deployment gates are materially enforced

## Implementation Tasks

Dependency-ordered tracker for `$work`:

- [x] Review the architecture review and lock the Phase 1 sub-decision on whether team registry normalization is in scope now.
- [x] Build checkpoint and monitoring repositories plus file/Neon adapter parity.
- [x] Refactor read composition so normalized checkpoint/monitoring data still feeds existing route contracts.
- [x] Migrate participant session persistence to record-level operations and add race-condition tests.
- [x] Reduce broad facilitator write overwrite paths with entity-specific or versioned persistence.
- [x] Choose and implement the final facilitator auth/session model for production.
- [x] Add request-integrity protections for facilitator mutations and throttling for participant code redemption.
- [x] Implement archive/export/retention behavior against the dedicated runtime entities.
- [x] Wire CI/preview/runtime-alert gates and update operational docs where the implementation changed the contract.
- [x] Run a full verification pass and capture any remaining deferred architectural debt explicitly.

## Acceptance Criteria

- checkpoint and monitoring state no longer rely on `workshop_state` as their live write source
- participant session persistence is record-level and concurrency-tested
- at least the highest-impact facilitator writes no longer depend on blind full-document overwrite behavior
- facilitator auth has one production source of truth and explicit request-integrity rules
- archive/export/retention behavior exists in runnable code for the minimum supported lifecycle
- Playwright, integration, and preview-sensitive checks are wired strongly enough that documented release gates are not aspirational only
- a new `$work` pass can execute this plan without needing to rediscover the architecture-review findings

## Deferred Debt

- Team registry and several facilitator mutations still persist through the composed `workshop_state` projection. This is an explicit deferral, not an unknown risk, and should be the starting point for the next concurrency-hardening slice if team-level write contention becomes real.

## References

- Architecture review: [`2026-04-06-private-workshop-instance-architecture-review.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/2026-04-06-private-workshop-instance-architecture-review.md)
- Original build plan: [`2026-04-06-feat-private-workshop-instance-build-plan.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/plans/2026-04-06-feat-private-workshop-instance-build-plan.md)
- Runtime topology ADR: [`2026-04-06-private-workshop-instance-runtime-topology.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/adr/2026-04-06-private-workshop-instance-runtime-topology.md)
- Auth boundary ADR: [`2026-04-06-private-workshop-instance-auth-boundary.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/adr/2026-04-06-private-workshop-instance-auth-boundary.md)
- Deployment spec: [`private-workshop-instance-deployment-spec.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-deployment-spec.md)
- Security gates: [`private-workshop-instance-security-gates.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-security-gates.md)
