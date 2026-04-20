---
title: "chore: workshop-day readiness for 2026-04-21 (Seyfor cohort)"
type: plan
date: 2026-04-20
status: approved
brainstorm: null
confidence: high
---

# Workshop-day readiness — 2026-04-21 Seyfor cohort

One-line: land every remaining copy fix for the *no-repo-switching* variant, wire the day's reference resources into the right moments, dry-run once, and set a short post-day learning capture so tomorrow is both amazing and teaches us something portable.

## Problem statement

The *no-repo-switching* pack was rewritten from "handoff between teams" to "people keep their own repo, teams reshuffle, fresh reader continues." The direction is right but the sweep is partial:

1. Two concrete copy misses will surface during the day (one in the live local pack, one in a tool participants call themselves).
2. One voice rule from `feedback_participant_copy_voice.md` (Rule 1 — defocus the rescue/survives motif) is violated in the opening hero of `workshop-content/agenda.json`, which seeds the whole day's framing.
3. The *reshuffle* mechanic is named inconsistently — `rotace / po rotaci` (15 hits) and `promíchaný tým / po promíchání` (13 hits) compete inside the same pack.
4. Four external artifacts (Tailscale previews), two canonical diagrams (Fowler harness-engineering, OpenAI observability stack), and two external standards (`agents.md`, `agentskills.io`) were named by the user as *"use during the day"*, but they are not currently wired into any scene, `sourceRefs`, or facilitator prompt.
5. No dry-run of the revised day exists; no explicit fallback if any resource URL fails from the venue network.

We also want tomorrow to teach us something for future cohorts, without turning day-readiness into a post-mortem planning exercise.

## Target end state

By end of day 2026-04-20:

- `.local/workshop-packs/no-repo-switching-{cs,en}.json` and `workshop-skill/reference.md` contain no remaining *handoff / another team / next team / předání* phrasing on any participant-visible surface.
- Opening hero body (EN and CS) no longer uses the `seen what survives / uvidíte, co přežije` motif.
- The *reshuffle* mechanic uses a single house term per language (recommendation: see Decision Rationale §D1).
- The 4 Tailscale artifacts + 2 diagrams + 2 external standards are linked from the exact agenda moments where a facilitator or participant would reach for them, with each link documented in a single `docs/facilitation/day-resource-map-2026-04-21.md` so the facilitator can scan one page instead of hunting through JSON.
- One quiet dry-run completed against the actual pack file (load → verify key scenes render → click every external link from a venue-representative network).
- `docs/solutions/workshops/` has a one-paragraph stub with a "what to capture tomorrow" checklist so learnings get written while they are fresh, not lost.

## Scope and non-goals

**In scope**

