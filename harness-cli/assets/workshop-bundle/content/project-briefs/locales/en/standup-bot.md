# Standup Bot

## Problem

Daily standups in chat often turn into a long thread with no structure. Blockers disappear in the noise, dependencies between people are hard to see, and after a few hours it is difficult to reconstruct what was actually agreed.

Your task is to design a tool that turns standup inputs into an overview people can continue working with.

## User stories

- As a team lead, I want standup responses collected into one readable summary.
- As a developer, I want to quickly see blockers, dependencies, and topics that need coordination.
- As the team after rotation, I want to understand the data flow and integration points without verbal handoff.

## Architecture notes

- Prefer a clear data model over complicated integration.
- Mock data is fine if the workflow feels realistic and is documented clearly.
- Separate ingest, processing, and presentation of the output.
- Prompts, runbooks, and decisions must live in the repo, not only in the heads of the original team.

## Done when

- The tool can ingest seed data and produce a readable summary.
- The output highlights blockers or items that need attention.
- The repo explains how to connect the solution to a real chat or another input channel.
- After rotation, another team can continue without further explanation.

## First step for the agent

Split the work into ingest, summarization, and context for the next team. First write the documentation the new team should open first, and only then propose implementation steps.
