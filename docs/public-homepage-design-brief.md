# Public Homepage Design Brief

## Purpose

Design the public homepage for Harness Lab.

This is **not** the workshop control room, not a live event dashboard, and not a room-specific briefing page.

Its job is to:
- explain what Harness Lab is
- signal the tone and quality of the workshop
- make the project feel credible, sharp, and intentional
- offer a calm entry point into the room context for people who already have the event code

If someone lands here without context, they should understand the lab.
If someone is physically in the workshop room, they should also have a clear path into the participant context.

## Product Context

Harness Lab is a full-day workshop about **harness engineering**:
- designing context for AI coding agents
- creating repo-native instructions and operating rules
- structuring workflows so another team can continue from the repository without oral handoff

This repository is the **public-safe template** version.
Real workshop dates, rooms, rosters, and operational state belong in the private workshop-instance runtime, not on the public homepage.

## The Core Mistake To Avoid

The homepage must **not** look like:
- a fake live dashboard
- a demo workshop instance
- an admin console accidentally exposed to the public
- a generic SaaS landing page
- a cheap markdown document with a form pasted underneath

The previous direction failed because it still felt like a stripped-down workshop runtime instead of a designed public front door.

## Desired Feel

Reference direction: the simplicity and restraint of `ondrejsvec.com`.

The page should feel:
- minimal
- confident
- editorial
- spacious
- quiet but not bland
- designed, not templated

It should feel closer to:
- a thoughtful studio homepage
- an essay-like product surface
- a focused invitation into a serious workshop

It should feel less like:
- a dashboard
- a startup SaaS hero
- a Notion page
- a hackathon microsite full of cards and widgets

## Audience

Primary:
- workshop participants arriving from a QR code
- curious visitors who want to understand what Harness Lab is

Secondary:
- facilitators and collaborators validating that the public surface is trustworthy and well framed

## What The Homepage Must Communicate

In order of importance:

1. Harness Lab is about engineering context, workflows, and handoff for AI agents.
2. The workshop is serious, practical, and repo-native.
3. The public page is intentionally calm and minimal.
4. The room-specific participant layer exists, but it is secondary until the visitor actually needs it.

## Functional Requirements

The page should include:
- a strong hero
- a concise explanation of what Harness Lab is
- a small amount of structured supporting information
- a restrained participant access entry for the event code

The event-code entry should:
- exist on the page
- feel secondary to the brand/message
- not dominate the layout
- not make the public homepage feel like login-first software

## Content Boundaries

Public homepage must not expose:
- real room metadata
- real workshop dates
- real city/venue details
- live agenda state
- live ticker / room notes
- facilitator operations
- anything that feels like internal runtime state

Those belong only in the private workshop-instance layer or the unlocked participant view.

## Visual Direction

The designer should explore a visual system with:
- strong typography
- narrow, disciplined layout
- generous whitespace
- very few UI containers
- carefully chosen contrast
- subtle atmosphere instead of “feature blocks”

Suggested principles:
- one dominant idea per screen
- fewer cards, fewer boxes, fewer dashboard metaphors
- typography and spacing should do most of the work
- the page should still feel alive, not sterile

Good possible ingredients:
- strong serif or expressive grotesk pairing
- understated rules/dividers
- slightly warm background or paper-like tone
- one carefully used accent color at most
- subtle motion only if it strengthens clarity

Avoid:
- grid-of-cards hero sections
- fake metrics
- “current phase / next milestone” on the public page
- glossy productivity-app aesthetics
- visual clutter pretending to be richness

## UX Direction

The information architecture should likely be:

1. Brand / thesis
2. Short explanation of what Harness Lab is
3. A few core principles or workshop qualities
4. Participant access entry

Not:

1. Login
2. operational status
3. workshop runtime
4. explanation

The event-code entry should feel like:
- an access door
- discreet
- obvious when needed

Not like:
- the whole product
- the main hero CTA
- a support form

## Constraints

- mobile-first because participants arrive via QR code
- must work cleanly on desktop projection too
- participant-facing copy is in Czech
- code/config remains English
- the public repo must remain public-safe

## Relationship To Other Surfaces

There are three distinct surfaces:

1. Public homepage
Meaning: brand, explanation, entry point

2. Participant unlocked surface
Meaning: room-specific orientation after event-code access

3. Facilitator surface at `/admin`
Meaning: protected operations and workshop control

The redesign should make surface 1 feel clearly different from surfaces 2 and 3.

## Deliverables Requested From Designer

Please propose:
- one strong homepage concept
- optionally one alternate direction if the first is bolder than expected
- desktop and mobile layouts
- hero treatment
- typography direction
- color/material direction
- placement and styling of the event-code entry

Also explain:
- what the page is trying to make the visitor feel
- what was intentionally removed
- how the design avoids “dashboard syndrome”

## Final Design Standard

The public homepage should make someone think:

“this is a serious, well-designed workshop about working with AI agents”

not:

“this looks like a random demo instance or a rough internal tool”
