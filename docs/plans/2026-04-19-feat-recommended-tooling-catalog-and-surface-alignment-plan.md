---
title: "feat: recommended tooling catalog and participant-surface alignment"
type: plan
date: 2026-04-19
status: approved
brainstorm:
confidence: medium
---

# Recommended Tooling Catalog and Participant-Surface Alignment Plan

**One-line summary:** Create one canonical, curated recommendation catalog for participant-facing skills, plugins, MCPs, docs, and public repos, then surface that catalog consistently through the workshop skill, portable bundle, and participant UI without turning optional tooling into workshop prerequisites.

## Problem Statement

Harness Lab already contains recommendation content, but it is fragmented across prose surfaces instead of being modeled as one reusable inventory.

Current repo state:

- the repo explicitly defines an **External Reference Gallery** as a participant-facing output in `docs/resource-packaging-model.md`
- the gallery exists today as markdown in `docs/learner-reference-gallery.md` and `docs/locales/en/learner-reference-gallery.md`
- the workshop skill exposes that content through `workshop gallery`, `workshop resources`, and `workshop follow-up`
- the CLI bundle ships the gallery and participant resource kit into installed workshop bundles
- the dashboard participant-surface doctrine says the UI should expose workshop reference links and learner-kit artifacts
- the current participant UI implementation still behaves mostly like a phase/orientation surface rather than a richer participant reference surface
- the workshop can no longer rely on the CLI and `workshop` skill being the only practical way participants discover recommended tools, reference material, and optional accelerators

This creates five concrete failures:

1. **No single source of truth.** Recommendations live in markdown prose plus scattered references in `workshop-skill/` docs and participant materials, so adding or removing one recommendation requires manual multi-file edits.
2. **Skill/UI asymmetry.** Participants can access curated recommendations through the skill path, but not through the participant dashboard in any structured way.
3. **Weak extensibility.** New recommendations such as Chrome DevTools MCP have no obvious durable home other than editing a prose list by hand.
4. **Ambiguous product framing.** The workshop teaches that extra tooling is optional acceleration, but the repo does not encode that distinction structurally.
5. **Overlap risk with the broader participant-surface redesign.** The live `docs/plans/archive/2026-04-19-refactor-participant-surface-cli-independence-plan.md` already says the participant surface must be sufficient on its own. Without a dedicated plan for the recommendation library layer, that broader work will either skip this gap or solve it ad hoc inside UI code.

## Target End State

When this lands, Harness Lab should have a durable recommendation system with these properties:

- one canonical participant-safe recommendation catalog for:
  - docs
  - public repos
  - workflow skills
  - plugins
  - MCP servers
  - optional workflow packs
- English-canonical authored source with reviewed Czech delivery for any participant-visible UI copy
- explicit optionality per item:
  - workshop default
  - optional accelerator
  - maintainer/deeper-dive
- one evergreen participant-facing reference library in the dashboard that is reachable throughout the workshop day
- phase-aware emphasis inside that library, so the current phase changes ranking and framing without hiding the rest of the reference surface
- one compact dashboard proof slice that exposes the most relevant recommendations for Build Phase 1 without forcing a shell-first path
- one stable participant-facing skill path that reads from the same catalog rather than a diverging prose list
- one human-readable gallery projection for follow-up and repo browsing

The participant should be able to understand:

- what the default workshop path is
- which tools are optional accelerators
- when a recommendation is useful
- where to go next without searching GitHub blindly

## Scope and Non-Goals

### In scope

- define the canonical data model for participant-facing recommendations
- choose a canonical source path that fits the repo's language architecture and bundle model
- migrate the existing learner reference gallery into that structured source
- preserve a readable participant-facing gallery artifact instead of forcing people to inspect raw JSON
- expose a compact proof-slice recommendation surface in the participant UI for Build Phase 1
- align `workshop gallery`, `workshop resources`, and related participant docs with the new source of truth
- encode curation and freshness rules so the catalog does not become an unbounded list

### Non-goals

- building a general plugin or MCP marketplace inside the dashboard
- auto-installing plugins, skills, or MCP servers from the participant UI
- making optional accelerators mandatory for workshop progress
- moving facilitator-private tooling or runtime secrets into the public recommendation layer
- rewriting the full participant surface in this plan
- solving all future recommendation freshness automatically from the web

