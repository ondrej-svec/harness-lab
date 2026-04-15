---
title: "feat: expert audit remediation — Codex craft, framing, CLI ergonomics, continuation eval"
type: plan
date: 2026-04-09
status: approved
brainstorm: null
source: expert audit (Fowler, Newport, Amodei lens, Ng, Orosz, Hashimoto, Dignan, Willison lenses) — 2026-04-09 session
confidence: high
---

# Expert audit remediation

Close the specific gaps surfaced by a seven-lens expert review of the Harness Lab hackathon without duplicating work already in flight in other April 9 plans.

## Problem statement

A multi-lens expert audit of the workshop content, blueprint, dashboard, and CLI surfaced four classes of gap that collectively weaken the workshop's credibility with seasoned engineers, even though the core thesis and day architecture are sound:

1. **Framing friction.** The workshop's "RED test before autonomy" language reads as TDD dogma to experienced engineers. It is not actually claiming TDD — it is claiming *executable specifications as constraints*. The current wording invites pushback the content doesn't deserve.
2. **Codex-specific craft gap.** The curriculum is deliberately agent-agnostic at the method layer, which is defensible, but leaves participants without fluency on Codex's specific affordances (approval modes, sandboxing, shell tool gates, long-horizon drift, context window as a resource). Willison and Amodei lenses flagged this independently.
3. **CLI ergonomics paper cuts.** `harness workshop` has invisible instance state (facilitators cannot tell which workshop a command targets), raw Node errors on install failures, inconsistent verb grammar, and buried onboarding routing. None are architectural — all are "respect developer time" fixes.
4. **Continuation shift is anecdotal, not instrumented.** The team rotation at lunch is the workshop's strongest idea, but it is experienced, not measured. No friction patterns captured, no time-to-productivity signal, no feedback loop back into the blueprint.

5. **Distribution is implicit.** Edits to `content/` do not automatically reach participants. Content flows through three channels: (a) the bundled skill shipped via the CLI npm package (`harness-cli/assets/workshop-bundle/` → `npm publish` → `harness skill install`), (b) the dashboard which reads a manually-mirrored copy of the blueprint in `dashboard/lib/workshop-blueprint-agenda.json` + `workshop-blueprint-localized-content.ts`, and (c) the GitHub repo itself. Every content task in this plan must declare which channels it propagates through, or the edits never reach the room.

**Not in scope for this plan** (already covered by other plans or deliberately preserved):
- Czech editorial quality → `2026-04-09-feat-czech-copy-quality-foundation-plan.md`
- Opening talk rewrite → `2026-04-09-feat-opening-talk-reset-and-facilitator-runner-plan.md`
- Presenter content richness → `2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md`
- Scene editorial → `2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md`
- Autonomous planning hardening → `2026-04-09-feat-autonomous-planning-and-hybrid-harness-hardening-plan.md`
- The five teaching-spine principles (explicitly defended by Fowler, Newport, Dignan)
- Czech editorial gates (preserve; language strategy is canonical English with reviewed Czech delivery per `AGENTS.md` lines 72–82)

## Proposed solution

A focused, four-stream remediation that can run mostly in parallel once coordination with in-flight plans is confirmed:

- **Stream A — Framing (English canonical, Czech follows).** Reframe the TDD-adjacent language as "executable specification." Add a single north-star question to `day-structure.md`.
- **Stream B — Codex craft layer (new doc).** A new `content/codex-craft.md` (English canonical) + a one-page "Coaching Codex" recipe card in `materials/`. Tool-specific affordances, approval modes, drift handling, prompt before/after pairs.
- **Stream C — CLI ergonomics.** Four targeted fixes to `harness-cli`: visible instance state, error wrappers, grammar consistency pass, README routing.
- **Stream D — Continuation shift instrumentation.** Capture friction patterns + time-to-productivity signals during the rotation; feed into the dashboard and back into the blueprint as an ADR.
- **Stream F — Distribution & propagation (cross-cutting).** Ensure every content edit and every new artifact reaches all three consumption surfaces (skill bundle, dashboard, GitHub) before the cohort. This is where bundle sync, CLI version bump, npm publish, and dashboard mirror live.

Each stream has its own acceptance criteria. Streams A and C can ship without touching the others. Stream B is the biggest content effort. Stream D is the only one requiring dashboard work. Stream F is the gate that all streams pass through before "done."

