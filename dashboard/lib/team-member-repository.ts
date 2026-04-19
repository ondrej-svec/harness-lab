import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type {
  AssignResult,
  TeamMemberRecord,
  TeamMemberRepository,
} from "./runtime-contracts";

export type { TeamMemberRepository } from "./runtime-contracts";

type StoredMembers = {
  items: TeamMemberRecord[];
};

export class FileTeamMemberRepository implements TeamMemberRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getMembersPath(instanceId: string) {
    return path.join(this.dataDir, instanceId, "team-members.json");
  }

  private async ensureFile(instanceId: string) {
    const membersPath = this.getMembersPath(instanceId);
    await mkdir(path.dirname(membersPath), { recursive: true });
    try {
      await readFile(membersPath, "utf8");
    } catch {
      await writeFile(
        membersPath,
        JSON.stringify({ items: [] satisfies TeamMemberRecord[] }, null, 2),
      );
    }
  }

  private async readAll(instanceId: string): Promise<TeamMemberRecord[]> {
    await this.ensureFile(instanceId);
    const raw = await readFile(this.getMembersPath(instanceId), "utf8");
    return (JSON.parse(raw) as StoredMembers).items;
  }

  async listMembers(instanceId: string) {
    return this.readAll(instanceId);
  }

  async listMembersByTeam(instanceId: string, teamId: string) {
    const items = await this.readAll(instanceId);
    return items.filter((m) => m.teamId === teamId);
  }

  async findMemberByParticipant(instanceId: string, participantId: string) {
    const items = await this.readAll(instanceId);
    return items.find((m) => m.participantId === participantId) ?? null;
  }

  async assignMember(instanceId: string, assignment: TeamMemberRecord): Promise<AssignResult> {
    const items = await this.readAll(instanceId);
    const existing = items.find((m) => m.participantId === assignment.participantId);
    const movedFrom =
      existing && existing.teamId !== assignment.teamId ? existing.teamId : null;

    // Idempotent on same team: keep the original row unchanged.
    if (existing && existing.teamId === assignment.teamId) {
      return { teamId: assignment.teamId, movedFrom: null, changed: false };
    }

    const withoutParticipant = items.filter(
      (m) => m.participantId !== assignment.participantId,
    );
    const nextItems = [...withoutParticipant, assignment];
    await this.replaceMembers(instanceId, nextItems);
    return { teamId: assignment.teamId, movedFrom, changed: true };
  }

  async unassignMember(instanceId: string, participantId: string) {
    const items = await this.readAll(instanceId);
    const existing = items.find((m) => m.participantId === participantId) ?? null;
    const nextItems = items.filter((m) => m.participantId !== participantId);
    if (nextItems.length === items.length) {
      return null; // already unassigned — idempotent
    }
    await this.replaceMembers(instanceId, nextItems);
    return existing ? { teamId: existing.teamId } : null;
  }

  async replaceMembers(instanceId: string, members: TeamMemberRecord[]) {
    const membersPath = this.getMembersPath(instanceId);
    await mkdir(path.dirname(membersPath), { recursive: true });
    const tempPath = `${membersPath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify({ items: members }, null, 2));
    await rename(tempPath, membersPath);
  }
}

type TeamMemberRow = {
  id: string;
  instance_id: string;
  team_id: string;
  participant_id: string;
  assigned_at: string;
};

function rowToRecord(row: TeamMemberRow): TeamMemberRecord {
  return {
    id: row.id,
    instanceId: row.instance_id,
    teamId: row.team_id,
    participantId: row.participant_id,
    assignedAt: row.assigned_at,
  };
}

export class NeonTeamMemberRepository implements TeamMemberRepository {
  async listMembers(instanceId: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT id, instance_id, team_id, participant_id, assigned_at
        FROM team_members
        WHERE instance_id = $1
        ORDER BY assigned_at ASC
      `,
      [instanceId],
    )) as TeamMemberRow[];
    return rows.map(rowToRecord);
  }

  async listMembersByTeam(instanceId: string, teamId: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT id, instance_id, team_id, participant_id, assigned_at
        FROM team_members
        WHERE instance_id = $1 AND team_id = $2
        ORDER BY assigned_at ASC
      `,
      [instanceId, teamId],
    )) as TeamMemberRow[];
    return rows.map(rowToRecord);
  }

  async findMemberByParticipant(instanceId: string, participantId: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT id, instance_id, team_id, participant_id, assigned_at
        FROM team_members
        WHERE instance_id = $1 AND participant_id = $2
      `,
      [instanceId, participantId],
    )) as TeamMemberRow[];
    return rows[0] ? rowToRecord(rows[0]) : null;
  }

  async assignMember(instanceId: string, assignment: TeamMemberRecord): Promise<AssignResult> {
    const sql = getNeonSql();

    const existingRows = (await sql.query(
      `
        SELECT team_id
        FROM team_members
        WHERE instance_id = $1 AND participant_id = $2
      `,
      [instanceId, assignment.participantId],
    )) as { team_id: string }[];

    const previousTeamId = existingRows[0]?.team_id ?? null;
    if (previousTeamId === assignment.teamId) {
      return { teamId: assignment.teamId, movedFrom: null, changed: false };
    }

    if (previousTeamId !== null) {
      await sql.query(
        `DELETE FROM team_members WHERE instance_id = $1 AND participant_id = $2`,
        [instanceId, assignment.participantId],
      );
    }

    await sql.query(
      `
        INSERT INTO team_members (id, instance_id, team_id, participant_id, assigned_at)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        assignment.id,
        instanceId,
        assignment.teamId,
        assignment.participantId,
        assignment.assignedAt,
      ],
    );

    return { teamId: assignment.teamId, movedFrom: previousTeamId, changed: true };
  }

  async unassignMember(instanceId: string, participantId: string) {
    const sql = getNeonSql();
    const existingRows = (await sql.query(
      `
        SELECT team_id
        FROM team_members
        WHERE instance_id = $1 AND participant_id = $2
      `,
      [instanceId, participantId],
    )) as { team_id: string }[];

    const previousTeamId = existingRows[0]?.team_id ?? null;
    if (!previousTeamId) {
      return null;
    }

    await sql.query(
      `DELETE FROM team_members WHERE instance_id = $1 AND participant_id = $2`,
      [instanceId, participantId],
    );

    return { teamId: previousTeamId };
  }

  async replaceMembers(instanceId: string, members: TeamMemberRecord[]) {
    const sql = getNeonSql();
    await sql.query("DELETE FROM team_members WHERE instance_id = $1", [instanceId]);
    for (const member of members) {
      await sql.query(
        `
          INSERT INTO team_members (id, instance_id, team_id, participant_id, assigned_at)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [member.id, instanceId, member.teamId, member.participantId, member.assignedAt],
      );
    }
  }
}

let overrideRepository: TeamMemberRepository | null = null;

export function getTeamMemberRepository(): TeamMemberRepository {
  if (overrideRepository) {
    return overrideRepository;
  }
  return getRuntimeStorageMode() === "neon"
    ? new NeonTeamMemberRepository()
    : new FileTeamMemberRepository();
}

export function setTeamMemberRepositoryForTests(repository: TeamMemberRepository | null) {
  overrideRepository = repository;
}
