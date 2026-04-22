# Private Workshop Runtime Environment Matrix

This document is the operator-facing source of truth for preview and production environment variables.

It intentionally names variables and purpose only. It must never contain live values.

## Principles

- `dashboard/.env.example` remains the local/demo bootstrap file
- Vercel Preview and Vercel Production must use separately scoped values
- preview must never point at the production Neon branch directly
- demo-only defaults such as `facilitator` / `secret` and the sample event code must not be reused outside local file mode

## Variable Matrix

| Variable | Local Demo | Preview | Production | Purpose | Read by |
|----------|------------|---------|------------|---------|---------|
| `HARNESS_STORAGE_MODE` | `file` by default, optional `neon` | `neon` | `neon` | Selects runtime adapter mode | `lib/runtime-storage.ts` |
| `HARNESS_DATABASE_URL` | optional for local Neon testing | required | required | Neon connection string for runtime repositories (or `DATABASE_URL`) | `lib/neon-db.ts` |
| `HARNESS_TEST_DATABASE_URL` | optional | optional in Vercel, required in GitHub Actions secrets for preview-grade integration tests | not required in Vercel runtime | Separate preview-grade test database used by CI | `lib/*.integration.test.ts` |
| `NEON_AUTH_BASE_URL` | not required (file mode uses Basic Auth fallback) | required | required | Neon Auth endpoint for facilitator identity | `lib/runtime-auth-configuration.ts` |
| `NEON_AUTH_COOKIE_SECRET` | not required (file mode uses Basic Auth fallback) | required | required | 32+ char secret for Neon Auth session cookie signing | `lib/runtime-auth-configuration.ts` |
| `HARNESS_EVENT_CODE_SECRET` | not required | **required** (≥32 chars) | **required** (≥32 chars) | HMAC key used to hash participant event codes at rest | `lib/participant-event-access-repository.ts` |
| `NEON_API_KEY` | not required | **required** for participant account creation | **required** for participant account creation | Neon control-plane bearer token — `lib/auth/admin-create-user.ts` mints participant Neon Auth users | `lib/auth/admin-create-user.ts` |
| `HARNESS_NEON_PROJECT_ID` | not required | **required** when `NEON_API_KEY` is set | **required** when `NEON_API_KEY` is set | Target Neon project for participant auth writes. Format `broad-smoke-NNNNNNNN` | `lib/auth/admin-create-user.ts`, `playwright.neon.config.ts`, `scripts/create-test-branch.mjs`, `scripts/delete-test-branch.mjs`, `e2e/neon-mode/fixtures.ts` |
| `HARNESS_NEON_BRANCH_ID` | not required | **required** when `NEON_API_KEY` is set | **required** when `NEON_API_KEY` is set | Target Neon branch (usually the production branch). Format `br-<name>-<suffix>` | `lib/auth/admin-create-user.ts`, `playwright.neon.config.ts`, `e2e/neon-mode/fixtures.ts` |
| `BLOB_READ_WRITE_TOKEN` | not required (file mode uses `HARNESS_DATA_DIR`) | **required** for cohort artifact uploads | **required** for cohort artifact uploads | Vercel Blob token for `harness workshop artifact upload` + authenticated serve route | `lib/blob-storage.ts` |
| `HARNESS_WORKSHOP_ACTIVE` | not applicable | not applicable | optional — set `true` to freeze deploys during a live workshop | Aborts the Vercel build before migrations + `next build` run. Flip off to thaw | `scripts/check-workshop-freeze.mjs` (buildCommand) |
| `HARNESS_EVENT_CODE` | optional demo seed | optional bootstrap-only fallback, prefer DB-managed event access | optional bootstrap-only fallback, prefer DB-managed event access | Demo/bootstrap participant event code | `lib/workshop-store.ts` (seed only) |
| `HARNESS_EVENT_CODE_EXPIRES_AT` | optional | optional bootstrap-only fallback | optional bootstrap-only fallback | Demo/bootstrap event-code expiry | `lib/workshop-store.ts` (seed only) |
| `ARTIFACT_MAX_BYTES` | optional | optional | optional | Cap on uploaded artifact size in bytes. Defaults to 25 MiB | `lib/blob-storage.ts` |

## Current Auth Note

Facilitator auth uses Neon Auth (managed Better Auth) in production and preview. Preview and Production both need:

- `NEON_AUTH_BASE_URL` (from Neon Console → Branch → Auth → Configuration)
- `NEON_AUTH_COOKIE_SECRET` (generate with `openssl rand -base64 32`)

Those values must differ between Preview and Production.

In local file mode (`HARNESS_STORAGE_MODE=file`), the legacy Basic Auth fallback remains available and does not require Neon Auth credentials.

In Neon mode (`HARNESS_STORAGE_MODE=neon`), missing `NEON_AUTH_BASE_URL` or `NEON_AUTH_COOKIE_SECRET` is a deployment misconfiguration. The runtime must fail closed rather than silently reusing file-mode auth behavior.

`HARNESS_EVENT_CODE` remains optional in Neon mode, but it is now an explicit bootstrap input only. If it is absent, Neon mode does not auto-seed the sample event code.

## Preview Rules

- `HARNESS_STORAGE_MODE=neon`
- `HARNESS_DATABASE_URL` must target the Neon preview branch injected by the Vercel integration
- preview facilitator credentials must not match production credentials

## Production Rules

- `HARNESS_STORAGE_MODE=neon`
- `HARNESS_DATABASE_URL` must target the stable production Neon branch/database
- facilitator credentials must be production-only and rotated through deployment config, not source edits

## GitHub Actions Secrets

The current workflows require this secret in GitHub Actions:

- `HARNESS_TEST_DATABASE_URL`

Purpose:

- powers [`dashboard-ci.yml`](../.github/workflows/dashboard-ci.yml) optional Neon integration coverage
- powers [`private-runtime-preview-gate.yml`](../.github/workflows/private-runtime-preview-gate.yml) required preview-grade runtime verification

This secret should point to a preview-grade or disposable Neon database path, not the production branch.

## Migration Ownership

Application runtime env vars are not the migration path by themselves. Schema changes should be applied through the documented migration command path before preview validation and before production promotion.

See:

- [`dashboard/db/README.md`](../dashboard/db/README.md)
- [`private-workshop-instance-deployment-spec.md`](private-workshop-instance-deployment-spec.md)
