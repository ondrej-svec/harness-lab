---
cs_reviewed: true
---

# Context is King — Facilitator Delivery Script

## How to read this script

This file is not standalone talk content. It's a delivery script for the facilitator — what you say between scenes, pacing, and watch-fors. The full titles, bodies, and callouts live in `workshop-content/agenda.json`, scenes `talk-argued-about-prompts`, `talk-why-now`, `talk-got-a-name`, `talk-how-to-build`, `talk-managing-agents`, `talk-humans-steer`, `talk-sitting-inside`. The agenda is source of truth; this file is stage manager.

Canonical vocabulary — what you're allowed to say and what you aren't — is in `docs/workshop-content-canonical-vocabulary.md`. When in doubt, check there.

## Talk frame

- Seven scenes, target 9–11 minutes total, the core line is in scene 6.
- One sentence you protect above everything else: **Humans steer. Agents execute.**
- The talk doesn't end on a thesis. It ends on a bridge to the demo (scene 7). The demo then runs from `content/talks/codex-demo-script.md` — the repo-readiness contrast lives there, not here.
- The heaviest evidence scene is scene 1. The densest teaching scene is scene 4. The most important is scene 6.

## Scene 1 — While we argued about prompts

**Agenda scene:** `talk-argued-about-prompts`

### What to say

Open with the line from the hero block: "Six months ago the conversation was still about prompts. Today it's about what the agent reads when it opens your repo."

Then read the four voices as a story, not a bulleted list. Deliberate pause after each name:

1. **Ryan Lopopolo (OpenAI Frontier & Symphony, February).** One million lines in five months, zero written by hand. His first principle — "Humans steer. Agents execute." — say it slowly, without emphasis. The first time you say it with emphasis will be in scene 6.
2. **Birgitta Böckeler (Thoughtworks, ten days ago).** She named it: harness engineering. She split it into **guides** and **sensors**. These are two words you'll use many more times today. Let them land now for the first time and do not define them yet — just place them.
3. **Charlie Guo (OpenAI, also February).** "I'm moving away from chatting with AIs and moving towards managing them." That's his whole sentence. Don't add commentary.
4. **Stripe Minions.** 1000+ PRs a week, no human between the task being posted and the PR arriving. "Not a demo. Production." This is the one place in the scene where you can raise your voice slightly.

Stop after Stripe. The scene lands when the room feels that multiple credible voices have converged on the same shift.

### Pacing

- Scene 1 targets 2.5–3 minutes. Four voices at ~20–30 seconds each.
- If you go past 3.5 minutes, you're too slow. Speed up.
- The pauses between names are expensive — they're worth it. Without pauses it's a list. With pauses it's a story.

### Watch for

- The room will start wanting answers to "how". Not yet. Scene 1 only plants the thesis that something changed. Mechanics come in scene 4.
- If someone interrupts with "what about us/Codex/Claude", say "we'll get to that in a moment" and move on. Don't break the scene's rhythm.
- Watch that you don't slip into tool-tour mode. Scene 1 is not about tools.

## Scene 2 — Why this matters now

**Agenda scene:** `talk-why-now`

### What to say

This scene is a short urgency beat, not a second evidence scene.

Say the line from the hero block plainly: nobody knows what the end of 2026 looks like. The models will move. The repo contract around the agent is what survives the movement.

Then the callout: you do not need to predict the winning model. You need context, boundaries, and checks that survive the next model. One sentence. No improvisation spiral.

### Pacing

- 20–30 seconds.
- If the room already feels the urgency from scene 1, compress this to one line and move on.

### Watch for

- Do not turn this into analyst-firm commentary or future-of-AI chatter.
- The point is practical urgency, not speculation.

## Scene 3 — Last week, it got a name

**Agenda scene:** `talk-got-a-name`

### What to say

This scene has one equation and one analogy. Do both once and do them properly.

The equation first: **Agent = Model + Harness.** Write it the way Böckeler wrote it — as an equation, not a sentence. "The model has the power. The harness is what turns that power into useful work instead of drift."

