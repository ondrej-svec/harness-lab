# Plan Lifecycle Standard

Harness Lab keeps plans as durable artifacts. This standard defines how a plan moves through its life and where it lives at each stage, so that an agent browsing `docs/plans/` sees live work and only live work, while historical plans remain findable and intact.

The repo's doctrine is **durable artifacts that match reality** (`docs/harness-doctrine.md`, `AGENTS.md:142`). Plans are never deleted. They are either live in `docs/plans/` or archived in `docs/plans/archive/`. Both locations are tracked, greppable, and part of the working repo.

## Canonical Status Values

Every plan under `docs/plans/` (and `docs/plans/archive/`) must carry a `status:` field in its YAML frontmatter with exactly one of these values:

- **`approved`** — plan is written, reviewed, and ready to start. No `/work` run yet.
- **`in_progress`** — `/work` has begun. Some tasks are checked, others are not.
- **`complete`** — all acceptance criteria green, all tasks checked, work shipped.
- **`superseded`** — a newer plan has explicitly replaced this one. The newer plan should link back to its predecessor.
- **`captured`** — the file is a plan-shaped artifact that was produced as reference material, not as an execution tracker (used sparingly — prefer `brainstorm` type).

`completed` is **not a canonical value**. If you see it, normalize it to `complete`.

## Lifecycle Transitions

```
    /plan                 /work begins            acceptance criteria met
  ┌────────┐    ┌─────────────┐    ┌──────────┐
  │approved├───▶│in_progress ├───▶│ complete │
  └────────┘    └─────────────┘    └──────────┘
                                        │
                       newer plan       │
                       replaces it      ▼
                                  ┌────────────┐
                                  │ superseded │
                                  └────────────┘
```

A plan moves forward only. If a `complete` plan needs to restart, open a new plan and mark the old one `superseded`.

## Directory Layout

```
docs/plans/
├── archive/                      # complete + superseded plans, append-only
│   └── README.md                 # one-line description + link to this standard
├── 2026-XX-XX-<type>-<slug>-plan.md    # live work only (approved | in_progress)
└── 2026-XX-XX-<slug>-notes.md          # plan-supporting research (type: research, for-plan:)
```

**`docs/plans/` root contains only:**
- plans with `status: approved` or `status: in_progress`
- research notes with `type: research` and a `for-plan:` field pointing at the parent plan in the same directory
- plans with `status: captured` (as the exception, not the rule)

**`docs/plans/archive/` contains:**
- plans with `status: complete` or `status: superseded`
- nothing else

When a plan's status flips to `complete` or `superseded`, **move it to `archive/` in the same commit that sets the status**. Half-moved state (status updated but file still in root) is worse than no move at all — an agent reading the directory cannot trust either location.

## Archive Rules

- **Append-only.** No plan is ever deleted from `archive/`. If a plan turns out to be wrong, write a new plan citing why and archive the old one; do not delete.
- **Preserve history.** Use `git mv` so the archive retains full blame and log.
- **Update inbound links before moving.** Any `docs/`, `workshop-blueprint/`, `content/`, `AGENTS.md`, or nested `AGENTS.md` reference to a plan's path must be updated to the new `plans/archive/<filename>` location in the same commit as the move.
- **No subdirectories inside `archive/`.** Flat structure. If the archive grows unreadable in future (hundreds of files), a later plan can introduce year-based subdirectories — premature structure is worse than flatness.

## Non-Plan Files in `docs/plans/`

Only two types belong in `docs/plans/` root besides plans themselves:

- **Research notes** (`type: research`) that directly support a live plan. They must carry a `for-plan:` frontmatter field pointing at their parent plan file. They move with the parent plan when it archives.
- Nothing else. Brainstorms belong in `docs/brainstorms/`. ADRs belong in `docs/adr/`. Design docs belong in `docs/`.

If you find a misfiled file, `git mv` it to its correct location and update inbound references in the same commit.

## Analyze Checks

`workshop analyze` treats the plans directory as a first-class surface (see `docs/agents-md-standard.md` scoring appendix). It fails when:

- `no_complete_plans_in_plans_root` — any file under `docs/plans/*.md` (not `archive/`) has `status: complete` or `status: superseded`
- `no_non_plan_types_in_plans_root` — any file under `docs/plans/*.md` has a `type:` other than `plan` or `research`
- `plan_status_field_canonical` — any `status:` value is not in the canonical list above

These checks exist so friction does not silently re-accumulate. When an analyze FAIL points at this doc, come back to it.

## Maintenance Triggers

Update this standard when:

- a new status value becomes necessary (resist this — prefer reuse)
- the archive grows beyond flat readability (introduce subdirectories in a dedicated plan, not ad-hoc)
- the scoring appendix in `docs/agents-md-standard.md` gains new plans-directory checks (cross-reference here)
