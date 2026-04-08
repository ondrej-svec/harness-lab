---
title: "feat: workshop content localization and canonical English authoring model"
type: plan
date: 2026-04-08
status: completed
confidence: medium
---

# Workshop Content Localization And Canonical English Authoring Plan

Introduce an explicit language architecture for Harness Lab so workshop content is authored canonically in English, delivered in reviewed per-workshop locales such as Czech, and consumed consistently across dashboard, presenter, and `workshop` skill surfaces.

## Problem Statement

Harness Lab currently has UI-language switching, but not workshop-content localization.

Today:

- dashboard chrome is localized through [`dashboard/lib/ui-language.ts`](../../dashboard/lib/ui-language.ts)
- workshop agenda titles, room summaries, presenter scenes, and fallback participant guidance are copied directly from the structured agenda content model
- the canonical structured agenda is effectively stored in [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json), while multiple docs still point to [`workshop-blueprint/agenda.json`](../../workshop-blueprint/agenda.json) as the canonical source
- the `workshop` skill is explicitly Czech-first today rather than language-aware
- the portable participant bundle ships authored content as-is, so language drift propagates into installed skill behavior too
- existing Czech content quality is uneven and often violates the repo’s own style rules for natural Czech and disciplined Czech-English mixing

This creates three concrete failures:

1. language mixing is accidental rather than intentional
2. content quality problems replicate across every surface because one weak source feeds all of them
3. the system cannot cleanly support “English canonical content, curated Czech delivery” as a product rule

This matters because Harness Lab teaches disciplined system design. The workshop’s own content system should not rely on implicit language leakage or manual one-off rewrites.

## Proposed Solution

Adopt one explicit language model across blueprint, runtime, dashboard, presenter, and skill:

1. **Canonical authored workshop content is English**
   - structured agenda content, presenter scenes, and other shared workshop-copy artifacts are authored first in English
   - English becomes the stable source for future workshop variants and translation work

2. **Localized delivery is explicit and reviewed**
   - Czech becomes a first-class reviewed locale, not an accidental byproduct of the current seed files
   - no runtime machine translation for workshop-copy delivery
   - translations are stored in the repo and versioned with the canonical source

3. **UI language and workshop content language are separate concepts**
   - `uiLang` controls product chrome such as navigation, labels, buttons, and status wording
   - `contentLang` controls agenda titles, room summaries, presenter scenes, participant-facing workshop guidance, and skill-delivered workshop content
   - a facilitator may view English UI while operating a Czech-content workshop, or vice versa, deliberately

4. **The `workshop` skill becomes language-aware but command-stable**
   - skill commands and logic remain language-independent
   - participant-facing responses choose language from explicit workshop/content settings plus user override where appropriate
   - fallback bundled content uses the same reviewed localized sources as the dashboard rather than a separate authored stream

5. **Blueprint content ownership is consolidated**
   - one structured blueprint path becomes canonical for shared workshop content
   - older thin or duplicate agenda artifacts become derived, deprecated, or removed once migration is complete
   - docs are updated so contributors know where canonical content lives and how localization is maintained

## Detailed Plan Level

This is a **detailed** plan because it changes the workshop content source-of-truth model, runtime data contract, participant/facilitator product behavior, portable skill packaging, and copy-governance workflow at the same time.

## Progress Update

Implemented on 2026-04-08:

