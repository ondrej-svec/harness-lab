---
title: "feat: workshop blueprint rich presenter content"
type: plan
date: 2026-04-09
status: superseded
brainstorm: ../brainstorms/2026-04-09-workshop-scene-richness-and-presentation-system-brainstorm.md
confidence: medium
---

# Workshop Blueprint Rich Presenter Content Plan

Superseded as an execution tracker by [`2026-04-09-feat-workshop-blueprint-content-excellence-and-readiness-plan.md`](./2026-04-09-feat-workshop-blueprint-content-excellence-and-readiness-plan.md).

Keep this plan as historical input for renderer, asset, and authoring workflow rationale only.

Upgrade Harness Lab's blueprint, presenter model, and authoring workflow so every new workshop instance imports high-quality room-facing content by default instead of thin text cards, with the first proof delivered through one flagship phase pack before broader rollout.

## Problem Statement

The presenter stack now exists, but the default workshop experience still looks weak:

- the canonical blueprint underuses the current scene/block model
- scenes are visually repetitive and contain no image-backed moments
- the editor still expects raw JSON for rich scene authoring
- the canonical structured blueprint and content-language rules are misaligned
- there is no deliberate workflow for promoting runtime content discoveries back into the blueprint

This means the product currently validates the architecture but not the experience.

## Proposed Solution

Keep the current agenda-owned structured presenter architecture, and raise its quality in five coordinated slices:

1. rebuild the blueprint scene packs to conference-grade quality
2. extend the bounded block taxonomy only where the flagship pack proves the current model is insufficient
3. add a real asset model and sourcing rules for images and visual evidence
4. replace JSON-first authoring with a scoped structured editor for the normal path
5. make blueprint improvement deliberate through a publish-back path rather than one-off runtime edits

This plan intentionally does not replace the presenter with a generic slide framework as the default path.

The proof strategy is intentionally strict:

- add the minimum renderer fixes and block support the flagship phase actually needs
- prove the redesigned system on one flagship phase first
- require a non-Ondrej cold-read facilitator check before treating that flagship pack as done
- only then propagate the pattern across the remaining phases

This plan also adopts the voice strategy from [`docs/brainstorms/2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md`](../brainstorms/2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md):

- Ondrej frames opening, reveal, and reflection moments
- expert voices anchor teaching and demo moments
- each scene has one dominant voice, not a blended voice soup

## Implementation Tasks

- [ ] Audit and redesign the canonical blueprint content packs.
  - Convert the strongest workshop moments into richer multi-scene packs with explicit thesis, evidence, visual anchor, facilitator cue, and participant-safe next step.
  - Promote long-form source material from [`content/talks/context-is-king.md`](../../content/talks/context-is-king.md) and [`content/facilitation/master-guide.md`](../../content/facilitation/master-guide.md) into structured room-facing scenes.
  - Remove slide-like bullet piles where one point should become multiple scenes.
  - [x] Rebuild `opening` first as the proof phase before rolling the pattern across the rest of the day.
  - [ ] Treat `opening` as Phase 1a and the remaining flagship moments as Phase 1b only after the proof gate passes.

- [x] Add the minimum renderer fixes and block support required by the flagship proof phase.
  - [x] Add explicit tone-aware rendering for `callout` blocks instead of relying on the generic fallback.
  - [x] Add only the smallest new set of primitives that the flagship proof phase proves it cannot express with the current model.
  - Initial candidates to validate: `comparison`, `timeline`, `image-grid`, `code-before-after`, `stat`, `video-embed`.
  - Do not add restyled duplicates of existing blocks unless the flagship phase proves the current primitives are genuinely insufficient.

- [x] Introduce a reviewed blueprint asset model.
  - [x] Define repo-safe locations for blueprint visuals and screenshots.
  - [x] Add attribution and legal-status metadata for assets.
  - [x] Ensure scenes can reference reviewed local assets instead of remote ad hoc URLs.
  - [x] Document allowed image sourcing and citation rules.
  - [x] Define a primary asset creation path: AI-assisted image generation with `gemini-imagegen` as the default drafting tool, reviewed by maintainers, with fallback to Ondrej-supplied assets when generated output is too generic or factually off.

- [x] Replace JSON-first scene authoring in the dashboard for the normal path.
  - [x] Add a block picker and block-specific form fields.
  - [x] Add live preview inside scene editing.
  - [x] Scope templates, duplication, and blueprint-vs-runtime comparison as follow-on work only if the flagship proof phase and minimal editor both land successfully.

