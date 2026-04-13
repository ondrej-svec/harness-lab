---
title: "Czech native-quality remediation"
type: review
date: 2026-04-13
scope: "Proof slice plus rollout for Czech native-quality cleanup"
status: complete
---

# Czech native-quality remediation

This note closes the native-quality cleanup tracked in [`docs/plans/2026-04-13-fix-czech-native-quality-audit-and-remediation-plan.md`](../../plans/2026-04-13-fix-czech-native-quality-audit-and-remediation-plan.md).

## Scope

Files touched:

- `workshop-content/agenda.json`
- `materials/locales/cs/coaching-codex.md`
- `materials/locales/cs/participant-resource-kit.md`
- `content/project-briefs/locales/cs/devtoolbox-cli.md`
- `content/project-briefs/locales/cs/doc-generator.md`
- `content/project-briefs/locales/cs/standup-bot.md`
- `content/challenge-cards/locales/cs/deck.md`
- `content/challenge-cards/locales/cs/print-spec.md`
- `content/facilitation/locales/cs/codex-setup-verification.md`
- `content/facilitation/locales/cs/master-guide.md`
- `content/talks/locales/cs/context-is-king.md`
- `content/talks/locales/cs/codex-demo-script.md`
- `scripts/content/verify-copy-editor.ts`
- `docs/workshop-content-qa.md`
- execution artifacts:
  - `docs/reviews/workshop-content/2026-04-13-czech-native-quality-remediation-ledger.md`

Locale coverage:

- Czech visible-surface workshop content
- Czech facilitator/talk support files
- verification harness for the Czech deterministic gate

## What changed

Proof slice decisions that propagated:

- keep real workshop and developer terms in English where they are load-bearing:
  - `workflow`
  - `review`
  - `skill`
  - `runbook`
  - `guides`
  - `sensors`
  - `AGENTS.md`
- rewrite borrowed backstage shorthand when Czech should carry the sentence:
  - `script` → `podklad`, `postup`, `sada otázek`
  - `safe move` → `bezpečný krok` or sentence rewrite around safe continuation
  - `summary text` → `souhrn`
  - `message` → `sdělení`
  - `delivery script`, `watch-fors`, `callout`, `tool demo` → natural Czech phrasing by context
- normalize participant-surface references:
  - actual UI-writing actions use `participant plocha`
  - rhetorical talk framing uses `plátno před vámi`
- remove half-translated visible labels:
  - `Challenge Cards` → `Karty výzev`
  - `Advanced` → `Pokročilé`
  - talk/demo Czech labels restored in `agenda.json`

High-signal examples:

- `Post-workshop reference` → `Tahák po workshopu`
- `sensor moment — feedback loop` → `Tady nastupuje sensor — zpětná vazba`
- `Pustíte tenhle krátký script` → `Pokaždé si projděte těchto pár otázek`
- `delivery script pro facilitátora` → `podklad pro facilitátora`
- `repo-readiness contrast` → `kontrast připravenosti repa`
- `Není to sales pitch.` → `Není to reklama.`

## Verification

Typography audit:

- reviewed Czech markdown scope: `0` errors, `1` warning
- warning left in place:
  - `content/talks/locales/cs/context-is-king.md`
  - heading `Scéna 4 — Lidé řídí. Agenti vykonávají.`
  - reason: protected phrase readability won over sentence-case normalization

Commands run:

- `bun ../heart-of-gold-toolkit/plugins/marvin/skills/copy-editor/scripts/copy-audit.ts --config .copy-editor.yaml --paths 'materials/locales/cs/**/*.md,content/project-briefs/locales/cs/**/*.md,content/challenge-cards/locales/cs/**/*.md,content/facilitation/locales/cs/**/*.md,content/talks/locales/cs/**/*.md,content/style-guide.md,content/style-examples.md,content/czech-editorial-review-checklist.md,content/czech-reject-list.md' --require-reviewed`
- `cd dashboard && npm run generate:content`
- `cd dashboard && npm run verify:content`

Content verification:

- `generate:content` passed
- `verify:content` passed
- generated views were refreshed from `workshop-content/agenda.json`

## Harness note

The repo-level copy-editor wrapper previously failed on bilingual `workshop-content/agenda.json` because the deterministic Czech layer applied NBSP rules to English strings inside the same JSON file.

Resolution in this slice:

- `scripts/content/verify-copy-editor.ts` now runs the deterministic CI gate on reviewed Czech locale markdown files
- `docs/workshop-content-qa.md` now documents the limitation explicitly
- agenda Czech remains covered by:
  - generated-view sync
  - scene-level human review
  - review-note signoff

This is a gate-fix, not permission to skip Czech review on `agenda.json`.

## Layer 2

Layer-2 suggestions considered: yes

Main judgment calls:

- preserve `workflow`, `review`, `guides`, `sensors`, `skill`, `runbook`
- prefer native Czech for non-technical workshop shorthand
- keep facilitator copy speakable rather than literal to English source
- align Czech terminology with actual participant UI labels where that prevents confusion

## Human signoff

Human Czech signoff still required for final workshop delivery quality, especially on:

- `workshop-content/agenda.json` opening/talk/demo slices
- `content/talks/locales/cs/*.md`
- `content/facilitation/locales/cs/*.md`

## Next safe move

If another Czech rollout touches agenda copy again, reuse the terminology decisions from this note and keep `verify-copy-editor.ts` scoped until the copy-audit engine gains locale-aware segmentation for bilingual JSON.
