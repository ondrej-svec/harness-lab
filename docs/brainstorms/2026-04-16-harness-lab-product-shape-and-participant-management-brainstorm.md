---
title: "Harness-Lab Product Shape and Participant Management"
type: brainstorm
date: 2026-04-16
participants: [ondrej]
related:
  - docs/adr/2026-04-06-workshop-event-access-model.md
  - docs/adr/2026-04-06-private-workshop-instance-auth-boundary.md
  - docs/adr/2026-04-09-continuation-shift-as-eval.md
  - docs/brainstorms/2026-04-06-brainstorm-workshop-skill-event-access-model.md
  - docs/brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md
  - docs/brainstorms/2026-04-10-participant-cli-architecture-brainstorm.md
  - docs/private-workshop-instance-schema.md
  - docs/private-workshop-instance-data-classification.md
  - docs/public-private-taxonomy.md
  - docs/continuation-shift-eval-design.md
  - workshop-blueprint/day-structure.md
---

# Harness-Lab Product Shape and Participant Management

## Problem Statement

Cross-level engineering teams (seniors + mids + juniors together, typically assembled from one company) need to learn **engineering with AI coding agents** — not fearful avoidance, not vibe-coded slop. The medium is **live synchronous hackathons** (in-person preferred, online possible). The outcome is participants leaving the day *reasoning about the work differently*: treating agents as infrastructure rather than oracles, building repos that speak for themselves, producing work another engineer can continue from.

Facilitators running these events today reinvent the operational layer every time — rosters, teams, timing, repo visibility, rotation, eval. **Harness-lab should be the open-source facilitator cockpit that makes running these events excellent and repeatable**, while holding a high taste bar for the participant experience so participants leave wanting to come back.

**The near-term deliverable proving this:** a real participant + team management layer that supports both pre-loaded rosters and walk-ins, with on-the-spot team formation — shipping before the 2026-04-23 hackathon and pressure-tested there live.

## Context

What already exists in the repo (as of 2026-04-16):

**Foundational decisions to respect, not rebuild:**

- **Event-access model (`docs/adr/2026-04-06-workshop-event-access-model.md`)**: one shared event code per instance, redeemed into short-lived anonymous sessions (12h sliding, 16h absolute). Participant identity intentionally not required. Facilitator auth is a hard-separate plane via Neon Auth.
- **Auth boundary (`docs/adr/2026-04-06-private-workshop-instance-auth-boundary.md`)**: codes stored as SHA-256 hashes only, never logged. One active code per instance. Any new identity story must respect this.
- **Schema seam (`docs/private-workshop-instance-schema.md`)**: `teams` table already exists with JSONB payload (`members: string[]` free-text); `team_assignments.external_subject` anticipates loose identity linkage. No `participants` table yet — this is the gap.
- **Multi-facilitator already works** via `instance_grants` (owner/operator/observer roles) — single-facilitator assumption is not present.
- **Dual-storage contract (`dashboard/lib/runtime-contracts.ts`)**: every repository ships File + Neon implementations. New entities pay this tax.
- **Continuation-shift eval (`docs/adr/2026-04-09-continuation-shift-as-eval.md`)**: `RotationSignal.teamId` is already used in the eval. Whatever team management produces must be coherent with this.

**Gaps from prior research (8 explicit blank spots, none of them overlapping):**

1. No `Participant` entity anywhere
2. No roster import model (CSV, paste, anything)
3. No walk-in / on-the-spot registration flow
4. No team formation UI (drag/drop, randomize-with-constraints, manual)
5. Cross-level / mixed-seniority pedagogy is undocumented in code — lives in Ondrej's head
6. No QR distribution UX beyond raw event code
7. No `cohort` field on instance schema (referenced in eval but not formalized)
8. No PII retention policy for participant names or follow-up emails

## Chosen Approach

**"Core + Blueprints architecturally, Single-Flagship in the story."**

