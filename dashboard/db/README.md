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
cd dashboard
npm run db:migrate
```

The migration runner applies every pending `.sql` file in `dashboard/db/migrations/` using `HARNESS_DATABASE_URL` or `DATABASE_URL`.
Known legacy migrations run in a pinned compatibility order before any later filename-sorted additions.
It records applied filenames in `_harness_schema_migrations`, so repeat deploys only run pending migrations.

## Current Tables

- `workshop_instances`
- `participant_event_access`
- `participant_sessions`
- `participant_redeem_attempts`
- `instance_grants`
- `teams`
- `monitoring_snapshots`
- `checkpoints`
- `instance_archives`
- `audit_log`
- `facilitator_device_auth`
- `facilitator_cli_sessions`

## Test Database

If you want to enable the skipped Neon integration tests, set:

```bash
HARNESS_TEST_DATABASE_URL=postgres://...
HARNESS_STORAGE_MODE=neon
```

The integration suite will bootstrap the schema into that database and clean up the sample instance records it creates.

## Deployment Notes

- `dashboard/vercel.json` runs `npm run db:migrate` before `npm run build`, so preview and production deployments fail closed if the target Neon branch cannot accept the pending schema.
- Preview migrations should be applied against the Neon preview branch before preview validation.
- Production migrations should be applied through the same command path before or during the first production release, according to the current deployment runbook.
- Do not point the migration runner at a production branch from a preview deployment.
