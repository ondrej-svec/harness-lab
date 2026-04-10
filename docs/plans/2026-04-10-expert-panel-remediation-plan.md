---
title: "docs: expert panel remediation — skills, CLI, teaching approach"
type: plan
date: 2026-04-10
status: complete
brainstorm: docs/brainstorms/2026-04-10-expert-panel-remediation-brainstorm.md
confidence: high
---

# Expert Panel Remediation — Skills, CLI, Teaching Approach

**One-line summary:** Implement the highest-impact findings from the 6-framework expert panel review to make the public repo CTO-reviewable within ~5 days and cohort-brilliant within ~2 weeks.

## Problem Statement

The expert panel review identified 15 prioritized actions across 6 analytical frameworks. The strongest convergent signal (4/6 frameworks): the 30+ command participant skill surface is the primary cognitive overload risk. The strongest convergent praise (6/6 frameworks): the continuation shift is the workshop's masterpiece.

The repo is going public for CTO and business stakeholder review next week. The first cohort runs ~2 weeks out.

## Target End State

When this plan lands:

1. A participant invoking the skill sees a focused 5-command surface, not a 30+ command product API
2. The "Context is King" talk opens with the micro-exercise (hook), not the framing (preamble)
3. Challenge cards open with recognizable situations, not flat directives, and include a difficulty triage
4. Each of the five habits has a named Anchor moment for Monday transfer
5. The coaching codex leads with the three reset questions as the meta-skill
6. The follow-up package uses the sticky-note commitment as narrative anchor, with generation prompts
7. The continuation shift has seed tags, a handoff gate, and retrieval prompts at intermezzos
8. A CTO browsing the public repo encounters a coherent, intellectually rigorous teaching system

## Scope and Non-Goals

**In scope:** All 15 expert panel actions, organized in three waves.

**Non-goals:**
- Dashboard changes (separate work stream)
- Presenter/scene richness system (separate brainstorm)
- New project briefs or additional challenge cards (restructure existing only)
- CLI feature additions beyond progressive disclosure
- Bilingual architecture changes (just completed, settled)
- Changes to panel-defended elements (continuation shift design, codex-craft.md, AGENTS.md standard, coaching codex five-question sequence, skill-install.js, three-layer resource model, north-star question)

## Open Questions — Resolved

These were open in the brainstorm. Resolved here for implementation:

**Q1: Skill split granularity → Separate files.**
The facilitator surface becomes `SKILL-facilitator.md`, loaded only when `workshop facilitator login` succeeds. SKILL.md line 207 is the clean split point. `workshop-skill/facilitator.md` (612 lines) already exists as an operational reference — the new `SKILL-facilitator.md` is the agent instruction surface, not a duplicate.

**Q2: Challenge card format → 2-3 line cards.**
Each card opens with a one-sentence situation (what the participant is experiencing right now), then the directive. Keeps printable format. Example: `` `Nemáte AGENTS.md` — Otevřete nový soubor AGENTS.md a napište čtyři sekce: Goal / Context / Constraints / Done When. ``

**Q3: Adoption negotiation tone → "Minimum viable harness."**
Frame as "here's the smallest version that works" rather than "here's how to convince your skeptical org." Empowering, not adversarial.

**Q4: Handoff gate → Strong nudge, facilitator judgment.**
The operator guide gives criteria; the facilitator decides whether to intervene or let friction teach. Not a hard block.

**Q5: 6th habit name → "Fix the system, not just the symptom."**
Matches the imperative style of the other five. Alternative: "Repeated friction improves the harness." The teaching-spine format applies: Teach / What to say / Adoption signal / Anchor moment.

---

## Wave 1: Structural Foundation (Days 1–2)

### Proposed Solution

Split the participant and facilitator skill surfaces, add CLI progressive disclosure, and fix language routing. This is the foundation — all wave 2 content edits happen on the resulting files.

### Implementation Tasks

#### 1.1 Split SKILL.md into participant and facilitator surfaces

