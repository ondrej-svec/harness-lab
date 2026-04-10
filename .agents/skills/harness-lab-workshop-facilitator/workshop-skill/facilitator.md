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
- if no local selection exists, `status` falls back to the deployment-default workshop context
- for exact machine parsing, prefer `harness --json workshop status`

### `/workshop facilitator current-instance`

Preferred path:

```bash
harness instance current
```

Show:
- the locally selected instance id when one exists
- whether the current target came from persisted selection or `HARNESS_WORKSHOP_INSTANCE_ID`
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
- after selection, `status` and `phase set` should target that instance instead of the deployment default
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
- use this when the facilitator needs one specific instance, not the deployment-default `workshop status`
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

### `/workshop facilitator grant <email> <role>`

Use the CLI-backed privileged request path. The skill should not handle auth bootstrap itself.

The API capability remains:

```http
POST {DASHBOARD_URL}/api/admin/facilitators
Content-Type: application/json

{ "email": "...", "role": "operator" }
```

Requires `owner` role. Returns the new grant info.

### `/workshop facilitator revoke <email>`

Call `GET /api/admin/facilitators` first and find the grant by email.
Then call:

```http
DELETE {DASHBOARD_URL}/api/admin/facilitators/{grantId}
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

To reset from local blueprint files without waiting for a deployment:

```bash
harness instance reset sample-workshop-demo-orbit --from-local
```

The `--from-local` flag reads the generated blueprint from `dashboard/lib/generated/agenda-{lang}.json` on disk and sends it directly to the server. This is useful when workshop content has changed locally (e.g. after editing `workshop-content/agenda.json` and running `bun scripts/content/generate-views.ts`) but the dashboard has not been redeployed yet.

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

### `/workshop facilitator scenes`

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
