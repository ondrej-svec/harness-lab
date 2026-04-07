import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

describe("2026-04-07 instance lifecycle migration", () => {
  it("adds the lifecycle columns to workshop_instances without destructive table changes", async () => {
    const migrationPath = path.join(
      process.cwd(),
      "db/migrations/2026-04-07-instance-lifecycle-and-agenda-authoring.sql",
    );
    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain("ALTER TABLE workshop_instances");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS blueprint_id");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS blueprint_version");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS imported_at");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS removed_at");
    expect(sql.toUpperCase()).not.toContain("DROP TABLE WORKSHOP_INSTANCES");
  });
});
