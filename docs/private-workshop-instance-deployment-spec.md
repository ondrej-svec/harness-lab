# Private Workshop-Instance Deployment and Promotion Spec

This document defines the production deployment model for the shared Harness Lab dashboard on Vercel with a private Neon-backed runtime layer.

## Canonical Layout

- one Vercel project for `dashboard/`
- one production Neon database for the private runtime layer
- one preview deployment per branch or pull request
- one corresponding preview database branch for schema and integration verification
- canonical production branch: `main`

## Environment Model

### Local

- local file-backed adapters remain acceptable for development
- local environment variables may point to a disposable local or preview-grade database when testing production adapters
- demo/sample data only

### Preview

- deploy the branch to a protected Vercel preview
- attach a Neon preview branch seeded with the required schema
- enable facilitator auth and preview protection before sharing the URL broadly
- use preview-safe secrets, never production credentials copied into ad hoc files
- current live bootstrap uses a schema-only Neon `preview` branch plus preview-scoped `HARNESS_DATABASE_URL` in Vercel; the official Neon integration is still optional follow-up, not a hard dependency for first go-live

### Production

- use the canonical shared Vercel project
- connect to the production Neon database
- allow only public-safe participant entry and authorized facilitator access paths
- hold the minimum required long-lived secrets in deployment configuration only

## Environment Variables

Environment variables should be grouped by purpose:

- database connection and migration configuration
- participant event access signing/session configuration
- facilitator auth/session configuration
- deployment protection and preview-only guards
- telemetry and alerting configuration

Rules:

- production and preview must not share signing secrets by accident
- environment values must be documented by name and purpose, not by copying live values into repo docs
- secret rotation procedures must exist for any credential that can unlock protected routes or private state

Operator matrix:

- [`private-workshop-instance-env-matrix.md`](private-workshop-instance-env-matrix.md)

## Neon Preview Branch Use

- each preview deployment gets a corresponding Neon preview branch when production adapters or schema behavior are touched
- schema migrations are applied to the preview branch first
- integration checks should validate schema compatibility, instance scoping, and auth-sensitive paths before promotion
- preview branches are disposable and should be pruned after merge to limit drift and cost

## Promotion Flow

## Bootstrap Commands

Initial operator bootstrap from the repository checkout:

```bash
cd dashboard
vercel project add harness-lab-dashboard --scope <vercel-scope>
vercel link --yes --project harness-lab-dashboard --scope <vercel-scope>
npm run db:migrate
```

After the project exists:

```bash
cd dashboard
vercel env add HARNESS_STORAGE_MODE preview
vercel env add HARNESS_DATABASE_URL preview
vercel env add HARNESS_WORKSHOP_INSTANCE_ID preview
vercel env add HARNESS_ADMIN_USERNAME preview
vercel env add HARNESS_ADMIN_PASSWORD preview
```

Repeat with `production` instead of `preview` for production-scoped values.

Notes:

- on Git-connected projects, `vercel env add ... preview` may prompt for a Git branch; leave it empty to apply the value to all preview branches
- `dashboard/vercel.json` pins the project framework to `nextjs` so deployments do not fall back to the generic static-site output contract

### Before preview creation

- required docs and ADRs for the change are merged or included in the branch
- relevant automated tests pass locally or in CI
- no real workshop data is present in tracked files
- preview migrations are applied through `cd dashboard && npm run db:migrate` against the preview-grade database path

### Preview validation

- deploy to preview
- verify schema or runtime changes against the Neon preview branch
- require the `Private Runtime Preview Gate` workflow to pass for DB/auth-sensitive pull requests
- run the required automated test layers
- perform exploratory browser inspection on critical participant and facilitator flows
- inspect logs for auth, database, and runtime errors

### Production promotion gate

All of these must be true:

- automated checks are green
- the production schema path has been applied through the documented migration command
- required human review completed for security-sensitive changes
- browser inspection completed on the preview
- rollback plan is confirmed
- no unresolved issues remain in auth, instance scoping, or private-data handling

### Post-promotion verification

- confirm deployment health
- verify participant entry still works for a safe test instance
- verify facilitator login and one read-only protected path
- inspect error logs and telemetry for regressions

## Rollback

- keep the previous production deployment available for fast Vercel rollback
- revert the application release if the issue is application-only
- restore or branch from the previous stable database state only through a deliberate runbook, never ad hoc during incident pressure
- revoke or rotate secrets if the rollback is triggered by credential exposure rather than code regression

## Secret Handling

- facilitator credentials, session signing keys, event-code secrets, and database credentials must stay in deployment configuration or secret storage
- raw event codes should be generated operationally and stored only in hashed form in the database
- preview environments must not expose protected routes without auth just because they are non-production

## Required Telemetry

- deployment status and rollback visibility
- authentication success/failure metrics
- authorization denial visibility
- server error rate and route-level failures
- database connectivity and migration failures
- suspicious spikes on redemption or protected-route access
