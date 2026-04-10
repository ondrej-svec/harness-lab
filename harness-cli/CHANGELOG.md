# Changelog

All notable changes to `@harness-lab/cli` are documented here.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project follows semantic versioning.

## 0.3.1 — 2026-04-10

### Added

- **`harness workshop learnings`** — query the cross-cohort learnings log
  from the CLI. Reads the append-only JSONL file at
  `$HARNESS_DATA_DIR/learnings-log.jsonl` and supports `--tag TAG`,
  `--instance ID`, `--cohort NAME`, and `--limit N` (default 20) filters.
  Human-readable mode prints cohort, timestamp, team, tags, and
  observation text per signal. JSON mode (`--json`) returns a structured
  `{ ok, totalMatched, returned, source, signals }` payload.
- **Workshop skill wiring**: new `workshop facilitator learnings` command
  in `workshop-skill/SKILL.md` routes to the CLI for machine-readable
  output. "Facilitator commands" section added to `commands.md` (both
  locales). `reference.md` (Czech) gained a dedicated "Learnings log"
  section with CLI examples; the English locale was updated with a
  one-line command reference.

## 0.3.0 — 2026-04-09

This release lands the expert-audit remediation work for participant-facing
ergonomics (Stream C of `docs/plans/2026-04-09-feat-expert-audit-remediation-plan.md`)
and shrinks the shipped workshop bundle by removing author-only content.

### Added

- **`harness workshop status` now prints the currently-selected workshop
  instance prominently** in human-readable mode and exposes a
  `selectedInstance` object at the top of the JSON payload. Facilitators
  no longer have to cross-reference `harness workshop current-instance`
  to know which workshop a subsequent mutation will target.
- **Actionable error messages on `harness skill install`** for the common
  filesystem failure modes: `EACCES` / `EPERM` (write permission denied),
  `ENOSPC` (disk full), `ENAMETOOLONG` / `ENOTDIR` (path too long — the
  common Windows symptom of a deeply nested repo), `EROFS` (read-only file
  system), and `EBUSY` (target held open by another process). Raw Node
  errors are still available as the cause chain for debugging but the
  surface-level message is now participant-friendly.
- **Node version gate**: `harness skill install` verifies the running Node
  version meets the `engines.node` constraint from `package.json`
  (currently `>=22`) and fails with an actionable upgrade hint instead of
  a cryptic mid-install error.
- **`materials/coaching-codex.md`** is now part of the bundled workshop
  skill — a one-page pocket card of conversational moves participants can
  use to coach Codex through plan-first work. Surfaced from
  `workshop-skill/SKILL.md`, `workshop-skill/reference.md`, and
  `materials/participant-resource-kit.md`.
- **`content/codex-craft.md`** (shipped via the `content/` directory copy)
  documents Codex-specific craft: approval modes, sandboxing, context
  budget, long-horizon drift and re-surfacing, a representative before/
  after prompt pair, and a failure-recovery walkthrough.

### Changed

- **Bundle shrunk by ~20%** (61 files → 55 files, ~251 KB → ~200 KB). The
  following author/maintainer-only files are no longer shipped to
  participants because they have no workshop-skill references and belong
  in the source repo for maintainers, not in a participant install:
  - `content/style-guide.md`
  - `content/style-examples.md`
  - `content/czech-reject-list.md`
  - `content/czech-editorial-review-checklist.md`
  - `workshop-blueprint/edit-boundaries.md`
  - `.copy-editor.yaml` (tool config; previously shipped only to satisfy
    a bundle link-integrity check caused by the checklist's cross-link,
    which is moot now that the checklist itself is excluded)
- `workshop-bundle.js` gained an `EXCLUDED_BUNDLE_PATHS` set and threads a
  bundle-relative prefix through the directory copy so these exclusions
  are enforced at both the copy step and the manifest build step.
- `workshop-blueprint/README.md` updated to move the `edit-boundaries.md`
  reference into the "Related Runtime Documents" section, where it is
  explicitly documented as a maintainer-only doc that lives in the source
  repo rather than the portable bundle.

### Fixed

- **Czech typography baseline pass no longer contaminates English
  dev-facing files with non-breaking spaces.** The marvin copy-editor
  skill's deterministic Czech pass was inserting U+00A0 between single-
  letter words (the Czech `a`/`i`/`o`/`v`/`u`/`k`/`s`/`z` → next-word
  binding rule) in files that are authored in English and must not
  receive Czech typography: `workshop-skill/SKILL.md`,
  `workshop-skill/facilitator.md`, `materials/coaching-codex.md`, and
  (preemptively) `content/codex-craft.md`. These files are now explicitly
  excluded in `.copy-editor.yaml`, and existing NBSPs have been stripped
  from them. The CLI skill-install test is also whitespace-tolerant
  (accepts `\s` or NBSP) as defense in depth so a stray re-run of the
  pass cannot wedge the suite.

## 0.2.9 and earlier

See the git history at
[`harness-cli/`](https://github.com/ondrej-svec/harness-lab/commits/main/harness-cli)
for versions prior to the introduction of this changelog.
