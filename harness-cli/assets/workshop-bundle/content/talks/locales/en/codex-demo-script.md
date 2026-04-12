---
cs_reviewed: true
---

# Codex Demo Script

## Goal

One narrative demo, not a feature tour. In 15 minutes the audience should understand what a good agent workflow looks like and why this repository holds together because of the harness, not because of improvisation.

## Repo-Readiness Contrast (talk micro-exercise)

Before the main demo, the facilitator shows a short contrast: **same prompt, two repos, different outcome.**

### Two-Folder Setup

Prepare two folders before the workshop:

**Folder A: bare repo**
- Project brief only (a simple task description)
- No AGENTS.md
- No context files, no constraints, no plan
- The agent receives a simple prompt and drifts — it makes plausible but wrong architectural decisions.

**Folder B: repo with harness**
- Same project brief
- AGENTS.md with Goal, Context, Constraints, Done When
- A short plan or step list
- Workshop skill installed (`harness skill install`)
- The agent receives the same simple prompt and produces aligned output.

### Narration flow

1. Show Folder A first. Run a simple prompt. Let the agent drift visibly.
2. Name what you see: "This is task drift. The agent made plausible decisions, but without constraints it went the wrong way."
3. Show Folder B. Run the exact same prompt. Let the agent produce aligned output.
4. Pause. Ask the room: "What changed?"
5. Let two voices answer before you name it.
6. Land the thesis: "The prompt didn't change. The repo did."

### Honest failure narration

When showing Variant A, name the failure mode explicitly:
- "The agent started without constraints and made plausible but wrong architectural decisions."
- "This is what happens in every repo without AGENTS.md — the agent fills in the blanks with its own assumptions."
- Use the term **task drift** — it names the pattern precisely.

### Tool-specific realities to mention during the demo

- Codex lacks rewind/undo — once the agent commits, you need git to go back.
- MCP servers vs. skills: different packaging, same idea (structured capabilities).
- The principles are tool-agnostic: AGENTS.md works with Codex, Claude Code, Cursor, Copilot.

### Open question

Whether the `harness` CLI should have a `demo-setup` command that scaffolds both folders automatically.

## Flow (after the contrast)

1. Open Folder B and show the `README`, `AGENTS.md`, the breakdown of work into steps, and the way change control is handled in the repo.
2. Run `/plan` so the agent decomposes the work into steps.
3. Briefly show how intent is written into the repo: where the map lives, where the next safe step lives, and where it is visible that this repository was built as a continuation-ready system.
4. Let the agent implement a small slice.
5. Run `/review` and show that review is part of the workflow, not an emergency brake at the end.
6. Briefly show the workshop skill:
   - how it is installed via `harness skill install`
   - how it produces the first actionable step in Codex or in pi
7. Close with this line:
   - "The tool alone is not enough. The working system around it is what decides."

## Fallbacks

- If the CLI is not working: switch to the Codex App.
- If the App is not working: use the web fallback.
- If the demo is slow: have a repo snapshot ready after every step.
- **If the live contrast drags: use pre-prepared screenshots. The contrast matters more than live generation.**

## What not to show

- five different modes of working
- a complicated feature tour
- long waiting for generation
- a demo disconnected from the repository the workshop is running in

## The point for the room

The point is not to show "a magic result." The point is to show how fast quality grows once you add context, a plan, review, and a repository built so that work can actually be continued.
