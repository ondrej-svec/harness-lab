# Harness Lab Day Structure

Harness Lab is a full-day build workshop about harness engineering: engineering context, instructions, workflow, and review loops so AI-agent work survives another team, another facilitator, and another context window.

## Core Promise

Participants should leave with two things:

- a working artifact or tracer-bullet implementation in their team repo
- a clearer mental model of how to turn agent output into durable engineering work

The workshop does not optimize for maximum feature count. It optimizes for continuation quality.

## Day Arc

### 1. Opening and framing

Goal:
- explain why harness engineering matters
- make the repo the operating surface, not the slide deck
- set expectations around tests, review, and explicit context

### 2. Context is King talk

Goal:
- demonstrate that better context changes output quality materially
- show why `AGENTS.md`, plans, and explicit boundaries matter before implementation starts

### 3. Build Phase 1

Goal:
- get every team into a real repo quickly
- establish `AGENTS.md`, a plan, and the first reviewed output before lunch

Expected evidence in the repo:
- clear task framing
- explicit working rules
- a plan or tracked implementation path
- at least one meaningful verification step

### 4. Continuation shift

Goal:
- prove what survives when a different team takes over
- force teams to read the repo before editing
- expose missing context, weak runbooks, and fragile assumptions

Operating rule:
- the receiving team reads first
- the receiving team changes only after it can explain the current state
- the sending team is not the hidden source of truth

### 5. Reveal and reflection

Goal:
- compare what helped continuation versus what caused friction
- reinforce the idea that the harness is part of the product
- collect improvements that belong back in the reusable blueprint

## What Must Survive In The Repo

- goal and constraints
- build and test flow
- architecture boundaries that affect safety or continuation
- the current plan or handoff status
- evidence of what was verified
- the next safe step

## What The Workshop Teaches Implicitly

- context before generation
- explicit interfaces before hidden backchannels
- tests and executable checks as trust boundaries
- documentation that changes decisions, not documentation for its own sake

## Canonical Agenda Source

The reusable agenda lives in [`agenda.json`](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-blueprint/agenda.json).

Runtime workshop instances import from that blueprint and then track live phase position, reveal state, teams, and checkpoints locally in the private runtime layer.
