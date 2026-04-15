---
title: "Expert Panel Scene Updates"
type: brainstorm
date: 2026-04-10
participants: [Ondrej, Claude]
related:
  - docs/reviews/2026-04-10-expert-panel-agenda-presentation-review.md
  - docs/brainstorms/2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md
  - docs/brainstorms/2026-04-09-presenter-blueprint-rich-content-direction-brainstorm.md
  - docs/plans/archive/2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md
  - docs/plans/2026-04-09-feat-opening-talk-reset-and-facilitator-runner-plan.md
---

# Expert Panel Scene Updates

## Problem Statement

A 5-framework expert panel review of the workshop agenda and presentation scenes identified that the workshop's most critical teaching mechanisms exist only in blueprint prose, not in the scenes a facilitator actually presents. The workshop teaches "if it's not in the repo it doesn't exist" while leaving its own key mechanisms outside the agenda.

Beyond structural gaps (missing scenes), the panel also identified that existing scenes can better convey their intended messages through reordering, copy refinement, and clearer narrative craft.

This brainstorm captures the design decisions for all 10 prioritized actions from the panel review, translating framework findings into concrete scene specifications.

## Context

### The expert panel review

The review (`docs/reviews/2026-04-10-expert-panel-agenda-presentation-review.md`) applied five frameworks:
- Learning-Design (cognitive load, attention, retrieval practice)
- Narrative-Craft (story arc, show-don't-tell, contrast structure)
- Behavioral-Change (habit installation, trigger-routine-reward)
- Practitioner-Reality (Monday morning survivability, time realism)
- Agent-Engineering (harness precision, failure mode vocabulary)

### Prior work

Scene richness and content architecture have been brainstormed and planned in the April 9 cycle. This brainstorm adds a layer of framework-grounded refinement on top of that work, specifically addressing narrative flow, cognitive load management, and behavioral installation through the scenes.

### Facilitator guidance architecture

We established the following layer model during this brainstorm:

| Layer | Where it lives | When it's used | What it contains |
|---|---|---|---|
| **Room screen** | Scene blocks in agenda JSON | During delivery — projected | Lean, well-designed content. Title, key message, checklist/steps. No facilitator jargon. |
| **Facilitator runner** | Per-phase in agenda JSON | Prep + delivery reference | say/show/do/watch/fallback — the playbook. Quick-scan on second device. |
| **Facilitator notes** | Per-scene in agenda JSON | Prep + glanceable cue | 1-2 short delivery cues per scene. Visible in facilitator dashboard, not projected. |
| **Master guide** | `content/facilitation/master-guide.md` | Prep only | Full narrative, facilitation philosophy, edge cases, deeper reasoning. |
| **Workshop skill** | CLI, available on demand | During delivery if stuck | On-demand query tool for facilitator mid-flow. |

**Design principle:** Projected screens should be lean but well-designed — enough signal for the room and enough for a new facilitator to pick up the intent at a glance. The facilitator runner is the structured playbook for prep and second-device reference. The master guide is study material, not a live reference.

## Chosen Approach

Implement all 10 panel actions as a unified scene update pass, working through the agenda phase by phase. Each action produces specific scene additions, modifications, or copy refinements.

## Why This Approach

The panel's convergent findings (3+ frameworks agreeing) carry the strongest evidence. The modifications are mostly small (new scenes = ~40-60 lines of JSON each, copy refinements = targeted edits). Doing them as a unified pass prevents inconsistency across phases.

## Key Design Decisions

### Q1: Micro-exercise redesign — RESOLVED

**Decision:** Reorder the talk phase to show the contrast first, thesis second. Redesign the contrast from "prompt quality" (different prompts, same repo) to "repo readiness" (same prompt, different repo context). Add a 30-second participatory beat after the contrast.

**Rationale:** The current micro-exercise contradicts the workshop's thesis. The talk says "we're not learning to prompt better" and then demonstrates... better prompting. The real contrast should be about the repo: same simple prompt, but one repo is bare and one has AGENTS.md + plan + constraints. The prompt stays simple. The harness does the work.

**New talk phase scene order:**
1. `talk-micro-exercise` (redesigned) — "Watch what changes when the repo has context"
   - Hero: "Same prompt. Different repo. Watch what happens."
   - Steps: (1) Variant A: simple prompt in a bare repo — agent drifts (2) Variant B: same prompt in a repo with AGENTS.md and constraints — agent produces aligned output
   - 30-sec participatory beat: facilitator asks "What changed?" and lets 2 voices answer
   - FacilitatorNotes: "This is a facilitator-led contrast. Don't narrate the conclusion before the room sees it. Let them name what they saw."
2. `talk-framing` (adjusted) — "Here's what you just saw: context is leverage, not cosmetics"
   - The thesis now lands as the answer to a question the room already has
   - Remove redundant restatements (currently stated 4 times in this scene)
   - The authority quote ("Humans steer. Agents execute.") moves to open the scene as a provocation
3. `talk-participant-view` — Bridge into Build 1 (largely unchanged)

**Demo prep requirement:** Two pre-prepared folders (or a `harness demo-setup` CLI command):
- Folder A: bare repo with the project brief only
- Folder B: same repo with AGENTS.md (goal, context, constraints, done when), plan, and workshop skill installed
The facilitator runs the same prompt in both. Folder B should already have skills so the agent can kick off workflow patterns (brainstorm, plan suggestions).

**Alternatives rejected:** "Prompt quality contrast" — contradicts thesis. "Full team exercise" — too much time, tool readiness not guaranteed.

### Q2: Silent retrieval in intermezzos — RESOLVED

**Decision:** Add a mandatory scene at the start of both intermezzos: "3 minutes. Write before you speak." The written answers should be captured (repo commit, skill command, or paper cards) so they feed into the closing reveal.

**The flow:**
1. 3 minutes silent individual thinking
2. 2 minutes team discussion
3. One person writes the team's answer (to repo via skill, or on a card)
4. Room shares

**Retrieval prompts:**
- Intermezzo 1: "What would the next team need to find in your repo right now to continue without asking you?"
- Intermezzo 2: "Name one thing that genuinely helped you continue after rotation, and one that was missing."

**Scene design (projected):**
- Hero: "3 minutes. Write before you speak."
- Callout with the retrieval question
- That's it. Minimal. The silence does the work.

**Capture mechanism:** Open question for the plan. Options: (a) `$workshop checkpoint` skill command that saves to repo, (b) paper cards collected by facilitator, (c) dashboard API submission. The mechanism must be simple enough that it doesn't eat into the 3 minutes.

**Rationale:** Retrieval practice requires producing an answer from memory before receiving feedback. If the facilitator summarizes first, participants receive the answer before they retrieve it. The 3-minute silence is the most research-supported learning intervention in the workshop.

### Q3: Pre-rotation handoff gate — RESOLVED

**Decision:** Silent facilitator check during lunch. No projected gate scene for participants. The facilitator checks repos during lunch and only intervenes on genuinely unusable repos (not "weak" but "broken").

**Rationale:** The surprise and friction of the rotation IS the learning signal. If teams know there's a gate, they'll cram at the last minute, learning "fix before the deadline" rather than "build right from the start." The rotation should test what teams genuinely built, not what they patched in the last 10 minutes.

**Where this lives:** FacilitatorRunner for the lunch-reset phase, plus master guide prose. Not in the agenda scenes. The facilitator's say/do/watch for lunch-reset should include: "During lunch, quietly check each team's repo. If a repo is genuinely unusable (no AGENTS.md at all, no code, broken setup), help the team write the minimum. Frame it as coaching, not a gate."

**Alternatives rejected:** Visible gate scene — would cause cramming behavior. No gate at all — a broken repo (vs. a weak one) doesn't teach anything useful.

### Q4: Monday commitments scene — RESOLVED

**Decision:** Add a scene to the reveal phase: `reveal-monday-commitments`.

**Scene design (projected):**
- Hero: "Write one sentence you'll act on Monday"
- Steps block with the format: "Next week I will [specific action] because [specific reason from today]."
- Callout (anti-pattern): "Not: 'I will work better with agents.' Yes: 'I will add Goal, Context, Constraints, Done When to my main repo's AGENTS.md before my next agent task.'"
- Callout (tool-agnostic): "These practices work with any coding agent. The harness is the repo, not the tool."

**Rationale:** The master guide says "reflexe bez zápisu se do pondělí většinou neudrží." The written commitment artifact is the one thing that bridges workshop learning to real behavior. It must be a first-class scene, not a guide footnote.

### Q5: Build Phase 2 codification pause — RESOLVED

**Decision:** Add a scene `build-2-codification-pause` as the first scene of Build Phase 2.

**Scene design (projected):**
- Hero: "Before you write code: name one friction and encode it"
- Callout: "What in this rotation caused friction? Write it into the repo as a rule, a check, or a clearer AGENTS.md section. Only after it's written do you continue."
- Duration: 5 minutes. Enforced by facilitator.

**Rationale:** Habits 5 ("cleanup is part of build") and 6 ("fix the system, not the symptom") can only fire after the rotation creates friction. Without a structured pause, teams default to feature continuation. This is the environment-design move that makes encoding friction the default action.

### Q6: Build Phase 1 milestones — RESOLVED

**Decision:** Keep all 6 milestones including "runnable slice." Do not reduce.

**Rationale:** With AI agents and teamwork, teams should be able to produce a runnable slice before lunch. The milestone board is aspirational but achievable. The facilitator should coach teams that are behind rather than lowering the bar.

**Note:** This overrides the panel's recommendation. The panel flagged this as potentially too ambitious; the workshop creator disagrees and wants to keep the full target.

### Q7: Demo honest failure moment — RESOLVED

**Decision:** Integrate the failure moment into the redesigned micro-exercise (Q1). When showing Variant A (bare repo), the agent's drift IS the failure moment. The facilitator narrates WHY the agent drifted — naming specific failure modes (task drift, missing constraints, plausible-but-wrong architecture decisions).

**Additionally:** The demo can mention real tool gaps honestly:
- Codex lacks rewind/undo that Claude Code and Cursor have
- Recovery workflow: check the diff, add the constraint to AGENTS.md, try again
- Plugins landscape: MCP vs. skills, what's portable

**Rationale:** A demo that includes failure and honest tool constraints is more credible with senior engineers than a clean run. The failure doesn't need a separate scene — it's built into the contrast.

### Q8: Named agent failure modes in facilitator prompts — RESOLVED

**Decision:** Add 2-3 sentences to each build phase's `facilitatorRunner.say` naming the specific failure mode the phase defends against:

- **Build Phase 1:** "An agent that starts without constraints will make plausible but wrong architectural decisions. This is task drift. AGENTS.md constraints are the fix."
- **Rotation:** "A new agent session has no memory of the previous session. If your context is in chat only, the session starts blind. This is why the repo is the session state."
- **Build Phase 2:** "When the agent generates tests as part of the same task, those tests reflect the agent's interpretation, not your specification. Independent verification means: you wrote the done criteria, or a separate check evaluates the output."

**Where this lives:** FacilitatorRunner (say array), not projected scenes. The facilitator weaves these into coaching moments.

### Q9: Tool-agnostic translation — RESOLVED

**Decision:** Add a brief tool-agnostic callout to the Monday commitments scene (Q4). Move `harness skill install` to a pre-workshop prerequisite email/instruction rather than three in-day mentions.

**Copy for the callout:** "These practices work with any coding agent — Codex, Claude Code, Cursor, Copilot. AGENTS.md, plan-first, verification-first are tool-agnostic. The harness is the repo, not the tool."

**Rationale:** The Pragmatic Engineer 2026 data shows enterprise procurement locks teams into specific tools. Participants returning to companies where the workshopped tool isn't approved need to know the practices transfer.

### Q10: Facilitator mode labels — RESOLVED

**Decision:** Add a short mode tag to each scene's `facilitatorNotes` indicating the facilitator's role in that moment: `[TEACHING]`, `[COACHING]`, `[NARRATING]`, `[FACILITATING]`.

**Not projected.** Visible only in the facilitator dashboard view. Helps facilitators navigate register shifts between scenes.

## Existing Scene Copy Refinements

Beyond the structural changes above, the panel identified several copy-level improvements to existing scenes:

### Opening phase: reduce negation saturation
- "Not prompt theatre" / "not a feature race" appears 3+ times in the opening phase across different scenes. Keep it once (the framing hero). Subsequent scenes should carry their own message rather than restating the negation.
- The opening-framing scene has two callout blocks ("The main line for today" and "What should change today") that are functionally identical. Merge into one or cut one.

### Opening: contract + participant-view redundancy
- `opening-room-contract` and `opening-participant-view` restate the same checklist. Consider merging or cutting the participant-view since teams will see it again in `build-1-milestones`.

### Talk: authority quote positioning
- The Lopopolo quote ("Humans steer. Agents execute.") currently floats between the hero and the reframe callout. Move it to open the scene (as a provocation) or close the framing scene (as a seal). After the redesign (Q1), it should open the thesis scene as the provocation that the contrast just proved.

### Demo: fallbacks to facilitator-only
- The `demo-fallbacks` link-list block (CLI not working → App, etc.) should move to facilitatorNotes. Don't show the audience your contingency plans before anything goes wrong.

### Forward-linking previews
- The "next shared beat is..." pattern from `build-1-participant-preview` is the best narrative device in the agenda. Add similar forward links to:
  - End of demo: "Next: you go back to the repo with three things."
  - End of intermezzo 1: "Take one thing from this that you'll verify before the next checkpoint."
  - End of lunch-reset: "When you return, a different team will read your repo. What will they find?"

### Repeated phrases as narrative refrains
- "Not prompt theatre," "if it's not in the repo it doesn't exist," "context is leverage not cosmetics," "evidence not impressions" — these should appear at structurally significant moments (opening states them, rotation tests them, reveal confirms them), not sprinkled through every callout block.

## Subjective Contract

- **Target outcome:** Scenes that feel lean, well-designed, and narratively coherent. Each scene should have one clear message that advances the room's understanding. The facilitator should be able to pick up any scene for the first time and know what to do.
- **Anti-goals:** Dense, information-packed slides. Facilitator jargon on projected screens. Copy that tries to be clever instead of clear.
- **References:** The current `rotation-framing` scene ("Quiet start after rotation" — hero + one callout) is the right density level. The `build-1-coaching` callout "An answer is not the same thing as help" is the right copy quality level.
- **Anti-references:** The current `talk-framing` scene (4 separate restatements of the same claim in one scene) is too dense. The `opening-participant-view` scene restating the opening contract is redundant.
- **Tone rules:** Direct, concrete, imperative. Czech voice should match the strength of the English constructions — "Friction is diagnostics" not "Frustrace je diagnostika" (use "Tření je diagnostika" or rephrase to preserve the systemic, not emotional, framing).
- **Rejection criteria:** A scene that requires facilitator narration to be understood. A scene with more than 3 blocks. A facilitatorNote longer than 2 sentences.

## Preview And Proof Slice

- **Proof slice:** Start with the redesigned talk phase (Q1): the reordered micro-exercise + thesis scene. This is the highest-impact change (affects the morning's entire learning trajectory) and the most complex (requires demo prep setup).
- **Rollout rule:** Implement the talk phase redesign first, verify it works narratively, then roll out the remaining changes phase by phase.

## Open Questions

1. **Intermezzo answer capture mechanism:** How do team answers from the silent retrieval exercise get to the facilitator? Options: skill command, repo commit, paper cards, dashboard API. Needs to be simple enough that it doesn't eat into the 3 minutes.
2. **Demo prep tooling:** Should `harness` CLI have a `demo-setup` command that prepares the two contrast folders (bare repo + harnessed repo)? Or is this a manual prep step?
3. **Skill install timing:** If we move `harness skill install` to a pre-workshop prerequisite, what's the fallback for participants who arrive without it? Brief setup window at 09:00 before the 09:10 start?
4. **Czech copy for new scenes:** All new scenes need bilingual content. The translation should preserve the imperative, direct tone. "Write before you speak" → "Pište, než promluvíte" (not "Nejdříve napište").
5. **Scene order within redesigned talk:** Should the participatory beat (30-sec question to the room) be a separate scene or a block within the micro-exercise scene? A separate scene gives the facilitator explicit navigation; a block keeps it as part of the flow.
6. **Facilitator runner completeness:** Some CS facilitatorRunners are currently empty (say: [], show: [], etc.). These need to be populated as part of this pass.

## Out of Scope

- Dashboard UI changes (facilitator control room layout, scene editor) — separate work
- Challenge card updates — the panel didn't review these
- Project brief changes — the panel validated these as well-scoped
- New phases or phase timing changes — the 10-phase structure is maintained
- Master guide rewrite — only targeted updates to reflect the new scene architecture

## Next Steps

- `/plan` to create an implementation plan from these decisions
- The plan should be organized phase-by-phase, starting with the talk phase redesign (proof slice)
- Consider running `/deep-thought:review` on the completed scene changes before merging
