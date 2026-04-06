#!/usr/bin/env npx tsx
/**
 * Link a Neon Auth user to a facilitator identity.
 *
 * Usage:
 *   npx tsx scripts/link-facilitator.ts <neon-auth-user-id> <facilitator-username>
 *
 * Example:
 *   npx tsx scripts/link-facilitator.ts "abc123-def456" "facilitator"
 *
 * This updates the `auth_subject` column in `facilitator_identities`
 * so that the Neon Auth session resolves to the correct facilitator identity
 * and instance grants.
 *
 * Requires HARNESS_DATABASE_URL or DATABASE_URL.
 */

import { neon } from "@neondatabase/serverless";

const [userId, username] = process.argv.slice(2);

if (!userId || !username) {
  console.error("Usage: npx tsx scripts/link-facilitator.ts <neon-auth-user-id> <facilitator-username>");
  process.exit(1);
}

const connectionString = process.env.HARNESS_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: HARNESS_DATABASE_URL or DATABASE_URL is required.");
  process.exit(1);
}

const sql = neon(connectionString);

async function main() {
  const result = await sql`UPDATE facilitator_identities SET auth_subject = ${userId} WHERE username = ${username} RETURNING id, username, auth_subject`;

  if (result.length === 0) {
    console.error(`No facilitator identity found with username "${username}".`);
    console.error("Available identities:");
    const all = await sql`SELECT id, username, auth_subject FROM facilitator_identities`;
    for (const row of all) {
      console.error(`  ${row.id} — ${row.username} — subject: ${row.auth_subject ?? "(none)"}`);
    }
    process.exit(1);
  }

  const row = result[0];
  console.log(`✓ Linked Neon Auth user "${userId}" → facilitator "${row.username}" (id: ${row.id})`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
