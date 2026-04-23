# Facilitator Control Room Design System

This file is a control-room-specific supplement to [`dashboard-design-system.md`](./dashboard-design-system.md). Motion rules — durations, entrance patterns, the pending-state rule, reduced-motion — live in the [Motion section](./dashboard-design-system.md#motion) of that file.

This document is the source of truth for the facilitator desk visual and interaction system.

Use it together with:

- [`facilitator-dashboard-design-rules.md`](./facilitator-dashboard-design-rules.md)
- [`dashboard-surface-model.md`](./dashboard-surface-model.md)

## Why This Exists

The current facilitator desk already split workspace scope from instance scope correctly, but the control room still drifted into an overloaded document:

- too many bordered boxes nested inside other bordered boxes
- editing forms living on the same canvas as live operational state
- reference links styled too much like passive text
- multiple columns competing for attention instead of clarifying hierarchy
- action buttons, navigation links, and metadata all reading as the same weight

The control room is not a CMS and not a marketing dashboard. It is an operating surface used under time pressure.

## Research Inputs

This system aligns with a small set of stable UX rules from current design-system guidance:

- Carbon dialog guidance says dialogs work best for short tasks, should be used sparingly, and should not recreate a full page or hold large unrelated datasets.
  Source: <https://carbondesignsystem.com/patterns/dialog-pattern/>
- Carbon button guidance says each page should have only one primary button in a context, and navigation should use links rather than buttons.
  Source: <https://v10.carbondesignsystem.com/components/button/usage/>
- Atlassian navigation layout guidance treats page layout as explicit zones for navigation and content instead of mixing everything into one undifferentiated canvas.
  Source: <https://atlassian.design/components/navigation-system/layout>

Inference from those sources:

- the problem is not "we need more compression"
- the problem is "we need stronger separation between read mode, edit mode, navigation, and dangerous mutation"

## Product Model

The facilitator product has two different surfaces:

1. Workspace cockpit: event discovery, filtering, creation, entry into an instance
2. Control room: running one event

Inside the control room, the first screen must answer four questions immediately:

1. Which event am I controlling?
2. What is live right now?
3. What happens next?
4. Which action matters now?

If a panel does not help answer one of those questions, it should be secondary or hidden by default.

## Device Priority

The control room is iPad-first.

That means:

- the primary operating flow should make sense in a single column or a simple two-zone layout
- phone remains acceptable for quick checks and short interventions
- desktop is an expansion of the same model, not the source of truth
- projection launch should work cleanly from the same facilitator flow without turning the live screen into a second admin console

If a desktop composition only feels good because it adds more simultaneous panels, the structure is probably wrong.

## Run-Centered Canvas Contract

The default control room is the `Run` surface: one agenda-centered workshop canvas for live operation. Treat `live` and `agenda` only as legacy URL aliases, not as separate products.

It may show:

- current workshop position
- next transition
- participant surface signal
- the agenda spine as the primary navigation model
- one selected agenda item as the current operating object
- contextual handoff controls only when the selected moment genuinely owns them
- quiet signal capture that belongs to running the current moment

It must not show by default:

- archive and reset controls
- blueprint-edit references
- a detached presenter-management workbench outside the selected agenda item
- permanent global continuation controls detached from the actual handoff moment
- a second canvas that restates the same workshop state with a different IA
- agenda editing forms
- scene authoring controls
- storage/source-of-truth explainer panels

Continuation belongs with the handoff / rotation moment. If that moment is not current or next, the control should not dominate the main control-room canvas.

If the facilitator still needs to correct participant reveal later, provide that as a secondary recovery control on another layer such as `settings`, not as a co-primary workshop action.

The four-section control-room contract (post 2026-04-23 minimal-UI plan) is:

- `Run`: default live runner, agenda outline (read-only), scene preview rail, presenter launch, handoff controls, quiet signal capture. Event code + walk-ins policy live in the Run topbar (mid-scene fast).
- `People`: participant intake, team shaping, team-composition history, GDPR operations (consent, Art. 20 export, soft-delete, password reset).
- `Settings`: slim — identity readout, instance metadata, facilitator grants, end-workshop. Reset / archive / password / team-mode toggle retired to CLI (`harness instance reset|archive`, auth provider, blueprint-time team-mode).
- `Summary`: post-workshop feedback aggregate (read-only).

## Layout Rules

### 1. Keep desktop section navigation in a rail

Do not move control-room section navigation into a full-width horizontal tab strip by default.

Reason:

- horizontal navigation competes with the page title and utility actions
- it scales badly once labels or sections grow
- the current issue is not that the rail exists
- the issue is that the rail is underused while content is over-columned

Allowed pattern:

- top utility row for language, theme, auth, and global links
- persistent summary header for event context
- left rail for section location on desktop
- compact section switcher on mobile
- keep shared runtime orientation in the shell so non-`Run` sections still show current phase, participant-surface state, and team count

### 2. Use the canvas for reading and operating, not authoring

The default canvas should show:

- selected agenda item
- live state
- next action
- facilitator detail needed to run the current moment

The default canvas should not show:

- full edit forms for the selected item
- add-item forms
- source-of-truth implementation notes as a full panel
- safety actions that are not part of the current workshop moment
- agenda or scene authoring affordances

### 3. Use two columns, not three competing narratives

Preferred control-room layout:

- narrow navigation/list column
- one primary detail column

Third columns are allowed only for:

- large desktop-only monitoring views
- clearly independent side content with proven operational value

The `Run` view should not use a permanent third column for add-item, presenter scenes, and storage notes at the same time.

## Progressive Disclosure Rules

### 1. Inline on canvas

Use inline controls only for:

- changing the live marker
- opening the room screen
- simple binary state changes only when they belong to the current or next workshop moment
- quiet signal capture tied to the current moment

Do not keep fallback override controls on the default canvas once the relevant moment has passed.

### 2. Side sheet

Use a side sheet for:

- medium-complexity forms where the facilitator should keep context from the underlying page
- secondary People workflows that need extra context without leaving the section

### 3. Modal dialog

Use a modal only for:

- confirmations
- destructive intent
- short required input tightly coupled to the current action

Do not use a modal for long editing workflows.

### 4. Full page

Use a full page only if the task becomes an editor in its own right.

Examples:

- large monitoring investigation views
- archive inspection

## Action Hierarchy

Each block gets one clear primary action.

Action levels:

- `primary`: the single commit or launch action for the current block
- `secondary`: paired supporting actions
- `ghost`: low-emphasis navigation, jump, or inspect actions
- `danger`: destructive actions only

Rules:

- do not render multiple filled primary buttons side by side unless they trigger the same class of action
- do not style navigation like a submit button
- do not place destructive actions adjacent to routine save actions without a clear visual boundary
- label actions with verb plus object

Good:

- `Move live marker`
- `Open presenter screen`
- `Add team history marker`
- `Reset data`

Weak:

- `Edit`
- `Open`
- `Done`
- `OK`

## Surface Hierarchy

Use only four surface levels:

1. `canvas`: page background
2. `panel`: primary grouped content
3. `inset`: supporting detail inside a panel
4. `overlay`: sheet or modal

If a design needs a fifth card style, the information architecture is probably wrong.

## Reference Material Rules

Source material must look like links, not like vague muted pills.

Required treatment:

- explicit label
- explicit open affordance
- grouped under `Source material`

Avoid:

- tiny low-contrast pills that resemble tags
- links that are visually indistinguishable from metadata

## Run View Pattern

The control room should separate the agenda index from the agenda-moment workbench inside `Run`.

Use this structure:

1. Agenda index
   - top summary for live now, next up, and participant signal
   - timeline as the primary navigation model
   - each timeline row should expose explicit actions for `moment detail` and, when applicable, `move live here`
   - no duplicated selected-item detail below the timeline
2. Agenda moment detail
   - dedicated page state for one selected moment
   - breadcrumb-style location back to the timeline instead of an ambiguous lone back label
   - top hero with the moment summary and its primary action
   - handoff, presenter launch, and quiet signal controls below
3. Editing
   - dashboard does not expose agenda or scene editing from this surface

## Route Feedback

Route-changing controls inside the control room must acknowledge input immediately.

Required pattern:

- internal links that open a moment detail, sheet, or adjacent page state should show a pending spinner or busy state on click
- the same applies to breadcrumb navigation back to the timeline and scene-to-scene navigation on the presenter surface
- do not rely on the eventual route paint alone as the only confirmation that the click worked
- do not turn the index into a long mixed read/edit canvas

This keeps the reading order obvious:

- browse
- open detail
- act
- edit only when needed
- reveal secondary detail only when needed

## Presenter Paging Pattern

The presenter surface should stay scene-first, but scene packs may expose low-chrome paging when the facilitator needs to move from one room scene to the next without bouncing back to the control room.

Rules:

- scene content remains visually dominant
- previous / next scene controls stay subordinate to the scene
- scene paging must not reintroduce facilitator metadata, top nav, or room-pulse chrome
- participant walkthrough stays available at the scene level, not in the main launcher row

## Copy Rules

- Use calm, literal operational language.
- Prefer event and runtime nouns over implementation jargon.
- Explain blueprint versus runtime only where the trust boundary matters.
- Participant-facing or facilitator-facing Czech remains Czech.
- Technical labels that name a system concept may stay English if the repo already treats them as product terms.

## Review Checklist

Before shipping a control-room change, verify:

1. Can a facilitator identify the selected event and live phase in under 3 seconds?
2. Is the default canvas mostly read-mode, not form-mode?
3. Does each block have one obvious primary action?
4. Are destructive actions visually isolated?
5. Do source links clearly read as links?
6. On desktop, is the second column doing the real work instead of a third column carrying avoidable clutter?
7. On mobile, does the section switcher replace the rail without turning the page into one endless form?
