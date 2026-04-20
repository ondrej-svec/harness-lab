/**
 * Shared fixtures for the Neon-mode Playwright suite (Phase 5.6 Layer 3).
 *
 * Each spec begins by re-seeding the test branch so it starts from a
 * known-good state. Test users go through Neon Auth and land in the
 * project's auth store; cleanup-neon-auth-test-users.mjs sweeps them
 * after the run.
 */

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { test as base, expect, type BrowserContext, type Page } from "@playwright/test";

export const EVENT_CODE = "lantern8-context4-handoff2";
export const INSTANCE_ID = "playwright-neon-mode";

const SCRIPTS_DIR = path.resolve(__dirname, "..", "..", "scripts");

// Specs that hit the database directly need HARNESS_DATABASE_URL too.
// Fall back to .env.local so the test runner finds the same value the
// playwright.neon.config.ts webServer is using.
function loadEnvFile(filePath: string): Record<string, string> {
  try {
    const out: Record<string, string> = {};
    for (const line of readFileSync(filePath, "utf8").split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.+)$/);
      if (match) out[match[1]] = match[2];
    }
    return out;
  } catch {
    return {};
  }
}

// Populate the env vars the helpers need from the same sources the
// playwright.neon.config.ts webServer reads.
{
  const dashboardEnv = loadEnvFile(path.resolve(__dirname, "..", "..", ".env.local"));
  const repoEnv = loadEnvFile(path.resolve(__dirname, "..", "..", "..", ".env.local"));
  for (const key of [
    "HARNESS_DATABASE_URL",
    "NEON_AUTH_BASE_URL",
    "NEON_AUTH_COOKIE_SECRET",
    "NEON_API_KEY",
    "HARNESS_NEON_PROJECT_ID",
    "HARNESS_NEON_BRANCH_ID",
  ] as const) {
    if (!process.env[key]) {
      const fallback = dashboardEnv[key] ?? repoEnv[key];
      // process.env stringifies — assigning undefined yields "undefined".
      if (fallback) process.env[key] = fallback;
    }
  }
  // Defaults that the Playwright config also defaults; the helpers need them too.
  if (!process.env.HARNESS_NEON_PROJECT_ID) {
    process.env.HARNESS_NEON_PROJECT_ID = "broad-smoke-45468927";
  }
  if (!process.env.HARNESS_NEON_BRANCH_ID) {
    process.env.HARNESS_NEON_BRANCH_ID = "br-hidden-firefly-aljj2dzm";
  }
  console.log("[fixtures env]", {
    HARNESS_NEON_PROJECT_ID: process.env.HARNESS_NEON_PROJECT_ID,
    HARNESS_NEON_BRANCH_ID: process.env.HARNESS_NEON_BRANCH_ID,
    NEON_API_KEY_SET: Boolean(process.env.NEON_API_KEY),
    HARNESS_DATABASE_URL_SET: Boolean(process.env.HARNESS_DATABASE_URL),
    NEON_AUTH_BASE_URL_SET: Boolean(process.env.NEON_AUTH_BASE_URL),
  });
}

export function reseedInstance() {
  execFileSync("node", [path.join(SCRIPTS_DIR, "seed-neon-test-instance.mjs"), "--reset"], {
    stdio: "pipe",
  });
}

