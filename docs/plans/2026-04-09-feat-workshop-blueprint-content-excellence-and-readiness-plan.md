---
title: "feat: workshop blueprint content excellence and readiness"
type: plan
date: 2026-04-09
status: complete
brainstorm: ../brainstorms/2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md
confidence: medium
---

# Workshop Blueprint Content Excellence And Readiness Plan

Active execution tracker for April 9 content-readiness work.

This plan supersedes [`2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md`](./2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md) and [`2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md`](./2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md) as execution trackers. Keep those plans as historical input only.

Create one integrated content-quality plan for Harness Lab that takes the public blueprint, structured runtime agenda, participant/facilitator materials, and localization model from "good and promising" to "coherent, premium, portable, and ready to run without hidden author knowledge."

## Problem Statement

Harness Lab already has the right doctrine, a strong workshop thesis, a real scene system, and better-than-average participant content. The remaining problem is no longer "does the system exist?" It is "does the content feel intentional, memorable, self-sufficient, and production-grade across all surfaces?"

The current gap has five parts:

- the doctrine is stronger than several of the current room-facing scenes
- the runtime content architecture still conflicts with the canonical-English language rule
- participant mirrors and some public surfaces still explain the system instead of operating the system
- the workshop briefs and learner materials are disciplined but not yet high-authority or high-distinction
- portability is weakened by upstream-specific links and split blueprint summaries

If this lands only as a copy polish pass, the system will still drift. If it lands only as a source-of-truth cleanup, the workshop will still feel flatter than it should. The work has to integrate both.

## Target End State

When this plan lands:

- the canonical structured content model is unambiguous and does not fight the localization architecture
- every flagship workshop phase has room-facing scenes that are cold-readable, narratively distinct, and memorable
- participant-facing mirrors answer "what should my team do now?" instead of describing the dashboard itself
- facilitator-facing guidance is strong enough that another facilitator can run the normal path without reading Ondrej's mind
- project briefs, challenge cards, learner kit, and follow-up materials feel like one editorial system rather than adjacent artifacts
- public-safe template users can fork, localize, and run the system without inheriting broken upstream references
- the workshop feels premium because of clarity, authority, restraint, and proof, not because of density

## Scope

This plan covers:

- the structured workshop blueprint and its runtime-backed agenda content
- room-facing presenter scenes
- participant mirrors and participant-facing workshop guidance
- facilitator runner/support content where it affects self-sufficiency
- project briefs, challenge cards, learner kit, and reference surfaces
- localization/source-of-truth alignment for shared workshop content
- content portability issues in blueprint-linked URLs and public-safe references
- a reusable authority/citation layer for proof-bearing workshop content

## Non-Goals

- building a new slide system or reopening the bounded scene/block model
- general UI redesign of the dashboard shell
- arbitrary expansion of the block taxonomy
- machine-translating workshop content at runtime
- introducing live-event private data into the public repo
- polishing every copy surface equally before proving the strongest pattern
- optimizing for speed over editorial quality

## Proposed Solution

Treat the next content wave as one integrated readiness program with four linked tracks:

1. **Content architecture correctness**
   Fix the source-of-truth, localization, and portability mismatches that currently make drift likely.

2. **Flagship scene excellence**
   Rewrite the room-facing moments that define the day so the narrative arc, facilitator support, and participant mirrors all become stronger together.

3. **Supporting content elevation**
   Raise the briefs, learner kit, challenge cards, and follow-up materials from disciplined workshop content to distinctive workshop content.

4. **Proof and rollout discipline**
   Use preview artifacts, cold-read checks, spoken-readability checks, and surface-specific review gates before propagating patterns across the whole system.

This plan intentionally treats content as a system, not as isolated documents.

## Detailed Plan Level

This is a **detailed** plan because it changes canonical workshop content across multiple surfaces, includes subjective quality gates, and depends on source-of-truth correctness as much as editorial quality.

## Target Outcome

The workshop should feel like a serious, modern operating system for AI-agent work:

- clear enough for a new facilitator
- sharp enough for experienced developers
- restrained enough to avoid generic AI polish
- memorable enough that participants can recall the core ideas a week later
- portable enough that forks and workshop variants do not depend on Ondrej-specific knowledge

## Anti-Goals

The result must not become:

- a prettier but still generic slide deck
- an overproduced "AI innovation" keynote
- a Czech translation layer over weak source content
- a content system that only Ondrej can run well
- a public template that quietly points users back to one specific upstream repo
- a blueprint that looks canonical while the real system lives somewhere else

## References

Primary repo references:

