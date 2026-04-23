# DevToolbox CLI

## Problem

Every team accumulates small one-off scripts — log cleaners, JSON parsers, commit lookups — that work for one person until nobody remembers how to run them. Your job: design a CLI that solves a few real developer pain points and stays legible after a fresh read. Not a bag of scripts. A small system where the next command, test, and doc have an obvious home.

## User stories

- As a developer, I want to turn a log or JSON blob into a readable format with one command.
- As a developer, I want to quickly find suspicious commits, branches, or changes without manually assembling git commands.
- As a team, I want both the commands and the way of working documented so a fresh collaborator can continue without confusion.

## Architecture notes

- Choose any language or framework, but the CLI must stay easy to run and easy to discover.
- Separate commands from helper utilities and configuration from the start.
- `AGENTS.md` should describe the build and test flow, output conventions, and the rules for future extension.
- A runbook for someone joining the repo after lunch matters as much as a working command.
- Do not build a bag of scripts. Build a small system where it is obvious where the next command, test, and doc belong.

## Done when

- A fresh collaborator can add or fix a command within 10 minutes of opening the repo. *(Fresh-reader test.)*
- At least 3 working commands, each solving a concrete developer pain point.
- `README` and `AGENTS.md` explain how to run and verify locally.
- The extension pattern is visible — a new command fits without breaking the structure.
- Every command has at least one readable input/output example.

## First step for the agent

Don't start with code. Start with `AGENTS.md`, a short plan for the extension pattern, and one clear verification step. Only then implement the first command.
