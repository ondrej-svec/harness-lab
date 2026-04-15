# Framework Panel Review: Harness Lab — Skills, CLI, and Teaching Approach

**Date:** 2026-04-10
**Scope:** Expert audit of how Harness Lab teaches harness engineering through skills, CLI, and workshop structure
**Requested focus:** How participants learn to work with coding agents; how the skill system and CLI support that learning

## Status Update (2026-04-14)

This audit is preserved as-authored. Two specific claims below have been partially resolved since the review and are noted here so the next reader is not misled:

- **Recommendation #1 ("participant command surface is too large and must be structurally separated from the facilitator surface", lines 36-46).** The structural split of `workshop-skill/SKILL.md` into `SKILL.md` (participant) and `SKILL-facilitator.md` has landed. `SKILL.md` is now 263 lines. However, the installer fix that line 46 called out as an accompanying file target (`harness-cli/src/run-cli.js` and implicitly `harness-cli/src/skill-install.js`) was not part of that initial split — `harness skill install` continued to auto-install the facilitator skill on every participant path until 2026-04-14.
- **Resolution.** The installer gap is closed by `docs/plans/2026-04-14-chore-harness-lab-doctrine-enforcement-pass-plan.md` (workstream A). As of that plan's P0 phase, `harness skill install` installs the participant skill only by default; `harness skill install --facilitator` is the opt-in path for facilitator machines. Regression coverage lives in `harness-cli/test/run-cli.test.js`.

Other recommendations (challenge card scaffolding, skill docs canonicalization, etc.) may or may not be current — verify against the repo before acting on any specific claim older than this note.

## Panel Composition

| Framework | Grounding | Focus |
|---|---|---|
| Learning Design | Tier 2: Newport (Deep Work), Ng (pedagogy), Kornell & Bjork (retrieval practice) | Cognitive load, attention limits, practice installation |
| Agent Engineering | Tier 2: Anthropic engineering blog, OpenAI harness engineering, AAAI 2025 goal drift | Harness precision, eval methodology, agent failure modes |
| Tool Craft | Tier 2: Willison (prompt transparency), Diátaxis framework | CLI affordances, concrete examples, progressive disclosure |
| Behavioral Change | Tier 2: Fogg (Tiny Habits), Clear (Atomic Habits), Dignan (Brave New Work) | Habit installation, operating model transfer, environment design |
| Practitioner Reality | Tier 2: Orosz (Pragmatic Engineer), arxiv AGENTS.md studies, hackathon learning research | Monday morning survivability, adoption barriers, hype detection |
| Narrative Craft | Tier 2: Duarte (Resonate), Diátaxis, pedagogy-of-presenting research | Story arc, contrast structure, show-before-tell |

## Honesty Note

This review applies named analytical frameworks to the target content. It does not represent the personal opinions of any named author. Findings are traceable to specific published concepts cited in each lens's grounding section. All six lenses operated at Tier 2 (web-sourced publications). No user-provided reference material was supplied.

---

## Headline Finding

**The workshop's strongest design element — the continuation shift — is unanimously praised across all six frameworks. Its weakest element — the participant-facing command surface — is flagged by four of six frameworks as a cognitive overload risk that undermines the very learning the day is designed to produce.**

The continuation shift (team rotation at 13:30) is structurally the best single pedagogical, behavioral, and narrative move in the workshop. It forces retrieval practice at workflow scale, creates a genuine behavior-change moment through environment design, functions as a real eval harness, and serves as the narrative crisis/reversal that makes the day a story rather than an agenda. All six frameworks independently validated this.

Meanwhile, the 30+ command skill surface and 20-command CLI are simultaneously praised as well-engineered operational systems and identified as the primary source of extraneous cognitive load for participants on day one. The skill is a product; participants need a teaching interface. This tension runs through every framework's findings.

---

## Where the Panel Converged (Strong Signal)

### 1. The participant command surface is too large and must be structurally separated from the facilitator surface

