# Metrics Dashboard

## Problem

Every team has the data — user signups, deploy frequency, error rates, feature usage — scattered across different tools. The shared screen that turns it into a decision-making view usually doesn't exist. Your job: design a dashboard that puts a few metrics and one trend on one screen, stays cleanly separated between data and UI, and is still legible to a fresh reader who didn't build it.

## User stories

- As a team, I want several metrics on one screen so the current state is legible quickly.
- As a facilitator, I want to change seed data without touching UI logic.
- As a fresh collaborator, I want to understand the data structure, components, and screens within minutes.

## Architecture notes

- Separate seed data from UI from the first commit.
- Mobile-first is an advantage, but the dashboard must remain readable on a projected screen too.
- README and monitoring should explain what already works, what is still mock, and what is still missing.
- Design the structure so adding another metric does not require rewriting the whole screen.
- Do not optimize only for the look. Make the data model, layout rules, and verification path easy for a fresh collaborator to understand.

## Done when

- A fresh collaborator can add a new metric within 10 minutes without breaking the layout. *(Fresh-reader test.)*
- The dashboard shows at least 3 metrics and one trend or comparison.
- Seed data and UI logic are cleanly separated — a facilitator can swap seed data without touching the UI.
- The layout stays legible on mobile and on a large projected screen; the `README` says how to test both.
- The `README` documents which parts are real, which are mocked, and which are still missing.

## First step for the agent

Don't start with the UI. Start with the data model, the component boundaries, the layout rules, and a `Done When` in `AGENTS.md`. Only then touch any visual code.
