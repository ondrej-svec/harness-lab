---
title: "feat: autonomous planning and hybrid harness hardening"
type: plan
date: 2026-04-09
status: complete
confidence: medium
---

# Autonomous Planning And Hybrid Harness Hardening Plan

Strengthen the existing `brainstorm -> plan -> work -> review -> compound` workflow so it remains autonomous for all non-trivial work, while becoming materially better at subjective, design-heavy, copy-heavy, and boundary-sensitive tasks through a hybrid of improved toolkit skills and stronger repo-native harness artifacts.

## Problem Statement

Harness Lab already has the right high-level workflow, but the current system does not reliably make autonomous execution safe for all non-trivial work.

The failure pattern is not that autonomy itself is wrong. The failure pattern is that the feedforward into autonomy is still too weak in several important cases:

- strategy and implementation structure are often captured, but the subjective contract is still under-specified
- plans are sometimes good enough for engineering direction but not good enough for autonomous UI, copy, or editorial execution
- repo-native doctrine exists, but repeated friction is still too often being corrected in chat instead of being encoded into durable harness
- the workflow lacks concrete preview artifacts for design-heavy work before implementation starts
- generic toolkit skills and repo-specific rules are both useful, but their current boundary is still too blurry

This repo therefore needs a stronger hybrid operating model:

- reusable workflow machinery belongs in the Heart of Gold toolkit
- durable repo truth belongs in Harness Lab
- autonomy should remain the default for non-trivial work only after the plan and harness meet a stronger standard

## Current State Review

What is already true:

- the repo doctrine already prefers feedforward first, sensors second, and harness improvement when friction repeats in [`docs/harness-doctrine.md`](../harness-doctrine.md)
- the repo already contains durable context surfaces such as [`AGENTS.md`](../../AGENTS.md), [`docs/internal-harness.md`](../internal-harness.md), [`docs/dashboard-design-system.md`](../dashboard-design-system.md), brainstorms, plans, ADRs, and solutions
- the working default flow already exists through Heart of Gold toolkit skills: `brainstorm`, `plan`, `work`, `review`, and `compound`
- the repo already contains some reusable solution docs and workflow memories, but coverage is still too thin for the kinds of drift we have seen repeatedly

What is not yet true:

- there is no explicit autonomous planning standard for this repo
- there is no shared rule for what a plan must contain before autonomous `work` is allowed to proceed
- there is no first-class preview step for design-heavy planning
- there is no clear split between what should be fixed in the toolkit versus what should be encoded in this repo
- there is no dedicated proving workflow that validates the improved method on one mixed UI+copy slice before broader adoption

## Proposed Solution

Treat this as a hybrid hardening effort across three coordinated tracks:

1. **Harness Lab track**
   Add repo-native doctrine, rubrics, examples, failure patterns, and checks that capture what is specific to this repo and this workshop.

2. **Toolkit track**
   Improve the generic Heart of Gold skills and add helper skills or sub-agents where the current workflow contract is too weak.

3. **Integration track**
   Prove the improved system on one real mixed UI+copy Harness Lab task, then upstream what generalizes and keep what is repo-specific local.

The core principle is strict:

- keep autonomous `work` for all non-trivial work
- strengthen the inputs to autonomous `work` rather than weakening autonomy itself
- require preview artifacts for design-heavy work before implementation starts
- make repo-native harness and toolkit skills reinforce each other instead of competing

## Detailed Plan Level

This is a **detailed** plan because it changes how future work in this repo should be prepared, executed, reviewed, and captured. It also spans both local repo doctrine and reusable toolkit workflow design.

## Autonomous Planning Standard

Before autonomous `work` starts on any non-trivial task, the plan should already make the next correct move obvious.

Every plan that authorizes autonomous work should be strong enough to survive:

1. **Problem clarity**
   The plan states the real problem, not just the requested surface change.
2. **Outcome clarity**
   The expected end state is concrete enough that another agent could tell whether it landed or drifted.
3. **Constraint clarity**
   Non-goals, boundaries, and architectural rules are explicit.
4. **Verification clarity**
   The acceptance criteria define the real trust boundary.
