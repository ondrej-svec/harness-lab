import { describe, expect, it } from "vitest";

import agendaCsParticipant from "./generated/agenda-cs-participant.json";
import agendaEnParticipant from "./generated/agenda-en-participant.json";

/**
 * Voice-rule guard for the participant-mode agenda JSONs.
 * Phase 5.8 of docs/plans/2026-04-21-feat-optional-team-mode-plan.md.
 *
 * When a workshop instance has `team_mode_enabled = false` the loader
 * serves `agenda-cs-participant.json` / `agenda-en-participant.json`.
 * Teams do not exist on that surface — neither the admin rendering of
 * the agenda nor the participant room should leak team vocabulary or
 * the rescue motif.
 *
 * Rules enforced (see memory/feedback_participant_copy_voice.md):
 *   - Rule 1: no rescue/survives motif (přežije / záchrana / survives
 *     / rescue) in participant-facing copy.
 *   - Rule 2b: no team-mode vocabulary (tým* / parťák* / team* /
 *     teammate* / your team) in participant-mode copy — triad is
 *     "další účastník, člověk nebo agent" / "another participant,
 *     teammate, or agent" (the `teammate` in that phrase is the only
 *     allowed use, and we reject `teammate` blanketly here; the pair
 *     phrase `a teammate or an agent` is allowed by being added to
 *     source overrides as a compound string the guard can allowlist
 *     if/when needed).
 *
 * If this test fails: the offending string lives in
 * `workshop-content/agenda.json` inside a surviving (non-`kind:"team"`)
 * phase. Either update the canonical text there or add a
 * `participantVariant` override on the relevant content object so the
 * participant-mode regeneration emits a clean string.
 */

const CS_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "tým / týmy / týmu / týmová", pattern: /\btým\w*\b/iu },
  { label: "parťák / parťáci / parťákovi", pattern: /\bparťák\w*\b/iu },
  { label: "přežije / přežít / přežívá", pattern: /\bpřežij\w*\b/iu },
  { label: "záchrana / záchrany / bez záchrany", pattern: /\bzáchran\w*\b/iu },
];

const EN_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "team / teams / team's", pattern: /\bteam('?s)?\b/iu },
  { label: "teammate / teammates", pattern: /\bteammate(s)?\b/iu },
  { label: "your team", pattern: /\byour team\b/iu },
  { label: "survives / surviving / survived", pattern: /\bsurviv\w*\b/iu },
  { label: "rescue / rescued / rescuer", pattern: /\brescue\w*\b/iu },
];

function collectStrings(
  value: unknown,
  path: string,
  out: Array<{ path: string; text: string }>,
): void {
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

function describeAgenda(
  label: string,
  agenda: unknown,
  patterns: Array<{ label: string; pattern: RegExp }>,
) {
  describe(`participant-mode agenda voice rules — ${label}`, () => {
    const strings: Array<{ path: string; text: string }> = [];
    collectStrings(agenda, label, strings);

    it("collects a reasonable number of strings (sanity check)", () => {
      expect(strings.length).toBeGreaterThan(100);
    });

    for (const { label: forbiddenLabel, pattern } of patterns) {
      it(`must not contain ${forbiddenLabel}`, () => {
        const hits = strings.filter(({ text }) => pattern.test(text));
        if (hits.length > 0) {
          const detail = hits
            .slice(0, 15)
            .map((h) => `  ${h.path}: ${JSON.stringify(h.text)}`)
            .join("\n");
          const more = hits.length > 15 ? `\n  …and ${hits.length - 15} more` : "";
          throw new Error(
            `Found forbidden "${forbiddenLabel}" in ${label} (${hits.length} hit${hits.length === 1 ? "" : "s"}):\n${detail}${more}`,
          );
        }
      });
    }
  });
}

describeAgenda("agenda-cs-participant.json", agendaCsParticipant, CS_PATTERNS);
describeAgenda("agenda-en-participant.json", agendaEnParticipant, EN_PATTERNS);
