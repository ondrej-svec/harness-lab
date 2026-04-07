# Blueprint Import Model

This document defines how a private workshop instance imports from the public workshop blueprint.

## Purpose

Instance creation and reset should be explainable as:

"Import the reusable blueprint into a private workshop instance, then apply instance-local runtime state."

That is clearer and safer than treating the repo data as a hidden seed path.

## Import Contract

### Blueprint-owned data

Copied from the public repo into a new or reset instance:

- workshop title and subtitle
- canonical agenda/phase definitions
- public challenge deck references
- baseline participant setup paths
- stable control-surface vocabulary
- blueprint reference metadata

Primary source:
- [`workshop-blueprint/agenda.json`](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-blueprint/agenda.json)

### Instance-local data

Stored only in the private runtime layer:

- real event date
- venue and room
- active participant event access configuration
- facilitator grants
- current phase position
- continuation reveal state
- live teams and repo URLs
- checkpoints, monitoring, sprint updates, and archives

## Create Flow

1. choose a blueprint reference
2. copy blueprint-owned fields into the new instance
3. attach instance-local metadata
4. record the imported blueprint reference on the instance
5. expose participant-safe and facilitator-only views through runtime APIs

## Reset Flow

1. archive the current instance runtime state
2. re-import blueprint-owned fields from the selected blueprint reference
3. clear or reinitialize instance-local runtime state
4. keep an audit trail of which blueprint reference was used

## Blueprint Reference Tracking

Each workshop instance should keep:

- `blueprint_id`
- `blueprint_version` or repo commit reference
- `imported_at`
- `last_reset_at`

This is enough to answer support questions such as:

- which reusable workshop definition did this event start from
- did the event get reset from the same blueprint or a newer one
- which runtime oddity is a local instance problem versus a reusable blueprint problem

## Messaging Rule

Dashboard and API copy should use "import blueprint" language rather than "reset to seed" language.

That framing teaches contributors the real system shape:

- blueprint is reusable design
- instance is live event state
- runtime edits stay local unless a human publishes a repo change deliberately
