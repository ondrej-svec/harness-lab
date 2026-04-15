---
title: "docs: public homepage copy rewrite"
type: plan
date: 2026-04-07
status: complete
brainstorm: ../brainstorms/2026-04-07-public-homepage-copy-brainstorm.md
confidence: high
---

# Public Homepage Copy Rewrite Plan

Rewrite the public homepage copy so it explains Harness Lab as a workshop about disciplined team work with AI coding agents, rather than leading with internal `repo` or architecture language.

## Problem Statement

The current homepage copy in [`dashboard/lib/ui-language.ts`](../../dashboard/lib/ui-language.ts) is directionally true but framed around the wrong protagonist.

It currently foregrounds:

- `repo`
- internal boundary language
- architecture-adjacent phrasing such as "veřejná vstupní vrstva"

That creates three problems:

- the page explains mechanics better than it explains what Harness Lab is
- the Czech reads as more system-designed than naturally written
- the workshop’s distinct value, namely disciplined long-term work with AI coding agents, gets buried under supporting concepts

The rewrite needs to keep the substance of the workshop while changing the message hierarchy:

- first explain the workshop in human terms
- then show how it differs from generic AI workshop framing
- keep `repo`, `context`, `verification`, and `handoff` visible only as supporting practices

## Proposed Solution

Update the public homepage copy surface in place, keeping the current layout and component structure intact.

The implementation should:

1. replace the hero with a clearer team-and-agents framing
2. rewrite the principle cards from artifact-first language to work-first language
3. simplify the `co to je` and footer copy so they sound like natural Czech rather than architecture notes
4. keep the English strings aligned with the new framing, even if Czech remains the primary voice target
5. update Playwright assertions and visual baselines that currently lock the old copy in place

## Detail Level

This is a **standard** plan because the scope is bounded to the public copy surface, but the change still needs deliberate message hierarchy, bilingual consistency, and verification updates.

## Decision Rationale

### Why rewrite in place rather than restructure the page first

- The core problem is the wording, not the layout.
- The relevant strings are already centralized in [`dashboard/lib/ui-language.ts`](../../dashboard/lib/ui-language.ts), which makes a targeted rewrite feasible.
- Changing structure and copy at the same time would make it harder to tell whether the improvement came from framing or from layout changes.

### Why lead with teamwork and AI coding agents

- That is the clearest truthful explanation of the workshop.
- It matches the brainstorm’s chosen framing and the user’s correction of the earlier copy.
- It describes the work people are learning to do, not just the artifacts they leave behind.

### Why demote `repo` language instead of removing it entirely

- `Repo clarity` remains an important workshop practice.
- It just should not act as the headline identity of Harness Lab.
- Keeping it in supporting copy preserves the method without making the artifact feel like the main subject.

### Why include test and snapshot updates in a copy plan

- [`dashboard/e2e/dashboard.spec.ts`](../../dashboard/e2e/dashboard.spec.ts) already asserts specific homepage strings.
- The public mobile screenshot baseline will likely shift because hero and principle copy lengths affect layout.
- In this repo, even copy-only changes should preserve the existing trust boundary between content and rendered verification.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The homepage copy surface is primarily controlled from [`dashboard/lib/ui-language.ts`](../../dashboard/lib/ui-language.ts) | Verified | Search results show hero, principle, details, and footer strings centralized there |
| No layout change is required to materially improve the message | Verified | The user’s critique and the brainstorm both focus on framing and wording rather than structure |
| The existing public page layout can absorb revised copy without becoming unusably cramped on mobile | Unverified | Likely, but longer or sharper phrasing may require screenshot review and minor trimming |
| English copy should remain conceptually aligned even if it is not polished as deeply as Czech in the same pass | Verified | The page already supports explicit English mode and Playwright covers it |
| Exact-string Playwright assertions should be updated rather than removed | Verified | Those assertions are part of the current public-surface trust boundary |
| The word `chaos` can appear in public-facing Czech without sounding too rhetorical | Unverified | The brainstorm accepted this as a possible contrast line, but it still needs editorial judgment during drafting |

Unverified assumptions become explicit execution checks below.

