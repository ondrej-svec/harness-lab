# Facilitator Commands

Commands for facilitators who manage workshop instances through an AI agent.

## Auth

The facilitator must log in through the `harness` CLI first. The skill should not become another secret store for raw credentials or long-lived sessions.

### `/workshop facilitator login`

If no facilitator session is active, tell the facilitator to run:

```bash
harness auth login
```

The CLI performs the browser/device auth flow, stores the session in local file storage, and exposes it to subsequent privileged commands.

Model:
- `harness auth login` authenticates the facilitator with the platform
- the specific workshop instance is selected later per operation or via default context
- the instance grant is evaluated when accessing a specific action, not during login itself

Current practical paths in this repo:

- default / browser-device auth:
```bash
harness auth login --dashboard-url https://harness-lab-dashboard.vercel.app
```
- file mode / local demo fallback:
```bash
harness auth login --auth basic --dashboard-url http://localhost:3000 --username facilitator --password secret
```
- neon mode / shared dashboard bootstrap fallback:
```bash
harness auth login --auth neon --dashboard-url https://harness-lab-dashboard.vercel.app --email facilitator@example.com
```

Note:
- the CLI currently defaults to browser/device auth and stores the session in local file storage
- if the facilitator wants OS-native storage, they can use `HARNESS_SESSION_STORAGE=keychain`, `credential-manager`, or `secret-service`
- `--auth basic` and `--auth neon` remain explicit fallbacks for local dev/bootstrap

Preferred operator flow after login:

```bash
harness instance list
harness instance select sample-workshop-demo-orbit
harness instance current
harness workshop status
```

Rules:
- prefer this flow over reading local CLI session files or composing ad hoc authenticated `node -e` scripts
- once a local selection exists, the CLI may use it as the default target for subsequent facilitator operations
- when an agent needs machine-readable output, prefer `harness --json ...`

### `/workshop facilitator logout`

Ask the facilitator to run:

```bash
harness auth logout
```

## Instance Management

### `/workshop facilitator status`

Preferred path:

```bash
harness workshop status
```

Show:
- active instance and its status
- current phase
- facilitator list with roles
- team count

Use this for the current default or selected workshop context.
If the facilitator needs the full workspace registry first, use `list-instances` instead of probing local session files or writing raw authenticated fetch scripts.

Targeting behavior:
- if the facilitator previously ran `harness instance select <instance-id>`, `status` reports that selected instance
- if no local selection exists, `status` hard-errors with "No instance selected. Run `harness instance select <id>`..."; pin an instance first
- for exact machine parsing, prefer `harness --json workshop status`

### `/workshop facilitator current-instance`

Preferred path:

```bash
harness instance current
```

Show:
- the locally selected instance id when one exists
- where the current target came from (persisted session selection or none)
- the resolved instance summary and full record for operator verification

Rules:
- use this after `select-instance` when the facilitator wants to confirm the CLI target before update, reset, or remove
- if nothing is selected, the command should say so clearly instead of forcing the facilitator into session-file inspection

### `/workshop facilitator select-instance <instance-id>`

Preferred path:

```bash
harness instance select sample-workshop-demo-orbit
```

Clear the stored selection:

```bash
harness instance select --clear
```

Rules:
- use this when a facilitator will perform several operations against the same live workshop instance
- the CLI should validate the instance through the server before persisting the selection
- after selection, `status` and `phase set` target that instance; without a selection both hard-error
- `show-instance`, `update-instance`, `reset-instance`, `prepare`, and `remove-instance` may omit `<instance-id>` when a valid selection already exists

### `/workshop facilitator list-instances`

Preferred path:

```bash
harness instance list
```

Show:
- facilitator-visible instance ids
- template id
- status
- content language
- event title and room metadata when present

Raw API reference:

```http
GET {DASHBOARD_URL}/api/workshop/instances
```

Rules:
- prefer this over inspecting local session files or composing one-off authenticated scripts
- use it when the facilitator needs to discover which live instances exist before reset, update, or scene work
- keep raw API usage as a diagnostic fallback, not the default operator workflow
- when an agent needs to parse the output, prefer `harness --json instance list`

### `/workshop facilitator show-instance <instance-id>`

Preferred path:

```bash
harness instance show sample-workshop-demo-orbit
```

Show:
- one explicit instance record
- summary metadata for quick operator inspection
- the full instance payload when the facilitator needs exact values before a mutation

