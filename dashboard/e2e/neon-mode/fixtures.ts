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
import path from "node:path";
import { test as base, expect, type Page } from "@playwright/test";

export const EVENT_CODE = "lantern8-context4-handoff2";
export const INSTANCE_ID = "playwright-neon-mode";

const SCRIPTS_DIR = path.resolve(__dirname, "..", "..", "scripts");

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

export { expect };
