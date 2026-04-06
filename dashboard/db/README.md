# Dashboard Runtime Database

This directory holds the first private workshop-instance runtime schema for the dashboard.

## Storage Modes

- `HARNESS_STORAGE_MODE=file`
  Uses local file-backed adapters for demo and development.

- `HARNESS_STORAGE_MODE=neon`
  Uses the Neon-backed adapters and requires `HARNESS_DATABASE_URL` or `DATABASE_URL`.

## Apply The Schema

From the repository root:

```bash
psql "$HARNESS_DATABASE_URL" -f dashboard/db/migrations/2026-04-06-private-workshop-instance-runtime.sql
```

## Current Tables

- `workshop_instances`
- `participant_event_access`
- `participant_sessions`
- `facilitator_identities`
- `instance_grants`
- `monitoring_snapshots`
- `checkpoints`
- `instance_archives`
- `audit_log`

## Test Database

If you want to enable the skipped Neon integration tests, set:

```bash
HARNESS_TEST_DATABASE_URL=postgres://...
HARNESS_STORAGE_MODE=neon
```

The integration suite will bootstrap the schema into that database and clean up the sample instance records it creates.
