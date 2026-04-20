---
title: "docs: CLI + skills follow-up after the auth rewamp"
type: plan
date: 2026-04-20
status: complete
brainstorm: null
confidence: high
---

# CLI + skills follow-up after the auth rewamp

**One-line summary:** the dashboard's auth model changed materially (control-plane API for participant accounts, raw-fetch proxy for every Neon Auth call, name-first identify with a real password), but the CLI README, the participant `workshop` skill, and the `workshop-facilitator` skill still describe the old anonymous-session world — update all three so AI agents and human readers see the current truth.

## Problem Statement

Three doc surfaces drifted during the auth rewamp slice (`docs/plans/2026-04-19-feat-participant-auth-hardening-and-identify-plan.md`, status `complete`):

1. **`harness-cli/README.md`** — the participant Quick Start (lines 86–105) doesn't mention the password sub-view that follows event-code redemption. The Environment variables section (lines 189–198) doesn't reference `NEON_API_KEY` or explain that account creation now happens server-side via the dashboard's control-plane credential. Someone reading the README to understand "how does a participant log in" gets a partial picture.

2. **`harness-cli/AGENTS.md`** — Task Routing rule for "Auth flow change" (line 20) points at `docs/harness-cli-foundation.md` and "the relevant ADR under `docs/adr/`" but doesn't name the new ADR (`2026-04-19-name-first-identify-with-neon-auth.md`). A future CLI edit that touches auth wouldn't know which ADR is canonical.

3. **`.agents/skills/workshop/SKILL.md`** — `workshop login` (lines 96–103) currently says "Ask the participant for the shared event code, then run `harness auth login --code <CODE>` to authenticate. After success: confirm live mode is active." That's the OLD model. The new model: redeem event code → name picker (prefix-match against the pre-pasted roster) → set or enter a password (real Neon Auth account) → in the room. The skill prompt needs to reflect this so the AI agent doesn't tell a participant "you're done" before they've actually identified and set a password.

4. **`.agents/skills/workshop-facilitator/SKILL.md`** — three gaps:
   - No mention of the per-instance `allow_walk_ins` toggle (Phase 5.4 shipped a UI for it). A facilitator running an invite-only workshop wouldn't know to flip it.
   - No mention of facilitator-issued in-room password reset (Phase 5.4 endpoint + UI). The skill should describe how to walk a stuck participant through a reset.
   - The roster paste workflow exists in the CLI (`harness workshop participants import`) but the skill's command list (`workshop facilitator ...`) doesn't include it. A facilitator asking "how do I pre-load my roster" gets no answer from the skill.

The CLI code itself is fine — event-code redemption (`/api/event-access/redeem`) didn't change. The downstream identify endpoints (`set-password`, `authenticate`) are called by the dashboard's React UI, not the CLI. So this is purely a docs slice. No CLI source changes needed.

## Target End State

When this lands:

1. A participant or facilitator reading `harness-cli/README.md` sees the new participant flow (event code + name pick + password) explained accurately, and the env-vars section names `NEON_API_KEY` correctly (server-side credential, not a CLI input).
2. A future Claude instance editing CLI auth code reads `harness-cli/AGENTS.md` and is pointed at the canonical 2026-04-19 ADR, not just "some ADR under `docs/adr/`."
3. The participant `workshop` skill describes the name-first identify flow, mentions that participant identity persists across browser close (real account), and tells the AI agent what to do if the participant gets stuck on the password step.
4. The `workshop-facilitator` skill documents (a) roster paste, (b) the `allow_walk_ins` toggle, (c) facilitator-issued password reset. Each entry tells the agent which CLI command (or dashboard surface) to suggest.
5. No claim in any of these docs contradicts the dashboard's actual behavior. Verification: a manual read-through against `lib/auth/admin-create-user.ts`, `lib/auth/server-set-password.ts`, `app/api/event-access/identify/*`, and `app/api/admin/participants/[id]/reset-password/route.ts`.
6. Existing tests still green (no code changes — but the touched files might be referenced by lint/spell-check workflows; verify nothing breaks).

## Scope and Non-Goals

**In scope:**
- Edits to `harness-cli/README.md` (participant Quick Start + env vars sections).
- One-line addition to `harness-cli/AGENTS.md` Task Routing.
- Rewrite `workshop login` section in `.agents/skills/workshop/SKILL.md`. Add a brief "Identity Model" subsection so the agent has shared context.
- Add facilitator-side sections to `.agents/skills/workshop-facilitator/SKILL.md`: roster paste, walk-in policy, password reset.
- Cross-reference the new ADR (`2026-04-19-name-first-identify-with-neon-auth.md`) from each touched file.
- Update `workshop-skill/facilitator.md` if the skill references it for operational detail (will verify in Phase 1).

