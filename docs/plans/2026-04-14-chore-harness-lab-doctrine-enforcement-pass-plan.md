---
title: "chore: Harness Lab doctrine enforcement pass"
type: plan
date: 2026-04-14
status: complete
brainstorm: docs/brainstorms/2026-04-14-harness-lab-doctrine-enforcement-brainstorm.md
confidence: high
---

# Harness Lab doctrine enforcement pass

One-line summary: bring the repo's shipped tooling in line with the doctrine it already teaches, with enforcement scoped strictly to friction-backed rules.

## Problem Statement

Harness Lab's **documentation** embodies the doctrine — progressive disclosure, map-not-manual, repo-native context, "when friction repeats, improve the harness." Its **tooling** does not yet. Three concrete doctrine violations ship in the repo:

1. **Installer violates progressive disclosure.** `harness-cli/src/skill-install.js:244,195` unconditionally installs `workshop-facilitator` on every participant path. The SKILL.md structural split landed; the installer split never did. Evidence: `docs/reviews/2026-04-10-expert-panel-skills-cli-teaching-approach.md:42,46` already named this as a fix target, listing `harness-cli/src/run-cli.js (printUsage)` among the files that should move with the SKILL.md split — but only the doc split happened.
2. **Root repo map omits `workshop-content/`.** `AGENTS.md:60-73` lists 11 subdirectories; `workshop-content/` is missing even though `AGENTS.md:115` names `workshop-content/agenda.json` as the canonical bilingual source. The map lies about what the repo is.
3. **Czech copy-audit is doctrine, not enforcement.** `AGENTS.md:128` says *"if you change Czech visible-surface content, run the copy-editor Layer 1 typography audit before committing… must return zero error-severity findings."* `.husky/pre-commit` does not enforce this. Session `8d806742` shows three consecutive Czech corrections (`ty` vs `vy`, translated-sounding prose) that an enforced audit would have caught.

Secondary gaps (friction-backed, standards-mandated, or doctrine-to-complete):

4. **No nested `AGENTS.md`** at `dashboard/`, `workshop-content/`, `harness-cli/`, `workshop-skill/`, even though `docs/agents-md-standard.md:45-55` mandates narrower local guidance when a surface keeps needing special instructions.
5. **`workshop analyze` has no scoring**. `workshop-skill/analyze-checklist.md:5-16` defines 12 qualitative questions; nothing produces a machine-readable PASS/FAIL a facilitator can act on.
6. **Pre-rotation handoff gate is prose-only**. `workshop-blueprint/day-structure.md:136-137` defines the three-part minimum but `workshop analyze` doesn't surface it as an explicit gate block.
7. **Harness economics absent**. `content/codex-craft.md:59` calls context budget "a constraint you measure and optimize" but the repo names no concrete numbers (Codex 32 KiB `project_doc_max_bytes`, Claude 5-minute prompt-cache TTL) — the principle is abstract and unmeasurable as written.
8. **`docs/plans/` is 47 done plans cohabiting with 10 live plans.** 67 plans total, 63 with `status:` frontmatter: 43 `complete` + 4 typo-variant `completed` + 2 `superseded` + 10 `in_progress` + 3 `approved` + 1 `captured`. An agent browsing the directory cannot tell what's live without opening every file. The status field exists but `complete`/`completed` typo variants coexist. No archive directory. No lifecycle standard. Two brainstorms are misfiled as plans (`2026-04-06-brainstorm-workshop-skill-event-access-model.md` with `type: brainstorm` in its own frontmatter; `2026-04-12-brainstorm-workshop-agenda-content-review.md`). This is doctrine-in-docs-not-enforcement applied to the plans pipeline itself.

## Target End State

When this plan lands:

- `harness skill install` installs only the participant skill by default; `harness skill install --facilitator` installs both. A cold participant clone cannot accidentally acquire the facilitator surface.
- `AGENTS.md:60-73` repo map includes `workshop-content/` with a one-line description matching the rest of the map.
- `docs/reviews/2026-04-10-expert-panel-skills-cli-teaching-approach.md` carries a dated status note naming which recommendations landed and which remain, specifically calling out the installer as still-outstanding-at-audit-time but now resolved by this plan.
- `dashboard/`, `workshop-content/`, `harness-cli/`, and `workshop-skill/` each have a five-section `AGENTS.md` (Mission one-line, Read First, Task Routing, Verification Boundary, Done Criteria) that routes — never restates — per `docs/agents-md-standard.md:45-55`.
- `docs/agents-md-standard.md` contains a "Scoring Appendix" section with binary PASS/FAIL checks mapped to each analyze-checklist item. `workshop-skill/analyze-checklist.md` output section emits PASS/FAIL per check, including the three-part pre-rotation handoff gate as a dedicated block.
- `.husky/pre-commit` runs `copy-audit.ts` against staged files matching `.copy-editor.yaml` includes, failing on error-severity findings, and degrading gracefully (warn-only) when the toolkit script is not available on PATH.
- `docs/harness-economics.md` exists as a dated "last verified 2026-04-14" reference table with vendor links, linked from `content/codex-craft.md:59`. No enforcement layer.
- `docs/plan-lifecycle-standard.md` exists and is referenced from root `AGENTS.md` Read First. Plans use canonical status values (`approved | in_progress | complete | superseded | captured`) — no more `completed` typo variant. `docs/plans/archive/` exists and contains all `complete` and `superseded` plans; `docs/plans/` root contains only live work (`approved | in_progress`) plus canonical plan-supporting research. The two misfiled brainstorms live in `docs/brainstorms/`. `workshop analyze` fails on any `complete` plan still in `plans/` root, any non-plan `type:` in `plans/` root, and any non-canonical status value.

