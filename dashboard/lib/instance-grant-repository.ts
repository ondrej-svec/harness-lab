import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import { seedWorkshopState } from "./workshop-data";
import type { FacilitatorGrantInfo, InstanceGrantRecord, InstanceGrantRepository } from "./runtime-contracts";

type StoredInstanceGrants = {
  items: InstanceGrantRecord[];
};

function getSampleGrant(instanceId: string): InstanceGrantRecord {
  return {
    id: `grant-${instanceId}-sample`,
    instanceId,
    neonUserId: "file-mode-sample",
    role: "owner",
    grantedAt: new Date().toISOString(),
    revokedAt: null,
  };
}

export class FileInstanceGrantRepository implements InstanceGrantRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getGrantPath(instanceId: string) {
    return path.join(this.dataDir, instanceId, "instance-grants.json");
  }

  private async ensureFile(instanceId: string) {
    const grantPath = this.getGrantPath(instanceId);
    await mkdir(path.dirname(grantPath), { recursive: true });
    try {
      await readFile(grantPath, "utf8");
    } catch {
      await writeFile(
        grantPath,
        JSON.stringify({ items: [getSampleGrant(instanceId)] satisfies InstanceGrantRecord[] }, null, 2),
      );
    }
  }

  private async readItems(instanceId: string) {
    await this.ensureFile(instanceId);
    const raw = await readFile(this.getGrantPath(instanceId), "utf8");
    return (JSON.parse(raw) as StoredInstanceGrants).items;
  }

  async getActiveGrantByNeonUserId(instanceId: string, neonUserId: string) {
    const items = await this.readItems(instanceId);
    return items.find((item) => item.neonUserId === neonUserId && !item.revokedAt) ?? null;
  }

  async listActiveGrants(instanceId: string): Promise<FacilitatorGrantInfo[]> {
    const items = await this.readItems(instanceId);
    return items
      .filter((item) => !item.revokedAt)
      .map((item) => ({
        id: item.id,
        instanceId: item.instanceId,
        neonUserId: item.neonUserId,
        role: item.role,
        grantedAt: item.grantedAt,
        revokedAt: item.revokedAt,
        userName: null,
        userEmail: null,
      }));
  }

  async countActiveGrants(instanceId: string) {
    const items = await this.readItems(instanceId);
    return items.filter((item) => !item.revokedAt).length;
  }

  async createGrant(instanceId: string, neonUserId: string, role: InstanceGrantRecord["role"]) {
    const items = await this.readItems(instanceId);
    const grant: InstanceGrantRecord = {
      id: `grant-${randomUUID()}`,
      instanceId,
      neonUserId,
      role,
      grantedAt: new Date().toISOString(),
      revokedAt: null,
    };
    items.push(grant);
    await writeFile(this.getGrantPath(instanceId), JSON.stringify({ items }, null, 2));
    return grant;
  }

  async revokeGrant(grantId: string) {
    void grantId;
  }
}

export class NeonInstanceGrantRepository implements InstanceGrantRepository {
  private async ensureInstance(instanceId: string) {
    const sql = getNeonSql();
    const state = { ...seedWorkshopState, workshopId: instanceId };

    await sql.query(
      `
        INSERT INTO workshop_instances (id, template_id, workshop_meta, workshop_state)
        VALUES ($1, $2, $3::jsonb, $4::jsonb)
        ON CONFLICT (id) DO NOTHING
      `,
      [instanceId, seedWorkshopState.workshopId, JSON.stringify(state.workshopMeta), JSON.stringify(state)],
    );
  }

  async getActiveGrantByNeonUserId(instanceId: string, neonUserId: string) {
    const sql = getNeonSql();
    await this.ensureInstance(instanceId);
    const rows = (await sql.query(
      `
        SELECT id, instance_id, neon_user_id, role, granted_at, revoked_at
        FROM instance_grants
        WHERE instance_id = $1
          AND neon_user_id = $2
          AND revoked_at IS NULL
        LIMIT 1
      `,
      [instanceId, neonUserId],
    )) as GrantRow[];

    return rows[0] ? mapGrantRow(rows[0]) : null;
  }

  async listActiveGrants(instanceId: string): Promise<FacilitatorGrantInfo[]> {
    const sql = getNeonSql();
    await this.ensureInstance(instanceId);
    const rows = (await sql.query(
      `
        SELECT
          ig.id, ig.instance_id, ig.neon_user_id, ig.role, ig.granted_at, ig.revoked_at,
          u.name AS user_name, u.email AS user_email
        FROM instance_grants ig
        LEFT JOIN neon_auth."user" u ON u.id::text = ig.neon_user_id
        WHERE ig.instance_id = $1
          AND ig.revoked_at IS NULL
        ORDER BY ig.granted_at ASC
      `,
      [instanceId],
    )) as {
      id: string;
      instance_id: string;
      neon_user_id: string;
      role: InstanceGrantRecord["role"];
      granted_at: string;
      revoked_at: string | null;
      user_name: string | null;
      user_email: string | null;
    }[];

    return rows.map((row) => ({
      id: row.id,
      instanceId: row.instance_id,
      neonUserId: row.neon_user_id,
      role: row.role,
      grantedAt: row.granted_at,
      revokedAt: row.revoked_at,
      userName: row.user_name,
      userEmail: row.user_email,
    }));
  }

  async countActiveGrants(instanceId: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `SELECT count(*)::int AS cnt FROM instance_grants WHERE instance_id = $1 AND revoked_at IS NULL`,
      [instanceId],
    )) as { cnt: number }[];
    return rows[0]?.cnt ?? 0;
  }

  async createGrant(instanceId: string, neonUserId: string, role: InstanceGrantRecord["role"]) {
    const sql = getNeonSql();
    await this.ensureInstance(instanceId);
    const id = `grant-${randomUUID()}`;
    const now = new Date().toISOString();

    await sql.query(
      `
        INSERT INTO instance_grants (id, instance_id, neon_user_id, role, granted_at, revoked_at)
        VALUES ($1, $2, $3, $4, $5::timestamptz, NULL)
      `,
      [id, instanceId, neonUserId, role, now],
    );

    return {
      id,
      instanceId,
      neonUserId,
      role,
      grantedAt: now,
      revokedAt: null,
    };
  }

  async revokeGrant(grantId: string) {
    const sql = getNeonSql();
    await sql.query(
      `UPDATE instance_grants SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL`,
      [grantId],
    );
  }
}

type GrantRow = {
  id: string;
  instance_id: string;
  neon_user_id: string;
  role: InstanceGrantRecord["role"];
  granted_at: string;
  revoked_at: string | null;
};

function mapGrantRow(row: GrantRow): InstanceGrantRecord {
  return {
    id: row.id,
    instanceId: row.instance_id,
    neonUserId: row.neon_user_id,
    role: row.role,
    grantedAt: row.granted_at,
    revokedAt: row.revoked_at,
  };
}

export function getInstanceGrantRepository(): InstanceGrantRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon" ? new NeonInstanceGrantRepository() : new FileInstanceGrantRepository();
}

let overrideRepository: InstanceGrantRepository | null = null;

export function setInstanceGrantRepositoryForTests(repository: InstanceGrantRepository | null) {
  overrideRepository = repository;
}