### Distribution topology (reference)

```
  AUTHOR EDITS HERE                        REACHES PARTICIPANTS VIA
  ─────────────────                        ────────────────────────
  content/**                         ┌───► harness-cli/assets/workshop-bundle/content/**
  workshop-skill/**                  │     (via scripts/sync-workshop-bundle.mjs)
  workshop-blueprint/**              │     (verified by scripts/verify-workshop-bundle.mjs)
  materials/**                       │     → npm publish @harness-lab/cli
                                     │     → participant runs `harness skill install`
                                     │
                                     └───► dashboard/lib/workshop-blueprint-agenda.json
                                           dashboard/lib/workshop-blueprint-localized-content.ts
                                           (manual mirror today — see Assumptions)
                                           → dashboard deploy
                                           → participant / facilitator / presenter surfaces
```

**Rule for every content task in Phases A/B/E:** declare explicitly which channels the edit must propagate to, and close the propagation in Phase F before calling the task done.

## Implementation tasks

Tasks are ordered by dependency. Streams run in parallel after Phase 0.

### Phase 0 — Coordination (blocks everything else)

- [ ] **Read in-flight plans for overlap.** Specifically: opening-talk-reset (may already touch TDD framing), czech-copy-quality (may already touch phrasing), scene-editorial-rollout (may already touch day-structure narrative), rich-presenter-content (may already touch Codex affordances).
- [ ] **Confirm scope boundaries with in-flight plan owners** for any overlap found. Document boundary decisions inline in this plan's "Decision rationale" before proceeding.
- [ ] **Verify the opening talk file path and current line numbers** (audit referenced `context-is-king.md` line ~54; line numbers may have shifted).

### Phase A — Framing reframe (small edits, large payoff)

- [ ] **A1. Rename "RED test before autonomy" to "executable specification" in `content/talks/context-is-king.md`.** Target: the paragraph that currently frames TDD with agents. New framing: executable constraints the agent can verify against, not test-first dogma. Write English canonical first.
- [ ] **A2. Mirror the rename in `content/challenge-cards/deck.md`** (pre-lunch cards) and any facilitator cue that references "RED test."
- [ ] **A3. Add a north-star question to `workshop-blueprint/day-structure.md`:** *"Does the repo speak for itself?"* Place it as an introductory frame, not a replacement for the five principles. Each phase in the doc should briefly answer it back.
- [ ] **A4. Queue Czech localization pass** for the reframed paragraph and any edited card. Route via the Czech editorial checklist (`content/czech-editorial-review-checklist.md`). Do NOT author in Czech first — honor the canonical English flow per `AGENTS.md` line 75.
- [ ] **A5. Propagation declaration for Stream A.** Channels touched: skill bundle (`content/talks/context-is-king.md`, `content/challenge-cards/deck.md`), dashboard (`workshop-blueprint/day-structure.md` → mirror into `dashboard/lib/workshop-blueprint-localized-content.ts`), GitHub (automatic). Stream A does NOT touch CLI source, so no npm version bump required solely for Stream A — but if A ships alongside C in the same release, they share a version bump (see Phase F).

### Phase B — Codex craft layer (new content)

- [ ] **B1. Draft `content/codex-craft.md` (English canonical).** Sections:
  - Codex approval modes and shell sandboxing affordances
  - Context window as a resource (budget, in-context vs. linked, progressive disclosure in practice)
  - Long-horizon drift: how repo artifacts re-surface constraints across many turns
  - Concrete before/after prompt pair with actual Codex output and failure case
  - Tool selection heuristic: when Codex vs. Claude Code vs. pi
