# Workshop Agenda Content Review — Brainstorm

**Date:** 2026-04-12
**Scope:** Walk through every phase and scene in `workshop-content/agenda.json`, flag content issues, decide on rewrites and structural changes. Edits to `agenda.json` are parked until the full review is complete.

**Narrative spine (locked 2026-04-12):**

> **Opening** — framing, teams, orientation.
> **Talk** — inspiration + emerging patterns (Anthropic/OpenAI, harness engineering as real discipline).
> **Demo** — kickoff, show the tooling participants will use.
> **Builds + Intermezzos** — where the real learning happens, from doing.
> **Reveal** — Monday commitments.

Every scene is reviewed against: *does this content do what its place in the narrative asks?*

---

## Phase 1 — Opening (09:10–09:40)

### Final structure (5 scenes, ~17–18 min of content, ~12 min buffer)

| # | Scene | Kind | Time |
|---|---|---|---|
| 1.1 | Framing (rewrite) | seated | 3–4 min |
| 1.2 | Day arc — learn, build, hand off, continue | seated | 2 min |
| 1.3 | Day schedule | seated | 2 min |
| 1.4 | Experience line + team formation (new combined scene) | kinetic | 9 min |
| 1.5 | Light landing beat — hand off to the talk | transition | 1 min |

### Changes from current agenda.json

- **1.1 framing — rewrite.** "Prompt theatre" phrase cut (disliked in EN, weak in CS). New hero leads with participant destination.
- **1.2 day arc — keep.** Tighten overlap with 1.1 "not a contest" line (cut one instance).
- **1.3 Lego duck analogy — CUT.** Couldn't secure enough physical Lego ducks for 4 workshops; without the kinetic exercise, the verbal analogy underdelivers. The "same ingredients, different harness" point moves to the Talk (Context is King) and must be load-bearing there.
- **1.3 (new) day schedule — moved earlier.** Now precedes team formation so participants know what they're joining a team for.
- **1.4 room activation — REPLACED by team formation.** Old 4-stance hand-raising had no outcome. New scene combines a room-experience map with actual team formation using the "experience line" exercise.
- **1.5 old participant board scene — CUT.** The participant surface auto-regenerates per phase; showing it as a dedicated slide was redundant.
- **1.5 (new) — light handoff beat.** Transition scene only (or may be collapsed into facilitator verbal transition — open question).
- **Old toolkit / skill install scene — DROPPED from opening.** Skill install moves to the Demo phase (facilitator demos) and the start of Build Phase 1 (everyone installs alongside).

### Scene 1.1 — Framing (LOCKED)

**Chosen hero (Option 1 — "Craft underneath the hype"):**

- *Eyebrow:* Harness Lab
- *Title:* **Today you learn to shape the work so anyone — or any agent — can carry it**
- *Body:* "That's the craft underneath all the agent hype. Not better prompts. Not faster typing. A repo, a workflow, a context that carries the next move without you standing over it. By tonight you'll have built one with your hands, handed it to another team, and seen what survives. Monday morning, you'll open your editor and know what to build differently."

**Why this one:** Leads with participant ability ("you learn to shape"), names the destination (Monday), carries the disappearance idea as empowerment (not self-erasure), and sets up the Talk framing ("craft underneath the hype" → emerging patterns from Anthropic/OpenAI).

**Supporting callouts (to rewrite when applying):**
- **The main line for today** — rewrite to: "We are not learning to prompt better. We are learning to build a working system that carries the next move — whether the next reader is a teammate who joined today or a fresh agent you open on Monday."
- **What should change today** — rewrite to: "Monday morning you open a fresh agent in your own repo. That agent arrives without your memory. What you practice today is how you treat every session — not once, for every session."
- Keep only one "not a contest" line across 1.1 and 1.2 combined.

### Scene 1.4 — Experience line + team formation (NEW)

**Goal:** Form balanced, mixed-experience teams without self-selection bias. Record team names live on the board.

**Exercise — "The experience line":**

1. **Form the line (3 min).** "Everyone stand up. Form one line along that wall — most experienced with AI agents at the front, newest at the back. Argue with each other about where you stand. This is the map of the room."
2. **Count off into teams (1 min).** "We have [N] people, we want teams of [3–5]. Count off [1–K] down the line, repeating. All the 1s form a team, all the 2s, and so on." Facilitator does the math live based on head count (17 → 4+4+4+5; 20 → 5×4; dynamic).
3. **Why this works:** The first "1" is the most experienced person, the middle "1" is in the middle of the experience range, the last "1" is newest. Every team automatically spans the full experience spectrum. No friend-clumping.
4. **Sit, introduce, name (5 min).** "Go to a table together. Tell each other your name and one sentence about what brought you here. Pick a team name. Raise a hand when you have it."
5. **Live entry.** As team names come in, facilitator enters them in the admin dashboard. Tiles appear live on the presenter view and on each team's participant board.

**Callout — Why mix experience:** "A team where everyone works with agents the same way will only build what they already know. A mixed team will argue, and the argument is where harness engineering actually happens."

**Follow-up engineering tasks (filed, not blockers):**

- **Presenter view live refresh.** Subscribe to workshop state on the team-formation scene; poll every 2–3s or SSE. Show a grid of team-name tiles that fill in as facilitator enters them in admin. Zero data entry on the presentation view itself.
- **Team membership versioning.** Data model: `teams` (stable, owns repo) + `team_memberships` (team_id, participant_id, phase_id, joined_at). Snapshot at rotation so we can answer "who was in Team Alpha during Build 1 vs Build 2?" Need to read current team model before committing to a migration shape.
- **Team-repo binding stability.** The team entity stays attached to the repo across the day; only the members swap at rotation.

### Scene 1.5 — Light handoff beat (open question)

Currently proposed as a minimal transition scene: "Your team is on the board. Look up. Next: the talk." Open question: is this worth a dedicated scene, or should it just be a verbal transition the facilitator makes (and we delete the scene entirely, going 5 → 4 scenes)?

### Phase 1 — Parked decisions (revisit after full review)

- Whether "Context is King" is the right frame vs. "Harness is King" — parked; Context is the more known phrase and is fine to ride.
- Final scene count (4 vs 5) depending on 1.5 resolution.
- Whether to keep "not a contest / not a feature race" language anywhere, or cut all such negations.

### Phase 1 — Risks

- **Team formation can slip** if the room is shy. Fallback: facilitator starts assigning after 4 minutes of forming.
- **Live team entry depends on a dashboard change** (presenter-view refresh). If not ready by the next workshop, the team tiles can appear only on participant boards while the presenter view shows a static "Form your teams" slide.
- **Room noise** after team formation. Facilitator needs a clear reset signal before the Talk starts.

---

## Phase 2 — "The Craft Underneath" (09:40–10:05)

**Phase renamed** from "Context is King" / "Talk" to **"The Craft Underneath"**. Echoes the Phase 1 framing hero body ("the craft underneath all the agent hype") and sets up the whole phase as a reveal rather than a lecture. Scene titles read as a TEDx-style story arc.

### Final structure (5 scenes, 21–29 min of content, 25 min slot)

| # | Scene title | Purpose | Time |
|---|---|---|---|
| 2.1 | While we argued about prompts, something changed | Hook — voices-led industry signals | 7–9 min |
| 2.2 | Last week, it got a name | Name the discipline + engine-and-chassis analogy | 4–5 min |
| 2.3 | How you actually build one | The four pillars, actionable structure | 6–8 min |
| 2.4 | Humans steer. Agents execute. | Lopopolo's thesis + Monday promise | 3–5 min |
| 2.5 | You've been sitting inside one all morning | Personal bridge to Demo | 1–2 min |

Read the titles in order: *While we argued about prompts, something changed → last week, it got a name → here's how you actually build one → humans steer, agents execute → you've been sitting inside one all morning.* Each title is a small reveal that earns the next.

### Changes from current agenda.json

- **Phase name** — "Context is King" → "The Craft Underneath".
- **Scene 2.1 (was "Repo-readiness contrast")** — MOVED to Phase 3 Demo. The current content is a live demo and doesn't belong in a talk.
- **Scene 2.3 (was "Bridge into Build 1" with skill install instructions)** — MOVED to Phase 4 Build 1 kickoff. Skill install instructions no longer in the talk per Phase 1 decision.
- **Five new scenes** replace the old three. Content below.

### Scene 2.1 — "While we argued about prompts, something changed" (LOCKED)

*Scene type: `briefing`, chromePreset: `minimal`*

**Hero:**
- *Eyebrow:* The Craft Underneath
- *Title:* **While we argued about prompts, something changed**
- *Body:* "Six months ago the conversation was still about prompts. Today it's about what the agent reads when it opens your repo. The teams that figured that out are shipping in ways that looked impossible last year. Let me show you what changed — then we'll spend the rest of the day practicing it."

**Steps block — "What the last six months look like":**

1. **Ryan Lopopolo at OpenAI, February.** Led a team at OpenAI Frontier & Symphony that shipped a production beta with **one million lines of code in five months. Zero lines written by hand. One billion tokens a day. Zero percent human review.** He published the playbook. Its first principle: *"Humans steer. Agents execute."*
2. **Birgitta Böckeler at Thoughtworks, ten days ago.** Published on Martin Fowler's site the cleanest definition of the craft underneath all of this. She called it **harness engineering** and defined it as the discipline of the entire environment an agent works inside — guides that steer it before it acts, sensors that catch it after.
3. **Charlie Guo at OpenAI, also February.** Developer experience engineer, watching the shift from inside. His line: *"I'm moving away from chatting with AIs and moving towards managing them."* That is what happens to your role when harness engineering works.
4. **Mitchell Hashimoto at HashiCorp, earlier this year.** His test for whether you're actually practicing the craft: *"Anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again."* That is a one-sentence definition of a sensor.
5. **Stripe's Minions project, quietly shipping.** Over a thousand PRs a week landing for review with no human between the task being posted and the pull request arriving. Not a demo. Production.

**Callout — The honest weather:**
- *Tone:* info
- *Title:* Nobody actually knows what December looks like.
- *Body:* "The analyst firms are already projecting 2028 numbers. Honestly? Nobody knows what this looks like at the end of 2026. Simon Willison — a working developer, one of the most level-headed voices in this space — opened his January predictions post by saying *'I'm certain that things will change significantly, but unclear as to what those changes will be.'* In the same post, he mentioned that since Opus 4.5 and GPT-5.2 shipped late last year, the amount of code he writes by hand had dropped to *'a single digit percentage'* of his output. That's not an analyst projection. That's a report from the ground. And two days ago, Anthropic quietly announced they have a frontier model they're not releasing — a model that beat almost every human expert at finding software vulnerabilities, and that a test instance escaped from its sandbox to email a researcher from a park. The weather is moving faster than anyone predicted. The craft we're practicing today is the hedge against a year none of us can see."

### Scene 2.2 — "Last week, it got a name" (LOCKED)

*Scene type: `briefing`, chromePreset: `minimal`*

**Hero:**
- *Eyebrow:* The discipline has a name
- *Title:* **Last week, it got a name**
- *Body:* "Ten days ago, Birgitta Böckeler published this equation on Martin Fowler's site: **Agent = Model + Harness.** It's the cleanest version I've seen. The model has the power. The harness is what turns that power into useful work instead of drift."

**Quote block — Böckeler:**
> "A good harness doesn't aim to eliminate human input. It directs human input to where it matters most."

**Body — the engine and chassis analogy:**

> "Think of a raw engine. A powerful one — four hundred horsepower, top of the line, capable of more than most drivers can handle. Bolt it to a shopping cart and you have a very expensive way to destroy a parking lot. Bolt it to a well-designed chassis — frame, suspension, brakes, transmission, proper tires — and suddenly something extraordinary happens. The car becomes drivable by someone who isn't a professional. A decent driver can handle it. A careful driver can handle it well. The chassis didn't make the engine less powerful. It made the power accessible, predictable, survivable.
>
> That's the model. That's the harness. The model is the engine — enormous power, dangerous when bare. The harness is the chassis, the suspension, the tires, the brakes — everything that turns raw power into something a team can actually drive. And the test of a good harness is the same test as a good chassis: can someone other than the expert get in and drive it well?"

**Callout — The reframe:**
- *Tone:* info
- *Title:* The gap between models is narrowing. The gap between harnesses is widening.
- *Body:* "Two teams using the same Claude or the same GPT can ship wildly different outcomes — not because of the model, but because of the environment the model runs in. That environment has a name now. Today we learn to build it."

### Scene 2.3 — "How you actually build one" (LOCKED)

*Scene type: `briefing`, chromePreset: `agenda`*

**Hero:**
- *Eyebrow:* How it actually works
- *Title:* **How you actually build one**
- *Body:* "Fowler splits it into guides and sensors. OpenAI splits it into context, constraints, and feedback. Guo frames it as managing instead of chatting. I'm going to give you the four pillars I've watched actually work — across all of those framings. These are the four you'll practice before lunch."

**Steps block — The four pillars:**

