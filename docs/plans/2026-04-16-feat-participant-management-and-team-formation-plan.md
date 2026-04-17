---
title: "feat: participant management and team formation"
type: plan
date: 2026-04-16
status: complete_through_phase_5
brainstorm: docs/brainstorms/2026-04-16-harness-lab-product-shape-and-participant-management-brainstorm.md
confidence: medium
---

# Participant Management and Team Formation

**One-line summary:** Introduce a first-class `Participant` entity (name + optional email + optional tag) with a unified pool that handles both pre-loaded rosters and walk-ins, wire facilitator team-formation UI (manual + cross-level randomize), and add opt-in retention-signal capture — shipped before the 2026-04-23 hackathon as the proof slice for harness-lab's product shape.

## Problem Statement

Today the dashboard has a `teams` table with `members: string[]` (free-text names in a JSONB payload) and anonymous participant sessions with no identity. Facilitators running a hackathon currently type comma-separated names into a single input — no roster concept, no walk-in intake, no team-formation UX, no way to reach a participant 14 days later to measure whether the workshop actually changed how they work.

This blocks three things:

1. **Live operations.** Forming cross-level teams on the spot during the intro exercise is manual and error-prone.
2. **The brainstorm's proof slice.** The chosen product shape ("opinionated cockpit for live agent-native hackathons") can't credibly ship without a named-participant layer.
3. **The outcome claim.** The core unverified assumption — "engineering-not-vibe-coding mindset is learnable in one day" — is unmeasurable without any post-event channel to the human who attended.

## Target End State

When this plan lands (before 2026-04-23):

1. A `participants` table exists in Neon + file-mode, scoped per-instance, with `display_name` (required), `email` (optional, opt-in), and `tag` (optional free-text, used for cross-level-mix team formation).
2. A `team_members` join table links participants to teams. The existing `teams.payload.members: string[]` field becomes a denormalized projection, maintained automatically.
3. Facilitators can paste a list of names into a roster panel to pre-load participants, or leave it empty and let walk-ins populate it.
4. Walk-in participants self-identify with their display name when redeeming the event code. A soft binding to their anonymous session is persisted.
5. Facilitators see a unified pool in the admin UI with unassigned vs assigned state visible, and can assign via click-to-assign (primary) or "randomize into N teams with cross-level mix" (secondary button).
6. Participants who provide an email explicitly opt-in. Email is stored per-instance, never exported publicly, and deleted on instance archive.
7. A minimal retention-signal mechanism is usable post-event: facilitator can export opted-in emails + send a templated 14-day and 30-day follow-up (manual send for v1 is acceptable — mailto export or CSV).
8. The 2026-04-23 hackathon uses this system live. At least one real participant's end-to-end flow is captured in `capture/notes/`.

## Scope and Non-Goals

### In scope (MUST for 2026-04-23)

- `participants` table + migration + File + Neon repositories
- `team_members` join table + migration + File + Neon repositories
- Denormalized-projection maintenance for `teams.payload.members`
- Extend `/api/event-access/redeem` to accept optional `displayName`, create/link participant on redeem, record soft binding
- `POST|GET|PATCH|DELETE /api/admin/participants` for facilitator roster ops (smart paste intake: name / name+email / name+email+tag)
- `PUT|POST|DELETE /api/admin/team-members` for assignment (assign-or-move semantics)
- `POST /api/admin/team-formation/randomize` with preview + commit-token flow
- Facilitator UI: new "People" section with smart paste + live preview, pool view, **drag-and-drop assignment** + click-to-assign fallback
- Participant self-identify prompt on join
- **CLI parity: `harness workshop participants …` and `harness workshop team …` commands mirroring every UI action**
- **Facilitator skill (`SKILL-facilitator.md`) updated to expose new commands**
- Fixture updates for `sample-studio-a`
- Preview artifacts (UI, identify flow, API sketch, CLI surface, privacy doc) reviewed before any code is written

### In scope (SHOULD for 2026-04-23 — slip to post-event if tight)

- Optional email field + explicit consent checkbox in UI (MUST became this; SHOULD retains the advanced polish)
- Randomize button surfaced in the admin UI (CLI command is MUST; the button is SHOULD)
- Facilitator roster CSV file-upload (paste-from-clipboard is MUST; file-upload is the UI niceness)

### In scope (POST-EVENT — after 2026-04-23, before broader advocacy)