- `.local/workshop-packs/no-repo-switching-cs.json`
- `.local/workshop-packs/no-repo-switching-en.json`
- `workshop-content/agenda.json` — only the opening-hero "survives" motif (because it's the seed of the day) and the lunch `facilitatorRunner.say[0]` bug (because the EN local pack inherits the same shape)
- `workshop-skill/reference.md` — the 3 lines that surface under `$workshop reference`
- A new `docs/facilitation/day-resource-map-2026-04-21.md` (facilitator resource map)
- A new `docs/solutions/workshops/2026-04-21-seyfor-cohort-capture-checklist.md` stub

**Out of scope**

- Porting brief rewrites from the local pack back into canonical `workshop-content/agenda.json` project briefs. That is the deliberate next-step per `.local/workshop-packs/README.md`, and doing it tonight adds surface area without improving tomorrow.
- `materials/participant-resource-kit.md` *handoff* wording — this is a **post-workshop** take-home artifact, not surfaced during the day. Defer to the post-day sweep.
- Derived files (`dashboard/lib/generated/agenda-*.json`, `workshop-blueprint/agenda.json`). Regenerate from source.
- Any dashboard / CLI / auth code changes, including the *Identify Flow Preview v2* work landed behind the Neon Auth spike. Tomorrow runs on the already-reset production state.
- Translating the Seyfor capability map into a participant surface — it is facilitator-only cohort intel.

## Proposed solution

Four sequential passes, roughly 45–90 minutes each, with a single dry-run gate after pass 3.

**Pass 1 — Finish the copy sweep** (mechanical, low-risk). Fix the 2 concrete misses + the 1 voice-rule violation + unify the *rotace/promíchání* term across the pack.

**Pass 2 — Wire the day's resources.** Add each external resource as a `sourceRef` on the scene where it is most useful, and simultaneously author `docs/facilitation/day-resource-map-2026-04-21.md` as the single page the facilitator keeps open on a second device. The facilitator map is the operational truth; the JSON embedding is so participants who reach for `$workshop reference` also find the links.

**Pass 3 — Regenerate and dry-run.** Regenerate `dashboard/lib/generated/agenda-{cs,en}.json` and `workshop-blueprint/agenda.json` from the pack. Open the participant surface on the browser, walk the day end-to-end, click every external link from a phone hotspot (venue-representative network).

**Pass 4 — Capture scaffolding.** Write the learning-capture stub so tomorrow's notes have a place to land *while hot*, not reconstructed afterward.

## Implementation tasks

Dependency-ordered; pass numbers match Proposed Solution.

### Pass 1 — Copy sweep

- [ ] **T1.1** — Fix lunch-phase `facilitatorRunner.say[0]` in EN pack. `.local/workshop-packs/no-repo-switching-en.json:1402` currently reads `"Handoff is not the end of the day. It is a design constraint throughout the day."`. Replace with `"Fresh readers are not the end of the day. They are a design constraint throughout the day."` to match the `facilitatorPrompts` one level up.
- [ ] **T1.2** — Same fix in canonical. `workshop-content/agenda.json:3094`, same string. Apply the same replacement. This prevents the derived files from regenerating the stale line if anyone rebuilds from canonical before Pass 3.
- [ ] **T1.3** — Kill the `survives / přežije` motif in the opening hero. `workshop-content/agenda.json` lines ~117, ~125 (EN hero and block repeat), ~135, ~143 (CS hero and block repeat). Rewrite trailing clause:
  - EN: `"…and seen what survives."` → `"…and watched them carry it forward."` (or agreed equivalent that honours Rule 1)
  - CS: `"…a uvidíte, co přežije."` → `"…a uvidíte, jak v ní dál pokračují."` (or equivalent using `obstojí` / `unese`)
  Keep the clause short; it lands last in a hero paragraph.
- [ ] **T1.4** — Unify the *reshuffle* term per Decision §D1. Default recommendation: keep `rotace` ONLY where it denotes the meta-concept (*"každá čerstvá session agenta je rotace"*); replace every temporal *po rotaci* with *po promíchání* (or *po čerstvém přečtení* where that reads more naturally) in `.local/workshop-packs/no-repo-switching-cs.json`. Same pass for EN: `after rotation` → `after the reshuffle` / `after the fresh read`. Target hits: 15 CS, ~10 EN. Leave scene IDs (`rotation-*`) unchanged — structural, never surfaced.
- [ ] **T1.5** — `workshop-skill/reference.md` — 3 lines on this surface:
  - Line 13: `` `Handoff is a continuous constraint` — the next team should find the first safe move without your explanation`` → `` `Continuation is a continuous constraint` — a fresh reader should find the first safe move without your explanation``
  - Line 29: `"that helps the next team understand the intent?"` → `"that helps a fresh reader understand the intent?"`
  - Line 31: `"Can a new team find the first safe move within a few minutes?"` → `"Can a fresh reader find the first safe move within a few minutes?"`
  This surface is called from `$workshop reference` during the day.
- [ ] **T1.6** — Spot-check. `grep -nE "handoff|předání|next team|another team|new team" .local/workshop-packs/*.json workshop-skill/reference.md`. Only allowed residuals: structural IDs (`opening-handoff`, `arc-handoff`), `intent: "handoff"` metadata, and the intentional positive *"inherit it"* on EN pack line 799.

### Pass 2 — Wire the day's resources

See the Resource Wiring Map (below) for the full mapping. Tasks:

- [ ] **T2.1** — Create `docs/facilitation/day-resource-map-2026-04-21.md` using the Resource Wiring Map table as the skeleton. One row per resource, columns: when in the day, URL, why/how to use, fallback if it fails.
- [ ] **T2.2** — Add `sourceRefs` in the two packs for each resource at the specified scene. For scenes that already have `sourceRefs`, append; do not replace. Keep labels short (facilitator reads these in the runner).
- [ ] **T2.3** — Mirror the two diagrams (Fowler, OpenAI observability) into `content/talks/assets/` as local PNG copies if not already there — live-demo-safe fallback when the venue internet is flaky. Reference the local path in `facilitatorNotes`, the public URL in `sourceRefs`.
- [ ] **T2.4** — Seyfor capability map (artifact 1) lives **only** in the facilitator map, **not** in participant-visible `sourceRefs`. It is cohort intel, not reference material.

### Pass 3 — Regenerate and dry-run

- [ ] **T3.1** — Regenerate derived files per the repo's normal build command (check `scripts/` or `package.json`). Confirm `dashboard/lib/generated/agenda-cs.json` and `agenda-en.json` and `workshop-blueprint/agenda.json` update deterministically.
- [ ] **T3.2** — Run the existing participant-surface dev server and click through: opening → talk → demo → build-1 → lunch → rotation → build-2 → reveal. Watch for any *handoff / předání* that escaped T1.4.
- [ ] **T3.3** — From a phone on cellular (not office Wi-Fi), load each of the 4 Tailscale artifact URLs + the OpenAI and Fowler pages. Any that require auth beyond Tailscale or fail under the phone's user agent — escalate to T3.4.
- [ ] **T3.4** — For every external URL in the resource map, either confirm reachable from venue-typical network **or** add a local fallback (saved PDF/PNG path) and note both in the facilitator map's *fallback* column.
- [ ] **T3.5** — Facilitator read-aloud of: opening hero (EN and CS), rotation `line-up` hero, lunch `facilitatorRunner.say`, and reveal `callout`. If a sentence catches in the throat, it is still wrong and needs one more pass. Log the stumbles into `docs/solutions/workshops/2026-04-21-seyfor-cohort-capture-checklist.md`.

### Pass 4 — Post-day learning scaffolding

- [ ] **T4.1** — Create `docs/solutions/workshops/2026-04-21-seyfor-cohort-capture-checklist.md` with three sections: *Phrases that landed / stumbled*, *Resources used vs unused*, *Open question: rotace vs promíchání — did the chosen house term hold in the room?*. One sentence per bullet, to be filled in within 24h of end-of-day.
- [ ] **T4.2** — Add a TODO at the top of the same file: *"Port brief rewrites from the local pack back into canonical `workshop-content/agenda.json` after the cohort debrief."* This is the deliberate next-step flagged earlier.

## Resource Wiring Map

| # | Resource | Type | Placement in the day | Why here | Fallback if URL fails |
|---|---|---|---|---|---|
| R1 | [Fowler harness-engineering diagram](https://martinfowler.com/articles/harness-engineering.html) | Canonical diagram | `talk-craft-under-surface` scene — replace or supplement the existing *Fowler to dělí na guides a sensors* block (CS pack line 408). Show image + link. | This is the diagram the talk's whole "guides vs sensors, feedforward vs feedback" line is built on. Naming the primary source legitimizes the frame. | Local PNG under `content/talks/assets/fowler-harness-engineering.png`; drop the URL, show the image. |
| R2 | [OpenAI observability stack](https://openai.com/index/harness-engineering/) | Canonical diagram | Same `talk-craft-under-surface` scene, as the *"closing the loop"* beat — directly after Fowler and before *"What I want them to adopt"*. | It visualises what *feedback* looks like at the extreme (full OTel + Codex in a loop). Participants who want to see the ambitious end-state have a pointer. | Local PNG under `content/talks/assets/openai-observability.png`. |
| R3 | Codex's model picker, decoded | Reference (during Build phases) | `build-1-default` and `build-2-first-push` `sourceRefs`. Surface also under `$workshop reference` as a *"When to switch Codex models"* note. | Participants will be in Codex all day and the model picker is a live question. A single link saves 5 conversations with the facilitator. | URL in `.local/facilitation/day-resource-map-2026-04-21.md` (local only, not committed). |
| R4 | Harness Lab meta-analysis (Ondrej's 16-day retro) | Proof artifact | `demo-sitting-inside-one` scene `sourceRefs` and `facilitatorNotes`. | This IS the proof referenced in *"You've been sitting inside one all morning"*. Linking it turns the claim from anecdote into evidence. | URL in local facilitator map only. |
| R5 | Identify Flow Preview v2 | Proof artifact (optional) | `demo-your-toolkit` `facilitatorNotes` only — "optional aside if someone asks how the participant login is designed". | This is a current design preview showing how Ondrej actually works with agents on this repo. It is cohort-appropriate only if a participant *asks*. | URL in local facilitator map only. |
| R6 | Seyfor AI Capability Map | Facilitator intel | `.local/facilitation/day-resource-map-2026-04-21.md` only. **Do NOT** add to pack `sourceRefs`. | Cohort-specific intel — who is in the room, what pods they belong to, what they said in prework. Facilitator reads this before doors open; participants should not see it surfaced as "reference material." | URL in local facilitator map only. |
| R7 | [agents.md](https://agents.md) | External standard | `talk-craft-under-surface` (when AGENTS.md is introduced) and the `agents-md` challenge `sourceRefs`. | Grounds *"what is an AGENTS.md?"* in the emerging public standard rather than in one facilitator's opinion. | No fallback — read-only, widely cached. |
| R8 | [agentskills.io](https://agentskills.io/home) | External standard | `demo-your-toolkit` `sourceRefs` (where the workshop skill is named) and `$workshop reference` *Recommended commands* section, as *"external catalog of agent skills"*. | Gives participants a place to look for more skills after the day; makes the workshop skill feel like part of an ecosystem, not a bespoke Ondrej-only thing. | No fallback. |

## Acceptance criteria

- Running `grep -nE "Handoff is not the end of the day" .local/workshop-packs/ workshop-content/agenda.json` returns zero matches.
- Running `grep -nE "survives|přežije" workshop-content/agenda.json` shows no match inside `opening-*` scene hero bodies.
- Running `grep -cE "po rotaci" .local/workshop-packs/no-repo-switching-cs.json` returns either 0 (option A — strict replace) or a count that matches a facilitator-approved whitelist (if we keep *rotace* as meta-concept in specific lines, see §D1).
- Running `grep -nE "next team|new team|Handoff is a continuous" workshop-skill/reference.md` returns zero matches.
- `docs/facilitation/day-resource-map-2026-04-21.md` exists and covers R1–R8 with URL, placement, and fallback filled for every row.
- Every URL in the map was opened at least once from a phone on cellular and either (a) loaded cleanly or (b) has a working local fallback path recorded in its row.
- A facilitator read-aloud pass over opening hero + rotation hero + lunch runner + reveal callout produced no stumbles; stumbles that did occur are logged in the post-day capture file.
- `docs/solutions/workshops/2026-04-21-seyfor-cohort-capture-checklist.md` exists and is ready to be filled during and immediately after the workshop.

## Decision rationale

### D1 — Rotace vs promíchání: keep `rotace` as meta-concept only, use `promíchání` for the mechanic

Two viable choices:

- **Option A (chosen).** `rotace` stays in the meta-framing line *"každá čerstvá session agenta je rotace"* and in scene IDs. Every temporal *po rotaci* → *po promíchání* (or *po čerstvém přečtení*, as grammar prefers). EN equivalent: `rotation` as meta-concept, `reshuffle` as the day's move.
- **Option B.** Accept `rotace` as the single word for both the meta-concept and the day's move. Drop `promíchání` entirely.

Chose A because:

- The meta-line *"every fresh agent session is a rotation"* is load-bearing. It reframes the afternoon move as practice for an everyday thing. Losing that costs more than gaining consistency would buy.
- The day's *move* is specifically **not rotation of repos** any more — repos stay with their owners. Continuing to call it *rotace* in temporal descriptions keeps the stale mental model alive.
- The Czech word *promíchání* captures the actual mechanic (people shuffle, repos stay) more precisely than *rotace* ever could.
- Cost is mechanical: ~15 CS replacements + ~10 EN replacements, done once in Pass 1.

Anti-argument: if `rotace` wins in the room tomorrow anyway (because participants grab the simpler word), we capture that in the post-day note and revisit. The plan is not irreversible.

### D2 — Don't port the brief rewrites back to canonical tonight

`.local/workshop-packs/README.md` explicitly says these are instance overrides. Porting adds surface area that needs its own review, and it is literally zero-value for tomorrow (the pack is what runs tomorrow). The post-day capture file carries the TODO so we don't lose it. Trades minor future cost for zero risk tonight.

### D3 — Keep the Seyfor map out of participant-facing `sourceRefs`

It contains cohort-specific intel (who completed prework, what they said in prework, pod composition). Surfacing it as "reference material" under `$workshop reference` turns private prework data into participant-visible content, which is not the deal they signed up for. Facilitator-only placement respects that.

### D4 — Live-demo-safe fallbacks for diagrams, not for Tailscale artifacts

The two diagrams (R1, R2) are load-bearing in the talk — losing them mid-keynote is bad. Local PNG copies cost ~5 minutes and buy certainty. The Tailscale artifacts (R3–R6) are reference material, not load-bearing; a broken link costs a sentence of facilitator improvisation, not a talk. Hence asymmetric fallback effort.

## Constraints and boundaries

- **Do not** modify `dashboard/db/migrations/2026-04-20-participant-feedback-and-polls.sql` or the `docs/solutions/infrastructure/facilitator-admin-production-state-and-schema-drift.md` note — they are unrelated untracked files and touching them before the day compounds risk.
- **Do not** push canonical-blueprint changes to production. Tomorrow runs off the already-reset local-pack state on prod. Canonical edits (T1.2, T1.3) stay unpushed unless we deliberately decide to rebuild from canonical.
- **Respect the voice rules** in `feedback_participant_copy_voice.md` — Rule 1 (defocus the rescue/survives motif) is what T1.3 is for; Rule 2 (name the triad) applies anywhere a continuation sentence is rewritten in T1.4.

## Assumptions

| Assumption | Status | Evidence / how to verify |
|---|---|---|
| `.local/workshop-packs/no-repo-switching-*.json` is what runs on production tomorrow | Verified | Colleague's note ("This is what I used to reset production") + `.local/workshop-packs/README.md` describes the reset-instance command used. |
| Regenerating `dashboard/lib/generated/agenda-*.json` from the pack source is the supported path and deterministic | Unverified | Check `package.json` / `scripts/` for the generator script. If unclear, **T3.1 becomes an investigation sub-task** before Pass 3 runs. |
| Venue Wi-Fi allows Tailscale artifact URLs to resolve | Unverified | T3.3 verifies from phone cellular, which is the conservative proxy. If venue Wi-Fi turns out to be more restrictive, local fallbacks (T2.3, R3/R4 local exports) cover it. |
| `workshop-skill/reference.md` is surfaced **verbatim** when a participant runs `$workshop reference` | Needs spot-check | `grep -rn "reference.md" workshop-skill/` confirms how it's read. If the skill summarizes rather than reads verbatim, T1.5 is still useful but less urgent. |
| The Fowler and OpenAI pages are OK to link publicly without attribution/license complications | Verified | Both are public marketing / blog pages explicitly intended for linking. |
| The 4 Tailscale artifact URLs are reachable from this laptop (Ondrej's tailnet) | Verified | All four loaded in Pass-0 research via WebFetch. |

Unverified rows convert to explicit tasks in Pass 3 (T3.1, T3.3) or mitigations (T2.3 local fallbacks).

## Risk analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Venue network blocks Tailscale or slows external links | Medium | Medium — breaks one facilitator beat | Local fallbacks (T2.3) and the resource map (T2.1) list them explicitly |
| Copy sweep introduces a grammatical error in Czech that only surfaces when read aloud | Medium | Low–Medium | Read-aloud pass (T3.5) catches this before the room does |
| `rotace` lands more naturally in the room tomorrow than `promíchání`, making D1 look wrong | Medium | Low | Captured in post-day check; revisit post-cohort — not irreversible |
| Regenerator script is broken or needs an arg we don't know | Low | Medium — derived files drift from pack | T3.1 is a hard gate. If it fails, block until fixed; don't ship derived drift |
| Time overrun — four passes won't fit tonight | Medium | Medium | Passes 1 and 3 are the non-negotiables. Pass 2 can ship the resource map only (skip JSON `sourceRefs`) if time is short — map is the operational artifact, embedding is convenience. Pass 4 can slip to morning-of |
| Derived file regeneration touches unrelated fields and produces a noisy diff | Low | Low | Commit pack + derived separately; review derived diff for unexpected hunks |

## Phased rollout gate

Do passes 1–3 tonight. Pass 4 can slip to tomorrow morning if energy is low — the cost is only that learnings get captured less hot. If tonight runs out and only Pass 1 lands, that still ships the real fixes; skipping Pass 2 costs the facilitator one day of not having a neat resource page but loses nothing the workshop absolutely needs.

## References

- This plan is informed by the content review in the preceding session turn.
- `~/.claude/projects/.../memory/feedback_participant_copy_voice.md` — voice rules 1 and 2.
- `.local/workshop-packs/README.md` — local-pack scope and non-canonical status.
- `workshop-content/agenda.json` lines 117, 125, 135, 143, 3094 — anchors for T1.2, T1.3.
- `workshop-skill/reference.md` lines 13, 29, 31 — anchors for T1.5.
- `.local/workshop-packs/no-repo-switching-en.json:1402` — anchor for T1.1.
- Four Tailscale artifact URLs (R3–R6) and two canonical diagrams (R1, R2) and two external standards (R7, R8) — see Resource Wiring Map.
