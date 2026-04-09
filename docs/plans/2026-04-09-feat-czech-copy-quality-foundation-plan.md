---
title: "feat: Czech copy quality foundation + copy-editor harness"
type: plan
date: 2026-04-09
status: in_progress
brainstorm: null
confidence: medium
repos:
  - harness-lab
  - heart-of-gold-toolkit
---

# Czech Copy Quality Foundation + Copy-Editor Harness Plan

Build the editorial system that makes participant-facing workshop content read as authored, not translated. Ship in two layers across two repos: a deterministic copy-audit engine and a harnessed copy-editor role in Heart of Gold, with repo-local Czech rules and style discipline in Harness Lab.

This plan sits **beneath** the active [`2026-04-09-feat-workshop-blueprint-content-excellence-and-readiness-plan.md`](./2026-04-09-feat-workshop-blueprint-content-excellence-and-readiness-plan.md). That plan applies the editorial standard to scenes. This plan strengthens the standard itself, adds a deterministic enforcement layer, and introduces a reusable copy-editor role available to Claude Code, Codex, OpenCode, and Pi via Heart of Gold's installer.

## Working Mode

- Work is split across two sibling repos: this repo (`harness-lab`) and `../heart-of-gold-toolkit` (sibling path `/Users/ondrejsvec/projects/bobo/heart-of-gold-toolkit`, separate GitHub repo).
- Land changes directly on `main` in both repos. No PR flow.
- Every meaningful slice gets a commit. Checkpoints are frequent enough that a revert target always exists.
- Heart of Gold has CI safety checks on push (`check:publish-safety`, `check:security`). Run the equivalents locally before each HoG commit.
- Cross-repo sequencing is load-bearing — some Harness Lab phases depend on Heart of Gold commits being in place. Phase headers name the owning repo.

## Problem Statement

The existing editorial system is better than average, but it has four structural gaps:

- **Voice-first, typography-last.** `content/style-guide.md` and `content/czech-editorial-review-checklist.md` cover tone and workshop register well, but say almost nothing about the mechanical Czech layer that most often betrays translated or AI-generated copy: non-breaking spaces after single-letter prepositions (`k`, `s`, `v`, `z`, `o`, `u`, `a`, `i`), Czech quotation marks (`„…"` vs `"…"`), en-dash vs hyphen, sentence-case headlines, lowercase days and months, number/unit spacing, ordinal formatting, the `…` character. A Czech reader clocks these within the first sentence.
- **No deterministic floor under the human gate.** The human Czech reviewer is load-bearing for both mechanical and judgment-based checks. Fatigue makes the mechanical layer the first thing to slip. There is no layer underneath the reviewer that catches the 80% of issues that are deterministic.
- **No living reject corpus.** The checklist names abstract anti-patterns ("korporátní omáčka", "AI slop") but has no enumerated list of the actual kalks, nominal-style constructions, and AI fingerprints a reviewer should grep for. Reviewers and AI helpers have nothing concrete to pattern-match against, and experience does not accumulate.
- **No reusable copy-editor harness.** There is no agent-agnostic, configurable copy-editor role that another repo could adopt. Every project ends up hand-rolling its own Czech review process, and there is no home for the judgment-layer tooling (reject-list detection, voice-doctrine checks, spoken-readability reads) that is shared across projects.

Secondary gap:

- **Style guide lacks code-switching rules and authoritative sources.** Gender assignment to English loanwords (`ten commit`, `to repo`), when verbified anglicisms are acceptable (`commitnout`, `mergovat`, `deployovat`), and links to canonical Czech references (ÚJČ Internetová jazyková příručka, Mozilla and Microsoft Czech localization guides) are missing.

If this lands only as style-guide expansion, the mechanical layer still drifts. If it lands only as an audit script in Harness Lab, the reusable harness gap stays open and Codex/OpenCode/Pi users get nothing. Both repos have to move together.

## Target End State

When this plan lands:

### Heart of Gold side

- `plugins/marvin/skills/copy-editor/` exists as a first-class skill with `SKILL.md`, a `scripts/` dir holding the audit engine, a `rules/` dir holding language profiles, and a `knowledge/` dir holding the role contracts (`ROLE.md` with loop, inputs, outputs, verification boundary).
- The engine is a TypeScript module runnable via Bun: `bun scripts/copy-audit.ts --config <path> --json`. It is language-agnostic with a rules registry; Czech ships as a first-class profile, English as a stub with documented extension points.
- The skill installs cleanly via the existing HoG installer to Codex, OpenCode, and Pi targets. Claude Code picks it up automatically via the marketplace plugin model.
- Safety checks (`check:publish-safety`, `check:security`, `check:compat`) pass on the HoG main branch after the skill lands.
- The skill has a self-test invocation (`bun scripts/copy-audit.ts --self-test`) that runs the rule set against fixture strings with known violations.

### Harness Lab side

