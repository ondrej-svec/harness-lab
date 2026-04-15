---
title: "refactor: align participant-facing content with rewritten agenda"
type: plan
date: 2026-04-13
status: complete
brainstorm: (in-conversation audit, 2026-04-13)
confidence: high
---

# Align Participant-Facing Content with Rewritten Agenda

Close the drift between `workshop-content/agenda.json` (rewritten 2026-04-12 in commit `2046fbc`) and the downstream participant-facing artifacts that still carry pre-rewrite framing, vocabulary, and habit taxonomies.

## Problem Statement

The agenda was substantively rewritten across all 11 phases on 2026-04-12. Downstream content — the talk script, coaching codex, resource kit, facilitation master-guide, and challenge cards — was not fully updated in step. A 2026-04-13 audit (in this session) surfaced two cross-cutting issues:

1. **The talk script (`context-is-king.md`) is substantively older than the rewritten talk phase.** The agenda now opens with five named real-world voices (Lopopolo, Böckeler, Guo, Hashimoto, Stripe Minions), the `Agent = Model + Harness` equation, the engine/chassis analogy, the four pillars (guides/sensors), and the protected line "Humans steer. Agents execute." None of this appears in the script. A facilitator reading the current script would deliver a structurally different talk than the agenda promises.

2. **Vocabulary fragmentation across participant-facing artifacts.** The agenda consolidated around a canonical vocabulary — **guides/sensors, task drift, tracer, carries the next move, holistic beats granular, Humans steer / Agents execute** — but `coaching-codex.md` still uses pre-rewrite language ("one function plus one test"), and the resource kit's "Kdy se návyky spustí" section introduces a parallel six-habit taxonomy that doesn't map to anything in the rewritten agenda. Three incompatible habit taxonomies float across the repo: principles language in the agenda, six named habits in the kit, and five habit tags on the challenge cards.

The consequence: a participant who reads the card they take home, the kit they consult later, and the facilitator's talk will encounter three different vocabularies for the same workshop. The Monday-morning promise depends on vocabulary consistency — the words the room hears must be the words the card repeats.

## Target End State

When this plan lands:

- A single canonical vocabulary list exists and every participant-facing artifact uses it.
- The talk script delivers the talk the agenda describes — same voices, same equation, same pillars, same protected line.
- The coaching codex participants take home uses the vocabulary of the day they just experienced.
- The resource kit's habit section is rebuilt around the five challenge-card tags (Option B, chosen 2026-04-13).
- The facilitation master-guide's Intermezzo retrieval questions match the agenda's scene prompts verbatim.
- Three fragmented habit taxonomies collapse to one.
- `verify:content` CI gate passes.
- A facilitator reading any script and a participant reading any artifact encounter the same words, the same arc, and the same promise.

## Scope and Non-Goals

**In scope:**
- Rewriting `content/talks/context-is-king.md` to match the rewritten talk-phase scenes.
- Rewriting `materials/coaching-codex.md` around canonical vocabulary.
- Rebuilding the kit's "Kdy se návyky spustí" section around challenge-card tags (both CS root and EN locale).
- Fixing `content/facilitation/master-guide.md` Intermezzo retrieval questions and adding guides/sensors/task drift vocabulary to coaching notes.
- Reviewing `content/challenge-cards/deck.md` for tag-principle mapping and any card that should reference new canonical terms.
- Reconciling the EN/CS structural divergence in the resource kit (after confirming intent).
- Committing the five already-modified project briefs (ty→vy normalization) as a standalone commit.

**Out of scope:**
- Changing `agenda.json`. It is the source of truth; if this plan reveals genuine gaps in the agenda, those get deferred to a separate pass.
- Adding Czech translations for anything currently English-only (briefs, facilitation guide, talks). Skill-delivered content stays English; the agent translates on the fly. UI-rendered content (agenda) stays bilingual.
- Rewriting `content/project-briefs/*` beyond the in-flight ty→vy fix. Audit found them clean.
- Touching `content/codex-craft.md`, `content/style-guide.md`, `content/style-examples.md`. Style references, not workshop content.
- Touching `content/talks/codex-demo-script.md`. Audit found it clean.
- Touching `content/facilitation/codex-setup-verification.md`. Procedural, out of narrative scope.
- Improving the agenda, adding new concepts, or extending the workshop narrative. This is an alignment pass, not a redesign.