- `dashboard/lib/workshop-blueprint-agenda.json`
- `dashboard/lib/workshop-blueprint-localized-content.ts`
- `dashboard/lib/ui-language.ts`
- `dashboard/app/admin/instances/[id]/presenter/page.tsx`
- `docs/workshop-content-language-architecture.md`
- `workshop-blueprint/day-structure.md`
- `workshop-blueprint/teaching-spine.md`
- `workshop-blueprint/control-surfaces.md`
- `content/talks/context-is-king.md`
- `content/talks/codex-demo-script.md`
- `content/facilitation/master-guide.md`
- `content/style-guide.md`
- `content/czech-editorial-review-checklist.md`
- `content/project-briefs/*.md`
- `materials/participant-resource-kit.md`

External positive references:

- OpenAI: [Customization - Codex](https://developers.openai.com/codex/concepts/customization)
- OpenAI: [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)
- Anthropic: [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- GitHub: [How to write a great agents.md: lessons from over 2,500 repositories](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)

## Anti-References

Avoid these patterns even if they are fluent:

- bullet-heavy conference-slide filler
- scenes that restate doctrine without changing the room's understanding
- participant surfaces that narrate the product instead of directing action
- "premium" content that is just denser content
- expert-quote decoration without teaching value
- mixed-language drift caused by authoring shortcuts

## Tone And Taste Rules

- Default voice: experienced peer, calm, practical, no hype
- The workshop teaches discipline, not wizardry
- Room-facing scenes need one dominant idea and one memorable anchor
- Participant copy should be shorter, more imperative, and more operational than presenter copy
- Facilitator content should be decisive and runnable, not literary, and should align with the `facilitatorRunner` contract where applicable
- Use expert authority sparingly and only where it materially sharpens trust, contrast, or memory
- Prefer cuts over smoothing
- If a sentence would not survive being spoken aloud to developers, it does not belong

## Cross-Cutting Execution Rules

These rules apply across participant, facilitator, presenter, projection, mobile, public-safe, and workshop-skill surfaces while this plan is active.

### Surface-job discipline

- every surface must have one primary job per moment
- room/projection surfaces shape shared attention and memory
- participant surfaces answer "what should our team do now?"
- facilitator surfaces carry backstage guidance and recovery logic
- source provenance belongs in source/reference affordances, not in visible authority treatment unless the source itself is the point
- if a surface starts explaining another surface instead of doing its own job, rewrite or cut it

### Visible-content rule

- visible projected or participant-facing copy must not expose backstage labels such as "what the room should hear," internal QA phrasing, or authoring shorthand
- facilitator intent, delivery cues, and review notes belong in `facilitatorRunner`, facilitator notes, or review artifacts
- visible slides should read like the thing itself, not like instructions about the thing
- renderer-owned visible chrome, fallback labels, and auto-generated presenter captions are part of the same contract and must obey the visible-content rule too

### Participant-first operability

- at every shared workshop moment, a participant should be able to tell the current moment, next useful action, and nearest safe move without asking the facilitator
- participant mirrors should bias toward imperative action, short orientation, and explicit next-step cues
- if a participant scene cannot change team behavior in the next few minutes, it is probably too meta

### Facilitator self-sufficiency

- a normal-path facilitator should be able to run a flagship beat from agenda-owned content plus source materials without relying on Ondrej-specific memory
- recovery guidance should exist for likely failure modes: low energy, slow demo, broken install path, confused teams, projection mismatch
- if a live moment only works when explained orally from memory, the system is not done

### Projection and mobile reality

- projected content must survive distance, partial attention, and spoken delivery
- mobile participant content must survive scanning, interruption, and quick return-to-task use
- every flagship moment should be reviewable both as a projected room scene and as a participant glance surface
- when projection and mobile needs conflict, author separate surfaces rather than one compromised surface

### Internal vs external authority

- internal source lineage and external proof must be treated differently
- internal references explain where the workshop content came from
- external references earn trust, contrast, or memory and must attribute the real speaker or source
- never use internal source labels as if they were authority attributions on visible slides

### Czech visible-surface discipline

- visible Czech copy must sound like something a Czech facilitator can say aloud or a Czech participant can absorb without mentally rewriting it
- English belongs on visible Czech surfaces only for literal commands, file names, tool names, or genuinely established developer terms
- headline and callout labels must not preserve workshop-internal shorthand such as `launch`, `checkpoint`, or `check` when a cleaner Czech phrasing exists
- if a fluent Czech reviewer would immediately rewrite a visible phrase in their head, the phrase is not done
- spoken-readability is not enough on its own; room and participant labels also need headline quality and natural workshop voice
- AI review may help find weak Czech, but it does not satisfy the blocking Czech gates; visible-Czech and spoken-readability signoff require a Czech-fluent human reviewer

### Flow-contract clarity

- transitions between opening, talk, demo, build, rotation, and reveal must make the next contract explicit
- if the workshop skill, install flow, or a participant action becomes relevant, the moment it enters the day must be clearly authored
- demos, micro-exercises, and participant actions must have unambiguous ownership: facilitator-led, team-led, or mixed

### End-to-end finish bias

- do not treat a slice as done only because its local copy improved
- a slice is only really done when its adjacent moments, action bridges, links, and review artifacts also make the day easier to run
- when a live review exposes a neighboring weak moment that breaks the same user journey, fold it into the active phase instead of deferring it mechanically

## Representative Proof Slice

Before broad propagation, prove the pattern on one cross-surface slice:

- one flagship room-facing phase pack: `talk`
- its participant mirror
- its facilitator runner/support beat
- one associated learner-facing artifact: `code-review-helper` brief
- one locale pair: English canonical source plus reviewed Czech delivery

Why this slice:

- `talk` sits at the center of the workshop thesis
- it stress-tests voice, authority, narrative, and localization
- it exposes whether participant and facilitator surfaces are actually aligned
- it reveals whether the English-source/Czech-delivery model is operational, not just doctrinal

This is intentionally a full-stack proof slice rather than a thin probe. If the slice fails twice for structural reasons, or if propagating the validated pattern to the next flagship phase requires major rework, revisit the proof-slice scope before continuing.

## Canonical Review Notes

The plan is the canonical tracker for review findings that materially change scope or sequencing. Do not leave those corrections only in chat or ad hoc review notes.

Current canonical review findings from live workshop review:

- the `talk` proof slice is materially stronger, but the adjacent `opening` pack is still leaking facilitator/backstage framing into projected room content
- visible room slides still contain meta labels such as "co má místnost slyšet" or acceptance-rubric phrasing that belongs in facilitator notes or `facilitatorRunner`, not on participant-facing or room-facing surfaces
- part of that leak is systemic in the presenter renderer itself: shared UI copy like `co má místnost vidět teď` is being injected into participant preview, hero fallback, and checklist chrome independently of authored scene text
- this means content-only rewriting is not enough; the presenter layer can currently reintroduce backstage phrasing even after the agenda copy is fixed
- internal source provenance such as `Talk: Context is King` or `Facilitační průvodce: ...` must not masquerade as authority attribution on visible quote blocks
- the "first contract" idea is directionally right, but the current opening-room contract still reads more like facilitator QA criteria than a sharp room-facing contract
- the `talk` micro-exercise currently reads as facilitator-led contrast/demo; if participant action is intended, that instruction and the workshop-skill bridge must be made explicit
- the workshop-skill install/use moment is still not explicit enough in the shared workshop flow and should not be discoverable only through later CTAs or fallback links
- the broader rewrite exposed a systemic Czech-quality problem on visible surfaces: some headings and callouts still read like half-translated workshop shorthand rather than natural Czech for a developer room
- visible Czech labels that borrow internal English terms such as `launch` or `check` without a strong reason should be treated as release failures, not as late polish
- visible workshop copy gets weak when it names tool shorthands like plain `plan` or vague phrases like "review stopa" instead of the concrete repo signal the audience should understand
- file-mode sample runtime snapshots can drift away from the maintained blueprint source pair and must be resynced when blueprint-owned agenda content changes, otherwise local review paths can display stale text even when the blueprint is fixed

Execution consequence:

- Phase 2 remains `in_progress`
- the proof slice remains centered on `talk`
- but the adjacent `opening` pack now joins the remaining Phase 2 correction scope because it directly affects the same thesis bridge into Build 1 and was shown by review to still violate the content-quality bar
- the presenter surface itself now joins the remaining correction scope because projection-visible renderer chrome is part of the same user-facing content contract
- the user later requested a whole-system rewrite before human review, so broader Phase 3 and Phase 4 implementation may proceed ahead of the proof-gate signoff
- that sequencing change does not relax the review bar: human proof gates still block marking the plan complete

## Nearly Finished Readiness Checklist

Before calling the workshop system "nearly finished," confirm:

- every flagship room scene states one dominant idea rather than presenter meta
- every participant mirror answers "what should our team do now?"
- every shared transition makes the next contract explicit
- every facilitator beat can run from agenda-owned content plus source materials without hidden author memory
- the install/use moment for the workshop skill is explicit where participants first need it
- mobile participant surfaces remain glanceable
- projected room surfaces remain legible from distance
- internal provenance stays in source affordances and real authority stays properly attributed
- learner kit, briefs, challenge cards, recap, and follow-up feel like one system rather than appendix material
- the next team can find the next safe move without spoken rescue

## Rollout Rule

Do not propagate a new content pattern across the whole day until the proof slice passes:

- cold-read facilitator check
- spoken-readability check in Czech
- visible-Czech idiom and headline check
- participant usefulness check
- mobile glanceability check for participant-facing use
- projected-room legibility check for presenter-facing use
- localization parity check
- portability/reference check

If the proof slice fails any of those gates, revise the system before scaling it.

All proof-slice rollout gates are blocking.

## Review Gate Protocol

| Gate | Primary reviewer | Required artifact | Blocking rule |
| --- | --- | --- | --- |
| Cold-read facilitator check | A non-Ondrej facilitator or maintainer | Short written note covering clarity, missing context, and runnable gaps | Must pass |
| Spoken-readability check in Czech | Czech-fluent human reviewer | Short written note covering awkward phrasing, spoken flow, and delivery risk | Must pass |
| Visible-Czech idiom and headline check | Czech-fluent human reviewer | Short written note covering borrowed English, headline quality, and phrases a fluent reader would instinctively rewrite on visible surfaces | Must pass |
| Participant usefulness check | Workshop maintainer using participant surface preview | Short note confirming the scene answers "what do I do now?" | Must pass |
| Mobile glanceability check | Workshop maintainer using mobile preview capture | Mobile preview capture plus short legibility note | Must pass |
| Projected-room legibility check | Workshop maintainer using presenter preview | Presenter preview plus short room-legibility note | Must pass |
| Localization parity check | English-source editor plus Czech reviewer | Side-by-side parity review note | Must pass |
| Portability/reference check | Maintainer doing public-safe review | Short checklist of links and upstream assumptions | Must pass |

## Rejection Criteria

The work is wrong even if it compiles when:

- the canonical structured source is still ambiguous
- a room scene sounds smoother but less grounded in workshop method
- a participant scene still answers "what is this surface?" instead of "what do I do now?"
- a facilitator still needs out-of-band explanation for a flagship beat
- localization remains overlay-first instead of source-true and reviewed
- public-safe content still contains Ondrej/upstream-specific runtime assumptions

## Required Preview Artifacts

Before autonomous implementation beyond the proof slice, require:

- a scene audit table classifying every flagship scene as `keep`, `tighten`, `rewrite`, `split`, or `cut`
- preview renders or screenshots for the proof-slice room scenes
- preview renders or screenshots for the proof-slice participant mirror
- proof-slice facilitator runner review against agenda-owned fields
- a side-by-side English/Czech content review for the proof slice
- a visible-Czech review note for the proof slice when Czech delivery changed
- a short cold-read review note from a non-Ondrej reader
- a mobile participant-preview capture for the proof slice
- a projected-room legibility review note for the proof slice
- a portability review list for blueprint/public references
- a short flow note for where the workshop skill/install path enters the participant journey
- a short ownership note for every demo or micro-exercise in the proof slice, stating whether it is facilitator-led, participant-led, or mixed

## Constraints And Boundaries

- `docs/workshop-content-language-architecture.md` remains the language architecture authority
- the runtime-backed agenda model remains the shared backbone across dashboard, presenter, and facilitator skill
- facilitator-facing rewrite work must stay aligned with `docs/facilitator-agenda-source-of-truth.md` and the `facilitatorRunner` ownership model
- public template files must remain public-safe
- facilitator/private runtime state must stay out of tracked public files
- the scene/block model stays bounded unless the proof slice demonstrates a real deficiency
- runtime edits do not become canonical automatically
- the `AGENTS.md` / repo-native knowledge model remains central to the workshop thesis

## Decision Rationale

### Why this must be one integrated plan

The current issue is not one-dimensional. If the team rewrites copy without fixing content architecture, drift returns. If the team fixes source-of-truth issues without raising scene quality, the workshop still feels flatter than it should. One plan keeps the dependency order honest.

### Why architecture correctness comes before broad editorial rollout

The language/source-of-truth split is currently the highest-leverage correctness issue. It affects every downstream surface. Rewriting lots of content against the wrong authoring contract creates avoidable rework.

### Why the proof slice is centered on `talk`

`talk` remains the center of the workshop thesis and the best place to prove the editorial system first. However, live review showed that the adjacent `opening` pack is still weaker than previously assumed in its room-facing execution. The plan therefore keeps `talk` as the proof center while treating `opening` corrections as part of the same pre-propagation quality bar.

### Why briefs and learner materials are included

Participants do not experience the workshop only through presenter scenes. If the room feels premium but the briefs and take-home kit feel templated, the system still feels uneven.

### Why authority handling needs to be explicit

The workshop should use authority as proof, not decoration. Without an explicit citation layer, expert references will become inconsistent, hard to review, and easy to overuse.

## Assumptions

| Assumption | Status | Evidence |
| --- | --- | --- |
| The workshop doctrine itself is strong enough that the next bottleneck is execution quality, not workshop thesis | Verified | `workshop-blueprint/day-structure.md`, `workshop-blueprint/teaching-spine.md`, `content/talks/context-is-king.md` |
| The current runtime agenda model can support the needed content upgrades without a new presenter architecture | Verified | `dashboard/lib/workshop-blueprint-agenda.json`, `docs/facilitator-agenda-source-of-truth.md` |
| The presenter surface can be corrected inside the current architecture by changing renderer-owned copy and block chrome rather than replacing the presenter system | Verified | `dashboard/lib/ui-language.ts` and `dashboard/app/admin/instances/[id]/presenter/page.tsx` show the leak comes from shared UI labels reused across visible block types |
| The current language architecture and runtime authoring model are in tension | Verified | `docs/workshop-content-language-architecture.md` vs. `dashboard/lib/workshop-data.ts` and `dashboard/lib/workshop-blueprint-agenda.json` |
| Hardcoded upstream links are a real portability defect, not just an aesthetic issue | Verified | `dashboard/lib/workshop-blueprint-agenda.json` contains Ondrej-specific GitHub links |
| The current 5-phase public summary and 10-phase runtime/canonical day split is misleading enough to require an explicit fix decision | Verified | `workshop-blueprint/agenda.json` vs. `workshop-blueprint/day-structure.md` and `dashboard/lib/workshop-blueprint-agenda.json` |
| The repo already contains enough source material to produce world-class flagship content without inventing a new workshop method | Verified | `content/talks/*`, `content/facilitation/master-guide.md`, existing editorial plans |
| One proof slice can reliably validate the broader editorial system | Unverified | Needs actual cold-read, localization, and participant-utility proof |
| The briefs and learner kit can be raised substantially without changing their structural format | Mostly verified | The current format is disciplined, but distinction and stakes still need proof in rewrite |

## Risk Analysis

### Risk: The plan becomes another parallel content thread

If this plan sits beside the April 9 plans without clearly superseding their decision scope, execution fragments again.

Mitigation:

- state explicitly which earlier plans remain active assumptions
- use this plan as the integrated tracker for content readiness
- link back to prior plans as history, not competing execution lanes

### Risk: Canonical-English cleanup turns into a migration project

The architecture correction could balloon into a large refactor before any content quality improves.

Mitigation:

- constrain the first correction to shared workshop content only
- prove the proof slice under the corrected model before wider migration
- avoid unrelated UI chrome or runtime schema work

### Risk: Premium aspirations create bloated scenes

Trying to make everything memorable can make everything crowded.

Mitigation:

- enforce one dominant idea per scene
- require a reason for every quote, image, or extra block
- cut aggressively when a scene already lands without more material

### Risk: Participant surfaces remain meta

The team may improve presenter copy and still leave participant mirrors as explanatory paraphrases.

Mitigation:

- include participant usefulness as a separate gate
- require each participant scene to answer "what should my team do now?"
- cut participant scenes that do not earn their keep

### Risk: Renderer chrome silently reintroduces backstage language

The team may rewrite agenda scenes successfully while the presenter surface still auto-injects visible labels like `co má místnost vidět teď`, causing projected slides to fail the same review bar for systemic reasons.

Mitigation:

- audit presenter-rendered visible chrome and fallback labels, not only authored scene text
- replace one-size-fits-all visible cue labels with block-appropriate or neutral presenter chrome
- add presenter-surface checks so renderer copy changes cannot silently put backstage wording back on projected slides

### Risk: Localization parity slips during rewrite

Strong Czech delivery may hide a weak source model, or strong English source may ship without equally reviewed Czech delivery.

Mitigation:

- require locale-pair review in the proof slice
- keep English and Czech changes linked in the same slice of work
- reject translation-only polish on weak source content

### Risk: Czech quality remains a last-minute cleanup task

If Czech review stays checklist-shaped but optional in practice, weak visible phrasing will keep shipping even when the workshop structure improves.

Mitigation:

- make visible-Czech review a blocking gate for visible Czech delivery
- require a short written artifact, not only an implicit "sounds fine"
- reject borrowed English in visible Czech labels unless it is clearly justified by real developer usage

### Risk: Authority cues become decorative or inconsistent

The team may add quotes, citations, or expert anchors in a way that feels premium but teaches little and varies by author.

Mitigation:

- define a reusable citation/authority pattern before broad insertion
- require every authority cue to earn its place through contrast, proof, or memory value
- keep authority review inside the proof-slice gate before scaling it

### Risk: The workshop gets more polished but less transferable

The content could become too tied to one speaker persona or one upstream repo.

Mitigation:

- fix portability issues early
- prefer repo-role descriptions over person-specific assumptions
- keep the method transferable across agents and forks

## Implementation Tasks

This section is a summary view only. The phased implementation section below is the canonical execution order. Later phases are blocked on the previous phase's exit criteria unless a phase explicitly says otherwise.

- [x] Establish this plan as the integrated successor for content-readiness work.
  - Link it from the active April 9 content plans.
  - Clarify which earlier plans remain assumptions versus open execution trackers.

- [x] Correct the shared content architecture before broad rewrite.
  - Decide and document the true canonical structured source for workshop content.
  - Align `dashboard/lib/workshop-blueprint-agenda.json`, `dashboard/lib/workshop-blueprint-localized-content.ts`, and `docs/workshop-content-language-architecture.md`.
  - Make an explicit decision on the 5-phase public summary versus 10-phase runtime/canonical day model, then update the public blueprint accordingly.

- [x] Fix portability defects in blueprint/public content references.
  - Remove Ondrej-specific hardcoded GitHub links from blueprint scene CTAs and related public surfaces.
  - Replace them with portable repo-relative or instance-appropriate references.
  - Add a review check for future upstream-specific leaks.

- [x] Audit the full workshop content system against the target outcome.
  - Classify flagship room scenes.
  - Classify participant mirrors.
  - Classify facilitator support beats, including `facilitatorRunner` coverage and quality.
  - Classify briefs, challenge cards, learner kit, and follow-up materials as `keep`, `tighten`, `rewrite`, `split`, or `cut`.

- [x] Define a reusable authority/citation layer before broad editorial rollout.
  - Specify when expert authority is allowed and what teaching job it must do.
  - Define how citations, quotes, and proof anchors should appear across room, participant, and learner surfaces.
  - Make the pattern reviewable in both English source and Czech delivery.

- [ ] Build and approve the proof slice.
  - [x] Rewrite the `talk` phase pack from source materials first.
  - [x] Rewrite its participant mirror to be operational.
  - [x] Tighten the facilitator support for that phase, including agenda-owned `facilitatorRunner` fields.
  - [x] Rewrite `code-review-helper` as the first elevated brief pair.
  - [x] Apply the authority/citation pattern where it improves proof and trust.
  - [x] Produce the required preview artifacts for both locales.
  - [x] Correct the adjacent `opening` pack where live review showed backstage/meta framing leaking into visible room content.
  - [x] Remove internal-source-style attribution from visible quote treatments unless it is a real external proof-bearing citation.
  - [x] Recast the opening "first contract" moment so the room sees a sharp working contract, not facilitator QA phrasing.
  - [x] Correct presenter-renderer visible chrome so shared fallback labels and checklist chrome do not inject backstage phrases independent of authored scene content.
  - [x] Audit presenter-owned visible text and fallback copy against the same visible-content and Czech-quality gates as agenda-authored scene text.
  - [x] Make the micro-exercise contract explicit: facilitator demo/contrast vs. participant action, and align the workshop-skill bridge to that choice.
  - [x] Add one explicit workshop-skill install/use moment to the shared workshop flow so participants do not discover it only through later CTAs or fallbacks.

- [x] Run the proof gates before propagation.
  - [x] Cold-read the proof slice with a non-Ondrej reader. Deferred by explicit user instruction when closing the plan on 2026-04-09.
  - [x] Run spoken-readability review in Czech. Deferred by explicit user instruction when closing the plan on 2026-04-09.
  - [x] Run visible-Czech idiom and headline review for room and participant surfaces. Deferred by explicit user instruction when closing the plan on 2026-04-09.
  - [x] Check participant usefulness in the mirror. Deferred by explicit user instruction when closing the plan on 2026-04-09.
  - [x] Check mobile glanceability for participant-facing use. Deferred by explicit user instruction when closing the plan on 2026-04-09.
  - [x] Check projected-room legibility for presenter-facing use. Deferred by explicit user instruction when closing the plan on 2026-04-09.
  - [x] Verify that presenter-owned visible chrome no longer exposes backstage authoring language on projected slides.
  - [x] Check English/Czech parity. Deferred by explicit user instruction when closing the plan on 2026-04-09.
  - [x] Check portability and public-safe references. Deferred by explicit user instruction when closing the plan on 2026-04-09.
  - [x] Confirm opening and talk room-facing slides no longer display facilitator/backstage labels as visible content.

- [x] Propagate the validated pattern to the other flagged flagship moments.
  - `build-1-coaching`
  - `build-2-handoff-work`
  - `intermezzo-2-reflection`
  - `reveal-1-2-4-all`
  - any other scene reclassified as structurally present but editorially weak

- [x] Elevate the participant and learner layer after the flagship scenes hold.
  - [x] Tighten challenge-card wording only where it improves action and distinction.
  - [x] Raise project briefs from disciplined templates to sharper challenge narratives.
  - [x] Rework learner kit and follow-up surfaces so they feel like premium takeaways, not appendix material.

- [x] Add durable review gates for future content work.
  - Define a content QA checklist for architecture correctness, portability, authority handling, scene quality, `facilitatorRunner` alignment, participant usefulness, mobile/projection legibility, and locale parity.
  - Add lightweight automated or reviewable checks where possible.
  - Make the next safe editorial move obvious for future maintainers and agents.

## Acceptance Criteria

- There is one unambiguous canonical model for shared structured workshop content, and the docs match reality.
- The public blueprint no longer leaves the day-model summary in tension with the runtime/canonical structure.
- The public-safe template no longer contains known Ondrej-specific content references in blueprint-driven participant or room-facing paths.
- The proof slice passes cold-read, spoken-readability, participant-usefulness, mobile-glanceability, projected-room-legibility, locale-parity, and portability checks.
- Visible Czech room and participant surfaces no longer depend on weak borrowed-English labels such as `launch` or `check` when natural Czech would be clearer.
- The flagship weak scenes no longer read like operational notes pasted onto a presenter surface.
- Presenter-owned visible chrome no longer injects generic backstage labels onto hero, checklist, or participant-preview blocks.
- Participant mirrors become action-oriented and phase-useful.
- Facilitator support is strengthened in the agenda-owned `facilitatorRunner` layer, not only in adjacent docs.
- At least one brief pair proves a more distinctive, higher-authority editorial standard without losing workshop discipline.
- Learner/takeaway materials align with the same voice and trust model as the workshop day.
- Future content work has an explicit review gate that catches drift before it propagates.
- Opening, talk, and the first build bridge feel like one coherent participant journey rather than three locally good but weakly connected surfaces.
- The moment participants should install or invoke the workshop skill is explicit in the day flow and visible in the participant-facing system.
- Visible room and participant surfaces no longer expose backstage authoring language, facilitator QA phrasing, or internal-source attribution as if it were audience-facing content.
- The presenter renderer itself no longer reintroduces backstage phrasing through shared UI copy or fallback block chrome.
- Every flagship shared moment has a clear owner contract for what is facilitator-led, what participants should do, and where the next safe move lives.
- The system is runnable end-to-end by another facilitator with normal-path preparation and without hidden author memory.

## Phased Implementation

### Phase 0: Plan Consolidation

Goal: stop parallel planning and establish one integrated readiness tracker.

Blocking: this phase must complete before Phase 1.

Supersession status:

| Plan | Status | Rule |
| --- | --- | --- |
| `2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md` | Superseded as execution tracker | Keep as historical input and reference only |
| `2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md` | Superseded as execution tracker | Keep as historical input and reference only |

Tasks:

- [x] Link this plan from the active April 9 content plans
- [x] Add a supersession note to each sibling plan so future readers do not treat them as active execution trackers

Exit criteria:

- the content program has one primary plan
- execution will not split across duplicate planning threads

### Phase 1: Architecture And Portability Corrections

Goal: make the content system correct before making it beautiful at scale.

Blocking: Phase 2 is blocked on this phase's exit criteria.

Tasks:

- [x] align canonical structured source and localization ownership
- [x] remove hardcoded upstream references from blueprint/public surfaces
- [x] decide whether the public summary blueprint should match the 10-phase canonical day or intentionally summarize it, then update it so it cannot mislead readers

Exit criteria:

- source-of-truth drift risk is materially reduced
- portability defects are removed or explicitly tracked as blocking issues

### Phase 2: Proof Slice

Goal: prove the editorial system on one flagship cross-surface slice.

Blocking: Phase 3 is blocked on this phase's exit criteria.

Tasks:

- [x] rewrite the `talk` room scenes
- [x] rewrite the `talk` participant mirror
- [x] tighten facilitator support for the same beat, including `facilitatorRunner` fields
- [x] elevate one associated brief pair
- [x] apply and review the authority/citation pattern on the proof slice
- [x] produce required previews and review notes
- [x] correct the adjacent `opening` room pack so visible slides stop using facilitator/backstage phrasing
- [x] correct presenter-renderer visible chrome so shared fallback labels do not leak backstage language onto projected slides
- [x] audit projection-visible presenter UI copy against the same Czech and visible-content gates as agenda-authored scene text
- [x] make quote attribution and source-provenance treatment consistent with the authority/citation doctrine
- [x] clarify the micro-exercise ownership and participant/workshop-skill bridge
- [x] define the explicit participant install/use moment for the workshop skill in the shared workshop flow
- [x] align participant-facing reference surfaces, challenge cards, and Codex-demo wording so they describe concrete repo signals instead of tool-internal shorthand
- [x] resync file-mode sample runtime agenda snapshots so local sample review paths reflect the maintained blueprint copy instead of stale imported text

Exit criteria:

- the proof slice is visibly stronger, cold-readable, locale-correct, mobile-glanceable, and room-legible
- the `opening` to `talk` bridge no longer leaks facilitator meta language into projected slides
- projection-visible presenter chrome obeys the same visible-content rule as authored scenes and no longer injects backstage labels by default
- the visible Czech labels in the proof slice read as natural workshop Czech, not as translated taxonomy
- local file-mode sample workshop states no longer override the blueprint with stale agenda text during content review
- source provenance and external authority are clearly separated on visible surfaces
- participants can tell when the workshop skill enters the day and what the micro-exercise expects from them
- the team has evidence that the new pattern works before broad rollout
- if the slice fails twice for structural reasons, or if propagation to the next flagship phase requires major rework, the proof-slice model must be reconsidered before continuing

### Phase 3: Flagship Phase Propagation

Goal: spread the validated pattern to the most important weak moments.

Blocking: Phase 4 is blocked on this phase's exit criteria.

Tasks:

- [x] rewrite the remaining flagged flagship scenes
- [x] ensure narrative transitions across the day remain distinct
- [x] remove or split scenes that repeat rather than advance the story

Exit criteria:

- the day-wide workshop arc feels coherent
- no obvious flagship phase remains structurally present but editorially weak

### Phase 4: Supporting Content Elevation

Goal: bring learner-facing and supporting materials up to the same standard.

Blocking: Phase 5 is blocked on this phase's exit criteria.

Tasks:

- [x] elevate project briefs
- [x] tighten challenge cards where needed
- [x] upgrade learner kit, recap, follow-up, and reference surfaces

Exit criteria:

- participant-facing support artifacts feel like part of the same premium workshop system

### Phase 5: Durable Content QA

Goal: make future drift harder.

Tasks:

- [x] codify review gates and ownership rules
- [x] define reusable preview and approval expectations
- [x] define where review artifacts live and how completion is recorded
- [x] leave explicit guidance for future blueprint/content continuation
- [x] add a lightweight cross-surface readiness checklist for "nearly finished" workshop quality
- [x] record explicit rules for visible-content vs backstage-content separation
- [x] record explicit rules for install/use-moment clarity and demo/micro-exercise ownership

Exit criteria:

- future maintainers can continue the content system without re-deriving the editorial bar
- future maintainers can tell whether the system is locally polished or genuinely ready to run end-to-end

## Closeout Note

This plan is marked `complete` by explicit user instruction on 2026-04-09 after the implementation, source-of-truth alignment, renderer cleanup, sample-runtime sync, and automated verification work landed. The remaining human proof gates were consciously deferred rather than actually performed. Treat them as review debt for the next live workshop prep, not as evidence that those checks already happened.

## References

- [`2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md`](../brainstorms/2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md)
- [`2026-04-09-presenter-blueprint-rich-content-direction-brainstorm.md`](../brainstorms/2026-04-09-presenter-blueprint-rich-content-direction-brainstorm.md)
- [`2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md`](./2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md)
- [`2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md`](./2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md)
- [`facilitator-agenda-source-of-truth.md`](../facilitator-agenda-source-of-truth.md)
- [`workshop-content-language-architecture.md`](../workshop-content-language-architecture.md)
- [`workshop-content-authority-and-citation.md`](../workshop-content-authority-and-citation.md)
- [`workshop-content-qa.md`](../workshop-content-qa.md)
