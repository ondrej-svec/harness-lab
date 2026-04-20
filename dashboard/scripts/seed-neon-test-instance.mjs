#!/usr/bin/env node
/**
 * Seed a workshop instance + roster on the Neon test branch for
 * Phase 5.6 Layer 3 Playwright runs. Read HARNESS_TEST_DATABASE_URL
 * from the environment (the create-test-branch script writes it into
 * dashboard/.env.test.local for you).
 *
 * What it seeds, idempotently:
 *   - one workshop instance (id from HARNESS_TEST_INSTANCE_ID, default
 *     `playwright-neon-mode`)
 *   - one event-code access row (HMAC-hashed) for the instance
 *   - a roster covering every disambiguator path:
 *       · "Jana Nováková" (unique name)
 *       · "Jan" with tag "bravo" + "Jan" with tag "charlie" (tag collision)
 *       · prefilled roster emails under the test-only
 *         `@harness-lab-test.invalid` domain
 *
 * Usage:
 *   node dashboard/scripts/seed-neon-test-instance.mjs [--reset]
 *
 * --reset wipes the instance row + cascading children before seeding.
 */

import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const envLocal = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", ".env.local");
let envFromFile = {};
try {
  const raw = readFileSync(envLocal, "utf8");
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match) envFromFile[match[1]] = match[2];
  }
} catch {
  // optional — env vars may already be in process.env
}

// Layer 3 e2e seeds the project's primary branch (Neon Auth's
// auth runtime is bound there — see playwright.neon.config.ts).
// Pin the instance id to one identifiable string so the cleanup
// script can target it without risk to real workshop data.
const DATABASE_URL = process.env.HARNESS_DATABASE_URL ?? envFromFile.HARNESS_DATABASE_URL;
const EVENT_CODE_SECRET =
  process.env.HARNESS_EVENT_CODE_SECRET ?? "playwright-event-code-secret-at-least-32-chars";
const INSTANCE_ID = process.env.HARNESS_TEST_INSTANCE_ID ?? "playwright-neon-mode";
const EVENT_CODE = process.env.HARNESS_TEST_EVENT_CODE ?? "lantern8-context4-handoff2";
const RESET = process.argv.includes("--reset");

if (!DATABASE_URL) {
  console.error("HARNESS_DATABASE_URL not set in env or dashboard/.env.local.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const SEED_RUN_ID = randomUUID().slice(0, 8);

function hashEventCode(code) {
  return createHmac("sha256", EVENT_CODE_SECRET).update(code).digest("hex");
}

// NOTE: schema enforces UNIQUE (instance_id, lower(display_name))
// WHERE archived_at IS NULL, so identical display names within one
// instance are impossible. The disambiguator code in
// lib/participant-disambiguator.ts handles equal-name groups but
// today's schema prevents them. Layer 3 covers the prefix-match
// suggest path with distinct names; collision-disambiguation is
// covered by lib/participant-disambiguator.test.ts only. See plan
// Phase 5.6 Layer 3 notes for the open design question.
const ROSTER = [
  { displayName: "Jana Nováková", email: null, tag: "bravo" },
  { displayName: "Jan Karel", email: null, tag: "charlie" },
  { displayName: "Jan Černý", email: `pw-prefilled-jan-${SEED_RUN_ID}@harness-lab-test.invalid`, tag: null },
  { displayName: "Tomáš Dvořák", email: `pw-prefilled-tomas-${SEED_RUN_ID}@harness-lab-test.invalid`, tag: null },
  { displayName: "Returner Already", email: `pw-prefilled-returner-${SEED_RUN_ID}@harness-lab-test.invalid`, tag: "returning" },
];

async function reset() {
  await sql.query(`DELETE FROM team_members WHERE instance_id = $1`, [INSTANCE_ID]).catch(() => {});
  await sql.query(`DELETE FROM teams WHERE instance_id = $1`, [INSTANCE_ID]).catch(() => {});
  await sql.query(`DELETE FROM participants WHERE instance_id = $1`, [INSTANCE_ID]).catch(() => {});
  await sql
    .query(`DELETE FROM participant_event_access WHERE instance_id = $1`, [INSTANCE_ID])
    .catch(() => {});
  await sql.query(`DELETE FROM workshop_instances WHERE id = $1`, [INSTANCE_ID]).catch(() => {});
  console.log(`reset: cleared instance ${INSTANCE_ID}`);
}

async function seed() {
  const now = new Date().toISOString();
  await sql.query(
    `INSERT INTO workshop_instances (id, template_id, workshop_meta, workshop_state, status, allow_walk_ins)
     VALUES ($1, 'playwright', '{}'::jsonb, '{}'::jsonb, 'prepared', true)
     ON CONFLICT (id) DO NOTHING`,
    [INSTANCE_ID],
  );

  await sql.query(
    `INSERT INTO participant_event_access (id, instance_id, version, code_hash, expires_at)
     VALUES ($1, $2, 1, $3, NOW() + interval '1 day')
     ON CONFLICT DO NOTHING`,
    [`access-${randomUUID()}`, INSTANCE_ID, hashEventCode(EVENT_CODE)],
  );

  for (const entry of ROSTER) {
    await sql.query(
      `INSERT INTO participants
         (id, instance_id, display_name, email, email_opt_in, tag, neon_user_id,
          created_at, updated_at, archived_at)
       VALUES ($1, $2, $3, $4, false, $5, NULL, $6, $6, NULL)
       ON CONFLICT (id) DO NOTHING`,
      [`p-${randomUUID().slice(0, 8)}`, INSTANCE_ID, entry.displayName, entry.email, entry.tag, now],
    );
  }

  console.log(`seed: instance ${INSTANCE_ID} + ${ROSTER.length} participants + 1 event code`);
  console.log(`event code: ${EVENT_CODE}`);
}

(async () => {
  if (RESET) await reset();
  await seed();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