- [ ] Preserve localization integrity for the redesign without forcing a full canonical-language migration in this slice.
  - [x] Ensure new blocks and flagship scenes have explicit localization semantics.
  - [x] Keep reviewed Czech delivery intact.
  - [x] Track any canonical-English blueprint migration as a separate follow-up unless the flagship proof phase shows it is blocking the work immediately.

- [x] Define the blueprint publish-back workflow for rich scenes.
  - [x] Clarify how maintainers inspect a good runtime scene and convert it into a reusable blueprint improvement.
  - [x] Add docs and lightweight operational guidance so runtime experimentation does not stay trapped in instance-local edits.
  - [x] Consolidate the three April 9 brainstorms into one coherent publish-back rationale so the implementation path inherits the best of all of them.

- [x] Update the facilitator skill and docs to match the richer model.
  - [x] Ensure the facilitator skill references the same scene vocabulary and content strategy.
  - [x] Document how a facilitator should request, edit, and promote richer scenes.

- [ ] Define and run the proof gate for flagship scene packs.
  - [x] Write explicit cold-read criteria for a non-Ondrej facilitator.
  - [ ] Run the gate on the rebuilt `opening` pack.
  - [ ] Record what failed, refine the pack, and only then scale the content pattern to other phases.

- [ ] Add verification coverage around richer presenter content.
  - [x] Add tests for new block rendering.
  - [x] Add regression coverage for blueprint import/reset with richer content.
  - [x] Add focused e2e coverage for flagship presenter scenes and participant-safe projections.

## Acceptance Criteria

- A newly created workshop instance imports blueprint scenes that feel intentionally designed, not placeholder text cards.
- The canonical blueprint uses reviewed visual assets and at least some image-backed scenes where they materially improve comprehension.
- The presenter editor no longer requires raw JSON for the normal path of creating the flagship scene pack.
- The block taxonomy remains bounded and documented.
- Blueprint authoring, localization, presenter rendering, and facilitator skill semantics remain aligned.
- The repo documents how runtime scene experiments become deliberate blueprint improvements.
- At least one flagship phase pack is validated by a non-Ondrej facilitator who can cold-read the scene content plus facilitator notes and run the moment coherently.
- The flagship phase also passes a lightweight vibe-check for clarity, restraint, and premium feel; cold-read alone is not the only bar.

## Decision Rationale

The current architecture is fundamentally sound:

- agenda items already own scenes
- the renderer already supports richer blocks than the blueprint currently uses
- runtime overrides already exist

Replacing the system with a generic slide engine would sacrifice structure, shared semantics, and agentic editability. The higher-leverage move is to treat the blueprint as the product and upgrade the model and workflow around it.

## Assumptions

| Assumption | Status | Evidence |
| --- | --- | --- |
| The current structured presenter model can support a much better experience without a total rewrite | Verified | [`dashboard/lib/workshop-data.ts`](../../dashboard/lib/workshop-data.ts) and [`dashboard/app/admin/instances/[id]/presenter/page.tsx`](../../dashboard/app/admin/instances/[id]/presenter/page.tsx) already support images, quotes, checklist/steps, and links; `callout` currently falls through to a generic fallback and needs explicit rendering work |
| The biggest quality gap is blueprint content, not missing rendering support | Verified | Current blueprint uses zero image blocks and is dominated by `hero` plus `bullet-list` patterns in [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json) |
| JSON-first scene editing is a major adoption bottleneck | Verified | Scene block editing is currently raw JSON in [`dashboard/app/admin/instances/[id]/page.tsx`](../../dashboard/app/admin/instances/[id]/page.tsx) |
| Canonical English authoring with reviewed Czech delivery is the intended long-term model | Verified | [`docs/workshop-content-language-architecture.md`](../../docs/workshop-content-language-architecture.md), but a full canonical-language migration is not yet proven necessary for the flagship proof phase |
| A bounded block expansion will be enough for flagship workshop content | Unverified | The brainstorm validation says "probably yes, conditionally," but this is not proven until the rebuilt flagship phase lands cleanly without needing a second deck system |
| Maintainers will actually promote strong runtime scenes back into the blueprint if the path is explicit | Unverified | The publish-back rule exists in [`docs/runtime-learning-publish-back.md`](../../docs/runtime-learning-publish-back.md), but the rich-scene workflow has not been proven in practice |
| A non-Ondrej facilitator can run flagship moments from scene content plus notes alone | Unverified | Current notes are too thin; this must be converted into an explicit cold-read gate rather than assumed |
| The chosen voice strategy will scale cleanly across multiple phases | Unverified | The "Ondrej frames, experts anchor" rule is well-shaped, but it still needs to prove itself on the flagship phase before it is propagated broadly |

## Risk Analysis

### Risk: We overcorrect into a generic slide-builder

