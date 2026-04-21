---
title: "Post-workshop phase and participant feedback form"
type: brainstorm
date: 2026-04-21
participants: [Ondrej, Heart of Gold]
related:
  - docs/brainstorms/2026-04-21-optional-team-mode-brainstorm.md
  - docs/plans/2026-04-21-feat-optional-team-mode-plan.md
  - docs/solutions/infrastructure/facilitator-admin-production-state-and-schema-drift.md
  - memory: feedback_participant_copy_voice (Rules 1, 2, 2b)
---

# Post-workshop phase and participant feedback form

## Problem Statement

Workshops end and the learnings walk out of the room with the participants. Today there's no structured way to capture what worked, what didn't, and what participants are taking with them. The facilitator also has no shareable artifact to send to leadership / organizers summarizing how it went. A single hackathon today validated the felt need — the participant-only experience worked, but the end-of-workshop moment was purely in-session verbal reflection, with nothing captured for the next workshop or for reporting.

We need a **post-workshop phase** the facilitator can flip the instance into. When flipped, the participant surface pivots from agenda-focused to **resources-first with a feedback form** — a short, warm, structured questionnaire covering improvement feedback, light testimonial capture, and a takeaway reflection. The facilitator sees an aggregate summary + individual responses usable for leadership reporting.

**Primary audience / purpose stack:**
1. **Improvement feedback** — actionable input for the facilitator, comparable across workshops.
2. **Leadership / organizer reporting** — shareable summary (screenshot or print-friendly admin view) to send to the company or client behind the workshop.
3. **Light testimonial capture** — opt-in quotable responses for marketing / social proof.
4. *(Skip — already done in-session)* Participant closure and reflection.

## Context

### What exists today

- **`participant_feedback` table** (migration `2026-04-20-participant-feedback-and-polls.sql`): append-only rows for mid-workshop blockers/questions, `kind` discriminator (`blocker | question`), nullable `participant_id + session_key` attribution, single-message per row. Semantically different from a post-workshop form — mixing them would pollute the mid-session feed. **Not reused; separate storage.**
- **`participant_poll_responses` table + `workshop_state.liveMoment.poll` definition**: one-active-poll-at-a-time, poll definition embedded in state JSONB, unique `(instance_id, poll_id, session_key)` with upsert, aggregate-count summary (`getActivePollSummary`) rendered in admin. **Summary shape reusable for feedback aggregates; definition-in-state pattern not a fit for a 5–10-question form.**
- **`WorkshopInstanceStatus`** enum: `"created" | "prepared" | "running" | "archived" | "removed"`. Only `created` and `prepared` are currently written by any code path. `running` / `archived` / `removed` are dormant values. Adding a new `ended` status is clean; nobody is using the enum actively.
- **`archiveWorkshopAction`**: snapshots state + checkpoints + sessions into an `instance_archives` table with 30-day retention. Does **not** change `status`. Useful as a snapshot mechanism at end-of-workshop, but orthogonal to the lifecycle transition.
- **Participant session durability**: 12h sliding window + 16h absolute cap. Returning days later requires a fresh event-code session. Neon-Auth'd participants (those who set a password) can re-authenticate permanently via `POST /api/event-access/identify/authenticate` once they have a valid event-code session. Walk-ins without passwords cannot return — **accepted v1 limitation.**
- **Workshop-content override pattern**: the whole `workshop_state` JSONB on `workshop_instances` is mutable per instance; the per-instance `workshop_meta` JSONB is the analog for metadata. There is **no separate overrides table** today; JSONB-on-instance is the established pattern.
- **No export pattern exists** anywhere in the codebase. All admin reports are screen-only.

### Voice & copy constraints

Participant-facing copy (including feedback form prompts and submission confirmations) must follow the rules in `feedback_participant_copy_voice.md`:
- **Rule 1** (defocus rescue/survives motif — no `přežije bez záchrany` / `survives without rescue`).
- **Rule 2 / 2b** (name the triad; participant-mode triad when `team_mode_enabled = false`: CS `další účastník, člověk nebo agent` / EN `another participant, teammate, or agent`).

The feedback surface is participant-facing, so both apply. Form tone must match the warm, reflective voice already established on the participant surface — not clinical HR-survey voice.

### Related work

Just-shipped optional-team-mode feature (commits `e34fc7a` through `b70c054` on `main`) establishes:
- The pattern for per-instance boolean toggles on `workshop_instances` (mirroring `allow_walk_ins` and the new `team_mode_enabled`).
- The pattern for instance-mode-driven participant UI branching (prop-drilled flag → inline guards).
- The `createWorkshopArchive` snapshot flow.
- Schema-drift tolerance (read-time normalization, column-support probe).

