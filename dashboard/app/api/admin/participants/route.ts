import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getParticipantRepository } from "@/lib/participant-repository";
import { getTeamMemberRepository } from "@/lib/team-member-repository";
import { parseParticipantPaste, type ParseError } from "@/lib/participant-paste-parser";
import type { ParticipantRecord } from "@/lib/runtime-contracts";

/**
 * GET /api/admin/participants?instanceId=...
 *
 * Lists the participant pool + current team assignments for the given
 * instance. Used by the facilitator "People" section to render pool +
 * teams with a single round trip.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const instanceId = url.searchParams.get("instanceId")?.trim();
  if (!instanceId) {
    return NextResponse.json({ ok: false, error: "instanceId query parameter is required" }, { status: 400 });
  }

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) return denied;

  const participants = await getParticipantRepository().listParticipants(instanceId);
  const members = await getTeamMemberRepository().listMembers(instanceId);

  return NextResponse.json({
    ok: true,
    pool: participants.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      email: p.email,
      emailOptIn: p.emailOptIn,
      tag: p.tag,
      archivedAt: p.archivedAt,
    })),
    assignments: members.map((m) => ({ teamId: m.teamId, participantId: m.participantId })),
  });
}

/**
 * POST /api/admin/participants
 *
 * Paste-list intake. Accepts either raw paste text (parsed server-side)
 * or an already-parsed `entries` array. Returns per-entry created/skipped
 * arrays so the UI can surface inline feedback beside each preview row.
 *
 * Body (JSON):
 *   { instanceId, rawText } — server parses with parseParticipantPaste
 *   { instanceId, entries: [{ displayName, email?, tag? }, ...] }
 *
 * Reasons a row is skipped: `duplicate` (exists in pool, case-insensitive),
 * `invalid_email`, `missing_display_name`, `header_skipped`, `duplicate_in_input`.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    instanceId?: string;
    rawText?: string;
    entries?: Array<{ displayName?: string; email?: string | null; tag?: string | null }>;
  };
  const instanceId = body.instanceId?.trim();
  if (!instanceId) {
    return NextResponse.json({ ok: false, error: "instanceId is required" }, { status: 400 });
  }

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) return denied;

  const parserErrors: ParseError[] = [];
  let entries: Array<{ displayName: string; email: string | null; tag: string | null }> = [];

  if (typeof body.rawText === "string") {
    const parsed = parseParticipantPaste(body.rawText);
    entries = parsed.entries;
    parserErrors.push(...parsed.skipped);
  } else if (Array.isArray(body.entries)) {
    entries = body.entries
      .filter(
        (e): e is { displayName: string; email?: string | null; tag?: string | null } =>
          typeof e.displayName === "string" && e.displayName.trim().length > 0,
      )
      .map((e) => ({
        displayName: e.displayName.trim(),
        email: e.email?.trim() || null,
        tag: e.tag?.trim() || null,
      }));
  } else {
    return NextResponse.json(
      { ok: false, error: "rawText or entries is required" },
      { status: 400 },
    );
  }

  if (entries.length === 0 && parserErrors.length === 0) {
    return NextResponse.json({ ok: false, error: "no entries parsed" }, { status: 400 });
  }

  const repository = getParticipantRepository();
  const now = new Date().toISOString();
  const created: ParticipantRecord[] = [];
  const skipped: Array<{ input: { displayName: string }; reason: string }> = [];

  for (const entry of entries) {
    const existing = await repository.findParticipantByDisplayName(instanceId, entry.displayName);
    if (existing) {
      skipped.push({ input: { displayName: entry.displayName }, reason: "duplicate" });
      continue;
    }

    const participant: ParticipantRecord = {
      id: `p-${randomUUID()}`,
      instanceId,
      displayName: entry.displayName,
      email: entry.email,
      emailOptIn: false, // always false on paste — consent is separate
      tag: entry.tag,
      neonUserId: null,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
    await repository.upsertParticipant(instanceId, participant);
    created.push(participant);
  }

  for (const err of parserErrors) {
    skipped.push({ input: { displayName: err.raw }, reason: err.reason });
  }

  return NextResponse.json({
    ok: true,
    created: created.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      email: p.email,
      emailOptIn: p.emailOptIn,
      tag: p.tag,
    })),
    skipped,
  });
}