## Scope and Non-Goals

**In scope:**
- The nine items above (P0 × 3, P1 × 5, P2 × 1).
- Regression coverage for the installer change.
- Root `AGENTS.md` Task Routing and Read First updates to point at the four new nested files and the new plan-lifecycle standard.
- Plans directory archival pass: move 47 `complete` + 2 `superseded` plans to `docs/plans/archive/` with inbound-link updates; normalize status field; relocate two misfiled brainstorms.

**Out of scope:**
- Session-state / handoff-note standardization (brainstorm Q3 dropped — agent-native session state handles within-agent continuity; cross-agent handoff is already named in prose at `materials/coaching-codex.md:55-64`).
- Commit-cadence nudges (brainstorm dropped — Codex flagged heuristics as punishing offline work).
- Regen-race doctrine (brainstorm deferred — no repo evidence of a background writer per Codex review).
- Separate `docs/czech-voice.md` (doctrine already lives in `content/style-guide.md:149-173` and `content/czech-editorial-review-checklist.md`).
- Separate handoff-gate doc (gate exists at `workshop-blueprint/day-structure.md:136-137`; we wire it, not duplicate it).
- New participant command surface redesign (listed as audit recommendation but out of scope for a doctrine-enforcement pass; deserves its own plan).
- Dashboard design system or UI changes.
- Any content authored in `~/.claude/` or `~/.codex/` — this plan is repo-scoped.
- **Plan deletion.** Archive is append-only. No plan is deleted by this pass, even if superseded or completed. Durable-artifacts doctrine forbids removing history.
- **Reformatting old plans** (typo fixes aside). Historical plans stay structurally as-authored — only the status field is normalized and inbound links get updated when a file moves.

## Proposed Solution

Sequenced into three priority tiers, each tier independently shippable. P0 lands first (doctrine violations in public surface), P1 second (friction-backed enforcement), P2 third (documentation-only completion of the principle).

**Per-item shape rules** (applied throughout):
- Nested `AGENTS.md` files use the exact five sections from `docs/agents-md-standard.md:56-67` — Mission (one line), Read First, Task Routing, Verification Boundary, Done Criteria. No Mission paragraphs. No "repo map" subsections. If a subtree needs more, it links to a deeper doc — never grows.
- The scoring appendix is binary PASS/FAIL with notes, never a 1-5 ladder. Codex flagged graded scoring as gameable (`Codex peer review, session 2026-04-14`).
- Every new or edited doc must be reachable from root `AGENTS.md` within two link-hops.

**Task status legend**: `[ ]` not started, `[~]` in progress, `[x]` done.

## Implementation Tasks

### P0 — Doctrine violations in shipped code

- [x] **A1. Add `facilitator` option to `installWorkshopSkill`.** `harness-cli/src/skill-install.js`. Default `options.facilitator = false`. Gate both call sites (`installFacilitatorSkill` at lines 195 and 244) on the option. Return value's `facilitator` field stays unchanged in shape but holds `{ agents: null, claude: null }` when not installed. *Depends on: nothing.*
- [x] **A2. Wire `--facilitator` flag in `run-cli.js`.** `harness-cli/src/run-cli.js:340-345` `handleSkillInstall`. Read `flags.facilitator === true` via `readBooleanFlag` (if not present, add minimal helper). Pass through to `installWorkshopSkill`. Update the "Installed skills" output block (lines 356-364) to only print the `workshop-facilitator` line when the flag was actually set. *Depends on: A1.*
- [x] **A3. Update CLI usage text / help.** `harness-cli/src/run-cli.js` `printUsage`. Document `harness skill install [--facilitator]`. One-line addition, no restructure. *Depends on: A2.*
- [x] **A4. Regression test for installer split.** Add a test (match the existing harness-cli test shape) that asserts (a) default `installWorkshopSkill({ cwd })` produces no files under `.claude/skills/workshop-facilitator` or `.agents/skills/harness-lab-workshop-facilitator`; (b) `installWorkshopSkill({ cwd, facilitator: true })` produces both. Runs under whatever test runner `harness-cli` already uses. *Depends on: A1.*
- [x] **B1. Add `workshop-content/` to root `AGENTS.md` repo map.** `AGENTS.md:60-73`. Insert a new line after `workshop-blueprint/` or before `workshop-skill/` (whichever reads better in the ASCII tree) describing it as `# Bilingual source of truth for agenda scenes (see docs/workshop-content-language-architecture.md)`. *Depends on: nothing.*
- [x] **C1. Annotate stale expert audit with dated status note.** `docs/reviews/2026-04-10-expert-panel-skills-cli-teaching-approach.md`. Insert a `## Status Update (2026-04-14)` block near the top (before line 30), noting: (1) recommendation #1 structural SKILL.md split landed; (2) the installer fix called out at `:42,46` remains outstanding *at audit time* but is resolved by `docs/plans/2026-04-14-chore-harness-lab-doctrine-enforcement-pass-plan.md`. Keep the body of the audit intact — the note is a preamble. *Depends on: A1 landed or explicitly committed to in this plan.*