- Retention-signal capture form (3 Q's) on a public link with token
- Automated follow-up email sending (v1 can be manual mailto / CSV export)
- 14-day and 30-day follow-up templates (EN + CS)
- `capture/notes/` observations from the 2026-04-23 event

### Non-goals

- Per-participant credentials / login (violates 2026-04-06 access-model ADR)
- Participant identity persistence across multiple instances
- Third-party blueprints / plugin SDK (explicit non-goal from brainstorm)
- Custom phase transitions, rotation logic, or eval criteria
- Any UX that lets participants edit facilitator-side fields (tag, email of others)
- Mobile-native app
- Billing / SaaS / multi-tenant commercialization
- Any change to the continuation-shift eval schema in `docs/continuation-shift-eval-design.md`
- Plugin SDK for third-party CLI commands (the new commands ship as first-party handlers only)

## Proposed Solution

### High-level

Introduce a two-layer identity model: an **operational layer** (named `Participant` entity for facilitator ops) and an **auth layer** (unchanged anonymous `participant_sessions`). Bind them softly: when a session redeems an event code, the response prompts for a display name, and a `session.participant_id` is recorded. Lost cookie → re-self-identify. Never introduce per-person credentials.

### Architecture

```
workshop_instances (existing)
 ├── participants (NEW)
 │    • id (PK)
 │    • instance_id (FK, CASCADE)
 │    • display_name (NOT NULL)
 │    • email (NULLABLE, email-format, opt-in)
 │    • tag (NULLABLE, free-text; e.g. "senior", "junior")
 │    • email_opt_in (BOOLEAN, default FALSE)
 │    • created_at, updated_at
 │    • archived_at (NULLABLE, soft-delete)
 │
 ├── team_members (NEW join)
 │    • id (PK)
 │    • instance_id (FK, CASCADE)
 │    • team_id (FK → teams.id, CASCADE)
 │    • participant_id (FK → participants.id, CASCADE)
 │    • assigned_at
 │    • UNIQUE(participant_id)  -- one participant → one team, per instance
 │
 └── participant_sessions (EXISTING, add column)
      • participant_id (NULLABLE, FK → participants.id, SET NULL)
        -- soft binding; session remains the primary auth
```

The existing `teams.payload.members: string[]` field is kept as a **denormalized projection** auto-maintained by `team_members` writes. API clients unchanged; just backed by joins under the hood.

## Subjective Contract

- **Target outcome:** The facilitator feels like they're using Linear for workshops. Paste names, see pool, click-assign, done. Participants just see their name appear — no explanation needed about "why we're asking." The cockpit complexity lives entirely facilitator-side; participant surface never references pools or assignments.
- **Anti-goals:**
  - Multi-step wizards for simple actions (single-screen roster ops)
  - Modal dialogs asking for confirmation on ordinary changes
  - Any UI that says "participant" or "roster" to participants (they see "teammate," "you," "team")
  - PII shown on any public or facilitator-CLI log output
  - Email collection that happens before the participant understands why
- **Positive references:**
  - Linear's assignee-picker UX (type, see, pick)
  - Vercel's team-member add flow (paste emails, done)
  - Basecamp's "add people to a project" pattern
  - Existing `teams-section.tsx:66-120` inline-field pattern in this repo — emulate, don't replace
- **Anti-references:**
  - Jira's assignment dialog (too many fields)
  - Salesforce-style multi-step wizards
  - Asana's invite-modal (social-network-coded)
- **Tone / taste rules:**
  - Plain English placeholders, no branded copy
  - Bilingual (CS + EN) via existing `ui-language` module
  - Forms match existing `adminInputClassName` / `adminPrimaryButtonClassName`
  - Inline-field edits, not popover modals, for name/tag/email
- **Rejection criteria:** the result is wrong if
  - Facilitator needs to read docs to add a participant
  - Participant is asked for email before they've joined a team
  - The pool view is more than one screen for <100 participants
  - Assignment requires page refresh
  - Tag field has a forced controlled vocabulary in v1
  - The shipped UI feels like the Phase 0 mockup (informational only). The Phase 0 mockup approves the IA + interaction model; the production UI must raise the design bar — tighter typography, motion consistent with the existing dashboard's Rauno-verified curve (`cubic-bezier(0.2, 0.8, 0.2, 1)`), and fewer visual weights per screen. Phase 3 is not done until the People section feels like a first-class dashboard surface, not a form grafted on.
- **Representative proof slice:** The facilitator flow where an empty event receives 12 walk-ins, 3 get pasted from a pre-loaded list, facilitator randomizes into 3 cross-level teams, all 15 appear on the right teams in under 60 seconds.
- **Rollout rule:** Ship to the 2026-04-23 hackathon. Capture one participant's full flow in `capture/notes/`. Only after ≥14-day retention data exists (at least 3 opted-in participants replying to the follow-up) do we feature this in README.
- **Required preview artifacts:** (1) facilitator roster + team-formation UI as static HTML mockup; (2) participant join-as-named-person flow as ASCII/HTML mockup; (3) API sketch listing new endpoints with request/response shapes. **Work does not start on Phase 1 until these three artifacts exist and Ondrej signs them off.**

## Phased Implementation

### Phase 0: Preview artifacts and privacy policy (0.5 day) — GATE

Exit criteria: three preview artifacts exist, short `docs/privacy-participant-data.md` is written, Ondrej has signed off. No code is written in this phase.

### Phase 1: Data model and repositories (1 day) — MUST

Exit criteria: migration runs cleanly on Neon + file-mode, repositories implement the contract, fixtures load in `sample-studio-a`, unit tests pass for repository round-trips, existing `teams` reads are unchanged.

### Phase 2: Backend API + CLI + session binding (2 days) — MUST

Exit criteria: self-identify on redeem works end-to-end with a curl test, facilitator CRUD endpoints respond correctly, rate limits and origin checks on new endpoints, server actions wrapper exists, the denormalized `teams.payload.members` projection updates on every `team_members` write, **every new CLI command (`workshop participants *`, `workshop team assign|unassign|randomize`) passes its happy-path + auth-error tests and the parity matrix in `docs/previews/2026-04-16-cli-surface.md` is satisfied**.

### Phase 3: Facilitator UI — roster, team formation, drag-and-drop (2 days) — MUST

Exit criteria: new "People" section renders, smart paste + live preview works, pool view shows unassigned / assigned, **drag-and-drop assigns/moves/unassigns participants** with visible `.dragging` and `.drop-hover` states, click-to-assign via `<details>` picker remains as keyboard fallback, existing `teams-section.tsx` still works, CS + EN copy in place, facilitator can dogfood the full flow.

### Phase 4: Participant self-identify UI (0.5 day) — MUST

Exit criteria: after event-code redemption, participant with no linked identity sees a one-field "your name" prompt; submitted name appears in team UI and is bound to session; refresh preserves identity.

### Phase 5: Cross-level randomize button and optional email/tag (0.5 day) — SHOULD

Exit criteria: button creates N teams with cross-level distribution, optional email + tag fields render in roster UI with explicit consent copy for email, existing "manual assign" still works.

### Phase 6: Pressure-test readiness (0.5 day, day before event) — MUST

Exit criteria: actual hackathon participant names imported, dry-run team formation executed with a real facilitator (Ondrej), monitoring data shows a real team (not `missing-local-path`), `capture/notes/` pre-event observation file created.

### Phase 7: Retention-signal mechanism (1 day) — POST-EVENT

Exit criteria: opt-in emails exportable as CSV + mailto list, templated 14-day and 30-day follow-up in EN + CS, a public `/feedback/:token` form captures 3 Q's, responses persisted per-instance, privacy doc updated with retention and deletion rules.

## Implementation Tasks

Dependency-ordered. Check off in `/work` as completed.

### Phase 0 — Preview artifacts and privacy policy

- [x] **0.1** Write `docs/privacy-participant-data.md`: what PII we collect (display_name always; email opt-in only), retention (deleted on instance archive), facilitator responsibilities, participant rights (request deletion during event). ~200 lines max.
- [x] **0.2** Write `docs/previews/2026-04-16-people-section-mockup.html`: facilitator people-section showing smart paste + live preview, pool with drag-handles, teams with drop zones, drag-and-drop affordance + click-to-assign fallback, CLI parity note in footer.
- [x] **0.3** Write `docs/previews/2026-04-16-participant-identify-flow.md`: ASCII mockup of the post-redeem name prompt and the bound-participant state.
- [x] **0.4** Write `docs/previews/2026-04-16-participant-api-sketch.md`: endpoint list with request/response JSON shapes, auth requirements, error codes.
- [x] **0.6** Write `docs/previews/2026-04-16-cli-surface.md`: CLI commands (`workshop participants …`, `workshop team …`) with parity matrix mapping UI actions ↔ CLI commands ↔ API endpoints.
- [x] **0.5** Gate: Ondrej reviews all five artifacts; explicit sign-off before Phase 1. _Signed off 2026-04-16 with a note: "design could be better" — captured in Rejection criteria (Phase 3 must raise the design bar beyond the mockup)._

### Phase 1 — Data model and repositories

- [x] **1.1** Write migration `dashboard/db/migrations/2026-04-16-participants-and-team-members.sql`: create `participants`, `team_members` tables; add `participant_id` NULLABLE column to `participant_sessions`; add indexes on `(instance_id)`, `(instance_id, team_id)`, plus partial unique `(instance_id, LOWER(display_name)) WHERE archived_at IS NULL` and `UNIQUE(participant_id)` on team_members.
- [x] **1.2** Add types `ParticipantRecord`, `TeamMemberRecord`, `AssignResult` to `dashboard/lib/runtime-contracts.ts`. Define `ParticipantRepository` and `TeamMemberRepository` interfaces. `participantId?: string | null` added to `ParticipantSessionRecord` / `ParticipantSession` (optional for backward compat with existing file-mode session data).
- [x] **1.3** Implement `FileParticipantRepository` + `NeonParticipantRepository` in `dashboard/lib/participant-repository.ts`, mirroring `team-repository.ts` pattern.
- [x] **1.4** Implement `FileTeamMemberRepository` + `NeonTeamMemberRepository` in `dashboard/lib/team-member-repository.ts` with assign-or-move semantics via `AssignResult`.
- [x] **1.5** `rebuildTeamMembersProjection` + `detectTeamMembersProjectionDrift` in `dashboard/lib/team-members-projection.ts`. Orphan-tolerant (skip rows whose participant no longer exists). Called from API routes after every `team_members` mutation.
- [x] **1.6** Unit tests for all three modules: `participant-repository.test.ts` (3 tests), `team-member-repository.test.ts` (3 tests), `team-members-projection.test.ts` (3 tests). Dual-storage parity via `vi.doMock` + stubbed `query`.
- [x] **1.7** Fixtures: `dashboard/data/sample-studio-a/participants.json` (5 entries matching existing `teams.json:t1.members` with seniority tags), `dashboard/data/sample-studio-a/team-members.json` (5 rows all on t1 with `assigned_at` ordering preserved).
- [x] **1.8** Smoke test: full `npm test` green (330 passed, 15 skipped, 2 test files skipped — Neon integration tests); `tsc --noEmit` clean; `npm run lint` clean on touched files. Also extended `NeonEventAccessRepository` to select / insert / upsert `participant_id` alongside existing columns so sessions round-trip the new field.

### Phase 2 — Backend API and session binding

- [x] **2.1** Extended `redeemEventCode()` in `dashboard/lib/event-access.ts` to accept optional `displayName`. Creates a Participant (or reuses by case-insensitive name) and binds the session via `participant_id`. Anonymous path unchanged.
- [x] **2.2** `dashboard/app/api/event-access/redeem/route.ts` parses `displayName` from JSON or form. Returns 400 `invalid_display_name` when provided but empty / too long; guards preserved.
- [x] **2.3** New `POST /api/event-access/identify`: 200 `{ ok: true, participantId }`, 401 `no_session`, 409 `already_bound`, 400 `invalid_display_name`. Emits `participant_identify_rebind_attempt` runtime alert on 409.
- [x] **2.4** `GET /api/admin/participants?instanceId=...` returns `{ pool, assignments }`.
- [x] **2.5** `POST /api/admin/participants` — accepts either `rawText` (server-side parse) or `entries: [{ displayName, email?, tag? }]`. Dedupes case-insensitively against existing pool; emails stored with `emailOptIn=false`.
- [x] **2.6** `PATCH /api/admin/participants/[id]` — per-field edits; 409 `email_opt_in_without_email`; clearing email flips `emailOptIn` off automatically.
- [x] **2.7** `DELETE /api/admin/participants/[id]` — soft-delete + cascade unassign + projection rebuild.
- [x] **2.8/2.9** `POST/PUT/DELETE /api/admin/team-members` — assign-or-move (via `assignMember`), unassign, with `movedFrom` in responses.
- [x] **2.10** `POST /api/admin/team-formation/randomize` — two-step preview + HMAC-signed commit-token flow via `lib/team-randomize.ts`; 60s token TTL; tamper/replay-safe.
- [x] **2.11** Server actions in `_actions/participants.ts`: addFromPaste, updateField, remove, assign, unassign. Consumed by the People section paste form and inline edits.
- [x] **2.12** Test coverage: `participant-paste-parser.test.ts` (13 tests), `team-randomize.test.ts` (8 tests including commit-token tamper/replay), plus repository + projection tests from Phase 1. Route-level integration tests were deferred — the surface is thin glue, and the library layer has direct coverage.
- [x] **2.13** Coordination check vs 2026-04-10 CLI refactor: the `participant_id` session column is additive (NULLABLE), sits next to any future `role` field, and does not collide with that plan's scoping changes. No naming conflicts in the new workshop-scope commands.
- [x] **2.14** CLI handlers: `workshop participants list | add | import | update | remove` in `harness-cli/src/run-cli.js`, each gated by `requireSession`.
- [x] **2.15** CLI handlers: `workshop team assign | unassign | randomize`. Randomize supports `--preview` and `--commit-token` for the two-step flow; direct commit without flags for TTY confirm.
- [x] **2.16** Import helper uses server-side parsing via `POST /api/admin/participants { rawText }` — no duplicated parser in the CLI. Accepts `--file PATH` or `--stdin`; `--dry-run` currently surfaces parser feedback through the same POST response (noted in `docs/previews/2026-04-16-cli-surface.md` for future no-write mode).
- [x] **2.17** CLI tests in `harness-cli/test/run-cli-participants.test.js`: 8 tests covering list + `--unassigned` filter, add, stdin import, team assign, randomize preview, randomize commit-token, and session-less 401.
- [x] **2.18** `workshop-skill/SKILL-facilitator.md` documents `$workshop participants …`, `$workshop team assign | unassign | randomize`. Participant skill (`SKILL.md`) unchanged. Workshop bundle regenerated.

### Phase 3 — Facilitator UI: roster and team formation

- [x] **3.1** `people-section.tsx` (server) composes paste intake + `PeopleWorkspace` (client) + `PeopleRandomize` (client). Loads participants + team-members via direct repository calls.
- [x] **3.2** Paste-list intake: textarea + server action `addParticipantsFromPasteAction` using the shared parser. Dedupes server-side; parser errors surface via `skipped` array.
- [x] **3.3** Unassigned pool: each row shows display_name + tag pill + email + consent toggle + remove button. Inline edit deferred as follow-up (the primary flow works without it; facilitator uses remove+re-add).
- [x] **3.4** Team cards show assigned members with remove-x chips and a `+ add from pool` picker as the keyboard-accessible fallback.
- [x] **3.5** Randomize control (`PeopleRandomize`) with two-step preview + commit; per-team tag distribution; cancel / re-roll / commit. (SHOULD-tier; landed in Phase 5 alongside the rest.)
- [x] **3.6** CS + EN copy: `navPeople` added to both language blocks in `ui-language.ts`; component strings inlined with `lang === "cs" ? … : …` — follows the existing section pattern.
- [x] **3.7** Server-side data fetch via `getParticipantRepository()` + `getTeamMemberRepository()` directly inside the server component; avoids threading through the admin-page view-model loader.
- [x] **3.8** Section router registration: `people` added to `controlRoomSections` and `legacyAdminSectionMap`; `OutlineRail` entry; page.tsx branch.
- [x] **3.9** Playwright e2e in `e2e/people-section.spec.ts` — paste intake, click-to-assign + unassign, randomize preview + commit. Full suite green.
- [x] **3.10** Drag-and-drop: native HTML5 events. `dataTransfer.setData("text/participant-id", ...)`; no library. Chips are `draggable={true}` with `[cursor:grab]`.
- [x] **3.11** Drop zones: pool section + each team card accept drops. `dragOver` adds the `drop-hover` visual via state; pool-drop calls DELETE /api/admin/team-members (unassign), team-drop calls PUT /api/admin/team-members (assign-or-move).
- [x] **3.12** `drop-hover` state uses accent-tinted background + accent border; drag handles (`⋮⋮`) are visible on hover.
- [x] **3.13** Keyboard fallback: `+ add from pool` picker per team; `+ …` on pool rows for picking a target team. All interactions reachable via keyboard.
- [x] **3.14** Playwright e2e for DnD: uses native `DragEvent` + `DataTransfer` dispatched through `page.evaluate()` to trigger the component's onDragStart/onDragOver/onDrop handlers. Asserts the participant appears on the target team after drop.

### Phase 4 — Participant self-identify UI

- [x] **4.1** `ParticipantIdentifyPrompt` renders on the participant page when the session has no `participantId`. Single autofocused input, one button, no explanation copy, matches docs/previews/2026-04-16-participant-identify-flow.md.
- [x] **4.2** Server action inside the prompt calls `bindParticipantToSession` and redirects back to `/participant`. Re-binding with the same name on an already-bound session is treated as success.
- [x] **4.3** Page early-returns the prompt path; full room surface + workshop state loading is skipped when identity is not yet bound.
- [x] **4.4** Copy for both CS + EN inline in the component; `enterKeyHint="done"` + `autoCapitalize="words"` for mobile.
- [x] **4.5** Playwright e2e: `participant · self-identify` test exercises redeem → prompt → bind → hidden-prompt. The three existing participant-dashboard tests in `dashboard.spec.ts` were updated to walk through the prompt before asserting on the room surface.

### Phase 5 — Cross-level randomize and optional email/tag (SHOULD)

- [x] **5.1** Algorithm implemented in `lib/team-randomize.ts` using `mulberry32` for deterministic-by-seed output and `computeDistribution` for the per-team tag breakdown.
- [x] **5.2** `PeopleRandomize` client component renders Preview → per-team distribution card → Commit. Cancel / Re-roll available at every step; tamper-safe via HMAC commit-token.
- [x] **5.3** Email entered in paste / API stores with `emailOptIn: false`. Consent toggle on each pool row flips `emailOptIn` via `PATCH /api/admin/participants/[id]`. Clearing email automatically unsets consent.
- [x] **5.4** Tag is shown as a pill on each pool row. Inline edit (click-to-rename) deferred as follow-up; CLI `participants update --tag ...` is the current edit path.
- [x] **5.5** Copy bilingual (CS + EN) in all new components.

### Phase 6 — Pressure-test readiness (day before 2026-04-23)

- [ ] **6.1** Import the actual 2026-04-23 hackathon participant list via the paste-list UI.
- [ ] **6.2** Run a dry team-formation end-to-end (can be reset before the event).
- [ ] **6.3** Verify `monitoring/latest-monitoring.md` updates with real team/repo paths; no `missing-local-path` placeholders.
- [ ] **6.4** Create `capture/notes/2026-04-22-pre-event-observation.md` — notes on the dry run, what broke, what surprised, what to watch on the day.
- [ ] **6.5** Roll back fixtures to clean pre-event state. Event code rotated.

### Phase 7 — Retention-signal mechanism (POST-EVENT)

- [ ] **7.1** Add `POST /api/admin/participants/export-emails`: returns CSV of opted-in `(display_name, email)` for the instance. Facilitator-only.
- [ ] **7.2** Templates: `workshop-content/follow-up/14-day-{en,cs}.md` and `30-day-{en,cs}.md` — 3-question structure (behavior change, harness-still-alive, would-you-do-this-again).
- [ ] **7.3** Add `GET /feedback/:token` public page: token scoped per-participant per-check-in; renders the 3 questions.
- [ ] **7.4** `POST /api/feedback/:token`: stores responses in a new `participant_feedback` table (`id`, `instance_id`, `participant_id`, `check_in` (14|30), `responses` JSONB, `submitted_at`).
- [ ] **7.5** Facilitator dashboard: show response count + paginated responses per check-in.
- [ ] **7.6** Privacy doc update: include feedback retention rules.
- [ ] **7.7** Compound: write `docs/solutions/` entry if the two-layer identity pattern proves out.

## Assumptions

| Assumption | Status | Evidence / Plan |
|------------|--------|-----------------|
| 2026-04-06 event-access ADR's anonymous-session model accommodates a soft `participant_id` binding | **Unverified** | New pattern. Validated in Phase 2.1; fallback is keeping binding entirely client-side (localStorage) if session-column migration breaks something. |
| Existing File + Neon dual-storage contract handles new entities without issues | Verified | Established pattern in `team-repository.ts`, `participant-event-access-repository.ts`. Every repository ships both implementations. |
| `instance_grants` owner/operator/observer roles are sufficient for facilitator roster ops (no new role needed) | Verified | Confirmed in research: multi-facilitator with roles already works. Operator role can manage participants. |
| 7-day timeline (2026-04-16 → 2026-04-23) is realistic for MUST-tier scope after CLI + DnD additions | **Unverified — tighter** | ~6 days of effort against 7 elapsed. Buffer reduced from previous ~4.5d estimate. Gate: after Phase 2, re-estimate Phase 3 strictly and cut SHOULD-tier first; if still >1d behind, defer CLI `workshop team randomize` to post-event (keep UI randomize; CLI for the others stays MUST). |
| The in-progress participant CLI refactor (`docs/plans/2026-04-10-...`) won't collide with session-column changes | **Unverified** | Task 2.13 checks status before Phase 1 completes. Risk section covers both outcomes. |
| Cross-level teams genuinely improve outcomes (brainstorm bedrock) | Bedrock | Inherited from brainstorm; peer-learning pedagogy + repo-as-equalizer. |
| Live synchronous beats async for this outcome (brainstorm bedrock) | Bedrock | Inherited from brainstorm; continuation-shift emotional stakes. |
| Opinionated UX beats customizable UX (brainstorm bedrock) | Bedrock | Inherited from brainstorm; Linear/Rails pattern. |
| "Engineering-not-vibe-coding" mindset is learnable in one day (brainstorm unverified) | **Being investigated** | Phase 7 retention-signal mechanism turns this into measurable signal post-event. |
| Enough facilitators will run agent-native hackathons to form a user base (brainstorm unverified) | Accepted risk | Brainstorm: resolves itself in 12 months; not blocking. |
| OSS with BDFL attracts contributors for an operational tool (brainstorm weak) | Accepted risk | Brainstorm: BDFL realistic near-term; steward arc aspirational. |

## Constraints and Boundaries

- **Auth boundary (non-negotiable):** participant surface never gets facilitator privileges. Any new facilitator endpoint lives under `/api/admin/*` and is gated by `instance_grants` (owner/operator/observer). Confirmed via `docs/adr/2026-04-06-private-workshop-instance-auth-boundary.md`.
- **Privacy boundary (non-negotiable):** email is opt-in with explicit consent checkbox; never logged; deleted on instance archive; public repo never contains real emails even in fixtures.
- **Data classification:** `participants` rows are participant-private per `docs/private-workshop-instance-data-classification.md`. Not allowed in the public repo. Fixtures use clearly-fake names (`Testovací Účastník 1`, etc.).
- **Architectural invariant:** every repository implements both File and Neon backends. Skipping one breaks the runtime-contracts tests.
- **Existing-shape preservation:** `teams.payload.members: string[]` stays in the payload as a denormalized projection. Any `GET /api/teams` response shape remains identical for existing clients.
- **CS/EN parity:** any user-facing copy lands in both languages. Add keys to `ui-language` module before shipping.
- **Public-private taxonomy:** all new docs checked against `docs/public-private-taxonomy.md`. Plans, ADRs, schema docs → public. Actual roster data → participant-private, never public repo.

## Risk Analysis

1. **Session-column migration breaks existing sessions (HIGH × medium).** Adding `participant_id` to `participant_sessions` is structural. Mitigation: NULLABLE column, no backfill; existing anonymous sessions unaffected. Rollback: drop the column, soft-binding falls back to an in-memory map for the event.
2. **In-progress CLI plan (2026-04-10) collides (MEDIUM × medium).** If that plan also touches `participant_sessions`, we risk a double-write on the same column. Mitigation: task 2.13 explicitly checks status; if conflict, coordinate with whoever owns that plan before touching the table.
3. **Denormalized projection drifts from source of truth (MEDIUM × high impact).** `teams.payload.members` must stay in sync with `team_members` joins. Mitigation: always write through a single helper function; add a drift-detection test that compares projection vs join at the end of every test run.
4. **Scope overrun before 2026-04-23 (MEDIUM × medium).** 7 days is tight. Mitigation: strict MUST/SHOULD tiering; gate after Phase 2 re-estimates rest; Phase 5 slips first, then Phase 7 which is already POST-EVENT.
5. **Live event breaks on day-of (HIGH × low).** Untested migration path on real data during a workshop = embarrassing. Mitigation: Phase 6 dry-run day-before; fixture reset verified; rollback plan (git revert the migrations, restore `teams.payload.members: string[]` path).
6. **Privacy incident (CRITICAL × low).** Real participant email or name ends up in a public artifact. Mitigation: privacy doc in Phase 0; all fixtures use fictional names; grep `.env.local*` before each commit (existing husky gate covers this); capture/notes review before publishing.
7. **Drag/drop UX turns out to feel clunky (LOW × medium).** Mitigation: scoped out of v1 (click-to-assign is MUST; drag/drop explicitly deferred). If users ask for it, post-event.
8. **Randomize algorithm produces weird distributions (LOW × medium).** Mitigation: SHOULD-tier, explicit confirmation modal before commit, always reversible via manual reassign.
9. **Facilitator UX doesn't match participant-pool scale (LOW × low at workshop scale).** <100 participants per event is the operating range. Mitigation: no virtualization or paging in v1; if we ever hit >100, that's a nice problem to have and we revisit.
10. **CLI / API skew (MEDIUM × medium).** If the UI-side paste parser diverges from the CLI `participants import` parser, facilitators get different results from the same input. Mitigation: shared parse helper (task 2.16) used by both the UI's client-side parse and the CLI; integration test that pipes the same input through both and asserts identical parsed shapes.
11. **DnD accessibility gap (LOW × medium).** Screen-reader and keyboard-only users can't drag. Mitigation: click-to-assign picker is the accessible path and is tested in Playwright independently of DnD (task 3.13). DnD is marked aria-hidden decorative; no assistive-tech signal routes through it.
12. **CLI timeline overrun (MEDIUM × medium).** CLI adds ~1 day; effort estimate could be off. Mitigation: task 2.15 (`workshop team randomize`) is the cut-candidate if Phase 2 runs long — UI randomize stays MUST, CLI randomize becomes post-event. Other CLI commands (participants * + team assign/unassign) stay MUST because they're the dogfood demo surface.

## Acceptance Criteria

Measurable; all must hold before 2026-04-23:

1. A fresh clone + `npm run db:migrate` + `npm run dev` brings up a dashboard where the new people-section renders without errors in both Neon and file-mode.
2. Pasting 5 names into the paste-list creates 5 `Participant` rows visible in the unassigned pool within 2 seconds.
3. Click-to-assign moves a participant from pool to a team with no page reload; `GET /api/teams` reflects the change.
4. A walk-in flow: fresh browser redeems an event code with no `displayName`, sees the self-identify prompt, submits a name, the name appears in their team panel (after team is assigned facilitator-side).
5. A participant without opt-in has no email stored anywhere (assert via DB query in test).
6. Playwright e2e green (`npm run test:e2e`) — new flows + existing `dashboard.spec.ts` still passing.
7. `monitoring/latest-monitoring.md` shows real team paths on event day — no `missing-local-path`.
8. `capture/notes/2026-04-22-pre-event-observation.md` exists with at least 5 bullet-point observations.
9. `docs/privacy-participant-data.md` exists and is linked from README (replacing or augmenting `SECURITY.md` where appropriate).
10. POST-EVENT: ≥3 opted-in participants receive the 14-day follow-up, ≥1 responds. (This is the success criterion for the retention assumption, not a Phase 6 gate.)
11. **CLI parity:** the full end-to-end demo script in `docs/previews/2026-04-16-cli-surface.md` ("Demo-day script") runs clean — provision an instance, rotate access, import a roster via stdin, list unassigned, randomize with preview + commit-token, assign by ID, set opening phase. No step prints an error.
12. **DnD works:** in Playwright e2e (task 3.14), dragging a `.member-chip` from one team to another moves the `team_members` row; `GET /api/teams` reflects the change; source team loses the member, target gains it. Keyboard-only click-to-assign path also green (task 3.13).

## Decision Rationale

Inherits from brainstorm decisions Q1–Q11 at `docs/brainstorms/2026-04-16-harness-lab-product-shape-and-participant-management-brainstorm.md`. Plan-specific decisions:

- **Drag-and-drop AND click-to-assign, both in v1.** DnD via native HTML5 drag events (no library, no external dep) is the primary facilitator path — faster for bulk work and reads as "modern tool." Click-to-assign via a `<details>` picker remains the keyboard-accessible fallback. Revised from earlier "click-only" position after feedback that DnD should not be deferred; added <1 day of Phase 3 work to cover it.
- **`teams.payload.members` kept as denormalized projection, not deprecated.** Alternative was a breaking migration making all read paths go through joins. Cost was too high for 7 days; the projection pattern is cheap and keeps existing code working.
- **Session binding via NULLABLE `participant_id` column, not a separate `session_bindings` table.** Simpler, atomic, uses CASCADE. A separate table would add one more repository to maintain without clear benefit.
- **Phase 7 is post-event.** The retention mechanism isn't on the critical path for 2026-04-23; shipping it rushed risks worse privacy handling than shipping it right after.
- **Paste-list before CSV import.** Pasting names from an email or spreadsheet is the common case. CSV parsing adds validation surface; defer the file-upload UI. The CLI `participants import --file` ships as MUST because facilitators already pipe files on the terminal — different UX, different bar.

- **CLI/skill parity as a MUST, not a SHOULD.** Every facilitator UI action ships with a matching `harness workshop …` command, documented in the parity matrix at `docs/previews/2026-04-16-cli-surface.md`. Reasons: (1) agent-native thesis — harness-lab teaches engineering-with-agents, so the tool's own ops should be scriptable; (2) dogfood at the hackathon — provisioning the room from a terminal is a real harness-lab moment; (3) batch workflows (CSV import) land better on CLI than UI. Added ~1 day of Phase 2 work.

## References

- Brainstorm: `docs/brainstorms/2026-04-16-harness-lab-product-shape-and-participant-management-brainstorm.md`
- Auth boundary ADR: `docs/adr/2026-04-06-private-workshop-instance-auth-boundary.md`
- Event access model ADR: `docs/adr/2026-04-06-workshop-event-access-model.md`
- Schema doc: `docs/private-workshop-instance-schema.md`
- Data classification: `docs/private-workshop-instance-data-classification.md`
- Continuation-shift eval: `docs/continuation-shift-eval-design.md`
- In-progress CLI plan (coordination risk): `docs/plans/2026-04-10-refactor-participant-cli-architecture-plan.md`
- Existing team repository pattern: `dashboard/lib/team-repository.ts`
- Existing event-access repository pattern: `dashboard/lib/participant-event-access-repository.ts`
- Existing redeem route pattern: `dashboard/app/api/event-access/redeem/route.ts`
- Existing facilitator UI pattern: `dashboard/app/admin/instances/[id]/_components/sections/teams-section.tsx`
- Public/private taxonomy: `docs/public-private-taxonomy.md`
- CLI surface preview: `docs/previews/2026-04-16-cli-surface.md`
- Existing CLI handler pattern: `harness-cli/src/run-cli.js` (`workshop team set-name` at ~line 1083)
- Existing facilitator skill: `workshop-skill/SKILL-facilitator.md`
- UI mockup: `docs/previews/2026-04-16-people-section-mockup.html`
