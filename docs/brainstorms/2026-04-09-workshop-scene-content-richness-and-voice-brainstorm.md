---
title: "Workshop Scene Content Richness and Voice"
type: brainstorm
date: 2026-04-09
participants: [Ondrej, Heart of Gold]
related:
  - 2026-04-08-facilitator-presenter-rich-content-redesign-brainstorm.md
  - 2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md
  - ../../dashboard/lib/workshop-blueprint-agenda.json
  - ../../dashboard/lib/workshop-data.ts
  - ../../dashboard/app/admin/instances/[id]/presenter/page.tsx
  - ../../content/talks/context-is-king.md
  - ../../content/talks/codex-demo-script.md
  - ../../content/facilitation/master-guide.md
---

# Workshop Scene Content Richness and Voice

## Problem Statement

When a facilitator spins up a workshop instance, the imported scenes should carry weight on their own — authoritative content with expert voices, visual anchors, and a narrative arc that builds across phases — so both the facilitator and the participants feel they are inside a premium experience, not a lecture with bullet points.

Two symptoms drive this:

1. **Content is thin.** Scenes read like placeholders. No curated expert voices, no visual anchors, no quotes that earn trust. The blueprint prose is serviceable, not memorable.
2. **Narrative is flat.** Scenes technically function, but they do not build energy across the day. There is no story arc from opening to reveal. No peaks, no payoff. Participants are unlikely to remember any single moment a week later.

The leading edge is **content + narrative**, not rendering or authoring workflow. Rendering and authoring are enablers; content and narrative are what the audience actually experiences.

The hard constraint that shapes every decision below: **scenes must be self-sufficient enough that another facilitator — not Ondrej — can run the workshop from the scene content + facilitator notes alone**, without reading Ondrej's mind.

## Context

### What the 2026-04-08 brainstorm already decided (and shipped)

Yesterday's `facilitator-presenter-rich-content-redesign-brainstorm.md` resolved the **structural** questions:

- Rich block model is the right shape — `hero`, `rich-text`, `bullet-list`, `quote`, `steps`, `checklist`, `image`, `link-list`, `callout`, `participant-preview`
- Facilitator notes are separated from room content
- Chrome presets control room-facing layout (`minimal`, `agenda`, `checkpoint`, `participant`)
- Scenes group into presenter packs under each agenda item
- Explicit non-goal: do not build a generic slide editor

Codebase verification confirms these are implemented. `PresenterScene`, `PresenterBlock`, and `PresenterChromePreset` are all typed in `dashboard/lib/workshop-data.ts`. The CRUD API at `/api/workshop/instances/[id]/scenes` supports create, update, move, toggle, and delete.

**So the container exists. The container is mostly empty.**

### The gap between container and contents

The blueprint JSON at `dashboard/lib/workshop-blueprint-agenda.json` defines 26 scenes across 10 phases (`opening`, `talk`, `demo`, `build-1`, `intermezzo-1`, `lunch-reset`, `rotation`, `build-2`, `intermezzo-2`, `reveal`). For most of those scenes, the JSON has no explicit `blocks[]` array — the system falls through to `buildFallbackPresenterBlocks()`, which generates a minimal `hero` + `rich-text` pair from the `title` and `body` fields.

Result: every scene renders as the same shape. The rich block palette exists and is unused.

### Renderer gaps worth flagging

Three small but real gaps in the renderer that will hurt any content work if left alone:

1. The `callout` block is **defined in types but not rendered with tone-aware styling** (`info` / `warning` / `success`) in `dashboard/app/admin/instances/[id]/presenter/page.tsx`. It falls through to a generic `BlockCard`.
2. There is **no code block** with syntax highlighting — important for a workshop that teaches agentic coding.
3. There is **no video embed block** — and there are teaching moments (demos, expert clips) where video would carry more weight than text.

These are small and bounded. Fixing them is well inside "enablement for content," not scope creep.

### Pre-existing source material the new content should draw from

The repo already contains richer workshop content than the blueprint exposes:

- `content/talks/context-is-king.md` — the core reframing line, a meaningful quote, micro-exercise framing, and a substantial thesis list
- `content/talks/codex-demo-script.md` — concrete demo sequence plus fallbacks
- `content/facilitation/master-guide.md` — milestone boards, facilitator prompts, intermezzo structure, rotation instructions, reflection frames
- `content/facilitation/codex-setup-verification.md` — setup verification flow

