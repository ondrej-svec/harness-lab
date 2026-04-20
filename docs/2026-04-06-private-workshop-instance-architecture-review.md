# Harness Lab Dashboard — Private Workshop-Instance Architecture Review

Date: 2026-04-06
Author: Codex
Repo root: `..`
Audience: repo owner / future CTO handoff / operators shipping the private workshop-instance runtime

> **Superseded 2026-04-20:** the `HARNESS_WORKSHOP_INSTANCE_ID` singleton env
> var described here has been retired. Flat API routes now derive their
> instance from the participant session cookie or a required `instanceId`
> body/query param; admin facilitators moved under
> `/api/workshop/instances/{id}/facilitators`. See
> `docs/plans/2026-04-20-refactor-retire-current-workshop-instance-singleton-plan.md`.

## Assumed Constraints

This review assumes:

- a small AI-assisted technical team, not a dedicated platform org
- one shared dashboard deployment is still the right operating model
- the public repo must stay public-safe
- the current priority is production-capable workshop operations, not a general-purpose SaaS platform

These assumptions are consistent with [AGENTS.md](../AGENTS.md), the accepted ADRs, and the current implementation shape.

## Architecture Decision Records

| ADR | Options Considered | Recommendation | Why |
| --- | --- | --- | --- |
| Hosting boundary | Keep one shared Vercel project, split per-event deploys, or move to containers | Keep one shared Vercel project | Matches current code and the accepted topology ADR while keeping ops small |
| Runtime data model | Keep most live state in one `workshop_state` JSON blob or normalize private runtime tables for operational entities | Normalize operational records over time; keep `workshop_state` only as composed participant/facilitator view cache | Current JSON blob creates lost-update risk and prevents lifecycle-specific retention |
| Facilitator auth | Env Basic Auth, DB identity+grant only, or managed auth session layer | Move to one server-side facilitator session model backed by DB or managed auth; remove env-auth as primary gate | Current dual gate has two sources of truth |
| Participant access | Shared event code or participant accounts | Keep shared event code for v1 | Lowest-friction workshop entry and already reflected in code and ADRs |
| Background work | Keep everything synchronous or add a queue now | Stay synchronous for now, but isolate high-impact writes and archive/export flows behind explicit jobs later | Team simplicity matters, but current write model needs safer boundaries |
| Observability | CI-only, lightweight SaaS monitoring, or full platform stack | Add lightweight error + audit visibility first | Current repo has CI and audit writes but no operational alert path |
| Preview data | Full-data Neon branching or schema-only / sanitized preview data | Prefer schema-only or sanitized preview data for real-event previews | Neon branching is powerful, but copied production-like data can violate the repo’s privacy posture if used carelessly |

## Executive Summary

Harness Lab’s private workshop-instance architecture is directionally correct but only partially landed. The repo now has explicit auth and runtime seams, Neon-backed adapters, participant session hashing, and CI/security workflows. However, the implementation still concentrates most mutable workshop state into a single JSON document, leaves several schema tables unused, and splits facilitator auth between environment-gated middleware and repository-backed grant checks.

The system is production-capable for low-concurrency, operator-driven workshops if used carefully, but it is not yet architecturally complete relative to its own ADRs. The highest-risk gaps are:

1. lost updates from whole-document read/modify/write state persistence
2. participant session churn caused by delete-and-reinsert session writes
3. partial data-model migration, where `monitoring_snapshots`, `checkpoints`, and `instance_archives` exist in schema but not in runtime behavior
4. facilitator auth still anchored to env Basic Auth for `/admin`, despite the DB identity/grant model
5. limited operational visibility: CI exists, but preview validation, Neon integration in CI, and runtime alerting are not wired

## Current Architecture

### Verified stack

- Next.js App Router on React 19 and TypeScript in [package.json](../dashboard/package.json)
- file-backed local adapters plus Neon-backed private runtime adapters selected by [runtime-storage.ts](../dashboard/lib/runtime-storage.ts)
- one shared workshop state service surface in [workshop-store.ts](../dashboard/lib/workshop-store.ts)
- participant event-code flow in [event-access.ts](../dashboard/lib/event-access.ts)
- facilitator grant checks in [facilitator-auth-service.ts](../dashboard/lib/facilitator-auth-service.ts)
- middleware gate for `/admin` in [middleware.ts](../dashboard/middleware.ts)

