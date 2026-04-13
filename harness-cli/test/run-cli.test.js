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
  const cookieArray = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie] : []);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        return name.toLowerCase() === "set-cookie" ? cookieArray.join(", ") : null;
      },
      getSetCookie() {
        return cookieArray;
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
  const selectExitCode = await runCli(["instance", "select", "sample-studio-b"], selectIo, { fetchFn });
  assert.equal(selectExitCode, 0);
  assert.match(selectIo.getStdout(), /"selectedInstanceId": "sample-studio-b"/);

  const persisted = await readSession(env);
  assert.equal(persisted.selectedInstanceId, "sample-studio-b");

  const currentIo = createMemoryIo(env);
  const currentExitCode = await runCli(["instance", "current"], currentIo, { fetchFn });
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
  const exitCode = await runCli(["instance", "current"], io, { fetchFn });
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
  const exitCode = await runCli(["instance", "list"], io, { fetchFn });
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
  const exitCode = await runCli(["--json", "instance", "list"], io, { fetchFn });
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
  const exitCode = await runCli(["instance", "show", "sample-studio-b"], io, { fetchFn });
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
  const exitCode = await runCli(["instance", "show", "missing-instance"], io, { fetchFn });
  assert.equal(exitCode, 1);
  assert.match(io.getStderr(), /Show instance failed: instance not found/);
});

test("workshop participant-access inspects facilitator-visible participant access state", async () => {
  const env = await createEnv();
  await writeSession(env, {
    authType: "basic",
    dashboardUrl: "http://localhost:3000",
    loggedInAt: "2026-04-09T10:00:00.000Z",
    selectedInstanceId: "sample-studio-a",
  });

  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/workshop/instances/sample-studio-a/participant-access",
        async () =>
          jsonResponse(200, {
            participantAccess: {
              instanceId: "sample-studio-a",
              active: true,
              version: 1,
              codeId: "hash-123",
              expiresAt: "2026-04-20T12:00:00.000Z",
              canRevealCurrent: true,
              currentCode: "lantern8-context4-handoff2",
              source: "sample",
            },
          }),
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "participant-access"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /lantern8-context4-handoff2/);
  assert.match(io.getStdout(), /"source": "sample"/);
});

