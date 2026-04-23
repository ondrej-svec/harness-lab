---
title: "Minimal Facilitator UI and Instance-Override Model"
type: brainstorm
date: 2026-04-23
participants: [Ondrej, Heart of Gold]
related:
  - docs/brainstorms/2026-04-19-facilitator-ui-revamp-brainstorm.md
  - docs/brainstorms/2026-04-19-agenda-scene-surface-split-and-lightweight-interaction-brainstorm.md
  - docs/brainstorms/2026-04-16-harness-lab-product-shape-and-participant-management-brainstorm.md
  - docs/brainstorms/2026-04-13-one-canvas-rework-brainstorm.md
  - docs/brainstorms/2026-04-08-facilitator-room-screen-and-presenter-flow-brainstorm.md
  - docs/brainstorms/2026-04-07-facilitator-cockpit-ia-and-ux-redesign-brainstorm.md
  - docs/brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md
  - docs/brainstorms/2026-04-21-optional-team-mode-brainstorm.md
  - docs/dashboard-surface-model.md
  - docs/facilitator-dashboard-design-rules.md
  - docs/facilitator-control-room-design-system.md
  - docs/blueprint-import-model.md
  - docs/private-workshop-instance-schema.md
  - docs/facilitator-agenda-source-of-truth.md
  - docs/hybrid-harness-split.md
---

# Minimal Facilitator UI and Instance-Override Model

## Problem Statement

The Harness Lab facilitator dashboard has grown into a multi-section admin/authoring surface (agenda editor, scene editor, teams, signals, settings, access, people, run, summary). Most of that content work does not belong in the UI — it has been ruled out in prior brainstorms, but the routes still exist, the CLI has not caught up to cover them, and the content model itself blocks the one thing we most want: running the *same* Harness Lab app as a full-day, half-day, Czech, or custom workshop without a code change and a redeploy.

We want to redesign the facilitator product around five simultaneous moves:

1. **Minimum runtime UI** — the dashboard becomes the live-operation surface only, not an authoring tool.
2. **CLI-first authoring and configuration** — agenda, scenes, content, and settings are edited via `harness-cli` + the facilitator skill.
3. **Blueprint-as-data with runtime overrides** — workshop instances are fully customisable through CLI at runtime, with no redeploy.
4. **Facilitator-private support content out of UI** — scene-level do-steps, fallbacks, and tips render in CLI/skill, not in the dashboard.
5. **Bilingual collapse for workshop content** — one workshop, one language; the shell keeps a small i18n layer that forks can extend.

The goal is not a personal tool. Harness Lab stays open-source and general; the opinionated defaults simply reflect Ondrej's real workshop practice.

## Context

### What exists today

Facilitator surface (`dashboard/app/admin/instances/[id]/`) currently exposes sections `run`, `people`, `access`, `settings`, `summary` — plus legacy `agenda`, `teams`, `signals` that the 2026-04-19 revamp already planned to retire (`dashboard/lib/admin-page-view-model.ts:4`, `dashboard/app/admin/instances/[id]/_components/sheets/agenda-sheet-overlays.tsx:10-16`).

Content model today:

- One template only (`workshopTemplates` is a single-item array — `dashboard/lib/workshop-data.ts:1502-1512`).
- Blueprint imports are hardcoded in `workshop-data.ts:1-44`; `createWorkshopStateFromInstance` at `workshop-data.ts:1878-1909` always pulls from compiled repo JSON. The `externalBlueprint` parameter exists but has no production caller.
- Phases carry only `startTime: "09:10"` strings; there is no `durationMinutes` or `endTime` anywhere — timing is implicit. A half-day variant cannot be expressed in this schema.
- Participant copy overrides are a narrow whitelist (`OverridableParticipantCopy` — `workshop-data.ts:911-935`).
- Bilingual content is pre-compiled CS+EN, shipped in the bundle, flipped at runtime.

CLI coverage (`harness-cli/src/run-cli.js`) has gaps. Five capability classes are UI-only today with zero CLI equivalent: per-item agenda CRUD, per-scene authoring, presenter runtime ops, rotation-signal/checkpoint/challenge writes, and access-control primitives (walk-ins, facilitator grants, password reset). GDPR Art. 20 export has an API endpoint but no UI button and no CLI wrapper. Device-auth CLI flow is real and works (`harness auth login` default) — facilitators can drive CLI against a live instance today.

