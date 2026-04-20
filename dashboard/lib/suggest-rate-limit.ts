/**
 * In-memory sliding-window rate limiter for the identify suggest
 * endpoint. Workshop scale (≤100 concurrent sessions) means a Map-per-
 * process is plenty; production-grade would swap this for Redis.
 *
 * Keyed by session token hash — a per-participant throttle that mostly
 * caps runaway clients and hostile scrapers without blocking normal
 * typing. 20 calls / 60 seconds is generous for 250 ms debounce.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

export function checkSuggestRateLimit(key: string, now = Date.now()): { allowed: boolean; remaining: number } {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_PER_WINDOW - 1 };
  }

  if (bucket.count >= MAX_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: MAX_PER_WINDOW - bucket.count };
}

export function resetSuggestRateLimitForTests(): void {
  buckets.clear();
}

export const suggestRateLimitConfig = {
  windowMs: WINDOW_MS,
  maxPerWindow: MAX_PER_WINDOW,
};
