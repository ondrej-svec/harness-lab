# Metrics Dashboard

## Problem

Teams often have the data, but not the screen that turns it into a readable shared view. Without that, decisions get harder, discussion gets noisier, and everyone walks away with a different interpretation of the numbers.

Your task is to design a simple dashboard that turns a handful of metrics into a clear shared view and stays understandable after handoff to another team.

## User stories

- As a team, I want several metrics on one screen so the current state is legible quickly.
- As a facilitator, I want to change seed data without touching UI logic.
- As the team after rotation, I want to understand the data structure, components, and screens within minutes.

## Architecture notes

- Separate seed data from UI from the first commit.
- Mobile-first is an advantage, but the dashboard must remain readable on a projected screen too.
- README and monitoring should explain what already works, what is still mock, and what is still missing.
- Design the structure so adding another metric does not require rewriting the whole screen.
- Do not optimize only for the look. Make the data model, layout rules, and verification path easy for another team to understand.

## Done when

- The dashboard shows at least 3 metrics and one trend or comparison.
- The repo documents the data sources and a mock fallback.
- It is clear where a new metric is added and how layout changes are verified.
- A new team can extend the dashboard without breaking the structure.
- The layout stays legible on mobile and on a larger screen, and the verification path says how to check that.

## First step for the agent

Design a dashboard that survives handoff. First describe the data model, components, layout rules, and `Done When` criteria. Only then start building the UI.