test("workshop participant-access can rotate and print a fresh code", async () => {
  const env = await createEnv();
  await writeSession(env, {
    authType: "basic",
    dashboardUrl: "http://localhost:3000",
    loggedInAt: "2026-04-09T10:00:00.000Z",
    selectedInstanceId: "sample-studio-a",
  });

  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/workshop/instances/sample-studio-a/participant-access",
        async (_url, options) => {
          assert.equal(options.headers.origin, "http://localhost:3000");
          assert.equal(options.headers["content-type"], "application/json");
          assert.equal(options.body, JSON.stringify({ action: "rotate", code: "orbit7-bridge4-shift2" }));
          return jsonResponse(200, {
            issuedCode: "orbit7-bridge4-shift2",
            participantAccess: {
              instanceId: "sample-studio-a",
              active: true,
              version: 2,
              codeId: "hash-456",
              expiresAt: "2026-04-23T10:00:00.000Z",
              canRevealCurrent: false,
              currentCode: null,
              source: "issued",
            },
          });
        },
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "participant-access", "--rotate", "--code", "orbit7-bridge4-shift2"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /orbit7-bridge4-shift2/);
  assert.match(io.getStdout(), /"source": "issued"/);
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
      "instance",
      "create",
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
  const exitCode = await runCli(["instance", "create", "Sample Workshop Demo"], io, { fetchFn });
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
      "instance",
      "update",
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
  const exitCode = await runCli(["instance", "update", "--room-name", "Dakar"], io, { fetchFn });
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
    ["instance", "reset", "sample-studio-a", "--template-id", "blueprint-default"],
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
  const exitCode = await runCli(["instance", "reset", "sample-studio-a"], io, { fetchFn });
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
  const exitCode = await runCli(["instance", "remove", "sample-studio-a"], io, { fetchFn });
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
  assert.match(io.getStdout(), /^Setup$/m);
  assert.match(io.getStdout(), /^Authentication$/m);
  assert.match(io.getStdout(), /^Workshop$/m);
  assert.match(io.getStdout(), /^Instance$/m);
  assert.match(io.getStdout(), /^Global flags$/m);
  assert.match(io.getStdout(), /^Examples$/m);
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
  // workshop-skill/ no longer maintains a locales/en/ parallel tree — the
  // root files are English-canonical per
  // docs/adr/2026-04-12-skill-docs-english-canonical.md.
  await assert.rejects(
    fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "workshop-skill", "locales")),
    /ENOENT/,
    "workshop-skill/locales/ must not exist after the D-FU1 migration",
  );
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
  assert.match(io.getStdout(), /Codex\/pi: .*\.agents[\\/]+skills/);
  assert.match(io.getStdout(), /Target:/);
  await assert.rejects(fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "workshop-skill", "SKILL.md")));
  assert.match(io.getStdout(), /\$workshop commands/);
  assert.match(io.getStdout(), /\/skill:workshop/);
  assert.match(io.getStdout(), /\$workshop resources/);
  const installedSkill = await fs.readFile(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "SKILL.md"), "utf8");
  // Whitespace in these assertions is intentionally tolerant: the copy-editor
  // baseline Czech typography pass has historically inserted non-breaking
  // spaces (U+00A0) between single-letter words and the next word. The
  // English dev-facing files are now excluded from that pass (see
  // .copy-editor.yaml), but accept either normal space or NBSP so a stray
  // re-run does not wedge the test suite.
  assert.match(installedSkill, /resolve to a[\s\u00a0]+reviewed fallback locale/);
  assert.match(installedSkill, /English is the default bundled fallback locale/);
  assert.doesNotMatch(installedSkill, /Use Czech for explanations\./);
  const installedReference = await fs.readFile(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "workshop-skill", "reference.md"), "utf8");
  // workshop-skill/reference.md is now English-canonical per
  // docs/adr/2026-04-12-skill-docs-english-canonical.md. The agent responds
  // in the participant's language by translating on the fly, so the reference
  // no longer maintains a separate Czech root file.
  assert.match(installedReference, /The workshop skill is the guaranteed default/);
  assert.match(installedReference, /Verification ladder/);
  const installedFacilitator = await fs.readFile(
    path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "workshop-skill", "facilitator.md"),
    "utf8",
  );
  assert.match(installedFacilitator, /Commands for facilitators who manage workshop instances through an AI agent\./);
  assert.doesNotMatch(installedFacilitator, /Příkazy pro facilitátory/);
  // The English "working defaults" section now lives in the single
  // canonical workshop-skill/reference.md, checked above.
  assert.match(installedReference, /4 working defaults for today/);
  const installedEnglishBrief = await fs.readFile(
    path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "content", "project-briefs", "locales", "en", "devtoolbox-cli.md"),
    "utf8",
  );
  assert.match(installedEnglishBrief, /Every team accumulates small one-off scripts/);
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
  assert.match(io.getStdout(), /Codex\/pi: .*\.agents[\\/]+skills/);
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
  assert.match(refreshedReference, /The workshop skill is the guaranteed default/);
});

test("repo README routes participants through the locale-aware workshop interface", async () => {
  const readme = await fs.readFile(repoReadmeUrl, "utf8");

  assert.match(readme, /\$workshop commands/);
  assert.match(readme, /\/skill:workshop/);
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
  assert.match(installedBlueprintReadme, /canonical bilingual content source/);
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
    ["instance", "create", "developer-hackathon-brno-21-4-dakar", "--event-title", "Developer Hackathon Brno"],
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

test("workshop learnings returns an empty list when the log does not exist", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "harness-learnings-"));
  const env = { HARNESS_DATA_DIR: tempDir };
  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "learnings", "--json"], io);
  assert.equal(exitCode, 0);
  const result = JSON.parse(io.getStdout());
  assert.equal(result.ok, true);
  assert.deepEqual(result.signals, []);
  assert.equal(result.totalMatched, 0);
  await fs.rm(tempDir, { recursive: true, force: true });
});