**Not in scope:**
- Any CLI source code changes. The CLI's transport is unchanged.
- Any dashboard code changes. The auth rewamp is shipped.
- New CLI commands. The existing `harness workshop participants import`, `harness workshop update-instance --allow-walk-ins`, etc. cover the flows.
- Email-based password reset for participants (the doctrine is in-room only — `sendParticipantPasswordResetEmail` exists in the wrapper but no UI surfaces it; we keep it as fallback infrastructure).
- Translations of the new copy. English-canonical per ADR `2026-04-12-skill-docs-english-canonical.md`; the skill agent translates on the fly.
- Updating `workshop-skill/locales/cs/` or any other locale files. Per the same ADR, that tree is being retired.

## Proposed Solution

Three sub-slices, dependency-ordered. Each is a single doc edit + a verification read-through against the dashboard source. No new infrastructure.

### Sub-slice A — CLI README + AGENTS.md

Smallest surface, lowest risk. Mostly additive: clarify the participant flow, mention `NEON_API_KEY` as a dashboard concern (not a CLI input), and point AGENTS.md at the new ADR by name.

### Sub-slice B — workshop SKILL.md (participant)

Rewrite the `workshop login` section to describe the actual flow. Add a short "Identity Model" subsection above Commands so the agent has shared context for any other command that touches auth (the agent might invent wrong things in `workshop help`, `workshop setup`, etc. without it).

### Sub-slice C — workshop-facilitator SKILL.md

Add three new command sections (roster paste, walk-in policy, password reset). Augment `workshop facilitator participant-access` to mention that the event code is the room key, not a per-participant credential.

After all three are done, run a single end-to-end verification: simulate the AI agent reading each skill with no prior context, ask it to explain "how does a participant log in" and "how do I reset a participant's password," and check the answers match the shipped dashboard behavior.

## Decision Rationale

### Why docs-only, no code

The CLI's existing transport (`harness auth login --code`) hits `/api/event-access/redeem` which returns a session cookie. That's unchanged. The new identify steps (name pick + set/enter password) happen entirely on the dashboard's web UI after the participant lands on `/participant`. There's no CLI surface for them, and adding one would duplicate the React UI without a use case (the CLI is for facilitators + skill installation, not for a participant typing their workshop password into a terminal).

The dashboard auth proxy and control-plane integration are server-side internals — they don't touch any client-visible API contract that the CLI consumes.

### Why update three skills, not just one

The participant skill (`workshop`) and facilitator skill (`workshop-facilitator`) are loaded into different conversational contexts. A participant in Codex sees only the participant skill; a facilitator sees both (after `workshop facilitator login`). Splitting the doc updates by audience matches how the agent loads them. Cross-pollution would mean a participant accidentally seeing facilitator-only guidance.

### Why mention the ADR by name in AGENTS.md

The current `AGENTS.md:20` is too generic — it points at "the relevant ADR." When there are multiple ADRs (and there are, including the older facilitator-identity one), the next person to edit CLI auth has to guess which one applies. Naming `2026-04-19-name-first-identify-with-neon-auth.md` makes the canonical reference unambiguous.

### Why skip translations

`docs/adr/2026-04-12-skill-docs-english-canonical.md` declared skill reference docs English-canonical. Translations happen at agent runtime. Adding parallel Czech copies of the new identity-model copy would create governance debt the ADR was designed to prevent.

### Why a single end-to-end agent-readback verification, not per-file

Verifying each file individually would catch typos but miss the more important question: does the AGENT's reading of all three docs together produce coherent guidance for a real participant + real facilitator scenario? A single readback covers cross-file inconsistencies (e.g., the CLI README says one thing about password reset and the facilitator skill says another).

## Constraints and Boundaries