Then the Böckeler quote from the hero block: "A good harness doesn't aim to eliminate human input. It directs human input to where it matters most." Read it straight from the hero block — the quote is her words, not yours.

### The engine/chassis analogy

This is the one analogy in the whole talk you're allowed to stretch. The others are meant to be quick.

The key is the contrast: a 400-horsepower engine bolted to a shopping cart versus the same engine bolted to a well-designed chassis. Not "the engine is bad" — the engine is powerful. The chassis **makes the power accessible**. It makes the power predictable, survivable. The model is the engine. The harness is the chassis.

Once you've used the analogy, hold it. Do not switch to a second analogy ("it's also like a team, it's also like a kitchen, it's also like…"). One analogy, done properly.

Then the reframe callout: **The gap between models is narrowing. The gap between harnesses is widening.** This is the second most important line in the talk. Say it slowly. Let it land before you move to scene 4.

### Watch for

- If you start extending the analogy with "and the brakes are…" or "and the tires are…", cut it. One analogy, one comparison, move on.
- "The gap between models is narrowing" can make the room want to debate. Don't get pulled in. "We can talk about that at the break. Right now, how you build the harness."

## Scene 4 — How you actually build one

**Agenda scene:** `talk-how-to-build` — the densest scene in the talk.

### What to say

Open by naming that there are multiple framings — Fowler splits it into guides and sensors, OpenAI into context/constraints/feedback — and you're going to give four pillars that work across all of them.

Then the **four pillars.** Read each pillar from the agenda but add one concrete sentence of your own. Suggestions:

1. **Context as infrastructure.** The repo is the agent's memory. Your headline sentence: **"AGENTS.md is a map, not a warehouse."** This is canonical — say it once, exactly this way.
2. **Guides — steering before it acts.** Architectural rules, templates, constraints. Your headline sentence: **"Boundaries create speed."** Constraints aren't friction. They're why work goes fast.
3. **Sensors — catching after it acts.** Tracer bullets, end-to-end tests, holistic feedback. Your headline sentence: **"When the agent does more, your verification has to prove the whole thing works, not that one function returned 4."** This is where the room first realizes that granularity is the problem, not the goal.
4. **Managing, not chatting.** Say only the operational version here: direction, scope, verification. The role-shift explanation gets its own scene next.

The scene closes when the four pillars are visible and named. Say only: "These are the four moves you'll practice today."

### Pacing

- Target 6–8 minutes. The pre-cut version collapses pillars 2 and 3 into one — use it if you're past 9 minutes.
- Careful: densest scene, but dense doesn't mean slow. Move through it with energy.

### Watch for

- The room will want to stop you with a question inside pillar 1 or 2. "Good question, we'll get there in a moment." Pillar 3 (sensors) is where you collect questions, not earlier.
- "Guides" and "sensors" are first named in full here. If someone asks what they are, point back to **Böckeler on Fowler, ten days ago** and keep moving. Don't rewrite her definitions.
- If the room is losing you, pillar 3 (sensors) is the hardest to grasp without an example. You have one: the one they'll see in the demo in a minute. "You'll see it in the demo in a minute" is a legitimate rescue.

## Scene 5 — Managing agents changes your role

**Agenda scene:** `talk-managing-agents`

### What to say

This scene exists so the role shift does not fight with the four pillars on one screen.

Lead with the hero line: the tool is not the shift, your role is. Then read the Guo quote cleanly. No aside, no imitation, no commentary layered on top.

Close on the team-lead callout: a team lead builds the system the team runs in. Rules, rituals, feedback loops, next moves. That is the bridge between the talk and the build phases.

### Pacing

- 45–60 seconds.
- If scene 4 ran long, this scene still stays in. Compress it, don't cut it.

### Watch for

- Do not drift into generic management language.
- The point is responsibility for the operating environment, not org charts.

## Scene 6 — Humans steer. Agents execute.

**Agenda scene:** `talk-humans-steer`

### What to say

This scene is protected. It's the only scene where how you stand matters.

