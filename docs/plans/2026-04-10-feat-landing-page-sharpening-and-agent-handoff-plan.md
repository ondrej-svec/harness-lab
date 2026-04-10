---
title: "feat: Landing page sharpening and agent handoff"
type: plan
date: 2026-04-10
status: complete
brainstorm: docs/brainstorms/2026-04-10-landing-page-sharpening-and-agent-handoff-brainstorm.md
confidence: high
---

# Landing page sharpening and agent handoff

Sharpen the public landing page to clearly convey what makes Harness Lab distinctive, add a compact workshop structure section, and introduce an agent-native depth mechanism (llms.txt + nav CTA with copyable prompt).

## Problem Statement

The landing page is accurate but generic. It says "a full-day workshop on how teams work with AI coding agents on real software" — true, but could describe a dozen workshops. The blueprint's sharpest formulations (role-shift model, continuation quality, 5-phase day structure) never cross over. Meanwhile, the real substance lives on GitHub where most visitors won't go.

## Target End State

- A visitor understands what Harness Lab is and what makes it different within 10 seconds
- Participants find the event code instantly (already works — preserve this)
- The workshop's 5-phase structure is visible on the page as a compact section
- An `llms.txt` file at the site root describes the workshop for AI agents
- A nav icon opens a popover with a copyable prompt visitors can paste into their own AI assistant
- All copy is bilingual (Czech primary, English)

## Scope and Non-Goals

**In scope:**
- Hero copy sharpening (both languages)
- New workshop structure section (5 phases, compact)
- Principles section review (keep 3–4, currently 3)
- llms.txt and optional llms-full.txt at site root
- Agent nav CTA with popover and clipboard copy
- Navigation link adjustments