5. **Propagation discipline**
   If the task is pattern-based, the plan states whether to prove one slice first or roll broadly.
6. **Subjective contract clarity**
   For design, copy, IA, editorial, or workshop-method work, the plan includes explicit taste references, anti-references, and rejection criteria.
7. **Preview requirement**
   Design-heavy work must produce preview artifacts before autonomous implementation begins.

## New Planning Requirements For Subjective Work

For UI, copy, editorial, IA, presenter, participant-facing, or workshop-framing work, the plan must additionally contain:

- target outcome
- anti-goals
- references
- anti-references
- tone or taste rules
- a representative proof slice
- rollout or propagation rule
- explicit rejection criteria
- required preview artifacts such as HTML mockups, screenshot comps, structured wireframes, or terminal-friendly ASCII previews

These additions are not a separate workflow. They are an extension of the existing workflow so the same `brainstorm -> plan -> work -> review -> compound` loop can safely cover subjective work too.

## Implementation Tasks

- [x] Define the Harness Lab autonomous planning standard in repo-native doctrine.
  - Write the explicit standard for what authorizes autonomous `work` on non-trivial tasks.
  - Distinguish clearly between bounded engineering work and subjective work without creating separate primary workflows.
  - Define the minimum required sections for plans that are allowed to drive autonomous execution.

- [x] Add repo-native planning rubrics and feedforward artifacts.
  - Add a UI/UX planning rubric.
  - Add a Czech editorial and copy-quality planning rubric.
  - Add a public/private boundary planning rubric.
  - Add a release and handoff planning checklist.
  - Add examples of good and bad plan inputs from real Harness Lab work.

- [x] Define a preview-first contract for design-heavy planning.
  - Require at least one preview artifact before autonomous implementation begins on design-heavy tasks.
  - Support at minimum:
    - HTML preview or static mockup
    - terminal-friendly ASCII or structural preview
    - short design rationale tied to references and anti-references
  - Document when preview artifacts are required and when they are optional.

- [x] Improve the Heart of Gold toolkit workflow contracts.
  - Tighten `brainstorm` so it captures outcome, constraints, references, anti-references, and subjective rejection criteria when needed.
  - Tighten `plan` so it emits stronger feedforward for autonomous execution, especially around proof slices, rollout discipline, and preview requirements.
  - Keep `work` autonomous, but require it to respect stronger plan contracts rather than inferring missing subjective intent.
  - Tighten `review` so it checks plan adherence, not only implementation plausibility.
  - Tighten `compound` so repeated workflow friction becomes reusable doctrine or solution guidance.

- [x] Add helper skills or sub-agent roles that strengthen planning rather than replacing it.
  - Define a repo researcher role for past patterns, plans, and solutions.
  - Define a design critic role for preview artifacts and UI contract checking.
  - Define a copy critic role for Czech and participant-facing editorial review.
  - Define a boundary auditor role for auth, privacy, public/private, and release boundary checking.
  - Ensure these helpers feed `brainstorm` and `plan` rather than bypassing them.

- [x] Add an explicit harness split between toolkit truth and repo truth.
  - Document which rules belong upstream in Heart of Gold.
  - Document which rules belong in Harness Lab only.
  - Prevent generic toolkit skills from trying to own repo-specific doctrine that should live in this repository.

- [x] Create one real mixed UI+copy proving ground for the improved flow.
  - Pick a real Harness Lab slice that combines structure, UX, and language quality.
  - Run the strengthened `brainstorm -> plan -> work -> review -> compound` loop on that slice.
  - Require preview artifacts before `work`.
  - Compare the improved result against the prior workflow quality and rework rate.

- [x] Capture the resulting learnings and upstream what generalizes.
  - Keep repo-specific rubrics, examples, and rules here.
  - Upstream the generic workflow improvements into the Heart of Gold toolkit.
  - Record what should remain a Harness Lab-specific harness layer.

## Acceptance Criteria