### P1 — Friction-backed enforcement

- [x] **D1. Create `dashboard/AGENTS.md`.** Five sections. Mission: one line on Next.js App Router workshop surface. Read First: `docs/dashboard-design-system.md`, `docs/dashboard-surface-model.md`, `docs/dashboard-testing-strategy.md`, `docs/agent-ui-testing.md`. Task Routing: UI changes → design system; routing/state → surface model; tests → testing strategy. Verification Boundary: Playwright smoke for critical flows; browser inspection for exploration; human review before done. Done Criteria: tests/lint/build green; visible docs still match; next safe move stated. *Depends on: nothing.*
- [x] **D2. Create `workshop-content/AGENTS.md`.** Mission: one line on bilingual source of truth. Read First: `docs/workshop-content-language-architecture.md`, `docs/workshop-content-qa.md`, `docs/workshop-content-authority-and-citation.md`, `.copy-editor.yaml`. Task Routing: agenda edits → `agenda.json` (never generated files); Czech copy → copy-editor Layer 1 + 2. Verification Boundary: `npm run generate:content` + `npm run verify:content`; copy-audit error-severity zero. Done Criteria: content verification passes; copy-audit clean; next safe move stated. *Depends on: nothing.*
- [x] **D3. Create `harness-cli/AGENTS.md`.** Mission: one line on privileged-ops wrapper. Read First: `docs/harness-cli-foundation.md`, `docs/resource-packaging-model.md`. Task Routing: bundle changes → sync scripts; auth/session → foundation doc. Verification Boundary: `cd harness-cli && npm test` + `npm run verify:workshop-bundle`. Done Criteria: tests green; bundle in sync; no raw credentials in skill state. *Depends on: nothing.*
- [x] **D4. Create `workshop-skill/AGENTS.md`.** Mission: one line on skill authoring and participant/facilitator split. Read First: `docs/agents-md-standard.md`, `docs/adr/2026-04-12-skill-docs-english-canonical.md`. Task Routing: participant docs → `SKILL.md`; facilitator docs → `SKILL-facilitator.md`; translation on the fly (no parallel Czech). Verification Boundary: bundle resync after content change; copy-audit *not* applicable (English canonical per ADR). Done Criteria: bundle resynced; analyze-checklist still green. *Depends on: nothing.*
- [x] **D5. Update root `AGENTS.md` Task Routing to reference nested files.** `AGENTS.md:30-56`. Each of the four routing sections (`dashboard/`, `workshop-content/` [new entry], `harness-cli/`-via-`participant skill, install flow`, `workshop-skill/`) gets one additional bullet pointing at the nested `AGENTS.md`. Do not remove existing links — nested files supplement, not replace. *Depends on: D1, D2, D3, D4.*
- [x] **F1. Add scoring appendix to `docs/agents-md-standard.md`.** Insert a new `## Scoring Appendix` section after the existing "Review Checklist" (after line 117). Binary PASS/FAIL only. Map each of the 12 `workshop-skill/analyze-checklist.md:5-16` items to a named check with a concrete question (e.g., `agents_md_exists`, `map_not_dump`, `read_first_present`, `verification_boundary_stated`, `next_safe_move_obvious`). Output shape: list of `check_name: PASS | FAIL — note`. Include a "known ways to game this" anti-list. *Depends on: nothing.*
- [x] **F2. Update `workshop-skill/analyze-checklist.md` output section.** Replace the three-bullet "What helped / What was missing / What to add" (lines 18-22) with a binary PASS/FAIL block that references the scoring appendix in F1. Keep the narrative "What helped / What was missing / What to add" as the rationale body *below* the PASS/FAIL block. The machine-readable block is primary; the prose is commentary. *Depends on: F1.*
- [x] **G1. Add Czech copy-audit step to `.husky/pre-commit`.** After the existing content-integrity block, detect staged files matching `.copy-editor.yaml` includes (glob match on `git diff --cached --name-only`). When matches exist, invoke `bun ../heart-of-gold-toolkit/plugins/marvin/skills/copy-editor/scripts/copy-audit.ts --config .copy-editor.yaml --files <matched>` (file-scoped invocation; if the script does not accept `--files`, fall back to repo-wide and filter output). Fail commit on error-severity findings. **Degrade gracefully**: if `bun` is not on PATH or the toolkit script path does not exist, print a yellow warning pointing at `AGENTS.md:128` and exit zero. Emergency bypass via existing `--no-verify` pattern. *Depends on: nothing.*
- [x] **G2. Document `--no-verify` reason convention.** Append one paragraph to `AGENTS.md:120` (Emergency bypass section) noting that Czech copy-audit failures are explicit design decisions requiring the bypass reason to name the specific finding being overridden, not "copy-audit noise". *Depends on: G1.*
- [x] **K1. Add pre-rotation handoff gate block to `workshop-skill/analyze-checklist.md`.** New section "Pre-rotation handoff gate" mapping `workshop-blueprint/day-structure.md:136-137`'s three minimums to explicit PASS/FAIL checks: `agents_md_readable_with_goal_and_commands_and_constraint`, `one_executable_verification_step_passing`, `next_safe_step_written_in_repo`. These are the three gate checks and must surface as a dedicated block in analyze output, labeled "Pre-rotation gate". *Depends on: F2.*
- [x] **K2. Update `workshop-blueprint/day-structure.md:136-137` to cross-reference.** One-line addition pointing facilitators at `workshop analyze`'s pre-rotation gate block as the recommended machine-readable pre-check. Do not turn the gate into a tool-only check — the facilitator still owns the call. *Depends on: K1.*
- [x] **L1. Write `docs/plan-lifecycle-standard.md`.** One short doc, 60-90 lines max, following the shape of the other `docs/*-standard.md` files. Content: (a) canonical status values — `approved | in_progress | complete | superseded | captured` (authoritative list, `completed` is not allowed); (b) lifecycle transitions — a plan starts as `approved`, moves to `in_progress` when `/work` begins, moves to `complete` when acceptance criteria are green, moves to `superseded` when a newer plan explicitly replaces it; (c) directory layout — live plans (`approved` or `in_progress`) live in `docs/plans/` root, `complete` and `superseded` plans move to `docs/plans/archive/`, plan-supporting research (`type: research`, `for-plan:` field) may live alongside the parent plan in `docs/plans/` root; (d) archive is append-only, no plan is ever deleted; (e) analyze checks that enforce this (cross-reference L5). Link to and from `docs/agents-md-standard.md`. *Depends on: nothing.*
- [x] **L2. Normalize `status` field across all plans.** `docs/plans/**/*.md`. Replace `status: completed` with `status: complete` via a repo-wide sed or equivalent (4 files per current count). No other frontmatter changes. Verify by `grep -h '^status:' docs/plans/*.md | sort -u` returning only canonical values. Add the canonical list to `docs/agents-md-standard.md` as a small "Canonical Plan Status Values" subsection after the Review Checklist, linking to `plan-lifecycle-standard.md` for full lifecycle. *Depends on: L1.*
- [x] **L3. Relocate misfiled brainstorms.** `git mv docs/plans/2026-04-06-brainstorm-workshop-skill-event-access-model.md docs/brainstorms/` and `git mv docs/plans/2026-04-12-brainstorm-workshop-agenda-content-review.md docs/brainstorms/`. Before moving, `grep -rn 'docs/plans/2026-04-06-brainstorm-workshop-skill-event-access-model' docs/ workshop-blueprint/ content/ AGENTS.md README.md` and update any hits to the new path. Same for the 2026-04-12 file. Both files already have brainstorm identity in their frontmatter or title. *Depends on: nothing (independent of L1/L2).*
- [x] **L4. Create `docs/plans/archive/` and move completed/superseded plans.** (a) Create the directory with a short `README.md` that one-line describes it and links to `docs/plan-lifecycle-standard.md`. (b) Build a list of files to move: all plans under `docs/plans/*.md` (root only, not subdirectories) with `status: complete` or `status: superseded`. (c) Before moving, run repo-wide grep for inbound references to each file — update `docs/`, `workshop-blueprint/`, `content/`, `AGENTS.md`, `README.md`, nested `AGENTS.md` files, and the new `docs/plan-lifecycle-standard.md` to point at the new `plans/archive/<filename>` paths. (d) Execute the moves via `git mv` preserving history. (e) Verify: `ls docs/plans/*.md` only shows `approved`/`in_progress`/`captured` plans plus `type: research` notes. *Depends on: L1 (archive README links to standard), L2 (normalized status before filtering). Must land in a single commit — half-moved state is worse than not-moved.*
- [x] **L5. Add plans-directory checks to scoring appendix.** Extend F1's appendix in `docs/agents-md-standard.md` with three additional binary checks that `workshop analyze` applies to the repo being analyzed: `no_complete_plans_in_plans_root` (no file under `docs/plans/*.md` with `status: complete` or `status: superseded`), `no_non_plan_types_in_plans_root` (no file under `docs/plans/*.md` with `type:` other than `plan` or `research`), `plan_status_field_canonical` (all `status:` values are in the canonical list from L1). Wire into `workshop-skill/analyze-checklist.md` output block from F2. *Depends on: F1, F2, L1.*
- [x] **L6. Update root `AGENTS.md` Read First to reference the lifecycle standard.** `AGENTS.md:18-26`. Add one bullet pointing at `docs/plan-lifecycle-standard.md` for any task that touches `docs/plans/`. Do not duplicate the standard's content — one pointer, one line. *Depends on: L1.*

