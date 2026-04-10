# ADR 2026-04-09: Continuation Shift as Eval Harness

## Status

Accepted

## Context

Harness Lab workshops centre on a continuation shift at midday: a fresh
afternoon team inherits the morning team's repo cold, with no verbal
rescue. The expert audit of 2026-04-09 identified this as the strongest
pedagogical idea in the workshop and also the most under-used one.
Today the shift is purely experiential. The workshop produces anecdotes
about whether the handoff worked ("the receiving team found the plan
quickly", "they were lost for twenty minutes") but not evidence that
one cohort's blueprint can learn from.

Three gaps follow:

- **No instance-level instrumentation.** Facilitators walking the room
  during the shift have no structured place to record what they see.
  Observations live in chat or memory and are lost after the close.
- **No cross-cohort trend visibility.** Each cohort's signals, even
  when captured informally, die with the instance. Cohort N cannot
  learn from cohort N-1 because there is no durable log.
- **No rubric, no vocabulary.** Even if we did capture signals, we do
  not yet know which fields matter. Formalising a rubric before we
  have data would freeze assumptions too early.

The expert audit recommended turning the continuation shift into an
eval harness: capture which repo artifacts the receiving team touched,
time-to-first-productive-action, friction patterns, and qualitative
facilitator observations. Feed those signals into the blueprint through
ADRs and plan updates.

This ADR records the decision to do that work, the shape of the
minimum viable version, and the deliberate scoping choices that keep
v1 small.

## Decision

Harness Lab will instrument the continuation shift by capturing
structured facilitator observations during the rotation phase and
persisting them in two places: an instance-local store that lives with
the workshop instance, and a cross-cohort append-only learnings log
that survives instance teardown.

Rules:

- capture happens through a new `HandoffMomentCard` capture panel on
  the facilitator instance control page, visible only while the
  rotation phase is current or just completed
- capture is opt-in and facilitator-only in v1; the phase never waits
  for a signal and participants cannot self-capture yet
- each captured signal carries a free-text observation, zero or more
  free-text tags, and an optional team identifier; the schema is
  deliberately loose until cohort evidence justifies a rubric
- to guide early capture without freezing the schema, v1 ships with
  suggested seed tags derived from the autonomous planning standard's
  failure taxonomy: `missing_runbook`, `no_test_evidence`,
  `next_step_not_obvious`, `constraint_only_in_chat`,
  `agents_md_too_large`, `drift_not_caught`, `premature_propagation`,
  `missing_session_state`. Facilitators may use these, ignore them, or
  add their own. The tags are vocabulary suggestions, not a required
  schema.
- instance-local signals live at
  `$HARNESS_DATA_DIR/<instanceId>/rotation-signals.json` and are
  classified facilitator-private per
  `docs/private-workshop-instance-data-classification.md`
- the cross-cohort learnings log lives at
  `$HARNESS_DATA_DIR/learnings-log.jsonl` outside any instance
  directory; this file is append-only and survives instance deletion
- Neon mode uses parallel `rotation_signals` and `learnings_log`
  tables with the same semantics
- the new work sits behind a dedicated repository pair
  (`rotation-signal-repository.ts` and `learnings-log-repository.ts`)
  that mirrors the structure of `monitoring-snapshot-repository.ts`
  and `audit-log-repository.ts`
- capture does not mutate `WorkshopState`; rotation signals are
  orthogonal to the hot path of state reads
- a new `POST /api/rotation-signals` route wraps the capture operation
  under `requireFacilitatorRequest()`, mirroring the auth and
  validation pattern of `/api/rotation/route.ts`
- the full design lives in `docs/continuation-shift-eval-design.md`
  and is the reference for data shapes, file paths, API contracts,
  UI behaviour, and test plan

Explicit non-goals for v1, kept as future work:

- automated artifact-touch detection (would require hooks inside
  participant repos)
- a formal rubric for interpreting signals (deferred until cohort N
  produces enough data to pattern-match against)
- participant self-capture from the participant surface
- statistical dashboards over the learnings log (use `jq`, Python, or
  a notebook in the meantime)
- gating phase progression on signal capture

## Consequences

- Facilitators gain a concrete place to record what they see during
  the rotation phase. Observations stop dying in chat and memory.
- The learnings log becomes the evidence base for future blueprint
  decisions and future ADRs. Decisions about the workshop method can
  cite specific signals from specific cohorts instead of relying on
  facilitator recall.
- The workshop practices the discipline it teaches. Continuation
  quality is now something the workshop itself has a feedback loop
  for, not just something the workshop asks participants to value.
- The dashboard gains a new repository pair, a new API route, and a
  modest UI extension on an existing card. All of these follow
  patterns already established by `MonitoringSnapshotRepository`,
  `AuditLogRepository`, and `CheckpointRepository`.
- The learnings log grows without bound in v1. A rotation policy
  (annual, quarterly, or size-based) is not needed until the file
  exceeds roughly 10 MB, which at expected signal volume is years
  away. Tracked as a future concern.
- The cohort identifier for each learnings log entry is derived from
  `WorkshopMeta.cohort` if set, else from the ISO year-quarter of the
  capture timestamp. The fallback is deterministic but fuzzy across
  new-year and new-quarter boundaries. Tightening this to require an
  explicit cohort on each instance is deferred until the fallback
  causes visible confusion.
- The learnings log classification is facilitator-private today. If
  the data volume ever hosts multiple customer workshops, the log
  needs a customer-scope field and per-customer read gates. Not a
  concern under single-tenant Neon; flagged for multi-tenant rollout.
- A rubric for interpreting signals will be written after cohort N
  produces at least five real signals. This ADR does not block on
  that rubric; it explicitly defers it so v1 can ship and start
  producing the data the rubric will consume.
