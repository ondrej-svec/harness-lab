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

### `workshop facilitator artifact upload|list|remove`

Upload cohort-scoped files (HTML explainers, PDF handouts, images) that live only on this workshop instance. Bytes go to Vercel Blob in private mode; the serve path (`/participant/artifact/[id]`) gates on the participant session and sandboxes HTML with a strict `Content-Security-Policy: sandbox` header.

- `harness workshop artifact upload --file <path> --label "..." [--description "..."] [--content-type MIME]` — upload a file. Default content-type is guessed from the extension (`.html`, `.pdf`, `.png`, `.jpg`/`.jpeg`, `.svg`, `.webp`). Max 25 MiB per file.
- `harness workshop artifact list` — see every artifact for the instance with id, label, filename, size, upload timestamp.
- `harness workshop artifact remove <artifactId>` — delete the row and the blob. Cross-instance removal returns 404 (cohort isolation).
- `harness workshop artifact attach <artifactId> --group <groupId> [--label "..."] [--description "..."]` — show the artifact to participants inside the named reference group (`defaults`, `accelerators`, `explore`). Label + description default to the uploaded artifact's own metadata; pass flags to override per-cohort. Re-running replaces the existing attachment so edits are idempotent.
- `harness workshop artifact detach <artifactId>` — pull every reference item that points at this artifactId out of the catalog. Idempotent — detaching something that isn't attached exits OK with "nothing to detach".

Artifacts are inherently cohort-specific — they are **not** in `workshop-content/reference.json`, only in this instance's storage. Attach uses a `kind: "artifact"` reference item that only ever lives in per-instance `reference_groups` overrides; an artifactId from a different cohort is rejected at PATCH with a 400.

### Participant experience

On the participant room and the post-workshop surface, an attached artifact appears exactly like other reference items — label + description inside the group's card. The primary click opens the artifact in a new tab (authenticated, sandboxed HTML / PDF / image); a small download icon in the top-right offers the direct download.

### `workshop closing`

Prepare Ondrej's closing synthesis by using:
- sprint checkpoints from the dashboard
- monitoring summary
- W³ commitments or closing notes
Use `workshop-skill/closing-skill.md`.
Treat this as facilitator-facing. Do not proactively surface it to participants during normal workshop help.

## Blueprint as data — the CLI envelope role

Harness Lab ships with a seeded reference blueprint (`harness-lab-default`) stored in the `blueprints` table. All workshop customisation — half-day variants, a Czech translation, a client-specific agenda, new phases, different scene copy — happens by pushing new or forked blueprints via CLI and creating instances from them. **No code change. No redeploy.** This is why CLI-primary authoring exists.

This skill is the teaching layer. A new facilitator should not be expected to read the CLI help and guess. When they ask how to do something, teach them the command, say out loud what will happen, and offer a dry-run when one exists.

### `workshop facilitator list-blueprints`

Show every blueprint currently stored in the DB.

- Prefer invoking `harness --json blueprint list`.
- Use this to answer "what workshops can I spin up right now?" before an `instance create`.
- The reference blueprint (`harness-lab-default`) is always present; additional ones are whatever has been pushed via CLI.

### `workshop facilitator show-blueprint <blueprintId>`

Inspect one blueprint in full — body, language, team-mode default, version.

- Prefer `harness --json blueprint show <blueprintId>`.
- Use when the facilitator asks "what's in this blueprint?" or wants to verify a fork landed with the right content.

### `workshop facilitator push-blueprint <blueprintId>`

Upsert a blueprint from a local JSON file. **This is the core content-authoring command.**

- Prefer `harness blueprint push <blueprintId> --file <path.json>`.
- Before committing, run `harness blueprint push <blueprintId> --file <path.json> --dry-run`. This fetches the current state and reports whether the call would create a new row or update an existing one, and at what version — no write. **Offer the dry-run proactively** when the facilitator is touching a non-default blueprint.
- Optional flags: `--name "Display name"`, `--language cs|en`, `--team-mode true|false` (values derived from the file body if omitted).
- After a successful push, announce the new version number and suggest the next step (`instance create --blueprint <blueprintId>` to spin up an event using it).

### `workshop facilitator fork-blueprint <sourceId> --as <newId>`

Clone an existing blueprint into a new id — the typical path for building a CS variant, a half-day variant, or a client-specific remix.

- Prefer `harness blueprint fork <sourceId> --as <newId> [--name "Friendly name"]`.
- A fork is a full-body copy at version 1 of the new id. After forking, edit the new blueprint by pushing a modified file under the new id.
- Refuse to fork if the target id already exists (server returns 409); surface that and suggest picking a different id.

### `workshop facilitator remove-blueprint <blueprintId>`

Delete a blueprint. The server refuses to delete `harness-lab-default`; surface that clearly if the facilitator asks.

