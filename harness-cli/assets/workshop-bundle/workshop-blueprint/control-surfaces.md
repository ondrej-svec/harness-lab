# Workshop Control Surfaces

Harness Lab has one workshop-instance backend and multiple control surfaces with different trust levels.

All control surfaces should reinforce the same operating model:

- push context into the repo
- keep the next safe step obvious
- ask for evidence, not confidence
- bias participants toward continuation-ready artifacts instead of hidden chat context

## Participant Surface

Purpose:
- orient teams during the workshop day
- show participant-safe phase and room context
- keep the next action obvious on mobile and on projection

Default behavior:
- show the current phase
- show the next hard milestone
- show the next harness move, not only the next feature move
- remind teams what evidence should exist by the next checkpoint

Good prompts from the surface:
- "Máš už `AGENTS.md` jako mapu repa?"
- "Je další bezpečný krok dohledatelný pro cizí tým?"
- "Co dnes opravdu ověřujete, ne jen předpokládáte?"

Authentication:
- public first
- participant event code unlocks participant-private context for one workshop instance

## Facilitator Dashboard

Purpose:
- fast visual control of the active workshop instance
- safe runtime operations during the day

Design rule:
- facilitator checkpoints should ask for repo evidence
- status collection should prefer "what changed, what verifies it, what should the next team read first?" over generic progress text

Authentication:
- facilitator identity and instance grant

Scope:
- runtime state only
- no hidden authority to redefine the blueprint silently

## Facilitator Skill

Purpose:
- AI-assisted interface to the same workshop runtime APIs
- useful when a facilitator wants a conversational control path or guided summaries

Default coaching:
- before lunch, push teams toward `AGENTS.md`, a plan, commands, and one executable check
- during continuation, push teams to read before editing and to write down what is missing
- after continuation, push teams to codify repeated pain into docs, checks, or runbooks

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
