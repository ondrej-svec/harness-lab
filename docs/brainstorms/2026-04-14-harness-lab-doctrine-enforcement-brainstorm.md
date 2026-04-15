---
title: "Harness Lab doctrine enforcement pass"
type: brainstorm
date: 2026-04-14
participants: [ondrej, claude-opus-4-6, gpt-5.4]
related:
  - docs/reviews/2026-04-10-expert-panel-skills-cli-teaching-approach.md
  - docs/agents-md-standard.md
  - docs/harness-doctrine.md
  - docs/autonomous-planning-standard.md
  - AGENTS.md
---

# Harness Lab doctrine enforcement pass

## Problem Statement

Harness Lab teaches harness engineering. Its **documentation** embodies the doctrine well. Its **tooling** does not yet — several rules that live as prose still ship as bugs, wrong globs, or unsplit installers. The continuation-shift eval and `workshop analyze` depend on these rules actually firing; right now they silently don't.

The goal of this pass is not to add more doctrine. It is to make the repo's existing doctrine *enforced* where friction evidence justifies it, and honestly *advisory* where it doesn't.

## Context

Inputs to this brainstorm:

- Meta-analysis of 15 recent Claude Code sessions in this repo — surfaced recurring friction (installer auto-installs facilitator skill, copy-editor doesn't auto-invoke, session re-reads due to path casing, Czech voice corrections, commit-cadence drift).
- Peer review of proposals by Codex (`gpt-5.4`, read-only, high reasoning) — verified claims against repo state, rejected several doctrine-dup proposals, and surfaced three I missed.
- The repo's own `docs/reviews/2026-04-10-expert-panel-skills-cli-teaching-approach.md` expert audit — still authoritative for the direction of travel, but partially stale (claims 390-line unsplit SKILL.md state).
- `docs/harness-doctrine.md:39-47`: *"When the same issue happens repeatedly, improve the harness."* This pass applies that rule to the repo itself.

Key reframe: **the gap is prose → enforcement, and only for friction-backed rules.** Aspirational doctrine stays advisory; friction-backed doctrine gets teeth.

## Chosen Approach

A single pass with three priority tiers, scoped to items with either direct session friction or direct citation in the repo's own standards. Each item is either a doctrine violation to fix, or existing doctrine to scaffold — never a new parallel doctrine doc.

### P0 — doctrine violations in shipped code

- **A. Installer participant/facilitator split.** `harness-cli` stops auto-installing `workshop-facilitator` on the participant path. New UX: `harness skill install` installs participant only; `harness skill install --facilitator` installs both. *Evidence: `harness-cli/src/skill-install.js:243-245,279-318`, `harness-cli/src/run-cli.js:356-375`. Progressive-disclosure violation in shipped code even though SKILL.md itself has split.*
- **B. Root AGENTS.md repo map.** Add `workshop-content/` to the map block. *Evidence: `AGENTS.md:60-73` omits it; `AGENTS.md:115-119`, `.copy-editor.yaml:45`, and `scripts/content/generate-views.ts:285` prove it's central to the pipeline. Doctrine: the map must match reality.*
- **C. Stale expert audit annotation.** Add a 2-line "partially superseded 2026-04-14" note near `docs/reviews/2026-04-10-expert-panel-skills-cli-teaching-approach.md:40` so the next reviewer isn't misled into thinking SKILL.md is still 390 lines. *Evidence: audit predates the skill split; durable artifacts must match reality.*

### P1 — friction-backed enforcement

- **D. Nested AGENTS.md** for `dashboard/`, `workshop-content/`, `harness-cli/`, `workshop-skill/`. Each is routing-only. **Shape rule instead of numeric cap**: five sections only — Mission (one line), Read First, Task Routing, Verification Boundary, Done Criteria. If a subtree needs more, it needs its own doc, not a bigger AGENTS.md. *Evidence: `docs/agents-md-standard.md:45-55` mandates narrower local guidance when a surface keeps needing special instructions.*
- **F. AGENTS.md scoring appendix** inside existing `docs/agents-md-standard.md`. **Binary pass/fail with notes**, not a 5-point ladder (Codex warned scoring gets gamed). `workshop analyze` command uses the same checks so the rubric is teachable and testable. *Evidence: `analyze-checklist.md:5-16` already holds the qualitative review; `agents-md-standard.md:34-43,107-118` already names failure modes.*
- **G. Fix `.copy-editor.yaml` globs** to real paths — `workshop-content/agenda.json` and `content/talks/locales/cs/**/*.md`. No new `docs/czech-voice.md`; doctrine already lives in `content/style-guide.md:149-173` and `content/czech-editorial-review-checklist.md:36-41,92-109`. Repairing the wiring is the whole move. *Evidence: session 8d806742 — three consecutive Czech corrections that the copy-editor should have pre-empted.*
- **K. Handoff gate as advisory report in `workshop analyze`.** Do not duplicate `workshop-blueprint/day-structure.md:136-138`; wire its checklist into `workshop analyze` so the facilitator gets a machine-readable report (PASS/FAIL per check) before Phase 9 rotation. Advisory, not blocking — the facilitator still owns the call. *Evidence: `docs/reviews/2026-04-10-expert-panel-skills-cli-teaching-approach.md:334` — "continuation shift's learning value is hostage to Build Phase 1 execution quality".*

### P2 — documentation only, no enforcement

- **H. `docs/harness-economics.md`** — a dated "last verified 2026-04-14" table with vendor links covering Codex `project_doc_max_bytes = 32 KiB`, Claude prompt-cache 5-minute TTL, and how to measure context budget. Linked from `content/codex-craft.md:59`. No linter, no check — pure prose. *Rationale: no session evidence of cost/cache friction in this repo; H exists to complete the principle, not enforce it. Staleness risk is why Codex said "dated table, not frozen spec".*

## Why This Approach

**Friction-backed enforcement as the filter.** The repo's own `docs/harness-doctrine.md:39-47` rule says to improve the harness when the same friction repeats. The inverse is equally important: if friction hasn't repeated, don't manufacture enforcement for aspirational rules. Over-enforcement produces false positives that erode trust in the enforcements you care about (scoring theatre, phantom failure modes).

**Strengthen existing doctrine, don't parallel it.** Every proposal that added a new doctrine doc (czech-voice.md, session-state-standard.md as a new file, separate handoff-gate doc, new rubric doc) was rejected or folded into an existing file. Codex flagged this four separate times. The repo already says what it believes; the move is to either wire the belief to a check or link it from a map, never to re-state it.

**Three-tier priority aligned to evidence, not effort.** P0 is "shipped code contradicts shipped doctrine" — fix first because it's the doctrine-violation-in-public case. P1 is "shipped doctrine is unenforced and friction has paid the price" — fix second because evidence justifies the spend. P2 is "principle is real but friction hasn't validated it yet" — document honestly, don't enforce.

## Subjective Contract

- **Target outcome**: after this pass, `workshop analyze` produces a machine-readable PASS/FAIL report for any clone, the installer respects participant/facilitator split by default, and every subtree with special concerns has a 5-section AGENTS.md that a cold reader can act on.
- **Anti-goals**: no new parallel doctrine docs; no scoring rubric that invites gaming; no hard blocking on commit cadence or phase transitions; no doctrine written for friction that hasn't happened.
- **References**: the repo's own root `AGENTS.md` as the shape to mirror; `docs/agents-md-standard.md:45-55` as the mandate; `docs/harness-doctrine.md:39-47` as the filter.
- **Anti-references**: encyclopedia-style AGENTS.md; 5-point grading ladders; session-state files that duplicate agent-native resume; commit-cadence heuristics that punish offline work.
- **Rejection criteria**: if a nested AGENTS.md exceeds its 5-section shape, reject. If the scoring rubric produces a score rather than PASS/FAIL+notes, reject. If a new parallel doctrine doc sneaks in, reject.

## Key Design Decisions

### Q1: Installer UX — RESOLVED
**Decision:** Explicit `--facilitator` flag on `harness skill install`. Default is participant-only.
**Rationale:** One command surface, discoverable via `--help`, trivial to document, no hidden state. Matches trunk-based simplicity doctrine.
**Alternatives considered:**
- *Separate command* (`harness facilitator bootstrap`): forces intent but splits the mental model of "install a skill" across two commands.
- *Auth-gated detection*: clever but adds magic. Detection failures become silent doctrine violations.

### Q2: Nested AGENTS.md size ceiling — RESOLVED
**Decision:** No numeric cap. Shape rule: exactly five sections — Mission (one line), Read First, Task Routing, Verification Boundary, Done Criteria.
**Rationale:** A shape rule can't be gamed the way a size rule can (one 1999-byte paragraph is not better than six 400-byte sections). Section names match the root AGENTS.md template so there's one mental model for the whole repo.
**Alternatives considered:**
- *Hard 2 KB cap*: clean but fights real subtree needs.
- *Soft 4 KB cap*: too permissive; manuals creep back in under 4 KB.

### Q3: Session-state / handoff artifact — RESOLVED (dropped)
**Decision:** Drop E. The repo does not need a new "session state" convention. Agent-native session state (Claude Code JSONL, `codex resume`, Cursor chat history) handles within-agent continuity; the continuation-shift eval already implies a handoff note but it lives as prose in `materials/coaching-codex.md:55-64`, which is sufficient advisory.
**Rationale:** The earlier proposal muddled two genuinely different things — per-agent session resume (not a repo concern) and cross-agent handoff notes (already named in prose). Neither needs a new file or template in this pass.
**Alternatives considered:**
- *Standardize in `plans/handoffs/`*: name was clean but the concept isn't yet friction-backed enough in recent sessions to justify a scaffold.
- *Research how other repos handle this*: may still be worth doing at some point, but not in scope here.

### Q4: Rubric granularity — RESOLVED
**Decision:** Binary **PASS/FAIL with notes**.
**Rationale:** Ungameable. Either a check passes or it doesn't; notes capture the nuance. Matches how `workshop analyze` already structures output.
**Alternatives considered:**
- *3-point red/yellow/green*: close second; slightly more nuance but yellow is where grade inflation happens.
- *5-point A–F*: Codex explicitly warned against this.

### Q5: Handoff gate enforcement location — RESOLVED
**Decision:** `workshop analyze` as an **advisory report**. The facilitator reads it and decides whether to advance.
**Rationale:** Hard-blocking `workshop facilitator phase set 9` risks teaching-time incidents — the facilitator may need to override. Advisory surfaces the truth and lets the human own the call, which is the trust-boundary doctrine applied correctly.
**Alternatives considered:**
- *Hard block on phase set*: too rigid for live workshop use.
- *Both advisory + hard block*: doubles implementation cost without a clear teaching win.

### Q6: Regen race investigation — RESOLVED (deferred)
**Decision:** Defer entirely. Single-session evidence (`63febbda`) is not enough to justify investigation or doctrine.
**Rationale:** Codex found zero repo evidence of a background writer — content generation is explicit (`dashboard/package.json:9,18-20`), hooks only run on git events. Writing doctrine for a phantom failure mode would teach the wrong thing. Revisit only if it recurs.
**Alternatives considered:**
- *Static grep for watchers*: cheap but may chase red herrings.
- *Live `fs_usage` during repro*: reliable but expensive without a repro case.

## Open Questions

1. **How does `workshop analyze` currently implement checks?** — Read `workshop-skill/analyze-checklist.md` and any command impl before F/K are planned, to avoid duplicating the check engine.
2. **Which subtree gets the nested AGENTS.md first?** — Likely `workshop-content/` (biggest teaching surface, clearest routing need) but wants a /plan pass.
3. **Does `harness-cli` have tests that cover the installer path?** — Installer change in A needs a regression test; if no harness exists, that's a sub-task.
4. **What does a PASS/FAIL output look like to a non-technical facilitator?** — UX pass on the report format before F lands.

## Out of Scope

- `~/.claude/`, `~/.codex/`, or any personal harness outside this repo.
- New voice, tone, or style docs. `content/style-guide.md` and `content/czech-editorial-review-checklist.md` are the sources of truth.
- Dashboard design system changes.
- Commit cadence enforcement (dropped — Codex correctly rejected the heuristics).
- Separate handoff-gate doc, separate czech-voice doc, separate rubric doc, separate session-state standard — all rejected as parallel doctrine.
- Regen race doctrine — deferred pending evidence.

## Next Steps

- `/plan` on this brainstorm to sequence P0 → P1 → P2 with concrete file targets and acceptance criteria.
- Consider `/compound` after A lands — the "doctrine-in-docs vs doctrine-in-tools" reframe is a novel pattern worth capturing for future harness work.
