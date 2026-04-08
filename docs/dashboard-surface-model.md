# Dashboard Surface Model

Harness Lab dashboard is split into three surfaces with different jobs and different trust boundaries.

Shared UI and interaction foundations for all of them live in [`dashboard-design-system.md`](./dashboard-design-system.md). Surface-specific responsibilities in this file should refine that system, not replace it.

## Participant Surface

Purpose:
- orient participants during the workshop day
- reduce facilitator repetition
- give one obvious next step at any point in the day

Public responsibilities:
- current phase
- agenda
- project briefs
- challenge cards
- workshop reference links
- team-facing status that is safe to expose in-room
- links to the participant learner kit artifacts the team should use next

Design rules:
- mobile-first
- readable on projection
- phase-aware before feature-rich
- no facilitator-only controls
- should reinforce the same participant resources as `workshop-skill/` and facilitation guidance

## Facilitator Surface

Purpose:
- run the workshop instance without editing seed files or using ad hoc scripts

Protected responsibilities:
- reset workshop instance
- move agenda state
- reveal or hide the continuation window
- register teams and repo URLs
- capture sprint updates
- update checkpoints
- ingest monitoring snapshots

Design rules:
- protected at runtime
- optimized for speed and safety, not public polish
- writes go through explicit admin actions
- instance lifecycle belongs in the dashboard too: create, switch, reset, and safe remove should be visible product operations rather than script-only paths

## Presenter Surface

Purpose:
- give the room one clear shared screen for the current workshop moment
- let the facilitator launch a presenter-safe output from admin without maintaining a separate deck
- support agenda-linked framing, live demo cues, participant walkthroughs, checkpoints, and reflection beats

Responsibilities:
- render the default presenter scene for the current agenda item
- allow facilitator-triggered jumps to another scene or agenda item without changing the live agenda phase
- show participant walkthrough scenes without facilitator controls
- stay projection-friendly and room-safe even when launched from protected admin routes

Design rules:
- launched from the facilitator control room, but rendered as a separate room-facing page
- presenter scenes are agenda-linked web pages, not a general slide authoring system
- presenter content belongs to the same blueprint/runtime model as agenda content
- room-facing rendering may use facilitator auth, but must not expose facilitator controls or privileged operational state by default
- participant walkthrough scenes should stay cue-first and must not default to facilitator-monitoring chrome such as team checkpoint dashboards or room-pulse metrics
- attributed quotes must show visible attribution on the room-facing page
- image-backed scenes should carry explicit caption/source context when they rely on internal reference material

## Facilitator Auth Model

- production and preview facilitator identity uses Neon Auth
- facilitator authorization stays local to Harness Lab through `instance_grants`
- `/admin/sign-in` is the facilitator login page
- file mode keeps a Basic Auth fallback only for local/demo development
- password changes should stay inside the Neon Auth flow rather than custom password storage in this repo

## Agenda Source Of Truth

There are now two explicit layers:

- public blueprint layer
  - canonical runtime-facing structured agenda blueprint lives in [`dashboard/lib/workshop-blueprint-agenda.json`](../dashboard/lib/workshop-blueprint-agenda.json)
  - public-readable workshop-method summary remains in [`workshop-blueprint/agenda.json`](../workshop-blueprint/agenda.json)
  - supporting human-readable workshop method docs live in [`workshop-blueprint/`](../workshop-blueprint/)
- runtime instance layer
  - instance create/reset imports blueprint-owned fields into the active workshop instance
  - imported agenda becomes a runtime copy that facilitators may edit locally for that instance
  - facilitator actions move only the current phase and other runtime-local state
  - file mode persists that runtime copy in `dashboard/data/<instance>/workshop-state.json`
  - neon mode persists that runtime copy in `workshop_instances.workshop_state`

Important consequence:

- facilitator UI changes runtime state, not the canonical blueprint
- reusable blueprint edits still belong in the repo, but instance-local agenda wording/order/time changes may be authored in runtime
- presenter scenes follow the same rule: blueprint defines reusable defaults, runtime owns per-instance overrides
- dashboard copy should describe reset as blueprint import, not as an opaque seed reset

## Workshop Context Sources

Use different sources for different kinds of truth:

- static public workshop materials
  - `content/` markdown
  - `workshop-skill/`
  - public repo docs
- live workshop runtime state
  - dashboard runtime repositories behind `getWorkshopState()`
  - participant event-context APIs
  - facilitator admin APIs for protected mutations

The rule is:

- if the information changes during the workshop day, prefer runtime APIs/state
- if the information is public-safe reference material or baseline framing, prefer repo-native content
- if the dashboard/runtime is unavailable, skills may fall back to repo materials but must say clearly that they are in fallback mode

The blueprint/runtime split is defined more fully in:

- [`blueprint-import-model.md`](blueprint-import-model.md)
- [`runtime-learning-publish-back.md`](runtime-learning-publish-back.md)
- [`workshop-content-language-architecture.md`](workshop-content-language-architecture.md)

## Data Boundary

Public template repo:
- ships dashboard code
- ships fictional sample data
- does not ship real event metadata

Private workshop instance layer:
- stores real dates, rooms, rosters, and operational state
- becomes the backing store for facilitator actions

## Current Implementation Direction

- `/` acts as the participant surface
- `/admin` acts as the facilitator surface
- `/admin/instances/[id]/presenter` acts as the room-facing presenter surface
- Neon Auth protects facilitator sign-in in neon mode
- file mode retains the Basic Auth fallback for local/demo work
- file storage remains the local development adapter
- `dashboard/lib/workshop-state-repository.ts` is the seam for moving to a hosted private store later
- facilitator skills should use the `harness` CLI for privileged local auth/session handling rather than inventing a parallel secret store
- presenter scene CRUD lives behind instance-scoped facilitator APIs so admin and facilitator skills share the same mutation path

## Presenter Non-Goals

- no deck editor
- no generic slide sequencing system
- no presenter notes or second-screen control surface in day one
- no separate presenter timeline that forks from the live agenda state