- [ ] **B2. Draft one-page "Coaching Codex" recipe card** at `materials/coaching-codex.md`. The conversational moves that force plan-first work: *"Before you implement, write a one-sentence plan. Smallest check? What could go wrong?"* Pocket-sized. Printable.
- [ ] **B3. Capture one real failure-recovery moment** (agent drifts → repo context catches it → redirect) as a transcript snippet in `content/codex-craft.md`. This is the single most cited missing piece from the Willison lens.
- [ ] **B4. Link both new artifacts from `materials/participant-resource-kit.md`** and from the README "participant" path.
- [ ] **B5. Queue Czech localization** for both new artifacts via the existing content-localization flow. English ships first; Czech follows through the editorial gate.
- [ ] **B6. Decide whether to show one failure-recovery cycle in the live demo slot** (currently 25 min, Newport recommended expanding to ~35 min). This is a facilitator-guide change — coordinate with `opening-talk-reset` plan before editing `content/facilitation/master-guide.md`.
- [ ] **B7. Surface `codex-craft.md` and `coaching-codex.md` from the workshop skill itself.** Decide placement: either add entries to `workshop-skill/SKILL.md` references section or add dedicated commands (`/codex-craft`, `/coach`). Update `workshop-skill/reference.md` and `workshop-skill/commands.md` accordingly. Without this, the new content exists in the bundle but participants cannot discover it from inside Codex.
- [ ] **B8. Add both new artifacts to `harness-cli/assets/workshop-bundle/bundle-manifest.json`.** The manifest controls what gets shipped. An unlisted file is invisible to the install target.
- [ ] **B9. Propagation declaration for Stream B.** Channels touched: skill bundle (new files + manifest entry + `SKILL.md` / `commands.md` / `reference.md` updates + bundle copies under `harness-cli/assets/workshop-bundle/content/` and `/materials/` and `/workshop-skill/`), dashboard (link from participant surface to the new craft doc if the dashboard hosts any content viewer — check `dashboard/lib/workshop-data.ts` for content references), npm publish required (because bundle contents changed). Mirror into `dashboard/lib/workshop-blueprint-localized-content.ts` if the participant web surface lists materials.

### Phase C — CLI ergonomics (harness-cli)

- [ ] **C1. Always print currently-selected workshop instance at the top of `harness workshop status`** in both human and JSON output. "none selected" when absent. No new flags.
- [ ] **C2. Wrap common `harness skill install` failure modes with actionable errors.** Target classes: Windows path length, permissions on `.agents/`, unsupported Node version, network failure during bundle download. Raw Node error becomes fallback, not default.
- [ ] **C3. Grammar consistency pass on `harness workshop <verb>`.** Audit all twelve verbs; document the current grammar inconsistencies (positional vs. flag vs. implicit state); pick ONE grammar and issue deprecation warnings for the odd ones out. Do NOT break existing commands in this pass — additive only, deprecation warnings only.
- [ ] **C4. Add `--confirm-instance <id>` flag option for `harness workshop phase set` and `participant-access --rotate`.** When the selected instance is older than the current shell session OR when `HARNESS_WORKSHOP_INSTANCE_ID` is unset, require confirmation. Eliminates the "rotated access on the wrong workshop" failure class.
- [ ] **C5. README routing fix.** Add within the first 10 lines of the repo `README.md`: *"The `harness` CLI is for facilitators. Participants run `harness skill install` once and then work in Codex."* Link `workshop-blueprint/control-surfaces.md` explicitly as the next read for facilitators.
- [ ] **C6. Add bundle manifest hash check on install.** Warn (not error) if the installed bundle's source commit is older than 14 days. Closes the "stale npm publish" silent-failure class.
- [ ] **C7. Propagation declaration for Stream C.** Channels touched: CLI source (`harness-cli/src/**`), tests (`harness-cli/test/**`), README (`README.md`), npm publish required. No dashboard impact. No content-bundle impact unless Stream B ships at the same time (in which case share a single version bump in Phase F).

### Phase D — Continuation shift instrumentation (dashboard + ADR)

- [ ] **D1. Design the continuation-shift eval signals.** Write a short design doc at `docs/continuation-shift-eval-design.md` enumerating: which repo artifacts the receiving team touched before their first edit, time-to-first-productive-action, friction patterns captured by facilitators, post-rotation qualitative signal from receiving team.
- [ ] **D2. Draft an ADR** at `docs/adr/NNNN-continuation-shift-as-eval.md` recording the decision to treat the rotation as an eval harness, not a metaphor.
- [ ] **D3. Add a lightweight capture surface to the facilitator dashboard.** During the rotation phase, expose a form where facilitators (or receiving teams themselves) can tag artifacts that helped / didn't help. Do NOT over-engineer — free-text + structured tags is enough for the first cohort.
- [ ] **D4. Add a "learnings log" sink** that persists rotation signals across workshop instances, separate from instance-local state per `docs/public-private-taxonomy.md`. This is the feedback loop into the blueprint.
- [ ] **D5. Define the rubric for interpreting signals** in the ADR. What pattern counts as "harness failure"? What counts as "receiving team panic"? Avoid Goodhart — the rubric is qualitative.
- [ ] **D6. Propagation declaration for Stream D.** Channels touched: dashboard (new capture surface + learnings-log sink), ADR in `docs/adr/`, blueprint feedback loop. Requires dashboard deploy. CLI may need a thin `harness workshop rotation-notes` read command (optional; facilitators can use the dashboard directly for the first cohort).

