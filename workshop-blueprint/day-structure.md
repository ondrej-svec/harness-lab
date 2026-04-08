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

## Canonical Agenda Source

The reusable agenda lives in [`agenda.json`](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-blueprint/agenda.json).

Runtime workshop instances import from that blueprint and then track live phase position, reveal state, teams, and checkpoints locally in the private runtime layer.
