# Changelog

All notable changes to `@harness-lab/cli` are documented here.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project follows semantic versioning.

## 0.6.0 — 2026-04-10

### Added

- **Participant team write commands.** `harness workshop team set-repo`,
  `set-members`, and `set-name`. Sent as authenticated PATCH requests against
  `/api/event-context/teams/<teamId>`. Changelog back-filled in 0.7.0.

## 0.7.2 — 2026-04-13

### Changed

- **Workshop content layout flipped: English canonical at the root, Czech in `locales/cs/`.**
  Under `docs/plans/archive/2026-04-13-refactor-language-flip-and-czech-review-plan.md`.
  12 bilingual file pairs moved via `git mv` (history preserved): talks,
  5 project briefs, materials kit, facilitation master-guide, codex-setup-verification,
  challenge-cards deck and print-spec. `materials/coaching-codex.md` gained a Czech
  translation at `materials/locales/cs/coaching-codex.md`. The new convention is
  documented in `docs/workshop-content-language-architecture.md` under
  "Directory convention — enforced 2026-04-13".
- **Full Czech review pass.** Three agenda batches (28 scenes) + four standalone
  file reviews covering the talks, briefs, materials, facilitation, and
  challenge cards. Seven review memos under `docs/reviews/workshop-content/2026-04-13-czech-*.md`.
  ~115 fixes applied across the corpus: protected phrase `Co není v repu,
  neexistuje` restored in `talk-how-to-build`, `§5 v pondělí` day-anchor
  violations removed from the reveal facilitator runner, `build-2-second-push`
  facilitatorRunner translated from English to Czech (was a translation gap),
  gender error `tyhle čtyři slova` → `tahla čtyři slova`, full `ty` → `vy`
  sweep across every phase-level facilitatorRunner block, semantic drift
  corrections (`ztracené řešení` → `řešením, které existuje jen v hlavách`,
  `ladění` → `shodněte se`, master-guide line 117 context/prompt reversal).
  Every agenda scene and phase now reads `cs_reviewed: true`.
- **`check-tier2-sync.ts` and `generate-briefs-inventory.ts` inverted** to
  walk `locales/cs/` for Czech files and treat the root as English canonical.
- **`.copy-editor.lock.json` re-segmented** for all 14 moved/new files;
  `reviewedBy` stamped `ondrej@2026-04-13-refactor-language-flip`.
- **`.copy-editor.yaml` include list swapped** from root markdown globs to
  `locales/cs/**/*.md` globs; stale `locales/en/**` exclude removed.
- **Workshop bundle file list updated** in `harness-cli/src/workshop-bundle.js`
  to pull Czech files from `locales/cs/` instead of the now-missing
  `locales/en/` paths. Test suite updated to assert the new layout.

## 0.7.1 — 2026-04-13

### Changed

- **Workshop bundle content refreshed with the 2026-04-13 Czech review pass.**
  The bundled `workshop-content/agenda.json`, the five project briefs, and the
  generated per-language views all reflect the Mode A editorial review:

  - `ty` → `vy` normalisation across ~14 scenes and every project brief
    `firstAgentPrompt`, per the `content/style-guide.md` mandate that all
    visible surfaces use lowercase `vy` (peer tone). Scenes touched include
    all of Phase 1 Opening, the Phase 5 / Phase 9 intermezzos, Phase 7
    rotation, Phase 8 Build 2 start, and the entire Phase 11 Reveal arc.
  - Four untranslated English eyebrows in the opening phase translated to
    Czech: "The day has one arc" → "Den má jeden oblouk", "Today's schedule"
    → "Dnešní rozvrh", "Your team" → "Váš tým", "Next" → "A teď".
  - "Monday" framing removed from visible surfaces. The hero bodies, callouts
    and closing scenes now use "the next day" / "druhý den" / "zítra ráno"
    instead of assuming participants come back on Monday. "Editor" replaced
    with "coding agent" in the two scenes where the workshop's mental model
    specifically points at the agent, not a text editor.
  - Facilitator runner steps tightened where `Odpočítej` was masking a
    linguistic bug — the mechanic is distribution-by-counting, which is
    `Rozpočítejte se` in Czech, not `Odpočítejte se` (countdown).
  - Several calques fixed: "v obědě" → "přes oběd", "mechanismus" → "postup",
    "na tvém stroji" → "na vašem počítači", "Nevybírat není varianta" →
    "Musíte si vybrat", "v rukou" → "u sebe", "Tým máš na X" → "Na X máte
    svůj tým".
  - Project briefs: "rubric" → "hodnoticí schéma" as a Czech-native term
    (bundled along with the `ty`→`vy` pass on all five briefs).

