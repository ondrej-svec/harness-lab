---
title: "Facilitator admin production failures from runtime-state and Neon schema drift"
type: solution
date: 2026-04-20
domain: infrastructure
component: "dashboard facilitator admin + Neon runtime"
symptoms:
  - "Opening `/admin` after facilitator login crashed with `TypeError: Cannot read properties of undefined (reading 'revealed')`."
  - "Opening a facilitator instance page crashed with `NeonDbError: relation \"participant_feedback\" does not exist`."
  - "Production data changes alone did not fully clear admin failures while production was still serving an older dashboard build."
root_cause: "Production runtime state and Neon schema lagged behind the current dashboard contracts: some admin code assumed `workshop_state.rotation` existed, and the Neon database was missing the `participant_feedback` / `participant_poll_responses` tables used by current repositories."
severity: high
related:
  - "../../workshop-instance-runbook.md"
  - "../../../dashboard/lib/workshop-store.ts"
  - "../../../dashboard/db/migrations/2026-04-20-participant-feedback-and-polls.sql"
---

# Facilitator admin production failures from runtime-state and Neon schema drift

## Problem

Production facilitator admin hit two separate failures during the same incident window.

The first failure happened on the workspace admin surface after facilitator login:

- `/admin` crashed with `TypeError: Cannot read properties of undefined (reading 'revealed')`
- the server-side render path was reading `state.rotation.revealed`
- older runtime state rows could exist without a `rotation` object

The second failure happened when opening the recreated workshop instance:

- `/admin/instances/[id]` crashed with `NeonDbError: relation "participant_feedback" does not exist`
- the admin instance page loads participant feedback through the Neon repository
- production Neon did not yet contain the table that current code expected

This incident was confusing because production data and production code were out of sync in different ways at the same time:

- the target Brno workshop instance was recreated cleanly
- extra production instances were still present and could affect workspace behavior
- the database schema still lagged behind the current repo
- the production deployment had not yet picked up the code fix for legacy `rotation` normalization

## Root Cause

There were two verified root causes.

### 1. Legacy runtime-state contract drift

Older `workshop_instances.workshop_state` documents could exist without the `rotation` field. Current facilitator workspace rendering assumed `rotation.revealed` existed for every visible instance.

That mismatch created a server-render crash when `/admin` loaded instance cards for all visible workshops.

### 2. Missing Neon schema migration

The repo had live Neon repositories for:

- `participant_feedback`
- `participant_poll_responses`

but production Neon was missing those tables. The code path in [`dashboard/lib/participant-feedback-repository.ts`](../../../dashboard/lib/participant-feedback-repository.ts) queried `participant_feedback`, so opening the instance page failed immediately with relation `42P01`.

This was not a bad row. It was schema drift: the database was missing tables the application already depended on.

## Fix

The incident was resolved in layers.

### Code-side hardening

The read path in [`dashboard/lib/workshop-store.ts`](../../../dashboard/lib/workshop-store.ts) was updated to normalize missing or partial `rotation` state on read:

- backfill `revealed`
- backfill `scenario`
- backfill `slots`

A regression test was added for a legacy state missing `rotation`.

This prevents older workshop-state payloads from crashing the facilitator workspace once the fixed build is deployed.

### Production data cleanup

To reduce ambiguity during incident handling:

- the target production instance `developer-hackathon-brno-2026-04-21-dakar` was hard-deleted and recreated with the same metadata
- `os@ondrejsvec.com` was reattached as explicit `owner`
- all other production workshop instances were removed so only the active Brno instance remained visible

Important operational detail discovered during the incident:

- the normal app/API remove flow archives first, so it can still fail when the runtime contract is already broken
- soft-remove does **not** support immediate recreate with the same `instanceId`, because the row still exists and `createInstance()` treats it as existing
- when a clean same-ID recreate is required, a true database delete is a different operation with stronger destructive consequences

### Production schema repair

A new migration was added at [`dashboard/db/migrations/2026-04-20-participant-feedback-and-polls.sql`](../../../dashboard/db/migrations/2026-04-20-participant-feedback-and-polls.sql) to create:

- `participant_feedback`
- `participant_poll_responses`

including the unique index required by the poll-response upsert path.

That migration was then applied to production Neon and verified through:

- `_harness_schema_migrations`
- `information_schema.tables`

## Prevention

### 1. Treat runtime state as a versioned contract

If a persisted `workshop_state` field is added and server rendering depends on it, the read path must tolerate older rows until every environment is migrated or reset.

Practical rule:

- new persisted fields in `workshop_state` need read-time normalization
- add one regression test for a legacy state missing the new field

### 2. Keep Neon schema and repository code in the same slice

If a Neon repository references a table, the migration creating that table must land in the same work slice before production traffic reaches the code path.

Practical rule:

- no new `Neon*Repository` table reference without a checked-in migration
- before prod validation, confirm the migration tracker contains the expected filename

### 3. Data repair does not replace deployment

Recreating or repairing production rows can fix broken data, but it cannot fix old production code still serving an outdated render path.

Practical rule:

- if the symptom is a server-render exception, separate:
  - data compatibility
  - schema compatibility
  - deployment compatibility

### 4. Use a production sanity checklist for facilitator admin

Before a real workshop:

- list visible instances and ensure only intended workshops remain
- confirm required Neon tables exist for the active admin features
- confirm the deployed build includes any runtime-contract normalizers needed for legacy state

## Related

- [workshop-instance-runbook.md](../../workshop-instance-runbook.md)
- [workshop-store.ts](../../../dashboard/lib/workshop-store.ts)
- [2026-04-20-participant-feedback-and-polls.sql](../../../dashboard/db/migrations/2026-04-20-participant-feedback-and-polls.sql)