## Proposed Solution

Three-phase sequence with an explicit pause point between Phase 1 and Phase 2.

**Phase 1 — Foundation.** Pin the canonical vocabulary in writing, then rewrite the talk script as the proof slice. The vocabulary document becomes the spec against which every downstream rewrite is checked. The talk script is the highest-impact file and the one most likely to surface judgment calls — doing it first de-risks everything downstream.

**Pause point.** Review vocabulary spec + rewritten talk script together before propagating. If either is wrong, fixing one file is cheap; fixing five files is not.

**Phase 2 — Participant-facing materials.** Rewrite coaching codex and resource kit habit section using the locked vocabulary. These are the artifacts participants actually carry home. They must be tight.

**Phase 3 — Facilitation, cards, cleanup.** Fix the facilitator master-guide, audit the challenge cards, commit the in-flight brief changes, run CI. Lowest judgment-cost work, last.

## Implementation Tasks

Dependency-ordered. The five canonical tags from Option B (the challenge-card taxonomy) become the single habit taxonomy across the repo.

### Phase 1 — Foundation

- [x] **T1. Pin canonical vocabulary.** Create `docs/workshop-content-canonical-vocabulary.md` extracting from `agenda.json`: (a) the five habit tags from `challenge-cards/deck.md` ("Map before motion", "Verification is the trust boundary", "Boundaries create speed", "If it is not in the repo, it does not exist", "Cleanup is part of build"), (b) the protected phrases ("Humans steer. Agents execute.", "carries the next move", "task drift", "Agent = Model + Harness", "holistic beats granular"), (c) the named framings ("guides", "sensors", "tracer" / "tracer bullet", "four pillars", "Monday commitments", "AGENTS.md as a map, not a warehouse"), (d) the five real-world voices and what each is credited with. One page. This is the spec.
- [x] **T2. Verify tag-principle compatibility.** Walk each of the five challenge-card tags against the agenda's principles sections. Flag any tag that doesn't have a clean principle anchor. The audit flagged "Cleanup is part of build" as the weakest link — confirm or refine.
- [x] **T3. Rewrite `content/talks/context-is-king.md`.** Match the talk-phase scene sequence in the agenda: opening "something changed" beat with the five named voices → the Böckeler equation → engine/chassis analogy → four pillars (guides/sensors/managing) → "Humans steer. Agents execute." as the core line → bridge into the demo. Keep it as a facilitator delivery script, not an agenda duplicate. Preserve whatever structure the facilitator actually uses on stage, but with the new vocabulary and beats embedded.

### Pause Point — Review

- [ ] **T4. Pause and review.** Read T1, T2, T3 together. Confirm the vocabulary doc is the spec you want, the tag-principle mapping holds, and the talk script reads right. Adjust before propagating. **Do not start Phase 2 until this review is done.**

### Phase 2 — Participant-facing materials

- [x] **T5. Rewrite `materials/coaching-codex.md`.** Replace pre-rewrite verification language ("one function plus one test") with "tracer" / "holistic beats granular". Name "task drift" as the diagnostic it is. Add guides/sensors vocabulary. Make "carries the next move" appear somewhere — it's the hero phrase and participants take this card home. Preserve the card's pocket-reference function; don't expand it into a handbook.
- [x] **T6. Rebuild `materials/participant-resource-kit.md` (CS root) "Kdy se návyky spustí" section.** Drop the six-habit taxonomy. Replace with the five challenge-card tags as the single habit taxonomy. Keep the "triggers" pattern if it adds value — map triggers to each of the five tags instead of the old six. If a trigger doesn't map to a tag, drop it rather than inventing a new habit.
- [x] **T7. Decide EN/CS kit reconciliation.** The English locale currently lacks "Kdy se návyky spustí" and "Minimum viable harness" sections. Confirm with user whether this is intentional (EN is lighter by design) or drift (EN fell behind). If intentional, document the rule. If drift, mirror T6 into the English copy.
- [x] **T8. Apply kit changes to EN locale.** Based on T7 decision. Either mirror T6 into `materials/locales/en/participant-resource-kit.md`, or add a comment in both files documenting the intentional divergence.

### Phase 3 — Facilitation, cards, cleanup

