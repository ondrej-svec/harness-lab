import { describe, expect, it } from "vitest";
import { getDefaultFeedbackTemplate } from "./workshop-data";

/**
 * Voice-rule guard for the default post-workshop feedback template.
 * Phase 6.8 of docs/plans/2026-04-21-feat-post-workshop-feedback-plan.md.
 *
 * Every participant-facing string in the default template must not
 * contain:
 *   - team vocabulary (tým / parťák / team / teammate / your team) —
 *     the participant surface is team-mode-aware everywhere else, but
 *     this template ships one default that participant-mode instances
 *     also use, so team words are always wrong here.
 *   - rescue/survives motif (přežije / záchrana / survives / rescue) —
 *     Rule 1 from feedback_participant_copy_voice.md.
 *
 * If this test fails: the string is in the default template and needs
 * rewriting before merge. Per-instance overrides (feedback_form JSONB)
 * are not checked here — that's on the facilitator who set the
 * override.
 */

const FORBIDDEN_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "tým / týmy / týmu", pattern: /\btým\w*\b/iu },
  { label: "parťák / parťáci / parťákovi", pattern: /\bparťák\w*\b/iu },
  { label: "team / teams / team's", pattern: /\bteam('?s)?\b/iu },
  { label: "teammate / teammates", pattern: /\bteammate(s)?\b/iu },
  { label: "your team", pattern: /\byour team\b/iu },
  { label: "přežije / přežít", pattern: /\bpřežij\w*\b/iu },
  { label: "záchrana / záchrany / bez záchrany", pattern: /\bzáchran\w*\b/iu },
  { label: "survives / survive", pattern: /\bsurviv\w*\b/iu },
  { label: "rescue / rescued", pattern: /\brescue\w*\b/iu },
];

function collectStrings(value: unknown, path: string, out: Array<{ path: string; text: string }>): void {
  if (value === null || value === undefined) return;
  if (typeof value === "string") {
    out.push({ path, text: value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStrings(item, `${path}[${index}]`, out));
    return;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      collectStrings(child, path ? `${path}.${key}` : key, out);
    }
  }
}

describe("default feedback template — voice rules", () => {
  const template = getDefaultFeedbackTemplate();
  const strings: Array<{ path: string; text: string }> = [];
  collectStrings(template, "template", strings);

  it("collects a reasonable number of strings (sanity check)", () => {
    // 9 questions × at least prompt + anchors/options/placeholder with cs + en.
    // If this suddenly drops to 0, the traversal broke and the test below
    // would pass vacuously.
    expect(strings.length).toBeGreaterThan(20);
  });

  for (const { label, pattern } of FORBIDDEN_PATTERNS) {
    it(`default template must not contain ${label}`, () => {
      const hits = strings.filter(({ text }) => pattern.test(text));
      if (hits.length > 0) {
        const detail = hits.map((h) => `  ${h.path}: ${JSON.stringify(h.text)}`).join("\n");
        throw new Error(
          `Found forbidden "${label}" in default feedback template:\n${detail}`,
        );
      }
    });
  }
});