## Proposed Solution

Adopt a **two-layer recommendation model**:

1. **Canonical structured catalog**
   A participant-safe structured source that both the dashboard and workshop bundle can consume directly.

2. **Readable projection**
   A generated human-readable gallery that keeps repo browsing and `workshop gallery` legible.

This plan now makes the projection decision explicit:

- the structured catalog is the only canonical source of truth
- the readable gallery is a generated artifact, not a second authored list
- dashboard, bundle, and skill consumers may render from the structured source directly, but the repo-readable gallery remains downstream of the same catalog

### Canonical source path

Use a participant-facing content path that follows the repo's language architecture rather than hiding this data inside dashboard-only code or an internal-only doc.

Recommended source:

- `content/recommended-tooling-catalog.json` — English canonical
- `content/locales/cs/recommended-tooling-catalog.json` — reviewed Czech delivery

Rationale:

- `content/` is already treated as authored participant-facing source
- the entire `content/` tree is already bundled into the portable workshop install
- the language architecture already expects English root plus Czech `locales/cs/` for participant-facing content
- the dashboard can consume a structured file directly without parsing markdown

### Catalog shape

Each recommendation entry should carry only the fields needed to keep curation explicit and UI rendering predictable:

- `id`
- `kind`
  - `doc`
  - `repo`
  - `skill`
  - `plugin`
  - `mcp`
  - `workflow-pack`
- `title`
- `summary`
- `href`
- `recommendedFor`
  - `during-workshop`
  - `after-workshop`
  - `maintainers`
- `requiredness`
  - `default`
  - `optional-accelerator`
  - `deeper-dive`
- `surfaces`
  - `skill`
  - `dashboard`
  - `follow-up`
- `phaseHints`
  - optional array such as `build-1`, `after-workshop`
- `reviewedAt`

Do **not** add speculative metadata such as install automation, telemetry, or compatibility matrices in v1. The catalog should stay small and editorial, not become a package registry.

### Rendering model

Use the catalog as the only canonical source, then project it into the current participant-facing surfaces:

- **Dashboard**
  - render an evergreen participant reference library from the structured catalog
  - keep the library reachable throughout the day rather than limiting it to one phase
  - use phase-aware emphasis, ordering, and compactness so the current phase highlights the most relevant default path and accelerators
  - proof slice: Build Phase 1 only, but as the first validated state of a broader participant reference surface
- **Workshop skill**
  - update `workshop gallery` and related guidance to consume the structured catalog or its generated readable projection
  - keep response behavior compact and phase-aware
- **Repo-readable gallery**
  - keep `docs/learner-reference-gallery.md` as a readable artifact
  - generate it from the catalog so it stops being a hand-maintained parallel list

### Ranking contract

Shared source data alone is not enough. The dashboard, skill, and readable projection must also agree on ordering behavior.

Required ranking rules for v1:

1. `requiredness=default` always ranks above `optional-accelerator`.
2. `optional-accelerator` always ranks above `deeper-dive` on during-workshop surfaces.
3. `recommendedFor=during-workshop` outranks `after-workshop` during live participant rendering.
4. `phaseHints` may reorder items only **within the same requiredness tier**; they must not let an optional accelerator outrank the workshop default.
5. If multiple items still tie, preserve authored source order unless a future plan introduces an explicit `order` field.
6. Compact proof-slice surfaces must show the smallest useful subset that still preserves the distinction between default path and optional accelerators.

If any consumer needs a different ranking behavior later, that difference must be explicit and documented rather than improvised in one surface.

### UI product rule

The participant UI should stop acting like phase state is the only durable participant need.

It should have **two layers**:

1. **Phase layer**
   - what the team should do now
   - what matters in this phase
   - what fallback move keeps the team progressing

2. **Reference layer**
   - what the default workshop path is
   - what recommended tools/resources exist
   - which accelerators are optional
   - where to go deeper during or after the workshop

The participant UI should never present optional tooling as if workshop success depends on it.

The rendered hierarchy must be:

1. **Default workshop path**
   - repo-native harness
   - brief
   - plan
   - review
   - workshop skill when available
