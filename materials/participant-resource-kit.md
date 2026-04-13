# Participant Resource Kit

Post-workshop reference — a short set of artifacts you can take from Harness Lab into your own project: links, templates, and the five working habits. For in-session coaching moves (what to say when the agent starts slipping), reach for [`coaching-codex.md`](../../coaching-codex.md).

The goal of this kit is to help you build your own **harness** — the repo, workflow, and context that **carries the next move** without you standing over it.

## 1. Start with `AGENTS.md`

Use this baseline:
- `goal`
- `context`
- `constraints`
- `done when`

Default template:
- [`workshop-skill/template-agents.md`](../../../workshop-skill/template-agents.md)

## 2. Add one trust anchor

Choose at least one:
- build/test commands
- an executable check — a tracer bullet, an end-to-end check, a holistic smoke test. **Holistic beats granular.**
- a review checklist

When the agent handles a larger slice of work, “I skimmed it quickly” is not enough.

Checklist for handoff:
- [`workshop-skill/analyze-checklist.md`](../../../workshop-skill/analyze-checklist.md)

## 3. Use a small workflow, not chaos

Recommended baseline:
- `workshop` for orientation and the next safe move
- `/brainstorm` when the scope or first slice is still unclear
- `/plan` before larger implementation
- `/work` or another narrow implementation loop once you know what you are building
- a test or another executable check before an important change
- `/review` after a larger slice of work
- `/compound` or a short repo-native note when a discovery makes future work cheaper
- small ongoing cleanup: move build/test commands, constraints, and handoff notes from chat into the repo

## 4. Move one rule from chat into the repo

Typical candidates:
- build/test commands
- safety constraints
- the definition of done
- a handoff rule

## 5. Keep UI work on a safe track

Default pattern:
- `agent exploration`
- `Playwright regression`
- `human review`

Do not let the model drive your normal signed-in browser by default without sandboxing and control.

## 6. What to revisit after the workshop

- [`workshop-skill/reference.md`](../../../workshop-skill/reference.md)
- [`workshop-skill/recap.md`](../../../workshop-skill/recap.md)
- [`docs/locales/en/learner-reference-gallery.md`](../../../docs/locales/en/learner-reference-gallery.md)
- [`content/codex-craft.md`](../../../content/codex-craft.md) — Codex-specific craft: approval modes, sandboxing, long-horizon drift, a representative before/after prompt pair, and a failure-recovery walkthrough
- [`materials/coaching-codex.md`](../../coaching-codex.md) — the one-page pocket card of conversational moves for coaching an agent

Note:
- the `workshop` skill is the guaranteed workshop default
- additional workflow skills and public toolkits are optional accelerators, not required setup

## When the habits fire — five habits, five triggers

Each of the five working habits has its own trigger — a moment in your ordinary working day when the habit activates. These are the same tags you saw on the challenge cards in the repo.

- When **you open a new repo, a new task, or a new agent session** → **Map before motion** — you make the repo a place someone can navigate before you start generating.
- When **the agent is about to get a task and you're drafting a prompt** → **Boundaries create speed** — you write the constraints before the prompt. Boundaries are why work goes fast, not why it goes slow.
- When **you feel confident enough to move on** → **Verification is the trust boundary** — that confidence is your cue to verify, not to skip. Holistic over granular: prove the whole thing works, not that one function returned 4.
- When **you close a chat, end a call, or finish a pairing where a decision landed** → **If it is not in the repo, it does not exist** — write the decision into the repo before it evaporates by tomorrow.
- When **the same friction, manual step, or small annoyance shows up twice** → **Cleanup is part of build** — turn it into a check, template, or rule on the spot, not "later".

## Next-time challenge

The next time you open a coding agent:

1. Add `AGENTS.md` to one real project — goal, context, constraints, done when. A map, not a warehouse.
2. Move one durable rule from a prompt into the repo. If you've said it out loud twice, it belongs there.
3. Add one review or handoff checklist. The smallest functional version is enough.

## Minimum viable harness for your team

You don't have to convince your team about "harness engineering". Show them a useful `AGENTS.md` that saved twenty minutes of onboarding.

The smallest version that survives a skeptical code review:

1. **One `AGENTS.md`** — goal, build/test commands, one explicit constraint. **A map, not a warehouse.** Nothing more.
2. **One executable check** — a tracer bullet or a simple end-to-end smoke test that proves the whole thing holds together. Not one function.

When someone asks "why are we doing this?", the answer is: "So the next person doesn't have to ask you."

Monthly rhythm: once a month, read your `AGENTS.md` with a skeptical eye. Delete what is no longer load-bearing. Add what the team has said out loud for the second time.

## What to read after the workshop to stay current

Codex and other coding agents ship new capabilities monthly. This kit is not a frozen reference — it is a starting harness for your own reading practice.

- **Codex CLI release notes** — read them on every release. The approval-mode and sandboxing changes are the ones that matter most.
- **Simon Willison's blog** ([simonwillison.net](https://simonwillison.net/)) — one of the densest practical sources on Codex, Claude Code, and other coding agents. He works with these tools daily and writes it down.
- **OpenAI Harness Engineering articles** — see `docs/learner-reference-gallery.md` for links.
- **Anthropic engineering blog** — if you use Claude Code, follow the official posts.
- **Your own `AGENTS.md` as a living document** — re-read them every quarter with a skeptical eye. Delete anything that is no longer load-bearing. Simplicity is part of the harness.
- **Your own `docs/solutions/` or runbook** — when you find a failure mode in your own work, write it down. Your team should learn from your team's mistakes, not just from this kit.