1. **Context as infrastructure.** The repo is the agent's memory. AGENTS.md, skills, runbooks — team infrastructure, not documentation. If it's not in a file, it doesn't exist. That standard has a name — AGENTS.md — and the Linux Foundation now stewards it.
2. **Guides — steering before it acts.** Architectural rules, templates, constraints the agent literally cannot break. OpenAI's harness enforced layered architecture mechanically so drift was impossible, not just discouraged.
3. **Sensors — catching after it acts.** Tracer bullets, end-to-end tests, automated reviews — feedback optimized for the agent to consume, and scoped holistically. When the agent does more, your verification has to prove the *whole thing* works, not that one function returned 4.
4. **Managing, not chatting.** You stop being a pair-programmer and become a director with a crew. *"I'm moving away from chatting with AIs and moving towards managing them."* — Charlie Guo.

**Callout — Team lead for agents:**
- *Title:* A team lead builds the system the team runs in.
- *Body:* "They don't tell each developer what to do every thirty seconds. They build the rules, rituals, and feedback loops the team runs in. Today we practice that exact shift — for agents."

### Scene 2.4 — "Humans steer. Agents execute." (LOCKED)

*Scene type: `briefing`, chromePreset: `minimal`*

**Hero:**
- *Eyebrow:* The core line
- *Title:* **Humans steer. Agents execute.**
- *Body:* "Four words from Ryan Lopopolo, the OpenAI engineer who led the team that shipped a million lines of production code in five months with zero lines written by hand. This is his foundational principle — the one he says everything else rests on. I want you to carry these four words back to Monday. Everything else you learn today is a way of making them real."

**Quote block — Lopopolo on context:**
> "Give Codex a map, not a 1,000-page instruction manual."

**Quote block — Mitchell Hashimoto:**
> "Anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again."

**Callout — The Monday promise:**
- *Title:* Monday morning, you'll open your editor and work differently.
- *Body:* "Not with a new tool. With a different role. You'll stop being the person the agent asks questions of, and start being the person who builds the room it walks into."

### Scene 2.5 — "You've been sitting inside one all morning" (LOCKED)

*Scene type: `transition`, chromePreset: `minimal`*

**Hero:**
- *Eyebrow:* Before the demo
- *Title:* **You've been sitting inside one all morning**
- *Body:* "The workshop skill. The dashboard. The participant board in front of you. The repo you're about to open. I built all of it with agents, using the discipline we just named. Not as a sales pitch — as proof. The craft is real. It works. Today we're practicing inside an example of it. What you're about to see in the demo is a working instance, not a promise."

**Facilitator transition line:** "Let me show you what I mean — here's what a working agent session actually looks like when the harness is doing its job."

### Phase 2 — Risks

- **Density.** Scene 2.1 carries a lot of signal. If the room is skeptical or fatigued, the five named voices can feel like a parade. Facilitator should pace with deliberate pauses after each name, not rattle them off.
- **2.3 overrun risk.** The four pillars scene is the most information-heavy in the talk. Target 6–8 minutes; if it runs to 10, the whole phase overflows. Have a pre-cut version ready that collapses pillars 2 and 3 into one ("guides + sensors, steering before and catching after").
- **Engine/chassis analogy consistency.** If the facilitator extends the analogy later in the day ("that's your suspension," "that's your brakes"), they must be consistent — mixed metaphors will undermine the image. Decide ahead of time whether the analogy is a one-time image or a running motif.

### Phase 2 — Sources (citations used in content)