### Verified route/auth matrix

| Method | Path | Auth | Verified source |
| --- | --- | --- | --- |
| `GET` | `/api/briefs` | none | [route.ts](../dashboard/app/api/briefs/route.ts) |
| `GET` | `/api/challenges` | none | [route.ts](../dashboard/app/api/challenges/route.ts) |
| `GET` | `/api/agenda` | none | [route.ts](../dashboard/app/api/agenda/route.ts) |
| `PATCH` | `/api/agenda` | facilitator | [route.ts](../dashboard/app/api/agenda/route.ts) |
| `GET` | `/api/rotation` | none | [route.ts](../dashboard/app/api/rotation/route.ts) |
| `PATCH` | `/api/rotation` | facilitator | [route.ts](../dashboard/app/api/rotation/route.ts) |
| `GET` | `/api/workshop` | none | [route.ts](../dashboard/app/api/workshop/route.ts) |
| `POST` | `/api/workshop` | facilitator | [route.ts](../dashboard/app/api/workshop/route.ts) |
| `GET` | `/api/checkpoints` | participant session | [route.ts](../dashboard/app/api/checkpoints/route.ts) |
| `POST` | `/api/checkpoints` | facilitator | [route.ts](../dashboard/app/api/checkpoints/route.ts) |
| `GET` | `/api/event-context/core` | participant session | [route.ts](../dashboard/app/api/event-context/core/route.ts) |
| `GET` | `/api/event-context/teams` | participant session | [route.ts](../dashboard/app/api/event-context/teams/route.ts) |
| `GET` | `/api/teams` | participant session | [route.ts](../dashboard/app/api/teams/route.ts) |
| `POST` | `/api/admin/teams` | facilitator | [route.ts](../dashboard/app/api/admin/teams/route.ts) |
| `PATCH` | `/api/admin/teams` | facilitator | [route.ts](../dashboard/app/api/admin/teams/route.ts) |
| `GET` | `/api/monitoring` | facilitator | [route.ts](../dashboard/app/api/monitoring/route.ts) |
| `POST` | `/api/monitoring` | facilitator | [route.ts](../dashboard/app/api/monitoring/route.ts) |
| `POST` | `/api/challenges/[id]/complete` | facilitator | [route.ts](../dashboard/app/api/challenges/[id]/complete/route.ts) |
| `POST` | `/api/event-access/redeem` | none | [route.ts](../dashboard/app/api/event-access/redeem/route.ts) |
| `POST` | `/api/event-access/logout` | participant session cookie | [route.ts](../dashboard/app/api/event-access/logout/route.ts) |
| page + server actions | `/admin` | env Basic Auth at middleware + facilitator check in actions | [page.tsx](../dashboard/app/admin/page.tsx), [middleware.ts](../dashboard/middleware.ts), [facilitator-access.ts](../dashboard/lib/facilitator-access.ts) |

### Verified data flow

Current runtime flow is:

1. resolve `instance_id` from environment via [instance-context.ts](../dashboard/lib/instance-context.ts)
2. read or seed workshop state through [workshop-state-repository.ts](../dashboard/lib/workshop-state-repository.ts)
3. participant routes validate a hashed session through [event-access.ts](../dashboard/lib/event-access.ts)
4. facilitator routes validate username/password against identity + instance grant through [facilitator-auth-service.ts](../dashboard/lib/facilitator-auth-service.ts)
5. most mutations still modify the same `WorkshopState` object in [workshop-store.ts](../dashboard/lib/workshop-store.ts)

## Security

### What is now materially better

- participant session cookies store opaque tokens while persistence uses `token_hash`, not raw tokens, in [event-access.ts](../dashboard/lib/event-access.ts) and [event-access-repository.ts](../dashboard/lib/event-access-repository.ts)
- facilitator API routes are now explicitly protected instead of depending on one mixed route surface
- CI includes dependency review, CodeQL, and secret scanning in [.github/workflows/dependency-review.yml](../.github/workflows/dependency-review.yml), [.github/workflows/codeql.yml](../.github/workflows/codeql.yml), and [.github/workflows/secret-scan.yml](../.github/workflows/secret-scan.yml)

