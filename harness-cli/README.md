# Harness CLI

Small Harness Lab CLI for facilitator auth, workshop operations, and repo-local skill installation.

Current shipped scope:

- `harness version`
- `harness skill install`
- `harness auth login`
- `harness auth logout`
- `harness auth status`
- `harness workshop status`
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

Install the repo-local workshop skill bundle for Codex/OpenCode discovery:

```bash
harness skill install
```

This creates `.agents/skills/harness-lab-workshop` in the current Harness Lab repo checkout.
After install, the CLI prints the first recommended agent commands, starting with `/workshop reference`.

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
harness workshop status
harness workshop phase set rotation
harness workshop archive --notes "Manual archive"
harness auth logout
```

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
[docs/harness-cli-publication-gate.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/harness-cli-publication-gate.md).
Normal development should still happen from this repository; npm is the participant-facing distribution path, not a substitute for repo-local development.