### Phase E — Close the loop

- [ ] **E1. Reveal phase commitment capture.** Update `content/facilitation/master-guide.md` reveal section so each participant writes one sentence: *"Next week I will [X] because [reason from today]."* Collect as a shared artifact. This is the Newport "attention-residue countermeasure."
- [ ] **E2. Add a "what to read after the workshop" section** to `materials/participant-resource-kit.md` — a small, curated reading list (Willison's blog, Codex changelog, Anthropic + OpenAI agent docs) that installs a learning practice, not a frozen curriculum.
- [ ] **E3. Run one dry-run dogfooding pass** of the new `codex-craft.md` and coaching-codex recipe card with a small group (2–3 engineers) before next cohort. Capture signal in `docs/reviews/`. **Dogfood from an actually-installed skill bundle** (`harness skill install` against a pre-release CLI tag), not from the repo — otherwise you are testing GitHub, not what participants will see.
- [ ] **E4. Propagation declaration for Stream E.** Channels touched: skill bundle (`content/facilitation/master-guide.md`, `materials/participant-resource-kit.md`), dashboard (reveal-phase artifact capture may need a surface similar to D3 — decide whether to reuse the same capture mechanism), npm publish bundled with Stream B.

### Phase F — Distribution & propagation (cross-cutting gate)

This phase is the gate every other phase passes through before "done." No task in A, B, C, D, or E is complete until its propagation declaration is satisfied here.

- [ ] **F1. Map every in-flight edit to the distribution topology table** (see Proposed Solution section). Produce a short tracking checklist at the top of this plan (or a linked scratch doc) with one row per edit and columns for: bundle synced, bundle manifest updated, bundle verified, dashboard mirror updated, dashboard tests passing, npm version bumped, npm published, participant install tested end-to-end.
- [ ] **F2. Run `harness-cli/scripts/sync-workshop-bundle.mjs`** after any edit under `content/`, `workshop-skill/`, `workshop-blueprint/`, or `materials/`. This is not optional — the `git status` check at the start of this plan shows both sides of the mirror dirty today, which means someone has been editing both halves by hand. Stop that. Sync is the source of truth; the mirror is generated output.
- [ ] **F3. Run `harness-cli/scripts/verify-workshop-bundle.mjs`** after every sync. It must pass before commit.
- [ ] **F4. Mirror relevant blueprint changes into `dashboard/lib/workshop-blueprint-agenda.json` and `dashboard/lib/workshop-blueprint-localized-content.ts`.** Today this is manual. As part of this plan's close-out, decide whether to (a) leave it manual with a checklist gate, (b) add a pre-commit hook that fails if the blueprint source is newer than the dashboard mirror, or (c) generate the dashboard file from the blueprint at build time. Recommendation: start with (b) for this cohort — one line in `lefthook`/`husky` config; low risk. Generating at build time is a follow-up.
- [ ] **F5. Run dashboard regression suite** (`dashboard/e2e/dashboard.spec.ts` and unit tests under `dashboard/lib/*.test.ts`) after every mirror update.
- [ ] **F6. Bump `harness-cli` version** once per ship window. Single coordinated bump covering all streams that made it into this cohort's release, not per-stream bumps. Follow semver: bundle content changes = patch; CLI behavior additions (Stream C) = minor; breaking grammar changes = deferred to v2 post-cohort.
- [ ] **F7. Publish `@harness-lab/cli` to npm** after all regression suites pass and bundle verification passes.
- [ ] **F8. End-to-end install test from a clean checkout.** In a fresh directory: `npm install -g @harness-lab/cli@<new version> && harness skill install && open Codex && verify the new `/commands` or content references actually resolve`. If this fails, nothing shipped — roll back or patch and republish.
- [ ] **F9. Deploy the dashboard** after the npm publish succeeds. Order matters: participants installing a new CLI expect the dashboard to match. Deploying the dashboard first risks showing content that isn't yet in the installed skill bundle; deploying the CLI first risks participants seeing fresh content in Codex while the dashboard still shows the old agenda. Resolve by deploying CLI → waiting for npm propagation → deploying dashboard within a short window.
- [ ] **F10. Smoke test all three surfaces** after deploy: participant mobile view (QR scan flow), facilitator dashboard (phase control + new rotation capture surface from Stream D), presenter scene render. Each surface should reflect the new content.
- [ ] **F11. Update `docs/plans/` with a short release note** summarizing which streams shipped, which slipped, and what the next cohort will inherit.

## Acceptance criteria

- [ ] The phrase "RED test before autonomy" no longer appears in participant-facing content. Replacement wording explains executable constraints without invoking TDD.
- [ ] `content/codex-craft.md` exists (English canonical) and contains at least one real before/after prompt pair with actual Codex output and one failure-recovery transcript.
- [ ] `materials/coaching-codex.md` exists as a one-page recipe card; linked from the participant resource kit.
- [ ] `harness workshop status` prints the selected instance (or "none selected") unconditionally. Verified with a new CLI snapshot test.
- [ ] `harness skill install` produces actionable error messages for the four target failure classes. Verified by forced-error test or manual check on each platform.
- [ ] Repo `README.md` routes facilitators to `control-surfaces.md` and participants to `harness skill install` within the first ten lines.
- [ ] The continuation shift is documented as an eval in an ADR, with a capture surface live on the facilitator dashboard.
- [ ] The reveal phase produces a shared "Monday commitments" artifact.
- [ ] Czech translations for all edited/new participant-facing content have passed the `czech-editorial-review-checklist.md` gate.
- [ ] **Every content edit in Phases A / B / E has reached all three distribution channels it declared.** Specifically: bundled in the CLI's workshop-bundle, mirrored into the dashboard blueprint files where applicable, and present in the GitHub main branch. Verified by F1's tracking checklist.
- [ ] **A fresh `npm install -g @harness-lab/cli && harness skill install` on a clean machine surfaces the new content** (codex-craft doc, coaching-codex card, reframed talk paragraph, updated challenge cards) and the new CLI affordances (instance state in `status`, actionable install errors). Verified in F8.
- [ ] **The dashboard's participant, facilitator, and presenter surfaces render the updated agenda and content** without fallback to pre-edit copy. Verified in F10.
- [ ] **`git status` is clean of stray content/bundle mirror desync** at the end of the plan — both sides should be in sync, driven exclusively by `sync-workshop-bundle.mjs`.
- [ ] **A pre-commit or CI gate exists** (per F4) that catches future drift between `workshop-blueprint/` source and `dashboard/lib/workshop-blueprint-*` mirrors.

## Decision rationale

**Why one consolidated plan instead of five.** The audit surfaced four streams, but they share a common source (the expert review), a common coordination surface (overlap with in-flight April 9 plans), and a common shipping target (before the next cohort). Splitting them into separate plans would duplicate the Phase 0 coordination work four times. Splitting streams into their own sub-plans can happen later if any one grows beyond a couple of days of work.

**Why Stream A (framing) is so small.** Fowler's review was very specific: it's a three-line edit in one file plus echoes in a handful of challenge cards. Scaling this up would be YAGNI. The audit explicitly praised the underlying discipline; only the vocabulary needs to change.

**Why Stream B (Codex craft) is a new doc, not a rewrite of existing content.** The workshop is deliberately agent-agnostic at the method layer. Amodei and Willison lenses both noted this is defensible — but participants need a tool-fluency layer *on top of* the method layer. A new doc preserves the agent-agnostic spine while giving participants the Codex-specific fluency they actually need. Two layers beats rewriting one.

**Why Stream C does not rewrite the CLI.** Hashimoto's review flagged ergonomic paper cuts, not architectural problems. The grammar inconsistency is real but the right fix is a deprecation pass, not a v1 → v2 break. Participant-facing CLI behavior should be stable for the next cohort; facilitator ergonomics can improve behind additive changes.

**Why Stream D exists at all.** The audit's strongest consensus finding is that the continuation shift is the workshop's best idea and is being under-used. Treating it as an eval rather than a metaphor turns it into a feedback loop that makes the blueprint itself learn from each cohort. This is the single change that most increases the workshop's long-term value.

**Alternatives considered:**
- *Do nothing and rely on the in-flight April 9 plans.* Rejected: those plans don't cover the Codex craft gap, continuation-shift instrumentation, or CLI ergonomics. They would leave 60% of the audit findings unaddressed.
- *One giant remediation plan covering everything including the in-flight work.* Rejected: would duplicate and possibly contradict owned plans. Coordination is cheaper.
- *Defer Stream D (instrumentation) to a follow-up cohort.* Considered. Acceptable fallback if timelines slip — D1/D2 (design + ADR) must still ship in this plan, but D3/D4/D5 (dashboard surface + persistence) can slip without blocking the cohort.

## Assumptions

| Assumption | Status | Evidence / How to verify |
|---|---|---|
| Canonical language is English with reviewed Czech delivery | **Verified** | `AGENTS.md` lines 72–82 |
| The `2026-04-09-feat-opening-talk-reset-and-facilitator-runner-plan.md` does not already rewrite the TDD paragraph | **Unverified** | Read that plan before Phase A1 (Phase 0 task) |
| The `2026-04-09-feat-czech-copy-quality-foundation-plan.md` is not already editing the same challenge cards | **Unverified** | Read that plan before Phase A2 (Phase 0 task) |
| `harness-cli` has a test harness that supports CLI snapshot tests | **Unverified** | Check `harness-cli/test/` or package scripts before Phase C1 |
| The dashboard has a facilitator-writable data surface the rotation-eval form can piggyback on | **Unverified** | Check `dashboard/lib/` for existing facilitator-mutation endpoints before Phase D3 |
| Czech editorial review can turn around reframed copy within the same cohort window | **Verified** | Czech editorial flow exists (`czech-editorial-review-checklist.md`) and is referenced in other April 9 plans |
| Facilitators actually want the continuation-shift capture surface (not "one more thing to do in the room") | **Unverified — cohort feedback required** | Validate in Phase E3 dogfooding |
| Codex's current approval-mode / sandboxing behavior matches what `codex-craft.md` will document | **Unverified — dependent on Codex version** | Verify against the installed Codex version during Phase B1 drafting |
| `harness-cli/scripts/sync-workshop-bundle.mjs` is the single source of truth for the bundled mirror and is safe to re-run idempotently | **Assumed — verify in Phase 0** | Read the script once before Phase F2 to confirm it is idempotent and does not overwrite user-edited files under `harness-cli/assets/workshop-bundle/` |
| The dashboard mirror (`dashboard/lib/workshop-blueprint-*`) is safe to regenerate from `workshop-blueprint/` without losing instance-local overrides | **Unverified** | Check `docs/workshop-content-language-architecture.md` and any ADR about the mirror before F4. If runtime overrides are layered on top, the regeneration strategy must preserve them. |
| The dirty state in `git status` (both `content/` and `harness-cli/assets/workshop-bundle/content/` modified) reflects pending edits, not permanent drift between source and mirror | **Needs confirmation** | Diff the two halves before Phase 0 closes. If they already diverge structurally, a reconciliation task precedes everything else. |
| npm publish + participant `harness skill install` end-to-end works from a clean machine today | **Likely verified recently but worth re-checking** | F8 is the explicit re-verification task |

Unverified assumptions are either blocked by Phase 0 coordination tasks or explicitly called out in Risk Analysis below.

## Risk analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Overlap with in-flight April 9 plans causes merge conflicts or contradictory edits | Medium | Medium | Phase 0 coordination is a hard blocker. No Phase A/B/C/D work begins until overlap is documented. |
| `codex-craft.md` becomes stale within weeks as Codex ships new modes | High | Medium | Timestamp the doc explicitly. Add a "last verified against Codex version X on date Y" footer. Stream E includes a reading-list pointer so participants don't depend on the doc freezing knowledge. |
| CLI grammar deprecation warnings confuse facilitators mid-cohort | Low | Medium | Ship deprecation warnings only; do not break commands in this plan. Schedule the actual grammar break for a post-cohort v2 release. |
| Continuation-shift capture surface feels like homework during a busy rotation | Medium | High | Optional-tagging model. Do not gate rotation progression on form completion. Measure opt-in rate in Phase E3 dogfooding; redesign if under 50%. |
| Czech editorial gate becomes a bottleneck for the framing reframe | Low | Low | Stream A is small (3-4 phrases); Czech pass should be hours, not days. If it slips, the English version can ship first and Czech can catch up via the existing localization flow. |
| The "Coaching Codex" recipe card overlaps with something the `rich-presenter-content` plan is already authoring | Medium | Low | Resolved during Phase 0 coordination. If overlap exists, merge the two artifacts; do not ship two cards. |
| Dogfooding in Phase E3 reveals the codex-craft doc is wrong in a specific way | Medium | Low | Dogfooding is the point. Budget time for one revision pass after E3 before declaring Phase B done. |
| **Content lands in the repo but never reaches participants** because the bundle sync was skipped, the npm publish never happened, or the dashboard mirror drifted | **High without Phase F; Low with it** | **High** | Phase F exists precisely to close this. Every content task has a propagation declaration. The plan does not call any content task "done" until F1 confirms distribution. |
| **Ordering hazard: CLI publishes with new bundle content before the dashboard reflects it** (or vice versa), producing a short window where participant Codex and the dashboard show different content | Medium | Medium | F9 defines the deploy order explicitly: CLI → short wait → dashboard. Acceptable skew window is minutes, not hours. |
| **Sync script overwrites hand-edits in the mirror** under `harness-cli/assets/workshop-bundle/` that someone made by mistake (because the `git status` shows both halves dirty today) | Medium | Medium | Phase 0 task: diff the two halves, reconcile any divergence before anyone runs the sync script fresh. Any real content belongs on the source side, not the mirror side. |
| **Dashboard mirror regeneration loses instance-local overrides** if runtime layering is undocumented | Low | High | Assumption flagged; verify against `docs/workshop-content-language-architecture.md` and the private-workshop instance docs before F4 lands. |
| **Pre-commit hook for blueprint → dashboard mirror drift (F4 option b) triggers noisily** for maintainers doing unrelated edits | Medium | Low | Scope the hook narrowly to the specific mirror files. Provide an explicit bypass message with the one command to run to fix. |

## References

- Expert audit session transcript: 2026-04-09 (Fowler, Newport, Amodei lens, Ng, Orosz, Hashimoto, Dignan, Willison)
- Language strategy: `/Users/ondrejsvec/projects/Bobo/harness-lab/AGENTS.md` lines 72–82
- Czech editorial gate: `content/czech-editorial-review-checklist.md`
- Public/private taxonomy: `docs/public-private-taxonomy.md`
- In-flight plans with coordination surface:
  - `docs/plans/2026-04-09-feat-opening-talk-reset-and-facilitator-runner-plan.md`
  - `docs/plans/archive/2026-04-09-feat-czech-copy-quality-foundation-plan.md`
  - `docs/plans/archive/2026-04-09-feat-workshop-scene-editorial-rollout-and-copy-excellence-plan.md`
  - `docs/plans/archive/2026-04-09-feat-workshop-blueprint-rich-presenter-content-plan.md`
  - `docs/plans/archive/2026-04-09-feat-autonomous-planning-and-hybrid-harness-hardening-plan.md`
- Target files for edits (verify line numbers before editing):
  - `content/talks/context-is-king.md`
  - `content/challenge-cards/deck.md`
  - `workshop-blueprint/day-structure.md`
  - `content/facilitation/master-guide.md`
  - `materials/participant-resource-kit.md`
  - `README.md`
  - `harness-cli/src/**` (CLI ergonomics)
  - `dashboard/**` (continuation-shift capture surface)
- Distribution pipeline files:
  - `harness-cli/scripts/sync-workshop-bundle.mjs` — source → bundle mirror
  - `harness-cli/scripts/verify-workshop-bundle.mjs` — bundle integrity gate
  - `harness-cli/assets/workshop-bundle/bundle-manifest.json` — shipped file list
  - `harness-cli/package.json` — version bump + publish config
  - `dashboard/lib/workshop-blueprint-agenda.json` — dashboard agenda mirror
  - `dashboard/lib/workshop-blueprint-localized-content.ts` — dashboard content mirror
  - `dashboard/lib/workshop-data.ts` — content read path
  - `dashboard/e2e/dashboard.spec.ts` — dashboard regression
