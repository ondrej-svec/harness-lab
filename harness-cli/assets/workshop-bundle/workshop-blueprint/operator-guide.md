# Workshop Operator Guide

This guide explains how a facilitator runs a workshop instance without confusing reusable blueprint design with live runtime control.

## Facilitator Job

The facilitator owns:

- preparing a private workshop instance
- verifying participant access and facilitator auth
- steering the agenda through the day
- capturing team progress and live signals
- protecting the boundary between public blueprint and private event state

The facilitator does not use the live dashboard to silently rewrite the reusable workshop method.

## Before The Day

1. Start from the public blueprint in [`README.md`](README.md).
2. Create or prepare a private workshop instance by importing the blueprint.
3. Attach instance-local metadata outside the public repo:
   - real date
   - venue and room
   - participant event code configuration
   - facilitator grants
   - facilitator-only notes
4. Verify participant and facilitator access paths.
5. Verify the active instance begins from the expected blueprint version/reference.
6. Work through the pre-workshop facilitator checklist below before you leave home for the venue.

### Pre-workshop facilitator checklist

Run this the day before or the morning of. Each item either ships a
fallback for a brittle live moment or sets up a physical prop the day
depends on.

- [ ] **Run `harness demo-setup`** to scaffold Folder A (bare repo, brief only) and Folder B (harnessed repo, AGENTS.md + plan + seed data + workshop skill). This is the Phase 3 Scene 3.1 contrast demo. Test both folders by running the same small prompt in each and watching Folder A drift while Folder B holds.
- [ ] **Test-install the workshop skill** on the facilitator's machine fresh that morning, using `harness skill install`. This is the Phase 3 Scene 3.3 live install demo. If it fails live, the tone of the whole demo suffers.
- [ ] **Record (or re-verify) the 30-second pre-recorded fallback video** of the skill install, cued and ready to play in under 10 seconds if the live install breaks.
- [ ] **Pre-install the workshop skill in each participant repo** where possible (`harness skill install`). This avoids repeated install instructions during the talk and demo. If pre-install is not possible, Phase 3 Scene 3.4 walks teams through the install as step 2 of the first ten minutes.
- [ ] **Pull up every project brief** in the admin dashboard view and the participant board view to confirm they render. If a brief is missing or broken, the team that would have picked it has no starting material.
- [ ] **Lay out physical props in the room** before participants arrive — one anchor per team plus one spare, number cards printed 1 through the maximum team size, commitment cards (about 30) in a small stack near the facilitator's spot for the Reveal.
- [ ] **Re-read Phase 2 sources** (see E5 below). The landscape moves fast and stale references undercut the talk's credibility.
- [ ] **Sketch the rotation count-off on paper** for the specific room size you're running. If the room is 20+ participants, decide whether to run the scatter count-off live or pre-assign during lunch on a whiteboard (see "Rotation count-off protocol" below).
- [ ] **Read the team cards during the pre-Reveal buffer** (15:30–15:45). Scene 10.3 "What I saw today" depends on specific evidence from team cards; generic closing remarks deflate the whole Reveal.

### Physical props for the day

- **Team anchors** — one per team plus one spare. Any tactile object that marks a team's table for the whole day: Lego bricks in different colors, numbered cards, rubber ducks, coasters. Teams claim an anchor during Phase 1 team formation and the anchor stays at the table through rotation. The team, the repo, and the day's check-ins live with the anchor, not with the people.
- **Number cards for rotation** — printed 1 through the maximum team size (for 4–6 person teams print 1 through 6). Placed next to each anchor at rotation time. Each card tells the count-off which anchor the `N`s walk to.
- **Commitment cards** — about 30 small cards with a "my commitment" prompt, handed out at the start of Reveal for Scene 10.4 storage option (2). Low-cost, high-value backup for participants who prefer paper over digital.

## During The Day

Operate the live instance through the shared runtime control surfaces:

- dashboard facilitator surface for fast visual control
- facilitator skill for AI-assisted operations
- `harness` CLI for privileged auth bootstrap and local secure credential/session handling

Facilitation priority order:

