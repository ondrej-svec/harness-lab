# workshop-content/

## Mission

Canonical bilingual source of truth for workshop agenda scenes. All rendered views — dashboard, presenter screen, participant briefs, and generated content mirrors — are derived from this directory. **Never edit generated files.**

## Read First

Before editing anything under `workshop-content/`:

1. [`../docs/workshop-content-language-architecture.md`](../docs/workshop-content-language-architecture.md) — English-canonical source + reviewed Czech delivery model.
2. [`../docs/workshop-content-qa.md`](../docs/workshop-content-qa.md) — Layer 1 typography + Layer 2 judgment review rules.
3. [`../docs/workshop-content-authority-and-citation.md`](../docs/workshop-content-authority-and-citation.md) — quote-localization integrity, citation discipline.
4. [`../.copy-editor.yaml`](../.copy-editor.yaml) — `marvin:copy-editor` include scope and voice doctrine.
5. [`../content/style-guide.md`](../content/style-guide.md) and [`../content/czech-editorial-review-checklist.md`](../content/czech-editorial-review-checklist.md) for Czech voice rules.

## Task Routing

- Agenda edits → edit `agenda.json` directly, never `dashboard/lib/generated/` or `workshop-blueprint/agenda.json`.
- After any agenda edit → run `cd dashboard && npm run generate:content && npm run verify:content`. The pre-commit and pre-push hooks enforce this but the in-slice run is faster feedback.
- Czech-visible-surface edits → run the copy-editor Layer 1 typography audit in the same slice: `bun ../heart-of-gold-toolkit/plugins/marvin/skills/copy-editor/scripts/copy-audit.ts --config .copy-editor.yaml` (see `AGENTS.md:128`). Layer 2 judgment suggestions require a Czech-fluent human reviewer.
- Structural schema changes → add or update an ADR under `docs/adr/` before touching consumers.
- Propagating to already-created workshop instances → use `harness workshop reset-instance` (see root `AGENTS.md:130`).

## Verification Boundary

- `npm run verify:content` is the trust boundary for agenda source/view consistency. It runs in pre-commit (staged), pre-push (tier 2 locale sync), and CI.
- `workshop-content/agenda.json` is the only authored source. Any divergence from its generated mirrors is a bug, not a feature.
- Czech quality always requires a human reviewer — automated typography is Layer 1 only.

## Done Criteria

1. `npm run generate:content && npm run verify:content` passes.
2. If the change touches Czech visible surfaces, the copy-editor Layer 1 audit returns zero error-severity findings and a Czech reviewer has signed off on Layer 2.
3. Linked ADR or design doc still matches reality.
4. No hand-edits exist in `dashboard/lib/generated/` or `workshop-blueprint/agenda.json`.
