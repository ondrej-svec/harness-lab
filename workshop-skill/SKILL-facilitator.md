---
name: workshop-facilitator
description: >
  Facilitator-facing skill for the Harness Lab workshop. Provides workshop
  instance management, agenda editing, scene authoring, participant access
  control, and cross-cohort learnings. Activates only after successful
  facilitator login via the harness CLI.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Agent
  - AskUserQuestion
  - Write
  - Edit
  - Bash
---

# Workshop — Facilitator

Facilitator-facing skill for the Harness Lab workshop. This skill activates only after successful `workshop facilitator login` via the harness CLI.

For the full operational reference with API routes, payload shapes, and rules, see `workshop-skill/facilitator.md`.

## Loading Condition

This skill should be loaded only when the facilitator has an active facilitator session. Participant sessions do not grant access to these commands.

## Language Resolution

Facilitator-control commands are operational rather than room-facing delivery:
- prefer the user's current language unless the facilitator explicitly asks for another reviewed locale or you are quoting workshop content
- the authored language of a supporting doc does not decide the reply language by itself
- if the requested locale has no reviewed variant, fall back to English and say so explicitly
- do not let a Czech-authored fallback file force a Czech answer when the resolved response locale is English

## Commands

### `workshop facilitator login`

Authenticate as a facilitator through the `harness` CLI privileged path.
The skill should ask the facilitator to complete CLI login/bootstrap if needed, then use the CLI-backed session for subsequent commands.
This is a facilitator-only command — do not surface to participants.

### `workshop facilitator status`

Show the current instance state, agenda phase, facilitator list, and team count.
Requires active facilitator session.
If a local current instance is selected, prefer that target over deployment-default status.
When an agent needs machine-readable output, prefer `harness --json workshop status`.

### `workshop facilitator current-instance`

Show the locally selected facilitator target, where it came from, and the resolved instance record.
Prefer invoking `harness instance current`.
Use this to confirm the CLI target before update, reset, prepare, remove, or phase operations.

### `workshop facilitator select-instance <instance-id>`

Persist a facilitator-local current target for later workshop commands.
Prefer invoking `harness instance select <instance-id>`.
Use `harness instance select --clear` to remove the stored selection.

### `workshop facilitator list-instances`

List the facilitator-visible workshop instance registry.
Prefer invoking `harness instance list` over raw API scripts or local session-file inspection.
Use this when the facilitator needs to discover what currently exists on a shared dashboard before choosing an explicit instance for reset, update, or agenda work.
When an agent needs strict parsing, prefer `harness --json instance list`.

### `workshop facilitator show-instance <instance-id>`

Inspect one explicit workshop instance.
Prefer invoking `harness instance show <instance-id>` over raw API scripts.
Use this when the facilitator needs the full record for one instance rather than the deployment-default runtime status returned by `workshop facilitator status`.
If a current instance is already selected, the CLI may omit `<instance-id>` and use the stored target.

### `workshop facilitator participant-access`

Inspect or rotate the shared participant event code for the current workshop instance.
Prefer invoking `harness --json workshop participant-access` for inspection and `harness --json workshop participant-access --rotate` to issue a fresh code.
If the current raw code is no longer recoverable from the hash-only runtime store, issue a new code instead of guessing.

### `workshop facilitator grant <email> <role>`

Grant a Neon Auth user access to the current workshop instance.
Roles: owner, operator, observer. Requires `owner` role.

### `workshop facilitator revoke <email>`

Revoke a facilitator's access to the current instance. Requires `owner` role.

### `workshop facilitator create-instance`

Create a new workshop instance from a template. Requires facilitator session.
Prefer invoking `harness instance create` over raw API scripts.

The skill should support rich event metadata, not just id and city:
- `id`
- `templateId`
- `contentLang`
- `eventTitle`
- `city`
- `dateRange`
- `venueName`
- `roomName`
- `addressLine`
- `locationDetails`
- `facilitatorLabel`

### `workshop facilitator update-instance <instance-id>`

Update event metadata for an existing workshop instance. Requires facilitator session.
Prefer invoking `harness instance update` over raw API scripts.
Use this when the facilitator wants to correct or refine date, venue, room, address, or event title without resetting the instance.
Support `contentLang` changes explicitly so facilitators can choose workshop delivery language per instance without changing admin UI language.

Facilitator discovery rule:
- for routine discovery, use `harness instance list` and `harness instance show`
- for repeated work on one live workshop, use `harness instance select <instance-id>` and `harness instance current`
- do not read local CLI session files or improvise authenticated `node -e` fetch scripts unless you are diagnosing the CLI itself

### `workshop facilitator reset-instance <instance-id>`

Reset one existing workshop instance from the selected blueprint template. Requires facilitator session.
Prefer invoking `harness instance reset` over raw API scripts.
Use this when the facilitator wants fresh canonical agenda, runner, and presenter content for a live instance and accepts that local runtime state will be reinitialized.
If a current instance is already selected, the CLI may omit `<instance-id>` and use the stored target.

### `workshop facilitator remove-instance`

Remove a workshop instance from the active list without deleting its archive history. Requires facilitator session.
Prefer invoking `harness instance remove`.
If a current instance is already selected, the CLI may omit `<instance-id>` and use the stored target.

### `workshop facilitator prepare`

Set the current instance to `prepared` state. Verify event code is ready.
Prefer invoking `harness workshop prepare`.
If a current instance is already selected, the CLI may omit `<instance-id>` and use the stored target.

### `workshop facilitator agenda`

Inspect and edit the local agenda copy for one workshop instance. Requires facilitator session.

### `workshop facilitator scenes`

Inspect and edit presenter scenes for one workshop instance. This includes listing scenes for an agenda item, creating a new scene, editing content, changing default scene, reordering scenes, and enabling or hiding scenes. Requires facilitator session.

Rules for rich scenes:
- keep scenes agenda-linked and room-facing rather than inventing a freeform slide deck
- prefer one dominant voice per scene and one main idea per scene
- use reviewed local blueprint assets for reusable visuals instead of ad hoc remote image URLs
- treat runtime scene edits as instance-local until a maintainer deliberately publishes them back into the repo
- when richer scene authoring or promotion is involved, follow `docs/presenter-rich-scene-authoring.md`

### `workshop facilitator archive`

Archive the current workshop instance with optional notes.

### `workshop facilitator learnings`

Query the cross-cohort learnings log to review rotation signals from past and current workshops.
Prefer invoking `harness --json workshop learnings` for machine-readable output.
Supports flags: `--tag TAG`, `--instance ID`, `--cohort NAME`, `--limit N` (default 20).
When the facilitator asks for rotation signals, captured observations, or what happened during past handoffs, use this command.
If the learnings log is empty, say so and suggest capturing the first signal using the rotation capture panel in the facilitator dashboard.

### `workshop closing`

Prepare Ondrej's closing synthesis by using:
- sprint checkpoints from the dashboard
- monitoring summary
- W³ commitments or closing notes
Use `workshop-skill/closing-skill.md`.
Treat this as facilitator-facing. Do not proactively surface it to participants during normal workshop help.

## Fallback Content

If the API is not reachable:
- say explicitly that live workshop data is unavailable
- avoid inventing team state, checkpoint state, or facilitator-only information
- prefer `workshop-skill/facilitator.md` for the full operational command reference

## Style

- Be concise and directive.
- Use the resolved response language.
- English is the default bundled fallback locale when no live or user-language signal overrides it.
- Keep command names, file names, and code terms in English.
- Prefer actionable operational guidance over theory.