- language architecture note added in [`docs/workshop-content-language-architecture.md`](../workshop-content-language-architecture.md)
- canonical runtime-facing structured agenda path clarified in maintainer docs
- `WorkshopMeta.contentLang` added with runtime normalization and instance create/update/reset support
- admin workspace can set per-instance `contentLang`
- structured agenda and presenter scenes now resolve through a locale-aware English overlay keyed by stable blueprint ids
- participant room and presenter surfaces render English agenda/scene content for English-content workshop instances
- workshop briefs, challenges, setup paths, and default participant-room ticker content now resolve through the same locale-aware content layer
- the workshop read model now projects English blueprint content for existing English-content instances instead of depending only on freshly created state
- agenda editor/detail labels no longer bypass shared admin localization copy
- `workshop` skill and packaging docs no longer describe a universal Czech-only delivery model
- portable bundle now ships reviewed English fallback docs for core participant guidance, project briefs, and challenge cards alongside the existing Czech authored material
- packaged and repo-local generated workshop bundles are synchronized with the updated localization contract and verified again
- Czech editorial review now has an explicit repo-native gate in [`content/czech-editorial-review-checklist.md`](../../content/czech-editorial-review-checklist.md)
- the shared English agenda/presenter overlay in [`dashboard/lib/workshop-blueprint-localized-content.ts`](../../dashboard/lib/workshop-blueprint-localized-content.ts) has received a stronger editorial rewrite for goals, room summaries, and facilitator/participant scene copy
- the canonical Czech structured agenda in [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json) has now been rewritten phase-by-phase to remove mixed-language workshop copy, weak calques, and English scene labels that leaked into Czech-content workshops
- the core Czech fallback and learner-facing sources in [`workshop-skill/`](../../workshop-skill/), [`materials/`](../../materials/), [`content/challenge-cards/`](../../content/challenge-cards/), and [`content/facilitation/`](../../content/facilitation/) have been tightened to match the stronger blueprint vocabulary instead of reintroducing stale mixed-language phrasing
- learner-resource docs, talk source docs, and facilitator content examples are now aligned with the stronger English/Czech vocabulary, so the remaining drift is limited to dev-facing English docs and intentionally English technical terms

Completed:

- the long-form learner and talk docs that should track the strengthened English and Czech phrasing have been updated
- the core participant-facing and facilitator-facing Czech sources covered by this plan now pass through the explicit editorial checklist and no longer rely on the earlier mixed-language wording
- review follow-up remediation is closed: top-level participant onboarding now routes through the locale-aware `workshop` interface and the bundled blueprint README no longer depends on GitHub `main` links for runtime-source references

## Implementation Tasks

- [x] Lock the language architecture and source-of-truth model.
  - Define the product vocabulary: `uiLang`, `contentLang`, `canonical locale`, `localized delivery`, `reviewed translation`.
  - Decide the canonical structured blueprint path for shared workshop content and explicitly retire the current split between `dashboard/lib/workshop-blueprint-agenda.json` and `workshop-blueprint/agenda.json`.
  - Write one maintainer-facing language architecture note or ADR that explains how canonical English content, Czech localization, runtime copies, and skill fallback content relate.
  - Update repo docs that currently point contributors at the wrong canonical agenda source.

- [x] Define the localized workshop-content schema before migrating copy.
  - Extend the workshop blueprint and runtime data model to support localized content fields rather than one raw string per field.
  - Cover at minimum: workshop title/subtitle, agenda item titles, goals, room summaries, facilitator prompts, watch-fors, checkpoint questions, presenter scene labels, titles, bodies, block content, and skill-facing workshop copy that is shared from repo sources.
  - Add explicit instance-level or runtime-level `contentLang` selection so workshop instances can intentionally run in Czech or English.
  - Keep `uiLang` separate and preserve the current lightweight UI-chrome localization model.

- [x] Make dashboard and presenter rendering locale-aware.
  - Update workshop-state creation/import so runtime instances resolve content in the selected `contentLang` instead of inheriting whichever language happens to be stored in the seed file.
  - Update participant room, control-room agenda detail, and presenter surfaces to render localized workshop content consistently.
  - Remove remaining hardcoded English/internal labels from agenda detail and related editor surfaces by moving them into the shared copy system.
  - Ensure fallback participant guidance and presenter participant scenes are sourced from the same localized content contract.

- [x] Make the `workshop` skill language-aware and content-source aligned.
  - Refactor the skill contract so command semantics remain stable while delivery language becomes configurable.
  - Define how the skill chooses response language in live mode, fallback mode, and portable-bundle mode.
  - Align the portable participant bundle so it ships localized reviewed content from the same authored source rather than preserving a Czech-only authored assumption.
  - Decide whether the skill should default to workshop `contentLang`, user-preferred language, or command-level override, and document that rule explicitly.

