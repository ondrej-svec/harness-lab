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

Current maintained contract for agenda-backed workshop content:

- [`dashboard/lib/workshop-blueprint-agenda.json`](../dashboard/lib/workshop-blueprint-agenda.json) is the structural backbone and the currently maintained Czech delivery source
- [`dashboard/lib/workshop-blueprint-localized-content.ts`](../dashboard/lib/workshop-blueprint-localized-content.ts) stores the reviewed English locale keyed by the same phase, scene, and block ids

Until a full single-locale canonical migration lands, treat those two files as one maintained source pair. Do not edit one without checking the other.

## Current Blueprint Source Pair

For the structured dashboard/presenter agenda model, the maintained source pair currently lives in:

- [`dashboard/lib/workshop-blueprint-agenda.json`](../dashboard/lib/workshop-blueprint-agenda.json)
- [`dashboard/lib/workshop-blueprint-localized-content.ts`](../dashboard/lib/workshop-blueprint-localized-content.ts)

Together these files are the runtime-facing workshop blueprint backbone used by:

- workshop-state creation and reset
- control-room agenda rendering
- presenter scene defaults
- participant fallback guidance derived from agenda content

The public-readable workshop-method mirror in [`workshop-blueprint/agenda.json`](../workshop-blueprint/agenda.json) is a human-readable blueprint artifact. It is not the runtime-facing structured agenda source.

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
