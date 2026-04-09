import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { runCli } from "../src/run-cli.js";
import { readSession, setSessionStoreDepsForTests, writeSession } from "../src/session-store.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

function createMemoryIo(env) {
  let stdout = "";
  let stderr = "";

  return {
    stdin: process.stdin,
    stdout: { write(chunk) { stdout += chunk; } },
    stderr: { write(chunk) { stderr += chunk; } },
    env,
    getStdout() {
      return stdout;
    },
    getStderr() {
      return stderr;
    },
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
    async json() {
      return payload;
    },
  };
}

async function createEnv() {
  const cliHome = await fs.mkdtemp(path.join(os.tmpdir(), "harness-cli-test-"));
  return {
    HARNESS_CLI_HOME: cliHome,
    HARNESS_DASHBOARD_URL: "http://localhost:3000",
    HARNESS_ADMIN_USERNAME: "facilitator",
    HARNESS_ADMIN_PASSWORD: "secret",
  };
}

const repoReadmeUrl = new URL("../../README.md", import.meta.url);

test.afterEach(() => {
  setSessionStoreDepsForTests(null);
});

function responseWithSetCookie(status, payload, setCookie) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        return name.toLowerCase() === "set-cookie" ? setCookie : null;
      },
    },
    async json() {
      return payload;
    },
  };
}

test("auth login stores a verified session", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const io = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/workshop",
        async (_url, options) => {
          assert.match(String(options.headers.authorization), /^Basic /);
          return jsonResponse(200, { workshopId: "sample-studio-a", workshopMeta: {} });
        },
      ],
    ]),
  );

  const exitCode = await runCli(["auth", "login", "--auth", "basic"], io, { fetchFn });
  assert.equal(exitCode, 0);

  const session = await readSession(env);
  assert.equal(session.dashboardUrl, "http://localhost:3000");
  assert.equal(session.username, "facilitator");
  assert.match(io.getStdout(), /Logged in/);
});

test("auth status prints persisted session metadata", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      ["GET http://localhost:3000/api/workshop", async () => jsonResponse(200, { workshopId: "sample-studio-a" })],
    ]),
  );

  await runCli(["auth", "login", "--auth", "basic"], loginIo, { fetchFn });

  const statusIo = createMemoryIo(env);
  const exitCode = await runCli(["auth", "status"], statusIo, { fetchFn });
  assert.equal(exitCode, 0);
  assert.match(statusIo.getStdout(), /sample-studio-a|dashboardUrl/);
  assert.doesNotMatch(statusIo.getStdout(), /authorizationHeader/);
});

test("workshop status combines workshop and agenda endpoints", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      ["GET http://localhost:3000/api/workshop", async () => jsonResponse(200, { workshopId: "sample-studio-a", workshopMeta: { title: "Harness Lab" }, templates: [] })],
      ["GET http://localhost:3000/api/agenda", async () => jsonResponse(200, { phase: { id: "build-1", title: "Build Phase 1" }, items: [] })],
    ]),
  );

  await runCli(["auth", "login", "--auth", "basic"], loginIo, { fetchFn });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "status"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /Build Phase 1/);
});

test("workshop select-instance stores a validated local target and current-instance reports it", async () => {
  const env = await createEnv();
  await writeSession(env, {
    authType: "basic",
    dashboardUrl: "http://localhost:3000",
    loggedInAt: "2026-04-09T10:00:00.000Z",
  });

  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/workshop/instances/sample-studio-b",
        async () =>
          jsonResponse(200, {
            instance: {
              id: "sample-studio-b",
              templateId: "blueprint-default",
              status: "prepared",
              workshopMeta: {
                contentLang: "en",
                eventTitle: "Prague Hackathon",
              },
            },
          }),
      ],
    ]),
  );

  const selectIo = createMemoryIo(env);
  const selectExitCode = await runCli(["workshop", "select-instance", "sample-studio-b"], selectIo, { fetchFn });
  assert.equal(selectExitCode, 0);
  assert.match(selectIo.getStdout(), /"selectedInstanceId": "sample-studio-b"/);

  const persisted = await readSession(env);
  assert.equal(persisted.selectedInstanceId, "sample-studio-b");

  const currentIo = createMemoryIo(env);
  const currentExitCode = await runCli(["workshop", "current-instance"], currentIo, { fetchFn });
  assert.equal(currentExitCode, 0);
  assert.match(currentIo.getStdout(), /"source": "session"/);
  assert.match(currentIo.getStdout(), /"eventTitle": "Prague Hackathon"/);
});

test("workshop current-instance falls back to HARNESS_WORKSHOP_INSTANCE_ID when no local selection exists", async () => {
  const env = await createEnv();
  env.HARNESS_WORKSHOP_INSTANCE_ID = "sample-studio-a";
  await writeSession(env, {
    authType: "basic",
    dashboardUrl: "http://localhost:3000",
    loggedInAt: "2026-04-09T10:00:00.000Z",
  });

  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/workshop/instances/sample-studio-a",
        async () =>
          jsonResponse(200, {
            instance: {
              id: "sample-studio-a",
              templateId: "blueprint-default",
              status: "prepared",
              workshopMeta: {
                contentLang: "cs",
                eventTitle: "Brno Hackathon",
              },
            },
          }),
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "current-instance"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /"source": "env"/);
  assert.match(io.getStdout(), /"instanceId": "sample-studio-a"/);
});

