import { neon } from "@neondatabase/serverless";

export function getNeonSql() {
  const connectionString = process.env.HARNESS_DATABASE_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("HARNESS_DATABASE_URL or DATABASE_URL is required when HARNESS_STORAGE_MODE=neon");
  }

  return neon(connectionString);
}
