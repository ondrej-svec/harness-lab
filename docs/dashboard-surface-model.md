# Dashboard Surface Model

Harness Lab dashboard is split into two surfaces with different jobs and different trust boundaries.

## Participant Surface

Purpose:
- orient participants during the workshop day
- reduce facilitator repetition
- give one obvious next step at any point in the day

Public responsibilities:
- current phase
- agenda
- project briefs
- challenge cards
- workshop reference links
- team-facing status that is safe to expose in-room
- links to the participant learner kit artifacts the team should use next

Design rules:
- mobile-first
- readable on projection
- phase-aware before feature-rich
- no facilitator-only controls
- should reinforce the same participant resources as `workshop-skill/` and facilitation guidance

## Facilitator Surface

Purpose:
- run the workshop instance without editing seed files or using ad hoc scripts

Protected responsibilities:
- reset workshop instance
- move agenda state
- reveal or hide the continuation window
- register teams and repo URLs
- capture sprint updates
- update checkpoints
- ingest monitoring snapshots

Design rules:
- protected at runtime
- optimized for speed and safety, not public polish
- writes go through explicit admin actions

## Data Boundary

Public template repo:
- ships dashboard code
- ships fictional sample data
- does not ship real event metadata

Private workshop instance layer:
- stores real dates, rooms, rosters, and operational state
- becomes the backing store for facilitator actions

## Current Implementation Direction

- `/` acts as the participant surface
- `/admin` acts as the facilitator surface
- `HARNESS_ADMIN_PASSWORD` can protect admin and write APIs
- file storage remains the local development adapter
- `dashboard/lib/workshop-state-repository.ts` is the seam for moving to a hosted private store later