2. **Optional accelerators**
   - extra workflow packs
   - skills beyond the guaranteed default
   - plugins
   - MCPs such as Chrome DevTools MCP
3. **After-workshop deeper reading**
   - official docs
   - public repos

The key product behavior is:

- the reference layer stays available throughout the workshop
- the phase layer changes what is primary right now
- the reference layer does not disappear just because the phase changes

## Detailed Plan Level

This is a **detailed** plan because it changes participant-facing information architecture, introduces a new source-of-truth model, touches bundle packaging, and must align with a broader in-progress participant-surface plan without creating a competing product direction.

## Decision Rationale

### Why not keep markdown as the canonical source?

Because the dashboard needs structured data, and parsing curated markdown into a reliable UI contract is brittle. The markdown gallery is a good reader surface, not a good primary data model.

### Why not store the catalog inside `workshop-content/agenda.json`?

Because recommendations are not agenda scenes. They are participant resources that should survive outside one specific workshop moment and remain reusable across the skill, dashboard, follow-up materials, and bundle.

### Why use `content/` instead of dashboard-local data?

Because this recommendation layer is participant-facing, public-safe, and bundle-worthy. It should live with other participant-facing authored content, not inside one consumer's implementation folder.

### Why keep a readable markdown projection?

Because participants and maintainers still need a browsable artifact in the repo, and the skill already has a gallery-shaped command surface. Raw structured content alone would degrade human readability.

### Why make Build Phase 1 the UI proof slice?

Because the same-day CLI-independence plan already identifies Build Phase 1 as the point of highest workshop fragility. That is where participants most need a clear distinction between:

- the default path that always works
- optional accelerators if their environment allows them

This does **not** mean the reference library should only exist in Build Phase 1. It means Build Phase 1 is the first place to prove the UI hierarchy before propagating that library more broadly across the participant surface.

### Why not keep recommendations only in the skill path?

Because the workshop now needs a participant UI that can carry more of the workshop on its own. If the participant surface is becoming a first-class operating surface, it also needs to become a first-class reference surface. Otherwise the product still hides essential guidance behind the CLI/skill path.

### Why keep the catalog small?

Because the repo already has a curation rule: once the gallery looks like an awesome list, it has failed. The point is to guide, not to exhaustively map the ecosystem.

## Constraints and Boundaries

- **Participant-safe only.** No facilitator-private, event-private, or pre-event-sensitive tooling belongs in this catalog.
- **English canonical, Czech reviewed.** Any participant-visible dashboard rendering must follow the repo's reviewed-locale architecture.
- **Dashboard and skill must not diverge silently.** If one surface shows a recommendation, the other should be able to reach the same underlying item set.
- **Optional means optional.** Items tagged `optional-accelerator` must not become the only path implied by the UI or copy.
- **Bundle portability must remain intact.** Any new authored source must ship through the workshop bundle without absolute-path assumptions.
- **No uncontrolled surface growth.** The participant dashboard proof slice must stay compact, mobile-readable, and phase-aware.
- **Design-system adherence is non-negotiable.** Any new participant-surface pattern must follow `docs/dashboard-design-system.md`; if the pattern is genuinely new and reusable, that doc must be updated in the same slice.
- **Executable verification is required.** UI and content changes in this plan are not complete on visual plausibility alone; the proof slice must ship with an explicit test protocol aligned to `docs/dashboard-testing-strategy.md` and `docs/agent-ui-testing.md`.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The repo already has a curated participant-facing recommendation concept worth preserving | Verified | `docs/resource-packaging-model.md` defines the External Reference Gallery and `docs/locales/en/learner-reference-gallery.md` contains the current curated list |
| The workshop skill already exposes this recommendation layer to participants | Verified | `workshop-skill/SKILL.md` defines `workshop gallery`, `workshop resources`, and `workshop follow-up` as participant-facing commands |
| The portable workshop bundle can already ship new participant-facing content from `content/` without inventing a second packaging path | Verified | `harness-cli/src/workshop-bundle.js` copies the entire `content/` tree into the bundle |
| The dashboard participant surface can already render structured recommendation links when given the data | Verified | `dashboard/lib/workshop-data.ts` and `dashboard/app/components/participant-room-surface.tsx` already support `ctaLabel`, `ctaHref`, and `link-list` rendering |
| Current participant UI does not expose a first-class recommendation library today | Verified | participant navigation and panel state in `dashboard/lib/public-page-view-model.ts` expose room, teams, and notes only; no tooling/resource catalog path exists |
| A single structured catalog can serve both post-workshop follow-up and in-workshop dashboard usage without becoming too large | Unverified | plausible, but must be proved with a Build Phase 1 proof slice and strict curation rules |
| The catalog belongs in `content/` rather than `docs/` or `workshop-content/` | Likely | fits language architecture and bundle model, but should be validated during implementation against contributor ergonomics and existing doc ownership |
| The existing gallery markdown can be replaced by a generated or centrally-rendered projection without degrading participant usability | Unverified | requires proof in the skill path and repo-browsing path before the old hand-maintained list is removed |