- [Harness engineering: leveraging Codex in an agent-first world — Ryan Lopopolo, OpenAI, February 2026](https://openai.com/index/harness-engineering/)
- [Extreme Harness Engineering for Token Billionaires — Ryan Lopopolo, Latent Space](https://www.latent.space/p/harness-eng)
- [OpenAI Introduces Harness Engineering — InfoQ, Feb 21 2026](https://www.infoq.com/news/2026/02/openai-harness-engineering-codex/)
- [Harness engineering for coding agent users — Birgitta Böckeler, martinfowler.com, April 2 2026](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html)
- [The Emerging "Harness Engineering" Playbook — Charlie Guo, Artificial Ignorance, Feb 22 2026](https://www.ignorance.ai/p/the-emerging-harness-engineering)
- [LLM predictions for 2026, shared with Oxide and Friends — Simon Willison, January 8 2026](https://simonwillison.net/2026/Jan/8/llm-predictions-for-2026/)
- [Project Glasswing — Anthropic, April 10 2026](https://www.anthropic.com/glasswing)
- [AGENTS.md standard — agents.md](https://agents.md/)
- Mitchell Hashimoto quote sourced via Charlie Guo's Artificial Ignorance post.

### Phase 2 — Follow-ups (added to cross-phase list)

- English canonical language: `content/talks/locales/en/context-is-king.md` is a 7-line stub pointing to Czech. Write full English version of the talk. Same for `codex-demo-script.md`. Four "English stub" files total under `content/talks/locales/en/`.
- When applying scene edits to `agenda.json`, preserve the `cs_reviewed` flag semantics and re-translate Czech from the new canonical English.

## Phase 3 — "Let me show you" (10:05–10:30)

**Phase renamed** from "Codex demo" / "demo" to **"Let me show you"**. Chains directly from Phase 2's final scene ("You've been sitting inside one all morning") → Phase 3 opens with the facilitator saying "let me show you how." Narrative continuity.

### Final structure (4 scenes, 16–21 min of content, 25 min slot)

| # | Scene title | What happens on screen | Time |
|---|---|---|---|
| 3.1 | Same prompt. Two repos. Watch what happens. | Live contrast, Folder A drifts, Folder B holds. "Task drift" named live. | 5–7 min |
| 3.2 | Now watch it hold together | Folder B end-to-end: AGENTS.md → /plan → small slice → /review | 6–8 min |
| 3.3 | Your toolkit, same discipline | Live skill install, one skill command | 3–4 min |
| 3.4 | Your first ten minutes | Bridge: what every team does in first ten minutes of Build Phase 1 | 2 min |

### Changes from current agenda.json

- **Phase name** — "Codex demo" → "Let me show you".
- **Repo-readiness contrast is now 3.1** — moved in from the old Phase 2 Scene 2.1 (talk-micro-exercise). This is where it belongs.
- **Live skill install is now 3.3** — moved in from Phase 1 (original opening toolkit scene, cut) and Phase 2 (old Scene 2.3, cut). Skill install happens once on stage, then again at start of Build 1 with everyone.
- **Scene 3.4 "Your first ten minutes"** — new scene replacing the old "Participant demo board" scene. Actionable first-ten-minutes checklist, not a "watch for" slide.
- **"Task drift" is named live, not as its own scene.** Lands as a callout inside 3.1, keeps momentum.
- **Source file `content/talks/codex-demo-script.md` is much richer than the old scenes.** The rewrite brings the source file content (contrast, task drift, workflow, skill install, fallbacks) into the agenda scenes.

### Scene 3.1 — "Same prompt. Two repos. Watch what happens." (LOCKED)

*Scene type: `demo`, chromePreset: `minimal`*

**Hero:**
- *Eyebrow:* Let me show you
- *Title:* **Same prompt. Two repos. Watch what happens.**
- *Body:* "I'm going to run the same simple prompt in two repos — one bare, one with a harness. Same words. Same model. Watch what changes."

**Steps block — "The two folders":**
1. **Folder A — the bare repo.** Project brief, nothing else. No AGENTS.md. No constraints. No plan. "Most repos on Monday morning look exactly like this."
2. **Folder B — the same repo, with a harness.** Same brief. Plus AGENTS.md (Goal, Context, Constraints, Done When). Plus a short plan. Plus the workshop skill installed.

*[Facilitator runs prompt live in Folder A — watches it drift.]*

**Callout — Name it:**
- *Title:* That was task drift.
- *Body:* "The agent started without constraints and made plausible but wrong decisions. Without a harness, it filled in the blanks with its own assumptions. This is what happens in every repo without AGENTS.md — every Monday morning, in every team. It has a name: **task drift**. Once you can name it, you can build for it."

*[Facilitator then runs the same prompt in Folder B — watches it hold.]*

**Callout — The key line:**
- *Title:* The prompt didn't change. The repo did.
- *Body:* "Same words, same model, different harness, different outcome. That's the whole day in thirty seconds."

### Scene 3.2 — "Now watch it hold together" (LOCKED)

*Scene type: `demo`, chromePreset: `agenda`*

**Hero:**
- *Eyebrow:* The full flow
- *Title:* **Now watch it hold together**
- *Body:* "I'm staying in Folder B. I'm going to run the actual workflow — the one you'll be running in twenty minutes. Four beats. Watch how each one feeds the next."

**Steps block — "The working flow":**
1. **AGENTS.md — the map.** Goal, Context, Constraints, Done When. Four headings. The agent reads this first, every session. This is the team's memory.
2. **/plan — the next safe step.** The agent breaks the work into bounded steps. You see the plan before anything is written.
3. **Small slice.** The agent implements one bounded piece. Not the whole feature. Small enough to verify.
4. **/review — change control inside the flow.** Review is not a panic brake at the end. It's how the agent and the team agree on what just shipped.

**Callout:**
- *Title:* Review is not an emergency brake.
- *Body:* "It's part of the workflow. Every beat feeds the next. When something goes wrong — and things go wrong — you catch it one beat away, not ten."

### Scene 3.3 — "Your toolkit, same discipline" (LOCKED)

*Scene type: `demo`, chromePreset: `minimal`*

**Hero:**
- *Eyebrow:* The workshop skill
- *Title:* **Your toolkit, same discipline**
- *Body:* "You've been watching me work in Folder B. In twenty minutes, you'll be working in your own Folder B. Here's the one tool that ties it together — the workshop skill. Let me install it on my machine right now so you see exactly what you'll do."

*[Live install of the workshop skill. Facilitator runs the command, verifies, invokes one skill call to read a brief. Hybrid fallback: 30-second pre-recorded video of the same install ready if anything breaks.]*

**Steps block — "What the skill gives you":**
1. **One command to install.** In your team's repo. That's it.
2. **Your brief, on demand.** The skill knows your team, your project, your phase. Ask it, it hands you what you need.
3. **Reference material when you're stuck.** Patterns, examples, checks. Not a tutorial — a reference you pull at the moment of need.
4. **A place to record what you learn.** Every time you find a mistake worth fixing for next time, it lives here.

**Callout — Hashimoto's rule, operationalized:**
- *Title:* Remember his line from this morning.
- *Body:* "*Anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again.* This skill is where you do that — in a file, in the repo, for the next person. Or the next you."

### Scene 3.4 — "Your first ten minutes" (LOCKED)

*Scene type: `transition`, chromePreset: `participant`*

**Hero:**
- *Eyebrow:* Build Phase 1 starts now
- *Title:* **Your first ten minutes**
- *Body:* "In ten minutes I want every team at the point where the agent is actually helping you draft your plan. Here's how you get there — four moves. Don't skip any of them."

**Steps block:**
1. **Open your team's repo.** Create from template if you need to. One person opens it for everyone.
2. **Install the workshop skill.** Same command I just ran. If it breaks, raise a hand — someone will come to you.
3. **Agree on what you're building.** Ask the skill for the list of prepared briefs, or propose your own. Five minutes to decide, not fifty.
4. **Start your AGENTS.md with the agent.** Open a session and draft three things together: what *done* looks like, what's *not in scope*, what you'll *verify first*. The agent is your first collaborator. Let it ask you questions.

**Callout — The starting move:**
- *Title:* Align with your team, then align with the agent.
- *Body:* "Your team has to know what it wants before you can ask the agent for it. That's not a rule against using the agent early — it's a rule against using it as a tiebreaker for a decision the team hasn't made yet. Five minutes of team alignment saves an hour of drift."

**Callout — Build something you'd actually use Monday:**
- *Title:* Your ambition is welcome — once the harness holds.
- *Body:* "These briefs describe a shape. How far you take it is up to your team. If you want to plug your standup bot into your actual Slack, do it. If you want your metrics dashboard on your real data, do it. The harness comes first — but once the harness holds, go as far as your team can reach. Monday is the point."

**Facilitator transition:** *"Clock starts now. Build Phase 1 is open."*

### Phase 3 — Risks

- **Scene 3.1 live demo risk.** Live generation can drag or break. Fallback: pre-prepared screenshots of both Folder A drift and Folder B aligned output. Have them ready on a second screen or a slide.
- **Scene 3.3 live install risk.** Even with a pre-recorded fallback, a live install failure in front of the room is a tone-killer. Test the install fresh on the facilitator's machine the morning of. Have the pre-recorded video cued and ready to play in under 10 seconds.
- **Scene 3.4 brief listing depends on skill command that doesn't exist yet.** See follow-ups below.

### Phase 3 — Follow-ups (added to cross-phase list as required build tasks)

1. **`harness demo-setup` CLI command.** Scaffolds the contrast exercise: creates Folder A (bare — brief only) and Folder B (harnessed — brief + AGENTS.md with Goal/Context/Constraints/Done When + a short plan + workshop skill installed). One command, facilitator runs it before the workshop. Naming to be resolved against existing `harness-cli` conventions.
2. **`workshop briefs` (plural) skill command.** Current skill has `workshop brief` (singular) which shows the assigned brief for the current team. Scene 3.4 step 3 requires a listing command so teams can browse and pick. Add `workshop briefs` as a list-all-available command. Copy in Scene 3.4 assumes this exists.
3. **Register `doc-generator` brief in `agenda.json` inventory.** The file `content/project-briefs/doc-generator.md` exists but is not in `inventory.briefs`. Decide: register as a fifth brief (my leaning — the content is structurally sound and fits the pattern), or delete the file. If registering, also write the full bilingual en/cs structured entry for `inventory.briefs`.

## Interlude — Brief content review (LOCKED)

Medium-depth review of all 5 project briefs, conducted before Phase 4 (Build 1) because briefs drive that phase's content. Each brief reviewed against: problem clarity, user story quality, architecture notes strength, done-when sharpness (especially the handoff test), first-agent prompt quality, and alignment to the workshop's harness-engineering thesis.

### Cross-cutting findings

**Finding 1: Two sources of truth exist for briefs, and they disagree.**

The rich content lives in `content/project-briefs/*.md` (Czech root) and `content/project-briefs/locales/en/*.md` (English, canonical per the localization plan). The `agenda.json` `.inventory.briefs[]` version is a flattened subset with fewer user stories, fewer acceptance criteria, and shorter architecture notes. The skill prefers the markdown files; the dashboard presumably uses the inventory. Same brief, different content, depending on surface.

**Resolution:** Treat the English markdown as the canonical source. Regenerate the `agenda.json` inventory from the markdown files. Applied across all 5 briefs.

**Finding 2: The handoff test should always be Done-when criterion #1.**

Every brief has a concrete handoff test in its Done-when list — "another team can continue in 10 minutes," "another team can add a rule without a long onboarding pass," "a reviewer can tell where each claim came from within minutes." In every current brief, this criterion is at position 3 or 4 of the list, equal-weighted with other criteria. But it is the one that matches the afternoon rotation exercise, and the one that teams should build toward from hour one.

**Resolution:** Promote the handoff test to Done-when #1 in every brief revision, with an explicit parenthetical *(Handoff test.)* label.

**Finding 3: Every brief's first-agent prompt must establish the harness-first ordering.**

The discipline this workshop teaches is not "stay small" — it is "build the harness before you build the features." All five first-agent prompts already establish this ordering ("don't start with code," "start with the data model," "start by listing signals"). No per-brief non-goals needed.

**Resolution:** Keep first-agent prompts as the mechanism that enforces order. Do not add "Not in scope" sections to any brief. Ambition is welcome at the brief level — it just comes after the harness.

**Finding 4: Ambition should be promoted at the workshop level, not restricted at the brief level.**

If a team wants to build a standup bot connected to their actual Slack, or a metrics dashboard on their real data, that is the whole point — these tools should go home on Monday. Restricting ambition in briefs would undercut the workshop's central promise.

**Resolution:** Added a new callout to Scene 3.4 ("Your ambition is welcome — once the harness holds") that makes the philosophy explicit at the workshop level. Briefs stay open on the feature dimension; the harness ordering does the focusing.

**Finding 5: The two strongest briefs philosophically are the "certainty vs. heuristic" ones.**

**Code Review Helper** and **Doc Generator** both foreground the distinction between what the tool knows and what it is inferring. That distinction IS harness engineering in miniature — separating certain sensors from heuristic sensors is the exact craft the talk teaches. The other three briefs (DevToolbox, Standup Bot, Metrics Dashboard) are more classically architecturally instructive — data/UI separation, extension patterns, runbook discipline.

**Optional follow-up:** Label briefs by emphasis in the skill's `workshop briefs` listing command — *architecture-focused* vs *epistemics-focused* — so teams can pick with intent. Parked unless the skill command is built.

### Brief 1 — DevToolbox CLI (LOCKED)

**Core read:** A CLI tool solving a few common developer pain points in a way that survives handoff. Handoff test: *"Another team can add or fix a command within 10 minutes of opening the repo."*

**Verdict:** Keep, with medium revisions.

**Revised problem:**
> Every team accumulates small one-off scripts — log cleaners, JSON parsers, commit lookups — that work for one person until nobody remembers how to run them. Your job: design a CLI that solves a few real developer pain points and survives handoff. Not a bag of scripts. A small system where it's obvious where the next command, test, and doc belong.

**Revised Done when (handoff first):**
1. **Another team can add or fix a command within 10 minutes of opening the repo.** *(Handoff test.)*
2. At least 3 working commands, each solving a concrete developer pain point.
3. `README` and `AGENTS.md` explain how to run and verify locally.
4. The extension pattern is visible — a new command fits without breaking the structure.
5. Every command has at least one readable input/output example.

**Revised first-agent prompt:**
> Don't start with code. Start with `AGENTS.md`, a short plan for the extension pattern, and one clear verification step. Only then implement the first command.

**Keep:** user stories, architecture notes.

### Brief 2 — Standup Bot (LOCKED)

**Core read:** A tool that ingests standup inputs and turns them into a summary where blockers, dependencies, and next safe moves are visible. Handoff test: *"Another team can continue this project without a verbal explanation from the original team."*

**Verdict:** Keep, with medium revisions.

**Revised problem:**
> Daily standups in chat become long threads where blockers get lost, dependencies between people are invisible, and nothing is reconstructable an hour later. Your job: design a tool that turns standup inputs into an overview a different team can continue working from — without the original author, without the original thread, and without a verbal handoff.

**Revised Done when (handoff first):**
1. **Another team can continue this project without a verbal explanation from the original team.** *(Handoff test.)*
2. The tool ingests seed data in a documented format and produces an overview that surfaces blockers, dependencies, and items needing coordination.
3. The output distinguishes what the tool is certain about from what is only a heuristic suggestion.
4. The repo explains how to connect the ingest to a real input channel — without requiring it.
5. Ingest, processing, and presentation are cleanly separated in the code.

**Revised first-agent prompt:**
> Don't start with code. Start with: the seed data format, the output data model, the rules that distinguish certainty from heuristic, and an `AGENTS.md` a rotating team will open first. Only then propose the first implementation slice.

**Keep:** user stories, architecture notes.

### Brief 3 — Code Review Helper (LOCKED)

**Core read:** A tool that turns a diff into a usable review checklist, separating certain findings from heuristic suggestions from items still needing human judgment. Handoff test: *"Another team can add a new review rule within 10 minutes without reading through the whole codebase."*

**Verdict:** Keep, with medium revisions. **One of the two strongest briefs philosophically** — the "distinguish certain from heuristic" framing is harness engineering in miniature.

**Revised problem:**
> Code review quality swings with whoever's looking. Some changes arrive with a sharp checklist and clear risk framing; others come through unevenly and the team loses consistency. Your job: design a tool that turns a diff into a usable review checklist — one that says what it is certain about, what is heuristic suggestion, and what still needs human judgment.

**Revised Done when (expanded and reordered, handoff first):**
1. **Another team can add a new review rule within 10 minutes without reading through the whole codebase.** *(Handoff test.)*
2. The tool produces a review checklist from a seed diff.
3. The output clearly separates certain findings from heuristic suggestions from items still needing human judgment.
4. The review rules themselves are readable and editable by someone who didn't write them.
5. There is at least one concrete example in `examples/` that demonstrates the full flow.

**Revised first-agent prompt:**
> Don't start with code. First write the review rules, define what a good checklist looks like for a specific seed diff, and clarify what the tool *cannot* evaluate reliably. Only then propose the first implementation slice.

**Keep:** user stories, architecture notes (with seed diff + `examples/` emphasis).

### Brief 4 — Metrics Dashboard (LOCKED)

**Core read:** A dashboard that shows several metrics with seed-data and UI cleanly separated, legible on both mobile and projected screens. Handoff test: *"A team that didn't build this can add a new metric within 10 minutes without breaking the layout."*

**Verdict:** Keep, with medium revisions.

**Revised problem:**
> Every team has the data — user signups, deploy frequency, error rates, feature usage — scattered across different tools. The shared screen that turns it into a decision-making view usually doesn't exist. Your job: design a dashboard that puts a few metrics and one trend on one screen, stays cleanly separated between data and UI, and is still legible after handoff to a team that didn't build it.

**Revised Done when (handoff first):**
1. **A team that didn't build this can add a new metric within 10 minutes without breaking the layout.** *(Handoff test.)*
2. The dashboard shows at least 3 metrics and one trend or comparison.
3. Seed data and UI logic are cleanly separated — a facilitator can swap seed data without touching the UI.
4. The layout stays legible on mobile and on a large projected screen; the `README` says how to test both.
5. The `README` documents what's real, what's mocked, and what's missing.

**Revised first-agent prompt:**
> Don't start with the UI. Start with the data model, the component boundaries, the layout rules, and a `Done When` in `AGENTS.md`. Only then touch any visual code.

**Flag:** The "projected screen" requirement is a workshop-specific constraint (facilitators showing team work on a big screen during reveal). If briefs are ever used outside this workshop context, reconsider whether dual mobile/projection readability is still required.

**Keep:** user stories, architecture notes.

### Brief 5 — Doc Generator (LOCKED — but REQUIRES REGISTRATION)

**Core read:** A tool that generates baseline technical documentation or a structured project overview from a codebase, making certainty and inference visibly different. Handoff test: *"A reviewer can tell where each claim came from within minutes."*

**Verdict:** **REGISTER and keep**, with medium revisions. The other of the two philosophically strongest briefs. The line *"Optimize for trust, traceability, and a clear next safe move"* is worth stealing elsewhere in the workshop — it may be the single best line across all 5 briefs.

**Critical follow-up:** This brief exists in `content/project-briefs/doc-generator.md` (Czech root) and `content/project-briefs/locales/en/doc-generator.md` (English), but is NOT registered in `agenda.json` `.inventory.briefs[]`. Register as a fifth brief with a full bilingual structured entry.

**Revised problem:** (minor tightening of the original, which is already the strongest problem statement of all 5)
> Documentation goes stale almost immediately. Once maintenance is fully manual, the team postpones it, and after a few iterations nobody knows whether the docs still describe reality. After handoff, the next team no longer knows what to trust and what is only inference. Your job: design a tool that generates baseline technical documentation — or a structured project overview — from an existing codebase in a way that makes *what we know* and *what we're inferring* visibly different.

**Revised Done when (handoff first):**
1. **A reviewer can read the generated documentation and tell exactly where each claim came from — within minutes, without opening the original source.** *(Handoff test — provenance is the whole point.)*
2. Another team can add a new output format (Markdown → HTML, report → overview) without refactoring the whole tool.
3. The generated output makes it obvious which claims are *certain* (read directly from source) and which are *inference* (heuristic).
4. The tool produces at least one complete, readable output for a real or seed codebase.
5. `README` and `AGENTS.md` explain how to run locally and what input the tool expects.

**Revised first-agent prompt:**
> Start by listing every signal the tool will read from a codebase (file names, imports, commit messages, directory structure, comments — whatever you're choosing) and for each one, decide whether it produces *certain* output or *heuristic* output. Write that spec in `AGENTS.md`. Only then propose the first implementation slice.

**Keep:** user stories, architecture notes (especially "do not optimize for AI theatre").

### Brief review — Follow-ups (added to cross-phase list)

1. **Reconcile `agenda.json` `.inventory.briefs[]` with the markdown files.** Decide: generate inventory from markdown as a build step (my recommendation), or maintain both in sync manually. Markdown is canonical per the localization plan.
2. **Apply inline revisions above** to each of the 5 briefs' English markdown. Promote handoff test, tighten problems, sharpen first-agent prompts.
3. **Register `doc-generator` in `agenda.json` `.inventory.briefs[]`** with full bilingual structured entry.
4. **Regenerate Czech translations** for all 5 briefs from the revised English canonical versions.
5. **Parked:** Label briefs by emphasis (*architecture-focused* vs *epistemics-focused*) in the `workshop briefs` listing command, to help teams pick with intent. Only implement if the listing command is built and if the split feels useful in practice.

## Phase 4 — Build Phase 1 (10:30–11:35, 65 min)

**Model note:** Phase 4 runs in presentation mode the whole time, but the tempo shifts from talk/demo. The big screen becomes ambient reference instead of driving attention. Participant boards on each seat show the same scenes as the big screen. Facilitator flips scenes intentionally at specific moments and walks the room the rest of the time.

### Final structure (3 scenes)

| # | Scene | Job | When on screen |
|---|---|---|---|
| 4.1 | Clock started. You're on. | Kickoff moment — marks transition from "here's the plan" to "you're executing it" | ~30 sec at 10:30 |
| 4.2 | The next 65 minutes | Timeline + baseline + verification principle | 10:30 → 11:30 (default ambient scene on both surfaces) |
| 4.3 | Return to the proof | Stuck-recovery pattern | Facilitator flips to it when a team is stuck, or projects room-wide at a checkpoint moment |

### Changes from current agenda.json

- **New Scene 4.1 "Clock started. You're on."** — a crisp kickoff moment that marks the transition from Phase 3's plan-delivery to Phase 4's execution. Did not exist in the current agenda.
- **Renamed timeline scene.** The current "Milestone board" becomes "The next 65 minutes" with an explicit timeline (10:30 → 11:35) as guide, not deadline.
- **AGENTS.md-as-map made explicit.** The current baseline checklist reads as if AGENTS.md should contain everything (plan, slice, note). Rewrite makes AGENTS.md a map with pointers, and lists other artifacts as separate repo items.
- **Tracer bullet promoted to first-class verification.** Added as explicit content: before you write the code, sketch your first tracer.
- **New verification callout** in Scene 4.2 teaching "holistic beats granular." Specifically reframes verification around tracer bullets, end-to-end tests, and automated reviews — not unit tests.
- **Stuck-recovery scene tightened.** Removed the redundant "what another team should read" checklist since that content now lives in Scene 4.2's baseline.
- **Old participant-view scene cut.** Content folded into Scene 4.2 (which now serves both big screen and participant boards).
- **No handoff rehearsal scene.** An earlier draft had "In 30 minutes another team will read your repo" — cut because (a) the rotation is actually ~2 hours away, so it was factually wrong; (b) it telegraphed the rotation reveal too loudly. The last timeline step of Scene 4.2 (11:30–11:35 final check) handles the self-check beat without a dedicated slide.

### Scene 4.1 — "Clock started. You're on." (LOCKED)

*Scene type: `transition`, chromePreset: `minimal`*

**Hero:**
- *Eyebrow:* Build Phase 1 is live
- *Title:* **Clock started. You're on.**
- *Body:* "Team first. Map first. Tracer first. Facilitators are walking — ask for questions, not answers. If you get stuck, the recovery pattern is one flip away. At 11:35, we pause together."

*(30-second beat. One hero, no blocks. Facilitator says "go" out loud while this is on screen, then flips to 4.2.)*

### Scene 4.2 — "The next 65 minutes" (LOCKED)

*Scene type: `checkpoint`, chromePreset: `participant`*

**Hero:**
- *Eyebrow:* Build Phase 1
- *Title:* **The next 65 minutes**
- *Body:* "Here's the arc your team is building toward. You don't have to hit every beat at the exact minute. But by lunch, your repo should hold the full shape of the work — not your conversations, not your heads, the repo."

**Steps — the timeline:**
1. **10:30–10:40 · Set up.** Repo open. Skill installed. Team aligned on what you're building. First `AGENTS.md` draft started with the agent.
2. **10:40–11:00 · Plan and scaffold.** `AGENTS.md` as a **map** — goal, context, done-when, and pointers to the other files. Not a warehouse. A short plan for the first slice. Before you write the code, sketch your first tracer — the thin end-to-end path that will prove the system holds together.
3. **11:00–11:20 · Ship the first slice.** One bounded piece of work. One tracer that runs. Commit it.
4. **11:20–11:30 · Iterate or extend.** If the tracer holds, push further. If it doesn't, fix the verification and ship again.
5. **11:30–11:35 · Final check.** Run your tracer yourself. Read your repo with fresh eyes. Does it hold everything someone else would need to continue?

**Checklist — The baseline (four separate things in the repo, not one big `AGENTS.md`):**
- **`AGENTS.md` — a map.** Goal, context, done-when, and pointers to where everything else lives. Not a warehouse for all the details.
- **A plan.** Short, followable. Wherever it makes sense — its own file, a section in `AGENTS.md`, or in the README.
- **A working slice with its tracer.** One bounded piece of code, plus the end-to-end path that proves it runs.
- **A next-move note.** What to do next, in the repo, not in your heads.

**Callout — On verification:**
- *Tone:* info
- *Title:* Holistic beats granular.
- *Body:* "With agents, your verification needs to prove the *whole thing* works, not that one function returned 4. Start with a tracer — a thin end-to-end path you can run. Then add automation so the tracer runs on every change. Add review — automated or human — only where judgment is needed. Unit tests are fine, but they are not the point. The more the agent does, the more holistic your checks have to be."

### Scene 4.3 — "Return to the proof" (LOCKED)

*Scene type: `checkpoint`, chromePreset: `checkpoint`*

**Hero:**
- *Eyebrow:* When the work isn't moving
- *Title:* **Return to the proof**
- *Body:* "More prompting won't unstick you. Step back. The answer is already in one of three places."

**Steps — three moves:**
1. **State what you're trying to prove.** Out loud, at the table. What are you actually trying to do? How will you know you moved forward? If the team can't answer, that *is* the block.
2. **Find the blind spot in the repo.** Is the problem in the README? `AGENTS.md`? The plan? The verification? The place the repo can't answer your question is the place to fix.
3. **Add the smallest check.** A test. A tracer bullet. A one-line script that proves reality matches your mental model. Any executable signal beats more guessing.

**Callout — An answer is not help:**
- *Tone:* info
- *Title:* If a facilitator hands you an answer, it didn't help.
- *Body:* "Ask for a question, not an answer. If you leave the conversation with a spoken solution but no repo artifact, the problem will come back an hour later. Return the fix to the repo."

*(Underlying principle, for the facilitator's internal reference: if an agent is doing something it shouldn't, the harness or context is wrong. That's what this scene carries to the room.)*

### Phase 4 — Facilitator runner (keep internal, not on any scene)

- **Coach first, mentor second, teach only as a last resort.** This is the core discipline of walking the room during Phase 4.
- If a team has no verification at all, push for the smallest useful tracer or test.
- Watch for: the team keeps generating text but verifies nothing; `AGENTS.md` grows into a warehouse for everything; it's unclear what's done vs. in progress vs. hypothesis.
- Checkpoint questions to ask teams: Does the team have one shared understanding of the goal? Is context accumulating in the repo or staying in heads and chat? Could another team find the first safe move in five minutes?

### Phase 4 — Follow-ups (added to cross-phase list)

1. **Add verification ladder reference to `workshop-skill/reference.md`.** Full content on tracer bullets, end-to-end tests, automated reviews, when to use each, and why holistic verification matters more with agents. Pullable via the skill when teams want to go deeper. Should explain: tracer bullet concept, red/green TDD as optional, security review strategies, automated vs human review, the "more autonomy = more holistic evidence" principle.
2. **Phase 2 Scene 2.3 Pillar 3 edit applied** — Sensors pillar now names tracer bullets, end-to-end tests, and automated reviews explicitly, previewing the Phase 4 verification language. One-line change, preserves the locked scene shape.

## Phase 5 — Intermezzo 1 (11:35–12:15, 40 min slot)

**Slot structure:**
- **11:35–11:55 · Intermezzo proper** (20 min)
- **11:55–12:15 · Pre-lunch buffer** (20 min — teams finish pending Build 1 work, commit, wrap up, then go to lunch)

The 40-minute slot is honestly split into reflection + buffer. The intermezzo itself is 20 minutes. The rest is finishing time and a natural decompress before lunch.

### Final structure (3 scenes, ~20 min of intermezzo content)

| # | Scene | Job | Time |
|---|---|---|---|
| 5.1 | Write before you speak | Individual silent retrieval against one question | 3 min |
| 5.2 | Your team's check-in | Team discusses, one person records the check-in on the team card | 5 min |
| 5.3 | The thread | Facilitator reads team check-ins on screen, threads them, names one principle point | 10–12 min |

### Changes from current agenda.json

- **Structure is preserved** but each scene has a tighter, more specific job.
- **New retrieval question** in Scene 5.1 — the old *"What would the next team need to find in your repo"* telegraphed the rotation and was too abstract. New question is craft-focused and forward-pointing.
- **Scene 5.2 repurposed as "record the check-in"** — the old "find one sentence per team" was theatrical and lossy. New flow has the team discuss naturally, one person writes a 2–3 sentence summary into the team card, and the summary becomes a lasting artifact in the team's record.
- **Scene 5.3 repurposed as "the thread"** — facilitator reads all team check-ins from the screen (visible to the room), threads them, and names one principle point. Evidence-based, not vibes-based.
- **Pre-lunch buffer is honest.** The second half of the 40-min slot is explicit buffer for finishing work and cleaning up — no content scenes, just the scheduled time.

### Scene 5.1 — "Write before you speak" (LOCKED)

*Scene type: `checkpoint`, chromePreset: `minimal`*

**Hero:**
- *Eyebrow:* Intermezzo 1
- *Title:* **Write before you speak**
- *Body:* "Three minutes. Individual. No talking. Write whatever comes up — short, honest, unedited. The retrieval only works if you produce before you share."

**Callout — The question:**
- *Tone:* info
- *Title:* The one question to write against.
- *Body:* "**What surprised you about working with the agent this morning — and what does that make you want to try differently next?** Three minutes. Don't talk yet."

### Scene 5.2 — "Your team's check-in" (LOCKED)

*Scene type: `checkpoint`, chromePreset: `participant`*

**Hero:**
- *Eyebrow:* Intermezzo 1
- *Title:* **Your team's check-in**
- *Body:* "Five minutes at your table. Compare what you wrote. Then one person writes the team's check-in into the team card on your participant board. Short, honest — two or three sentences is fine. It becomes part of your team's record."

**Steps:**
1. **Share what you wrote (3 min).** Go around the table. Read what you wrote out loud to each other. No debate, just listen.
2. **Agree on the check-in (1 min).** What's actually true about your team right now? What's surprising? What do you want to try differently?
3. **One person writes it (1 min).** On the participant board, in the team check-in field. It saves automatically and becomes part of your team's record.

**Callout — Record it, don't just say it:**
- *Tone:* info
- *Title:* If it's not recorded, it didn't happen.
- *Body:* "Same rule as the repo. A check-in spoken at the table and lost is not a check-in. Type it. Two sentences is enough. It will be here for your future self and for whoever reads this project next."

### Scene 5.3 — "The thread" (LOCKED)

*Scene type: `checkpoint`, chromePreset: `checkpoint`*

**Hero:**
- *Eyebrow:* Intermezzo 1
- *Title:* **The thread**
- *Body:* "Your check-ins are on screen. I'm going to read them out loud, one team at a time. Then I'll pull the thread that connects them — one principle point for the morning."

**Steps:**
1. **Read the check-ins on screen.** Facilitator scrolls through each team's recorded check-in and reads it aloud. No debate, just listening.
2. **The thread.** Facilitator names the one thing that connects the check-ins — a pattern, a tension, a shared gap, a common win. This is the principle point of the morning. Grounded in what is literally on screen, not in impressions.
3. **One thing to carry.** What each person takes into the afternoon. Verbal, or written back into the team card — facilitator's call.

**Callout — Evidence, not impressions:**
- *Tone:* info
- *Title:* The principle comes from the screen, not from vibes.
- *Body:* "Every team's check-in is on screen. The thread is whatever is actually there, not what the facilitator hopes is there. If the thread is *'nobody's verifying anything yet,'* we name it. If it's *'three teams already have a tracer,'* we name that. Either way: grounded in what's written."

### Phase 5 — Facilitator runner (keep internal)

- Silent retrieval benefit requires individual production before social sharing. If someone starts talking during the 3 min silent phase, redirect immediately.
- The principle point in Scene 5.3 is ad hoc, read from the room. Don't pre-can it. Pre-canned principles feel canned.
- If the intermezzo runs short (teams are quiet or the check-ins are thin), don't pad — move to the buffer and let teams get back to their repos. Short intermezzo > forced intermezzo.

### Phase 5 — Follow-ups (added to cross-phase list)

1. **Confirm team card check-in field is editable from participant board.** The Phase 1 exploration found team cards already have a "checkpoint/sprint status (free-text)" field. Need to confirm participants (not just admin/facilitator) can edit it, and from the `/participant` page.
2. **Design team check-in field as append-only log**, not a single overwritable field. Each intermezzo adds a new entry tagged with the phase. History is preserved across Intermezzo 1, Intermezzo 2, and potentially Reveal. If the current field overwrites, it needs to become append-only.
3. **Presenter view for Scene 5.3 needs a new layout** — a grid or list showing all team check-ins on screen at once, so the facilitator can scroll through and read them aloud while everyone sees them. New scene chrome, potentially a new `chromePreset`.
4. **Design decision: do rotating teams see the original team's Intermezzo 1 check-in?** Options: (a) yes, as part of the repo context they inherit — reinforces "the check-in is a lasting artifact"; (b) no, hidden until Reveal — preserves the rotation surprise. My leaning: (a), because it makes the check-in a real asset and teaches "record, don't speak." Flagged for user decision.

## Phase 6 — Lunch (12:15–13:30, ~75 min, dynamic)

**Phase renamed** from "Lunch and handoff prep" → **"Lunch"**. The "handoff prep" framing was facilitator-speak leaking into participant-visible content and telegraphed the rotation. Just "Lunch."

**Dynamic timing note:** 75 minutes is the default slot, but facilitator should negotiate the actual lunch length with the room on the day — energy level, food logistics, room preference. The return time displayed on Scene 6.1 should be editable by the facilitator, not hardcoded. The day schedule in Phase 1 Scene 1.3 shows these as guides, not deadlines.

### Final structure (1 scene)

| # | Scene | Job | When on screen |
|---|---|---|---|
| 6.1 | Back at [return-time] | Ambient logistics + quote echo from the morning | Up throughout lunch |

### Changes from current agenda.json

- **Phase renamed** to "Lunch."
- **Old Scene 6.1 "Lunch reset" — CUT.** It directly telegraphed the rotation ("the incoming team") which contradicts the no-telegraph decision made in Phase 4. Content either moves to Phase 5 Scene 5.3 "Before lunch" (already drafted with soft "future self" framing) or is eliminated as redundant.
- **Old Scene 6.2 "Participant lunch reset board" — CUT.** Same reason — four visible mentions of "another team will read your repo."
- **New Scene 6.1 "Back at [return-time]"** — minimal ambient logistics with a quote echo from the morning.

### Scene 6.1 — "Back at [return-time]" (LOCKED)

*Scene type: `transition`, chromePreset: `minimal`*

**Hero:**
- *Eyebrow:* Harness Lab · Lunch
- *Title:* **Back at [return-time]**
- *Body:* "Eat. Walk. Breathe. See you at [return-time] sharp."

**Callout — One line to sit with over lunch:**
- *Tone:* info
- *Title:* In case you forgot the morning's line.
- *Body:* "**Humans steer. Agents execute.** — Ryan Lopopolo, OpenAI Frontier & Symphony"

*(The `[return-time]` placeholder is a facilitator-settable variable. Default is the scheduled resume time from Phase 1's day schedule, but the facilitator can override it live on the day.)*

### Phase 6 — Facilitator runner (silent gate practice)

**On timing:** Negotiate lunch length with the room before dismissing. Read the energy. If people are wiped, give them longer. If people are wired, shorten it. Announce the return time clearly, enter it into the dashboard, and let Scene 6.1 display it.

**The silent gate.** During lunch:
- Eat first. Don't walk repos while people are still at the tables with their laptops — it feels surveillance-y.
- Once most participants are out of the room, walk each team's repo. Look for the four baseline items from Scene 4.2 (`AGENTS.md` as a map, a plan, a working slice with tracer, a next-move note).
- **Do not grade.** The walk is a safety check, not an evaluation. Most repos will be fine. Flag only the genuinely broken ones — no `AGENTS.md` at all, no commits, completely unusable state.
- **Intervene quietly, after lunch.** If a team's repo is genuinely broken, find one team member when they return and offer to help them capture the minimum. Frame it as *"I saw you were making good progress — let me help you capture it so the afternoon is easier."* Never frame it as a gate or a failure.
- **The team should not know this is a check.** No more than one or two interventions per workshop. If half the room needs help, the intermezzo was weak or Build 1 was under-timed. Learn from that, don't patch it here.

**Why this works:** Harness engineering applied to the workshop itself. The facilitator is a sensor for broken repos; the intervention is a guide (feedforward correction); the whole thing is invisible to participants. The workshop practices what it teaches.

### Phase 6 — Follow-ups (added to cross-phase list)

1. **Editable `[return-time]` variable on Scene 6.1.** Facilitator should be able to set and update the lunch return time from the admin dashboard, and Scene 6.1 should render whatever the current value is. Small dashboard change.
2. **Phase 1 Scene 1.3 "Day schedule" touch-up.** Add a line noting that times are guides, not deadlines, and that lunch timing in particular may be adjusted on the day. Small touch-up to locked content — not a full reopening.
3. **Facilitator runner: add "lunch gate walk" section to `workshop-blueprint/operator-guide.md`.** What to look for, when to intervene, how to frame the conversation. Short reference.

## Phase 7 — Rotation (13:30–13:45, 15 min)

**Core model:** Teams are anchored to physical objects (Lego brick, marker, numbered card — whatever teams claimed during Phase 1 formation). The team identity, repo, and check-in history stay at the anchor. The humans rotate between anchors.

**Rotation mechanic:** In-room scatter count-off. Zero dashboard feature required. Same shape as Phase 1 team formation, creating rhythm the room recognizes.

### Final structure (3 scenes)

| # | Scene | Job | Time |
|---|---|---|---|
| 7.1 | Your repo is not yours anymore | The reveal | 2 min |
| 7.2 | Line up, count off, walk to the anchor | The mechanic + physical move + introduction | 7–9 min |
| 7.3 | Read the room | The "every fresh agent session is a rotation" lesson + quiet-start protocol | 2–3 min |

**Total:** 11–14 min. Slot is 15 min. Tight buffer.

### Changes from current agenda.json

- **New Scene 7.1 "Your repo is not yours anymore"** — the reveal beat. Didn't exist in the current agenda, which jumped straight to "quiet start" without supporting the moment of announcement.
- **Scene 7.2 reshaped as a physical mechanic** — the current agenda had no content about how people actually rotate. New scene runs the scatter count-off in the room.
- **Scene 7.3 carries the "every fresh agent session is a rotation" lesson** from the facilitator runner to a participant-visible beat. This is the connection that makes rotation not a gimmick but a preview of daily practice.
- **"Frustration is data" callout** from facilitator runner promoted to Scene 7.3.

### Scene 7.1 — "Your repo is not yours anymore" (LOCKED)

*Scene type: `briefing`, chromePreset: `minimal`*

**Hero:**
- *Eyebrow:* The afternoon test
- *Title:* **Your repo is not yours anymore**
- *Body:* "For the rest of the day, you are working in the repo another team built this morning. Another team is working in yours. The team names — and the anchors that mark them — stay where they are. The people move. Everything you left in the repo at lunch is everything the new team has."

**Callout — Yes, this was always the plan:**
- *Tone:* info
- *Title:* This isn't an ambush. It's the test.
- *Body:* "The opening said you would hand off and inherit. Lunch was the gate. Whatever you left in the repo at noon is everything the new team has. Whatever is still in your heads — they will never hear it. This is what we practiced for."

### Scene 7.2 — "Line up, count off, walk to the anchor" (LOCKED)

*Scene type: `transition`, chromePreset: `participant`*

**Hero:**
- *Eyebrow:* The move
- *Title:* **Line up, count off, walk to the anchor**
- *Body:* "I'm going to call a count-off — same shape as this morning. Line up at your old anchor, count off one through [N], and remember your number. When I say go, everyone with the same number forms a new team at the anchor that matches. The repo, the history, and the check-in are already waiting."

**Steps:**
1. **Stand up at your old anchor.** Laptop, notebook, whatever you need — bring it with you.
2. **Count off along your team.** One, two, three, four, five. Remember your number.
3. **Walk to the anchor with your number.** All the 1s to Anchor 1, all the 2s to Anchor 2, and so on. The repo, the Intermezzo 1 check-in, and the team name are already there.
4. **Introduce yourselves — properly (3–5 min).** Three things each: (1) your name and one thing you care about in software, (2) one thing you're bringing from your old team, (3) one thing you want to know about this new repo.

**Callout — The one rule for the move:**
- *Tone:* info
- *Title:* Your old repo is not yours anymore. Do not help.
- *Body:* "You are leaving your old team's repo behind. The people arriving there have to read it cold. If they catch your eye, smile and point at the repo. The silence is the test — for you too."

**Why scatter count-off works as the algorithm:**
- Each new team gets at most one person from each original team (guaranteed by the count-off shape).
- Maximum mixing without a computed algorithm.
- Same mechanic as Phase 1 team formation — room recognizes the pattern.
- Zero dashboard dependency, zero failure mode beyond facilitator voice.
- Handles uneven team sizes with one sentence of facilitator discretion.

### Scene 7.3 — "Read the room" (LOCKED)

*Scene type: `checkpoint`, chromePreset: `participant`*

**Hero:**
- *Eyebrow:* Now you sit in the other team's work
- *Title:* **Every fresh agent session is a rotation**
- *Body:* "A new agent has no memory of the previous session. A new teammate next month opens your repo the same way. The exercise you're about to do — reading a stranger's repo cold — is what every fresh agent session looks like. Monday morning, every morning, it's the same move. We're just practicing it out loud, with humans, at scale."

**Steps — the quiet-start protocol (executed in the opening 10 min of Build Phase 2):**
1. **Read (5 min).** `README`, `AGENTS.md`, the plan, the latest commits, the team's Intermezzo 1 check-in. No keyboard. No conversation with anyone from the original team.
2. **Map (3 min).** Talk at your new table. What helps? What's missing? What's risky? What's the next safe move?
3. **Diagnose on the team card (2 min).** Write your team's diagnosis of the inherited repo directly onto the team card — not as status, as a recorded artifact. It joins the Intermezzo 1 check-in as part of the repo's history. Include the new team composition (who's in the team now).
4. **Then start.** Only after the diagnosis is written do you touch code.

**Callout — Frustration is data:**
- *Tone:* info
- *Title:* If this is confusing, that's the point.
- *Body:* "If the repo you just inherited is confusing to read, that isn't bad luck — it's what weak context feels like from the other side. Your job for the next ten minutes is to notice what's missing and write it down. Do not rescue the repo with conversation. The confusion is the signal."

### Phase 7 — Anchors + number cards

Physical props the facilitator needs to source and prepare before the workshop:

- **Anchors** — one per team, claimed during Phase 1 team formation. Any object that marks a team: Lego brick, marker, rubber duck, numbered card, coaster. Teams pick.
- **Number cards** — one per team, placed at each anchor at rotation time. Numbered 1, 2, 3, etc. Tells the count-off which anchor corresponds to which number.

**Sourcing note:** Lego bricks are cheap, easy to source in bulk, and give teams a tactile handle to hold. A partial recovery of the cut Lego duck moment from Phase 1, at a fraction of the cost.

### Phase 7 — Follow-ups (added to cross-phase list)

1. **Phase 1 Scene 1.4 touchup** — add "claim your anchor" as a 4th beat in the team formation exercise, between "pick your team name" and "we record it live." One-line addition to locked content.
2. **Facilitator pre-workshop checklist** — anchors sourced (enough for all teams + 1 spare), number cards printed (1 to max team count), both distributed to each team's spot before opening.
3. **Team membership versioning** — kept, simplified. Instead of computing rotation in the dashboard, the new team composition is recorded as part of the Build 2 first-beat diagnosis on the team card. One person types the new member names alongside the inherited-repo diagnosis. No algorithm feature needed.
4. **Resolved (no longer needed):** dashboard rotation algorithm feature, per-participant assignment rendering, rotation visual on presenter view. The physical count-off replaces all of these.

## Phase 8 — Build Phase 2 (13:45–15:30, 85 min of building + 20 min intermezzo pause in the middle)

**Model:** Mirrors Phase 4 Build 1 shape — kickoff / ambient timeline / on-demand stuck-recovery. Same goal as Build 1 (ship a working slice), same discipline, new starting context (inherited repo + new team). Codification is a discipline baked into the flow, not the goal of the phase.

**Key structural change from Build 1:** Build 2 is split into two pushes (first push 45 min, second push 40 min) with Intermezzo 2 as a 20-minute mid-point pause. Intermezzo 2 is not an endpoint — it's a quick check-in, then back to work. See Phase 9.

### Final structure (3 scenes)

| # | Scene | Job | When on screen |
|---|---|---|---|
| 8.1 | Same clock, new context | Kickoff moment | ~30 sec at 13:45 |
| 8.2 | Sixty minutes to ship | Timeline: quiet read → capture friction → ship → iterate | 13:45 → 14:30 (default ambient) |
| 8.3 | Return to the proof | Stuck-recovery pattern (same as 4.3) | Rotated in when needed |

### Changes from current agenda.json

- **Structure aligned with Phase 4.** The current "codification pause" as a standalone scene is folded into Scene 8.2's timeline as a 5-min beat, not a dedicated slide. Makes Build 2 and Build 1 visually consistent.
- **Scene 8.1 is new** — kickoff moment that mirrors 4.1.
- **"Build is the goal. Capturing friction is how you build without tripping twice."** New framing in Scene 8.2 that makes the feature goal explicit and demotes codification to a discipline serving the goal.
- **Self-validation trap ("Who wrote the checks?") promoted** from facilitator runner to a Scene 8.2 callout. This is the most important new teaching in Build 2.
- **8.3 is a literal twin of 4.3** — same content, new scene ID. Creates rhythm so the room recognizes the recovery pattern across both builds.

### Scene 8.1 — "Same clock, new context" (LOCKED)

*Scene type: `transition`, chromePreset: `minimal`*

**Hero:**
- *Eyebrow:* Build Phase 2 is live
- *Title:* **Same clock, new context**
- *Body:* "You're at a new anchor, with a new team, in a new repo. Ten minutes of reading first — no keyboard. Then capture what tripped you, so the next hour is clean. Then build. Eighty-five minutes of work, split by a twenty-minute pause at 14:30. Facilitators walking, recovery one flip away."

### Scene 8.2 — "Sixty minutes to ship" (LOCKED)

*Scene type: `checkpoint`, chromePreset: `participant`*

**Hero:**
- *Eyebrow:* Build Phase 2
- *Title:* **Eighty-five minutes to ship, split in two**
- *Body:* "Same goal as this morning — ship a working slice, verified, committed. Same discipline — team first, map first, tracer first. One new move: when the inherited repo trips you, capture the friction into the repo as you go. Eighty-five minutes of building, split by a twenty-minute pause in the middle. Build is the goal. Capturing friction is how you build without tripping on the same thing twice."

**Steps — the timeline (6 steps, intermezzo in the middle):**
1. **13:45–13:55 · Quiet read (carried over from rotation).** Ten minutes, no keyboard. Read the repo, write your diagnosis and new team composition on the team card.
2. **13:55–14:00 · Capture the friction.** Five minutes. You just read a stranger's repo. What tripped you? What was missing? Write it into the repo — a clearer `AGENTS.md` section, a rule, a missing check. Not because it is the goal, but so your next hour is not about fixing the same confusion five times. Five minutes of cleanup earns an hour of clean building.
3. **14:00–14:30 · First push — ship a slice.** Thirty minutes. One bounded piece, one tracer that runs, committed.
4. **14:30–14:50 · Mid-point pause (Intermezzo 2).** Twenty minutes. Step back with the room, check in, then back to your team. This is a pause, not an ending.
5. **14:50–15:20 · Second push — build it out.** Thirty minutes. Iterate, extend, push further. Fix what the first push did not. Apply whatever you surfaced in the intermezzo.
6. **15:20–15:30 · Final cleanup.** Ten minutes. Commit. Make your repo readable. Decide what you will show at Reveal.

**Checklist — The baseline, same as Build 1:**
- **`AGENTS.md` as a map.** Goal, context, done-when, pointers. Not a warehouse.
- **A plan.** Short, followable.
- **A working slice with its tracer.** One bounded piece of code, plus the end-to-end path that proves it runs.
- **A next-move note.** What to do next, in the repo, not in your heads.

**Callout — Who wrote the checks?**
- *Tone:* info
- *Title:* Watch out for the self-validation trap.
- *Body:* "When the agent generates tests in the same task it generates code, those tests reflect the agent's interpretation of the spec — not the spec itself. **Independent verification means: you wrote the done criteria, or a separate pass evaluates the output.** This is a quiet trap. Most teams fall into it once. Name it when you see it, and split the work — one pass writes the check, a different pass writes the code."

### Scene 8.3 — "Return to the proof" (LOCKED — same content as 4.3)

*Scene type: `checkpoint`, chromePreset: `checkpoint`*

Same content as Scene 4.3 — hero, steps, and "an answer is not help" callout. New agenda.json scene ID, but the copy is identical. Creates rhythm so the room recognizes the recovery pattern in both builds.

### Phase 8 — Facilitator runner (keep internal)

- Same coaching discipline as Build 1: coach first, mentor second, teach only as a last resort.
- **Do not let teams replace a weak repo signal with verbal handoff.** The discipline of the whole day rests on this. If a team wants to walk to the original authors and ask a question, redirect them back to the repo.
- **Name the self-validation trap out loud if you see it.** When a team says "the agent wrote tests too, so we're fine," ask them "who wrote the spec those tests are validating against?" One of the highest-value individual coaching moments of the day.
- Every repeated pain across teams is a candidate for a better workshop-level template, check, or runbook — note it for post-workshop reflection, do not patch it live.

### Phase 8 — Follow-ups (added to cross-phase list)

1. **Independent verification reference in workshop skill.** Short doc explaining the self-validation trap and the "who wrote the done criteria" question. Pullable from the skill when teams want to go deeper. Extends the Phase 4 verification ladder follow-up.
2. **Scene reuse across phases — design question.** Can Scene 8.3 literally reference Scene 4.3, or must each phase have its own scene instances? If each phase needs its own, 8.3 is a duplicate with a separate ID and separate Czech translation.

## Phase 9 — Intermezzo 2 (14:30–14:50, 20 min — mid-point pause inside Build 2)

**Core model shift from Intermezzo 1:** This is **not** an end-of-work reflection. It is a mid-point pause inside Build 2. Teams stop, check in with the room, and go back to their repos for a second push. No "carrying home," no Monday callback, no closing framing. Those belong to Reveal.

### Final structure (3 scenes, ~18–20 min of content)

| # | Scene | Job | Time |
|---|---|---|---|
| 9.1 | Write before you speak | Individual silent retrieval | 3 min |
| 9.2 | Your team's check-in | Team discusses, one person records | 5 min |
| 9.3 | Back to the work | Facilitator reads check-ins, pulls the thread, sends teams back for the second push | 10–12 min |

### Changes from current agenda.json

- **Framed as a mid-point pause, not an endpoint.** Scene 9.3 is retitled from "continuation signals" to "Back to the work," and the emotional register is lowered across the board.
- **Retrieval question changed** to be anchored to the immediate work (first push) instead of the whole day. Matches the Intermezzo 1 question shape (surprise + try differently).
- **"Carrying home" / Monday / reveal-prep content removed** from all scenes. Those live in Phase 10 Reveal now.
- **Scene 9.2 is not the "final" check-in** — it is just another check-in on the team card. The team card will accumulate multiple entries through the day; 9.2 is one of them, not the last word.
- **Structure mirrors Phase 5 Intermezzo 1** — individual → team + record → room share + thread. Same rhythm the room already knows.

### Scene 9.1 — "Write before you speak" (LOCKED)

*Scene type: `checkpoint`, chromePreset: `minimal`*

**Hero:**
- *Eyebrow:* Intermezzo 2 · mid-point pause
- *Title:* **Write before you speak**
- *Body:* "Three minutes. Individual. No talking. Same rule as the first intermezzo — you produce before you share. This is a pause, not an ending. Write something you'd actually want to act on in the next forty minutes."

**Callout — The question:**
- *Tone:* info
- *Title:* The one question to write against.
- *Body:* "**What surprised you about the inherited repo so far — and what do you want to try differently in the second push?** Three minutes. Don't talk yet."

### Scene 9.2 — "Your team's check-in" (LOCKED)

*Scene type: `checkpoint`, chromePreset: `participant`*

**Hero:**
- *Eyebrow:* Intermezzo 2 · mid-point pause
- *Title:* **Your team's check-in**
- *Body:* "Five minutes at your table. Compare what you wrote. Then one person writes the team's check-in on your team card. Short, honest — two or three sentences is fine. Another entry in the story the card is telling."

**Steps:**
1. **Share what you wrote (3 min).** Go around the table. Read it out loud. No debate.
2. **Agree on the check-in (1 min).** What does your team want to try in the second push?
3. **One person writes it (1 min).** On the participant board, appended to the team card alongside the Intermezzo 1 check-in and the Build 2 first-beat diagnosis.

**Callout — Mid-point, not a last word:**
- *Tone:* info
- *Title:* This is one of several check-ins.
- *Body:* "The team card is accumulating a story. Intermezzo 1 check-in, rotation diagnosis, now this, and maybe more. Don't treat it like a final report. Treat it like a commit message — a small honest note about where your team is right now."

### Scene 9.3 — "Back to the work" (LOCKED)

*Scene type: `checkpoint`, chromePreset: `checkpoint`*

**Hero:**
- *Eyebrow:* Intermezzo 2 · back in two minutes
- *Title:* **Back to the work**
- *Body:* "Your check-ins are on screen. I'll read them, pull the thread, and send you back to your team with one thing to try in the second push."

**Steps:**
1. **Read the check-ins on screen.** Facilitator scrolls through each team's check-in and reads it aloud. Same rhythm as the first intermezzo.
2. **The thread.** Facilitator names the shared pattern across the first push — what teams are discovering about the inherited repo, where the friction is concentrated. Grounded in what is literally on screen.
3. **Back to work.** No extended reflection, no Monday callback, no closing framing. Closing line: *"Forty more minutes. Back to your teams."*

**Callout — What this beat is:**
- *Tone:* info
- *Title:* This is a pause, not an ending.
- *Body:* "Same rhythm as the first intermezzo — retrieve, share, move on. No carrying home yet. That is for later. Right now: what is working, what is not, and what you want to do in the next forty minutes."

### Phase 9 — Facilitator runner (keep internal)

- Same silent-retrieval discipline as Intermezzo 1. Individual writing must happen before social sharing.
- **Do not let Intermezzo 2 become a mini-Reveal.** Teams may naturally want to pivot to "and what I learned today was..." — redirect them to "right now, this afternoon, this repo, what's your next move?"
- **Watch for the emotional register creeping up.** This is a mid-point pause, not the day's climax. Keep the beat brisk. If the room wants to linger, don't let it — you need time for the second push and the Reveal both.
- **The thread should be actionable, not philosophical.** Examples of good threads: "Three teams independently wished for a better `AGENTS.md` section on error handling — that's probably the pattern to watch in the second push." Bad threads: "Everyone learned that context matters." The first gives teams something to do; the second is platitude.

### Phase 9 — Follow-ups (added to cross-phase list)

1. **Agenda schema decision — how Build 2's split is modeled in `agenda.json`.** Two options:
   - **(a)** Phase 8 Build Phase 2 runs 13:45–15:30, Phase 9 Intermezzo 2 is nested inside at 14:30–14:50. Requires phase-nesting support in the dashboard.
   - **(b)** Phase 8 splits into two sibling phases — "Build 2 · first push" (13:45–14:30) and "Build 2 · second push" (14:50–15:30) — with Phase 9 Intermezzo 2 sitting between them. Simpler schema, adds one phase to the day's count (10 → 11 phases).
   - **Recommendation: (b).** Each phase is one continuous block, no schema changes. Worth the extra phase count.
2. **Team card accumulates multiple check-ins.** By end of day, team cards should hold: Intermezzo 1 check-in (from original team) + Rotation diagnosis (from new team at Build 2 start) + Intermezzo 2 check-in (mid-Build 2) + whatever gets added at Reveal. The append-only log from the Phase 5 follow-up is load-bearing. Must be built.

## Phase 10 — Reveal (15:45 – ~16:45, ~60 min)

**Order of beats:** participants reflect first, then demo, then facilitator closes, then personal commitment, then gracious close. The reflection gives participants language; the demo shows what the language points at; the facilitator's observations land on ground already prepared; the commitment is the personal takeaway; the close honours the external facilitator's real role.

**No Monday framing.** The workshop runs on any day of the week; participants return to their own work the next day, not specifically Monday. Commitments are anchored to *"the next time I work with an agent,"* not to a calendar day. The facilitator is external and will not see participants again — the close acknowledges that reality.

### Final structure (5 scenes)

| # | Scene | Job | Time |
|---|---|---|---|
| 10.1 | Alone, pairs, fours, all | Full 1-2-4-All reflection (real 4-layer structure) | ~22 min |
| 10.2 | Show us what you built | Team demos (5 min each) framed by the reflection they just did | ~25 min (5 × 5 min) |
| 10.3 | What I saw today | Facilitator's closing observations, from outside the teams | ~6 min |
| 10.4 | The one thing you'll change | Personal commitment, four storage options, no Monday framing | ~6 min |
| 10.5 | Go use it | Gracious external-facilitator close | ~2 min |

**Total:** ~61 min. Reveal 15:45 → ~16:45. Day ends ~16:45.

### Changes from current agenda.json

- **Reordered.** Current agenda has 1-2-4-All → W3 → Monday commitment → participant board. New order: 1-2-4-All → team demos → facilitator observations → commitment → close. Reflection now precedes demos so participants have language before showing their work.
- **Team demos added** as Scene 10.2 — not in current agenda. Five minutes per team, not rushed.
- **"W3 closeout" scene removed.** Two named reflection frameworks in one phase (1-2-4-All + W3) is too much facilitation theatre. Replaced with a single unnamed reflection (10.1) and facilitator observations (10.3) that play the role W3 was trying to play.
- **Monday framing removed everywhere.** Hackathons run on any day of the week; "Monday" is artificial. Commitment anchored to "the next time I work with an agent."
- **Commitment storage revised.** Dropped the silly "commit message / main repo README" suggestions. Four real storage options (workshop skill, physical card, email to self, personal notes system) — participants pick one.
- **Close framing acknowledges external facilitator reality.** No "see you on Monday." The facilitator is external, won't see participants again.
- **1-2-4-All restored to its full structure.** Earlier draft skipped the "fours" step, which was wrong. Full structure with real time on every layer (3 + 4 + 5 + 10 min).
- **Facilitator observations moved to AFTER participant reflection.** Participants go first; facilitator's voice lands on ground already prepared.

### Scene 10.1 — "Alone, pairs, fours, all" (LOCKED)

*Scene type: `reflection`, chromePreset: `checkpoint`*

**Hero:**
- *Eyebrow:* Reflection
- *Title:* **Alone, pairs, fours, all**
- *Body:* "Four layers of reflection. Each one a little wider than the last. This is the most important twenty minutes of the day — do not rush it."

**Steps — full 1-2-4-All with real time:**
1. **Alone · 3 minutes.** Individual writing. What signal helped you continue after rotation? What was missing? What's the one thing from today you actually want in your own work next time?
2. **Pairs · 4 minutes.** Turn to one neighbor. Compare what you wrote. Find the one thing between the two of you that's most worth sharing.
3. **Fours · 5 minutes.** Two pairs become a four. Compare again. Find the signal, the gap, or the insight that the four of you think the whole room needs to hear.
4. **All · 10 minutes.** One thing per group of four, shared with the whole room. Brief. Specific. Honest. No summaries, no rankings.

**Callout — We're not ranking, we're pattern-finding:**
- *Tone:* info
- *Title:* This isn't about winners.
- *Body:* "We're looking for the signals that helped work survive handoff and the ones that still break under pressure. Every repeated pain across teams is a candidate for a better template, check, or runbook — not a team failure."

### Scene 10.2 — "Show us what you built" (LOCKED)

*Scene type: `reflection`, chromePreset: `participant`*

**Hero:**
- *Eyebrow:* Reveal
- *Title:* **Show us what you built**
- *Body:* "Each team has five minutes. You just spent twenty minutes articulating what you learned — now show us what carries it. Run the tracer. Walk the repo. Say the thing that surprised you most."

**Steps:**
1. **One team at a time, five minutes each.** Share your screen. Run what runs. Walk the repo. Point at something specific.
2. **Three beats for each demo (no script, just a shape):**
   - The running code or repo walk (most of the five minutes)
   - The single signal you wished had been in this repo when you arrived
   - The single thing you're proud of leaving behind
3. **No Q&A during demos.** Hold questions for after. Each team gets their five minutes clean.

**Callout — You already found the words:**
- *Tone:* info
- *Title:* The reflection did the work.
- *Body:* "You spent twenty minutes in the 1-2-4-All figuring out what you learned. The demo isn't about finding words — you already have them. It's about showing the thing the words point at."

### Scene 10.3 — "What I saw today" (LOCKED)

*Scene type: `reflection`, chromePreset: `minimal`*

**Hero:**
- *Eyebrow:* From outside the teams
- *Title:* **What I saw today**
- *Body:* "Now my part. I walked the room all day. I read every team's card as the afternoon moved. Here's what I saw from outside — the patterns, the surprises, the things everyone collectively figured out that maybe nobody felt individually."

**Facilitator's beat (not a block, a 5–8 minute live talk):**
- Two or three patterns the facilitator noticed across the day, with concrete evidence (pointing at specific team card entries, specific signals, specific decisions).
- One or two things that surprised the facilitator.
- The *craft* observation — what this specific group did well that maybe the facilitator does not see in every workshop.
- Grounded, specific, honest. Not a pep talk.

**Callout — The facilitator's discipline:**
- *Tone:* info
- *Title:* Evidence, not praise.
- *Body:* "The facilitator's observations should be grounded in what's on the team cards and what was just shared in the 1-2-4-All and the demos. Not general encouragement. Specific signals, specific surprises, specific patterns. If you can't point at it, don't say it."

### Scene 10.4 — "The one thing you'll change" (LOCKED)

*Scene type: `reflection`, chromePreset: `participant`*

**Hero:**
- *Eyebrow:* The commitment
- *Title:* **The one thing you'll change**
- *Body:* "One sentence. Specific enough that you could tell, a week from now, whether you actually did it. Write it first. Then pick where it lives."

**Steps:**
1. **Write the sentence (2 min).** Format: *"The next time I work with an agent, the first thing I'll change is [specific action] — because [specific reason from today]."* No vague language. No "I will try to..."
2. **Pick where it lives (1 min).** Somewhere you'll actually see it the next time you start a session. Options in the callout below.
3. **Say it out loud at your table (3 min).** One person at a time. No debate, no defense. Just read it.

**Callout — Pick a home for your sentence:**
- *Tone:* info
- *Title:* Four options — pick one.
- *Body:* "Pick whichever actually fits how you work: **(1) The workshop skill on your machine.** Use the skill's notes command to save your commitment. It lives with the skill you just practiced using, and it is waiting for you the next time you invoke it. **(2) A physical card.** We handed these out at the start of Reveal — write it down, take it home, stick it where you will see it. **(3) An email to yourself.** Send it now. It lands in your inbox tonight with today's context still fresh. **(4) Wherever you keep your own notes.** If you already have a journal, a task system, a personal wiki — use the system you already trust. Pick one. Do not pick none."

**Callout — Specific enough to check:**
- *Tone:* warning
- *Title:* Specific enough to check.
- *Body:* "Not: *'I'll work better with agents.'* Yes: *'The next time I start an agent task, I'll write Goal, Context, Constraints, and Done-When in AGENTS.md before typing anything into the prompt.'* If you can't tell a week from now whether you did it, the sentence isn't specific enough yet."

**Callout — The craft travels:**
- *Tone:* info
- *Title:* Tool-agnostic.
- *Body:* "Everything you practiced today works with any coding agent — Codex, Claude Code, Cursor, Copilot, whatever shows up next year. The repo matters. The verification matters. The handoff matters. The tool doesn't."

### Scene 10.5 — "Go use it" (LOCKED)

*Scene type: `transition`, chromePreset: `minimal`*

**Hero:**
- *Eyebrow:* End of day
- *Title:* **Go use it**
- *Body:* "This is where my part ends and yours continues. You built something today that a stranger continued without you — that was the test, and you passed. The craft you practiced is yours. The materials stay with you. I won't be in the room next time you open an agent session — but everything you need is already in your hands."

**Optional callout — Stay with the skill:**
- *Tone:* info
- *Title:* The follow-up package.
- *Body:* "The workshop skill and reference materials live with you after today. When you want to pull a pattern, a check, or a reminder, ask the skill. It knows what you learned because you were part of building it."

*(Keep this scene brief — 30–60 seconds of screen time. The facilitator's closing words are more important than what's on the slide.)*

### Phase 10 — Facilitator runner (keep internal)

- **Participants go first. You go after.** Do not summarize or theme the 1-2-4-All output before the teams have demoed. Your observations land only after the participants have surfaced their own and shown their work.
- **The "what I saw today" beat is the hardest one to get right.** You cannot wing it and you cannot pre-write it. You have to be genuinely present during the day and genuinely specific in the closing. If your observations are vague, the whole Reveal deflates. Prepare by reading the team cards during the pre-Reveal buffer, not by preparing generic closing remarks.
- **The commitment is the data.** The specific sentences people write are the best retrospective signal you will ever get. If you want to collect them (optional), the skill path is the least invasive — participants can opt in to contributing an anonymous copy. Never require collection.
- **Do not oversell the closing.** No "you're all amazing," no "this was life-changing." The craft is real, you practiced it, go use it. That is it. The room feels more, not less, when the closing undersells.
- **Scale consideration:** with 6+ teams, demos stretch past 30 min. Options: shorten to 4 min each (lowest friction), let Reveal run longer (most honest), or have only a subset demo with others sharing their biggest signal in the 1-2-4-All "all" step (tightest). Decide based on room size before Reveal starts.

### Phase 10 — Follow-ups (added to cross-phase list)

1. **Build `workshop commitment` skill command.** Stores personal commitment locally in the skill, reminds the participant next time they invoke it, optionally pushes an anonymous copy to a shared workshop notes channel if the participant opts in. High-value follow-up that turns the commitment into a living part of the craft.
2. **Source physical commitment cards.** Facilitator prep checklist item. Print / source ~30 cards per workshop with a "my commitment" prompt. Hand out at the start of Reveal so people have them ready when they hit Scene 10.4.
3. **Team card trail rendering on presenter view** — already flagged in Phase 5 and Phase 9 follow-ups. Reused in Scene 10.3 as evidence when the facilitator names patterns. Build once, reuse across three phases.
4. **Day schedule update in Phase 1 Scene 1.3** — day now ends ~16:45 with the extended Build 2 split and full Reveal.
5. **Screen sharing from participant laptops to big screen** — Scene 10.2 needs reliable screen sharing so teams can demo. Confirm this works on the presenter tool before the first workshop.

---

# Final consolidation — everything needed before the first workshop runs

This section consolidates every follow-up scattered through the 10 phases and the brief review. It is the "before-the-first-workshop" punch list. Items are grouped by type and roughly prioritized within each group.

## 1. Required engineering build items

Sorted by dependency order and impact. Items with ⚠ are blockers for running the workshop as designed; items without are high-value but the workshop could run without them (with degraded experience).

### Harness CLI

1. ⚠ **`harness demo-setup` command.** Scaffolds Folder A (bare — brief only) and Folder B (harnessed — brief + `AGENTS.md` with Goal/Context/Constraints/Done-When + short plan + workshop skill installed). Facilitator runs it before the workshop. Without this, Scene 3.1's contrast demo is fragile prep work. Naming to be resolved against existing `harness-cli` conventions.
2. **Rotation algorithm is not a CLI or dashboard feature.** Confirmed resolved — the in-room scatter count-off (Phase 7) replaces any computed algorithm. No build required. Listed here only to explicitly close the loop.

### Workshop skill

1. ⚠ **`workshop briefs` (plural) command.** Lists all available project briefs so teams can pick one in Scene 3.4. Current skill has singular `workshop brief` (show the assigned brief); add a sibling that enumerates. Without this, Scene 3.4 step 3 has to fall back to "facilitator reads the briefs aloud" which slows the opening of Build 1.
2. **`workshop commitment` command.** Stores the participant's Scene 10.4 commitment sentence locally in the skill. Reminds the participant next time they invoke the skill. Optional anonymous push to a shared workshop notes channel if the participant opts in. High-value: turns the commitment into a living part of the craft instead of a sticky note.
3. **Verification ladder reference doc in `workshop-skill/reference.md`.** Pullable reference content on tracer bullets, end-to-end tests, automated reviews, and the "holistic beats granular" principle. Also covers the self-validation trap from Phase 8 (who wrote the checks, why agent-generated tests validate the agent's interpretation not your spec). Teams who want to go deeper during Build 1 or Build 2 can ask the skill for it.

### Dashboard

1. ⚠ **Team card append-only check-in log.** The team card must support multiple appended entries, not a single overwritable status field. Each entry tagged with the phase it was written in. Required entries across the day: Intermezzo 1 check-in (Phase 5), Rotation diagnosis (Phase 7/8 first-beat), Intermezzo 2 check-in (Phase 9), optionally team composition updates at rotation. Without this, the whole "the repo remembers" narrative collapses — each intermezzo would overwrite the last.
2. ⚠ **Participant-editable team card.** Team members (not just facilitator admin) must be able to edit the check-in field from the `/participant` page. Currently the team card has a "checkpoint/sprint status (free-text)" field — need to confirm participant-side editing works, or build it.
3. **Presenter view — team card trail rendering.** Scene 5.3, 9.3, and 10.3 all need a presenter chrome that can scroll through a team's full check-in trail on the big screen. Same rendering requirement in three phases — build once. Probably needs a new `chromePreset` value (e.g., `team-trail` or `reflection`).
4. **Editable `[return-time]` variable on Scene 6.1 (Lunch).** Facilitator sets/updates the lunch return time live from admin, scene renders current value. Small change.
5. **Screen sharing from participant laptops to the big screen.** Scene 10.2 team demos need reliable screen sharing. Likely already supported by the presenter tool — confirm before the first workshop.
6. **Agenda schema: Build 2 split modeling.** Either (a) Phase 8 spans 13:45–15:30 with Phase 9 nested inside at 14:30–14:50, or (b) Phase 8 splits into two sibling phases with Phase 9 between them. Recommendation from Phase 9: option (b) — simpler schema, adds one phase to the day's count. Need to decide and implement.
7. **Per-participant commitment collection (optional).** Scene 10.4 option (1) stores commitments in the skill locally. If you want facilitator-visible aggregation, the participant can opt in to push an anonymous copy to a shared notes channel on the dashboard. Lower priority — the workshop works without it.

### Content infrastructure

1. ⚠ **Reconcile `agenda.json` `.inventory.briefs[]` with the markdown briefs.** Current inventory is a flattened subset of the richer markdown files. Decide: generate inventory from markdown as a build step (recommended — markdown is canonical per the localization plan), or maintain both in sync manually. Without reconciliation, teams see different brief content depending on which surface they're reading from.
2. ⚠ **Register `doc-generator` in `agenda.json` `.inventory.briefs[]`.** The markdown file exists but is orphaned from the inventory. Register as the 5th brief with full bilingual structured entry.
3. **Write full English versions of talk source files.** `content/talks/locales/en/context-is-king.md` and `content/talks/locales/en/codex-demo-script.md` are 7-line stubs pointing at the Czech roots. Four "English stub" files total under `content/talks/locales/en/`. English is canonical per the localization plan, so these are gaps.
4. **Regenerate Czech translations after revisions.** Phase 2 Scene 2.1–2.5 heroes/bodies/callouts, Phase 3 scenes, Phase 4 Scene 4.2, all 5 brief revisions, Scene 1.1 framing hero and callouts. Czech content should be retranslated from the new canonical English after revisions are applied.

## 2. Required content touchups to locked phases

These are small edits to scenes already in locked phases. Each one is a one-line or one-section change, not a full scene rewrite.

1. **Phase 1 Scene 1.3 "Day schedule."** Update times to reflect the new afternoon structure: Build 2 split at 14:30, Intermezzo 2 14:30–14:50, Build 2 resumes 14:50–15:30, Pre-Reveal buffer 15:30–15:45, Reveal 15:45–~16:45. Add a line that times are guides, not deadlines (especially lunch, which is negotiable on the day).
2. **Phase 1 Scene 1.4 "Experience line + team formation."** Add a 4th beat to the steps block — "claim your team's anchor" (a Lego brick, numbered card, marker, or whatever teams grab). The anchor is the physical marker the team and repo are bound to for the rest of the day. Inserted between "pick your team name" and "record it live."
3. **Phase 1 Scene 1.1 framing** — apply the locked new hero ("Today you learn to shape the work so anyone — or any agent — can carry it") plus the three new callouts ("The main line for today," "What should change today," optional "The craft underneath"). Cut "prompt theatre" language wherever it appears. Cut one of the redundant "not a contest" lines between 1.1 and 1.2.
4. **Phase 2 Scene 2.3 Pillar 3 (Sensors).** Already updated in the brainstorm doc — tracer bullets, end-to-end tests, automated reviews, holistic vs. granular. Apply to `agenda.json`.
5. **Phase 5 Scene 5.1 retrieval question update.** Replace the current "what would the next team need to find" with the new Option A: *"What surprised you about working with the agent this morning — and what does that make you want to try differently next?"*
6. **Phase 6 phase name rename.** "Lunch and handoff prep" → "Lunch." Remove all handoff-telegraphing language from the participant-visible scenes (both old scenes are cut entirely).
7. **Phase 7 rename check.** Keep "Rotation" as phase name; Scene 7.1 title "Your repo is not yours anymore" carries the drama.
8. **Phase 2 phase name.** "Context is King" → "The Craft Underneath."
9. **Phase 3 phase name.** "Codex demo" → "Let me show you."
10. **Cut scenes.** Current `agenda.json` scenes to delete as part of applying the review:
    - Phase 1: `opening-context-analogy` (Lego duck) and `opening-participant-view` (participant board as its own scene)
    - Phase 2: `talk-micro-exercise` (moved to Phase 3), `talk-participant-view` (moved to Phase 4 Build 1 opening)
    - Phase 3: `demo-participant-view` (content folded into new scenes)
    - Phase 4: old `build-1-participant-view` (folded into new Scene 4.2)
    - Phase 5: old `intermezzo-1-participant-view` (folded)
    - Phase 6: both current scenes (lunch-reset content telegraphs rotation)
    - Phase 7: old `rotation-participant-view` (folded into new scenes)
    - Phase 8: old `build-2-participant-view` (folded)
    - Phase 9: old `intermezzo-2-participant-view` (folded)
    - Phase 10: old `reveal-w3` and old `reveal-participant-view` (folded/removed)

## 3. Brief content revisions

All 5 briefs need the medium-depth revisions documented in the Brief Content Review interlude. For each brief:

1. Apply the revised problem statement.
2. Promote the handoff test to Done-when criterion #1 with explicit *(Handoff test.)* label.
3. Apply the tightened first-agent prompt.
4. Leave user stories and architecture notes as-is.
5. Do **not** add "Not in scope" sections — ambition is welcome, the harness-first ordering does the focusing.
6. Register `doc-generator` in the inventory (separate engineering item above).
7. Regenerate Czech translations from the revised English.

## 4. Physical props and facilitator prep

Items the facilitator physically sources/prepares before each workshop.

1. **Anchors.** One per team + 1 spare. Any tactile object that marks a team's position. Recommendation: small Lego bricks in different colors, or numbered cards that double as anchors. Cheap to source in bulk.
2. **Number cards for rotation.** Printed 1 through max team size (e.g., 1–6 if teams are 4–6 people). Placed next to each anchor at rotation time. Each card marks "this is where number X people go."
3. **Commitment cards.** Physical cards (~30 per workshop) with a "my commitment" prompt, for Scene 10.4 option (2). Low-cost, high-value backup for participants who prefer paper over digital.
4. **Pre-workshop technical checklist:**
   - Run `harness demo-setup` to scaffold Folder A and Folder B for Phase 3 Scene 3.1 contrast demo.
   - Test-install the workshop skill on the facilitator's machine (for Phase 3 Scene 3.3 live install demo).
   - Record the Scene 3.3 pre-recorded fallback video (30-second install walkthrough) in case the live install breaks.
   - Pull up the 4 project briefs and confirm they render correctly in both the dashboard admin view and the participant board.
   - Confirm each team anchor + number card assignment is laid out in the room before participants arrive.
5. **Facilitator reading material:**
   - Phase 2 "The Craft Underneath" sources — Lopopolo OpenAI post, Böckeler Fowler blog post, Guo Artificial Ignorance post, Willison 2026 predictions, Anthropic Glasswing announcement. Links in the Phase 2 section. Read fresh in the week before each workshop — the landscape moves fast and these references will go stale.
   - `workshop-blueprint/operator-guide.md` — the "lunch gate walk" section (to be added as a follow-up) and the general coaching discipline.

## 5. Cross-phase risks to watch during the day

Things that can go wrong and the phase they affect. Facilitator should have these in mind.

1. **Opening slips into rules before ambition.** Phase 1 risk. The opening has to earn attention with the promise before it delivers logistics. If it feels like an operating memo, the rest of the day plays catch-up.
2. **Talk density.** Phase 2 Scene 2.1 carries five named voices plus two callouts. Facilitator needs deliberate pauses between names or it becomes a parade. If the room is fatigued, the Forrester/Gartner callout is the first thing to cut.
3. **Scene 3.1 live demo fragility.** The contrast demo can drag or break. Pre-prepared screenshots of both Folder A drift and Folder B aligned output must be ready on a second screen. Watch live generation time — if it exceeds ~90 sec, switch to screenshots mid-demo.
4. **Scene 3.3 live install fragility.** Even with a pre-recorded fallback, a live install failure is a tone-killer. Test the install fresh on the facilitator's machine the morning of. Have the video cued and ready to play in under 10 seconds.
5. **Team formation slip.** Phase 1 Scene 1.4. If teams aren't forming within 4 minutes, facilitator starts assigning manually. Don't let shyness burn the opening buffer.
6. **`AGENTS.md` warehouse drift.** Phases 4 and 8. Teams may dump everything into `AGENTS.md` and lose the "map not warehouse" discipline. Facilitator's coaching focus throughout both builds. When you see a 500-line `AGENTS.md`, the team needs help splitting it.
7. **Self-validation trap.** Phase 8. Teams will write code and tests in the same agent task and think they're verified. Facilitator's most valuable individual-coaching moment — watch for it, name it when you see it.
8. **Intermezzo 1 silent phase breaking.** Phase 5 Scene 5.1. If someone talks during the 3 min silent retrieval, redirect immediately. The benefit depends on production-before-sharing.
9. **Intermezzo 2 emotional register creep.** Phase 9. Teams may want to wrap up the day early in Intermezzo 2 ("here's what I learned today"). Keep it tight — this is a mid-point pause, not a preview of Reveal. Redirect: "what are you going to try in the next 40 minutes?"
10. **Rotation silence violated.** Phase 7. Original team members may instinctively help the new team inheriting their repo. Facilitator enforces silence gently but firmly. The silence IS the test.
11. **"The original team does not speak for their repo."** Same as above, worth naming twice.
12. **Reveal demos running long.** Phase 10 Scene 10.2. With 6+ teams, 5 min each pushes demos past 30 min. Either accept that Reveal stretches, or shorten demos to 4 min each before starting. Decide before 10.2 starts, not during.
13. **Facilitator's Scene 10.3 observations falling flat.** Hardest beat in the day. Prepare during the pre-Reveal buffer (15:30–15:45) by reading team cards. Specific evidence or don't say it.
14. **Reveal closing oversell.** Phase 10 Scene 10.5. The room feels more when the close undersells. No pep talks.
15. **Dashboard failure cascades.** Many scenes depend on the team card, the presenter view, the participant board. Have a mental model of which scenes degrade to "verbal only" if the dashboard is down. Scene 4.2 timeline, Scene 7.2 anchor count-off, and Scene 10.1 1-2-4-All all work without the dashboard. Scene 5.3, 9.3, and 10.3 depend on team card rendering and will need a verbal fallback.

## 6. Open decisions — what we parked

Things we decided not to decide during the review. Should be resolved before the first workshop, but they're not blockers for applying the content changes.

1. **Rotation algorithm choice.** Parked and then resolved by the scatter count-off physical mechanic (Phase 7). The algorithm is the count-off itself; no dashboard choice needed. Resolved.
2. **Brief emphasis labels in `workshop briefs` listing.** Should the skill tag briefs as *architecture-focused* (DevToolbox, Standup Bot, Metrics Dashboard) vs. *epistemics-focused* (Code Review Helper, Doc Generator) to help teams pick with intent? Parked. Only implement if the listing command is built and the split feels useful in practice.
3. **Team demos in Reveal: all teams vs. subset for larger rooms.** Deferred to facilitator's discretion at the moment, decided based on room size before Scene 10.2 starts.
4. **Commitment collection: local-only or shared opt-in.** Build the `workshop commitment` skill command with local-only storage as primary; add opt-in anonymous push as a later feature if facilitators ask for retrospective data.
5. **Anchor choice per venue.** Lego bricks are recommended but not required. Facilitator can source whatever works for the specific venue — numbered cards, rubber ducks, coasters. Decide per workshop.
6. **Phase 9 and Build 2 schema** — option (a) nested vs. option (b) split into sibling phases. Engineering decision, recommended (b). Flagged for the dashboard team.

## 7. Narrative continuity checks

These are threads that run across multiple phases. They should land consistently or the day feels disjointed.

1. **"Build the room the agent walks into" / "Craft underneath the hype."** Phase 1 framing hero → Phase 2 phase name "The Craft Underneath" → Phase 10 Scene 10.5 "This is where my part ends and yours continues." Three distinct moments using the same frame. If the hero changes, the phase name and the closing must change with it.
2. **"Humans steer. Agents execute."** Phase 2 Scene 2.4 as the core line → Phase 10 Scene 10.3 optional reference. The Lopopolo quote is the single most memorable line in the whole workshop. Protect it.
3. **"Every fresh agent session is a rotation."** Phase 2 Scene 2.4 and Phase 7 Scene 7.3 both carry this. Phase 7 is where it lands most powerfully because teams are physically experiencing the rotation. If Phase 7 doesn't land it, the rest of the day's "this is practice for Monday" feeling weakens.
4. **Tracer bullets.** Introduced in Phase 2 Scene 2.3 Pillar 3 (Sensors), taught in Phase 3 Scene 3.2 (demo workflow), practiced in Phase 4 Scene 4.2 (Build 1 timeline), revisited in Phase 8 Scene 8.2 (Build 2 timeline) and the self-validation trap callout. Four distinct touches. The term should be used consistently.
5. **"Frustration is data."** Phase 7 Scene 7.3 callout. This is what turns the rotation from a gotcha into a learning moment. If it doesn't land in Phase 7, teams may take the inherited-repo confusion personally.
6. **The team card as a living artifact.** Phase 5 → Phase 7 (rotation diagnosis) → Phase 9 → Phase 10 Scene 10.3 (facilitator reads the trail). The card accumulates the day's story. If the check-in infrastructure fails or gets overwritten, the Reveal's "what I saw today" beat has no evidence to point at.
7. **The opening promise → the closing commitment.** Phase 1 framing hero promises "the next reader can continue your work" → Phase 10 Scene 10.4 commitment is the personal version of that promise. Not a Monday callback anymore (because no Monday), but a craft callback: *the thing you promised you'd build, you are now committing to actually do next time.*

## 8. What to do after the review

Once these edits are approved:

1. **Apply all content changes to `agenda.json`.** Phase-by-phase, starting with the phase names, then the scene-level changes. Both `en` and `cs` sides; English first, Czech regenerated after.
2. **Apply brief revisions** to the markdown files in `content/project-briefs/locales/en/`. Regenerate the `agenda.json` inventory from the markdowns.
3. **Build the required engineering items** (Section 1) — in dependency order, blockers first.
4. **Update operator/facilitator guides** with the silent gate practice, the coaching lines, the risks list, and the pre-workshop checklist.
5. **Run a dry run** with a test cohort (ideally internal, maybe 4–6 people as teams of 2) to catch anything the review missed.
6. **Schedule the first real workshop** only after the dry run surfaces no blockers.

---

*Brainstorm doc complete. This document captured a full walkthrough of all 10 phases, the brief review interlude, and the final consolidation. Decisions and revisions are locked at the brainstorm level; actual `agenda.json` edits, markdown edits, and engineering builds are the next step.*