1. keep the next safe move obvious
2. push teams to encode context in the repo instead of explaining it orally
3. ask for executable verification before encouraging more autonomy
4. treat continuation friction as a signal to improve the harness, not as a participant failure

Typical runtime-only actions:

- move the current phase
- reveal or hide the continuation shift
- register teams and repo URLs
- update checkpoints and sprint notes
- archive or reset the instance

These actions affect only the active workshop instance unless a facilitator deliberately makes a repo edit afterward.

## During Lunch — The Silent Gate

Lunch is not just a break. The facilitator uses it to walk each team's
repo quietly and check whether the morning's work actually encoded
something another team could continue from. This is harness
engineering applied to the workshop itself — the facilitator is a
sensor, the intervention is a guide, the whole mechanism is invisible
to participants.

**Timing.** Eat first. Do not walk repos while people are still at
the tables with their laptops — it feels surveillance-y and undoes
the trust the morning built. Once most participants are out of the
room, start walking.

**What to look for.** Against the four baseline items from Build 1
Scene 4.2:

- `AGENTS.md` exists and reads as a map (short, with pointers), not a
  warehouse (everything dumped into one file).
- A plan exists somewhere — its own file, a section in `AGENTS.md`,
  or in the README. Short and followable.
- A working slice with its tracer — one bounded piece of code plus the
  end-to-end path that proves it runs.
- A next-move note — what to do next, in the repo, not in participant
  heads.

**Do not grade.** This is a safety check, not an evaluation. Most
repos will be fine. The job is to flag only the genuinely broken ones:
no `AGENTS.md` at all, no commits, completely unusable state that
would make the receiving team's rotation experience pointless.

**Intervene quietly, after lunch.** If a team's repo is genuinely
broken, find one team member when they return and offer to help them
capture the minimum before rotation. Frame it as help with what they
were already doing — "I saw you were making good progress, let me
help you capture it so the afternoon is easier." Never frame it as a
gate or a failure. The team should not know this is a check.

**How often this should happen.** No more than one or two quiet
interventions per workshop. If half the room needs help, the
intermezzo was weak or Build 1 was under-timed. Learn from that for
the next cohort; do not patch it live during lunch.

**Why this works.** The facilitator's walk is a sensor for broken
repos. The quiet post-lunch intervention is a guide (feedforward
correction). The whole thing is invisible to participants. The
workshop practices what it teaches, at the level of its own
operations.

## Rotation count-off protocol

Phase 7 rotates teams via a physical scatter count-off. No dashboard
feature, no computed algorithm — the in-room count-off replaces
everything that might have been a dashboard rotation algorithm.

**What the scenes say on screen.** Phase 7 has three scenes: 7.1
"Your repo is not yours anymore" (the reveal), 7.2 "Line up, count
off, walk to the anchor" (the mechanic), 7.3 "Every fresh agent
session is a rotation" (the lesson). Scene 7.2 is the one you drive
with your voice.

**The mechanic, step by step.**

1. Call everyone to stand at their original team's anchor with their
   laptop. This is the same shape as Phase 1 team formation and the
   room recognizes the pattern.
2. Announce the target: "Everyone with the same number will form a
   new team together."
3. Count off down each original team — one, two, three, four, five.
   Each person remembers their number.
4. When you say "go", all the 1s walk to Anchor 1, all the 2s walk to
   Anchor 2, and so on. The repo, the Intermezzo 1 check-in, and the
   team name are already waiting at the anchor.
5. New teams introduce themselves at the anchor: name, one thing they
   care about, one thing they're bringing from the old team, one
   thing they want to know about the new repo.

**Why it works mathematically.** Counting off one through N within
each original team and then regrouping by number guarantees at most
one person from each original team lands in each new team. Every new
team is a mix of all original teams. Zero dashboard computation
needed.

**Uneven team sizes.** If the original teams have different sizes
(say 5, 5, 4, 4), the larger teams' highest numbers have no match.
Either collapse them into the largest new team, or redistribute the
leftovers with one sentence of facilitator discretion: "The 5s join
the 1s' anchor." Do not over-explain; the room follows the voice.

**Silence during the walk.** The one rule that is worth enforcing
gently but firmly: the original team members do not help the incoming
team. The incoming team must read the repo cold. If old-team members
catch a new arrival's eye, smile and point at the repo. The silence
is part of the test — it is what an agent session actually feels like
when the agent arrives without your memory.

