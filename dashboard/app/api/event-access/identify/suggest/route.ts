import { NextResponse } from "next/server";
import {
  getParticipantSessionWithTokenHash,
  participantSessionCookieName,
} from "@/lib/event-access";
import { computeDisambiguators } from "@/lib/participant-disambiguator";
import { getParticipantRepository } from "@/lib/participant-repository";
import { checkSuggestRateLimit } from "@/lib/suggest-rate-limit";

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 5;

/**
 * GET /api/event-access/identify/suggest?q=<prefix>
 *
 * Return up to 5 roster participants whose display name contains `q`
 * (case-insensitive). Scoped to the session's instance. Rate-limited
 * per session token. Returns disambiguators only when the result set
 * has collisions; never ships raw email, tag (except as disambiguator),
 * or any other field beyond id + displayName + hasPassword + optional
 * disambiguator.
 */
export async function GET(request: Request) {
  // Read-only, session-guarded. No origin check — browsers omit Origin on
  // some same-origin GETs. Session cookie is the auth, rate limiter caps
  // scraping, and the response contains only identifiers the session is
  // already authorized to see.
  const rawCookie = request.headers.get("cookie") ?? "";
  const token = readCookieValue(rawCookie, participantSessionCookieName);
  const bundle = await getParticipantSessionWithTokenHash(token);
  if (!bundle) {
    return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
  }

  const rateCheck = checkSuggestRateLimit(bundle.tokenHash);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 },
    );
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ ok: true, matches: [] });
  }

  const repository = getParticipantRepository();
  const matches = await repository.listByDisplayNamePrefix(
    bundle.session.instanceId,
    q,
    MAX_RESULTS,
  );
  const disambiguators = computeDisambiguators(matches);

  return NextResponse.json({
    ok: true,
    matches: matches.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      hasPassword: p.neonUserId !== null,
      hasEmail: p.email !== null,
      disambiguator: disambiguators.get(p.id) ?? null,
    })),
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
