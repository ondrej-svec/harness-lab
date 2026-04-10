---
title: "Expert Panel Remediation — Way Forward"
type: brainstorm
date: 2026-04-10
participants: [Ondrej, Claude]
related:
  - docs/reviews/2026-04-10-expert-panel-skills-cli-teaching-approach.md
  - docs/plans/2026-04-10-refactor-unified-bilingual-content-model-plan.md
  - docs/adr/2026-04-10-unified-bilingual-content-model.md
---

# Expert Panel Remediation — Way Forward

## Problem Statement

The expert panel review (6 frameworks, 15 prioritized actions) identified structural and content improvements to Harness Lab's teaching approach, skill system, and CLI. The repo is going public and will be reviewed by the CTO of the company commissioning the hackathons, plus other business stakeholders, next week. The first cohort runs ~2 weeks out.

The question is not "what to fix" (the panel answered that) but **how to sequence the work to be CTO-reviewable in ~5 days and cohort-ready in ~2 weeks.**

## Context

### What the panel found (summary)

- **Unanimously praised:** The continuation shift (rotation) — all 6 frameworks validated it independently
- **Unanimously flagged:** The 30+ command participant skill surface — 4/6 frameworks identified it as the primary cognitive overload risk
- **Strong signal (3+ frameworks):** Skill split, challenge card stories/triage, follow-up restructuring, participant-executable failure experience, talk restructure, habit Anchors
- **Already strong (don't change):** codex-craft.md, coaching codex five questions, skill-install.js error handling, AGENTS.md standard, three-layer resource model, harness-doctrine, north-star question

### What's already done

- Bilingual content model: complete (7-phase migration, all phases done). English canonical for structured content, Czech at root for delivery, English in `locales/en/` for reference. No language work needed.
- Harness-doctrine, autonomous-planning-standard, AGENTS.md standard: all strong, panel said don't touch.
- CLI error handling and skill-install mechanics: production-grade, panel praised.

### Constraints

- **Reviewable by next week** — CTO and business stakeholders will browse the public repo
- **Brilliant by cohort** — ~2 weeks out
- **Bilingual architecture is settled** — structural/pedagogical changes apply to both locales
- **Ondrej can run parallel work streams** — no single-threaded bottleneck

## Chosen Approach

**Single-pass waves, sequenced by structural dependency.** Three waves over ~5 days, grouped so that foundation work (wave 1) enables content work (wave 2), which enables depth work (wave 3). Each file touched once, both locales updated in the same pass where applicable.

## Why This Approach

The alternative approaches — "flip language first, then improve" or "improve first, then translate" — were considered and rejected because:
- The bilingual architecture is already complete, so there is no language flip to do
- Content changes are structural/pedagogical, not language-dependent
- The skill split is a structural prerequisite for content changes (no point restructuring a 390-line file that's about to be split)
- Wave sequencing matches reviewer attention: a CTO sees the skill surface first, content second, operational depth third

## Key Design Decisions

### Q1: Wave 1 — Structural foundation (days 1–2) — RESOLVED

**Decision:** Start with the participant/facilitator skill split, CLI progressive disclosure, and language routing fix.

**Rationale:** Four frameworks converged on the skill split as the highest-priority structural change. The 390-line SKILL.md loaded on every invocation is both a cognitive load problem (participants see 30+ commands) and a context budget problem (agent loads facilitator commands unnecessarily). Splitting first means all subsequent content edits happen on the right file. The CLI `--help` progressive disclosure and language routing fix are low-effort and high-visibility for a reviewer trying the tool.

**What this includes:**
1. Split `workshop-skill/SKILL.md` into participant-only and facilitator-only surfaces
2. Make `$workshop commands` return a 5-item participant menu (orientation, brief, template, help, analyze)
3. Add `harness skill --help` sub-command showing only the participant path
4. Add a "stop here if you're a participant" break in `harness-cli/README.md`
5. Fix language routing: English fallback when no live `contentLang` is set
6. Consider adding `harness skill verify` post-install check

**Alternatives considered:** Starting with content changes first — rejected because editing a file that's about to be split means double work.

### Q2: Wave 2 — Content quality (days 2–4) — RESOLVED

**Decision:** Restructure the teaching content for pedagogical quality, applying the panel's narrative, learning-design, and behavioral-change findings.

**Rationale:** These are the files a reviewer reads. The panel's strongest content findings (talk inversion, flat challenge cards, missing habit Anchors, buried coaching codex reset questions) are all low-to-medium effort changes that dramatically improve the perceived quality and intellectual rigor of the teaching approach.

**What this includes:**
1. **Talk restructure** (`content/talks/context-is-king.md`): Lead with micro-exercise, move thesis to close. Apply to both Czech root and English locale.
2. **Challenge cards** (`content/challenge-cards/deck.md`): Add difficulty triage block at top, rewrite cards to open with recognizable situations before directives, organize around the five habits. Both locales.
3. **Coaching codex** (`materials/coaching-codex.md`): Move three reset questions to the top as meta-skill, keep five pre-implementation questions as subordinate protocol.
4. **Habit Anchors** (`workshop-blueprint/teaching-spine.md`, `materials/participant-resource-kit.md`): Add one Anchor sentence per habit naming the Monday trigger moment.
5. **Follow-up package** (`workshop-skill/follow-up-package.md`): Sticky-note commitment as opening anchor, single 48h action, replace yes/no checks with generation prompts.
6. **Participant failure exercise**: Surface the micro-exercise from the talk through `$workshop help` during Build Phase 1.

**Alternatives considered:** Doing depth work (wave 3) before content polish — rejected because a reviewer reads content, not operational ADRs.

### Q3: Wave 3 — Depth and operational quality (days 4–5) — RESOLVED

**Decision:** Add operational infrastructure that makes the first cohort stronger: eval instrumentation, handoff gates, adoption support.

**Rationale:** These are less visible to a repo browser but critical for cohort success. The panel flagged them at moderate signal (2 frameworks each) but they address real operational gaps: the rotation's learning value depends on Build Phase 1 quality (handoff gate), cross-cohort learning depends on consistent tagging (seed tags), and Monday adoption depends on organizational context (adoption negotiation).

**What this includes:**
1. **Session-state artifact standard** — lightweight progress-state note alongside AGENTS.md
2. **Intermezzo retrieval prompts** — cold generation exercises at both intermezzos
3. **Continuation shift seed tags** — 5–8 tags from existing failure taxonomy
4. **Minimum viable handoff gate** — enforced checkpoint before rotation
5. **Adoption negotiation section** in participant resource kit
6. **Surface harness-doctrine feedback loop as 6th habit**

**Alternatives considered:** Deferring all of wave 3 to post-review — rejected because the handoff gate and retrieval prompts directly affect cohort quality, and they're low effort.

### Q4: What to explicitly NOT do — RESOLVED

**Decision:** Preserve the elements the panel defended. Do not touch:

- The continuation shift design (the masterpiece)
- codex-craft.md (the best teaching document)
- The north-star question ("Does the repo speak for itself?")
- The coaching codex's five pre-implementation questions (sequence is correct)
- skill-install.js error handling (production-grade)
- The AGENTS.md standard (technically sound)
- The three-layer resource model
- The bilingual architecture (just completed)

**Rationale:** Six frameworks independently validated these. Changing them risks breaking what works.

## Assumption Audit

| Assumption | Status | Evidence |
|---|---|---|
| Skill split is the right foundation move | Bedrock | 4/6 frameworks converged; structural prerequisite for content edits |
| Content changes apply equally to both locales | Bedrock | Changes are structural/pedagogical, not language-dependent |
| Wave 3 items are less visible to CTO reviewer | Mostly bedrock | Operational docs, not public-facing doctrine; one caveat: doctrine docs ARE visible but panel says don't change them |
| ~5 days is sufficient for all three waves | Unverified | Depends on complexity of skill split and challenge card rewrite — user confirmed comfort with parallel work |

## Open Questions

1. **Skill split granularity:** Should the facilitator skill be a completely separate SKILL.md file, or a section that loads conditionally on `workshop facilitator login`? The former is cleaner architecturally; the latter may be simpler to implement.

2. **Challenge card format:** The panel recommends micro-stories. How much narrative is appropriate for a printed card format? Need to balance vividness with card real estate.

3. **Adoption negotiation tone:** The panel recommends "language for when a colleague asks why are we doing this." This is sensitive territory — it needs to empower without being adversarial toward the participant's organization.

4. **Handoff gate enforcement:** Should the facilitator hard-block rotation for teams that don't meet the minimum, or is it a strong nudge with facilitator judgment?

5. **6th habit naming:** The harness-doctrine feedback loop ("repeated pain becomes a better artifact") needs a pithy name that matches the five existing habits' style.

## Out of Scope

- Dashboard changes (separate work stream, not blocking review or cohort)
- Presenter/scene richness system (separate brainstorm exists)
- New project briefs or additional challenge cards beyond restructuring existing ones
- CLI feature additions beyond progressive disclosure and skill verify
- Any changes to the bilingual architecture (just completed, settled)

## Next Steps

- `/plan` to create detailed implementation plan with file-level tasks for each wave
- The plan should include specific acceptance criteria per task so progress is measurable
- Consider running `/review` on the completed work before the CTO review