The feedback feature reuses these patterns and adds a lifecycle-status transition beyond them.

## Chosen Approach

Three-axis design, decided:

### Axis A — Lifecycle: new `ended` status

Add `"ended"` to `WorkshopInstanceStatus`. Facilitator explicitly transitions via `endWorkshopAction` (single server action). Transition is **opt-in** and, for v1, **one-way** — no reverse transition back to `running`.

Semantically: `prepared → running → ended → archived`. The `ended` phase is the post-workshop window where feedback is open and participants can still come back to the surface.

### Axis B — Storage

- **`workshop_instances.feedback_form JSONB`** — per-instance override of the question template. Mirrors the `workshop_meta` pattern. Nullable; when NULL the system uses the global default template. Per-instance editing in v1 is **hand-edit JSONB in DB**, not an admin UI (see v2 notes).
- **New table `workshop_feedback_submissions`** — one row per participant-submission. Columns: `id`, `instance_id`, `participant_id` (nullable), `session_key`, `answers JSONB` (array of tagged answers), `allow_quote_by_name BOOLEAN`, `submitted_at`. Unique constraint on `(instance_id, session_key)` — one submission per participant per instance (upsert on resubmit, or prevent with 409; decided during `/plan`).

The question-template JSONB shape:
```json
{
  "questions": [
    { "id": "overall",     "type": "likert",        "scale": 5, "prompt": { "cs": "...", "en": "..." } },
    { "id": "theme",       "type": "likert",        "scale": 5, "prompt": { "cs": "...", "en": "..." } },
    { "id": "facilitation","type": "likert",        "scale": 5, "prompt": { "cs": "...", "en": "..." } },
    { "id": "takeaway",    "type": "open-text",                 "prompt": { "cs": "...", "en": "..." } },
    { "id": "valuable",    "type": "open-text",                 "prompt": { "cs": "...", "en": "..." } },
    { "id": "better",      "type": "open-text",                 "prompt": { "cs": "...", "en": "..." } },
    { "id": "recommend",   "type": "single-choice", "options": [{ "id": "yes", ... }, ...], "prompt": {...} },
    { "id": "testimonial", "type": "open-text",     "optional": true,                       "prompt": {...} },
    { "id": "quote-ok",    "type": "checkbox",                                              "prompt": {...} }
  ]
}
```

The `answers` JSONB on a submission is a tagged union per answer:
```json
{
  "answers": [
    { "questionId": "overall",     "type": "likert",        "value": 4 },
    { "questionId": "recommend",   "type": "single-choice", "optionId": "yes" },
    { "questionId": "takeaway",    "type": "open-text",     "text": "..." }
  ]
}
```

### Axis C — Retroactivity

Facilitator **re-issues the event code** with an **explicit expiration choice** (dropdown / date picker: 1 day, 7 days, 14 days, 30 days, custom) — 14 days is the default option. Existing `issueParticipantAccessAction` already handles this; we're extending the UI to expose the expiration choice explicitly rather than relying on backend defaults.

Returning participants enter the code → get a fresh event-code session → Neon Auth signs them in with their saved password → land on the feedback surface. No new auth code. Walk-ins who never set a password remain unreachable after session expiry — accepted limitation.

**Notification out-of-band.** The facilitator shares "please come back and leave feedback at [URL with code]" via Slack / email / their own channel. No in-app notification system in v1.

## Why This Approach

**A1 over A2/A3.** A new `ended` status matches the mental model the user described ("when the workshop ends I put it into some stage"). A2 (reuse `archived`) conflates the data-retention snapshot with the feedback-open phase, which will haunt the codebase later. A3 (pure flag) ships slightly faster but loses the lifecycle shape — every piece of UI has to derive "is this workshop done?" from flag presence, and the status enum stays decorative.

**B1 over B2/B3.** The `feedback_form JSONB` column mirrors `workshop_meta` — the established override pattern. A dedicated `workshop_feedback_submissions` table keeps form responses semantically separated from mid-workshop `participant_feedback` rows and allows the unique-per-participant constraint to sit at the DB level. B2 (embed in `workshop_state`) risks losing the form definition when state is reset during archive. B3 (fully normalized question/option/answer tables) is over-engineered for 5–10 static questions per instance.