- `content/czech-reject-list.md` exists as a living enumerated corpus of kalks, anglicisms, AI fingerprints, and nominal-style constructions with preferred alternatives and one-line Why notes.
- `content/style-guide.md` has new sections for typography, slovesné vs jmenné vyjadřování (verbal vs nominal style) as a named doctrine, code-switching rules for English loanwords, and a Zdroje a další čtení footer linking ÚJČ, Mozilla, and Microsoft Czech sources.
- `.copy-editor.yaml` exists at the repo root, pointing at the Czech profile from Heart of Gold plus repo-local style guide, reject list, examples, approved terms, and voice doctrine.
- `content/czech-editorial-review-checklist.md` opens with **Section 0: Typografický pass** referencing the copy-audit engine. Section 6.5 adds the optional reject-list pass.
- `docs/workshop-content-qa.md` lists the deterministic typography audit as a named blocking check, explicitly the only editorial gate scripted tooling is allowed to close. The human gate is unchanged.
- `AGENTS.md` Task Routing points agents at the reject list, `.copy-editor.yaml`, and the `copy-editor` skill invocation pattern. Build And Test includes a one-line invocation.
- A baseline clean-room pass has landed: `copy-editor` run against current Czech visible surfaces with all findings fixed and a review note recorded under `docs/reviews/workshop-content/`.
- The content-excellence plan's in-flight tasks continue against the new baseline without diff conflicts.

## Scope

**In scope:**

- New `copy-editor` skill in `heart-of-gold-toolkit/plugins/marvin/` with its deterministic engine, Czech rule profile, role definition, config schema, and self-tests.
- English language profile stub in Heart of Gold with documented extension points (no full English rule set yet).
- Style guide depth expansion and reject list in Harness Lab.
- Editorial checklist Section 0 and gate integration in Harness Lab.
- `.copy-editor.yaml` configuration in Harness Lab.
- Baseline clean-room pass on current Czech visible-surface content.
- Documentation updates in both repos.

**Out of scope:**

- Rewriting individual workshop scenes — owned by the content-excellence plan.
- Full English style guide authoring — English profile is a stub with extension points; a narrow English baseline is optional Phase 7.
- Translating workshop content at runtime.
- Expanding the scene/block model.
- Replacing the human Czech reviewer — the role's Layer 2 is explicitly non-blocking and produces suggestions only.
- Building additional HoG plugins or skills beyond `copy-editor`.
- Adding a `claude.ts` install target to HoG (marketplace model covers Claude already).

## Proposed Solution

Two layers, two repos, composable rules, agent-agnostic invocation.

### The architecture in one picture

```
┌──────────────────── Heart of Gold Toolkit ────────────────────┐
│                                                                │
│  plugins/marvin/skills/copy-editor/                            │
│    SKILL.md                  — role frontmatter + workflow     │
│    knowledge/                                                  │
│      ROLE.md                 — loop, contracts, verification   │
│      config-schema.md        — .copy-editor.yaml schema        │
│    scripts/                                                    │
│      copy-audit.ts           — deterministic engine (Layer 1)  │
│      self-test.ts            — fixture-based rule tests        │
│    rules/                                                      │
│      czech.ts                — Czech rule profile (R1–R8)      │
│      english.ts              — English stub                   │
│                                                                │
│  Installs to: Claude (marketplace) · Codex · OpenCode · Pi     │
└────────────────────────────────────────────────────────────────┘
                              │
                 consumes via skill invocation
                              │
┌─────────────────────── Harness Lab ────────────────────────────┐
│                                                                │
│  .copy-editor.yaml           — repo config (extends: czech)    │
│  content/                                                      │
│    style-guide.md            — expanded depth                  │
│    czech-reject-list.md      — living corpus                   │
│    style-examples.md         — before/after nominal → verbal   │
│    czech-editorial-review-checklist.md  — Section 0 added      │
│  docs/workshop-content-qa.md — deterministic gate item         │
│  docs/reviews/workshop-content/YYYY-MM-DD-czech-typography-    │
│    baseline.md               — first clean-room pass note      │
└────────────────────────────────────────────────────────────────┘
```

### Layer 1 — Deterministic copy-audit engine

Lives in Heart of Gold at `plugins/marvin/skills/copy-editor/scripts/copy-audit.ts`. Pure TypeScript, Bun-runnable. Rule profiles are data modules imported from `../rules/`.

Initial Czech rule set (R1–R8):
- **R1** Non-breaking space after single-letter preposition or conjunction: `k`, `s`, `v`, `z`, `o`, `u`, `a`, `i`
- **R2** Czech quotation marks (`„…"`) instead of English (`"…"`) in prose
- **R3** Ellipsis character `…` instead of three dots `...`
- **R4** Number and unit separated by a space (`50 Kč`, `99 %`)
- **R5** Ordinal numbers with period and following space (`1. dubna 2026`)
- **R6** En-dash `–` for ranges and parentheticals, hyphen `-` reserved for compounds
- **R7** Sentence-case H1/H2 headings in markdown (heuristic, not strict title-case)
- **R8** No English day/month names in Czech prose (`Monday`, `January`, etc.)

Engine behavior:
- Reads `.copy-editor.yaml` to resolve file scope, language, and rule overrides.
- Parses targets (Markdown, JSON, TypeScript template literals) and extracts reviewable Czech text, skipping code blocks, inline code, and configured exclude paths.
- Runs the loaded rule profile against each chunk.
- Emits structured JSON on `--json`, human-readable on default.
- Exits non-zero on R1–R8 violations.
- Supports ignore markers (`<!-- copy-editor: ignore -->` for one line or a block).
- Supports `--self-test` that runs fixture strings through each rule and asserts each rule fires on its known-bad case.