test("workshop status uses the selected local instance instead of the deployment default routes", async () => {
  const env = await createEnv();
  await writeSession(env, {
    authType: "basic",
    dashboardUrl: "http://localhost:3000",
    loggedInAt: "2026-04-09T10:00:00.000Z",
    selectedInstanceId: "sample-studio-b",
  });

  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/workshop/instances/sample-studio-b",
        async () =>
          jsonResponse(200, {
            instance: {
              id: "sample-studio-b",
              templateId: "blueprint-default",
              status: "running",
              workshopMeta: {
                contentLang: "en",
                eventTitle: "Prague Hackathon",
              },
            },
          }),
      ],
      [
        "GET http://localhost:3000/api/workshop/instances/sample-studio-b/agenda",
        async () =>
          jsonResponse(200, {
            phase: { id: "talk", title: "Opening Talk" },
            items: [{ id: "talk" }],
          }),
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "status"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /"targetSource": "session"/);
  assert.match(io.getStdout(), /"targetInstanceId": "sample-studio-b"/);
  assert.match(io.getStdout(), /"agendaItems": 1/);
});

test("workshop list-instances returns the facilitator-visible instance registry", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      ["GET http://localhost:3000/api/workshop", async () => jsonResponse(200, { workshopId: "sample-studio-a" })],
      [
        "GET http://localhost:3000/api/workshop/instances",
        async () =>
          jsonResponse(200, {
            items: [
              {
                id: "sample-studio-a",
                templateId: "blueprint-default",
                status: "prepared",
                workshopMeta: {
                  contentLang: "cs",
                  eventTitle: "Brno Hackathon",
                  city: "Brno",
                },
              },
              {
                id: "sample-studio-b",
                templateId: "blueprint-default",
                status: "created",
                workshopMeta: {
                  contentLang: "en",
                  eventTitle: "Prague Hackathon",
                  city: "Prague",
                },
              },
            ],
          }),
      ],
    ]),
  );

  await runCli(["auth", "login", "--auth", "basic"], loginIo, { fetchFn });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "list-instances"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /"count": 2/);
  assert.match(io.getStdout(), /"instanceId": "sample-studio-a"/);
  assert.match(io.getStdout(), /"contentLang": "en"/);
});

test("workshop list-instances supports strict json output without headings", async () => {
  const env = await createEnv();
  await writeSession(env, {
    authType: "basic",
    dashboardUrl: "http://localhost:3000",
    loggedInAt: "2026-04-09T10:00:00.000Z",
  });

  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/workshop/instances",
        async () => jsonResponse(200, { items: [{ id: "sample-studio-a", status: "prepared", workshopMeta: {} }] }),
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exitCode = await runCli(["--json", "workshop", "list-instances"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.doesNotMatch(io.getStdout(), /Workshop Instances/);
  assert.match(io.getStdout(), /^\{\n/);
});

test("workshop show-instance returns one explicit instance", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      ["GET http://localhost:3000/api/workshop", async () => jsonResponse(200, { workshopId: "sample-studio-a" })],
      [
        "GET http://localhost:3000/api/workshop/instances/sample-studio-b",
        async () =>
          jsonResponse(200, {
            instance: {
              id: "sample-studio-b",
              templateId: "blueprint-default",
              status: "prepared",
              workshopMeta: {
                contentLang: "en",
                eventTitle: "Prague Hackathon",
                roomName: "Saturn",
              },
            },
          }),
      ],
    ]),
  );

  await runCli(["auth", "login", "--auth", "basic"], loginIo, { fetchFn });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "show-instance", "sample-studio-b"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /"instanceId": "sample-studio-b"/);
  assert.match(io.getStdout(), /"templateId": "blueprint-default"/);
  assert.match(io.getStdout(), /"roomName": "Saturn"/);
});

test("workshop show-instance reports missing instances clearly", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      ["GET http://localhost:3000/api/workshop", async () => jsonResponse(200, { workshopId: "sample-studio-a" })],
      [
        "GET http://localhost:3000/api/workshop/instances/missing-instance",
        async () => jsonResponse(404, { ok: false, error: "instance not found" }),
      ],
    ]),
  );

  await runCli(["auth", "login", "--auth", "basic"], loginIo, { fetchFn });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "show-instance", "missing-instance"], io, { fetchFn });
  assert.equal(exitCode, 1);
  assert.match(io.getStderr(), /Show instance failed: instance not found/);
});

