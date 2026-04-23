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
  const cliHome = await fs.mkdtemp(path.join(os.tmpdir(), "harness-cli-bp-"));
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
  });
}

test.afterEach(() => {
  setSessionStoreDepsForTests(null);
});

test("blueprint list prints the seeded default", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/admin/blueprints",
        async () =>
          jsonResponse(200, {
            ok: true,
            blueprints: [
              { id: "harness-lab-default", name: "harness-lab-default", version: 1, language: "en", teamMode: true },
            ],
          }),
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(["blueprint", "list"], io, { fetchFn });
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /harness-lab-default/);
});

test("blueprint show fetches one blueprint", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/admin/blueprints/harness-lab-default",
        async () =>
          jsonResponse(200, {
            ok: true,
            blueprint: {
              id: "harness-lab-default",
              name: "harness-lab-default",
              version: 1,
              body: { schemaVersion: 1, phases: [] },
              language: "en",
              teamMode: true,
            },
          }),
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(["blueprint", "show", "harness-lab-default"], io, { fetchFn });
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /harness-lab-default/);
});

test("blueprint show errors when id missing", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const io = createMemoryIo(env);
  const exit = await runCli(["blueprint", "show"], io, { fetchFn: async () => jsonResponse(200, {}) });
  assert.equal(exit, 1);
  assert.match(io.getStderr(), /id is required/);
});

test("blueprint push uploads a local JSON file", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "blueprint-push-"));
  const blueprintPath = path.join(tmp, "half-day.json");
  await fs.writeFile(
    blueprintPath,
    JSON.stringify({ schemaVersion: 1, name: "half-day", language: "en", teamMode: false, phases: [] }),
  );

  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/admin/blueprints",
        async (_url, options) => {
          const parsed = JSON.parse(options.body);
          assert.equal(parsed.id, "half-day");
          assert.equal(parsed.body.name, "half-day");
          return jsonResponse(200, {
            ok: true,
            blueprint: { id: "half-day", name: "half-day", version: 1, language: "en", teamMode: false },
          });
        },
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exit = await runCli(
    ["blueprint", "push", "half-day", "--file", blueprintPath],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /half-day/);
});

test("blueprint push --dry-run detects an existing id without writing", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "blueprint-dryrun-"));
  const blueprintPath = path.join(tmp, "x.json");
  await fs.writeFile(
    blueprintPath,
    JSON.stringify({ schemaVersion: 1, name: "x", language: "en", teamMode: true, phases: [] }),
  );

  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/admin/blueprints/existing",
        async () =>
          jsonResponse(200, {
            ok: true,
            blueprint: { id: "existing", name: "existing", version: 3, language: "en", teamMode: true },
          }),
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exit = await runCli(
    ["blueprint", "push", "existing", "--file", blueprintPath, "--dry-run"],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /willUpdate.*true/);
  assert.match(io.getStdout(), /existingVersion.*3/);
});

test("blueprint push --dry-run reports willCreate for new id", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "blueprint-dryrun2-"));
  const blueprintPath = path.join(tmp, "x.json");
  await fs.writeFile(
    blueprintPath,
    JSON.stringify({ schemaVersion: 1, name: "new-one", language: "en", teamMode: true, phases: [{ id: "p1", durationMinutes: 30 }] }),
  );

  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/admin/blueprints/new-one",
        async () =>
          jsonResponse(404, { ok: false, error: "not_found" }),
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exit = await runCli(
    ["blueprint", "push", "new-one", "--file", blueprintPath, "--dry-run"],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /willCreate.*true/);
  assert.match(io.getStdout(), /incomingPhaseCount.*1/);
});

test("blueprint push rejects file without phases array", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "blueprint-bad-"));
  const badPath = path.join(tmp, "bad.json");
  await fs.writeFile(badPath, JSON.stringify({ notABlueprint: true }));

  const io = createMemoryIo(env);
  const exit = await runCli(
    ["blueprint", "push", "bad", "--file", badPath],
    io,
    { fetchFn: async () => jsonResponse(200, {}) },
  );
  assert.equal(exit, 1);
  assert.match(io.getStderr(), /phases/);
});

test("blueprint push errors when --file missing", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["blueprint", "push", "x"],
    io,
    { fetchFn: async () => jsonResponse(200, {}) },
  );
  assert.equal(exit, 1);
  assert.match(io.getStderr(), /--file/);
});

test("blueprint fork copies to a new id", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/admin/blueprints/harness-lab-default/fork",
        async (_url, options) => {
          const parsed = JSON.parse(options.body);
          assert.equal(parsed.newId, "cs-default");
          return jsonResponse(200, {
            ok: true,
            blueprint: { id: "cs-default", name: "Czech default", version: 1, language: "en", teamMode: true },
          });
        },
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["blueprint", "fork", "harness-lab-default", "--as", "cs-default", "--name", "Czech default"],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /cs-default/);
});

test("blueprint fork errors when --as missing", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const io = createMemoryIo(env);
  const exit = await runCli(
    ["blueprint", "fork", "harness-lab-default"],
    io,
    { fetchFn: async () => jsonResponse(200, {}) },
  );
  assert.equal(exit, 1);
  assert.match(io.getStderr(), /--as/);
});

test("blueprint rm deletes a blueprint", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "DELETE http://localhost:3000/api/admin/blueprints/rm-me",
        async () => jsonResponse(200, { ok: true }),
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(["blueprint", "rm", "rm-me"], io, { fetchFn });
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /Deleted blueprint rm-me/);
});

test("blueprint rm surfaces server refusal for default", async () => {
  const env = await createEnv();
  await seedFacilitator(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "DELETE http://localhost:3000/api/admin/blueprints/harness-lab-default",
        async () => jsonResponse(400, { ok: false, error: "cannot_delete_default" }),
      ],
    ]),
  );
  const io = createMemoryIo(env);
  const exit = await runCli(["blueprint", "rm", "harness-lab-default"], io, { fetchFn });
  assert.equal(exit, 1);
  assert.match(io.getStderr(), /cannot_delete_default/);
});
