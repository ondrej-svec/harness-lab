# ADR: Unified Bilingual Content Model

**Date:** 2026-04-10
**Status:** Accepted
**Deciders:** Ondrej

## Context

Workshop content was split across three files that described the same thing:

- `dashboard/lib/workshop-blueprint-agenda.json` — Czech structured content
- `dashboard/lib/workshop-blueprint-localized-content.ts` — English overlay
- `workshop-blueprint/agenda.json` — hand-maintained public blueprint

When one changed, the others could silently fall behind. The runtime merged Czech and English at import time with overlay functions, creating implicit coupling and making it hard to verify that both languages were complete.

## Decision

Collapse all three into a **two-tier bilingual model**:

**Tier 1 (structured):** Single bilingual JSON at `workshop-content/agenda.json` with `en`/`cs` per content node. The `en`/`cs` split is at the **phase level** — each language block is self-contained and readable. `cs_reviewed: boolean` flags surface staleness after English changes.

**Tier 2 (long-form):** Paired markdown files with `cs_reviewed` frontmatter. Czech files at base path, English in `locales/en/`.

**Generated views:** `dashboard/lib/generated/agenda-cs.json`, `agenda-en.json`, and `workshop-blueprint/agenda.json` are emitted by the generator. Never hand-edited.

**Enforcement:** Pre-commit hook blocks generated-file drift. Pre-push hook blocks missing locale pairs. CI catches everything.

## Consequences

- **Positive:** Single source of truth. No silent drift. Adding a third language (e.g. German) is additive: new key per node, new locale directory.
- **Positive:** Dashboard import simplified — no overlay-merge at runtime.
- **Negative:** Bilingual JSON is larger (~4000 lines). Editing requires understanding the two-tier structure.
- **Negative:** Generator must run after source changes. Mitigated by hooks and CI.

## References

- [Brainstorm](../brainstorms/2026-04-10-unified-bilingual-content-model-brainstorm.md)
- [Plan](../plans/2026-04-10-refactor-unified-bilingual-content-model-plan.md)
