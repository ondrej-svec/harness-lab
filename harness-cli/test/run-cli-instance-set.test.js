import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { runCli } from "../src/run-cli.js";
import { setSessionStoreDepsForTests, writeSession } from "../src/session-store.js";

function createMemoryIo(env, stdinInput) {
  let stdout = "";
  let stderr = "";
  return {
    stdin: stdinInput ? Readable.from([stdinInput]) : process.stdin,
    stdout: { write(chunk) { stdout += chunk; } },
    stderr: { write(chunk) { stderr += chunk; } },
    env,
    getStdout() { return stdout; },
    getStderr() { return stderr; },
  };
}

function createFetchStub(handlers) {
  return async function fetchStub(url, options = {}) {
    const key = `${options.method ?? "GET"} ${url}`;
    const handler = handlers.get(key);
    assert.ok(handler, `Unexpected request: ${key}`);
    return handler(url, options);
  };
}

function jsonResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return payload; },
  };
}

async function createEnv() {
  const cliHome = await fs.mkdtemp(path.join(os.tmpdir(), "harness-cli-set-"));
  return {
    HARNESS_CLI_HOME: cliHome,
    HARNESS_DASHBOARD_URL: "http://localhost:3000",
    HARNESS_SESSION_STORAGE: "file",
  };
}

async function seedFacilitator(env) {
  await writeSession(env, {
    authType: "basic",
    dashboardUrl: "http://localhost:3000",
    loggedInAt: "2026-04-23T10:00:00.000Z",
    role: "facilitator",
    selectedInstanceId: "inst-a",
  });
}

test.afterEach(() => {
  setSessionStoreDepsForTests(null);
});

test("instance set --walk-ins true calls PUT walk-in-policy", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "PUT http://localhost:3000/api/admin/instances/inst-a/walk-in-policy",
        async (_url, options) => {
          const body = JSON.parse(options.body);
          assert.equal(body.allowWalkIns, true);
          return jsonResponse(200, { ok: true, allowWalkIns: true });
        },
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["instance", "set", "inst-a", "--walk-ins", "true"],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /walk-ins=true/i);
});

test("instance set --walk-ins false requires explicit boolean string", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["instance", "set", "inst-a", "--walk-ins", "maybe"],
    io,
    { fetchFn: async () => jsonResponse(200, {}) },
  );
  assert.equal(exit, 1);
  assert.match(io.getStderr(), /true or false/);
});

test("instance set without any setter flag errors", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["instance", "set", "inst-a"],
    io,
    { fetchFn: async () => jsonResponse(200, {}) },
  );
  assert.equal(exit, 1);
  assert.match(io.getStderr(), /Nothing to set/);
});

test("participant export fetches the Art. 20 JSON", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/admin/participants/p1/export?instanceId=inst-a",
        async () =>
          jsonResponse(200, {
            ok: true,
            participant: { id: "p1", displayName: "Ada" },
            eventAccess: [],
            sessions: [],
          }),
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["participant", "export", "p1", "--instance", "inst-a"],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /Ada/);
});

test("participant export --out writes to a file", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "pex-"));
  const outPath = path.join(tmp, "dump.json");
  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/admin/participants/p1/export?instanceId=inst-a",
        async () => jsonResponse(200, { ok: true, participant: { id: "p1", displayName: "Zed" } }),
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["participant", "export", "p1", "--instance", "inst-a", "--out", outPath],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
  const written = await fs.readFile(outPath, "utf-8");
  const parsed = JSON.parse(written);
  assert.equal(parsed.participant.displayName, "Zed");
});

test("participant export requires --instance", async () => {
  const env = await createEnv();
  // Seed without selectedInstanceId
  await writeSession(env, {
    authType: "basic",
    dashboardUrl: "http://localhost:3000",
    loggedInAt: "2026-04-23T10:00:00.000Z",
    role: "facilitator",
  });
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["participant", "export", "p1"],
    io,
    { fetchFn: async () => jsonResponse(200, {}) },
  );
  assert.equal(exit, 1);
  assert.match(io.getStderr(), /--instance/);
});
