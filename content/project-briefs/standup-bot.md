# Standup Bot

## Problem

Daily standups in chat become long threads where blockers get lost, dependencies between people are invisible, and nothing is reconstructable an hour later. Your job: design a tool that turns standup inputs into an overview a fresh collaborator can continue working from — without the original author, without the original thread, and without a verbal walkthrough.

## User stories

- As a team lead, I want standup responses collected into one readable summary.
- As a developer, I want to quickly see blockers, dependencies, and topics that need coordination.
- As a fresh collaborator, I want to understand the data flow and integration points without a verbal walkthrough.

## Architecture notes

- Prefer a clear data model over complicated integration.
- Mock data is fine if the workflow feels realistic and is documented clearly.
- Separate ingest, processing, and presentation of the output.
- Prompts, runbooks, and decisions must live in the repo, not only in the heads of the original team.
- Do not optimize for pretty summary prose before blockers, dependencies, and the next safe move are visible.

## Done when

- A fresh collaborator can continue this project without a verbal explanation. *(Fresh-reader test.)*
- The tool ingests seed data in a documented format and produces an overview that surfaces blockers, dependencies, and items needing coordination.
- The output distinguishes what the tool is certain about from what is only a heuristic suggestion.
- The repo explains how to connect the ingest to a real input channel — without requiring it.
- Ingest, processing, and presentation are cleanly separated in the code.

## First step for the agent

Don't start with code. Start with: the seed data format, the output data model, the rules that distinguish certainty from heuristic, and an `AGENTS.md` a fresh reader will open first. Only then propose the first implementation slice.
