# Rich Presenter Scene Authoring

This document defines the proof-phase workflow for richer blueprint scenes.

Use it when you are upgrading the canonical presenter content, introducing blueprint visuals, or deciding whether a runtime scene experiment belongs back in the reusable blueprint.

## Scope

This workflow is for reusable room-facing content:

- blueprint scene packs
- reviewed local blueprint visuals
- localized room copy
- facilitator notes that should survive to future workshop instances

It is not for live workshop timing tweaks, team-specific projector moments, or facilitator-only event notes.

## Proof-First Rule

The first release gate is the `opening` pack.

Before a content pattern spreads to the rest of the day, the proof pack must show:

- one dominant voice per scene
- one main idea per scene
- a visible room-facing narrative beat, not a text dump
- room-facing proof scenes fit the projection baseline without vertical scrolling unless the scene is explicitly marked as scroll-allowed
- facilitator notes strong enough for a cold-read run
- at least one reviewed local visual that materially improves comprehension

## Asset Model

Blueprint visuals use a two-part storage model:

1. Binary assets live under `dashboard/public/blueprint/<phase>/`.
2. Metadata lives in `dashboard/public/blueprint/assets/manifest.json`.

Every reviewed asset record should include:

- stable `id`
- served `src`
- review status
- legal status
- license note
- creation path
- localization note
- recommended scene ids
- default source label and optional source href

Rules:

- Scene blocks should use local repo-served asset paths, not ad hoc remote URLs.
- Prefer text-free visuals so localization stays in scene copy instead of baked into images.
- If a visual contains embedded text, treat each delivery locale as a reviewed asset decision, not an automatic translation.
- Default drafting path is AI-assisted image generation via `gemini-imagegen`, followed by maintainer review.
- Fallback is a maintainer-authored or Ondrej-supplied asset when generated output is generic, inaccurate, or visually weak.

## Authoring Workflow

1. Start from repo source material first:
   - `content/talks/`
   - `content/facilitation/`
   - relevant workshop docs
2. Choose the scene's dominant voice:
   - Ondrej for opening, reveal, and reflection moments
   - expert or evidence voice for teaching and demo moments
3. Promote the room-facing content into:
   - `dashboard/lib/workshop-blueprint-agenda.json`
   - `dashboard/lib/workshop-blueprint-localized-content.ts`
4. Attach reviewed local visuals only when they sharpen the point of the scene.
5. Keep facilitator notes separate from room content.
6. For room-facing proof scenes, preview at the presenter baseline (`1024x768` today) and treat vertical scroll as a failure unless the scene is explicitly in a scroll-allowed family.
7. Add or update regression tests for the scene structure or rendering behavior you changed.

## Fit Contract

Room-facing presenter scenes are designed for a one-screen projection beat.

Default rule:

- if the scene is meant to be read in one facilitator beat, it should fit the presenter proof viewport without vertical scrolling
- if a scene needs two independent beats, split it rather than relying on scroll
- if the extra material mainly helps delivery rather than the room, move it to facilitator notes or runner guidance

Scroll-allowed exceptions:

- `team-trail` scenes that intentionally display accumulated team check-in history
- explicitly designated participant-support scenes where accumulated context is the point of the surface
- runtime experiments that have not yet been promoted into the reusable blueprint

When a scene is allowed to scroll, say so in the implementation/review note instead of letting it happen implicitly.

Visual grammar rule for room-facing principle scenes:

- do not render non-interactive principles like faux checkboxes or admin controls
- checklist-style room content should read like commitments or operating signals, not unfinished form UI

## Cold-Read Gate

A flagship scene pack is not done until a non-Ondrej facilitator can read the scene plus notes and run the moment coherently.

Pass criteria:

- they can explain the point of each scene without extra oral briefing
- they know which sentence is the main beat and which detail is optional
- they can tell what to ask the room next
- they do not need hidden context outside the repo

Failure examples:

- the notes describe intent only in Ondrej shorthand
- the room copy needs improvisation to land
- the scene stack contains two ideas that should have been split
- the scene only works because the presenter page scrolls

## Vibe Check

After the cold-read pass, do a short editorial review using these criteria:

- clarity: the point lands in one read
- restraint: there is no filler block or filler sentence
- premium feel: the scene looks authored, not auto-filled
- narrative beat: the scene changes the room state, not just repeats information
- every word earns its place

If two or more criteria fail, refine the pack before propagating the pattern.

## Publish-Back Rule

Runtime scene edits remain instance-local unless a maintainer deliberately promotes them.

Promotion path:

1. Capture the runtime experiment in the private workshop instance if needed.
2. Decide whether the improvement is reusable.
3. If reusable, update the canonical blueprint files in this repo.
4. Add or update the asset manifest entry when a visual is involved.
5. Add or update tests and any facilitator-skill guidance that depends on the new scene pattern.

The dashboard must not imply that reset, archive, or runtime scene editing writes back into the blueprint automatically.