**C1 over C2.** Reusing the existing event-code re-issue flow is zero new auth code. C2 (per-participant magic links, skip event-code) is more polished but builds a new authentication path and requires participant email capture. Defer to v2 if/when demand appears.

**Global default + hand-edit override in v1, authoring UI in v2.** Ships dramatically faster. You learn whether per-workshop edits are actually needed before building a UI for them. The global default is designed to be broadly useful (see template below); per-instance edits for the first few workshops can be a DB-level tweak from the facilitator or Claude Code session.

## Subjective Contract

### Target outcome
A participant sees a warm, short, focused feedback surface after the workshop ends. They can finish it in under 3 minutes. The copy feels like a continuation of the workshop voice, not an HR survey. The facilitator opens the admin view the next morning and sees exactly what to change for the next workshop — aggregate Likert scores, multiple-choice counts, and readable open-text responses. They screenshot the aggregate view and share with leadership without editing.

### Anti-goals
- No corporate / HR-survey voice. No "please rate your satisfaction on a 1–10 scale."
- No mandatory / punitive framing ("you must complete this before leaving").
- No form that takes more than 5 minutes.
- No dark patterns for testimonial extraction — the testimonial question is clearly opt-in.
- No forbidden team words in participant-mode instances (CS `tým` / `parťák` / EN `team` / `teammate` / `your team` fail the rule; see anti-references).
- No new client-side state machine where simpler server-driven rendering would do.

### References
- Existing participant surface tone: `participant-room-surface.tsx` copy object (`getParticipantSurfaceCopy`). Warm, 2nd-person, specific.
- `allow_walk_ins` toggle pattern for per-instance boolean + admin form (`access-section.tsx` + `access.ts`).
- `team_mode_enabled` (just shipped, `access-section.tsx` lines 150-220ish) — newest example of the same pattern.
- `workshop_meta` JSONB override pattern for per-instance content overrides.

### Anti-references
- HR feedback tool aesthetic (SurveyMonkey, Typeform with progress bars and forced steps).
- `participant_feedback` table semantics — do **not** store feedback submissions there.
- Poll definition embedded in `workshop_state` — do **not** store the feedback template there.
- Per-question localized override tables — keep language as a field inside the prompt JSONB (`{ cs, en }`).

### Tone / taste rules
- **Voice rules 1, 2, 2b apply**: no rescue motif; name the triad correctly; participant-mode triad when `team_mode_enabled = false`.
- **Bilingual**: every `prompt`, placeholder, submit-button label, success/error message must exist in both CS and EN. The instance's `workshop_meta.contentLang` selects at render time.
- **Likert anchors**: label the endpoints (e.g. CS `vůbec` / `výborně` — TBD during plan). Don't leave the scale as bare numbers.
- **Open-text placeholders**: concrete prompts, not "Enter your feedback here." For takeaway: `Jedna věta, která vám zůstane.` / `One sentence that stays with you.`
- **Testimonial opt-in**: the quote-by-name checkbox defaults to **unchecked**. Explicit opt-in per GDPR and voice.
- **Submission confirmation**: warm, short, final. Not "Your response has been recorded."

### Rejection criteria
- Any `tým` / `team` / `teammate` / `parťák` leaks in participant-mode instance copy.
- The form renders but stores to the wrong table (e.g. accidentally writing to `participant_feedback`).
- A participant can submit multiple times by accident (unique constraint missing or bypassed).
- The `ended` status is writeable by non-facilitator roles.
- Testimonial consent checkbox defaults to checked.
- The aggregate summary shows individual identifying info when a participant opted for anonymous quoting — leaks name against consent.
- Retroactive access fails for a Neon-Auth'd participant with a valid re-issued code (proof-slice failure).

## Preview And Proof Slice

### Proof slice
End today's hackathon (or the next one — whichever ships first with the plan). Concretely:
1. Facilitator flips the instance from `running` to `ended` via admin UI.
2. Facilitator re-issues the event code with 14-day expiration.
3. Facilitator shares the URL + code with participants out-of-band (Slack / email).
4. At least 5 participants return, sign in, complete the feedback form.
5. Facilitator opens the admin summary view; screenshots it; sends to leadership.

Success = ≥5 submissions collected, CS and EN both render cleanly, admin summary readable at a glance, no team language leaks in participant mode.

### Required preview artifacts (before autonomous `/work` on UI)
- **HTML mockup of participant feedback surface** in CS and EN, team mode and participant mode.
- **HTML mockup of admin summary view** — aggregate Likert bars, multi-choice percentages, open-text list, print-friendly CSS applied.
- **Copy table**: the full default-template questions in CS and EN, side-by-side, with anchor labels and placeholders. Reviewed against voice rules before implementation.