**When the room is too big for a live count-off.** At 20+ participants
in a noisy room, the live count-off can take too long or get chaotic.
Contingency: pre-assign new teams on a whiteboard during lunch, in
the same count-off shape, and just announce the assignments when
Phase 7 starts. The pedagogical point (silence during the walk, no
verbal handoff) still holds. Decide before the day starts, not during
Phase 7.

## During Rotation

The continuation shift is the pedagogical centerpiece of the day. Its learning value depends on what was handed off.

**Before rotation begins:**
- Check the pre-rotation handoff gate (see `day-structure.md`): each team needs a readable AGENTS.md, one executable verification step, and a written next safe step.
- If a team does not meet the gate, intervene to help them write the minimum. This is not punishment — it ensures the receiving team gets a signal worth diagnosing.

**During rotation:**
- Watch for teams that jump to editing before reading. Redirect them to the "required first move" (write what helped, what's missing, what's risky, next safe step).
- Let productive friction stand. The receiving team's frustration at missing context is the lesson — do not resolve it for them.
- Intervene when frustration becomes unproductive — when teams are stuck on setup, permissions, or broken tooling rather than on repo quality. That friction does not teach anything.

**Capturing signals:**
- Use the `HandoffMomentCard` capture panel on the facilitator dashboard during or immediately after the rotation phase.
- Use the suggested seed tags (`missing_runbook`, `no_test_evidence`, `next_step_not_obvious`, `constraint_only_in_chat`, `drift_not_caught`) or add your own.
- These signals feed the cross-cohort learnings log. Even one captured signal per team is valuable.

## After The Day

1. Archive the workshop instance.
2. Capture runtime learnings that may improve the reusable workshop method.
3. Decide which learnings are:
   - runtime-only notes that stay private
   - reusable improvements that belong back in the public blueprint
4. Publish reusable improvements through a normal GitHub edit or pull request.

## Golden Rule

If a change should help the next workshop by default, it belongs in the blueprint and must be committed deliberately.

If a change only helps the current live event, it belongs in the runtime instance and must not auto-promote back into the repo.

## Phase 2 Freshness — a recurring task

Phase 2 "The Craft Underneath" rides on specific named voices and
published articles: Lopopolo at OpenAI, Böckeler on Martin Fowler's
site, Guo at Artificial Ignorance, Willison's predictions post,
Hashimoto via Guo, Stripe Minions, Anthropic Glasswing. That list
was current in April 2026 and will age.

Before each workshop — at least the week before, ideally a few days
out — re-read the sources and check that the claims still hold:

- [OpenAI — Harness Engineering with Codex](https://openai.com/index/harness-engineering/)
- [Ryan Lopopolo on Latent Space](https://www.latent.space/p/harness-eng)
- [InfoQ coverage of the OpenAI harness engineering announcement](https://www.infoq.com/news/2026/02/openai-harness-engineering-codex/)
- [Birgitta Böckeler — Harness engineering for coding agent users on martinfowler.com](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html)
- [Charlie Guo — The Emerging Harness Engineering Playbook](https://www.ignorance.ai/p/the-emerging-harness-engineering)
- [Simon Willison — LLM predictions for 2026](https://simonwillison.net/2026/Jan/8/llm-predictions-for-2026/)
- [Anthropic — Project Glasswing announcement](https://www.anthropic.com/glasswing)

If any of those have been retracted, superseded, or fundamentally
contradicted by newer work, update the agenda Scene 2.1 steps and
callouts before the next cohort. Stale references undercut the talk's
credibility — teams in the room know the space and will notice. A
one-hour refresh in the week before each workshop is cheaper than
rewriting the phase during the day.

This task lives in the facilitator pre-workshop checklist above
(item: "Re-read Phase 2 sources") so it is not forgotten.

## What To Keep Reinforcing

- `AGENTS.md` should stay short and point outward to deeper sources of truth.
- The repo should contain plan, commands, verification evidence, and the next safe step.
- When a repeated issue appears across tables, turn it into a stronger template, challenge, reference card, or check.
