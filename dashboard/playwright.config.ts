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
      HARNESS_ADMIN_USERNAME: "facilitator",
      HARNESS_ADMIN_PASSWORD: "secret",
      HARNESS_EVENT_CODE: "lantern8-context4-handoff2",
      HARNESS_STATE_PATH: workshopStatePath,
      HARNESS_EVENT_ACCESS_PATH: eventAccessPath,
      HARNESS_DATA_DIR: runtimeDir,
      // Stable HMAC key so preview → commit round-trips across Playwright
      // workers. Not sensitive — this is a test env.
      HARNESS_COMMIT_TOKEN_SECRET: "playwright-commit-secret",
    },
  },
});
