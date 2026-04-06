import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { InstanceGrantRecord, InstanceGrantRepository } from "./runtime-contracts";

type StoredInstanceGrants = {
  items: InstanceGrantRecord[];
};

function getSampleGrant(instanceId: string): InstanceGrantRecord {
  return {
    id: `grant-${instanceId}-facilitator-sample`,
    instanceId,
    facilitatorIdentityId: "facilitator-sample",
    role: "owner",
    revokedAt: null,
  };
}

class FileInstanceGrantRepository implements InstanceGrantRepository {
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

  async getActiveGrant(instanceId: string, facilitatorIdentityId: string) {
    const grantPath = this.getGrantPath(instanceId);
    await this.ensureFile(instanceId);
    const raw = await readFile(grantPath, "utf8");
    const items = (JSON.parse(raw) as StoredInstanceGrants).items;
    return items.find((item) => item.facilitatorIdentityId === facilitatorIdentityId && !item.revokedAt) ?? null;
  }
}

class NeonInstanceGrantRepository implements InstanceGrantRepository {
  private async ensureSeedGrant(instanceId: string) {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO instance_grants (id, instance_id, facilitator_identity_id, role, revoked_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `,
      [`grant-${instanceId}-facilitator-sample`, instanceId, "facilitator-sample", "owner", null],
    );
  }

  async getActiveGrant(instanceId: string, facilitatorIdentityId: string) {
    const sql = getNeonSql();
    await this.ensureSeedGrant(instanceId);
    const rows = (await sql.query(
      `
        SELECT id, instance_id, facilitator_identity_id, role, revoked_at
        FROM instance_grants
        WHERE instance_id = $1
          AND facilitator_identity_id = $2
          AND revoked_at IS NULL
        LIMIT 1
      `,
      [instanceId, facilitatorIdentityId],
    )) as {
      id: string;
      instance_id: string;
      facilitator_identity_id: string;
      role: "owner" | "operator" | "observer";
      revoked_at: string | null;
    }[];

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      instanceId: row.instance_id,
      facilitatorIdentityId: row.facilitator_identity_id,
      role: row.role,
      revokedAt: row.revoked_at,
    };
  }
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