- [ ] Migrate canonical structured content into English.
  - Rewrite the canonical workshop agenda, presenter scenes, and other shared structured workshop-copy artifacts in strong editorial English.
  - Preserve technical workshop vocabulary intentionally and avoid flattening the workshop voice into generic product copy.
  - Update source refs and related long-form docs where canonical phrasing must stay aligned with the structured agenda.
  - Ensure the canonical English content is good enough to serve as translation source material rather than merely “safe by default.”

- [ ] Produce a reviewed Czech localization pass from the English canonical source.
  - Rewrite Czech content as a full editorial localization, not a literal translation pass.
  - Audit every shared workshop moment for natural Czech, disciplined Czech-English mixing, and consistency with [`content/style-guide.md`](../../content/style-guide.md) and [`content/style-examples.md`](../../content/style-examples.md).
  - Pay special attention to workshop terms that are currently overused or weakly mixed, such as `participant surface`, `shared room notes`, `safe move`, `feature tour`, and similar phrasing.
  - Add a review checklist or editorial gate so future Czech changes are checked intentionally before shipping.

- [ ] Align surrounding docs and learner resources with the new language model.
  - Update `README.md`, `AGENTS.md`, blueprint docs, learner-resource-kit docs, and packaging docs to describe the new canonical-English plus reviewed-locales model accurately.
  - Update `workshop-skill/SKILL.md` and facilitator guidance so they no longer state “all participant-facing copy is Czech” as a universal rule if that is no longer true.
  - Clarify which artifacts are workshop-method canonical, which are participant-facing localized outputs, and which remain maintainer-first English docs.
  - Ensure the repo teaches contributors how to add a new locale without inventing a parallel authored content system.

- [ ] Add verification and regression coverage for localization behavior.
  - Add tests for locale-aware blueprint import and workshop-state resolution.
  - Add tests for dashboard rendering of English-content and Czech-content workshop instances under both Czech and English UI chrome.
  - Add tests or fixtures for skill fallback content selection and portable-bundle localization inventory.
  - Add one explicit verification check that canonical structured content and shipped localized bundle content stay in sync.

## Acceptance Criteria

- There is one documented canonical structured workshop-content source in the repo, and repo docs no longer disagree about where it lives.
- Harness Lab can intentionally represent at least two separate concerns:
  - UI chrome language
  - workshop content language
- A workshop instance can be configured to deliver English or Czech workshop content without relying on ad hoc translation or whatever language happened to be authored last.
- The dashboard participant room, control-room agenda, presenter scenes, and `workshop` skill all consume the same localized workshop-content contract.
- Canonical structured agenda and presenter content exist in polished English suitable for reuse and translation.
- Czech localized workshop content is reviewed against the existing Czech style guide and no longer contains the current low-quality mixed-language wording.
- Portable skill distribution ships the same reviewed localized content model rather than a separate Czech-only authored assumption.
- Relevant tests and verification checks cover locale-aware import, rendering, and packaged-content synchronization.

## Decision Rationale

### Why English should be the canonical authoring language

English is the safest reusable base for future workshop variants, contributor collaboration, and translation workflows. It keeps the canonical workshop method broadly legible while still allowing Czech to remain first-class where the actual workshop delivery needs it.

### Why Czech should still be a first-class reviewed locale

The immediate workshop reality is Czech delivery. Treating Czech as “secondary” in editorial quality would ship a structurally correct system with weak participant experience. The right model is English as canonical source and Czech as a seriously reviewed locale, not a best-effort translation.

### Why not use runtime translation

The workshop content is short, repeated, and high-signal. These are exactly the strings that should be authored and reviewed deliberately. Runtime translation would add inconsistency, reduce voice control, and make the skill/dashboard/presenter drift harder to reason about.

### Why separate `uiLang` from `contentLang`

The user’s original complaint is the proof. “English dashboard” currently means only English chrome, not English workshop content. Splitting the concepts makes mixed-language output either intentional or fixable instead of accidental and confusing.

### Why the `workshop` skill must become language-aware instead of staying Czech-only

