---
title: "refactor: unified bilingual content model"
type: plan
date: 2026-04-10
status: in_progress
brainstorm: ../brainstorms/2026-04-10-unified-bilingual-content-model-brainstorm.md
confidence: medium
---

# Unified Bilingual Content Model Plan

Collapse the three drifting workshop content stores into a two-tier bilingual model where English is canonical, Czech is a reviewed adaptation, both languages live side-by-side per content node, and generated views replace hand-maintained duplicates.

## Problem Statement

Three separate stores describe the same workshop (`workshop-blueprint/`, `dashboard/lib/workshop-blueprint-agenda.json`, `dashboard/lib/workshop-blueprint-localized-content.ts`) plus `content/` authored sources and `workshop-skill/` participant-facing text. When one changes, the others can silently fall behind. The prior localization plan started an "English canonical" migration but left it incomplete. The current guard is a prose rule ("do not edit one without checking the other") — the failure mode the copy-editor plan just spent a full session demonstrating.

## Proposed Solution

Two-tier bilingual content model per the brainstorm:

- **Tier 1 (structured)**: single bilingual JSON at `workshop-content/agenda.json` with `en`/`cs` per content node + `cs_reviewed` staleness flag. Generated views for dashboard (language-specific runtime JSON) and public blueprint (English markdown).
- **Tier 2 (long-form)**: paired markdown files with `cs_reviewed` frontmatter flag and sync checker enforcement. Talks, facilitation guides, briefs, cards, skill content, materials.
- **Both tiers**: build-time validation, staleness flags, copy-editor auditing.

The dashboard's current overlay-merge pattern (`workshop-data.ts` reads Czech agenda + English localized-content and merges at runtime) is replaced by a simpler direct import of the pre-generated language-specific JSON.

## Design Properties

- **Multilingual by construction.** Adding a third language (e.g. German) is additive: new language key per Tier 1 node (`de`), new `locales/de/` for Tier 2, new `de_reviewed` flag, new language profile in the copy-editor. No structural changes required.
- **English owns, Czech adapts.** English is authored first. Czech is a reviewed adaptation that may diverge in tone and idiom. The `cs_reviewed` flag surfaces when Czech needs attention after an English change.
- **Generated files are never hand-edited.** Dashboard runtime JSON and public blueprint markdown are emitted by the generator. A pre-commit check or CI guard flags hand-edits to generated files.
- **Scene content and talk content are independently authored.** Scenes in Tier 1 may cover the same topic as talks in Tier 2 but are adapted for room projection. Cross-reference alignment is reviewer-level, not build-level.

## Detailed Plan Level

This is a **detailed** plan: migration touches the dashboard runtime, introduces a new build step, restructures the content layout, and replaces files that multiple consumers depend on.

## Implementation Tasks

### Phase 0 — Schema design and validation

- [x] Design the Tier 1 bilingual JSON schema. Key decisions:
  - `en`/`cs` split at the **phase level** (each phase has `en: {label, goal, roomSummary, ...}` and `cs: {...}`) with scenes and blocks nested INSIDE each language block. This keeps each language's content tree self-contained and readable.
  - `cs_reviewed: boolean` per phase and per scene. When `false`, the Czech content for that node needs review after an English change.
  - Top-level `meta` section with `en`/`cs` for workshop title, subtitle, principles.
  - Version field (`schemaVersion: 3`) so consumers can detect format changes.
- [x] Write a TypeScript type definition for the bilingual schema at `dashboard/lib/types/bilingual-agenda.ts` (consumed by the generator and optionally by the dashboard for type-checking).
- [x] Validate the schema handles every field currently in `agenda.json` and `localized-content.ts` — no field left behind. Produce a checklist of all fields from both sources.

Exit: the schema is documented, typed, and verified against current content.

### Phase 1 — Migration script

- [ ] Write `scripts/content/migrate-to-bilingual.ts` — one-time Bun script that:
  - Reads `dashboard/lib/workshop-blueprint-agenda.json` (Czech source)
  - Reads `dashboard/lib/workshop-blueprint-localized-content.ts` (English source — parse the exported object)
  - Merges into the bilingual schema: Czech fields → `cs`, English fields → `en`, matched by ID
  - Sets `cs_reviewed: true` on all nodes (both languages are reviewed as of the current copy-editor pass)
  - Handles orphans: IDs present in one source but not the other get flagged with a `TODO` comment and `cs_reviewed: false`
  - Writes `workshop-content/agenda.json` (the new bilingual source)
