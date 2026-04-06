# Workshop Instance Runbook

## Instance Configuration Model

Default company-scale model:

- one dashboard codebase
- one deployment
- many private workshop instances

For four hackathons under one company, configure each event as a separate private instance record with:

- `instance_id`
- `template_id`
- real date
- venue and room
- participant event code and expiry
- facilitator auth config
- private workshop state and session storage

## Lifecycle

### 1. Create

- create a private workshop instance record
- choose the public template it starts from
- attach real metadata outside the public repo:
  - date
  - venue
  - room
  - participant roster if needed
  - facilitator notes

### 2. Prepare

- verify dashboard deployment
- verify admin protection
- issue or rotate the shared participant event code
- verify the participant event code expiry window
- verify workshop skill files
- verify the chosen instance starts in a clean state
- verify participant access path and QR code

### 3. Run

During the workshop, facilitator uses the control plane to:
- move agenda phase
- register teams and repos
- capture sprint updates
- update checkpoints
- reveal the continuation window at the right time
- review monitoring snapshots
- confirm the participant event code still works when onboarding late arrivals
- rotate the event code if it leaks or needs emergency reset

### 4. Reset

After a workshop:
- archive or export the live instance state
- revoke active participant sessions
- reset the next workshop from a template or a new instance record
- confirm no live team data remains in the active public-facing view

### 5. Archive

- store the final workshop-state snapshot in private storage
- export any closing notes or retrospective inputs
- keep public repo improvements separate from private event records

## Rule

Do not create a new public repo or a new Vercel project per workshop unless there is a very strong operational reason.

Default model:
- one public template repo
- one dashboard codebase
- many private workshop instances

## Event Access Rules

- one active participant event code per workshop instance
- participant event code is separate from facilitator auth
- participant sessions are short-lived and can be renewed by re-entering the same event code
- the participant dashboard stays public until private context is requested
- `workshop-skill` should prefer `/workshop login` as the explicit auth path