test("workshop learnings reads and filters JSONL entries", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "harness-learnings-"));
  const logPath = path.join(tempDir, "learnings-log.jsonl");
  const entries = [
    { cohort: "2026-Q2", instanceId: "inst-a", loggedAt: "2026-04-09T10:00:00Z", signal: { id: "s1", capturedAt: "2026-04-09T10:00:00Z", capturedBy: "facilitator", tags: ["agents_md_helped"], freeText: "AGENTS.md was found quickly." } },
    { cohort: "2026-Q2", instanceId: "inst-a", loggedAt: "2026-04-09T10:05:00Z", signal: { id: "s2", capturedAt: "2026-04-09T10:05:00Z", capturedBy: "facilitator", tags: ["missing_runbook"], freeText: "Plan referenced a runbook that does not exist.", teamId: "t3" } },
    { cohort: "2026-Q3", instanceId: "inst-b", loggedAt: "2026-07-01T10:00:00Z", signal: { id: "s3", capturedAt: "2026-07-01T10:00:00Z", capturedBy: "facilitator", tags: ["agents_md_helped"], freeText: "Another workshop, same observation." } },
  ];
  await fs.writeFile(logPath, entries.map(JSON.stringify).join("\n") + "\n");

  const env = { HARNESS_DATA_DIR: tempDir };

  const io1 = createMemoryIo(env);
  assert.equal(await runCli(["workshop", "learnings", "--json"], io1), 0);
  const result1 = JSON.parse(io1.getStdout());
  assert.equal(result1.totalMatched, 3);
  assert.equal(result1.returned, 3);

  const io2 = createMemoryIo(env);
  assert.equal(await runCli(["workshop", "learnings", "--json", "--tag", "missing_runbook"], io2), 0);
  const result2 = JSON.parse(io2.getStdout());
  assert.equal(result2.totalMatched, 1);
  assert.equal(result2.signals[0].freeText, "Plan referenced a runbook that does not exist.");

  const io3 = createMemoryIo(env);
  assert.equal(await runCli(["workshop", "learnings", "--json", "--instance", "inst-b"], io3), 0);
  const result3 = JSON.parse(io3.getStdout());
  assert.equal(result3.totalMatched, 1);

  const io4 = createMemoryIo(env);
  assert.equal(await runCli(["workshop", "learnings", "--json", "--cohort", "2026-Q2"], io4), 0);
  const result4 = JSON.parse(io4.getStdout());
  assert.equal(result4.totalMatched, 2);

  const io5 = createMemoryIo(env);
  assert.equal(await runCli(["workshop", "learnings", "--json", "--limit", "1"], io5), 0);
  const result5 = JSON.parse(io5.getStdout());
  assert.equal(result5.totalMatched, 3);
  assert.equal(result5.returned, 1);

  const io6 = createMemoryIo(env);
  assert.equal(await runCli(["workshop", "learnings"], io6), 0);
  assert.match(io6.getStdout(), /3 signals matched/);
  assert.match(io6.getStdout(), /AGENTS.md was found quickly/);

  await fs.rm(tempDir, { recursive: true, force: true });
});

// ═══════════════════════════════════════════════════════════════
// Security tests: participant auth, role enforcement, credential safety
// ═══════════════════════════════════════════════════════════════

test("participant login via event code stores a participant-role session", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const io = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/event-access/redeem",
        async (_url, options) => {
          const body = JSON.parse(String(options.body));
          assert.equal(body.eventCode, "test-event-code-123");
          assert.equal(options.headers.origin, "http://localhost:3000");
          return responseWithSetCookie(
            200,
            { ok: true, expiresAt: "2026-12-31T23:59:59.000Z" },
            ["harness_event_session=abc123; Path=/; HttpOnly; SameSite=lax"],
          );
        },
      ],
    ]),
  );

  const exitCode = await runCli(["auth", "login", "--code", "test-event-code-123"], io, { fetchFn });
  assert.equal(exitCode, 0);

  const session = await readSession(env);
  assert.equal(session.role, "participant");
  assert.equal(session.authType, "event-code");
  assert.equal(session.cookieHeader, "harness_event_session=abc123");
  assert.match(io.getStdout(), /Logged in as participant/);
  assert.match(io.getStdout(), /Role.*participant/);
});

test("participant login with invalid event code fails gracefully", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const io = createMemoryIo(env);
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/event-access/redeem",
        async () => responseWithSetCookie(200, { ok: false, error: "invalid_code" }, []),
      ],
    ]),
  );

  const exitCode = await runCli(["auth", "login", "--code", "wrong-code"], io, { fetchFn });
  assert.equal(exitCode, 1);
  assert.match(io.getStderr(), /invalid/i);

  const session = await readSession(env);
  assert.equal(session, null);
});

