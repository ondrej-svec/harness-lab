# Doc Generator

## Problem

Documentation goes stale almost immediately. Once maintenance is fully manual, the team postpones it, and after a few iterations nobody knows whether the docs still describe reality. After handoff, the next team no longer knows what to trust and what is only inference. Your job: design a tool that generates baseline technical documentation — or a structured project overview — from an existing codebase in a way that makes *what we know* and *what we're inferring* visibly different.

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

- A reviewer can read the generated documentation and tell exactly where each claim came from — within minutes, without opening the original source. *(Handoff test — provenance is the whole point.)*
- Another team can add a new output format (Markdown → HTML, report → overview) without refactoring the whole tool.
- The generated output makes it obvious which claims are *certain* (read directly from source) and which are *inference* (heuristic).
- The tool produces at least one complete, readable output for a real or seed codebase.
- `README` and `AGENTS.md` explain how to run locally and what input the tool expects.

## First step for the agent

Start by listing every signal the tool will read from a codebase (file names, imports, commit messages, directory structure, comments — whatever you're choosing) and for each one, decide whether it produces *certain* output or *heuristic* output. Write that spec in `AGENTS.md`. Only then propose the first implementation slice.
