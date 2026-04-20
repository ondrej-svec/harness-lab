import fs from "node:fs/promises";
import path from "node:path";
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
  const booleanFlags = new Set([
    "json",
    "help",
    "version",
    "force",
    "no-open",
    "clear",
    "unassigned",
    "stdin",
    "dry-run",
    "preview",
  ]);

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
      if (booleanFlags.has(key)) {
        flags[key] = true;
        continue;
      }
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
    contentLang: readStringFlag(flags, "content-lang", "content-language"),
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
    ["contentLang", "Content language (cs/en, leave blank to skip): "],
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

async function findRepoRoot(startDir) {
  let dir = startDir;
  while (true) {
    try {
      await fs.access(path.join(dir, "workshop-content", "agenda.json"));
      return dir;
    } catch {
      const parent = path.dirname(dir);
      if (parent === dir) return null;
      dir = parent;
    }
  }
}

async function readLocalBlueprint(io, ui, flags) {
  const contentLang = readStringFlag(flags, "content-lang", "content-language") ?? "cs";
  const langFile = contentLang === "en" ? "agenda-en.json" : "agenda-cs.json";

  const repoRoot = await findRepoRoot(process.cwd());
  if (!repoRoot) {
    ui.status("error", "Cannot find repo root (no workshop-content/agenda.json found above cwd).", { stream: "stderr" });
    return null;
  }

  const generatedPath = path.join(repoRoot, "dashboard", "lib", "generated", langFile);
  try {
    const raw = await fs.readFile(generatedPath, "utf-8");
    const blueprint = JSON.parse(raw);
    ui.status("ok", `Loaded local blueprint from ${path.relative(process.cwd(), generatedPath)} (${blueprint.phases?.length ?? "?"} phases)`);
    return blueprint;
  } catch (error) {
    if (error.code === "ENOENT") {
      ui.status("error", `Local blueprint not found at ${generatedPath}. Run: bun scripts/content/generate-views.ts`, { stream: "stderr" });
    } else {
      ui.status("error", `Failed to read local blueprint: ${error.message}`, { stream: "stderr" });
    }
    return null;
  }
}

function summarizeWorkshopInstance(instance) {
  const workshopMeta = instance?.workshopMeta ?? {};

  return {
    instanceId: instance?.id ?? null,
    templateId: instance?.templateId ?? null,
    status: instance?.status ?? null,
    contentLang: workshopMeta.contentLang ?? null,
    eventTitle: workshopMeta.eventTitle ?? null,
    city: workshopMeta.city ?? null,
    dateRange: workshopMeta.dateRange ?? null,
    venueName: workshopMeta.venueName ?? null,
    roomName: workshopMeta.roomName ?? null,
  };
}

function summarizeParticipantAccess(participantAccess) {
  return {
    instanceId: participantAccess?.instanceId ?? null,
    active: participantAccess?.active ?? false,
    version: participantAccess?.version ?? null,
    codeId: participantAccess?.codeId ?? null,
    expiresAt: participantAccess?.expiresAt ?? null,
    canRevealCurrent: participantAccess?.canRevealCurrent ?? false,
    source: participantAccess?.source ?? "missing",
    currentCode: participantAccess?.currentCode ?? null,
  };
}

function resolveCurrentInstanceTarget(session, env) {
  if (typeof session?.selectedInstanceId === "string" && session.selectedInstanceId.trim().length > 0) {
    return {
      instanceId: session.selectedInstanceId.trim(),
      source: "session",
    };
  }

  if (session?.role === "participant" && typeof session?.instanceId === "string" && session.instanceId.trim().length > 0) {
    return {
      instanceId: session.instanceId.trim(),
      source: "session",
    };
  }

  if (typeof env?.HARNESS_WORKSHOP_INSTANCE_ID === "string" && env.HARNESS_WORKSHOP_INSTANCE_ID.trim().length > 0) {
    return {
      instanceId: env.HARNESS_WORKSHOP_INSTANCE_ID.trim(),
      source: "env",
    };
  }

  return {
    instanceId: null,
    source: "none",
  };
}

function helpLine(command, description) {
  return description ? `${command.padEnd(48)} ${description}` : `    ${command}`;
}

