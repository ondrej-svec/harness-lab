import { describe, expect, it, vi } from "vitest";

import { parseBlueprintBodyShape } from "./blueprint-schema";

describe("parseBlueprintBodyShape", () => {
  it("returns null for null input without alerting", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseBlueprintBodyShape(null, { blueprintId: "x" })).toBeNull();
    expect(parseBlueprintBodyShape(undefined, { blueprintId: "x" })).toBeNull();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("accepts a minimal well-shaped body", () => {
    const result = parseBlueprintBodyShape(
      { schemaVersion: 1, phases: [] },
      { blueprintId: "x" },
    );
    expect(result).not.toBeNull();
    expect(result?.schemaVersion).toBe(1);
  });

  it("tolerates unknown fields (loose) without alerting", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = parseBlueprintBodyShape(
      { schemaVersion: 1, phases: [], someFutureField: true },
      { blueprintId: "x" },
    );
    expect(result).not.toBeNull();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("returns null and emits an alert on structural drift", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = parseBlueprintBodyShape("not-an-object", {
      blueprintId: "x",
    });
    expect(result).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(warn.mock.calls[0][0] as string);
    expect(payload.signal).toBe("HARNESS_RUNTIME_ALERT");
    expect(payload.category).toBe("jsonb_parse_failure");
    expect(payload.metadata.column).toBe("blueprints.body");
    expect(payload.metadata.blueprintId).toBe("x");
    warn.mockRestore();
  });

  it("returns null and alerts when phases is the wrong container type", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = parseBlueprintBodyShape(
      { schemaVersion: 1, phases: "not-an-array" },
      { blueprintId: "x" },
    );
    expect(result).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