Any content rewrite draws from these first. The workshop method is already defined; we are structuring and elevating it, not inventing new copy.

### External research: what premium workshop content looks like

Comprehensive research on expert presentation and workshop design (TEDx, Nancy Duarte, Aaron Weyenberg, Nielsen Norman, modern LMS patterns, Slidev/Reveal/Marp) converged on a small number of load-bearing principles:

- **One idea per scene.** TED rule. Bullet-and-headline slides are a failure mode. If a scene carries two ideas, split it.
- **The Dead Laptop Test.** The spoken track should carry the talk alone; the visual track amplifies. Scenes are the chorus, not the verse.
- **Duarte story arc at every level** (session, module, scene): current reality → complication → new frame → resolution → one next step.
- **Progressive disclosure** — toggles and accordions reduce cognitive load without losing depth. (Currently not in our block palette.)
- **Callout + quote rhythm** — a visual cadence that breaks long content and rewards scanning.
- **One sentence per data visualization** — every chart has a single-sentence point of view (Duarte's DataPOV).

### External voices with citation integrity

Expert quotes available as authority anchors, sourced from primary locations:

- **Sam Altman** — on agents joining the workforce in 2025, on linear intelligence → super-exponential value (*Three Observations* blog)
- **Dario Amodei** — "country of geniuses in a data centre"
- **Andrej Karpathy** — "intent specification and task decomposition are the new coding"
- **Addy Osmani** — the 80% Problem; the four agentic engineering practices (plan → direct → test → own)
- **Simon Willison** — precision on what vibe coding isn't ("reviewed, tested, and understood ... that's using an LLM as a typing assistant")
- **Lenny Rachitsky** — the agency-control tradeoff; gradually earning trust
- **Anthropic on MCP** — "Even the most sophisticated models are constrained by their isolation from data"

## Chosen Approach

**Phase-by-phase content sweep through all 10 blueprint phases, using the existing rich block palette + a small set of targeted renderer fixes, with content derived from repo source material and anchored by curated expert quotes.**

Five operating principles:

1. **You frame, experts anchor.** Ondrej's voice (vulnerable, reflective, no corporate fluff) carries the opening, reveal, and reflection phases. Expert quotes anchor the teaching, demo, and briefing phases. Each scene has **one dominant voice**, never both mashed together.
2. **Every word earns its place.** Premium restraint — Stripe/Linear/a16z in spirit. Density is a failure mode, not a feature. Self-sufficient for a cold-read facilitator without drifting into document-density.
3. **Images are interwoven or standalone.** When an image matters, it stands alone in its own scene. When a scene is primarily textual, images play a supporting role. No decorative filler.
4. **Content is derived, not invented.** Source from `content/talks/` and `content/facilitation/` first. Expert quotes supplement. Ondrej's framing voice wraps.
5. **Pause for vibe-check after Phase 1.** Sweep begins with the `opening` phase. After it ships, everything halts for a deliberate review before the pattern is locked for the remaining nine phases.

Scope boundary: **content rewrite + three small renderer fixes.** Nothing more.

The three renderer fixes:
- Wire up `callout` tone-aware styling (`info` / `warning` / `success`)
- Add a `code` block with syntax highlighting (Shiki recommended — same library Slidev uses, small footprint, ships to the presenter page only)
- Add a `video-embed` block — thin iframe wrapper for YouTube / Loom / Vimeo with caption and attribution

Image pipeline: **AI-generated with human curation.** Candidates generated with `gemini-imagegen` / `babel-fish:image`. Ondrej reviews, accepts, regenerates, or replaces. Fallback: Ondrej supplies images directly when the AI output trips into generic territory.

## Why This Approach

It optimizes for:

- **Premium feel without a freeform slide editor.** Uses the disciplined structural model from yesterday's brainstorm rather than reopening it.
- **Fast visible wins.** Content work inside an existing block palette starts shipping in days, not weeks.
- **Self-sufficient facilitation.** Separation of facilitator notes + visible room content directly serves the cold-read test.
- **Authority without copy-paste.** Expert quotes add trust; repo-derived content keeps Ondrej's voice; AI images keep pace.
- **Bounded scope.** Three small renderer fixes, not a renderer overhaul.

It avoids:

- Reopening yesterday's structural decisions
- A new content model or block schema
- A slide authoring product
- Ambitious interactive components (live MCP demos, runtime Vue/React embeds) that would balloon scope

## Key Design Decisions

### Q1: Content or rendering first? — RESOLVED

**Decision:** Content first, with three small targeted renderer fixes inline.

**Rationale:** The leading pain is content thinness, not rendering capacity. The existing rich block palette is already under-used — there is no point building more block types before using the ones we have. The three exceptions (`callout` tone, `code`, `video-embed`) are small and will actively block good scenes if unfixed.

**Alternatives considered:**
- *Pure content* — cleanest scope but ships with the known `callout` bug and no place to put code or video examples
- *Ambitious rendering* — new block types for toggle/accordion, two-column, stat cards, stretch live-components. Rejected as scope creep; can come later if content reveals the need

### Q2: Phase-by-phase sweep vs. golden-example vs. full rewrite — RESOLVED

**Decision:** Phase-by-phase sweep through all 10 phases, with a mandatory vibe-check pause after Phase 1 (`opening`).

**Rationale:** Ondrej's preference is predictable cadence, and the opening phase is a natural stress test — if we can get `opening` to feel premium, the pattern transfers. The pause after Phase 1 is the mitigation for the "we lock in the style before testing it" risk.

**Alternatives considered:**
- *Golden example first* (recommended by HoG initially) — pick 2-3 hero scenes, polish, then replicate. Rejected in favor of phase-by-phase predictability
- *Full rewrite in one pass* — rejected, highest stall risk
- *Just opening + reveal* — rejected, leaves the middle flat

### Q3: How should voice balance work across scenes? — RESOLVED

**Decision:** Ondrej frames, experts anchor. One dominant voice per scene.

- Opening / reveal / reflection → Ondrej's voice (personal, reflective, vulnerable)
- Talk / demo / briefing / checkpoint → expert voices with curated quotes
- Transition scenes → context-dependent, biased toward Ondrej's voice for continuity

**Rationale:** Mixing voices inside a single scene feels schizophrenic. Clean separation by scene lets each voice do what it does best. Authority from experts, intimacy from Ondrej.

**Alternatives considered:**
- *Heavy expert, light personal* — rejected, loses the personal signature
- *Heavy personal, experts as seasoning* — rejected, under-utilizes authority anchors
- *I draft, you rebalance* — rejected, slower and leaves the voice principle implicit

### Q4: How should images be sourced? — RESOLVED

**Decision:** AI-generated with curation, via `gemini-imagegen` / `babel-fish:image` skills. Ondrej supplies images when AI output drifts toward generic.

**Rationale:** Matches Ondrej's preferred workflow and respects the pace of a phase-by-phase sweep. The curation gate prevents AI-slop from contaminating the premium vibe.

**Alternatives considered:**
- *You supply, I place* — rejected, bottlenecks on Ondrej's image production
- *Mixed split by abstract vs. specific* — rejected as needlessly rigid; the real split is quality, not subject type
- *Skip images for v1* — rejected, images are load-bearing for the premium vibe

### Q5: How do we protect against voice / vibe drift across phases? — RESOLVED

**Decision:** Mandatory pause-and-vibe-check after Phase 1 (`opening`) ships, before committing the pattern to the remaining nine phases.

**Rationale:** Addresses the unverified assumption that phase-by-phase preserves consistency. Cheap insurance. If the opening phase feels right, we proceed with confidence. If it does not, we course-correct before nine more phases inherit the wrong pattern.

**Alternatives considered:**
- *No checkpoint* — rejected, too much downstream risk
- *Checkpoint after every phase* — rejected, too much friction; opening is the natural inflection point

### Q6: How deep should we go on pre-existing repo content? — RESOLVED

**Decision:** Source from `content/talks/` and `content/facilitation/` first. Expert quotes and images layer on top. Ondrej's framing voice wraps.

**Rationale:** Yesterday's Q8 already decided not to invent new presenter copy from scratch. This brainstorm extends that: existing repo content is the skeleton; external voices and images are the flesh. This keeps the content grounded in Ondrej's method while raising authority and visual weight.

**Alternatives considered:**
- *Write fresh presenter copy* — rejected, duplicates and weakens
- *Pure external-expert curation* — rejected, loses personal voice and method fidelity

## Assumption Audit Results

**Bedrock (verified):**

- The existing block types render today and can carry most of the content work (verified in `dashboard/app/admin/instances/[id]/presenter/page.tsx` and `dashboard/lib/workshop-data.ts`)
- Expert quotes can be cited with integrity — primary sources identified during research phase
- The blueprint-to-instance import flow (`createAgendaFromBlueprint` → `createWorkshopStateFromInstance`) will pick up any new blocks added to the blueprint JSON automatically
- Pre-existing repo content (`content/talks/`, `content/facilitation/`) provides a non-invented substrate

**Unverified — accepted with mitigations:**

1. *Phase-by-phase preserves consistency.* Mitigation: **mandatory vibe-check pause after Phase 1** before the pattern propagates.
2. *AI-generated images will feel premium enough.* Mitigation: **curation gate per phase** — if the first batch feels generic, pivot to Ondrej-supplied images or escalate image quality bar.
3. *Facilitator cold-read self-sufficiency is achievable.* Mitigation: **explicit cold-read test** during the vibe-check — a non-Ondrej reader tries to run a scene from content + notes alone.

**Weak (worth watching):**

4. *"Ondrej frames, experts anchor" maps cleanly to scene types.* Mitigation: treat the mapping as a default, not a rule. A demo scene narrated in Ondrej's voice is allowed to break the pattern if it reads better.

## Open Questions (for `/plan`)

- **Phase sequencing within the sweep.** Does "phase-by-phase" run strictly in agenda order (opening → talk → demo → build-1 → ...) or weighted by impact (opening → reveal → demo → talk → ...)? Recommended: agenda order, because it matches the narrative arc the day will actually take.
- **Where does the `code` block get its theme?** Matching the dashboard's existing design system (Geist, dark-leaning) vs. a distinct presenter-only code theme.
- **Image storage and versioning.** Commit generated images into the repo under `dashboard/public/blueprint/` with scene IDs, or use a separate asset directory? What about image licensing metadata?
- **Quote attribution format.** Short (name + title) or full (name, title, publication, date)? The latter carries more authority but takes visual space.
- **Localization impact.** English content already overlays the Czech blueprint via `workshop-blueprint-localized-content.ts`. Do new expert quotes get localized, or stay in original language with attribution?
- **Vibe-check success criteria.** What are the explicit, falsifiable criteria for the post-Phase-1 checkpoint? ("It feels right" is not operational.)
- **Cold-read test logistics.** Who is the non-Ondrej reader, and how formal does the test need to be?
- **Source-of-truth for expert quotes.** Should there be a `content/voices/` directory that stores curated expert quotes with citations, so they can be reused across scenes and audited?

## Out of Scope

- New block types beyond `callout` tone fix, `code`, and `video-embed`
- A slide authoring UI, drag-and-drop editing, or generic page builder
- Interactive live components (MCP demos running inside scenes, live Claude chats, executable code inside scenes) — can be a future brainstorm
- Freeform markdown or HTML inside scenes (rejected in yesterday's brainstorm, stays rejected)
- Rich animation, scene transitions, or motion design
- Reworking the chrome preset system (already settled)
- Reworking the agenda model or phase structure (already settled)
- Second-screen / presenter-notes surface (explicit non-goal in dashboard-surface-model.md)
- Multi-blueprint support or blueprint variants
- Per-scene versioning / history

## Relationship to Prior Brainstorms

This brainstorm **builds on** `2026-04-08-facilitator-presenter-rich-content-redesign-brainstorm.md` — it does not contradict it. Yesterday decided the container; today decides the contents.

- Yesterday's Q3 chose the block palette. Today uses that palette as-given.
- Yesterday's Q4 separated facilitator notes from room content. Today leans on that separation for the cold-read facilitator test.
- Yesterday's Q8 decided to derive content from existing repo material. Today extends that with external expert quotes and AI-generated imagery as supplementary layers.

No open questions from yesterday are reopened. Two of yesterday's open questions are touched (images, notes visibility) and deferred to `/plan`.

## Next Steps

- `/plan` this brainstorm into an implementation plan covering:
  - Three renderer fixes (`callout` tone styling, `code` block with Shiki, `video-embed` block)
  - Phase 1 content sweep (`opening` phase, all scenes)
  - Vibe-check checkpoint criteria
  - Cold-read test setup
  - Image generation + curation loop
- After Phase 1 ships and passes the vibe-check, decide whether to continue the sweep in agenda order or re-sequence
- Consider a future brainstorm on interactive / live components (MCP demos inside scenes) once the content baseline is solid
- Candidate for `/compound`: the "you frame, experts anchor" voice-mapping rule may generalize beyond this project and is worth capturing as a pattern
