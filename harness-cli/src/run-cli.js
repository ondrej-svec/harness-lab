import { getDefaultDashboardUrl } from "./config.js";
import { createHarnessClient, HarnessApiError } from "./client.js";
import { prompt, writeLine } from "./io.js";
import { deleteSession, readSession, sanitizeSession, writeSession, getSessionStorageMode, SessionStoreError } from "./session-store.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const positionals = [];
  const flags = {};

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value.startsWith("--")) {
      const key = value.slice(2);
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        flags[key] = true;
        continue;
      }
      flags[key] = next;
      index += 1;
      continue;
    }
    positionals.push(value);
  }

  return { positionals, flags };
}

function buildBasicAuthorizationHeader(username, password) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function buildCookieHeader(setCookieValue) {
  return setCookieValue
    .split(/,(?=[^;]+=[^;]+)/)
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function printUsage(io) {
  writeLine(io.stdout, "Usage:");
  writeLine(io.stdout, "  harness auth login [--auth device|basic|neon] [--dashboard-url URL] [--username USER] [--email EMAIL] [--password PASS] [--no-open]");
  writeLine(io.stdout, "  harness auth logout");
  writeLine(io.stdout, "  harness auth status");
  writeLine(io.stdout, "  harness workshop status");
  writeLine(io.stdout, "  harness workshop archive [--notes TEXT]");
  writeLine(io.stdout, "  harness workshop phase set <phase-id>");
}

function formatStorageError(error) {
  if (error instanceof SessionStoreError) {
    return error.message;
  }

  return "Harness CLI could not access the configured session store.";
}

async function persistSession(io, env, session) {
  try {
    await writeSession(env, session);
    return true;
  } catch (error) {
    writeLine(io.stderr, `Session storage failed: ${formatStorageError(error)}`);
    return false;
  }
}

async function handleBasicAuthLogin(io, env, flags, deps) {
  const dashboardUrl = String(flags["dashboard-url"] ?? getDefaultDashboardUrl(env));
  const username = String(flags.username ?? env.HARNESS_ADMIN_USERNAME ?? (await prompt(io, "Username: ")));
  const password = String(flags.password ?? env.HARNESS_ADMIN_PASSWORD ?? (await prompt(io, "Password: ")));

  if (!username || !password) {
    writeLine(io.stderr, "Username and password are required.");
    return 1;
  }

  const session = {
    authType: "basic",
    mode: "local-dev",
    dashboardUrl,
    username,
    authorizationHeader: buildBasicAuthorizationHeader(username, password),
    loggedInAt: new Date().toISOString(),
  };

  const client = createHarnessClient({ fetchFn: deps.fetchFn, session });

  try {
    const payload = await client.verifyAccess();
    if (!(await persistSession(io, env, session))) {
      return 1;
    }
    writeLine(io.stdout, `Logged in to ${dashboardUrl}`);
    writeLine(io.stdout, `Session storage: ${getSessionStorageMode(env)}`);
    if (payload?.workshopId) {
      writeLine(io.stdout, `Workshop: ${payload.workshopId}`);
    }
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      writeLine(io.stderr, `Login failed: ${error.message}`);
      return 1;
    }
    throw error;
  }
}