### Rollout rule
- v1 ships behind the lifecycle transition (feature is invisible until facilitator flips an instance to `ended`).
- First real use = proof slice above.
- If the proof slice surfaces voice or UX issues, iterate on the mockup / copy in a follow-up commit before opening the feature to more workshops.
- Authoring UI (v2) does not ship until at least 3 workshops have completed feedback cycles and a real need to edit per-instance questions has emerged.

## Key Design Decisions

### D1: Purpose stack — RESOLVED
**Decision:** Primary = improvement feedback; Secondary = leadership / organizer reporting; Tertiary = light testimonial capture; Skip = participant closure (done in-session).
**Rationale:** User's own words; also drives form length (short, not reflective), voice (warm but actionable), and summary view priorities (aggregate Likert + readable quotes, not individual reflection narratives).
**Alternatives considered:** (2) Testimonials-primary — rejected, would push toward long signed forms and marketing curation workflow. (3) Closure-primary — rejected, user explicitly said closure is handled in-session. (4) All-three-equal — rejected in Phase 1 because it produces a form that serves none well.

### D2: Timing — feedback opens on lifecycle flip — RESOLVED
**Decision:** Entering the `ended` phase auto-opens feedback. No separate "open feedback" toggle in v1.
**Rationale:** Matches user's mental model ("put it into some stage"). Simplest model for v1. Flexibility to open feedback earlier (pre-lifecycle) can be added as a separate flag later if needed.
**Alternatives considered:** (ii) Orthogonal toggle — rejected, adds an axis without clear v1 need. (iii) Both — rejected, premature flexibility.

### D3: Retroactivity — RESOLVED
**Decision:** v1 uses existing event-code re-issue with explicit expiration choice (1 / 7 / 14 / 30 days / custom; 14-day default). Facilitator distributes out-of-band.
**Rationale:** Zero new auth code. Participants with Neon-Auth'd passwords can return; walk-ins without passwords cannot (accepted limitation).
**Alternatives considered:** (2) Per-participant magic links — rejected, builds a new auth path. Defer to v2.

### D4: Authoring model — RESOLVED
**Decision:** Global default template baked in + per-instance `feedback_form JSONB` override on `workshop_instances`. v1 authoring = edit JSONB in DB for the first workshops. Admin UI for authoring is deferred to v2.
**Rationale:** Ships fast. Lets the user learn whether per-workshop editing is actually needed before building a UI. Matches the established override pattern (`workshop_meta`).
**Alternatives considered:** (1) Global only — rejected, user explicitly wants override capability. (2) Per-instance only with full UI in v1 — rejected, too much scope for the first pass.

### D5: Lifecycle — new `ended` status — RESOLVED
**Decision:** Add `"ended"` to `WorkshopInstanceStatus`. Transition via explicit `endWorkshopAction`. One-way in v1 (no reverse transition).
**Rationale:** Clean lifecycle shape. Enum currently has dead values (`running` / `archived` / `removed`); adding `ended` doesn't conflict with any live code path.
**Alternatives considered:** (A2) Reuse `archived` — rejected, conflates snapshot-for-retention with feedback-open-phase. (A3) Pure `feedback_open_at` timestamp flag — rejected, loses lifecycle shape.

### D6: Storage shape — RESOLVED
**Decision:** New `workshop_instances.feedback_form JSONB` column (nullable; global default used when NULL) + new `workshop_feedback_submissions` table (one row per submission, `answers JSONB` tagged union, unique on `(instance_id, session_key)`).
**Rationale:** Separates form submissions from mid-workshop `participant_feedback`; keeps template and submissions cleanly decoupled; matches the established `workshop_meta` JSONB pattern for per-instance overrides.
**Alternatives considered:** (B2) Embed form in `workshop_state` — rejected, state is mutable and can be reset. (B3) Fully normalized tables — rejected, overkill for 5–10 static questions.

### D7: Question type schema — RESOLVED
**Decision:** Tagged union of five types: `likert` (1–5 or 1–7 scale with optional anchors), `stars` (1–5), `single-choice` (radio), `multi-choice` (checkboxes), `open-text` (textarea, optional flag), plus `checkbox` (single boolean) for the quote-consent pattern.
**Rationale:** Covers the user's stated needs. Tagged union enables type-safe rendering + type-safe answer storage in the JSONB blob.
**Alternatives considered:** Single generic "field" type with string value — rejected, loses type safety and admin-summary rendering has to pattern-match at runtime.

