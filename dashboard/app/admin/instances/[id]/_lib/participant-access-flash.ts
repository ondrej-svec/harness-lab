// Shared between the access server action (which writes the cookie) and
// the admin page component (which reads + clears it). Not a "use server"
// file — exports a constant, a type, and a parser.

export const participantAccessFlashCookieName = "harness_participant_access_flash";

export type ParticipantAccessFlash = {
  instanceId: string;
  issuedCode: string;
  codeId: string | null;
};

export function parseParticipantAccessFlash(
  value: string | undefined,
  instanceId: string,
): ParticipantAccessFlash | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as ParticipantAccessFlash;
    if (
      typeof parsed.instanceId === "string" &&
      parsed.instanceId === instanceId &&
      typeof parsed.issuedCode === "string"
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}
