# Harness CLI

Small facilitator-facing CLI for Harness Lab.

Current shipped scope:

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
- stores session material in macOS Keychain, Windows Credential Manager, or Linux Secret Service by default
- only uses file storage under `HARNESS_CLI_HOME` or `~/.harness` when `HARNESS_SESSION_STORAGE=file` is set explicitly
- supports brokered facilitator commands over the same workshop APIs used by the dashboard

## Usage

## Install

Participant-facing default install:

```bash
npm install -g @harness-lab/cli
```

Verify the binary:

```bash
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
- `HARNESS_SESSION_STORAGE` (`keychain`, `credential-manager`, `secret-service`, or `file`)

## Release Gate

Public npm publication is controlled by the release gate in
[docs/harness-cli-publication-gate.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/harness-cli-publication-gate.md).
Normal development should still happen from this repository; npm is the participant-facing distribution path, not a substitute for repo-local development.