test("participant auth status shows role and does not leak credentials", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  await writeSession(env, {
    authType: "event-code",
    role: "participant",
    mode: "participant",
    dashboardUrl: "http://localhost:3000",
    cookieHeader: "harness_event_session=secret-token-value",
    loggedInAt: "2026-04-10T10:00:00.000Z",
    expiresAt: "2026-04-10T22:00:00.000Z",
  });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["auth", "status"], io, { fetchFn: createFetchStub(new Map()) });
  assert.equal(exitCode, 0);

  const stdout = io.getStdout();
  assert.match(stdout, /participant/);
  assert.doesNotMatch(stdout, /secret-token-value/);
  assert.doesNotMatch(stdout, /cookieHeader/);
  assert.doesNotMatch(stdout, /harness_event_session/);
});

test("participant logout clears session and calls the server endpoint", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  await writeSession(env, {
    authType: "event-code",
    role: "participant",
    dashboardUrl: "http://localhost:3000",
    cookieHeader: "harness_event_session=abc123",
  });

  let logoutCalled = false;
  const fetchFn = createFetchStub(
    new Map([
      [
        "POST http://localhost:3000/api/event-access/logout",
        async () => {
          logoutCalled = true;
          return jsonResponse(200, { ok: true });
        },
      ],
    ]),
  );

  const io = createMemoryIo(env);
  const exitCode = await runCli(["auth", "logout"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.equal(logoutCalled, true);
  assert.match(io.getStdout(), /Logged out/);

  const session = await readSession(env);
  assert.equal(session, null);
});

test("participant session cannot access facilitator instance commands", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  await writeSession(env, {
    authType: "event-code",
    role: "participant",
    dashboardUrl: "http://localhost:3000",
    cookieHeader: "harness_event_session=abc123",
  });

  const fetchFn = createFetchStub(new Map());

  for (const args of [
    ["instance", "create", "test-id"],
    ["instance", "list"],
    ["instance", "reset", "test-id"],
    ["instance", "remove", "test-id"],
    ["workshop", "phase", "set", "build-1"],
    ["workshop", "participant-access"],
  ]) {
    const io = createMemoryIo(env);
    const exitCode = await runCli(args, io, { fetchFn });
    assert.equal(exitCode, 1, `Expected failure for: ${args.join(" ")}`);
    assert.match(io.getStderr(), /facilitator/i, `Expected facilitator error for: ${args.join(" ")}`);
  }
});

test("participant session can access workshop brief, challenges, and team", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  await writeSession(env, {
    authType: "event-code",
    role: "participant",
    dashboardUrl: "http://localhost:3000",
    cookieHeader: "harness_event_session=abc123",
  });

  const fetchFn = createFetchStub(
    new Map([
      [
        "GET http://localhost:3000/api/briefs",
        async (_url, options) => {
          assert.equal(options.headers.cookie, "harness_event_session=abc123");
          return jsonResponse(200, {
            items: [{ id: "standup-bot", title: "Standup Bot", problemStatement: "Teams need a daily standup automation." }],
          });
        },
      ],
      [
        "GET http://localhost:3000/api/challenges",
        async () =>
          jsonResponse(200, {
            items: [{ id: "agents-md", title: "Create AGENTS.md", section: "before-lunch" }],
          }),
      ],
      [
        "GET http://localhost:3000/api/teams",
        async (_url, options) => {
          assert.equal(options.headers.cookie, "harness_event_session=abc123");
          return jsonResponse(200, {
            items: [{ id: "team-alpha", name: "Alpha", members: ["Alice", "Bob"] }],
          });
        },
      ],
    ]),
  );

  const briefIo = createMemoryIo(env);
  assert.equal(await runCli(["workshop", "brief"], briefIo, { fetchFn }), 0);
  assert.match(briefIo.getStdout(), /standup/i);

  const challengesIo = createMemoryIo(env);
  assert.equal(await runCli(["workshop", "challenges"], challengesIo, { fetchFn }), 0);
  assert.match(challengesIo.getStdout(), /AGENTS\.md/);

  const teamIo = createMemoryIo(env);
  assert.equal(await runCli(["workshop", "team"], teamIo, { fetchFn }), 0);
  assert.match(teamIo.getStdout(), /Alpha/);
});