If we keep adding arbitrary layout freedom, the presenter stops being a workshop operating surface and becomes a separate product.

Mitigation:

- keep the agenda-owned scene model
- add only high-value block types
- document a clear boundary against arbitrary layout tooling

### Risk: The editor improves, but the blueprint still stays mediocre

Better tooling alone will not create strong default content.

Mitigation:

- treat blueprint redesign as phase 1, not phase 4
- require flagship scene packs in the canonical blueprint before calling the work complete

### Risk: The plan expands the block taxonomy faster than the flagship proof actually needs

An overly large block expansion would recreate the "generic page-builder" risk through the side door.

Mitigation:

- add only the minimum new primitives the flagship phase proves necessary
- reuse and restyle existing blocks where semantics are already sufficient
- defer anything that is not required by the flagship proof phase

### Risk: The team proves premium visuals but fails cold-read facilitation

Scenes could look much better while still depending on Ondrej's tacit facilitation knowledge.

Mitigation:

- make cold-read facilitator self-sufficiency a hard acceptance rule
- test the rebuilt `opening` pack with a non-Ondrej facilitator before scaling the pattern
- expand facilitator notes and source anchors alongside the room-facing content rather than later

### Risk: Voice and authority drift make the content feel generic or over-produced

If every scene mixes Ondrej's voice, expert quotes, and generic AI copy, the result will feel incoherent.

Mitigation:

- use one dominant voice per scene
- keep Ondrej's voice strongest in opening, reveal, and reflection
- require citation-backed expert voices for authority moments
- run a vibe-check alongside the cold-read check before propagation

### Risk: Asset quality improves but rights management becomes sloppy

Unlicensed screenshots and random internet images would create legal and reputational risk.

Mitigation:

- require asset attribution metadata
- prefer repo-owned or explicitly licensed assets
- document sourcing rules and review expectations

### Risk: Localization lags behind richer content

If richer scenes ship only in one language stream, mixed-quality or mixed-language surfaces will reappear.

Mitigation:

- define localization semantics for each block type
- keep canonical English plus reviewed Czech delivery as an explicit requirement

### Risk: Runtime experimentation drifts away from the reusable blueprint

If the best scene experiments live only in one workshop instance, the default workshop quality never improves.

Mitigation:

- add a deliberate publish-back workflow
- make blueprint promotion part of the maintainer routine

## Phased Implementation

## Phase 0: Minimum renderer and proof scaffolding

Goal: remove the known rendering gaps and define the proof gate before the flagship content rewrite starts.

Tasks:

- [x] add explicit `callout` rendering with tone-aware styling
- [x] define the cold-read facilitator test
- [x] define the lightweight vibe-check rubric with explicit criteria: clarity, restraint, premium feel, narrative beat landing, and "every word earns its place"

Exit criteria:

- the known renderer gap for `callout` is closed
- the proof phase has a clear quality gate before content work begins
- the implementation team has explicit proof criteria before the `opening` redesign starts

## Phase 1a: Flagship proof phase

Goal: make the default workshop import materially better before touching advanced tooling.

Tasks:

- [x] audit the current `opening` scenes against one-idea-per-scene discipline
- [x] rebuild `opening` first as the flagship proof phase
- [x] split overstuffed `opening` scenes into a better scene pack
- [x] add reviewed quotes, evidence moments, visual anchors, and richer facilitator notes
- [x] apply the voice strategy explicitly inside `opening`
- [x] identify the smallest additional block set the rebuilt `opening` pack actually needs beyond the current model plus the Phase 0 `callout` fix
- [ ] run the non-Ondrej cold-read test
- [ ] run the vibe-check review and record what to keep or change before scaling

Exit criteria:

- the `opening` phase pack clearly feels like a different class of room experience
- the `opening` pack can be run coherently by a non-Ondrej facilitator from scene content plus notes alone
- the team has a tested content pattern and an explicit list of any additional primitives needed before propagation

## Phase 2: Bounded scene/block model expansion

Goal: add only the additional primitives that the `opening` proof phase proved necessary, plus any tightly justified follow-on primitives needed before propagation.

Tasks:

- [ ] implement and document the additional block types explicitly identified during Phase 1a
- [ ] add renderer support and regression coverage
- [ ] define how new blocks localize and attribute sources

Exit criteria:

- the renderer can express the rebuilt `opening` pack without hacks
- the renderer is ready for propagation to the remaining flagship moments
- the final block list is clearly justified and still bounded

## Phase 1b: Propagate the proven pattern

Goal: extend the proven flagship pattern to the remaining high-impact workshop moments after any required block work is complete.

Tasks:

- [ ] create flagship scenes for Context is King, demo, milestone board, rotation, and reflection
- [ ] adapt the proof-phase content pattern rather than re-inventing each phase from scratch
- [ ] preserve the voice strategy and evidence-led structure across all propagated packs

Exit criteria:

- the remaining major workshop moments inherit the same tested quality bar as `opening`
- the content pattern scales without obvious voice or structure drift

## Phase 3: Asset model and sourcing workflow

Goal: make visual quality practical and legally clean.

Tasks:

- [x] define blueprint asset storage and metadata
- [x] add helper semantics for attributions and source strips
- [x] document source review expectations

Exit criteria:

- blueprint scenes can use reviewed visuals without ad hoc external URLs
- the asset pipeline has a real creation path, not only storage rules

## Phase 4a: Structured authoring UX

Goal: make rich scene creation realistic for maintainers and facilitators.

Tasks:

- [x] replace raw JSON block editing for the normal path
- [x] add live preview
- [x] support only the minimum block-picker and block-form flows required by the flagship blocks

Exit criteria:

- a maintainer can create a rich scene without hand-writing block JSON
- the editor cost for the flagship blocks is materially lower than raw JSON editing

## Phase 4b: Publish-back discipline and editor follow-on

Goal: make reusable promotion and richer authoring sustainable without swallowing the whole roadmap.

Tasks:

- [x] document the maintainer path from runtime experiment to canonical blueprint promotion
- [x] keep publish-back as a deliberate reviewed repo edit, never an automatic side effect
- [x] decide whether templates, duplication, and blueprint-vs-runtime comparison are needed immediately or belong in a follow-up slice

Exit criteria:

- a maintainer can promote a reusable scene improvement without guessing where the canonical edit belongs
- the roadmap is explicit about what remains in follow-on editor work rather than hiding it inside one phase

## Phase 5: Consumer alignment and regression proof

Goal: keep blueprint, runtime, and skill behavior coherent.

Tasks:

- [x] align facilitator skill guidance with the richer content model
- [x] add tests and e2e coverage incrementally, starting with the renderer and proof phase
- [ ] expand coverage as each later phase or block family lands rather than deferring all verification to the end

Exit criteria:

- runtime experimentation has an explicit path into the reusable blueprint
- dashboard, presenter, and skill all reflect the same richer workshop content model
- the flagship proof phase is covered well enough that future refactors do not silently collapse it back into thin scenes

## References

- Brainstorm: [`docs/brainstorms/2026-04-09-workshop-scene-richness-and-presentation-system-brainstorm.md`](../brainstorms/2026-04-09-workshop-scene-richness-and-presentation-system-brainstorm.md)
- Content and voice brainstorm: [`docs/brainstorms/2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md`](../brainstorms/2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md)
- Direction brainstorm: [`docs/brainstorms/2026-04-09-presenter-blueprint-rich-content-direction-brainstorm.md`](../brainstorms/2026-04-09-presenter-blueprint-rich-content-direction-brainstorm.md)
- Current canonical blueprint: [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json)
- Typed scene model: [`dashboard/lib/workshop-data.ts`](../../dashboard/lib/workshop-data.ts)
- Presenter renderer: [`dashboard/app/admin/instances/[id]/presenter/page.tsx`](../../dashboard/app/admin/instances/[id]/presenter/page.tsx)
- Scene editor: [`dashboard/app/admin/instances/[id]/page.tsx`](../../dashboard/app/admin/instances/[id]/page.tsx)
- Source-of-truth doc: [`docs/facilitator-agenda-source-of-truth.md`](../facilitator-agenda-source-of-truth.md)
- Publish-back rule: [`docs/runtime-learning-publish-back.md`](../runtime-learning-publish-back.md)
- Language architecture: [`docs/workshop-content-language-architecture.md`](../workshop-content-language-architecture.md)
- TEDx Speaker Guide: https://storage.ted.com/tedx/manuals/tedx_speaker_guide.pdf?lang=es
- TEDx Content Guidelines: https://www.ted.com/participate/organize-a-local-tedx-event/tedx-organizer-guide/speakers-program/prepare-your-speaker/tedx-content-guidelines-details
- Garr Reynolds presentation design tips: https://www.garrreynolds.com/design-tips
- Duarte slide design guidance: https://www.duarte.com/blog/perfect-your-slide-design/
- Devpost hackathon demo guidance: https://info.devpost.com/blog/how-to-present-a-successful-hackathon-demo
- OpenAI agent evals guide: https://developers.openai.com/api/docs/guides/agent-evals
- OpenAI evals guide: https://platform.openai.com/docs/guides/evals
- Anthropic prompt engineering overview: https://docs.anthropic.com/en/docs/prompt-engineering
