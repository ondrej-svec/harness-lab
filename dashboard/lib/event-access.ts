import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Challenge, ProjectBrief, SetupPath, SprintUpdate, Team, WorkshopState } from "./workshop-data";
import { getEventAccessRepository, type ParticipantSessionRecord } from "./event-access-repository";
import { getWorkshopState } from "./workshop-store";

export const participantSessionCookieName = "harness_event_session";

const sampleEventCode = "lantern8-context4-handoff2";
const eventCodeValidityDays = 14;
const participantSessionHours = 12;

export type ParticipantCoreBundle = {
  event: {
    title: string;
    subtitle: string;
    currentPhaseLabel: string;
    dateRange: string;
    city: string;
  };
  agenda: WorkshopState["agenda"];
  briefs: Pick<ProjectBrief, "id" | "title" | "problem" | "firstAgentPrompt">[];
  challenges: Pick<Challenge, "id" | "title" | "category" | "phaseHint" | "description">[];
  keyLinks: SetupPath[];
  announcements: SprintUpdate[];
};

export type ParticipantTeamLookup = {
  items: Pick<Team, "id" | "name" | "city" | "repoUrl" | "checkpoint">[];
};

export function getConfiguredEventCode() {
  const code = process.env.HARNESS_EVENT_CODE ?? sampleEventCode;
  const expiresAt =
    process.env.HARNESS_EVENT_CODE_EXPIRES_AT ??
    new Date(Date.now() + eventCodeValidityDays * 24 * 60 * 60 * 1000).toISOString();

  return {
    code,
    codeId: createHash("sha256").update(code).digest("hex").slice(0, 12),
    expiresAt,
    isSample: !process.env.HARNESS_EVENT_CODE,
  };
}

export function getParticipantSessionExpiryDate() {
  return new Date(Date.now() + participantSessionHours * 60 * 60 * 1000);
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function redeemEventCode(submittedCode: string) {
  const normalized = submittedCode.trim();
  const config = getConfiguredEventCode();

  if (Date.parse(config.expiresAt) <= Date.now()) {
    return { ok: false as const, reason: "expired_code" as const };
  }

  if (!safeCompare(normalized, config.code)) {
    return { ok: false as const, reason: "invalid_code" as const };
  }

  const repository = getEventAccessRepository();
  const sessions = await repository.getSessions();
  const freshSessions = pruneExpiredSessions(sessions);

  const nextSession: ParticipantSessionRecord = {
    token: randomUUID(),
    createdAt: new Date().toISOString(),
    lastValidatedAt: new Date().toISOString(),
    expiresAt: getParticipantSessionExpiryDate().toISOString(),
  };

  await repository.saveSessions([...freshSessions, nextSession]);

  return {
    ok: true as const,
    session: nextSession,
    config,
  };
}

export async function getParticipantSession(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const repository = getEventAccessRepository();
  const sessions = await repository.getSessions();
  const freshSessions = pruneExpiredSessions(sessions);
  const session = freshSessions.find((item) => item.token === token) ?? null;

  if (freshSessions.length !== sessions.length) {
    await repository.saveSessions(freshSessions);
  }

  if (!session) {
    return null;
  }

  const refreshedSession: ParticipantSessionRecord = {
    ...session,
    lastValidatedAt: new Date().toISOString(),
  };

  await repository.saveSessions(
    freshSessions.map((item) => (item.token === refreshedSession.token ? refreshedSession : item)),
  );

  return refreshedSession;
}

export async function getParticipantSessionFromCookieStore() {
  const cookieStore = await cookies();
  return getParticipantSession(cookieStore.get(participantSessionCookieName)?.value);
}

export async function revokeParticipantSession(token: string | undefined | null) {
  if (!token) {
    return;
  }

  const repository = getEventAccessRepository();
  const sessions = await repository.getSessions();
  await repository.saveSessions(sessions.filter((item) => item.token !== token));
}

export async function requireParticipantSession(request: Request) {
  const session = await getParticipantSession(readCookieValue(request, participantSessionCookieName));

  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          ok: false,
          error: "participant event access required",
          loginCommand: "/workshop login",
        },
        { status: 401 },
      ),
    };
  }

  return { ok: true as const, session };
}

export async function getParticipantCoreBundle(): Promise<ParticipantCoreBundle> {
  const state = await getWorkshopState();

  return {
    event: {
      title: state.workshopMeta.title,
      subtitle: state.workshopMeta.subtitle,
      currentPhaseLabel: state.workshopMeta.currentPhaseLabel,
      dateRange: state.workshopMeta.dateRange,
      city: state.workshopMeta.city,
    },
    agenda: state.agenda,
    briefs: state.briefs.map((brief) => ({
      id: brief.id,
      title: brief.title,
      problem: brief.problem,
      firstAgentPrompt: brief.firstAgentPrompt,
    })),
    challenges: state.challenges.map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      category: challenge.category,
      phaseHint: challenge.phaseHint,
      description: challenge.description,
    })),
    keyLinks: state.setupPaths,
    announcements: state.sprintUpdates,
  };
}

export async function getParticipantTeamLookup(): Promise<ParticipantTeamLookup> {
  const state = await getWorkshopState();

  return {
    items: state.teams.map((team) => ({
      id: team.id,
      name: team.name,
      city: team.city,
      repoUrl: team.repoUrl,
      checkpoint: team.checkpoint,
    })),
  };
}

function pruneExpiredSessions(sessions: ParticipantSessionRecord[]) {
  return sessions.filter((session) => Date.parse(session.expiresAt) > Date.now());
}

function readCookieValue(request: Request, cookieName: string) {
  const rawCookie = request.headers.get("cookie");
  if (!rawCookie) {
    return null;
  }

  const value = rawCookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`));

  return value ? decodeURIComponent(value.slice(cookieName.length + 1)) : null;
}
