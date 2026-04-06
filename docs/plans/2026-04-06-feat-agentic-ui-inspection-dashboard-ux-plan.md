---
title: "feat: agentic UI inspection and dashboard UX refactor"
type: plan
date: 2026-04-06
status: complete
brainstorm:
confidence: high
---

# Agentic UI Inspection And Dashboard UX Refactor Plan

Define a safe, teachable workflow for agent-driven browser inspection and use it to refactor the workshop dashboard into a clearer, more participant-friendly experience with regression protection.

## Problem Statement

Harness Lab now teaches that coding agents need explicit verification, and the repo already includes unit tests, store tests, and browser regression checks. But there are still two gaps:

1. the workshop does not yet teach a concrete, safe default for agent-driven UI inspection in the coding-agent era
2. the dashboard UI is still a functional MVP, not a deliberately excellent participant/facilitator experience

Right now the participant surface is too dense, still leaks facilitator/operator thinking, and makes the “what do I do next?” question harder than it should be. At the same time, we need a credible recommendation for how participants should use agentic browser inspection without encouraging unsafe browser autonomy in their real dev browser.

## External Grounding

Current official guidance suggests a layered approach rather than a single tool:

- OpenAI’s computer use guidance positions browser/GUI control as powerful but risky, requiring sandboxing, human oversight, and constrained environments for higher-risk use.
- Playwright best practices emphasize isolated tests that verify user-visible behavior and remain reproducible.

Inference from these sources:

- exploratory agent-driven browser inspection is best treated as a fast feedback loop
- repeatable Playwright-style tests are best treated as the regression layer
- raw autonomous browser control should not be the default recommendation for developers in their everyday authenticated environment

## Proposed Solution

Adopt a three-part pattern for UI work in Harness Lab:

1. **Safe agentic browser inspection**
   Recommend a local isolated app plus agent inspection of rendered UI, screenshots, and browser-console evidence before touching any higher-risk browser autonomy.

2. **Repeatable browser regression protection**
   Promote critical flows into Playwright tests that answer: “did we break something that used to work?”

3. **Dashboard UX refactor guided by that workflow**
   Redesign the participant surface around phase-first orientation and a dominant next-step flow, while keeping facilitator operations in the protected admin surface.

## Detailed Plan Level

This is a **detailed** plan because it changes product behavior, workshop pedagogy, testing strategy, and the operational story around agentic UI work.

## Decision Rationale

### Why not recommend unrestricted computer use as the default

- It encourages developers to let an agent act inside a browser context that may contain real sessions, credentials, and production-adjacent access.
- That is misaligned with the workshop’s own message about trust boundaries and explicit verification.
- Official computer-use guidance treats the capability as powerful but safety-sensitive rather than a blanket default.

### Why recommend “agent for exploration, Playwright for regression”

- It separates fast discovery from stable protection.
- It maps to what we actually observed while working on this repo: agent-driven inspection was fast for qualitative review, while Playwright was the right fit for locking in critical flows.
- It gives workshop participants a practical path they can adopt immediately without waiting for full autonomous-browser stacks.

### Why redesign the participant surface now

- The current page still optimizes for “show everything we have” instead of “help the participant act now”.
- Participant and facilitator concerns are still visually too close together.
- If Harness Lab is going to teach taste and workflow discipline, the workshop UI itself needs to demonstrate that discipline.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Developers in the workshop will benefit from a concrete recommendation for safe UI inspection with agents | Verified | User requirement in this thread; current repo already added browser tests and agent UI testing docs |
| OpenAI computer use should be positioned as sandboxed/safety-sensitive rather than the default UI workflow | Verified | Official OpenAI computer-use guidance emphasizes sandboxing, limited privileges, and human oversight |
| Playwright remains the best default choice for repeatable browser regression checks in this repo | Verified | Current repo implementation succeeded with Playwright and matches official Playwright best practices |
| The participant surface can be materially simplified without losing useful workshop context | Verified | Browser inspection of the current UI showed density, weak hierarchy, and participant/operator mixing |
| The facilitator surface should remain a protected operational console rather than a polished participant-facing page | Verified | Existing product boundary and use case already support this |

## Risk Analysis

### Risk: The workshop over-prescribes one tool instead of one pattern

If the messaging says “use this exact tool” rather than “use this layered workflow”, it will age poorly and exclude participants with different stacks.

Mitigation:
- teach the pattern first
- position Playwright and agent inspection as the default implementation of that pattern in this repo
- treat computer use / DevTools / other tools as variants, not the core lesson

### Risk: UX refactor breaks workshop-critical flows

If we simplify too aggressively, we could hide information facilitators or participants still need during the day.

Mitigation:
- keep the participant surface focused on phase, next step, brief, and current challenge flow
- keep richer operational controls in admin
- lock critical participant and admin paths with browser tests before and during refactor

### Risk: Agentic browser inspection becomes unsafe in practice

If participants hear “agents can browse the UI for you” without safety framing, they may use that advice in real authenticated browsers with too much trust.

Mitigation:
- explicitly document the default safe workflow: isolated app, low-risk browser state, human review, executable checks
- frame unrestricted computer use as an advanced, sandboxed capability

## Phased Implementation

### Phase 1: Define the workshop recommendation for UI verification

