/**
 * Playwright config for the Neon-mode end-to-end suite (Phase 5.6 Layer 3).
 *
 * Layer 3 unavoidably shares the project's Neon Auth store: the auth
 * runtime is bound to the project's primary branch and can't be
 * pointed at a fork. So the e2e suite runs against `main` for both
 * application data AND auth, scoped by:
 *
 *   - a unique instance id per run (`playwright-neon-mode-<uuid>`)
 *   - a unique email pattern for test users (`pw-*@harness-lab-test.invalid`)
 *
 * After the run, scripts/cleanup-neon-auth-test-users.mjs deletes
 * matching users; the seeder's `--reset` clears the test instance
 * row + its participants on the next run. Both the pattern and the
 * instance prefix are guarded inside the cleanup script so a
 * misconfigured run can't wipe anything outside the test scope.
 *
 * Workflow:
 *   1. npm run test:e2e:neon          # spins server, runs suite
 *   2. node scripts/cleanup-neon-auth-test-users.mjs  # sweep test users
 *
 * The Layer 2 vitest integration suite still uses the throwaway test
 * branch — that's where actual schema isolation matters and it
 * doesn't touch the auth runtime.
 */

import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function readEnvFile(envPath: string): Record<string, string> {
  if (!fs.existsSync(envPath)) return {};
  const raw = fs.readFileSync(envPath, "utf8");
  const out: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match) out[match[1]] = match[2].replace(/^"|"$/g, "");
  }
  return out;
}

const envLocal = readEnvFile(path.join(process.cwd(), ".env.local"));
const envRepoRoot = readEnvFile(path.join(process.cwd(), "..", ".env.local"));

const DATABASE_URL = process.env.HARNESS_DATABASE_URL ?? envLocal.HARNESS_DATABASE_URL;
const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL ?? envLocal.NEON_AUTH_BASE_URL;
const NEON_AUTH_COOKIE_SECRET =
  process.env.NEON_AUTH_COOKIE_SECRET ?? envLocal.NEON_AUTH_COOKIE_SECRET;
const NEON_API_KEY =
  process.env.NEON_API_KEY ?? envLocal.NEON_API_KEY ?? envRepoRoot.NEON_API_KEY;
const NEON_PROJECT_ID =
  process.env.HARNESS_NEON_PROJECT_ID ?? envLocal.HARNESS_NEON_PROJECT_ID ?? "broad-smoke-45468927";
const NEON_BRANCH_ID =
  process.env.HARNESS_NEON_BRANCH_ID ?? envLocal.HARNESS_NEON_BRANCH_ID ?? "br-hidden-firefly-aljj2dzm";

if (!DATABASE_URL) {
  throw new Error(
    "HARNESS_DATABASE_URL not set (and not in dashboard/.env.local). " +
      "Layer 3 runs against the project's primary branch — see header.",
  );
}

if (!NEON_AUTH_BASE_URL || !NEON_AUTH_COOKIE_SECRET) {
  throw new Error(
    "NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET are required for the Neon-mode e2e " +
      "suite. Add them to dashboard/.env.local or export them before running.",
  );
}

if (!NEON_API_KEY) {
  throw new Error(
    "NEON_API_KEY is required for the Neon-mode e2e suite — control-plane API creates " +
      "participant users. Add to dashboard/.env.local or repo-root .env.local.",
  );
}

const port = 3200;
const eventCodeSecret = "playwright-event-code-secret-at-least-32-chars";

export default defineConfig({
  testDir: "./e2e/neon-mode",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3200",
    url: `http://127.0.0.1:${port}`,
    timeout: 120_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
    reuseExistingServer: false,
    env: {
      HARNESS_STORAGE_MODE: "neon",
      HARNESS_DATABASE_URL: DATABASE_URL,
      HARNESS_EVENT_CODE_SECRET: eventCodeSecret,
      NEON_AUTH_BASE_URL,
      NEON_AUTH_COOKIE_SECRET,
      // Control-plane writes for participant account creation. Branch
      // id is the project's primary because the auth runtime is bound
      // there — see header.
      NEON_API_KEY,
      HARNESS_NEON_PROJECT_ID: NEON_PROJECT_ID,
      HARNESS_NEON_BRANCH_ID: NEON_BRANCH_ID,
      // Bypass the Vercel BotId check — there's no OIDC token issuer
      // when Next runs locally for Playwright. Gated by explicit env
      // var so production can never turn off bot protection.
      HARNESS_BYPASS_BOT_CHECK: "1",
    },
  },
});
