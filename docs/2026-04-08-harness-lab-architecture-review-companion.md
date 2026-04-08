# 2026-04-08 Architecture Review Companion

This note is the repo-verified companion to [`2026-04-08-harness-lab-architecture-review.md`](2026-04-08-harness-lab-architecture-review.md).

Use this file as the implementation source of truth when the review and the code disagree.

## Purpose

The coworker review surfaced several real issues, but some recommended remediations were too broad or aimed at the wrong runtime seams. This companion keeps the valuable findings while correcting the backlog to match the actual repository.

## Shipped In This Follow-Up

- Added baseline security headers in [`dashboard/next.config.ts`](../dashboard/next.config.ts).
- Narrowed anonymous `GET /api/workshop` to a public-safe projection in [`dashboard/app/api/workshop/route.ts`](../dashboard/app/api/workshop/route.ts).
- Made Neon facilitator auth fail closed on incomplete managed-auth config through [`dashboard/lib/runtime-auth-configuration.ts`](../dashboard/lib/runtime-auth-configuration.ts), [`dashboard/lib/facilitator-auth-service.ts`](../dashboard/lib/facilitator-auth-service.ts), [`dashboard/lib/facilitator-access.ts`](../dashboard/lib/facilitator-access.ts), and [`dashboard/lib/facilitator-session.ts`](../dashboard/lib/facilitator-session.ts).
- Stopped automatic sample event-code seeding in Neon mode unless `HARNESS_EVENT_CODE` is explicitly configured in [`dashboard/lib/participant-event-access-repository.ts`](../dashboard/lib/participant-event-access-repository.ts).
- Added optimistic locking for shared `workshop_state` writes via `state_version` in [`dashboard/lib/workshop-state-repository.ts`](../dashboard/lib/workshop-state-repository.ts) and [`dashboard/db/migrations/2026-04-08-workshop-state-optimistic-locking.sql`](../dashboard/db/migrations/2026-04-08-workshop-state-optimistic-locking.sql).
- Standardized retryable `409 workshop_state_conflict` responses for facilitator mutations through [`dashboard/lib/workshop-mutation-response.ts`](../dashboard/lib/workshop-mutation-response.ts).
- Added a minimal operator-visible app error boundary in [`dashboard/app/global-error.tsx`](../dashboard/app/global-error.tsx).

## Corrected Recommendations

### 1. Neon fail-closed depends on managed auth config, not Basic Auth env vars

Do not treat `HARNESS_ADMIN_PASSWORD` as the Neon-mode readiness gate.

The real Neon runtime seam is:

- `HARNESS_STORAGE_MODE=neon`
- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_COOKIE_SECRET`

If Neon mode is selected and those managed-auth values are incomplete, the runtime must fail closed rather than silently reusing file-mode Basic Auth behavior.

### 2. Public `GET /api/workshop` must stay public-safe

The prior route exposed full workshop instance records, not just ids. The correct fix was to narrow the anonymous payload, not merely filter instances by status.

Facilitator-grade instance data belongs on facilitator-protected routes such as `/api/workshop/instances`.

### 3. No anonymous diagnostic health payload is required right now

This follow-up does not add a new public `/api/health` endpoint.

Current decision:

- anonymous runtime diagnostics are not required for workshop operation
- if uptime checks are added later, the anonymous contract must stay minimal
- storage mode, instance ids, and DB diagnostics must not be exposed publicly

### 4. Sample event-code seeding remains local/demo behavior

File mode still supports sample/demo bootstrap behavior.

Neon mode now only seeds participant event access when an explicit `HARNESS_EVENT_CODE` is provided. There is no silent production-like fallback to the sample code.

## Explicit Deferrals

### Repository bulk-replace safety

`replaceTeams()` and `replaceCheckpoints()` remain adjacent debt, not part of the owner-row optimistic-locking slice shipped here.

Reason:

- the high-risk live overwrite path was the shared `workshop_state` document
- bulk-replace repositories need their own transactional design, not an incidental partial fix

### Device-auth throttling

The open write surface is still `POST /api/auth/device/start`.

This follow-up documents that risk but defers a durable throttle implementation because:

- approval is already tied to a facilitator session
- a weak in-memory limiter would not be a reliable production control
- a proper solution should use a dedicated durable attempt store or platform edge controls

Until then, treat device-auth abuse monitoring as an operational concern and keep the route under preview/protected deployment assumptions where possible.

### Explicit `tsc --noEmit` in CI

No CI change shipped in this pass.

Reason:

- `next build` already provides TypeScript coverage in the dashboard CI path
- adding `tsc --noEmit` is optional signal improvement, not a correctness gap blocker

## Verification Notes

The follow-up was verified with focused Vitest coverage for:

- public workshop-route contract
- Neon auth fail-closed behavior
- participant event-access bootstrap behavior
- workshop-state optimistic-lock conflicts and route responses

See also:

- [`docs/plans/2026-04-08-fix-architecture-review-follow-up-plan.md`](plans/2026-04-08-fix-architecture-review-follow-up-plan.md)
