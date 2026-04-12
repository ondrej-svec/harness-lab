# Participant Resource Kit

A short set of artifacts you can take from Harness Lab into your own project.

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
- an executable check (unit test or tracer bullet)
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

## Next-week challenge

1. Add `AGENTS.md` to one real project.
2. Move one durable rule from a prompt into the repo.
3. Add one review or handoff checklist.

## What to read after the workshop to stay current

Codex and other coding agents ship new capabilities monthly. This kit is not a frozen reference — it is a starting harness for your own reading practice.

- **Codex CLI release notes** — read them on every release. The approval-mode and sandboxing changes are the ones that matter most.
- **Simon Willison's blog** ([simonwillison.net](https://simonwillison.net/)) — one of the densest practical sources on Codex, Claude Code, and other coding agents. He works with these tools daily and writes it down.
- **OpenAI Harness Engineering articles** — see `docs/learner-reference-gallery.md` for links.
- **Anthropic engineering blog** — if you use Claude Code, follow the official posts.
- **Your own `AGENTS.md` as a living document** — re-read them every quarter with a skeptical eye. Delete anything that is no longer load-bearing. Simplicity is part of the harness.
- **Your own `docs/solutions/` or runbook** — when you find a failure mode in your own work, write it down. Your team should learn from your team's mistakes, not just from this kit.