test("workshop phase set sends the selected phase id", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  let requestBody = null;
  const fetchFn = createFetchStub(
    new Map([
      ["GET http://localhost:3000/api/workshop", async () => jsonResponse(200, { workshopId: "sample-studio-a" })],
      ["PATCH http://localhost:3000/api/agenda", async (_url, options) => {
        requestBody = JSON.parse(String(options.body));
        return jsonResponse(200, { ok: true, phase: "Rotace týmů" });
      }],
    ]),
  );

  await runCli(["auth", "login", "--auth", "basic"], loginIo, { fetchFn });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "phase", "set", "rotation"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.deepEqual(requestBody, { currentId: "rotation" });
});

test("workshop phase set uses the selected local instance when present", async () => {
  const env = await createEnv();
  await writeSession(env, {
    authType: "basic",
    dashboardUrl: "http://localhost:3000",
    loggedInAt: "2026-04-09T10:00:00.000Z",
    selectedInstanceId: "sample-studio-b",
  });

  let requestBody = null;
  const fetchFn = createFetchStub(
    new Map([
      [
        "PATCH http://localhost:3000/api/workshop/instances/sample-studio-b/agenda",
        async (_url, options) => {
          requestBody = JSON.parse(String(options.body));
          return jsonResponse(200, { ok: true, phase: "Opening Talk" });
        },
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "phase", "set", "talk"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.deepEqual(requestBody, { itemId: "talk" });
});

test("workshop archive forwards optional notes", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  let requestBody = null;
  const fetchFn = createFetchStub(
    new Map([
      ["GET http://localhost:3000/api/workshop", async () => jsonResponse(200, { workshopId: "sample-studio-a" })],
      ["POST http://localhost:3000/api/workshop/archive", async (_url, options) => {
        requestBody = JSON.parse(String(options.body));
        return jsonResponse(200, { ok: true, archive: { id: "archive-1" } });
      }],
    ]),
  );

  await runCli(["auth", "login", "--auth", "basic"], loginIo, { fetchFn });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "archive", "--notes", "After lunch reset"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.deepEqual(requestBody, { notes: "After lunch reset" });
});

test("workshop create-instance sends rich metadata and reports created state", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  let requestBody = null;
  const fetchFn = createFetchStub(
    new Map([
      ["GET http://localhost:3000/api/workshop", async () => jsonResponse(200, { workshopId: "sample-studio-a" })],
      [
        "POST http://localhost:3000/api/workshop/instances",
        async (_url, options) => {
          assert.equal(options.headers.origin, "http://localhost:3000");
          requestBody = JSON.parse(String(options.body));
          return jsonResponse(200, {
            ok: true,
            created: true,
            instance: {
              id: requestBody.id,
              templateId: requestBody.templateId,
              status: "created",
              workshopMeta: {
                contentLang: requestBody.contentLang,
                eventTitle: requestBody.eventTitle,
                dateRange: requestBody.dateRange,
                venueName: requestBody.venueName,
                roomName: requestBody.roomName,
                city: requestBody.city,
              },
            },
          });
        },
      ],
    ]),
  );

  await runCli(["auth", "login", "--auth", "basic"], loginIo, { fetchFn });

  const io = createMemoryIo(env);
  const exitCode = await runCli(
    [
      "workshop",
      "create-instance",
      "sample-workshop-demo-orbit",
      "--template-id",
      "blueprint-default",
      "--content-lang",
      "en",
      "--event-title",
      "Sample Workshop Demo",
      "--city",
      "Example City",
      "--date-range",
      "15. června 2026",
      "--venue-name",
      "Example Campus North",
      "--room-name",
      "Orbit",
      "--address-line",
      "Example Avenue 123",
      "--location-details",
      "12 participants + facilitator",
      "--facilitator-label",
      "Alex",
    ],
    io,
    { fetchFn },
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(requestBody, {
    id: "sample-workshop-demo-orbit",
    templateId: "blueprint-default",
    contentLang: "en",
    eventTitle: "Sample Workshop Demo",
    city: "Example City",
    dateRange: "15. června 2026",
    venueName: "Example Campus North",
    roomName: "Orbit",
    addressLine: "Example Avenue 123",
    locationDetails: "12 participants + facilitator",
    facilitatorLabel: "Alex",
  });
  assert.match(io.getStdout(), /"created": true/);
  assert.match(io.getStdout(), /Sample Workshop Demo/);
});

test("workshop create-instance surfaces validation failures from the API", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      ["GET http://localhost:3000/api/workshop", async () => jsonResponse(200, { workshopId: "sample-studio-a" })],
      [
        "POST http://localhost:3000/api/workshop/instances",
        async () => jsonResponse(400, { ok: false, error: "id must be a lowercase slug using only letters, numbers, and hyphens" }),
      ],
    ]),
  );

  await runCli(["auth", "login", "--auth", "basic"], loginIo, { fetchFn });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "create-instance", "Sample Workshop Demo"], io, { fetchFn });
  assert.equal(exitCode, 1);
  assert.match(io.getStderr(), /Create instance failed: id must be a lowercase slug/);
});