### D8: Default template — RESOLVED (draft)
**Decision:** 9 questions in this order:
1. `[likert 1-5]` Overall, how was the workshop?
2. `[likert 1-5]` How well did the theme land?
3. `[likert 1-5]` How was the facilitation?
4. `[open-text]` One thing you're taking with you from today?
5. `[open-text]` What was the most valuable part?
6. `[open-text]` What could be better?
7. `[single-choice]` Would you recommend this to a colleague? (yes / maybe / no)
8. `[open-text, optional]` A sentence or two we could quote as a testimonial.
9. `[checkbox]` You can quote me by name in marketing materials. (Default: unchecked.)

**Rationale:** Stack order places quantitative up-front (low friction), qualitative flows specific-to-general (takeaway → valuable → better), then recommendation + opt-in testimonial + consent. Covers primary purpose (questions 1–7) and secondary/tertiary (questions 8–9) without making them feel mandatory.
**Alternatives considered:** Fewer questions (5) — rejected, user said 5–10 and the takeaway question adds meaningful signal distinct from most-valuable-part. More questions (15+) — rejected, abandonment risk and anti-goal violation.

**Open:** Likert anchors (endpoint labels) in CS and EN, placeholder text for each open-text question, and exact single-choice labels — all captured in the copy table preview artifact before implementation.

### D9: Leadership reporting v1 — RESOLVED
**Decision:** Screen-only admin aggregate view with print-friendly CSS for clean screenshots. No PDF / CSV export in v1.
**Rationale:** No existing export pattern in the codebase; adding one is its own scope. Screenshots + URL-sharing cover the real need for the first few workshops. CSV can ship as a small follow-up if leadership actually asks for it.
**Alternatives considered:** CSV in v1 — rejected, scope-creep for a proof-slice ship. PDF in v1 — rejected, same reason plus PDF generation libs are another dependency.

### D10: Admin summary shape — RESOLVED (high-level)
**Decision:** Per-question aggregate card:
- **Likert / stars:** horizontal bar per value + average + n.
- **Single-choice / multi-choice:** percentage bar per option + raw count.
- **Open-text:** list of responses, one per card, with participant name when attribution is available AND (for the testimonial question) when `allow_quote_by_name = true`. Otherwise anonymized or shown without attribution depending on question type.
- **Totals:** submission count, submission rate (`submissions / issued-codes-redeemed` if we can compute).

**Rationale:** Mirrors the existing `ActivePollSummary` shape per question, extended for new types. Print-friendly by default (no hover states, no interactive filtering required for the print view).

## Open Questions

- **Exact expiration-choice UI**: dropdown vs date picker vs both. Lean: dropdown with `1 day / 7 days / 14 days / 30 days / custom...` — resolve during `/plan`.
- **Submission idempotency**: allow resubmit (overwrites previous answers) vs block with 409 "you've already submitted". Lean: **allow resubmit** for the first N hours after first submission, then lock. Resolve during `/plan` based on schema design.
- **Live transition moment**: when the facilitator flips a running workshop to `ended`, what do participants with open tabs see? Auto-refresh via a polling hook (already exists — `ParticipantLiveRefresh`), or hard-reload prompt? Resolve during `/plan`.
- **"Ended" → "archived" transition**: is there a separate admin action for archiving after feedback window closes, or does the existing `archiveWorkshopAction` still run at any point in the lifecycle? Lean: **existing archive runs at any point**; `ended → archived` is optional and out of scope for v1.
- **Default template localization**: baked-in defaults in both CS and EN from day one, or EN-first with CS following? Lean: **both from day one** — every workshop must be runnable in CS.
- **Walk-in without password**: should the facilitator see a separate "unreachable participants" count in the summary view (`N participants could not be surveyed`)? Lean: **yes, small counter** for honesty in leadership reports. Resolve during `/plan`.
- **Event code extension vs re-issue**: the existing `issueParticipantAccessAction` might re-issue (new code) or extend (same code, later expiry). Resolve during `/plan` — may need a new "extend" path if re-issue invalidates old code.
- **Admin summary URL shareability**: the admin route is facilitator-auth-gated. For leadership to see a URL, either (a) leadership gets a facilitator-observer grant (exists today), or (b) we add a public-ish summary URL with a secret token. Lean: **(a) in v1**, leadership gets observer role. Resolve during `/plan`.

