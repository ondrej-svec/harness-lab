# Harness Lab Public/Private Taxonomy

This document defines where workshop assets live once Harness Lab is treated as a public template repo backed by a private workshop-instance layer.

For the formal production model, also see:

- [`2026-04-06-private-workshop-instance-runtime-topology.md`](adr/2026-04-06-private-workshop-instance-runtime-topology.md)
- [`2026-04-06-private-workshop-instance-auth-boundary.md`](adr/2026-04-06-private-workshop-instance-auth-boundary.md)
- [`private-workshop-instance-data-classification.md`](private-workshop-instance-data-classification.md)
- [`public-launch-history-cleanup-plan.md`](public-launch-history-cleanup-plan.md)

## The Three Layers

### 1. Public Template Repo

Purpose:
- share the workshop method publicly
- give participants a frictionless entry point
- keep the dashboard code, participant skill, and reusable content in one place

Allowed here:
- public workshop positioning and README copy
- reusable project briefs and challenge cards
- participant-facing reference materials
- `dashboard/` application code with fictional sample data only
- `workshop-skill/` and install instructions
- generic facilitation patterns that do not expose live event operations

Not allowed here:
- real workshop dates or venue details
- participant rosters
- team repo registry for a live event
- facilitator-only notes that would spoil the workshop flow
- passwords, secrets, or operational credentials
- private monitoring outputs tied to a real workshop

### 2. Private Workshop Instance Layer

Purpose:
- run real workshops without making the repo private
- keep event-specific state and operational controls secure

Lives here:
- workshop instances
- real dates, venues, rooms, and logistics
- team roster and assignments
- repo URLs used in a live event
- checkpoint feed and rotation state
- monitoring snapshots
- facilitator-only notes
- admin access configuration

Runtime rule:
- the public app may read from this layer
- only the facilitator surface may mutate it

### 3. Team Project Repos

Purpose:
- hold the exercise work produced by workshop teams

Lives here:
- code created during the workshop
- team-specific `AGENTS.md`, skills, runbooks, and plans
- the artifacts that will later be inherited by another team

Rule:
- these repos are separate from the template repo

## Classification Rules

When adding a new artifact, ask:

`If a participant or random GitHub visitor sees this before the event, is that fine?`

If yes:
- keep it in the public template repo

If no:
- move it to the private workshop instance layer
- or remove it from this repo entirely if it is internal ops clutter rather than workshop product

## Current Repository Classification

### Public-safe

- `README.md`
- `content/project-briefs/`
- `content/challenge-cards/`
- `content/style-guide.md`
- `content/style-examples.md`
- `workshop-skill/`
- `dashboard/` code
- `materials/` only for participant-facing or print-ready workshop assets

### Private-data-backed

- live dashboard state for a real workshop
- admin actions
- workshop instance metadata
- monitoring data
- checkpoint feed
- reveal / rotation control

### Facilitator-only

- real logistics and travel details
- real workshop schedules tied to dates and rooms
- monitoring registry with live team repos
- private retrospective notes

Default rule:
- facilitator-only artifacts should stay out of this repo unless there is a strong reason to keep a reusable public-safe template

## Naming Rules

Use these terms consistently:

- `Harness Lab` = the public workshop identity
- `workshop template` = reusable public-safe configuration and content
- `workshop instance` = a real scheduled run with private metadata
- `participant surface` = the public or lightly protected workshop-facing dashboard
- `facilitator surface` = the protected admin/control plane

Avoid in public positioning:

- `Silent Post`
- `signature exercise`
- language that explains the hidden handoff mechanic before participants experience it

## Access Policy

Current default:

- participant pages may remain public
- facilitator routes and write operations must be protected

If a specific event requires it, add a shared participant password at the deployment layer rather than making the repo private or adding GitHub collaborators.

## Migration Notes

To make the repo public-safe:

1. replace real workshop metadata in source files with fictional sample data
2. move real operational data into the private workshop instance layer
3. remove non-product facilitator clutter instead of preserving it as sanitized public docs
4. keep the dashboard runnable locally with demo data
5. protect `/admin` and write APIs with runtime auth
