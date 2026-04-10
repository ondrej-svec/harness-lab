# Framework Panel Review: Workshop Agenda & Presentation Analysis

## Panel composition

| Framework | Grounding | Focus |
|---|---|---|
| Learning-Design | Tier 2: Newport *Deep Work*, Ng education methodology, Bjork desirable difficulty, Ebbinghaus spacing | Cognitive load management, attention, retrieval practice, practice installation |
| Narrative-Craft | Tier 2: Duarte *Resonate*, Diátaxis, show-don't-tell tradition | Story arc, audience journey, contrast structure, refrain discipline |
| Behavioral-Change | Tier 2: Fogg *Tiny Habits*, Clear *Atomic Habits*, Dignan *Brave New Work* | Trigger-routine-reward cycles, environment design, durable habit installation |
| Practitioner-Reality | Tier 2: Orosz *Pragmatic Engineer* 2026 survey, Orbit AI coding reality check | Monday morning survivability, senior engineer eye-roll test, time realism |
| Agent-Engineering | Tier 2: Anthropic harness engineering blog, OpenAI Codex sandboxing docs, arXiv agent drift research | Technical precision of "harness" claims, eval methodology, failure mode vocabulary |

## Honesty note

This review applies named analytical frameworks to the target content. It does not represent the personal opinions of any named author. Findings are traceable to specific published concepts cited in each lens's grounding section. All five lenses operated at Tier 2 (web-sourced publications).

---

## Headline finding

**The workshop's pedagogical architecture is strong — the rotation is a genuinely novel and powerful learning device — but the most important operational mechanisms (silent retrieval exercises, pre-rotation handoff gate, Monday commitment artifact, structured codification pause) exist only in blueprint prose, not in the scenes that a facilitator actually presents. The workshop teaches teams "if it's not in the repo it doesn't exist" while leaving its own critical teaching mechanisms outside the agenda.**

Four of five frameworks independently flagged this gap. It is the workshop's own harness problem applied to itself.

---

## Where the panel converged (strong signal)

### 1. The silent retrieval exercise is mandated by the blueprint but absent from the intermezzo scenes