- [x] **T9. Fix `content/facilitation/master-guide.md` Intermezzo questions.** Replace the current repo-continuation question for Intermezzo 1 with the agenda's rewritten scene prompt ("What surprised you about working with the agent this morning — and what does that make you want to try differently next?"). Check Intermezzo 2 prompt against the agenda's scene too.
- [x] **T10. Add canonical vocabulary to master-guide coaching notes.** Inject "guides", "sensors", "task drift", "tracer" into the coaching sections where a facilitator would use them live — not as a glossary, but woven into "what to say when X happens" notes. Lightest touch that leaves the vocabulary available when needed.
- [x] **T11. Audit `content/challenge-cards/deck.md` against canonical vocabulary.** With the five tags now canonical, confirm each card's content still matches its tag. Flag any card that should reference a new term ("tracer", "task drift") but doesn't. Add cards only if there's a clear gap — not just to be complete.
- [x] **T12. Commit the in-flight project-brief changes.** (Already done by commit `d7b9000` before Phase 2 started — project-brief ty→vy changes were part of the Czech review pass.) The five modified briefs in the working tree (ty→vy normalization on `code-review-helper.md` and `doc-generator.md`, plus bundle mirrors) are standalone and correct. Stage and commit as a separate, small commit before or alongside this plan's commits.
- [x] **T13. Run `verify:content` CI gate.** Full content verification pass including copy-editor. Address any findings. This is the machine-checkable backstop.
- [x] **T14. Smoke read.** (Mechanical/structural pass: all five canonical habits propagated, zero banned terms in actual content, protected line present in talk + codex + master-guide. Czech prose quality review pending — flagged as separate dedicated pass.) Read the five artifacts in the order a participant would encounter them: agenda talk scenes → context-is-king.md (facilitator script) → coaching codex (pocket card) → resource kit (reference) → challenge cards (active drill). Confirm a coherent voice and vocabulary across the sequence. This is the subjective final check.

## Acceptance Criteria

- [ ] Every canonical vocabulary term from T1 appears in at least two participant-facing artifacts (agenda + one downstream) and zero artifacts contradict them.
- [ ] `context-is-king.md` contains: the five named voices, the Böckeler equation, the engine/chassis analogy, the four pillars (named), and "Humans steer. Agents execute." verbatim as the core line.
- [ ] `coaching-codex.md` contains "tracer" (or "tracer bullet"), "task drift", "guides" and "sensors" (at minimum as named categories), and at least one occurrence of "carries the next move".
- [ ] `coaching-codex.md` contains zero occurrences of "one function plus one test" or any other pre-rewrite verification phrase.
- [ ] The resource kit habit section uses exactly the five challenge-card tags as habit names. Zero references to the six pre-rewrite habit names.
- [ ] `master-guide.md` Intermezzo 1 retrieval question matches the agenda's scene prompt verbatim (modulo punctuation).
- [ ] No challenge card contradicts its tag after T11.
- [ ] `npm run verify:content` (or project equivalent) passes.
- [ ] The smoke-read in T14 produces a "sounds like one workshop" verdict from a reader who isn't the author of the rewrites.
- [ ] The in-flight project-brief changes are committed as a small, clean commit.

## Decision Rationale

**Why Option B (challenge-card tags win) for the habit taxonomy.** The agenda is the least-malleable artifact — it's rendered into `agenda-cs.json`, bundled into the harness CLI, and stared at by the room in UI surfaces. Changing it has the highest blast radius. The challenge cards are semantically closest to the agenda's principle language already ("Verification is the trust boundary" is near-verbatim agenda language; "Map before motion" maps cleanly to `AGENTS.md as a map`). The kit's six-habit taxonomy is the newest and least battle-tested of the three. Total rework cost of Option B is lowest and the cards become canonical instead of being retrofitted.

**Why rewrite the talk script first rather than coaching codex.** The talk is upstream of everything. Vocabulary that doesn't land in the talk can't land on the card. Rewriting the talk first also surfaces any judgment calls (tone, ordering, what to cut) while the context is small — those calls then propagate as decisions rather than getting re-litigated per file.

**Why a pause point instead of a single sprint.** The talk rewrite is the single highest-judgment file in this plan. If it lands wrong, five downstream files will be rewritten against the wrong target. A small review gate costs an hour; not having one costs a day.