### Verified gaps

#### 1. Dual facilitator auth sources still exist

The accepted auth ADR says facilitator identity should be global and grants should authorize per instance. In practice, `/admin` still depends first on environment Basic Auth in [middleware.ts](../dashboard/middleware.ts), while API and server actions then depend on the DB-backed auth service in [facilitator-auth-service.ts](../dashboard/lib/facilitator-auth-service.ts).

Architectural consequence:

- admin page access has two sources of truth
- rotating DB credentials alone does not fully control `/admin`
- env fallback defaults (`facilitator` / `secret`) are acceptable only for demo mode, not production

#### 2. CSRF posture is still implicit, not engineered

There is no verified CSRF token or origin-checking layer across facilitator mutations or participant logout/redeem flows. The auth ADR explicitly called for cookie policy and CSRF posture to be specified before production use, but the repo currently relies on route-local checks only.

This is especially relevant because:

- facilitator mutations are POST/PATCH endpoints on the same origin
- server actions in [page.tsx](../dashboard/app/admin/page.tsx) are high-impact state writers
- Basic Auth and same-site cookies are not a complete CSRF strategy by themselves

#### 3. No rate limiting on participant code redemption

[event-access/redeem/route.ts](../dashboard/app/api/event-access/redeem/route.ts) and [event-access.ts](../dashboard/lib/event-access.ts) validate codes correctly, but there is no throttling or lockout path. The earlier event-access planning docs explicitly called out rate limiting; the implementation does not.

### Data exposure notes

The participant-safe teams lookup in [event-context/teams/route.ts](../dashboard/app/api/event-context/teams/route.ts) deliberately returns a minimized view. However, [teams/route.ts](../dashboard/app/api/teams/route.ts) returns full `Team` objects from [workshop-data.ts](../dashboard/lib/workshop-data.ts), including `members` and `projectBriefId`, to any participant session. That may be acceptable for workshop operations, but it is a broader disclosure surface than the participant-specific contract implies.

## Architecture Bottlenecks

### Bottleneck 1: Whole-document workshop-state persistence

Most stateful operations call [updateWorkshopState()](../dashboard/lib/workshop-store.ts), which:

1. reads the full `WorkshopState`
2. mutates one slice in memory
3. writes the entire document back

The Neon adapter persists that entire state blob into `workshop_instances.workshop_state` in [workshop-state-repository.ts](../dashboard/lib/workshop-state-repository.ts).

Compute profile:

- low CPU
- database I/O bound
- correctness constrained by concurrency, not raw throughput

Why this matters:

- concurrent facilitator writes can overwrite each other
- operational entities that should have separate retention and audit rules stay coupled
- schema tables such as `checkpoints` and `monitoring_snapshots` remain unused despite being created in [2026-04-06-private-workshop-instance-runtime.sql](../dashboard/db/migrations/2026-04-06-private-workshop-instance-runtime.sql)

Recommendation:

- move checkpoints, monitoring, and team registry writes to dedicated repositories first
- keep `workshop_state` as a composed read model or cached snapshot, not the only mutable source of truth

### Bottleneck 2: Participant session persistence is destructive under concurrency

The Neon session adapter in [event-access-repository.ts](../dashboard/lib/event-access-repository.ts) deletes all sessions for an instance, then reinserts the provided array.

Why this matters:

- two near-simultaneous participant redeems can race
- a validation refresh can overwrite a just-created or just-revoked session
- logout and redeem can interleave and lose one side’s intent

Recommendation:

- move participant session writes to record-level upsert/delete operations
- keep expiry cleanup separate from login/logout traffic

### Bottleneck 3: Monitoring and checkpoint architecture is only half migrated

The schema defines dedicated `monitoring_snapshots` and `checkpoints` tables in [2026-04-06-private-workshop-instance-runtime.sql](../dashboard/db/migrations/2026-04-06-private-workshop-instance-runtime.sql), but runtime writes still go through `workshop_state.monitoring` and `workshop_state.sprintUpdates` in [workshop-store.ts](../dashboard/lib/workshop-store.ts). [monitoring-snapshot-repository.ts](../dashboard/lib/monitoring-snapshot-repository.ts) is only a wrapper around `WorkshopState`.

Architectural consequence:

- retention rules described in [private-workshop-instance-schema.md](private-workshop-instance-schema.md) cannot actually be enforced at the entity level
- archive/export behavior is undefined because the modeled tables are not the live source of truth

### Bottleneck 4: Facilitator page auth remains middleware-coupled

`/admin` page access depends on [middleware.ts](../dashboard/middleware.ts) forwarding the header into `x-harness-authorization`, which [facilitator-access.ts](../dashboard/lib/facilitator-access.ts) then uses in server actions.

This is workable, but it couples security-critical behavior to a request-header hop instead of a first-class session model. It also means the architecture is still closer to “protected by Basic Auth plus DB checks” than to the accepted “separate facilitator identity plane.”

## Edge Cases and Failure Modes

### Drop-off Table

| Transition | What is persisted | What is lost if request fails here | Recovery path | Current risk |
| --- | --- | --- | --- | --- |
| Participant redeems event code | eventual participant session row(s) and audit record | issued session may be lost if concurrent save rewrites session set | re-enter code | medium |
| Participant session refresh on read | rewritten session set with updated `lastValidatedAt` | newer sessions can be lost during delete-and-reinsert race | re-enter code | medium |
| Facilitator updates checkpoint | full workshop-state document | another concurrent workshop mutation can be overwritten | manual re-entry | high |
| Facilitator reveals rotation | full workshop-state document | later checkpoint/team change can be lost or reveal flag can revert | repeat action if noticed | high |
| Facilitator registers team | full workshop-state document | team registry can be overwritten by another write path | manual re-entry | high |
| Monitoring update | full workshop-state document | monitoring snapshot history is collapsed to one latest array | no built-in replay | medium |
| Reset workshop | full workshop-state document reset from template | prior live state disappears without archive workflow in code | manual export before reset only | high |
| Archive/post-event closeout | no dedicated runtime implementation yet | structured historical data lifecycle is undefined | manual process outside code | high |

### Critical gap

The critical gap is not raw scale. It is **state integrity under concurrent writes**.

For a workshop control plane, the highest-likelihood failure is:

1. two facilitator or participant requests overlap
2. each reads a stale full state or stale session list
3. the later save silently overwrites the earlier save
4. operators only notice after state appears inconsistent

That failure mode will happen long before Vercel or Neon throughput limits become the real constraint.

## Data Architecture and GDPR

### Verified private data inventory

Private runtime data now includes:

- participant session hashes in [event-access-repository.ts](../dashboard/lib/event-access-repository.ts)
- participant event access hashes in [participant-event-access-repository.ts](../dashboard/lib/participant-event-access-repository.ts)
- facilitator identities in [facilitator-identity-repository.ts](../dashboard/lib/facilitator-identity-repository.ts)
- facilitator instance grants in [instance-grant-repository.ts](../dashboard/lib/instance-grant-repository.ts)
- workshop teams and member names embedded in [workshop-data.ts](../dashboard/lib/workshop-data.ts) and persisted as `workshop_state`

### Verified compliance posture

The repo now has good policy intent in:

- [private-workshop-instance-data-classification.md](private-workshop-instance-data-classification.md)
- [private-workshop-instance-schema.md](private-workshop-instance-schema.md)
- [public-launch-history-cleanup-plan.md](public-launch-history-cleanup-plan.md)

But the implementation still lacks:

- a data export path
- a delete/retention executor
- a verified archive path
- consent/privacy artifacts wired to an actual production workflow

Conclusion:

The repo is **privacy-aware by design docs**, but **not yet operationally complete for GDPR-grade lifecycle handling**.

## Operational Readiness

### What exists

- lint, unit test, and build automation in [dashboard-ci.yml](../.github/workflows/dashboard-ci.yml)
- supply-chain and code scanning in [dependency-review.yml](../.github/workflows/dependency-review.yml), [codeql.yml](../.github/workflows/codeql.yml), and [secret-scan.yml](../.github/workflows/secret-scan.yml)
- env-gated Neon integration test in [neon-runtime.integration.test.ts](../dashboard/lib/neon-runtime.integration.test.ts)

### What is still missing