test("facilitator credentials are not leaked in json output for any auth type", async () => {
  const secretFields = ["cookieHeader", "authorizationHeader", "accessToken"];

  for (const authCase of [
    { authType: "basic", authorizationHeader: "Basic c2VjcmV0", username: "admin", dashboardUrl: "http://localhost:3000" },
    { authType: "neon", cookieHeader: "session=neon-secret-cookie", email: "a@b.com", dashboardUrl: "http://localhost:3000" },
    { authType: "device", accessToken: "bearer-secret-token", neonUserId: "u1", role: "facilitator", dashboardUrl: "http://localhost:3000" },
    { authType: "event-code", cookieHeader: "harness_event_session=participant-secret", role: "participant", dashboardUrl: "http://localhost:3000" },
  ]) {
    const env = await createEnv();
    env.HARNESS_SESSION_STORAGE = "file";
    await writeSession(env, authCase);

    const fetchFn = createFetchStub(
      new Map([
        ["GET http://localhost:3000/api/auth/device/session", async () => jsonResponse(200, { session: { id: "s1" } })],
        ["GET http://localhost:3000/api/auth/get-session", async () => jsonResponse(200, { user: { email: "a@b.com" } })],
      ]),
    );

    const io = createMemoryIo(env);
    await runCli(["auth", "status"], io, { fetchFn });
    const stdout = io.getStdout();

    for (const field of secretFields) {
      assert.doesNotMatch(stdout, new RegExp(field), `Secret field "${field}" leaked for authType: ${authCase.authType}`);
    }
    assert.doesNotMatch(stdout, /c2VjcmV0/, "Base64 credential leaked");
    assert.doesNotMatch(stdout, /neon-secret-cookie/, "Neon cookie leaked");
    assert.doesNotMatch(stdout, /bearer-secret-token/, "Bearer token leaked");
    assert.doesNotMatch(stdout, /participant-secret/, "Participant cookie leaked");
  }
});

test("expired participant session reports sessionHealth as expired", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  await writeSession(env, {
    authType: "event-code",
    role: "participant",
    dashboardUrl: "http://localhost:3000",
    cookieHeader: "harness_event_session=expired-token",
    expiresAt: "2020-01-01T00:00:00.000Z",
  });

  const io = createMemoryIo(env);
  const exitCode = await runCli(["auth", "status"], io, { fetchFn: createFetchStub(new Map()) });
  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /expired/);
});

test("workshop data commands require an active session", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";

  const fetchFn = createFetchStub(new Map());

  for (const args of [
    ["workshop", "brief"],
    ["workshop", "challenges"],
    ["workshop", "team"],
  ]) {
    const io = createMemoryIo(env);
    const exitCode = await runCli(args, io, { fetchFn });
    assert.equal(exitCode, 1, `Expected failure for: ${args.join(" ")}`);
    assert.match(io.getStderr(), /login/i, `Expected login prompt for: ${args.join(" ")}`);
  }
});

test("workshop team set-repo sends PATCH with participant cookie", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  await writeSession(env, {
    authType: "event-code",
    role: "participant",
    dashboardUrl: "http://localhost:3000",
    cookieHeader: "harness_event_session=abc123",
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  });

  let capturedBody;
  let capturedHeaders;
  const fetchFn = createFetchStub(new Map([
    ["PATCH http://localhost:3000/api/event-context/teams/t1", (_url, options) => {
      capturedBody = JSON.parse(options.body);
      capturedHeaders = options.headers;
      return jsonResponse(200, { ok: true });
    }],
  ]));

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "team", "set-repo", "t1", "https://github.com/test/repo"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.deepEqual(capturedBody, { repoUrl: "https://github.com/test/repo" });
  assert.equal(capturedHeaders.cookie, "harness_event_session=abc123");
});

test("workshop team set-members sends PATCH with comma-separated names", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  await writeSession(env, {
    authType: "event-code",
    role: "participant",
    dashboardUrl: "http://localhost:3000",
    cookieHeader: "harness_event_session=abc123",
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  });

  let capturedBody;
  const fetchFn = createFetchStub(new Map([
    ["PATCH http://localhost:3000/api/event-context/teams/t2", (_url, options) => {
      capturedBody = JSON.parse(options.body);
      return jsonResponse(200, { ok: true });
    }],
  ]));

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "team", "set-members", "t2", "Anna,", "David,", "Eva"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.deepEqual(capturedBody, { members: ["Anna", "David", "Eva"] });
});

