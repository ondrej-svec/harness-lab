import { NextResponse } from "next/server";
import {
  getParticipantSessionWithTokenHash,
  participantSessionCookieName,
} from "@/lib/event-access";
import { getParticipantRepository } from "@/lib/participant-repository";

/**
 * GET /api/event-access/identify/selected?participantId=<id>
 *
 * Read-only confirmation helper for the set-password step. The
 * suggest endpoint stays minimal; after the participant explicitly
 * picks one roster row, the client may fetch that single row's stored
 * email so the password screen can confirm "yes, this is your
 * facilitator-entered address" without asking them to type it again.
 *
 * Returns a full email only for first-time password setup
 * (participant.email present and participant.neonUserId still null).
 * Returning participants authenticate by password only, so their email
 * stays out of this endpoint.
 */
export async function GET(request: Request) {
  const rawCookie = request.headers.get("cookie") ?? "";
  const token = readCookieValue(rawCookie, participantSessionCookieName);
  const bundle = await getParticipantSessionWithTokenHash(token);
  if (!bundle) {
    return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
  }

  const url = new URL(request.url);
  const participantId = (url.searchParams.get("participantId") ?? "").trim();
  if (!participantId) {
    return NextResponse.json({ ok: false, error: "missing_participant_id" }, { status: 400 });
  }

  const participant = await getParticipantRepository().findParticipant(
    bundle.session.instanceId,
    participantId,
  );
  if (!participant || participant.archivedAt !== null) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const emailDisplay =
    participant.neonUserId === null && participant.email !== null ? participant.email : null;

  return NextResponse.json({
    ok: true,
    participant: {
      id: participant.id,
      emailDisplay,
    },
  });
}

function readCookieValue(rawCookie: string, cookieName: string): string | null {
  if (!rawCookie) return null;
  const entry = rawCookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`));
  return entry ? decodeURIComponent(entry.slice(cookieName.length + 1)) : null;
}
