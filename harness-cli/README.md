# Harness CLI

Small Harness Lab CLI for facilitator auth, workshop operations, and portable workshop skill installation.

Current shipped scope:

- `harness version`
- `harness skill install`
- `harness auth login`
- `harness auth logout`
- `harness auth status`
- `harness workshop current-instance`
- `harness workshop select-instance`
- `harness workshop status`
- `harness workshop list-instances`
- `harness workshop show-instance`
- `harness workshop participant-access`
- `harness workshop create-instance`
- `harness workshop update-instance`
- `harness workshop reset-instance`
- `harness workshop prepare`
- `harness workshop remove-instance`
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

Install the portable workshop skill bundle into your current repo for Codex/pi discovery:

```bash
harness skill install
```

Optional explicit target:

```bash
harness skill install --target /path/to/team-repo
```

This creates `.agents/skills/harness-lab-workshop` in the target repo. The install does not require a local clone of the Harness Lab source repo.
Rerunning `harness skill install` refreshes the installed bundle when the packaged workshop content changed and reports clearly when the target is already current. Use `--force` only when you want a full reinstall.
After install, the CLI prints the first recommended agent commands, starting with `Codex: $workshop commands` and `pi: /skill:workshop`.
Treat the installed `workshop` skill as the first participant entrypoint. It should route setup, reference, and workshop guidance through live `contentLang` when available or the best reviewed bundled locale otherwise, instead of assuming the base authored Czech docs are always the right first stop.

Treat `.agents/skills/harness-lab-workshop` as generated workshop bundle content. The canonical authored source remains in this repository under `workshop-skill/`, `workshop-blueprint/`, selected `docs/`, and selected `materials/`.

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
harness workshop list-instances
harness workshop select-instance sample-workshop-demo-orbit
harness workshop current-instance
harness workshop status
harness workshop show-instance sample-workshop-demo-orbit
harness workshop participant-access
harness workshop participant-access --rotate
harness workshop participant-access --rotate --code orbit7-bridge4-shift2
harness workshop create-instance sample-workshop-demo-orbit --event-title "Sample Workshop Demo"
harness workshop update-instance --room-name Orbit
harness workshop reset-instance --template-id blueprint-default
harness workshop prepare
harness workshop remove-instance
harness workshop phase set rotation
harness workshop archive --notes "Manual archive"
harness workshop select-instance --clear
harness auth logout
```

Targeting model:

- `harness workshop list-instances` is the discovery entrypoint for facilitator-visible workshops
- `harness workshop select-instance <instance-id>` stores a local current target for later workshop commands
- `harness workshop current-instance` reports the stored target and resolves its current server state
- `harness workshop status` and `harness workshop phase set <phase-id>` use the selected instance when present, otherwise they fall back to deployment default behavior
- `harness workshop show-instance`, `update-instance`, `reset-instance`, `prepare`, and `remove-instance` accept an explicit `<instance-id>` but may also use the stored selection as a fallback
- `harness workshop participant-access` accepts an explicit `<instance-id>` but may also use the stored selection as a fallback
- `harness workshop select-instance --clear` removes the stored selection
- `HARNESS_WORKSHOP_INSTANCE_ID` remains an environment fallback when no local selection is stored

Machine-readable output:

- `harness --json ...` prints strict JSON output without headings
- prefer this for agent or script consumption instead of parsing human-oriented terminal copy

Facilitator lifecycle commands are intentionally CLI-first:

- skill invokes `harness`
- `harness` invokes the protected dashboard APIs
- the dashboard APIs remain the source of truth for authorization, validation, idempotency, and audit logging

Environment variables:

- `HARNESS_DASHBOARD_URL`
- `HARNESS_AUTH_MODE`
- `HARNESS_ADMIN_USERNAME`
- `HARNESS_ADMIN_PASSWORD`
- `HARNESS_FACILITATOR_EMAIL`
- `HARNESS_FACILITATOR_PASSWORD`
- `HARNESS_CLI_HOME`
- `HARNESS_SESSION_STORAGE` (`file`, `keychain`, `credential-manager`, or `secret-service`)

## Release Gate

Public npm publication is controlled by the release gate in
[docs/harness-cli-publication-gate.md](../docs/harness-cli-publication-gate.md).
Normal development should still happen from this repository; npm is the participant-facing distribution path, not a substitute for repo-local development.
