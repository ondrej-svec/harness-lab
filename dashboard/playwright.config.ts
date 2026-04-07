import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const port = 3100;
const fixtureDir = path.join(process.cwd(), "test-data");
const runtimeDir = path.join(os.tmpdir(), "harness-lab-playwright");
const workshopStatePath = path.join(runtimeDir, "workshop-state.json");
const eventAccessPath = path.join(runtimeDir, "event-access.json");

fs.mkdirSync(runtimeDir, { recursive: true });
fs.copyFileSync(path.join(fixtureDir, "playwright-workshop-state.json"), workshopStatePath);
fs.copyFileSync(path.join(fixtureDir, "playwright-event-access.json"), eventAccessPath);

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
    },
  },
});
