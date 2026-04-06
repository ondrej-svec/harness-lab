# ADR 2026-04-06: Workshop Event Access Model

## Status

Accepted

## Context

Harness Lab needs one access model that lets a public participant dashboard and a public `workshop-skill/` consume private workshop-instance data without making the repo private or introducing per-user workshop accounts.

The model must preserve:

- low-friction room entry
- separate facilitator privileges
- one shared backend mental model
- fallback mode when no live session exists
- repo-native guidance before high-autonomy implementation work

## Decision

Harness Lab will use:

- one public-by-default participant surface
- one shared event code per workshop instance
- short-lived participant sessions redeemed from that event code
- one shared event-context API for dashboard and `workshop-skill/`
- independent dashboard and skill redemption flows
- explicit `/workshop login` as the primary skill auth path
- a small authenticated core bundle with richer team/runtime data fetched on demand

Facilitator auth remains a separate path and the participant event code must never unlock facilitator actions.

## Field Classification

### Public

- workshop framing
- public-safe agenda structure
- public-safe brief/challenge content
- setup/reference guidance
- sample/demo metadata

### Participant-authenticated

- real event metadata exposed to participants
- participant-safe announcements tied to a real event
- team list
- repo URLs
- team checkpoint state

### Facilitator-only

- admin mutations
- monitoring snapshots
- facilitator notes
- private workshop ops state not intended for participant surfaces

## Consequences

- the participant dashboard stays useful before login
- the skill can become a true workshop companion instead of a static repo helper
- the backend needs participant-session storage in addition to workshop state
- auth/session behavior must be documented and tested as first-class product behavior
- `AGENTS.md`, contribution guidance, and related doctrine must be updated alongside runtime code so the repo embodies the workshop method