### Convergence in prior brainstorms

- Two-level IA (workspace cockpit + per-instance control room) — stable since 2026-04-07.
- Four-section control room (Run/People/Access/Settings) — set in 2026-04-19.
- Agenda and scene authoring **do not belong in the UI** — set in 2026-04-19, codified in `docs/facilitator-dashboard-design-rules.md`.
- Blueprint/instance split (blueprint = template; instance = live state; no auto-promote back) — stable since 2026-04-07 Workshop Blueprint brainstorm.
- Presenter is an agenda-linked surface launched from the control room — stable since 2026-04-08.
- Three distinct surfaces (room / participant / facilitator) must not bleed content — 2026-04-19 scene split.
- iPad-first device priority.

### Open before this brainstorm

- Minimum viable section set — still at four sections; the question of whether to collapse further or keep Summary was open.
- Where facilitator-private "nodes" (do-steps, fallbacks, tips) are rendered — implicit in prior brainstorms but never explicitly removed from the UI.
- Instance override model — `docs/blueprint-import-model.md` described intent; schema and runtime did not fully support it.
- Bilingual strategy at the product level.

## Chosen Approach

**Blueprint-as-data. Minimal runtime UI. CLI-primary authoring. Shell-only bilingual.**

Concretely:

### 1. Content model — blueprint-as-data with seed-from-repo

A blueprint is a JSON document (durable, versioned) that describes: title, language, phases (with `durationMinutes`), scenes (per-surface bodies + facilitator-private notes), default teams config, feedback form, participant copy, rotation/signal rules.

- The repo ships a reference blueprint at `workshop-blueprint/default.json`.
- On first boot (or when the blueprint table is empty), the DB is seeded from that file. After that, the **database is authoritative** and the file is ignored.
- Blueprints are managed via CLI:
  ```
  harness blueprint list
  harness blueprint push ./my-half-day.json --as aibility-half-day
  harness blueprint fork harness-lab-full-day --as harness-lab-full-day-cs
  harness blueprint show <name>
  harness blueprint rm <name>
  ```
- Instances are created from a named blueprint: `harness instance create --blueprint aibility-half-day`.
- On create, blueprint materialises into the instance's `workshop_state` jsonb. From that point forward, instance state is authoritative and customisable per-event.
- Per-instance customisation happens through CLI commands that edit instance state directly (`harness agenda edit`, `harness scene edit`, `harness content set …`). Bulk edits use the escape hatch: edit JSON, `harness blueprint push`, then `harness instance reset --from-blueprint <name>`.

**Zero redeploy** for any content change. The repo file is a one-time seed, not a live source.

### 2. Duration model — `durationMinutes` replaces wall-clock strings

`startTime` strings are removed from the schema. Phases carry `durationMinutes: number`. Wall-clock times are derived at runtime from `instance.startAt + cumulative durations`. This is the single biggest blocker to half-day variants; it is non-negotiable under the chosen approach.

### 3. UI shape — four sections + presenter route + device approval

```
/admin                           Workspace cockpit (instance list)
/admin/device                    Device-auth approval (required; cannot live in CLI)
/admin/instances/[id]            Control room — four sections:
    ?section=run                 Live cockpit (default)
    ?section=people              GDPR + team drag-drop
    ?section=settings            Slim settings (end, grants, metadata)
    ?section=summary             Post-workshop feedback readout
/admin/instances/[id]/presenter  Presenter/room screen (separate route, launched from Run)
```

#### Run (the live cockpit — the only place you live-operate)

