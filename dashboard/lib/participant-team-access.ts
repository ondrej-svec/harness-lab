import { getTeamMemberRepository } from "./team-member-repository";
import { getWorkshopInstanceRepository } from "./workshop-instance-repository";

export class ParticipantTeamAccessError extends Error {
  constructor(
    readonly code:
      | "participant_identity_required"
      | "team_membership_required"
      | "team_forbidden"
      | "team_mode_disabled",
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

/**
 * Participant-scoped write auth for participant-mode instances
 * (team_mode_enabled = false). No team_members lookup — the participant
 * writes against their own identity directly. Session validity and
 * instance match are the only gates.
 *
 * Callers should check the instance mode first (isTeamModeEnabled) and
 * dispatch between this and requireParticipantTeamAccess.
 */
export async function requireParticipantScopedWrite(input: {
  instanceId: string;
  participantId: string | null | undefined;
}): Promise<{ participantId: string }> {
  const { participantId } = input;

  if (!participantId) {
    throw new ParticipantTeamAccessError(
      "participant_identity_required",
      "participant identity is required for participant-mode updates",
    );
  }

  return { participantId };
}

/**
 * Read the workshop instance's team_mode_enabled flag. Defaults to true
 * when the record cannot be loaded — callers should prefer the safer
 * team-mode path rather than a mystery state. Used at the API boundary
 * to route between team-scoped and participant-scoped auth and
 * storage.
 */
export async function isTeamModeEnabled(instanceId: string): Promise<boolean> {
  const instance = await getWorkshopInstanceRepository().getInstance(instanceId);
  return instance?.teamModeEnabled ?? true;
}
