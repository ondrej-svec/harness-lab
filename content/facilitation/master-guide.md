# Facilitation Master Guide

## Opening and welcome

### Goal

Start the day as a shared beginning for the whole workshop — not as an operational brief for the morning.

### Key message

> "Today isn't about being fastest. It's about building the work so another team can pick it up and push it forward."

### What needs to land

- We aren't opening with a tool demo or a prompt-writing contest.
- We'll be learning, building, handing off, and picking up. That arc is the point of the day.
- The goal is working with an agent in a way that leaves usable context behind.
- The afternoon tests whether the repo actually carries the next move for another team.
- If an important rule lives only in a conversation at the table, it doesn't exist yet.

### Recommended beat order

1. day-opening promise
2. why this matters right now
3. a Lego-duck-style analogy: same ingredients, different usable outcomes
4. a short physical activation based on experience with AI agents
5. the first working contract for Build Phase 1

### Lego-duck analogy

Use it briefly and concretely.

The point:

- the same agent doesn't mean the same outcome
- the model alone doesn't determine quality
- context, guides, and sensors are part of the outcome

Don't run it as a fun tangent. Run it as the reason harness engineering is both a creative and an engineering discipline.

### Physical activation

Use a short room split based on current experience with AI agents:

- I use them almost daily
- I use them, but carefully
- I'm closer to the start
- I'm skeptical, but I want to see that it works

Rules:

- don't turn it into a networking round
- a move across the room and two short voices is enough
- the point isn't seniority — it's calibrating the room and signaling that the day is participatory

### What the facilitator keeps returning to

- "Where would the next team find this without you?"
- "What's actually verified here?"
- "Is `AGENTS.md` still a map, or is it becoming a dump?"
- "What's the next safe step for someone — or an agent — walking in cold?"

### The first working contract

After the opening, the room needs one more concrete thing:

- what has to be actually visible in the repo after the first build block
- what it isn't enough to just promise or explain at the table

By lunch, these should be visible:

- a `README` that makes sense to someone walking in cold
- `AGENTS.md` as a short map, not a warehouse
- a plan or a clearly traced implementation trail that shows the next safe step
- the first explicit verification before any more generation happens

## Context is King talk

### Goal

Turn the energy from the opening into a precise thesis and a clean bridge into Build Phase 1.

### Key message

> "Context is leverage, not cosmetics."

### What needs to land

- We aren't learning to prompt better. We're learning to build a repo and a workflow where both the agent and another team can safely continue.
- `AGENTS.md`, skills, runbooks, and verification steps are team infrastructure — not polish on top.
- The named vocabulary from Böckeler: **guides** (the rails that steer the agent before it acts) and **sensors** (the checks that catch the agent after). Both are part of the harness. Both terms land in the talk, and the facilitator uses them in coaching from then on.
- The team lead isn't standing behind the model dictating the next sentence every thirty seconds.
- After the talk, the team returns to the repo with a map, a plan of steps, and the first verification — not with a hunt for a smarter prompt.

### Protected line of the talk

> **Humans steer. Agents execute.**

These are the four words the talk ends on and the four words the room carries out. The facilitator never paraphrases them, never says them before Scene 4, and never turns them into a motivational slogan. It's a principle, not a hashtag. Full delivery in `content/talks/context-is-king.md`.

### Repo-readiness contrast (micro-exercise)

This is a short facilitator demo — not a task for the whole room.

Use **the same prompt in two repos**:

1. **Variant A: bare repo** — no AGENTS.md, no guides, no context. The agent stumbles — it makes plausible but wrong decisions (task drift).
2. **Variant B: repo with a harness** — AGENTS.md with Goal, Context, Constraints, Done When, a plan, and a workshop skill. Same prompt, aligned output.

Flow:
1. Show Variant A. Name the task drift.
2. Show Variant B with the same prompt.
3. Pause. Ask: "What changed?"
4. Let two voices answer.
5. Name the thesis: "The prompt didn't change. The repo did."

