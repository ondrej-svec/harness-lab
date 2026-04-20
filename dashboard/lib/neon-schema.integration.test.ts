/**
 * Schema-drift probe — runs against a Neon test branch (never main).
 *
 * Validates that the columns the participant-auth flow relies on actually
 * exist in:
 *   - neon_auth."user"  (managed by the Neon Auth service)
 *   - public.participants  (managed by our migrations)
 *   - public.workshop_instances  (managed by our migrations)
 *
 * Skipped unless HARNESS_TEST_DATABASE_URL is set — see
 * dashboard/scripts/create-test-branch.mjs and the "Test Isolation"
 * section in docs/dashboard-testing-strategy.md.
 *
 * Read-only on the database. Safe to run on any branch.
 */

import { neon } from "@neondatabase/serverless";
import { beforeAll, describe, expect, it } from "vitest";

const TEST_URL = process.env.HARNESS_TEST_DATABASE_URL;
const ENABLED = Boolean(TEST_URL);
const describeIntegration = ENABLED ? describe : describe.skip;

type SqlClient = ReturnType<typeof neon>;

type ColumnRow = { column_name: string; data_type: string; is_nullable?: string; column_default?: string | null };

async function readColumns(sql: SqlClient, schema: string, table: string) {
  const rows = (await sql.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [schema, table],
  )) as ColumnRow[];
  return new Map(rows.map((r) => [r.column_name, r] as const));
}

describeIntegration("schema drift (integration · neon test branch)", () => {
  let sql: SqlClient;

  beforeAll(() => {
    sql = neon(TEST_URL!);
  });

  it("neon_auth.user has the columns participant-auth depends on", async () => {
    const cols = await readColumns(sql, "neon_auth", "user");
    expect(cols.get("id")?.data_type).toBe("uuid");
    expect(cols.get("name")?.data_type).toBe("text");
    expect(cols.get("email")?.data_type).toBe("text");
    expect(cols.get("emailVerified")?.data_type).toBe("boolean");
    expect(cols.get("role")?.data_type).toBe("text");
  });

  it("public.participants has neon_user_id (text, nullable) added by 2026-04-20-participant-auth.sql", async () => {
    const cols = await readColumns(sql, "public", "participants");
    const neonUserId = cols.get("neon_user_id");
    expect(neonUserId).toBeDefined();
    expect(neonUserId?.data_type).toBe("text");
    expect(neonUserId?.is_nullable).toBe("YES");
  });

  it("public.workshop_instances has allow_walk_ins (boolean, default true)", async () => {
    const cols = await readColumns(sql, "public", "workshop_instances");
    const allow = cols.get("allow_walk_ins");
    expect(allow).toBeDefined();
    expect(allow?.data_type).toBe("boolean");
    expect(allow?.column_default).toBe("true");
  });

  it("the unique index on participants.neon_user_id exists", async () => {
    const rows = (await sql.query(
      `SELECT indexname, indexdef FROM pg_indexes
       WHERE schemaname = 'public' AND tablename = 'participants'
         AND indexdef ILIKE '%neon_user_id%'`,
    )) as Array<{ indexname: string; indexdef: string }>;
    expect(rows.length).toBeGreaterThan(0);
    const hasUnique = rows.some((r) => r.indexdef.toUpperCase().includes("UNIQUE"));
    expect(hasUnique).toBe(true);
  });
});