The skill is a first-class client of the same workshop system, not an isolated authored booklet. If dashboard and presenter become locale-aware while the skill stays Czech-only, the product will teach one model and implement another.

### Why source-of-truth consolidation is part of the same work

Localization on top of an already split canonical source would only multiply drift. The repo needs one authoritative structured blueprint path before adding per-locale variants and editorial governance.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| English is the safest canonical authoring language for future workshop reuse and translation | Verified | User decision in this thread |
| Czech still needs a high-quality first-class delivery path because near-term workshops are Czech | Verified | User requirement in this thread and existing repo language doctrine |
| Runtime machine translation is the wrong fit for workshop-copy delivery | Verified | Review findings from this thread plus the repo’s emphasis on deliberate authored guidance |
| UI language and workshop content language are different concerns in the current product | Verified | `ui-language.ts` localizes chrome while agenda/runtime content is rendered directly from workshop content sources |
| The `workshop` skill currently assumes Czech participant-facing delivery | Verified | [`workshop-skill/SKILL.md`](../../workshop-skill/SKILL.md) explicitly states that all participant-facing copy is Czech |
| The current repo has conflicting guidance about the canonical agenda source | Verified | [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md) and [`docs/facilitator-agenda-source-of-truth.md`](../facilitator-agenda-source-of-truth.md) disagree |
| The current structured agenda content is important enough that localization must cover presenter scenes and participant fallback packs, not only titles | Verified | Current dashboard and presenter surfaces consume room summaries, prompts, scene bodies, and participant blocks directly from the structured agenda model |
| Canonical English content can be migrated without weakening the workshop voice | Unverified | Requires careful editorial pass during implementation |
| The localized content schema can stay maintainable without making every field painful to edit | Unverified | Depends on final shape of localized structured content |
| Skill fallback behavior can select the right locale cleanly in both installed-bundle and repo-local modes | Unverified | Needs implementation and verification across portable and source-repo workflows |
| Existing learner-resource-kit and packaging docs can absorb the new model without a large restructure | Unverified | Likely, but needs concrete doc mapping during implementation |

Unverified assumptions should become early tracer tasks or explicit review checkpoints during implementation.

## Risk Analysis

### Risk: Localization multiplies content-management complexity

If the schema or authoring flow is too heavy, contributors will bypass it and reintroduce ad hoc copy.

Mitigation:

- keep one canonical source locale
- keep localization contract explicit and narrow
- document one update path for new content and translated variants

### Risk: English canonical content becomes safe but bland

If the English rewrite optimizes only for neutrality, Czech localization will inherit flat source material.

Mitigation:

- treat the English pass as real editorial work, not placeholder translation source
- review the canonical agenda for workshop voice and facilitator usefulness before translating

### Risk: Czech localization becomes too literal

If Czech is derived mechanically from English without editorial judgment, the current quality problem will simply return in a new workflow.

Mitigation:

- require Czech editorial review against the style guide
- explicitly rewrite weak workshop terms rather than preserving them
- add a localization checklist for participant-facing content

### Risk: The skill and dashboard drift again after the migration

If dashboard content and portable skill bundle content are localized through separate streams, language consistency will degrade quickly.

Mitigation:

- use one shared localized source contract
- add packaged-content synchronization checks
- keep skill fallback content generated or resolved from the same authored inventory

### Risk: Contributors confuse UI language with workshop-content language

If the terms are not documented clearly, future changes will reintroduce mixed-language bugs through misunderstanding rather than bad intent.

Mitigation:

- define `uiLang` and `contentLang` explicitly in docs and code
- use those exact terms in runtime, tests, and plan references
- add examples for English UI with Czech workshop and Czech UI with English workshop

### Risk: Source-of-truth consolidation causes churn in recently shipped agenda work

Recent agenda and presenter work is still fresh. Moving too much at once could destabilize those surfaces.

Mitigation:

- migrate the source of truth in one bounded pass
- preserve agenda ids and scene semantics
- keep the runtime model stable except where locale support requires explicit extension

## Phased Implementation

### Phase 1: Lock language architecture and content ownership