### P2 — Documentation only, no enforcement

- [x] **H1. Create `docs/harness-economics.md`.** Dated frontmatter `last_verified: 2026-04-14`. Sections: (1) Context budget as measurable constraint — link to `content/codex-craft.md:59`. (2) Per-agent hard caps: Codex `project_doc_max_bytes = 32 KiB` (cite `developers.openai.com/codex/guides/agents-md`), Claude Code no documented limit. (3) Prompt cache windows: Anthropic 5-min TTL, OpenAI varies — cite vendor docs, not hearsay. (4) How to measure: token counts from SDK responses, session transcript size, file-read counts. (5) Revalidation cadence: re-verify numbers at each cohort; vendor constants drift. No linter, no check. *Depends on: nothing.*
- [x] **H2. Link `docs/harness-economics.md` from `content/codex-craft.md:59`.** One-line addition after the "measure and optimize" line, pointing at the new doc. *Depends on: H1.*

## Acceptance Criteria

**P0**
- [ ] From a fresh clone with `harness skill install` (no flags), no file exists under `<target>/.claude/skills/workshop-facilitator/` or `<target>/.agents/skills/harness-lab-workshop-facilitator/`.
- [ ] `harness skill install --facilitator` creates both skills as before the change.
- [ ] A regression test exists in `harness-cli/` that asserts both conditions above. The test runs as part of `cd harness-cli && npm test`.
- [ ] `harness skill install --help` output names `--facilitator`.
- [ ] `grep 'workshop-content/' AGENTS.md` returns at least one match inside the repo-map code block.
- [ ] `docs/reviews/2026-04-10-expert-panel-skills-cli-teaching-approach.md` opens with a `## Status Update (2026-04-14)` block citing this plan and naming which recommendations landed.

