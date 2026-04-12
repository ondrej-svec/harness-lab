# Workshop Reference

> **Language:** This reference is authored in English and is the canonical source
> for the workshop skill. The agent responds in the participant's language —
> translate on the fly; do not maintain parallel locale copies. See ADR
> `docs/adr/2026-04-12-skill-docs-english-canonical.md` for context.

## 4 working defaults for today

- `Map before motion` — first make the repo a place people can navigate
- `If it is not in the repo, it does not exist` — important agreements, rules, and next steps belong in files
- `Verification is the trust boundary` — more autonomy requires stronger evidence
- `Handoff is a continuous constraint` — the next team should find the first safe move without your explanation
- `Fix the system, not just the symptom` — when the same thing repeats, do not fix the output, fix the system

## 4 elements of a good task

- `Goal` — what exactly the agent should create or change
- `Context` — which files, decisions, and surrounding facts matter for the task
- `Constraints` — the rules, standards, and solution boundaries
- `Done When` — how you will know the work is actually finished

## Fast handoff checklist

- Does `AGENTS.md` exist?
- Is `AGENTS.md` a short map rather than an overgrown dump?
- Are there build and test commands in the repo that another team can run?
- Is it clear what already works, what is in progress, and what is still only an idea?
- Is there a plan, runbook, or another document that helps the next team understand the intent?
- Can you find what was actually verified?
- Can a new team find the first safe move within a few minutes?

## 3 questions to return to when you get stuck

- What are we trying to prove right now?
- Which artifact or repo signal is missing?
- What is the smallest check that moves the work from confidence back to reality?

## What to reach for during the day

- After the opening and talk: `workshop setup` or `workshop reference`
- In Build 1: `template-agents`, the brief, the plan, and the first check
- Before lunch: write the next safe move and use `workshop analyze` if the handoff still feels vague
- After rotation: `workshop analyze`, the learner kit, and challenge cards instead of verbal rescue
- At the end of the day: `workshop recap` and `workshop follow-up`

## Recommended commands

- Workshop skill in Codex: `$workshop ...`
- Workshop skill in pi: `/skill:workshop`, then ask for `reference`, `setup`, `brief`, or another workshop action
- If you do not know what the skill can do: `Codex: $workshop commands`
- The workshop skill is the guaranteed default. Workflow skills and external toolkits are recommended accelerators, not mandatory bootstrap.
- Workflow skills like `$brainstorm`, `$plan`, `$work`, `$test-writer`, `$review`, and `$compound` are described Codex-first in this workshop. In pi, treat them as optional parts of your own setup rather than the guaranteed default.
- `Codex: $workshop reference` at the start of the day or after you lose orientation
- `Codex: $workshop brief` when you need to re-anchor the task
- `Codex: $workshop briefs` when you want to browse every available brief before Build 1
- `Codex: $workshop resources` when you want the participant kit and learner kit without searching the repo
- `Codex: $workshop gallery` when you want more public docs, repos, and optional toolkits
- `Codex: $workshop follow-up` when you are deciding what to keep after the workshop
- `Codex: $brainstorm` when the scope is still unclear
- `Codex: $plan` before larger implementation
- `Codex: $work` once you have a plan and want to keep implementation in one line
- `Codex: $test-writer` or your own executable check before implementation when you need to keep the agent inside real boundaries
- `Codex: $review` after a larger slice of work
- `Codex: $compound` when a learning, fix, or workflow rule is worth preserving as a durable repo-native artifact
- `Codex: $workshop` for orientation during the day
- `Codex: $workshop template` when the repo is missing baseline context
- `Codex: $workshop analyze` before handoff or after rotation when you want to expose blind spots in the repo quickly
- `Codex: $workshop commitment` at the end of the day, to store the one thing you will change the next time you work with an agent
- `Codex: $workshop facilitator learnings` or `harness workshop learnings` to query the cross-cohort learnings log (rotation signals from past workshops). Prefers the CLI path for machine-readable output with filtering by tag, instance, or cohort.

