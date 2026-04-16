# Participant & Team CLI Surface — 2026-04-16

Reviewer-facing preview for the CLI commands introduced by `docs/plans/2026-04-16-feat-participant-management-and-team-formation-plan.md`. Mirrors the API surface so every facilitator action is available both in the admin UI and via `harness` on the terminal. Not runtime truth.

## Principle — agent-native parity

Every roster and team-formation operation in the UI is also a single CLI command. Reasons:

1. **Dogfooding the agent-native thesis.** harness-lab is a workshop about making agents effective; the facilitator's own ops should be as scriptable as the participant's are.
2. **Batch workflows.** Importing 50 people from a corporate roster CSV is faster as `harness workshop participants import --file roster.csv` than through the paste panel.
3. **Automation hooks.** A facilitator running multiple workshops a year can pipe their attendee-export tool directly into the CLI.
4. **Demo moment.** At the hackathon, provisioning the entire event from a terminal ("watch me set up 15 people into 3 cross-level teams in 30 seconds") is a genuine harness-lab moment.

## Namespace

New commands slot into the existing `harness workshop *` surface established by the current CLI. They remain **facilitator-gated** via the existing device-auth session (`harness auth login` → Better-Auth / Neon Auth), **not** participant-gated. Participant sessions are untouched.

Two command groups:

- `harness workshop participants …` — pool operations (add, edit, list, import, remove, export)
- `harness workshop team …` — team-membership operations (assign, move, unassign, randomize)

Both inherit `--json` output, the `--instance <id>` override that already exists on other workshop commands, and the trusted-origin guard.

## Commands

### Pool operations

#### `harness workshop participants list`

```
harness workshop participants list [--unassigned] [--team <id>] [--instance <id>] [--json]
```

**Summary:** prints the pool for the current (or specified) instance. With `--unassigned`, only rows without a team. With `--team <id>`, only rows on that team.

**JSON shape:**

```json
{
  "ok": true,
  "participants": [
    {
      "id": "p_01HZ...",
      "displayName": "Ada Lovelace",
      "email": null,
      "emailOptIn": false,
      "tag": "senior",
      "teamId": null,
      "archivedAt": null
    }
  ]
}
```

**Human output:** table with columns `id`, `name`, `tag`, `email?`, `consent?`, `team?`.

#### `harness workshop participants add`

```
harness workshop participants add <name> [--email <email>] [--tag <tag>] [--instance <id>] [--json]
```

Adds a single participant. Idempotent: case-insensitive duplicate `displayName` returns `409 duplicate` unless `--force-duplicate` is passed.

**Notes:**
- `--email` stores the address; `emailOptIn` stays false until flipped explicitly.
- Use `participants import` for bulk — this one is for walk-ins entered by the facilitator.

#### `harness workshop participants import`

```
harness workshop participants import (--file <path> | --stdin) [--format auto|csv|tsv|simple] [--dry-run] [--instance <id>] [--json]
```

**Summary:** bulk import with the same smart-parse rules as the admin UI paste panel. `--format auto` detects separator (comma, tab, semicolon) and column layout (`Name` / `Name, Email` / `Name, Email, Tag`). Header row detected heuristically.

**Examples:**

```bash
# Import from CSV
harness workshop participants import --file ./roster.csv

# Pipe from anywhere
cat attendees.tsv | harness workshop participants import --stdin --format tsv

# Inline paste via heredoc
harness workshop participants import --stdin <<'EOF'
Ada Lovelace
Linus Torvalds, linus@example.com
Grace Hopper, grace@example.com, senior
EOF

# Preview without writing
harness workshop participants import --file ./roster.csv --dry-run --json
```

**Behavior identical to API `POST /api/admin/participants`:**
- Trim + dedupe client-side before posting (by displayName, case-insensitive)
- Invalid emails skip the row, other rows proceed
- `emailOptIn` always false on import
- Returns per-entry `created` / `skipped` arrays

#### `harness workshop participants update`

```
harness workshop participants update <participantId> [--name <name>] [--email <email|null>] [--tag <tag|null>] [--consent on|off] [--instance <id>] [--json]
```

Update fields. Only provided flags change. Pass `null` for `--email` or `--tag` to clear. `--consent on` sets `emailOptIn=true`; requires `email` to be non-null (returns `409 email_opt_in_without_email` otherwise).

#### `harness workshop participants remove`

```
harness workshop participants remove <participantId> [--instance <id>] [--json]
```

Soft-delete. Sets `archived_at`, unassigns from team, nulls `session.participant_id` for any bound session.

#### `harness workshop participants export-emails`

```
harness workshop participants export-emails [--file <path>] [--format csv|json] [--instance <id>] [--json]
```

POST-EVENT (Phase 7). Outputs the opted-in subset only. Default `--format csv` with columns `displayName, email`. The facilitator uses this to drive the 14-day and 30-day follow-up send from their own mail tool.

### Team-membership operations

#### `harness workshop team assign`

```
harness workshop team assign <participantId> <teamId> [--instance <id>] [--json]
```

Assign-or-move. Idempotent. If the participant is already on another team, moves them; the response includes `movedFrom`. Backed by `PUT /api/admin/team-members` (assign-or-move).

#### `harness workshop team unassign`

```
harness workshop team unassign <participantId> [--instance <id>] [--json]
```

Remove from current team. Returns `ok: true` even if the participant was already unassigned (idempotent).

#### `harness workshop team randomize`

```
harness workshop team randomize --teams <N> [--strategy cross-level|random] [--tag-field <name>] [--create-missing] [--preview] [--commit-token <token>] [--instance <id>] [--json]
```

**Two-step safety model:**
1. Run with `--preview` — returns proposed distribution with per-team tag counts, plus a short-lived `commit_token`.
2. Run with `--commit-token <token>` — commits the previewed distribution exactly. Token expires after 60 seconds.

