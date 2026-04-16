import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { ParticipantRecord } from "./runtime-contracts";

export type RandomizeStrategy = "cross-level" | "random";

export type ProposedAssignment = { participantId: string; teamId: string };

export type TagDistribution = Record<string, Record<string, number>>;

export type RandomizePreview = {
  teamIds: string[];
  assignments: ProposedAssignment[];
  tagDistribution: TagDistribution;
};

/**
 * Distribute `participants` across `teamIds` using the chosen strategy.
 *
 * `cross-level`: group by tag, round-robin across teams with a rotating
 * offset per tag group so each team receives a mixed set of tags.
 * `random`: simple shuffle, round-robin.
 *
 * Deterministic given the same inputs so previews match commits when the
 * same commit-token is exchanged. Callers can pass `seed` to vary output;
 * defaults to the current timestamp so repeated previews reroll.
 */
export function computeRandomize(
  participants: ParticipantRecord[],
  teamIds: string[],
  strategy: RandomizeStrategy = "cross-level",
  seed?: number,
): RandomizePreview {
  if (teamIds.length === 0) {
    return { teamIds, assignments: [], tagDistribution: {} };
  }

  const rng = mulberry32(seed ?? Date.now());
  const pool = [...participants];

  if (strategy === "random") {
    shuffleInPlace(pool, rng);
    const assignments = pool.map<ProposedAssignment>((p, i) => ({
      participantId: p.id,
      teamId: teamIds[i % teamIds.length],
    }));
    return {
      teamIds,
      assignments,
      tagDistribution: computeDistribution(assignments, participants, teamIds),
    };
  }

  // cross-level: group, shuffle each group, round-robin with rotating start.
  const groups = new Map<string, ParticipantRecord[]>();
  for (const p of pool) {
    const key = (p.tag ?? "").trim() || "untagged";
    const group = groups.get(key) ?? [];
    group.push(p);
    groups.set(key, group);
  }

  // Shuffle each group for fairness; iterate groups in a stable order.
  const sortedKeys = [...groups.keys()].sort();
  for (const key of sortedKeys) {
    shuffleInPlace(groups.get(key)!, rng);
  }

  const assignments: ProposedAssignment[] = [];
  let groupOffset = 0;
  for (const key of sortedKeys) {
    const group = groups.get(key)!;
    for (let i = 0; i < group.length; i += 1) {
      const teamIndex = (i + groupOffset) % teamIds.length;
      assignments.push({ participantId: group[i].id, teamId: teamIds[teamIndex] });
    }
    groupOffset = (groupOffset + 1) % teamIds.length;
  }

  return {
    teamIds,
    assignments,
    tagDistribution: computeDistribution(assignments, participants, teamIds),
  };
}

function computeDistribution(
  assignments: ProposedAssignment[],
  participants: ParticipantRecord[],
  teamIds: string[],
): TagDistribution {
  const tagByParticipant = new Map(
    participants.map((p) => [p.id, (p.tag ?? "").trim() || "untagged"]),
  );
  const out: TagDistribution = {};
  for (const teamId of teamIds) {
    out[teamId] = {};
  }
  for (const a of assignments) {
    const tag = tagByParticipant.get(a.participantId) ?? "untagged";
    out[a.teamId][tag] = (out[a.teamId][tag] ?? 0) + 1;
  }
  return out;
}

/* ---------- HMAC-signed commit tokens ---------- */

const commitTokenTtlSeconds = 60;
const fallbackSecret = randomBytes(32).toString("hex");

function getCommitSecret(): string {
  return process.env.HARNESS_COMMIT_TOKEN_SECRET ?? fallbackSecret;
}

function base64Url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Buffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

type CommitPayload = {
  instanceId: string;
  assignments: ProposedAssignment[];
  exp: number; // unix seconds
};

export function issueCommitToken(
  instanceId: string,
  assignments: ProposedAssignment[],
): string {
  const payload: CommitPayload = {
    instanceId,
    assignments,
    exp: Math.floor(Date.now() / 1000) + commitTokenTtlSeconds,
  };
  const payloadB64 = base64Url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = base64Url(
    createHmac("sha256", getCommitSecret()).update(payloadB64).digest(),
  );
  return `${payloadB64}.${sig}`;
}

export function verifyCommitToken(
  token: string,
  instanceId: string,
): CommitPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  const expectedSig = base64Url(
    createHmac("sha256", getCommitSecret()).update(payloadB64).digest(),
  );
  const sigBuffer = Buffer.from(sig);
  const expectedBuffer = Buffer.from(expectedSig);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(payloadB64).toString("utf8")) as CommitPayload;
    if (payload.instanceId !== instanceId) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ---------- Helpers ---------- */

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/** mulberry32 — small deterministic 32-bit PRNG. Adequate for team-formation. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