test("workshop update-instance patches metadata through the shared instance route", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  let requestBody = null;
  const fetchFn = createFetchStub(
    new Map([
      ["GET http://localhost:3000/api/workshop", async () => jsonResponse(200, { workshopId: "sample-studio-a" })],
      [
        "PATCH http://localhost:3000/api/workshop/instances/sample-studio-a",
        async (_url, options) => {
          assert.equal(options.headers.origin, "http://localhost:3000");
          requestBody = JSON.parse(String(options.body));
          return jsonResponse(200, {
            ok: true,
            instance: {
              id: "sample-studio-a",
              templateId: "blueprint-default",
              status: "prepared",
              workshopMeta: {
                contentLang: "en",
                eventTitle: "Sample Workshop Demo",
                roomName: "Nova",
              },
            },
          });
        },
      ],
    ]),
  );

  await runCli(["auth", "login", "--auth", "basic"], loginIo, { fetchFn });

  const io = createMemoryIo(env);
  const exitCode = await runCli(
    [
      "workshop",
      "update-instance",
      "sample-studio-a",
      "--content-lang",
      "en",
      "--event-title",
      "Sample Workshop Demo",
      "--room-name",
      "Nova",
    ],
    io,
    { fetchFn },
  );
  assert.equal(exitCode, 0);
  assert.deepEqual(requestBody, {
    action: "update_metadata",
    contentLang: "en",
    eventTitle: "Sample Workshop Demo",
    roomName: "Nova",
  });
  assert.match(io.getStdout(), /Nova/);
});

test("workshop update-instance falls back to the selected local instance id", async () => {
  const env = await createEnv();
  await writeSession(env, {
    authType: "basic",
    dashboardUrl: "http://localhost:3000",
    loggedInAt: "2026-04-09T10:00:00.000Z",
    selectedInstanceId: "sample-studio-b",
  });

  let requestBody = null;
  const fetchFn = createFetchStub(
    new Map([
      [
        "PATCH http://localhost:3000/api/workshop/instances/sample-studio-b",
        async (_url, options) => {
          requestBody = JSON.parse(String(options.body));
          return jsonResponse(200, {
            ok: true,
            instance: {
              id: "sample-studio-b",
              status: "prepared",
              workshopMeta: {
                contentLang: "cs",
                roomName: "Dakar",
              },
            },
          });
        },
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "update-instance", "--room-name", "Dakar"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.deepEqual(requestBody, {
    action: "update_metadata",
    roomName: "Dakar",
  });
});

test("workshop reset-instance patches the shared instance route with reset semantics", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  let requestBody = null;
  const fetchFn = createFetchStub(
    new Map([
      ["GET http://localhost:3000/api/workshop", async () => jsonResponse(200, { workshopId: "sample-studio-a" })],
      [
        "PATCH http://localhost:3000/api/workshop/instances/sample-studio-a",
        async (_url, options) => {
          assert.equal(options.headers.origin, "http://localhost:3000");
          requestBody = JSON.parse(String(options.body));
          return jsonResponse(200, {
            ok: true,
            workshopId: "sample-studio-a",
            workshopMeta: {
              currentPhaseLabel: "Úvod a naladění",
            },
          });
        },
      ],
    ]),
  );

  await runCli(["auth", "login", "--auth", "basic"], loginIo, { fetchFn });

  const io = createMemoryIo(env);
  const exitCode = await runCli(
    ["workshop", "reset-instance", "sample-studio-a", "--template-id", "blueprint-default"],
    io,
    { fetchFn },
  );
  assert.equal(exitCode, 0);
  assert.deepEqual(requestBody, {
    action: "reset",
    templateId: "blueprint-default",
  });
  assert.match(io.getStdout(), /"workshopId": "sample-studio-a"/);
});

test("workshop reset-instance reports API failures from the shared instance route", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      ["GET http://localhost:3000/api/workshop", async () => jsonResponse(200, { workshopId: "sample-studio-a" })],
      [
        "PATCH http://localhost:3000/api/workshop/instances/sample-studio-a",
        async () => jsonResponse(403, { ok: false, error: "owner role required" }),
      ],
    ]),
  );

  await runCli(["auth", "login", "--auth", "basic"], loginIo, { fetchFn });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "reset-instance", "sample-studio-a"], io, { fetchFn });
  assert.equal(exitCode, 1);
  assert.match(io.getStderr(), /Reset instance failed: owner role required/);
});

test("workshop prepare sends the target instance id", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  let requestBody = null;
  const fetchFn = createFetchStub(
    new Map([
      ["GET http://localhost:3000/api/workshop", async () => jsonResponse(200, { workshopId: "sample-studio-a" })],
      [
        "POST http://localhost:3000/api/workshop",
        async (_url, options) => {
          assert.equal(options.headers.origin, "http://localhost:3000");
          requestBody = JSON.parse(String(options.body));
          return jsonResponse(200, {
            ok: true,
            instance: {
              id: "sample-studio-a",
              status: "prepared",
              workshopMeta: { eventTitle: "Sample Workshop Demo" },
            },
          });
        },
      ],
    ]),
  );

  await runCli(["auth", "login", "--auth", "basic"], loginIo, { fetchFn });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "prepare", "sample-studio-a"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.deepEqual(requestBody, { action: "prepare", instanceId: "sample-studio-a" });
  assert.match(io.getStdout(), /"status": "prepared"/);
});