## Risk Analysis

### Risk: The catalog turns into an unbounded awesome list

If contributors keep adding tools without a strong curation rule, the surface becomes noisy and the workshop loses its opinionated default path.

Mitigation:

- require `requiredness` and `recommendedFor` on every entry
- keep proof-slice rendering to a capped subset
- define rejection criteria for low-signal additions
- review the full catalog before each workshop cycle

### Risk: Optional accelerators start reading as prerequisites

If MCPs, plugins, or extra skills are displayed without hierarchy, participants may infer that setup success depends on them.

Mitigation:

- separate `default` from `optional-accelerator` visually and structurally
- use explicit copy that says the workshop default does not depend on them
- make Build Phase 1 proof slice the gate before wider propagation

### Risk: Skill, docs, and dashboard drift again

If the structured catalog is introduced but the older markdown gallery stays manually editable, the same divergence problem returns under a different name.

Mitigation:

- define one canonical source
- make the readable gallery a projection, not a second authored list
- update bundle and skill instructions in the same slice

### Risk: Localization overhead delays useful iteration

If the initial catalog tries to cover every possible recommendation in both locales at once, the work will stall or ship unreviewed participant-visible copy.

Mitigation:

- keep the proof slice narrow
- localize only the participant-visible subset needed for the first dashboard surface
- require Czech review before broadening visible UI exposure

### Risk: This plan overlaps awkwardly with the live participant-surface CLI-independence plan

If both plans change the same surface without explicit coordination, execution work will either duplicate or conflict.

Mitigation:

- treat this as a companion plan that owns the recommendation-library slice
- cross-link both plans
- reuse Build Phase 1 as the shared proof slice

## Subjective Contract

### Target outcome

A participant should feel:

- "I know the default path."
- "These extra tools are optional and useful, not homework."
- "If my local setup is blocked, I am still on the normal path."

A maintainer should feel:

- "Adding one new recommendation has one obvious home."
- "The dashboard, skill, and follow-up materials are no longer three separate editorial systems."

### Anti-goals

The result must not become:

- a marketplace UI
- a giant scrolling list of tools
- a Codex-only worldview that hides the transferable workshop method
- a dashboard that pressures participants to install more things during Build Phase 1
- a second manually maintained gallery next to the old one

### References

- `docs/locales/en/learner-reference-gallery.md` for current curation shape
- `docs/resource-packaging-model.md` for the three-output model
- `docs/workshop-content-language-architecture.md` for English-canonical plus reviewed Czech delivery
- `docs/plans/archive/2026-04-19-refactor-participant-surface-cli-independence-plan.md` for the broader participant-surface direction
- current dashboard participant visual language in `dashboard/app/components/participant-room-surface.tsx`

### Anti-references

- raw markdown dumps rendered directly into the participant UI
- one card per tool with equal visual weight
- wording that implies "recommended" means "install now"
- burying Chrome DevTools MCP or similar additions inside prose where no other surface can reuse them

### Tone and taste rules

- calm, direct, practical
- explicit about optionality
- phase-aware during the workshop
- compact enough to read on a phone
- never more excited about the tool than about the underlying harness discipline
- visually consistent with the existing Harness Lab participant surface rather than introducing a parallel mini-design language

### Representative proof slice

Build Phase 1 participant surface:

- one compact but evergreen reference-library block or section
- one visible default path
- a small optional-accelerator subset
- a matching `workshop gallery` / readable gallery projection sourced from the same catalog

The proof slice validates the first state of a reference surface that remains available across phases, not a one-phase-only feature.

### Rollout rule

Do not propagate the catalog broadly across all phases or all participant materials until:

1. the structured source is in place
2. the readable projection is working
3. the Build Phase 1 participant proof slice is reviewed
4. the skill path still feels simpler, not more confusing
5. the proof slice has passed the agreed verification protocol and design-system review

### Rejection criteria

The work fails if:

- the dashboard and skill show different recommendation sets with no explicit reason
- any optional tool is presented as the workshop default
- adding one new recommendation still requires editing multiple unrelated prose files
- the participant UI becomes denser but not more actionable
- the Czech participant-visible copy ships without reviewed localization

## Phased Implementation

### Phase 0 — Inventory, preview, and seam decision

Goal: lock the canonical source path, data shape, ranking behavior, projection ownership, and proof-slice UI before implementation begins.

Tasks:

- [ ] Audit the current recommendation content spread across:
  - `docs/learner-reference-gallery.md`
  - `docs/locales/en/learner-reference-gallery.md`
  - `materials/participant-resource-kit.md`
  - `workshop-skill/reference.md`
  - `workshop-skill/commands.md`
- [ ] Define the canonical catalog schema with a minimal field set.
- [ ] Choose and document the canonical source path under `content/` with English root and reviewed Czech locale.
- [ ] Lock the readable projection strategy as a generated artifact, and encode that rule in the plan-supporting docs.
- [ ] Create a proof artifact for the Build Phase 1 participant reference layer using real or representative recommendation items.
- [ ] Review that proof artifact against:
  - `docs/dashboard-design-system.md`
  - participant optionality clarity
  - mobile readability
  - the rule that optional accelerators must not read like prerequisites
- [ ] Document the shared ranking behavior so dashboard, skill, and readable projection do not drift.

Exit criteria:

- one canonical source path is agreed
- one projection strategy is agreed
- one ranking strategy is agreed
- one participant proof artifact has been reviewed before coding
- no unresolved ambiguity remains about who owns the truth

### Phase 1 — Canonical catalog creation

Goal: create the structured catalog and migrate the current recommendations into it without changing participant behavior yet.

Tasks:

- [ ] Author the English canonical catalog.
- [ ] Author the reviewed Czech locale variant for participant-visible fields.
- [ ] Migrate existing recommendations from the learner reference gallery into the structured model.
- [ ] Tag each item by `kind`, `requiredness`, `recommendedFor`, and `surfaces`.
- [ ] Add explicit curation guidance and freshness rules near the catalog or in a linked maintainer doc.

Exit criteria:

- current gallery recommendations exist in one structured catalog
- each item has explicit optionality and audience
- maintainers have a rule for where Chrome DevTools MCP or future additions belong

### Phase 2 — Readable projection and bundle alignment

Goal: keep participant-facing readability while removing the hand-maintained parallel gallery problem.

Tasks:

- [ ] Implement a readable generated projection for the learner gallery from the structured catalog.
- [ ] Align `docs/learner-reference-gallery.md` and `docs/locales/en/learner-reference-gallery.md` with that projection model.
- [ ] Update `workshop-skill/SKILL.md`, `workshop-skill/reference.md`, and related participant docs to reference the new source/projection path deliberately.
- [ ] Verify the workshop bundle still ships the required source and readable projection files.
- [ ] Update bundle verification expectations if new files or generated artifacts are introduced.
- [ ] Add explicit catalog/projection verification so source and generated gallery cannot drift silently.

Exit criteria:

- participants can still browse a readable gallery in the repo and bundle
- the skill path no longer depends on a manually maintained divergent list

### Phase 3 — Build Phase 1 participant-surface proof slice

Goal: prove the recommendation catalog improves the participant UI without turning it into a setup-heavy tool browser.

Important scope rule:
- this phase proves **one UI slice only**: Build Phase 1
- broader evergreen participant-reference propagation remains a later decision after the proof slice succeeds
- acceptance criteria for this plan should be read as proof-slice criteria first, not as authorization to redesign every phase in one pass

