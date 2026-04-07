# Harness CLI Release Runbook

This runbook describes the intended public npm release path for `@harness-lab/cli`.

## Release Model

- Source of truth: this repository
- Participant-facing install path: `npm install -g @harness-lab/cli`
- Development path: repo-local install from `harness-cli/`
- Publication trigger: published GitHub Release with tag `harness-cli-v<package-version>`
- Dry-run trigger: manual `Harness CLI Publish` workflow dispatch

## Release Steps

1. Update `harness-cli/package.json` to the intended release version.
2. Confirm the CLI release smoke posture still passes locally or in CI:
   - `cd harness-cli && npm test`
   - `cd harness-cli && npm pack`
3. Push the version change to `main`.
4. Create a GitHub Release tagged `harness-cli-v<package-version>`.
5. Let the `Harness CLI Publish` workflow verify and publish the package.
6. Verify the registry state:
   - `npm view @harness-lab/cli version`
   - `npm install -g @harness-lab/cli`
   - `harness --help`
7. Run one real facilitator auth/status smoke check against the intended dashboard environment.

## Dry Run

To dry-run the publish workflow without publishing to npm:

1. Open the `Harness CLI Publish` workflow in GitHub Actions.
2. Use `Run workflow`.
3. Optionally pass `release_tag=harness-cli-v<package-version>`.
4. Confirm the workflow completes the package verification and tarball smoke steps.

## Rollback

If a published version is bad:

1. Deprecate the version:
   - `npm deprecate @harness-lab/cli@<version> "<message>"`
2. Switch any urgent instructions back to repo-local installation if npm distribution must pause temporarily.
3. Publish a corrective patch release through the same release flow.
4. Capture the incident and the mitigation before the next release.