export function uniqueTestEmail(prefix = "pw"): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@harness-lab-test.invalid`;
}

/**
 * Land on /participant with a valid event-code session. Caller still
 * needs to identify (set or enter password). The redeem flow happens
 * via the homepage form so the cookie is set properly.
 */
export async function redeemEventCode(page: Page) {
  await page.goto("/?lang=en");
  await page.getByRole("textbox", { name: /event code/i }).fill(EVENT_CODE);
  await page.getByRole("button", { name: /open participant surface/i }).click();
  await expect(page).toHaveURL(/\/participant/);
}

/**
 * Sign out of the Neon Auth + event-code sessions via the participant
 * page header. Clears both cookies so the next redeem starts fresh.
 */
export async function signOutParticipant(page: Page) {
  // The participant page exposes a logout link; if it's hidden behind
  // a menu, use the API directly to keep specs fast and deterministic.
  await page.context().clearCookies();
}

// The Playwright `page` fixture name shadows React Hook naming
// conventions but isn't a React Hook — `use` here is Playwright's
// fixture continuation callback, not React.use().
export const test = base.extend({
  page: async ({ page }, use) => {
    reseedInstance();
    /* eslint-disable-next-line react-hooks/rules-of-hooks */
    await use(page);
  },
});

/**
 * Provision (or refresh) a test facilitator account against the live
 * Neon Auth project, set their role to "admin", grant them ownership
 * of the test instance, then sign them in via the actual /admin/sign-in
 * server action. Driving the form through Playwright means the SDK's
 * Set-Cookie path runs naturally and we don't have to fight Playwright
 * over `__Secure-` prefixed cookie injection.
 */
export async function signInAsTestFacilitator(context: BrowserContext): Promise<{
  email: string;
  password: string;
  neonUserId: string;
}> {
  const email = `pw-fac-${randomUUID().slice(0, 8)}@harness-lab-test.invalid`;
  const password = "facilitator-test-longenough";
  const projectId = process.env.HARNESS_NEON_PROJECT_ID!;
  const branchId = process.env.HARNESS_NEON_BRANCH_ID!;
  const apiKey = process.env.NEON_API_KEY!;
  const baseUrl = process.env.NEON_AUTH_BASE_URL!;
  const dbUrl = process.env.HARNESS_DATABASE_URL!;

  const url = `https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}/auth/users`;
  const createResp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ email, name: "Test Facilitator" }),
  });
  if (!createResp.ok) {
    const t = await createResp.text().catch(() => "?");
    throw new Error(`facilitator create failed: ${createResp.status} url=${url} body=${t}`);
  }
  const { id: neonUserId } = (await createResp.json()) as { id: string };

  const sql = neon(dbUrl);
  await sql.query(`UPDATE neon_auth."user" SET role = 'admin' WHERE id::text = $1`, [neonUserId]);
  await sql.query(
    `INSERT INTO instance_grants (id, instance_id, neon_user_id, role, granted_at)
     VALUES ($1, $2, $3, 'owner', NOW())
     ON CONFLICT DO NOTHING`,
    [`grant-${randomUUID()}`, INSTANCE_ID, neonUserId],
  );

  // Set the password server-side via the reset-token bypass so the
  // sign-in form has something to authenticate against.
  const token = randomUUID().replaceAll("-", "");
  await sql.query(
    `INSERT INTO neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, NOW() + interval '5 minutes', NOW(), NOW())`,
    [randomUUID(), `reset-password:${token}`, neonUserId],
  );
  const resetResp = await fetch(`${baseUrl.replace(/\/$/, "")}/reset-password`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: new URL(baseUrl).origin },
    body: JSON.stringify({ token, newPassword: password }),
  });
  if (!resetResp.ok) {
    throw new Error(`facilitator reset-password failed: ${resetResp.status} ${await resetResp.text()}`);
  }

  // Drive /admin/sign-in's server action through Playwright so the
  // Neon Auth session cookie lands in the browser context naturally.
  // Force EN to keep selectors deterministic.
  const signInPage = await context.newPage();
  await signInPage.goto("/admin/sign-in?lang=en");
  // Two forms on the page (sign-in + forgot-password); scope to the
  // first form (sign-in) by selecting the first matching input.
  await signInPage.locator('form').first().locator('input[name="email"]').fill(email);
  await signInPage.locator('form').first().locator('input[name="password"]').fill(password);
  await signInPage.locator('form').first().getByRole("button", { name: /sign in/i }).click();
  await signInPage.waitForURL((u) => !u.pathname.includes("/sign-in"), { timeout: 10_000 });
  await signInPage.close();

  return { email, password, neonUserId };
}

export { expect };
