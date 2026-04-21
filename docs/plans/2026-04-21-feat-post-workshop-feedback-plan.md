---
title: "feat: post-workshop phase and participant feedback form"
type: plan
date: 2026-04-21
status: approved
brainstorm: docs/brainstorms/2026-04-21-post-workshop-feedback-brainstorm.md
confidence: medium
---

# feat: post-workshop phase and participant feedback form

Facilitator flips an instance from `running` (or any prior status) to a new `"ended"` lifecycle status. Participant UI pivots to a resources-first surface with a structured feedback form (5 Likert/stars, multiple-choice, and open-text questions — 9 total). Admin gets an aggregate summary view per question, shareable via screenshot / print-friendly layout. Retroactivity for today's hackathon works via existing event-code re-issue with explicit expiration choice. Authoring UI for the form template is explicitly deferred to v2.

## Problem Statement

Workshops end and the learnings leave with the participants. No structured way to capture feedback, no shareable artifact for leadership, no mechanism for returning participants to come back. Today's hackathon confirmed the felt need — participant-only experience worked, but end-of-workshop reflection was purely verbal in-session, with nothing captured.

## Target End State

When this lands:
- `WorkshopInstanceStatus` includes `"ended"`. Facilitator can transition via an admin action; transition is one-way in v1.
- When instance is `ended`, the participant surface renders `PostWorkshopSurface` instead of the workshop room — resources-first + feedback form. Team-mode and participant-mode orthogonal (both work under `ended`).
- Participants (with Neon-Auth'd passwords) can return via the re-issued event code days later and complete the form.
- Facilitator sees an aggregate summary in a new admin `summary` section — per-question cards with bars/counts, open-text list, print-friendly for screenshot sharing.
- Default template ships in CS + EN. Per-instance override lives as `workshop_instances.feedback_form JSONB` (hand-edit in v1; authoring UI is v2).
- Today's hackathon can be retroactively ended and have feedback collected by re-issuing its event code with 14-day expiration.

## Scope and Non-Goals

### In scope
- Lifecycle: `"ended"` status value, `endWorkshopAction` server action, one-way transition in v1.
- Storage: `feedback_form JSONB` column on `workshop_instances`; new `workshop_feedback_submissions` table with unique `(instance_id, session_key)`.
- API: `POST /api/participant/feedback-submission` (reuses `requireParticipantScopedWrite` from prior work for participant-mode instances; same-shape helper for team-mode).
- Participant UI: `PostWorkshopSurface` component; `participant/page.tsx` branches on status.
- Admin UI: `endWorkshopAction` panel inside `settings-section`; event-code re-issue extended with expiration-choice dropdown inside `access-section`; new `summary` section with aggregate renderer.
- Default template (9 questions) baked in with CS + EN prompts, Likert anchors, placeholders, confirmation copy.
- Print-friendly CSS (Tailwind `print:` utilities) for the admin summary view.
- Read-time normalization for legacy state documents (no `feedback_form` field).

### Out of scope
- **Authoring UI** for editing the per-instance feedback template via admin (v2).
- **CSV / PDF / Excel export** of feedback data (v2, only if leadership asks).
- **Per-participant magic link** retroactivity path (v2).
- **Testimonial curation workflow** (selecting / editing / publishing testimonials).
- **Automatic notification** to participants when the workshop transitions to `ended`.
- **Scheduled reminders** to incomplete participants.
- **Response editing after submission-lock** (if lock window is implemented — see open question).
- **Question-level branching logic** ("if rating < 3, show follow-up question").
- **Automatic `ended → archived` transition.**
- **Backfill of feedback form to past archived workshops.**
- **Live-edit of the question template from admin UI.**

## Proposed Solution

Seven phases, dependency-ordered. Each phase ships as a commit on `main`. Phases 1–5 ship back-to-back (no preview-artifact gate). Phase 6 (copy + mockups) gates autonomous work on the participant surface polish; Phase 7 (proof slice) is the real-user validation.

1. **Foundation** — migration (column + table), status enum, TS types, repository layer for submissions.
2. **Lifecycle action** — `endWorkshopAction`, audit log, status update in repository.
3. **Event code expiration choice** — extend existing admin form + action with an expiration dropdown.
4. **Participant-side plumbing** — submission API route, `PostWorkshopSurface` scaffold (no final copy), page routing on status.
5. **Admin summary view** — new `summary` section, aggregate renderer, print CSS.
6. **Copy + preview artifacts** — default template CS + EN, Likert anchors, placeholders, voice review against Rule 1 / 2 / 2b, HTML mockups required before this phase merges.
7. **Proof slice + memory update** — end today's hackathon (or the next), collect ≥5 submissions, capture screenshots, update memory with any new voice rules discovered.

## Decision Rationale

### D1: Lifecycle via new `"ended"` status (not a flag or reuse of `archived`)
`WorkshopInstanceStatus` currently has dormant values (`running`, `archived`, `removed` — nothing writes them). Adding `"ended"` is additive and matches the user's mental model ("put it into some stage"). Reusing `archived` would conflate data-retention snapshot with feedback-open phase; a flag-only design loses lifecycle shape and forces every UI to derive "is this workshop done?" from flag presence.

### D2: `feedback_form JSONB` on `workshop_instances` + separate submissions table
`workshop_meta` is the established per-instance JSONB override pattern. The feedback template mirrors it. Submissions go in a dedicated `workshop_feedback_submissions` table to avoid polluting `participant_feedback` (mid-workshop blockers/questions). Unique constraint on `(instance_id, session_key)` enforces one submission per participant per instance at the DB level — matches the poll-responses pattern.

### D3: Extend `issueParticipantEventAccess`, don't add a new "extend expiry" path
Research confirmed `issueParticipantEventAccess` already takes an optional `expiresAt`. Only the admin form layer ignores it. Adding a dropdown + `expiresAt` form field is the whole lift. A real "extend in place" path (same code, later expiry) is not needed for v1 — re-issue (new code, new expiry) works.

### D4: New `summary` admin section, always visible
Rail goes from 4 to 5 sections. Section is always rendered; content changes by status:
- `prepared` / `running`: empty state — "Feedback summary appears here after the workshop ends."
- `ended`: aggregate per-question cards.

Alternative considered: conditionally show the section only when `status === "ended"`. Rejected — stable rail is less confusing than a section that appears/disappears. Users learn the shape once.

Alternative considered: overload `run` section to show summary when ended. Rejected — conceptually muddy (run is for active workshops).

### D5: `endWorkshopAction` lives in `settings-section`, not its own section
`settings-section` already hosts archive + reset (finalizing actions). End-workshop is semantically a finalization. No new section or rail change required for the action itself (unlike the summary which is a view).

### D6: One-way transition in v1
No `unendWorkshopAction` yet. If a real need to revert emerges (e.g. facilitator flipped by accident), add a small sibling action. Keeping it one-way simplifies the data-consistency story (no need to think about what happens to submissions when un-ended).

### D7: Submission idempotency — upsert for first N hours, then lock
Allow resubmit (overwrite previous answers) for 24 hours after first submission via `ON CONFLICT (instance_id, session_key) DO UPDATE`. After 24h, reject with 409. Rationale: participants often think of more after submitting; short edit window is generous without creating indefinite uncertainty for the facilitator reviewing responses. Implementation: check `submitted_at` in the UPSERT path; if `age > 24h`, return 409.

Alternative considered: allow edits indefinitely. Rejected — facilitator should be able to "freeze" their dataset.
Alternative considered: single submission, no edits ever. Rejected — first-draft regret is real.

### D8: Print CSS via Tailwind `print:` utilities
No precedent in the codebase. Using Tailwind's native `print:` variant keeps things in CSS-as-code and component-local. Targets: hide admin chrome (rail, header), increase contrast, larger text for readability at print size. No new PostCSS or global stylesheet needed.

## Constraints and Boundaries

- **Architectural:** Boolean/lifecycle flags on `workshop_instances` are first-class columns, not JSONB. Per-instance content overrides are JSONB columns. Schema-drift guard via column-support probe.
- **Operating:** Migrations additive only (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`). No down migrations. Status enum is TS-only (DB column is `TEXT`), so adding `"ended"` is a type-level change.
- **Voice:** Participant-facing copy follows Rule 1 (no rescue motif) + Rule 2 / 2b (triad naming, mode-correct variant). Feedback form copy bilingual from day one.
- **Deploy:** Per user memory, deploys via git push to `main` — trunk-based, no feature branches.
- **Release:** `"ended"` status is inert until (a) migration lands, (b) server action exists, (c) participant surface renders `PostWorkshopSurface` on status match. Ship in that order — can roll out progressively since status can't be set to `ended` until facilitator action exists.
- **Privacy:** Testimonial consent (`allow_quote_by_name`) defaults to **false**. Summary view must not display participant names on testimonial questions unless consent is true. This is a GDPR / trust boundary.

## Subjective Contract and Preview Gate

### Target outcome
A participant sees a warm, short, focused feedback surface after the workshop ends. They complete it in under 3 minutes. The copy feels like a continuation of the workshop voice. The facilitator opens the admin summary the next morning, sees what to change for the next workshop at a glance, screenshots it, and sends to leadership — no editing needed.

### Anti-goals
- Corporate / HR-survey voice ("please rate your satisfaction 1-10").
- Mandatory / punitive framing.
- Form that takes more than 5 minutes.
- Dark patterns for testimonial extraction.
- Any forbidden team words in participant-mode copy (`tým` / `parťák` / `team` / `teammate` / `your team`).

### References
- `participant-room-surface.tsx` `getParticipantSurfaceCopy` — tone reference.
- `allow_walk_ins` + `team_mode_enabled` — pattern for per-instance boolean + admin form.
- Poll summary at `run-section.tsx:417-453` — aggregate bar pattern to mirror.
- `workshop_meta` JSONB — per-instance override precedent.

### Anti-references
- SurveyMonkey / Typeform aesthetic (forced progress bars, multi-step wizards).
- `participant_feedback` table semantics (do NOT store submissions there).
- Poll embedded in `workshop_state` (do NOT store template there).
- Per-question localized override tables (keep language inside prompt JSONB `{ cs, en }`).

### Tone / taste rules
1. **Voice rules 1, 2, 2b apply.** Participant-mode instances use the participant-mode triad (`další účastník, člověk nebo agent` / `another participant, teammate, or agent`). Team-mode uses the team-mode triad.
2. **Bilingual from day one.** Every prompt, placeholder, submit label, success/error message in both CS + EN.
3. **Likert anchors labeled.** Not bare numbers. E.g. CS `vůbec` — `výborně` / EN `not really` — `excellent`. Exact anchors captured in the copy table preview artifact.
4. **Open-text placeholders concrete**, not "Enter your feedback here." E.g. for takeaway: CS `Jedna věta, která vám zůstane.` / EN `One sentence that stays with you.`
5. **Testimonial consent defaults unchecked.** Explicit opt-in per GDPR and voice.
6. **Submission confirmation warm and final.** Not "Your response has been recorded."

### Representative proof slice
End today's hackathon (or the next workshop — whichever ships first after v1):
1. Facilitator flips instance `running` → `ended` via admin UI.
2. Facilitator re-issues the event code with 14-day expiration via the extended admin form.
3. Facilitator shares URL + code with participants via their own channel.
4. ≥ 5 participants return, authenticate, complete the form.
5. Facilitator opens the admin `summary` section, screenshots it, sends to leadership.

Success = ≥5 submissions collected, CS and EN both render cleanly, admin summary readable at a glance, no team language leaks in participant mode, print CSS produces a clean screenshot.

### Rollout rule
- Phases 1–5 ship directly to `main` — no preview gate (backend + structural UI).
- Phase 6 (copy + mockups) does not merge without the HTML mockup + copy table preview artifacts. User reviews mockup + copy table; failure sends work back to Phase 6.
- First real proof slice is today's hackathon or the next. If proof-slice surfaces voice or UX issues, iterate in follow-up commit before opening to broader workshops.
- v2 authoring UI does not start until ≥ 3 workshops have completed feedback cycles and the hand-edited-JSONB path has proven too limiting.

### Rejection criteria
- Any `tým` / `team` / `teammate` / `parťák` / `your team` leaks in participant-mode instance copy.
- Submission writes to the wrong table (e.g. `participant_feedback`).
- A participant can submit multiple times by accident (unique constraint missing or bypassed).
- `"ended"` status writeable by non-facilitator roles.
- Testimonial consent checkbox defaults to checked.
- Summary view shows identifying info against consent.
- Retroactive access fails for a Neon-Auth'd participant with a valid re-issued code.
- Print CSS produces a summary screenshot with admin chrome visible.

### Required preview artifacts (before Phase 6 merges)
- **HTML mockup of participant feedback surface** — CS + EN, team mode and participant mode.
- **HTML mockup of admin summary view** — aggregate Likert bars, multi-choice percentages, open-text list, print CSS applied.
- **Copy table** — all 9 default-template questions side-by-side CS + EN, with Likert anchors and placeholders, annotated against voice rules 1 / 2 / 2b.

## Assumptions

Inheriting from the brainstorm's Assumption Audit plus plan-specific additions.

| # | Assumption | Status | Evidence / Action |
|---|---|---|---|
| A1 | `issueParticipantEventAccess` accepts `expiresAt` parameter | **Verified** | Confirmed in research — `participant-access-management.ts:163`. |
| A2 | Admin form layer can pass `expiresAt` from a dropdown without schema changes | **Verified** | `readActionState` + hidden fields pattern already supports arbitrary form data; dropdown is UI-only change. |
| A3 | `workshop_instances.status` column is `TEXT` (not a PG enum) | **Verified** | Confirmed in prior research — adding `"ended"` is a TS-only change. |
| A4 | Adding a new `summary` section to `controlRoomSections` is safe | **Verified** | Just a constant-tuple extension + rail entry, same pattern as existing sections. |
| A5 | Print CSS via Tailwind `print:` utilities works in this Next.js setup | **Unverified** | Tailwind v4 supports `print:` variant. Covered by a small spike in Phase 5. |
| A6 | Today's hackathon event code can be re-issued with 14-day expiry before participants clear their cookies | **Unverified** | Depends on when we ship. If participants clear cookies + password-less walk-ins dropped, the re-issued code reaches fewer of them. Acceptable per v1 scope. |
| A7 | Participants with Neon-Auth'd passwords can reliably log back in days later | **Verified** | Research confirmed the authenticate endpoint flow; requires a fresh event-code session (which the re-issue provides). |
| A8 | 9 questions don't cause abandonment | **Unverified** | Industry heuristic holds for short forms. Proof slice validates. |
| A9 | Upsert-with-time-window idempotency is enforceable at the repository layer | **Unverified** | Standard PG `ON CONFLICT DO UPDATE` with a `WHERE submitted_at > NOW() - INTERVAL '24 hours'` variant. Small spike in Phase 1 to confirm. |
| A10 | Column-support probe pattern extends cleanly to `feedback_form` column | **Verified** | Already extended twice (for `allow_walk_ins` and `team_mode_enabled`); well-trodden. |
| A11 | Default submission idempotency window (24h) is long enough for participant first-draft regret | **Weak** | Guess. Revisit after proof slice. |

Unverified assumptions become either explicit tasks or risks (below).

## Risk Analysis

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Copy quality fails voice review; rework Phase 6 | Medium | Medium | Preview artifacts are mandatory before Phase 6 merges. Review against voice rules 1, 2, 2b with a copy-editor pass. |
| R2 | Print CSS doesn't render cleanly across browsers | Medium | Low | Phase 5 spike on print preview in Chrome + Safari; keep print style minimal (hide chrome, larger text); fallback is screenshot. |
| R3 | Event-code expiration UI confuses facilitator (custom date vs dropdown) | Low | Low | Dropdown with 1 / 7 / 14 / 30 days + `custom...`; helper text clarifies. |
| R4 | Submission idempotency window creates confusing UX (participant refreshes and sees old answers) | Medium | Medium | On refresh, fetch own submission if any, pre-populate form. Show "last edited X minutes ago, locks at Y." |
| R5 | `"ended"` status transitions race with live facilitator actions (e.g. flipping phase while someone is writing a check-in) | Low | Low | `endWorkshopAction` is an admin action — facilitator owns the timing. Participant writes in progress will still land (team-mode check-in still works during `running`); the transition happens at the exact moment the action fires. Worst case: one in-flight write completes successfully before the page re-renders. Acceptable. |
| R6 | Column-support probe regression missed for `feedback_form` column | Low | High | Register column in `loadWorkshopInstanceColumnSupport`, `buildInstanceSelectList`, `buildCreateInstanceQuery`, `buildUpdateInstanceQuery`. Test covers the probe. |
| R7 | Retroactive access for today's hackathon fails because the existing event code already expired | Medium | Medium | Facilitator re-issues via extended admin form with 14-day expiry. Test the proof slice on a real or test instance before declaring retroactivity working. |
| R8 | Summary view leaks testimonial names against consent | Low | **High** (trust + GDPR) | Explicit check at render time: only show participant name on testimonial question when `allow_quote_by_name === true`. Covered by a regression test. |
| R9 | Default template copy doesn't fit all workshop types (hackathon vs regular workshop vs demo day) | Medium | Low | Per-instance override via JSONB edit is the escape hatch in v1. If this hits hard, v2 authoring UI becomes higher priority. |
| R10 | Participants without Neon-Auth'd passwords (walk-ins) cannot return — leadership sees "only N of M responded" | High | Low | Accepted v1 limitation (documented in Out of Scope). Admin summary shows "participants-with-access / submissions-received" counter for honesty in reports. |

## Phased Implementation

### Phase 1 — Foundation (migration, types, repository)

**Exit criteria:** Migration applied. `workshop_instances.feedback_form JSONB` column exists. `workshop_feedback_submissions` table exists with unique constraint. `"ended"` added to `WorkshopInstanceStatus`. TS types for `FeedbackFormTemplate`, `FeedbackQuestion` (tagged union), `FeedbackAnswer` (tagged union), `FeedbackSubmissionRecord` defined and re-exported. Repository layer (`FeedbackSubmissionRepository`) with Neon + File implementations, `setForTests` helper, round-trip unit tests pass.

### Phase 2 — Lifecycle action

**Exit criteria:** `endWorkshopAction` server action lives in `dashboard/app/admin/instances/[id]/_actions/lifecycle.ts` (new file). Writes `status = "ended"` via `repository.updateInstance`, appends audit log entry `action: "instance_ended"`. Action is exposed via a form panel in `settings-section.tsx` (placed near archive + reset). Confirmation pattern: `<details>` with "type instance id to confirm" mirroring `resetWorkshopAction`. Tests: action writes correct status, audit entry present, does not mutate anything else.

### Phase 3 — Event-code expiration choice

**Exit criteria:** The existing `issueParticipantAccessAction` form in `access-section.tsx` gains an `expiresInDays` select (options: 1, 7, 14 default, 30, custom-days-input). Action reads `expiresInDays` from form data, computes `expiresAt` ISO string, passes to `issueParticipantEventAccess`. Helper text below the dropdown clarifies. Existing tests still pass; one new test covers the new form field.

### Phase 4 — Participant-side plumbing

**Exit criteria:** New API route `POST /api/participant/feedback-submission` (or `PUT` — decide during implementation). Uses session-based auth dispatch (team-mode → `requireParticipantTeamAccess`, participant-mode → `requireParticipantScopedWrite` — both paths reach the shared repository). Body validates against the instance's active question template (default or override), coerces each answer to its tagged type. Upsert on `(instance_id, session_key)` with 24h edit window; returns 200 on accept, 409 on locked, 400 on validation error.

`PostWorkshopSurface` scaffold component at `dashboard/app/components/post-workshop-surface.tsx`. Renders nothing-copy-final — structural only: resources reference groups (reused from `ParticipantRoomSurface.referenceGroups`), feedback form (calls API route), submission-confirmation state. `participant/page.tsx` reads `instance.status` and routes to `PostWorkshopSurface` when `status === "ended"` instead of `ParticipantRoomSurface`. Mode-gating (team vs participant) is orthogonal and still applies for the feedback triad language.

**Note:** No final copy in this phase. Placeholder English strings only — Phase 6 fills in bilingual copy after preview review.

### Phase 5 — Admin summary view

**Exit criteria:** `controlRoomSections` extended with `"summary"` at the end. Outline-rail renders new entry. `summary-section.tsx` component built with:
- Empty state when `status !== "ended"`: "Feedback summary appears here after the workshop ends."
- Aggregate view when `status === "ended"`: per-question card (using `ControlCard`), Likert bar pattern mirroring `run-section.tsx:417-453`, multi-choice percentages, open-text list. Testimonial question renders names only when `allow_quote_by_name === true`.
- Counter row: `submissions / participants-with-access`.
- Tailwind `print:` classes applied — hide rail + header, increase contrast.

Admin page.tsx loads the summary data in parallel with existing view-model. New helper in `workshop-store.ts`: `getFeedbackSubmissionsSummary(instanceId)` returns per-question aggregates.

### Phase 6 — Copy + preview artifacts

**Exit criteria (gated on user-reviewed preview artifacts):**
- HTML mockup of participant feedback surface (CS + EN, team mode + participant mode) reviewed by user.
- HTML mockup of admin summary view with print CSS applied reviewed by user.
- Copy table of all 9 default-template questions side-by-side CS + EN with Likert anchors and placeholders, annotated against voice rules 1, 2, 2b.
- User approves the copy table; any changes flow back into `getDefaultFeedbackTemplate()` in `workshop-data.ts`.
- All placeholder strings from Phase 4 replaced with the reviewed copy.
- CS + EN submission confirmation messages written to match workshop voice.
- Voice-rule regression guard: small script or test that scans the default template JSONB for forbidden words and fails if found.

### Phase 7 — Proof slice + memory update

**Exit criteria:**
- Proof slice run on today's hackathon (or the next live workshop): instance flipped to `ended`, code re-issued with 14-day expiry, distributed, ≥ 5 submissions collected.
- Admin summary screenshot captured; shared with leadership as the test.
- Any UX or voice issues surfaced in proof slice get a follow-up commit before the feature is announced for broader use.
- Memory file `feedback_participant_copy_voice.md` updated with any new voice rules discovered during Phase 6 (e.g. Likert-anchor voice conventions, submission-confirmation tone).
- Plan status updated to `complete`.

## Implementation Tasks

Tasks are dependency-ordered. Within a phase, order is recommended but some tasks can interleave.

### Phase 1 — Foundation

- [ ] **1.1** Create migration `dashboard/db/migrations/2026-04-21-workshop-feedback.sql`:
  - `ALTER TABLE workshop_instances ADD COLUMN IF NOT EXISTS feedback_form JSONB NULL;`
  - `CREATE TABLE IF NOT EXISTS workshop_feedback_submissions (id TEXT PRIMARY KEY, instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE, participant_id TEXT NULL, session_key TEXT NOT NULL, answers JSONB NOT NULL, allow_quote_by_name BOOLEAN NOT NULL DEFAULT FALSE, submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`
  - `CREATE UNIQUE INDEX workshop_feedback_submissions_instance_session_unique ON workshop_feedback_submissions(instance_id, session_key);`
  - `CREATE INDEX workshop_feedback_submissions_instance_submitted_idx ON workshop_feedback_submissions(instance_id, submitted_at DESC);`
- [ ] **1.2** Register `feedback_form` in `WorkshopInstanceColumnSupport`, probe `IN (...)` list, `mapInstanceRow`, `buildInstanceSelectList`, `buildCreateInstanceQuery`, `buildUpdateInstanceQuery` at `dashboard/lib/workshop-instance-repository.ts`.
- [ ] **1.3** Add `feedbackForm: FeedbackFormTemplate | null` to `WorkshopInstanceRecord` and `createWorkshopInstanceRecord` factory default (null).
- [ ] **1.4** Add `"ended"` to `WorkshopInstanceStatus` type in `workshop-data.ts`.
- [ ] **1.5** Define TS types in `dashboard/lib/runtime-contracts.ts`:
  - `FeedbackQuestion` tagged union: `"likert" | "stars" | "single-choice" | "multi-choice" | "open-text" | "checkbox"` with type-specific fields (scale, options, optional flag, prompt `{ cs, en }`).
  - `FeedbackAnswer` tagged union matching question types.
  - `FeedbackFormTemplate = { questions: FeedbackQuestion[] }`.
  - `FeedbackSubmissionRecord = { id, instanceId, participantId, sessionKey, answers: FeedbackAnswer[], allowQuoteByName, submittedAt }`.
- [ ] **1.6** Create `FeedbackSubmissionRepository` interface in `runtime-contracts.ts`: `list(instanceId)`, `listByParticipant(instanceId, sessionKey)`, `upsert(instanceId, submission, { allowEditWithinHours })`.
- [ ] **1.7** Implement `FileFeedbackSubmissionRepository` and `NeonFeedbackSubmissionRepository` in `dashboard/lib/feedback-submission-repository.ts`. Neon `upsert` uses `INSERT ... ON CONFLICT (instance_id, session_key) DO UPDATE SET answers = EXCLUDED.answers, allow_quote_by_name = EXCLUDED.allow_quote_by_name WHERE workshop_feedback_submissions.submitted_at > NOW() - INTERVAL '$1 hours'`. If the WHERE fails (lock window exceeded), surface as a specific error so the API can return 409.
- [ ] **1.8** Define `getDefaultFeedbackTemplate(lang)` helper in `workshop-data.ts` returning the 9-question default. Placeholder EN copy for now — Phase 6 replaces with reviewed bilingual copy.
- [ ] **1.9** Read-time normalization in `normalizeStoredWorkshopState` or instance loader: if `instance.feedbackForm` is `undefined`, treat as `null` → template resolver falls back to `getDefaultFeedbackTemplate()`.
- [ ] **1.10** Unit tests: migration round-trip (sample instance), repository upsert happy + 409 lock, default template resolver returns 9 questions.

### Phase 2 — Lifecycle action

- [ ] **2.1** Create `dashboard/app/admin/instances/[id]/_actions/lifecycle.ts` with `endWorkshopAction`. Mirrors `toggleWalkInsAction` shape: reads form data, `requireFacilitatorActionAccess`, loads instance, writes `status: "ended"` via `repository.updateInstance`, audit log entry `action: "instance_ended"` with `metadata: { previousStatus }`.
- [ ] **2.2** Add `EndWorkshopPanel` to `settings-section.tsx` near archive + reset. Confirmation UX: `<details>` with helper text + "type instance id to confirm" text input, mirrors `resetWorkshopAction`. Disable button when already `status === "ended"` (show status label instead).
- [ ] **2.3** Extend `adminCopy` in `ui-language.ts` with CS + EN copy for the panel (eyebrow, title, description, confirm-prompt, confirm-label, already-ended hint).
- [ ] **2.4** Wire the new prop through `page.tsx` if needed (probably just passes `vm.selectedInstance?.status`).
- [ ] **2.5** Tests: action writes correct status, audit entry present, refuses when confirmation text doesn't match, idempotent when already ended.

### Phase 3 — Event-code expiration choice

- [ ] **3.1** Extend `issueParticipantAccessAction` in `_actions/access.ts` to read `expiresInDays` from form data (string, parse to number, default 14). Compute `expiresAt: Date.now() + expiresInDays * 86400000`. Pass to `issueParticipantEventAccess`.
- [ ] **3.2** Add `<select name="expiresInDays">` with options `1`, `7`, `14` (selected), `30`, and a custom-text-input fallback when "custom" is chosen. Helper text below.
- [ ] **3.3** Extend `adminCopy` with expiration labels (CS + EN): "1 day", "1 week", "2 weeks", "1 month", "custom".
- [ ] **3.4** Tests: form submits with default (14-day), with custom value, validates boundaries (1–365).

### Phase 4 — Participant-side plumbing

- [ ] **4.1** Create route `dashboard/app/api/participant/feedback-submission/route.ts`. `POST` handler. Validate session. Load instance, check `status === "ended"` (reject 404 otherwise — "feedback not yet open" or "workshop not ended"). Check `feedback_open_at` implicit via status. Load active template (override or default). Validate body answers against template. Call `repository.upsert` with 24h window. Return 200 / 409 / 400 as appropriate.
- [ ] **4.2** Add helper `getEffectiveFeedbackTemplate(instance, lang)` — returns `instance.feedbackForm ?? getDefaultFeedbackTemplate(lang)`.
- [ ] **4.3** Create scaffold `PostWorkshopSurface` component at `dashboard/app/components/post-workshop-surface.tsx`. Structural only; hardcoded placeholder EN copy. Sections: header ("Workshop ended" placeholder), resources (reuse `referenceGroups` builder), feedback form (generic renderer per question type), confirmation state. No final styling — just enough to confirm the wiring works.
- [ ] **4.4** Create `FeedbackFormRenderer` client component. Props: `template: FeedbackFormTemplate`, `existingSubmission?: FeedbackSubmissionRecord`, `lang: UiLanguage`. Renders each question type. Submit posts to `/api/participant/feedback-submission`. Handles 409 (show lock message), 400 (show validation error), 200 (swap to confirmation state).
- [ ] **4.5** Branch `participant/page.tsx` on `instance.status`:
  - `"ended"` → render `PostWorkshopSurface`.
  - anything else → existing `ParticipantRoomSurface`.
- [ ] **4.6** Pre-populate existing answers for the 24h edit window. Server-side: fetch submission by `(instanceId, sessionKey)` at page load; pass as prop.
- [ ] **4.7** Unit + integration tests: POST with valid/invalid body, lock-window behavior, GET own submission, page routes correctly based on status.

### Phase 5 — Admin summary view

- [ ] **5.1** Extend `controlRoomSections` in `admin-page-view-model.ts` with `"summary"`. Update related route mapping.
- [ ] **5.2** Add summary rail entry in `outline-rail.tsx` with `copyKey: "navSummary"`. Extend `adminCopy` with `navSummary`.
- [ ] **5.3** Create `dashboard/app/admin/instances/[id]/_components/sections/summary-section.tsx`:
  - Empty state when `status !== "ended"`.
  - When `"ended"`: per-question card grid. Likert → horizontal bar + count + average. Stars → same. Single/multi-choice → percentage bar per option. Open-text → list of responses with optional attribution (testimonial question respects consent).
  - Counter: `{submissions.length} of {participantsWithAccessCount} responded`.
- [ ] **5.4** Add `getFeedbackSubmissionsSummary(instanceId)` in `workshop-store.ts`. Shape: `{ submissions: FeedbackSubmissionRecord[], totalResponses: number, perQuestion: Array<{ questionId, type, ... aggregates }> }`. Computed at read time.
- [ ] **5.5** Wire summary section into `admin/instances/[id]/page.tsx`. Pass `instance.status` and loaded summary data.
- [ ] **5.6** Add `print:` Tailwind classes to `summary-section.tsx` and parent layout: hide `OutlineRail` and `ControlRoomCockpit` in print, increase font size, remove decorative gradients.
- [ ] **5.7** Testimonial-consent regression test: submission with `allow_quote_by_name === false` must not render participant name in summary output.
- [ ] **5.8** Snapshot test for summary rendering with 5 mock submissions covering all question types.

### Phase 6 — Copy + preview artifacts

**This phase has a preview gate — user must review mockups + copy table before any code merges.**

- [ ] **6.1** Generate HTML mockup of participant feedback surface in CS and EN, both team-mode and participant-mode variants. Static file `docs/previews/2026-04-21-feedback-surface-{mode}-{lang}.html`.
- [ ] **6.2** Generate HTML mockup of admin summary view. Include print-preview variant (media print simulation). Static file `docs/previews/2026-04-21-feedback-summary.html`.
- [ ] **6.3** Write copy table in `docs/previews/2026-04-21-feedback-copy-table.md`: 9 questions × CS + EN × annotations referencing voice rules 1, 2, 2b.
- [ ] **6.4** User review. Feedback loops here. Changes incorporated back to mockups + copy table.
- [ ] **6.5** Update `getDefaultFeedbackTemplate()` in `workshop-data.ts` with the approved copy. Delete placeholder strings from Phase 4.
- [ ] **6.6** Update `PostWorkshopSurface` with final CS + EN copy (reading from the template via current `workshop_meta.contentLang`).
- [ ] **6.7** Update admin `summary-section.tsx` with final CS + EN labels, aggregates, and print styles.
- [ ] **6.8** Write voice-rule lint: small script at `scripts/content/verify-feedback-voice.ts` (or extend `verify-copy-editor.ts`) that scans the default template for forbidden words (`tým`, `parťák`, `team`, `teammate`, `your team`, `survives`, `rescue`, etc.) conditionally on mode. Fails build when forbidden word appears in wrong context.
- [ ] **6.9** Extend memory file `feedback_participant_copy_voice.md` with feedback-form-specific voice notes if any new rules surface during review.

### Phase 7 — Proof slice + memory update

- [ ] **7.1** Run proof slice on today's hackathon instance (or next live workshop): flip `running` → `ended` via new admin action; re-issue event code with 14-day expiry; distribute out-of-band; wait for responses.
- [ ] **7.2** Collect ≥ 5 submissions. Screenshot admin summary. Confirm no voice-rule violations in rendered copy.
- [ ] **7.3** Any issues surfaced in proof slice become follow-up commits (do NOT declare Phase 7 done until the proof slice is clean).
- [ ] **7.4** Update `docs/plans/2026-04-21-feat-post-workshop-feedback-plan.md` frontmatter `status: complete` with a log of shipped commits.
- [ ] **7.5** Memory file update confirmed (from 6.9).
- [ ] **7.6** Optional: write a compound note at `docs/solutions/workshop/post-workshop-feedback-ship.md` capturing any novel patterns for reuse.

## Acceptance Criteria

Ship is acceptable when ALL are true:

- [ ] `workshop_instances.feedback_form` column exists; `workshop_feedback_submissions` table exists with unique `(instance_id, session_key)` + `submitted_at` index.
- [ ] Column-support probe recognizes `feedback_form`; read-time normalization handles instances without the column.
- [ ] `"ended"` added to `WorkshopInstanceStatus`; admin `endWorkshopAction` sets status correctly; audit log entry present; one-way in v1.
- [ ] Event-code re-issue admin form exposes expiration choice with 14-day default.
- [ ] `POST /api/participant/feedback-submission` accepts valid submissions (200), rejects invalid body (400), rejects post-lock-window resubmit (409), rejects when instance is not `"ended"` (404).
- [ ] Participant `/participant` page renders `PostWorkshopSurface` when `status === "ended"`, else `ParticipantRoomSurface`.
- [ ] Admin `summary` section renders empty state pre-ended, aggregate view post-ended.
- [ ] Testimonial question renders participant name only when `allow_quote_by_name === true`.
- [ ] Default feedback template has 9 questions in CS + EN, matching the proof-slice copy table.
- [ ] Voice-rule lint passes: no forbidden team words in participant-mode default template copy; no rescue motif in any copy.
- [ ] Print-friendly CSS hides admin chrome; summary is readable at screenshot size.
- [ ] Proof slice: ≥ 5 real submissions collected on a live instance; screenshot of admin summary captured; no issues surfaced that block opening the feature broadly.
- [ ] Memory file `feedback_participant_copy_voice.md` updated if any new voice rules surfaced.

## References

- **Brainstorm:** `docs/brainstorms/2026-04-21-post-workshop-feedback-brainstorm.md`
- **Related shipped feature (patterns):** `docs/plans/2026-04-21-feat-optional-team-mode-plan.md` (team-mode toggle). Commits `e34fc7a` through `b70c054` on `main`. Particularly:
  - Per-instance boolean column + column-support probe pattern.
  - `requireParticipantScopedWrite` participant-mode auth helper.
  - Prop-drilled flag → inline UI guards pattern.
  - Mode-aware content generation (if any copy needs to vary by team vs participant mode within the feedback form itself).
- **Reference implementation for aggregate UI:** `dashboard/app/admin/instances/[id]/_components/sections/run-section.tsx:417-453` (poll summary bars).
- **Reference implementation for per-instance JSONB override:** `workshop_meta` on `workshop_instances` — see `workshop-data.ts:818-832` and construction in `workshop-store.ts:1413`.
- **Reference implementation for admin boolean toggle + form + action:** `toggleTeamModeAction` + `access-section.tsx` + `_actions/workshop-mode.ts` (shipped commit `e34fc7a`).
- **Schema-drift tolerance:** `docs/solutions/infrastructure/facilitator-admin-production-state-and-schema-drift.md` — read-time normalization rule.
- **Voice rules:** memory `feedback_participant_copy_voice.md` Rules 1, 2, 2b; repo `docs/reviews/workshop-content/2026-04-20-participant-moments-opening.md`.
- **Event-access internals:** `dashboard/lib/participant-access-management.ts` (`issueParticipantEventAccess` signature with `expiresAt`).
- **Neon Auth participant authenticate:** `dashboard/app/api/event-access/identify/authenticate/route.ts`.
