import { randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Challenge, ProjectBrief, SetupPath, SprintUpdate, Team, WorkshopState } from "./workshop-data";
import { getAuditLogRepository } from "./audit-log-repository";
import { getEventAccessRepository } from "./event-access-repository";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { getParticipantRepository } from "./participant-repository";
import { getEventAccessPreview, getParticipantEventAccessRepository, hashSecret } from "./participant-event-access-repository";
import type { ParticipantRecord, ParticipantSession, ParticipantSessionRecord } from "./runtime-contracts";
import { getRuntimeStorageMode } from "./runtime-storage";
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
  liveMomentFingerprint: string;
};

export type ParticipantTeamLookup = {
  items: Pick<Team, "id" | "name" | "city" | "members" | "repoUrl" | "checkIns" | "projectBriefId" | "anchor">[];
};

export async function getConfiguredEventCode() {
  // In Neon mode, event codes are managed per-instance in the DB — no env var needed.
  // Only show the sample hint in file mode where a seed code is configured.
  if (getRuntimeStorageMode() === "neon") {
    return null;
  }
  return getEventAccessPreview();
}

export function getParticipantSessionExpiryDate() {
  return new Date(Date.now() + participantSessionHours * 60 * 60 * 1000);
}

export function getParticipantSessionAbsoluteExpiryDate() {
  return new Date(Date.now() + participantSessionAbsoluteHours * 60 * 60 * 1000);
}

export function getParticipantSessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires,
  };
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

const maxDisplayNameLength = 80;

/**
 * Validate a submitted display name. Returns the trimmed value on success,
 * or a reason string on failure. Used by the redeem and identify paths.
 */
export function validateDisplayName(raw: unknown): { ok: true; value: string } | { ok: false; reason: "missing" | "too_long" } {
  if (typeof raw !== "string") return { ok: false, reason: "missing" };
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: false, reason: "missing" };
  if (trimmed.length > maxDisplayNameLength) return { ok: false, reason: "too_long" };
  return { ok: true, value: trimmed };
}

/**
 * Find-or-create a participant for the given instance + displayName. If
 * a matching active row exists (case-insensitive), reuse it — this makes
 * the self-identify flow idempotent across lost cookies. Returns the
 * participant record; does NOT touch any session.
 */
export async function findOrCreateParticipant(
  instanceId: string,
  displayName: string,
): Promise<ParticipantRecord> {
  const repository = getParticipantRepository();
  const existing = await repository.findParticipantByDisplayName(instanceId, displayName);
  if (existing) return existing;

  const now = new Date().toISOString();
  const participant: ParticipantRecord = {
    id: `p-${randomUUID()}`,
    instanceId,
    displayName,
    email: null,
    emailOptIn: false,
    tag: null,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  };
  await repository.upsertParticipant(instanceId, participant);
  return participant;
}

export async function redeemEventCode(submittedCode: string, displayName?: string) {
  const normalized = submittedCode.trim();
  const codeHash = hashSecret(normalized);
  const auditLogRepository = getAuditLogRepository();
  const accessRepository = getParticipantEventAccessRepository();

  // Scan all instances' active event codes to find which one this code belongs to.
  const allAccess = await accessRepository.listAllActiveAccess();
  const matchedAccess = allAccess.find(
    (access) => Date.parse(access.expiresAt) > Date.now() && safeCompare(codeHash, access.codeHash),
  );

  if (!matchedAccess) {
    // Determine whether to report "invalid" or "expired" for audit purposes.
    const expiredMatch = allAccess.find((access) => safeCompare(codeHash, access.codeHash));
    const reason = expiredMatch ? "expired_code" : "invalid_code";
    await auditLogRepository.append({
      id: `audit-${randomUUID()}`,
      instanceId: expiredMatch?.instanceId ?? "unknown",
      actorKind: "participant",
      action: "participant_event_access_redeem",
      result: "failure",
      createdAt: new Date().toISOString(),
      metadata: { reason },
    });
    return { ok: false as const, reason: reason as "expired_code" | "invalid_code" };
  }

  const instanceId = matchedAccess.instanceId;

  // Optional display name → find-or-create participant + bind the session.
  let participantId: string | null = null;
  if (displayName !== undefined) {
    const validated = validateDisplayName(displayName);
    if (!validated.ok) {
      await auditLogRepository.append({
        id: `audit-${randomUUID()}`,
        instanceId,
        actorKind: "participant",
        action: "participant_event_access_redeem",
        result: "failure",
        createdAt: new Date().toISOString(),
        metadata: { reason: `invalid_display_name_${validated.reason}` },
      });
      return { ok: false as const, reason: "invalid_display_name" as const };
    }
    const participant = await findOrCreateParticipant(instanceId, validated.value);
    participantId = participant.id;
  }

  const repository = getEventAccessRepository();
  await repository.deleteExpiredSessions(instanceId, new Date().toISOString());
  const token = randomUUID();

  const nextSession: ParticipantSessionRecord = {
    tokenHash: hashSecret(token),
    instanceId,
    createdAt: new Date().toISOString(),
    lastValidatedAt: new Date().toISOString(),
    expiresAt: getParticipantSessionExpiryDate().toISOString(),
    absoluteExpiresAt: getParticipantSessionAbsoluteExpiryDate().toISOString(),
    participantId,
  };

  await repository.upsertSession(instanceId, nextSession);
  await auditLogRepository.append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "participant",
    action: "participant_event_access_redeem",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: participantId ? { participantId, named: true } : undefined,
  });

  return {
    ok: true as const,
    session: {
      token,
      instanceId,
      expiresAt: nextSession.expiresAt,
      lastValidatedAt: nextSession.lastValidatedAt,
      absoluteExpiresAt: nextSession.absoluteExpiresAt,
      participantId,
    },
  };
}

