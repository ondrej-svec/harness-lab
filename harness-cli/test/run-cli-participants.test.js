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
  const cliHome = await fs.mkdtemp(path.join(os.tmpdir(), "harness-cli-test-"));
  return {
    HARNESS_CLI_HOME: cliHome,
    HARNESS_DASHBOARD_URL: "http://localhost:3000",
    HARNESS_SESSION_STORAGE: "file",
  };
}

async function seedFacilitatorSession(env) {
  await writeSession(env, {
    authType: "basic",
    dashboardUrl: "http://localhost:3000",
    loggedInAt: "2026-04-16T10:00:00.000Z",
    role: "facilitator",
  });
}

test.afterEach(() => {
  setSessionStoreDepsForTests(null);
});

test("workshop participants list prints the pool + assignments", async () => {
  const env = await createEnv();
  await seedFacilitatorSession(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/admin/participants",
        async () =>
          jsonResponse(200, {
            ok: true,
            pool: [{ id: "p1", displayName: "Ada", email: null, emailOptIn: false, tag: "senior", archivedAt: null }],
            assignments: [{ teamId: "t1", participantId: "p1" }],
          }),
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exit = await runCli(["workshop", "participants", "list"], io, { fetchFn });
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /"displayName": "Ada"/);
  assert.match(io.getStdout(), /"teamId": "t1"/);
});

test("workshop participants list --unassigned filters out assigned participants", async () => {
  const env = await createEnv();
  await seedFacilitatorSession(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/admin/participants",
        async () =>
          jsonResponse(200, {
            ok: true,
            pool: [
              { id: "p1", displayName: "Ada", email: null, emailOptIn: false, tag: null, archivedAt: null },
              { id: "p2", displayName: "Linus", email: null, emailOptIn: false, tag: null, archivedAt: null },
            ],
            assignments: [{ teamId: "t1", participantId: "p1" }],
          }),
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exit = await runCli(["workshop", "participants", "list", "--unassigned"], io, { fetchFn });
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /"displayName": "Linus"/);
  assert.doesNotMatch(io.getStdout(), /"displayName": "Ada"/);
});

test("workshop participants add sends one entry", async () => {
  const env = await createEnv();
  await seedFacilitatorSession(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/admin/participants",
        async (_url, options) => {
          const body = JSON.parse(options.body);
          assert.deepEqual(body.entries, [
            { displayName: "Ada Lovelace", email: "ada@example.com", tag: "senior" },
          ]);
          return jsonResponse(200, { ok: true, created: [{ id: "p1", displayName: "Ada Lovelace" }], skipped: [] });
        },
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exit = await runCli(
    ["workshop", "participants", "add", "Ada", "Lovelace", "--email", "ada@example.com", "--tag", "senior"],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /"displayName": "Ada Lovelace"/);
});

test("workshop participants import --stdin sends the rawText as-is", async () => {
  const env = await createEnv();
  await seedFacilitatorSession(env);
  const input = "Ada Lovelace\nLinus, linus@example.com\n";
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/admin/participants",
        async (_url, options) => {
          const body = JSON.parse(options.body);
          assert.equal(body.rawText, input);
          return jsonResponse(200, { ok: true, created: [{ id: "p1" }, { id: "p2" }], skipped: [] });
        },
      ],
    ]),
  );

  const io = createMemoryIo(env, input);
  const exit = await runCli(["workshop", "participants", "import", "--stdin"], io, { fetchFn });
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /"ok": true/);
});

test("workshop team assign calls PUT /api/admin/team-members", async () => {
  const env = await createEnv();
  await seedFacilitatorSession(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "PUT http://localhost:3000/api/admin/team-members",
        async (_url, options) => {
          const body = JSON.parse(options.body);
          assert.equal(body.participantId, "p1");
          assert.equal(body.teamId, "t1");
          return jsonResponse(200, { ok: true, teamId: "t1", participantId: "p1", movedFrom: null });
        },
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exit = await runCli(["workshop", "team", "assign", "p1", "t1"], io, { fetchFn });
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /"movedFrom": null/);
});

test("workshop team randomize --preview returns a commit token", async () => {
  const env = await createEnv();
  await seedFacilitatorSession(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/admin/team-formation/randomize",
        async (_url, options) => {
          const body = JSON.parse(options.body);
          assert.equal(body.preview, true);
          assert.equal(body.teamCount, 3);
          assert.equal(body.strategy, "cross-level");
          return jsonResponse(200, {
            ok: true,
            preview: true,
            teamIds: ["t1", "t2", "t3"],
            assignments: [{ participantId: "p1", teamId: "t1" }],
            tagDistribution: { t1: { senior: 1 }, t2: {}, t3: {} },
            commitToken: "token.signature",
          });
        },
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exit = await runCli(
    ["workshop", "team", "randomize", "--teams", "3", "--preview"],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /"commitToken": "token.signature"/);
});

test("workshop team randomize --commit-token commits the signed distribution", async () => {
  const env = await createEnv();
  await seedFacilitatorSession(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/admin/team-formation/randomize",
        async (_url, options) => {
          const body = JSON.parse(options.body);
          assert.equal(body.commitToken, "token.signature");
          return jsonResponse(200, { ok: true, committed: true, count: 1 });
        },
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exit = await runCli(
    ["workshop", "team", "randomize", "--commit-token", "token.signature"],
    io,
    { fetchFn },
  );
  assert.equal(exit, 0);
  assert.match(io.getStdout(), /"committed": true/);
});

test("workshop participants list without session exits 1", async () => {
  const env = await createEnv();
  // No session seeded
  const fetchFn = createFetchStub(new Map([]));

  const io = createMemoryIo(env);
  const exit = await runCli(["workshop", "participants", "list"], io, { fetchFn });
  assert.equal(exit, 1);
});
