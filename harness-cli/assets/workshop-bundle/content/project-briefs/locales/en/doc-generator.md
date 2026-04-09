# Doc Generator

## Problem

Documentation becomes stale almost immediately. Once maintenance is fully manual, the team starts postponing it, and after a few iterations nobody knows whether the docs still describe reality. After handoff, the next team no longer knows what to trust and what is only inference.

Your task is to design a tool that generates baseline technical documentation or a structured project overview from an existing codebase in a way that makes certainty and inference visibly different.

## User stories

- As a developer, I want basic technical documentation from a project without writing everything from scratch.
- As a reviewer, I want to understand the module structure and main entry points within minutes.
- As the team after rotation, I want to discover the architecture without long detective work.

## Architecture notes

- The input can be a local repo, seed directory, or simplified dataset.
- The output can be Markdown, HTML, or a simple text report.
- The important part is to explain what the tool can infer reliably and what remains heuristic.
- Design the structure from the start so another output type can be added later.
- Do not optimize for AI theatre. Optimize for trust, traceability, and a clear next safe move for a team after handoff.

## Done when

- The tool produces at least one readable documentation page or report.
- It is clear how the tool runs locally and which input it expects.
- The output separates facts from estimates or heuristics.
- Another team can add a new output type without chaos in the repo.
- A reviewer can tell where each claim came from within minutes.

## First step for the agent

First define which project signals you will read and which outputs are certainty versus heuristic. Then propose the first implementation slice.