## Risk Analysis

### Risk: the rewrite becomes too slogan-like

If the copy leans too hard into contrast language, it may sound like an AI-generated manifesto rather than a credible workshop page.

Mitigation:

- keep the lead sentence direct and factual
- use sharper language only in one supporting line, not everywhere
- read the Czech aloud before accepting the final draft

### Risk: the page still sounds internal after the first rewrite

If architecture terms remain in the hero, details, or footer, the page may still read like system documentation.

Mitigation:

- review the whole public surface as one narrative, not string by string
- explicitly remove phrases such as "veřejná vstupní vrstva" from the public copy path

### Risk: mobile layout regresses because the new copy is longer

If the new strings expand too much, the hero or principle cards may wrap awkwardly and invalidate the existing snapshot baseline.

Mitigation:

- keep Czech sentences compact
- check the existing public mobile Playwright snapshot after the rewrite
- trim wording before considering layout changes

### Risk: Czech and English drift into different product messages

If Czech gets the new framing while English preserves the old `repo`-first framing, the product identity becomes inconsistent across languages.

Mitigation:

- treat the English strings as conceptual parity work, not an afterthought
- update both language blocks in the same implementation pass

## Implementation Tasks

1. **Inventory the copy surface**
- [x] Map every public-facing string on the homepage that participates in the framing: hero, principle cards, `co to je`, participant-access helper copy where needed, and footer.
- [x] Mark which current strings are primarily internal/architectural and should be rewritten or simplified.

2. **Draft the Czech rewrite**
- [x] Rewrite the Czech hero to lead with team work with AI coding agents rather than `repo` language.
- [x] Replace the three principle cards with work-first language that emphasizes clarity, verification, and continuation.
- [x] Rewrite the `co to je` and footer copy in natural Czech with no architecture-document tone.
- [x] Do one editorial pass specifically for spoken naturalness and anti-AI phrasing.

3. **Align the English copy**
- [x] Update the English hero, principle cards, details, and footer so they match the revised product framing.
- [x] Keep English concise enough to avoid unnecessary mobile layout expansion.

4. **Update verification artifacts**
- [x] Replace exact-string assertions in [`dashboard/e2e/dashboard.spec.ts`](../../dashboard/e2e/dashboard.spec.ts) that currently reference the old hero and principle copy.
- [x] Review whether the English-mode assertions need parallel updates.
- [x] Regenerate the public mobile screenshot baseline only after the copy is stable.

5. **Validate the rendered result**
- [x] Confirm the new hero answers "What is Harness Lab?" in one pass without relying on deeper sections.
- [x] Confirm the page still reads as calm, precise Czech with a little edge, not as sales copy.
- [x] Confirm no public-facing line still relies on `repo` or boundary language as the main frame.

## Acceptance Criteria

- The Czech hero on the public homepage describes Harness Lab as a workshop about team work with AI coding agents, not as a workshop about `repo` work or internal system boundaries.
- The public principle cards are rewritten around the way of working, not around artifact-first headlines like `repo před improvizací`.
- The `co to je` and footer copy read as natural public-facing Czech and no longer use architecture-document phrasing such as "veřejná vstupní vrstva."
- The English homepage copy communicates the same core framing as the Czech version.
- [`dashboard/e2e/dashboard.spec.ts`](../../dashboard/e2e/dashboard.spec.ts) is updated so the browser suite verifies the revised copy rather than pinning the old messaging.
- The public mobile visual baseline is updated only if the rewrite materially changes rendered wrapping, and the resulting page remains legible on mobile.

## References

- Brainstorm: [2026-04-07-public-homepage-copy-brainstorm.md](../brainstorms/2026-04-07-public-homepage-copy-brainstorm.md)
- Copy source: [ui-language.ts](../../dashboard/lib/ui-language.ts)
- Public page rendering: [page.tsx](../../dashboard/app/page.tsx)
- Browser verification: [dashboard.spec.ts](../../dashboard/e2e/dashboard.spec.ts)
- Voice guidance: [style-guide.md](../../content/style-guide.md)
- Voice examples: [style-examples.md](../../content/style-examples.md)