- Harness Lab has a documented autonomous planning standard that is strong enough to guide all non-trivial work.
- The repo contains planning rubrics and feedforward artifacts for UI, copy, boundary-sensitive, and release-sensitive work.
- Design-heavy work has an explicit preview-first requirement before autonomous implementation starts.
- The Heart of Gold toolkit skills are improved so they better support autonomous work instead of relying on chat-only clarification.
- The improved flow is proven on one real mixed UI+copy Harness Lab slice.
- The split between toolkit-level workflow machinery and Harness Lab repo-specific doctrine is explicit.
- The final system preserves the same primary workflow: `brainstorm -> plan -> work -> review -> compound`.
- Repeated friction is more likely to become repo-native harness or toolkit improvements than repeated session-level correction.

## Decision Rationale

### Why keep autonomous work

Autonomy is not the problem. Weak feedforward is the problem.

If autonomous work is weakened, the repo loses one of the main behaviors it is trying to teach. Harness Lab should model strong autonomous execution backed by strong context, strong checks, and strong review.

### Why use a hybrid model

Generic workflow improvements belong in the toolkit, but repo-specific truth belongs here.

If too much intelligence lives only in the repo, the workflow becomes less reusable.

If too much intelligence lives only in the toolkit, the workflow becomes too generic and will keep missing Harness Lab-specific expectations.

The hybrid model keeps durable repo truth in this repository while improving the reusable workflow that operates on that truth.

### Why require preview artifacts

For design-heavy work, prose alone is too lossy.

Preview artifacts provide a concrete alignment surface before implementation. They reduce the chance that the plan is structurally correct but visually or editorially wrong.

### Why prove the method on a mixed UI+copy slice

Our highest-friction failures have usually happened at the boundary between structure, UX, and language. A mixed proving ground tests the real weakness instead of only the easiest case.

## Assumptions

| Assumption | Status | Evidence |
| --- | --- | --- |
| The existing `brainstorm -> plan -> work -> review -> compound` flow is worth preserving | Verified | It is already the repo’s preferred method and matches the workshop teaching model |
| The main issue is weak feedforward into autonomous work, not autonomy itself | Verified | Repeated rework has mostly followed under-specified plans, subjective drift, and late clarifications |
| Harness Lab-specific doctrine should live in the repo rather than only in generic toolkit skills | Verified | [`AGENTS.md`](../../AGENTS.md), [`docs/internal-harness.md`](../internal-harness.md), and [`docs/harness-doctrine.md`](../harness-doctrine.md) already establish repo-native operating truth |
| Generic workflow improvements should still be reusable outside this repo | Verified | The Heart of Gold toolkit is intended as reusable workflow machinery rather than a Harness Lab-only system |
| Preview artifacts will materially improve alignment for design-heavy work | Mostly verified | Prior work has shown repeated drift where prose-only planning did not sufficiently constrain design execution |
| One mixed UI+copy proving ground is enough to validate the improved flow before broader rollout | Unverified | It is the right first test, but may expose additional missing harness layers after the first run |

## Risk Analysis

### Risk: We create too much process overhead

If the new standard becomes ceremony, people will bypass it.

Mitigation:

- keep one primary workflow
- add only the minimum new sections and rubrics that materially reduce drift
- require richer planning only for non-trivial work

### Risk: Toolkit and repo responsibilities stay blurry

If the same rule lives in both places, it will diverge.

Mitigation:

- explicitly define upstreamable versus repo-specific rules
- use Harness Lab as the proving ground before upstreaming generic parts

### Risk: Preview requirements become performative

If preview artifacts are low-quality or disconnected from implementation, they add cost without reducing drift.

Mitigation:

- require previews to tie back to references, anti-references, and rejection criteria
- use preview review as a real gate before implementation

### Risk: We improve planning documents but not actual execution behavior

If skills and agents ignore the stronger contracts, the plan improvements will not matter.

Mitigation:

- update toolkit skills and helper agents alongside repo doctrine
- ensure `review` checks plan adherence and not just final code

### Risk: The first proving ground is too narrow

If the proving slice is too easy, the new system may look successful without solving the real problem.

Mitigation:

- use a mixed UI+copy slice
- choose a real Harness Lab surface where structure, design, and language interact

