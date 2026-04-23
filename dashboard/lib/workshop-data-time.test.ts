import { describe, expect, it } from "vitest";

import { computeAgendaItemTime } from "./workshop-data";

type Phase = Parameters<typeof computeAgendaItemTime>[0][number];

function phase(id: string, overrides: Partial<Phase> = {}): Phase {
  return {
    id,
    order: 0,
    label: id,
    goal: id,
    ...overrides,
  } as Phase;
}

describe("computeAgendaItemTime", () => {
  it("derives wall-clock from cumulative durationMinutes + anchor", () => {
    const phases = [
      phase("p1", { durationMinutes: 30 }),
      phase("p2", { durationMinutes: 25 }),
      phase("p3", { durationMinutes: 40 }),
    ];
    expect(computeAgendaItemTime(phases, 0, "09:10")).toBe("09:10");
    expect(computeAgendaItemTime(phases, 1, "09:10")).toBe("09:40");
    expect(computeAgendaItemTime(phases, 2, "09:10")).toBe("10:05");
  });

  it("returns empty string when no anchor is provided", () => {
    const phases = [
      phase("p1", { durationMinutes: 30 }),
      phase("p2", { durationMinutes: 25 }),
    ];
    expect(computeAgendaItemTime(phases, 0)).toBe("");
    expect(computeAgendaItemTime(phases, 1)).toBe("");
  });

  it("returns empty string when a preceding durationMinutes is missing", () => {
    const phases = [
      phase("p1", { durationMinutes: 30 }),
      phase("p2"), // no duration
      phase("p3", { durationMinutes: 25 }),
    ];
    expect(computeAgendaItemTime(phases, 2, "09:00")).toBe("");
  });

  it("rolls over past midnight safely", () => {
    const phases = [
      phase("p1", { durationMinutes: 30 }),
      phase("p2", { durationMinutes: 60 }),
    ];
    expect(computeAgendaItemTime(phases, 1, "23:45")).toBe("00:15");
  });

  it("returns empty string when the phase index is out of range", () => {
    expect(computeAgendaItemTime([], 0, "09:00")).toBe("");
  });

  it("returns empty string when anchor is malformed", () => {
    const phases = [phase("p1", { durationMinutes: 30 })];
    expect(computeAgendaItemTime(phases, 0, "not-a-clock")).toBe("");
  });
});
