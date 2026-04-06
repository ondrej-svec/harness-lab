#!/usr/bin/env npx tsx
/**
 * Create a facilitator user in Neon Auth with email + password.
 * Works even when public sign-up is disabled — temporarily enables it,
 * creates the user via the API, then disables sign-up again.
 *
 * Usage:
 *   NEON_AUTH_BASE_URL=https://... \
 *   HARNESS_DATABASE_URL=postgres://... \
 *     npx tsx scripts/create-facilitator.ts <name> <email> <password>
 *
 * The first facilitator to sign in on an empty instance auto-gets owner role.
 * No further linking or DB operations needed.
 */

import { neon } from "@neondatabase/serverless";

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.error("Usage: npx tsx scripts/create-facilitator.ts <name> <email> <password>");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Error: password must be at least 8 characters.");
  process.exit(1);
}

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const dbUrl = process.env.HARNESS_DATABASE_URL ?? process.env.DATABASE_URL;

if (!baseUrl) {
  console.error("Error: NEON_AUTH_BASE_URL is required.");
  process.exit(1);
}
if (!dbUrl) {
  console.error("Error: HARNESS_DATABASE_URL or DATABASE_URL is required.");
  process.exit(1);
}

const sql = neon(dbUrl);

async function main() {
  // 1. Temporarily enable sign-up
  await sql`UPDATE neon_auth.project_config SET email_and_password = jsonb_set(email_and_password, '{disableSignUp}', 'false')`;

  try {
    // 2. Create user via Neon Auth API
    console.log(`Creating user "${name}" (${email})...`);

    const response = await fetch(`${baseUrl}/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://harness-lab-dashboard.vercel.app",
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`Sign-up failed (${response.status}): ${(body as { message?: string }).message ?? JSON.stringify(body)}`);
    }

    const data = (await response.json()) as { user?: { id?: string } };
    const userId = data?.user?.id ?? "unknown";

    // 3. Set admin role
    await sql`UPDATE neon_auth."user" SET role = 'admin' WHERE id = ${userId}::uuid`;

    console.log(`✓ User created: ${userId}`);
    console.log(`  name:  ${name}`);
    console.log(`  email: ${email}`);
    console.log(`  role:  admin`);
    console.log();
    console.log("Next steps:");
    console.log("  1. Sign in at /admin/sign-in with this email and password");
    console.log("  2. First sign-in auto-grants 'owner' role on the current instance");
    console.log("  3. Add more facilitators from the admin UI");
  } finally {
    // 4. Always re-disable sign-up
    await sql`UPDATE neon_auth.project_config SET email_and_password = jsonb_set(email_and_password, '{disableSignUp}', 'true')`;
  }
}

main().catch((err) => {
  console.error("Failed:", err.message ?? err);
  process.exit(1);
});
