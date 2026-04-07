# Workshop Control Surfaces

Harness Lab has one workshop-instance backend and multiple control surfaces with different trust levels.

## Participant Surface

Purpose:
- orient teams during the workshop day
- show participant-safe phase and room context
- keep the next action obvious on mobile and on projection

Authentication:
- public first
- participant event code unlocks participant-private context for one workshop instance

## Facilitator Dashboard

Purpose:
- fast visual control of the active workshop instance
- safe runtime operations during the day

Authentication:
- facilitator identity and instance grant

Scope:
- runtime state only
- no hidden authority to redefine the blueprint silently

## Facilitator Skill

Purpose:
- AI-assisted interface to the same workshop runtime APIs
- useful when a facilitator wants a conversational control path or guided summaries

Authentication:
- facilitator commands rely on the `harness` CLI for privileged auth bootstrap and stored local session material
- the skill should not become a second secret store

## `harness` CLI

Purpose:
- small local broker for privileged facilitator auth and session storage
- bootstrap helper for dashboard/skill usage
- thin operational client over the shared facilitator runtime APIs

Required v1 responsibilities:

- login
- logout
- status
- secure local session storage
- passing authenticated requests on behalf of facilitator tooling

Explicit non-goals for v1:

- participant login
- replacing the dashboard
- becoming a second backend
- auto-publishing runtime edits back into the repo

## Vocabulary Rule

All facilitator control surfaces should use the same nouns:

- blueprint
- workshop instance
- participant access
- facilitator grant
- current phase
- continuation shift
- archive
- reset

The blueprint is the naming authority. Runtime clients should not invent alternate labels for the same operation.