### Layer 2 — Copy-editor role (judgment)

Lives in Heart of Gold at `plugins/marvin/skills/copy-editor/SKILL.md` plus `knowledge/ROLE.md`. The SKILL.md is the agent-facing contract; ROLE.md is the deeper operating document the skill references.

The role's loop (encoded in SKILL.md):

1. **Load** — parse `.copy-editor.yaml`, read the HoG base language profile, read repo-local style guide, reject list, examples, approved terms, voice doctrine.
2. **Lint (Layer 1)** — invoke `copy-audit.ts` with the resolved config. Emit mechanical findings. `gate_1 = pass | fail`.
3. **Judge (Layer 2)** — for each file in scope, build a context pack (style guide + reject list + voice doctrine + Layer 1 findings for the file), then run judgment passes in order:
   - reject-list hit detection with proposed rewrites
   - nominal-style detection with verbal rewrites
   - voice/register check against injected doctrine
   - rhythm/spoken-readability read
   - each suggestion carries rationale and a source reference (which rule or guide it comes from)
4. **Report** — structured JSON findings combining Layer 1 + Layer 2, plus a markdown review note draft for `docs/reviews/`.
5. **Handoff** — exit non-zero if gate_1 failed. Exit zero with findings if only gate_2 has items. Suggest next action: "N mechanical fixes needed" or "M voice suggestions for review".

The role's `ROLE.md` contains the non-negotiable verification boundary clause:

> Layer 1 (deterministic) is the only layer the role may auto-close. Layer 2 (judgment) always produces suggestions, never verdicts. The role will not mark a file or scope as "copy-editor approved" at Layer 2. That seal belongs to a human reviewer, whose signoff is recorded in the review note the role drafts.

### Rule composition

Three sources compose at invocation time:

1. **HoG-baked language profile** (`plugins/marvin/skills/copy-editor/rules/czech.ts`) — typography rules, universal heuristics, canonical authority links. Czech ships fully; English is a stub.
2. **Repo-local rules** (pointed at by `.copy-editor.yaml`) — style guide, reject list, approved term list, examples, voice doctrine.
3. **Per-invocation overrides** — path scope, language, output dir, ignore markers from CLI flags.

### The `.copy-editor.yaml` contract

Example for Harness Lab:

```yaml
extends:
  - czech  # HoG base profile
language: cs
rules:
  style_guide: ./content/style-guide.md
  reject_list: ./content/czech-reject-list.md
  examples: ./content/style-examples.md
  approved_terms: ./content/style-examples.md#approved-english-terms
voice_doctrine: |
  Piš jako zkušený peer. Klidně, věcně, akčně.
  Žádný hype, žádný korporát, žádná škola.
  Krátké věty. Slovesa před podstatná jména.
paths:
  include:
    - dashboard/lib/workshop-blueprint-agenda.json
    - dashboard/lib/workshop-blueprint-localized-content.ts
    - content/**/*.md
    - workshop-skill/**/*.md
    - materials/**/*.md
  exclude:
    - "**/locales/en/**"
    - "**/*.test.*"
output:
  review_notes_dir: ./docs/reviews/workshop-content/
  structured_findings_dir: ./.copy-editor/findings/
ignore_marker: "copy-editor: ignore"
```

### Agent-agnostic invocation

The skill is discoverable and invokable from multiple entry points, all reducing to one underlying engine:

- **Shell-native**: `bun .../plugins/marvin/skills/copy-editor/scripts/copy-audit.ts --config .copy-editor.yaml --json`
- **Claude Code**: `/marvin:copy-editor` (via marketplace plugin model, no extra wiring)
- **Codex**: after `bunx @heart-of-gold/toolkit install marvin --to codex`, skill is installed at `~/.codex/skills/copy-editor/` and invocable via Codex's skill command syntax
- **OpenCode, Pi**: same installer pattern

The shell command is the portable contract. Agent skills are discoverability wrappers, never duplicated logic.

## Detailed Plan Level

This is a **detailed** plan because it spans two repos, introduces a new first-class skill in Heart of Gold, changes the shared editorial standard in Harness Lab, defines configuration and output contracts, and carries subjective quality risk around the Layer 2 judgment passes.

## Implementation Tasks

Phases name their owning repo in the heading. Cross-repo dependencies are called out explicitly.

### Phase 0 — Baseline, scope lock, cross-repo sequencing

**Repo:** both.

