import { describe, expect, it } from "vitest";
import {
  computeNextHashLock,
  loadBriefs,
  parseBriefMarkdown,
} from "../../../scripts/content/generate-briefs-inventory";

const SAMPLE_EN = `# Sample Brief

## Problem

First paragraph.

Second paragraph explaining the stakes.

## User stories

- As a developer, I want X.
- As a reviewer, I want Y so that
  the handoff stays clean.
- As the next team, I want Z.

## Architecture notes

- Keep the data model small.
- Document the runbook.

## Done when

- The tool runs end to end.
- Another team can continue.

## First step for the agent

First write the data model, then propose implementation.
`;

const SAMPLE_CS = `# Sample Brief

## Problém

První odstavec.

Druhý odstavec.

## User stories

- Jako vývojář chci X.
- Jako reviewer chci Y aby
  handoff byl čistý.
- Jako další tým chci Z.

## Architektonické poznámky

- Udržujte datový model malý.
- Zdokumentujte runbook.

## Hotovo když

- Nástroj funguje end to end.
- Další tým může pokračovat.

## První krok pro agenta

Nejdřív napiš datový model, pak navrhni implementaci.
`;

describe("parseBriefMarkdown", () => {
  it("extracts every section of an English brief", () => {
    const parsed = parseBriefMarkdown(SAMPLE_EN, "en");
    expect(parsed.title).toBe("Sample Brief");
    expect(parsed.problem).toBe("First paragraph.\n\nSecond paragraph explaining the stakes.");
    expect(parsed.userStories).toEqual([
      "As a developer, I want X.",
      "As a reviewer, I want Y so that\n  the handoff stays clean.",
      "As the next team, I want Z.",
    ]);
    expect(parsed.architectureNotes).toEqual([
      "Keep the data model small.",
      "Document the runbook.",
    ]);
    expect(parsed.acceptanceCriteria).toEqual([
      "The tool runs end to end.",
      "Another team can continue.",
    ]);
    expect(parsed.firstAgentPrompt).toBe(
      "First write the data model, then propose implementation.",
    );
  });

  it("extracts every section of a Czech brief", () => {
    const parsed = parseBriefMarkdown(SAMPLE_CS, "cs");
    expect(parsed.title).toBe("Sample Brief");
    expect(parsed.problem).toBe("První odstavec.\n\nDruhý odstavec.");
    expect(parsed.userStories).toHaveLength(3);
    expect(parsed.architectureNotes).toHaveLength(2);
    expect(parsed.acceptanceCriteria).toHaveLength(2);
    expect(parsed.firstAgentPrompt).toBe(
      "Nejdřív napiš datový model, pak navrhni implementaci.",
    );
  });

  it("is deterministic for the same input", () => {
    const a = parseBriefMarkdown(SAMPLE_EN, "en");
    const b = parseBriefMarkdown(SAMPLE_EN, "en");
    expect(a).toEqual(b);
  });
});

describe("loadBriefs", () => {
  it("loads every brief from the canonical source with bilingual content", () => {
    const briefs = loadBriefs();
    const ids = briefs.map((brief) => brief.id).sort();
    expect(ids).toEqual([
      "code-review-helper",
      "devtoolbox-cli",
      "doc-generator",
      "metrics-dashboard",
      "standup-bot",
    ]);
    for (const brief of briefs) {
      expect(brief.en.title).not.toBe("");
      expect(brief.en.problem).not.toBe("");
      expect(brief.en.userStories.length).toBeGreaterThanOrEqual(3);
      expect(brief.en.architectureNotes.length).toBeGreaterThanOrEqual(3);
      expect(brief.en.acceptanceCriteria.length).toBeGreaterThanOrEqual(3);
      expect(brief.en.firstAgentPrompt).not.toBe("");
      expect(brief.cs.title).not.toBe("");
      expect(brief.cs.problem).not.toBe("");
    }
  });
});

describe("computeNextHashLock", () => {
  it("marks new briefs as cs_reviewed when Czech source exists", () => {
    const next = computeNextHashLock({});
    for (const [id, entry] of Object.entries(next)) {
      expect(entry.en).toMatch(/^[0-9a-f]{40}$/);
      expect(entry.cs).toMatch(/^[0-9a-f]{40}$/);
      expect(entry.cs_reviewed, `${id} cs_reviewed`).toBe(true);
    }
  });

  it("flips cs_reviewed to false when the English hash drifts from the locked Czech", () => {
    const baseline = computeNextHashLock({});
    const firstId = Object.keys(baseline)[0];
    const tampered = {
      ...baseline,
      [firstId]: { ...baseline[firstId], en: "0".repeat(40) },
    };
    const next = computeNextHashLock(tampered);
    expect(next[firstId].cs_reviewed).toBe(false);
  });

  it("keeps cs_reviewed stable when both hashes still match the lock", () => {
    const baseline = computeNextHashLock({});
    const next = computeNextHashLock(baseline);
    for (const id of Object.keys(baseline)) {
      expect(next[id].cs_reviewed).toBe(baseline[id].cs_reviewed);
    }
  });
});
