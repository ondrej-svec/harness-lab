import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";

const connectionString = process.env.HARNESS_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("HARNESS_DATABASE_URL or DATABASE_URL is required to run dashboard migrations.");
}

const pool = new Pool({ connectionString });
const migrationsDir = path.join(process.cwd(), "db", "migrations");
const filenames = (await readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .sort();

if (filenames.length === 0) {
  console.log("No SQL migrations found.");
  process.exit(0);
}

const client = await pool.connect();

try {
  for (const filename of filenames) {
    const fullPath = path.join(migrationsDir, filename);
    const migrationSql = await readFile(fullPath, "utf8");
    console.log(`Applying migration: ${filename}`);
    await client.query(migrationSql);
  }
} finally {
  client.release();
  await pool.end();
}

console.log(`Applied ${filenames.length} migration file(s).`);