**Frameworks:** Learning Design, Agent Engineering, Tool Craft, Practitioner Reality (4/6)
**Grounding:** Cognitive load theory (Sweller), context rot (Anthropic engineering blog), progressive disclosure (Diátaxis), adoption-gap paradox (Orosz/Faros AI research)
**Why it matters:** A participant who runs `$workshop commands` and receives 30+ options is less oriented, not more. The SKILL.md is 390 lines loaded in full on every invocation, costing context budget on every participant turn. The CLI `--help` surfaces 20 commands when participants need exactly one (`harness skill install`). The facilitator command definitions in participant context create a trust-boundary leak. Every unused command in the skill is extraneous cognitive load during the day's highest-intrinsic-load moments.
**Recommended action:**
- Split `workshop-skill/SKILL.md` into participant-only and facilitator-only surfaces. Load facilitator skill only on `workshop facilitator login`.
- Make `$workshop commands` return a 5-item participant menu (orientation, brief, template, help, analyze), not the full 30+ command tree.
- Add `harness skill --help` sub-command showing only the participant path.
- Add a visual "stop here if you're a participant" break in `harness-cli/README.md`.
**Files:** `workshop-skill/SKILL.md`, `harness-cli/src/run-cli.js` (printUsage), `harness-cli/README.md`
**Effort:** Medium (structural split, not a rewrite)

### 2. Challenge cards need scaffolding, stories, and difficulty triage — not flat instructions

**Frameworks:** Learning Design, Narrative Craft, Behavioral Change, Practitioner Reality (4/6)
**Grounding:** Cognitive load scaffolding gradient (Sweller), pedagogy-of-presenting (Yatteau), environment-design principle (Clear), practitioner skepticism (Orosz)
**Why it matters:** The cards are currently imperative directives in a flat parallel list. No difficulty triage for teams at different levels. No micro-stories that activate felt experience. No before/after pairs. No failure recovery scaffolding. A team new to agent-assisted workflow faces the same card list as a team with an established harness practice. Under cognitive load theory, this imposes unnecessary choice load on exactly the teams that can least afford it.
**Recommended action:**
- Add a 3-line triage block at the top: (a) no AGENTS.md yet → start here; (b) AGENTS.md exists but no verification → start here; (c) both exist → choose any card.
- Rewrite each card to open with a one-sentence recognizable situation before the directive. Example: "You've just inherited a repo you've never seen. In the first ten minutes, what three things did you wish the previous team had left you? Write that list down."
- Organize cards around the five habits explicitly, so each card names which habit it installs.
**Files:** `content/challenge-cards/deck.md`
**Effort:** Medium (content rewrite, not structural)

### 3. The follow-up package must be restructured for durable habit transfer

**Frameworks:** Learning Design, Behavioral Change, Practitioner Reality, Narrative Craft (4/6)
**Grounding:** Spacing effect / retrieval practice (Kornell & Bjork), Anchor-wiring (Fogg), adoption-gap paradox (Orosz), narrative continuity (Duarte)
**Why it matters:** The 48-hour email is seven separate items with no prioritization. The weekly check-ins are yes/no recognition checks, not active retrieval prompts. No Anchor-identification exercise helps participants wire habits to their Monday routines. No "adoption negotiation guide" addresses organizational pushback. Hackathon learning research consistently shows limited evidence of durable technical habit transfer without structural support.
**Recommended action:**
- Open the 48-hour message with the sticky-note commitment as the narrative anchor, reduce to a single action.
- Replace yes/no checklist questions with one active generation prompt per week for four weeks (e.g., "Describe a specific moment last week when you needed to verify agent output").
- Add a one-minute Anchor-identification exercise: "Write down three moments in your normal work week when you open a new task — these are your Anchors for 'map before motion.'"
- Add an "adoption negotiation" section: minimum viable harness that survives a skeptical PR review, language for when a colleague asks "why are we doing this."
**Files:** `workshop-skill/follow-up-package.md`, `materials/participant-resource-kit.md`
**Effort:** Medium (content restructuring)

### 4. Participant-executable failure experience is missing — failure teaching is prose, not lived

**Frameworks:** Tool Craft, Learning Design, Practitioner Reality, Narrative Craft (4/6)
**Grounding:** Prompt transparency / "show me it running" (Willison), desirable difficulty (Kornell & Bjork), practitioner skepticism, show-before-tell (pedagogy-of-presenting)
**Why it matters:** The failure-recovery prose in `codex-craft.md` section 7 is excellent. The micro-exercise in the talk is well-designed. But both are facilitator-delivered, not participant-experienced. No skill command surfaces a structured "watch it go wrong" moment. `$workshop help` provides phase-aware coaching but no provocation to break something and recover. The gap between the talk's learning intent and what participants actually experience at their keyboards is the largest missed teaching opportunity.
**Recommended action:**
- Surface the micro-exercise from `context-is-king.md` through `$workshop help` during Build Phase 1: "Try this: give your agent an underspecified task and observe what it chooses. Then compare against the four elements."
- Add one participant-runnable failure exercise to the skill surface (a structured prompt that predictably produces drift, paired with the harness move that catches it).
**Files:** `workshop-skill/SKILL.md` (workshop help handler), `content/talks/context-is-king.md`
**Effort:** Low-medium (one content addition to an existing command)

