---
cs_reviewed: true
---

# Context is King

## Micro-exercise

This is a short facilitator-led demonstration, not work for the whole room.

We take the same small task under two conditions. One variant is a prompt blob. The other variant is a short brief with 4 elements and a pointer to context written into the repo. Then we compare the results. We are not looking for "the prettiest prompt." We are looking for a way of working that carries intent, constraints, and done criteria into the next step.

4 elements for the second variant:

- Goal
- Context
- Constraints
- Done When

## What you just saw

This workshop skill and dashboard were built the same way we are going to work today: with an AI agent, but with a deliberate focus on context. The point is not to sell you a tool. The point is to show the discipline that turns a tool into a usable collaborator.

The frame for today:

- we are not starting with a tool demo or a prompting contest
- we are going to learn, build, hand off, and inherit
- in the afternoon we will see what of the morning's work survives without us

## Analogy beat

Give people the same bricks and you still will not get one correct duck. The same is true here: from the same model you do not get one correct piece of work. The difference is not just the model. The difference is context, constraints, verification, and the team's imagination.

The point of the analogy:

- the same agent does not mean the same result
- the model alone does not determine quality
- the working system around the agent is part of the output

Harness engineering is the work of shaping instructions, context, and workflow so the agent does the right things repeatedly and predictably. A team lead does not tell each developer what to do every thirty seconds. They build the system the team runs in. That is exactly what we are doing today for agents.

## Core thesis

### Context is leverage

- Context is leverage, not cosmetics.
- `AGENTS.md`, skills, and runbooks are team infrastructure.
- `AGENTS.md` is not an encyclopedia. It is a map that tells the next reader where to reach.
- If it is not in the repo, it does not exist. Slack, verbal clarification, and "we remember that" all fall apart the moment someone else picks up the work.

### Verification is the trust boundary

- Tests are the trust boundary. When the agent works more autonomously, you need to verify far more carefully that it did exactly what you wanted.
- Simple constraints speed up the work. A clear build/test flow, visible boundaries, and a predictable structure all help the agent.
- For UI work the default pattern is: agent exploration, then a repeatable browser test, then human review.
- "Let the model drive in my regular logged-in browser" is not a default recommendation. An isolated local environment with clear guardrails is safer.
- Writing the verification before you hand the agent a larger piece of work is not test-first dogma. It means writing the done criteria in a form the agent and the next team can actually check. It speeds up iteration, because the agent gets precise constraints rather than one more prompt.

### The repo is maintained, not just filled

- Cleanup is not a bonus after the workshop. When you run into repeating chaos, that is the moment to turn it into a better template, check, or runbook.
- The afternoon continuation is the test of whether your context works without you.

## What I want the room to adopt

- Before I generate the next feature, I make the repo a place people can actually navigate.
- If we say a rule out loud twice, it belongs in the repo.
- When the agent does more, I have to verify better.
- Handoff is not the end of the day. It is a running condition of the whole work.

## What you take into the build phase

After this talk, the team should not go back to the repo looking for a smarter prompt. It should go back with one clear expectation:

- if the team does not yet have the workshop skill, now is the moment for `harness skill install`, then `Codex: $workshop setup` or `pi: /skill:workshop`
- first, a short map in the repo
- then a short plan of steps
- then the first explicit check that the agent is doing what you expected
- only then, more feature motion

## Key line

> We are not learning to "prompt better." We are learning to build a repo and workflow where the agent and the next team can safely continue.

In the afternoon you will not just experience "AI sometimes works and sometimes does not." You will experience how much the result depends on the quality of the working system you build around the agent.
