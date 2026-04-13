# Challenge Cards

These cards are not bonus points. They are small interventions that improve both the way of working with the agent and the quality of the handoff.

## Where to start

- No `AGENTS.md` yet? Start with the first card from "Before lunch."
- Have `AGENTS.md` but no executable verification? Start with the second card.
- Have both? Pick any card that pushes you forward.

## Before lunch: build the working system

- `AGENTS.md as a map` — Your agent just received a task but knows nothing about the architecture, rules, or what to test. Create AGENTS.md with four sections: Goal / Context / Constraints / Done When. [Habit: Map before motion]

- `Build/test commands` — The agent wrote code but cannot verify it without your manual explanation. Add build and test commands so the agent and the next team can run checks independently. [Habit: Verification is the trust boundary]

- `Code review skill` — The team keeps giving the same review feedback. Formalize one review routine into a skill or checklist that another team could use too. [Habit: Cleanup is part of build]

- `Rule from conversation into the repo` — The team just said a rule out loud for the second time. Move it into AGENTS.md, README, a runbook, or a test — if it is not in the repo, it does not exist. [Habit: If it is not in the repo, it does not exist]

## After rotation: fix the signal, not only the feature

- `Post-handoff diagnosis` — You just inherited a repo you have never seen. Write down what helped, what was missing, what is risky, and what the next safe move is. [Habit: Map before motion]

- `/plan before coding` — The team wants to jump straight into code but nobody sees the overall plan. Use /plan, show the steps, what you are executing, and what the next safe move is. [Habit: Boundaries create speed]

- `Split work into multiple threads` — Everyone on the team is working on the same thing at once. Try two independent work streams and one person on integration. [Habit: Boundaries create speed]

- `Delegate and check the result` — You are jumping into every agent step. Give it a task with clear constraints and come back in 10 minutes to check the result, not the process. [Habit: Verification is the trust boundary]

- `Smallest useful verification` — The agent says it is done but you have no way to verify. Write done criteria as an executable check (unit test, tracer bullet, or browser check) before the agent gets more autonomy. [Habit: Verification is the trust boundary]

- `Fix one weak signal` — The inheriting team had to guess what was done and what was not. Fix one spot in README, AGENTS.md, plan, runbook, or check that would clarify it next time. [Habit: Cleanup is part of build]

## Advanced

- `2 parallel sessions` — You have a big problem and one session. Split it into two independent parts, process them in parallel, and compare the outputs. [Habit: Boundaries create speed]

- `Deployment runbook` — Nobody on the team knows how the result would be deployed. Create a deployment runbook — even if the deploy stays simulated. [Habit: If it is not in the repo, it does not exist]

- `AGENTS.md for a subfolder` — The main AGENTS.md is too generic for a specific part of the project. Write a local AGENTS.md for one subfolder that adds precise context. [Habit: Map before motion]

- `Garbage collection` — The same type of chaos appears in the repo for the second time. Find it and turn it into a check, template, or rule. [Habit: Cleanup is part of build]

## Meta

- `Rule from prompt into AGENTS.md` — You keep writing the same constraint into prompts. Move it into AGENTS.md where the agent finds it automatically. [Habit: If it is not in the repo, it does not exist]

- `Done When for every task` — Your task has no clear done criteria. Add a Done When section so the agent and reviewers know when it is finished. [Habit: Verification is the trust boundary]

- `README for the team after rotation` — Your README describes what you did, not what the next team needs to know. Rewrite it for the inheriting team, not for yourself. [Habit: Map before motion]

- `Record what is actually verified` — You cannot tell what is done, what is in progress, and what is just assumed. Record what is actually verified and distinguish it from the rest. [Habit: Verification is the trust boundary]

## How to use the cards

- Before lunch, every team should complete at least one card from "Before lunch: build the working system."
- Before rotation, the repo should clearly show what was actually verified and what the next safe move is.
- After rotation, every team should complete at least one card from "After rotation: fix the signal, not only the feature."
- The other cards are optional. Treat them as stretch goals or prompts for what to improve next.