Raw API reference:

```http
GET {DASHBOARD_URL}/api/workshop/instances/{instanceId}
```

Rules:
- use this when the facilitator needs one specific instance by id (unlike `workshop status`, which requires an active selection)
- if the route returns `404`, the instance does not exist or is not visible to the facilitator
- prefer this over ad hoc authenticated scripts for routine discovery
- if a local selection already exists, the facilitator may omit `<instance-id>` and let the CLI use the stored target

### `/workshop facilitator participant-access`

Preferred inspection path:

```bash
harness --json workshop participant-access
```

Preferred rotation path:

```bash
harness --json workshop participant-access --rotate
```

Optional explicit code:

```bash
harness --json workshop participant-access --rotate --code orbit7-bridge4-shift2
```

Show:
- whether participant access is active for the current instance
- code id and expiry
- the current raw code only when it is still recoverable from sample/bootstrap configuration
- the newly issued raw code in the rotation response

Rules:
- treat the runtime store as hash-only after rotation; if the current raw code is unavailable, issue a new one instead of trying to recover it
- prefer this command over inspecting env vars, deployment config, or database rows directly
- if a local selection already exists, the CLI may omit `<instance-id>` and use the stored target
- use `--json` for agent consumption so the skill can quote the issued code exactly without scraping prose
- keep the participant event code separate from facilitator credentials and do not present it as an admin password
- the event code is the **room key** — it gates access to the identify surface; every participant still sets and enters a personal password during identify. Rotating the code does not affect participant accounts. Reference: `docs/adr/2026-04-19-name-first-identify-with-neon-auth.md`

### `/workshop facilitator participants import`

The preferred roster pre-paste path:

```bash
harness --json workshop participants import --stdin
```

Or from a file:

```bash
harness --json workshop participants import --file roster.csv
```

Optional dry-run:

```bash
harness --json workshop participants import --file roster.csv --dry-run
```

The parser accepts one participant per line:
- `Name`
- `Name, email`
- `Name, email, tag`

Separators are `,`, `\t`, or `;`. The server uses the same smart parser as the dashboard UI and returns per-entry `created` and `skipped` arrays. Emails default to `emailOptIn: false`; flip consent separately with `participants update --consent on`.

Rules:
- use this before the room opens so participants land on a name picker scoped to the roster instead of the walk-in path
- prefer `--dry-run` first when the facilitator is unsure about format or wants to see what the parser would accept
- for a single participant, use `harness workshop participants add <name>` instead of a one-line stdin
- the resulting entries show in the admin People section; late additions can be made through either the CLI or the UI

Reference: `docs/adr/2026-04-19-name-first-identify-with-neon-auth.md`.

### `/workshop facilitator walk-in-policy`

Control whether participants whose names are not on the pre-pasted roster can still enter the room.

The CLI does not expose a dedicated `--allow-walk-ins` toggle. Route the facilitator to the dashboard:

```
/admin/instances/{instanceId}?section=access
```

The Access section contains a toggle that writes the instance's `allow_walk_ins` flag through the admin server action.

Consequences:
- `allow_walk_ins = true` (default) — unknown names see a walk-in input on the identify surface and can proceed to the password step
- `allow_walk_ins = false` — unknown names see "ask your facilitator to add you" and cannot proceed until the roster is updated

Invite-only hand-off pattern:
1. pre-paste the roster with `harness workshop participants import`
2. flip `allow_walk_ins` off in the dashboard Access section
3. late additions either add a CLI `participants add` or flip the toggle back on briefly

Reference: `docs/adr/2026-04-19-name-first-identify-with-neon-auth.md`.

### `/workshop facilitator reset-participant-password`

Help a participant who forgot their password during the session.

There is no CLI flag for this by design — the reset must stay in-room. Steps:

1. open `/admin/instances/{instanceId}?section=people` on the dashboard
2. find the participant's row and click the reset-password control
3. the dashboard returns a 3-word temporary password (e.g. `orbit-bridge-shift`). The server rotates the participant's password through `dashboard/lib/auth/neon-auth-proxy.ts` and revokes any existing sessions for that account
4. read the 3 words aloud to the participant
5. the participant enters the 3-word password on the identify surface and sets a new password of their choosing