- [ ] Run the migration. Verify the output has every phase, scene, and block from both sources.
- [ ] Spot-check 3–5 scenes manually: open the bilingual source and confirm the `en` and `cs` fields match the current content.

Exit: `workshop-content/agenda.json` exists with all content from both sources, verified.

### Phase 2 — Generator

- [ ] Write `scripts/content/generate-views.ts` — Bun script that:
  - Reads `workshop-content/agenda.json` (bilingual source)
  - Validates structure: every node has both `en` and `cs`, no empty required fields
  - Reports `cs_reviewed: false` nodes as warnings (not blocking — content may be in-flight)
  - Emits:
    - `dashboard/lib/generated/agenda-cs.json` — Czech-only runtime JSON (same shape as current `agenda.json` but without the `en` side)
    - `dashboard/lib/generated/agenda-en.json` — English-only runtime JSON
    - `workshop-blueprint/agenda.json` — public-readable English-only JSON (replacing the current hand-maintained one)
  - Exits non-zero if validation fails (missing fields, schema errors)
- [ ] Wire the generator into the build: `package.json` script `generate:content` that runs before `npm run build` and before `npm run dev`.
- [ ] Add `dashboard/lib/generated/` to `.gitignore` (generated artifacts, not committed). OR: commit them for CI simplicity and add a check that they match the generator output. **Decision needed:** gitignore vs committed-generated. Recommendation: **commit them** so CI and Vercel builds don't need to run the generator, and add a `verify:content` script that confirms the committed generated files match the generator output.
- [ ] Add a `verify:content` script that re-runs the generator to a temp dir and diffs against the committed generated files. Wire into `npm run lint` or CI.

Exit: generator produces correct views from the bilingual source, wired into build.

### Phase 3 — Dashboard import migration

- [ ] Update `dashboard/lib/workshop-data.ts`:
  - Replace `import blueprintAgenda from "./workshop-blueprint-agenda.json"` with `import blueprintAgenda from "./generated/agenda-cs.json"` (or dynamically based on `contentLang` via a thin resolver)
  - Remove `import { workshopBlueprintLocalizedContent } from "./workshop-blueprint-localized-content"`
  - Simplify or remove the `getLocalizedBlueprintPhase`, `getLocalizedWorkshopMeta`, `getLocalizedWorkshopInventory`, and `getLocalizedPresenterBlocks` overlay-merge functions — the generated views are already language-complete, no merging needed
  - The `contentLang` resolution logic stays; it now picks which generated JSON to import
- [ ] Update `dashboard/lib/workshop-store.test.ts` and `dashboard/lib/workshop-data.test.ts` to import from the generated views.
- [ ] Run `npm run test` and `npm run build` — must pass.
- [ ] Verify the dashboard renders correctly in both Czech and English mode (manual browser check or Playwright e2e).

Exit: dashboard consumes the generated views, tests pass, both languages render correctly.

### Phase 4 — Delete old files, update references

