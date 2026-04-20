import { getTeamMemberRepository } from "./team-member-repository";

export class ParticipantTeamAccessError extends Error {
  constructor(
    readonly code: "participant_identity_required" | "team_membership_required" | "team_forbidden",
    message: string,
  ) {
    super(message);
    this.name = "ParticipantTeamAccessError";
  }
}

export function isParticipantTeamAccessError(error: unknown): error is ParticipantTeamAccessError {
  return error instanceof ParticipantTeamAccessError;
}

export async function requireParticipantTeamAccess(input: {
  instanceId: string;
  participantId: string | null | undefined;
  teamId: string;
}) {
  const { instanceId, participantId, teamId } = input;

  if (!participantId) {
    throw new ParticipantTeamAccessError(
      "participant_identity_required",
      "participant identity is required for team updates",
    );
  }

  const membership = await getTeamMemberRepository().findMemberByParticipant(instanceId, participantId);
  if (!membership) {
    throw new ParticipantTeamAccessError(
      "team_membership_required",
      "participant must be assigned to a team before writing team updates",
    );
  }

  if (membership.teamId !== teamId) {
    throw new ParticipantTeamAccessError(
      "team_forbidden",
      "participant may only update their assigned team",
    );
  }

  return membership;
}