### 5. The "Context is King" talk should lead with the micro-exercise, not the framing

**Frameworks:** Learning Design, Narrative Craft, Behavioral Change (3/6)
**Grounding:** Concrete-before-abstract (Ng/Sweller), contrast-structure sparkline (Duarte), container design (Dignan)
**Why it matters:** The talk currently opens with principles ("Kontext je páka, ne kosmetika"), then analogy, then the micro-exercise. Under both learning science and narrative craft frameworks, this is backwards. The micro-exercise — two prompt variants side by side, demonstrably different agent behavior — is the hook that creates the question the rest of the talk answers. The principle should arrive as the explanation of something the room has already seen, not as a thesis the demo supports.
**Recommended action:**
- Move the side-by-side prompt comparison to the first two minutes of the talk.
- Show both prompts cold, run the demo, let the room observe the difference.
- Only then name what caused the difference and state the thesis.
- Move "Moje hlavní věta" to the close of the talk as resolution, not premise.
**Files:** `content/talks/context-is-king.md`
**Effort:** Low (restructure existing content, no new material needed)

### 6. The five habits need explicit Anchor moments for Monday transfer

**Frameworks:** Behavioral Change, Practitioner Reality, Learning Design (3/6)
**Grounding:** Fogg Behavior Model (B=MAP), adoption-gap paradox (Orosz), schema installation (Sweller)
**Why it matters:** Each habit currently has a Routine and an Adoption Signal but no Anchor — no named moment in the participant's real work week that triggers the behavior. Without an Anchor, the habit is dependent on motivation, which the tiny-habits framework identifies as the least reliable behavioral driver. "Boundaries create speed" is a mindset, not a behavior — it needs translation to a concrete action with a trigger.
**Recommended action:**
- For each of the five habits, add one sentence naming the Anchor: the pre-existing moment that triggers it.
  - "Map before motion" → fires when you open a new repo or start a new task
  - "If it's not in the repo, it doesn't exist" → fires when you close a chat window or finish a discussion
  - "Verification is the trust boundary" → fires before granting more autonomy, not after feeling confident
  - "Boundaries create speed" → fires when writing agent constraints before delegating
  - "Cleanup is part of build" → fires when a review comment appears for the second time
- Propagate into the follow-up package as an Anchor-identification exercise.
- Use commitment format: "when I [Anchor], I will [Habit]."
**Files:** `workshop-blueprint/teaching-spine.md`, `materials/participant-resource-kit.md`, `workshop-skill/follow-up-package.md`
**Effort:** Low (one sentence per habit, propagation to existing docs)

---

## Where the Panel Converged (Moderate Signal)

### 7. Language routing sends English participants to Czech content without a live session

**Frameworks:** Tool Craft, Agent Engineering (2/6)
**Why it matters:** A participant doing `harness skill install` in an English environment without an active event code gets the Czech authored fallback. The English locale files exist under `workshop-skill/locales/en/` — this is a routing logic problem, not a content problem. It affects every new participant's first five minutes.
**Recommended action:** Treat `en` locale as the guaranteed bundled fallback when no live `contentLang` is set and no Czech signal is active.
**Files:** `workshop-skill/SKILL.md` (Language Resolution section)
**Effort:** Low

### 8. A session-state artifact is missing — AGENTS.md conflates orientation with progress

**Frameworks:** Agent Engineering, Learning Design (2/6)
**Grounding:** Anthropic's `claude-progress.txt` pattern from long-running agents, retrieval practice needs state artifacts
**Why it matters:** AGENTS.md is a map of the repo, not a record of what was proved, what's in progress, what the next safe action is. A continuation team reading only AGENTS.md knows where things are but not what state they are in. The autonomous-planning-standard has a plan contract, but plans are pre-work — they don't record what actually happened.
**Recommended action:** Introduce a lightweight session-state note standard as a first-class deliverable alongside AGENTS.md.
**Files:** `docs/autonomous-planning-standard.md`, `materials/coaching-codex.md`, `workshop-skill/analyze-checklist.md`
**Effort:** Low-medium

