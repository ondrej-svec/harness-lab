# Harness Lab Day Structure

Harness Lab is a full-day build workshop about harness engineering: engineering context, instructions, workflow, and review loops so AI-agent work survives another team, another facilitator, and another context window.

The workshop should not teach these practices as optional extras layered on top of a hackathon. The practices are the operating system of the day. Every phase should make the next safe harness move more obvious than jumping straight into feature generation.

## Core Promise

Participants should leave with two things:

- a working artifact or tracer-bullet implementation in their team repo
- a clearer mental model of how to turn agent output into durable engineering work

The workshop does not optimize for maximum feature count. It optimizes for continuation quality.

## Design Rule

Harness Lab teaches by forcing the useful behavior:

- repo-native context beats chat memory
- short maps beat giant instruction dumps
- verification beats confidence
- explicit boundaries beat hidden convention
- cleanup is part of building, not a postponed chore

## Day Arc

### 1. Opening and framing

Goal:
- explain why harness engineering matters
- make the repo the operating surface, not the slide deck
- set expectations around tests, review, and explicit context

Habit installed:
- humans steer, agents execute
- the engineer's job is to design context, constraints, and feedback loops

What teams should hear:
- success is not "how much code we got"
- success is whether another team can continue without needing the authors in the room

### 2. Context is King talk

Goal:
- demonstrate that better context changes output quality materially
- show why `AGENTS.md`, plans, and explicit boundaries matter before implementation starts

Habit installed:
- `AGENTS.md` is a map, not a manual
- if a rule matters, it should live in the repo where the next agent can find it

Teaching move:
- compare one underspecified task with one task that has goal, context, constraints, and done criteria
- show that progressive disclosure is stronger than one giant prompt blob

### 3. Build Phase 1

Goal:
- get every team into a real repo quickly
- establish a legible operating surface before feature chasing
- get `AGENTS.md`, a plan, one executable check, and the first reviewed output in place before lunch

Expected evidence in the repo:
- clear task framing
- explicit working rules
- a plan or tracked implementation path
- at least one meaningful verification step
- a visible next safe step for another person or agent

Habit installed:
- map before motion
- verification is the trust boundary
- the first deliverable is harness quality, not feature count

### 4. Continuation shift

Goal:
- prove what survives when a different team takes over
- force teams to read the repo before editing
- expose missing context, weak runbooks, and fragile assumptions

Operating rule:
- the receiving team reads first
- the receiving team changes only after it can explain the current state
- the sending team is not the hidden source of truth

Habit installed:
- if it is not encoded in the repo, it does not exist
- continuation quality is the real quality check

Required first move:
- the receiving team should first write what helped continuation, what is missing, what looks risky, and what the next safe move is

### 5. Reveal and reflection

Goal:
- compare what helped continuation versus what caused friction
- reinforce the idea that the harness is part of the product
- collect improvements that belong back in the reusable blueprint

Habit installed:
- cleanup and codification are part of delivery
- repeated pain should become a better template, check, or runbook

## Narrative Spine

The day should not feel like separate agenda cards. Each phase should change what the room now understands and what it is ready to do next.

- `opening`:
  Shift the room from "AI hackathon energy" to "continuation-quality discipline." The key belief is that handoff without verbal rescue is part of the assignment from the first hour.
- `talk`:
  Shift the room from a vague sense that context matters to a precise thesis: harness engineering is team infrastructure, not prompt cosmetics.
- `demo`:
  Shift the room from abstract agreement to an observable workflow. The room should see context, plan, implementation, and review as one repeatable system.
- `build-1`:
  Shift teams from listening to evidence. Before lunch, the repo needs to show map, plan, one executable check, and one verified step.
- `intermezzo-1`:
  Shift from isolated table work to shared learning. The room should hear concrete repo signals, not generic progress reporting.
- `lunch-reset`:
  Shift from local progress to handoff readiness. Going to lunch without a readable next safe step should feel unfinished.
- `rotation`:
  Shift from authorship to inheritance. The receiving team must read first, diagnose second, and edit only after it can explain the state.
- `build-2`:
  Shift from frustration to codification. Weak continuation signals should turn into clearer repo guidance, stronger checks, and better runbooks.
- `intermezzo-2`:
  Shift from anecdotes about the afternoon to concrete continuation evidence. The room should identify which repo signals actually saved time.
- `reveal`:
  Shift from reflection to adoption. The close should turn signals from the day into next-week practice and into improvements to the reusable workshop blueprint.

## What Must Survive In The Repo

- goal and constraints
- build and test flow
- architecture boundaries that affect safety or continuation
- the current plan or handoff status
- evidence of what was verified
- the next safe step
- the small set of rules that the team kept repeating out loud

## What The Workshop Teaches Implicitly

- context before generation
- explicit interfaces before hidden backchannels
- tests and executable checks as trust boundaries
- documentation that changes decisions, not documentation for its own sake
- `AGENTS.md` as a table of contents that points to deeper sources of truth
- small, continuous garbage collection before bad patterns spread

## Agenda Mirror

The public-readable 10-phase mirror lives in [`agenda.json`](agenda.json).

Runtime workshop instances import from the maintained dashboard blueprint source pair and then track live phase position, reveal state, teams, and checkpoints locally in the private runtime layer.
