import { describe, expect, it } from "vitest";
import { parseWorkshopInstanceParticipantCopyBody } from "./workshop-instance-api";

describe("parseWorkshopInstanceParticipantCopyBody", () => {
  it("rejects non-object bodies", () => {
    expect(parseWorkshopInstanceParticipantCopyBody(null).ok).toBe(false);
    expect(parseWorkshopInstanceParticipantCopyBody("oops").ok).toBe(false);
    expect(parseWorkshopInstanceParticipantCopyBody([]).ok).toBe(false);
  });

  it("rejects bodies without participantCopy key", () => {
    const result = parseWorkshopInstanceParticipantCopyBody({});
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/participantCopy key is required/);
  });

  it("accepts null to clear the override", () => {
    expect(parseWorkshopInstanceParticipantCopyBody({ participantCopy: null })).toEqual({
      ok: true,
      value: { participantCopy: null },
    });
  });

  it("accepts a full postWorkshop override", () => {
    const result = parseWorkshopInstanceParticipantCopyBody({
      participantCopy: {
        postWorkshop: {
          title: "Brno, we're done.",
          body: "Thanks for spending the day with us.",
          feedbackBody: "Tell us what landed.",
          referenceBody: "Everything from today stays here.",
        },
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.participantCopy?.postWorkshop?.title).toBe("Brno, we're done.");
    }
  });

  it("accepts a partial postWorkshop override (missing keys fall through to defaults)", () => {
    const result = parseWorkshopInstanceParticipantCopyBody({
      participantCopy: { postWorkshop: { title: "Just the title" } },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.participantCopy?.postWorkshop).toEqual({ title: "Just the title" });
    }
  });

  it("rejects unknown top-level sections", () => {
    const result = parseWorkshopInstanceParticipantCopyBody({
      participantCopy: { live: { contextNote: "hi" } },
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/participantCopy\.live is not an overridable section/);
  });

  it("rejects unknown postWorkshop keys (typo guard)", () => {
    const result = parseWorkshopInstanceParticipantCopyBody({
      participantCopy: { postWorkshop: { titlee: "oops" } },
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/postWorkshop\.titlee is not an overridable key/);
  });

  it("rejects non-string values", () => {
    const result = parseWorkshopInstanceParticipantCopyBody({
      participantCopy: { postWorkshop: { title: 42 } },
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/must be a string/);
  });

  it("empty-string values are treated as omitted (collapses to null when nothing left)", () => {
    const result = parseWorkshopInstanceParticipantCopyBody({
      participantCopy: { postWorkshop: { title: "   " } },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.participantCopy).toBeNull();
    }
  });

  it("trims whitespace but preserves the rest", () => {
    const result = parseWorkshopInstanceParticipantCopyBody({
      participantCopy: { postWorkshop: { title: "  Hi  " } },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.participantCopy?.postWorkshop?.title).toBe("Hi");
    }
  });

  it("empty object collapses to null", () => {
    const result = parseWorkshopInstanceParticipantCopyBody({ participantCopy: {} });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.participantCopy).toBeNull();
    }
  });
});
