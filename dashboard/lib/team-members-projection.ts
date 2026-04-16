import { getParticipantRepository } from "./participant-repository";
import { getTeamMemberRepository } from "./team-member-repository";
import { getTeamRepository } from "./team-repository";
import type { TeamRecord } from "./runtime-contracts";

/**
 * Derive each team's members-as-display-names list from the canonical
 * (participants × team_members) join. Writes the result back onto
 * `team.payload.members: string[]` via the existing TeamRepository so
 * all read paths — `GET /api/teams`, `GET /api/event-context/teams`,
 * participant header display — continue to use the denormalized field
 * without any query changes.
 *
 * Called by API routes after any team_members mutation. The projection
 * is source-of-truth on writes; callers should not edit `team.payload.members`
 * directly outside this helper (legacy direct edits via the team-members
 * comma-string input will be removed during Phase 3).
 */
export async function rebuildTeamMembersProjection(instanceId: string): Promise<void> {
  const participantRepo = getParticipantRepository();
  const teamMemberRepo = getTeamMemberRepository();
  const teamRepo = getTeamRepository();

  const [participants, members, teams] = await Promise.all([
    participantRepo.listParticipants(instanceId, { includeArchived: true }),
    teamMemberRepo.listMembers(instanceId),
    teamRepo.listTeams(instanceId),
  ]);

  const displayNameById = new Map(participants.map((p) => [p.id, p.displayName]));

  // Group members by team, preserving assigned_at order (listMembers returns
  // rows ordered by assigned_at asc; file-mode preserves insertion order).
  const membersByTeam = new Map<string, string[]>();
  for (const member of members) {
    const displayName = displayNameById.get(member.participantId);
    if (displayName === undefined) continue; // orphaned row — skip, don't crash
    const list = membersByTeam.get(member.teamId) ?? [];
    list.push(displayName);
    membersByTeam.set(member.teamId, list);
  }

  for (const team of teams) {
    const derived = membersByTeam.get(team.id) ?? [];
    if (arraysEqual(team.members, derived)) continue;
    const updated: TeamRecord = { ...team, members: derived };
    await teamRepo.upsertTeam(instanceId, updated);
  }
}

/**
 * Diff the denormalized projection against its canonical source. Returns
 * per-team drift details; used by the repository test suite to fail the
 * build when a write path forgot to call `rebuildTeamMembersProjection`.
 */
export async function detectTeamMembersProjectionDrift(
  instanceId: string,
): Promise<TeamMembersProjectionDrift[]> {
  const participantRepo = getParticipantRepository();
  const teamMemberRepo = getTeamMemberRepository();
  const teamRepo = getTeamRepository();

  const [participants, members, teams] = await Promise.all([
    participantRepo.listParticipants(instanceId, { includeArchived: true }),
    teamMemberRepo.listMembers(instanceId),
    teamRepo.listTeams(instanceId),
  ]);

  const displayNameById = new Map(participants.map((p) => [p.id, p.displayName]));
  const membersByTeam = new Map<string, string[]>();
  for (const member of members) {
    const displayName = displayNameById.get(member.participantId);
    if (displayName === undefined) continue;
    const list = membersByTeam.get(member.teamId) ?? [];
    list.push(displayName);
    membersByTeam.set(member.teamId, list);
  }

  const drift: TeamMembersProjectionDrift[] = [];
  for (const team of teams) {
    const expected = membersByTeam.get(team.id) ?? [];
    if (!arraysEqual(team.members, expected)) {
      drift.push({ teamId: team.id, expected, actual: team.members });
    }
  }
  return drift;
}

export type TeamMembersProjectionDrift = {
  teamId: string;
  expected: string[];
  actual: string[];
};

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
