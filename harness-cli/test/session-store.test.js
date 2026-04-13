import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  deleteSession,
  getSessionStorageMode,
  readSession,
  sanitizeSession,
  setSessionStoreDepsForTests,
  writeSession,
} from "../src/session-store.js";

async function createEnv(overrides = {}) {
  const cliHome = await fs.mkdtemp(path.join(os.tmpdir(), "harness-session-store-"));
  return {
    HARNESS_CLI_HOME: cliHome,
    ...overrides,
  };
}

test.afterEach(() => {
  setSessionStoreDepsForTests(null);
});

test("uses file storage by default", async () => {
  const env = await createEnv();
  const session = { authType: "basic", dashboardUrl: "http://localhost:3000", loggedInAt: "2026-04-07T10:00:00.000Z" };

  await writeSession(env, session);
  assert.deepEqual(await readSession(env), session);
  assert.equal(getSessionStorageMode(env), "file");
});

test("uses explicit keychain storage on darwin", async () => {
  const env = await createEnv({ HARNESS_SESSION_STORAGE: "keychain" });
  const commands = [];

  setSessionStoreDepsForTests({
    platform: "darwin",
    async execFile(file, args) {
      commands.push([file, args]);
      if (args[0] === "find-generic-password") {
        return { stdout: JSON.stringify({ authType: "neon", dashboardUrl: "https://example.com" }) };
      }
      return { stdout: "" };
    },
  });

  const session = { authType: "neon", dashboardUrl: "https://example.com", loggedInAt: "2026-04-07T10:00:00.000Z" };
  await writeSession(env, session);
  assert.deepEqual(await readSession(env), { authType: "neon", dashboardUrl: "https://example.com" });
  await deleteSession(env);

  assert.equal(getSessionStorageMode(env), "keychain");
  assert.equal(commands[0]?.[0], "/usr/bin/security");
  assert.equal(commands[0]?.[1][0], "add-generic-password");
  assert.equal(commands[1]?.[1][0], "find-generic-password");
  assert.equal(commands[2]?.[1][0], "delete-generic-password");
});

test("uses explicit Windows Credential Manager storage on win32", async () => {
  const env = await createEnv({ HARNESS_SESSION_STORAGE: "credential-manager" });
  const commands = [];

  setSessionStoreDepsForTests({
    platform: "win32",
    async execFile(file, args) {
      commands.push([file, args]);
      if (String(args[2]).includes("Retrieve")) {
        return { stdout: JSON.stringify({ authType: "device", dashboardUrl: "https://example.com" }) };
      }
      return { stdout: "" };
    },
  });

  const session = { authType: "device", dashboardUrl: "https://example.com", loggedInAt: "2026-04-07T10:00:00.000Z" };
  await writeSession(env, session);
  assert.deepEqual(await readSession(env), { authType: "device", dashboardUrl: "https://example.com" });
  await deleteSession(env);

  assert.equal(getSessionStorageMode(env), "credential-manager");
  assert.equal(commands[0]?.[0], "powershell");
});

test("uses explicit Linux Secret Service storage on linux", async () => {
  const env = await createEnv({ HARNESS_SESSION_STORAGE: "secret-service" });
  const commands = [];

  setSessionStoreDepsForTests({
    platform: "linux",
    async execFile(file, args) {
      commands.push([file, args]);
      if (String(args[1]).includes("lookup")) {
        return { stdout: JSON.stringify({ authType: "device", dashboardUrl: "https://example.com" }) };
      }
      return { stdout: "" };
    },
  });

  const session = { authType: "device", dashboardUrl: "https://example.com", loggedInAt: "2026-04-07T10:00:00.000Z" };
  await writeSession(env, session);
  assert.deepEqual(await readSession(env), { authType: "device", dashboardUrl: "https://example.com" });
  await deleteSession(env);

  assert.equal(getSessionStorageMode(env), "secret-service");
  assert.equal(commands[0]?.[0], "/bin/sh");
});

test("sanitized sessions include storage mode but exclude secret fields", async () => {
  const env = await createEnv({ HARNESS_SESSION_STORAGE: "file" });
  const sanitized = sanitizeSession(
    {
      authType: "neon",
      dashboardUrl: "https://example.com",
      email: "facilitator@example.com",
      cookieHeader: "secret-cookie",
      selectedInstanceId: "sample-studio-a",
      loggedInAt: "2026-04-07T10:00:00.000Z",
    },
    env,
  );

  assert.deepEqual(sanitized, {
    authType: "neon",
    dashboardUrl: "https://example.com",
    email: "facilitator@example.com",
    role: null,
    expiresAt: null,
    instanceId: null,
    loggedInAt: "2026-04-07T10:00:00.000Z",
    mode: "local-dev",
    selectedInstanceId: "sample-studio-a",
    sessionHealth: "active",
    storage: "file",
    storageLabel: "file storage",
    username: null,
  });
});
