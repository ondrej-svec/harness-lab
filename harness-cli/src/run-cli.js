import { getDefaultDashboardUrl } from "./config.js";
import { createHarnessClient, HarnessApiError } from "./client.js";
import { createCliUi, prompt, writeLine } from "./io.js";
import { deleteSession, readSession, sanitizeSession, writeSession, getSessionStorageMode, SessionStoreError } from "./session-store.js";
import { installWorkshopSkill, SkillInstallError } from "./skill-install.js";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const positionals = [];
  const flags = {};

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "-h") {
      flags.help = true;
      continue;
    }
    if (value === "-v") {
      flags.version = true;
      continue;
    }
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

function readStringFlag(flags, ...keys) {
  for (const key of keys) {
    if (typeof flags[key] === "string") {
      const trimmed = String(flags[key]).trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return undefined;
}

function readOptionalPositional(positionals, index) {
  const value = positionals[index];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function readRequiredCommandValue(io, flags, keys, promptLabel, fallbackValue) {
  const fromFlags = readStringFlag(flags, ...keys);
  if (fromFlags) {
    return fromFlags;
  }

  if (typeof fallbackValue === "string" && fallbackValue.trim().length > 0) {
    return fallbackValue.trim();
  }

  const prompted = await prompt(io, promptLabel);
  return prompted.trim();
}

function buildWorkshopMetadataInput(flags) {
  const input = {
    eventTitle: readStringFlag(flags, "event-title", "title"),
    city: readStringFlag(flags, "city"),
    dateRange: readStringFlag(flags, "date-range", "date"),
    venueName: readStringFlag(flags, "venue-name", "venue"),
    roomName: readStringFlag(flags, "room-name", "room"),
    addressLine: readStringFlag(flags, "address-line", "address"),
    locationDetails: readStringFlag(flags, "location-details", "location"),
    facilitatorLabel: readStringFlag(flags, "facilitator-label", "facilitator"),
  };

  return Object.fromEntries(Object.entries(input).filter(([, value]) => typeof value === "string"));
}

function hasWorkshopMetadataInput(input) {
  return Object.keys(input).length > 0;
}

async function promptWorkshopMetadataInput(io) {
  const prompts = [
    ["eventTitle", "Event title (leave blank to skip): "],
    ["city", "City (leave blank to skip): "],
    ["dateRange", "Date range (leave blank to skip): "],
    ["venueName", "Venue name (leave blank to skip): "],
    ["roomName", "Room name (leave blank to skip): "],
    ["addressLine", "Address line (leave blank to skip): "],
    ["locationDetails", "Location details (leave blank to skip): "],
    ["facilitatorLabel", "Facilitator label (leave blank to skip): "],
  ];
  const values = {};

  for (const [key, label] of prompts) {
    const value = await prompt(io, label);
    if (value) {
      values[key] = value;
    }
  }

  return values;
}

function summarizeWorkshopInstance(instance) {
  const workshopMeta = instance?.workshopMeta ?? {};

  return {
    instanceId: instance?.id ?? null,
    status: instance?.status ?? null,
    eventTitle: workshopMeta.eventTitle ?? null,
    city: workshopMeta.city ?? null,
    dateRange: workshopMeta.dateRange ?? null,
    venueName: workshopMeta.venueName ?? null,
    roomName: workshopMeta.roomName ?? null,
  };
}

function printUsage(io, ui) {
  ui.heading("Harness CLI");
  ui.paragraph(`Version ${version}`);
  ui.blank();
  ui.section("Usage");
  ui.commandList([
    "harness --help",
    "harness --version",
    "harness version",
  ]);
  ui.blank();
  ui.section("Commands");
  ui.commandList([
    "harness auth login [--auth device|basic|neon] [--dashboard-url URL] [--username USER] [--email EMAIL] [--password PASS] [--no-open]",
    "harness auth logout",
    "harness auth status",
    "harness skill install [--force]",
    "harness workshop status",
    "harness workshop archive [--notes TEXT]",
    "harness workshop create-instance [<instance-id>] [--template-id ID] [--event-title TEXT] [--city CITY]",
    "harness workshop update-instance <instance-id> [--event-title TEXT] [--city CITY]",
    "harness workshop prepare <instance-id>",
    "harness workshop remove-instance <instance-id>",
    "harness workshop phase set <phase-id>",
  ]);
}

function printVersion(io) {
  writeLine(io.stdout, `harness ${version}`);
}

async function handleSkillInstall(io, ui, deps, flags) {
  try {
    const result = await installWorkshopSkill(deps.cwd ?? process.cwd(), { force: flags.force === true });
    ui.heading("Workshop Skill");
    if (result.mode === "already_bundled") {
      ui.status("ok", "Harness Lab workshop skill is already bundled in this repo.");
    } else {
      ui.status("ok", "Installed the Harness Lab workshop skill bundle.");
    }
    ui.keyValue("Location", result.installPath);
    ui.keyValue("Discovery", ".agents/skills");
    ui.blank();
    ui.section("Next steps");
    ui.numberedList([
      "Open Codex or pi in this repo.",
      "Start with the workshop reference card.",
      "Codex: `$workshop reference`.",
      "pi: `/skill:workshop`, then ask for the workshop reference card.",
      "Need setup help? Codex: `$workshop setup`. pi: `/skill:workshop`, then ask for setup help.",
    ]);
    return 0;
  } catch (error) {
    if (error instanceof SkillInstallError) {
      ui.status("error", `Skill install failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

function formatStorageError(error) {
  if (error instanceof SessionStoreError) {
    return error.message;
  }

  return "Harness CLI could not access the configured session store.";
}

async function persistSession(io, ui, env, session) {
  try {
    await writeSession(env, session);
    return true;
  } catch (error) {
    ui.status("error", `Session storage failed: ${formatStorageError(error)}`, { stream: "stderr" });
    return false;
  }
}

async function handleBasicAuthLogin(io, ui, env, flags, deps) {
  const dashboardUrl = String(flags["dashboard-url"] ?? getDefaultDashboardUrl(env));
  const username = String(flags.username ?? env.HARNESS_ADMIN_USERNAME ?? (await prompt(io, "Username: ")));
  const password = String(flags.password ?? env.HARNESS_ADMIN_PASSWORD ?? (await prompt(io, "Password: ")));

  if (!username || !password) {
    ui.status("error", "Username and password are required.", { stream: "stderr" });
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
    if (!(await persistSession(io, ui, env, session))) {
      return 1;
    }
    ui.heading("Auth Login");
    ui.status("ok", "Logged in.");
    ui.keyValue("Dashboard", dashboardUrl);
    ui.keyValue("Session storage", getSessionStorageMode(env));
    if (payload?.workshopId) {
      ui.keyValue("Workshop", payload.workshopId);
    }
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Login failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleNeonAuthLogin(io, ui, env, flags, deps) {
  const dashboardUrl = String(flags["dashboard-url"] ?? getDefaultDashboardUrl(env));
  const email = String(flags.email ?? env.HARNESS_FACILITATOR_EMAIL ?? (await prompt(io, "Email: ")));
  const password = String(flags.password ?? env.HARNESS_FACILITATOR_PASSWORD ?? (await prompt(io, "Password: ")));

  if (!email || !password) {
    ui.status("error", "Email and password are required.", { stream: "stderr" });
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
    ui.status("error", `Login failed: ${message}`, { stream: "stderr" });
    return 1;
  }

  const setCookie = signInResponse.headers?.get?.("set-cookie");
  if (!setCookie) {
    ui.status("error", "Login failed: auth response did not include a session cookie.", { stream: "stderr" });
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
    if (!(await persistSession(io, ui, env, session))) {
      return 1;
    }
    ui.heading("Auth Login");
    ui.status("ok", "Logged in.");
    ui.keyValue("Dashboard", dashboardUrl);
    ui.keyValue("Session storage", getSessionStorageMode(env));
    if (authSession?.user?.email) {
      ui.keyValue("Facilitator", authSession.user.email);
    }
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Session verification failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleDeviceAuthLogin(io, ui, env, flags, deps) {
  const dashboardUrl = String(flags["dashboard-url"] ?? getDefaultDashboardUrl(env));
  const client = createHarnessClient({
    fetchFn: deps.fetchFn,
    session: { dashboardUrl },
  });

  try {
    const deviceAuth = await client.startDeviceAuthorization();
    ui.heading("Device Login");
    ui.status("info", "Approve the login in a browser. The CLI will continue automatically.");
    ui.keyValue("Open", deviceAuth.verificationUriComplete ?? deviceAuth.verificationUri);
    ui.keyValue("Code", deviceAuth.userCode);
    ui.keyValue("Expires", deviceAuth.expiresAt);

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

        if (!(await persistSession(io, ui, env, session))) {
          return 1;
        }

        ui.blank();
        ui.status("ok", "Logged in.");
        ui.keyValue("Dashboard", dashboardUrl);
        ui.keyValue("Session storage", getSessionStorageMode(env));
        if (result.session?.role) {
          ui.keyValue("Facilitator role", result.session.role);
        }
        return 0;
      }

      if (result.status === "access_denied") {
        ui.status("error", "Login failed: device authorization was denied.", { stream: "stderr" });
        return 1;
      }

      if (result.status === "expired_token") {
        ui.status("error", "Login failed: device authorization expired.", { stream: "stderr" });
        return 1;
      }

      ui.status("error", "Login failed: device authorization could not be completed.", { stream: "stderr" });
      return 1;
    }

    ui.status("error", "Login failed: device authorization expired.", { stream: "stderr" });
    return 1;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Login failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }

    if (error instanceof SessionStoreError) {
      ui.status("error", `Session storage failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }

    throw error;
  }
}

async function handleAuthLogin(io, ui, env, flags, deps) {
  const authMode = String(flags.auth ?? env.HARNESS_AUTH_MODE ?? "device");

  if (authMode === "device") {
    return handleDeviceAuthLogin(io, ui, env, flags, deps);
  }

  if (authMode === "neon") {
    return handleNeonAuthLogin(io, ui, env, flags, deps);
  }

  return handleBasicAuthLogin(io, ui, env, flags, deps);
}

async function requireSession(io, ui, env) {
  try {
    const session = await readSession(env);
    if (!session) {
      ui.status("error", "No active session. Run `harness auth login` first.", { stream: "stderr" });
      return null;
    }
    return session;
  } catch (error) {
    ui.status("error", `Session storage failed: ${formatStorageError(error)}`, { stream: "stderr" });
    return null;
  }
}

async function handleAuthStatus(io, ui, env, deps) {
  let session;
  try {
    session = await readSession(env);
  } catch (error) {
    ui.status("error", `Session storage failed: ${formatStorageError(error)}`, { stream: "stderr" });
    return 1;
  }

  if (!session) {
    ui.status("info", "Not logged in.");
    return 0;
  }

  if (session.authType === "device") {
    try {
      const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
      const deviceSession = await client.getDeviceSession();
      ui.json("Auth Status", { ok: true, session: sanitizeSession(session, env), remoteSession: deviceSession.session });
      return 0;
    } catch (error) {
      if (error instanceof HarnessApiError) {
        ui.json("Auth Status", { ok: false, session: sanitizeSession(session, env), error: error.message });
        return 1;
      }
      throw error;
    }
  }

  if (session.authType === "neon") {
    try {
      const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
      const authSession = await client.getAuthSession();
      ui.json("Auth Status", { ok: true, session: sanitizeSession(session, env), remoteSession: authSession });
      return 0;
    } catch (error) {
      if (error instanceof HarnessApiError) {
        ui.json("Auth Status", { ok: false, session: sanitizeSession(session, env), error: error.message });
        return 1;
      }
      throw error;
    }
  }

  ui.json("Auth Status", { ok: true, session: sanitizeSession(session, env) });
  return 0;
}

async function handleAuthLogout(io, ui, env, deps) {
  let session;
  try {
    session = await readSession(env);
  } catch (error) {
    ui.status("error", `Session storage failed: ${formatStorageError(error)}`, { stream: "stderr" });
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
    ui.status("error", `Session storage failed: ${formatStorageError(error)}`, { stream: "stderr" });
    return 1;
  }
  ui.status("ok", "Logged out.");
  return 0;
}

async function handleWorkshopStatus(io, ui, env, deps) {
  const session = await requireSession(io, ui, env);
  if (!session) {
    return 1;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const [workshop, agenda] = await Promise.all([client.getWorkshopStatus(), client.getAgenda()]);
    ui.json("Workshop Status", {
      ok: true,
      workshopId: workshop.workshopId,
      workshopMeta: workshop.workshopMeta,
      currentPhase: agenda.phase,
      templates: workshop.templates,
    });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Workshop status failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopArchive(io, ui, env, flags, deps) {
  const session = await requireSession(io, ui, env);
  if (!session) {
    return 1;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const result = await client.archiveWorkshop(typeof flags.notes === "string" ? flags.notes : undefined);
    ui.json("Workshop Archive", result);
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Archive failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopCreateInstance(io, ui, env, positionals, flags, deps) {
  const session = await requireSession(io, ui, env);
  if (!session) {
    return 1;
  }

  const instanceId = await readRequiredCommandValue(
    io,
    flags,
    ["id"],
    "Instance id: ",
    readOptionalPositional(positionals, 2),
  );
  if (!instanceId) {
    ui.status("error", "Instance id is required.", { stream: "stderr" });
    return 1;
  }

  const payload = {
    id: instanceId,
    ...(readStringFlag(flags, "template-id", "template") ? { templateId: readStringFlag(flags, "template-id", "template") } : {}),
    ...buildWorkshopMetadataInput(flags),
  };

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const result = await client.createWorkshopInstance(payload);
    ui.json("Workshop Create Instance", {
      ok: true,
      created: result.created ?? true,
      ...summarizeWorkshopInstance(result.instance),
      instance: result.instance,
    });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Create instance failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopUpdateInstance(io, ui, env, positionals, flags, deps) {
  const session = await requireSession(io, ui, env);
  if (!session) {
    return 1;
  }

  const instanceId = await readRequiredCommandValue(
    io,
    flags,
    ["id"],
    "Instance id: ",
    readOptionalPositional(positionals, 2),
  );
  if (!instanceId) {
    ui.status("error", "Instance id is required.", { stream: "stderr" });
    return 1;
  }

  let payload = buildWorkshopMetadataInput(flags);
  if (!hasWorkshopMetadataInput(payload)) {
    payload = await promptWorkshopMetadataInput(io);
  }

  if (!hasWorkshopMetadataInput(payload)) {
    ui.status(
      "error",
      "At least one metadata field is required. Use flags such as --event-title, --date-range, --venue-name, or --room-name.",
      { stream: "stderr" },
    );
    return 1;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const result = await client.updateWorkshopInstance(instanceId, payload);
    ui.json("Workshop Update Instance", {
      ok: true,
      ...summarizeWorkshopInstance(result.instance),
      instance: result.instance,
    });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Update instance failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopPrepare(io, ui, env, positionals, flags, deps) {
  const session = await requireSession(io, ui, env);
  if (!session) {
    return 1;
  }

  const instanceId = await readRequiredCommandValue(
    io,
    flags,
    ["id", "instance-id"],
    "Instance id: ",
    readOptionalPositional(positionals, 2),
  );
  if (!instanceId) {
    ui.status("error", "Instance id is required.", { stream: "stderr" });
    return 1;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const result = await client.prepareWorkshopInstance(instanceId);
    ui.json("Workshop Prepare", {
      ok: true,
      ...summarizeWorkshopInstance(result.instance),
      instance: result.instance,
    });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Prepare failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopRemoveInstance(io, ui, env, positionals, flags, deps) {
  const session = await requireSession(io, ui, env);
  if (!session) {
    return 1;
  }

  const instanceId = await readRequiredCommandValue(
    io,
    flags,
    ["id", "instance-id"],
    "Instance id: ",
    readOptionalPositional(positionals, 2),
  );
  if (!instanceId) {
    ui.status("error", "Instance id is required.", { stream: "stderr" });
    return 1;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    await client.removeWorkshopInstance(instanceId);
    ui.json("Workshop Remove Instance", {
      ok: true,
      instanceId,
      removed: true,
    });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Remove instance failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopPhaseSet(io, ui, env, positionals, deps) {
  const phaseId = positionals[3];
  if (!phaseId) {
    ui.status("error", "Phase id is required.", { stream: "stderr" });
    return 1;
  }

  const session = await requireSession(io, ui, env);
  if (!session) {
    return 1;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const result = await client.setCurrentPhase(phaseId);
    ui.json("Workshop Phase", result);
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Phase update failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

export async function runCli(argv, io, deps = {}) {
  const fetchFn = deps.fetchFn ?? globalThis.fetch;
  const mergedDeps = { fetchFn, sleepFn: deps.sleepFn, openUrl: deps.openUrl, cwd: deps.cwd };
  const ui = createCliUi(io);
  const { positionals, flags } = parseArgs(argv);
  const [scope, action, subaction] = positionals;

  if (flags.help === true) {
    printUsage(io, ui);
    return 0;
  }

  if (flags.version === true) {
    printVersion(io);
    return 0;
  }

  if (scope === "version") {
    printVersion(io);
    return 0;
  }

  if (!scope) {
    printUsage(io, ui);
    return 1;
  }

  if (typeof fetchFn !== "function") {
    throw new Error("Fetch is required to run the harness CLI.");
  }

  if (scope === "auth" && action === "login") {
    return handleAuthLogin(io, ui, io.env, flags, mergedDeps);
  }

  if (scope === "auth" && action === "logout") {
    return handleAuthLogout(io, ui, io.env, mergedDeps);
  }

  if (scope === "auth" && action === "status") {
    return handleAuthStatus(io, ui, io.env, mergedDeps);
  }

  if (scope === "skill" && action === "install") {
    return handleSkillInstall(io, ui, mergedDeps, flags);
  }

  if (scope === "workshop" && action === "status") {
    return handleWorkshopStatus(io, ui, io.env, mergedDeps);
  }

  if (scope === "workshop" && action === "archive") {
    return handleWorkshopArchive(io, ui, io.env, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "create-instance") {
    return handleWorkshopCreateInstance(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "update-instance") {
    return handleWorkshopUpdateInstance(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "prepare") {
    return handleWorkshopPrepare(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "remove-instance") {
    return handleWorkshopRemoveInstance(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "phase" && subaction === "set") {
    return handleWorkshopPhaseSet(io, ui, io.env, positionals, mergedDeps);
  }

  printUsage(io, ui);
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const exitCode = await runCli(process.argv.slice(2), {
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: process.stderr,
    env: process.env,
  });

  process.exitCode = exitCode;
}
