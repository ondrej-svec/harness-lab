import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const port = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
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
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
    env: {
      HARNESS_ADMIN_USERNAME: "facilitator",
      HARNESS_ADMIN_PASSWORD: "secret",
      HARNESS_EVENT_CODE: "lantern8-context4-handoff2",
      HARNESS_STATE_PATH: path.join(process.cwd(), "test-data", "playwright-workshop-state.json"),
      HARNESS_EVENT_ACCESS_PATH: path.join(process.cwd(), "test-data", "playwright-event-access.json"),
    },
  },
});