- [x] **1.1.1** Create `workshop-skill/SKILL-facilitator.md` containing:
  - Frontmatter with `name: workshop-facilitator` and appropriate `allowed-tools`
  - Lines 207–336 from current SKILL.md (all `workshop facilitator *` commands)
  - `workshop closing` (lines 172–179, marked "do not proactively surface to participants")
  - The facilitator-specific language resolution rules (lines 46–49)
  - A loading condition: "This skill activates only after successful `workshop facilitator login`"
  - A pointer to `workshop-skill/facilitator.md` for full operational reference
- [x] **1.1.2** Trim current `workshop-skill/SKILL.md` to participant-only surface:
  - Remove lines 207–336 (all facilitator commands)
  - Remove `workshop closing` (lines 172–179) — move to facilitator skill
  - Keep `workshop analyze` (lines 338–344) — it's participant-facing (handoff check)
  - Move `workshop analyze` up to sit after `workshop follow-up` (line 205)
  - Update any cross-references between participant and facilitator commands
  - Result: ~220 lines instead of 387
- [x] **1.1.3** Update `workshop-skill/commands.md` (Czech) and `workshop-skill/locales/en/commands.md`:
  - Ensure only participant commands are listed (currently already mostly correct — only one facilitator bullet)
  - Remove the single `workshop facilitator learnings` bullet
  - Add `workshop analyze` if not already present
  - Verify the 5-item priority menu matches: orientation (`workshop`), brief (`workshop brief`), template (`workshop template`), help (`workshop help`), analyze (`workshop analyze`)

#### 1.2 CLI progressive disclosure

- [x] **1.2.1** Add `harness skill --help` sub-command in `harness-cli/src/run-cli.js`:
  - Insert a handler at ~line 1334 for `scope === "skill" && action !== "install"`
  - When `action` is undefined or `--help`: show a focused participant help block:
    - `harness skill install` — install the workshop skill into your project
    - Next steps after install (the 5-step list from lines 312–318)
  - When `action` is unrecognized: show the same help with an "unknown command" prefix
- [x] **1.2.2** Add visual break in `printUsage` (run-cli.js lines 209–286):
  - After the `Participant` section (line 220), add a note: "Most participants only need: harness skill install"
  - Consider adding a `──` separator between Participant and Authentication sections
- [x] **1.2.3** Update `harness-cli/README.md`:
  - Add a "Participant quick start" section at the top that ends with `harness skill install`
  - Add a "stop here if you're a participant" break before the facilitator commands

#### 1.3 Language routing fix

- [x] **1.3.1** Update SKILL.md language resolution (lines 39–75):
  - Clarify that when no live `contentLang` is set AND no Czech-language signal is active, the skill routes to `locales/en/` content (English fallback)
  - Ensure the resolution order is: live `contentLang` → user language → English (`en`)
  - This is already the documented behavior (line 43) — verify it works in practice by checking the locale file lookup pattern at lines 63–75

#### 1.4 Post-install verification (optional, low priority)

- [ ] **1.4.1** Consider adding `harness skill verify` command:
  - Checks that `.agents/skills/harness-lab-workshop/SKILL.md` exists and is readable
  - Reports bundle version from `bundle-manifest.json`
  - Low priority — implement only if time permits after wave 2

### Wave 1 Acceptance Criteria

- [ ] `workshop-skill/SKILL.md` contains only participant commands (~220 lines or fewer)
- [ ] `workshop-skill/SKILL-facilitator.md` exists with all facilitator commands
- [ ] `$workshop commands` in the skill returns a focused participant menu
- [ ] `harness skill --help` shows only the participant path
- [ ] `harness --help` has a visible "participant quick start" emphasis
- [ ] Language routing defaults to English locale when no live session exists

---

## Wave 2: Content Quality (Days 2–4)

### Proposed Solution

Restructure teaching content for pedagogical quality. Each file is touched once, both locales updated in the same pass. The changes are structural/pedagogical, not language-dependent.

### Subjective Contract

