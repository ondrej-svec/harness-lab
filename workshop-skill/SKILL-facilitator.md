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

For the participant-side identify model (event code → name pick → password) that several of these commands interact with, read `docs/adr/2026-04-19-name-first-identify-with-neon-auth.md`.

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

The event code is the **room key** — it gets participants to the identify surface, but every participant also sets and enters their own password during identify. Rotating the code does not touch participant accounts; forgotten-password help lives in `workshop facilitator reset-participant-password` below. Reference: `docs/adr/2026-04-19-name-first-identify-with-neon-auth.md`.

### `workshop facilitator participants`

Manage the named-participant pool for the current instance. Every action has a matching UI
control in the admin People section; the CLI is the scriptable path for batch workflows and
the agent-native demo. See `docs/previews/2026-04-16-cli-surface.md` for the full matrix.

**Why pre-paste matters:** the identify surface shows a name picker scoped to the
pre-pasted roster. Participants who are on the roster pick their name and set a password
in two taps. Participants who are not get the walk-in path if enabled, or a "ask your
facilitator" dead-end if not. Pasting the roster before the session starts is the single
biggest quality-of-life win for facilitators running a fixed cohort. Use
`harness --json workshop participants import` for the bulk flow below.

Commands:

- `harness --json workshop participants list [--unassigned] [--team <id>]` — list the pool
  and current assignments. `--unassigned` filters to participants with no team; `--team <id>`
  filters to those on a specific team.
- `harness --json workshop participants add <name> [--email EMAIL] [--tag TAG]` — add one
  participant. Email is stored without consent; flip consent separately with `update --consent on`.
- `harness --json workshop participants import (--file PATH | --stdin)` — bulk import from
  a CSV/TSV/paste. The server parses with the same smart-parser used by the UI: accepts
  `Name`, `Name, email`, or `Name, email, tag` per line; separators `,` `\t` `;`. Returns
  per-entry created + skipped arrays.
- `harness --json workshop participants update <id> [--name STR] [--email STR|null] [--tag STR|null] [--consent on|off]` —
  edit one participant. Pass `null` to clear email or tag. `--consent on` requires an email
  to be present; the server returns 409 `email_opt_in_without_email` otherwise.
- `harness --json workshop participants remove <id>` — soft-delete (sets `archived_at`);
  cascades: unassigns from any team, nulls the session binding.

Privacy rule: emails ingested through the CLI default to `emailOptIn: false`. Never assume
consent has been received; collect it explicitly before flipping the flag.

### `workshop facilitator team assign / unassign / randomize`

Team-membership operations for the current instance.

- `harness --json workshop team assign <participantId> <teamId>` — assign-or-move. Returns
  `movedFrom: <prevTeamId>` if the participant was previously on another team, otherwise `null`.
- `harness --json workshop team unassign <participantId>` — remove from current team.
  Idempotent; returns `{ ok: true }` even if the participant was already unassigned.
- `harness --json workshop team randomize --teams <N> [--strategy cross-level|random] [--preview] [--commit-token TOKEN]` —
  two-step safety model. Run with `--preview` to compute a distribution and receive a signed
  `commitToken` (60s TTL), then re-run with `--commit-token <token>` to commit. A single call
  without either flag computes + commits directly; TTY callers are prompted for confirmation.

Strategy default is `cross-level`: participants are grouped by `tag` and round-robin distributed
across teams with a rotating offset per group, so each team receives a mixed set of tags. Use
`random` for pure shuffle. Seed is a timestamp, so repeated previews reroll.

### `workshop facilitator walk-in-policy`

Control whether participants whose names are not on the pre-pasted roster can still enter the
room. Every instance has an `allow_walk_ins` flag (default `true`).

The CLI does not currently expose this flag as a dedicated toggle. Route the facilitator to
the dashboard UI at `/admin/instances/{instanceId}?section=access` — the Access section has
a toggle control that writes the flag through the admin server action.

Consequences to name explicitly:
- `allow_walk_ins = true` (default): unknown names see a walk-in path on the identify
  surface; they type a display name and continue to the password step.
- `allow_walk_ins = false`: unknown names see "ask your facilitator to add you" with no
  input field. Use this for invite-only cohorts where the roster is the contract.