/**
 * Bind a participant to an already-authenticated session. Used by the
 * `/api/event-access/identify` endpoint for participants who redeemed
 * without a name and are self-identifying after the fact. Idempotent for
 * the same (session, displayName) pair; rejects rebinding to a different
 * identity.
 */
export async function bindParticipantToSession(
  session: ParticipantSession,
  tokenHash: string,
  displayName: string,
): Promise<{ ok: true; participantId: string } | { ok: false; reason: "already_bound" | "invalid_display_name" }> {
  const validated = validateDisplayName(displayName);
  if (!validated.ok) return { ok: false, reason: "invalid_display_name" };

  if (session.participantId) {
    // Re-identifying with the same name on an existing binding is idempotent.
    const existing = await getParticipantRepository().findParticipant(
      session.instanceId,
      session.participantId,
    );
    if (existing && existing.displayName.toLocaleLowerCase() === validated.value.toLocaleLowerCase()) {
      return { ok: true, participantId: session.participantId };
    }
    return { ok: false, reason: "already_bound" };
  }

  const participant = await findOrCreateParticipant(session.instanceId, validated.value);

  const repository = getEventAccessRepository();
  const fullSession = await repository.findSessionByTokenHash(tokenHash);
  if (!fullSession) {
    // Race: session vanished between validation and update. Caller should
    // surface this as no_session, but we can't easily re-read here without
    // the raw session record — let the caller decide by returning the ID
    // we minted; they can verify.
    return { ok: true, participantId: participant.id };
  }

  await repository.upsertSession(session.instanceId, {
    ...fullSession,
    participantId: participant.id,
    lastValidatedAt: new Date().toISOString(),
  });

  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId: session.instanceId,
    actorKind: "participant",
    action: "participant_self_identify",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: { participantId: participant.id },
  });

  return { ok: true, participantId: participant.id };
}

export async function getParticipantSession(token: string | undefined | null): Promise<ParticipantSession | null> {
  if (!token) {
    return null;
  }

  const repository = getEventAccessRepository();
  const tokenHash = hashSecret(token);
  const session = await repository.findSessionByTokenHash(tokenHash);

  if (!session) {
    return null;
  }

  const now = new Date().toISOString();
  if (Date.parse(session.expiresAt) <= Date.now() || Date.parse(session.absoluteExpiresAt) <= Date.now()) {
    await repository.deleteSession(session.instanceId, tokenHash);
    return null;
  }

  const refreshedSession: ParticipantSessionRecord = {
    ...session,
    lastValidatedAt: now,
  };

  await repository.upsertSession(session.instanceId, refreshedSession);

  return {
    instanceId: session.instanceId,
    expiresAt: refreshedSession.expiresAt,
    lastValidatedAt: refreshedSession.lastValidatedAt,
    absoluteExpiresAt: refreshedSession.absoluteExpiresAt,
    participantId: refreshedSession.participantId ?? null,
  };
}

/**
 * Expose the session's token hash alongside the validated session so the
 * identify endpoint can update the same row without re-parsing the cookie.
 */
export async function getParticipantSessionWithTokenHash(
  token: string | undefined | null,
): Promise<{ session: ParticipantSession; tokenHash: string } | null> {
  if (!token) return null;
  const session = await getParticipantSession(token);
  if (!session) return null;
  return { session, tokenHash: hashSecret(token) };
}

export async function getParticipantSessionFromCookieStore() {
  const cookieStore = await cookies();
  return getParticipantSession(cookieStore.get(participantSessionCookieName)?.value);
}

export async function revokeParticipantSession(token: string | undefined | null) {
  if (!token) {
    return;
  }

  const tokenHash = hashSecret(token);
  const repository = getEventAccessRepository();
  const session = await repository.findSessionByTokenHash(tokenHash);
  const instanceId = session?.instanceId ?? getCurrentWorkshopInstanceId();
  await repository.deleteSession(instanceId, tokenHash);
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

export async function getParticipantCoreBundle(instanceId?: string): Promise<ParticipantCoreBundle> {
  const state = await getWorkshopState(instanceId);

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
    liveMomentFingerprint: [
      state.liveMoment.agendaItemId ?? "",
      state.liveMoment.roomSceneId ?? "",
      state.liveMoment.participantMomentId ?? "",
      state.liveMoment.activePollId ?? "",
    ].join(":"),
  };
}

export async function getParticipantTeamLookup(instanceId?: string): Promise<ParticipantTeamLookup> {
  const state = await getWorkshopState(instanceId);

  return {
    items: state.teams.map((team) => ({
      id: team.id,
      name: team.name,
      city: team.city,
      members: team.members,
      repoUrl: team.repoUrl,
      checkIns: team.checkIns,
      projectBriefId: team.projectBriefId,
      anchor: team.anchor,
    })),
  };
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
