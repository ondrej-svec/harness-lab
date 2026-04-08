# Doc Generator

## Problem

Documentation becomes stale almost immediately. Once maintenance is fully manual, the team starts postponing it, and after a few iterations nobody knows whether the docs still describe reality.

Your task is to design a tool that generates baseline technical documentation or a structured project overview from an existing codebase.

## User stories

- As a developer, I want basic technical documentation from a project without writing everything from scratch.
- As a reviewer, I want to understand the module structure and main entry points within minutes.
- As the team after rotation, I want to discover the architecture without long detective work.

## Architecture notes

- The input can be a local repo, seed directory, or simplified dataset.
- The output can be Markdown, HTML, or a simple text report.
- The important part is to explain what the tool can infer reliably and what remains heuristic.
- Design the structure from the start so another output type can be added later.

## Done when

- The tool produces at least one readable documentation page or report.
- It is clear how the tool runs locally and which input it expects.
- The output separates facts from estimates or heuristics.
- Another team can add a new output type without chaos in the repo.

## First step for the agent

First describe which signals you will read from the project, what you can infer from them, and where certainty stops. Only then propose the first implementation.