- [ ] Delete `dashboard/lib/workshop-blueprint-agenda.json` (Czech content now in bilingual source).
- [ ] Delete `dashboard/lib/workshop-blueprint-localized-content.ts` (English content now in bilingual source).
- [ ] Move the hand-authored `workshop-blueprint/agenda.json` out of the way (it's now generated).
- [ ] Update all references to the deleted files in `docs/`, `AGENTS.md`, `.copy-editor.yaml`, `docs/workshop-content-language-architecture.md`, `docs/workshop-content-qa.md`, and any plan docs.
- [ ] Run the full test suite + build + Playwright e2e — must pass.

Exit: old files gone, no broken references, tests green.

### Phase 5 — Tier 2 sync checker

- [ ] Write `scripts/content/check-tier2-sync.ts` — Bun script that:
  - For every Tier 2 Czech file (`content/**/*.md`, `workshop-skill/**/*.md`, `materials/**/*.md`, excluding `locales/en/`), verifies a matching English file exists in `locales/en/`
  - For every English file, verifies a matching Czech file exists
  - Computes a content hash per file
  - Reads `cs_reviewed` from the Czech file's YAML frontmatter (or assumes `true` if not present — backwards compatible)
  - Reports mismatches: Czech file exists without English counterpart, English without Czech, `cs_reviewed: false` files
  - Exits non-zero on missing counterparts (blocking); exits zero with warnings on `cs_reviewed: false` (informational)
- [ ] Add `cs_reviewed: true` frontmatter to each existing Tier 2 Czech file that doesn't already have it.
- [ ] Wire `check-tier2-sync` into `npm run lint` or the `verify:content` script.
- [ ] Run the checker. Fix any missing English counterparts (create stubs or confirm they genuinely don't need English).

Exit: Tier 2 sync checker runs, all Czech files have English counterparts, `cs_reviewed` frontmatter present.

### Phase 5.5 — Git hooks and CI enforcement

The scripts from Phases 2 and 5 need to run **automatically**, not only when someone remembers to lint. This phase wires them into git hooks and CI so drift is caught before it reaches `main`.

- [ ] **Pre-commit hook** (via `.husky/pre-commit` or a simple `.git/hooks/pre-commit` script):
  - Runs `bun scripts/content/generate-views.ts --verify` (a `--verify` flag that generates to a temp dir and diffs against the committed generated files, without overwriting). If the diff is non-empty, the commit is blocked with a message: *"Generated content files are out of date. Run `npm run generate:content` first, or edit `workshop-content/agenda.json` instead of the generated files."*
  - Fast: only runs when staged files include anything under `workshop-content/` or `dashboard/lib/generated/`. Skip the check otherwise (don't slow down unrelated commits).
- [ ] **Pre-push hook** (`.husky/pre-push` or `.git/hooks/pre-push`):
  - Runs `bun scripts/content/check-tier2-sync.ts`. Blocks the push if any Czech file is missing its English counterpart (hard error). Warns (but does not block) on `cs_reviewed: false` files — content may be in-flight.
  - Also runs `verify:content` as a safety net in case the pre-commit hook was bypassed.
- [ ] **GitHub Actions CI workflow** (`.github/workflows/content-integrity.yml`):
  - Triggers on: push to `main`, pull requests targeting `main`.
  - Steps:
    1. Checkout
    2. `bun install` (for scripts)
    3. `bun scripts/content/generate-views.ts --verify` — fails if generated files don't match source
    4. `bun scripts/content/check-tier2-sync.ts` — fails on missing counterparts
    5. `bun ../heart-of-gold-toolkit/plugins/marvin/skills/copy-editor/scripts/copy-audit.ts --config .copy-editor.yaml` — fails on Layer 1 errors
  - This is the real enforcement. Everything else (hooks, lint) can be bypassed; CI cannot.
- [ ] **`cs_reviewed: false` threshold decision**: CI warns on stale nodes but does NOT block. Rationale: English-first changes are expected to land before Czech adaptation catches up. Blocking on staleness would prevent incremental English authoring. The warning ensures visibility; the Layer 2 in-slice doctrine ensures the adaptation happens in the same work stream.
- [ ] Wire `npm run verify:content` as a single command that runs both `generate-views.ts --verify` and `check-tier2-sync.ts` — used by hooks, CI, and manual `npm run lint`.
- [ ] Document the hooks in `AGENTS.md` Build And Test section: what each hook checks, how to bypass in emergency (`--no-verify` with documented reason), and how to add the hooks after a fresh clone (if using husky: `npx husky install`; if using raw git hooks: document the script).

Exit: pre-commit blocks generated-file drift, pre-push blocks missing locale pairs, CI catches everything on every push/PR. `cs_reviewed: false` is visible but non-blocking.

### Phase 6 — Copy-editor and doc updates

- [ ] Update `.copy-editor.yaml`:
  - Tier 1 path: `workshop-content/agenda.json` replaces the old `dashboard/lib/workshop-blueprint-agenda.json`
  - Remove the old `dashboard/lib/workshop-blueprint-localized-content.ts` path
  - Add `dashboard/lib/generated/` to exclude (generated, not hand-edited)
  - Add surface profile entries for the new paths
- [ ] Update `docs/workshop-content-language-architecture.md` to describe the new two-tier model:
  - Replace the "maintained source pair" section with the bilingual source + generated views model
  - Update the authoring rule, delivery rule, skill rule, review rule, and maintenance rule
- [ ] Update `docs/workshop-content-qa.md`:
  - Add `content validation clean` as a named blocking check (the `verify:content` script)
  - Update the review-note template to include `cs_reviewed` staleness check
- [ ] Update `AGENTS.md`:
  - Task routing for workshop content points at `workshop-content/agenda.json` and the generator
  - Build And Test includes `npm run generate:content` and `npm run verify:content`
  - Add a working rule: "Do not hand-edit files under `dashboard/lib/generated/` or `workshop-blueprint/agenda.json` — edit `workshop-content/agenda.json` and run the generator"
- [ ] Write an ADR (`docs/adr/2026-04-10-unified-bilingual-content-model.md`) formalizing the two-tier decision. Reference the brainstorm.
- [ ] Sync the portable workshop bundle with `node harness-cli/scripts/sync-workshop-bundle.mjs`.

Exit: all docs reflect the new model, copy-editor config updated, ADR written, bundle synced.

### Phase 7 — Public blueprint generation

- [ ] Extend `scripts/content/generate-views.ts` to emit the public blueprint markdown files:
  - `workshop-blueprint/day-structure.md` — generated from the `en` side of the Tier 1 agenda (phase labels, goals, room summaries)
  - `workshop-blueprint/agenda.json` — already generated in Phase 2
- [ ] Decide which `workshop-blueprint/` files stay hand-authored (method docs like `teaching-spine.md`, `operator-guide.md`, `control-surfaces.md`, `edit-boundaries.md`) vs. generated. Recommendation: the METHOD docs stay hand-authored (they describe the workshop pedagogy, not the content); only `day-structure.md` and `agenda.json` are generated from content.
- [ ] Add `# This file is generated — do not edit` headers to generated files.
- [ ] Update `workshop-blueprint/README.md` to explain which files are generated and which are hand-authored.

Exit: public blueprint is partially generated from the bilingual source, hand-authored method docs stay as-is.

## Acceptance Criteria

- `workshop-content/agenda.json` exists as the single bilingual source for structured workshop content, with `en` and `cs` per content node and `cs_reviewed` flags.
- `dashboard/lib/generated/agenda-cs.json` and `agenda-en.json` are generated views that the dashboard imports. The overlay-merge machinery in `workshop-data.ts` is removed or substantially simplified.
- `workshop-blueprint/agenda.json` and `workshop-blueprint/day-structure.md` are generated from the bilingual source.
- The old `dashboard/lib/workshop-blueprint-agenda.json` and `dashboard/lib/workshop-blueprint-localized-content.ts` are deleted.
- The Tier 2 sync checker validates all Czech/English markdown pairs and surfaces `cs_reviewed: false` files.
- `npm run verify:content` passes on the committed state.
- `npm run test`, `npm run build`, and Playwright e2e all pass.
- The dashboard renders correctly in both Czech and English mode.
- The copy-editor `marvin:copy-editor` audits the bilingual source with both language profiles.
- Adding a third language is a documented, additive operation (new key per node, new locale directory, new language profile) — no structural changes required.
- An ADR formalizes the content model decision.

## Decision Rationale

### Why commit generated files (not gitignore)

Vercel builds and CI shouldn't need to run the generator as a prerequisite. Committing the generated views means the build works from a clean clone. The `verify:content` script guards against drift between the source and the committed views — it re-generates to a temp dir and diffs. If they don't match, CI fails.

### Why `en`/`cs` split at the phase level (not per-field)

Per-field split (`{title: {en: "...", cs: "..."}, body: {en: "...", cs: "..."}}`) maximizes granularity but makes the JSON nearly unreadable — every field is a nested object. Per-phase split (`{en: {title, body, notes}, cs: {title, body, notes}}`) keeps each language block as a coherent, readable document. The generator extracts language-specific views without per-field drilling.

### Why keep method docs hand-authored

`teaching-spine.md`, `operator-guide.md`, `control-surfaces.md`, and `edit-boundaries.md` describe the workshop PEDAGOGY — they're not derived from scene content. Generating them from the bilingual source would require encoding pedagogical narrative into JSON fields, which is the wrong abstraction. These docs are Tier 2 in spirit (long-form prose) even though they live in `workshop-blueprint/`.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| The bilingual schema can represent every field in both current source files without loss | Unverified | Phase 0 task: produce a complete field checklist and validate |
| The dashboard's `contentLang` switching works against pre-generated JSON without the overlay merge | Verified | `workshop-data.ts` already resolves `contentLang` before accessing content; switching the import source is a mechanical change |
| The generator can parse `localized-content.ts` to extract English content | Unverified | The TS file exports a plain object literal; parsing with regex or AST is feasible but needs a spike |
| Committing generated files doesn't cause merge conflicts in team workflows | Verified | Only one person (Ondrej) currently edits content; future teams would re-generate after merging |
| Tier 2 Czech files all have English counterparts | Unverified | Phase 5 task: run the sync checker and create missing stubs |
| The public blueprint `day-structure.md` can be meaningfully generated from structured phase data | Unverified | Phase 7 task: may need manual enrichment for narrative flow |

## Risk Analysis

### Risk: Migration script produces incorrect bilingual source

The one-time merge of two files into one is the highest-risk operation. An incorrect merge corrupts the canonical source.

Mitigation: Phase 1 includes manual spot-checks of 3–5 scenes. The migration script logs every ID match and orphan. The old files are deleted only AFTER the dashboard is verified working against generated views (Phase 4 depends on Phase 3).

### Risk: Generated views drift from committed versions

If someone runs the generator locally with different formatting options, the committed generated files change for non-content reasons (whitespace, key ordering).

Mitigation: the generator uses deterministic JSON.stringify with consistent formatting. The `verify:content` script catches any drift in CI.

### Risk: `localized-content.ts` parsing fails

The English source is a TypeScript file, not JSON. Parsing it requires either evaluating the TS or extracting the object literal.

Mitigation: since the file exports a single object literal with no dynamic computation, a regex-based extractor or Bun's native TS evaluation (`import()`) handles it. Phase 1 spike this early.

### Risk: Public blueprint generation produces low-quality markdown

Generating `day-structure.md` from phase labels and goals may produce a flat, mechanical document that's worse than the current hand-authored version.

Mitigation: Phase 7 evaluates this explicitly. If generation quality is insufficient, `day-structure.md` stays hand-authored (Tier 2) and the public blueprint generation is limited to `agenda.json` only.

### Risk: Tier 2 sync checker is too noisy for existing files

Many existing Czech files may lack English counterparts (the English locales were incomplete historically).

Mitigation: Phase 5 creates missing English stubs. The checker distinguishes "missing counterpart" (blocking) from "cs_reviewed: false" (informational). Initial run will produce a list of gaps to address.

## Phased Implementation

| Phase | Depends on | Summary |
|---|---|---|
| 0 | — | Schema design and type definition |
| 1 | 0 | Migration script: merge agenda.json + localized-content.ts → bilingual source |
| 2 | 1 | Generator: bilingual source → language-specific views |
| 3 | 2 | Dashboard import migration: use generated views |
| 4 | 3 | Delete old files, update references |
| 5 | 0 | Tier 2 sync checker (can run in parallel with 1–4) |
| 5.5 | 2, 5 | Git hooks (pre-commit, pre-push) + GitHub Actions CI workflow |
| 6 | 4, 5, 5.5 | Copy-editor, doc, and ADR updates |
| 7 | 4 | Public blueprint generation (optional — evaluate quality) |

Phase 5 is independent of Phases 1–4 and can run in parallel. Phase 5.5 depends on the generator (Phase 2) and the sync checker (Phase 5) existing so the hooks can call them. All other phases are sequential.

## References

- [`docs/brainstorms/2026-04-10-unified-bilingual-content-model-brainstorm.md`](../brainstorms/2026-04-10-unified-bilingual-content-model-brainstorm.md) — the brainstorm that produced these decisions
- [`docs/plans/2026-04-08-feat-workshop-content-localization-and-canonical-english-authoring-plan.md`](./2026-04-08-feat-workshop-content-localization-and-canonical-english-authoring-plan.md) — the prior localization plan (completed, migration tasks partially open)
- [`docs/workshop-content-language-architecture.md`](../workshop-content-language-architecture.md) — current architecture doc (to be updated in Phase 6)
- [`docs/plans/2026-04-09-feat-czech-copy-quality-foundation-plan.md`](./2026-04-09-feat-czech-copy-quality-foundation-plan.md) — the copy-editor plan that surfaced this architectural need
- [`dashboard/lib/workshop-data.ts`](../../dashboard/lib/workshop-data.ts) — current dashboard content consumption (to be simplified in Phase 3)