Rules:
- do not ask the participant for their old password and do not repeat it back if they volunteer it; it is useless after reset and the skill must not be a password store
- the temporary password is single-shot — if the facilitator dismisses the dialog without reading it aloud, issue a new one
- the underlying implementation is `dashboard/lib/participant-auth.ts:resetParticipantPasswordAsAdmin`, invoked by the `/api/admin/participants/[id]/reset-password` route
- an email-based participant reset path exists as infrastructure (`sendParticipantPasswordResetEmail`) but no UI surfaces it — in-room reset is the documented doctrine

Reference: `docs/adr/2026-04-19-name-first-identify-with-neon-auth.md`.

### `/workshop facilitator grant <email> <role>`

Use the CLI-backed privileged request path. The skill should not handle auth bootstrap itself.

The API capability remains:

```http
POST {DASHBOARD_URL}/api/workshop/instances/{instanceId}/facilitators
Content-Type: application/json

{ "email": "...", "role": "operator" }
```

Requires `owner` role on the target instance. Returns the new grant info.

### `/workshop facilitator revoke <email>`

Call `GET /api/workshop/instances/{instanceId}/facilitators` first and find the grant by email.
Then call:

```http
DELETE {DASHBOARD_URL}/api/workshop/instances/{instanceId}/facilitators/{grantId}
```

Requires `owner` role.

### `/workshop facilitator create-instance`

The preferred path is a CLI command over the shared runtime API:

```bash
harness instance create sample-workshop-demo-orbit \
  --template-id blueprint-default \
  --content-lang en \
  --event-title "Sample Workshop Demo" \
  --city "Example City" \
  --date-range "June 15, 2026" \
  --venue-name "Example Campus North" \
  --room-name Orbit \
  --address-line "Example Avenue 123" \
  --location-details "12 participants + facilitator" \
  --facilitator-label Alex
```

The raw API reference remains diagnostic or architectural reference only:

```http
POST {DASHBOARD_URL}/api/workshop/instances
Content-Type: application/json

{
  "id": "sample-workshop-demo-orbit",
  "templateId": "blueprint-default",
  "contentLang": "en",
  "eventTitle": "Sample Workshop Demo",
  "city": "Example City",
  "dateRange": "June 15, 2026",
  "venueName": "Example Campus North",
  "roomName": "Orbit",
  "addressLine": "Example Avenue 123",
  "locationDetails": "12 participants + facilitator",
  "facilitatorLabel": "Alex"
}
```

Notes for the skill:
- prefer the CLI, not hand-written `fetch` scripts
- `id` must be a lowercase slug with letters, numbers, and hyphens
- `contentLang` controls workshop-content language for dashboard, presenter, and skill delivery; it is not the same as UI language
- when the skill calls create repeatedly with the same `id`, the route returns `created: false` and the existing instance record
- do not guess venue metadata in abbreviated form if the facilitator already knows it; send it during create

### `/workshop facilitator update-instance <instance-id>`

Preferred path:

```bash
harness instance update sample-workshop-demo-orbit \
  --content-lang en \
  --event-title "Sample Workshop Demo" \
  --date-range "June 15, 2026" \
  --venue-name "Example Campus North" \
  --room-name Orbit \
  --address-line "Example Avenue 123" \
  --location-details "12 participants + facilitator" \
  --facilitator-label Alex
```

Raw API reference:

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}
Content-Type: application/json

{
  "action": "update_metadata",
  "contentLang": "en",
  "eventTitle": "Sample Workshop Demo",
  "dateRange": "June 15, 2026",
  "venueName": "Example Campus North",
  "roomName": "Orbit",
  "addressLine": "Example Avenue 123",
  "locationDetails": "12 participants + facilitator",
  "facilitatorLabel": "Alex"
}
```

Rules:
- send only the fields you want to change
- do not use reset for an ordinary title, venue, or room correction
- if the route returns `400`, the payload is wrong; if it returns `404`, the instance does not exist
- use `--content-lang cs|en` when the facilitator intends to change the workshop delivery language for that instance
- if the facilitator already selected a local current instance, the CLI may omit `<instance-id>` and use the stored target

### `/workshop facilitator reset-instance <instance-id>`

Preferred path:

```bash
harness instance reset sample-workshop-demo-orbit --template-id blueprint-default
```

To reset from a local blueprint file without waiting for a deployment:

```bash
harness instance reset sample-workshop-demo-orbit --blueprint-file path/to/agenda.json
```

`--blueprint-file` reads any local agenda JSON (same shape as the public `workshop-blueprint/agenda.json`) and sends it directly to the server. Useful when workshop content has changed locally but the dashboard has not been redeployed yet. The bare `--from-local` shortcut was retired in the 2026-04-23 topbar-cleanup plan — the paired `dashboard/lib/generated/agenda-{lang}.json` runtime views no longer ship.

Raw API reference:

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}
Content-Type: application/json

{
  "action": "reset",
  "templateId": "blueprint-default"
}
```

