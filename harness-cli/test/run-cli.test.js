import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { runCli } from "../src/run-cli.js";
import { readSession, setSessionStoreDepsForTests } from "../src/session-store.js";

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
              role: "owner",
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
  assert.match(io.getStdout(), /Facilitator role: owner/);
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
              role: "owner",
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
            session: { neonUserId: "neon-user-1", role: "owner", authMode: "device" },
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
  assert.match(io.getStdout(), /"role": "owner"/);
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
              role: "owner",
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

test("skill install creates a project-local .agents skill bundle", async () => {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "harness-lab-skill-install-"));
  await fs.mkdir(path.join(repoRoot, "workshop-skill"), { recursive: true });
  await fs.mkdir(path.join(repoRoot, "content", "project-briefs"), { recursive: true });
  await fs.mkdir(path.join(repoRoot, "docs"), { recursive: true });
  await fs.mkdir(path.join(repoRoot, "workshop-blueprint"), { recursive: true });
  await fs.writeFile(path.join(repoRoot, "workshop-skill", "SKILL.md"), "# Workshop\n");
  await fs.writeFile(path.join(repoRoot, "workshop-skill", "setup.md"), "setup\n");
  await fs.writeFile(path.join(repoRoot, "content", "project-briefs", "sample.md"), "brief\n");
  await fs.writeFile(path.join(repoRoot, "docs", "workshop-event-context-contract.md"), "contract\n");
  await fs.writeFile(path.join(repoRoot, "docs", "harness-cli-foundation.md"), "foundation\n");
  await fs.writeFile(path.join(repoRoot, "workshop-blueprint", "README.md"), "blueprint\n");

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
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "docs", "harness-cli-foundation.md"));
  assert.match(io.getStdout(), /Workshop Skill/);
  assert.match(io.getStdout(), /Location: .*\.agents[\\/]+skills/);
  await assert.rejects(fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "workshop-skill", "SKILL.md")));
  assert.match(io.getStdout(), /\$workshop reference/);
  assert.match(io.getStdout(), /\/skill:workshop/);
  assert.match(io.getStdout(), /\$workshop setup/);
  assert.match(io.getStdout(), /setup help/);
});

test("skill install reports the repo-bundled skill instead of pretending to reinstall it", async () => {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "harness-lab-skill-bundled-"));
  await fs.mkdir(path.join(repoRoot, "workshop-skill"), { recursive: true });
  await fs.mkdir(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop"), { recursive: true });
  await fs.writeFile(path.join(repoRoot, "workshop-skill", "SKILL.md"), "# Workshop\n");
  await fs.writeFile(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "SKILL.md"), "# Installed\n");

  const env = await createEnv();
  const io = createMemoryIo(env);
  const exitCode = await runCli(["skill", "install", "--force"], io, {
    fetchFn: async () => {
      throw new Error("fetch should not be called");
    },
    cwd: repoRoot,
  });

  assert.equal(exitCode, 0);
  assert.match(io.getStdout(), /already bundled/);
  assert.match(io.getStdout(), /Location: .*\.agents[\\/]+skills/);
  assert.doesNotMatch(io.getStdout(), /^Installed Harness Lab workshop skill/m);
  await fs.access(path.join(repoRoot, ".agents", "skills", "harness-lab-workshop", "SKILL.md"));
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
              role: "owner",
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