Tasks:

- [ ] Design an evergreen participant reference-library section driven by the catalog.
- [ ] Define Build Phase 1 emphasis inside that section without hiding the broader reference surface.
- [ ] Render the default workshop path separately from optional accelerators.
- [ ] Include a compact Build Phase 1 subset as the primary emphasis while preserving access to the broader participant library.
- [ ] Use the Phase 0 proof artifact as the implementation gate for this panel, and revise it if implementation pressure reveals gaps.
- [ ] Review the panel for mobile readability, action hierarchy, and optionality clarity.
- [ ] Define and run the proof-slice verification protocol covering unit/integration tests, Playwright regression, content verification, and human design review.
- [ ] Decide explicitly whether the proof slice is reusing an existing participant-surface pattern or introducing a new recurring one.
- [ ] Update `docs/dashboard-design-system.md` in the same slice if a new recurring participant-surface pattern lands.

Exit criteria:

- participants can see one default path and a small optional-accelerator set
- participants can still reach the broader participant reference library from the same UI
- the panel helps Build Phase 1 rather than distracting from it
- the proof slice follows the Harness Lab design system or updates it deliberately
- the proof slice passes the agreed verification protocol
- the proof slice is approved for broader integration decisions

## Verification Protocol

The execution slice for this plan must use the standard Harness Lab UI trust boundary rather than a one-off ad hoc check.

Required protocol for the dashboard proof slice:

1. **Static/design review before coding**
   - review the proof artifact against `docs/dashboard-design-system.md`
   - confirm whether the UI is reusing an existing participant-surface pattern or introducing a new recurring one
   - if new, define the pattern and update the design-system doc in the same slice

2. **Implementation-level checks**
   - add or update focused unit/integration coverage for any catalog parsing, ranking, or projection helpers
   - add or update participant-surface rendering tests for the proof slice state

3. **Browser verification**
   - add or update Playwright coverage for the participant proof slice
   - verify the proof slice on mobile-sized and desktop-sized layouts

4. **Content, catalog, and bundle verification**
   - run content generation/verification if any participant-facing authored content or generated readable gallery artifact changes
   - run explicit catalog/projection verification so the readable gallery matches the canonical catalog
   - run workshop-bundle verification if the portable participant bundle contents change

5. **Human review**
   - review the implemented participant proof slice in-browser
   - explicitly check:
     - default path remains visually primary
     - optional accelerators do not read like prerequisites
     - the reference layer is discoverable but not visually dominant over the current phase action
     - the result still feels like Harness Lab

Expected executable checks for the implementation slice:

- `cd dashboard && npm run test`
- `cd dashboard && npm run test:e2e`
- `cd dashboard && npm run lint`
- `cd dashboard && npm run build`
- `npm run generate:content`
- `npm run verify:content`
- `npm run generate:tooling-catalog` *(or the final chosen equivalent command)*
- `npm run verify:tooling-catalog` *(or the final chosen equivalent command)*
- `cd harness-cli && npm run verify:workshop-bundle` when bundle contents change

If Czech visible-surface content changes, include the copy-editor Layer 1 audit and Czech human review before closing the slice.

### Phase 4 — Controlled propagation

Goal: align the remaining participant surfaces only after the proof slice works.

Tasks:

- [ ] Decide whether to add a participant-surface resources section outside Build Phase 1.
- [ ] Decide whether `workshop resources` should consume the same catalog or remain a higher-level bundle overview with catalog links.
- [ ] Propagate the proven pattern into follow-up materials and any dashboard resource sections that need it.
- [ ] Cross-link this work with the broader participant-surface CLI-independence implementation so both plans stay coherent.

Exit criteria:

- the recommendation system is shared across the intended surfaces
- propagation is incremental and evidence-based

## Implementation Tasks