- **Target outcome:** A reviewer reading these materials should feel they're encountering a well-thought-out teaching system, not a collection of tips
- **Anti-goals:** Over-narrating the challenge cards (they must stay printable); making the talk feel scripted; making the follow-up feel like marketing
- **References:** codex-craft.md section 6 (before/after prompt pair) as the gold standard for show-before-tell
- **Anti-references:** Generic workshop recap emails; flat checklist challenge cards
- **Tone rules:** Czech content stays in Ondrej's authentic voice (no corporate Czech); English content stays direct and practitioner-grade
- **Rejection criteria:** If a challenge card's situation opener is longer than its directive, it's too heavy. If the talk restructure loses the thesis clarity, revert.

### Implementation Tasks

#### 2.1 Talk restructure — "Context is King"

- [x] **2.1.1** Restructure `content/talks/context-is-king.md` (Czech root):
  - Move `## Mikro-cvičení` (currently lines 31–43) to become the **first section** after the title
  - Open cold: show both prompt variants side by side, run the demo, let the room observe
  - Move `## Otevírací modul` (lines 3–11) to after the micro-exercise, reframed as "what you just saw"
  - Move `## Klíčová linka` with thesis blockquote (line 19) to the **close** of the talk, as resolution
  - Keep `## Hlavní teze` (lines 44–65) in the middle as the explanation of what the demo showed
  - Keep `## Co si odnesete do build fáze` (lines 74–82) as the action bridge
  - Result: Demo → "What you just saw" → Analogy → Main theses → Adoption → Action → Thesis as close
- [x] **2.1.2** Apply same restructure to English locale if `content/talks/locales/en/context-is-king.md` exists; if not, note for future locale sync

#### 2.2 Challenge cards — triage and micro-stories

- [x] **2.2.1** Add difficulty triage block to top of `content/challenge-cards/deck.md`:
  - Before `## Před obědem`: add a 3-line triage routing teams by current state:
    - No AGENTS.md yet → start with card 1 from "Před obědem"
    - AGENTS.md exists but no verification → start with card 3 from "Před obědem"
    - Both exist → choose any card
- [x] **2.2.2** Rewrite each card to open with a one-sentence situation:
  - Current format: `` `Title` — directive ``
  - New format: `` `Title` — Situation sentence. Directive sentence. ``
  - Keep cards to 2–3 lines max for printability
  - Example pre-lunch card: `` `AGENTS.md jako mapa` — Váš agent právě dostal úkol, ale nezná architekturu, pravidla ani co testovat. Vytvořte AGENTS.md se čtyřmi sekcemi: Goal / Context / Constraints / Done When. ``
  - Example post-rotation card: `` `Diagnóza po handoffu` — Právě jste zdědili repo, které jste nikdy neviděli. Napište, co vám pomohlo, co chybělo, co je rizikové a jaký je další bezpečný krok. ``
- [x] **2.2.3** Add habit labels to each card:
  - After the directive, add a small tag indicating which habit the card installs: `[Habit: Map before motion]`
  - This reinforces the habit vocabulary without adding weight
- [x] **2.2.4** Apply same changes to `content/challenge-cards/locales/en/deck.md`

#### 2.3 Coaching codex restructure

- [x] **2.3.1** Restructure `materials/coaching-codex.md`:
  - Move `## The three questions that reset a stuck session` (lines 57–66) to become the **first section** after the framing paragraph
  - Rename to `## The meta-skill: three questions that reset anything`
  - Add a one-line bridge: "These three questions work in any situation — before code, during work, when stuck, when you disagree. The protocols below are specific applications."
  - Keep the remaining sections in current order beneath it:
    - Before you let the agent write code (five questions)
    - While the agent is working
    - When the agent says it's done
    - When you disagree with the agent
  - Move `## The one rule to remember` to close

#### 2.4 Habit Anchors