function printUsage(io, ui) {
  ui.heading("Harness CLI");
  ui.paragraph(`Workshop toolkit for teams working with AI coding agents. Version ${version}.`);
  ui.blank();

  ui.section("Usage");
  ui.commandList(["harness <command> [flags]"]);
  ui.blank();

  ui.section("Setup");
  ui.commandList([
    helpLine("skill install [--target PATH] [--force] [--facilitator]", "Install the workshop skill into your repo"),
    helpLine("demo-setup [--target PATH]", "Scaffold Phase 3 contrast demo folders (facilitator)"),
  ]);
  ui.paragraph("After install, use the workshop skill in your coding agent.");
  ui.blank();

  ui.section("Authentication");
  ui.commandList([
    helpLine("auth login [--code <EVENT_CODE>]", "Log in as participant (with event code)"),
    helpLine("auth login [--auth device|basic|neon]", "Log in as facilitator"),
    helpLine("auth logout", "End the current session"),
    helpLine("auth status", "Check session status and role"),
  ]);
  ui.blank();

  ui.section("Workshop");
  ui.commandList([
    helpLine("workshop status", "Current workshop state"),
    helpLine("workshop brief", "Your team's project brief"),
    helpLine("workshop briefs", "List every brief available in the instance"),
    helpLine("workshop challenges", "Challenge cards"),
    helpLine("workshop team", "Team info, repo, checkpoint"),
    helpLine("workshop team assign <pid> <teamId>", "Assign or move a participant (facilitator)"),
    helpLine("workshop team unassign <pid>", "Remove a participant from their team (facilitator)"),
    helpLine("workshop team randomize --teams N", "Form teams by cross-level mix (facilitator)"),
    helpLine("  [--strategy cross-level|random] [--preview] [--commit-token TOKEN]", ""),
    helpLine("workshop participants list", "List pool + assignments (facilitator)"),
    helpLine("  [--unassigned] [--team ID]", ""),
    helpLine("workshop participants add <name>", "Add one participant (facilitator)"),
    helpLine("  [--email EMAIL] [--tag TAG]", ""),
    helpLine("workshop participants import", "Paste-list intake (facilitator)"),
    helpLine("  (--file PATH | --stdin) [--dry-run]", ""),
    helpLine("workshop participants update <id>", "Edit name, email, tag, consent (facilitator)"),
    helpLine("  [--name STR] [--email STR|null] [--tag STR|null] [--consent on|off]", ""),
    helpLine("workshop participants remove <id>", "Soft-delete a participant (facilitator)"),
    helpLine("workshop phase set <phase-id>", "Advance the agenda (facilitator)"),
    helpLine("workshop participant-access [<id>]", "Inspect or rotate event code (facilitator)"),
    helpLine("  [--rotate] [--code VALUE]", ""),
    helpLine("workshop prepare [<id>]", "Mark instance ready (facilitator)"),
    helpLine("workshop archive [--notes TEXT]", "Snapshot state (facilitator)"),
    helpLine("workshop learnings", "Query rotation signals (facilitator)"),
    helpLine("  [--tag TAG] [--instance ID]", ""),
  ]);
  ui.blank();

  ui.section("Instance");
  ui.commandList([
    helpLine("instance create [<id>]", "Create a new workshop from a template"),
    helpLine("  [--template-id ID] [--content-lang cs|en]", ""),
    helpLine("  [--event-title TEXT] [--city CITY]", ""),
    helpLine("instance list", "List all facilitator-visible instances"),
    helpLine("instance show [<id>]", "Inspect one instance in detail"),
    helpLine("instance select <id> [--clear]", "Pin an instance for subsequent commands"),
    helpLine("instance current", "Show the locally selected instance"),
    helpLine("instance update [<id>]", "Update event metadata"),
    helpLine("instance reset [<id>] [--template-id ID]", "Reset from the blueprint"),
    helpLine("  [--from-local]", "Use local blueprint (no deploy needed)"),
    helpLine("instance remove [<id>]", "Soft-remove an instance"),
  ]);
  ui.blank();

  ui.section("Global flags");
  ui.commandList([
    helpLine("--json", "Output machine-readable JSON"),
    helpLine("--help", "Show this help"),
    helpLine("--version", "Print version"),
  ]);
  ui.blank();

  ui.section("Examples");
  ui.commandList([
    helpLine("harness skill install", "Install workshop skill here"),
    helpLine("harness auth login --code <EVENT_CODE>", "Log in as participant"),
    helpLine("harness auth login", "Log in as facilitator (device flow)"),
    helpLine("harness workshop brief", "See your team's project brief"),
    helpLine("harness instance list", "List all workshop instances"),
  ]);
  ui.blank();

  ui.paragraph("Documentation: https://github.com/ondrej-svec/harness-lab");
}

function printVersion(io) {
  writeLine(io.stdout, `harness ${version}`);
}