To send a local blueprint in the API call, include the full agenda JSON as the `blueprint` field:

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}
Content-Type: application/json

{
  "action": "reset",
  "templateId": "blueprint-default",
  "blueprint": { ...contents of agenda-cs.json or agenda-en.json... }
}
```

Rules:
- use this when the goal is to re-import fresh blueprint-owned workshop content into an existing instance
- warn that reset archives current runtime state first and then clears live runtime state for the instance
- prefer `update-instance` for ordinary metadata corrections; reset is the high-impact operation
- if the facilitator does not specify a template, keep the current template unless there is a clear reason to switch
- if the facilitator already selected a local current instance, the CLI may omit `<instance-id>` and use the stored target
- when content changes are local and not yet deployed, suggest `--from-local` instead of waiting for a deployment
- the `--from-local` workflow is: edit `workshop-content/agenda.json` → run `bun scripts/content/generate-views.ts` → `harness instance reset <id> --from-local`

### `/workshop facilitator prepare`

Preferred path:

```bash
harness workshop prepare sample-workshop-demo-orbit
```

Raw API reference:

```http
POST {DASHBOARD_URL}/api/workshop
Content-Type: application/json

{ "action": "prepare", "instanceId": "sample-workshop-demo-orbit" }
```

This sets the instance to `prepared` state and verifies the event code.
If a local current instance is already selected, the CLI may omit `<instance-id>` and use the stored target.

### `/workshop facilitator remove-instance <instance-id>`

Preferred path:

```bash
harness instance remove sample-workshop-demo-orbit
```

Raw API reference:

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}
Content-Type: application/json

{ "action": "remove" }
```

Rules:
- remove remains an owner-only operation
- the skill should warn the facilitator that this is destructive removal from the active list, not routine metadata editing
- if the facilitator already selected a local current instance, the CLI may omit `<instance-id>` and use the stored target

### `/workshop facilitator agenda`

Use this when the facilitator needs to change instance-local agenda content through the coding-agent/CLI path. The dashboard control room no longer exposes agenda editing UI; `Run` is for operating the day, not authoring it.

Local agenda editing for a specific instance uses the per-instance route:

```http
GET {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
POST {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
DELETE {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
```

Examples:

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
Content-Type: application/json

{
  "action": "update",
  "itemId": "build-1",
  "title": "...",
  "time": "...",
  "goal": "...",
  "roomSummary": "...",
  "facilitatorPrompts": ["..."],
  "watchFors": ["..."],
  "checkpointQuestions": ["..."]
}
```

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
Content-Type: application/json

{ "action": "move", "itemId": "build-1", "direction": "up" }
```

```http
POST {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
Content-Type: application/json

{
  "title": "...",
  "time": "...",
  "goal": "...",
  "roomSummary": "...",
  "facilitatorPrompts": ["..."],
  "watchFors": ["..."],
  "checkpointQuestions": ["..."],
  "afterItemId": "build-1"
}
```

Rules:

- an agenda item is a facilitator pack, not just `title/time/description`
- preferred fields are `goal`, `roomSummary`, `facilitatorPrompts`, `watchFors`, and `checkpointQuestions`
- `description` remains a compatibility field for older surfaces; prefer `roomSummary` for room-facing summaries
- use canonical agenda ids such as `opening`, `talk`, `demo`, `build-1`, `intermezzo-1`, `rotation`, `build-2`, `intermezzo-2`, and `reveal`
- the skill should not invent custom workshop moment names outside this skeleton
- when the facilitator only needs to move the live workshop forward, prefer the dashboard `Run` surface instead of patching agenda data
- if a change should become reusable workshop method, edit the repo source and reset/reimport the instance rather than accumulating runtime-only drift

### `/workshop facilitator scenes`

Use this when the facilitator needs to manage presenter scenes through the coding-agent/CLI path. The dashboard still launches presenter output, but it no longer provides scene authoring UI.