- **Agenda overview, read-only** — the whole agenda visible in a lightweight outline, current item highlighted, phases and scenes collapsible. No add/edit/move/remove controls in UI; those belong to CLI. Visibility and navigation stay: you can *see* the agenda, *jump* to any phase, *open* a scene to review its bodies. This is crucial both for live operation (jump-to-phase when the room's mood changes) and for authoring-via-CLI (preview what you just changed without leaving the cockpit).
- Advance / back the current item
- Launch / sync presenter
- **Live-reactive writes as UI buttons:** capture rotation signal, checkpoint feed write, challenge complete, promote participant feedback, reset active poll
- Walk-ins toggle (operational, not buried in a config section)
- Current event code visible + rotate

#### People (GDPR primary, CLI parity)

- Participant list, consent toggle, soft-delete, Art. 20 export, password reset
- Drag-drop team assignment (faster than CLI when someone's laptop breaks mid-session)
- Every operation mirrored in CLI at full parity. UI earns its place because GDPR response during a live event is the one moment "CLI-primary" breaks down.

#### Settings (slim)

- **End workshop** (operational at end of day)
- **Facilitator grants** (view + add/revoke owner/operator/observer — GDPR-adjacent: who can see participant data)
- **Instance read-only metadata** (blueprint name/version, create date, language, team-mode state)

Everything else that lived in Settings (reset, archive, change password, team-mode toggle, blueprint-derived config forms) moves to CLI.

#### Summary (post-workshop read)

- Feedback aggregate, learnings digest. Read-only. May collapse into Run as a tab during `/plan` if it feels too thin.

#### Presenter (separate route)

- Room projection launched from Run. No authoring affordances in this view.

### 4. Facilitator-private support content — CLI/skill only

Scenes continue to carry facilitator-private fields (do-steps, fallbacks, tips) in the schema — they are data. The **dashboard never renders them**. During a live run the facilitator accesses them through the `workshop-facilitator` skill in Claude Code, which reads instance state and surfaces the current scene's private content on demand.

This is the crisp version of a direction multiple prior brainstorms hinted at. It also frees the control-room layout from the competing pressures of "projector-facing" and "facilitator-private" reference material on the same canvas.

### 4b. `workshop-facilitator` skill expands to envelope the CLI

The skill stops being "a live-run content rendering tool" and becomes the **teaching, authoring, and dry-run layer around `harness-cli`**. It is the conversational interface that makes CLI-primary authoring approachable for anyone who isn't the author of the CLI.

Concretely, the skill gains:

- **CLI teaching** — natural-language questions translate to CLI invocations with explanations: *"How do I change the duration of the Challenge phase?" → `harness agenda edit <instance> challenge --duration 90`, with "this will change durationMinutes from 60 to 90; wall-clock end moves from 15:30 to 16:00; no other phase shifts."*
- **Blueprint authoring guidance** — scaffold a new blueprint from a blank page through guided questions (language, duration, phases, scenes per phase, teams/no-teams).
- **Onboarding for non-Ondrej facilitators** — a new user can ask "how do I run a half-day workshop for my team?" and get a concrete flow: fork default blueprint → edit → push → create instance → run.
- **Dry-run and diff** — "what will this command change?" "what does this instance look like vs its blueprint?" "show me scene X's participant body right now."
- **Cross-referencing UI and CLI** — when the facilitator is looking at the Run outline in the dashboard and wants to change something, the skill answers "click here vs. run this command" correctly based on what's a UI action (GDPR, live-reactive) vs. a CLI action (authoring, config).

The guiding design principle: **the CLI provides the raw capability; the skill provides pedagogy and safety**. Neither is complete without the other. For a new facilitator, the skill is how they learn Harness Lab; for an experienced one, it is how they move faster.

### 5. Team mode

Blueprint-time default (`blueprint.teamMode: boolean`). Runtime flip available only via CLI (`harness instance set --team-mode=false`). No UI toggle. Acknowledged that the team dynamic as a whole needs a later rework; this decision is about the surface, not the mechanic.

### 6. Bilingual collapse

- **Workshop content** (agenda, scenes, participant surfaces, briefs, presenter copy): single-language per instance, set by the blueprint. CS+EN parallel runtime content goes away.
- **Shell** (public landing page, admin chrome, auth screens, pre-workshop participant flow): keeps an i18n layer, defaults EN+CS, extensible — a fork can add German by dropping in a locale file.

Rationale: "one workshop, one language" matches how people actually run workshops (a German-speaking facilitator in Germany runs a German workshop); the shell i18n layer is cheap to keep and gives forks an obvious extension point.

### 7. CLI buildout — scope of the gap

To make this approach honest, the CLI needs new surface. Listed here as the cost we're accepting; detailed in a separate plan.

- **Blueprint management (new):** `blueprint push|list|show|fork|rm|edit`
- **Per-item agenda CRUD (new):** `agenda add|edit|move|remove` per phase and per item
- **Per-scene authoring (new):** `scene add|edit|move|remove|default-set|toggle` + per-surface body edits
- **Runtime config (new):** `instance set --walk-ins|--team-mode|--end|--language`, `grants add|revoke|list`, `password reset`, `participant export`
- **Signal & checkpoint parity (optional, not blocking):** read-only `signals list`, `checkpoints list`; write path stays UI because it is mid-scene live
- **Live-support skill subscription (new):** a mechanism for the `workshop-facilitator` skill to read current scene and render private content on demand (implementation detail — `harness scene current --notes` plus long-polling, or an SSE subscription)

## Why This Approach

**Optimises for:** dynamicity without redeployment, a UI that is honest about what it's for (live running), a content model that supports any workshop shape, and a clean fork story.

**Rejects:**

- **Declarative "profiles" inside one big blueprint** — DRY is theoretical until there are many related workshops; a profile schema would add complexity ahead of need and make forking the reference workshop harder.
- **Patch-layer on top of blueprints** — redundant with per-instance runtime edits, which are already the patch layer, just without indirection.
- **File-only blueprints (no DB)** — violates the "no redeploy to change a workshop" constraint. Files alone require a code path change to swap blueprints.
- **A dashboard-resident blueprint editor** — re-introduces exactly the authoring surface that Apr-19 already removed, duplicates CLI, and ties editing ability to UI availability.
- **"Dashboard as Ondrej's Workshop Runtime"** — considered and rejected. Harness Lab stays a general, open-source product; opinionated defaults only.

**Trade-offs accepted:**

- **CLI ergonomics must hold up for authoring.** Mitigation: `blueprint push ./file.json` bulk path is the escape hatch for heavy edits. Daily operational edits (durations, toggles, rename) have targeted CLI commands.
- **Facilitator environment is assumed to include Claude Code on the facilitator's laptop.** iPad-only or shared-device facilitators will need an alternative path (likely: bring a laptop; or, later, a web-based skill viewer). Acceptable for v1.
- **Schema migration cost.** `startTime` → `durationMinutes` plus a new `blueprints` table are meaningful DB changes that ripple through the runtime. Worth it; the old shape blocks the feature we actually want.

## Subjective Contract

- **Target outcome:** the dashboard feels like a live cockpit — short, legible, glanceable, zero "where do I edit X?" anxiety. Every non-live concern goes through `harness` in a terminal.
- **Anti-goals:**
  - Dashboard-as-CMS: the control room must not become a place where agenda and scenes are authored.
  - Hidden runtime coupling: no control that secretly redeploys or requires a deploy cycle to take effect.
  - Bilingual runtime content: a single running workshop does not switch languages mid-flight.
- **References (positive):**
  - The four-section proposal in `docs/brainstorms/2026-04-19-facilitator-ui-revamp-brainstorm.md` and its codification in `docs/facilitator-dashboard-design-rules.md`.
  - The blueprint/instance split described in `docs/facilitator-agenda-source-of-truth.md` and `docs/blueprint-import-model.md`.
  - The surface-split taxonomy in `docs/brainstorms/2026-04-19-agenda-scene-surface-split-and-lightweight-interaction-brainstorm.md`.
- **Anti-references (negative):**
  - The current `_components/sections/agenda-section.tsx` (754 LOC) and `scene-block-editor.tsx` — the authoring patterns we are explicitly removing from the UI.
  - Runtime `toggleTeamMode` UI control — the kind of mid-scene reversible flip that muddies "blueprint default vs instance override."
- **Tone/taste rules:** live-run buttons must be *mid-scene fast* — high contrast, single-tap, undoable. Settings must be low-chrome and low-frequency — it is a place you rarely visit. Facilitator-private content is not a design problem for the UI because it is not rendered there.
- **Rejection criteria:** the approach is wrong if (a) running a half-day instance still requires a code change or redeploy, (b) per-instance customisation requires UI, (c) the dashboard grows back an authoring section, or (d) a facilitator cannot complete a live-run ritual without switching between UI and CLI mid-scene.

## Preview And Proof Slice

- **Proof slice:** seed a second blueprint (e.g. `harness-lab-half-day`) into the DB via CLI, create an instance from it, and run the full live-run ritual (Run + People + Presenter) against that instance without touching the code or redeploying. If this works, the model is real.
- **Required preview artifacts (for `/plan`):**
  - A target blueprint JSON schema (one-page reference, `durationMinutes`, scene surfaces, language).
  - A minimal wireframe or ASCII of the four-section control room in its target minimal state, so the "what stays vs what goes" is literal, not implied.
  - A CLI command manifest (what the new `harness` surface looks like end-to-end).
- **Rollout rule:** do not remove a UI section before its CLI equivalents exist and have been used for real. The sequence is CLI-first, UI-removal-second.

## Key Design Decisions

### Q1: OS product vs personal tool — RESOLVED
**Decision:** Harness Lab stays open-source and general. Defaults reflect Ondrej's real workshop practice (dogfooding drives taste), but every choice is customisable per instance. No personal branding leaks into the product.
**Rationale:** The user explicitly rejected the "built for me" framing on reflection. The open-source position in prior brainstorms is intact.
**Alternatives considered:** Partial retreat ("Ondrej's workshop runtime" publicly) — rejected as "way too much simplification."

### Q2: Override model — RESOLVED
**Decision:** Blueprint-as-data. Repo ships a seed file at `workshop-blueprint/default.json`. On first boot or empty-DB state, seed from file into a `blueprints` DB table; thereafter, DB is authoritative. All blueprint and instance edits via CLI; zero redeploy for any content change.
**Rationale:** Matches the "no redeploy" constraint. Simpler than declarative profiles or patch layers. Gives forks a clean starting point (edit the seed file, boot, then edit via CLI).
**Alternatives considered:**
  - *Blueprint as file only, no DB* — violates "no redeploy."
  - *Single blueprint with declarative profiles (half-day, full-day, language variants)* — complexity ahead of need; DRY benefit is theoretical.
  - *Blueprint + patch layer on instance* — redundant with per-instance runtime edits; adds a third layer to reason about.
  - *Pure runtime (no seed file in repo)* — rejected in favour of frictionless first-boot.

### Q3: Duration model — RESOLVED (forced)
**Decision:** `durationMinutes: number` on each phase; wall-clock times derived at runtime.
**Rationale:** Half-day and custom variants cannot be expressed with `startTime` strings.
**Alternatives considered:** Keeping `startTime` + computed ends — would require authoring all variants by hand and defeats the dynamic model.

### Q4: Minimum UI surface — RESOLVED
**Decision:** Four sections (Run / People / Settings / Summary) plus Presenter as a separate route plus the Device-approval auth page. Event code and walk-ins toggle fold into Run. Legacy Teams and Signals sections are removed outright. **Agenda is removed as an authoring section but its read/navigate/preview surface folds into Run as a lightweight outline** — whole agenda visible, phases jumpable, scenes openable for review. No add/edit/move/remove controls in UI; those are CLI-only.
**Rationale:** Run is where live operation actually happens and the facilitator's mental model is agenda-shaped, not "current item only." Seeing the whole agenda and being able to jump mid-event (mood shift, time pressure) is fast and frequent; opening a scene to review its bodies is how you verify a CLI-made edit without leaving the cockpit. People earns its UI place on GDPR grounds. Settings keeps only what is high-stakes and low-frequency. Summary gives a post-workshop readout without authoring.
**Alternatives considered:**
  - *Three sections (drop Settings)* — the user explicitly wanted Settings partially retained.
  - *Five sections including Access* — Access is now folded into Run; facilitator grants move to Settings (and CLI).
  - *Merge Summary into Run as a tab* — still on the table for `/plan`; not decided here.
  - *Run as current-item-only (no agenda outline)* — rejected; loses jump-to-phase and scene-review, which the existing UI does well and the CLI cannot replicate ergonomically during live use.

**Notable contradiction:** The 2026-04-19 revamp proposed exactly four sections (Run/People/Access/Settings) and treated agenda as fully removed. This brainstorm keeps the spirit but adjusts to Run/People/Settings/Summary *and* preserves the agenda-read surface inside Run. Access folds into Run, Summary returns. This is an explicit update, not drift.

### Q5: GDPR primacy — RESOLVED
**Decision:** CLI primary for authoring, configuration, and operational edits. UI primary for GDPR-sensitive operations (participant list, consent, Art. 20 export, soft-delete, password reset, facilitator grants) — mirrored in CLI at full parity.
**Rationale:** GDPR response during a live event is exactly when CLI-primary breaks down. UI earns its place for that narrow but important surface.
**Alternatives considered:** CLI-only (rejected — too slow during live), UI-primary-everywhere (rejected — defeats the minimal-UI goal).

### Q6: Facilitator-private support content — RESOLVED
**Decision:** "Facilitator nodes" (do-steps, fallbacks, tips) are removed from the UI entirely. Scene schema continues to carry them as data. The `workshop-facilitator` skill in Claude Code renders them on demand during live run.
**Rationale:** Separates three surfaces cleanly (room / participant / facilitator) without competing for dashboard real estate. The skill already exists and can read instance state.
**Alternatives considered:** Keep private content in a collapsible UI panel — rejected as it pulls authoring gravity back into the dashboard.

### Q9: Scope of the `workshop-facilitator` skill — RESOLVED
**Decision:** The skill is expanded to be the **power envelope around `harness-cli`** — not just a runtime support tool for facilitator-private content. Its responsibilities:

  1. **Live support** (existing scope) — render current scene's facilitator-private content, tips, fallbacks, do-steps.
  2. **CLI teaching and preview** (new) — when a facilitator asks "how do I change the duration of phase 2?" the skill answers with the exact `harness agenda edit` invocation, explains *what will happen*, and can preview the change before commit.
  3. **Blueprint authoring guidance** (new) — walks a facilitator through creating a blueprint for their own workshop (schema, surfaces, language, duration, scenes). Turns a blank page into a working blueprint.
  4. **Onboarding** (new) — a new facilitator (not Ondrej) can ask the skill "how do I run a half-day version of the default workshop?" and get a concrete step-by-step CLI flow.
  5. **Diff / dry-run / explain** (new) — "what will this command change?" "what's in this instance's state that differs from its blueprint?" "what does this scene's participant body look like right now?" The skill becomes the conversational interface to the CLI.

**Rationale:** The CLI is primary for authoring, but a CLI alone is hostile to anyone who is not Ondrej. An open-source project that expects facilitators to author workshops through a CLI *has to* wrap that CLI in a teaching layer. The skill is the natural home because it already runs in Claude Code alongside the facilitator, already reads instance state, and conversation is the right medium for "what will happen if I…?" The CLI + skill combination becomes the power move: raw capability in one, pedagogy and safety in the other.
**Alternatives considered:**
  - *Man-page-style CLI help only* — rejected; CLI help is reference material, not teaching. Doesn't answer "what should I do?"
  - *Separate documentation website for facilitator onboarding* — rejected as not-where-the-work-happens; the skill is already where a facilitator works live.
  - *Keep the skill narrow (runtime support only)* — rejected; leaves the CLI unusable for anyone who isn't the author of the CLI.

### Q7: Team mode — RESOLVED
**Decision:** Blueprint-time default (`blueprint.teamMode: boolean`). Runtime flip available only via CLI. No UI toggle.
**Rationale:** Opinionated default with a CLI escape hatch matches the overall "customisable but not UI-customisable" rule.
**Alternatives considered:**
  - *Full runtime UI toggle (current)* — muddies blueprint/instance split.
  - *Pure blueprint-time, no runtime flip* — tempting but removes a valid "oh we're switching approach mid-day" option.

### Q8: Bilingual scope — RESOLVED
**Decision:** Workshop content is single-language per instance, set by the blueprint. Shell (landing, admin chrome, auth, pre-workshop participant flow) keeps a lightweight i18n layer, defaults EN+CS, extensible by forks.
**Rationale:** "One workshop, one language" matches real facilitation (German event = German workshop). Collapsing bilingual runtime infrastructure is a meaningful simplification. The shell i18n layer is cheap and gives forks an obvious extension point.
**Alternatives considered:**
  - *Full collapse — EN-only shell* — rejected; loses CS discoverability.
  - *Shell adopts instance language when inside an instance, EN elsewhere* — rejected as clever but unclear.

## Open Questions

- **CLI authoring ergonomics at scale.** Unverified whether per-item CLI editing of a 30-scene blueprint is tolerable in practice. Mitigation: JSON-file-push escape hatch. Worth observing after first real half-day instance ships.
- **Facilitator environment assumption.** Runtime handoff of private support content to the `workshop-facilitator` skill assumes Claude Code is on the facilitator's laptop. iPad-only facilitators need a later path (web viewer?). Not a v1 blocker.
- **Summary as tab vs section.** Decided to keep it as a section for now; re-evaluate during `/plan` once the Run layout is sketched.
- **Signal / checkpoint CLI parity.** Read-only `signals list` / `checkpoints list` deferred. Live-write path stays UI; CLI read parity is nice-to-have.
- **Blueprint versioning and migration.** Blueprints evolve; instances outlive them. The current `blueprintId + blueprintVersion` metadata can anchor migration, but the concrete migration mechanics (are instances ever re-seeded from a newer blueprint? diffed?) are out of scope here.
- **Presenter route vs shared-element morph.** The 2026-04-13 One Canvas brainstorm proposed shared-element morphing between admin and presenter. This brainstorm confirms separate route launch, consistent with 2026-04-19 and the surface model. The morph idea is not killed, but is a motion/UX concern for another pass.
- **Reference blueprint bundle contents.** What exactly is in `workshop-blueprint/default.json` at v1 cutover? Likely the current Harness Lab full-day EN agenda distilled into the new schema — but the migration of existing content is a separate task.

## Out of Scope

- Presenter motion/transitions — covered by `docs/brainstorms/2026-04-13-one-canvas-rework-brainstorm.md` and the presenter design system.
- Participant-surface redesign — touched by `docs/brainstorms/2026-04-19-agenda-scene-surface-split-and-lightweight-interaction-brainstorm.md`; not reopened here.
- Team dynamic rework (assignment algorithm, rotation rules) — flagged by the user as a future task, not part of this brainstorm.
- Scene rail vs scene launcher UX (right-edge rail vs low-chrome prev/next) — open in prior brainstorms, not resolved here.
- Monetisation, multi-tenant hosting, billing.
- Rich-content authoring tooling — CLI covers the authoring path; any richer editor would contradict the core decision.
- Schema migration plan details — belongs in the follow-up `/plan`.

## Next Steps

- `/plan` from this brainstorm to produce the implementation plan (UI removals + CLI buildout + schema migration + skill expansion, properly ordered).
- Separate plan (or sub-section of the plan) for:
  - Blueprint JSON schema v1 (the target shape, `durationMinutes`, scene surfaces, language, facilitator-private fields).
  - DB migration for `blueprints` table + `durationMinutes` + seed-on-empty-DB mechanism.
  - CLI surface manifest (new commands and their contracts).
  - **`workshop-facilitator` skill expansion** (new scope per Q9): live-scene read + CLI teaching/translation + blueprint authoring guidance + onboarding flows + dry-run/diff/explain. Needs its own design pass.
  - **Run section with read-only agenda outline**: design the lightweight outline with jump-to-phase and scene-preview, distinct from the retired authoring sections.
- Update `docs/facilitator-dashboard-design-rules.md` and `docs/dashboard-surface-model.md` to reflect the four-section set (Run/People/Settings/Summary) with agenda-read-in-Run, replacing the Apr-19 Run/People/Access/Settings entry.
- Consider `/compound` for the novel pattern: "open-source product + CLI-first authoring + skill-as-CLI-envelope + DB-authoritative blueprint seeded from repo" is an architecture worth capturing for future projects.