Running without either flag computes, prints the preview, prompts `Commit this distribution? [y/N]`, and commits on `y`. `--json` mode requires the explicit two-step flow (no stdin prompts in scripted contexts).

**Example:**

```bash
$ harness workshop team randomize --teams 3 --strategy cross-level
Preview — 15 people into 3 teams (cross-level):
  Tým Alfa (5): senior 2, mid 2, junior 1
  Tým Bravo (5): senior 1, mid 2, junior 1, untagged 1
  Tým Charlie (5): senior 2, mid 1, junior 2
Commit this distribution? [y/N] y
Committed. 15 assignments updated.
```

## Skill surface (facilitator skill)

The existing facilitator skill (`SKILL-facilitator.md`) delegates to `harness --json`. Add these command-surface entries so an agent invoking `$workshop …` reaches the right CLI call:

- `$workshop participants list` → `harness workshop participants list --json`
- `$workshop participants add "Ada Lovelace" --email ada@example.com --tag senior`
- `$workshop participants import --file roster.csv`
- `$workshop participants update p_01HZ... --consent on`
- `$workshop participants remove p_01HZ...`
- `$workshop assign p_01HZ... t1`  *(shorthand for `harness workshop team assign`)*
- `$workshop unassign p_01HZ...`
- `$workshop randomize --teams 3 --strategy cross-level`

The participant skill (`SKILL.md`) gets nothing new — these are facilitator-only. Participant skill stays focused on `brief`, `challenges`, `team`, `status`.

## Parity matrix

Every UI action maps 1:1 to a CLI command. This table is the review surface — if a row is missing a CLI command, the UI action needs deferring or the CLI needs a command added.

| UI action | CLI command | API endpoint |
|---|---|---|
| Paste roster panel → commit | `workshop participants import --stdin` | `POST /api/admin/participants` |
| Add single walk-in | `workshop participants add <name>` | `POST /api/admin/participants` |
| Inline-edit name / email / tag | `workshop participants update <id> --name|--email|--tag` | `PATCH /api/admin/participants/:id` |
| Flip consent toggle | `workshop participants update <id> --consent on|off` | `PATCH /api/admin/participants/:id` |
| Remove from pool (trash icon) | `workshop participants remove <id>` | `DELETE /api/admin/participants/:id` |
| Click "Assign…" → pick team | `workshop team assign <pid> <tid>` | `PUT /api/admin/team-members` |
| Drag chip between teams | `workshop team assign <pid> <tid>` (same call) | `PUT /api/admin/team-members` |
| Drag chip off a team (to pool) | `workshop team unassign <pid>` | `DELETE /api/admin/team-members` |
| Randomize button → preview → commit | `workshop team randomize --teams N --preview` then `--commit-token` | `POST /api/admin/team-formation/randomize` |
| Post-event email export | `workshop participants export-emails --file out.csv` | `POST /api/admin/participants/export-emails` |

## Error handling

CLI commands map API error codes to exit codes:

| Exit | Meaning |
|---|---|
| 0 | Success |
| 1 | Generic failure |
| 2 | Invalid usage (bad flags, missing args) |
| 3 | Not authenticated (run `harness auth login`) |
| 4 | Authorized but forbidden (role lacks the needed grant) |
| 5 | Not found (instance, participant, team) |
| 6 | Conflict (duplicate, already assigned, opt-in-without-email) |
| 7 | Rate limited |

`--json` mode always exits 0 for anything that produces structured output; check `.ok` in the JSON.

## Testing notes

Pattern: mirror the existing `createFetchStub` test harness used by the 2026-04-10 CLI refactor plan. Each new command gets:

- A happy-path test with stubbed API
- A 401 (not logged in) test
- A 400 (invalid input) test
- For `import`: a file-mode and a stdin-mode test with mixed valid/invalid rows
- For `randomize`: a preview + commit-token round-trip test

## Coordination with 2026-04-10 CLI refactor plan

The CLI refactor plan (in-progress) restructures into three scopes: `auth`, `workshop`, `instance`. These new commands all sit under `workshop`, which aligns with that plan's decision. No naming conflicts expected, but the implementation ordering matters:

- If 2026-04-10 lands first: add these commands as new handlers next to `workshop team set-name`, etc.
- If this plan lands first: ship under the current namespace; adjust during the 2026-04-10 landing if needed.

Task 2.13 in the plan is the explicit coordination check.

## Demo-day script (hackathon 2026-04-23)

End-to-end demo from terminal, for the facilitator (Ondrej) to run live if the CLI path is stable by then:

```bash
# Provision the event
harness instance create --slug studio-a-04-23 --blueprint hackathon-day
harness workshop participant-access --rotate

# Import attendees
harness workshop participants import --file ./attendees-2026-04-23.csv
harness workshop participants list --json | jq '.participants | length'

# Team the room
harness workshop team randomize --teams 4 --strategy cross-level --preview --json > /tmp/plan.json
cat /tmp/plan.json | jq '.distribution'
harness workshop team randomize --teams 4 --strategy cross-level --commit-token "$(jq -r .commit_token /tmp/plan.json)"

# Start the day
harness workshop phase set opening
```

If every line above works on the day, the CLI parity is real.

## Sign-off shape

This sketch is approved if the reviewer can answer yes to:

- Every UI action has a CLI equivalent (parity matrix complete).
- The namespace (`workshop participants` / `workshop team`) reads naturally alongside existing commands.
- The two-step randomize safety is acceptable (preview → commit-token, with interactive prompt in TTY mode).
- The skill surface (`$workshop …`) is facilitator-only; participant skill unchanged.
- Coordination with 2026-04-10 refactor plan is real, not hand-waved.