Open by calling back to Lopopolo from scene 1. Then say the core line: **Humans steer. Agents execute.** Slowly. Without rising tone at the end. Pause.

Then the Hashimoto quote about fixing mistakes. It operationalizes the line without weakening it.

Then the **next-day callout**. This is the closing role-change promise. Not a calendar promise — a role promise:

> The next day you open a coding agent, you'll work differently. Not with a new tool. With a different role. You'll stop being the person the agent asks questions of, and start being the person who builds the room it walks into.

The last sentence is the one you want them to take away. Say it, pause, add nothing.

### The protected line

**Humans steer. Agents execute.** is the most memorable sentence of the whole workshop. The facilitator protects it by:

- Never paraphrasing it. Not ever. Not even "people direct and agents execute". It's four words, not five.
- Never saying it before scene 6. If it slips out in scene 1, scene 6 loses its impact.
- Never saying it again in scene 7. Scene 7 is the bridge, not the echo.
- Never letting it become a hashtag slogan. It's a principle, not a motivational quote.

### Watch for

- The room will want to react. Don't make space for discussion inside scene 6. The space is after scene 7, in the build phase.
- If you're uncomfortable reading the Hashimoto quote, shorten it to the first clause and move on. The scene can survive with one supporting device.

## Scene 7 — You've been sitting inside one all morning

**Agenda scene:** `talk-sitting-inside`

### The bridge to demo

This scene is short and has one job: tell the room that the workshop skill, the dashboard, the participant board, and the repo they're about to open are real examples of everything the talk was about.

Text from the hero block: "The workshop skill, the dashboard, the participant board in front of you, the repo you're about to open — I built all of it with agents, using the discipline we just named. What you're about to see in the demo isn't a promise. It's a working instance."

Facilitator transition line (optional): **"Let me show you what I mean — here's what a working agent session actually looks like when the harness is doing its job."**

Then move into the demo. The demo has its own delivery script in `content/talks/codex-demo-script.md`.

### Watch for

- Don't stretch scene 7. It's not the closing speech. It's a ramp into the demo.
- If the room starts applauding after scene 6, don't add scene 7 as a reaction. Scene 7 is setup for the demo, not a closer.

## What not to say

- Do not use the term "prompt blob" or spend any time on it. The repo-readiness contrast lives in the demo, not in the talk.
- Do not paraphrase **Humans steer. Agents execute.** Not once.
- Do not say "Monday morning" or any calendar-day reference. This workshop closes on "the next day you open a coding agent" in both languages — it's a role change, not a calendar event.
- Do not show features of Codex or any other tool. This is not a tool demo.
- Do not add a sixth pillar. Four, not five, not six.
- Do not describe the habit taxonomy. The five habit tags belong on the cards, not in the talk.
- Do not say "one function plus one test" in any variation. Pillar 3 is about **holistic verification** — tracer bullet, end-to-end, not a unit test on one function.

## Fallbacks

- **If you're over 11 minutes:** collapse pillars 2 and 3 (guides + sensors) into one. Scene 4 is the section that tolerates compression without losing the headline.
- **If the room is tired:** compress scene 2 to one line. Do not rebuild the old weather monologue.
- **If you're under time and at the edge:** what's protected is scene 6 and the four pillars. Everything else is optional.
- **If you've lost the rhythm somewhere:** come back to the `team lead builds the system` callout (scene 5) and to **Humans steer. Agents execute.** (scene 6). Those two sentences are enough for the room to understand what today is about.

## What the room takes into the build phase

After this talk, the team should not go back to the repo looking for a smarter prompt. It should go back with **one clear expectation**: map and verification first, feature motion second.

- If local setup is ready: `harness skill install`, then `Codex: $workshop setup` or `pi: /skill:workshop`.
- If local setup is blocked: use the participant surface as the guaranteed path and come back to the skill later.
- First, a short map in the repo.
- Then a short plan of steps.
- Then the first tracer — holistic verification, not a unit test on one function.
- Only then, more feature motion.

That is Build Phase 1. The demo shows them what it looks like before you send them inside.