- **Frameworks:** Learning-Design, Narrative-Craft, Behavioral-Change
- **Grounding:** Ebbinghaus spacing effect / Bjork retrieval practice (Tier 2), Fogg trigger-routine-reward (Tier 2), Duarte participatory synthesis (Tier 2)
- **Why it matters:** `day-structure.md` explicitly says: "Open with a 3-minute silent written exercise using the retrieval prompt before any team reports aloud." Neither `intermezzo-1-checkpoint` nor `intermezzo-2-reflection` contains this as a scene step. Without it, intermezzos become status reports (the loudest team's impression), not retrieval practice (each participant reconstructing what they learned). The difference between reporting and retrieval is the difference between a social event and a learning mechanism. If the facilitator skips the silent writing — which is easy under time pressure — the most research-supported learning intervention in the day evaporates.
- **Recommended action:** Add a mandatory first scene to both intermezzos (`intermezzo-1-silent-retrieval`, `intermezzo-2-silent-retrieval`) with a `steps` block: "3 minutes silent writing. Each person writes the answer to [retrieval prompt] without looking at the repo. Only then does group sharing begin." Files: `workshop-content/agenda.json` (add scenes to both intermezzo phases). Effort: Small — two new scenes, ~40 lines of JSON each.

### 2. The pre-rotation handoff gate has no scene in the agenda

- **Frameworks:** Learning-Design, Behavioral-Change, Practitioner-Reality
- **Grounding:** Bjork desirable difficulty calibration (Tier 2), Dignan "tight feedback" principle (Tier 2), Pragmatic Engineer realistic scope assessment (Tier 2)
- **Why it matters:** The gate — facilitator checks each team's repo for (1) readable AGENTS.md, (2) one passing executable check, (3) written next safe step — is the mechanism that converts the rotation from a random-difficulty event into a calibrated-difficulty event. Without it, some receiving teams inherit chaos rather than signal, and the afternoon tests their tolerance for confusion rather than the morning team's harness quality. Three frameworks flagged this independently: Learning-Design (the rotation must be desirable difficulty, not overload), Behavioral-Change (the gate is the "tight feedback" constraint that makes the rotation's loose rule work), and Practitioner-Reality (a single facilitator checking 4-5 repos in 15 minutes is already tight — making the gate invisible makes it skippable).
- **Recommended action:** Add a `pre-rotation-gate` scene between `lunch-reset` and `rotation` phases, with sceneType `checkpoint`, showing the three-item checklist and the facilitator's triage protocol. The fallback: "Help a failing team write the minimum before rotation begins; do not delay rotation by more than 10 minutes." Files: `workshop-content/agenda.json`. Effort: Small — one new scene, ~60 lines of JSON.

### 3. The morning is abstract-first: the micro-exercise should precede the thesis, not illustrate it

- **Frameworks:** Learning-Design, Narrative-Craft
- **Grounding:** Ng concrete-before-abstract (Tier 2), Duarte "what is / what could be" sparkline (Tier 2)
- **Why it matters:** The current order is: Opening (concepts) → Talk (thesis stated in full via `talk-framing`) → Micro-exercise (contrast shown via `talk-micro-exercise`) → Demo → Build. The thesis is stated four times in `talk-framing` before participants see any evidence. Learning-Design identifies this as abstract-first teaching, which produces declarative knowledge (words about principles) rather than procedural knowledge (internalized practice). Narrative-Craft identifies it as tell-then-show rather than show-then-tell — the contrast functions as illustration, not discovery. Both frameworks recommend reversing the order: show the prompt-blob vs. 4-element contrast first (even as a brief 2-minute team exercise on their own brief), let participants name what they saw, then deliver the thesis as the answer to a question they already have.
- **Recommended action:** Move `talk-micro-exercise` before `talk-framing`, or better: compress the opening to 15 min (day arc + room activation + one-sentence contract), run a 3-minute hands-on micro-exercise where teams try both conditions on their actual brief, then deliver the talk as consolidation. Files: `workshop-content/agenda.json` (reorder scenes in `talk` phase). Effort: Medium — scene reordering plus minor copy adjustments.

### 4. Monday commitments exist only in the facilitation guide, not as a scene

- **Frameworks:** Narrative-Craft, Behavioral-Change
- **Grounding:** Duarte "call to action" at close (Tier 2), Fogg implementation intentions / Gollwitzer 1999 (Tier 2)
- **Why it matters:** The master guide describes Monday commitments in detail: each participant writes "Next week I will do [X] because [reason from today]." The guide says "reflexe bez zápisu se do pondělí většinou neudrží." Yet no scene in the `reveal` phase contains this as a structured block. The reveal closes with orientation and a CTA to a recap package, but the written artifact-producing moment — the one thing that bridges workshop learning to real behavior — is absent from the agenda. Narrative-Craft identifies this as a close that drives agreement but not action. Behavioral-Change identifies it as a commitment without environmental scaffolding.
- **Recommended action:** Add a scene `reveal-monday-commitments` to the `reveal` phase. Two blocks: a prompt block ("Write one sentence: 'Next week I will [X] because [Y from today].'") and a callout with the anti-pattern ("Not: 'I will work better with agents.' Yes: 'I will add Goal, Context, Constraints, Done When to AGENTS.md in my main repo.'"). Files: `workshop-content/agenda.json`. Effort: Small — one new scene.

### 5. Habits 5 and 6 have no structured practice moment before Build Phase 2

- **Frameworks:** Behavioral-Change, Learning-Design
- **Grounding:** Fogg trigger-routine-reward (Tier 2), Sweller schema formation (Tier 2)
- **Why it matters:** The teaching spine defines six habits. Habits 1–4 are practiced in Build Phase 1 (map, encode, verify, bound). Habits 5 ("Cleanup is part of build") and 6 ("Fix the system, not the symptom") are named in the teaching spine but have no dedicated trigger, no structured scene, and no milestone board item until Build Phase 2's facilitator prompts. The behavioral-change framework notes that these habits require the "second time the same pain appears" anchor — which can only fire after the rotation. But Build Phase 2 has no structured codification pause to force the behavior. Learning-Design notes that naming a principle at the moment it's experienced produces stronger encoding than either naming in advance or experiencing without naming.
- **Recommended action:** Add a `build-2-codification-pause` scene as the first scene of Build Phase 2 (before continuation work). Instruction: "Before you write any code: name one thing in this rotation that caused friction. Write it into the repo as a template, a rule, a check, or a clearer AGENTS.md section. Only after it is written do you move to feature work." Duration: 5 minutes. Files: `workshop-content/agenda.json`. Effort: Small.

---

## Where the panel converged (moderate signal)

### 6. The Codex demo needs one honest failure moment

- **Frameworks:** Practitioner-Reality, Agent-Engineering
- **Why it matters:** The demo script shows only the happy path. Senior engineers trust a demo that includes failure more than one that shows only success. Agent-Engineering notes that the demo does not show any specific failure mode (drift, constraint violation, hallucination). Practitioner-Reality notes that a 30-second narrated failure would significantly raise credibility.
- **Recommended action:** Add one planned failure: the agent generates output that partially misses a stated constraint. Show what repo signal was missing that would have prevented it. 60 seconds, narrated. Files: `content/talks/codex-demo-script.md`. Effort: Small.

### 7. Agent failure modes are never named

- **Frameworks:** Agent-Engineering, Practitioner-Reality
- **Why it matters:** The workshop teaches remedies (context, boundaries, verification) without teaching diseases (drift, hallucination carryover, context exhaustion, attention dilution). Participants leave with habits but no diagnosis vocabulary. Agent-Engineering notes that even one named failure mode per phase would dramatically increase transferability.
- **Recommended action:** Add 2-3 sentences per build phase in facilitator prompts naming the specific failure mode the phase's practices defend against. E.g., Build 1: "An agent that starts without constraints will make plausible architectural decisions that conflict with your actual requirements. This is task drift." Rotation: "A new agent session has no memory of the previous session. If your context is in chat only, the session starts blind." Files: `workshop-content/agenda.json` (facilitatorPrompts). Effort: Small.

### 8. Build Phase 1 milestone board is over-scoped for 65 minutes

- **Frameworks:** Practitioner-Reality, Learning-Design
- **Why it matters:** Six milestones including "a runnable slice another team can execute" in 65 minutes — with potential tool-setup friction, unfamiliar briefs, and mixed-skill teams — will cause teams to chase checkmarks rather than practice harness quality. Practitioner-Reality provides a realistic time breakdown showing 45–75 minutes for a smooth team. The visible board creates competitive pressure.
- **Recommended action:** Reduce to four items (README, AGENTS.md, plan, first executable check). Move "runnable slice" to Build Phase 2 milestone board (which currently has none). Files: `workshop-content/agenda.json` (update `build-1-milestones` and add `build-2-milestones`). Effort: Small.

### 9. Tool-agnostic translation is missing from Monday commitments

- **Frameworks:** Practitioner-Reality, Agent-Engineering
- **Why it matters:** The Pragmatic Engineer 2026 data shows enterprise procurement locks teams into specific tools. Participants returning to companies where Claude Code/Codex isn't approved need to know the practices translate: AGENTS.md, plan-first, verification-first are tool-agnostic. The workshop says "the harness, not the hammer" but doesn't make the tool-agnostic translation explicit at the commitment moment.
- **Recommended action:** Add a two-minute segment to the reveal: "Here's how these practices look if you use Copilot, Cursor, or another tool." Move `harness skill install` to a pre-workshop prerequisite. Files: `content/facilitation/master-guide.md`, reveal scenes. Effort: Small.

---

## Productive disagreements

### Rotation duration: Learning-Design says it's right, Practitioner-Reality says it's 5 minutes short

Learning-Design (applying Bjork's desirable difficulty): The 10-minute silent read is the correct mechanism for transfer testing. The time constraint is part of the difficulty that makes the learning durable.

Practitioner-Reality (applying Orosz's scope realism): 15 minutes total including physical movement and settling means only ~10 minutes of actual reading. The "write your diagnosis" step compresses to 2 minutes, which isn't enough for substantive written reflection.

**The tension:** depth vs. pace. If the silent period is too short, teams skip the diagnosis and jump to editing — the rotation's entire point. If it's too long, it eats into Build Phase 2. The facilitator's room read should decide: enforce the 10-minute silence strictly, even if it means adjusting Build Phase 2 timing.

### "Harness engineering" — genuine discipline or branded repackaging?

Agent-Engineering: "Harness" is used as a workshop brand, not a technical term. In Anthropic and OpenAI documentation, it means specifically the orchestration layer managing state, contracts, and control across agent steps. Using it to describe good engineering habits stretches the term.

Practitioner-Reality: The core practices (context in tracked artifacts, verification before trust, plan before implementation) are a coherent synthesis applied to a new surface. They're not marketing. They're also not entirely new — senior engineers recognize them as "what we should have been doing with human contributors too."

Narrative-Craft: Whether it's "new" or "hygiene you already know" is less important than whether the workshop acknowledges the lineage. Saying "you already know these practices; the new thing is applying them to a loop where the agent executes autonomously" elevates the argument and prevents the repackaging dismissal.

**The tension:** precision vs. accessibility. The technical term is narrower but harder to teach in a day. The broader brand is teachable but imprecise. The workshop should name this gap explicitly: "In the Anthropic and OpenAI documentation, 'harness' means the orchestration layer. We use the term more broadly to mean the full operating system around agent work. Both meanings matter."

### Habits 5 and 6: two habits or one?

Behavioral-Change: Both habits fire on the same anchor ("the second time the same pain appears") and produce the same action (encode it in the repo). They are functionally one habit with two labels.

Practitioner-Reality: Five clean habits are more memorable than six overlapping ones. Having six items when the day-structure sometimes references five creates inconsistency that practitioners notice.

Learning-Design: The principle "fix the system, not the symptom" is a higher-order generalization of "cleanup is part of build." Both are worth teaching but the distinction is the difference between local (cleanup) and systemic (system fix) responses to repeated friction.

**The tension:** simplicity vs. completeness. The panel does not pick a winner. If six habits are kept, the distinction between 5 and 6 should be made explicit in the teaching spine.

---

## Prioritized action list

| # | Action | Files | Effort | Frameworks | Tier |
|---|--------|-------|--------|------------|------|
| 1 | Add 3-min silent retrieval exercise as mandatory first scene of both intermezzos | `workshop-content/agenda.json` | Small | Learning-Design, Narrative-Craft, Behavioral-Change | 2 |
| 2 | Add pre-rotation handoff gate as a scene with 3-item checklist | `workshop-content/agenda.json` | Small | Learning-Design, Behavioral-Change, Practitioner-Reality | 2 |
| 3 | Reorder micro-exercise before talk thesis (show before tell) | `workshop-content/agenda.json` | Medium | Learning-Design, Narrative-Craft | 2 |
| 4 | Add Monday commitments as a reveal scene | `workshop-content/agenda.json` | Small | Narrative-Craft, Behavioral-Change | 2 |
| 5 | Add 5-min codification pause as first scene of Build Phase 2 | `workshop-content/agenda.json` | Small | Behavioral-Change, Learning-Design | 2 |
| 6 | Reduce Build 1 milestones from 6 to 4; move runnable slice to Build 2 | `workshop-content/agenda.json` | Small | Practitioner-Reality, Learning-Design | 2 |
| 7 | Add one honest failure moment to Codex demo | `content/talks/codex-demo-script.md` | Small | Practitioner-Reality, Agent-Engineering | 2 |
| 8 | Name specific agent failure modes in facilitator prompts per build phase | `workshop-content/agenda.json` | Small | Agent-Engineering, Practitioner-Reality | 2 |
| 9 | Add tool-agnostic translation to reveal; move skill install to pre-workshop | `workshop-content/agenda.json`, `content/facilitation/master-guide.md` | Small | Practitioner-Reality, Agent-Engineering | 2 |
| 10 | Add facilitator mode labels to scene notes (teaching/coaching/narrating) | `workshop-content/agenda.json` | Small | Narrative-Craft | 2 |

---

## What not to change

Multiple frameworks explicitly defended these elements:

- **The rotation with no verbal handoff.** All five frameworks identified this as the strongest pedagogical move in the workshop. Learning-Design: genuine transfer test. Behavioral-Change: the most powerful behavior-forcing function. Practitioner-Reality: the genuinely novel thing senior engineers will value. Agent-Engineering: the closest the workshop gets to simulating a real agent session handoff. Narrative-Craft: the narrative climax. Do not soften it.

- **The "frustration is diagnostic data, not failure" framing.** Three frameworks (Learning-Design, Behavioral-Change, Practitioner-Reality) identified this as the correct handling of the afternoon's most likely emotional state. The rotation will create frustration. Naming it as signal rather than bug is the teaching move that makes the frustration productive.

- **The coach → mentor → teacher priority ordering for facilitators.** Learning-Design and Behavioral-Change both identify this as the correct intervention hierarchy. The facilitator's job is to return teams to the repo and to verification, not to explain principles.

- **The "map, not manual" AGENTS.md principle.** All five frameworks validated this as the correct frame — though Agent-Engineering and Practitioner-Reality both suggest it should additionally be framed in token-cost terms, not just cognitive terms.

- **The W³ + 1-2-4-All closing structure.** Narrative-Craft and Behavioral-Change both identify this as well-designed for converting experience to durable action. The individual-first writing step in 1-2-4-All prevents groupthink.

- **The participant-view scenes as working orientation, not decoration.** Multiple frameworks noted that the participant board is doing real work — forward-linking to the next phase, providing anti-stall protocols, and maintaining a "what to do right now" reference. Do not remove these.

---

## Per-lens appendix

Full per-lens reviews are available in the agent outputs above, each containing:
- Tier 2 grounding with cited sources
- Scene-by-scene analysis of all 10 phases
- Cross-cutting findings
- Top 3 changes per framework

### Learning-Design highlights
- 80 minutes of passive morning before first hands-on work risks attention window closure
- Build Phase 1 is the most cognitively productive period — protect it
- The generation effect: participants who produce the micro-exercise themselves would retain 30-40% more

### Narrative-Craft highlights
- "What is / what could be" tension is front-loaded, not sustained through the day
- Repeated phrases function as operational repetition rather than narrative refrains
- The opening has five negations of what the day isn't before showing what it is
- The participant-preview forward links are the best narrative device — use more of them

### Behavioral-Change highlights
- Habits are named more often than they are anchored to trigger-routine-reward cycles
- The rotation is the only genuine Dignan "tight feedback" moment — the rest is coaching
- No follow-up mechanism for Monday commitments (48-72 hour retrieval window)
- The facilitator's hardest job: holding constraints under social pressure to soften them

### Practitioner-Reality highlights
- Single-facilitator bandwidth is the structural assumption that limits everything
- "Harness engineering" survives the eye-roll test if it acknowledges its lineage in good engineering hygiene
- Tool-surface friction (Codex/Claude Code/pi install) should be pre-workshop, not in-day
- Enterprise procurement blocks are the biggest threat to Monday commitments

### Agent-Engineering highlights
- "Harness" is used as a brand term, not with the technical precision of Anthropic/OpenAI usage
- Verification teaching stops before reaching agent-specific eval (agent-generated tests ≠ independent verification)
- Cost, context-window limits, and token economics are entirely absent
- The 4-element framework (Goal/Context/Constraints/Done When) is technically defensible as task contracts