**Non-goals:**
- Social proof / testimonials (don't exist yet)
- New sub-pages or routes (single-scroll stays)
- Facilitator or participant dashboard changes
- Embedded AI chatbot
- Full blueprint replication on-page

## Proposed Solution

Two parallel workstreams that share the copy layer:

**Workstream 1 — Page sharpening:**
Update `ui-language.ts` with stronger hero copy drawing from the blueprint's role-shift thesis. Add a new `#structure` section between principles and details showing the 5 workshop phases as a compact visual sequence. Keep 3 principles (current selection is good).

**Workstream 2 — Agent handoff:**
Create a static `llms.txt` in `dashboard/public/` that summarizes the workshop and links to the blueprint repo. Add a `"use client"` popover component triggered by a nav icon, containing a pre-written prompt and a "copy to clipboard" button. Follow the `ThemeSwitcher` pattern for the client island.

## Implementation Tasks

### Phase 1: Copy and content preparation

- [x] **1.1** Draft sharpened hero copy (Czech + English) incorporating the role-shift thesis. The current `heroLead` ("Celodenní workshop o tom, jak v týmu pracovat s AI coding agenty na skutečném softwaru") should convey the *difference* — continuation quality, not just "using AI." The `heroBody` should land the role-shift model more directly than the current hint.
- [x] **1.2** Draft workshop structure section copy — 5 phases, each with a short visitor-friendly title and one-line description (Czech + English). Source from `workshop-blueprint/day-structure.md` but rewrite for a public audience. Avoid internal labels (e.g., "intermezzo-1", "pre-rotation handoff gate").
  - Phase 1: Opening and framing
  - Phase 2: Context is King
  - Phase 3: Build Phase
  - Phase 4: Continuation shift
  - Phase 5: Reveal and reflection
- [x] **1.3** Draft `llms.txt` content — follow the standard: H1 with project name, blockquote summary, sections with links to blueprint, repo, and key resources. Keep it curated, not exhaustive.
- [x] **1.4** Draft the agent CTA prompt text — the pre-written prompt visitors copy. Should reference the llms.txt URL and/or the blueprint repo URL. Keep under 3 sentences.

### Phase 2: Copy strings and page structure (depends on Phase 1)

- [x] **2.1** Add new copy keys to `publicCopy` in `dashboard/lib/ui-language.ts`:
  - `structureEyebrow`, `structureTitle` — section labels
  - `structurePhase1Title`, `structurePhase1Body` through `structurePhase5Title`, `structurePhase5Body` — the 5 phases
  - `structureOutcome` — the continuation quality success metric line
  - `navAgents` — label for the agent nav item ("pro agenty" / "for agents")
  - `agentPopoverTitle`, `agentPopoverBody`, `agentPopoverPrompt`, `agentPopoverCopy`, `agentPopoverCopied` — popover UI strings
  - Updated `heroLead` and `heroBody` with sharpened copy
- [x] **2.2** Add the `#structure` section to `PublicView` in `dashboard/app/page.tsx` — insert between `#principles` and `#details`. Use a numbered sequence or timeline layout. Each phase gets a title and one-line body. End with the `structureOutcome` line.
- [x] **2.3** Update `heroLead` and `heroBody` copy in the hero section (strings already updated in 2.1, no JSX change needed unless layout adjusts).

### Phase 3: Agent handoff (can run in parallel with Phase 2)

- [x] **3.1** Create `dashboard/public/llms.txt` — static file served at `/llms.txt`. Follows the llms.txt standard format. Links to blueprint repo, public repo, and key blueprint files.
- [x] **3.2** Create `AgentPopover` client component in `dashboard/app/components/agent-popover.tsx`:
  - `"use client"` directive
  - Small trigger button/icon for the nav (use a lucide-react icon, e.g., `Bot` or `Cpu`)
  - Popover panel with: title, brief explanation, the pre-written prompt in a copyable block, and a "Copy" button using `navigator.clipboard.writeText()`
  - Copy button shows "Copied!" feedback briefly (useState + setTimeout pattern)
  - Follows the `ThemeSwitcher` isolation pattern — minimal client island
- [x] **3.3** Add the agent nav item to `buildSiteHeaderNavLinks` in `dashboard/lib/public-page-view-model.ts` — add it as the last item before the admin link. Pass the `AgentPopover` component into the nav rather than a plain `<a>` link.
- [x] **3.4** Wire `AgentPopover` into `SiteHeader` in `dashboard/app/components/site-header.tsx` — handle the special case where a nav item renders a component instead of a link.

### Phase 4: Navigation and cleanup (depends on Phases 2–3)

- [x] **4.1** Add `#structure` to the nav links in `buildSiteHeaderNavLinks` and `buildPublicFooterLinks` — insert between `#principles` and `#details`.
- [x] **4.2** Review nav item count — currently 7 items for public view. Adding `#structure` and the agent icon makes 9. Consider whether `#details` can be folded into other sections or removed. The brainstorm noted nav clutter as a secondary concern.
- [x] **4.3** Update Playwright test assertions if any exist for the public page copy or navigation structure.
- [x] **4.4** Visual review — check the page in both light and dark mode, both languages, desktop and mobile. The structure section should feel like a natural part of the scroll, not an interruption.

## Decision Rationale

**Single-scroll vs. sub-pages:** The page is a product page for a single product (the workshop). Sub-pages fragment the experience and create maintenance burden. One scroll with sharper content and an agent escape hatch for depth is the right tradeoff at this stage.

**llms.txt as static file vs. API route:** Static file in `public/` is simpler, cacheable, and follows convention. The content changes rarely (when the blueprint changes). No need for dynamic generation.

**Client island pattern for popover:** The public page is server-rendered. The popover needs `useState` for open/close and clipboard feedback. Isolating it as a `"use client"` component follows the existing `ThemeSwitcher` pattern and keeps the rest server-rendered.

**Principles count stays at 3:** The brainstorm considered adding a 4th. The current three (map before motion, verify before you move on, work so others can continue) form a natural narrative arc. Adding a 4th risks diluting the pattern. The remaining habits are accessible via the agent handoff and GitHub.

## Constraints and Boundaries

- All public copy must be bilingual (Czech + English) in `publicCopy`
- Content from `edit-boundaries.md` private list must not appear on the public page (dates, venues, clients, facilitator intervention details)
- The event code access card must remain immediately visible — it's the primary action for participants
- Design rules from `docs/public-and-participant-design-rules.md` apply: access path is primary, principles visible early but compressed, page feels calm but not empty

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| `navigator.clipboard.writeText()` works across target browsers | Verified | Supported in all modern browsers, the target audience uses modern browsers |
| Static files in `dashboard/public/` are served at the site root | Verified | Standard Next.js behavior, already used for other static assets |
| The 5 phase names from `day-structure.md` are stable | Verified | Blueprint was recently finalized and these are structural, not cosmetic |
| Popover doesn't need URL-driven state (unlike admin dialogs) | Verified | It's a transient UI element, not a deep-linkable surface. useState is appropriate. |
| llms.txt format is plain Markdown, no special server config needed | Verified | Just a static `.txt` file served as-is |

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Hero copy sharpening changes the messaging in a way that doesn't land | Medium | Medium | Draft copy in Phase 1 for review before implementing. The copy is the hardest part — get it right before touching code. |
| Nav gets too crowded with structure + agent items | Medium | Low | Task 4.2 explicitly reviews this. May consolidate or drop a current item. |
| llms.txt content drifts from blueprint over time | Low | Low | The file links to the blueprint rather than duplicating it. Minimal sync burden. |
| Popover feels out of place on a calm, server-rendered page | Low | Medium | Follow existing design system. Small trigger, clean popover. Visual review in task 4.4. |

## Acceptance Criteria

- [ ] A first-time visitor can identify what Harness Lab is, how the workshop day is structured, and what makes it different — without scrolling past the first two sections
- [ ] The 5 workshop phases are visible on the page with titles and one-line descriptions
- [ ] `/llms.txt` returns a valid Markdown document following the llms.txt standard
- [ ] The agent nav icon opens a popover with a copyable prompt; clicking "Copy" copies to clipboard and shows confirmation
- [ ] All new copy exists in both Czech and English
- [ ] The event code access card remains immediately visible and functional
- [ ] Page passes visual review in light/dark mode, cs/en, desktop/mobile
- [ ] No content from the private boundary list appears on the public page