- [x] In `harness-lab`: re-read `content/style-guide.md`, `content/style-examples.md`, `content/czech-editorial-review-checklist.md`, `docs/workshop-content-qa.md` end-to-end to lock exact sections to extend.
- [x] In `harness-lab`: confirm the active [`content-excellence-and-readiness plan`](./2026-04-09-feat-workshop-blueprint-content-excellence-and-readiness-plan.md) tasks do not overlap this plan's tracks. Record the overlap-free set.
- [x] In `harness-lab`: run a throwaway manual sweep of `dashboard/lib/workshop-blueprint-agenda.json` for obvious typographic issues (nbsp, quotes, sentence case, ellipsis). Do not fix. Record counts in a scratch note. **Result:** 431 R1 (missing nbsp after `k`/`s`/`v`/`z`/`o`/`u`/`a`/`i`), 0 R3 (`...` ellipsis), 0 R4 (number/unit), 0 R5 (ordinal). R7 heuristic flagged 15 compound category labels but all were false positives (`Talk: Klíčová linka` — sentence case after a colon). Primary finding: nbsp violations dominate the mechanical gap.
- [ ] In `heart-of-gold-toolkit`: verify clean main branch, safety checks passing locally, `bunx @heart-of-gold/toolkit list` and `targets` commands working. _(deferred to Phase 2 entry)_
- [ ] In `heart-of-gold-toolkit`: confirm `plugins/marvin/skills/` layout and note any existing conventions by reading one neighboring skill (e.g. `quick-review`). _(deferred to Phase 2 entry; already verified via survey in plan authoring)_

Exit: both working trees are clean and the concrete surface of what is broken today is known. The content-excellence plan is confirmed orthogonal.

### Phase 1 — Harness Lab: reject list + style guide depth

**Repo:** harness-lab.

- [x] Create `content/czech-reject-list.md` with initial sections: Kalky z angličtiny, Nominální řetězy, AI-generated fingerprints, Overused filler verbs.
- [x] Populate each section from the known canon (`v rámci`, `dochází k`, `na denní bázi`, `je nutné + inf`, `přičemž` as universal connector, stacked genitive chains, `pro` calques, filler `realizovat`/`implementovat`) with preferred alternatives and one-line Why notes.
- [x] Add **Typografie a pravopis** section to `content/style-guide.md`: non-breaking spaces, quotation marks, dashes, number/unit spacing, ordinals, dates, ellipsis, sentence-case headlines, lowercase days/months/languages, the `Vy/vy` choice for this workshop. (Decision: lowercase `vy` for peer tone.)
- [x] Add **Slovesné vs jmenné vyjadřování** section with at least two before/after examples pulled from current workshop content.
- [x] Add **Code-switching s anglickými termíny** section with gender assignment rules, declension patterns, and an explicit decision on verbified anglicisms for workshop register. (Decision: `commitnout`, `mergovat`, `deployovat` accepted in workshop context.)
- [x] Add **Zdroje a další čtení** footer linking ÚJČ Internetová jazyková příručka, Mozilla Czech style guide, Microsoft Czech localization style guide.
- [x] Update `content/style-examples.md` with two or three before/after examples for the new doctrines (nominal → verbal, typographic fixes). Added 9 new examples across Slovesné vs jmenné and Typografie sections.
- [x] Link the reject list from `content/style-guide.md`, `content/czech-editorial-review-checklist.md`, and `AGENTS.md` Task Routing for participant-facing copy.
- [x] Commit to main.

Exit: editorial content foundation is in place and linkable from Heart of Gold skill output. This phase is independent and can land before any HoG work.

### Phase 2 — Heart of Gold: copy-audit engine + Czech rule profile

**Repo:** heart-of-gold-toolkit. **Depends on:** Phase 0.

- [ ] Create `plugins/marvin/skills/copy-editor/` directory structure: `scripts/`, `rules/`, `knowledge/`, `fixtures/`.
- [ ] Create `plugins/marvin/skills/copy-editor/scripts/copy-audit.ts` with rule-registry engine architecture. Engine imports a language profile by name (`czech`, `english`), parses targets, extracts reviewable text, runs rules, emits findings.
- [ ] Create `plugins/marvin/skills/copy-editor/rules/czech.ts` implementing R1–R8 as typed rule objects (id, description, check function, severity).
- [ ] Create `plugins/marvin/skills/copy-editor/rules/english.ts` as a stub with one placeholder rule and documented extension points.
- [ ] Create `plugins/marvin/skills/copy-editor/rules/index.ts` as the registry that maps language codes to profiles.
- [ ] Implement `.copy-editor.yaml` config loader in `scripts/copy-audit.ts`. Resolve paths relative to the config file location.
- [ ] Implement path globbing with include/exclude support and the ignore-marker convention.
- [ ] Add CLI flags: `--config <path>`, `--lang <code>`, `--paths <glob>`, `--json`, `--verbose`, `--self-test`.
- [ ] Exit non-zero on any R1–R8 violation unless the ignore marker applies.
- [ ] Create `plugins/marvin/skills/copy-editor/scripts/self-test.ts` with fixture strings per rule and assertions that each rule fires on its known-bad input and passes its known-good input.
- [ ] Create `plugins/marvin/skills/copy-editor/fixtures/` with the fixture inputs (tiny Markdown and JSON files demonstrating each rule).
- [ ] Run `bun plugins/marvin/skills/copy-editor/scripts/copy-audit.ts --self-test` locally — must pass.
- [ ] Run HoG safety checks (`check:publish-safety`, `check:security`, `check:compat`) locally — must pass.
- [ ] Commit to HoG main.

