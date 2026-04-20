#!/usr/bin/env node
/**
 * Delete Neon Auth users created by Playwright Layer 3 runs. Test users
 * are minted with emails matching `pw-*@harness-lab-test.invalid` so a
 * pattern delete is safe.
 *
 * Reads HARNESS_DATABASE_URL from the environment OR
 * HARNESS_TEST_DATABASE_URL from dashboard/.env.test.local. Always
 * connects to the same branch the test run hit so the delete cascades
 * to participants linked via neon_user_id.
 *
 * Usage:
 *   node dashboard/scripts/cleanup-neon-auth-test-users.mjs
 *   node dashboard/scripts/cleanup-neon-auth-test-users.mjs --pattern 'pw-%'
 *
 * NOTE: Neon Auth's user store is per-project, not per-branch. The
 * users created by Playwright land in the project's auth store
 * regardless of which branch the runtime DB connection points at. The
 * branch fork only matters for the application schema (`participants`,
 * `workshop_instances`, etc.). So this script targets a stable
 * test-only email pattern that's guaranteed not to collide with real
 * users.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const envFile = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", ".env.test.local");
let envFromFile = {};
try {
  const raw = readFileSync(envFile, "utf8");
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match) envFromFile[match[1]] = match[2];
  }
} catch {
  // optional
}

const URL_FROM_ENV =
  process.env.HARNESS_DATABASE_URL ??
  process.env.HARNESS_TEST_DATABASE_URL ??
  envFromFile.HARNESS_TEST_DATABASE_URL;

if (!URL_FROM_ENV) {
  console.error("No database URL available. Run create-test-branch.mjs first.");
  process.exit(1);
}

const patternIndex = process.argv.indexOf("--pattern");
const PATTERN = patternIndex !== -1 ? process.argv[patternIndex + 1] : "pw-%@harness-lab-test.invalid";

const sql = neon(URL_FROM_ENV);

(async () => {
  // Defensive: refuse if the pattern is suspiciously broad. We never
  // want to wipe real users.
  if (!PATTERN.includes("@harness-lab-test.invalid") && !PATTERN.includes("@playwright.invalid")) {
    console.error(`refusing pattern "${PATTERN}" — must include a test-only email domain`);
    process.exit(2);
  }

  const beforeRows = (await sql.query(
    `SELECT id::text, email FROM neon_auth."user" WHERE email LIKE $1`,
    [PATTERN],
  ));
  if (beforeRows.length === 0) {
    console.log(`no users match pattern ${PATTERN} — nothing to delete`);
    return;
  }
  console.log(`found ${beforeRows.length} test user(s) matching ${PATTERN}`);

  // Unlink any participants pointing at these users so the FK on
  // participants.neon_user_id (no cascade) doesn't trip.
  await sql.query(
    `UPDATE participants
     SET neon_user_id = NULL, updated_at = NOW()
     WHERE neon_user_id IN (
       SELECT id::text FROM neon_auth."user" WHERE email LIKE $1
     )`,
    [PATTERN],
  );

  // Delete dependent better-auth rows where they exist.
  for (const table of ["session", "account", "verification"]) {
    await sql
      .query(
        `DELETE FROM neon_auth."${table}" WHERE "userId"::text IN (
           SELECT id::text FROM neon_auth."user" WHERE email LIKE $1
         )`,
        [PATTERN],
      )
      .catch(() => {});
  }

  await sql.query(`DELETE FROM neon_auth."user" WHERE email LIKE $1`, [PATTERN]);
  console.log(`deleted ${beforeRows.length} test user(s)`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