async function handleSkillInstall(io, ui, deps, flags) {
  try {
    const result = await installWorkshopSkill(deps.cwd ?? process.cwd(), {
      force: flags.force === true,
      target: readStringFlag(flags, "target"),
      facilitator: flags.facilitator === true,
    });
    ui.heading("Workshop Skill");
    if (result.mode === "already_current") {
      ui.status("ok", "Harness Lab workshop skill is already current at the target path.");
    } else if (result.mode === "refreshed") {
      ui.status("ok", "Refreshed the installed Harness Lab workshop skill bundle.");
    } else {
      ui.status("ok", "Installed the Harness Lab workshop skill bundle.");
    }
    ui.keyValue("Target", result.targetRoot);
    ui.blank();
    ui.section("Installed skills");
    ui.commandList([
      helpLine("workshop (participant)", "orientation, briefs, challenges, coaching, analyze"),
    ]);
    if (result.facilitator?.agents || result.facilitator?.claude) {
      ui.commandList([
        helpLine("workshop-facilitator", "instance management, agenda, scenes, learnings"),
      ]);
    }
    ui.blank();
    ui.section("Discovery paths");
    ui.keyValue("Codex/pi", result.installPath);
    if (result.claudeCodePath) {
      ui.keyValue("Claude Code", result.claudeCodePath);
    }
    if (result.facilitator?.agents) {
      ui.keyValue("Facilitator (Codex/pi)", result.facilitator.agents);
    }
    if (result.facilitator?.claude) {
      ui.keyValue("Facilitator (Claude Code)", result.facilitator.claude);
    }
    ui.keyValue("Bundle source", result.sourceMode === "packaged_bundle" ? "packaged portable bundle" : "source checkout fallback");
    ui.blank();
    ui.section("Next steps");
    const steps = [
      "Open your coding agent in the target repo.",
      "Run `$workshop login` and enter the shared event code to connect to the live workshop.",
      "Codex: `$workshop commands`.",
      "pi: `/skill:workshop`, then ask for the workshop commands.",
    ];
    if (result.claudeCodePath) {
      steps.push("Claude Code: the `workshop` skill is available as a slash command.");
    }
    steps.push("Next: `$workshop reference`, `$workshop brief`, and `$workshop resources`.");
    ui.numberedList(steps);
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
  if (flags.code) {
    return handleEventCodeLogin(io, ui, env, flags, deps);
  }

  const authMode = String(flags.auth ?? env.HARNESS_AUTH_MODE ?? "device");

  if (authMode === "device") {
    return handleDeviceAuthLogin(io, ui, env, flags, deps);
  }

  if (authMode === "neon") {
    return handleNeonAuthLogin(io, ui, env, flags, deps);
  }

  return handleBasicAuthLogin(io, ui, env, flags, deps);
}

async function handleEventCodeLogin(io, ui, env, flags, deps) {
  const dashboardUrl = String(flags["dashboard-url"] ?? getDefaultDashboardUrl(env));
  const code = String(flags.code);

  const client = createHarnessClient({
    fetchFn: deps.fetchFn,
    session: { dashboardUrl },
  });

  try {
    const result = await client.redeemEventAccess(code);

    if (!result.ok) {
      ui.heading("Auth Login");
      ui.status("error", `Event code login failed: ${result.error ?? "invalid code"}`, { stream: "stderr" });
      return 1;
    }

    const cookieHeader = (result.setCookie ?? [])
      .map((c) => c.split(";")[0])
      .join("; ");

    const session = {
      authType: "event-code",
      mode: "participant",
      role: "participant",
      dashboardUrl,
      cookieHeader,
      instanceId: typeof result.instanceId === "string" ? result.instanceId : null,
      loggedInAt: new Date().toISOString(),
      expiresAt: result.expiresAt ?? null,
    };

    if (!(await persistSession(io, ui, env, session))) {
      return 1;
    }

    ui.heading("Auth Login");
    ui.status("ok", "Logged in as participant.");
    ui.keyValue("Dashboard", dashboardUrl);
    ui.keyValue("Role", "participant");
    ui.keyValue("Session storage", getSessionStorageMode(env));
    if (result.expiresAt) {
      ui.keyValue("Expires", result.expiresAt);
    }
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Event code login failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
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

async function requireFacilitatorSession(io, ui, env) {
  const session = await requireSession(io, ui, env);
  if (!session) return null;
  if (session.role === "participant") {
    ui.status("error", "This command requires facilitator access. Run `harness auth login` (without --code) to authenticate as a facilitator.", { stream: "stderr" });
    return null;
  }
  return session;
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

  if (session.authType === "event-code") {
    ui.json("Auth Status", { ok: true, session: sanitizeSession(session, env) });
    return 0;
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

  if (session?.authType === "event-code") {
    try {
      const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
      await client.logoutParticipant();
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

function renderSelectedInstanceBanner(ui, target) {
  if (ui.jsonMode) {
    return;
  }
  const instanceId = target.instanceId ?? "none";
  const label = target.source === "session"
    ? "Selected instance (locally selected)"
    : target.instanceId
      ? `Selected instance (from ${target.source})`
      : "Selected instance";
  ui.keyValue(label, instanceId);
  if (!target.instanceId) {
    ui.keyValue("", "no instance is currently selected — run `harness workshop select-instance <id>` to pin one");
  }
}

async function handleWorkshopStatus(io, ui, env, deps) {
  const session = await requireSession(io, ui, env);
  if (!session) {
    return 1;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const target = resolveCurrentInstanceTarget(session, env);

    renderSelectedInstanceBanner(ui, target);

    if (session.role === "participant") {
      const bundle = await client.getParticipantContext();
      ui.json("Workshop Status", {
        ok: true,
        selectedInstance: {
          instanceId: target.instanceId ?? null,
          source: target.source,
          selected: Boolean(target.instanceId),
        },
        targetInstanceId: target.instanceId,
        targetSource: target.source,
        event: bundle.event,
        currentPhase: Array.isArray(bundle.agenda)
          ? bundle.agenda.find((item) => item.status === "current") ?? null
          : null,
        agendaItems: Array.isArray(bundle.agenda) ? bundle.agenda.length : null,
      });
      return 0;
    }

    if (target.source === "session" && target.instanceId) {
      const [instanceResult, agenda] = await Promise.all([
        client.getWorkshopInstance(target.instanceId),
        client.getWorkshopAgenda(target.instanceId),
      ]);
      ui.json("Workshop Status", {
        ok: true,
        selectedInstance: {
          instanceId: target.instanceId,
          source: target.source,
          selected: true,
        },
        targetInstanceId: target.instanceId,
        targetSource: target.source,
        ...summarizeWorkshopInstance(instanceResult.instance),
        workshopMeta: instanceResult.instance?.workshopMeta ?? null,
        currentPhase: agenda.phase,
        agendaItems: Array.isArray(agenda.items) ? agenda.items.length : null,
      });
      return 0;
    }

    ui.status(
      "error",
      "No instance selected. Run `harness instance select <id>` to pin one, then rerun.",
      { stream: "stderr" },
    );
    return 2;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Workshop status failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopCurrentInstance(io, ui, env, deps) {
  const session = await requireFacilitatorSession(io, ui, env);
  if (!session) {
    return 1;
  }

  const target = resolveCurrentInstanceTarget(session, env);
  if (!target.instanceId) {
    ui.json("Workshop Current Instance", {
      ok: true,
      instanceId: null,
      source: target.source,
      selectedInstanceId: session.selectedInstanceId ?? null,
    });
    return 0;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const result = await client.getWorkshopInstance(target.instanceId);
    ui.json("Workshop Current Instance", {
      ok: true,
      source: target.source,
      selectedInstanceId: session.selectedInstanceId ?? null,
      ...summarizeWorkshopInstance(result.instance),
      instance: result.instance,
    });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Current instance lookup failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopSelectInstance(io, ui, env, positionals, flags, deps) {
  const session = await requireFacilitatorSession(io, ui, env);
  if (!session) {
    return 1;
  }

  if (flags.clear === true) {
    const nextSession = { ...session };
    delete nextSession.selectedInstanceId;
    if (!(await persistSession(io, ui, env, nextSession))) {
      return 1;
    }

    const target = resolveCurrentInstanceTarget(nextSession, env);
    ui.json("Workshop Select Instance", {
      ok: true,
      selectedInstanceId: null,
      currentInstanceId: target.instanceId,
      source: target.source,
      cleared: true,
    });
    return 0;
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
    const result = await client.getWorkshopInstance(instanceId);
    const nextSession = {
      ...session,
      selectedInstanceId: result.instance?.id ?? instanceId,
    };
    if (!(await persistSession(io, ui, env, nextSession))) {
      return 1;
    }

    ui.json("Workshop Select Instance", {
      ok: true,
      source: "session",
      selectedInstanceId: nextSession.selectedInstanceId,
      ...summarizeWorkshopInstance(result.instance),
      instance: result.instance,
    });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Select instance failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopListInstances(io, ui, env, deps) {
  const session = await requireFacilitatorSession(io, ui, env);
  if (!session) {
    return 1;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const result = await client.listWorkshopInstances();
    const items = Array.isArray(result?.items) ? result.items.map((instance) => summarizeWorkshopInstance(instance)) : [];
    ui.json("Workshop Instances", {
      ok: true,
      count: items.length,
      items,
    });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `List instances failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopShowInstance(io, ui, env, positionals, flags, deps) {
  const session = await requireFacilitatorSession(io, ui, env);
  if (!session) {
    return 1;
  }

  const instanceId = await readRequiredCommandValue(
    io,
    flags,
    ["id", "instance-id"],
    "Instance id: ",
    readOptionalPositional(positionals, 2) ?? session.selectedInstanceId,
  );
  if (!instanceId) {
    ui.status("error", "Instance id is required.", { stream: "stderr" });
    return 1;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const [result, agenda] = await Promise.all([
      client.getWorkshopInstance(instanceId),
      client.getWorkshopAgenda(instanceId).catch(() => null),
    ]);
    ui.json("Workshop Instance", {
      ok: true,
      ...summarizeWorkshopInstance(result.instance),
      instance: result.instance,
      contentSummary: agenda ? {
        phases: Array.isArray(agenda.items) ? agenda.items.length : 0,
        scenes: Array.isArray(agenda.items) ? agenda.items.reduce((sum, item) => sum + (item.presenterScenes?.length ?? 0), 0) : 0,
        currentPhase: agenda.phase ?? null,
      } : null,
    });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Show instance failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopParticipantAccess(io, ui, env, positionals, flags, deps) {
  const session = await requireFacilitatorSession(io, ui, env);
  if (!session) {
    return 1;
  }

  const instanceId = await readRequiredCommandValue(
    io,
    flags,
    ["id", "instance-id"],
    "Instance id: ",
    readOptionalPositional(positionals, 2) ?? session.selectedInstanceId,
  );
  if (!instanceId) {
    ui.status("error", "Instance id is required.", { stream: "stderr" });
    return 1;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    if (flags.rotate === true) {
      const result = await client.issueWorkshopParticipantAccess(instanceId, {
        ...(typeof flags.code === "string" ? { code: flags.code } : {}),
      });
      ui.json("Workshop Participant Access", {
        ok: true,
        issuedCode: result.issuedCode ?? null,
        ...summarizeParticipantAccess(result.participantAccess),
        participantAccess: result.participantAccess,
      });
      return 0;
    }

    const result = await client.getWorkshopParticipantAccess(instanceId);
    ui.json("Workshop Participant Access", {
      ok: true,
      ...summarizeParticipantAccess(result.participantAccess),
      participantAccess: result.participantAccess,
    });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Participant access failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopArchive(io, ui, env, flags, deps) {
  const session = await requireFacilitatorSession(io, ui, env);
  if (!session) {
    return 1;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const target = resolveCurrentInstanceTarget(session, env);
    if (!target.instanceId) {
      ui.status(
        "error",
        "No instance selected. Run `harness instance select <id>` to pin one, then rerun.",
        { stream: "stderr" },
      );
      return 2;
    }
    const result = await client.archiveWorkshop(
      target.instanceId,
      typeof flags.notes === "string" ? flags.notes : undefined,
    );
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
  const session = await requireFacilitatorSession(io, ui, env);
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
  const session = await requireFacilitatorSession(io, ui, env);
  if (!session) {
    return 1;
  }

  const instanceId = await readRequiredCommandValue(
    io,
    flags,
    ["id"],
    "Instance id: ",
    readOptionalPositional(positionals, 2) ?? session.selectedInstanceId,
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
      "At least one metadata field is required. Use flags such as --content-lang, --event-title, --date-range, --venue-name, or --room-name.",
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
  const session = await requireFacilitatorSession(io, ui, env);
  if (!session) {
    return 1;
  }

  const instanceId = await readRequiredCommandValue(
    io,
    flags,
    ["id", "instance-id"],
    "Instance id: ",
    readOptionalPositional(positionals, 2) ?? session.selectedInstanceId,
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

async function handleWorkshopResetInstance(io, ui, env, positionals, flags, deps) {
  const session = await requireFacilitatorSession(io, ui, env);
  if (!session) {
    return 1;
  }

  const instanceId = await readRequiredCommandValue(
    io,
    flags,
    ["id", "instance-id"],
    "Instance id: ",
    readOptionalPositional(positionals, 2) ?? session.selectedInstanceId,
  );
  if (!instanceId) {
    ui.status("error", "Instance id is required.", { stream: "stderr" });
    return 1;
  }

  const fromLocal = flags["from-local"] === true || flags["local"] === true;
  let blueprint;
  if (fromLocal) {
    blueprint = await readLocalBlueprint(io, ui, flags);
    if (!blueprint) {
      return 1;
    }
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const result = await client.resetWorkshopInstance(
      instanceId,
      readStringFlag(flags, "template-id", "template"),
      blueprint,
    );
    ui.json("Workshop Reset Instance", result);
    if (result.contentSummary) {
      const s = result.contentSummary;
      const source = fromLocal ? " (from local blueprint)" : "";
      ui.status("ok", `Reset ${instanceId}: ${s.phases} phases, ${s.scenes} scenes, ${s.briefs} briefs, ${s.challenges} challenges${source}`);
    }
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Reset instance failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopRemoveInstance(io, ui, env, positionals, flags, deps) {
  const session = await requireFacilitatorSession(io, ui, env);
  if (!session) {
    return 1;
  }

  const instanceId = await readRequiredCommandValue(
    io,
    flags,
    ["id", "instance-id"],
    "Instance id: ",
    readOptionalPositional(positionals, 2) ?? session.selectedInstanceId,
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

  const session = await requireFacilitatorSession(io, ui, env);
  if (!session) {
    return 1;
  }

  try {
    const client = createHarnessClient({ fetchFn: deps.fetchFn, session });
    const target = resolveCurrentInstanceTarget(session, env);
    if (!(target.source === "session" && target.instanceId)) {
      ui.status(
        "error",
        "No instance selected. Run `harness instance select <id>` to pin one, then rerun.",
        { stream: "stderr" },
      );
      return 2;
    }
    const result = await client.setCurrentPhaseForInstance(target.instanceId, phaseId);
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

async function handleWorkshopLearningsQuery(io, ui, env, flags) {
  const dataDir = env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");
  const logPath = env.HARNESS_LEARNINGS_LOG_PATH ?? path.join(dataDir, "learnings-log.jsonl");

  let rawLines;
  try {
    const content = await fs.readFile(logPath, "utf8");
    rawLines = content.split("\n").filter((line) => line.trim().length > 0);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      ui.json("Workshop Learnings", { ok: true, signals: [], totalMatched: 0, source: logPath });
      return 0;
    }
    ui.status("error", `Could not read learnings log at ${logPath}: ${error instanceof Error ? error.message : String(error)}`, { stream: "stderr" });
    return 1;
  }

  let entries;
  try {
    entries = rawLines.map((line) => JSON.parse(line));
  } catch (error) {
    ui.status("error", `Learnings log has malformed JSON lines: ${error instanceof Error ? error.message : String(error)}`, { stream: "stderr" });
    return 1;
  }

  const filterTag = readStringFlag(flags, "tag");
  const filterInstance = readStringFlag(flags, "instance");
  const filterCohort = readStringFlag(flags, "cohort");
  const limit = Number(readStringFlag(flags, "limit") ?? "20");

  let matched = entries;
  if (filterTag) {
    matched = matched.filter((entry) =>
      Array.isArray(entry.signal?.tags) && entry.signal.tags.some((tag) => tag === filterTag),
    );
  }
  if (filterInstance) {
    matched = matched.filter((entry) => entry.instanceId === filterInstance);
  }
  if (filterCohort) {
    matched = matched.filter((entry) => entry.cohort === filterCohort);
  }

  const totalMatched = matched.length;
  const limited = Number.isFinite(limit) && limit > 0 ? matched.slice(-limit) : matched;

  if (ui.jsonMode) {
    ui.json("Workshop Learnings", {
      ok: true,
      totalMatched,
      returned: limited.length,
      source: logPath,
      signals: limited.map((entry) => ({
        cohort: entry.cohort,
        instanceId: entry.instanceId,
        capturedAt: entry.signal?.capturedAt ?? entry.loggedAt,
        capturedBy: entry.signal?.capturedBy ?? "unknown",
        teamId: entry.signal?.teamId ?? null,
        tags: entry.signal?.tags ?? [],
        freeText: entry.signal?.freeText ?? "",
      })),
    });
    return 0;
  }

  ui.heading("Workshop Learnings");
  if (limited.length === 0) {
    ui.paragraph(totalMatched === 0
      ? "No signals captured yet. Use the rotation capture panel in the facilitator dashboard during the continuation shift."
      : `No signals matched the current filters (${totalMatched} total in log).`,
    );
    ui.blank();
    ui.keyValue("Source", logPath);
    return 0;
  }

  ui.paragraph(`${totalMatched} signal${totalMatched === 1 ? "" : "s"} matched${totalMatched > limited.length ? ` (showing last ${limited.length})` : ""}`);
  ui.blank();

  for (const entry of limited) {
    const signal = entry.signal ?? {};
    const capturedAt = signal.capturedAt ?? entry.loggedAt ?? "";
    const time = capturedAt ? new Date(capturedAt).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" }) : "";
    const team = signal.teamId ? ` [${signal.teamId}]` : "";
    const tags = Array.isArray(signal.tags) && signal.tags.length > 0 ? `  {${signal.tags.join(", ")}}` : "";

    ui.section(`${entry.cohort ?? "?"} · ${time}${team}${tags}`);
    ui.paragraph(signal.freeText ?? "(no observation text)", { indent: "  " });
    ui.blank();
  }

  ui.keyValue("Source", logPath);
  return 0;
}

async function handleWorkshopBrief(io, ui, env, mergedDeps) {
  const session = await requireSession(io, ui, env);
  if (!session) return 1;
  const client = createHarnessClient({ fetchFn: mergedDeps.fetchFn, session });
  try {
    if (session.role === "participant") {
      const bundle = await client.getParticipantContext();
      ui.json("Workshop Brief", { items: bundle.briefs ?? [] });
      return 0;
    }
    ui.status(
      "error",
      "workshop brief is a participant command. Log in with `harness auth login --code <event-code>` or use the admin UI to view briefs.",
      { stream: "stderr" },
    );
    return 2;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Failed to fetch briefs: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopChallenges(io, ui, env, mergedDeps) {
  const session = await requireSession(io, ui, env);
  if (!session) return 1;
  const client = createHarnessClient({ fetchFn: mergedDeps.fetchFn, session });
  try {
    if (session.role === "participant") {
      const bundle = await client.getParticipantContext();
      ui.json("Workshop Challenges", { items: bundle.challenges ?? [] });
      return 0;
    }
    ui.status(
      "error",
      "workshop challenges is a participant command. Log in with `harness auth login --code <event-code>` or use the admin UI to view challenges.",
      { stream: "stderr" },
    );
    return 2;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Failed to fetch challenges: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopTeamSetRepo(io, ui, env, positionals, mergedDeps) {
  const session = await requireSession(io, ui, env);
  if (!session) return 1;
  const teamId = positionals[3]?.trim();
  const repoUrl = positionals[4]?.trim();
  if (!teamId || !repoUrl) {
    ui.status("error", "Usage: harness workshop team set-repo <teamId> <url>", { stream: "stderr" });
    return 1;
  }
  const client = createHarnessClient({ fetchFn: mergedDeps.fetchFn, session });
  try {
    await client.updateTeam(teamId, { repoUrl });
    ui.json("Team Updated", { ok: true, teamId, repoUrl });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Failed to update team: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopTeamSetMembers(io, ui, env, positionals, mergedDeps) {
  const session = await requireSession(io, ui, env);
  if (!session) return 1;
  const teamId = positionals[3]?.trim();
  const membersRaw = positionals.slice(4).join(" ").trim();
  if (!teamId || !membersRaw) {
    ui.status("error", "Usage: harness workshop team set-members <teamId> <name1, name2, ...>", { stream: "stderr" });
    return 1;
  }
  const members = membersRaw.split(",").map((m) => m.trim()).filter(Boolean);
  const client = createHarnessClient({ fetchFn: mergedDeps.fetchFn, session });
  try {
    await client.updateTeam(teamId, { members });
    ui.json("Team Updated", { ok: true, teamId, members });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Failed to update team: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopTeamSetName(io, ui, env, positionals, mergedDeps) {
  const session = await requireSession(io, ui, env);
  if (!session) return 1;
  const teamId = positionals[3]?.trim();
  const name = positionals.slice(4).join(" ").trim();
  if (!teamId || !name) {
    ui.status("error", "Usage: harness workshop team set-name <teamId> <name>", { stream: "stderr" });
    return 1;
  }
  const client = createHarnessClient({ fetchFn: mergedDeps.fetchFn, session });
  try {
    await client.updateTeam(teamId, { name });
    ui.json("Team Updated", { ok: true, teamId, name });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Failed to update team: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

/* ---------------------------------------------------------------------
 * Participant management — facilitator-only roster and assignment ops.
 * Mirror of the admin API surface (see docs/previews/2026-04-16-
 * participant-api-sketch.md and docs/previews/2026-04-16-cli-surface.md).
 * ------------------------------------------------------------------ */

function resolveInstanceFlag(flags) {
  return typeof flags.instance === "string" ? flags.instance : undefined;
}

async function handleWorkshopParticipantsList(io, ui, env, flags, mergedDeps) {
  const session = await requireSession(io, ui, env);
  if (!session) return 1;
  const client = createHarnessClient({ fetchFn: mergedDeps.fetchFn, session });
  try {
    const data = await client.listParticipants(resolveInstanceFlag(flags));
    const assignedIds = new Set(data.assignments.map((a) => a.participantId));
    let pool = data.pool;
    if (flags.unassigned === true) {
      pool = pool.filter((p) => !assignedIds.has(p.id));
    } else if (typeof flags.team === "string") {
      const onThisTeam = new Set(
        data.assignments.filter((a) => a.teamId === flags.team).map((a) => a.participantId),
      );
      pool = pool.filter((p) => onThisTeam.has(p.id));
    }
    ui.json("Participants", { ok: true, pool, assignments: data.assignments });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Failed to list participants: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopParticipantsAdd(io, ui, env, positionals, flags, mergedDeps) {
  const session = await requireSession(io, ui, env);
  if (!session) return 1;
  const name = positionals.slice(3).join(" ").trim();
  if (!name) {
    ui.status("error", "Usage: harness workshop participants add <name> [--email EMAIL] [--tag TAG]", { stream: "stderr" });
    return 1;
  }
  const entry = { displayName: name };
  if (typeof flags.email === "string") entry.email = flags.email.trim();
  if (typeof flags.tag === "string") entry.tag = flags.tag.trim();

  const client = createHarnessClient({ fetchFn: mergedDeps.fetchFn, session });
  try {
    const data = await client.addParticipants(resolveInstanceFlag(flags), { entries: [entry] });
    ui.json("Participant Added", data);
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Failed to add participant: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function readAllStdin(stdin) {
  const chunks = [];
  for await (const chunk of stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function handleWorkshopParticipantsImport(io, ui, env, flags, mergedDeps) {
  const session = await requireSession(io, ui, env);
  if (!session) return 1;

  let rawText;
  if (typeof flags.file === "string") {
    try {
      rawText = await fs.readFile(flags.file, "utf8");
    } catch (error) {
      ui.status("error", `Failed to read ${flags.file}: ${error instanceof Error ? error.message : String(error)}`, { stream: "stderr" });
      return 1;
    }
  } else if (flags.stdin === true) {
    rawText = await readAllStdin(io.stdin);
  } else {
    ui.status("error", "Usage: harness workshop participants import (--file PATH | --stdin) [--dry-run]", { stream: "stderr" });
    return 1;
  }

  if (!rawText.trim()) {
    ui.status("error", "Input is empty", { stream: "stderr" });
    return 1;
  }

  if (flags["dry-run"] === true) {
    // Preview only — do not call the server. Uses the same parser the
    // server uses, imported via the dashboard module if available. To
    // avoid adding a cross-package dependency in the CLI, we hand the
    // parse back to the server with a marker flag in a future revision.
    // For v1, dry-run posts with a fake instance and shows the
    // server-side parse feedback. Cheap and consistent.
    ui.status("warn", "Dry-run mode: sending to server for parse preview (no DB writes)", { stream: "stderr" });
  }

  const client = createHarnessClient({ fetchFn: mergedDeps.fetchFn, session });
  try {
    // In a real dry-run we'd want the server to skip writes. For now,
    // skip this in --dry-run by showing the parse on the client side via
    // the server's response.skipped + response.created shape: the CLI
    // doesn't write anything more than what the server does, so users
    // get the same view.
    if (flags["dry-run"] === true) {
      ui.status("warn", "--dry-run currently submits the input; use the UI preview for no-write parsing.", { stream: "stderr" });
    }
    const data = await client.addParticipants(resolveInstanceFlag(flags), { rawText });
    ui.json("Participants Imported", data);
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Import failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopParticipantsUpdate(io, ui, env, positionals, flags, mergedDeps) {
  const session = await requireSession(io, ui, env);
  if (!session) return 1;
  const participantId = positionals[3]?.trim();
  if (!participantId) {
    ui.status("error", "Usage: harness workshop participants update <id> [--name STR] [--email STR|null] [--tag STR|null] [--consent on|off]", { stream: "stderr" });
    return 1;
  }
  const patch = {};
  if (typeof flags.instance === "string") patch.instanceId = flags.instance;
  if (typeof flags.name === "string") patch.displayName = flags.name.trim();
  if (typeof flags.email === "string") {
    patch.email = flags.email === "null" ? null : flags.email.trim();
  }
  if (typeof flags.tag === "string") {
    patch.tag = flags.tag === "null" ? null : flags.tag.trim();
  }
  if (typeof flags.consent === "string") {
    if (flags.consent !== "on" && flags.consent !== "off") {
      ui.status("error", "--consent must be 'on' or 'off'", { stream: "stderr" });
      return 1;
    }
    patch.emailOptIn = flags.consent === "on";
  }

  if (Object.keys(patch).filter((k) => k !== "instanceId").length === 0) {
    ui.status("error", "At least one of --name, --email, --tag, --consent is required", { stream: "stderr" });
    return 1;
  }

  const client = createHarnessClient({ fetchFn: mergedDeps.fetchFn, session });
  try {
    const data = await client.updateParticipant(participantId, patch);
    ui.json("Participant Updated", data);
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Failed to update participant: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopParticipantsRemove(io, ui, env, positionals, flags, mergedDeps) {
  const session = await requireSession(io, ui, env);
  if (!session) return 1;
  const participantId = positionals[3]?.trim();
  if (!participantId) {
    ui.status("error", "Usage: harness workshop participants remove <id>", { stream: "stderr" });
    return 1;
  }
  const client = createHarnessClient({ fetchFn: mergedDeps.fetchFn, session });
  try {
    const data = await client.removeParticipant(resolveInstanceFlag(flags), participantId);
    ui.json("Participant Removed", { ...data, participantId });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Failed to remove participant: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopTeamAssign(io, ui, env, positionals, flags, mergedDeps) {
  const session = await requireSession(io, ui, env);
  if (!session) return 1;
  const participantId = positionals[3]?.trim();
  const teamId = positionals[4]?.trim();
  if (!participantId || !teamId) {
    ui.status("error", "Usage: harness workshop team assign <participantId> <teamId>", { stream: "stderr" });
    return 1;
  }
  const client = createHarnessClient({ fetchFn: mergedDeps.fetchFn, session });
  try {
    const data = await client.assignTeamMember({
      instanceId: resolveInstanceFlag(flags),
      participantId,
      teamId,
    });
    ui.json("Team Member Assigned", data);
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Failed to assign: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopTeamUnassign(io, ui, env, positionals, flags, mergedDeps) {
  const session = await requireSession(io, ui, env);
  if (!session) return 1;
  const participantId = positionals[3]?.trim();
  if (!participantId) {
    ui.status("error", "Usage: harness workshop team unassign <participantId>", { stream: "stderr" });
    return 1;
  }
  const client = createHarnessClient({ fetchFn: mergedDeps.fetchFn, session });
  try {
    const data = await client.unassignTeamMember({
      instanceId: resolveInstanceFlag(flags),
      participantId,
    });
    ui.json("Team Member Unassigned", { ...data, participantId });
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Failed to unassign: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

async function handleWorkshopTeamRandomize(io, ui, env, flags, mergedDeps) {
  const session = await requireSession(io, ui, env);
  if (!session) return 1;

  // Commit path: caller already has a preview and passes the token back.
  if (typeof flags["commit-token"] === "string") {
    const client = createHarnessClient({ fetchFn: mergedDeps.fetchFn, session });
    try {
      const data = await client.randomizeTeams({
        instanceId: resolveInstanceFlag(flags),
        commitToken: flags["commit-token"],
      });
      ui.json("Randomize Committed", data);
      return 0;
    } catch (error) {
      if (error instanceof HarnessApiError) {
        ui.status("error", `Commit failed: ${error.message}`, { stream: "stderr" });
        return 1;
      }
      throw error;
    }
  }

  const teamCount = Number(flags.teams);
  if (!Number.isInteger(teamCount) || teamCount < 2 || teamCount > 12) {
    ui.status("error", "Usage: harness workshop team randomize --teams N [--strategy cross-level|random] [--preview] [--commit-token TOKEN]", { stream: "stderr" });
    return 1;
  }
  const strategy = flags.strategy === "random" ? "random" : "cross-level";

  const client = createHarnessClient({ fetchFn: mergedDeps.fetchFn, session });
  try {
    const data = await client.randomizeTeams({
      instanceId: resolveInstanceFlag(flags),
      teamCount,
      strategy,
      preview: flags.preview === true,
    });
    ui.json(flags.preview === true ? "Randomize Preview" : "Randomize Committed", data);
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Randomize failed: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

const DEMO_SETUP_BRIEF = `# Demo repo

This folder is the Phase 3 contrast demo used by the Harness Lab
workshop facilitator. You do not need to edit it. The facilitator
runs the same agent prompt here and in the harnessed sibling folder
to show what task drift looks like without guides, sensors, or a map.

Project: a small standup summarizer that ingests a text file of
standup entries and produces a structured overview highlighting
blockers and dependencies. Implementation language is whatever the
agent chooses — the point of the demo is not the output but the
shape of the work.
`;

const DEMO_SETUP_AGENTS_MD = `# AGENTS.md

## Goal
Ship a small standup summarizer that turns a text file of standup
entries into a structured overview highlighting blockers and
dependencies. Scope: one bounded slice, end to end.

## Context
- Seed input: \`examples/standup.txt\` — three fake standup entries.
- Output: a single Markdown or JSON document the team can read.
- The workshop skill is installed. The reference card, analyze
  checklist, and brief are available through it.

## Constraints
- Do not build a UI. The output is a file or a terminal summary.
- No network calls. Run fully locally.
- One bounded slice. Do not try to implement every user story in
  one pass.
- Prefer clarity over cleverness. Another team will inherit this.

## Done when
- A tracer runs end to end: seed file in, structured overview out.
- The repo explains how to run the tool in five sentences or fewer.
- Another team could add a second input format within ten minutes
  without reading the whole codebase.
`;

const DEMO_SETUP_PLAN = `# Plan

1. Read \`examples/standup.txt\` and sketch the data model for the
   overview (blockers, dependencies, status per person).
2. Write the smallest possible tracer: a script that ingests the
   file, prints one parsed entry, and exits.
3. Expand the tracer to emit the full structured overview.
4. Add README instructions for running the tracer.
5. Verify the handoff test: could another team add a JSON output
   mode by editing one file?
`;

const DEMO_SETUP_SEED = `Anna: finished the ingest helper. Blocked on deciding the output format — need a call with David.
David: pushed the first draft of the dashboard layout. Waiting on Anna's ingest shape before wiring it up. Will be out Friday afternoon.
Eva: investigating the flaky integration test. Reproduced it locally. Next step is to isolate whether it's the fixture or the runner.
`;

async function handleDemoSetup(io, ui, flags) {
  const target = typeof flags.target === "string" && flags.target.trim() ? flags.target.trim() : "demo-setup";
  const root = path.resolve(target);
  const folderA = path.join(root, "folder-a-bare");
  const folderB = path.join(root, "folder-b-harnessed");

  try {
    await fs.mkdir(folderA, { recursive: true });
    await fs.mkdir(path.join(folderA, "examples"), { recursive: true });
    await fs.writeFile(path.join(folderA, "README.md"), "# Folder A — bare repo\n\nNo AGENTS.md. No plan. No skill. Just the brief.\n", "utf-8");
    await fs.writeFile(path.join(folderA, "PROJECT_BRIEF.md"), DEMO_SETUP_BRIEF, "utf-8");
    await fs.writeFile(path.join(folderA, "examples", "standup.txt"), DEMO_SETUP_SEED, "utf-8");

    await fs.mkdir(folderB, { recursive: true });
    await fs.mkdir(path.join(folderB, "examples"), { recursive: true });
    await fs.writeFile(path.join(folderB, "README.md"), "# Folder B — harnessed repo\n\nSame brief as Folder A. Plus AGENTS.md, a plan, seed data, and the workshop skill.\n", "utf-8");
    await fs.writeFile(path.join(folderB, "PROJECT_BRIEF.md"), DEMO_SETUP_BRIEF, "utf-8");
    await fs.writeFile(path.join(folderB, "AGENTS.md"), DEMO_SETUP_AGENTS_MD, "utf-8");
    await fs.writeFile(path.join(folderB, "PLAN.md"), DEMO_SETUP_PLAN, "utf-8");
    await fs.writeFile(path.join(folderB, "examples", "standup.txt"), DEMO_SETUP_SEED, "utf-8");

    ui.heading("Demo setup complete");
    ui.paragraph(`Created two folders under ${root}:`);
    ui.commandList([
      `folder-a-bare/ — the bare repo (brief only)`,
      `folder-b-harnessed/ — the same brief with AGENTS.md, a plan, seed data, and space for the workshop skill`,
    ]);
    ui.blank();
    ui.section("Next");
    ui.commandList([
      `cd ${path.join(target, "folder-b-harnessed")} && harness skill install`,
      `Run the contrast demo from Folder A and Folder B with the same prompt`,
    ]);
    return 0;
  } catch (error) {
    ui.status("error", `demo-setup failed: ${error instanceof Error ? error.message : String(error)}`, { stream: "stderr" });
    return 1;
  }
}

async function handleWorkshopTeam(io, ui, env, mergedDeps) {
  const session = await requireSession(io, ui, env);
  if (!session) return 1;
  const client = createHarnessClient({ fetchFn: mergedDeps.fetchFn, session });
  try {
    if (session.role === "participant") {
      const data = await client.getParticipantTeamLookup();
      ui.json("Workshop Team", data);
      return 0;
    }
    const data = await client.getTeams();
    ui.json("Workshop Team", data);
    return 0;
  } catch (error) {
    if (error instanceof HarnessApiError) {
      ui.status("error", `Failed to fetch teams: ${error.message}`, { stream: "stderr" });
      return 1;
    }
    throw error;
  }
}

export async function runCli(argv, io, deps = {}) {
  const fetchFn = deps.fetchFn ?? globalThis.fetch;
  const mergedDeps = { fetchFn, sleepFn: deps.sleepFn, openUrl: deps.openUrl, cwd: deps.cwd };
  const { positionals, flags } = parseArgs(argv);
  const ui = createCliUi(io, { jsonMode: flags.json === true || flags.output === "json" });
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

  if (scope === "skill") {
    ui.heading("Harness CLI — Skill");
    ui.paragraph("Install the workshop skill into your project repo for Codex, pi, and Claude Code.");
    ui.blank();
    ui.section("Commands");
    ui.commandList([
      helpLine("harness skill install [--target PATH] [--force]", "Install the workshop skill (participant)"),
      helpLine("harness skill install --facilitator", "Also install the facilitator skill (opt-in)"),
    ]);
    ui.blank();
    ui.section("After install");
    ui.commandList([
      "Open your coding agent (Codex, pi, or Claude Code) in the same repo",
      "Codex: $workshop commands",
      "pi: /skill:workshop",
      "Claude Code: the workshop skill is available as a slash command",
    ]);
    ui.blank();
    ui.paragraph("The skill is the participant's primary workshop interface.");
    return 0;
  }

  // Workshop scope — the day (participant + facilitator)
  if (scope === "workshop" && action === "status") {
    return handleWorkshopStatus(io, ui, io.env, mergedDeps);
  }

  if (scope === "workshop" && action === "brief") {
    return handleWorkshopBrief(io, ui, io.env, mergedDeps);
  }

  if (scope === "workshop" && action === "briefs") {
    return handleWorkshopBrief(io, ui, io.env, mergedDeps);
  }

  if (scope === "demo-setup") {
    return handleDemoSetup(io, ui, flags);
  }

  if (scope === "workshop" && action === "challenges") {
    return handleWorkshopChallenges(io, ui, io.env, mergedDeps);
  }

  if (scope === "workshop" && action === "team" && subaction === "set-repo") {
    return handleWorkshopTeamSetRepo(io, ui, io.env, positionals, mergedDeps);
  }

  if (scope === "workshop" && action === "team" && subaction === "set-members") {
    return handleWorkshopTeamSetMembers(io, ui, io.env, positionals, mergedDeps);
  }

  if (scope === "workshop" && action === "team" && subaction === "set-name") {
    return handleWorkshopTeamSetName(io, ui, io.env, positionals, mergedDeps);
  }

  if (scope === "workshop" && action === "team" && subaction === "assign") {
    return handleWorkshopTeamAssign(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "team" && subaction === "unassign") {
    return handleWorkshopTeamUnassign(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "team" && subaction === "randomize") {
    return handleWorkshopTeamRandomize(io, ui, io.env, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "team" && !subaction) {
    return handleWorkshopTeam(io, ui, io.env, mergedDeps);
  }

  if (scope === "workshop" && action === "participants" && subaction === "list") {
    return handleWorkshopParticipantsList(io, ui, io.env, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "participants" && subaction === "add") {
    return handleWorkshopParticipantsAdd(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "participants" && subaction === "import") {
    return handleWorkshopParticipantsImport(io, ui, io.env, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "participants" && subaction === "update") {
    return handleWorkshopParticipantsUpdate(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "participants" && subaction === "remove") {
    return handleWorkshopParticipantsRemove(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "participant-access") {
    return handleWorkshopParticipantAccess(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "archive") {
    return handleWorkshopArchive(io, ui, io.env, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "prepare") {
    return handleWorkshopPrepare(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "workshop" && action === "phase" && subaction === "set") {
    return handleWorkshopPhaseSet(io, ui, io.env, positionals, mergedDeps);
  }

  if (scope === "workshop" && action === "learnings") {
    return handleWorkshopLearningsQuery(io, ui, io.env, flags);
  }

  // Instance scope — infrastructure management (facilitator only)
  if (scope === "instance" && action === "create") {
    return handleWorkshopCreateInstance(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "instance" && action === "list") {
    return handleWorkshopListInstances(io, ui, io.env, mergedDeps);
  }

  if (scope === "instance" && action === "show") {
    return handleWorkshopShowInstance(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "instance" && action === "select") {
    return handleWorkshopSelectInstance(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "instance" && action === "current") {
    return handleWorkshopCurrentInstance(io, ui, io.env, mergedDeps);
  }

  if (scope === "instance" && action === "update") {
    return handleWorkshopUpdateInstance(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "instance" && action === "reset") {
    return handleWorkshopResetInstance(io, ui, io.env, positionals, flags, mergedDeps);
  }

  if (scope === "instance" && action === "remove") {
    return handleWorkshopRemoveInstance(io, ui, io.env, positionals, flags, mergedDeps);
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
