---
title: "brainstorm: workshop skill event access model"
type: brainstorm
date: 2026-04-06
status: captured
brainstorm: true
confidence: medium-high
---

# Workshop Skill Event Access Model Brainstorm

Capture of the brainstorm about how `workshop-skill/` should work once Harness Lab is run as a reusable public repo with private workshop-instance data for multiple client hackathons.

## Why this brainstorm happened

We want the workshop skill to become a real participant companion, not just a static repo helper.

The tension:

- we want as much of Harness Lab as possible to be public and reusable
- we need some workshop-instance data to stay private
- we want participants to ask the skill for workshop context instead of asking the facilitator or hunting through the dashboard
- we do **not** want to use MCP for this
- we want a model that is simple enough to operate across four hackathons for the same company

## Context from the current repo

The current `workshop-skill/SKILL.md` already assumes one skill can surface both bundled content and live workshop data.

Today the skill concept includes:

- current agenda phase
- assigned brief
- challenge cards
- team information
- phase-aware coaching
- repo analysis
- fallback to bundled local content when the live API is unavailable

This means the question is not whether the skill should handle live context. It already should. The real question is how to provide that live context securely and simply.

## Decision summary

### Recommended direction

Use a **public reusable participant skill** backed by a **private workshop-instance API layer**.

Participants unlock workshop-private context with a **shared event code**.

That code is redeemed for a **short-lived event session** used by both the dashboard and the skill.

## Pressure-tested decisions

### 1. Public/private model

Adopt a **hybrid** model.

Public where possible:
- reusable skill behavior
- setup guidance
- generic reference material
- public-safe briefs and challenge cards
- dashboard code with demo/sample data

Private where needed:
- workshop-instance metadata
- company-specific details
- team assignments
- repo URLs for live teams
- checkpoint state
- participant-safe announcements tied to a real event
- facilitator-only controls and notes

### 2. Access scope

Default to **event-wide participant access** for workshop-private participant data.

Rationale:
- security matters, but this is not a high-sensitivity system
- participants should be able to ask practical workshop questions like "What is the repo for team 3?"
- simplicity is more important than building a heavy per-user permission system

Facilitator-only data and actions must remain separate.

### 3. Authentication model

Use a **shared event code**.

Rationale:
- easy to show on a slide, whiteboard, or printed QR card
- low friction for workshop setup
- avoids per-user onboarding overhead
- enough for the real threat model if combined with rate limiting and expiry

### 4. Event code format

Use a **memorable generated passphrase** in the style of random words plus digits.

Example shape:
- `mortar7-compress2-lantern8`

Intent:
- easier to type than an opaque token
- stronger than a human-invented phrase
- strong enough when randomly generated and rate-limited

Important rule:
- the system generates the code randomly
- humans should not invent the code manually

### 5. Session model

After entering the event code, the backend should **redeem it into a short-lived session**.

Important distinction:
- the **event code** may remain usable for **1-2 weeks**
- the **session** should expire much sooner
- when the session expires, the user simply re-enters the same event code

This keeps the UX simple while avoiding repeated use of the event code as the live bearer credential.

### 6. Dashboard + skill relationship

The same event code should work in **both**:
- the dashboard participant surface
- the workshop skill

Both should use **one shared API layer** as the source of truth for workshop-instance data.

This preserves the intended mental model:
- dashboard participant surface = orientation during the day
- workshop skill = AI interface to the same workshop system

### 7. No-session behavior

If there is no valid event session:
- public/fallback skill behavior should still work
- private event answers should stay locked
- the skill should say clearly that workshop-private context requires the event code

This keeps the current fallback philosophy from `workshop-skill/SKILL.md` while avoiding fake live state.

### 8. Query model

The skill should support both:
- **structured commands** like `/workshop brief` or `/workshop team`
- **natural-language private lookup** when a valid event session exists

Desired behavior:
- commands remain the reliable backbone
- users can still ask natural questions such as "What is the repo for team 3?"

### 9. Retrieval model

Use a **hybrid cache** model.

After authentication, fetch a small participant-safe core bundle.
More sensitive or more dynamic details are fetched on demand.

#### Core participant companion bundle

Fetch immediately after authentication:
- event name
- current phase / agenda
- key links
- available briefs
- available challenges
- participant-safe announcements

#### On-demand private lookups

Fetch when requested:
- team list
- repo URLs
- checkpoint state
- other workshop-instance details that are more sensitive or more volatile

### 10. Facilitator boundary

The participant event code must **not** unlock facilitator-only capabilities.

Facilitator access should remain a separate auth path.

This is a hard boundary even in a low-stakes system.

### 11. Leak/abuse posture

Treat participant event access as **low stakes but still protected**.

Operational stance:
- one active event code per workshop instance
- rate limit redemption attempts
- allow emergency rotation if the code leaks
- avoid over-engineering beyond that

## Why this direction fits Harness Lab

This approach supports the workshop's actual teaching goals:

### It teaches AI-native context design

Participants experience:
- public instructions
- private runtime context
- a skill that becomes more useful when scoped context is available

### It teaches practical security without enterprise ceremony

Participants indirectly see:
- not all context should live in public files
- private data should stay server-side
- sessions should expire
- different surfaces can share a backend without sharing all permissions

### It preserves reusability

The public repo can remain a reusable template while the private workshop-instance layer carries client/event specifics.

## Main tradeoffs discussed

### Why not separate skill variants per event?

Rejected as the primary direction because it would:
- create maintenance overhead
- increase duplication
- make it easier to leak the wrong data bundle
- weaken the public reusable repo model

### Why not rely only on the dashboard for private context?

Rejected because it would reduce the role of the skill as a real workshop companion.
The workshop should encourage participants to ask the skill, not always fall back to the dashboard or facilitator.

### Why not per-user auth?

Rejected for now because it adds too much operational complexity for the workshop's threat level.
Event-wide participant access is good enough for the current goals.

## Open questions

These still need explicit design work before implementation:

1. exact API contract for event code redemption, session refresh, and private lookups
2. where the private workshop-instance layer lives in production
3. whether the dashboard and skill share session state directly or simply redeem the same event code independently
4. what participant-safe announcements and workshop-instance fields belong in the core bundle schema
5. whether there should be any optional team-scoped extensions later

## Proposed next steps

1. turn this brainstorm into a short ADR / architecture decision note
2. map current `/workshop` commands to:
   - public data
   - core authenticated bundle
   - on-demand private lookups
   - facilitator-only data
3. define the shared event-context API contract before implementing runtime auth changes
4. review current `workshop-skill/` copy to ensure it clearly distinguishes fallback mode from authenticated live mode

## Draft recommendation

Build the next version of Harness Lab around:
- a **public reusable `workshop-skill`**
- a **private workshop-instance API layer**
- a **shared memorable event code** redeemed into a short-lived participant session
- a **hybrid retrieval model** with a small authenticated core bundle plus on-demand private lookup

This is the simplest architecture that still supports the workshop vision of "ask the skill" instead of "ask the facilitator".
