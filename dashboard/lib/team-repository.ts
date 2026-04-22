import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { TeamRecord, TeamRepository } from "./runtime-contracts";

export type { TeamRepository } from "./runtime-contracts";

type StoredTeams = {
  items: TeamRecord[];
};

export class FileTeamRepository implements TeamRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getTeamsPath(instanceId: string) {
    return path.join(this.dataDir, instanceId, "teams.json");
  }

  private async ensureFile(instanceId: string) {
    const teamsPath = this.getTeamsPath(instanceId);
    await mkdir(path.dirname(teamsPath), { recursive: true });
    try {
      await readFile(teamsPath, "utf8");
    } catch {
      await writeFile(teamsPath, JSON.stringify({ items: [] satisfies TeamRecord[] }, null, 2));
    }
  }

  async listTeams(instanceId: string) {
    const teamsPath = this.getTeamsPath(instanceId);
    await this.ensureFile(instanceId);
    const raw = await readFile(teamsPath, "utf8");
    return (JSON.parse(raw) as StoredTeams).items;
  }

  async upsertTeam(instanceId: string, team: TeamRecord) {
    const items = await this.listTeams(instanceId);
    const nextItems = items.some((item) => item.id === team.id)
      ? items.map((item) => (item.id === team.id ? team : item))
      : [...items, team];
    await this.replaceTeams(instanceId, nextItems);
  }

  async replaceTeams(instanceId: string, teams: TeamRecord[]) {
    const teamsPath = this.getTeamsPath(instanceId);
    await mkdir(path.dirname(teamsPath), { recursive: true });
    const tempPath = `${teamsPath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify({ items: teams }, null, 2));
    await rename(tempPath, teamsPath);
  }
}

export class NeonTeamRepository implements TeamRepository {
  async listTeams(instanceId: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT payload
        FROM teams
        WHERE instance_id = $1
        ORDER BY created_at ASC
      `,
      [instanceId],
    )) as { payload: TeamRecord }[];

    return rows.map((row) => row.payload);
  }

  async upsertTeam(instanceId: string, team: TeamRecord) {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO teams (id, instance_id, payload, created_at, updated_at)
        VALUES ($1, $2, $3::jsonb, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
        SET payload = EXCLUDED.payload,
            updated_at = NOW()
      `,
      [team.id, instanceId, JSON.stringify(team)],
    );
  }

  async replaceTeams(instanceId: string, teams: TeamRecord[]) {
    const sql = getNeonSql();
    const keepIds = teams.map((team) => team.id);

    // Two Neon HTTP calls total: delete-not-in-set, then upsert-all-in-set.
    // Pre-Phase 3, this was a serial N+1 loop (51 calls for 50 teams).
    await sql.query(
      `DELETE FROM teams
         WHERE instance_id = $1
           AND id != ALL($2::text[])`,
      [instanceId, keepIds],
    );

    if (teams.length === 0) {
      return;
    }

    await sql.query(
      `
        INSERT INTO teams (id, instance_id, payload, created_at, updated_at)
        SELECT id, $1, payload::jsonb, NOW(), NOW()
        FROM unnest($2::text[], $3::text[])
          AS rows(id, payload)
        ON CONFLICT (id) DO UPDATE
        SET payload = EXCLUDED.payload,
            updated_at = NOW()
      `,
      [
        instanceId,
        teams.map((team) => team.id),
        teams.map((team) => JSON.stringify(team)),
      ],
    );
  }
}

export function getTeamRepository(): TeamRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon" ? new NeonTeamRepository() : new FileTeamRepository();
}

let overrideRepository: TeamRepository | null = null;

export function setTeamRepositoryForTests(repository: TeamRepository | null) {
  overrideRepository = repository;
}
