import os from "node:os";
import path from "node:path";

export function getDefaultDashboardUrl(env) {
  return env.HARNESS_DASHBOARD_URL ?? "http://localhost:3000";
}

export function getCliHome(env) {
  return env.HARNESS_CLI_HOME ?? path.join(os.homedir(), ".harness");
}

export function getSessionFilePath(env) {
  return path.join(getCliHome(env), "session.json");
}