- Playwright is not part of CI despite being a required gate in [private-workshop-instance-security-gates.md](private-workshop-instance-security-gates.md)
- Neon integration is not enforced in CI because the test is skipped without `HARNESS_TEST_DATABASE_URL`
- no runtime error monitoring or alert path is wired
- no admin tooling exists for archive/export/grant management beyond direct state mutation
- no preview automation is implemented for Neon branches, even though the deployment spec assumes it

## Platform Assumptions To Verify

These are external-platform assumptions, not code-verified facts:

- Vercel currently supports Deployment Protection that applies to Middleware, which matters because `/admin` security starts in Middleware: https://vercel.com/docs/deployment-protection
- Vercel Functions currently allow configurable per-route `maxDuration`, which matters if future facilitator operations grow into archive/export or AI-backed flows: https://vercel.com/docs/functions/configuring-functions/duration
- Neon supports copy-on-write database branching and Vercel preview integration, which aligns with the repo’s deployment spec: https://neon.com/docs/conceptual-guides/branching/ and https://neon.com/flow/branch-per-preview

Inference:

The chosen Vercel + Neon model still makes sense for this codebase, but preview branching should use sanitized or schema-only data when real workshop records exist.

## Execution Order

### Phase 1: Finish the runtime data migration

Effort: 1-2 days

Tasks:

1. move checkpoints to a dedicated repository backed by the `checkpoints` table
2. move monitoring writes to `monitoring_snapshots`
3. define whether team registry remains embedded or becomes its own table
4. keep `workshop_state` as a read model or cached snapshot

### Phase 2: Remove lost-update paths

Effort: 1 day

Tasks:

5. replace whole-array participant session rewrites with record-level upserts/deletes
6. add optimistic versioning or per-entity mutation paths for facilitator writes
7. add concurrency-focused tests for double-write scenarios

### Phase 3: Unify facilitator auth

Effort: 1 day

Tasks:

8. choose one facilitator auth source of truth
9. remove env Basic Auth as the primary production identity layer
10. keep middleware only as preview/deployment protection, not business auth
11. define explicit CSRF/origin posture for facilitator mutations

### Phase 4: Operationalize privacy and lifecycle

Effort: 1-2 days

Tasks:

12. implement archive/export flow against dedicated runtime entities
13. implement session and audit retention behavior
14. define delete/export support for private workshop records
15. document exactly what participant-visible data is acceptable

### Phase 5: Enforce shipping gates

Effort: 0.5-1 day

Tasks:

16. run Playwright in CI
17. add a protected-preview validation workflow
18. wire a lightweight production error monitor and alert target
19. decide whether Neon preview branches are required on every DB-touching PR or only selected ones

## Component Summary

| Component | Current state | Recommendation |
| --- | --- | --- |
| Vercel hosting | good fit | keep |
| Neon runtime | good fit | keep |
| Participant event-code model | coherent for v1 | keep |
| `workshop_state` blob | too central | reduce to read model / cache |
| Participant session repository | correct but concurrency-unsafe | refactor |
| Facilitator auth | improved but split | unify |
| CI security scanners | solid baseline | keep |
| Preview validation | documented, not automated | implement |
| Observability | minimal | add lightweight monitoring/alerting |

## Appendices

### A. Environment Variable Inventory

Verified from `process.env` reads in `dashboard/`:

- `HARNESS_ADMIN_PASSWORD`
- `HARNESS_ADMIN_USERNAME`
- `HARNESS_AUDIT_LOG_PATH`
- `HARNESS_DATA_DIR`
- `HARNESS_DATABASE_URL`
- `HARNESS_EVENT_ACCESS_PATH`
- `HARNESS_EVENT_CODE`
- `HARNESS_EVENT_CODE_EXPIRES_AT`
- `HARNESS_FACILITATOR_IDENTITIES_PATH`
- `HARNESS_STATE_PATH`
- `HARNESS_STORAGE_MODE`
- `HARNESS_TEST_DATABASE_URL`
- `HARNESS_WORKSHOP_INSTANCE_ID`
- `DATABASE_URL`

### B. Deliberately Not Added

This review does not recommend:

- Kubernetes
- a separate deploy per workshop
- participant accounts for v1
- a job queue before the write-model problems are fixed
- enterprise observability tooling before a minimal alertable baseline exists

The current architecture’s main problem is not missing platform sophistication. It is incomplete runtime normalization and correctness under concurrent writes.