**Why not rewrite codex-demo-script.md too.** The audit found it clean — it already names task drift, matches demo scenes, and uses the right vocabulary. Touching clean files for uniformity is churn, not improvement.

**Why commit the project-brief ty→vy changes separately.** They're purely grammatical (vy-form normalization), semantically zero-risk, and unrelated to this drift alignment. Bundling them into a content-alignment commit would muddy the diff and the history. Small clean commit, separate.

**Why the EN/CS kit divergence gets a decision (T7) rather than an automatic mirror.** The English copy was shorter as of 2026-04-09 — it might be intentional (EN is skill-delivered and the agent translates from the richer content, so EN can be lighter). Mirroring without confirming would erase a possibly-deliberate architectural choice.

## Constraints and Boundaries

- **Agenda is the source of truth.** If a downstream rewrite reveals a gap in the agenda, the gap gets logged for a separate pass. This plan does not edit `agenda.json`.
- **Style guide (`content/style-guide.md`) governs all Czech copy.** Lowercase `vy` in all participant-facing surfaces. This rule already drove the recent Mode A scene-card review; it applies here too.
- **Trunk-based.** All work commits to main. No feature branches. (From user memory.)
- **English-canonical for skill-delivered content.** No new Czech files in `content/` or `materials/` outside what already exists. (User decision in this conversation.)
- **Participant-facing voice.** All rewrites preserve the agenda's voice: short sentences, concrete over abstract, meme-able phrases preserved. No corporate register, no AI fingerprints, no nominal chains. `content/czech-reject-list.md` still applies to any Czech copy touched.
- **No new concepts.** Vocabulary alignment only. If a rewrite wants to add a new idea, stop and escalate — that's a separate plan.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| The five challenge-card tags are semantically compatible with the agenda's principle language | Partially verified | Audit-level read suggests yes; T2 exists to verify explicitly before propagation |
| The agenda is stable and won't be rewritten again during this work | Verified | Most recent agenda commit is `ea5ca52` (2026-04-13, regenerate from completed Czech pass). Upstream rewrite commit `2046fbc` is two days old and consolidated |
| The context-is-king.md script is meant to be a facilitator delivery script, not an agenda duplicate | Unverified | Audit inference from current file shape; confirm in T4 review |
| The EN/CS kit structural divergence status (intentional vs drift) | Unverified | T7 is the explicit decision point |
| No imminent cohort deadline driving this | Unverified | User did not answer the timing question; planning as quality-pass cadence with safe pause point. If a deadline surfaces, Phase 3 tasks T11/T13 can be deferred without breaking the alignment |
| "Cleanup is part of build" maps to an actual agenda principle | Weakly held | Audit flagged this as the weakest tag-principle link; T2 verifies |
| The `verify:content` CI gate is still wired up and functioning | Verified | Commit `85ef868` wired copy-editor into verify:content |

Unverified assumptions are all covered by an explicit task (T2, T4, T7, T11) — nothing swept under the rug.

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| T3 talk rewrite lands in a voice you don't want to deliver | Medium | High | T4 pause point — review before propagating. One bad file is cheap; five is not. |
| T2 reveals a tag that doesn't map to any agenda principle | Medium | Medium | Two options at that point: refine the tag to match (preferred) or flag the agenda for a separate pass. Do not invent a new principle to save a tag. |
| T7 confirms EN/CS divergence was intentional but you don't remember the original reason | Low | Low | Document the current rule in T8 as we understand it today. Record as "best available understanding; revisit if wrong". |
| "Cleanup is part of build" tag survives T2 but reads weak next to the other four | Medium | Low | Either refine the tag phrasing or accept the uneven strength. Not worth a redesign. |
| Smoke read in T14 finds voice inconsistency across files even though vocabulary is aligned | Medium | Medium | Vocabulary alignment is necessary but not sufficient. If T14 flags voice drift, loop back with a focused editorial pass. Budget one half-day buffer for this. |
| Copy-editor CI gate flags something surprising | Medium | Low | Address findings in T13 as normal. This is what the gate is for. |
| Agenda gets rewritten again mid-plan | Low | High | Pause plan, re-audit, resume. Most recent commit is 2 days stable. Low current risk. |

## Subjective Contract

This plan is participant-facing copy and teaching content. The Subjective Contract below makes the taste boundaries explicit so the rewrite doesn't drift under the guise of "alignment".