- **`demo-setup` unwriteable-target test is now cross-platform.** Replaced
  the Unix-only `/dev/null/impossible` trick with a mkdir-under-a-regular-file
  pattern. The test now fails identically on Unix and Windows when the
  target path cannot be created.

### Notes

- Every agenda scene still has `cs_reviewed: false` — the Mode A fixes are
  mechanical editorial corrections (voice doctrine, reject list, style guide
  compliance). The native-speaker aesthetic review that flips `cs_reviewed`
  true is a separate pass, tracked in
  `docs/reviews/workshop-content/2026-04-13-czech-mode-a-scene-cards.md`.
- No CLI code changes between 0.7.0 and 0.7.1; this is a content-only
  republish so that newly-installed CLIs ship with the reviewed agenda.

## 0.7.0 — 2026-04-13

### Added

- **`harness demo-setup` command.** Scaffolds two folders for the Phase 3
  contrast demo: Folder A (bare repo, brief only) and Folder B (harnessed
  repo with `AGENTS.md`, a short plan, seed data). Accepts `--target <path>`.
  Facilitators run it before the workshop so the live contrast demo has
  stable starting state.
- **`workshop briefs` (plural) skill command.** Lists every brief available
  in the active instance so teams can browse before picking one in Phase 3.
  Exposed as a CLI alias over the existing briefs handler and documented in
  `workshop-skill/SKILL.md`.
- **`workshop commitment` skill command.** Stores a personal Phase 10 Reveal
  commitment on the participant's machine (local-only by default; optional
  anonymous push is deferred). Documented in `workshop-skill/SKILL.md`.
- **Verification ladder reference** appended to `workshop-skill/reference.md`
  covering tracer bullets, end-to-end tests, automated reviews, human review,
  holistic-beats-granular, and the self-validation trap.

### Changed

- **Skill reference docs are now English-canonical** per ADR
  `docs/adr/2026-04-12-skill-docs-english-canonical.md`. The entire
  `workshop-skill/locales/` parallel tree is removed from the shipped bundle.
  The agent translates reference material on the fly when a participant asks
  in another language. Participant-facing presenter copy (agenda scenes,
  project briefs, challenge cards) is unaffected and still ships with
  reviewed Czech translations.
- **Workshop agenda rewritten** across all 11 phases from the 2026-04-12
  brainstorm: new Phase 1 framing hero, Phase 2 "The Craft Underneath",
  Phase 3 "Let me show you", Phase 4 Build 1 timeline with tracer-first
  framing, Phase 5/9 intermezzos with append-only team check-ins, Phase 7
  rotation via scatter count-off, Phase 8 Build 2 split into first-push and
  second-push sibling phases around Intermezzo 2, Phase 11 Reveal with
  four-layer 1-2-4-All and tool-agnostic commitment framing. Day count goes
  from 10 to 11 phases.
- **Project briefs revised** — handoff test promoted to Done-when #1 on all
  five briefs; problem statements tightened; first-agent prompts sharpened.
  `doc-generator` is now registered in the bundle inventory (previously
  orphaned).
- **Talk files** — English canonical versions of `context-is-king.md` and
  `codex-demo-script.md` now ship in the bundle (replacing 7-line stubs).
- **Czech translations** for every scene touched by the content refresh.
  Each phase and scene ships with `cs_reviewed: false` pending a
  native-speaker review sweep before the first real workshop.

### Security

