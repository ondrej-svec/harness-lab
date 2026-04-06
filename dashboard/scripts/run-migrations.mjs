import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.HARNESS_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("HARNESS_DATABASE_URL or DATABASE_URL is required to run dashboard migrations.");
}

const sql = neon(connectionString);
const migrationsDir = path.join(process.cwd(), "db", "migrations");
const filenames = (await readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .sort();

if (filenames.length === 0) {
  console.log("No SQL migrations found.");
  process.exit(0);
}

for (const filename of filenames) {
  const fullPath = path.join(migrationsDir, filename);
  const migrationSql = await readFile(fullPath, "utf8");
  console.log(`Applying migration: ${filename}`);
  await sql.query(migrationSql);
}

console.log(`Applied ${filenames.length} migration file(s).`);
