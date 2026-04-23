import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { runCli } from "../src/run-cli.js";
import { setSessionStoreDepsForTests, writeSession } from "../src/session-store.js";

function createMemoryIo(env) {
  let stdout = "";
  let stderr = "";
  return {
    stdin: Readable.from([""]),
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
  const cliHome = await fs.mkdtemp(path.join(os.tmpdir(), "harness-asg-"));
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

// --- Agenda ---------------------------------------------------------------

test("agenda list GETs the live agenda", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/workshop/instances/inst-a/agenda",
        async () => jsonResponse(200, { phase: null, items: [{ id: "p1", title: "Opening" }] }),
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(["agenda", "list"], io, { fetchFn });
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /Opening/);
});

test("agenda add POSTs with derived description", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/workshop/instances/inst-a/agenda",
        async (_url, opts) => {
          const body = JSON.parse(opts.body);
          assert.equal(body.title, "Warm-up");
          assert.equal(body.time, "09:00");
          assert.equal(body.roomSummary, "Round-robin intros");
          return jsonResponse(200, { ok: true, items: [] });
        },
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["agenda", "add", "--title", "Warm-up", "--time", "09:00", "--room-summary", "Round-robin intros"],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /Added "Warm-up"/);
});

test("agenda edit PATCHes with action=update", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "PATCH http://localhost:3000/api/workshop/instances/inst-a/agenda",
        async (_url, opts) => {
          const body = JSON.parse(opts.body);
          assert.equal(body.action, "update");
          assert.equal(body.itemId, "p1");
          assert.equal(body.title, "Renamed");
          return jsonResponse(200, { ok: true, items: [] });
        },
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["agenda", "edit", "p1", "--title", "Renamed", "--time", "09:30", "--room-summary", "New summary"],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
});

test("agenda move PATCHes with direction", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "PATCH http://localhost:3000/api/workshop/instances/inst-a/agenda",
        async (_url, opts) => {
          const body = JSON.parse(opts.body);
          assert.equal(body.action, "move");
          assert.equal(body.direction, "up");
          return jsonResponse(200, { ok: true, items: [] });
        },
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(["agenda", "move", "p1", "up"], io, { fetchFn });
  assert.equal(exit, 0);
});

test("agenda remove DELETEs with itemId", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "DELETE http://localhost:3000/api/workshop/instances/inst-a/agenda",
        async (_url, opts) => {
          const body = JSON.parse(opts.body);
          assert.equal(body.itemId, "p1");
          return jsonResponse(200, { ok: true, items: [] });
        },
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(["agenda", "remove", "p1"], io, { fetchFn });
  assert.equal(exit, 0);
});

test("agenda add rejects missing required fields", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["agenda", "add", "--title", "X"],
    io,
    { fetchFn: async () => jsonResponse(200, {}) },
  );
  assert.equal(exit, 1);
  assert.match(io.getStderr(), /required/);
});

// --- Scene ----------------------------------------------------------------

test("scene list GETs scenes optionally scoped to agenda item", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/workshop/instances/inst-a/scenes?agendaItemId=p1",
        async () => jsonResponse(200, { ok: true, items: [] }),
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["scene", "list", "--agenda-item", "p1"],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
});

test("scene add POSTs with label + sceneType", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/workshop/instances/inst-a/scenes",
        async (_url, opts) => {
          const body = JSON.parse(opts.body);
          assert.equal(body.agendaItemId, "p1");
          assert.equal(body.label, "Demo");
          assert.equal(body.sceneType, "demo");
          return jsonResponse(200, { ok: true, agendaItem: null });
        },
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["scene", "add", "--agenda-item", "p1", "--label", "Demo", "--scene-type", "demo"],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
});

test("scene move requires up|down", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["scene", "move", "s1", "sideways", "--agenda-item", "p1"],
    io,
    { fetchFn: async () => jsonResponse(200, {}) },
  );
  assert.equal(exit, 1);
});

test("scene toggle sets enabled boolean", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "PATCH http://localhost:3000/api/workshop/instances/inst-a/scenes",
        async (_url, opts) => {
          const body = JSON.parse(opts.body);
          assert.equal(body.action, "set_enabled");
          assert.equal(body.enabled, false);
          return jsonResponse(200, { ok: true, agendaItem: null });
        },
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["scene", "toggle", "s1", "--enabled", "false", "--agenda-item", "p1"],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
});

test("scene remove DELETEs with agendaItemId + sceneId", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "DELETE http://localhost:3000/api/workshop/instances/inst-a/scenes",
        async (_url, opts) => {
          const body = JSON.parse(opts.body);
          assert.equal(body.agendaItemId, "p1");
          assert.equal(body.sceneId, "s1");
          return jsonResponse(200, { ok: true, agendaItem: null });
        },
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["scene", "remove", "s1", "--agenda-item", "p1"],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
});

// --- Grants ---------------------------------------------------------------

test("grants list GETs active grants", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/workshop/instances/inst-a/facilitators",
        async () => jsonResponse(200, { ok: true, grants: [{ id: "g1", role: "owner" }] }),
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(["grants", "list"], io, { fetchFn });
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /owner/);
});

test("grants add POSTs email + role", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/workshop/instances/inst-a/facilitators",
        async (_url, opts) => {
          const body = JSON.parse(opts.body);
          assert.equal(body.email, "bob@example.com");
          assert.equal(body.role, "operator");
          return jsonResponse(200, { ok: true });
        },
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["grants", "add", "bob@example.com", "--role", "operator"],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /Granted operator to bob@example.com/);
});

test("grants revoke DELETEs by grantId", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "DELETE http://localhost:3000/api/workshop/instances/inst-a/facilitators/g1",
        async () => jsonResponse(200, { ok: true }),
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(["grants", "revoke", "g1"], io, { fetchFn });
  assert.equal(exit, 0);
});

test("grants add requires --role", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["grants", "add", "x@y.com"],
    io,
    { fetchFn: async () => jsonResponse(200, {}) },
  );
  assert.equal(exit, 1);
});
