---
title: "Agent-native depth mechanism: llms.txt + copyable prompt popover"
type: solution
date: 2026-04-10
domain: frontend
component: "public landing page, site header, agent handoff"
symptoms:
  - "Landing page undersells the workshop — real substance lives on GitHub where visitors won't go"
  - "No way for visitors to quickly get depth about the workshop via their own AI agent"
  - "Blueprint content is inaccessible to non-technical audiences who won't browse a GitHub repo"
root_cause: "The page served as both a product page and workshop runtime but had no depth mechanism beyond external GitHub links. The interesting content (day structure, teaching spine, principles) was only available in raw markdown files in the repo."
severity: low
related:
  - "../../brainstorms/2026-04-10-landing-page-sharpening-and-agent-handoff-brainstorm.md"
  - "../../plans/archive/2026-04-10-feat-landing-page-sharpening-and-agent-handoff-plan.md"
---

## Problem

The Harness Lab landing page was accurate but generic. The blueprint had sharper formulations (role-shift model, continuation quality, 5-phase day structure) that never crossed over to the public page. Meanwhile, sending visitors to GitHub for depth was a dead end for most audiences.

The challenge: how to provide depth without bloating a lean product page or duplicating content that lives canonically in the repo.

## Solution

Two-part agent-native handoff, plus page sharpening:

### 1. `llms.txt` at the site root

A static Markdown file in `dashboard/public/llms.txt` following the [llms.txt standard](https://llmstxt.org). Contains a curated summary of the workshop and links to blueprint files in the repo. Serves both passive discovery (AI agents auto-fetching) and active use (referenced in the copyable prompt).

**Key design choice:** The file *links to* blueprint content rather than duplicating it. This eliminates sync burden — the blueprint is the source of truth, the llms.txt is a curated index.

Notable adopters of llms.txt: Anthropic, Vercel, Cloudflare, Stripe, Cursor.

### 2. Agent popover in the header nav

A `"use client"` component (`agent-popover.tsx`) placed in the utility row of the site header alongside the language and theme switchers. Trigger is a `</>` icon + "pro agenty" / "for agents" label. Opens a popover with:

- Brief explanation of what to do
- A pre-written prompt referencing the blueprint repo URL
- A "copy to clipboard" button with brief confirmation feedback

**Key design choices:**
- **Not in the main nav** — placed in the utility row to avoid crowding the navigation
- **Not a chatbot** — deliberately sends visitors to their *own* agent, which is on-brand for a workshop that teaches people to work with AI agents
- **Minimal client island** — follows the `ThemeSwitcher` pattern: `useSyncExternalStore` for hydration safety, isolated `"use client"` component, everything else stays server-rendered
- **Click-outside-to-close** via a `mousedown` listener on `document`, cleaned up on unmount

### 3. Workshop structure section

A new `#structure` section between principles and details, showing the 5 workshop phases as a numbered list with titles and one-liners. Uses a `PhaseStep` primitive component (3-column grid: number, title, body). Ends with the continuation quality outcome line.

**Content sourced from `workshop-blueprint/day-structure.md`** but rewritten for a public audience. Internal labels (intermezzo, pre-rotation handoff gate) are omitted per `edit-boundaries.md`.

## Pattern: Agent-native depth without content duplication

The reusable insight:

1. **Keep the product page lean** — just enough to convey the value proposition
2. **Publish `llms.txt`** at the site root as a curated index (not a content dump)
3. **Link to canonical sources** from llms.txt rather than duplicating content
4. **Provide a human-facing CTA** that bridges visitors to their own AI agent with a pre-written prompt
5. **Make the CTA subtle** — utility row, not hero section. The audience that will use it will find it.

This pattern works especially well when:
- The product teaches or involves AI/agents (dog-fooding)
- Deep content already exists in a repo or docs site
- You want to avoid maintaining parallel content on the marketing page
- Your audience is technical enough to have an AI assistant available

## Technical notes

- `navigator.clipboard.writeText()` is supported in all modern browsers — no polyfill needed for this audience
- Static files in Next.js `public/` are served at the site root with proper caching
- The popover uses `useState` (not URL-driven state like admin dialogs) because it's a transient UI element, not a deep-linkable surface
- The agent prompt is built dynamically via `buildAgentPrompt()` in `public-page-view-model.ts` so it includes the actual blueprint repo URL from environment variables