Goal: decide the canonical source path, locale vocabulary, and governance rules before touching copy or rendering.

Tasks:

- [ ] Write the language architecture note or ADR.
- [x] Choose the canonical structured blueprint path.
- [ ] Mark duplicate or legacy agenda artifacts for migration or retirement.
- [x] Define `uiLang` and `contentLang` as first-class terms in docs.

Exit criteria:

- contributors can answer where canonical workshop content lives
- contributors can answer the difference between UI language and content language
- no core doc still implies that today’s accidental language mixing is expected behavior

### Phase 2: Add locale-aware content model and runtime plumbing

Goal: make locale selection a property of the system rather than a side effect of seed data.

Tasks:

- [x] Extend the structured content schema for localized workshop copy.
- [x] Add `contentLang` to the workshop instance/runtime model.
- [x] Update import/state resolution to select localized content deterministically.
- [x] Add tests for content resolution and rendering behavior.

Exit criteria:

- a workshop instance can resolve shared content in a chosen locale
- dashboard surfaces no longer depend on one-language seed strings

### Phase 3: Migrate canonical English content and reviewed Czech localization

Goal: replace current weak shared copy with strong English source material and strong Czech delivery.

Tasks:

- [x] Rewrite canonical agenda and presenter copy in English.
- [x] Create reviewed Czech localized content for the same structured artifacts.
- [x] Run a Czech editorial audit for natural phrasing and vocabulary discipline.
- [x] Update long-form docs or source refs where wording must stay aligned.

Exit criteria:

- English canonical content is complete and strong
- Czech localized content is reviewed and workshop-ready
- the weakest current mixed-language phrases are removed from shared structured content

### Phase 4: Align skill, bundle, and surrounding docs

Goal: make every client of the workshop system follow the same localization model.

Tasks:

- [x] Update the `workshop` skill contract and fallback behavior.
- [x] Update portable bundle packaging and sync rules.
- [x] Update learner-kit, README, blueprint, and maintainer docs.
- [x] Remove now-false Czech-only or source-of-truth claims.

Exit criteria:

- dashboard, presenter, and skill tell the same story about language and content
- the portable bundle no longer behaves like a separate Czech-only content stream

### Phase 5: Verify and harden the workflow

Goal: make regression back to accidental language drift unlikely.

Tasks:

- [x] Add tests for locale-aware content resolution and rendering.
- [x] Add a verification check for localized bundle/source sync.
- [x] Add an editorial checklist for Czech workshop-copy review.
- [x] Confirm final behavior with both English-content and Czech-content workshop instances.

Exit criteria:

- language behavior is testable and documented
- contributors have a repeatable process for adding or updating localized workshop content

## References

- [dashboard/lib/workshop-blueprint-agenda.json](../../dashboard/lib/workshop-blueprint-agenda.json)
- [workshop-blueprint/agenda.json](../../workshop-blueprint/agenda.json)
- [dashboard/lib/workshop-data.ts](../../dashboard/lib/workshop-data.ts)
- [dashboard/lib/public-page-view-model.ts](../../dashboard/lib/public-page-view-model.ts)
- [dashboard/lib/ui-language.ts](../../dashboard/lib/ui-language.ts)
- [workshop-skill/SKILL.md](../../workshop-skill/SKILL.md)
- [content/style-guide.md](../../content/style-guide.md)
- [content/style-examples.md](../../content/style-examples.md)
- [docs/facilitator-agenda-source-of-truth.md](../facilitator-agenda-source-of-truth.md)
- [docs/dashboard-surface-model.md](../dashboard-surface-model.md)
- [docs/resource-packaging-model.md](../resource-packaging-model.md)
- [docs/learner-resource-kit.md](../learner-resource-kit.md)
- [docs/plans/2026-04-08-feat-rich-facilitator-agenda-and-presenter-content-plan.md](2026-04-08-feat-rich-facilitator-agenda-and-presenter-content-plan.md)
- [docs/plans/2026-04-08-feat-portable-participant-skill-distribution-and-workshop-ux-plan.md](2026-04-08-feat-portable-participant-skill-distribution-and-workshop-ux-plan.md)
