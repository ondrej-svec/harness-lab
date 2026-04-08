# Workshop Reference

## 4 working defaults for today

- `Map before motion` - first make the repo a place people can navigate
- `If it is not in the repo, it does not exist` - important agreements, rules, and next steps belong in files
- `Verification is the trust boundary` - more autonomy requires stronger evidence
- `Handoff is a continuous constraint` - the next team should find the first safe move without your explanation

## 4 elements of a good task

- `Goal` - what exactly the agent should create or change
- `Context` - which files, decisions, and surrounding facts matter for the task
- `Constraints` - the rules, standards, and solution boundaries
- `Done When` - how you will know the work is actually finished

## Fast handoff checklist

- Does `AGENTS.md` exist?
- Is `AGENTS.md` a short map rather than an overgrown dump?
- Are there build and test commands in the repo that another team can run?
- Is it clear what already works, what is in progress, and what is still only an idea?
- Is there a plan, runbook, or another document that helps the next team understand the intent?
- Can you find what was actually verified?
- Can a new team find the first safe move within a few minutes?

## Recommended commands

- Workshop skill in Codex: `$workshop ...`
- Workshop skill in pi: `/skill:workshop`, then ask for `reference`, `setup`, `brief`, or another workshop action
- If you do not know what the skill can do: `Codex: $workshop commands`
- The workshop skill is the guaranteed default. Workflow skills and external toolkits are recommended accelerators, not mandatory bootstrap.
- Workflow skills like `$brainstorm`, `$plan`, `$work`, `$test-writer`, `$review`, and `$compound` are described Codex-first in this workshop. In pi, treat them as optional parts of your own setup rather than the guaranteed default.
- `Codex: $workshop reference` at the start of the day or after you lose orientation
- `Codex: $workshop brief` when you need to re-anchor the task
- `Codex: $workshop resources` when you want the participant kit and learner kit without searching the repo
- `Codex: $workshop gallery` when you want more public docs, repos, and optional toolkits
- `Codex: $workshop follow-up` when you are deciding what to keep after the workshop
- `Codex: $brainstorm` when the scope is still unclear
- `Codex: $plan` before larger implementation
- `Codex: $work` once you have a plan and want to keep implementation in one line
- `Codex: $test-writer` or your own RED test before implementation when you need to keep the agent inside real boundaries
- `Codex: $review` after a larger slice of work
- `Codex: $compound` when a learning, fix, or workflow rule is worth preserving as a durable repo-native artifact
- `Codex: $workshop` for orientation during the day
- `Codex: $workshop template` when the repo is missing baseline context
- `Codex: $workshop analyze` before handoff or after rotation when you want to expose blind spots in the repo quickly

## Recommended participant loop

- `workshop` for orientation and the next safe move
- `brainstorm` or directly `plan` when the scope is already clear
- `work` against one verifiable goal
- `review` before you trust a change
- `compound` or a short runbook when something is worth preserving
- ongoing cleanup work: move build and test commands, constraints, and handoff notes from chat into the repo

## Tests as the trust boundary

- The more work the agent does independently, the less “I skimmed it quickly” is enough.
- If you let the agent write without tests, you often just accelerate unverified complexity.
- A RED test, tracer bullet, or simple end-to-end check is often the fastest way to tell the agent what must actually be true.

## Safe UI workflow

- The default pattern is: `agent exploration -> Playwright regression -> human review`.
- Let the agent inspect the UI, screenshots, and console quickly in an isolated local environment.
- Once you find an important flow, turn it into a repeatable browser test.
- Then have a human review the change. Tests protect against regression, but they do not decide meaning or trade-offs for you.
- “Let the model drive my normal signed-in browser” is not the default recommendation. That belongs only in a sandboxed, intentionally constrained environment.

## Quick reminder

A good prompt is not enough. If the work should survive handoff, the context must live in the repo and verification must stay traceable.

## Where to go after the workshop

- Official docs, the OpenAI Harness Engineering article, and verified public skill repos are collected in [`docs/learner-reference-gallery.md`](../../../docs/learner-reference-gallery.md).
- If you already use another workflow pack or toolkit, treat it as an extension on top of this foundation, not as a replacement for `AGENTS.md`, verification, and repo-native handoff.
- If you do not want to search the repo, use `workshop resources`, `workshop gallery`, or `workshop follow-up` directly.