- [x] **2.4.1** Add `Anchor moment:` field to each habit in `workshop-blueprint/teaching-spine.md`:
  - After each habit's `Adoption signal:` line, add `Anchor moment:` with the Monday trigger
  - H1 "Map before motion": `Anchor moment: The first time you open a new repo, a new task, or a new agent session.`
  - H2 "If it is not in the repo, it does not exist": `Anchor moment: The moment you close a chat window, finish a call, or end a pairing session where a decision was made.`
  - H3 "Verification is the trust boundary": `Anchor moment: The moment you feel confident enough to move on — that confidence is the trigger to verify, not skip verification.`
  - H4 "Boundaries create speed": `Anchor moment: The moment before you delegate a task to the agent — write the constraint before the prompt.`
  - H5 "Cleanup is part of build": `Anchor moment: The second time the same review comment, friction point, or manual step appears.`
- [x] **2.4.2** Propagate Anchors to `materials/participant-resource-kit.md`:
  - Add a new section `## Kdy se návyky spustí` (When habits fire) between the current section 6 and the weekly challenge
  - Format: "Když [Anchor], udělám [Habit]" for each of the five habits
- [x] **2.4.3** Propagate Anchors to `workshop-skill/follow-up-package.md` (done as part of 2.5)

#### 2.5 Follow-up package restructure

- [x] **2.5.1** Restructure `workshop-skill/follow-up-package.md`:
  - **Open with W³ commitment** — move the W³ sticky-note section (lines 38–41) to become the first paragraph of the 48h section
  - **Reduce 48h email to a single action** — keep one principle reminder + one specific "do this before Friday" action tied to the sticky-note commitment
  - Move the remaining 48h items (template links, learner kit links, skill reminder) to a "Resources" sub-section at the bottom
  - **Replace 1-week yes/no questions** (lines 29–36) with generation prompts:
    - Week 1: "Popište konkrétní moment z tohoto týdne, kdy jste potřebovali ověřit výstup agenta. Co jste použili jako kontrolu?"
    - Week 2: "Popište rozhodnutí, které jste zapsali do repozitáře místo toho, abyste ho nechali v chatu. Co vás přimělo ho zapsat?"
    - Week 3: "Popište moment, kdy jste agentovi dali omezení předem a ušetřilo vám to opravu. Jaké to bylo omezení?"
    - Week 4: "Popište situaci, kdy se stejný problém opakoval. Změnili jste systém, nebo jen výstup?"
  - **Add Anchor-identification exercise** after W³ section: "Zapište si tři momenty z vašeho běžného pracovního týdne, kdy otevíráte nový úkol nebo novou session — to jsou vaše Anchor momenty pro 'Map before motion.'"
- [x] **2.5.2** Apply same restructure to `workshop-skill/locales/en/follow-up-package.md`

#### 2.6 Participant failure exercise in skill

- [x] **2.6.1** Update participant SKILL.md `workshop help` behavior:
  - During Build Phase 1, include a provocation in the `workshop help` response:
  - "Zkuste toto: dejte agentovi úkol bez omezení a sledujte, co si vybere. Pak porovnejte výsledek se čtyřmi prvky dobrého úkolu (Goal / Context / Constraints / Done When). Co chybělo?"
  - This surfaces the micro-exercise from the talk as a participant-executable moment
  - Only show during Build Phase 1 (phase-aware behavior already exists in the skill)

### Wave 2 Acceptance Criteria

- [ ] The "Context is King" talk opens with the micro-exercise demo, thesis is at the close
- [ ] Every challenge card opens with a recognizable situation before its directive
- [ ] Challenge cards have a difficulty triage at the top
- [ ] The coaching codex leads with the three reset questions
- [ ] Each habit in the teaching spine has an `Anchor moment:` field
- [ ] The follow-up package opens with the sticky-note commitment, uses generation prompts
- [ ] `$workshop help` during Build Phase 1 includes a failure-exercise provocation

---

## Wave 3: Depth and Operational Quality (Days 4–5)

### Proposed Solution

Add operational infrastructure that makes the first cohort stronger. These changes are less visible to a repo browser but critical for cohort success.

### Implementation Tasks

#### 3.1 Session-state artifact standard