Exit: the deterministic engine exists in HoG and is self-verified.

### Phase 3 — Heart of Gold: copy-editor skill role + contracts

**Repo:** heart-of-gold-toolkit. **Depends on:** Phase 2.

- [ ] Create `plugins/marvin/skills/copy-editor/SKILL.md` with YAML frontmatter (`name: copy-editor`, `description: …`, `allowed-tools: [Read, Grep, Glob, Bash]`) and a Markdown body describing the role, triggers, and the five-step loop (Load → Lint → Judge → Report → Handoff).
- [ ] Create `plugins/marvin/skills/copy-editor/knowledge/ROLE.md` as the deeper operating document: full loop definition, input contract, output contract, verification boundary clause (Layer 1 auto-closeable, Layer 2 never), escape hatches, extension points.
- [ ] Create `plugins/marvin/skills/copy-editor/knowledge/config-schema.md` documenting the `.copy-editor.yaml` schema with field definitions, defaults, and an example.
- [ ] Create `plugins/marvin/skills/copy-editor/knowledge/language-profiles.md` explaining how to add a new language profile (file location, interface, registration).
- [ ] Create `plugins/marvin/skills/copy-editor/knowledge/output-contract.md` documenting the structured JSON findings format and the review note markdown template.
- [ ] Validate the skill by running `bunx @heart-of-gold/toolkit list` — `copy-editor` must appear under the `marvin` plugin.
- [ ] Validate multi-target install by running `bunx @heart-of-gold/toolkit install marvin --to codex` (or opencode, pi) into a test location and inspecting the output.
- [ ] Run HoG safety checks locally — must pass.
- [ ] Commit to HoG main.

Exit: the skill is installable, discoverable, and documented. The deterministic layer works under the skill. Layer 2 is designed but not yet implemented in the loop.

### Phase 4 — Heart of Gold: Layer 2 judgment scaffolding

**Repo:** heart-of-gold-toolkit. **Depends on:** Phase 3.

- [ ] Expand `SKILL.md` body with explicit Layer 2 judgment passes: reject-list hit detection, nominal-style detection, voice/register check, rhythm/spoken-readability read. Each pass described as a discrete step with inputs, outputs, and rationale requirements.
- [ ] Document the context pack format in `knowledge/ROLE.md`: how the role assembles style guide + reject list + voice doctrine + Layer 1 findings for injection into Layer 2 reasoning.
- [ ] Add instructions to `SKILL.md` for drafting the review note from combined Layer 1 and Layer 2 output. Include the review note template.
- [ ] Add the explicit verification boundary clause verbatim in `SKILL.md` so it is visible to any agent executing the skill.
- [ ] Add trigger phrases to `SKILL.md` description field: `copy edit`, `edit prose`, `review Czech copy`, `czech review`, `editorial pass`, `audit copy`.
- [ ] Run HoG safety checks locally — must pass.
- [ ] Commit to HoG main.

Exit: the skill defines a complete two-layer loop. Any capable LLM executing the skill can perform a full editorial pass against a configured repo, Layer 2 included.

### Phase 5 — Harness Lab: editorial gate integration + config

**Repo:** harness-lab. **Depends on:** Phases 1, 3 (Phase 4 is nice-to-have but not strictly required for integration).

- [ ] Create `.copy-editor.yaml` at the `harness-lab` repo root pointing at the Czech profile and repo-local rules (style guide, reject list, examples, approved terms, voice doctrine). Follow the schema from HoG `knowledge/config-schema.md`.
- [ ] Add **Section 0: Typografický pass** to `content/czech-editorial-review-checklist.md` at the top. Reference the copy-editor skill invocation and state that Section 0 must pass clean before the human pass begins.
- [ ] Add Section 6.5 **Reject-list pass** to the checklist as a deterministic-assist layer that surfaces matches for human decision.
- [ ] Update `docs/workshop-content-qa.md` Blocking Checks list: add "Czech deterministic typography audit clean" as a named item. State explicitly this is the one editorial gate scripted tooling is allowed to close, and the blocking human layer is unchanged.
- [ ] Update `AGENTS.md` Task Routing for participant-facing copy: add `content/czech-reject-list.md`, `.copy-editor.yaml`, and the `copy-editor` skill invocation pattern.
- [ ] Update `AGENTS.md` Build And Test with the shell invocation (`bun .../copy-audit.ts --config .copy-editor.yaml`) or the skill invocation pattern, whichever is the primary entry point.
- [ ] Update the review-note convention in `docs/reviews/workshop-content/` to include a `typography audit: clean | N findings` line and a `layer-2 suggestions considered: yes | partial | no` line.
- [ ] Commit to harness-lab main.

Exit: the harness-lab side of the gate integration is complete and uses the HoG skill as its enforcement mechanism.

### Phase 6 — Harness Lab: baseline clean-room pass

**Repo:** harness-lab. **Depends on:** Phases 2–5.