**P1**
- [ ] Each of `dashboard/AGENTS.md`, `workshop-content/AGENTS.md`, `harness-cli/AGENTS.md`, `workshop-skill/AGENTS.md` exists, contains exactly five top-level sections matching `docs/agents-md-standard.md:56-67`, and is referenced from root `AGENTS.md` Task Routing.
- [ ] `docs/agents-md-standard.md` contains a `## Scoring Appendix` section with binary PASS/FAIL checks mapped to each of the 12 `analyze-checklist.md:5-16` items.
- [ ] `workshop-skill/analyze-checklist.md` output section emits PASS/FAIL per check plus a dedicated "Pre-rotation gate" block.
- [ ] `.husky/pre-commit` fails (exits non-zero) when a staged file matching a `.copy-editor.yaml` include glob produces an error-severity copy-audit finding, and exits zero with a warning when the toolkit script is unavailable.
- [ ] `workshop-blueprint/day-structure.md:136-137` links to the pre-rotation gate block in `analyze-checklist.md`.

**P2**
- [ ] `docs/harness-economics.md` exists, has `last_verified: 2026-04-14` frontmatter, and cites at least three vendor sources by URL.
- [ ] `content/codex-craft.md` links to `docs/harness-economics.md` from the context-budget paragraph.

**Workstream L (archival + lifecycle)**
- [ ] `docs/plan-lifecycle-standard.md` exists, is under 100 lines, defines the canonical status list, and is linked from `docs/agents-md-standard.md` and root `AGENTS.md` Read First.
- [ ] `grep -h '^status:' docs/plans/*.md docs/plans/archive/*.md | sort -u` returns only canonical values (no `completed`).
- [ ] `ls docs/plans/*.md | wc -l` after the pass is ≤ 15 (live plans plus `type: research` notes only — the `captured` plan from L3 and the two misfiled brainstorms are no longer here).
- [ ] `docs/plans/archive/` exists, has a one-line `README.md`, and contains exactly the union of previously-`complete` + previously-`superseded` plans (expect ~49 files based on current count, subject to last-minute status changes).
- [ ] `grep -rn 'docs/plans/2026-' docs/ workshop-blueprint/ content/ AGENTS.md README.md` produces zero broken links (every hit resolves to an existing path).
- [ ] `docs/plans/2026-04-06-brainstorm-workshop-skill-event-access-model.md` and `docs/plans/2026-04-12-brainstorm-workshop-agenda-content-review.md` no longer exist; their brainstorm-directory equivalents do.
- [ ] `workshop analyze` run on this repo passes all three L5 checks: `no_complete_plans_in_plans_root`, `no_non_plan_types_in_plans_root`, `plan_status_field_canonical`.

**Cross-cutting**
- [ ] `npm run lint` (dashboard), `npm run verify:content`, and `npm run verify:workshop-bundle` all pass after every task in the P0/P1 sequence.
- [ ] `workshop analyze` produces a PASS result on this repo after all tasks complete — eat the dogfood.

