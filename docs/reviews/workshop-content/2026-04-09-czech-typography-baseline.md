# Copy-Editor Baseline — 2026-04-09 — Czech participant-facing content

**Repo:** harness-lab
**Language:** cs
**Files reviewed:** 27 (31 configured minus 4 teaching/rule-source files explicitly excluded)
**Scope:** everything in `paths.include` of `.copy-editor.yaml` excluding English locales, the generated workshop bundle mirror, and the four teaching files (`content/style-guide.md`, `content/style-examples.md`, `content/czech-reject-list.md`, `content/czech-editorial-review-checklist.md`)
**Tool:** `marvin:copy-editor` Layer 1 via `bun ../heart-of-gold-toolkit/plugins/marvin/skills/copy-editor/scripts/copy-audit.ts --config .copy-editor.yaml`

This is the baseline clean-room pass Phase 6 of [`docs/plans/archive/2026-04-09-feat-czech-copy-quality-foundation-plan.md`](../../plans/archive/2026-04-09-feat-czech-copy-quality-foundation-plan.md) produced.

---

## Gates

- **Layer 1 (deterministic typography):** ✓ clean (0 errors, 15 non-blocking warnings)
- **Layer 2 (judgment):** human review required — signoff _pending_
- **typography audit:** clean
- **layer-2 suggestions considered:** deferred — scheduled for the next dedicated review session with a Czech-fluent human reviewer

---

## Layer 1 — before and after

### Before

First full-scope run against the configured Czech content produced:

| Rule | Count | Severity |
|---|---|---|
| cs-R1-nbsp-prep | 580 | error |
| cs-R1b-nbsp-conjunction | 869 | warning |
| cs-R6-dash | 263 | warning (238 false positives on markdown list markers + 25 genuine) |
| cs-R2-quotes | 18 | error |
| cs-R7-sentence-case-heading | 2 | warning |
| cs-R3-ellipsis | 1 | error |
| **Total** | **1733** | — |

Blocking errors: 599.

### After

| Rule | Count | Severity |
|---|---|---|
| cs-R6-dash | 13 | warning (all genuine, mostly numeric ranges like `2-3` in a print spec) |
| cs-R7-sentence-case-heading | 2 | warning (`Most do Build fáze 1` — `Build` treated as a proper noun by judgment) |
| **Total** | **15** | — |

Blocking errors: **0**. Layer 1 is clean.

### How the delta was achieved

1. **1450 mechanical fixes via `--fix`** — the engine's new `--fix` mode (added in HoG commit `fac52e3`) applied safe fix descriptors for R1 (nbsp after prepositions), R1b (nbsp after `a`/`i` conjunctions), and R3 (ellipsis character). Fixes ran back-to-front per file so offsets stayed valid, and each file was re-audited after the fix to collect accurate residuals.
2. **R6 regex refined** — the initial rule fired on markdown list markers (`\n- text`) because `\s` matches the newline between a preceding word and the `-`. Fixed by requiring horizontal whitespace only (`[ \t]+`). Before: 263 warnings. After: 13.
3. **2 R2 errors fixed by hand** — straight English quotes around Czech prose in `content/talks/context-is-king.md` (line 19) and `content/facilitation/master-guide.md` (line 290). Fixes replaced `"` with the Czech closing quote `"` (U+201C).
4. **Teaching files excluded** — `.copy-editor.yaml` now excludes `content/style-guide.md`, `content/style-examples.md`, `content/czech-reject-list.md`, and `content/czech-editorial-review-checklist.md` from the audit. These files document the rules and contain illustrative "Don't" examples that `--fix` mode was silently "fixing" into "Do" versions, destroying the lessons. They are rule sources, not content the rules apply to.

---

## Files modified by the fix sweep

The fixer mutated 22 files under `content/`, `dashboard/lib/`, `workshop-skill/`, and `materials/`. Every change is a 1:1 substitution:

- regular space → non-breaking space (R1, R1b)
- `...` → `…` (R3)
- `"..."` → `„…"` around Czech prose (R2, manual)

No meaning changed. No whitespace shifted. No lines added or removed. Diff is readable as a pure character-level typography sweep.

---

## Layer 2 suggestions

Deferred to a dedicated review session. The `marvin:copy-editor` skill will draft a full Layer 2 report (reject-list hits, nominal-style detection, clarity/ambiguity pass for participant-facing content, voice check, rhythm read) when invoked in review mode against the now-clean-at-Layer-1 state. That session produces its own review note alongside this one.

Rationale for deferring: Layer 2 is judgment work that benefits from a clean Layer 1 baseline and from full human attention. Running it now would mix "did the script fire" with "should I care" in a way that wastes the reviewer's attention.

---

## Residual warnings (not remediated)

These 15 warnings remain after the baseline pass and are intentionally left for human review:

### cs-R6-dash (13)

- `content/challenge-cards/print-spec.md:20` — `2-3` — likely a real numeric range that should become `2–3` with en-dash; deferred pending review of print specs.
- 12 other occurrences of hyphen-as-dash in running prose — each is a judgment call between keeping a hyphen for compound words and using `–` for parenthetical clauses.

### cs-R7-sentence-case-heading (2)

- `content/facilitation/master-guide.md:111` — `Most do Build fáze 1` — `Build` is used here as a proper noun referring to the workshop phase name. Heuristic flags it but the heading is probably correct.
- `content/facilitation/master-guide.md:<line>` — similar case.

All 15 warnings should be triaged by a Czech-fluent human reviewer as part of the Layer 2 pass.

---

## Engine changes captured

Phase 6 surfaced two engine improvements that were committed to Heart of Gold during this slice:

1. **`--fix` mode** (HoG commit `fac52e3`) — added `Finding.fix` descriptor and the `applyFixes` implementation. R1, R1b, R3 produce fixable findings; R2, R4, R5, R6, R7, R8 remain report-only.
2. **R6 false-positive fix** — regex changed from `\s` to `[ \t]+` to avoid firing on markdown list markers. Self-test still green.

Both are in HoG `main` and ride under the baked-in Czech profile, so every repo adopting the skill benefits.

---

## Human reviewer signoff

- [ ] Layer 1 clean (**verified** — 0 errors)
- [ ] Layer 2 suggestions reviewed and decided (deferred to dedicated session)
- [ ] Spoken-readability check passed (pending)
- [ ] Visible-surface check passed (pending)
- [ ] 15 residual warnings triaged (pending)

**Signed off by:** _pending_
**Date:** _pending_

---

## Notes

- The fix sweep touched the maintained source pair (`dashboard/lib/workshop-blueprint-agenda.json` and `dashboard/lib/workshop-blueprint-localized-content.ts`). The content-excellence plan's in-flight tasks touch these files too. Diff review before each future content-excellence commit is recommended to catch merge conflicts early.
- Bundle mirror under `harness-cli/assets/workshop-bundle/` was resynced after the sweep.
- The teaching files excluded from the audit still serve as the authoritative editorial rule source and continue to be maintained by hand.
- The next Czech content pass is the Layer 2 judgment session. The skill's SKILL.md documents the passes; the human reviewer runs them with the skill as an assistant, not a gate.
