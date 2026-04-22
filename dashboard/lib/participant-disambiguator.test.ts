import { describe, expect, it } from "vitest";
import type { ParticipantRecord } from "./runtime-contracts";
import { computeDisambiguators, maskEmail } from "./participant-disambiguator";

function p(overrides: Partial<ParticipantRecord>): ParticipantRecord {
  return {
    id: "p-default",
    instanceId: "instance-a",
    displayName: "Default",
    email: null,
    emailOptIn: false,
    tag: null,
    neonUserId: null,
    createdAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    archivedAt: null,
    ...overrides,
  };
}

describe("maskEmail", () => {
  it("keeps enough of the local part to disambiguate same-domain matches", () => {
    expect(maskEmail("jan@acme.com")).toBe("ja...n@acme.com");
    expect(maskEmail("hello@studio.cz")).toBe("hel...lo@studio.cz");
    expect(maskEmail("ondra.novak@acme.com")).toBe("ondra...ovak@acme.com");
    expect(maskEmail("ondrej.novak@acme.com")).toBe("ondre...ovak@acme.com");
  });

  it("handles edge cases without leaking", () => {
    expect(maskEmail("@acme.com")).toBe("***");
    expect(maskEmail("no-at-sign")).toBe("***");
    expect(maskEmail("o@gmail.com")).toBe("o...@gmail.com");
  });
});

describe("computeDisambiguators", () => {
  it("returns null for unambiguous single-match groups", () => {
    const result = computeDisambiguators([p({ id: "p1", displayName: "Jan Novák", tag: "team bravo" })]);
    expect(result.get("p1")).toBeNull();
  });

  it("prefers tag when both colliding entries have one", () => {
    const result = computeDisambiguators([
      p({ id: "p1", displayName: "Jan", tag: "team bravo", email: "jan@acme.com" }),
      p({ id: "p2", displayName: "Jan", tag: "organizer", email: "jan@studio.cz" }),
    ]);
    expect(result.get("p1")).toEqual({ kind: "tag", value: "team bravo" });
    expect(result.get("p2")).toEqual({ kind: "tag", value: "organizer" });
  });

  it("uses masked email when tag is missing but email exists", () => {
    const result = computeDisambiguators([
      p({ id: "p1", displayName: "Jan", email: "jan@acme.com" }),
      p({ id: "p2", displayName: "Jan", email: "jan@studio.cz" }),
    ]);
    expect(result.get("p1")).toEqual({ kind: "masked_email", value: "ja...n@acme.com" });
    expect(result.get("p2")).toEqual({ kind: "masked_email", value: "ja...n@studio.cz" });
  });

  it("mixes tag and masked_email when only some entries have tags", () => {
    const result = computeDisambiguators([
      p({ id: "p1", displayName: "Jan", tag: "team bravo" }),
      p({ id: "p2", displayName: "Jan", email: "jan@acme.com" }),
    ]);
    expect(result.get("p1")).toEqual({ kind: "tag", value: "team bravo" });
    expect(result.get("p2")).toEqual({ kind: "masked_email", value: "ja...n@acme.com" });
  });

  it("falls back to id-suffix when neither tag nor email exists", () => {
    const result = computeDisambiguators([
      p({ id: "p-abc-7c3a", displayName: "Jan" }),
      p({ id: "p-xyz-f14d", displayName: "Jan" }),
    ]);
    expect(result.get("p-abc-7c3a")).toEqual({ kind: "order", value: "#7c3a" });
    expect(result.get("p-xyz-f14d")).toEqual({ kind: "order", value: "#f14d" });
  });

  it("is case-insensitive when grouping by display name", () => {
    const result = computeDisambiguators([
      p({ id: "p1", displayName: "Jan", tag: "team bravo" }),
      p({ id: "p2", displayName: "JAN", tag: "organizer" }),
    ]);
    expect(result.get("p1")).toEqual({ kind: "tag", value: "team bravo" });
    expect(result.get("p2")).toEqual({ kind: "tag", value: "organizer" });
  });

  it("treats same name with whitespace around tag as a disambiguator source", () => {
    const result = computeDisambiguators([
      p({ id: "p1", displayName: "Jan", tag: "  team bravo  " }),
      p({ id: "p2", displayName: "Jan", tag: "organizer" }),
    ]);
    expect(result.get("p1")).toEqual({ kind: "tag", value: "team bravo" });
  });
});
