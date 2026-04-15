---
title: "feat: expert panel scene updates"
type: plan
date: 2026-04-10
status: complete
brainstorm: ../brainstorms/2026-04-10-expert-panel-scene-updates-brainstorm.md
confidence: high
---

# Expert Panel Scene Updates Plan

Apply the 10 prioritized actions from the 5-framework expert panel review to the workshop agenda scenes, facilitator runners, and supporting content.

## Problem Statement

A 5-framework expert panel review identified that the workshop's most critical teaching mechanisms exist only in blueprint prose, not in the scenes a facilitator presents. The micro-exercise contradicts the workshop's own thesis (demonstrates better prompting while claiming "we're not learning to prompt better"). The intermezzos lack retrieval practice. Habits 5 and 6 have no structured practice moment. The Monday commitment is missing as a scene. Existing scene copy has redundancy and saturation issues.

## Relationship To Prior Work

This plan builds on the completed work from `2026-04-09-feat-opening-talk-reset-and-facilitator-runner-plan.md` (status: complete, most tasks done). That plan established:
- Opening and talk as one launch arc
- Lego duck analogy and room activation beats
- FacilitatorRunner structure (say/show/do/watch/fallback)
- Checkbox-free visual patterns

This plan does NOT redo that work. It applies framework-grounded refinements from the expert panel review on top of the existing scene content.

## Target End State

When this lands:
- The talk opens with the repo-readiness contrast (show first), then names the thesis (tell second)
- Both intermezzos begin with a 3-minute silent retrieval exercise as a first-class scene
- The reveal phase includes a Monday commitments scene with tool-agnostic framing
- Build Phase 2 opens with a 5-minute codification pause
- Facilitator runners name specific agent failure modes
- Existing scene copy is tighter: no redundant scenes, no oversaturated refrains, no fallback lists on projected screens

## Scope

**In scope:**
- Scene additions (4 new scenes across 3 phases)
- Scene modifications (reorder, copy refinement, block changes in existing scenes)
- FacilitatorRunner updates (agent failure modes, silent gate, mode labels)
- Master guide targeted updates to match scene changes

**Out of scope:**
- Dashboard UI changes (control room layout, scene editor)
- New block types or rendering changes
- Phase timing changes (the 10-phase structure is maintained)
- Challenge card or project brief updates
- Full master guide rewrite

## Implementation Tasks

Tasks are ordered by dependency. Work phase-by-phase through the agenda.

### Phase A: Talk phase redesign (proof slice)

This is the highest-impact change and should be implemented first.

- [x] **A1. Redesign the micro-exercise scene for repo-readiness contrast**
  - Rewrite `talk-micro-exercise` (id: `talk-micro-exercise`) to show repo context contrast instead of prompt quality contrast
  - New scene content:
    - `sceneType`: "demo", `intent`: "walkthrough", `chromePreset`: "agenda"
    - Hero or steps block showing: "Same prompt. Different repo. Watch what happens."
    - Step 1: Variant A — simple prompt in a bare repo, agent drifts
    - Step 2: Variant B — same prompt in a repo with AGENTS.md + constraints, agent produces aligned output
    - Callout: "The prompt didn't change. The repo did."
  - FacilitatorNotes: "This is a facilitator-led contrast. Don't narrate the conclusion before the room sees it. After showing both variants, pause and ask the room: 'What changed?' Let two voices answer before naming the thesis. [NARRATING]"
  - Update both `en` and `cs` content
  - Update `sourceRefs` to point to the talk source and demo script

- [x] **A2. Reorder talk scenes: contrast before thesis**
  - Change the `talk` phase's `defaultSceneId` from `talk-framing` to `talk-micro-exercise`
  - Reorder scenes array: `talk-micro-exercise` → `talk-framing` → `talk-participant-view`
  - The micro-exercise now opens the talk; the thesis scene follows as "here's what you just saw"

- [x] **A3. Adjust the thesis scene to land as answer, not claim**
  - Rewrite `talk-framing` hero to open with a question or reframe: "What you just saw: context is leverage, not cosmetics"
  - Move the Lopopolo quote ("Humans steer. Agents execute.") to open the scene as a provocation that the contrast just proved
  - Reduce the four restatements of the thesis to one clear statement + the checklist
  - Remove the `talk-reframe` callout (redundant after the contrast lands)
  - FacilitatorNotes: "The thesis arrives as the answer to a question the room already has. Say it once, clearly. Don't re-explain the contrast — the room saw it. [TEACHING]"