## Phased Implementation

## Phase 0: Failure Taxonomy And Standards

Goal: define exactly what failed in past work and what a plan must now guarantee before autonomous execution.

Tasks:

- [x] extract a small failure taxonomy from prior Harness Lab sessions
- [x] write the autonomous planning standard
- [x] define the stronger plan contract for subjective work

Exit criteria:

- the repo has a written standard for when autonomous `work` is authorized
- the known drift categories are named instead of vaguely remembered

## Phase 1: Repo-Native Feedforward

Goal: make Harness Lab-specific guidance durable and easy for skills and humans to consume.

Tasks:

- [x] add planning rubrics
- [x] add examples and anti-examples
- [x] add preview-first guidance
- [x] add handoff and release planning checklists

Exit criteria:

- the repo contains concrete planning harness for the main failure domains
- future sessions do not need to restate the same repo-specific expectations from scratch

## Phase 2: Toolkit Hardening

Goal: improve the generic workflow machinery so it can consume stronger contracts and produce better feedforward.

Tasks:

- [x] update `brainstorm`
- [x] update `plan`
- [x] update `review`
- [x] update `compound`
- [x] add helper skills or sub-agent roles where justified

Exit criteria:

- the generic toolkit supports stronger planning for non-trivial work
- repo-specific rules are not hardcoded into generic skills

## Phase 3: Mixed Proving Ground

Goal: prove the improved hybrid system on one real Harness Lab task.

Tasks:

- [x] choose the proving slice
- [x] require preview artifacts
- [x] run the full strengthened workflow
- [x] compare rework and clarity against the prior baseline

Exit criteria:

- one real slice demonstrates the improved flow end to end
- remaining gaps are concrete and named

## Phase 4: Upstream And Stabilize

Goal: turn the proof into a durable operating improvement.

Tasks:

- [x] upstream generic improvements into Heart of Gold
- [x] keep Harness Lab-specific doctrine local
- [x] capture learnings in `compound` or repo-native context docs

Exit criteria:

- the toolkit and repo each own the right layer
- the improved workflow is reusable and locally grounded

## References

- [`AGENTS.md`](../../AGENTS.md)
- [`docs/internal-harness.md`](../internal-harness.md)
- [`docs/harness-doctrine.md`](../harness-doctrine.md)
- [`docs/autonomous-planning-standard.md`](../autonomous-planning-standard.md)
- [`docs/planning-rubrics.md`](../planning-rubrics.md)
- [`docs/planning-helper-roles.md`](../planning-helper-roles.md)
- [`docs/hybrid-harness-split.md`](../hybrid-harness-split.md)
- [`docs/autonomous-planning-examples.md`](../autonomous-planning-examples.md)
- [`docs/autonomous-planning-proving-ground.md`](../autonomous-planning-proving-ground.md)
- [`docs/dashboard-design-system.md`](../dashboard-design-system.md)
- [`docs/solutions/frontend/dashboard-theme-aware-surface-discipline.md`](../solutions/frontend/dashboard-theme-aware-surface-discipline.md)
- [`docs/solutions/testing/facilitator-playwright-visual-regression-stability.md`](../solutions/testing/facilitator-playwright-visual-regression-stability.md)
- [`docs/brainstorms/2026-04-07-facilitator-cockpit-ia-and-ux-redesign-brainstorm.md`](../brainstorms/2026-04-07-facilitator-cockpit-ia-and-ux-redesign-brainstorm.md)
- [`docs/brainstorms/2026-04-07-public-homepage-copy-brainstorm.md`](../brainstorms/2026-04-07-public-homepage-copy-brainstorm.md)
- [`docs/brainstorms/2026-04-08-facilitator-presenter-rich-content-redesign-brainstorm.md`](../brainstorms/2026-04-08-facilitator-presenter-rich-content-redesign-brainstorm.md)
- [`docs/brainstorms/2026-04-08-facilitator-room-screen-and-presenter-flow-brainstorm.md`](../brainstorms/2026-04-08-facilitator-room-screen-and-presenter-flow-brainstorm.md)
