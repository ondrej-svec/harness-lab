import { challenges } from "@/lib/workshop-data";

export type ChallengeCompletionResult = {
  ok: boolean;
  persisted: false;
  challengeId: string;
  completedBy: string[];
  note: string;
};

export function completeChallenge(challengeId: string, teamId: string): ChallengeCompletionResult {
  const challenge = challenges.find((item) => item.id === challengeId);

  if (!challenge) {
    return {
      ok: false,
      persisted: false,
      challengeId,
      completedBy: [],
      note: "Challenge nebyla nalezena.",
    };
  }

  const completedBy = challenge.completedBy.includes(teamId)
    ? challenge.completedBy
    : [...challenge.completedBy, teamId];

  return {
    ok: true,
    persisted: false,
    challengeId,
    completedBy,
    note: "Seed data byla aktualizována jen pro tuto odpověď. Pro trvalé ukládání doplňte databázový adapter.",
  };
}