- [x] **3.1.1** Add to `docs/autonomous-planning-standard.md`:
  - New failure type 7 after line 31: "Session-state opacity — the plan authorizes work but produces no durable artifact capturing what was decided, tried, and where current state is"
  - New row in the Minimum Plan Contract table (lines 49–57): `Session-state artifact | What evidence of current state must exist at any handoff point? | Prevents context loss across agents and sessions`
  - New checkbox in Work Authorization Checklist (before line 150): `[ ] a durable session-state artifact exists or is scoped in the plan`
- [x] **3.1.2** Add to `materials/coaching-codex.md`:
  - In "When the agent says it's done" section, add step 5: "Write a session-state note: what was proved, what's in progress, what's the next safe action."
- [x] **3.1.3** Add to `workshop-skill/analyze-checklist.md`:
  - New checklist item (after item 8): "Existuje záznam stavu session — co bylo ověřeno, co je rozpracované, jaký je další bezpečný krok?"

#### 3.2 Intermezzo retrieval prompts

- [x] **3.2.1** Add `retrievalPrompt` field to intermezzo phases in `workshop-blueprint/agenda.json`:
  - `intermezzo-1` (lines 47–54): add `"retrievalPrompt": { "en": "Without checking the repo, state your team's current working rules in one sentence each.", "cs": "Bez kontroly repozitáře pojmenujte aktuální pracovní pravidla vašeho týmu — každé jednou větou." }`
  - `intermezzo-2` (lines 79–86): add `"retrievalPrompt": { "en": "Name one signal that saved time during continuation, without explaining your project.", "cs": "Pojmenujte jeden signál, který vám ušetřil čas při pokračování — bez vysvětlování projektu." }`
- [x] **3.2.2** Document the retrieval prompt facilitation move in `workshop-blueprint/day-structure.md`:
  - In the intermezzo narrative sections, add: "Open each intermezzo with a 3-minute silent written exercise using the retrieval prompt before any team reports aloud."

#### 3.3 Continuation shift seed tags

- [x] **3.3.1** Add seed tags to `docs/adr/2026-04-09-continuation-shift-as-eval.md`:
  - After the schema definition (line 54), add a new paragraph:
  - "To guide early capture without freezing the schema, v1 ships with suggested seed tags derived from the autonomous planning standard's failure taxonomy: `missing_runbook`, `no_test_evidence`, `next_step_not_obvious`, `constraint_only_in_chat`, `agents_md_too_large`, `drift_not_caught`, `premature_propagation`, `missing_session_state`."
  - Note: "Facilitators may use these, ignore them, or add their own. The tags are vocabulary suggestions, not a required schema."

#### 3.4 Minimum viable handoff gate

- [x] **3.4.1** Add pre-rotation gate to `workshop-blueprint/day-structure.md`:
  - Between the lunch-reset narrative (line 134) and the rotation narrative (line 135), add a new sub-section:
  - `### Pre-rotation handoff gate`
  - Minimum criteria: (1) readable AGENTS.md with goal + build/test commands + one explicit constraint, (2) one executable verification step with a passing result, (3) a written "next safe step" in the repo
  - "If a team does not meet these by rotation time, the facilitator intervenes directly — not to punish, but to help them write the minimum before the handoff."
- [x] **3.4.2** Add rotation facilitation guidance to `workshop-blueprint/operator-guide.md`:
  - New section `## During Rotation` between "During The Day" and "After The Day"
  - Content: what to watch for, when to let friction stand vs. intervene, how to use the HandoffMomentCard capture, the difference between "frustration that teaches" and "frustration that breaks"

#### 3.5 Adoption negotiation section

- [x] **3.5.1** Add to `materials/participant-resource-kit.md`:
  - New section after `## Výzva na příští týden`: `## Minimum viable harness pro váš tým`
  - Content: the smallest version that survives a skeptical PR review — one AGENTS.md entry + one executable check
  - Frame: "You don't need to convince your team of 'harness engineering.' You need to show them a useful AGENTS.md that saved 20 minutes of onboarding."
  - Include: what to say when asked "why are we doing this" (answer: "so the next person doesn't have to ask you")
