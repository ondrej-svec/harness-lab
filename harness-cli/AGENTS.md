# harness-cli/

## Mission

Participant-facing CLI that installs the workshop skill and wraps privileged facilitator operations (auth, workshop lifecycle). The boundary rule: **the CLI holds the credentials, the skill never does.**

## Read First

Before editing under `harness-cli/`:

1. [`../docs/harness-cli-foundation.md`](../docs/harness-cli-foundation.md) — auth model, session storage, CLI↔skill boundary.
2. [`../docs/resource-packaging-model.md`](../docs/resource-packaging-model.md) — portable bundle shape, sync script contract.
3. [`CHANGELOG.md`](CHANGELOG.md) for recent behavior changes.
4. The current plan in [`../docs/plans/`](../docs/plans/) if the task is in flight.

## Task Routing

- New privileged operation → add a CLI command that wraps it; never hand the skill raw credentials or session material.
- Bundle contents change → edit sources under `workshop-skill/`, `content/`, `workshop-blueprint/`, then `node harness-cli/scripts/sync-workshop-bundle.mjs` to resync. The bundle under `assets/workshop-bundle/` is a generated mirror — do not hand-edit.
- Auth flow change → coordinate with `docs/harness-cli-foundation.md` and the two load-bearing auth ADRs: `docs/adr/2026-04-19-name-first-identify-with-neon-auth.md` (canonical — participant identify: event code → name pick → password, dashboard-side control-plane) and `docs/adr/2026-04-06-neon-auth-for-facilitator-identity.md` (facilitator identity via Neon Auth, still load-bearing).
- Installer behavior change → update `src/skill-install.js` and mirror the change in `src/run-cli.js` handleSkillInstall; add a regression test under `test/`.

## Verification Boundary

- `cd harness-cli && npm test` runs `verify:workshop-bundle` + `node --test` over `test/*.test.js`. Both must pass.
- Bundle drift between authored sources and `assets/workshop-bundle/` is a hard fail, not a warning. Resync in the same slice as any source edit.
- Privileged-op tests live in `test/run-cli.test.js` and must assert credential-boundary behavior, not just happy-path exit codes.

## Done Criteria

1. `npm test` passes.
2. If bundle sources changed, `npm run verify:workshop-bundle` confirms the packaged mirror matches.
3. No raw credentials leaked into skill state or the packaged bundle.
4. CHANGELOG.md updated if the change affects published `@harness-lab/cli` behavior.
