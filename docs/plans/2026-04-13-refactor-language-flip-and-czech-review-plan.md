---
title: "refactor: enforce English-canonical layout and review every Czech translation"
type: plan
date: 2026-04-13
status: in_progress
brainstorm: (in-conversation, builds on 2026-04-13-refactor-content-drift-alignment-plan.md)
confidence: medium
---

# English-Canonical Layout Flip + Thorough Czech Translation Review

Make the file system match the architecture rule already documented in `docs/workshop-content-language-architecture.md` ("English is the long-term reusable source language; Czech is a first-class reviewed delivery locale"), and review every Czech file in the repo against canonical English so the Czech reads as native, not as a translation.

## Problem Statement

`docs/workshop-content-language-architecture.md` (committed, line 59) already establishes the rule: **English is canonical, Czech is a reviewed delivery locale**. The file system contradicts this rule in two ways:

1. **Layout violates the rule.** Most participant-facing files have **Czech at the canonical root** (e.g., `content/talks/context-is-king.md` is Czech) with **English in `locales/en/`** subdirectories. That is the inverse of the documented rule. Contributors looking at the directory structure will keep treating Czech as primary because the structure tells them to.

2. **Czech quality is uneven.** The 2026-04-13 Czech Mode A scene-cards review only covered the top 10 agenda scenes. The remaining ~27 agenda scenes got a bulk `ty→vy` sweep but no per-scene prose review. Outside the agenda, the project briefs, master-guide, challenge cards, talk scripts, and resource kit have never had a thorough native-speaker review — and today's drift-alignment session showed that even small Czech edits introduce errors when the editor is non-native (caught: `návyků`/`návyky` mismatch; `Ta sílu`/`Tu sílu`; the whole engine/chassis paragraph; the unnatural `do příštího dne u klávesnice` formulation that the review subagent caught).

3. **Some files have no translation at all.** `materials/coaching-codex.md` is English-only (created/rewritten in this session). `content/facilitation/master-guide.md`, `content/facilitation/codex-setup-verification.md`, `content/challenge-cards/deck.md`, `content/challenge-cards/print-spec.md`, and `content/talks/codex-demo-script.md` are Czech-only. If English is canonical and Czech is first-class, every participant-facing file needs both.

The consequence: the rule is documented but not enforced; some artifacts have rough Czech that only Czech-fluent humans would catch; and the file system actively pushes contributors toward the wrong default.

## Target End State

When this plan lands:

- Every participant-facing file with Czech content has a canonical English source AND a reviewed Czech translation.
- The file system mirrors the architecture rule: English at the root, Czech in `locales/cs/`.
- Every Czech file has been read carefully by a Czech-native reviewer (Ondrej) — either with or without a subagent first pass — and the review is recorded in `.copy-editor.lock.json` with `reviewedBy` populated.
- All `cs_reviewed: false` flags in `agenda.json` flip to `true` for scenes that passed review.
- `verify:content` gate passes, including the copy-editor pass.
- A Czech reader picks up any participant-facing file and can't tell it was translated from English. It reads as if a Czech engineer wrote it from scratch.
- The canonical vocabulary in `docs/workshop-content-canonical-vocabulary.md` survives intact across both languages.
- A future contributor opening the repo sees English at the root of every directory and knows where to add a Czech translation when they edit content.

## Scope and Non-Goals

**In scope:**
- All ~14 participant-facing Czech-bearing files (full inventory in Phase A).
- `workshop-content/agenda.json` — review the ~27 scenes that didn't get the 2026-04-13 Mode A treatment.
- Layout flip: `content/talks/`, `content/project-briefs/`, `materials/`, `content/facilitation/`, `content/challenge-cards/`.
- Translation gap closure: create EN canonical for 5 CS-only files + create CS translation for 1 EN-only file.
- `docs/workshop-content-canonical-vocabulary.md` — verify it survives the review and add CS canonical phrasings where helpful.
- `.copy-editor.lock.json` — re-segment all touched files, sign off `reviewedBy` per file.
- `cs_reviewed: true` flips in `agenda.json` for scenes that pass review.
- `generate:content` and `verify:content` pipelines must keep working through the layout flip.
- Any file path references in scripts, the `workshop` skill, the dashboard, or generator code must update with the layout flip.