- [ ] Run the `copy-editor` skill (or shell invocation) against the current `harness-lab` tree using `.copy-editor.yaml`. Capture structured findings.
- [ ] Triage Layer 1 findings. Fix them in small, committable slices grouped by rule so diffs stay reviewable.
- [ ] Re-run until Layer 1 is clean on the default path set.
- [ ] Triage Layer 2 suggestions. Apply the judgment calls that clearly improve the copy. Skip or defer the rest with a note.
- [ ] Write a review note at `docs/reviews/workshop-content/YYYY-MM-DD-czech-typography-baseline.md` recording: before/after counts per Layer 1 rule, Layer 2 suggestions accepted vs deferred, and any false positives worth reporting back to HoG.
- [ ] Confirm the content-excellence plan's in-flight tasks still run cleanly against the new baseline.
- [ ] Commit to harness-lab main.

Exit: current Czech visible-surface content is typographically clean, reviewed at Layer 2, and the baseline review note exists.

### Phase 7 (optional) — English language profile + narrow English baseline

**Repo:** both. **Depends on:** Phases 2–6 landing cleanly.

- [ ] In Heart of Gold: expand `rules/english.ts` with an initial rule set (sentence-case headings, no corporate filler blacklist, smart quotes, serial comma policy decision, space-em-dash vs en-dash choice).
- [ ] In Heart of Gold: add English fixtures and extend `self-test.ts` to cover the English rules.
- [ ] In Harness Lab: add an `english` extension block to `.copy-editor.yaml` OR a sibling `.copy-editor.en.yaml` depending on what the HoG config schema supports.
- [ ] In Harness Lab: run the skill against English visible-surface content (`locales/en/**`, English-side maintained source pair entries) and land fixes in the same slice discipline as Phase 6.
- [ ] Commit to both repos.

Exit: English copy quality has a minimum enforceable baseline. The language-profile architecture is proven to work for more than one language.

## Acceptance Criteria

### Heart of Gold

- `plugins/marvin/skills/copy-editor/` exists with `SKILL.md`, `knowledge/ROLE.md`, `knowledge/config-schema.md`, `knowledge/language-profiles.md`, `knowledge/output-contract.md`, `scripts/copy-audit.ts`, `scripts/self-test.ts`, `rules/czech.ts`, `rules/english.ts`, `rules/index.ts`, `fixtures/`.
- `bun .../copy-audit.ts --self-test` passes on every rule.
- `bunx @heart-of-gold/toolkit list` shows `copy-editor` under `marvin`.
- `bunx @heart-of-gold/toolkit install marvin --to codex|opencode|pi` installs the skill without errors.
- `check:publish-safety`, `check:security`, `check:compat` pass on HoG main after the skill lands.
- `SKILL.md` contains the verification boundary clause verbatim and the five-step loop.
- `ROLE.md` documents inputs, outputs, loop, verification boundary, and extension points.

### Harness Lab

- `content/czech-reject-list.md` exists and is linked from style guide, checklist, and AGENTS.md.
- `content/style-guide.md` contains Typografie a pravopis, Slovesné vs jmenné vyjadřování, Code-switching s anglickými termíny, and Zdroje a další čtení sections.
- `.copy-editor.yaml` at the repo root points at the Czech profile and all repo-local rule files, and is valid against the HoG config schema.
- `content/czech-editorial-review-checklist.md` opens with Section 0: Typografický pass.
- `docs/workshop-content-qa.md` lists the deterministic copy-audit as a named blocking check and keeps the human layer explicitly separate.
- A baseline review note under `docs/reviews/workshop-content/` records the initial clean-room pass with before/after counts per rule and Layer 2 suggestions triaged.
- The content-excellence plan's in-flight tasks continue cleanly against the new baseline.
- A Czech reviewer performing a review after this plan lands reports spending their time on voice and spoken-readability, not on typography.

### End-to-end

- From a fresh clone of Harness Lab with HoG installed, a new contributor can run the copy-editor skill against the repo and get a correct Layer 1 + Layer 2 pass with zero configuration beyond the shipped `.copy-editor.yaml`.
- A second repo could adopt the same skill by authoring its own `.copy-editor.yaml` and optional repo-local rule files, without forking Heart of Gold.

## Decision Rationale

### Why two layers, two homes

Deterministic rules (typography, mechanical patterns) and judgment rules (voice, rhythm, spoken readability) are different operations. Conflating them into one tool produces something that is neither reliably deterministic nor reliably smart. Separating them gives each layer the right implementation: regex-level for deterministic work, LLM-level for judgment work. Each layer has clear success criteria: Layer 1 is "clean or not clean," Layer 2 is "suggestions a human can consider."

### Why Heart of Gold for the machinery

Per [`docs/hybrid-harness-split.md`](../hybrid-harness-split.md), reusable workflow machinery belongs in Heart of Gold. A copy-editor engine and role are reusable machinery. A Czech style guide, reject list, and voice doctrine are content — repo-local truth. This plan honors both: engine and role in HoG, rules and style in `harness-lab`. A second project adopting the role needs only a `.copy-editor.yaml` and its own content files.

### Why the role is agent-agnostic by construction

The shell command is the portable contract (`bun scripts/copy-audit.ts --config ... --json`). Every agent with Bash access can invoke it. Claude Code picks up the skill via marketplace. Codex, OpenCode, and Pi pick it up via the HoG installer that already handles multi-target format conversion. No agent is privileged. No agent is locked out. There is no `.claude/skills/` wrapper because that would lock ergonomics to one agent while the underlying tool is universal.