- [x] **3.5.2** Apply to English locale if it exists

#### 3.6 Sixth habit — "Fix the system, not just the symptom"

- [x] **3.6.1** Add to `workshop-blueprint/teaching-spine.md`:
  - After Habit 5, add `### 6. Fix the system, not just the symptom`
  - `Teach:` When the same review comment, friction, or manual step appears a second time, the response is not to fix the output — it's to improve the harness. Write a template, add a check, encode the rule.
  - `What to say:` "Když se stejná věc opakuje, neopravujte výstup — opravte systém."
  - `Adoption signal:` A repeated friction point becomes a new template, check, or documented rule instead of staying in conversation.
  - `Anchor moment:` The second time you encounter the same friction — the repetition is the trigger.
- [x] **3.6.2** Add the 6th habit to the reference card (`workshop-skill/reference.md`) and its English locale
- [x] **3.6.3** Add to `materials/participant-resource-kit.md` in the habit Anchors section (from 2.4.2)

### Wave 3 Acceptance Criteria

- [ ] The autonomous planning standard includes session-state artifact as a failure type, plan row, and authorization check
- [ ] Both intermezzo phases in agenda.json have bilingual retrieval prompts
- [ ] The continuation shift ADR has 7–8 seed tags with usage guidance
- [ ] A pre-rotation handoff gate exists in the day structure with minimum criteria
- [ ] The operator guide has a "During Rotation" section
- [ ] The participant resource kit has a "minimum viable harness" adoption section
- [ ] A 6th habit exists in the teaching spine with Teach/What to say/Adoption signal/Anchor moment
- [ ] The analyze checklist includes session-state artifact

---

## Constraints and Boundaries

- **Do not modify** panel-defended elements (continuation shift design, codex-craft.md, coaching codex five-question sequence, AGENTS.md standard, skill-install.js, three-layer resource model, north-star question)
- **Bilingual architecture is fixed** — Czech at root for delivery, English in `locales/en/`, structured JSON bilingual source. Do not change this.
- **Content voice** — Czech content stays in Ondrej's authentic voice. English content stays direct and practitioner-grade.
- **Challenge cards must stay printable** — 2–3 lines max per card, no paragraphs

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| Skill split at line 207 is clean | Verified | Research confirmed: all facilitator commands start at line 207, participant commands end at line 205 |
| `workshop closing` belongs with facilitator | Verified | SKILL.md line 179: "Do not proactively surface it to participants" |
| `workshop analyze` belongs with participant | Verified | Described as participant-facing handoff check at lines 338–344 |
| facilitator.md (612 lines) already exists as separate doc | Verified | Full operational reference, no duplication needed |
| agenda.json accepts new fields without schema migration | Verified | No schema validation file referenced; `retrievalPrompt` slots alongside existing `goal` field |
| English locale files exist for all modified skill/content files | Mostly verified | locales/en/ confirmed for commands, reference, setup, recap, follow-up, challenge cards. Talk locale needs checking. |

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Skill split breaks agent routing | Low | High | Test with `$workshop commands` and `$workshop facilitator login` after split |
| Challenge card rewrites change meaning | Low | Medium | Keep original directive text, only prepend situation opener |
| Talk restructure loses clarity | Low | Medium | Rejection criteria: if thesis is harder to find after restructure, revert |
| Follow-up generation prompts are too demanding | Medium | Low | Keep prompts concrete and situation-based, not abstract reflection |
| Wave 3 items not completed before review | Medium | Low | Wave 3 is less visible to CTO reviewer; can be completed between review and cohort |

## References

- Expert panel review: `docs/reviews/2026-04-10-expert-panel-skills-cli-teaching-approach.md`
- Brainstorm: `docs/brainstorms/2026-04-10-expert-panel-remediation-brainstorm.md`
- Bilingual content model: `docs/adr/2026-04-10-unified-bilingual-content-model.md`
- Continuation shift eval: `docs/adr/2026-04-09-continuation-shift-as-eval.md`
- Autonomous planning standard: `docs/autonomous-planning-standard.md`