- [x] **A4. Update the talk-phase facilitatorRunner**
  - Update `facilitatorRunner.say` to reflect the new order: contrast first, then thesis
  - Add to `facilitatorRunner.say`: "After the contrast, ask the room: 'What changed?' Let two voices answer."
  - Add agent failure mode language: "Name what you saw: the agent in the bare repo made plausible but wrong decisions because it had no constraints. This is task drift."
  - Update `facilitatorRunner.do` with the contrast flow steps
  - Update `facilitatorRunner.fallback`: "If live demo drags, use pre-prepared screenshots. The contrast matters more than live generation."

- [x] **A5. Create demo prep specification**
  - Document the two-folder setup in `content/talks/codex-demo-script.md`:
    - Folder A: bare repo with project brief only, no AGENTS.md, no context
    - Folder B: same repo with AGENTS.md (goal, context, constraints, done when), plan, workshop skill installed
  - Note: Folder B should have skills installed so the agent can kick off workflow patterns
  - Add as open question: whether `harness` CLI should have a `demo-setup` command

### Phase B: Intermezzo scenes

- [x] **B1. Add silent retrieval scene to Intermezzo 1**
  - Add new scene `intermezzo-1-silent-retrieval` as the FIRST scene in the `intermezzo-1` phase
  - Scene spec:
    - `id`: "intermezzo-1-silent-retrieval"
    - `sceneType`: "checkpoint"
    - `intent`: "checkpoint"
    - `chromePreset`: "minimal"
    - `defaultSceneId` of phase changes to this scene
  - EN blocks:
    - Hero: eyebrow "Intermezzo 1", title "3 minutes. Write before you speak.", body "Each person writes individually. No sharing yet."
    - Callout (tone: "info"): title "The question", body "What would the next team need to find in your repo right now to continue without asking you?"
  - CS blocks: matching Czech content preserving imperative tone
  - FacilitatorNotes: ["Enforce the silence. If anyone starts discussing, redirect: 'Write first, then we'll share.' After 3 minutes, open team discussion for 2 minutes, then room sharing. [FACILITATING]"]

- [x] **B2. Add silent retrieval scene to Intermezzo 2**
  - Add new scene `intermezzo-2-silent-retrieval` as the FIRST scene in the `intermezzo-2` phase
  - Same structure as B1, with different retrieval question:
    - EN: "Name one thing that genuinely helped you continue after rotation, and one that was missing."
    - CS: matching Czech
  - Update `defaultSceneId` of `intermezzo-2` phase to this scene

- [x] **B3. Update intermezzo facilitatorRunners**
  - Add to both intermezzo `facilitatorRunner.do`: "Start with the silent retrieval scene. 3 minutes individual writing, then 2 minutes team discussion, then room sharing."
  - Add to `facilitatorRunner.watch`: "If someone starts talking during the silent phase, redirect. The retrieval benefit requires individual production before social sharing."

### Phase C: Reveal phase additions

- [x] **C1. Add Monday commitments scene**
  - Add new scene `reveal-monday-commitments` to the `reveal` phase, positioned between `reveal-w3` and `reveal-participant-view`
  - Scene spec:
    - `id`: "reveal-monday-commitments"
    - `sceneType`: "reflection"
    - `intent`: "reflection"
    - `chromePreset`: "minimal"
  - EN blocks:
    - Hero: eyebrow "Monday", title "Write one sentence you'll act on Monday", body "Not an aspiration. A concrete move."
    - Steps (1 item): title "The format", body "Next week I will [specific action] because [specific reason from today]."
    - Callout (tone: "warning"): title "Be specific enough to check", body "Not: 'I will work better with agents.' Yes: 'I will add Goal, Context, Constraints, Done When to my main repo's AGENTS.md before my next agent task.'"
    - Callout (tone: "info"): title "The harness is the repo, not the tool", body "These practices work with any coding agent — Codex, Claude Code, Cursor, Copilot. What you learned today is tool-agnostic."
  - CS blocks: matching Czech
  - FacilitatorNotes: ["Collect the written commitments (cards, repo commits, or shared doc). Push for specificity: if someone writes something vague, ask 'What is the first concrete move that starts this?' [COACHING]"]

- [x] **C2. Update reveal facilitatorRunner**
  - Add to `facilitatorRunner.say`: "These practices are tool-agnostic. If you're back in a different toolchain Monday, the principles transfer: context in tracked artifacts, plan before motion, verification before trust."
  - Add to `facilitatorRunner.do`: "After W3, run the Monday commitments: each person writes one sentence. Collect them."

### Phase D: Build Phase 2 codification pause