### Why TypeScript + Bun for the engine

Heart of Gold is a TypeScript + Bun codebase already (`bun.lock`, `#!/usr/bin/env bun`, existing skills and scripts in TypeScript). Adding a Node `.mjs` script would fork the convention. Bun runs TypeScript directly with zero build step, and the rule profiles benefit from typed interfaces so adding a new language is compile-checked. Invocation from non-Bun environments (CI in `harness-lab`, for example) works via the `bunx` entry point that HoG already uses for its CLI.

### Why `marvin` as the plugin home

The `marvin` plugin already owns quality/review skills (`quick-review`, others). A copy-editor fits the same family. Creating a dedicated new plugin would add registry overhead for one skill. Grouping under `marvin` keeps discoverability simple: `/marvin:copy-editor` is the invocation, and the skill shares the plugin's existing review-adjacent surface.

### Why a living reject list separate from the style guide

A style guide is a statement; a reject list is a dataset that grows every time a reviewer catches something new. Separate files signal separate lifecycles. The reject list is also the primary pattern-match input for Layer 2 — an enumerated list is programmatically consumable, a prose style guide is not. And a reject list is portable: a fork can adopt it without adopting Harness Lab's workshop-specific voice decisions.

### Why the verification boundary clause is non-negotiable

The existing `docs/workshop-content-qa.md` doctrine says AI may assist but cannot close the blocking Czech gate. The copy-editor role inherits that doctrine by construction: Layer 1 is auto-closeable because it is deterministic; Layer 2 always produces suggestions, never verdicts. Written into `ROLE.md` and `SKILL.md` verbatim so no future revision quietly weakens it.

### Why work on main directly across both repos

The user has explicitly chosen to skip PR flow for this work. Commits are the unit of progress. Safety comes from frequent small commits, the HoG local safety checks, and the self-test in Phase 2. Risk of main-branch instability is mitigated by phase ordering: Phase 1 (harness-lab) and Phase 2 (HoG) are independently safe; Phases 5–6 depend on earlier work already being in place.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| The current `content/style-guide.md` and checklist are good ground truth to extend rather than replace | Verified | Both files were recently hardened in commit c5d7397 |
| Deterministic typographic rules are regex-level and implementable as typed rule objects in TypeScript | Verified | Rules R1–R8 are pattern-level; Mozilla/Microsoft Czech style guides describe them mechanically |
| Heart of Gold's existing plugin/skill convention supports a skill with sibling `scripts/`, `rules/`, `knowledge/`, `fixtures/` directories | Verified | Existing skills use sibling dirs; `src/parsers/claude.ts` auto-discovers `SKILL.md` under plugin directories |
| The HoG multi-target installer (`install --to codex|opencode|pi`) picks up new skills under existing plugins automatically | Verified | Installer walks the `marvin` plugin and copies skill dirs per target transform |
| `marvin` is the right plugin home for a copy-editor skill | Verified | `marvin` already owns review/quality skills; grouping is consistent |
| Current Czech visible-surface content has non-zero typographic issues the audit will catch | Unverified — becomes Phase 0 baseline task | Manual sweep in Phase 0 confirms before Phase 2 tooling work |
| A Claude/Codex/OpenCode agent executing the skill can reliably invoke the copy-audit script via Bash and parse JSON output | Verified | All target agents support Bash; JSON output is standard |
| The HoG `check:publish-safety` and `check:security` scripts will not reject a new skill with sibling `rules/` and `fixtures/` dirs | Unverified — becomes Phase 2 local check | Run them locally before committing; adjust if they flag novel paths |
| The `.copy-editor.yaml` config can be loaded from a relative path resolved against the running directory | Verified | Standard config loading pattern; caller passes `--config` with repo-root-relative path |
| The content-excellence plan will not rewrite `content/style-guide.md` or the checklist from under this plan | Verified | Its task list touches scene packs, learner materials, and briefs; these files are out of its scope |
| Working directly on HoG main is viable | Verified | No branch protection on HoG main; safety checks run on push but do not block |

## Risk Analysis

### Risk: Cross-repo sequencing deadlock

Phase 5 depends on HoG Phases 2–4 being committed. If HoG work stalls, `harness-lab` integration sits waiting.

Mitigation: Phase 1 is fully decoupled and delivers value alone. Phases 2 and 3 are small enough to land in one or two sessions each. Phase 4 scaffolding is the heaviest but can be partial in first landing and iterated.

### Risk: HoG safety checks reject the new skill shape

The `check:publish-safety`, `check:security`, and `check:compat` scripts may have assumptions that fail on novel paths (`rules/`, `fixtures/`) or new file types.

Mitigation: Run the checks locally at the end of Phase 2 before committing. If they fail, either adjust the skill layout or update the checks in the same slice. Either way, do not commit a red state.

### Risk: Engine over-triggers on code blocks, backticked terms, or English fallback locales

False positives erode trust. A single noisy rule can make the whole gate feel unreliable.

