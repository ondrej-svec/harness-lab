# Code Review Helper

## Problem

Code review is often uneven. Some changes arrive with a strong checklist and clear risk framing, while others come through without a shared standard. The reviewer improvises, the author does not know what to verify in advance, and the team loses consistency.

Your task is to design a tool that turns a diff or change set into a usable review checklist.

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

- The tool produces a review checklist from a seed diff.
- The output distinguishes certain findings from recommendations or hypotheses.
- It is clear how to add another rule or heuristic without a long onboarding pass.
- Another team can continue development within minutes without chaos.

## First step for the agent

Do not start with code. First write the review rules, the input flow, and a definition of what a good checklist means. Only then propose the first implementation slice.