- [x] **D1. Add codification pause scene**
  - Add new scene `build-2-codification-pause` as the FIRST scene in the `build-2` phase, before `build-2-handoff-work`
  - Scene spec:
    - `id`: "build-2-codification-pause"
    - `sceneType`: "checkpoint"
    - `intent`: "checkpoint"
    - `chromePreset`: "checkpoint"
  - EN blocks:
    - Hero: eyebrow "Build Phase 2", title "Before you write code: name one friction and encode it", body "5 minutes. Name what caused friction in the rotation. Write it into the repo."
    - Callout (tone: "warning"): title "Encode, then continue", body "Write it as a rule, a check, or a clearer AGENTS.md section. Only after it's written do you move to feature work."
  - CS blocks: matching Czech
  - FacilitatorNotes: ["This is the trigger for Habits 5 and 6. Enforce the 5-minute pause. Teams will want to jump to coding — redirect them to the encoding step first. [COACHING]"]
  - Update `defaultSceneId` of `build-2` phase to this scene

- [x] **D2. Update Build Phase 2 facilitatorRunner**
  - Add to `facilitatorRunner.say`: "When the agent generates tests as part of the same task, those tests reflect the agent's interpretation, not your specification. Independent verification means: you wrote the done criteria, or a separate check evaluates the output."
  - Add to `facilitatorRunner.do`: "Start with the codification pause. 5 minutes. Only after teams have encoded at least one friction point do they continue building."

### Phase E: FacilitatorRunner agent failure modes

- [x] **E1. Add agent failure mode language to Build Phase 1 runner**
  - Add to `build-1` EN `facilitatorRunner.say`: "An agent that starts without constraints will make plausible but wrong architectural decisions. This is task drift. AGENTS.md constraints are the fix."
  - Add matching CS translation

- [x] **E2. Add agent failure mode language to rotation runner**
  - Add to `rotation` EN `facilitatorRunner.say`: "A new agent session has no memory of the previous session. If your context is in chat only, the session starts blind. This is why the repo is the session state."
  - Add matching CS translation

- [x] **E3. Add silent gate check to lunch-reset runner**
  - Add to `lunch-reset` EN `facilitatorRunner.do`: "During lunch, quietly check each team's repo. If a repo is genuinely unusable (no AGENTS.md at all, no code, broken setup), help the team write the minimum. Frame it as normal coaching, not a gate."
  - Add to `facilitatorRunner.watch`: "The gate is silent — participants should not know there's a check. Only intervene on genuinely broken repos, not weak ones."
  - Add matching CS translations

### Phase F: Existing scene copy refinements

- [x] **F1. Reduce "not prompt theatre" saturation in opening**
  - Keep the phrase in `opening-framing` hero block only
  - Remove or rephrase in `opening-framing-shift` callout (merge with the other callout or cut)
  - Remove from `opening-participant-view` hero (replace with its own distinct message)
  - Check across all phases: the phrase should appear at opening (states it), rotation (tests it), reveal (confirms it) — not everywhere

- [x] **F2. Merge or cut redundant opening contract/participant-view**
  - `opening-room-contract` and `opening-participant-view` restate the same checklist
  - Option: cut `opening-participant-view` entirely since teams will see the same content in `build-1-milestones`
  - Or: keep `opening-participant-view` but give it a distinct message (forward-linking to the talk, not restating the contract)

- [x] **F3. Move demo fallbacks to facilitator-only**
  - Remove the `demo-fallbacks` link-list block from `demo-workflow` scene's projected blocks
  - Move the fallback information to `demo-workflow` facilitatorNotes
  - The projected screen should show only the workflow steps and the point callout

- [x] **F4. Add forward-linking previews to more phases**
  - Add `participant-preview` blocks to scenes that currently lack them:
    - End of demo phase: "Next: you go back to the repo with three things."
    - End of intermezzo 1: "Take one thing from this that you'll verify before the next checkpoint."
    - End of lunch-reset: "When you return, a different team will read your repo without asking you. What will they find?"
  - These go in participant-view scenes where they exist, or as callout blocks in the closing scene of each phase

- [x] **F5. Add facilitator mode labels to all scene facilitatorNotes**
  - Add `[TEACHING]`, `[COACHING]`, `[NARRATING]`, or `[FACILITATING]` tag to the end of each scene's first facilitatorNote
  - Apply consistently across all 10 phases, both EN and CS
  - Convention: the tag describes the facilitator's primary role in that scene

### Phase G: Supporting content updates

- [x] **G1. Update codex-demo-script.md with repo-contrast design**
  - Rewrite the demo script to reflect the new contrast: same prompt, different repo context
  - Add the two-folder setup specification
  - Add the honest failure narration: name task drift explicitly when showing Variant A
  - Add notes about tool-specific realities to mention during the demo (Codex lacks rewind/undo, MCP vs. skills)

- [x] **G2. Update master-guide.md with new intermezzo protocol**
  - Add the 3-minute silent retrieval exercise to the Intermezzos section
  - Make it explicit that this is mandatory, not optional
  - Add the silent gate check to the Lunch and Handoff Prep section
  - Add Monday commitments to the Reveal and Reflection section

