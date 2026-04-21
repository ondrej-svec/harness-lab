---
title: "Per-field `participantVariant` overrides + voice-guard test for mode-divergent content"
type: solution
date: 2026-04-21
domain: content
component: "bilingual agenda source, generator, voice-rule tests"
tags:
  - content-pipeline
  - bilingual
  - participant-mode
  - voice-rules
  - generator
  - vitest
symptoms:
  - "Participant-mode agenda JSONs carry ~250 `team` / `tým` / `parťák` references on surfaces where teams are invisible"
  - "No per-mode copy hook in the `BilingualAgenda` schema — both facilitator and participant variants share canonical text"
  - "Facilitator mode legitimately uses team vocabulary; stripping it from canonical copy would break team-mode workshops"
  - "Non-breaking space characters (U+00A0) in Czech source text cause `Edit` tool matches to fail silently against Read output"
root_cause: "The agenda generator filtered phases by `kind: \"team\"` in participant mode but had no mechanism to override per-string copy within the surviving phases. Canonical text served both modes, so team vocabulary leaked onto participant surfaces that couldn't show teams."
severity: medium
related:
  - "../../plans/2026-04-21-feat-optional-team-mode-plan.md"
  - "../../brainstorms/2026-04-21-optional-team-mode-brainstorm.md"
---

## Problem

Workshop instances can run with `team_mode_enabled = true` or `false`. The agenda generator already filtered `kind: "team"` phases out of the participant variant JSONs in commit `ebd6b13`, but every surviving phase still carried facilitator-mode copy verbatim — titles, bodies, scene labels, blocks, participant-moment prompts, phase goals, and the five project briefs were all saturated with `tým` / `team` / `your team` / `teammate` references. ~250 matches in the source, ~500 hits in the regenerated CS participant JSON.

The voice-rule memory file (`feedback_participant_copy_voice.md`) codifies two standing constraints for participant surfaces:
- **Rule 1** — no rescue/survives motif (`přežije`, `záchrana`, `survives`, `rescue`)
- **Rule 2b** — no team-mode vocabulary; participant-mode triad is `další účastník, člověk nebo agent` / `another participant, teammate, or agent`

Any simple string-level find-replace would break fidelity (`váš tým` → `váš účastník` reads wrong; `tým po týmu` → `účastník po účastníkovi` is semantically wrong in the facilitator recap scene that's actually about reading through check-ins one at a time).

## Solution

Per-field `participantVariant` overrides embedded on the bilingual content types.

### 1. Schema — optional override on each language content object

```ts
// dashboard/lib/types/bilingual-agenda.ts
export type BilingualSceneContent = {
  label: string;
  title: string;
  body: string;
  // ...
  participantVariant?: Partial<Omit<BilingualSceneContent, "participantVariant">>;
};
```

Same pattern on `BilingualPhaseContent`, `BilingualParticipantMomentContent`, and `BilingualProjectBrief`. The `Omit` prevents recursive nesting; `Partial` lets authors override only the fields that need to differ.

### 2. Generator — field-level picker at emit time

```ts
// scripts/content/generate-views.ts
function pickField<C extends { participantVariant?: Partial<C> }, K extends keyof C>(
  content: C, key: K, mode: AgendaMode,
): C[K] {
  if (mode === "participant" && content.participantVariant) {
    const override = content.participantVariant[key];
    if (override !== undefined) return override as C[K];
  }
  return content[key];
}
```

Every `generate*View` function threads `mode` and reads fields via `pickField(content, "body", mode)`. Fields without overrides fall through to canonical text; facilitator mode never touches the override branch.

### 3. Authoring — in-source overrides, not a separate file

Authors add `participantVariant` blocks directly inside `workshop-content/agenda.json` under the relevant `en` or `cs` content object. Override only the fields that must differ. Block arrays are replaced wholesale when any block inside them needs per-mode text — block-level granularity would be over-engineered for this use case.

### 4. Voice-rule guard — vitest test that walks the generated JSON

`dashboard/lib/workshop-data.agenda-voice.test.ts` imports `agenda-{cs,en}-participant.json`, walks every string, and fails on regex matches against forbidden patterns (tým*, parťák*, přežij*, záchran* for CS; team*, teammate*, your team, surviv*, rescue* for EN). Structural keys (`id`, `chromePreset`, `sceneType`, `kind`, `roomSceneIds`, etc.) are allow-listed so scene IDs like `opening-team-formation-room` don't flag as violations. Mirrors `workshop-data.feedback-voice.test.ts`; both guards run in the main test suite so CI blocks on regression.

## Prevention

- [x] Voice-rule guard test now runs in the default vitest suite
- [x] Plan doc marks Phase 5 shipped; future per-mode voice regressions fail tests before landing
- [x] Memory file `feedback_participant_copy_voice.md` status note updated
- [ ] If another content type gains mode-divergence needs (e.g. challenges), apply the same `participantVariant` shape rather than inventing a parallel mechanism
- [ ] If per-block granularity becomes necessary (not today), add `participantVariant` at the `PresenterBlock` level — same pattern, one level deeper

## Gotchas

### Non-breaking spaces in Czech source

`workshop-content/agenda.json` contains U+00A0 NO-BREAK SPACE bytes (`c2 a0`) inside Czech strings (between short words like prepositions and articles). The `Read` tool displays these as regular spaces but the `Edit` tool matches byte-exact. Copy-pasting Czech strings from `Read` output into `Edit`'s `old_string` parameter fails silently ("String to replace not found") because the NBSPs don't match regular spaces.

**Workarounds (ordered by ergonomics):**
1. For small edits: use short, NBSP-free substrings as the anchor.
2. For batch edits: use `JSON.parse` + structural mutation (the pattern here — a one-shot Bun script that loaded the JSON, injected `participantVariant` blocks by phase/scene/moment/brief id, and wrote back via `JSON.stringify(..., null, 2)`). `JSON.stringify` preserves NBSPs through the round-trip.
3. Never use `sed` with hand-typed regex on these files — byte-level matches are fragile across NBSPs.

### Override semantics are whole-value, not merge

`participantVariant.blocks` replaces the entire `blocks` array; it doesn't merge individual blocks by id. Same for any array or object. Authors must copy unchanged blocks verbatim into the override if the array contains both per-mode and shared blocks. Trade-off: simpler mechanism, slightly more duplication.

### CWD drift during long bash sessions

After `git commit` from repo root, subsequent `npx vitest` calls may leave the shell in `/dashboard` and later commands fail with module-resolution errors. Always prefix multi-directory chains with `cd /Users/ondrejsvec/projects/Bobo/harness-lab && ...` to be safe.

## Related

- `docs/plans/2026-04-21-feat-optional-team-mode-plan.md` — Phase 5 (copy sweep) is now complete
- `dashboard/lib/workshop-data.feedback-voice.test.ts` — sibling voice guard for the default post-workshop feedback template
- `~/.claude/projects/-Users-ondrejsvec-projects-Bobo-harness-lab/memory/feedback_participant_copy_voice.md` — standing voice rules
- Commit `c440c7c` — shipped the mechanism + 65 overrides + voice-rule guard