## Out of Scope

- **Admin authoring UI** for editing the feedback template per instance (v2).
- **PDF / CSV / Excel export** of feedback data (v2, only if leadership asks for it).
- **Per-participant magic link** retroactive access path (v2, only if the event-code re-issue flow is too clunky in practice).
- **Testimonial curation workflow** (selecting which testimonials to publish, editing them, attaching to case studies) — use the opt-in `allow_quote_by_name` flag as is; curation lives outside the app for now.
- **Automatic notification** to participants when the workshop transitions to `ended` — facilitator handles out-of-band.
- **Scheduled reminders** for participants who haven't submitted.
- **Response editing after final submission lock** (if we implement a lock window).
- **Question-level branching / logic** (e.g. "if rating < 3, ask why"). Keep the form flat for v1.
- **Multi-submission from the same participant** across workshops for longitudinal analysis.
- **Automatic `ended → archived` transition** after N days of inactivity.
- **Backfill of the feedback form onto past workshops** beyond today's hackathon (too much state to reconstruct).

## Assumption Audit

| # | Assumption | Classification | Resolution |
|---|---|---|---|
| 1 | Per-instance feedback-form editing via **admin UI** is NOT needed in v1 | Unverified | User confirmed — defer UI to v2. |
| 2 | 14-day event-code expiration is safe | Weak | Accepted with explicit facilitator choice (dropdown); 14-day is default, not forced. |
| 3 | Screen-only leadership reporting (no export) is acceptable v1 | Unverified | Accepted; CSV export is a small v2 follow-up if asked. |
| 4 | 9 questions won't cause abandonment | Bedrock-ish | Industry standard for short feedback forms. Proof slice will validate. |
| 5 | Walk-in participants without passwords are acceptable casualties | Bedrock | Accepted in the optional-team-mode brainstorm lineage; same here. |
| 6 | One-way `running → ended` transition is fine v1 (no revert) | Weak | Accepted; if a real need to revert emerges, add an `unendWorkshopAction` as a small follow-up. |
| 7 | The existing `issueParticipantAccessAction` can be extended to expose expiration choice cleanly | Unverified | Flagged as an open question; resolve during `/plan`. Low risk — worst case we add a sibling action. |

## Next Steps

- **`/plan`** to turn these decisions into an implementation plan. Expected scope:
  - Migration: add `feedback_form JSONB NULL` to `workshop_instances`; add `"ended"` to status enum (TS-only, DB is `TEXT` so no enum migration needed); new `workshop_feedback_submissions` table with the unique constraint; column-support probe update.
  - TS types: `FeedbackFormTemplate`, `FeedbackQuestion` (tagged union), `FeedbackAnswer` (tagged union), `FeedbackSubmissionRecord`. Global default template in CS + EN baked in.
  - Server action: `endWorkshopAction` — writes `status = "ended"`, audit log entry, optional archive snapshot. Plus extended `issueParticipantAccessAction` with expiration choice.
  - New route: `POST /api/participant/feedback-submission` — participant-scoped auth (reuses `requireParticipantScopedWrite` from optional-team-mode Phase 3), idempotent upsert on `(instance_id, session_key)`.
  - Participant UI: new `PostWorkshopSurface` rendered when `instance.status === "ended"`. Resources-first (reuse existing reference section) + feedback form. Team-mode still applies orthogonally.
  - Admin UI: new section or extension of `settings-section` with `endWorkshopAction` form and expiration-choice dropdown for event-code re-issue. New admin summary view (per-question aggregate) with print-friendly CSS.
  - Copy: CS + EN defaults for all 9 questions including Likert anchors and placeholders, reviewed against voice rules. Preview artifact (copy table) required before implementation.
  - Tests: unit coverage for submission write path + uniqueness + idempotency; integration test for the `ended` transition; snapshot tests for the summary view.
- **Preview artifacts** (required before autonomous work on UI): HTML mockup of participant feedback surface (CS + EN), HTML mockup of admin summary view with print CSS applied, copy table for all 9 questions side-by-side CS/EN.
- **`/compound` candidate**: the lifecycle-status transition pattern (`endWorkshopAction`) is the first real one in this codebase. If it ships clean, document as a reusable pattern for future lifecycle actions (e.g. `archiveWorkshopAction` status integration, future `unendWorkshopAction`).
- **Memory update** (when feature ships): extend `feedback_participant_copy_voice.md` with feedback-form-specific voice notes (Likert anchor voice, placeholder tone, submission-confirmation voice).
