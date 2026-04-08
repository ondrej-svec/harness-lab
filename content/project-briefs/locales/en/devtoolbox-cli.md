# DevToolbox CLI

## Problem

Almost every team ends up with small one-off scripts for log cleanup, JSON conversion, suspicious commit lookup, or fast repo checks. They work for a while, often for one person only, and after a few days nobody remembers how to run or extend them.

Your task is to design a CLI tool that handles several common developer tasks in a way that survives handoff to another team.

## User stories

- As a developer, I want to turn a log or JSON blob into a readable format with one command.
- As a developer, I want to quickly find suspicious commits, branches, or changes without manually assembling git commands.
- As a team, I want both the commands and the way of working documented so another team can continue after rotation without confusion.

## Architecture notes

- Choose any language or framework, but the CLI must stay easy to run and easy to discover.
- Separate commands from helper utilities and configuration from the start.
- `AGENTS.md` should describe the build and test flow, output conventions, and the rules for future extension.
- A runbook for the team that inherits the project after lunch matters as much as a working command.

## Done when

- There are at least 3 useful commands or subcommands.
- `README` and `AGENTS.md` describe local execution and verification.
- It is clear where to add another command without breaking the project structure.
- A new team can add or fix another command within 10 minutes.

## First step for the agent

First design the minimal architecture that survives handoff. Start with `AGENTS.md`, then prepare a plan, and only then implement the first command.