## Recommended participant loop

- `workshop` for orientation and the next safe move
- `brainstorm` or directly `plan` when the scope is already clear
- `work` against one verifiable goal
- `review` before you trust a change
- `compound` or a short runbook when something is worth preserving
- ongoing cleanup work: move build and test commands, constraints, and handoff notes from chat into the repo

## Verification ladder

The more the agent does, the more holistic your checks have to be. With agents, your verification needs to prove the whole thing works, not that one function returned 4. Climb the ladder in order; add each rung only when you need it.

1. **Tracer bullet.** A thin end-to-end path that runs. Input goes in, output comes out. You can execute it manually in seconds. This is the first thing to add, before any tests. If you cannot draw a tracer, the system does not hold together yet.
2. **End-to-end tests.** Automated runs of the tracer (or a small family of tracers) on every change. Fast, deterministic, and scoped to user-visible behavior. Unit tests are fine, but they are not the point — they can all pass while the whole system drifts.
3. **Automated reviews.** Linters, type checks, policy scans, snapshot comparisons. Feedback optimized for the agent to consume — the agent fixes its own output before a human sees it.
4. **Human review (only where judgment is needed).** For changes the automation cannot grade: subjective design decisions, security assumptions, contract negotiations with the outside world. Keep this rung small — every item you add here is a place the agent will wait on a human.

### Holistic beats granular

A failing unit test tells you that one function behaved unexpectedly. A failing tracer tells you the system cannot deliver its work. With agents doing more of the plumbing, granular evidence is easy to satisfy and hard to trust. Spend your verification budget on the signals that prove the whole path holds.

### The self-validation trap

When the agent generates tests in the same task it generates code, those tests reflect the agent's interpretation of the spec — not the spec itself. Independent verification means: you wrote the done criteria, or a separate pass evaluates the output. Most teams fall into the trap once. Name it when you see it, and split the work — one pass writes the check, a different pass writes the code.

**The question to ask a team that says "the agent wrote tests too":** *Who wrote the spec those tests are validating against?* If the answer is "the agent, in the same session" — that is not independent verification.

## Tests as the trust boundary

- The more work the agent does independently, the less "I skimmed it quickly" is enough.
- If you let the agent write without tests, you often just accelerate unverified complexity.
- An executable check (unit test, tracer bullet, or simple end-to-end probe) is often the fastest way to tell the agent what must actually be true.

## Safe UI workflow

- The default pattern is: `agent exploration -> Playwright regression -> human review`.
- Let the agent inspect the UI, screenshots, and console quickly in an isolated local environment.
- Once you find an important flow, turn it into a repeatable browser test.
- Then have a human review the change. Tests protect against regression, but they do not decide meaning or trade-offs for you.
- "Let the model drive my normal signed-in browser" is not the default recommendation. That belongs only in a sandboxed, intentionally constrained environment.

## Quick reminder

A good prompt is not enough. If the work should survive handoff, the context must live in the repo, the next safe move must stay traceable, and verification must remain legible to a different team.

## Where to go after the workshop

- Official docs, the OpenAI Harness Engineering article, and verified public skill repos are collected in [`docs/learner-reference-gallery.md`](../docs/learner-reference-gallery.md).
- Codex-specific craft (approval modes, sandboxing, long-horizon drift, a representative before/after prompt pair, and a failure-recovery walkthrough) lives in [`content/codex-craft.md`](../content/codex-craft.md).
- The one-page pocket card of conversational moves for coaching an agent is [`materials/coaching-codex.md`](../materials/coaching-codex.md).
- If you already use another workflow pack or toolkit, treat it as an extension on top of this foundation, not as a replacement for `AGENTS.md`, verification, and repo-native handoff.
- If you do not want to search the repo, use `workshop resources`, `workshop gallery`, or `workshop follow-up` directly.
