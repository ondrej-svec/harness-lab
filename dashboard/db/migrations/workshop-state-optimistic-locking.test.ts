import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

describe("2026-04-08 workshop state optimistic locking migration", () => {
  it("adds a non-destructive state_version column to workshop_instances", async () => {
    const migrationPath = path.join(
      process.cwd(),
      "db/migrations/2026-04-08-workshop-state-optimistic-locking.sql",
    );
    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain("ALTER TABLE workshop_instances");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS state_version");
    expect(sql.toUpperCase()).not.toContain("DROP TABLE WORKSHOP_INSTANCES");
  });
});
