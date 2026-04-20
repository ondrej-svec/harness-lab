# Code Review Helper

## Problem

Code review quality varies depending on who is looking. Some changes arrive with a sharp checklist and clear risk framing; others come through unevenly and the team loses consistency. Your job: design a tool that turns a diff into a usable review checklist — one that says what it is certain about, what is heuristic suggestion, and what still needs human judgment.

## User stories

- As a reviewer, I want a fast checklist of risks, questions, and focus areas from a diff.
- As the author of a change, I want to know what I should verify before the review starts.
- As the team after rotation, I want to continue from the heuristics the original team already discovered instead of reinventing them.

## Architecture notes

- This can be a CLI, web app, or simple script. The important part is a clear `diff -> analysis -> checklist` flow.
- It must be obvious which inputs the tool expects and what it cannot evaluate reliably.
- Add a seed diff or `examples/` so the workflow can be checked locally.
- Separate heuristic from certainty clearly. The tool should help the reviewer, not pretend to be infallible.

## Done when

- A fresh reader can add a new review rule within 10 minutes without reading through the whole codebase. *(Fresh-reader test.)*
- The tool produces a review checklist from a seed diff.
- The output clearly separates certain findings from heuristic suggestions from items still needing human judgment.
- The review rules themselves are readable and editable by someone who didn't write them.
- There is at least one concrete example in `examples/` that demonstrates the full flow.

## First step for the agent

Don't start with code. First write the review rules, define what a good checklist looks like for a specific seed diff, and clarify what the tool *cannot* evaluate reliably. Only then propose the first implementation slice.