test("workshop remove-instance reports owner-only failures from the API", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      ["GET http://localhost:3000/api/workshop", async () => jsonResponse(200, { workshopId: "sample-studio-a" })],
      [
        "PATCH http://localhost:3000/api/workshop/instances/sample-studio-a",
        async (_url, options) => {
          assert.equal(options.headers.origin, "http://localhost:3000");
          return jsonResponse(403, { ok: false, error: "owner role required" });
        },
      ],
    ]),
  );

  await runCli(["auth", "login", "--auth", "basic"], loginIo, { fetchFn });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "remove-instance", "sample-studio-a"], io, { fetchFn });
  assert.equal(exitCode, 1);
  assert.match(io.getStderr(), /Remove instance failed: owner role required/);
});

test("auth logout removes the persisted session", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      ["GET http://localhost:3000/api/workshop", async () => jsonResponse(200, { workshopId: "sample-studio-a" })],
    ]),
  );

  await runCli(["auth", "login", "--auth", "basic"], loginIo, { fetchFn });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["auth", "logout"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.equal(await readSession(env), null);
});

test("device auth is the default login path and stores a broker-token session", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const io = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/auth/device/start",
        async () =>
          jsonResponse(200, {
            deviceCode: "device-code-1",
            userCode: "ABCD-EFGH",
            verificationUri: "http://localhost:3000/admin/device",
            verificationUriComplete: "http://localhost:3000/admin/device?user_code=ABCD-EFGH",
            expiresAt: "2099-04-07T10:10:00.000Z",
            intervalSeconds: 0,
          }),
      ],
      [
        "POST http://localhost:3000/api/auth/device/poll",
        async () =>
          jsonResponse(200, {
            status: "authorized",
            accessToken: "device-token-1",
            expiresAt: "2099-04-07T22:00:00.000Z",
            session: {
              neonUserId: "neon-user-1",
              authMode: "device",
            },
          }),
      ],
    ]),
  );

  const exitCode = await runCli(["auth", "login"], io, {
    fetchFn,
    openUrl: async () => {},
    sleepFn: async () => {},
  });

  assert.equal(exitCode, 0);
  const session = await readSession(env);
  assert.equal(session.authType, "device");
  assert.equal(session.accessToken, "device-token-1");
  assert.match(io.getStdout(), /ABCD-EFGH/);
  assert.doesNotMatch(io.getStdout(), /Facilitator role/);
});

test("device auth status verifies the remote brokered session", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/auth/device/start",
        async () =>
          jsonResponse(200, {
            deviceCode: "device-code-1",
            userCode: "ABCD-EFGH",
            verificationUri: "http://localhost:3000/admin/device",
            verificationUriComplete: "http://localhost:3000/admin/device?user_code=ABCD-EFGH",
            expiresAt: "2099-04-07T10:10:00.000Z",
            intervalSeconds: 0,
          }),
      ],
      [
        "POST http://localhost:3000/api/auth/device/poll",
        async () =>
          jsonResponse(200, {
            status: "authorized",
            accessToken: "device-token-1",
            expiresAt: "2099-04-07T22:00:00.000Z",
            session: {
              neonUserId: "neon-user-1",
              authMode: "device",
            },
          }),
      ],
      [
        "GET http://localhost:3000/api/auth/device/session",
        async (_url, options) => {
          assert.equal(options.headers.authorization, "Bearer device-token-1");
          return jsonResponse(200, {
            ok: true,
            session: { neonUserId: "neon-user-1", authMode: "device" },
          });
        },
      ],
    ]),
  );

  await runCli(["auth", "login"], loginIo, {
    fetchFn,
    openUrl: async () => {},
    sleepFn: async () => {},
  });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["auth", "status"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /"authType": "device"/);
  assert.match(io.getStdout(), /"neonUserId": "neon-user-1"/);
});

test("device auth logout revokes the remote session before clearing local state", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/auth/device/start",
        async () =>
          jsonResponse(200, {
            deviceCode: "device-code-1",
            userCode: "ABCD-EFGH",
            verificationUri: "http://localhost:3000/admin/device",
            verificationUriComplete: "http://localhost:3000/admin/device?user_code=ABCD-EFGH",
            expiresAt: "2099-04-07T10:10:00.000Z",
            intervalSeconds: 0,
          }),
      ],
      [
        "POST http://localhost:3000/api/auth/device/poll",
        async () =>
          jsonResponse(200, {
            status: "authorized",
            accessToken: "device-token-1",
            expiresAt: "2099-04-07T22:00:00.000Z",
            session: {
              neonUserId: "neon-user-1",
              authMode: "device",
            },
          }),
      ],
      [
        "POST http://localhost:3000/api/auth/device/logout",
        async (_url, options) => {
          assert.equal(options.headers.authorization, "Bearer device-token-1");
          return jsonResponse(200, { ok: true });
        },
      ],
    ]),
  );

  await runCli(["auth", "login"], loginIo, {
    fetchFn,
    openUrl: async () => {},
    sleepFn: async () => {},
  });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["auth", "logout"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.equal(await readSession(env), null);
});

