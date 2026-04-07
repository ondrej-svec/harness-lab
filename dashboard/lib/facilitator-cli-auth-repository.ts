import { randomUUID, createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "./auth/server";
import { getAuditLogRepository } from "./audit-log-repository";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { getInstanceGrantRepository } from "./instance-grant-repository";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type {
  FacilitatorCliAuthRepository,
  FacilitatorCliSessionRecord,
  FacilitatorDeviceAuthRecord,
  InstanceGrantRecord,
} from "./runtime-contracts";

const defaultDeviceIntervalSeconds = 5;
const defaultDeviceLifetimeMs = 10 * 60 * 1000;
const defaultCliSessionLifetimeMs = 12 * 60 * 60 * 1000;

type StoredFileState = {
  deviceAuthorizations: FacilitatorDeviceAuthRecord[];
  cliSessions: FacilitatorCliSessionRecord[];
};

type RepoDeps = {
  now: () => Date;
  randomUuid: () => string;
  randomBytes: (size: number) => Buffer;
};

const defaultDeps: RepoDeps = {
  now: () => new Date(),
  randomUuid: () => randomUUID(),
  randomBytes: (size) => randomBytes(size),
};

let testDeps: RepoDeps | null = null;
let overrideRepository: FacilitatorCliAuthRepository | null = null;

function getDeps() {
  return testDeps ?? defaultDeps;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getVerificationUri() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL ?? process.env.HARNESS_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/admin/device`;
}

function buildVerificationUriComplete(userCode: string) {
  return `${getVerificationUri()}?user_code=${encodeURIComponent(userCode)}`;
}

function formatUserCode(raw: Buffer) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const characters = Array.from(raw).map((value) => alphabet[value % alphabet.length]);
  return `${characters.slice(0, 4).join("")}-${characters.slice(4, 8).join("")}`;
}

function nowIso() {
  return getDeps().now().toISOString();
}

async function appendAudit(entry: {
  action: string;
  result: "success" | "failure";
  instanceId: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await getAuditLogRepository().append({
    id: `audit-${getDeps().randomUuid()}`,
    actorKind: "facilitator",
    action: entry.action,
    result: entry.result,
    instanceId: entry.instanceId,
    createdAt: nowIso(),
    metadata: entry.metadata,
  });
}

class FileFacilitatorCliAuthRepository implements FacilitatorCliAuthRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");
  private readonly filePath = process.env.HARNESS_FACILITATOR_CLI_AUTH_PATH ?? path.join(this.dataDir, "facilitator-cli-auth.json");

  private async ensureFile() {
    await mkdir(this.dataDir, { recursive: true });
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await readFile(this.filePath, "utf8");
    } catch {
      await writeFile(
        this.filePath,
        JSON.stringify({ deviceAuthorizations: [], cliSessions: [] } satisfies StoredFileState, null, 2),
      );
    }
  }

  private async readState() {
    await this.ensureFile();
    return JSON.parse(await readFile(this.filePath, "utf8")) as StoredFileState;
  }

  private async writeState(state: StoredFileState) {
    const tempPath = `${this.filePath}.${getDeps().randomUuid()}.tmp`;
    await writeFile(tempPath, JSON.stringify(state, null, 2));
    await rename(tempPath, this.filePath);
  }

  async createDeviceAuthorization(record: FacilitatorDeviceAuthRecord) {
    const state = await this.readState();
    state.deviceAuthorizations.push(record);
    await this.writeState(state);
  }

  async getDeviceAuthorizationByDeviceCodeHash(instanceId: string, deviceCodeHash: string) {
    const state = await this.readState();
    return state.deviceAuthorizations.find((item) => item.instanceId === instanceId && item.deviceCodeHash === deviceCodeHash) ?? null;
  }

  async getDeviceAuthorizationByUserCodeHash(instanceId: string, userCodeHash: string) {
    const state = await this.readState();
    return state.deviceAuthorizations.find((item) => item.instanceId === instanceId && item.userCodeHash === userCodeHash) ?? null;
  }

  async updateDeviceAuthorization(record: FacilitatorDeviceAuthRecord) {
    const state = await this.readState();
    state.deviceAuthorizations = state.deviceAuthorizations.map((item) => (item.id === record.id ? record : item));
    await this.writeState(state);
  }

  async createCliSession(record: FacilitatorCliSessionRecord) {
    const state = await this.readState();
    state.cliSessions.push(record);
    await this.writeState(state);
  }

  async getCliSessionByTokenHash(instanceId: string, tokenHash: string) {
    const state = await this.readState();
    return state.cliSessions.find((item) => item.instanceId === instanceId && item.tokenHash === tokenHash) ?? null;
  }

  async updateCliSession(record: FacilitatorCliSessionRecord) {
    const state = await this.readState();
    state.cliSessions = state.cliSessions.map((item) => (item.tokenHash === record.tokenHash ? record : item));
    await this.writeState(state);
  }
}

class NeonFacilitatorCliAuthRepository implements FacilitatorCliAuthRepository {
  async createDeviceAuthorization(record: FacilitatorDeviceAuthRecord) {
    const sql = getNeonSql();
    await sql.query(
      `INSERT INTO facilitator_device_auth (
        id, instance_id, device_code_hash, user_code_hash, status, created_at, expires_at, interval_seconds,
        verification_uri, approved_at, denied_at, exchanged_at, neon_user_id, role
      ) VALUES ($1,$2,$3,$4,$5,$6::timestamptz,$7::timestamptz,$8,$9,$10::timestamptz,$11::timestamptz,$12::timestamptz,$13,$14)`,
      [
        record.id,
        record.instanceId,
        record.deviceCodeHash,
        record.userCodeHash,
        record.status,
        record.createdAt,
        record.expiresAt,
        record.intervalSeconds,
        record.verificationUri,
        record.approvedAt,
        record.deniedAt,
        record.exchangedAt,
        record.neonUserId,
        record.role,
      ],
    );
  }

  async getDeviceAuthorizationByDeviceCodeHash(instanceId: string, deviceCodeHash: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `SELECT * FROM facilitator_device_auth WHERE instance_id = $1 AND device_code_hash = $2 LIMIT 1`,
      [instanceId, deviceCodeHash],
    )) as DeviceRow[];
    return rows[0] ? mapDeviceRow(rows[0]) : null;
  }

  async getDeviceAuthorizationByUserCodeHash(instanceId: string, userCodeHash: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `SELECT * FROM facilitator_device_auth WHERE instance_id = $1 AND user_code_hash = $2 ORDER BY created_at DESC LIMIT 1`,
      [instanceId, userCodeHash],
    )) as DeviceRow[];
    return rows[0] ? mapDeviceRow(rows[0]) : null;
  }

  async updateDeviceAuthorization(record: FacilitatorDeviceAuthRecord) {
    const sql = getNeonSql();
    await sql.query(
      `UPDATE facilitator_device_auth
       SET status = $2, approved_at = $3::timestamptz, denied_at = $4::timestamptz, exchanged_at = $5::timestamptz,
           neon_user_id = $6, role = $7
       WHERE id = $1`,
      [record.id, record.status, record.approvedAt, record.deniedAt, record.exchangedAt, record.neonUserId, record.role],
    );
  }

  async createCliSession(record: FacilitatorCliSessionRecord) {
    const sql = getNeonSql();
    await sql.query(
      `INSERT INTO facilitator_cli_sessions (
        token_hash, instance_id, neon_user_id, role, auth_mode, created_at, expires_at, last_used_at, revoked_at
      ) VALUES ($1,$2,$3,$4,$5,$6::timestamptz,$7::timestamptz,$8::timestamptz,$9::timestamptz)`,
      [
        record.tokenHash,
        record.instanceId,
        record.neonUserId,
        record.role,
        record.authMode,
        record.createdAt,
        record.expiresAt,
        record.lastUsedAt,
        record.revokedAt,
      ],
    );
  }

  async getCliSessionByTokenHash(instanceId: string, tokenHash: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `SELECT * FROM facilitator_cli_sessions WHERE instance_id = $1 AND token_hash = $2 LIMIT 1`,
      [instanceId, tokenHash],
    )) as SessionRow[];
    return rows[0] ? mapSessionRow(rows[0]) : null;
  }

  async updateCliSession(record: FacilitatorCliSessionRecord) {
    const sql = getNeonSql();
    await sql.query(
      `UPDATE facilitator_cli_sessions SET last_used_at = $2::timestamptz, revoked_at = $3::timestamptz WHERE token_hash = $1`,
      [record.tokenHash, record.lastUsedAt, record.revokedAt],
    );
  }
}

type DeviceRow = {
  id: string;
  instance_id: string;
  device_code_hash: string;
  user_code_hash: string;
  status: FacilitatorDeviceAuthRecord["status"];
  created_at: string;
  expires_at: string;
  interval_seconds: number;
  verification_uri: string;
  approved_at: string | null;
  denied_at: string | null;
  exchanged_at: string | null;
  neon_user_id: string | null;
  role: InstanceGrantRecord["role"] | null;
};

type SessionRow = {
  token_hash: string;
  instance_id: string;
  neon_user_id: string;
  role: InstanceGrantRecord["role"];
  auth_mode: "device";
  created_at: string;
  expires_at: string;
  last_used_at: string;
  revoked_at: string | null;
};

function mapDeviceRow(row: DeviceRow): FacilitatorDeviceAuthRecord {
  return {
    id: row.id,
    instanceId: row.instance_id,
    deviceCodeHash: row.device_code_hash,
    userCodeHash: row.user_code_hash,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    intervalSeconds: row.interval_seconds,
    verificationUri: row.verification_uri,
    approvedAt: row.approved_at,
    deniedAt: row.denied_at,
    exchangedAt: row.exchanged_at,
    neonUserId: row.neon_user_id,
    role: row.role,
  };
}

function mapSessionRow(row: SessionRow): FacilitatorCliSessionRecord {
  return {
    tokenHash: row.token_hash,
    instanceId: row.instance_id,
    neonUserId: row.neon_user_id,
    role: row.role,
    authMode: row.auth_mode,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
  };
}

export function getFacilitatorCliAuthRepository(): FacilitatorCliAuthRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon" ? new NeonFacilitatorCliAuthRepository() : new FileFacilitatorCliAuthRepository();
}

export async function startDeviceAuthorization() {
  const instanceId = getCurrentWorkshopInstanceId();
  const deviceCode = getDeps().randomBytes(24).toString("base64url");
  const userCode = formatUserCode(getDeps().randomBytes(8));
  const createdAt = nowIso();
  const expiresAt = new Date(getDeps().now().getTime() + defaultDeviceLifetimeMs).toISOString();
  const verificationUri = getVerificationUri();

  await getFacilitatorCliAuthRepository().createDeviceAuthorization({
    id: `device-${getDeps().randomUuid()}`,
    instanceId,
    deviceCodeHash: sha256(deviceCode),
    userCodeHash: sha256(userCode),
    status: "pending",
    createdAt,
    expiresAt,
    intervalSeconds: defaultDeviceIntervalSeconds,
    verificationUri,
    approvedAt: null,
    deniedAt: null,
    exchangedAt: null,
    neonUserId: null,
    role: null,
  });

  await appendAudit({
    action: "facilitator_device_auth_start",
    result: "success",
    instanceId,
    metadata: { verificationUri },
  });

  return {
    deviceCode,
    userCode,
    verificationUri,
    verificationUriComplete: buildVerificationUriComplete(userCode),
    expiresAt,
    intervalSeconds: defaultDeviceIntervalSeconds,
  };
}

async function ensureGrantForNeonUser(instanceId: string, neonUserId: string) {
  const grantRepo = getInstanceGrantRepository();
  let grant = await grantRepo.getActiveGrantByNeonUserId(instanceId, neonUserId);

  if (!grant) {
    const grantCount = await grantRepo.countActiveGrants(instanceId);
    if (grantCount === 0) {
      grant = await grantRepo.createGrant(instanceId, neonUserId, "owner");
    }
  }

  return grant;
}

export async function approveDeviceAuthorizationForCurrentSession(userCode: string) {
  const instanceId = getCurrentWorkshopInstanceId();
  const session = auth ? (await auth.getSession()).data : null;
  const neonUserId = session?.user?.id ?? null;

  if (!neonUserId) {
    await appendAudit({
      action: "facilitator_device_auth_approve",
      result: "failure",
      instanceId,
      metadata: { reason: "no_session" },
    });
    return { ok: false, error: "facilitator_sign_in_required" } as const;
  }

  const record = await getFacilitatorCliAuthRepository().getDeviceAuthorizationByUserCodeHash(instanceId, sha256(userCode.trim().toUpperCase()));
  if (!record) {
    await appendAudit({
      action: "facilitator_device_auth_approve",
      result: "failure",
      instanceId,
      metadata: { reason: "unknown_code" },
    });
    return { ok: false, error: "invalid_user_code" } as const;
  }

  if (new Date(record.expiresAt).getTime() <= getDeps().now().getTime()) {
    record.status = "expired";
    await getFacilitatorCliAuthRepository().updateDeviceAuthorization(record);
    await appendAudit({
      action: "facilitator_device_auth_expire",
      result: "failure",
      instanceId,
      metadata: { deviceAuthId: record.id },
    });
    return { ok: false, error: "expired_user_code" } as const;
  }

  const grant = await ensureGrantForNeonUser(instanceId, neonUserId);
  if (!grant) {
    await appendAudit({
      action: "facilitator_device_auth_approve",
      result: "failure",
      instanceId,
      metadata: { reason: "missing_grant", neonUserId },
    });
    return { ok: false, error: "facilitator_grant_required" } as const;
  }

  record.status = "approved";
  record.approvedAt = nowIso();
  record.neonUserId = neonUserId;
  record.role = grant.role;
  await getFacilitatorCliAuthRepository().updateDeviceAuthorization(record);
  await appendAudit({
    action: "facilitator_device_auth_approve",
    result: "success",
    instanceId,
    metadata: { deviceAuthId: record.id, neonUserId, role: grant.role },
  });

  return { ok: true, role: grant.role } as const;
}

export async function denyDeviceAuthorization(userCode: string) {
  const instanceId = getCurrentWorkshopInstanceId();
  const record = await getFacilitatorCliAuthRepository().getDeviceAuthorizationByUserCodeHash(instanceId, sha256(userCode.trim().toUpperCase()));
  if (!record) {
    return { ok: false, error: "invalid_user_code" } as const;
  }

  record.status = "denied";
  record.deniedAt = nowIso();
  await getFacilitatorCliAuthRepository().updateDeviceAuthorization(record);
  await appendAudit({
    action: "facilitator_device_auth_deny",
    result: "failure",
    instanceId,
    metadata: { deviceAuthId: record.id },
  });
  return { ok: true } as const;
}

export async function pollDeviceAuthorization(deviceCode: string) {
  const instanceId = getCurrentWorkshopInstanceId();
  const record = await getFacilitatorCliAuthRepository().getDeviceAuthorizationByDeviceCodeHash(instanceId, sha256(deviceCode));
  if (!record) {
    return { status: "invalid_device_code" } as const;
  }

  if (new Date(record.expiresAt).getTime() <= getDeps().now().getTime() && record.status === "pending") {
    record.status = "expired";
    await getFacilitatorCliAuthRepository().updateDeviceAuthorization(record);
    await appendAudit({
      action: "facilitator_device_auth_expire",
      result: "failure",
      instanceId,
      metadata: { deviceAuthId: record.id },
    });
  }

  if (record.status === "pending") {
    return { status: "authorization_pending", intervalSeconds: record.intervalSeconds, expiresAt: record.expiresAt } as const;
  }

  if (record.status === "denied") {
    return { status: "access_denied" } as const;
  }

  if (record.status === "expired") {
    return { status: "expired_token" } as const;
  }

  if (record.status !== "approved" || !record.neonUserId || !record.role) {
    return { status: "invalid_device_code" } as const;
  }

  const accessToken = getDeps().randomBytes(24).toString("base64url");
  const createdAt = nowIso();
  const expiresAt = new Date(getDeps().now().getTime() + defaultCliSessionLifetimeMs).toISOString();

  await getFacilitatorCliAuthRepository().createCliSession({
    tokenHash: sha256(accessToken),
    instanceId,
    neonUserId: record.neonUserId,
    role: record.role,
    authMode: "device",
    createdAt,
    expiresAt,
    lastUsedAt: createdAt,
    revokedAt: null,
  });

  record.status = "exchanged";
  record.exchangedAt = createdAt;
  await getFacilitatorCliAuthRepository().updateDeviceAuthorization(record);

  return {
    status: "authorized",
    accessToken,
    tokenType: "Bearer",
    expiresAt,
    session: {
      instanceId,
      neonUserId: record.neonUserId,
      role: record.role,
      authMode: "device" as const,
    },
  } as const;
}

export async function getCliSessionFromBearerToken(token: string) {
  const instanceId = getCurrentWorkshopInstanceId();
  const session = await getFacilitatorCliAuthRepository().getCliSessionByTokenHash(instanceId, sha256(token));
  if (!session || session.revokedAt) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= getDeps().now().getTime()) {
    session.revokedAt = nowIso();
    await getFacilitatorCliAuthRepository().updateCliSession(session);
    return null;
  }

  session.lastUsedAt = nowIso();
  await getFacilitatorCliAuthRepository().updateCliSession(session);
  return session;
}

export async function revokeCliSessionFromBearerToken(token: string) {
  const session = await getCliSessionFromBearerToken(token);
  if (!session) {
    return { ok: false, error: "session_not_found" } as const;
  }

  session.revokedAt = nowIso();
  await getFacilitatorCliAuthRepository().updateCliSession(session);
  await appendAudit({
    action: "facilitator_cli_logout",
    result: "success",
    instanceId: session.instanceId,
    metadata: { neonUserId: session.neonUserId, role: session.role },
  });
  return { ok: true, session } as const;
}

export function parseBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token || null;
}

export function setFacilitatorCliAuthRepositoryForTests(repository: FacilitatorCliAuthRepository | null) {
  overrideRepository = repository;
}

export function setFacilitatorCliAuthDepsForTests(deps: RepoDeps | null) {
  testDeps = deps;
}