- **English-canonical for skill reference docs.** Per ADR `2026-04-12-skill-docs-english-canonical.md`. New copy goes only into the English root files.
- **No raw credentials in skill docs or generated bundle.** Per `harness-cli/AGENTS.md:5`. The CLI holds credentials; the skill never does. Any new skill copy that touches auth must NOT instruct the agent to read tokens, store passwords, or hit auth endpoints directly — always route through the CLI or the dashboard UI.
- **Trunk-based development.** Each sub-slice commits direct to `main`. (Memory note: confirmed.)
- **No new feature flags.** This is a doc update; the underlying behavior is already shipped.
- **Bundle parity.** `harness-cli/scripts/sync-workshop-bundle.mjs` mirrors `workshop-skill/` and skill source into `harness-cli/assets/workshop-bundle/`. After updating SKILL files (which live under `.agents/skills/`), check whether the sync script needs to run — if it mirrors `.agents/skills/` content into the bundle, run it; if not, skip. Verify in Phase 1.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| The CLI's `/api/event-access/redeem` transport contract did not change in the auth rewamp | Verified | `app/api/event-access/redeem/route.ts` body shape (`eventCode`, `displayName?`) unchanged across the recent commits; the rewamp added downstream endpoints but didn't touch redeem |
| `harness workshop participants import` already exists as a CLI command for roster paste | Verified | `harness-cli/src/run-cli.js:308` lists `workshop participants import` in the help line |
| `harness workshop update-instance` accepts the walk-in toggle | Unverified | The plan's Phase 5.4 walk-in toggle shipped as a server action + UI; need to confirm the CLI exposes it via `update-instance --allow-walk-ins` or whether facilitators flip it from the dashboard only. Check in Phase 1 |
| The facilitator skill's `workshop facilitator participant-access` references the event code correctly today | Verified | SKILL.md:80 says "Inspect or rotate the shared participant event code" — accurate, just needs a one-line addition that the code is the room key |
| `workshop-skill/facilitator.md` (referenced by SKILL.md:23) needs updates too | Unverified | Need to read it in Phase 1 — it's the "full operational reference" so anything stale there would cascade |
| The `.agents/skills/` directory is the canonical location for the SKILL.md files (not just a generated mirror) | Verified | The path is unique to skills; `harness-cli/assets/workshop-bundle/` is a mirror of `workshop-skill/` (the source-of-truth content), not of `.agents/skills/` (the skill manifests) |
| No code changes are needed in the CLI for any of these doc updates | Verified | Audit (this slice's research phase) found that all CLI command surfaces relevant to the new flow already exist; missing pieces are doc-only |

Unverified assumptions become Phase 1 investigation tasks (see Implementation Tasks below).

## Risk Analysis

| Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|
| Skill copy claims a CLI flag exists when it doesn't (e.g., `--allow-walk-ins`) | Medium | Medium | Phase 1 verifies every CLI flag the skill suggests by greppping `harness-cli/src/run-cli.js`. Anything not present gets a "see dashboard /admin" routing instead of a CLI command suggestion. |
| Stale guidance in `workshop-skill/facilitator.md` caches the old anonymous model | Medium | Medium | Phase 1 reads it; if updates needed, fold into Sub-slice C. |
| The agent reads the new docs and over-corrects — telling a returning participant they need to "create an account" instead of "enter your password" | Low | Medium | The new identity-model section in `workshop` SKILL.md explicitly distinguishes first-time (set password) from returning (enter password). Phase 4's agent-readback verification stress-tests this. |
| Bundle sync script either misses the SKILL changes (if it mirrors them) or fails (if it doesn't) | Low | Low | Phase 1 confirms whether `sync-workshop-bundle.mjs` touches `.agents/skills/`. If yes, run it; if no, skip. |
| New facilitator copy contradicts the privacy doctrine — e.g., suggests reading aloud a participant's email | Low | High | Walk-in refusal copy + reset-code copy should reference identifiers participants chose to share (display name, in-room temp password) and never email/account internals. Reviewer pass before commit. |
| Translations later regress to Czech-canonical when a maintainer copies an old pattern | Low | Low | Each touched skill file references `docs/adr/2026-04-12-skill-docs-english-canonical.md` in a comment so the rule is visible at the edit surface. |

## Implementation Tasks

Dependency order: Phase 1 (verify) → Sub-slice A (CLI docs) → Sub-slice B (participant skill) → Sub-slice C (facilitator skill) → Phase 4 (verify end-to-end).

### Phase 1 — Verify open assumptions

- [x] Grep `harness-cli/src/run-cli.js` for `update-instance` flags and confirm whether `--allow-walk-ins` is exposed. If not, the skill copy routes facilitators to the dashboard `/admin/instances/[id]?section=access` instead.
- [x] Read `workshop-skill/facilitator.md` (referenced by `workshop-facilitator/SKILL.md:23`). List every passage that references the OLD anonymous-session model or that names auth surfaces the rewamp changed. Decide whether to fold those edits into Sub-slice C or write them as a separate sub-slice D.
- [x] Inspect `harness-cli/scripts/sync-workshop-bundle.mjs` — does it mirror `.agents/skills/*/SKILL.md`? If yes, plan to run sync after each skill edit. If no, skip.
- [x] Confirm `harness workshop participants import --help` actually documents the paste-list intake flow that we're going to suggest in the facilitator skill.

### Sub-slice A — CLI docs

- [x] `harness-cli/README.md` Participant Quick Start: extend the description of `harness skill install` with a one-paragraph "After install" note that explains the participant identify flow they'll see on `/participant` (event code → name pick → password). Frame it as "what to expect," not as a CLI behavior.
- [x] `harness-cli/README.md` Environment variables section: add a short note that `NEON_API_KEY` is a dashboard-side credential (not a CLI input) used by the dashboard's `lib/auth/admin-create-user.ts`. This prevents future readers from trying to set it as a CLI env.
- [x] `harness-cli/AGENTS.md` Task Routing: in the "Auth flow change" line, replace "the relevant ADR under `docs/adr/`" with an explicit reference to `docs/adr/2026-04-19-name-first-identify-with-neon-auth.md` and the older `docs/adr/2026-04-06-neon-auth-for-facilitator-identity.md` (still relevant for facilitator identity).
- [x] ⎘ Commit: `docs(cli): clarify participant identify flow + name the canonical auth ADR`.

### Sub-slice B — workshop SKILL.md (participant)

- [x] Add a new section titled `## Identity Model` after `## Sources Of Truth` and before `## Commands`. ~10 lines. Says: event code is the room key (gate); after redeem, participants see a name picker scoped to the workshop's pre-pasted roster (or a walk-in path if the facilitator allows); the participant sets a password the first time and enters it on return; identity persists across browser close because participants have real Neon Auth accounts. Note explicitly that the agent should NEVER try to handle passwords directly — always route through the dashboard UI.
- [x] Rewrite `### `workshop login`` (currently lines 96–103). New copy: ask for the event code, run `harness auth login --code <CODE>`, then tell the participant to open `/participant` in a browser to complete identify (name pick → set/enter password). After success: confirm live mode active, mention identity persists, keep facilitator-only data unavailable. Stress that the agent does NOT collect or relay the password.
- [x] Add a small note to `### `workshop logout`` clarifying that this clears the event-code session but does not invalidate the Neon Auth account — the participant can re-redeem and enter their existing password to come back.
- [x] Cross-reference `docs/adr/2026-04-19-name-first-identify-with-neon-auth.md` in the Identity Model section.
- [x] ⎘ Commit: `docs(skill): rewrite workshop login + add identity model section`.

### Sub-slice C — workshop-facilitator SKILL.md

- [x] Add a new section `### `workshop facilitator import-roster`` near the top of Commands (before `workshop facilitator participant-access`). Describes the paste-list intake via `harness workshop participants import`. Includes: format expected (display name, optional email, optional tag — verified against the parser), why pre-pasting matters (participants see name picker instead of walk-in), and the resulting `participants` row state.
- [x] Add a new section `### `workshop facilitator walk-in-policy`` after `participant-access`. Describes the per-instance `allow_walk_ins` toggle (default `true`). Routing: prefer the dashboard `/admin/instances/[id]?section=access` for the toggle UI; if Phase 1 confirms a CLI flag exists, mention `harness workshop update-instance --allow-walk-ins true|false` as an alternative. Explain the consequence: when off, unknown names see "ask your facilitator to add you" with no walk-in path.
- [x] Add a new section `### `workshop facilitator reset-participant-password`` after `walk-in-policy`. Describes the in-room reset flow: facilitator clicks "reset password" on the participant row in `/admin/instances/[id]?section=people`, dashboard returns a 3-word temp password, facilitator reads it aloud, participant uses it on the next sign-in attempt. Cross-reference: facilitator-issued reset uses `lib/participant-auth.ts:resetParticipantPasswordAsAdmin` which rotates via the proxy + revokes existing sessions.
- [x] Augment `### `workshop facilitator participant-access`` with one line: "The event code is the room key — required to reach the identify surface, but every participant also needs their own password set during identify (see the new participant model)."
- [x] If Phase 1 reveals that `workshop-skill/facilitator.md` has stale copy, add edits to that file in this sub-slice or in a sub-slice D.
- [x] Cross-reference `docs/adr/2026-04-19-name-first-identify-with-neon-auth.md` somewhere in the Loading Condition or Style sections.
- [x] ⎘ Commit: `docs(skill): add roster paste + walk-in policy + reset workflow to facilitator skill`.

### Sub-slice D (conditional) — `workshop-skill/facilitator.md`

- [x] If Phase 1 found stale references, edit those sections to reflect the current auth model + cite the new ADR.
- [x] If sync script mirrors this file into the bundle, run it.
- [x] ⎘ Commit (only if needed): `docs(skill): align facilitator operational reference with current auth model`.

### Phase 4 — End-to-end verification

- [x] Read all four touched files (CLI README, CLI AGENTS, both SKILL.md files, plus any sub-slice D edits) end-to-end as if you were the AI agent loading them. Note any cross-file contradictions.
- [x] Compose two test prompts:
  1. *"I'm a workshop participant — I just got the event code from my facilitator. What do I do?"* — confirm the answer mentions: install the skill (or visit `/participant`), redeem the event code, pick name, set password (first time) or enter password (returning).
  2. *"I'm running an invite-only workshop and don't want walk-ins. How do I configure that, and how do I help a participant who forgot their password?"* — confirm the answer mentions: pre-paste roster via `harness workshop participants import`, toggle `allow_walk_ins` off (CLI or dashboard depending on Phase 1), use the per-row reset-password button on `/admin/instances/[id]?section=people` to issue a 3-word temp password.
- [x] If any answer drifts from the dashboard's actual behavior, fix the doc; do not move on.
- [x] Mark this plan `status: complete` in frontmatter.

## Acceptance Criteria

- [x] `harness-cli/README.md` describes the participant identify flow (event code + name pick + password) accurately, references `NEON_API_KEY` as dashboard-side, and `harness-cli/AGENTS.md` names the canonical 2026-04-19 ADR.
- [x] `.agents/skills/workshop/SKILL.md` has an Identity Model section that explains event code as room key + password as second factor + identity persists across browser close. The `workshop login` section describes the full identify flow, not just CLI auth.
- [x] `.agents/skills/workshop-facilitator/SKILL.md` documents three new workflows: roster paste, walk-in policy toggle, in-room password reset. Each entry routes the agent to the right CLI command or dashboard surface.
- [x] No claim in any touched doc contradicts the dashboard source (verified by reading `lib/auth/admin-create-user.ts`, `lib/auth/server-set-password.ts`, `app/api/event-access/identify/*`, `app/api/admin/participants/[id]/reset-password/route.ts`).
- [x] Phase 4's two agent-readback prompts return correct, complete, dashboard-aligned answers.
- [x] Existing tests stay green (`cd dashboard && npm test`, `cd harness-cli && npm test`).
- [x] If `sync-workshop-bundle.mjs` mirrors any touched file, it has been run and the resulting diff is in the same commit.

## References

- **The auth rewamp plan (now complete):** `docs/plans/2026-04-19-feat-participant-auth-hardening-and-identify-plan.md`
- **The canonical auth ADR:** `docs/adr/2026-04-19-name-first-identify-with-neon-auth.md`
- **Existing facilitator-identity ADR (still load-bearing):** `docs/adr/2026-04-06-neon-auth-for-facilitator-identity.md`
- **Skill docs English-canonical rule:** `docs/adr/2026-04-12-skill-docs-english-canonical.md`
- **Server-side proxy implementation:** `dashboard/lib/auth/neon-auth-proxy.ts`
- **Participant account creation:** `dashboard/lib/auth/admin-create-user.ts`, `dashboard/lib/auth/server-set-password.ts`
- **Identify endpoints:** `dashboard/app/api/event-access/identify/{suggest,set-password,authenticate}/route.ts`
- **Facilitator-issued reset:** `dashboard/app/api/admin/participants/[id]/reset-password/route.ts`
- **Walk-in toggle UI:** `dashboard/app/admin/instances/[id]/_components/sections/access-section.tsx`
- **CLI helpers (already wire participant intake):** `harness-cli/src/run-cli.js` lines 286–314
- **Skill manifests being edited:** `.agents/skills/workshop/SKILL.md`, `.agents/skills/workshop-facilitator/SKILL.md`
- **Skill operational reference (Phase 1 will check):** `workshop-skill/facilitator.md`
- **CLI bundle sync (Phase 1 will check):** `harness-cli/scripts/sync-workshop-bundle.mjs`