Build harness-lab as one opinionated open-source system for running *one* canonical kind of event excellently — the harness-lab agent-native hackathon day. Keep the runtime primitives (participants, teams, rotations, monitoring, auth, facilitator cockpit) architecturally separable from the flagship blueprint (agenda, project briefs, challenges, day-structure), so future blueprints *can* emerge without forking core. But don't sell or document extensibility as a feature today.

**Participant UX is sacred and minimal, always.** Zero configuration leaks to participants. They see: event code → team → repo → brief → rotation → reveal. All complexity lives facilitator-side.

**Primary audience:** cross-level engineering teams from one company (seniors + mids + juniors). Team formation explicitly mixes seniority. Continuation-shift relies on repo legibility as the equalizer.

**Governance arc:** BDFL now (Ondrej holds taste bar, doctrine, roadmap); aspire toward founding steward (small maintainer group, methodology stays Ondrej's voice, runtime becomes community-maintained) over 12 months. Design for delegation without requiring it.

**Proof slice shipping before 2026-04-23:** participant + team management layer, with opt-in follow-up email field on participants as the retention-signal mechanism.

## Why This Approach

**Optimizes for:**
- Doctrine purity while leaving room to grow (Core+Blueprints bones)
- Quality bar of a commercial product delivered as free OSS
- Participant experience consistency (opinionated, never configurable)
- Realistic governance (BDFL now, not pretending to be a community)
- Answering the biggest unverified outcome claim (do participants change behavior post-event?) via cheap retention signal paired with roster work

**Rejected alternatives:**

- **"Opinionated Day-Runner only" (no internal separation):** caps growth; if a second blueprint is ever needed, it's a rewrite.
- **"Modular Facilitator Framework" (full plugin API, multiple blueprints):** destroys doctrine coherence, creates governance overhead, builds extensibility theater for users who don't exist yet.
- **Venture / commercial framing:** explicitly out of scope — Ondrej doesn't want money for this; goal is contributor community and methodology spread, not ARR.
- **Async / self-serve format:** rejected — the continuation-shift requires real-time emotional stakes (another team is waiting for your repo). Async kills the lesson.
- **Individuals / open enrollment as primary audience:** rejected — cross-level company teams produce peer learning that open enrollment can't. Same-level teams share too many assumptions.
- **Per-participant auth credentials:** rejected — violates the deliberate low-friction anonymity of the 2026-04-06 access model. Corporate-laptop friction kills adoption.

## Subjective Contract

- **Target outcome:** facilitators using harness-lab feel like they're running a polished commercial product. Participants feel like they're at a carefully-crafted event (Linear/Maven quality bar), not a DIY workshop. The methodology (engineering-not-vibe-coding) is felt through the day shape, not lectured.
- **Anti-goals:**
  - Configuration creep (every facilitator request adding a knob)
  - Extensibility theater (plugin APIs nobody uses)
  - Async/self-serve drift (becoming a course platform)
  - Vibe-coding aesthetic (loose/chaotic UX that contradicts the doctrine)
  - Participant surface exposing facilitator-layer concepts
  - Any hint of LMS-ness
- **Positive references:**
  - Linear (opinionated UX, keyboard-first, taste bar)
  - Vercel (developer experience polish, one-click magic, deploy button energy)
  - Rails (convention over configuration, opinionated with a story)
  - Maven (live cohort operational flows done well)
  - Basecamp / Shape Up (one opinionated format, confident about it)
  - Excalidraw (OSS that feels commercial-grade)
- **Anti-references:**
  - Generic LMS (Moodle, Canvas)
  - Devpost (passive submission portal, no live-facilitator story)
  - Miro/Mural for workshops (generic canvas, no engineering context)
  - Jira-style configurable-everything
  - Buildspace's consumer-bootcamp pattern
  - Lambda School's credential-as-product trap
- **Tone / taste rules:**
  - Engineering discipline, not vibe-coding
  - Opinionated, not flexible
  - Participant-first, facilitator-second (in UX priority)
  - Facilitator-first, contributor-second (in configurability priority)
  - Silence over noise — don't show knobs unless they matter
- **Rejection criteria:** the result is wrong if
  - Participant UX gains configuration knobs
  - The "blueprint" concept leaks to participant-visible surfaces
  - The day shape loses coherence (phases don't flow, continuation-shift feels optional)
  - Install-to-first-value exceeds 60 seconds
  - Facilitator must read docs to form teams

## Preview and Proof Slice

- **Proof slice:** Participant + team management layer shipped before 2026-04-23. Used live in that hackathon. Covers:
  - Participant entity (name required, email optional, tag optional)
  - Roster import (paste list, CSV optional) OR empty-start for walk-ins
  - Walk-in intake via existing event-code redemption (participant self-identifies name on join)
  - Facilitator roster view (pool of participants, assignment state visible)
  - Team formation UI (drag/drop manual + "randomize into N cross-level teams" button)
  - Opt-in follow-up email field (retention-signal mechanism for assumption 4)
- **Required preview artifacts:**
  - Facilitator roster + team-assignment UI mockup (HTML or screenshot comp) before code is written
  - Participant join-as-named-person flow mockup
  - Reconciliation sketch showing how new `participants` table coexists with existing `teams.members: string[]` projection
- **Rollout rule:**
  - Dogfood at 2026-04-23 hackathon first
  - Broader advocacy / README feature announcement only *after* retention data exists (≥1 cohort, ≥14 days post-event)
  - If the proof slice exposes major UX gaps, those inform the v2 design before any extensibility work begins

## Key Design Decisions

### Q1: Product vs. methodology — which is the thing? — RESOLVED
**Decision:** The *product* is the facilitator cockpit + runtime for running live agent-native hackathons. The *methodology* (harness engineering, continuation-shift, repo-as-context) is the IP that lives in the flagship blueprint's content.
**Rationale:** Harness content as *content* already exists across the internet; it's not defensible. Cockpit tooling for this specific event shape doesn't exist anywhere. The methodology stays Ondrej's voice; the tool becomes the thing others can contribute to.
**Alternatives considered:**
- "Product *is* the methodology / curriculum" — rejected: too abstract, not shippable, commodity market.
- "Product *is* training-as-a-service" — rejected: Ondrej explicitly doesn't want revenue model; also traps him as the bottleneck.

### Q2: Who is the primary audience? — RESOLVED
**Decision:** Cross-level engineering teams from one company (seniors + mids + juniors together).
**Rationale:** Peer learning amplifies in mixed teams; repo legibility becomes the equalizer in continuation-shift; juniors force seniors to articulate tacit knowledge. Same-level teams skip too much.
**Alternatives considered:**
- Individual engineers from open enrollment — rejected: no peer-learning amplifier, no "team carries the practice back."
- Junior-only cohorts — rejected: no seniority to install engineering discipline alongside agent fluency.
- Senior-only cohorts — rejected: self-diagnosis is hard; they skip the articulation work that makes it stick.

### Q3: What's the outcome we optimize for? — RESOLVED
**Decision:** Participants leave *reasoning about the work differently* — treating agents as infrastructure rather than oracles, producing engineering-grade output, not vibe-coded slop.
**Rationale:** This is the contrarian positioning that distinguishes harness-lab from every other AI dev tool in 2026. Also what Ondrej genuinely cares about.
**Alternatives considered:**
- "Build bigger things" — rejected: outcome-agnostic; doesn't resist slop.
- "Catch agent mistakes" — rejected: too narrow; verification without system-level thinking is still reactive.
- "Build harnesses" — rejected: means, not end. Harness-building is a tool for the real outcome, not the outcome itself.

### Q4: Product shape — opinionated, modular, or both? — RESOLVED
**Decision:** "Core + Blueprints architecturally, Single-Flagship in the story." Clean internal separation between runtime primitives and the flagship blueprint, but no public extensibility API or marketing as an extensible platform.
**Rationale:** Threads the BDFL → steward arc. Preserves doctrine (flagship stays canonical, Ondrej-controlled). Avoids extensibility theater for users who don't exist yet. Leaves room to grow without rewriting.
**Alternatives considered:**
- Pure Opinionated Day-Runner (no internal separation) — rejected: caps growth; any second blueprint forces a rewrite.
- Modular Facilitator Framework (full plugin API, multiple blueprints as a v1 feature) — rejected: destroys doctrine coherence, builds unused complexity, governance overhead.

### Q5: Participant identity model — RESOLVED
**Decision:** Two-layer model.
  - **Layer 1 (operational):** new `participants` table scoped per-instance, with `display_name` (required, can be pseudonym), `email` (optional, opt-in only), `tag` (optional — e.g., "senior", "junior", free-text; for facilitator ops and team-mixing).
  - **Layer 2 (auth):** existing anonymous `participant_sessions` preserved unchanged. When a session is created, participant *self-identifies* (enters display name) and a soft binding is recorded in a new `participant_session_bindings` or equivalent.
**Rationale:** Preserves the 2026-04-06 access-model decision (low friction, no per-person credentials). Gives facilitators the named humans they need for roster ops and team formation. Binding is soft — a lost cookie means re-self-identifying, which is acceptable.
**Alternatives considered:**
- Per-participant credentials (login per person) — rejected: too heavy; violates auth-boundary ADR; corporate-laptop friction.
- Purely anonymous (keep `teams.members: string[]`) — rejected: no roster, no walk-in intake with identity, no retention signal possible.

### Q6: Roster support mode — RESOLVED
**Decision:** Both pre-loaded and walk-in supported through one unified participant pool.
**Rationale:** Real events mix both. Corporate workshops often have known attendee lists. Public hackathons often don't. Unifying into one pool means facilitator UX doesn't bifurcate.
**Alternatives considered:**
- Pre-loaded only — rejected: excludes walk-in events.
- Walk-in only — rejected: makes known-roster events a manual slog.

### Q7: Team formation UX — RESOLVED
**Decision:** Manual drag/drop plus a "randomize into N teams with cross-level mix" button. Facilitator chooses.
**Rationale:** Manual assignment supports facilitator taste and mid-event adjustments. Randomization with a seniority-mix constraint encodes the pedagogical intent (cross-level teams) as a feature, not just facilitator wisdom.
**Alternatives considered:**
- Always manual — rejected: slow; doesn't encode the cross-level pedagogy.
- Always random — rejected: facilitator has information the algorithm doesn't (who knows whom, who needs to pair with whom).

### Q8: Retention-signal mechanism — RESOLVED
**Decision:** Opt-in follow-up email field on `Participant`. Facilitator can trigger 14- and 30-day check-in emails with ~3 simple questions (post-event behavior change, harness-still-alive-in-repo, would-you-do-this-again).
**Rationale:** Directly addresses unverified assumption (4) — whether participants change behavior post-event. Cheap to add alongside roster work. Opt-in respects privacy. Facilitator-scoped means no platform-level email operation.
**Alternatives considered:**
- Telemetry-only via CLI — rejected (for now): impersonal, no qualitative signal, participant may have uninstalled CLI by day 14.
- Nothing — rejected: leaves the core outcome claim permanently unverified.

### Q9: Governance posture — RESOLVED
**Decision:** BDFL now; evolve toward founding steward over 12 months as contributors emerge.
**Rationale:** Realistic current state. Aspirational direction guides architectural choices (design for delegation: strong ADRs, clear module boundaries, CODEOWNERS-ready, `CONTRIBUTING.md` that's more than a stub).
**Alternatives considered:**
- Full community governance today — rejected: premature, no contributors yet.
- Hands-off author — rejected: abandons quality bar; doctrine drifts.

### Q10: Extension surface — RESOLVED
**Decision:** Custom project briefs, custom challenge cards, custom language packs, custom branding via env/config. Nothing deeper in v1.
**Rationale:** Covers ~90% of real customization needs without building plugin APIs. Leaves runtime primitives free to evolve.
**Alternatives considered:**
- Full plugin system — rejected: premature.
- Fully locked — rejected: prevents legitimate customization (language, branding, content).

### Q11: In-person vs. online — RESOLVED (by observation)
**Decision:** Optimize for in-person; online falls out for free because of existing architecture (event code via URL, repos on GitHub, dashboard over HTTP).
**Rationale:** Ondrej prefers in-person for energy/facilitation reasons. No architectural work needed to keep online open as a capability.
**Alternatives considered:** none — this was a discovered property, not a decision.

## Contradiction with Prior Decisions — Flagged

- **2026-04-07 brainstorm decided "participants do not need the CLI"** to minimize corporate-laptop friction. **2026-04-10 brainstorm reversed this** — participants install the CLI anyway via `harness skill install`, so the constraint is obsolete. This brainstorm assumes the 2026-04-10 reality.
- **2026-04-06 access-model brainstorm** explicitly rejected per-user auth as too operationally heavy. **This brainstorm does not violate that** — the new Participant entity is an *operational* layer for facilitator ops, not an *auth* layer. Sessions remain anonymous; identity is self-declared and soft-bound.

## Open Questions

Questions to resolve during planning or implementation:

1. **Roster import format:** just names (one per line)? CSV with columns? Copy-paste from Slack/email? Something simpler for v1?
2. **Privacy retention policy for follow-up emails:** when is the email deleted? On event archive? On participant request? Per-event retention period?
3. **Cross-level mix encoding:** does the `tag` field (senior/junior/...) need controlled vocabulary, or is free-text enough? Does the randomize button require tags or work without?
4. **Walk-in intake when rotation is mid-flight:** if a participant arrives *during* phase 4, can they still join a team? Policy?
5. **Event-code rotation with active participants:** if the facilitator rotates the code mid-event (security), existing participant sessions stay valid — confirm this still holds with the new soft-binding.
6. **`teams.members: string[]` reconciliation:** is the existing field a denormalized projection auto-generated from the new `team_members` join? Or deprecated? Migration path?
7. **Follow-up email templating:** facilitator-authored free-text, system-templated, or hybrid? How localized?
8. **Company / affiliation field:** useful for B2B workshops (e.g., "which team is Team Apple, which is Team Google") — include in v1 Participant entity or defer?
9. **Cohort field on `workshop_instances`:** referenced in continuation-shift eval but not formalized. Add to schema as part of this work?

## Out of Scope

Explicitly excluded from this work:

- Third-party blueprints / plugin SDK / extension marketplace
- Async / self-serve event format
- Per-participant auth credentials or login flow
- Participant-to-participant messaging or networking features
- Cross-event / cross-cohort leaderboards or gamification
- Billing, subscriptions, multi-tenant SaaS, commercialization
- Mobile app (browser mobile must work; native app does not)
- Custom agenda authoring UI beyond current `agenda-section` capabilities
- Facilitator-authored custom phase transitions, rotation logic, or eval criteria
- Any feature requiring persistent participant identity across multiple events
- Commercial-grade analytics / BI dashboards for cohort aggregate data (beyond simple retention signals)

## Next Steps

- `/plan docs/brainstorms/2026-04-16-harness-lab-product-shape-and-participant-management-brainstorm.md` — turn this into an implementation plan for the participant-management proof slice
- Ship the proof slice before 2026-04-23 hackathon
- Use that hackathon as the live pressure test; capture observations in `capture/notes/`
- After ≥14 days, review retention signals and decide whether to open the README with this feature
- Consider `/compound` on two candidate patterns that emerged in this brainstorm:
  1. "Core + Blueprints architecturally, Single-Flagship in the story" as a general OSS governance pattern
  2. "Two-layer identity (anonymous auth, named operational) with soft binding" as a pattern for privacy-respecting event tools
