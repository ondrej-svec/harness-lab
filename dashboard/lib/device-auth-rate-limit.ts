import { createHash } from "node:crypto";

/**
 * In-memory rate limiter for the device-flow auth endpoints.
 *
 * Device-flow start + poll are not behind the BotId/redeem path, so
 * we need a cheap backstop to throttle scripted abuse without adding
 * a new DB table. The 5-failures-per-10-minutes budget mirrors the
 * participant redeem rate limit (`redeem-rate-limit.ts`), tuned for
 * a facilitator-scale flow that legitimately sees 1-2 device-auth
 * requests per hour.
 *
 * In-memory counters reset on function cold start. At workshop scale
 * this is a non-issue — the distributed rate-limit store discussion
 * lives in the Phase 6 non-goals (no Redis).
 */

const windowMs = 10 * 60 * 1000;
const failureLimit = 5;

type Entry = {
  failures: number;
  firstFailureAt: number;
};

const failureCounter = new Map<string, Entry>();

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function getDeviceAuthFingerprint(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent") ?? "unknown-agent";
  const acceptLanguage = request.headers.get("accept-language") ?? "unknown-language";
  return hashValue(forwardedFor || `${userAgent}:${acceptLanguage}`);
}

export function isDeviceAuthRateLimited(fingerprint: string): boolean {
  const entry = failureCounter.get(fingerprint);
  if (!entry) return false;
  if (Date.now() - entry.firstFailureAt > windowMs) {
    failureCounter.delete(fingerprint);
    return false;
  }
  return entry.failures >= failureLimit;
}

export function recordDeviceAuthFailure(fingerprint: string): void {
  const existing = failureCounter.get(fingerprint);
  if (!existing || Date.now() - existing.firstFailureAt > windowMs) {
    failureCounter.set(fingerprint, { failures: 1, firstFailureAt: Date.now() });
    return;
  }
  existing.failures += 1;
}

export function resetDeviceAuthRateLimitForTests(): void {
  failureCounter.clear();
}