Don't let it slide into a debate about which model is smarter. The point is that the outcome changed because the context in the repo changed — not the prompt.

See `content/talks/codex-demo-script.md` for the detailed two-folder setup.

### What you carry into the build phase

By the end of the talk, this should be clear:

- theory ends here
- the team goes back to the repo
- if the team doesn't have the workshop skill yet, this is the moment for `harness skill install`, then `Codex: $workshop setup` or `pi: /skill:workshop`
- first comes a map and the first explicit verification
- only then does more feature motion make sense

## Build Phase 1

### Visible milestone board

By lunch, five basics should be visible in the repo:

1. a `README` that makes sense to someone walking in cold
2. `AGENTS.md` as a short map
3. a plan that shows the next safe step
4. a build/test command or a tracer bullet
5. the first genuinely verified move forward

### Facilitator role

- coach first — ask what the team needs and where it's stuck
- mentor next — help with workflow or tooling
- teacher only as a last resort — briefly explain the principle and return the team to work
- hand the team artifacts they can actually work from, not the full Harness Lab backstage
- when a team gets stuck, return them to a verification, not to a longer prompt

### What to watch for on the floor

- Does the team share one picture of the goal?
- Is context accumulating in the repo, or staying in chat and in heads?
- Are they verifying outputs, or just generating more text?
- Do they have a test, tracer bullet, or other explicit check that keeps the agent inside the lines?
- Can you tell from the repo what's done, what's in progress, and what's still a hypothesis?
- Could another team find the next safe step within five minutes?

### Facilitation point on tests

- With a coding agent, "we'll look at it later" isn't enough.
- The moment the agent gets more autonomy, the team has to raise the quality of verification.
- Test-first isn't a purity dogma. It's a practical way to turn intent into a form the agent can hit repeatedly.
- When the team has no verification at all, the facilitator pushes for the smallest possible test or tracer bullet — not for more feature generation.
- For UI work, remind them of the pattern: fast agent exploration in an isolated environment, then a browser test, then a human review.
- If a team is talking about "the agent just clicks around in my browser", pull the conversation back to a sandbox, low risk, and explicit checks.

### What to normalize

- `AGENTS.md` as a short map, not a growing warehouse
- a plan as a working artifact, not a ceremony
- small continuous cleanup when chaos or duplication starts spreading
- moving repeated verbal reminders into the repo instead of more verbal mentoring

## Codex demo

### Goal

Show Codex as part of a working system, not as a trick on its own. The demo should also explain why this repo holds together: because the intent, the guides, the decomposition of work, and the way things get checked all live in the repo — not in the facilitator's head.

### What should be visible

- one story arc, not a feature tour
- a repository where you can see the `README`, the `AGENTS.md`, the work broken into steps, and how a change gets checked
- the contrast between a weak start without context and work that has a map and a next safe step
- a short anchor for the workshop skill: `harness skill install`, the first command, and why it saves a verbal rescue later

### What to say explicitly

- "This isn't a demo for the sake of a demo. This is the way this workshop repo system was built."
- "When the repo doesn't show why a change is being made, what the next step is, and what you'll check it against, neither the next person nor the next agent can safely pick it up."
- "Codex matters here, but it isn't the point on its own. The point is the harness around it."

### What not to show

- five different Codex modes in a row
- long silent waits on generation with no commentary
- a repo that isn't continuation-ready and just serves as a one-off sandbox

## Intermezzos

### Silent retrieval exercise (required)

Every intermezzo starts with a 3-minute silent retrieval exercise. This is a required first step, not an optional add-on.

Flow:
1. **3 minutes of individual writing** — everyone writes alone, no sharing
2. **2 minutes of team discussion** — sharing inside the team
3. **Room share** — selected signals go out to the whole room

Retrieval prompts:
- **Intermezzo 1:** "What surprised you this morning while working with the agent — and what does that make you want to try differently next time? Three minutes. Don't talk yet."
- **Intermezzo 2:** "What surprised you about the repo you inherited — and what do you want to try differently in the second push? Three minutes. Don't talk yet."

