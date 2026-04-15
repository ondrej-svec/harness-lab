# AGENTS.md Standard

This document defines how Harness Lab uses `AGENTS.md` and how the workshop should teach it.

The goal is not to produce the longest possible instruction file. The goal is to produce the smallest durable operating surface that helps an agent do correct work and helps the next team continue without guesswork.

## Why This Exists

Harness Lab teaches harness engineering, so the repository has to model it:

- repo-native context before high-autonomy generation
- progressive disclosure instead of one giant prompt blob
- executable verification as the trust boundary
- repeated cleanup and doc gardening instead of letting drift compound

This aligns with the current OpenAI harness-engineering guidance:

- keep `AGENTS.md` short and use it as a table of contents
- treat repository-local docs as the system of record
- encode review, test, and maintenance behavior into the repo instead of relying on chat memory

## What Root `AGENTS.md` Must Do

The root file should stay short enough to be read quickly at the start of a task.

It must do five jobs:

1. orient the agent to the repo mission and trust boundaries
2. tell the agent what to read before editing
3. route different task types to the right deeper docs
4. state the verification boundary and completion standard
5. point outward to the real system of record instead of duplicating it

## What Root `AGENTS.md` Must Not Do

Do not turn the root file into:

- a copy of ADRs or security docs
- a place for volatile workshop-event details
- a mixed participant/facilitator/private ops dump
- a stale checklist graveyard no one maintains

If more detail is needed, add or improve a deeper doc and link to it.

## Progressive Disclosure Rule

Use this escalation path:

1. root `AGENTS.md` for repo-wide orientation
2. focused docs or runbooks for durable domain rules
3. plans and ADRs for work-in-flight and architecture decisions
4. narrower bundle or folder-specific guidance when one surface has persistent local rules

If a single folder or surface keeps needing special instructions, prefer adding a surface-specific doc or local guidance there rather than growing the root file indefinitely.

## Standard Shape For Harness Lab

The preferred shape of the root file in this repo is:

1. mission
2. read first
3. task routing
4. repo map
5. language and trust-boundary rules
6. verification boundary
7. done criteria

That shape is intentionally operational. It should help an agent decide the next safe move quickly.

## Participant Teaching Standard

For participant repos, Harness Lab still teaches the 4-part starter:

- goal
- context
- constraints
- done when

That starter remains correct as long as it is used as a map, not a manual.

In practice, a good participant `AGENTS.md` should answer:

- what this repo is trying to do
- which files or docs to read first
- which constraints are non-negotiable
- which commands verify the work
- what counts as done
- what the next safe move is if the work stops mid-stream

## Maintenance Triggers

Update `AGENTS.md` or its linked docs when any of these happen:

- repo entry points change
- trust boundaries change
- a framework or runtime workflow changes materially
- contributors repeatedly make the same mistake
- a document linked from `AGENTS.md` stops being the true source of truth

If the change affects the workshop teaching model too, also update:

- [`workshop-skill/template-agents.md`](../workshop-skill/template-agents.md)
- [`workshop-skill/analyze-checklist.md`](../workshop-skill/analyze-checklist.md)
- [`docs/learner-resource-kit.md`](learner-resource-kit.md)
- the packaged bundle via `harness-cli/scripts/sync-workshop-bundle.mjs`

## Review Checklist

When reviewing `AGENTS.md`, check:

- Is it still short enough to read quickly?
- Does it route to the actual sources of truth?
- Do its markdown links stay repo-relative so they work on GitHub and in local clones?
- Does it expose real verification expectations?
- Does it reflect current public/private boundaries?
- Does it help a new human or agent find the next safe move?
- Is any critical rule still living only in prompts or chat history?

## Canonical Plan Status Values

Every plan in `docs/plans/` (and `docs/plans/archive/`) must carry a `status:` frontmatter field with exactly one of these values:

- `approved` — written, reviewed, ready to start
- `in_progress` — `/work` has begun
- `complete` — all acceptance criteria green, work shipped
- `superseded` — a newer plan has replaced this one
- `captured` — reference-only artifact, not an execution tracker (rare)

`completed` is not a canonical value. If you see it, normalize it to `complete`.

Full lifecycle rules — transitions, directory layout, archive behavior, and the `workshop analyze` checks that enforce this — live in [`plan-lifecycle-standard.md`](plan-lifecycle-standard.md). Do not duplicate those rules here.

## External References

- OpenAI, “Harness engineering: leveraging Codex in an agent-first world”:
  https://openai.com/index/harness-engineering/
- OpenAI Codex best practices:
  https://developers.openai.com/codex/learn/best-practices
- Next.js AI Coding Agents guide:
  https://nextjs.org/docs/app/guides/ai-agents