- [x] **G3. Move skill install to pre-workshop prerequisite**
  - Remove the repeated `harness skill install` mentions from talk and demo scenes (currently appears 3+ times)
  - Add one brief mention in the `talk-participant-view` bridge scene as a fallback: "If the workshop skill is not installed yet, do it now."
  - Document the pre-workshop prerequisite in operator-guide.md or a separate pre-workshop checklist

- [x] **G4. Run content generation**
  - After all agenda.json changes: run `npm run generate:content` from the dashboard directory
  - Verify `dashboard/lib/generated/agenda-en.json` and `agenda-cs.json` are correctly generated
  - Verify the public blueprint `workshop-blueprint/agenda.json` is updated if needed

## Acceptance Criteria

- The talk phase opens with the repo-readiness contrast and names the thesis second
- Both intermezzos begin with a silent retrieval scene that enforces 3-minute individual writing
- The reveal phase includes a Monday commitments scene with tool-agnostic framing
- Build Phase 2 opens with a codification pause scene
- All build-phase facilitatorRunners name at least one specific agent failure mode
- The lunch-reset facilitatorRunner includes the silent gate check
- "Not prompt theatre" appears at most 3 times in the entire agenda (opening, rotation context, reveal)
- The demo fallbacks are not on the projected screen
- All new scenes have both EN and CS content with `cs_reviewed: false` (pending review)
- Content generation runs successfully after all changes

## Decision Rationale

### Why repo-readiness contrast instead of prompt contrast

The current micro-exercise shows two different prompts and claims "we're not learning to prompt better." This is a contradiction. The repo-readiness contrast (same prompt, different repo context) directly proves the thesis: the harness does the work, not the prompt. This decision was made during the brainstorm after Ondrej identified that skilled practitioners don't put Goal/Context/Constraints/Done When into prompts — they put it into the repo and use simple prompts.

### Why silent facilitator gate instead of visible gate

Ondrej's judgment: the surprise and friction of the rotation IS the learning signal. A visible gate causes cramming behavior ("fix before the deadline") rather than the intended lesson ("build right from the start"). The facilitator checks repos during lunch and only intervenes on genuinely unusable repos.

### Why keep 6 milestones in Build Phase 1

The panel recommended reducing to 4. Ondrej overruled: with AI agents and teamwork, a runnable slice before lunch is achievable. The milestone board is aspirational but not unrealistic.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| The prior opening/talk reset (April 9 plan) is complete enough to build on | Verified | Most tasks checked off; only proof artifacts remain |
| The agenda JSON schema supports all needed block types | Verified | Schema analysis confirms hero, callout, steps, checklist, bullet-list, quote, participant-preview all available |
| Content generation script handles new scenes correctly | Verified | Script at `scripts/content/generate-views.ts` processes all phases/scenes from the bilingual source |
| The facilitator dashboard renders facilitatorNotes per scene | Likely | Architecture supports it per prior plan; needs verification |
| Pre-prepared demo folders are feasible to set up | Unverified | Needs investigation — may require a `harness demo-setup` CLI command |

## Risk Analysis

### Risk: The repo-contrast demo is harder to prepare than the prompt contrast

The new contrast requires two pre-configured folders. If the facilitator can't reliably set these up, the demo fails.

Mitigation: Document the setup clearly in `codex-demo-script.md`. Consider a `harness demo-setup` CLI command. Always have screenshots as fallback.

### Risk: Czech translations of new scenes drift from English intent

All new scenes need bilingual content. Czech translations must preserve the imperative, direct tone.

Mitigation: Mark all new scenes with `cs_reviewed: false`. Apply the same editorial review process used for existing scenes.

### Risk: Scene count growth makes the agenda harder to navigate

Adding 4 new scenes across 3 phases increases the total scene count. The facilitator dashboard must remain navigable.

Mitigation: New scenes are lean (hero + 1-2 blocks max). They serve specific, non-redundant purposes. The codification pause and silent retrieval scenes are short by design.

## References

- [Expert panel review](../reviews/2026-04-10-expert-panel-agenda-presentation-review.md)
- [Expert panel brainstorm](../brainstorms/2026-04-10-expert-panel-scene-updates-brainstorm.md)
- [Prior opening/talk reset plan](./2026-04-09-feat-opening-talk-reset-and-facilitator-runner-plan.md)
- [Scene editorial rollout plan](./2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md)
- [Presenter rich scene authoring guide](../presenter-rich-scene-authoring.md)
- [Bilingual agenda source](../../workshop-content/agenda.json)
- [Content generation script](../../scripts/content/generate-views.ts)