Mitigation: Phase 0 manual sweep identifies hotspots before coding. Phase 2 `self-test.ts` locks known-good / known-bad fixtures per rule. The ignore marker exists for genuine exceptions. Exclude globs for `locales/en/**` are default.

### Risk: Layer 2 drift across invocations

LLM-driven judgment passes may produce inconsistent suggestions across runs of the same input.

Mitigation: Layer 2 is explicitly non-blocking. Suggestions are considered, not enforced. The context pack is deterministic (same style guide + reject list + voice doctrine every run), which narrows variance. Phase 6 treats Layer 2 output as advisory during the baseline pass.

### Risk: The copy-editor role grows into "writer + translator + coach"

Scope creep is the default failure mode for judgment-heavy roles.

Mitigation: `ROLE.md` contains explicit non-goals. The five-step loop is the complete definition — new passes require updating the loop in both `SKILL.md` and `ROLE.md` together, which makes expansion visible.

### Risk: Reject list becomes dogma applied without judgment

Every entry in the reject list is a trigger; applied blindly, it flattens legitimate stylistic variation.

Mitigation: Every entry includes a one-line Why. The reject list is a Layer 2 hint, not a Layer 1 gate. Only deterministic typography is blocking.

### Risk: Working on main directly produces broken states

No PR review means fewer eyes on each commit.

Mitigation: Small commits, self-test in Phase 2, local safety checks before each HoG commit, fixture-based regression for rule changes. Phase 6's clean-room pass acts as an integration test. Rollback target is always one commit away.

### Risk: Second repo adoption reveals missing extension points

Harness Lab is the first consumer. Edge cases from a second repo may force ROLE.md changes.

Mitigation: Explicit extension points documented in `language-profiles.md` and `config-schema.md` from day one. Version the schema so future changes are tracked. First adopter feedback is expected and welcomed; the role is not frozen after Phase 4.

### Risk: Overlap with in-flight content-excellence plan on Phase 6 file edits

Phase 6 fixes land in the maintained source pair (`agenda.json` + `localized-content.ts`), which the content-excellence plan also touches.

Mitigation: Phase 0 confirms no concurrent writes to those files. Phase 6 commits in small rule-grouped slices to keep diff conflicts minimal and resolvable. If a conflict happens, the content-excellence plan's rewrite wins at the scene level; this plan's typographic fixes get re-applied after.

## Phased Implementation

Summary of phase ordering and owning repo:

| Phase | Repo | Depends on | Summary |
|---|---|---|---|
| 0 | both | — | Baseline, scope lock, cross-repo sequencing |
| 1 | harness-lab | 0 | Reject list + style guide depth (decoupled; can land first) |
| 2 | heart-of-gold | 0 | copy-audit engine + Czech rule profile + self-test |
| 3 | heart-of-gold | 2 | copy-editor skill role + contracts + config schema |
| 4 | heart-of-gold | 3 | Layer 2 judgment scaffolding |
| 5 | harness-lab | 1, 3 | `.copy-editor.yaml` + gate integration + AGENTS.md routing |
| 6 | harness-lab | 2–5 | Baseline clean-room pass + review note |
| 7 (opt) | both | 2–6 | English rule profile + narrow English baseline |

Phase 1 can run in parallel with Phases 2–4 since they are in different repos. Phases 5 and 6 are sequential after both tracks land.

## References

### Harness Lab

- [`content/style-guide.md`](../../content/style-guide.md)
- [`content/style-examples.md`](../../content/style-examples.md)
- [`content/czech-editorial-review-checklist.md`](../../content/czech-editorial-review-checklist.md)
- [`docs/workshop-content-language-architecture.md`](../workshop-content-language-architecture.md)
- [`docs/workshop-content-qa.md`](../workshop-content-qa.md)
- [`docs/hybrid-harness-split.md`](../hybrid-harness-split.md)
- [`AGENTS.md`](../../AGENTS.md)
- [`2026-04-09-feat-workshop-blueprint-content-excellence-and-readiness-plan.md`](./2026-04-09-feat-workshop-blueprint-content-excellence-and-readiness-plan.md)
- [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json)
- [`dashboard/lib/workshop-blueprint-localized-content.ts`](../../dashboard/lib/workshop-blueprint-localized-content.ts)

### Heart of Gold Toolkit

- `/Users/ondrejsvec/projects/bobo/heart-of-gold-toolkit/` — sibling repo root
- `plugins/marvin/skills/` — plugin home for the new skill
- `src/parsers/claude.ts` — existing SKILL.md parser
- `src/targets/{codex,opencode,pi}.ts` — existing target transforms
- `.claude-plugin/marketplace.json` — plugin registry
- `scripts/check-publish-safety.py`, `scripts/check-security-regressions.py`, `scripts/check-harness-compatibility.py` — safety checks to run locally before each HoG commit

### External

- ÚJČ Internetová jazyková příručka — https://prirucka.ujc.cas.cz/
- Mozilla Czech Localization Style Guide — https://mozilla-l10n.github.io/styleguides/cs/general.html
- Microsoft Czech Localization Style Guide (PDF) — https://download.microsoft.com/download/7/b/5/7b57e4a1-d299-4238-9997-f3ac51d6f763/ces-cze-StyleGuide.pdf