## Decision Rationale

**Why friction-backed enforcement as the filter.**
The repo's own `docs/harness-doctrine.md:39-47` says *"when the same issue happens repeatedly, improve the harness."* Inverting that rule gives the filter for this plan: *if friction hasn't repeated, don't manufacture enforcement*. Over-enforcement produces false positives that erode trust in the enforcements you actually care about. That's why H (harness economics) ships as documentation without a linter — no recent session has blown a cache window or hit the 32 KiB cap, so encoding it as a check would be aspirational, not doctrinal.

**Why `--facilitator` flag rather than auth-gated detection.**
Explored three options in the brainstorm (Q1). Auth-gated detection is clever but adds magic: a failed `workshop facilitator login` becomes a silent doctrine violation, and the installer behavior depends on network state. A separate `harness facilitator bootstrap` command forces intent but splits the mental model of "install a skill" across two commands. The explicit flag is discoverable via `--help`, one command surface, zero hidden state, and matches the trunk-based simplicity the repo preaches.

**Why no numeric cap on nested AGENTS.md.**
Brainstorm Q2. A size rule is gameable — one 1999-byte paragraph is not better than six 400-byte sections. A shape rule (five named sections) can't be gamed without becoming visibly broken. The five-section names match the root `AGENTS.md` template, giving one mental model for the whole repo.

**Why binary PASS/FAIL instead of a 5-point rubric.**
Brainstorm Q4. Codex flagged graded scoring as gameable (expert audit cites the same research). Binary with notes is ungameable — either a check passes or it doesn't, notes capture nuance, and the output reads as status rather than as a score to optimize.

**Why `workshop analyze` is advisory, not blocking.**
Brainstorm Q5. Hard-blocking `workshop facilitator phase set 9` risks live teaching incidents — the facilitator may need to override. Advisory surfaces the truth and lets the human own the call. That's the trust-boundary doctrine (`AGENTS.md:133-142`) applied correctly: verification as the boundary, human as the deciding authority.

**Why G reframes from glob-fix to pre-commit enforcement.**
Initial brainstorm proposed fixing `.copy-editor.yaml` globs. Research confirmed the globs are already correct (`.copy-editor.yaml:42-53`). Session friction (`8d806742`) still happened — so the gap isn't scope, it's invocation. `AGENTS.md:128` mandates running the audit pre-commit in prose. Pre-commit is where the rule lives as enforcement, and this is the trust-boundary-as-doctrine pattern applied to Czech copy.

**Why not standardize a session-state artifact.**
Brainstorm Q3. Two things were muddled: agent-native session state (Claude Code JSONL, `codex resume` — per-agent, not repo concerns) and cross-agent handoff notes (already named in `materials/coaching-codex.md:55-64`). The repo doesn't need a new scaffold for either; the prose advisory is sufficient until friction proves otherwise.

**Why archive, not delete.**
Workstream L sweeps 47 `complete` + 2 `superseded` plans out of `docs/plans/` root. "Garbage collection" framing is tempting but wrong here. The repo's doctrine (`docs/harness-doctrine.md`, `AGENTS.md:142`) is durable artifacts that match reality — deletion removes history, which is the opposite. Archival preserves the artifact, preserves git history, and still removes the noise from the default `ls`. Agents can still grep across `docs/plans/` + `docs/plans/archive/` when they need historical context. Every argument for "why keep this old plan" is satisfied by archive; the only thing archive removes is the ambient confusion of 47 done plans cohabiting with 10 live ones.

**Why the archive move must land in one commit (L4).**
A half-moved state is worse than the current mess. If some plans are in `archive/` and others are still in root, an agent sees inconsistency and cannot trust either location. One commit, one atomic move, one link-update pass. If the commit is too big to review in isolation, the plan is wrong — not the commit.

**Alternatives explicitly considered and rejected** (from brainstorm):
- Separate `docs/czech-voice.md` — duplicates `content/style-guide.md:149-173`.
- Separate handoff-gate doc — duplicates `day-structure.md:136-137`.
- Separate rubric doc — duplicates `agents-md-standard.md`.
- New `plans/handoffs/` directory — unproven friction.
- Commit cadence pre-push nudge — weak heuristics per Codex.
- Regen-race doctrine doc — no repo evidence.

## Constraints and Boundaries

