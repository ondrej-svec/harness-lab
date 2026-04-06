# Private Workshop Runtime Environment Matrix

This document is the operator-facing source of truth for preview and production environment variables.

It intentionally names variables and purpose only. It must never contain live values.

## Principles

- `dashboard/.env.example` remains the local/demo bootstrap file
- Vercel Preview and Vercel Production must use separately scoped values
- preview must never point at the production Neon branch directly
- demo-only defaults such as `facilitator` / `secret` and the sample event code must not be reused outside local file mode

## Variable Matrix

| Variable | Local Demo | Preview | Production | Purpose |
|----------|------------|---------|------------|---------|
| `HARNESS_STORAGE_MODE` | `file` by default, optional `neon` | `neon` | `neon` | Selects runtime adapter mode |
| `HARNESS_WORKSHOP_INSTANCE_ID` | required sample or disposable instance id | required preview-safe instance id | required production-safe instance id | Default workshop instance context |
| `HARNESS_DATABASE_URL` | optional for local Neon testing | required | required | Neon connection string for runtime repositories |
| `HARNESS_TEST_DATABASE_URL` | optional | optional in Vercel, required in GitHub Actions secrets for preview-grade integration tests | not required in Vercel runtime | Separate preview-grade test database used by CI |
| `NEON_AUTH_BASE_URL` | not required (file mode uses Basic Auth fallback) | required | required | Neon Auth endpoint for facilitator identity |
| `NEON_AUTH_COOKIE_SECRET` | not required (file mode uses Basic Auth fallback) | required | required | 32+ char secret for Neon Auth session cookie signing |
| `HARNESS_EVENT_CODE` | optional demo seed | optional bootstrap-only fallback, prefer DB-managed event access | optional bootstrap-only fallback, prefer DB-managed event access | Demo/bootstrap participant event code |
| `HARNESS_EVENT_CODE_EXPIRES_AT` | optional | optional bootstrap-only fallback | optional bootstrap-only fallback | Demo/bootstrap event-code expiry |

## Current Auth Note

Facilitator auth uses Neon Auth (managed Better Auth) in production and preview. Preview and Production both need:

- `NEON_AUTH_BASE_URL` (from Neon Console → Branch → Auth → Configuration)
- `NEON_AUTH_COOKIE_SECRET` (generate with `openssl rand -base64 32`)

Those values must differ between Preview and Production.

In local file mode (`HARNESS_STORAGE_MODE=file`), the legacy Basic Auth fallback remains available and does not require Neon Auth credentials.

## Preview Rules

- `HARNESS_STORAGE_MODE=neon`
- `HARNESS_DATABASE_URL` must target the Neon preview branch injected by the Vercel integration
- preview facilitator credentials must not match production credentials
- preview `HARNESS_WORKSHOP_INSTANCE_ID` should point at a sanitized or disposable instance

## Production Rules

- `HARNESS_STORAGE_MODE=neon`
- `HARNESS_DATABASE_URL` must target the stable production Neon branch/database
- facilitator credentials must be production-only and rotated through deployment config, not source edits
- the production instance id should refer to a real runtime-managed workshop instance, not a sample seed id

## GitHub Actions Secrets

The current workflows require this secret in GitHub Actions:

- `HARNESS_TEST_DATABASE_URL`

Purpose:

- powers [`dashboard-ci.yml`](/Users/ondrejsvec/projects/Bobo/harness-lab/.github/workflows/dashboard-ci.yml) optional Neon integration coverage
- powers [`private-runtime-preview-gate.yml`](/Users/ondrejsvec/projects/Bobo/harness-lab/.github/workflows/private-runtime-preview-gate.yml) required preview-grade runtime verification

This secret should point to a preview-grade or disposable Neon database path, not the production branch.

## Migration Ownership

Application runtime env vars are not the migration path by themselves. Schema changes should be applied through the documented migration command path before preview validation and before production promotion.

See:

- [`dashboard/db/README.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/db/README.md)
- [`private-workshop-instance-deployment-spec.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-deployment-spec.md)
