---
title: "Unified bilingual content model"
type: brainstorm
date: 2026-04-10
participants: [Ondrej, Heart of Gold]
related:
  - docs/plans/archive/2026-04-08-feat-workshop-content-localization-and-canonical-english-authoring-plan.md
  - docs/workshop-content-language-architecture.md
  - docs/adr/2026-04-08-portable-participant-skill-distribution.md
  - docs/plans/archive/2026-04-09-feat-czech-copy-quality-foundation-plan.md
---

# Unified Bilingual Content Model

## Problem Statement

Harness Lab has three separate content stores describing the same workshop:

1. `workshop-blueprint/` — public-readable English description of the workshop method, with its own `agenda.json`
2. `dashboard/lib/workshop-blueprint-agenda.json` — Czech runtime delivery backbone (scenes, blocks, phases, facilitator notes)
3. `dashboard/lib/workshop-blueprint-localized-content.ts` — English runtime delivery, keyed by the same IDs as the Czech agenda

Plus `content/` (talks, facilitation guides, project briefs, challenge cards), `workshop-skill/` (participant-facing AI skill content), and `materials/` (printed handouts) — each with Czech at the root and English in `locales/en/` subdirectories.

When someone edits Czech, English can silently fall behind. When someone rewrites a talk, the corresponding agenda scenes may not reflect the rewrite. When the runtime agenda evolves, the public blueprint drifts. The existing architecture doc (`docs/workshop-content-language-architecture.md`) names this problem and says "do not edit one without checking the other" — a prose rule with no enforcement mechanism.

The copy-editor system shipped in `docs/plans/archive/2026-04-09-feat-czech-copy-quality-foundation-plan.md` makes the existing content better within the current architecture. But the architecture itself makes drift inevitable rather than impossible.

The prior localization plan (`2026-04-08-feat-workshop-content-localization-and-canonical-english-authoring-plan.md`) decided "English is the canonical authoring language, Czech is a first-class reviewed delivery locale." Several migration tasks in that plan remain unchecked. The stated architecture (English canonical) and the actual content flow (Czech is authored first, English is derived) disagree. That mismatch is the structural source of drift.

## Context

### What exists

- The `uiLang` / `contentLang` separation is already designed and implemented in the dashboard — product chrome language and workshop content language are independent concerns.
- The portable bundle ADR eliminates one drift vector: the CLI bundle is generated from canonical sources, not maintained independently.
- The copy-editor skill (`marvin:copy-editor`) provides a two-layer review system (deterministic Layer 1 + judgment Layer 2) but currently audits the Czech and English files as separate targets, not as a bilingual pair.
- The `localized-content.ts` file is already keyed by the same IDs as `agenda.json` — the pairing structure exists but as two files instead of one.

### What's been tried

- The localization plan (2026-04-08) started the "English canonical" migration but didn't finish it.
- The workshop-content-qa.md doc added "do not edit one without checking the other" as a blocking check, but it's human-enforced.
- The CLI `--content-lang` alignment plan (2026-04-09) fixed a specific drift between CLI docs and the server API.
- No automated drift detection between the content stores exists.

## Chosen Approach

**Two-tier bilingual content model with English as the canonical authoring language.**

Not all workshop content has the same shape. Structured content (scenes, blocks, checkpoint questions) fits a bilingual JSON model. Long-form prose (talks, facilitation guides, project briefs) fits paired markdown files. Both tiers need the same enforcement guarantee: when English changes, Czech is flagged as potentially stale.

### Tier 1 — Structured bilingual JSON

For content that has IDs, typed fields, and nested structures (currently `agenda.json` + `localized-content.ts`):

- **One bilingual JSON file** where each content node has `en` and `cs` fields side by side.
- **English is authored first.** Czech is a reviewed adaptation that can diverge in tone and idiom but tracks the same meaning.
- **Staleness tracking** via a `cs_reviewed` flag per node. When English changes, the validator flips `cs_reviewed` to `false`. The Czech editor sees exactly what needs attention.
- **Generated views** for each consumer:
  - Czech-only runtime JSON for the dashboard (selected by `contentLang`)
  - English-only runtime JSON for the dashboard
  - English markdown for the public `workshop-blueprint/` (no longer hand-maintained)
- **The generator validates** at build time: every node has both languages, no empty required fields, stale flags surfaced as warnings.

Example bilingual node:

```json
{
  "id": "opening-welcome",
  "cs_reviewed": true,
  "en": {
    "title": "Welcome and day opening",
    "body": "Today is not about being fastest...",
    "facilitatorNotes": ["Start with the day promise..."]
  },
  "cs": {
    "title": "Uvítání a otevření dne",
    "body": "Dnes nejde o to být nejrychlejší...",
    "facilitatorNotes": ["Začněte slibem dne..."]
  }
}
```

