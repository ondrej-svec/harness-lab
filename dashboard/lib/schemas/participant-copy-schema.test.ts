import { afterEach, describe, expect, it, vi } from "vitest";

import {
  parseParticipantCopy,
  ParticipantCopySchema,
} from "./participant-copy-schema";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ParticipantCopySchema", () => {
  it("parses an empty object", () => {
    expect(ParticipantCopySchema.safeParse({}).success).toBe(true);
  });

  it("parses a full postWorkshop override", () => {
    const copy = {
      postWorkshop: {
        title: "Díky!",
        body: "Tělo",
        feedbackBody: "Feedback tělo",
        referenceBody: "Reference tělo",
      },
    };
    expect(ParticipantCopySchema.safeParse(copy).success).toBe(true);
  });

  it("parses a partial postWorkshop override", () => {
    const copy = { postWorkshop: { title: "Díky!" } };
    expect(ParticipantCopySchema.safeParse(copy).success).toBe(true);
  });

  it("rejects non-string title", () => {
    const copy = { postWorkshop: { title: 123 } };
    expect(ParticipantCopySchema.safeParse(copy).success).toBe(false);
  });
});

describe("parseParticipantCopy", () => {
  it("returns null for null without alerting", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseParticipantCopy(null, { instanceId: "i-1" })).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it("emits a runtime alert on malformed input", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const bad = { postWorkshop: { title: 123 } };
    expect(parseParticipantCopy(bad, { instanceId: "i-1" })).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
  });
});
