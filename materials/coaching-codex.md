# Coaching Codex — the pocket card

> One page. Steal the moves. Print it if you want.

The workshop teaches harness engineering: the repo, workflow, and context that **carry the next move** without you standing over it. This card is the inside-the-session half — the moves that keep the agent inside a working harness once a session starts. The talk and the briefs build the guides the agent reads. This card is what you say when the agent is already in motion and something's about to slip.

---

## The meta-skill: three questions that reset anything

These three questions work in any situation — before code, during work, when stuck, when you disagree. The protocols below are specific applications.

When you feel the session going sideways, stop and ask these out loud, to yourself first:

1. **What are we trying to prove right now?**
2. **Which repo artifact is missing that would have prevented this?**
3. **What is the smallest check that returns this work from confidence back to reality?**

If you can't answer any of the three, the session is done. Close it. Come back when you can.

---

## Before you let the agent write code

Ask these, in this order. Do not skip ahead.

1. **"Before you implement, read [file X] and state the three patterns you're going to reuse."**
   Catches misreading in 30 seconds. Costs nothing.

2. **"What's the smallest change that could prove this approach works?"**
   Forces a tracer bullet — a thin end-to-end slice that proves the whole thing works — instead of a spec rewrite. Holistic over granular: you want the slice that demonstrates the next move, not a unit test on a single function.

3. **"What's the done criteria — a command I can run or a file I can look at — that tells us this is finished?"**
   If the agent can't name one, neither of you knows what "done" means. Stop.

4. **"What could go wrong? Name one failure mode I haven't told you about."**
   This is the single best drift detector. If the agent says "nothing", treat that as a yellow flag and push back.

5. **"Show me the plan as three steps. Not the code. The plan."**
   Cheap to redirect a plan. Expensive to redirect 300 lines of code.

---

## While the agent is working

This is where you catch **task drift** — the failure mode where the agent makes plausible but wrong decisions because your constraints ran out. Name it out loud when you see it. The fix is never a better prompt; the fix is a missing guide.

- **If it starts implementing before answering the five questions above, stop it.** The session is drifting. Go back to the plan.
- **If it says "I've completed the task", ask: "What did you verify?"** Not "did the tests pass" — "what did you verify". Force it to name the evidence, not the feeling.
- **If it adds a file you didn't ask for, ask "why this file?" before accepting.** Extra files are the first sign of improvisation.
- **If it tries to weaken a constraint ("we could skip this test"), refuse and re-read the constraint aloud.** Constraints you negotiate down always come back.

---

## When the agent says it's done

This is your **sensor** moment — the feedback loop that catches the agent after it acts. Verification is the trust boundary. When the agent does more, you verify better — and you verify holistically. Run this short script, always:

1. **"Show me the diff."** Read it. If you don't want to read it, the agent isn't done — you are.
2. **"What test covers the change?"** If none, the change isn't covered. That's not a moral judgment; it's a statement about tomorrow's bug.
3. **"What could the next team misread about this?"** This is your handoff check. The agent's answer is where your next `AGENTS.md` update comes from.
4. **"What is the next safe step if we continue from here?"** If the answer is "I'm not sure", you haven't left a harness; you've left debris.
5. **Write a session-state note.** What was proved, what's in progress, what's the next safe action. This is not AGENTS.md (that's the map). This is the progress log.

---

## When you disagree with the agent

- **Don't argue.** Arguing with an agent in a session is a sign the harness is missing. Exit the chat, strengthen the repo, re-enter.
- **Name the disagreement as a rule.** "We don't use `any` in this repo" is a rule. Write it down. Move it into `AGENTS.md`. Don't re-type it next session.
- **Ask: "Which file in the repo should have prevented this?"** The answer is usually a doc that doesn't exist yet. Create it.

---

## The one rule to remember

**You are not prompting the agent. You are coaching a collaborator that forgets everything between sessions.** The only memory you share is the repo. Act accordingly.

If it is not in the repo, it does not exist.

## The four words

> **Humans steer. Agents execute.**

The next day you open a coding agent, you'll work differently. Not with a new tool. With a different role. You stop being the person the agent asks questions of, and you start being the person who builds the room it walks into. Everything on this card is a move toward that role.

---

*Pairs with [`content/codex-craft.md`](../content/codex-craft.md) — the tool-specific fluency doc — and with the workshop talk [`content/talks/context-is-king.md`](../content/talks/context-is-king.md).*
