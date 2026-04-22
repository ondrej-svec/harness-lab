import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearResetCodeStoreForTests,
  consumeResetCode,
  generateResetCode,
  issueResetCode,
} from "./participant-reset-codes";

beforeEach(() => {
  clearResetCodeStoreForTests();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("generateResetCode", () => {
  it("produces a 3-word hyphenated code", () => {
    const code = generateResetCode();
    expect(code.split("-")).toHaveLength(3);
    // Each segment is a word followed by a single digit.
    expect(code).toMatch(/^[a-z]+[1-9]-[a-z]+[1-9]-[a-z]+[1-9]$/);
  });
});

describe("issueResetCode + consumeResetCode", () => {
  it("issues a code and consumes it once", () => {
    const issued = issueResetCode({
      participantId: "p-1",
      instanceId: "i-1",
      neonUserId: "u-1",
    });
    expect(issued.code).toMatch(/^[a-z]+[1-9]-[a-z]+[1-9]-[a-z]+[1-9]$/);

    const result = consumeResetCode(issued.code);
    expect(result).toEqual({
      ok: true,
      participantId: "p-1",
      instanceId: "i-1",
      neonUserId: "u-1",
    });
  });

  it("refuses a second consume of the same code (single-use)", () => {
    const issued = issueResetCode({
      participantId: "p-1",
      instanceId: "i-1",
      neonUserId: "u-1",
    });
    expect(consumeResetCode(issued.code).ok).toBe(true);
    expect(consumeResetCode(issued.code)).toEqual({ ok: false, reason: "unknown" });
  });

  it("returns unknown for a code that was never issued", () => {
    expect(consumeResetCode("never-issued-code")).toEqual({ ok: false, reason: "unknown" });
  });

  it("normalizes whitespace and case on lookup", () => {
    const issued = issueResetCode({
      participantId: "p-1",
      instanceId: "i-1",
      neonUserId: "u-1",
    });
    // Facilitator reads aloud, participant types. Be forgiving about case/whitespace.
    const result = consumeResetCode(`  ${issued.code.toUpperCase()}  `);
    expect(result.ok).toBe(true);
  });

  it("expires the code after 15 minutes", () => {
    vi.useFakeTimers();
    const issued = issueResetCode({
      participantId: "p-1",
      instanceId: "i-1",
      neonUserId: "u-1",
    });
    vi.advanceTimersByTime(15 * 60 * 1000 + 1);
    expect(consumeResetCode(issued.code)).toEqual({ ok: false, reason: "expired" });
  });

  it("invalidates prior codes when a new code is issued for the same participant+instance", () => {
    const first = issueResetCode({
      participantId: "p-1",
      instanceId: "i-1",
      neonUserId: "u-1",
    });
    const second = issueResetCode({
      participantId: "p-1",
      instanceId: "i-1",
      neonUserId: "u-1",
    });
    expect(consumeResetCode(first.code)).toEqual({ ok: false, reason: "unknown" });
    expect(consumeResetCode(second.code).ok).toBe(true);
  });

  it("does not invalidate codes across different participants or instances", () => {
    const a = issueResetCode({ participantId: "p-1", instanceId: "i-1", neonUserId: "u-1" });
    const b = issueResetCode({ participantId: "p-2", instanceId: "i-1", neonUserId: "u-2" });
    const c = issueResetCode({ participantId: "p-1", instanceId: "i-2", neonUserId: "u-3" });
    expect(consumeResetCode(a.code).ok).toBe(true);
    expect(consumeResetCode(b.code).ok).toBe(true);
    expect(consumeResetCode(c.code).ok).toBe(true);
  });
});