async function handleNeonAuthLogin(io, env, flags, deps) {
  const dashboardUrl = String(flags["dashboard-url"] ?? getDefaultDashboardUrl(env));
  const email = String(flags.email ?? env.HARNESS_FACILITATOR_EMAIL ?? (await prompt(io, "Email: ")));
  const password = String(flags.password ?? env.HARNESS_FACILITATOR_PASSWORD ?? (await prompt(io, "Password: ")));

  if (!email || !password) {
    writeLine(io.stderr, "Email and password are required.");
    return 1;
  }

  const signInResponse = await deps.fetchFn(`${dashboardUrl.replace(/\/$/, "")}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await readJson(signInResponse);
  if (!signInResponse.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : `Login failed with status ${signInResponse.status}`;
    writeLine(io.stderr, `Login failed: ${message}`);
    return 1;
  }

  const setCookie = signInResponse.headers?.get?.("set-cookie");
  if (!setCookie) {
    writeLine(io.stderr, "Login failed: auth response did not include a session cookie.");
    return 1;
  }

  const session = {
    authType: "neon",
    mode: "session-cookie",
    dashboardUrl,
    email,
    cookieHeader: buildCookieHeader(setCookie),
    loggedInAt: new Date().toISOString(),
  };

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const authSession = await client.getAuthSession();
    if (!(await persistSession(io, env, session))) {
      return 1;
    }
    writeLine(io.stdout, `Logged in to ${dashboardUrl}`);
    writeLine(io.stdout, `Session storage: ${getSessionStorageMode(env)}`);
    if (authSession?.user?.email) {
      writeLine(io.stdout, `Facilitator: ${authSession.user.email}`);
    }
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      writeLine(io.stderr, `Session verification failed: ${error.message}`);
      return 1;
    }
    throw error;
  }
}

async function handleDeviceAuthLogin(io, env, flags, deps) {
  const dashboardUrl = String(flags["dashboard-url"] ?? getDefaultDashboardUrl(env));
  const client = createHarnessClient({
    fetchFn: deps.fetchFn,
    session: { dashboardUrl },
  });

  try {
    const deviceAuth = await client.startDeviceAuthorization();
    writeLine(io.stdout, `Open: ${deviceAuth.verificationUriComplete ?? deviceAuth.verificationUri}`);
    writeLine(io.stdout, `Code: ${deviceAuth.userCode}`);
    writeLine(io.stdout, `Expires: ${deviceAuth.expiresAt}`);
    writeLine(io.stdout, "Approve the login in a browser, then the CLI will continue automatically.");

    if (flags["no-open"] !== true && typeof deps.openUrl === "function") {
      await deps.openUrl(deviceAuth.verificationUriComplete ?? deviceAuth.verificationUri);
    }

    while (Date.now() < Date.parse(deviceAuth.expiresAt)) {
      const result = await client.pollDeviceAuthorization(deviceAuth.deviceCode);

      if (result.status === "authorization_pending") {
        await (deps.sleepFn ?? sleep)(Number(result.intervalSeconds ?? deviceAuth.intervalSeconds ?? 5) * 1000);
        continue;
      }

      if (result.status === "authorized") {
        const session = {
          authType: "device",
          mode: "broker-token",
          dashboardUrl,
          accessToken: result.accessToken,
          neonUserId: result.session?.neonUserId ?? null,
          role: result.session?.role ?? null,
          loggedInAt: new Date().toISOString(),
          expiresAt: result.expiresAt,
        };

        if (!(await persistSession(io, env, session))) {
          return 1;
        }

        writeLine(io.stdout, `Logged in to ${dashboardUrl}`);
        writeLine(io.stdout, `Session storage: ${getSessionStorageMode(env)}`);
        if (result.session?.role) {
          writeLine(io.stdout, `Facilitator role: ${result.session.role}`);
        }
        return 0;
      }

      if (result.status === "access_denied") {
        writeLine(io.stderr, "Login failed: device authorization was denied.");
        return 1;
      }

      if (result.status === "expired_token") {
        writeLine(io.stderr, "Login failed: device authorization expired.");
        return 1;
      }

      writeLine(io.stderr, "Login failed: device authorization could not be completed.");
      return 1;
    }

    writeLine(io.stderr, "Login failed: device authorization expired.");
    return 1;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      writeLine(io.stderr, `Login failed: ${error.message}`);
      return 1;
    }

    if (error instanceof SessionStoreError) {
      writeLine(io.stderr, `Session storage failed: ${error.message}`);
      return 1;
    }

    throw error;
  }
}

async function handleAuthLogin(io, env, flags, deps) {
  const authMode = String(flags.auth ?? env.HARNESS_AUTH_MODE ?? "device");

  if (authMode === "device") {
    return handleDeviceAuthLogin(io, env, flags, deps);
  }

  if (authMode === "neon") {
    return handleNeonAuthLogin(io, env, flags, deps);
  }

  return handleBasicAuthLogin(io, env, flags, deps);
}

async function requireSession(io, env) {
  try {
    const session = await readSession(env);
    if (!session) {
      writeLine(io.stderr, "No active session. Run `harness auth login` first.");
      return null;
    }
    return session;
  } catch (error) {
    writeLine(io.stderr, `Session storage failed: ${formatStorageError(error)}`);
    return null;
  }
}

async function handleAuthStatus(io, env, deps) {
  let session;
  try {
    session = await readSession(env);
  } catch (error) {
    writeLine(io.stderr, `Session storage failed: ${formatStorageError(error)}`);
    return 1;
  }

  if (!session) {
    writeLine(io.stdout, "Not logged in.");
    return 0;
  }

  if (session.authType === "device") {
    try {
      const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
      const deviceSession = await client.getDeviceSession();
      writeLine(
        io.stdout,
        JSON.stringify({ ok: true, session: sanitizeSession(session, env), remoteSession: deviceSession.session }, null, 2),
      );
      return 0;
    } catch (error) {
      if (error instanceof HarnessApiError) {
        writeLine(io.stdout, JSON.stringify({ ok: false, session: sanitizeSession(session, env), error: error.message }, null, 2));
        return 1;
      }
      throw error;
    }
  }

  if (session.authType === "neon") {
    try {
      const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
      const authSession = await client.getAuthSession();
      writeLine(
        io.stdout,
        JSON.stringify({ ok: true, session: sanitizeSession(session, env), remoteSession: authSession }, null, 2),
      );
      return 0;
    } catch (error) {
      if (error instanceof HarnessApiError) {
        writeLine(io.stdout, JSON.stringify({ ok: false, session: sanitizeSession(session, env), error: error.message }, null, 2));
        return 1;
      }
      throw error;
    }
  }

  writeLine(io.stdout, JSON.stringify({ ok: true, session: sanitizeSession(session, env) }, null, 2));
  return 0;
}

async function handleAuthLogout(io, env, deps) {
  let session;
  try {
    session = await readSession(env);
  } catch (error) {
    writeLine(io.stderr, `Session storage failed: ${formatStorageError(error)}`);
    return 1;
  }

  if (session?.authType === "device") {
    try {
      const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
      await client.signOutDeviceSession();
    } catch (error) {
      if (!(error instanceof HarnessApiError)) {
        throw error;
      }
    }
  }

  if (session?.authType === "neon") {
    try {
      const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
      await client.signOutAuthSession();
    } catch (error) {
      if (!(error instanceof HarnessApiError)) {
        throw error;
      }
    }
  }

  try {
    await deleteSession(env);
  } catch (error) {
    writeLine(io.stderr, `Session storage failed: ${formatStorageError(error)}`);
    return 1;
  }
  writeLine(io.stdout, "Logged out.");
  return 0;
}

async function handleWorkshopStatus(io, env, deps) {
  const session = await requireSession(io, env);
  if (!session) {
    return 1;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const [workshop, agenda] = await Promise.all([client.getWorkshopStatus(), client.getAgenda()]);
    writeLine(
      io.stdout,
      JSON.stringify(
        {
          ok: true,
          workshopId: workshop.workshopId,
          workshopMeta: workshop.workshopMeta,
          currentPhase: agenda.phase,
          templates: workshop.templates,
        },
        null,
        2,
      ),
    );
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      writeLine(io.stderr, `Workshop status failed: ${error.message}`);
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopArchive(io, env, flags, deps) {
  const session = await requireSession(io, env);
  if (!session) {
    return 1;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const result = await client.archiveWorkshop(typeof flags.notes === "string" ? flags.notes : undefined);
    writeLine(io.stdout, JSON.stringify(result, null, 2));
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      writeLine(io.stderr, `Archive failed: ${error.message}`);
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopPhaseSet(io, env, positionals, deps) {
  const phaseId = positionals[3];
  if (!phaseId) {
    writeLine(io.stderr, "Phase id is required.");
    return 1;
  }

  const session = await requireSession(io, env);
  if (!session) {
    return 1;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const result = await client.setCurrentPhase(phaseId);
    writeLine(io.stdout, JSON.stringify(result, null, 2));
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      writeLine(io.stderr, `Phase update failed: ${error.message}`);
      return 1;
    }
    throw error;
  }
}

export async function runCli(argv, io, deps = {}) {
  const fetchFn = deps.fetchFn ?? globalThis.fetch;
  if (typeof fetchFn !== "function") {
    throw new Error("Fetch is required to run the harness CLI.");
  }

  const mergedDeps = { fetchFn, sleepFn: deps.sleepFn, openUrl: deps.openUrl };
  const { positionals, flags } = parseArgs(argv);
  const [scope, action, subaction] = positionals;

  if (flags.help === true) {
    printUsage(io);
    return 0;
  }

  if (!scope) {
    printUsage(io);
    return 1;
  }

  if (scope === "auth" && action === "login") {
    return handleAuthLogin(io, io.env, flags, mergedDeps);
  }

  if (scope === "auth" && action === "logout") {
    return handleAuthLogout(io, io.env, mergedDeps);
  }

  if (scope === "auth" && action === "status") {
    return handleAuthStatus(io, io.env, mergedDeps);
  }

  if (scope === "workshop" && action === "status") {
    return handleWorkshopStatus(io, io.env, mergedDeps);
  }

  if (scope === "workshop" && action === "archive") {
    return handleWorkshopArchive(io, io.env, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "phase" && subaction === "set") {
    return handleWorkshopPhaseSet(io, io.env, positionals, mergedDeps);
  }

  printUsage(io);
  return 1;
}