### 9. The harness-doctrine feedback loop should be a named participant habit, not just a maintainer principle

**Frameworks:** Behavioral Change, Practitioner Reality (2/6)
**Grounding:** Operating-model principle (Dignan), adoption barriers (Orosz)
**Why it matters:** "When the same issue happens repeatedly, improve the harness, not just the output" is the highest-leverage operating-model insight in the entire repo. It currently lives only in `harness-doctrine.md`, which is a developer-facing document with no path from participant experience to it. The coaching-codex approaches it but doesn't name it as a habit.
**Recommended action:** Surface as a sixth named habit in participant-facing materials with its own Anchor and adoption signal.
**Files:** `docs/harness-doctrine.md`, `materials/participant-resource-kit.md`, `workshop-skill/recap.md`
**Effort:** Low

### 10. Intermezzos need cold retrieval prompts to convert reflection into active learning

**Frameworks:** Learning Design, Behavioral Change (2/6)
**Grounding:** Retrieval practice (Kornell & Bjork), desirable difficulty
**Why it matters:** Both intermezzos are currently recognition-based (re-reading what teams did). A 3-minute silent written exercise before any team reports aloud would convert them into generation-level retrieval events — the highest-efficacy learning format. Example: "Without checking the repo, state your team's current working rules in one sentence each."
**Recommended action:** Add `retrievalPrompt` to intermezzo phases.
**Files:** `workshop-blueprint/agenda.json`, `workshop-blueprint/day-structure.md`
**Effort:** Low (zero additional time in the agenda)

### 11. Continuation shift eval needs seed tags for cross-cohort pattern detection

**Frameworks:** Agent Engineering, Practitioner Reality (2/6)
**Grounding:** Eval methodology (Anthropic), practitioner reality
**Why it matters:** The ADR correctly defers a formal rubric, but zero vocabulary means five facilitators over three cohorts produce signals tagged with idiosyncratic words. Five to eight seed tags derived from the existing failure taxonomy would bootstrap pattern detection without freezing a rubric.
**Recommended action:** Add seed tags: `missing_runbook`, `no_test_evidence`, `next_step_not_obvious`, `constraint_only_in_chat`, `agents_md_too_large`, `drift_not_caught`, `premature_propagation`.
**Files:** `docs/adr/2026-04-09-continuation-shift-as-eval.md`
**Effort:** Low

---

## Productive Disagreements

### Tension 1: Reference card as scaffolding vs. flow disruptor

**Learning Design** identifies the reference card (`workshop-skill/reference.md`) as necessary cognitive scaffolding under high intrinsic load — participants with a novel domain need somewhere to look when they're stuck, and the card provides that.

**Behavioral Change** warns that the same card risks becoming a crutch that replaces discovery with lookup. A participant who hits friction and opens the reference card exits productive struggle — the very state where habit formation occurs.

**The tension:** Support vs. dependency. The card is both safety net and escape hatch. The resolution likely depends on facilitation skill: the operator guide should address when to redirect participants from the card back to their own experience, but participants themselves need explicit permission to be stuck (which is currently only in facilitator-facing materials, not participant-facing).

### Tension 2: Time scope — depth of learning vs. realistic day pacing

**Learning Design** identifies that the two build blocks (70 and 60 minutes) are below the 90-minute threshold the deep-work framework identifies for meaningful depth in a novel domain. Total genuine deep work time is roughly 2–2.5 hours.

**Practitioner Reality** argues the day is already optimistically scoped — expecting AGENTS.md + plan + verification + reviewed output before lunch is four non-trivial artifacts in a half-day. Adding time to build blocks means cutting something else.

**The tension:** Depth vs. pace. The facilitator's room read should decide. The day structure could benefit from an explicit "if the room is running 45 minutes behind" contingency plan, which currently does not exist in the operator guide.

### Tension 3: AGENTS.md as unambiguous win vs. nuanced research picture

**The workshop** treats AGENTS.md as an unambiguous good — it is the central teaching artifact.

**Practitioner Reality** (grounded in arxiv 2601.20404 and 2602.11988) notes that research shows AGENTS.md reduces agent runtime by 28.64% and token use by 16.58% when well-written, but a separate study found poorly written context files can *reduce* task success rates vs. no context at all and increase inference cost by 20%+.