test("help exits successfully", async () => {
  const env = await createEnv();
  const io = createMemoryIo(env);

  const exitCode = await runCli(["--help"], io, {
    fetchFn: async () => {
      throw new Error("fetch should not be called for help");
    },
  });

  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /Harness CLI/);
  assert.match(io.getStdout(), /^Usage$/m);
  assert.match(io.getStdout(), /^Commands$/m);
});

test("version exits successfully", async () => {
  const env = await createEnv();
  const io = createMemoryIo(env);

  const exitCode = await runCli(["--version"], io, {
    fetchFn: async () => {
      throw new Error("fetch should not be called");
    },
  });

  assert.equal(exitCode, 0);
  assert.equal(io.getStdout().trim(), `harness ${version}`);
});

test("version command exits successfully", async () => {
  const env = await createEnv();
  const io = createMemoryIo(env);

  const exitCode = await runCli(["version"], io, {
    fetchFn: async () => {
      throw new Error("fetch should not be called");
    },
  });

  assert.equal(exitCode, 0);
  assert.equal(io.getStdout().trim(), `harness ${version}`);
});

test("skill install creates a portable .agents skill bundle in the current repo", async () => {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "harness-lab-skill-install-"));
  const env = await createEnv();
  const io = createMemoryIo(env);
  const exitCode = await runCli(["skill", "install"], io, {
    fetchFn: async () => {
      throw new Error("fetch should not be called");
    },
    cwd: repoRoot,
  });

  assert.equal(exitCode, 0);
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "SKILL.md"));
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "workshop-skill", "setup.md"));
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "workshop-skill", "locales", "en", "setup.md"));
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "workshop-skill", "locales", "en", "reference.md"));
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "workshop-skill", "locales", "en", "follow-up-package.md"));
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "content", "project-briefs", "locales", "en", "devtoolbox-cli.md"));
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "content", "challenge-cards", "locales", "en", "deck.md"));
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "docs", "locales", "en", "learner-resource-kit.md"));
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "docs", "locales", "en", "learner-reference-gallery.md"));
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "materials", "locales", "en", "participant-resource-kit.md"));
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "docs", "harness-cli-foundation.md"));
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "docs", "learner-reference-gallery.md"));
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "materials", "participant-resource-kit.md"));
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "bundle-manifest.json"));
  assert.match(io.getStdout(), /Workshop Skill/);
  assert.match(io.getStdout(), /Location: .*\.agents[\\/]+skills/);
  assert.match(io.getStdout(), /Target:/);
  await assert.rejects(fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "workshop-skill", "SKILL.md")));
  assert.match(io.getStdout(), /\$workshop commands/);
  assert.match(io.getStdout(), /\/skill:workshop/);
  assert.match(io.getStdout(), /\$workshop resources/);
  const installedSkill = await fs.readFile(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "SKILL.md"), "utf8");
  assert.match(installedSkill, /resolve to a reviewed fallback locale/);
  assert.match(installedSkill, /English is the default bundled fallback locale/);
  assert.doesNotMatch(installedSkill, /Use Czech for explanations\./);
  const installedReference = await fs.readFile(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "workshop-skill", "reference.md"), "utf8");
  assert.match(installedReference, /Workshop skill je garantovaný výchozí nástroj/);
  const installedFacilitator = await fs.readFile(
    path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "workshop-skill", "facilitator.md"),
    "utf8",
  );
  assert.match(installedFacilitator, /Commands for facilitators who manage workshop instances through an AI agent\./);
  assert.doesNotMatch(installedFacilitator, /Příkazy pro facilitátory/);
  const installedEnglishReference = await fs.readFile(
    path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "workshop-skill", "locales", "en", "reference.md"),
    "utf8",
  );
  assert.match(installedEnglishReference, /4 working defaults for today/);
  const installedEnglishBrief = await fs.readFile(
    path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "content", "project-briefs", "locales", "en", "devtoolbox-cli.md"),
    "utf8",
  );
  assert.match(installedEnglishBrief, /Almost every team ends up with small one-off scripts/);
  const installedEnglishLearnerKit = await fs.readFile(
    path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "docs", "locales", "en", "learner-resource-kit.md"),
    "utf8",
  );
  assert.match(installedEnglishLearnerKit, /This page defines the participant-facing resource kit/);
});

test("skill install reports an existing current install at the target path", async () => {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "harness-lab-skill-current-"));
  const env = await createEnv();
  const firstIo = createMemoryIo(env);
  const firstExitCode = await runCli(["skill", "install"], firstIo, {
    fetchFn: async () => {
      throw new Error("fetch should not be called");
    },
    cwd: repoRoot,
  });

  assert.equal(firstExitCode, 0);

  const io = createMemoryIo(env);
  const exitCode = await runCli(["skill", "install"], io, {
    fetchFn: async () => {
      throw new Error("fetch should not be called");
    },
    cwd: repoRoot,
  });

  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /already current at the target path/);
  assert.match(io.getStdout(), /Location: .*\.agents[\\/]+skills/);
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "SKILL.md"));
});

