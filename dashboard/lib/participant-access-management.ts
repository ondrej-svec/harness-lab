import { randomInt, randomUUID } from "node:crypto";
import { getAuditLogRepository } from "./audit-log-repository";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import {
  getConfiguredSeedEventCode,
  getParticipantEventAccessRepository,
  hashEventCode,
  hashSecret,
  participantEventCodeValidityDays,
} from "./participant-event-access-repository";

export const participantEventCodePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type FacilitatorParticipantAccessState = {
  instanceId: string;
  active: boolean;
  version: number | null;
  codeId: string | null;
  expiresAt: string | null;
  currentCode: string | null;
  canRevealCurrent: boolean;
  source: "missing" | "sample" | "bootstrap" | "issued";
};

const participantCodeFirstWords = [
  "amber",
  "branch",
  "circuit",
  "ember",
  "harbor",
  "lantern",
  "matrix",
  "orbit",
  "relay",
  "signal",
  "sprint",
  "vector",
] as const;

const participantCodeSecondWords = [
  "agenda",
  "bridge",
  "canvas",
  "checkpoint",
  "context",
  "handoff",
  "moment",
  "repo",
  "review",
  "rotation",
  "runner",
  "trace",
] as const;

const participantCodeThirdWords = [
  "delta",
  "focus",
  "link",
  "north",
  "orbit",
  "room",
  "shift",
  "signal",
  "stack",
  "studio",
  "switch",
  "window",
] as const;

function buildDefaultParticipantAccessExpiry() {
  return new Date(Date.now() + participantEventCodeValidityDays * 24 * 60 * 60 * 1000).toISOString();
}

function generateParticipantEventCode() {
  return [
    `${participantCodeFirstWords[randomInt(participantCodeFirstWords.length)]}${randomInt(1, 10)}`,
    `${participantCodeSecondWords[randomInt(participantCodeSecondWords.length)]}${randomInt(1, 10)}`,
    `${participantCodeThirdWords[randomInt(participantCodeThirdWords.length)]}${randomInt(1, 10)}`,
  ].join("-");
}

export function normalizeParticipantEventCode(value: string) {
  return value.trim().toLowerCase();
}

export function validateParticipantEventCode(value: string) {
  const normalized = normalizeParticipantEventCode(value);

  if (!normalized) {
    return {
      ok: false as const,
      error: "participant event code is required",
    };
  }

  if (!participantEventCodePattern.test(normalized)) {
    return {
      ok: false as const,
      error: "participant event code must use lowercase letters, numbers, and hyphens only",
    };
  }

  return {
    ok: true as const,
    value: normalized,
  };
}

function resolveRecoverableCurrentCode(codeHash: string, sampleCode?: string | null) {
  if (sampleCode) {
    return {
      currentCode: sampleCode,
      source: "sample" as const,
    };
  }

  const configuredSeed = getConfiguredSeedEventCode();
  if (
    configuredSeed &&
    (hashEventCode(configuredSeed.code) === codeHash || hashSecret(configuredSeed.code) === codeHash)
  ) {
    return {
      currentCode: configuredSeed.code,
      source: configuredSeed.isSample ? ("sample" as const) : ("bootstrap" as const),
    };
  }

  return {
    currentCode: null,
    source: "issued" as const,
  };
}

export async function getFacilitatorParticipantAccessState(instanceId = getCurrentWorkshopInstanceId()): Promise<FacilitatorParticipantAccessState> {
  const access = await getParticipantEventAccessRepository().getActiveAccess(instanceId);
  if (!access) {
    return {
      instanceId,
      active: false,
      version: null,
      codeId: null,
      expiresAt: null,
      currentCode: null,
      canRevealCurrent: false,
      source: "missing",
    };
  }

  const recoverable = resolveRecoverableCurrentCode(access.codeHash, access.sampleCode);

  return {
    instanceId,
    active: true,
    version: access.version,
    codeId: access.codeHash.slice(0, 12),
    expiresAt: access.expiresAt,
    currentCode: recoverable.currentCode,
    canRevealCurrent: Boolean(recoverable.currentCode),
    source: recoverable.source,
  };
}

export async function issueParticipantEventAccess(
  options: {
    code?: string;
    expiresAt?: string;
    actorNeonUserId?: string | null;
  } = {},
  instanceId = getCurrentWorkshopInstanceId(),
) {
  const repository = getParticipantEventAccessRepository();
  const current = await repository.getActiveAccess(instanceId);
  const nextCode = options.code ? validateParticipantEventCode(options.code) : { ok: true as const, value: generateParticipantEventCode() };

  if (!nextCode.ok) {
    return nextCode;
  }

  const now = new Date().toISOString();
  if (current) {
    await repository.saveAccess(instanceId, {
      ...current,
      revokedAt: now,
    });
  }

  const nextAccess = {
    id: `pea-${randomUUID()}`,
    instanceId,
    version: (current?.version ?? 0) + 1,
    codeHash: hashEventCode(nextCode.value),
    expiresAt: options.expiresAt ?? buildDefaultParticipantAccessExpiry(),
    revokedAt: null,
    sampleCode: null,
  };

  await repository.saveAccess(instanceId, nextAccess);
  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "facilitator",
    action: "participant_event_access_issued",
    result: "success",
    createdAt: now,
    metadata: {
      actorNeonUserId: options.actorNeonUserId ?? null,
      version: nextAccess.version,
      codeId: nextAccess.codeHash.slice(0, 12),
      replacedExistingCode: Boolean(current),
      source: options.code ? "manual" : "generated",
    },
  });

  return {
    ok: true as const,
    issuedCode: nextCode.value,
    access: await getFacilitatorParticipantAccessState(instanceId),
  };
}