- [ ] **0.1** Audit all current recommendation surfaces and document duplicates, gaps, and implied ownership.
- [ ] **0.2** Define the structured catalog schema and source path.
- [ ] **0.3** Decide and document the readable generated projection strategy.
- [ ] **0.4** Define and document the shared ranking strategy across dashboard, skill, and readable projection.
- [ ] **0.5** Create and review a Build Phase 1 participant reference-layer proof artifact before coding.
- [ ] **1.1** Create the English canonical catalog file.
- [ ] **1.2** Create the reviewed Czech catalog file.
- [ ] **1.3** Migrate current gallery items into the catalog with explicit metadata.
- [ ] **1.4** Add curation and freshness rules for future catalog edits.
- [ ] **2.1** Implement the readable gallery projection from the catalog.
- [ ] **2.2** Align existing learner gallery docs with the projection.
- [ ] **2.3** Update workshop-skill command and reference docs to point at the new source/projection path.
- [ ] **2.4** Verify the workshop bundle ships the new source and readable participant artifact.
- [ ] **2.5** Add explicit catalog/projection verification commands or their final equivalent.
- [ ] **3.1** Design the Build Phase 1 recommendation proof slice in the participant UI.
- [ ] **3.2** Implement the proof slice against the structured catalog.
- [ ] **3.3** Add or update tests for the participant proof slice and any projection helper logic.
- [ ] **3.4** Add or update Playwright coverage for the proof slice and verify mobile/desktop behavior.
- [ ] **3.5** Review the proof slice in browser against the Harness Lab design system.
- [ ] **3.6** Decide whether the proof slice is reusing an existing participant-surface pattern or creating a new recurring one.
- [ ] **3.7** Update `docs/dashboard-design-system.md` if a new reusable participant-surface pattern lands.
- [ ] **4.1** Decide whether and where to propagate the pattern beyond Build Phase 1.
- [ ] **4.2** Cross-link or update the adjacent participant-surface CLI-independence plan if scope or sequence changes.

## Acceptance Criteria

1. Harness Lab has one canonical structured recommendation catalog for participant-facing tooling and follow-on resources.
2. The catalog supports at least these categories: docs, repos, skills, plugins, MCPs, and workflow packs.
3. Every catalog item declares optionality clearly enough to distinguish workshop default from optional accelerator.
4. The participant-visible catalog data follows English-canonical authoring with reviewed Czech delivery.
5. The workshop skill and readable gallery consume the same underlying recommendation set.
6. The portable workshop bundle includes the new canonical source and the participant-readable gallery artifact needed for fallback use.
7. The participant dashboard exposes a reviewed Build Phase 1 proof slice driven by the same catalog.
8. The Build Phase 1 UI proof slice keeps the default workshop path visually primary over optional accelerators.
9. The Build Phase 1 proof slice proves that participants can still reach the broader reference library from the same UI without making it visually primary over the current phase action.
10. The shared ranking behavior is explicit enough that dashboard, skill, and readable projection do not silently diverge.
11. Adding a new recommendation such as Chrome DevTools MCP requires changing one canonical source plus its locale variant, not multiple unrelated prose files.
12. The resulting system remains compact enough that the participant UI and readable gallery still feel curated rather than exhaustive.
13. The implementation slice ships with a documented and executed verification protocol covering tests, browser regression, content verification, catalog/projection verification, and human review.
14. Any new recurring participant-surface pattern either conforms to `docs/dashboard-design-system.md` or updates that design-system doc in the same slice.
15. Broader evergreen participant-reference propagation beyond Build Phase 1 remains an explicit follow-up decision rather than implicit scope creep in this plan.

## References

- `docs/resource-packaging-model.md`
- `docs/learner-reference-gallery.md`
- `docs/locales/en/learner-reference-gallery.md`
- `docs/workshop-content-language-architecture.md`
- `docs/dashboard-design-system.md`
- `docs/dashboard-testing-strategy.md`
- `docs/agent-ui-testing.md`
- `workshop-skill/SKILL.md`
- `workshop-skill/reference.md`
- `materials/participant-resource-kit.md`
- `harness-cli/src/workshop-bundle.js`
- `dashboard/lib/public-page-view-model.ts`
- `dashboard/app/components/participant-room-surface.tsx`
- `dashboard/lib/workshop-data.ts`
- `docs/plans/archive/2026-04-19-refactor-participant-surface-cli-independence-plan.md`
- `docs/plans/archive/2026-04-06-feat-internal-harness-and-learner-resource-kit-plan.md`