test("workshop team set-name sends PATCH with new team name", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  await writeSession(env, {
    authType: "event-code",
    role: "participant",
    dashboardUrl: "http://localhost:3000",
    cookieHeader: "harness_event_session=abc123",
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  });

  let capturedBody;
  const fetchFn = createFetchStub(new Map([
    ["PATCH http://localhost:3000/api/event-context/teams/t1", (_url, options) => {
      capturedBody = JSON.parse(options.body);
      return jsonResponse(200, { ok: true });
    }],
  ]));

  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "team", "set-name", "t1", "Robotníci"], io, { fetchFn });
  assert.equal(exitCode, 0);
  assert.deepEqual(capturedBody, { name: "Robotníci" });
});

test("workshop team set-repo fails without arguments", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  await writeSession(env, {
    authType: "event-code",
    role: "participant",
    dashboardUrl: "http://localhost:3000",
    cookieHeader: "harness_event_session=abc123",
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  });

  const fetchFn = createFetchStub(new Map());
  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "team", "set-repo"], io, { fetchFn });
  assert.equal(exitCode, 1);
  assert.match(io.getStderr(), /usage/i);
});

test("workshop team set-repo requires a session", async () => {
  const env = await createEnv();
  env.HARNESS_SESSION_STORAGE = "file";
  const fetchFn = createFetchStub(new Map());
  const io = createMemoryIo(env);
  const exitCode = await runCli(["workshop", "team", "set-repo", "t1", "https://example.com"], io, { fetchFn });
  assert.equal(exitCode, 1);
  assert.match(io.getStderr(), /login/i);
});

test("demo-setup scaffolds the Phase 3 contrast demo folders", async () => {
  const env = await createEnv();
  const target = await fs.mkdtemp(path.join(os.tmpdir(), "harness-demo-setup-"));
  const fetchFn = createFetchStub(new Map());
  const io = createMemoryIo(env);
  const exitCode = await runCli(["demo-setup", "--target", target], io, { fetchFn });
  assert.equal(exitCode, 0);

  const folderA = path.join(target, "folder-a-bare");
  const folderB = path.join(target, "folder-b-harnessed");

  const readmeA = await fs.readFile(path.join(folderA, "README.md"), "utf-8");
  assert.match(readmeA, /bare repo/i);
  const briefA = await fs.readFile(path.join(folderA, "PROJECT_BRIEF.md"), "utf-8");
  assert.match(briefA, /standup summarizer/i);
  await assert.rejects(
    fs.access(path.join(folderA, "AGENTS.md")),
    /ENOENT/,
    "Folder A must not contain AGENTS.md",
  );

  const agents = await fs.readFile(path.join(folderB, "AGENTS.md"), "utf-8");
  assert.match(agents, /## Goal/);
  assert.match(agents, /## Context/);
  assert.match(agents, /## Constraints/);
  assert.match(agents, /## Done when/);
  const plan = await fs.readFile(path.join(folderB, "PLAN.md"), "utf-8");
  assert.match(plan, /tracer/);
  const seed = await fs.readFile(path.join(folderB, "examples", "standup.txt"), "utf-8");
  assert.match(seed, /Anna/);

  assert.match(io.getStdout(), /Demo setup complete/);
});

test("demo-setup reports failure with a non-zero exit code when target cannot be written", async () => {
  const env = await createEnv();
  const fetchFn = createFetchStub(new Map());
  const io = createMemoryIo(env);
  // Create a regular file and then try to mkdir under it. Creating a
  // directory beneath a non-directory path fails identically on Unix
  // (ENOTDIR) and Windows (ENOENT/ENOTDIR), so this cross-platform
  // pattern is more reliable than the /dev/null trick.
  const blockerFile = path.join(env.HARNESS_CLI_HOME, "not-a-directory");
  await fs.writeFile(blockerFile, "blocker");
  const impossibleTarget = path.join(blockerFile, "impossible");
  const exitCode = await runCli(["demo-setup", "--target", impossibleTarget], io, { fetchFn });
  assert.equal(exitCode, 1);
  assert.match(io.getStderr(), /demo-setup failed/);
});