Goal: establish one clear workshop-default pattern for UI work with agents.

Tasks:
- [x] Write a short workshop-facing guideline describing the default stack:
  `agent exploration -> Playwright regression -> human review`.
- [x] Document when sandboxed computer use is appropriate and when it is not.
- [x] Add a concise “safe by default” version for participant-facing materials.
- [x] Add a deeper developer-facing version for repo contributors and facilitators.

Exit criteria:
- a participant can explain the recommended UI workflow in one minute
- the recommendation does not imply trusting unrestricted browser autonomy by default

### Phase 2: Refactor the participant surface around workshop flow

Goal: make the public dashboard answer “where are we, what should we do now, and what matters next?”

Tasks:
- [x] Redesign the hero area so the current phase and next step dominate the screen.
- [x] Move facilitator/operator concepts off the participant surface where possible.
- [x] Reduce density by collapsing, cutting, or relocating low-priority sections.
- [x] Rework mobile hierarchy so the first screen gives orientation without long scrolling.
- [x] Keep the tone visually bold and workshop-specific rather than generic admin UI.

Exit criteria:
- the participant surface has a clear primary action hierarchy
- mobile-first scanning cost is substantially lower than today
- participant and facilitator concerns are visually separated

### Phase 3: Strengthen the facilitator surface as an operational console

Goal: keep `/admin` pragmatic and fast while improving clarity and safety.

Tasks:
- [x] Group admin actions by job: workshop state, teams, checkpoints, reveal/transition controls.
- [x] Improve affordance hierarchy so destructive or high-impact actions are obvious.
- [x] Add clearer action/result feedback where needed.
- [x] Keep the admin surface optimized for speed, not ornamental polish.

Exit criteria:
- a facilitator can use the admin page with minimal hesitation during a live workshop
- admin actions are easier to scan and harder to misuse

### Phase 4: Expand browser-based verification around the refactor

Goal: ensure the refactor ships with stronger regression protection than the current MVP.

Tasks:
- [x] Add at least one more participant-surface Playwright regression around the dominant workshop flow.
- [x] Add at least one more admin/regression path beyond the current unlock flow.
- [x] Add browser-console or page-error inspection to the documented review routine.
- [x] Keep state isolation for browser tests so flows stay reproducible.

Exit criteria:
- critical participant and facilitator paths are covered by repeatable browser tests
- browser inspection is part of the documented workflow, not an ad hoc trick

### Phase 5: Align workshop messaging with the implemented workflow

Goal: make repo docs, skill guidance, and talk/facilitation language say the same thing.

Tasks:
- [x] Update workshop messaging to present safe agentic browser inspection as a default pattern for UI work.
- [x] Ensure tests, browser inspection, and human review are presented as complementary layers.
- [x] Remove any copy that suggests “just let the model drive your browser” is the default.
- [x] Add one concrete example of the pattern applied to the dashboard itself.

Exit criteria:
- participant-facing and contributor-facing materials tell one coherent story
- the dashboard becomes an example of the lesson rather than just the delivery vehicle

## Implementation Tasks

1. **UI verification guidance**
- [x] Write workshop-safe guidance for agentic UI inspection.
- [x] Add contributor/facilitator guidance for deeper implementation details.

2. **Participant UX redesign**
- [x] Simplify the participant dashboard to phase-first, next-step-first UX.
- [x] Remove or relocate participant-irrelevant operational sections.
- [x] Improve mobile-first hierarchy.

3. **Facilitator UX refinement**
- [x] Reorganize admin controls by operational job.
- [x] Improve action clarity and safety affordances.

4. **Regression coverage**
- [x] Expand Playwright coverage for participant and facilitator flows.
- [x] Keep browser state isolated and reproducible.
- [x] Include browser console/page-error inspection in the documented review loop.

5. **Messaging alignment**
- [x] Update docs, workshop skill, and talk/facilitation copy to match the new pattern.
- [x] Add one repo-native example of the pattern applied here.

## Acceptance Criteria

- Harness Lab has a clear default recommendation for UI work with agents that is safe, practical, and tool-agnostic at the pattern level.
- The workshop does not present unrestricted computer use as the default recommendation for development work in a real authenticated browser.
- The participant dashboard is materially simpler, more phase-first, and more usable on mobile.
- The admin surface is clearer as a facilitator control plane.
- Critical participant and facilitator flows are protected by repeatable browser regression tests.
- The repo documents both halves of the practice: exploratory agent inspection and repeatable regression testing.
- A new contributor can continue the dashboard work using the documented workflow without guessing.

## References

### Local references

- [`docs/agent-ui-testing.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/agent-ui-testing.md)
- [`docs/dashboard-testing-strategy.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/dashboard-testing-strategy.md)
- [`dashboard/e2e/dashboard.spec.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/e2e/dashboard.spec.ts)
- [`dashboard/playwright.config.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/playwright.config.ts)
- [`dashboard/app/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/page.tsx)
- [`dashboard/app/admin/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/page.tsx)

### External references

- OpenAI, "Computer use"  
  https://platform.openai.com/docs/guides/tools-computer-use
- OpenAI, "Computer-Using Agent"  
  https://openai.com/index/computer-using-agent/
- Playwright, "Best Practices"  
  https://playwright.dev/docs/best-practices
