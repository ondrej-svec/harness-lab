# Harness CLI

[![npm](https://img.shields.io/npm/v/@harness-lab/cli)](https://www.npmjs.com/package/@harness-lab/cli)
[![CI](https://github.com/ondrej-svec/harness-lab/actions/workflows/dashboard-ci.yml/badge.svg?branch=main)](https://github.com/ondrej-svec/harness-lab/actions/workflows/dashboard-ci.yml)
[![tests](https://img.shields.io/badge/tests-60_passing-brightgreen)](#)
[![SAST](https://img.shields.io/badge/SAST-Semgrep-blue)](#)
[![secrets](https://img.shields.io/badge/secrets-Gitleaks-blue)](#)
[![audit](https://img.shields.io/badge/npm_audit-high--level-green)](#)
[![codecov](https://codecov.io/gh/ondrej-svec/harness-lab/graph/badge.svg?flag=harness-cli)](https://codecov.io/gh/ondrej-svec/harness-lab)
[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen)](../LICENSE)

Small Harness Lab CLI for facilitator auth, workshop operations, and portable workshop skill installation.

Current shipped scope:

- `harness version`
- `harness skill install`
- `harness auth login`
- `harness auth logout`
- `harness auth status`
- `harness instance current`
- `harness instance select`
- `harness workshop status`
- `harness instance list`
- `harness instance show`
- `harness workshop participant-access`
- `harness instance create`
- `harness instance update`
- `harness instance reset`
- `harness instance sync-local`
- `harness workshop prepare`
- `harness instance remove`
- `harness workshop archive`
- `harness workshop phase set <phase-id>`

Current implementation posture:

- targets the existing shared dashboard facilitator APIs
- defaults to a browser/device approval flow backed by dashboard-side facilitator broker sessions
- keeps `--auth basic` and `--auth neon` as explicit local-dev/bootstrap fallback modes
- stores session material in a local file under `HARNESS_CLI_HOME` or `~/.harness` by default
- supports macOS Keychain, Windows Credential Manager, and Linux Secret Service as explicit `HARNESS_SESSION_STORAGE` overrides
- supports brokered facilitator commands over the same workshop APIs used by the dashboard

## Usage

## Install

Participant-facing default install:

```bash
npm install -g @harness-lab/cli
```

Supported runtime:

- Node `22` or newer
- npm `10` or newer recommended

Verify the binary:

```bash
harness --version
harness --help
```

Development or fallback install from this repository:

```bash
npm install -g ./harness-cli
```

or:

```bash
cd harness-cli
npm link
```

Verify the local install:

```bash
harness version
harness --help
```

## Participant Quick Start

If you are a workshop participant, this is the only command you need:

```bash
harness skill install
```

This installs the workshop skill into your current repo. After install, open Codex or Claude Code in the same repo and run `$workshop commands` to get started. You do not need any of the facilitator commands below.

Optional explicit target:

```bash
harness skill install --target /path/to/team-repo
```

This creates `.agents/skills/workshop` in the target repo. The install does not require a local clone of the Harness Lab source repo.
Rerunning `harness skill install` refreshes the installed bundle when the packaged workshop content changed and reports clearly when the target is already current. Use `--force` only when you want a full reinstall.
After install, the CLI prints the first recommended agent commands, starting with `Codex: $workshop commands` and `Claude Code: /skill:workshop`.
Treat the installed `workshop` skill as the first participant entrypoint. It should route setup, reference, and workshop guidance through live `contentLang` when available or the best reviewed bundled locale otherwise, instead of assuming the base authored Czech docs are always the right first stop.

Treat `.agents/skills/workshop` as generated workshop bundle content. The canonical authored source remains in this repository under `workshop-skill/`, `workshop-blueprint/`, selected `docs/`, and selected `materials/`.

### After install — what a participant sees

Installing the skill does not log anyone in. When the facilitator starts the room, a participant opens the dashboard at `/participant` and walks through three steps:

1. **Event code** — the facilitator reads the shared code aloud; the participant redeems it to enter the room.
2. **Name pick** — the participant sees a picker scoped to the roster the facilitator pre-pasted (or a walk-in path when `allow_walk_ins` is on). Prefix-matching; no free-text guessing.
3. **Password** — first time through, the participant sets a password. On return, they enter the same password. Identity persists across browser close because each participant has a real Neon Auth account.

The CLI is not in this flow — the identify surface is the dashboard. Reference: [`docs/adr/2026-04-19-name-first-identify-with-neon-auth.md`](../docs/adr/2026-04-19-name-first-identify-with-neon-auth.md).

---

## Facilitator Commands

Everything below this line is for facilitators managing workshop instances.

Default device/browser login:

```bash
harness auth login \
  --dashboard-url https://harness-lab-dashboard.vercel.app
```

The CLI prints a verification URL plus user code, optionally opens the browser when supported, then polls until the facilitator approves the request on `/admin/device`.

Explicit local file-mode / Basic Auth fallback:

```bash
harness auth login \
  --auth basic \
  --dashboard-url http://localhost:3000 \
  --username facilitator \
  --password secret
```

Explicit Neon email/password bootstrap fallback:

```bash
harness auth login \
  --auth neon \
  --dashboard-url https://harness-lab-dashboard.vercel.app \
  --email facilitator@example.com
```

Workshop commands:

```bash
harness auth status
harness skill install
harness instance list
harness instance select sample-workshop-demo-orbit
harness instance current
harness workshop status
harness instance show sample-workshop-demo-orbit
harness workshop participant-access
harness workshop participant-access --rotate
harness workshop participant-access --rotate --code orbit7-bridge4-shift2
harness instance create sample-workshop-demo-orbit --event-title "Sample Workshop Demo"
harness instance update --room-name Orbit
harness instance reset --template-id blueprint-default
harness instance reset --blueprint-file .local/workshop-packs/no-repo-switching-cs.json
harness instance sync-local --blueprint-file .local/workshop-packs/no-repo-switching-cs.json --phase-ids opening,intermezzo-1,intermezzo-2
harness workshop prepare
harness instance remove
harness workshop phase set rotation
harness workshop archive --notes "Manual archive"
harness workshop reference list
harness workshop reference import --file ./refs.json
harness workshop reference reset
harness workshop reference add-item defaults --id brno-kit --kind external --href https://example.com/brno-kit --label "Brno kit" --description "Per-event addition"
harness workshop reference set-item defaults participant-resource-kit --kind repo-blob --path materials/participant-resource-kit-brno.md --label "Brno resource kit" --description "Updated for this cohort"
harness workshop reference remove-item defaults harness-cli
harness workshop reference show-body participant-resource-kit
harness workshop reference set-body participant-resource-kit --file ./brno-kit.md
harness workshop reference reset-body participant-resource-kit
harness workshop copy show
harness workshop copy set postWorkshop.title "Brno, thanks for the day."
harness workshop copy import --file ./brno-copy.json
harness workshop copy reset
harness workshop artifact upload --file ./case-study.html --label "16-day harness case study"
harness workshop artifact list
harness workshop artifact attach <artifactId> --group defaults
harness workshop artifact detach <artifactId>
harness workshop artifact remove <artifactId>
harness instance select --clear
harness auth logout
```

Reference catalog override:

- `harness workshop reference list` prints the effective override (or null when the instance uses the compiled default). Compiled defaults live in `dashboard/lib/generated/reference-{en,cs}.json`, generated from the bilingual source at `workshop-content/reference.json`.
- `harness workshop reference import --file <path>` replaces the catalog verbatim. The file may be a bare `GeneratedReferenceGroup[]` array or the generated-view shape `{ schemaVersion, groups }` (export a locale default, tweak, push).
- `harness workshop reference reset` clears the override so participants see the compiled default again on next reload.
- `harness workshop reference add-item|set-item|remove-item` edit surgically: the CLI fetches the current effective catalog (override or compiled default), applies the edit, and writes the full catalog back. Item `--kind` is one of `external` (needs `--href`), `repo-blob` or `repo-tree` (both need `--path`), `repo-root` (no extra flags), or `hosted` (body is managed through `set-body`, not here).

Hosted reference bodies (dashboard-rendered Markdown for items with `kind: hosted`):

- `harness workshop reference show-body <itemId>` prints the effective body, reporting `source=override` or `source=default` so you can tell whether an instance-specific edit is active.
- `harness workshop reference set-body <itemId> --file <path.md>` pushes a custom Markdown body for this instance. Bodies are sanitised at render (no `<script>`, no `javascript:` hrefs, no `<iframe>`), so facilitator input is safe to render.
- `harness workshop reference reset-body <itemId>` clears the override — the compiled-default body (inlined at build from `workshop-content/reference.json`) renders again.

Cohort-scoped artifacts (HTML/PDF/image uploads for this workshop instance, served behind participant auth):

- `harness workshop artifact upload --file <path> --label "..." [--description "..."]` uploads a file to Vercel Blob (private mode). Content-type is guessed from the filename extension (`.html`, `.pdf`, `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`); override with `--content-type MIME`. Max 25 MiB by default (`ARTIFACT_MAX_BYTES` on the server overrides).
- `harness workshop artifact list` shows every artifact uploaded to the instance with id, label, filename, size, and upload timestamp.
- `harness workshop artifact remove <artifactId>` deletes the row and the underlying blob. Cross-instance removal returns 404 — the CLI refuses to touch another cohort's artifacts.
- `harness workshop artifact attach <artifactId> --group <groupId> [--label TEXT] [--description TEXT]` adds a `kind: "artifact"` reference item to the group. Label and description default to the uploaded artifact's metadata; flags override per-cohort. Re-running replaces the existing attachment (idempotent).
- `harness workshop artifact detach <artifactId>` removes every reference item that targets this artifact. Attaching an artifact from another cohort is rejected at PATCH with a 400.
- Artifacts do **not** appear in `workshop-content/reference.json`. They live only in the instance's `reference_groups` override. Participants see them in the same reference card layout as other items, with a download icon next to the open affordance.

Participant copy overrides (narrow whitelist — currently post-workshop welcome / feedback / reference bodies):

- `harness workshop copy show` prints the active override (or null when the compiled defaults are live).
- `harness workshop copy set <key.path> <value>` edits one key. Allowed keys: `postWorkshop.title`, `postWorkshop.body`, `postWorkshop.feedbackBody`, `postWorkshop.referenceBody`. Missing keys fall through to the compiled default at render time.
- `harness workshop copy import --file <path.json>` bulk-pushes a copy object (either bare or wrapped in `{ participantCopy: {...} }`).
- `harness workshop copy reset` clears all overrides.

Targeting model:

- `harness instance list` is the discovery entrypoint for facilitator-visible workshops
- `harness instance select <instance-id>` stores a local current target for later workshop commands
- `harness instance current` reports the stored target and resolves its current server state
- `harness workshop status`, `harness workshop phase set <phase-id>`, and `harness workshop archive` require a selected instance and hard-error with "No instance selected" when none is pinned
- `harness instance show`, `update`, `reset`, `prepare`, and `remove` accept an explicit `<instance-id>` but may also use the stored selection as a fallback
- `harness workshop participant-access` accepts an explicit `<instance-id>` but may also use the stored selection as a fallback
- `harness instance select --clear` removes the stored selection
- No environment-variable fallback. Pin an instance explicitly with `instance select`.

Machine-readable output:

- `harness --json ...` prints strict JSON output without headings
- prefer this for agent or script consumption instead of parsing human-oriented terminal copy

Facilitator lifecycle commands are intentionally CLI-first:

- skill invokes `harness`
- `harness` invokes the protected dashboard APIs
- the dashboard APIs remain the source of truth for authorization, validation, idempotency, and audit logging

Local blueprint override:

- `harness instance reset --from-local` reads the generated local blueprint from `dashboard/lib/generated/agenda-{lang}.json`
- `harness instance reset --blueprint-file <path>` reads an explicit local agenda pack JSON file and sends it to the reset API directly
- use `--blueprint-file` for one-off workshop variants that should stay local and git-ignored rather than mutating the tracked blueprint
- `harness instance sync-local --blueprint-file <path>` patches matching agenda items and presenter scenes through the protected `agenda` / `scenes` APIs instead of relying on reset semantics
- use `sync-local` when you want an existing instance to pick up local-only content edits without resetting the whole instance

Environment variables:

- `HARNESS_DASHBOARD_URL`
- `HARNESS_AUTH_MODE`
- `HARNESS_ADMIN_USERNAME`
- `HARNESS_ADMIN_PASSWORD`
- `HARNESS_FACILITATOR_EMAIL`
- `HARNESS_FACILITATOR_PASSWORD`
- `HARNESS_CLI_HOME`
- `HARNESS_SESSION_STORAGE` (`file`, `keychain`, `credential-manager`, or `secret-service`)

Not a CLI input: `NEON_API_KEY`. It is a dashboard-side control-plane credential used server-side by `dashboard/lib/auth/admin-create-user.ts` to provision participant accounts during identify. Do not set it for the CLI — it belongs in the dashboard deployment environment only.

## Release Gate

Public npm publication is controlled by the release gate in
[docs/harness-cli-publication-gate.md](../docs/harness-cli-publication-gate.md).
Normal development should still happen from this repository; npm is the participant-facing distribution path, not a substitute for repo-local development.