test("skill install refreshes a stale install without requiring force", async () => {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "harness-lab-skill-refresh-"));
  const env = await createEnv();
  const firstIo = createMemoryIo(env);
  const firstExitCode = await runCli(["skill", "install"], firstIo, {
    fetchFn: async () => {
      throw new Error("fetch should not be called");
    },
    cwd: repoRoot,
  });

  assert.equal(firstExitCode, 0);

  const referencePath = path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "workshop-skill", "reference.md");
  await fs.writeFile(referencePath, "stale reference\n");

  const io = createMemoryIo(env);
  const exitCode = await runCli(["skill", "install"], io, {
    fetchFn: async () => {
      throw new Error("fetch should not be called");
    },
    cwd: repoRoot,
  });

  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /Refreshed the installed Harness Lab workshop skill bundle/);
  const refreshedReference = await fs.readFile(referencePath, "utf8");
  assert.notEqual(refreshedReference, "stale reference\n");
  assert.match(refreshedReference, /Workshop skill je garantovaný výchozí nástroj/);
});

test("repo README routes participants through the locale-aware workshop interface", async () => {
  const readme = await fs.readFile(repoReadmeUrl, "utf8");

  assert.match(readme, /Codex: \$workshop commands/);
  assert.match(readme, /pi: \/skill:workshop/);
  assert.doesNotMatch(readme, /participant:.*workshop-skill\/install\.md/);
  assert.doesNotMatch(readme, /participant:.*workshop-skill\/reference\.md/);
});

test("installed workshop blueprint README stays portable and avoids GitHub main drift", async () => {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "harness-lab-blueprint-readme-"));
  const env = await createEnv();
  const io = createMemoryIo(env);

  const exitCode = await runCli(["skill", "install"], io, {
    fetchFn: async () => {
      throw new Error("fetch should not be called");
    },
    cwd: repoRoot,
  });

  assert.equal(exitCode, 0);

  const installedBlueprintReadme = await fs.readFile(
    path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "workshop-blueprint", "README.md"),
    "utf8",
  );

  assert.doesNotMatch(installedBlueprintReadme, /github\.com\/ondrej-svec\/harness-lab\/blob\/main/);
  assert.match(installedBlueprintReadme, /maintainer\/source-repo references/);
});

test("skill install force refreshes an existing install", async () => {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "harness-lab-skill-force-"));
  const env = await createEnv();
  const firstIo = createMemoryIo(env);
  const firstExitCode = await runCli(["skill", "install"], firstIo, {
    fetchFn: async () => {
      throw new Error("fetch should not be called");
    },
    cwd: repoRoot,
  });

  assert.equal(firstExitCode, 0);

  const io = createMemoryIo(env);
  const exitCode = await runCli(["skill", "install", "--force"], io, {
    fetchFn: async () => {
      throw new Error("fetch should not be called");
    },
    cwd: repoRoot,
  });

  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /Refreshed the installed Harness Lab workshop skill bundle/);
});

