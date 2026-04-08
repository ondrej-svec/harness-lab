# Challenge Cards

These cards are not bonus points. They are small interventions that improve both the way of working with the agent and the quality of the handoff.

## Context Engineering

- `Create AGENTS.md as a map` - write down the goal, build and test commands, durable rules, and where the next team should look first.
- `Add build/test commands` - the agent must be able to verify the result without manual backfilling.
- `Write a code review skill` - formalize one review routine that another team could use too.
- `Move one rule from conversation into the repo` - anything the team has said out loud twice should be turned into `AGENTS.md`, README, a runbook, or a test.

## Workflow

- `Use /plan before coding` - show which plan the team is working from, what is actually being executed, and what the next safe move is.
- `Split the work into multiple threads` - try two independent work streams and one person on integration.
- `Delegate a task and come back to check it in 10 minutes` - do not jump into every agent step; inspect the outcome instead.
- `Add the smallest useful verification` - create a RED test, tracer bullet, or simple browser check before the agent gets more autonomy.

## Advanced

- `Run 2 parallel Codex sessions` - split the problem into two independent parts and compare the outputs.
- `Create a deployment runbook` - even if the deploy stays simulated.
- `Write AGENTS.md for a subfolder` - show that context can be global and local at the same time.
- `Introduce garbage collection` - find one repeating form of chaos and turn it into a check, template, or rule.

## Meta

- `Move a durable rule from a prompt into AGENTS.md`.
- `Add a Done When section to every task`.
- `Write README for the team after rotation, not for yourself`.
- `Record what is actually verified` - distinguish done, in progress, and assumed.

## How to use the cards

- Before lunch, every team should complete at least one `Context Engineering` card.
- Before rotation, the repo should clearly show what was actually verified and what the next safe move is.
- After rotation, every team should complete at least one `Workflow` card.
- The other cards are optional. Treat them as stretch goals or prompts for what to improve next.
