# Migration Policy

Scope: DDL + data migrations under `dashboard/db/migrations/`. Applies to every new migration from 2026-04-22 onward.

## Rules

1. **Forward-only.** No DOWN sections. If a migration turns out to be wrong, write a new forward migration that corrects it. Do not edit a merged migration in place and do not add a reverse step.
2. **Expand → contract.** Structural changes that drop or rename come in at least two migrations across at least two deploys:
   - **Expand:** add the new column / table / constraint alongside the old. Deploy. Let production bake in.
   - **Contract:** once all readers and writers use the new shape, drop the old one in a follow-up migration.
3. **Same-slice migration + code.** The code that reads or writes the new shape ships in the same commit as the migration that adds it. Never merge a migration without the code that uses it (dead schema rots) or code without its migration (runtime 500s).
4. **Filename sort is ordering.** New migrations are timestamped by date and filename-sorted by the runner (`dashboard/scripts/run-migrations.mjs`). `MIGRATION_ORDER` files from the legacy era are not required for new work.
5. **`IF NOT EXISTS` on every CREATE, `IF EXISTS` on every DROP.** Migrations run on fresh databases (CI, new self-hoster) and on production. Idempotent statements keep both paths green.
6. **Backfills run in the migration, not in a separate one-shot.** If a new column needs values computed from existing rows, do it in the same SQL file with a single `UPDATE` after the `ALTER TABLE`. Long-running backfills (>30s) belong in a background job, not a migration.
7. **No destructive drops without a preceding expand.** Dropping a column or table in isolation is an expand-skipped operation and is not permitted. The one exception: adding then dropping a diagnostic column within the same migration (e.g., if you added it by mistake minutes earlier on `main` and want to undo it forward).

## Why forward-only?

The existing 21 migrations have zero DOWN sections. Most are structurally irreversible (column drops with backfills, NOT NULL constraint additions, index drops). Adding DOWN sections to new migrations only would create a split policy where half the migrations can be rolled back and half can't — giving contributors a false sense of reversibility.

Production databases don't roll back anyway. "Rollback a bad migration" in practice means "stop the bleeding with a new forward migration." The policy just writes that down so future contributors don't waste time writing DOWN sections that will never run.

## Checklist for authoring a migration

- [ ] File named `YYYY-MM-DD-<slug>.sql` in `dashboard/db/migrations/`
- [ ] Every `CREATE TABLE` uses `IF NOT EXISTS`; every `CREATE INDEX` uses `IF NOT EXISTS`; every `DROP` uses `IF EXISTS`
- [ ] If adding a column that will be NOT NULL: add nullable first, backfill, add the constraint in a follow-up migration
- [ ] Code that reads or writes the new shape is in the same commit
- [ ] If this corrects a prior migration, the commit message names the migration being corrected
- [ ] Integration tests pass against a fresh test branch (`HARNESS_TEST_DATABASE_URL` set)

## Cross-references

- `dashboard/db/README.md` — the runner + how to apply migrations locally
- `docs/internal-harness.md` — maintainer-facing map; links here from the schema section
- `dashboard/AGENTS.md` — subtree rules for dashboard contributors