If someone starts talking during the silent phase, redirect: "Write first, then we share." The retrieval exercise only pays off when individual production happens before sharing.

### After the retrieval exercise

Every intermezzo continues with three steps:

1. Teams write one sentence: "What we changed and why."
2. Ondřej recaps what he sees at the tables and what monitoring shows.
3. One principle-level point lands, anchored to what's actually happening in the room.

Preferred checkpoint questions:

- What did you move from chat or from heads into the repo?
- What are you verifying today with an executable check?
- What should the next team read first?

### The point of intermezzos

- make learning visible across teams
- turn the day into a sequence of short checkpoints
- remind everyone that workflow matters as much as the result
- return teams to the fact that, without verification, they're only accelerating uncertainty

Don't run the intermezzo as a status meeting.
Run it as a short checkpoint that sends each team back with one thing they'll still write, sharpen, or verify today.

## Lunch and handoff prep

### Silent repo check (during lunch)

During lunch, the facilitator quietly walks every team's repo. If a repo is genuinely unusable (no AGENTS.md at all, no code, broken setup), help the team write the minimum. Frame it as normal coaching, not as a gate.

The gate is silent — participants shouldn't know a check is happening. Only intervene on genuinely broken repos, not on weak ones.

### Handoff prep

- Lunch isn't a break from the handoff.
- Before teams leave the table, the repo has to show:
  - what changed
  - what's done
  - what's still a hypothesis
  - what the next safe step is
- Anything that stays in conversation comes back as friction in the afternoon.

## Rotation

- No verbal handoff.
- The first 10 minutes, the new team only reads the repo and maps the situation.
- Frustration isn't a workshop bug. It's a signal about the quality of context in the repo.

### Instructions for the new team

- Start with `README`, `AGENTS.md`, and the plan.
- Don't immediately edit the first file you open.
- Write your own diagnosis first: what helps, what's missing, what's risky, and what the next safe step is.
- If the team doesn't know what to reach for, point them at the learner kit: `template-agents`, `reference`, `analyze-checklist`, and the challenge cards.

### Facilitation point on rotation

- Frustration is a useful signal when it points at hidden context or missing verification.
- Don't help teams paper over a weak signal in the repo with a verbal handoff.
- Help them name what has to be written down, sharpened, or verified after the rotation.

## Build Phase 2

- After the rotation, we don't just fix the feature. We fix the signal that slowed the pickup.
- Every recurring pain is a candidate for a better map, rule, runbook, or verification.
- The next bigger change should come only after a fresh explicit verification.

## Reveal and reflection

### `1-2-4-All`

Questions:

- What helped you keep going?
- What was missing?
- Which signal in the repo saved you the most time?

### `W³`

- `What?` — what happened today, without judgment
- `So what?` — what that means for working with AI agents
- `Now what?` — what you'll do differently the next day you open a coding agent

### Facilitation frame

- We're not judging which team was better.
- We're looking at the system: which signals help work survive a handoff, and which slow it down.
- We collect concrete examples, not general impressions.
- Every recurring pain is a candidate for a better template, challenge card, or guide in the blueprint.

At the end of the day, we want people to leave with three things:

1. one signal they want to adopt for good
2. one weak spot they won't leave in conversation next time
3. one concrete move for the next day they open a coding agent

### `next-day commitments` — the shared artifact

Reflection without writing usually doesn't hold. So at the very end of the day:

- every participant writes one sentence in the form: **"The next time I open an agent, I'll do [X], because [reason from today]."**
- the sentences go on paper, on a sticky note, or directly into a shared doc
- the facilitator collects them and turns them into one short shared list the team takes home
- the list isn't a score or a contest. It's the one artifact from the day that proves the reflection actually changed something

Facilitator move:
- push the sentences toward the concrete (not "I'll work better with agents", but "I'll write four elements into the AGENTS.md of my main repo: goal, context, constraints, done when")
- when someone writes something very general, ask: "What's the first concrete move that starts it?"
- don't publish commitments by name outside the room; the artifact belongs to the team, not to marketing
