import { afterEach, describe, expect, it } from "vitest";
import {
  checkSuggestRateLimit,
  resetSuggestRateLimitForTests,
  suggestRateLimitConfig,
} from "./suggest-rate-limit";

describe("checkSuggestRateLimit", () => {
  afterEach(() => {
    resetSuggestRateLimitForTests();
  });

  it("allows the first call and decrements remaining", () => {
    const result = checkSuggestRateLimit("session-a", 0);
    expect(result).toEqual({ allowed: true, remaining: suggestRateLimitConfig.maxPerWindow - 1 });
  });

  it("allows up to maxPerWindow calls within one window, then denies", () => {
    const start = 1_000;
    for (let i = 0; i < suggestRateLimitConfig.maxPerWindow; i += 1) {
      const result = checkSuggestRateLimit("session-a", start + i);
      expect(result.allowed).toBe(true);
    }
    const overflow = checkSuggestRateLimit("session-a", start + suggestRateLimitConfig.maxPerWindow);
    expect(overflow).toEqual({ allowed: false, remaining: 0 });
  });

  it("opens a fresh bucket when the window has elapsed", () => {
    const start = 0;
    for (let i = 0; i < suggestRateLimitConfig.maxPerWindow; i += 1) {
      checkSuggestRateLimit("session-a", start + i);
    }
    expect(checkSuggestRateLimit("session-a", start + suggestRateLimitConfig.maxPerWindow).allowed).toBe(false);

    // Advance past the window — should reset.
    const result = checkSuggestRateLimit("session-a", start + suggestRateLimitConfig.windowMs + 10);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(suggestRateLimitConfig.maxPerWindow - 1);
  });

  it("isolates buckets per key", () => {
    for (let i = 0; i < suggestRateLimitConfig.maxPerWindow; i += 1) {
      checkSuggestRateLimit("session-a", i);
    }
    expect(checkSuggestRateLimit("session-a", suggestRateLimitConfig.maxPerWindow).allowed).toBe(false);
    expect(checkSuggestRateLimit("session-b", 0).allowed).toBe(true);
  });
});
