---
title: "Landing page sharpening and agent handoff"
type: brainstorm
date: 2026-04-10
participants: [Ondrej, Claude]
related:
  - docs/brainstorms/2026-04-07-public-homepage-copy-brainstorm.md
  - docs/public-and-participant-design-rules.md
  - workshop-blueprint/day-structure.md
  - workshop-blueprint/teaching-spine.md
---

# Landing page sharpening and agent handoff

## Problem Statement

The Harness Lab landing page is accurate but not distinctive. It conveys "a workshop about AI coding agents on real software" — true, but generic. The blueprint has sharper, more memorable formulations (the role-shift model, continuation quality, the 5-phase day structure) that never cross over to the public page.

Meanwhile, the real depth lives on GitHub where most visitors won't go. The page undersells the workshop's substance and structure.

Two concrete problems:
1. **Clarity** — a visitor can't quickly grasp what makes this workshop different or how it's structured
2. **Content depth** — the interesting stuff is on GitHub, inaccessible to most visitors

## Context

The current page was rewritten on 2026-04-07 (see related brainstorm). The copy moved from a "repo-before-improvisation" framing to a "teamwork-with-agents" framing. This was the right direction but landed conservatively — the bolder Hero A direction from that brainstorm was softened.

The page currently shows:
- Hero: "A full-day workshop on how teams work with AI coding agents on real software"
- 3 principles (of 6 defined in the teaching spine)
- 4 detail columns (what it is, for participants, what stays private, blueprint link)
- Event code access card
- External links to blueprint and repo on GitHub

The page serves four audiences: participants before the event, participants during the event, potential clients, and fellow practitioners.

### Gap between page and blueprint

| Blueprint has | Page doesn't |
|---|---|
| Role-shift thesis: humans steer, agents execute, repo carries context, verification carries trust | Hinted at, never stated |
| Continuation quality as the success metric (not feature count) | Absent |
| The 5-phase day structure (opening → context → build → continuation shift → reveal) | Absent |
| The continuation shift — receiving team reads before editing | Absent |
| Habits 4–6 (boundaries create speed, cleanup is part of build, fix the system) | Only habits 1–3 shown |

## Chosen Approach

**Approach A+C hybrid:** Sharpen the existing single-scroll page and add an agent-native depth mechanism. No new sub-pages.

Two workstreams:
1. **Page sharpening** — tighter hero, workshop structure section, better principle selection
2. **Agent handoff** — llms.txt standard file + a nav CTA with copyable prompt for visitors' own AI agents

## Why This Approach

The page is a product page. It needs to sell the workshop (or at least make it legible) while also being the front door for active participants. Adding sub-pages fragments the experience and creates maintenance burden. Instead, sharpen what's there and use the agent handoff as the depth mechanism — on-brand for a workshop about AI coding agents.

### Rejected alternatives

- **Approach B (lean landing + /workshop sub-page):** Separation of concerns is nice but creates a new page to maintain and content that drifts from the blueprint. Overkill for the current stage.
- **Embedded AI chatbot:** Off-brand. The workshop teaches people to work with their own agents, not to depend on a vendor widget.
- **Full blueprint on the page:** Goes overboard. The page should convey structure and principles, not replicate the blueprint.

## Key Design Decisions

### Q1: Hero copy direction — RESOLVED

**Decision:** Sharpen the hero with a visitor-friendly version of the role-shift thesis. The current "full-day workshop on how teams work with AI coding agents" is accurate but generic. The new copy should convey what makes this workshop different — that it's about continuation quality, not just "using AI."

**Rationale:** The blueprint's sharpest language belongs on the page. But "does the repo speak for itself?" is insider language that means something after the workshop, not before. The role-shift thesis ("humans steer, agents execute, repo carries context, verification carries trust") is closer to visitor-friendly.

**Alternatives considered:** "Does the repo speak for itself?" as the tagline — rejected as too insider/technical for people who haven't done the workshop yet.

### Q2: Workshop structure section — RESOLVED

**Decision:** Add a compact section showing the 5 phases of the workshop day: Opening → Context is King → Build Phase → Continuation Shift → Reveal & Reflection. Titles and one-liners only. Highlight continuation quality as the success metric (not feature count) and the continuation shift as the distinctive mechanic.

**Rationale:** This is the biggest gap. Visitors can't see how the day is structured. A compact visual overview (timeline, cards, or numbered steps) gives enough to understand the flow without replicating the blueprint.

**Alternatives considered:** Showing the full blueprint content on-page — rejected as too much. Linking to GitHub only — rejected because visitors won't go there.

### Q3: Principles count — RESOLVED

**Decision:** Keep 3–4 principles on the page. The current three (map before motion, verify before you move on, work so others can continue) are good. May add one more if it earns its place. The remaining habits live in the blueprint.

**Rationale:** Six principles on a product page is too many. Three is a natural pattern. The rest are available via the agent handoff or GitHub for those who want depth.

**Alternatives considered:** Showing all 6 — rejected as too dense for a product page.

### Q4: Agent handoff mechanism — RESOLVED

**Decision:** Two-part approach:
1. **`llms.txt`** at the site root — follows the emerging standard (used by Anthropic, Vercel, Cloudflare, Stripe). Contains a curated summary of what Harness Lab is, links to the blueprint, principles, and repo. Points to content rather than duplicating it. Optionally a `llms-full.txt` with expanded blueprint content.
2. **Nav CTA** — a small icon in the header nav ("pro agenty" / "for agents") that opens a popover with a copyable prompt + repo URL. The prompt tells the visitor's agent where to look to explain the workshop in depth.

**Rationale:** llms.txt is the standard — agents are starting to auto-discover it. The nav CTA is the active, user-facing path for visitors who want to use their own agent. Together they cover passive discovery (bots) and active use (humans with agents). This is genuinely on-brand: a workshop about AI agents, with an agent-native info path.

**Alternatives considered:**
- Embedded chatbot — rejected, off-brand
- Full sub-page — rejected, unnecessary at this stage
- Just a GitHub link with "give this to your agent" — rejected, too passive and not distinctive

### Q5: No new sub-pages — RESOLVED

**Decision:** Keep the single-scroll landing page. The agent popover is the only new surface.

**Rationale:** Matches the "don't go overboard" constraint. The page is a product page, not a documentation site. If a sub-page is needed later, it can be added.

## Open Questions

- Exact hero copy wording (Czech + English) — needs drafting and iteration
- Which 3rd or 4th principle to add (if any) — review the teaching spine during planning
- Exact prompt text for the agent CTA — needs to be concise and effective
- llms.txt content: hand-write or generate from blueprint? How to keep in sync?
- Visual design of the workshop structure section — timeline? cards? numbered steps?
- Where exactly in the nav does the agent icon go? Before or after language switcher?
- Should the 5 phases use the internal names (e.g., "Context is King") or visitor-friendly labels?

## Out of Scope

- Social proof / testimonials (don't exist yet)
- Concrete participant experience examples (don't exist yet)
- Embedded AI chatbot
- Full blueprint replication on the page
- New sub-pages or routes
- Facilitator or participant dashboard changes

## Next Steps

- `/plan` to create an implementation plan from these decisions
- Consider `/compound` for the llms.txt pattern if it proves effective — could be reusable across Ondrej's projects