What merges into Tier 1:
- `dashboard/lib/workshop-blueprint-agenda.json` (Czech side → `cs` fields)
- `dashboard/lib/workshop-blueprint-localized-content.ts` (English side → `en` fields)
- Both files are deleted after migration.

What becomes a generated artifact:
- `workshop-blueprint/agenda.json` and other public blueprint files — generated from the `en` side of the bilingual source.

### Tier 2 — Paired markdown files

For long-form prose that doesn't fit inside JSON strings:

- **Two files per content piece**: Czech at root, English in `locales/en/`, following the existing convention.
- **Same enforcement guarantee**: a sync checker verifies every Czech file has an English counterpart (and vice versa), compares content hashes, and flags files where one language changed without the other being reviewed.
- **Staleness tracking** via the same `cs_reviewed` pattern — but at file level. A frontmatter field `cs_reviewed: true` in the Czech file gets flipped to `false` by the sync checker when the English source changes without a corresponding Czech update.

What stays Tier 2:
- `content/talks/*.md` — spoken talk scripts (may genuinely differ between Czech and English delivery)
- `content/facilitation/*.md` — 300-line narrative facilitation guide
- `content/project-briefs/*.md` — prose-heavy, read as documents by participants
- `content/challenge-cards/deck.md` — card deck, markdown format is good for reading
- `workshop-skill/*.md` — AI skill content, must stay markdown for agent consumption
- `materials/*.md` — participant handouts

### Enforcement layer (same for both tiers)

```
scripts/content/
  validate-content.ts      ← runs on both tiers at build time
    Tier 1: every node has en + cs, no empty fields, stale flags surfaced
    Tier 2: every cs file has en counterpart, hash comparison, stale flags
  generate-views.ts        ← Tier 1 only
    emits: cs-runtime.json, en-runtime.json, public-blueprint.md
```

The copy-editor skill (`marvin:copy-editor`) plugs into both tiers:
- Tier 1: audits the bilingual source with both language profiles
- Tier 2: audits each file with its matching language profile

`.copy-editor.yaml` points at both tiers. Surface profiles (`participant`, `presenter`, `hybrid`) apply within each tier.

## Why This Approach

### Why English canonical (not Czech canonical or co-canonical)

- The workshop method is designed to be reusable internationally. English is the language other facilitators, forks, and adaptations will start from.
- Czech is the DELIVERY language for Ondrej's specific workshops. A reviewed Czech adaptation is higher quality than a translated-from-Czech English — the English should be the authored-with-care version, and Czech should be the version adapted with Czech-native editorial judgment.
- Co-canonical (both independently authored) would require twice the editorial effort with no derivation relationship. Smaller team = need to leverage one source.

### Why two tiers (not one model for everything)

- Structured content fits JSON. Long-form prose fits markdown. Forcing talks and facilitation guides into JSON strings would destroy the authoring experience.
- Both tiers get the SAME enforcement guarantee (staleness flags, build-time validation, copy-editor auditing). The model differs; the discipline doesn't.
- The alternative (everything in one giant bilingual JSON) would produce an unreadable file and make prose authoring hostile.
- The other alternative (everything as paired markdown) would lose the structural typing of scenes and blocks, making the dashboard import fragile.

### Why generated views (not direct import of the bilingual source)

- The dashboard should ship only the language it needs for `contentLang`, not both. Generated views are language-specific.
- The public blueprint should be a clean English document, not a bilingual JSON the reader has to mentally filter.
- Generation is the enforcement mechanism — it runs validation, flags staleness, and produces verified-correct output. The build step is a feature.
- Generated files have a clear "do not hand-edit" contract. If someone edits a generated file, a pre-commit check catches it.

### Why `cs_reviewed` flags (not hash comparison or manual tracking)

- Flags are in the data — visible to every reader, every tool, every agent. No external state to maintain.
- When a reviewer opens the bilingual source and sees `cs_reviewed: false`, they know exactly what to do.
- Hash comparison requires git history and is invisible in the file itself. It answers "did something change?" but not "was the change reviewed?"
- Manual tracking relies on discipline, which is the failure mode the current architecture already demonstrates.

### What was rejected

- **Option 3 (keep current split, add sync)**: detected drift but didn't prevent it. The root cause (two separate files) stayed. A sync script is the same shape as the prose rule that already failed.
- **Option 1 (one file, multiple consumers)**: structurally sound but forced every consumer to parse a bilingual monolith. Generated views are cleaner for each consumer's needs.
- **Co-canonical model**: higher maintenance, no derivation leverage. Not practical for a small team.
- **Machine translation at runtime**: explicitly excluded. Workshop delivery quality requires human-reviewed Czech, not generated Czech.

## Key Design Decisions

