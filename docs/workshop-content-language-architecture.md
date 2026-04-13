# Workshop Content Language Architecture

This document defines how Harness Lab handles language across the dashboard, presenter surface, workshop blueprint, and `workshop` skill.

## Why This Exists

Harness Lab already supports dashboard UI language switching, but workshop content has historically been authored as one raw language stream.

That caused two recurring failures:

- UI chrome and workshop content could drift into accidental mixed-language screens
- weak source content quality propagated across dashboard, presenter, and skill surfaces because they shared the same authored copy

The fix is to treat product chrome language and workshop-content language as separate concerns.

## Core Terms

### `uiLang`

Language of product chrome:

- navigation
- labels
- buttons
- status pills
- system helper text

Examples:

- `live control`
- `agenda`
- `open`

Today this is handled primarily in [`dashboard/lib/ui-language.ts`](../dashboard/lib/ui-language.ts).

### `contentLang`

Language of workshop content delivered to the room or participant:

- workshop title/subtitle when derived from blueprint content
- agenda item titles
- goals and room summaries
- facilitator prompts
- watch-fors
- checkpoint questions
- presenter scene titles and bodies
- participant-facing workshop guidance in the skill when it comes from shared workshop content

Examples:

- `Úvod a naladění`
- `Context is King`
- room-safe presenter copy

## Authoring Rule

Target model:

- English is the long-term reusable source language for shared workshop content
- Czech remains a first-class reviewed delivery locale
- runtime machine translation is not the default path for workshop-copy delivery

### Directory convention — enforced 2026-04-13

The file system matches the rule verbatim. Every bilingual participant-facing file follows this layout:

- **English canonical at the root:** `content/talks/context-is-king.md`, `content/project-briefs/standup-bot.md`, `materials/coaching-codex.md`, and so on.
- **Czech reviewed translation in `locales/cs/`:** `content/talks/locales/cs/context-is-king.md`, `content/project-briefs/locales/cs/standup-bot.md`, `materials/locales/cs/coaching-codex.md`.

When you edit content, start with the English root file. Then apply the same change to the Czech translation under `locales/cs/`. A contributor opening the directory should see English first — the architecture rule is encoded in the file system, not only in this document.

Four Czech-only meta-references stay at the root as exceptions because they are *about* Czech writing and would be nonsensical in English: `content/style-guide.md`, `content/style-examples.md`, `content/czech-reject-list.md`, `content/czech-editorial-review-checklist.md`. `content/codex-craft.md` and `materials/README.md` are likewise single-language at the root by design.

**Verified 2026-04-13.** Completed under `docs/plans/2026-04-13-refactor-language-flip-and-czech-review-plan.md`. The flip moved 12 bilingual pairs via `git mv` (preserving history), updated `scripts/content/check-tier2-sync.ts` and `scripts/content/generate-briefs-inventory.ts`, and re-segmented `.copy-editor.lock.json`. The full Czech review covered 28 agenda scenes across 3 batches plus standalone reviews of the 12 flipped files — seven memos live under `docs/reviews/workshop-content/2026-04-13-czech-*.md`.

## Bilingual Content Source

The single bilingual source for structured workshop content is:

- [`workshop-content/agenda.json`](../workshop-content/agenda.json) — `en`/`cs` content per phase, scene, and block with `cs_reviewed` staleness flags

Generated views (never hand-edited):

- `dashboard/lib/generated/agenda-cs.json` — Czech-only runtime view
- `dashboard/lib/generated/agenda-en.json` — English-only runtime view
- `workshop-blueprint/agenda.json` — public-readable English blueprint

To regenerate: `npm run generate:content`. To verify committed views match source: `npm run verify:content`.

The dashboard imports the generated views directly — no overlay-merge at runtime. The `contentLang` resolution picks which generated JSON to load.

## Delivery Rule

The system must be able to represent these combinations intentionally:

- English UI + Czech workshop content
- Czech UI + English workshop content
- Czech UI + Czech workshop content
- English UI + English workshop content

If a screen mixes languages, that should be because the chosen `uiLang` and `contentLang` differ deliberately, not because content leaked through an unlocalized field.

## Skill Rule

The `workshop` skill should be treated as another client of the same workshop-content model.

That means:

- command semantics remain language-independent
- the skill should prefer live runtime content when available
- fallback bundle content should follow the same content-language model as the dashboard
- when live runtime `contentLang` is unavailable, the skill should resolve delivery language from the user's language when possible and otherwise default to English rather than inheriting the raw language of a fallback source file
- the skill must not become a separate authored language stream that drifts from the dashboard/presenter system

## Review Rule

Before shipping participant-facing Czech workshop content, review it against:

- [`content/style-guide.md`](../content/style-guide.md)
- [`content/style-examples.md`](../content/style-examples.md)

Questions:

1. Is the Czech natural and readable for a Czech developer?
2. Are English technical terms used deliberately rather than lazily mixed in?
3. Does the wording sound like a calm peer, not system scaffolding?
4. Would the same workshop moment sound coherent in dashboard, presenter, and skill form?

For visible Czech room or participant surfaces, also confirm:

- a Czech facilitator could say the line aloud without mentally rewriting it
- titles, callouts, and participant prompts sound like workshop language for people, not internal content taxonomy
- borrowed English is limited to literal commands, file/tool names, and genuinely established developer terms
- if a cleaner Czech phrasing exists, internal shorthand such as `launch` or `check` does not survive onto the visible surface by inertia
- the blocking review is owned by a Czech-fluent human reviewer; AI review may assist, but it does not replace signoff

Treat visible Czech copy as failed if it is structurally correct but still reads like translated workshop shorthand.

## Maintenance Rule

When changing shared workshop content:

1. update the maintained blueprint source pair
2. update reviewed localized variants affected by the change
3. if visible Czech delivery changed, run the Czech checklist plus a short visible-surface/spoken-readability note under `docs/reviews/workshop-content/`
4. verify dashboard, presenter, and skill consumers still render the same workshop moment coherently
5. update any docs that describe the source-of-truth path if the ownership model changes