**The tension:** The workshop needs participants to believe AGENTS.md matters (or they won't write one). But it also needs participants to understand that a bad AGENTS.md is worse than none. Currently there is one template and one challenge card addressing this craft discipline — no treatment of failure modes or quality calibration. The resolution is not to undermine the central artifact but to teach it as a *craft* with quality standards, not as a checkbox.

### Tension 4: Branding vocabulary vs. practitioner credibility

**Agent Engineering** and **Behavioral Change** find the coined vocabulary ("harness engineering," "continuation shift," "compound") useful and precise for teaching purposes.

**Practitioner Reality** notes that some of this vocabulary repackages practices engineers already have names for (TDD, code review, runbooks, ADRs, "write things down"). The branding is not dishonest, but it creates a credibility tax with skeptical senior engineers who recognize familiar concepts in new clothing.

**The tension:** New names help install new mental models; existing names earn trust with experienced practitioners. The resolution is likely to acknowledge existing names explicitly when introducing the new ones: "You may know this as a runbook — we call it the session-state artifact because the scope is narrower and the trigger is different."

---

## Prioritized Action List

| # | Action | Files | Frameworks | Effort | Tier |
|---|--------|-------|------------|--------|------|
| 1 | **Split participant/facilitator skill surfaces** — load facilitator commands only on `workshop facilitator login`; make `$workshop commands` return 5-item participant menu | `workshop-skill/SKILL.md`, `harness-cli/src/run-cli.js`, `harness-cli/README.md` | Learning, Agent Eng, Tool Craft, Practitioner (4) | Medium | Tier 2 |
| 2 | **Restructure "Context is King" talk** — lead with micro-exercise, move thesis to close | `content/talks/context-is-king.md` | Learning, Narrative, Behavioral (3) | Low | Tier 2 |
| 3 | **Add challenge card difficulty triage and micro-stories** | `content/challenge-cards/deck.md` | Learning, Narrative, Behavioral, Practitioner (4) | Medium | Tier 2 |
| 4 | **Wire habits to Anchors** — one sentence per habit naming the Monday trigger moment | `workshop-blueprint/teaching-spine.md`, `materials/participant-resource-kit.md`, `workshop-skill/follow-up-package.md` | Behavioral, Practitioner, Learning (3) | Low | Tier 2 |
| 5 | **Fix language routing** — English fallback when no live `contentLang` | `workshop-skill/SKILL.md` | Tool Craft, Agent Eng (2) | Low | Tier 2 |
| 6 | **Add participant-executable failure exercise** to `$workshop help` during Build Phase 1 | `workshop-skill/SKILL.md`, `content/talks/context-is-king.md` | Tool Craft, Learning, Practitioner, Narrative (4) | Low-Med | Tier 2 |
| 7 | **Restructure follow-up package** — sticky-note anchor first, single 48h action, generation prompts weekly | `workshop-skill/follow-up-package.md`, `materials/participant-resource-kit.md` | Learning, Behavioral, Practitioner, Narrative (4) | Medium | Tier 2 |
| 8 | **Add cold retrieval prompts to intermezzos** | `workshop-blueprint/agenda.json`, `workshop-blueprint/day-structure.md` | Learning, Behavioral (2) | Low | Tier 2 |
| 9 | **Add session-state artifact standard** alongside AGENTS.md | `docs/autonomous-planning-standard.md`, `materials/coaching-codex.md`, `workshop-skill/analyze-checklist.md` | Agent Eng, Learning (2) | Low-Med | Tier 2 |
| 10 | **Seed continuation-shift tags** — 5-8 tags from existing failure taxonomy | `docs/adr/2026-04-09-continuation-shift-as-eval.md` | Agent Eng, Practitioner (2) | Low | Tier 2 |
| 11 | **Surface harness-doctrine feedback loop as 6th habit** | `docs/harness-doctrine.md`, `materials/participant-resource-kit.md`, `workshop-skill/recap.md` | Behavioral, Practitioner (2) | Low | Tier 2 |
| 12 | **Add "adoption negotiation" section** to participant resource kit | `materials/participant-resource-kit.md` | Practitioner, Behavioral (2) | Low | Tier 2 |
| 13 | **Add minimum viable handoff gate** before the continuation shift | `workshop-blueprint/day-structure.md`, `workshop-blueprint/operator-guide.md` | Practitioner, Agent Eng (2) | Low | Tier 2 |
| 14 | **Move coaching codex reset questions to the top** — restructure as meta-skill with subordinate protocols | `materials/coaching-codex.md` | Behavioral, Narrative (2) | Low | Tier 2 |
| 15 | **Add `harness skill verify`** — post-install bundle readability check | `harness-cli/src/skill-install.js` | Tool Craft (1) | Low | Tier 2 |

---

## What Not to Change

Multiple frameworks explicitly defended these elements — they are working and should be preserved:

1. **The continuation shift (rotation) is the workshop's masterpiece.** All six frameworks independently validated it as structurally excellent. Do not soften it, make it optional, or add verbal rescue paths. The friction is the learning.

2. **The north-star question ("Does the repo speak for itself?") is the right through-line.** It is concrete, self-testing, applicable at every phase, and survives the workshop. Keep it.

3. **`codex-craft.md` is the best single teaching document in the repo.** Section 6 (before/after prompt pair), section 7 (failure recovery narrative), and section 9 (ecosystem velocity) are genuinely excellent. Do not dilute them.

4. **The coaching codex's five pre-implementation questions are well-sequenced and practically useful.** They map precisely to the failure taxonomy. Keep them in order. (Just move the three reset questions to the top, above these protocols.)

5. **The harness-cli `skill-install.js` error handling is production-grade.** Platform-aware, actionable recovery instructions, proper error translation. This is the DX standard for the rest of the CLI.

6. **The "I seem to have tremendous difficulty with my lifestyle" honesty in codex-craft.md** — the acknowledgment that "what's documented here will be partly outdated within the next release cycle" and the explicit learning-practice installation. Do not replace this honest framing with false permanence.

7. **The AGENTS.md standard is technically sound.** The five-job definition, progressive disclosure escalation, and maintenance triggers are precise. The recommended change (add a soft line-count bound) is additive, not corrective.

8. **The three-layer resource model (internal harness / learner kit / external gallery) is correct.** The classification heuristics are practical and the separation is well-motivated.

---

## Per-Lens Appendix

### Learning Design Lens (Tier 2)

**Grounding concepts:** Attention residue (Newport, *Deep Work*), desirable difficulty and retrieval practice (Kornell & Bjork, *Memory & Cognition* PMC4480221), cognitive load theory (Sweller), concrete-before-abstract pedagogy (Ng, DeepLearning.AI).

**Key findings:**
- The morning is more fragmented than the afternoon — three context-switches before the first build block
- Volume of principles risks overloading working memory before examples land (five habits + three sub-theses + four working defaults + multi-tiered command list)
- The continuation shift is structurally the most powerful retrieval event — forced generation at workflow scale
- Build blocks (70 and 60 min) are below the 90-minute deep-work threshold
- Skill system supports orientation but risks becoming a context-switch multiplier — no guidance on when *not* to invoke it
- Challenge card progression is temporally scaffolded but has no difficulty triage within groups
- Retrieval practice is unevenly distributed — intermezzos are recognition-level, not generation-level
- Follow-up package uses yes/no checks instead of active retrieval prompts

**Top 3 changes:** (1) Add cold retrieval prompts at intermezzos, (2) Add challenge card difficulty triage, (3) Replace follow-up checklist with weekly generation prompts.

---

### Agent Engineering Lens (Tier 2)

**Grounding concepts:** Context rot and progressive disclosure (Anthropic engineering blog), harness structure for long-running agents (Anthropic), goal drift as measurable eval dimension (AAAI 2025), approval policy as dual-layer security surface (OpenAI Codex docs), harness engineering architecture (OpenAI blog).

**Key findings:**
- "Harness" used with technical precision in content docs, but definition absent from blueprint/teaching-spine
- Long-horizon drift named well in codex-craft.md but not instrumented — no re-anchor prompt ritual in teaching spine or skill
- Verification treated as first-order value but not taught as a skill with a progression — no rubric for weak/adequate/strong verification loops
- Cost, latency, and context-window budget partially addressed; monetary cost entirely absent
- Approval modes and sandboxing described as a single dial rather than two independent axes (sandbox scope × approval policy)
- Continuation shift ADR is the most technically sophisticated doc; needs seed tags and participant self-capture signal
- AGENTS.md standard technically sound; needs a soft line-count bound (~150 lines)
- SKILL.md at 390 lines is a meaningful context-budget cost per session

**Top 3 changes:** (1) Add session-state artifact standard, (2) Split SKILL.md into participant/facilitator surfaces, (3) Seed continuation shift learnings tags.

---

### Tool Craft Lens (Tier 2)

**Grounding concepts:** Prompt transparency (Willison, simonwillison.net), normalization of deviance for tool safety (Willison), Diátaxis four-mode framework (diataxis.fr).

**Key findings:**
- Concrete runnable examples strong in codex-craft.md but absent at first participant touch — `$workshop reference` delivers Czech content without a live session
- "Watch it go wrong" moment exists but is facilitator-only prose, not participant-executable
- Tool affordance naming good in codex-craft.md (Codex CLI vs Claude Code vs pi vs Cursor), absent in skill surface
- CLI error messages in `skill-install.js` are production-grade — platform-aware, actionable
- `harness --help` surfaces 20+ commands with no "stop here if you're a participant" break
- No post-install verification (`harness skill verify`)
- Workshop documents mix Diátaxis modes — `reference.md` blends reference, explanation, and how-to
- Resource packaging model well-specified for maintainers but invisible to participants
- Reference gallery is disciplined and honest; per-link freshness dates would help
- Ecosystem velocity handling is the strongest thread — codex-craft.md's epistemic honesty is exemplary

**Top 3 changes:** (1) Fix language routing for English fallback, (2) Add participant-executable failure exercise to skill surface, (3) Add `harness skill --help` with progressive disclosure.

---

### Behavioral Change Lens (Tier 2)

**Grounding concepts:** Fogg Behavior Model B=MAP (behaviormodel.org), environment design principle (Clear, *Atomic Habits*), operating-model principle (Dignan, *Brave New Work*).

**Key findings:**
- Five habits each have Routines and Adoption Signals but no Anchors — no named trigger moments in Monday work
- The harness-doctrine feedback loop ("repeated pain becomes a better artifact") is the highest-leverage operating-model insight but lives only in maintainer docs
- Follow-up package is broadcast checklist, not Anchor-installation protocol
- Continuation shift is the single best environment-design move — makes the right behavior the only viable path
- Frustration is treated as signal in facilitator docs but absent as a named experience in participant-facing materials
- Challenge cards are instructional rather than environmental — they issue directives rather than reshaping the default path
- Coaching codex successfully installs a protocol (five pre-implementation questions), but buries the three meta-reset questions at the end
- W³ sticky-note commitment is a promising physical artifact cue but is not structurally guaranteed in the agenda
- "Boundaries create speed" is a mindset, not a behavior — needs translation to concrete action with trigger

**Top 3 changes:** (1) Wire each habit to a named Anchor moment, (2) Surface harness-doctrine feedback loop as participant-facing habit, (3) Move coaching codex reset questions to top.

---

### Practitioner Reality Lens (Tier 2)

**Grounding concepts:** Senior-engineer amplification asymmetry (Orosz, X/Substack), adoption-gap paradox (Faros AI, Stack Overflow 2025, Bain 2025), AGENTS.md efficiency vs. quality nuance (arxiv 2601.20404, 2602.11988), hackathon learning durability (Springer 2024).

**Key findings:**
- Core advice (map before motion, verification as trust boundary) is directionally correct but teaches the ideal without the negotiated-down minimum that survives velocity pressure
- "Harness engineering" names something genuine; some vocabulary repackages familiar practices, creating a credibility tax with skeptical seniors
- Time estimates optimistic — four non-trivial artifacts before lunch with setup consuming 20+ minutes
- README and teaching-spine language is unusually honest by workshop standards; SKILL.md accumulates product-spec marketing language
- 30+ skill commands = full product API surface, not a teaching interface
- Project briefs risk fracturing teams between "build a harness" and "deliver a feature" under time pressure
- Research shows AGENTS.md benefits are real but conditional on quality — workshop doesn't teach failure modes
- Continuation shift's learning value is hostage to Build Phase 1 execution quality — no minimum handoff gate
- Post-workshop adoption depends on organizational context the resource kit doesn't address

**Top 3 changes:** (1) Add minimum viable handoff gate before rotation, (2) Radically narrow participant-facing command surface, (3) Add "transfer blockers" / adoption negotiation content to resource kit.

---

### Narrative Craft Lens (Tier 2)

**Grounding concepts:** Contrast-structure sparkline (Duarte, *Resonate*), Diátaxis documentation classification (Procida), pedagogy-of-presenting / example-before-principle (Yatteau).

**Key findings:**
- Day structure has a genuine narrative arc with rising stakes — the continuation shift is the crisis/reversal
- The narrative arc exists in the blueprint but is not consistently felt in participant-handled materials (reference cards feel like they arrived from a different project)
- Context-is-King talk inverts the correct order — principles first, then demo, instead of demo first then principles
- The micro-exercise is the hook that should open the talk
- Analogies are concrete and functional (duck/LEGO, pilot airspeed, agent-as-collaborator-that-forgets)
- The close drives action (Monday challenge), not summary — this is correct
- Coaching codex is appropriately written as reference/how-to job-aid, but mixes in explanation-mode framing
- Challenge cards issue directives without micro-stories that activate felt experience
- Recap and follow-up are action-focused but lack narrative continuity — they don't reference specific day moments
- North-star question ("Does the repo speak for itself?") is the right narrative through-line

**Top 3 changes:** (1) Restructure Context-is-King talk to lead with micro-exercise, (2) Rewrite challenge cards with recognizable situations before directives, (3) Restructure follow-up package to lead with sticky-note commitment as narrative anchor.

---

## Sources (Consolidated)

### Learning Science & Cognitive Load
- [Cal Newport, *Deep Work* — calnewport.com](https://calnewport.com/deep-work-rules-for-focused-success-in-a-distracted-world/)
- [Andrew Ng on Machine Learning Specialization — DeepLearning.AI](https://www.deeplearning.ai/blog/andrew-ng-machine-learning-specialization/)
- [Andrew Ng — MIT Technology Review, 2017](https://www.technologyreview.com/2017/08/08/150069/andrew-ngs-next-trick-training-a-million-ai-experts/)
- [Kornell et al., "Retrieval Practice and Spacing Effects" — Memory & Cognition, PMC4480221](https://pmc.ncbi.nlm.nih.gov/articles/PMC4480221/)
- [Cognitive Load Theory — The Decision Lab](https://thedecisionlab.com/reference-guide/psychology/cognitive-load-theory)

### Agent Engineering & Harness
- [Anthropic: Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Anthropic: Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- [OpenAI Codex: Agent Approvals & Security](https://developers.openai.com/codex/agent-approvals-security)
- [OpenAI Codex: Sandboxing](https://developers.openai.com/codex/concepts/sandboxing)
- [AAAI 2025: Evaluating Goal Drift in Language Model Agents](https://ojs.aaai.org/index.php/AIES/article/download/36541/38679/40616)

### Tool Craft & Developer Experience
- [Simon Willison — 2025: The Year in LLMs](https://simonwillison.net/2025/Dec/31/the-year-in-llms/)
- [Simon Willison — Claude Code Transcripts](https://simonwillison.net/2025/Dec/25/claude-code-transcripts/)
- [Diátaxis documentation framework](https://diataxis.fr/)

### Behavioral Change & Operating Models
- [BJ Fogg — Behavior Model](https://www.behaviormodel.org/)
- [James Clear — Atomic Habits](https://jamesclear.com/atomic-habits)
- [Aaron Dignan — Brave New Work](https://www.bravenewwork.com/)

### Practitioner Reality & Adoption Research
- [Gergely Orosz — The Pragmatic Engineer, 2025](https://newsletter.pragmaticengineer.com/p/the-pragmatic-engineer-in-2025)
- [Faros AI: AI Adoption in Senior Software Engineers](https://www.faros.ai/blog/ai-adoption-in-senior-software-engineers)
- [Stack Overflow Developer Survey 2025 — AI](https://survey.stackoverflow.co/2025/ai/)
- [Bain: From Pilots to Payoff — GenAI in Software Development 2025](https://www.bain.com/insights/from-pilots-to-payoff-generative-ai-in-software-development-technology-report-2025/)
- [arxiv 2601.20404: Impact of AGENTS.md on AI Coding Agent Efficiency](https://arxiv.org/abs/2601.20404)
- [arxiv 2602.11988: Evaluating AGENTS.md for Coding Agents](https://arxiv.org/abs/2602.11988)
- [Springer: How do we learn in and from Hackathons?](https://link.springer.com/article/10.1007/s10639-024-12668-1)

### Narrative Craft & Technical Communication
- [Nancy Duarte — Resonate](https://www.duarte.com/resources/books/resonate/)
- [Pedagogy of Presenting — Courtney Yatteau](https://medium.com/@c_yatteau/pedagogy-of-presenting-transforming-conference-talks-with-teaching-techniques-7a6d18354972)
