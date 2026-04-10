import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile as nodeExecFile } from "node:child_process";
import { promisify } from "node:util";
import { getCliHome, getSessionFilePath } from "./config.js";

const execFile = promisify(nodeExecFile);
const serviceName = "harness-cli.session";
const accountName = "active";

export class SessionStoreError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "SessionStoreError";
    this.code = details.code ?? "session_store_error";
  }
}

let testDeps = null;

function getDeps() {
  return (
    testDeps ?? {
      platform: os.platform(),
      execFile,
    }
  );
}

async function ensureCliHome(env) {
  await fs.mkdir(getCliHome(env), { recursive: true, mode: 0o700 });
}

async function readFileSession(env) {
  const filePath = getSessionFilePath(env);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function writeFileSession(env, session) {
  await ensureCliHome(env);
  const filePath = getSessionFilePath(env);
  await fs.writeFile(filePath, JSON.stringify(session, null, 2) + "\n", { mode: 0o600 });
}

async function deleteFileSession(env) {
  const filePath = getSessionFilePath(env);

  try {
    await fs.rm(filePath);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}

async function readKeychainSession() {
  try {
    const { stdout } = await getDeps().execFile("/usr/bin/security", [
      "find-generic-password",
      "-a",
      accountName,
      "-s",
      serviceName,
      "-w",
    ]);
    return JSON.parse(stdout.trim());
  } catch (error) {
    const stderr = error && typeof error === "object" && "stderr" in error ? String(error.stderr) : "";
    if (stderr.includes("could not be found")) {
      return null;
    }
    throw new SessionStoreError("macOS Keychain is unavailable for Harness CLI session storage.", {
      code: "keychain_unavailable",
    });
  }
}

async function writeKeychainSession(session) {
  try {
    await getDeps().execFile("/usr/bin/security", [
      "add-generic-password",
      "-U",
      "-a",
      accountName,
      "-s",
      serviceName,
      "-w",
      JSON.stringify(session),
    ]);
  } catch {
    throw new SessionStoreError("Failed to write the Harness CLI session to macOS Keychain.", {
      code: "keychain_write_failed",
    });
  }
}

async function deleteKeychainSession() {
  try {
    await getDeps().execFile("/usr/bin/security", [
      "delete-generic-password",
      "-a",
      accountName,
      "-s",
      serviceName,
    ]);
  } catch (error) {
    const stderr = error && typeof error === "object" && "stderr" in error ? String(error.stderr) : "";
    if (stderr.includes("could not be found")) {
      return;
    }
    throw new SessionStoreError("Failed to remove the Harness CLI session from macOS Keychain.", {
      code: "keychain_delete_failed",
    });
  }
}

function getWindowsCredentialCommand(action, value = "") {
  const safeValue = value.replace(/'/g, "''");

  if (action === "read") {
    return [
      "-NoProfile",
      "-Command",
      `$vault = New-Object Windows.Security.Credentials.PasswordVault; try { $credential = $vault.Retrieve('${serviceName}', '${accountName}'); $credential.RetrievePassword(); Write-Output $credential.Password } catch { exit 3 }`,
    ];
  }

  if (action === "write") {
    return [
      "-NoProfile",
      "-Command",
      `$vault = New-Object Windows.Security.Credentials.PasswordVault; try { $existing = $vault.Retrieve('${serviceName}', '${accountName}'); $vault.Remove($existing) } catch {}; $vault.Add((New-Object Windows.Security.Credentials.PasswordCredential('${serviceName}', '${accountName}', '${safeValue}')))` ,
    ];
  }

  return [
    "-NoProfile",
    "-Command",
    `$vault = New-Object Windows.Security.Credentials.PasswordVault; try { $existing = $vault.Retrieve('${serviceName}', '${accountName}'); $vault.Remove($existing) } catch { exit 0 }`,
  ];
}

async function readCredentialManagerSession() {
  try {
    const { stdout } = await getDeps().execFile("powershell", getWindowsCredentialCommand("read"));
    return JSON.parse(stdout.trim());
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 3) {
      return null;
    }
    throw new SessionStoreError(
      "Windows Credential Manager is unavailable. Use HARNESS_SESSION_STORAGE=file only if you need an explicit insecure fallback.",
      { code: "credential_manager_unavailable" },
    );
  }
}

async function writeCredentialManagerSession(session) {
  try {
    await getDeps().execFile("powershell", getWindowsCredentialCommand("write", JSON.stringify(session)));
  } catch {
    throw new SessionStoreError("Failed to write the Harness CLI session to Windows Credential Manager.", {
      code: "credential_manager_write_failed",
    });
  }
}

async function deleteCredentialManagerSession() {
  try {
    await getDeps().execFile("powershell", getWindowsCredentialCommand("delete"));
  } catch {
    throw new SessionStoreError("Failed to remove the Harness CLI session from Windows Credential Manager.", {
      code: "credential_manager_delete_failed",
    });
  }
}

async function readSecretServiceSession() {
  try {
    const { stdout } = await getDeps().execFile("/bin/sh", [
      "-lc",
      `secret-tool lookup service '${serviceName}' account '${accountName}'`,
    ]);
    const value = stdout.trim();
    return value ? JSON.parse(value) : null;
  } catch {
    throw new SessionStoreError(
      "Linux Secret Service is unavailable. Use HARNESS_SESSION_STORAGE=file only if you need an explicit insecure fallback.",
      { code: "secret_service_unavailable" },
    );
  }
}

async function writeSecretServiceSession(session) {
  try {
    await getDeps().execFile("/bin/sh", [
      "-lc",
      `printf '%s' "$HARNESS_SESSION_JSON" | secret-tool store --label='Harness CLI session' service '${serviceName}' account '${accountName}'`,
    ], {
      env: {
        ...process.env,
        HARNESS_SESSION_JSON: JSON.stringify(session),
      },
    });
  } catch {
    throw new SessionStoreError("Failed to write the Harness CLI session to Linux Secret Service.", {
      code: "secret_service_write_failed",
    });
  }
}

async function deleteSecretServiceSession() {
  try {
    await getDeps().execFile("/bin/sh", [
      "-lc",
      `secret-tool clear service '${serviceName}' account '${accountName}'`,
    ]);
  } catch {
    throw new SessionStoreError("Failed to remove the Harness CLI session from Linux Secret Service.", {
      code: "secret_service_delete_failed",
    });
  }
}

export function getSessionStorageMode(env) {
  const requested = env.HARNESS_SESSION_STORAGE;
  if (requested === "file" || requested === "keychain" || requested === "credential-manager" || requested === "secret-service") {
    return requested;
  }
  return "file";
}

function getStorageHint(storage) {
  if (storage === "file") {
    return "file storage";
  }

  if (storage === "keychain") {
    return "macOS Keychain";
  }

  if (storage === "credential-manager") {
    return "Windows Credential Manager";
  }

  return "Linux Secret Service";
}

export async function readSession(env) {
  const storage = getSessionStorageMode(env);
  if (storage === "keychain") {
    return readKeychainSession();
  }
  if (storage === "credential-manager") {
    return readCredentialManagerSession();
  }
  if (storage === "secret-service") {
    return readSecretServiceSession();
  }
  return readFileSession(env);
}

export async function writeSession(env, session) {
  const storage = getSessionStorageMode(env);
  if (storage === "keychain") {
    return writeKeychainSession(session);
  }
  if (storage === "credential-manager") {
    return writeCredentialManagerSession(session);
  }
  if (storage === "secret-service") {
    return writeSecretServiceSession(session);
  }
  return writeFileSession(env, session);
}

export async function deleteSession(env) {
  const storage = getSessionStorageMode(env);
  if (storage === "keychain") {
    return deleteKeychainSession();
  }
  if (storage === "credential-manager") {
    return deleteCredentialManagerSession();
  }
  if (storage === "secret-service") {
    return deleteSecretServiceSession();
  }
  return deleteFileSession(env);
}

export async function sessionExists(env) {
  return (await readSession(env)) !== null;
}

export function sanitizeSession(session, env) {
  if (!session) {
    return null;
  }

  return {
    dashboardUrl: session.dashboardUrl,
    authType: session.authType,
    username: session.username ?? null,
    email: session.email ?? null,
    role: session.role ?? null,
    selectedInstanceId: session.selectedInstanceId ?? null,
    loggedInAt: session.loggedInAt,
    expiresAt: session.expiresAt ?? null,
    mode: session.mode ?? "local-dev",
    storage: getSessionStorageMode(env),
    storageLabel: getStorageHint(getSessionStorageMode(env)),
    sessionHealth: session.expiresAt ? (Date.parse(session.expiresAt) > Date.now() ? "active" : "expired") : "active",
  };
}

export function resolveProjectRelativePath(env, relativePath) {
  return path.join(getCliHome(env), relativePath);
}

export function setSessionStoreDepsForTests(deps) {
  testDeps = deps;
}
