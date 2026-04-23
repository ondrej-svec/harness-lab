import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const port = 3100;
const fixtureDir = path.join(process.cwd(), "test-data");
const runtimeDir = path.join(os.tmpdir(), "harness-lab-playwright");
const workshopStatePath = path.join(runtimeDir, "workshop-state.json");
const eventAccessPath = path.join(runtimeDir, "event-access.json");
const instanceDir = path.join(runtimeDir, "sample-studio-a");
const participantsPath = path.join(instanceDir, "participants.json");
const teamMembersPath = path.join(instanceDir, "team-members.json");
const teamsPath = path.join(instanceDir, "teams.json");

fs.mkdirSync(runtimeDir, { recursive: true });
fs.mkdirSync(instanceDir, { recursive: true });
fs.copyFileSync(path.join(fixtureDir, "playwright-workshop-state.json"), workshopStatePath);
fs.copyFileSync(path.join(fixtureDir, "playwright-event-access.json"), eventAccessPath);

// Seed empty pool + team-members for each run. The People section tests
// paste people in and expect to start from scratch; the existing Teams
// fixture is rebuilt from workshop-state + teams.json.
fs.writeFileSync(participantsPath, JSON.stringify({ items: [] }, null, 2));
fs.writeFileSync(teamMembersPath, JSON.stringify({ items: [] }, null, 2));
fs.writeFileSync(
  teamsPath,
  JSON.stringify(
    {
      items: [
        {
          id: "t1",
          name: "Team Alfa",
          city: "Studio A",
          members: [],
          repoUrl: "https://github.com/example/standup-bot",
          projectBriefId: "standup-bot",
          checkIns: [],
          anchor: null,
        },
        {
          id: "t2",
          name: "Team Bravo",
          city: "Studio A",
          members: [],
          repoUrl: "https://github.com/example/doc-generator",
          projectBriefId: "doc-generator",
          checkIns: [],
          anchor: null,
        },
      ],
    },
    null,
    2,
  ),
);

export default defineConfig({
  testDir: "./e2e",
  // visual-tour.spec.ts is an artefact generator for design-system review,
  // not a regression test — it seeds and screenshots at multiple viewports
  // and can push total runtime past the CI 15-minute cap. Opt in locally
  // with PLAYWRIGHT_INCLUDE_VISUAL_TOUR=1.
  // neon-mode/** requires a real Neon database + auth runtime — it has its
  // own config (playwright.neon.config.ts) and runs via `test:e2e:neon`.
  testIgnore: [
    ...(process.env.PLAYWRIGHT_INCLUDE_VISUAL_TOUR ? [] : ["**/visual-tour.spec.ts"]),
    "**/neon-mode/**",
  ],
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
    },
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
    {
      name: "webkit-ipad",
      grep: /@presenter-tablet/,
      use: {
        ...devices["iPad Pro 11 landscape"],
        browserName: "webkit",
      },
    },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    url: `http://127.0.0.1:${port}`,
    timeout: 120_000,
    gracefulShutdown: {
      signal: "SIGTERM",
      timeout: 5_000,
    },
    reuseExistingServer: false,
    env: {
      // Explicitly scrub Vercel identity env vars so the admin-auth
      // fail-closed check (`VERCEL_ENV === "production"`) can't trip when
      // the local .env.local happens to contain pulled Vercel values.
      // Our e2e intentionally uses the demo creds to exercise file-mode.
      VERCEL: "",
      VERCEL_ENV: "",
      HARNESS_STORAGE_MODE: "file",
      HARNESS_ADMIN_USERNAME: "facilitator",
      HARNESS_ADMIN_PASSWORD: "secret",
      HARNESS_EVENT_CODE: "lantern8-context4-handoff2",
      HARNESS_STATE_PATH: workshopStatePath,
      HARNESS_EVENT_ACCESS_PATH: eventAccessPath,
      HARNESS_DATA_DIR: runtimeDir,
      NEON_AUTH_BASE_URL: "",
      NEON_AUTH_COOKIE_SECRET: "",
      // Stable HMAC keys so preview → commit and event-code round-trips
      // stay deterministic across Playwright workers. Not sensitive — these
      // are test env values only.
      HARNESS_COMMIT_TOKEN_SECRET: "playwright-commit-secret",
      HARNESS_EVENT_CODE_SECRET: "playwright-event-code-secret-at-least-32-chars",
      // Playwright runs Next locally, so there's no Vercel-issued OIDC
      // token available for BotID server checks on redeem/sign-in flows.
      HARNESS_BYPASS_BOT_CHECK: "1",
    },
  },
});