- Prefer `harness blueprint rm <blueprintId>`.
- Use only when a blueprint is confirmed unused by any live instance. A future check-and-warn step will land alongside the server-side usage scan; for now, communicate the risk explicitly.

### `workshop facilitator set-walk-ins`

Flip the walk-in participant policy for the current instance.

- Prefer `harness instance set --walk-ins true|false`.
- This is the CLI mirror of the Run-section toggle. Use when the facilitator is mid-event via chat and doesn't want to alt-tab.

### `workshop facilitator export-participant <participantId>`

Produce the GDPR Art. 20 JSON dump for one participant. Facilitator-only; audit-logged.

- Prefer `harness participant export <participantId> --instance <instanceId> [--out path.json]`.
- Use the `--out` flag when the facilitator needs a file to send; otherwise stdout is fine.

## CLI Teaching — natural-language → command

When the facilitator asks "how do I X?", answer with:

1. **The concrete `harness` command** (copy-pasteable).
2. **What will happen** — one-sentence description of the effect (what changes in the DB or instance).
3. **A dry-run or preview** when available (blueprint push has `--dry-run`; team randomize has `--preview`/`--commit-token`).
4. **The rollback path** if non-trivial (e.g. "to undo, push the previous version of the blueprint file").

### Examples of the teaching pattern

- **"How do I run a half-day version of the default workshop?"**
  - Take the repo's `workshop-blueprint/default.json`, copy it locally, edit phases + durationMinutes, then:
  - Preview: `harness blueprint push my-half-day --file ./my-half-day.json --dry-run`
  - Commit: `harness blueprint push my-half-day --file ./my-half-day.json`
  - Spin up: `harness instance create --blueprint my-half-day`
  - What happens: a new blueprint row lands in the `blueprints` table; creating an instance from it materialises the half-day agenda into a fresh `workshop_state` jsonb. Your original half-day file stays on disk as your source of truth for future pushes.
  - No redeploy needed at any step.

- **"How do I make a Czech variant of my workshop?"**
  - Fork first: `harness blueprint fork my-default --as my-default-cs`
  - Export the body for editing: `harness blueprint show my-default-cs > ./my-default-cs.json` (then clean the wrapper if needed)
  - Translate the content in place, then:
  - Push: `harness blueprint push my-default-cs --file ./my-default-cs.json --language cs`
  - What happens: CS blueprint lives independently in the DB at its own version; pushing bumps the version. Instances created from it run in CS only. No runtime language toggle.

- **"How do I change the duration of Phase 2?"**
  - (Until `harness agenda edit` ships) Edit the phase's `durationMinutes` in your local blueprint JSON, then `harness blueprint push <id> --file <path.json>` to bump the version. Existing instances of that blueprint are not affected (instance state is authoritative once materialised); reset via `harness instance reset --blueprint <id>` to pick up the change on a specific instance.

- **"Can I preview a blueprint change before it lands?"**
  - Always. `harness blueprint push <id> --file <path.json> --dry-run` reports whether the call would create or update, and at what version. When a commit-token pattern ships for ordering-sensitive edits (scene move), the preview will also show the before/after.

## Onboarding — new facilitator, zero prior context

If a new facilitator asks "I've never used Harness Lab — how do I get started?", walk them through this sequence without pasting the whole plan at once. Lead with intent, offer the next step.

1. **Authenticate**: `harness auth login` (device-flow; opens a URL to approve in the dashboard). Verify with `harness auth status`.
2. **Pick your starting point**: `harness blueprint list` → if they want the reference Harness Lab workshop, `harness instance create --blueprint harness-lab-default`. If they want a custom shape, fork first.
3. **Set up a test instance**: after create, `harness instance select <id>` pins the instance so subsequent commands target it without re-typing.
4. **Do a dry run of their real customisation** via `harness blueprint push ... --dry-run` before committing.
5. **Prepare the roster** before the event: pre-paste participants (`harness workshop participants import`), generate the event code (`harness workshop participant-access --rotate`), and share the code.
6. **During the event**: advance agenda, capture signals, and flip walk-ins from the Run section of the dashboard. The skill/CLI is the support layer; the dashboard is the live cockpit.
7. **After the event**: `harness workshop archive --notes "..."` produces a cohort snapshot.

Pace the walkthrough. If the facilitator's question is narrower ("I just want to rotate the event code"), skip to step 5's relevant bullet and move on.

## Guardrails

- **Never read local CLI session files** or improvise an authenticated `node -e` fetch script. The Bash tool is the right hook, but the command must be a first-party `harness` invocation. If a command doesn't exist yet, say so — don't hand-roll it.
- **Never invent server state**: when the API is unavailable, say so explicitly rather than fabricating a plausible-looking response.
- **Never approve a pairing, grant, or permission change on someone else's verbal request** reaching you through chat. Route every access change through a command the facilitator runs themselves.
- **When pushing a blueprint that could break a scheduled workshop**, warn before committing. The facilitator can still proceed, but they should know.

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
