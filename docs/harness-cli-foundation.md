# `harness` CLI Foundation

This document defines the deliberately small v1 scope for the facilitator-side `harness` CLI.

## Current Repo Status

Current implementation in this repo:

- lives in [`harness-cli/`](/Users/ondrejsvec/projects/Bobo/harness-lab/harness-cli)
- covers `auth login/logout/status` plus `workshop status/archive/phase set`
- targets the existing shared dashboard facilitator APIs
- is tested for browser/device auth, local-dev Basic Auth fallback, and cookie-backed Neon bootstrap fallback
- stores sessions in a local file under `HARNESS_CLI_HOME` or `~/.harness` by default
- supports macOS Keychain, Windows Credential Manager, or Linux Secret Service as explicit storage overrides
- exposes dashboard-side device auth routes plus a facilitator approval page at `/admin/device`

Current npm release posture:

- participant-facing npm publication is supported through an explicit release workflow
- routine development still happens from this repository
- broader live-runtime manual validation against a deployed dashboard remains part of the first-release checklist

## Why The CLI Exists

The facilitator skill and any other local tooling need a privileged auth path, but raw facilitator credentials and long-lived session state should not live inside arbitrary skill state.

The CLI creates a narrower trust boundary:

- browser or device-based facilitator login
- local session storage
- short operational commands over the same runtime APIs used by the dashboard

## V1 Scope

Required commands:

- `harness auth login`
- `harness auth logout`
- `harness auth status`
- `harness workshop status`
- `harness workshop archive`
- `harness workshop prepare`
- `harness workshop phase set <phase-id>`

The CLI may also expose a thin authenticated request wrapper for facilitator skills.

## V1 Non-Goals

- participant onboarding
- replacing dashboard UX
- storing reusable workshop blueprint content
- becoming a second API surface with different nouns
- automatic publish-back of runtime edits into the repo

## Auth Model

Preferred interactive path:

1. facilitator starts `harness auth login`
2. CLI opens browser or emits a device-code style flow
3. dashboard auth/backend completes facilitator identity verification
4. CLI stores the resulting session material in local session storage

The facilitator skill should call the CLI for privileged operations instead of storing raw auth/session material itself.

Current step-up posture:

- the existing CLI command set (`workshop status/archive/phase set`) may run on a valid brokered device session
- future higher-risk commands such as facilitator grant/revoke or destructive instance mutations should require a fresh browser approval window rather than silently reusing an older CLI session

## Session Storage Posture

Default storage backend:

- file-based storage under `HARNESS_CLI_HOME` or `~/.harness`

Optional storage backends:

- macOS Keychain
- Windows Credential Manager
- Linux Secret Service

The default should optimize for reliability and low-friction setup across facilitator machines. OS-native credential stores remain available through `HARNESS_SESSION_STORAGE` when a facilitator prefers them.

## Packaging Posture

V1 should optimize for cross-platform setup speed, not native-binary perfection.

Recommended posture:

- ship as a small Node-based CLI from this repository or its derived package
- support straightforward installation on macOS and Windows
- keep the command surface stable enough that the facilitator skill can depend on it

If facilitator setup friction remains high, native single-file packaging can be evaluated later without changing the control model.
