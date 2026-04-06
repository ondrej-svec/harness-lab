import { randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Challenge, ProjectBrief, SetupPath, SprintUpdate, Team, WorkshopState } from "./workshop-data";
import { getAuditLogRepository } from "./audit-log-repository";
import { getEventAccessRepository } from "./event-access-repository";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { getEventAccessPreview, getParticipantEventAccessRepository, hashSecret } from "./participant-event-access-repository";
import type { ParticipantSession, ParticipantSessionRecord } from "./runtime-contracts";
import { getWorkshopState } from "./workshop-store";

export const participantSessionCookieName = "harness_event_session";

const participantSessionHours = 12;
const participantSessionAbsoluteHours = 16;

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

export async function getConfiguredEventCode() {
  return getEventAccessPreview();
}

export function getParticipantSessionExpiryDate() {
  return new Date(Date.now() + participantSessionHours * 60 * 60 * 1000);
}

export function getParticipantSessionAbsoluteExpiryDate() {
  return new Date(Date.now() + participantSessionAbsoluteHours * 60 * 60 * 1000);
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
  const instanceId = getCurrentWorkshopInstanceId();
  const auditLogRepository = getAuditLogRepository();
  const eventAccess = await getParticipantEventAccessRepository().getActiveAccess(instanceId);

  if (!eventAccess || Date.parse(eventAccess.expiresAt) <= Date.now()) {
    await auditLogRepository.append({
      id: `audit-${randomUUID()}`,
      instanceId,
      actorKind: "participant",
      action: "participant_event_access_redeem",
      result: "failure",
      createdAt: new Date().toISOString(),
      metadata: { reason: "expired_code" },
    });
    return { ok: false as const, reason: "expired_code" as const };
  }

  if (!safeCompare(hashSecret(normalized), eventAccess.codeHash)) {
    await auditLogRepository.append({
      id: `audit-${randomUUID()}`,
      instanceId,
      actorKind: "participant",
      action: "participant_event_access_redeem",
      result: "failure",
      createdAt: new Date().toISOString(),
      metadata: { reason: "invalid_code" },
    });
    return { ok: false as const, reason: "invalid_code" as const };
  }

  const repository = getEventAccessRepository();
  const sessions = await repository.getSessions(instanceId);
  const freshSessions = pruneExpiredSessions(sessions);
  const token = randomUUID();

  const nextSession: ParticipantSessionRecord = {
    tokenHash: hashSecret(token),
    instanceId,
    createdAt: new Date().toISOString(),
    lastValidatedAt: new Date().toISOString(),
    expiresAt: getParticipantSessionExpiryDate().toISOString(),
    absoluteExpiresAt: getParticipantSessionAbsoluteExpiryDate().toISOString(),
  };

  await repository.saveSessions(instanceId, [...freshSessions, nextSession]);
  await auditLogRepository.append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "participant",
    action: "participant_event_access_redeem",
    result: "success",
    createdAt: new Date().toISOString(),
  });

  return {
    ok: true as const,
    session: {
      token,
      instanceId,
      expiresAt: nextSession.expiresAt,
      lastValidatedAt: nextSession.lastValidatedAt,
      absoluteExpiresAt: nextSession.absoluteExpiresAt,
    },
  };
}

export async function getParticipantSession(token: string | undefined | null): Promise<ParticipantSession | null> {
  if (!token) {
    return null;
  }

  const instanceId = getCurrentWorkshopInstanceId();
  const repository = getEventAccessRepository();
  const sessions = await repository.getSessions(instanceId);
  const freshSessions = pruneExpiredSessions(sessions).filter((item) => item.instanceId === instanceId);
  const session = freshSessions.find((item) => safeCompare(item.tokenHash, hashSecret(token))) ?? null;

  if (freshSessions.length !== sessions.length) {
    await repository.saveSessions(instanceId, freshSessions);
  }

  if (!session) {
    return null;
  }

  const refreshedSession: ParticipantSessionRecord = {
    ...session,
    lastValidatedAt: new Date().toISOString(),
  };

  await repository.saveSessions(
    instanceId,
    freshSessions.map((item) => (item.tokenHash === refreshedSession.tokenHash ? refreshedSession : item)),
  );

  return {
    instanceId,
    expiresAt: refreshedSession.expiresAt,
    lastValidatedAt: refreshedSession.lastValidatedAt,
    absoluteExpiresAt: refreshedSession.absoluteExpiresAt,
  };
}

export async function getParticipantSessionFromCookieStore() {
  const cookieStore = await cookies();
  return getParticipantSession(cookieStore.get(participantSessionCookieName)?.value);
}

export async function revokeParticipantSession(token: string | undefined | null) {
  if (!token) {
    return;
  }

  const instanceId = getCurrentWorkshopInstanceId();
  const tokenHash = hashSecret(token);
  const repository = getEventAccessRepository();
  const sessions = await repository.getSessions(instanceId);
  await repository.saveSessions(
    instanceId,
    sessions.filter((item) => !safeCompare(item.tokenHash, tokenHash)),
  );
  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "participant",
    action: "participant_session_revoked",
    result: "success",
    createdAt: new Date().toISOString(),
  });
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
  return sessions.filter(
    (session) =>
      Date.parse(session.expiresAt) > Date.now() && Date.parse(session.absoluteExpiresAt) > Date.now(),
  );
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