- Skill bundle ships with the new English-canonical skill docs; the
  pre-existing `npm audit` and Gitleaks/Semgrep gates in the publish workflow
  continue to pass.

## 0.5.9 — 2026-04-10

### Changed

- **Blueprint inventory in workshop bundle.** The generated agenda views
  (`agenda-cs.json`, `agenda-en.json`) and the public blueprint now include
  an `inventory` section with briefs and challenges. When a facilitator resets
  an instance with `--from-local`, the blueprint's inventory is used instead
  of hardcoded seed data, making each workshop instance independently
  configurable.

- **Workshop skill routing.** The SKILL.md now routes brief and challenge
  requests through the CLI (`harness --json workshop brief/challenges`) as the
  primary source, with local content files as offline-only fallback.

## 0.5.8 — 2026-04-10

### Added

- **`harness instance reset --from-local`** — reset a workshop instance from
  locally generated blueprint files without waiting for a deployment. The CLI
  reads `dashboard/lib/generated/agenda-{lang}.json` and sends it in the
  reset API payload.

## 0.5.5 — 2026-04-10

### Fixed

- **Cosign signing in publish workflow.** Fixed artifact paths, added
  `sigstore/cosign-installer`, and handled the new `.sigstore` bundle format
  (replaces separate `.sig` / `.pem` files). Versions 0.5.3 and 0.5.4 were
  intermediate publish-pipeline fixes for the same issue.

## 0.5.2 — 2026-04-10

### Added

- **Participant role enforcement at CLI layer.** Participant sessions are
  rejected from facilitator commands before any network request. Enforced by
  `requireFacilitatorSession`, tested by 9 security-specific tests.
- **Credential isolation.** `sanitizeSession` strips session cookies, access
  tokens, and authorization headers from all CLI output. Tested across all 4
  auth types.

## 0.5.1 — 2026-04-10

### Fixed

- **Participant login dashboard URL resolution.** Fixed `ReferenceError` where
  `resolveDashboardUrl` was not defined in the event-code login handler.

## 0.5.0 — 2026-04-10

This release restructures the CLI scope taxonomy and adds participant-facing
commands. **Breaking**: several commands were renamed.

### Added

- **Participant auth**: `harness auth login --code <CODE>` authenticates via
  event code. Sessions now store a role (`participant` or `facilitator`).
- **Participant data commands**: `harness workshop brief`, `harness workshop
  challenges`, `harness workshop team`.
- **Skill delegation rule**: `SKILL.md` now delegates login, brief, challenges,
  and team commands to the CLI. Skills never make HTTP requests directly.

### Changed

- **Scope rename (breaking)**: `harness instance create` (was `workshop
  create-instance`), and similarly for `list`, `show`, `select`, `current`,
  `update`, `reset`, `remove`.
- Test suite restructured to match the new command surface.

## 0.4.3 — 2026-04-10

### Changed

- **Dual-skill install for all agents.** `harness skill install` now installs
  both participant and facilitator skills regardless of agent type.

## 0.4.2 — 2026-04-10

### Added

- **Claude Code skill install support.** `harness skill install` now supports
  Claude Code alongside Codex.

## 0.4.1 — 2026-04-10

### Added

- **Content summary in `reset-instance` and `show-instance`.** Both commands
  now include a `contentSummary` (phases, scenes, briefs, challenges) when the
  API supports it. `show-instance` fetches the agenda alongside metadata.

## 0.4.0 — 2026-04-10

This release lands the expert-panel remediation work: skill split, CLI
progressive disclosure, and an updated workshop content bundle.

### Changed

- Skill architecture split into participant and facilitator surfaces.
- CLI help and command grouping updated for progressive disclosure.
- Workshop content bundle refreshed.

## 0.3.2 — 2026-04-10

### Changed

- **Redesigned `--help` output.** Commands are now grouped by workflow
  (Participant, Authentication, Workshop inspect/lifecycle/live), each
  with a one-line description in a two-column layout. Global flags,
  examples, and a documentation link are shown at the bottom. The old
  help was a flat wall of command signatures with no descriptions.

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
