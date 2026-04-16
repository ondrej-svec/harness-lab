# Workshop Skill Install

## Recommended distribution

The default Harness Lab recommendation is to install the skill via `@harness-lab/cli` into your current working repo.

Why:
- the skill is still repo-backed content, but it should not depend on you having a clone of this public repo available
- the same files serve as both fallback content and documentation
- a participant should have a working workshop companion directly inside their team repo

## Recommended participant flow

1. open your team or workshop repo
2. install the Harness CLI:

```bash
npm install -g @harness-lab/cli
```

3. install the workshop skill into the current repo:

```bash
harness skill install
```

Optionally, point the install at a different path:

```bash
harness skill install --target /path/to/repo
```

4. open your agent tool on top of that repo
5. verify that at minimum these work:
   - Codex: `$workshop commands`, `$workshop reference`, `$workshop brief`
   - pi: `/skill:workshop`, then ask for `commands`, `reference`, or `brief`

After a successful install, `harness skill install` prints the recommended first steps so the participant knows they can start either in Codex via `$workshop ...` or in pi via `/skill:workshop`.
If you re-run the command later, the CLI checks whether the bundle in the target repo is up to date. If it is stale, it refreshes it in place. Use `--force` only when you want to force a full reinstall.

## What to expect next

`harness skill install` installs the guaranteed workshop bundle. It does not install additional workflow skills or external toolkits for you.

Recommended next steps:

1. run the `workshop` skill
2. open `commands`, `reference`, and `brief`
3. fill in `AGENTS.md`
4. as needed, use `brainstorm`, `$plan`, `$work`, `$review`, or `$compound` if they are available in your agent setup
5. when you want participant materials without hunting in GitHub, use `workshop resources`, `workshop gallery`, and `workshop follow-up`

## Note

`harness skill install` creates a project bundle at `.agents/skills/workshop` so the skill is discoverable inside the repo without an extra distribution layer.
Treat that folder as a generated workshop bundle, not as the primary authoring source.

Participant login is not required for the skill to exist. `workshop login` is a later step to unlock the live event context.
