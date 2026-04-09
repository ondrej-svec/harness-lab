# Codex Craft

> Tool-specific fluency to sit on top of the agent-agnostic harness method.

Harness Lab teaches a method that transfers across coding agents: Codex, pi, Claude Code, Cursor, Aider. The method is agent-agnostic by design. This document is the other half: the **Codex-specific craft** that the method assumes you already know, but that nobody teaches you in order.

If something in this doc contradicts the live Codex documentation, trust the live docs. This doc is a teaching artifact, not a specification. Last verified against Codex CLI in April 2026 — re-verify before each cohort.

---

## 1. What the harness actually is in Codex

In Codex, the "harness" is the union of four things:

1. **The repo context the model can see.** `AGENTS.md`, files you name, files it reads on its own, the diff you built up this session.
2. **The tool affordances the model can reach.** Shell access, file edits, network calls, Playwright probes. Each affordance has an approval posture you chose.
3. **The approval and sandbox posture you picked when you started the session.** This determines what Codex can do without asking you.
4. **The feedback loop.** Tests, type checks, compiler errors, your review. This is how the agent learns it made a mistake in this session.

All four are yours to engineer. None of them are optional. When a harness feels "off", it's almost always because one of these four is underspecified.

---

## 2. Approval modes — pick deliberately, not by default

Codex CLI sessions start with an approval posture. The common modes are:

- **Suggest** — Codex proposes every shell command or file edit and waits for your `y/n`. Maximum control, maximum friction. Good for unfamiliar repos or risky work (migrations, production-adjacent changes).
- **Auto-edit** — Codex can edit files without asking, but still asks before running shell commands. This is the right default for most feature work in a repo you trust.
- **Full-auto** (sometimes called "dangerously") — Codex can edit files and run shell commands without asking, inside the configured sandbox. Fastest; appropriate only when the sandbox is actually restrictive and the work is reversible.

**Craft rule:** pick the approval mode *before* you start, based on the blast radius of the work — not during, because the mood of the session shouldn't drive safety posture. Write the mode into your `AGENTS.md` as a note for the next agent.

**Common trap:** raising to full-auto for speed, then forgetting to lower it for the next task. Get in the habit of naming the current mode out loud, the way a pilot names airspeed.

---

## 3. Sandboxing — what "isolated" actually means

Codex runs shell commands inside a sandbox. The sandbox constrains which directories are writable, whether network is allowed, and which binaries are callable. Exact defaults change between versions; what matters is the *posture* you should take:

- **Assume the sandbox is part of the harness.** If it allows network and the task doesn't need network, narrow it. If it allows writes outside the repo and you don't need that, narrow it. Unused affordances are silent drift risks.
- **Don't ask Codex to weaken its own sandbox.** If a step needs more capability, exit the session, reconfigure, and re-enter with the wider posture explicitly declared. Silent posture drift is the single most common "why did the agent do that" moment.
- **Document the sandbox assumption in `AGENTS.md`.** One line: "This repo expects Codex with file writes inside `src/` and `tests/` only, no network, shell limited to npm/node." The next agent — human or AI — needs this to know what is load-bearing.

---

## 4. Context window as a resource, not a design aesthetic

The model has a large context window. You do not have a large budget for putting things into it.

**What this means in practice:**

- **Not everything belongs in-context.** `AGENTS.md` should be a map — a short directory of deeper sources — not an encyclopedia. If it's 400 lines, it's a manual, and manuals don't fit in working memory.
- **Progressive disclosure beats eager loading.** Point at files; let the agent read them when needed. A reference is cheaper than a copy.
- **Long sessions decay.** After dozens of turns, constraints from the top of the session are in danger of being silently forgotten. Re-surface rules before they matter, not after the agent violates them.
- **The expensive prompt isn't the one you wrote. It's the one the agent is holding right now.** Every turn, the agent is re-reading the entire session. If there's noise in turn 5, it's still there in turn 50.

**Craft rule:** treat context budget the way a performance engineer treats latency — as a constraint you measure and optimize, not a free resource you assume. The harness is partly a budget discipline.

---

## 5. Long-horizon drift and how to catch it

Long-horizon drift is when the agent gradually stops honoring a constraint you set early in the session, because that constraint has scrolled out of its effective attention. It is the signature failure mode of longer Codex work.

**Symptoms:**

- The agent starts adding `any` types in a repo that explicitly requires strict typing.
- The agent recreates a utility you told it to import from an existing module.
- The agent silently stops writing tests for a kind of change it tested earlier.
- The agent uses the wrong naming convention for the third of three similar files.

**The harness move is not "remind the agent more loudly." It is:**

1. **Put the constraint in a place the agent re-reads.** `AGENTS.md`, a pre-commit check, a test that fails loudly if the convention is broken. Don't rely on the constraint surviving in the scrollback.
2. **Add a short re-anchor prompt before risky steps.** "Before you implement this, re-read `AGENTS.md` and state the three rules that apply to this change." This is a cheap, reliable drift detector.
3. **Watch for the moment the agent starts "improvising" around a missing pattern.** That usually means it can't find the pattern any more, not that the pattern doesn't exist.

**Craft rule:** drift is cheaper to prevent with repo artifacts than to correct with more prompting. Every time you correct the same drift twice, encode the constraint.

---

## 6. Before and after — a representative prompt pair

The following is a **representative** comparison, not a live transcript. It is constructed from patterns commonly observed in Harness Lab cohorts. Your actual output will differ; the shape of the difference is what matters.

### The underspecified ask

> Add a dashboard route that shows workshop instances with their current phase and team count. Make it look nice.

What typically happens:

- The agent picks a styling library it guesses is used in the repo (often wrong).
- It invents a data shape for "instances" instead of reading the existing model.
- It adds a route at a plausible but not conventional path.
- It writes no test, because "make it look nice" did not ask for one.
- You end up with 400 lines of code that almost fit and that you now have to reverse-engineer to reject.

### The specified ask

> **Goal:** Add a dashboard route listing workshop instances with their current phase and team count.
>
> **Context:** The instance model lives in `dashboard/lib/workshop-store.ts`. The existing route pattern is in `dashboard/app/workshops/page.tsx`. Styling uses Tailwind + the components under `dashboard/components/ui/`. Do not introduce a new styling library.
>
> **Constraints:**
> - Read-only route. No mutations.
> - Must work in file-mode storage (local dev) and neon-mode (production).
> - Follow the existing route naming convention in `dashboard/app/`.
> - If the instance list is empty, render the existing `EmptyState` component, not a bespoke fallback.
>
> **Done when:**
> - The new page renders the expected columns.
> - An e2e test in `dashboard/e2e/` loads the page and asserts at least one instance row when the demo data is present.
> - Running `npm run build` in `dashboard/` produces no new TypeScript errors.
>
> Before you implement, read the existing route file and list the three patterns you're going to reuse. Do not start writing until I confirm.

What typically happens:

- The agent stops and reads the referenced files.
- It lists the patterns it found. You catch any misreading in 30 seconds, before any code.
- It proposes a plan. You either confirm or redirect — cheap.
- It implements against the stated done criteria.
- It runs the test and the build before claiming the work is finished.
- The work either lands correctly in the first pass, or the feedback loop (test, build, review) catches the gap without you reading every line.

**The difference isn't the wordcount.** It's that the second ask makes the agent's working context match your working context. The harness is what makes that match possible.

---

## 7. A failure-recovery moment

This is the single thing missing from most agent demos: what happens when the agent drifts, and how the harness catches it.

**Scenario (representative, reconstructed from a cohort session):**

A team asked Codex to add a new `facilitator` role to an auth middleware. Codex implemented the change, ran the tests, and reported success. The tests were green. The dashboard worked in dev. Everything looked fine.

The continuation team, the next afternoon, opened the repo and read `AGENTS.md`. One line said: "Any change to auth middleware requires a corresponding update to `docs/adr/` with a rationale." There was no new ADR. The team ran a grep for the new role and found it used only in the middleware — not in the one place in the dashboard that branches on role. The middleware change worked in tests because the test fixtures only exercised the happy path.

**What the harness caught:**

- The ADR rule in `AGENTS.md` caught the missing documentation.
- The continuation team's "read first, diagnose second" discipline caught the incomplete usage.
- Neither caught it by "prompting better." Both caught it because the repo carried constraints the morning team had encoded, and the afternoon team had a ritual for reading them.

**The morning team's mistake wasn't prompting. It was trusting green tests as a completion signal in a repo where the real completion criteria lived in a doc they didn't re-read.** The fix is never "write a sharper prompt next time." The fix is either a test that would have failed, a rule that would have blocked merge, or a ritual that would have forced the check. All three are harness moves.

---

## 8. Tool selection — when to reach for what

Harness Lab is agent-agnostic, but in practice you will pick a specific tool for each task. Heuristics:

- **Codex CLI** — best for repo work with fast local iteration, especially when you want a sandbox and shell access. Strong for code generation, refactoring, debugging inside a repo you trust.
- **Claude Code** — best for long, stateful sessions where you want the model to reason about the full shape of a problem and remember decisions across many turns. Strong for architecture work, careful reviews, careful migrations.
- **pi** — best for terminal-native work that needs multi-model flexibility. Strong when you want to compare outputs or keep the harness lightweight and scriptable.
- **Cursor / IDE-native tools** — best for fast edit-edit-edit loops inside a single file or small module, where you want the model's suggestions inline and do not need agentic control flow.
- **Aider** — best for tightly-scoped edits against a known set of files, with git commits per turn.

**Craft rule:** pick the tool based on the *shape* of the task, not the one you happen to have open. Every tool has an implicit harness; picking the tool is picking the harness.

**None of this means you should switch tools mid-workshop.** Harness Lab cohorts should pick one tool for the day (usually Codex) so the learning accumulates. This section is about Monday morning, not about Saturday's workshop.

---

## 9. How to keep learning after today

The Codex ecosystem ships new capabilities monthly. What's documented here will be partly outdated within the next release cycle. **Do not treat this doc as a frozen reference.** Treat it as a starting harness for your own reading practice:

- Read the official Codex CLI release notes when they ship. The safety and approval posture changes there are the ones that matter most.
- Subscribe to one practitioner newsletter who uses these tools daily (Simon Willison's blog is a dense source; there are others).
- When you discover a failure mode in your own work, write it down in your own team's `AGENTS.md` or a runbook. Your team's harness should learn from your team's failures, not just from this doc.
- Every quarter, re-read your `AGENTS.md` files with a skeptical eye. Delete anything that is no longer load-bearing. Simplicity is part of the harness.

---

## 10. The one-line summary

You cannot prompt your way out of a bad harness. You can, however, engineer a harness that makes prompting mostly unnecessary.

---

## See also

- [`coaching-codex.md`](../materials/coaching-codex.md) — one-page recipe card for the conversational moves that force plan-first work.
- [`talks/context-is-king.md`](talks/context-is-king.md) — the workshop talk that introduces the method.
- [`challenge-cards/deck.md`](challenge-cards/deck.md) — small interventions that install the habits during the build phases.
- [`../workshop-blueprint/day-structure.md`](../workshop-blueprint/day-structure.md) — the full day architecture and the north-star question.