### Q1: Which language is canonical? — RESOLVED
**Decision:** English is the canonical authoring language. Czech is a reviewed adaptation.
**Rationale:** International reusability. The workshop method should be forkable and adaptable in English. Czech quality is ensured by human review of the adaptation, not by making Czech the source.
**Alternatives rejected:** Czech canonical (matches reality today but doesn't support international reuse), co-canonical (too expensive for a small team).

### Q2: One model or two tiers? — RESOLVED
**Decision:** Two tiers. Structured content (scenes, blocks) in bilingual JSON. Long-form prose (talks, guides, briefs) in paired markdown files.
**Rationale:** Different content shapes need different authoring experiences. Both get the same enforcement guarantee.
**Alternatives rejected:** Everything in JSON (hostile authoring for prose), everything in paired markdown (loses structural typing for scenes/blocks).

### Q3: How to surface staleness? — RESOLVED
**Decision:** `cs_reviewed` flag in the data (Tier 1: per-node field in JSON; Tier 2: per-file frontmatter field in markdown). When English changes, the flag flips to `false`.
**Rationale:** Visible in the data, auditable, no external state. The reviewer sees what needs attention.
**Alternatives rejected:** Hash comparison (invisible, requires git), manual tracking (the current failure mode).

### Q4: What happens to the public blueprint? — RESOLVED
**Decision:** `workshop-blueprint/` becomes a generated artifact from the `en` side of the Tier 1 bilingual source. No longer hand-maintained.
**Rationale:** Eliminates the third drift vector. The public blueprint is always consistent with the runtime content because it's derived from the same source.

### Q5: Where do project briefs and challenge cards go? — RESOLVED
**Decision:** Stay Tier 2 (paired markdown files). They're prose-heavy and participants interact with them as documents.
**Rationale:** Simpler model — one pattern for all `content/` markdown. The structural template they follow (Problem, User stories, Arch notes, Done when, First step) is enforced by editorial convention, not by JSON schema.

### Q6: Scene content vs. talk content alignment — RESOLVED
**Decision:** Independently authored. Scenes in Tier 1 are self-contained. Talks in Tier 2 are the deeper reference. Alignment is reviewer-level, not build-level.
**Rationale:** Scenes are adapted for projection (short, visual, room-facing). Talks are spoken prose. They serve different purposes even when they cover the same topic. The sync checker can flag when a talk file changes and its corresponding scenes haven't been reviewed, but it doesn't auto-propagate.

## Open Questions

1. **Tier 1 JSON schema** — exact shape of the bilingual source: how deep does the `en`/`cs` split go? Per-scene? Per-block? Per-field? Need to balance granularity (per-field staleness tracking) vs. readability (don't make the JSON unbrowsable).
2. **Generator implementation** — where does it live? (`scripts/content/` in harness-lab, or reusable in Heart of Gold?) What does it emit for the public blueprint — one big markdown or multiple files matching the current `workshop-blueprint/` layout?
3. **Migration script** — one-time tool that merges `agenda.json` + `localized-content.ts` into the bilingual source. How to handle IDs that exist in one file but not the other? How to set initial `cs_reviewed` flags?
4. **Dashboard import changes** — TypeScript consumption of generated views. Does the dashboard import a JSON file at build time (static) or read it at runtime (dynamic)? How does `contentLang` switching work against generated views?
5. **Tier 2 sync checker** — how does the hash comparison work? Per-file content hash stored where? Frontmatter `cs_reviewed: true|false` managed how — manually by the reviewer, or automatically by the checker?
6. **Public blueprint non-scene content** — some files in `workshop-blueprint/` (like `teaching-spine.md`, `operator-guide.md`) are hand-authored English docs about the workshop METHOD, not derived from scene content. Do they stay hand-authored, or do they also get pulled into the bilingual model?
7. **Copy-editor integration** — how does `.copy-editor.yaml` point at both tiers? Does the config need a new field for Tier 1 structured content, or does the existing path-glob model work?

## Out of Scope

- Machine translation at runtime or build time — Czech is always human-reviewed
- Redesigning the dashboard UI to support real-time language switching (the `uiLang`/`contentLang` separation already handles this)
- Moving Tier 2 content into a CMS or database — files in the repo remain the source of truth
- Full English style guide authoring (Phase 7 of the copy-quality plan) — separate work that can proceed independently
- Expanding to languages beyond Czech and English — the model supports it structurally but no third language is planned

## Next Steps

- `/deep-thought:plan` to design the implementation: migration script, bilingual schema, generator, dashboard wiring, Tier 2 sync checker, copy-editor integration
- Formalize as an ADR — the content model decision currently lives only in a plan and an architecture doc, not in the ADR set
- Consider `/marvin:compound` to capture the "two-tier bilingual model" pattern as a reusable solution for other projects
