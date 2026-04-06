# ADR 2026-04-06: Private Workshop-Instance Runtime Topology

## Status

Accepted

## Context

Harness Lab needs one production topology that supports real workshops without making the source repository private or creating a separate app per event.

The system must preserve these boundaries:

- the repository stays public-safe and runnable with fictional/demo data only
- real workshop metadata, live state, and facilitator operations stay in private runtime systems
- one dashboard deployment can host many sequential workshop instances
- participant access stays separate from facilitator control
- repo-native doctrine, release gates, and security rules remain part of the architecture rather than optional follow-up hygiene

Existing repository guidance already points in this direction, but the runtime shape has remained partly implicit across multiple docs.

## Decision

Harness Lab will use this canonical topology:

- one public `harness-lab` repository for dashboard code, participant skill, doctrine, ADRs, and public-safe content
- one shared Vercel project for the `dashboard/` application
- one private Neon-backed runtime data layer for real workshop-instance state
- many `workshop_instances` inside that runtime system, one record per real workshop event
- optional small private facilitator ops workspace outside the public repo and outside the runtime database for logistics notes that are not product state
- separate team repositories for participant outputs

Runtime composition rules:

- public template content stays in the repo
- private workshop-instance state is read server-side from the private runtime layer
- the dashboard and `workshop-skill/` consume a composed event context through explicit server-side APIs
- no real workshop metadata, participant roster, live team registry, facilitator notes, or secrets may be committed to the public repo

Repository rules:

- file-backed repositories remain local-development adapters only
- production repositories must be private-runtime adapters behind explicit interfaces
- history cleanup is a release prerequisite before any public launch

## Consequences

- deployment sprawl is avoided because real workshops become isolated records, not separate apps
- the trust boundary becomes explicit: source code may be public, but secrets and event state remain private and server-side
- schema design must enforce `instance_id` scoping consistently across private reads, writes, logs, exports, and archives
- the repo must ship the supporting architecture docs, release gates, and history-cleanup rules alongside runtime implementation
- facilitator operations may use an API-first and skill-enabled workflow without requiring a large back-office UI first