**Out of scope:**
- The four Czech style reference files (`content/style-guide.md`, `content/style-examples.md`, `content/czech-reject-list.md`, `content/czech-editorial-review-checklist.md`) — these are *about* Czech editorial rules and stay Czech-only; they're not "translations" of anything.
- `workshop-skill/` files — already migrated to English-canonical in commit `d91f726`. Out of scope for this plan.
- Documentation files in `docs/` other than the canonical vocabulary doc.
- Generated views (`agenda-cs.json`, `agenda-en.json`, `workshop-blueprint/agenda.json`, harness-cli bundles) — they regenerate from sources.
- Adding new content. This is a flip + review pass, not a content rewrite. If a file genuinely needs new prose, that's a separate plan.
- Translating the canonical vocabulary doc itself into Czech (it's a meta reference; English-only is fine).
- Reviewing the agenda's English content for prose quality. The English in agenda.json was rewritten on 2026-04-12 (`2046fbc`) and is treated as canonical.

## Proposed Solution

Six phases with explicit pause points. The work is multi-session by design — Phase D in particular needs Ondrej in the loop and can't be done in one sitting.

**Phase A — Inventory and decisions.** Catalog every file, classify each by current state (CS-only / EN-only / paired), decide what each needs, document the target structure. Pause to confirm before any file moves.

**Phase B — Close translation gaps.** For the 5 CS-only files, create English canonical translations. For the 1 EN-only file (coaching-codex), create a Czech translation. After this phase every participant-facing artifact has both languages, even if the new translations are rough.

**Phase C — English canonical polish.** Audit every EN file against `docs/workshop-content-canonical-vocabulary.md`. The English files are about to become the source of truth that Czech is reviewed against — they need to be the version we want everyone to copy. Most of the talk scripts, briefs, and kit EN versions are already strong; this is a polish + alignment pass, not a rewrite.

**Phase D — Czech translation review.** This is the biggest phase by far. For each CS file, run a focused subagent review pass to gather findings, then Ondrej does signoff and sign-edits. The subagent provides candidate fixes and flags; the human decides. Per the architecture doc: "AI review may assist, but it does not replace signoff." This phase splits into batches and each batch gets a pause point. agenda.json's ~27 unreviewed scenes are the largest single batch.

**Phase E — Layout flip.** Move CS files from root to `locales/cs/`, promote EN files from `locales/en/` to root. Update any internal cross-references and any path-dependent code (generators, skill, dashboard). This is a mechanical phase but has unknown blast radius until we grep for all path references.

**Phase F — Lockfile, gate, sign-off, smoke.** Re-segment `.copy-editor.lock.json`, run `verify:content`, flip `cs_reviewed: true` on agenda scenes, smoke read.

## Implementation Tasks

Tasks are dependency-ordered within phases. Phases have hard pause points — do not start the next phase without explicit signoff from the previous.

### Phase A — Inventory and decisions

- [x] **A1. Build the file inventory.** Walk `content/`, `materials/`, `workshop-content/` for every Czech-bearing file. For each file record: current path, language(s) present, current canonical (root) language, target canonical (root) language, whether a translation needs to be created, and whether a path is referenced from generators/skill/dashboard. Output: a checklist table at the end of this plan in section "File Inventory" (added during A1).
- [x] **A2. Grep for path references.** Find every reference to `materials/coaching-codex.md`, `content/talks/context-is-king.md`, `content/facilitation/master-guide.md`, `content/challenge-cards/deck.md`, `content/project-briefs/*.md`, `content/facilitation/codex-setup-verification.md`, `materials/participant-resource-kit.md`, `content/talks/codex-demo-script.md`, and the corresponding `locales/en/*` paths. Flag every code or content reference that will need updating in Phase E. Save as a checklist appended to the file inventory.
- [x] **A3. Decide style-reference handling.** Confirm that `content/style-guide.md`, `content/style-examples.md`, `content/czech-reject-list.md`, `content/czech-editorial-review-checklist.md` stay Czech-only as meta references about Czech writing. Document the decision in this plan.
- [ ] **A4. Pause and review.** Read A1, A2, A3 together. Confirm the inventory is complete and the target structure is what we want. **Phase B does not start until this review is done.**

### Phase B — Close translation gaps

- [x] **B1. Create EN canonical for `content/facilitation/master-guide.md`.** This is the largest CS-only file (~340 lines). Translate to natural English, preserving canonical vocabulary and the structure exactly. Output goes to `content/facilitation/master-guide.md` as a new file *next to* the CS version (do not flip yet — that's Phase E). The CS version stays at the root for now; the new EN goes to `locales/en/master-guide.md` temporarily until the flip.
- [x] **B2. Create EN canonical for `content/facilitation/codex-setup-verification.md`.** Same pattern — EN in `locales/en/`.
- [x] **B3. SKIPPED — EN already exists.** Real translation present at `content/challenge-cards/locales/en/deck.md` (60 lines, not a stub). C-polish in C-phase, D-review CS in D-phase.
- [x] **B4. Create EN canonical for `content/challenge-cards/print-spec.md`.** Output: `content/challenge-cards/locales/en/print-spec.md`.
- [x] **B5. SKIPPED — EN already exists.** Real translation present at `content/talks/locales/en/codex-demo-script.md` (87 lines, not a stub). C-polish in C-phase, D-review CS in D-phase.
- [x] **B6. Create CS translation for `materials/coaching-codex.md`.** This is the EN-only file (rewritten in this session as the pocket coaching card). Translate to Czech. Use canonical vocabulary verbatim. Output: `materials/locales/cs/coaching-codex.md` (note the new `locales/cs/` directory).
- [ ] **B7. Pause and smoke-check the new translations.** Read each B1–B6 output and confirm the basic shape is right before moving to canonical polish. **Phase C does not start until this check is done.**

### Phase C — English canonical polish

- [x] **C1. Audit EN files against canonical vocabulary.** 50 canonical-phrase hits across 5 EN files, 0 rejection-list violations. Talk script, demo script, deck, kit, master-guide all clean. Grep artifacts in commit message. For each English file (existing + B1–B5 newly created), check against `docs/workshop-content-canonical-vocabulary.md`. Flag any drift, missing canonical phrases, or terms that should be canonical but aren't.
- [x] **C2. Polish existing EN talk script.** No edits needed. `fabbdb6` rewrite is already canonical — 13 canonical-phrase hits, "Humans steer. Agents execute." protected verbatim, explicit "do not say" section enforces vocab rules. `content/talks/locales/en/context-is-king.md` was rewritten in commit `fabbdb6` — confirm it's at canonical quality, light-touch only.
- [x] **C3. Polish existing EN briefs.** No edits needed. All 5 briefs use "handoff test", "next safe move", clean "Done when" and "First step for the agent" sections. No rejection-list terms. They don't need canonical phrases — briefs aren't talk surfaces. `content/project-briefs/locales/en/*.md` (5 files) — verify canonical vocabulary, fix any drift. Already reviewed mechanically by today's verify:content pass.
- [x] **C4. Polish existing EN kit.** No edits needed. 9 canonical hits: all five habit tags verbatim + "carries the next move" + "A map, not a warehouse" + "Holistic beats granular" + "tracer bullet". `materials/locales/en/participant-resource-kit.md` — already mirrored from CS in commit `004a76e`. Verify canonical quality.
- [x] **C5. Polish newly-created EN files (B1, B2, B4).** No edits needed. B1 master-guide has 8 canonical hits and uses guides/sensors loanwords, "tracer bullet", "AGENTS.md as a map, not a warehouse", "Humans steer. Agents execute." protected, "next-day commitments". B2/B4 don't carry talk vocab. Apply the canonical vocabulary spec strictly. These are first-pass translations, so they need the most polish.
- [x] **C6. Polish coaching-codex EN.** No edits needed. This file is the reference against which canonical vocabulary was authored today — already canonical. `materials/coaching-codex.md` (currently English-only) — already canonical from today's work, light touch only.
- [ ] **C7. Pause and confirm English is the source-of-truth version.** Read each EN file. Confirm it's the version Czech should be reviewed against. **Phase D does not start until this check is done.**

### Phase D — Czech translation review (the big one)

This phase is **multi-session by design**. Each batch ends with a pause for Ondrej signoff. The subagent gathers findings; Ondrej decides what to apply and applies prose corrections. Subagent does NOT make edits in Phase D — it only reports.

- [x] **D1. Review pass: agenda.json scenes batch 1.** Memo at `docs/reviews/workshop-content/2026-04-13-czech-batch-1-opening-talk-demo.md` (pending signoff). 9 scenes covered, all 9 have findings. Top 3: (1) `talk-how-to-build` protected phrase `Co není v repu, neexistuje` paraphrased as `Pokud to není v souboru, neexistuje to`; (2) `demo-your-toolkit` structural drift — `toolkit-record` absorbed content from neighboring callout; (3) `talk-humans-steer` gender error `tyhle čtyři slova` should be `tahle`. Systemic: `ty`-form leaks in `talk.cs.facilitatorRunner` (9 lines), Hashimoto quote in `ty` form in 3 of 4 appearances.
- [x] **D2. Ondrej signoff D1.** 40 edits applied to agenda.json: protected phrase `Co není v repu, neexistuje` restored, gender fix `tahla čtyři slova`, Hashimoto quote unified to `vy` across all 4 appearances, Guo quote uses canonical `managing` loanword, `tyhle/Den potom/ladění/prohlubuje` all fixed, `participant board` → `plátno před vámi`, `nářadí` → `toolkit`, `okamžik/okamžiky` → `pohyb/pohyby`, `toolkit-record` duplication restored to EN scope, full `facilitatorRunner` `ty`→`vy` sweep (9 lines). `cs_reviewed: true` flipped on all 9 scenes. Views regenerated. Read the memo. Apply selective fixes. Flip `cs_reviewed: true` on scenes that pass.
- [x] **D3. Review pass: agenda.json scenes batch 2.** Memo at `docs/reviews/workshop-content/2026-04-13-czech-batch-2-build-rotation.md`. 5 scenes reviewed + 4 phase-level `facilitatorRunner` blocks. Most skipped scenes were Mode A scope.
- [x] **D4. Ondrej signoff D3.** 14 fixes applied. Top 3 landed: (1) `ztracené řešení` → `řešením, které existuje jen v hlavách` (meaning drift, not voice); (2) `Holistické vítězí nad granulárním.` → `Celek nad detailem.` per canonical §3; (3) `lunch-reset` facilitatorRunner `zkontroluj` → `zkontrolujte`. Also: full ty→vy sweep on intermezzo-1 + lunch-reset + rotation facilitator blocks, `okamžik` → `milník/beat`, `pocitů` → `dojmů`, `check-in` imperative conversion. 5 scenes flipped: build-1-clock-started, build-1-next-65-minutes, build-1-return-to-proof, intermezzo-1-check-in, intermezzo-1-thread.
- [x] **D5. Review pass: agenda.json scenes batch 3.** Memo at `docs/reviews/workshop-content/2026-04-13-czech-batch-3-reveal.md` (529 lines). 10 scenes + 4 phase runners. Top 3: (1) **reveal phase runner §5 violation** (`v pondělí`/`pondělní závazky` — §5 bans Monday in both languages); (2) **build-2-second-push CS facilitatorRunner was English not Czech** (structural translation gap — content was copied from EN); (3) build-2a-eighty-five body ty island + meaning drift on `podrazit se o něco`.
- [x] **D6. Ondrej signoff D5.** 17 string edits + CS facilitatorRunner ported for build-2-second-push. §5 violation fixed (`v pondělí` → `Až si příště sáhnete po jakémkoli toolchainu`, `pondělní závazky` → `závazky pro další den u klávesnice`). `Sám` → `Samostatně` on reveal-alone (gender inclusivity). 10 scenes flipped: build-2a-same-clock, build-2a-eighty-five, build-2a-return-to-proof, intermezzo-2-write, intermezzo-2-check-in, intermezzo-2-back-to-work, build-2b-clock-resumes, build-2b-second-push-timeline, reveal-1-2-4-all, reveal-what-i-saw.
- [x] **D7. Review pass: talks (CS).** Memo at `docs/reviews/workshop-content/2026-04-13-czech-talks.md`. `context-is-king.md` 10 findings (all style polish, zero §149/§5/protected-phrase violations). `codex-demo-script.md` had systemic problems: ~40% untranslated EN blocks + `ty` form throughout Flow/Fallbacky + `implementovat` reject-list hit.
- [x] **D8. Ondrej signoff D7.** Full rewrite of `codex-demo-script.md` (all EN blocks translated, Flow+Fallbacky swept to `vy`, `implementovat`→`napsat`, Czech typography quotes, closing `zázračný výsledek`). `context-is-king.md` 12 string fixes: engine/chassis restored `přežitelnost`, Hashimoto+Guo quotes consistent with agenda (`vy` form, `managing` loanword), `reframe callout`, `ve scéně 5`, `Mantinely nezpomalují. Zrychlují.`, `Team lead staví prostředí, ve kterém tým funguje.`, callback-ready for scene 4 closing.
- [x] **D9. Review pass: project briefs (CS).** Memo at `docs/reviews/workshop-content/2026-04-13-czech-briefs.md`. 14 findings across 5 files. All 5 pass ty/Monday/protected-phrase gates. Top 3: metrics-dashboard done-when drift from real/mocked/missing, code-review-helper `hodnoticí schéma` calque, standup-bot+doc-generator AGENTS.md anchor dropped.
- [x] **D10. Ondrej signoff D9.** 10 string fixes applied: metrics-dashboard (layout pravidla x2, real/mock/missing restore, projection+README), code-review-helper (rozbor, pravidla pro review), standup-bot (AGENTS.md anchor, jisté shrnutí), doc-generator (AGENTS.md restore), devtoolbox-cli (verbal popisují, jak).
- [x] **D11. Review pass: materials (CS).** Memo at `docs/reviews/workshop-content/2026-04-13-czech-materials.md`. **Proof-slice verdict: PROCESS WORKS.** `coaching-codex.md` CS (B6) lands every protected phrase verbatim, all §3 canonical loanwords present, no ty leaks, no habit drift, no Monday. 7 refinements only. `participant-resource-kit.md` had 1 real ty leak (`tebe` line 98) + 4 style refinements.
- [x] **D12. Ondrej signoff D11.** 9 string fixes applied: kit (tebe→vás, model calque, evaporates, Měsíční rytmus, parallel structure), coaching-codex CS (z pocitu→z jistoty, done kriteria→definice hotovo, je levné calque→přesměrovat plán stojí minutu, Act accordingly→Podle toho).
- [x] **D13. Review pass: facilitation (CS).** Memo at `docs/reviews/workshop-content/2026-04-13-czech-facilitation.md`. Both files pass ty/Monday gates end-to-end (first facilitation artifact this pass). Top 3: master-guide line 117 semantic reversal (Context-is-King punchline actively teaching wrong thing), line 268 `planem` typo + dump→encyklopedie canonical vocab drift, line 230 tautological checkpoint question marked "use verbatim."
- [x] **D14. Ondrej signoff D13.** 13 string fixes applied: master-guide (semantic reversal, plánem typo, dump→encyklopedie, sloganku→slogan, akcelerují→zrychlují, 4 elementy→čtyři prvky, tautology, retrievalové cvičení declension x4), codex-setup-verification (Přihlaste se k provideru, pomoc se setupem).
- [x] **D15. Review pass: challenge cards (CS).** Memo at `docs/reviews/workshop-content/2026-04-13-czech-cards.md`. **Verdict: approved for ship.** All 5 canonical habit tags verbatim, no ty leaks, no reject-list hits. Two real issues are upstream/doctrinal (deck line 31 drift is actually more correct than EN — recommend backport EN←CS; print-spec vs deck category mismatch inherited from EN).
- [x] **D16. Ondrej signoff D15.** 4 string fixes applied: deck (plural agreement `uměli... sami`, co plníte→co právě děláte), print-spec (drop ikonický, workshop na něm nestojí). Upstream EN sync items (doctrinal drift + category mismatch) logged for Phase E/F consideration.

### Phase E — Layout flip

- [ ] **E1. Move CS files to `locales/cs/`.** For each pair listed in the inventory (talks, kit, 5 briefs, plus the newly-created coaching-codex CS from B6): `git mv` the CS file from current location to `locales/cs/`. Use `git mv` (not delete + create) to preserve git history.
- [ ] **E2. Promote EN files to root.** For each pair, `git mv` the EN file from `locales/en/` to the root location.
- [ ] **E3. Move newly-created EN files to root.** For master-guide, codex-setup-verification, deck, print-spec, codex-demo-script: the EN versions created in B1–B5 (currently in `locales/en/`) move to root, displacing the existing CS files which move to `locales/cs/`.
- [ ] **E4. Update path references from A2.** Apply every edit needed in scripts, generators, skill, dashboard, content cross-references, frontmatter `sourceRefs`, etc. Test that `npm run generate:content` still produces the same agenda views.
- [ ] **E5. Verify the flip didn't break agenda.json.** agenda.json has `sourceRefs` pointing at `content/talks/context-is-king.md` and similar. Update those references to keep pointing at the EN canonical now living at the same root paths (so the references should mostly still work — they were always pointing at the root, which is now EN).
- [ ] **E6. Run `generate:content`.** Confirm regeneration produces the same output. If it doesn't, debug Phase E before proceeding.
- [ ] **E7. Pause and review the new structure.** A directory walk, a quick smoke test of dashboard rendering, a skill invocation if possible. **Phase F does not start until this passes.**

### Phase F — Lockfile, gate, sign-off, smoke

- [ ] **F1. Re-segment `.copy-editor.lock.json`.** Every touched file's `contentHash` is now stale. Run the copy-editor segmenter on each file. The `marvin:copy-editor` skill exists for this — invoke it per file or in batch.
- [ ] **F2. Sign off `reviewedBy` for each file.** For files where Ondrej's Phase D signoff applies, mark `reviewedBy: ondrej@2026-04-XX` in the lockfile entry.
- [ ] **F3. Run `verify:content`.** Address any remaining errors. The gate must pass.
- [ ] **F4. Flip `cs_reviewed: true` on agenda scenes.** Every scene that passed Phase D batches D1–D6 gets its `cs_reviewed: true` flag set. The subset that *didn't* pass (if any) stays at `false` and is logged for follow-up.
- [ ] **F5. Final smoke read.** Walk the participant arc one more time: opening → talk → demo → build → intermezzo → reveal. Then walk the materials arc: coaching codex → kit → master guide → cards. Confirm a coherent voice in both languages.
- [ ] **F6. Update `docs/workshop-content-language-architecture.md`.** Add a "Verified 2026-04-XX" note documenting that the file system now matches the rule, and add a short paragraph about the directory convention (EN at root, CS in `locales/cs/`).

## Acceptance Criteria

- [ ] Every participant-facing file in scope has BOTH an EN canonical version at the root AND a CS translation in `locales/cs/`.
- [ ] No participant-facing file has Czech at the root (except `agenda.json` which is bilingual via per-scene `en/cs` keys, not via file location).
- [ ] No participant-facing file has English in `locales/en/` (the `locales/en/` directories are removed or empty for these scopes).
- [ ] All `cs_reviewed: false` flags on agenda scenes that passed Phase D review flip to `true`. Any that didn't pass are explicitly logged.
- [ ] Every file touched in Phase D has a `reviewedBy` populated in `.copy-editor.lock.json`.
- [ ] `npm run verify:content` passes with zero errors.
- [ ] `npm run generate:content` produces the same agenda views (modulo intentional changes from Phase D fixes).
- [ ] The `workshop` skill, dashboard, and any generator scripts still work after the layout flip.
- [ ] A Czech-native reader (Ondrej) reads any participant-facing CS file and confirms it reads as if a Czech engineer wrote it from scratch — not as a translation.
- [ ] Canonical vocabulary from `docs/workshop-content-canonical-vocabulary.md` survives intact in both languages.
- [ ] `docs/workshop-content-language-architecture.md` updated with a directory-convention paragraph and a "Verified" date.

## Decision Rationale

**Why flip the layout AND review the content in one plan, instead of two plans.** The architecture flip and the Czech review are coupled. If we flip without reviewing, the canonical English files stay rough and the Czech translations become locked-in around bad source. If we review without flipping, the file system keeps lying about which language is canonical and the next contributor will recreate the drift. Doing them together costs more session time but ships a coherent result; splitting them means the in-between state is worse than the starting state.

**Why six phases instead of three.** Each phase has a different cognitive mode: inventory (mechanical), translation creation (drafting), polish (editorial), review (judgment + native fluency), structural move (mechanical), gate (verification). Mixing them produces fatigue and skipped checks. Phase boundaries are pause points where the user can stop, walk away, and resume.

**Why subagent first pass + human signoff for Czech review.** Per `docs/workshop-content-language-architecture.md` line 122: "the blocking review is owned by a Czech-fluent human reviewer; AI review may assist, but it does not replace signoff." This is a hard rule, not negotiable. The subagent gathers candidate findings and saves the human time on grep-style work. The human catches errors the subagent misses (like the engine/chassis paragraph today) and makes register/voice judgments only a native speaker can make.

**Why translate gaps before polishing English.** If we polish English first, then translate, we're asking the translator (still Claude) to render a polished version into a new language — but Claude's Czech is the weakest link, so the new translation is weaker than the polished English. Better order: rough translations exist first → polish English to canonical bar → then review the translations against the polished English. This way the human review compares against the version we actually want.

**Why English-canonical and not "process-rule only".** A process rule that contradicts the file system fails the moment a new contributor opens the directory. The contributor sees Czech at `materials/participant-resource-kit.md` and English in a sub-folder; they conclude Czech is canonical regardless of any docs. The layout flip aligns the visible structure with the rule. Process rules that aren't visible in the codebase don't survive.

**Why translate `coaching-codex.md` to Czech instead of leaving it English-only.** It's the artifact participants take home. Czech-speaking participants will consult it Monday morning. Yes, the agent could translate on the fly, but the canonical vocabulary needs to land verbatim — same five habit tags, same protected line, same "carries the next move" phrase. Pinning a reviewed Czech version is the only way to guarantee terminology consistency.

**Why batch the agenda review into 3 batches instead of one big pass.** ~27 unreviewed scenes is too much for a single human signoff session. Three batches of ~9 means ~30-45 minutes of human attention each, which is a realistic chunk. The 2026-04-13 Mode A scene-card review covered 10 scenes and produced a 14K-token memo — three more passes of similar size cover the rest.

**Why Phase D is the longest phase and why that's OK.** It's the only phase that delivers the actual goal — Czech that reads as native. Everything else is plumbing. Spending more session time here is the right tradeoff.

## Constraints and Boundaries

- **`docs/workshop-content-language-architecture.md` is the governing document.** This plan implements its rules; it doesn't relitigate them.
- **`docs/workshop-content-canonical-vocabulary.md` is the vocabulary spec.** Every translation and review must preserve the canonical phrases verbatim, in both languages where applicable.
- **AI-only review never substitutes for human signoff** (architecture doc line 122). Subagent reviews are first passes; Ondrej's signoff is the decision point.
- **Trunk-based development.** All work commits to main. No feature branches.
- **Skill-delivered content stays bilingual.** Even though `workshop-skill/` is English-canonical, participant-facing surfaces (briefs, kit, codex, cards, master-guide, talks) need both languages so the dashboard / room screen can render either.
- **Czech style guide** (`content/style-guide.md`, `content/czech-reject-list.md`) governs all Czech prose. Lowercase `vy`, no nominal chains, no AI fingerprints, no calque-y constructions.
- **No new content.** This is a flip + review pass, not a content rewrite. Discovered content gaps get logged and deferred.
- **`agenda.json` is the source of truth for structured workshop content.** Scene rewrites happen there; downstream files reference but don't duplicate.
- **No layout change for `workshop-skill/` files.** They were migrated in `d91f726`, out of scope.
- **`generate:content` and `verify:content` must work at every commit boundary.** Don't ship a broken pipeline through the layout flip.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| English-canonical is the documented rule | Verified | `docs/workshop-content-language-architecture.md` line 59 |
| Human signoff is required for Czech review | Verified | Same doc, line 122 |
| Layout flip won't break the dashboard | Unverified | A2 inventory will surface path references; E5 will validate |
| The 5 CS-only files are fully translatable to natural English | Unverified — likely true | These are workshop facilitation content, not poetry; standard translation should work but quality will need C-phase polish |
| The 1 EN-only file (coaching-codex) translates well to Czech | Unverified | Coaching language has cultural register that's hard to translate; B6 may need extra care |
| `agenda.json` Czech scenes outside the Mode A top 10 are roughly correct after the bulk ty→vy fix | Partially verified | The bulk fix in `d7b9000` didn't review prose, only addressing form. D1, D3, D5 will surface what's needed. |
| `marvin:copy-editor` skill can re-segment all touched files | Unverified | Need to invoke the skill in F1 to confirm; if it can't, manual re-segmentation is the fallback |
| Ondrej has the time/attention for ~6 review batches in Phase D | Unverified | The plan structures Phase D as multi-session for exactly this reason |
| Generator scripts read EN/CS paths consistently | Unverified | A2 + E4 covers this; if there's an inconsistency, E4 is where it surfaces |
| `cs_reviewed: true` flips don't have downstream effects beyond the lockfile | Verified | The flag is consumed by `verify:content` and the dashboard's "review pending" UI; flipping means the scene is signed off, no other side effects |

Unverified assumptions are all covered by an explicit task (A2, B-phase, C-phase, E4, F1) — nothing swept under the rug.

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Phase D is too long for Ondrej to finish in available sessions | High | Medium | Multi-batch structure with explicit pause points means partial completion is shippable. If only D1+D2 happen, that's still progress on the most-stale agenda scenes. |
| Layout flip breaks unknown path references | Medium | High | A2 grep is the explicit mitigation. Run it before any moves. E4 fixes everything found. E6 validates by running generate:content. |
| Subagent Czech review misses register issues a human would catch | High | Medium | Today's review caught the engine/chassis paragraph but missed several issues that landed in commits. The subagent is a first pass, not the final decision. Ondrej signs off and edits. |
| Created translations (B1–B6) have first-draft quality issues that propagate | Medium | Medium | C-phase polish exists for exactly this. Plus D-phase review catches anything that survives. |
| `verify:content` introduces new errors after the layout flip due to lockfile staleness | High | Low | F1 re-segments all touched files. F3 addresses any remaining errors. Expected friction, planned for. |
| `marvin:copy-editor` segmenter has bugs or can't handle a particular file | Medium | Medium | Manual lockfile edits as fallback. The lockfile schema is documented enough to hand-edit if needed. |
| Czech review surfaces a need to update canonical vocabulary | Low | Medium | If a canonical phrase reads badly in Czech, that's a real finding. The vocabulary doc gets updated and the change cascades back through the affected files. Treat as iteration, not failure. |
| Translation creation introduces new vocabulary that isn't in the canonical spec | Medium | Low | C-phase audit (C1) is the gate. Any new term that wasn't authorized goes back to the vocab doc or out of the file. |
| The plan gets too long and ships incomplete | Medium | Medium | Phases A through C are single-session work. Phase D is multi-session by design. Phases E + F land together at the very end. Each phase boundary is a defensible stopping point. |
| Layout flip causes git history to look like mass file deletions | Low | Low | Use `git mv`, not delete + create. Git follows the moves and history is preserved. |
| User fatigue causes lower-quality signoffs in late Phase D batches | Medium | High | Pause between batches. Don't run two batches back to back without a real break. Consider doing batches in separate days. |

## Phased Implementation

| Phase | Tasks | Estimated session count | Pause output |
|---|---|---|---|
| A — Inventory | A1–A4 | 1 (short) | Inventory table + path-reference grep + style-reference decision |
| B — Translation gaps | B1–B7 | 1–2 | 6 new files with first-draft translations |
| C — English polish | C1–C7 | 1 | Polished English files at canonical quality |
| D — Czech review | D1–D16 | 3–6 (multi-batch) | 7 review memos under `docs/reviews/workshop-content/`, signed-off Czech files |
| E — Layout flip | E1–E7 | 1 | New directory structure, all paths working |
| F — Lockfile + gate | F1–F6 | 1 | Green verify:content, signed lockfile, smoke read passed |

**Hard pause points:** A4, B7, C7, D2, D4, D6, D8, D10, D12, D14, D16, E7. Do not skip any of these even if the plan feels like it's flowing — the pauses are where mistakes surface cheaply.

## Subjective Contract

This plan is participant-facing copy and structural reorganization. The Subjective Contract makes the taste boundaries explicit so the work doesn't drift under the guise of "execution".

**Target outcome.** A Czech reader picks up any participant-facing file from this repo and cannot tell it was translated. It reads as if a Czech engineer wrote it for other Czech engineers — pithy, concrete, in voice. Simultaneously, an English reader picks up the same file (or its EN canonical) and reads natural, clear English that is the source of truth. The file system makes it obvious which is canonical and which is a translation. Contributors editing content know exactly where to start (English at the root) and what they need to update (CS in `locales/cs/`).

**Anti-goals.**
- Not a content rewrite. The agenda was rewritten on 2026-04-12; further rewrites are out of scope.
- Not a vocabulary change. The canonical vocab spec is the spec; it doesn't get rewritten as part of this plan.
- Not a file format change. Markdown stays markdown, JSON stays JSON.
- Not a workshop-skill restructure. Skill files were already migrated.
- Not a "translate everything literally" pass. The point is natural Czech, not faithful Czech.
- Not adding any new file types or new directory levels beyond `locales/cs/`.
- Not converting the four Czech style references into English. They are about Czech.
- Not fixing things outside scope just because they're nearby. If a file reveals a bug or a content gap, log it for a separate plan.

**References (positive models).**
- `docs/workshop-content-language-architecture.md` — the governing document
- `docs/workshop-content-canonical-vocabulary.md` — the vocabulary spec
- `docs/reviews/workshop-content/2026-04-13-czech-mode-a-scene-cards.md` — exemplar Czech review (for the top 10 scenes); the format and depth that Phase D batches should mirror
- `content/style-guide.md`, `content/style-examples.md` — Czech editorial rules
- `content/project-briefs/locales/en/*.md` — already-good English briefs that show the target register for English-canonical
- `materials/coaching-codex.md` (current EN version) — pocket-card format that the new CS translation should match in tone

**Anti-references (patterns to avoid).**
- The pre-2026-04-13 Czech (calque-y constructions like "do dalšího pracovního týdne", AI-pattern chains, nominal style)
- The drift-alignment session's first-pass Czech edits (engine/chassis paragraph, `Ta sílu` instead of `Tu sílu`, the original `do příštího dne u klávesnice`)
- "Translation by structure preservation" — taking English sentence-for-sentence and rendering each clause in Czech word order
- Czech that uses English technical loanwords where idiomatic Czech exists
- Czech that paraphrases canonical English phrases instead of using the agreed-upon Czech equivalent

**Tone / taste rules.**
- Czech: lowercase `vy` throughout, short sentences, concrete verbs, no nominal chains, no corporate register, meme-able phrases preserved
- English: short sentences, active voice, concrete over abstract, no AI-fingerprint phrasing, the same canonical vocabulary as Czech
- Both: the same workshop voice — confident, peer-to-peer, no marketing copy, no hand-holding
- Canonical phrases: verbatim in both languages where listed in the vocabulary spec
- File comments / metadata: minimal, no generated headers

**Representative proof slice.** **The coaching-codex CS translation (B6) is the proof slice.** It's the smallest fully-new translation, it's high-stakes (participants take it home), it uses every category of canonical vocabulary, and it's short enough that quality is verifiable in one read. After B6 + Phase D review of the result, we know the translation + review process works. If the proof slice fails, fix the process before scaling to the rest of Phase B.

**Rollout rule.** Phase D batches do not start in parallel — one batch at a time, with Ondrej signoff between. Phase E layout flip does not start until ALL Phase D batches have completed. Phase F gate run does not start until E is done.

**Rejection criteria.** Content is wrong if:
- A Czech file reads as a translation rather than as native Czech.
- A canonical vocabulary phrase is paraphrased instead of used verbatim.
- A new term appears that isn't in the canonical spec.
- A file pair has the canonical/translation relationship inverted (CS at root for a participant-facing file).
- `verify:content` reports any error-level findings.
- An agenda scene has `cs_reviewed: true` flipped without a corresponding signoff in the review memo.
- The layout flip leaves any path reference broken.
- A Phase D review memo recommends fixes but the human signoff doesn't apply or explicitly reject them — silent skipping is forbidden.

**Required preview artifacts.**
- A1 inventory table (preview of the full scope)
- B6 coaching-codex CS proof slice (preview of the translation process)
- One D-phase review memo (e.g., D1 batch 1) before propagating the review process to all batches
- E7 directory walk + smoke test (preview of the post-flip structure before lockfile re-segmentation)

**Who reviews.** Ondrej. The architecture doc is unambiguous: blocking review is owned by a Czech-fluent human. AI assists, never replaces signoff.

## References

- **Governing architecture:** `docs/workshop-content-language-architecture.md`
- **Vocabulary spec:** `docs/workshop-content-canonical-vocabulary.md` (created today)
- **Drift-alignment plan (immediate predecessor):** `docs/plans/2026-04-13-refactor-content-drift-alignment-plan.md` (status: complete)
- **Recent Czech review (Mode A scenes):** `docs/reviews/workshop-content/2026-04-13-czech-mode-a-scene-cards.md`
- **Czech style references:** `content/style-guide.md`, `content/style-examples.md`, `content/czech-reject-list.md`, `content/czech-editorial-review-checklist.md`
- **Source of structured content:** `workshop-content/agenda.json`
- **Generator scripts:** `scripts/content/generate-briefs-inventory.ts`, `scripts/content/generate-views.ts`, `scripts/content/verify-copy-editor.ts`
- **Copy-editor segmenter:** `~/.claude/plugins/marketplaces/heart-of-gold-toolkit/plugins/marvin/skills/copy-editor/scripts/copy-audit.ts`
- **Canonical commit history (recent):**
  - `dc8f7c8` — drift-alignment plan complete
  - `844eeec` — typography gate green
  - `d7b9000` — Czech Mode A review
  - `2046fbc` — agenda content rewrite (the canonical English source)

## File Inventory (A1 — populated 2026-04-13)

### Participant-facing, in scope for the flip

| # | Current root path | Root lang now | EN counterpart now | EN state | Target action |
|---|---|---|---|---|---|
| 1 | `content/talks/context-is-king.md` | CS (185 lines) | `content/talks/locales/en/context-is-king.md` (185 lines) | Real translation (rewritten in `fabbdb6`) | C-polish EN, D-review CS, E-flip |
| 2 | `content/talks/codex-demo-script.md` | CS (83 lines) | `content/talks/locales/en/codex-demo-script.md` (87 lines) | Real translation | **Plan correction**: B5 unnecessary. C-polish EN, D-review CS, E-flip |
| 3 | `content/facilitation/master-guide.md` | CS (326 lines) | `content/facilitation/locales/en/master-guide.md` (7 lines) | **Stub** — "English stub. Full translation pending." | B1 create real EN, C-polish, D-review CS, E-flip |
| 4 | `content/facilitation/codex-setup-verification.md` | CS (54 lines) | `content/facilitation/locales/en/codex-setup-verification.md` (7 lines) | **Stub** | B2 create real EN, C-polish, D-review CS, E-flip |
| 5 | `content/challenge-cards/deck.md` | CS (60 lines) | `content/challenge-cards/locales/en/deck.md` (60 lines) | Real translation | **Plan correction**: B3 unnecessary. C-polish EN, D-review CS, E-flip |
| 6 | `content/challenge-cards/print-spec.md` | CS (28 lines) | _none_ | Missing | B4 create EN, C-polish, D-review CS, E-flip |
| 7 | `content/project-briefs/standup-bot.md` | CS | `content/project-briefs/locales/en/standup-bot.md` | Real translation | C-polish, D-review CS, E-flip |
| 8 | `content/project-briefs/doc-generator.md` | CS | `.../locales/en/doc-generator.md` | Real translation | C-polish, D-review CS, E-flip |
| 9 | `content/project-briefs/code-review-helper.md` | CS | `.../locales/en/code-review-helper.md` | Real translation | C-polish, D-review CS, E-flip |
| 10 | `content/project-briefs/devtoolbox-cli.md` | CS | `.../locales/en/devtoolbox-cli.md` | Real translation | C-polish, D-review CS, E-flip |
| 11 | `content/project-briefs/metrics-dashboard.md` | CS | `.../locales/en/metrics-dashboard.md` | Real translation | C-polish, D-review CS, E-flip |
| 12 | `materials/participant-resource-kit.md` | CS (111 lines) | `materials/locales/en/participant-resource-kit.md` (111 lines) | Real translation | C-polish, D-review CS, E-flip |
| 13 | `materials/coaching-codex.md` | EN (89 lines) | _none_ | This file **is** the EN canonical (rewritten today) | B6 create CS in `materials/locales/cs/`, D-review new CS. No flip needed — already EN-root. |

### Structured content

| # | File | Languages | Action |
|---|---|---|---|
| 14 | `workshop-content/agenda.json` | Bilingual via per-scene `en`/`cs` keys (not file layout) | D1/D3/D5 — review the ~27 scenes that missed the Mode A pass; flip `cs_reviewed: true` in F4. No layout change. |

### Plan corrections vs. reality

The plan assumed 5 files were "CS-only" needing fresh EN translations. Reality:
- **B1 (master-guide), B2 (codex-setup-verification), B4 (print-spec), B6 (coaching-codex CS)** — still needed as written.
- **B3 (challenge-cards/deck.md)** — **skip**. Real EN translation already exists. Replace with "C-phase polish + D-phase CS review only."
- **B5 (codex-demo-script)** — **skip**. Real EN translation already exists. Replace with "C-phase polish + D-phase CS review only."

Net change: Phase B shrinks from 6 to 4 real create tasks. C and D phases unaffected.

### Out of scope (verified — stay as-is)

- `content/style-guide.md`, `content/style-examples.md`, `content/czech-reject-list.md`, `content/czech-editorial-review-checklist.md` — Czech meta-references about Czech writing. Stay Czech-only. (A3 decision.)
- `content/codex-craft.md` — listed as Czech-only in `check-tier2-sync.ts`. Not in plan scope.
- `materials/README.md` — Czech-only per sync checker. Out of scope.
- `workshop-skill/` files — migrated in `d91f726`. Out of scope.
- Generated views (`dashboard/lib/generated/agenda-{en,cs}.json`, harness-cli bundles) — regenerate from sources in Phase E.

## Path References (A2 — populated 2026-04-13)

References that must be updated in Phase E when canonical paths flip:

### Code / script paths

- **`scripts/content/check-tier2-sync.ts`** lines 101–117 — functions `czechPathToEnglishPath` / `englishPathToCzechPath` hard-code the current layout (`<dir>/<file>.md ↔ <dir>/locales/en/<file>.md`). **After the flip these are inverted.** Also: `CZECH_ONLY` set at line 34 lists `materials/coaching-codex.md` and `content/challenge-cards/print-spec.md` — both entries become **stale** post-flip (coaching-codex becomes bilingual; print-spec becomes bilingual). Must be removed or updated.
- **`scripts/content/generate-briefs-inventory.ts`** lines 4–20 — hard-codes `content/project-briefs/locales/en` as the EN dir and `content/project-briefs/*.md` as the CS dir. Inversion required.
- **`.copy-editor.yaml`** — path globs at lines 48–64 use `**` so they catch both locations. Likely survives unchanged, but F1 re-segmentation will re-hash everything anyway.

### Data / config paths

- **`dashboard/data/workshop-state.json`** — 40+ `"path": "content/facilitation/master-guide.md"` / `"content/talks/context-is-king.md"` / `"content/talks/codex-demo-script.md"` entries (see A2 grep output). These are scene `sourceRefs`. Post-flip, those paths still exist (now EN instead of CS) and should keep resolving — _but_ need to confirm whether the dashboard treats `sourceRefs` as locale-scoped or locale-agnostic.
- **`workshop-content/agenda.json`** — has its own `sourceRefs`; same consideration.
- **`.copy-editor.lock.json`** — every entry under a flipped path becomes stale. F1 re-segments.

### Skill / reference paths

- **`.claude/skills/workshop/SKILL.md`** lines 124, 133, 184, 228–233 — fallback path references to `content/project-briefs/*.md`, `content/challenge-cards/deck.md`, `materials/participant-resource-kit.md`, `materials/coaching-codex.md`. These paths continue to exist after the flip (now as EN); fallback behavior should still work. **But** the pattern `materials/locales/<locale>/participant-resource-kit.md` fallback-to-`materials/participant-resource-kit.md` becomes wrong for CS consumers (CS is no longer at root). Needs update.
- **`.claude/skills/workshop/workshop-skill/reference.md`** line 103 — CS reference to `materials/coaching-codex.md`. Post-flip this file is EN; the CS reference should point at `materials/locales/cs/coaching-codex.md`.
- **`.claude/skills/workshop/workshop-skill/follow-up-package.md`** line 20 — CS text pointing at `materials/participant-resource-kit.md`. Same issue.
- **`.claude/skills/workshop-facilitator/workshop-skill/**`** and **`.agents/skills/harness-lab-workshop-facilitator/workshop-skill/**`** — mirrored copies (6+ files). Need the same treatment or will be regenerated from the canonical skill during bundle.
- **`harness-cli/assets/workshop-bundle/`** — bundled copies of content + skill. Regenerated by `harness-cli/src/workshop-bundle.js`. After E, run the bundle script to refresh.

### Summary

The flip is **not a pure `git mv` operation** — it requires code changes in at least `check-tier2-sync.ts` and `generate-briefs-inventory.ts`, and skill-reference text edits in the workshop skill(s). Dashboard `sourceRefs` likely survive; verify in E5.

## Style-Reference Decision (A3)

**Decision:** The four Czech editorial reference files stay **Czech-only** as meta-documents _about_ Czech writing:
- `content/style-guide.md`
- `content/style-examples.md`
- `content/czech-reject-list.md`
- `content/czech-editorial-review-checklist.md`

They are not "translations" of anything — they're rules for writing Czech prose, and translating rules about Czech into English would strip the point (the examples, reject phrases, and punctuation cases are Czech by definition). `check-tier2-sync.ts` already classifies them as `CZECH_ONLY` at lines 35–38. No action needed; they are explicitly out of scope for the flip and for Phase D review.