- **Public template repo stays public-safe** (`AGENTS.md:153-155`). No facilitator credentials, no workshop-instance data, no Ondrej-specific paths.
- **Trunk-based development** (`AGENTS.md:88`). Each task above lands as a small, verified commit to `main`. No feature branch.
- **Progressive disclosure** (`AGENTS.md:90`). Nested `AGENTS.md` files supplement; they do not restate root content.
- **Language architecture**: English for dev-facing docs (all of this plan's scope), Czech rules apply only to `.copy-editor.yaml`-included surfaces (`AGENTS.md:77-79`).
- **Skill docs are English-canonical** (`docs/adr/2026-04-12-skill-docs-english-canonical.md`) — `workshop-skill/AGENTS.md` (task D4) must not invite Czech copy-audit.
- **`docs/agents-md-standard.md:56-67` five-section shape** is non-negotiable for all nested `AGENTS.md` files. Different shape = rejected.
- **No new participant-facing Czech strings in this plan**. If any added copy lands in Czech-scoped globs, it goes through copy-audit in the same commit.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| `harness-cli` has an existing test harness that can run the A4 regression | Unverified | Tasks A1/A4 depend on this; verify by reading `harness-cli/package.json` and existing test files before A1 lands |
| `bun` is available in the pre-commit environment for G1 | Unverified | Not documented anywhere in the repo; must degrade gracefully per G1 explicit wording |
| `copy-audit.ts` accepts a `--files` argument for file-scoped invocation | Unverified | Schema reference at `.copy-editor.yaml:9` points at `heart-of-gold-toolkit/plugins/marvin/skills/copy-editor/knowledge/config-schema.md`; verify before G1 lands or fall back to whole-repo invocation with grep filter |
| `heart-of-gold-toolkit` lives at `../heart-of-gold-toolkit/` relative to repo root on all machines that run pre-commit | Unverified | Implied by `AGENTS.md:128` invocation path; contributors may not have the toolkit installed; G1's graceful-degradation branch handles this |
| `workshop analyze` is currently a prose procedure, not an implemented command | Verified | `workshop-skill/analyze-checklist.md:1-23` is a markdown instruction doc, no implementation found in `harness-cli/` or `workshop-skill/` command surfaces |
| `workshop-skill/SKILL.md` is 263 lines post-split (Codex peer review claim) | Unverified | Codex peer-review claim from 2026-04-14; re-check by `wc -l workshop-skill/SKILL.md` before F1/F2 wording |
| `docs/harness-doctrine.md:39-47` contains the "when friction repeats, improve the harness" rule | Verified | Referenced directly in `AGENTS.md:91` |
| The 12 analyze-checklist items at `analyze-checklist.md:5-16` are the authoritative list | Verified | Directly read |
| Pre-rotation handoff gate at `day-structure.md:136-137` has exactly three minimums | Verified | Directly read |
| `docs/plans/` contains 67 plans as of 2026-04-14, with status distribution 43 `complete` / 4 `completed` / 10 `in_progress` / 3 `approved` / 2 `superseded` / 1 `captured` | Verified | Directly counted via `grep ^status: docs/plans/*.md \| sort \| uniq -c` |
| Two misfiled brainstorms exist in `docs/plans/` (`2026-04-06-brainstorm-workshop-skill-event-access-model.md` with `type: brainstorm`, `2026-04-12-brainstorm-workshop-agenda-content-review.md`) | Verified | Directly inspected frontmatter and body |
| The `one-canvas-*-notes.md` and `one-canvas-research-notes.md` files use `type: research` with a `for-plan:` field and should stay alongside their parent plan | Verified | Directly inspected `2026-04-13-one-canvas-e2e-migration-notes.md` frontmatter |
| `git mv` preserves history for the ~49 archived plans and the 2 relocated brainstorms | Verified | Standard git behavior |
| No inbound link from `dashboard/` or `harness-cli/` code to any plan file path that L4 would break | Unverified | L4 sub-step runs repo-wide grep before moving; risk is mitigated by pre-flight check, not by assumption |
| No `.github/` workflow or CI script hard-codes a path in `docs/plans/` that L4 would break | Unverified | Same pre-flight grep will catch this; if any hit exists, L4 pauses and fixes it before moving |
| The 10 `in_progress` plans are genuinely live and should remain in `plans/` root | Unverified | L2/L4 execution should eyeball each one — if any are stale-marked, flip to `complete` first and include in the archive move |

**Unverified assumptions become pre-task verification steps**: A1 verifies the test harness before the regression lands; G1 verifies `bun` availability, script path, and `--files` arg before writing the hook body; F2 verifies the current SKILL.md line count before updating any wording that references it.

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| G1 pre-commit check becomes noisy due to toolkit path not being available, and contributors start routinely using `--no-verify` — eroding the enforcement | Medium | High | Degrade gracefully (warn-only) when the script is unavailable; require `--no-verify` reason to name the specific finding (G2); review the hook for false-positive rate after one week |
| A1's `facilitator` option default flips behavior for any tooling that currently relies on unconditional facilitator install | Low | Medium | Grep the repo for call sites to `installWorkshopSkill` before A1 lands; document the behavior change in the commit message; add A4 regression test |
| Four new nested `AGENTS.md` files become drift targets — maintainers update root but forget nested | Medium | Medium | Add a line to `docs/agents-md-standard.md:92-106` ("Maintenance Triggers") naming the four nested files as co-maintained surfaces; `workshop analyze` treats a drift between root routing and nested existence as a FAIL check |
| Scoring appendix gets gamed despite binary form — checks become mechanical without signal | Low | Medium | Include explicit "known ways to game this" anti-list in F1; `workshop analyze` output surfaces the anti-list when FAIL findings cluster in one check |
| Expert audit status note (C1) itself goes stale if installer fix doesn't actually land | Low | High | C1 must land in the same commit as A1 or reference the specific commit SHA where A1 landed; explicit sequencing — A-before-C in the task order |
| `bun` not available in CI (for G1 integration test) | Medium | Low | CI check runs on `.copy-editor.yaml`-scoped diffs only; install bun in CI if not already present; otherwise the graceful-degradation branch handles it |
| Root `AGENTS.md` Task Routing update (D5) introduces broken internal links | Low | Low | Use repo-relative paths per `docs/agents-md-standard.md:113`; lint with existing link checker (verify one exists before D5 lands; add simple grep check otherwise) |
| `docs/harness-economics.md` vendor numbers drift and nobody re-verifies | Medium | Low | Explicit `last_verified` frontmatter makes staleness visible; analyze checklist could flag docs older than 6 months (future enhancement, not this plan) |
| L4 archive move breaks inbound links from `dashboard/`, tests, CI workflows, or rarely-grepped places | Medium | High | L4 task body mandates repo-wide grep BEFORE any move; pause-and-fix if any hit found; one-commit atomicity prevents half-moved state. Dry-run the move in a worktree first if scale looks risky. |
| L2 status normalization clobbers legitimate non-canonical values we didn't anticipate | Low | Medium | The only value to replace is `completed` → `complete`. Scripted replacement is scoped to that exact literal. Verify with `grep -h '^status:' docs/plans/*.md \| sort -u` before AND after. |
| A plan marked `in_progress` is actually stale and gets archived mid-stream | Low | Medium | L4 execution eyeballs each `in_progress` plan before skipping; if any look stale, flip their status first and include in the move. The 10 `in_progress` plans is a small enough set to scan manually. |
| `docs/plans/archive/` becomes the new dumping ground and grows unboundedly | Low | Low | Not this plan's problem to solve — archive is append-only by design. If it becomes genuinely unreadable, a future plan can introduce year-based subdirectories. Premature structure is worse than an unstructured archive. |

## Phased Implementation

**Phase 1 — P0 (doctrine violations in public surface).** Tasks A1–A4, B1, C1. Independently shippable. Exit criteria: all P0 acceptance criteria green; regression test passes; grep confirms map fix and audit annotation.

**Phase 2 — P1 (friction-backed enforcement).** Tasks D1–D5, F1–F2, G1–G2, K1–K2, L1–L6. Exit criteria: all P1 acceptance criteria green; `workshop analyze` on this repo produces PASS including the L5 checks. Ordering within P1: D independent; F before K (K uses F's scoring shape); G independent of F/K; **L1 before L2 before L3 before L4 before L5 (strict)** — the lifecycle standard must exist before any status normalization or archival moves, and L5 analyze checks must wait for the cleanup to be complete so they validate the end state rather than triggering on in-progress work. L3 (misfiled brainstorms) is independent of L2/L4 and can land anywhere after L1.

**Phase 3 — P2 (documentation completion).** Tasks H1–H2. Exit criteria: doc exists with dated frontmatter and three vendor citations; `content/codex-craft.md:59` links to it.

Phases can overlap where tasks are independent, but no phase is "done" until all its acceptance criteria are green.

## References

- Brainstorm: `docs/brainstorms/2026-04-14-harness-lab-doctrine-enforcement-brainstorm.md`
- Expert audit being annotated: `docs/reviews/2026-04-10-expert-panel-skills-cli-teaching-approach.md` (specifically lines 30, 36-46, 127-134, 334)
- Authoritative standards:
  - `docs/agents-md-standard.md` — shape rules, maintenance triggers, review checklist
  - `docs/harness-doctrine.md` — friction-to-encoding feedback loop
  - `docs/autonomous-planning-standard.md` — context file expectations
- Related plans (recent, same area):
  - `docs/plans/archive/2026-04-13-fix-czech-native-quality-audit-and-remediation-plan.md` — Czech quality work that G complements
  - `docs/plans/archive/2026-04-13-refactor-language-flip-and-czech-review-plan.md` — language architecture context
- Codex peer review (2026-04-14, `gpt-5.4`, high reasoning, read-only): flagged installer, repo map, and audit drift as the three outstanding issues in the brainstorm proposal list.
- Key code anchors verified during planning:
  - `harness-cli/src/skill-install.js:172-234` — `installWorkshopSkill` function; 195 and 244 are the unconditional facilitator install call sites
  - `harness-cli/src/run-cli.js:340-398` — `handleSkillInstall` flag parsing and UI output
  - `AGENTS.md:60-73,115-128` — root map, content pipeline, copy-audit prose
  - `workshop-skill/analyze-checklist.md:5-16,18-22` — 12-item checklist and prose output block
  - `workshop-blueprint/day-structure.md:136-137` — pre-rotation handoff gate
  - `.copy-editor.yaml:42-53` — Czech include globs (already correct)
  - `.husky/pre-commit` — current content-integrity enforcement
