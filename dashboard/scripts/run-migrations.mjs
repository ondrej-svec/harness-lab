import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Pool } from "@neondatabase/serverless";

const MIGRATIONS_TABLE = "_harness_schema_migrations";
const MIGRATION_ORDER = [
  "2026-04-06-private-workshop-instance-runtime.sql",
  "2026-04-06-facilitator-identity-simplification.sql",
  "2026-04-06-drop-facilitator-identities.sql",
  "2026-04-07-facilitator-cli-device-auth.sql",
  "2026-04-07-instance-lifecycle-and-agenda-authoring.sql",
];

function hasTable(snapshot, tableName) {
  return snapshot.tables.has(tableName);
}

function hasColumn(snapshot, tableName, columnName) {
  return snapshot.columns.get(tableName)?.has(columnName) ?? false;
}

function compareMigrationFilenames(left, right) {
  const leftIndex = MIGRATION_ORDER.indexOf(left);
  const rightIndex = MIGRATION_ORDER.indexOf(right);

  if (leftIndex !== -1 || rightIndex !== -1) {
    if (leftIndex === -1) {
      return 1;
    }

    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  }

  return left.localeCompare(right);
}

export function sortMigrationFilenames(filenames) {
  return [...filenames].sort(compareMigrationFilenames);
}

export function detectPreviouslyAppliedMigrations(snapshot) {
  const applied = [];
  const hasInstanceGrants = hasTable(snapshot, "instance_grants");
  const baseRuntimeApplied =
    hasTable(snapshot, "workshop_instances") &&
    hasInstanceGrants &&
    hasTable(snapshot, "participant_sessions");

  if (baseRuntimeApplied) {
    applied.push("2026-04-06-private-workshop-instance-runtime.sql");
  }

  const simplificationApplied =
    hasInstanceGrants &&
    (hasColumn(snapshot, "instance_grants", "neon_user_id") ||
      !hasColumn(snapshot, "instance_grants", "facilitator_identity_id"));

  if (simplificationApplied) {
    applied.push("2026-04-06-facilitator-identity-simplification.sql");
  }

  if (
    hasInstanceGrants &&
    !hasTable(snapshot, "facilitator_identities") &&
    !hasColumn(snapshot, "instance_grants", "facilitator_identity_id")
  ) {
    applied.push("2026-04-06-drop-facilitator-identities.sql");
  }

  if (hasTable(snapshot, "facilitator_device_auth") && hasTable(snapshot, "facilitator_cli_sessions")) {
    applied.push("2026-04-07-facilitator-cli-device-auth.sql");
  }

  if (
    hasColumn(snapshot, "workshop_instances", "blueprint_id") &&
    hasColumn(snapshot, "workshop_instances", "blueprint_version") &&
    hasColumn(snapshot, "workshop_instances", "imported_at") &&
    hasColumn(snapshot, "workshop_instances", "removed_at")
  ) {
    applied.push("2026-04-07-instance-lifecycle-and-agenda-authoring.sql");
  }

  return sortMigrationFilenames(applied);
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrationFilenames(client) {
  const result = await client.query(`SELECT filename FROM ${MIGRATIONS_TABLE}`);
  return new Set(result.rows.map((row) => row.filename));
}

async function migrationTrackerExists(client) {
  const result = await client.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
    [MIGRATIONS_TABLE],
  );

  return result.rows[0]?.exists === true;
}

async function getPublicSchemaSnapshot(client) {
  const [tableResult, columnResult] = await Promise.all([
    client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `),
    client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
    `),
  ]);

  const tables = new Set(tableResult.rows.map((row) => row.table_name));
  const columns = new Map();

  for (const row of columnResult.rows) {
    const tableColumns = columns.get(row.table_name) ?? new Set();
    tableColumns.add(row.column_name);
    columns.set(row.table_name, tableColumns);
  }

  return { tables, columns };
}

async function bootstrapAppliedMigrations(client) {
  const trackerExists = await migrationTrackerExists(client);

  if (trackerExists) {
    return;
  }

  await ensureMigrationsTable(client);

  const previouslyApplied = detectPreviouslyAppliedMigrations(await getPublicSchemaSnapshot(client));

  for (const filename of previouslyApplied) {
    await client.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING`,
      [filename],
    );
  }
}

export async function runMigrations({ client, migrationsDir }) {
  const filenames = sortMigrationFilenames(
    (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")),
  );

  if (filenames.length === 0) {
    console.log("No SQL migrations found.");
    return;
  }

  await bootstrapAppliedMigrations(client);
  await ensureMigrationsTable(client);

  const appliedFilenames = await getAppliedMigrationFilenames(client);
  const pendingFilenames = filenames.filter((filename) => !appliedFilenames.has(filename));

  if (pendingFilenames.length === 0) {
    console.log("No pending migrations.");
    return;
  }

  for (const filename of pendingFilenames) {
    const fullPath = path.join(migrationsDir, filename);
    const migrationSql = await readFile(fullPath, "utf8");

    console.log(`Applying migration: ${filename}`);

    try {
      await client.query("BEGIN");
      await client.query(migrationSql);
      await client.query(`INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1)`, [filename]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  console.log(`Applied ${pendingFilenames.length} migration file(s).`);
}

async function main() {
  const connectionString = process.env.HARNESS_DATABASE_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("HARNESS_DATABASE_URL or DATABASE_URL is required to run dashboard migrations.");
  }

  const pool = new Pool({ connectionString });
  const migrationsDir = path.join(process.cwd(), "db", "migrations");
  const client = await pool.connect();

  try {
    await runMigrations({ client, migrationsDir });
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await main();
}
