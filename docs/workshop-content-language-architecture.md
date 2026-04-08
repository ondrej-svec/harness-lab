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

Shared structured workshop content should be authored canonically in English and localized deliberately for delivery locales such as Czech.

Implications:

- English is the reusable source language for the shared workshop-content system
- Czech remains a first-class reviewed locale for actual workshop delivery
- runtime machine translation is not the default path for workshop-copy delivery
- translations belong in the repo and should be reviewed like product copy, not generated ad hoc in the room

## Current Canonical Blueprint Path

For the structured dashboard/presenter agenda model, the canonical source currently lives in:

- [`dashboard/lib/workshop-blueprint-agenda.json`](../dashboard/lib/workshop-blueprint-agenda.json)

This file is the runtime-facing workshop blueprint backbone used by:

- workshop-state creation and reset
- control-room agenda rendering
- presenter scene defaults
- participant fallback guidance derived from agenda content

The public-readable workshop-method summary in [`workshop-blueprint/agenda.json`](../workshop-blueprint/agenda.json) should be treated as a public blueprint artifact, not the runtime-facing canonical structured agenda source.

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

## Maintenance Rule

When changing shared workshop content:

1. update the canonical structured blueprint source
2. update reviewed localized variants
3. verify dashboard/presenter/skill consumers still render the same workshop moment coherently
4. update any docs that describe the source-of-truth path if the ownership model changes