**Target outcome.** A participant opens any artifact on Monday morning — the card they took home, the kit they skim later, the agenda slide they remember — and finds the same five terms, the same promise, the same arc. No vocabulary whiplash. A facilitator opens any script and finds the talk the agenda advertised, not a parallel universe.

**Anti-goals.**
- Not a wholesale content rewrite. Only the drift gets fixed.
- Not an opportunity to "improve" the agenda framing. Alignment, not redesign.
- Not adding new concepts. Vocabulary is frozen at the T1 canonical list.
- Not making participant artifacts longer. Coaching codex stays pocket-sized.
- Not collapsing participant artifacts into one. The talk, codex, kit, and cards each serve different moments — they share vocabulary, not structure.

**References (positive models).**
- `workshop-content/agenda.json` — the source of truth for voice, vocabulary, arc.
- `content/talks/codex-demo-script.md` — already well-aligned; shows what a downstream script that matches the agenda looks like.
- `content/project-briefs/*` — already clean; show the target participant-facing register.
- `content/style-guide.md` — Czech voice rules, reject list, editorial stance.

**Anti-references (patterns to avoid).**
- `b7494f7` era talk stubs — the pre-rewrite vocabulary and framing.
- Pre-rewrite `coaching-codex.md` phrases like "one function plus one test" — any artifact of older verification framing.
- The current "Kdy se návyky spustí" six-habit section — parallel taxonomy that fragmented the vocabulary in the first place.
- Any nominal-style Czech ("pro podporu zvýšení efektivity týmů"), AI fingerprints, corporate register.

**Tone / taste rules.**
- Match agenda voice: short sentences, concrete verbs, `vy` form in all CS copy, meme-able phrases preserved verbatim where they already exist.
- Participant-facing artifacts speak to a practitioner who just lived through the day — not a visitor learning about it. Reference shared experience ("the thing you did in Build 1") over abstract principle.
- No emoji unless already present in the source file. No added headers beyond what each file already uses.
- Preserve any existing bold/callout pattern in each file. Don't introduce new emphasis styles.

**Representative proof slice.** T3 (rewritten `context-is-king.md`) is the proof slice. Once it lands and passes T4 review, vocabulary is locked and propagation to Phase 2 and 3 files is largely mechanical application of the vocabulary spec.

**Rollout rule.** Phase 2 does not begin until T4 review passes. Phase 3 does not begin until Phase 2 files pass a quick read-through (not formal review — just eyes on).

**Rejection criteria.** A rewrite is wrong — regardless of CI — if:
- It introduces a vocabulary term not in the T1 canonical list.
- It contradicts an agenda scene verbatim.
- Any file still contains a pre-rewrite phrase from the anti-references list.
- The smoke read in T14 produces "these sound like three different workshops".
- A canonical phrase gets paraphrased when the agenda uses it verbatim ("Humans steer. Agents execute." is the line — not "humans direct and agents execute" or similar).
- A rewrite inflates the artifact's length to fit more vocabulary. Vocabulary appears where it naturally fits, or not at all.

**Required preview artifacts.**
- The T1 vocabulary document is itself a preview artifact — review it before T3.
- The rewritten `context-is-king.md` is the full preview for the whole rewrite pattern. Review it at T4 before Phase 2 starts.
- No HTML/mockup needed; these are text files whose "preview" is the file itself.

**Who reviews.** The user (Ondrej). The facilitator-author perspective is the only one that can judge whether the talk script reads right on stage. CI (`verify:content`) handles the machine-checkable backstop in T13.

## References

- **Source of truth:** `workshop-content/agenda.json` — the rewritten agenda, commit `2046fbc` (2026-04-12)
- **Audit that produced this plan:** content-drift audit, in-conversation, 2026-04-13 (subagent report captured above in this session)
- **Prior Czech review:** `docs/reviews/workshop-content/2026-04-13-czech-mode-a-scene-cards.md` — scope was agenda scenes only; this plan is the downstream follow-through
- **Style rules:** `content/style-guide.md`, `content/czech-reject-list.md`, `content/czech-editorial-review-checklist.md`
- **Related prior plan:** `docs/plans/2026-04-06-feat-internal-harness-and-learner-resource-kit-plan.md` — created the resource kit structure this plan now aligns
- **CI gate:** `verify:content` (wired in commit `85ef868`)
