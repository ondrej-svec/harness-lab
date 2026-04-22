import { afterEach, describe, expect, it, vi } from "vitest";

import {
  parseWorkshopStateShape,
  WorkshopStateShapeSchema,
} from "./workshop-state-schema";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("WorkshopStateShapeSchema", () => {
  it("parses an empty object (every field optional)", () => {
    expect(WorkshopStateShapeSchema.safeParse({}).success).toBe(true);
  });

  it("parses a state missing rotation (2026-04-20 incident fixture)", () => {
    // The 2026-04-20 incident: older rows had no `rotation` field.
    // The shape guard tolerates this — field-level normalizer fills
    // in the default downstream.
    const state = {
      version: 1,
      workshopId: "legacy",
      agenda: [],
      liveMoment: {},
      teams: [],
    };
    expect(WorkshopStateShapeSchema.safeParse(state).success).toBe(true);
  });

  it("parses a state missing participantCheckIns (2026-04-21 fixture)", () => {
    // participantCheckIns was added post-2026-04-21. Rows written
    // earlier don't have the field. Shape guard tolerates.
    const state = {
      version: 1,
      workshopId: "legacy",
      agenda: [],
      liveMoment: {},
      teams: [],
      rotation: {},
    };
    expect(WorkshopStateShapeSchema.safeParse(state).success).toBe(true);
  });

  it("tolerates unknown top-level fields (forward-compat)", () => {
    const state = { version: 1, futureField: { anything: "here" } };
    const result = WorkshopStateShapeSchema.safeParse(state);
    expect(result.success).toBe(true);
    // Loose object: the extra field is preserved on the output.
    expect((result.data as Record<string, unknown>).futureField).toBeDefined();
  });

  it("rejects a state where agenda is a string (structural drift)", () => {
    const bad = { agenda: "should be array" };
    expect(WorkshopStateShapeSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a state where rotation is an array (structural drift)", () => {
    const bad = { rotation: [] };
    expect(WorkshopStateShapeSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a non-object top level (null is handled separately by the parser)", () => {
    expect(WorkshopStateShapeSchema.safeParse("not-an-object").success).toBe(false);
    expect(WorkshopStateShapeSchema.safeParse(42).success).toBe(false);
    expect(WorkshopStateShapeSchema.safeParse([]).success).toBe(false);
  });
});

describe("parseWorkshopStateShape", () => {
  it("returns null for null without alerting", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseWorkshopStateShape(null, { instanceId: "i-1" })).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it("returns parsed shape for valid input", () => {
    const state = { version: 1, agenda: [] };
    const parsed = parseWorkshopStateShape(state, { instanceId: "i-1" });
    expect(parsed).not.toBeNull();
    expect((parsed as { version?: number }).version).toBe(1);
  });

  it("emits a runtime alert and returns null on structural drift", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const bad = { agenda: "not-an-array" };
    expect(parseWorkshopStateShape(bad, { instanceId: "i-1" })).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    const line = warn.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(line);
    expect(parsed.category).toBe("jsonb_parse_failure");
    expect(parsed.metadata.column).toBe("workshop_state");
  });
});