test("skill install supports an explicit target repo path", async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "harness-lab-skill-install-cwd-"));
  const targetRepo = await fs.mkdtemp(path.join(os.tmpdir(), "harness-lab-skill-install-target-"));
  const env = await createEnv();
  const io = createMemoryIo(env);
  const exitCode = await runCli(["skill", "install", "--target", targetRepo], io, {
    fetchFn: async () => {
      throw new Error("fetch should not be called");
    },
    cwd,
  });

  assert.equal(exitCode, 0);
  await fs.access(path.join(targetRepo, ".agents", "skills", "harness-lab-workshop", "SKILL.md"));
  assert.match(io.getStdout(), new RegExp(`Target: ${targetRepo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
});

test("device auth can drive workshop status with the brokered facilitator session", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/auth/device/start",
        async () =>
          jsonResponse(200, {
            deviceCode: "device-code-1",
            userCode: "ABCD-EFGH",
            verificationUri: "http://localhost:3000/admin/device",
            verificationUriComplete: "http://localhost:3000/admin/device?user_code=ABCD-EFGH",
            expiresAt: "2099-04-07T10:10:00.000Z",
            intervalSeconds: 0,
          }),
      ],
      [
        "POST http://localhost:3000/api/auth/device/poll",
        async () =>
          jsonResponse(200, {
            status: "authorized",
            accessToken: "device-token-1",
            expiresAt: "2099-04-07T22:00:00.000Z",
            session: {
              neonUserId: "neon-user-1",
              authMode: "device",
            },
          }),
      ],
      [
        "GET http://localhost:3000/api/workshop",
        async (_url, options) => {
          assert.equal(options.headers.authorization, "Bearer device-token-1");
          return jsonResponse(200, { workshopId: "sample-studio-a", workshopMeta: { title: "Harness Lab" }, templates: [] });
        },
      ],
      [
        "GET http://localhost:3000/api/agenda",
        async (_url, options) => {
          assert.equal(options.headers.authorization, "Bearer device-token-1");
          return jsonResponse(200, { phase: { id: "build-1", title: "Build Phase 1" }, items: [] });
        },
      ],
    ]),
  );

  await runCli(["auth", "login"], loginIo, {
    fetchFn,
    openUrl: async () => {},
    sleepFn: async () => {},
  });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "status"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /Build Phase 1/);
});

test("device auth can drive workshop create-instance with the brokered facilitator session", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/auth/device/start",
        async () =>
          jsonResponse(200, {
            deviceCode: "device-code-1",
            userCode: "ABCD-EFGH",
            verificationUri: "http://localhost:3000/admin/device",
            verificationUriComplete: "http://localhost:3000/admin/device?user_code=ABCD-EFGH",
            expiresAt: "2099-04-07T10:10:00.000Z",
            intervalSeconds: 0,
          }),
      ],
      [
        "POST http://localhost:3000/api/auth/device/poll",
        async () =>
          jsonResponse(200, {
            status: "authorized",
            accessToken: "device-token-1",
            expiresAt: "2099-04-07T22:00:00.000Z",
            session: {
              neonUserId: "neon-user-1",
              authMode: "device",
            },
          }),
      ],
      [
        "POST http://localhost:3000/api/workshop/instances",
        async (_url, options) => {
          assert.equal(options.headers.authorization, "Bearer device-token-1");
          assert.equal(options.headers.origin, "http://localhost:3000");
          assert.deepEqual(JSON.parse(String(options.body)), {
            id: "developer-hackathon-brno-21-4-dakar",
            eventTitle: "Developer Hackathon Brno",
          });
          return jsonResponse(200, {
            ok: true,
            created: false,
            instance: {
              id: "developer-hackathon-brno-21-4-dakar",
              status: "prepared",
              workshopMeta: { eventTitle: "Developer Hackathon Brno" },
            },
          });
        },
      ],
    ]),
  );

  await runCli(["auth", "login"], loginIo, {
    fetchFn,
    openUrl: async () => {},
    sleepFn: async () => {},
  });

  const io = createMemoryIo(env);
  const exitCode = await runCli(
    ["workshop", "create-instance", "developer-hackathon-brno-21-4-dakar", "--event-title", "Developer Hackathon Brno"],
    io,
    { fetchFn },
  );
  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /"created": false/);
  assert.match(io.getStdout(), /Developer Hackathon Brno/);
});

test("neon auth login stores a cookie-backed session and verifies it remotely", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const io = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/auth/sign-in/email",
        async (_url, options) => {
          assert.deepEqual(JSON.parse(String(options.body)), { email: "facilitator@example.com", password: "secret-pass" });
          return responseWithSetCookie(
            200,
            { token: true },
            "better-auth.session_token=abc123; Path=/; HttpOnly",
          );
        },
      ],
      [
        "GET http://localhost:3000/api/auth/get-session",
        async (_url, options) => {
          assert.equal(options.headers.cookie, "better-auth.session_token=abc123");
          return jsonResponse(200, { user: { email: "facilitator@example.com" } });
        },
      ],
    ]),
  );

  const exitCode = await runCli(
    ["auth", "login", "--auth", "neon", "--email", "facilitator@example.com", "--password", "secret-pass"],
    io,
    { fetchFn },
  );

  assert.equal(exitCode, 0);
  const session = await readSession(env);
  assert.equal(session.authType, "neon");
  assert.equal(session.cookieHeader, "better-auth.session_token=abc123");
});

test("neon auth status verifies the remote session", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/auth/sign-in/email",
        async () => responseWithSetCookie(200, { token: true }, "better-auth.session_token=abc123; Path=/; HttpOnly"),
      ],
      [
        "GET http://localhost:3000/api/auth/get-session",
        async () => jsonResponse(200, { user: { email: "facilitator@example.com" } }),
      ],
    ]),
  );

  await runCli(
    ["auth", "login", "--auth", "neon", "--email", "facilitator@example.com", "--password", "secret-pass"],
    loginIo,
    { fetchFn },
  );

  const io = createMemoryIo(env);
  const exitCode = await runCli(["auth", "status"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /facilitator@example.com/);
});

test("neon auth logout revokes the remote session before clearing local state", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const loginIo = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/auth/sign-in/email",
        async () => responseWithSetCookie(200, { token: true }, "better-auth.session_token=abc123; Path=/; HttpOnly"),
      ],
      [
        "GET http://localhost:3000/api/auth/get-session",
        async () => jsonResponse(200, { user: { email: "facilitator@example.com" } }),
      ],
      [
        "POST http://localhost:3000/api/auth/sign-out",
        async (_url, options) => {
          assert.equal(options.headers.cookie, "better-auth.session_token=abc123");
          return jsonResponse(200, { ok: true });
        },
      ],
    ]),
  );

  await runCli(
    ["auth", "login", "--auth", "neon", "--email", "facilitator@example.com", "--password", "secret-pass"],
    loginIo,
    { fetchFn },
  );

  const io = createMemoryIo(env);
  const exitCode = await runCli(["auth", "logout"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.equal(await readSession(env), null);
});