Presenter scenes are agenda-linked, room-facing outputs for the facilitator and projector. The skill should be able to:

- list scenes for the whole instance or a specific agenda item
- create a new scene
- edit content, label, scene type, and CTA
- change the default scene for a given agenda item
- reorder scenes
- hide or re-enable a scene
- delete a local scene
- read and optionally edit `facilitatorNotes`, `sourceRefs`, and `blocks`

Rich-scene rules:

- keep presenter scenes agenda-linked; do not invent a separate slide-deck source of truth
- prefer one dominant voice and one main idea per scene
- for reusable visuals, prefer reviewed local blueprint assets and metadata over ad hoc remote image URLs
- runtime edits remain instance-local until a maintainer deliberately publishes them back into the repo
- when working in the source repo, use the maintainer playbook in `docs/presenter-rich-scene-authoring.md` for drafting, refinement, and publish-back

Per-instance route:

```http
GET {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
GET {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes?agendaItemId=talk
POST {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
DELETE {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
```

Examples:

```http
POST {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
Content-Type: application/json

{
  "agendaItemId": "talk",
  "label": "Prompt blob vs repo context",
  "sceneType": "demo",
  "intent": "walkthrough",
  "chromePreset": "agenda",
  "title": "Context first, then motion",
  "facilitatorNotes": [
    "Keep one story rather than a feature parade."
  ],
  "blocks": [
    {
      "id": "hero",
      "type": "hero",
      "title": "Context first, then motion",
      "body": "Show the difference between a prompt blob and a short map stored in the repo."
    },
    {
      "id": "questions",
      "type": "bullet-list",
      "title": "Point",
      "items": [
        "If it is not in the repo, it does not exist.",
        "Context is leverage, not cosmetics."
      ]
    }
  ],
  "ctaLabel": "Then switch to participant walkthrough"
}
```

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
Content-Type: application/json

{
  "action": "update",
  "agendaItemId": "talk",
  "sceneId": "scene-123",
  "label": "Updated demo flow",
  "sceneType": "demo",
  "intent": "walkthrough",
  "chromePreset": "agenda",
  "title": "One story, not a feature parade",
  "blocks": [
    {
      "id": "hero",
      "type": "hero",
      "title": "One story, not a feature parade",
      "body": "Do not show five working modes. Show one readable workflow."
    }
  ]
}
```

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
Content-Type: application/json

{ "action": "set_default", "agendaItemId": "talk", "sceneId": "talk-participant-view" }
```

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
Content-Type: application/json

{ "action": "move", "agendaItemId": "talk", "sceneId": "scene-123", "direction": "up" }
```

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
Content-Type: application/json

{ "action": "set_enabled", "agendaItemId": "talk", "sceneId": "scene-123", "enabled": false }
```

```http
DELETE {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
Content-Type: application/json

{ "agendaItemId": "talk", "sceneId": "scene-123" }
```

When the facilitator wants to change wording, flow, or participant walkthrough through a coding agent, prefer this route instead of manually describing UI edits.

During API work:

- unknown `agendaItemId` or `sceneId` returns `404`
- malformed payload still returns `400`
- the skill must report stale target ids explicitly rather than acting as if the change succeeded
- room-facing content belongs in `blocks`, facilitator instructions in `facilitatorNotes`
- `title/body` remain for compatibility, but the skill should prefer structured `blocks`
- when runtime agenda exists, the skill should read and cite its `goal`, `roomSummary`, `facilitatorPrompts`, `watchFors`, `checkpointQuestions`, `facilitatorNotes`, and `blocks`
- when runtime data is unavailable, fall back to the blueprint and facilitation docs in the repo and say so explicitly

### `/workshop facilitator archive`

Call:

```http
POST {DASHBOARD_URL}/api/workshop/archive
Content-Type: application/json

{ "reason": "manual", "notes": "..." }
```

## Environment

The agent needs to know the dashboard URL:
- `HARNESS_DASHBOARD_URL` - the production or preview dashboard URL
- if not set, use `https://harness-lab-dashboard.vercel.app`

## Notes

- facilitator commands are separate from participant commands
- `/workshop facilitator login` should steer the facilitator into `harness auth login`
- all other privileged commands use the stored CLI-backed session
- if the session expires, tell the facilitator to log in again
- never surface these commands to participants