Hand-off pattern for an invite-only workshop:
1. Pre-paste the roster with `harness workshop participants import`.
2. Flip `allow_walk_ins` off in the dashboard Access section.
3. Tell the facilitator that any last-minute additions need a new `participants add` or a
   one-off flip of the walk-in toggle.

### `workshop facilitator reset-participant-password`

Help a participant who forgot their password during the session. The flow is deliberately
in-room only — the facilitator issues a temporary password from the admin UI, reads it
aloud, and the participant enters it at the dashboard identify surface.

Steps to walk the facilitator through:
1. Open `/admin/instances/{instanceId}?section=people` on the dashboard.
2. Find the participant's row and click the reset-password control.
3. The dashboard returns a 3-word temporary password (e.g. `orbit-bridge-shift`). The
   server rotates the participant's password through the Neon Auth proxy and revokes any
   existing sessions for that account.
4. Read the 3 words aloud to the participant. They enter it on the identify surface and
   set a new password of their choosing.

Rules:
- do not ask the participant for their old password and do not repeat it back if they
  volunteer it — it is useless after reset and the skill must not be a password store
- the temporary password is single-shot; if the facilitator closes the dialog without
  reading it aloud, they need to issue a new one
- the reset works through the dashboard control-plane path; there is no CLI flag for
  this by design (privacy: reset must stay in-room)
- the underlying implementation is `dashboard/lib/participant-auth.ts:resetParticipantPasswordAsAdmin`,
  which goes through `dashboard/lib/auth/neon-auth-proxy.ts` and session revocation

Reference: `docs/adr/2026-04-19-name-first-identify-with-neon-auth.md`.

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

### `workshop facilitator reference list|import|reset`

Manage the participant reference catalog override for the current instance.

- `harness workshop reference list` — inspect the effective catalog (returns `null` when no override is set and participants see the compiled default).
- `harness workshop reference import --file <path>` — replace the catalog for this instance from a JSON file. The file may be either a bare `GeneratedReferenceGroup[]` or the generated-view shape `{ schemaVersion, groups }`. Exports from `dashboard/lib/generated/reference-{en,cs}.json` are a natural starting point.
- `harness workshop reference reset` — clear the override; the compiled default becomes live again on next participant reload.
- `harness workshop reference add-item|set-item|remove-item` — surgical edits that fetch the current effective catalog, apply the change, and write the full catalog back. See `harness-cli/README.md` for flag reference.

Groups are a fixed set: `defaults`, `accelerators`, `explore`. Items carry a `kind` discriminant: `external` (absolute URL), `repo-blob` / `repo-tree` (repo-relative file or directory), `repo-root` (repo URL), or `hosted` (Markdown body rendered inside the dashboard). The validator rejects `javascript:` or `data:` hrefs.

When a facilitator asks to "add a new reference link" or "swap out the resource kit for this cohort", this is the path — no redeploy needed.

### `workshop facilitator reference show-body|set-body|reset-body`

Manage the Markdown body for a hosted reference item on this instance.

- `harness workshop reference show-body <itemId>` — fetch the effective body; reports `source=override` or `source=default`.
- `harness workshop reference set-body <itemId> --file <path.md>` — push a custom Markdown body for this instance only. The body is rendered inside the participant chrome at `/participant/reference/<itemId>` with a "CUSTOM FOR THIS WORKSHOP" badge. Bodies are sanitised at render time so arbitrary Markdown is safe to push (no raw HTML, no script/iframe, no javascript: hrefs).
- `harness workshop reference reset-body <itemId>` — clear the override; the compiled default (inlined from the authoring source at build) renders again.

### `workshop facilitator copy show|set|import|reset`

Override a narrow whitelist of participant-facing copy per instance. Currently limited to post-workshop section bodies.

- `harness workshop copy show` — print the active override or null.
- `harness workshop copy set <key.path> <value>` — edit one key. Allowed paths: `postWorkshop.title`, `postWorkshop.body`, `postWorkshop.feedbackBody`, `postWorkshop.referenceBody`.
- `harness workshop copy import --file <path.json>` — bulk-push.
- `harness workshop copy reset` — clear overrides.

Unknown keys are rejected with a helpful error. Missing keys fall through to the compiled defaults at render time (partial overrides are a first-class flow — override just the title, leave the body on default).

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
