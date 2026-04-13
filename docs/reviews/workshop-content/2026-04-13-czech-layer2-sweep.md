# Czech Layer 2 Review Sweep — 2026-04-13

**Scope:** all 14 Czech files in `.copy-editor.yaml` scope, with primary focus on visible participant surfaces in `workshop-content/agenda.json` (37 scenes across 11 phases, all currently flagged `cs_reviewed: false`).

**Layer 1 (typography) state:** 0 findings, 0 errors, 0 warnings. Handled by earlier R1/R1b mechanical fixes.

**This review is Layer 2.** It flags voice, clarity, and reject-list issues by scene. The cues here are suggestions for a native Czech reviewer to act on; I do not edit source files in this memo. After acting on each scene, flip `cs_reviewed: true` in `agenda.json`.

---

## Summary of what I found

**No reject-list hits, no nominalisation chains, no AI fingerprints.** The translation is genuinely in voice — short sentences, active verbs, no "v rámci", no "je nutné", no "proaktivně", no "zajistit, aby". Hashimoto's rule and the self-validation trap callouts land cleanly. Opening framing has the best rhythm of any phase.

**The real issues are two consistency problems that run across the agenda:**

1. **`ty` vs `vy` inconsistency** — the translation switches between singular-informal (`ty`) and plural-formal (`vy`) addressing, sometimes within a single scene. This is the biggest signal a native reviewer will catch on first read. Detailed list below.

2. **Four English eyebrows in the opening phase** — the small labels above hero titles in Phase 1 scenes are still in English while everything else is translated. Almost certainly translation oversight rather than design intent.

**Plus a minor clarity gap** in two "Return to proof" callouts that say "Odpověď už leží v jednom ze tří míst" without naming the three places on the visible surface — participant-strict clarity rule wants the three places enumerated inline.

**Everything else is fine to ship pending a native reviewer's aesthetic pass.** I flag a handful of minor voice nits below that a reviewer can decide on case by case.

---

## Issue 1 — `ty` vs `vy` inconsistency (the main signal to fix)

Czech has two second-person forms: `ty` (singular, informal, personal) and `vy` (plural/formal, team-facing). The translated agenda uses both, sometimes in the same scene. A native reviewer will feel this immediately and pick one lens per scene.

**My read of the intent** (from voice doctrine + the pattern I see): use `ty` for deeply personal beats that explicitly address one individual practitioner (opening framing, reveal commitment), use `vy` for collective / team-facing / action-coordinating moments (build phases, demo, intermezzos). That's what most scenes already do. The inconsistencies are the scenes where the two mix inside one hero or one scene.

### Scenes with internal `ty` / `vy` conflict (fix these)

| Scene | Conflict | Recommendation |
|---|---|---|
| `opening / opening-team-formation` | Title: "Postav se do řady. Odpočítej se. Zaber si kotvu." (`ty`) / body: "Takhle si dnes tvoříme týmy" (1st person plural, OK) / callout: impersonal, OK. | Actually consistent if you read body as "we". **Keep as is** — the title is the personal imperative, the body is the facilitator explaining the mechanic. |
| `intermezzo-1 / intermezzo-1-write` | Title: "Napiš, než promluvíš" (`ty`) / body: "Tři minuty. Sami. Nemluvíme. Pište, co vám přichází na mysl" — "Pište" is `vy`, "vám" is `vy`. | Pick one. The scene is a personal reflection moment, so `ty` reads stronger: "Piš, co ti přichází na mysl". Or switch title to `vy`: "Pište, než promluvíte". |
| `rotation / rotation-not-yours-anymore` | Title: "Tvoje repo už není tvoje" (`ty`) / body: "Po zbytek dne pracujete v repu, které postavil jiný tým" (`vy`). | The title is a personal gut-punch; the body explains the collective mechanic. Keep the title `ty`, but soften the conflict in the body — either rewrite body in `ty` ("Po zbytek dne pracuješ v repu, které postavil jiný tým") or accept the mix as "personal title, team mechanic". **My lean:** body → `ty` for rhythm with the title. |
| `rotation / rotation-line-up` | Title: "Postav se do řady, odpočítej se, jdi ke kotvě" (`ty`) / body: "Vaše číslo vám řekne, k jaké kotvě jít" (`vy`). | Same pattern. Body → `ty`: "Tvoje číslo ti řekne, k jaké kotvě jít." |
| `intermezzo-2 / intermezzo-2-check-in` | Title: "Check-in vašeho týmu" (`vy`) / body: "Porovnejte / Připojte" (`vy`) / callout: "Neber to jako závěrečnou zprávu. Ber to jako commit message" (`ty`). | Callout is `ty`, rest is `vy`. Callout should be `vy`: "Neberte to jako závěrečnou zprávu. Berte to jako commit message." |
| `reveal / reveal-show-us` | Title: "Ukaž, co jsi postavil" (`ty`) / body: "Pět minut na tým. Sdílejte obrazovku. Spusťte, co běží. Projděte repo." (`vy`). | Body is the team action (team shares screen), so body `vy` is correct. Title → `vy`: "Ukažte, co jste postavili." |
| `reveal / reveal-go-use-it` | Title: "Jdi a použij to" (`ty`) / body opens `vy` ("Postavili jste dnes / vy jste ho prošli / trénovali") / body ends `ty` ("až příště otevřeš / co potřebuješ, už máš"). | This is the closing moment. The `ty` → `vy` → `ty` oscillation is jarring. Pick one and commit. **My lean:** the closing is a personal send-off, so `ty` throughout: "Jdi a použij to. Tady moje část končí a tvoje pokračuje. Postavil jsi dnes něco, v čem cizinec pokračoval bez tebe – to byl test a prošel jsi ho. Řemeslo, které jsi trénoval, je tvoje." |

### Scenes that are consistent but worth confirming

- **All of `opening-framing`, `opening-day-arc`, `opening-handoff`** — pure `ty`. Personal and works.
- **All of `talk-*`, `demo-*`, `build-1-*`, `build-2a-*`, `build-2b-*`** — pure `vy`. Team-coordinating and works.
- **All of `intermezzo-1-check-in`, `intermezzo-1-thread`** — `vy`. Fine.
- **`rotation / rotation-read-the-room`** — body is impersonal, callout is `vy`. Fine.
- **All of `reveal-one-thing`** — pure `ty` including four callouts. This is the best ty-consistent scene in the agenda; use it as the reference for other `ty` scenes.
- **`reveal / reveal-1-2-4-all`** — impersonal body. Fine.
- **`reveal / reveal-what-i-saw`** — first-person facilitator voice. Fine.

---

## Issue 2 — English eyebrows in the Czech opening phase

Eyebrows are the small labels above hero titles that appear on the room screen above each scene. Four scenes in Phase 1 Opening have English eyebrows while the rest of the scene (title, body, callouts) is translated to Czech. The other phases have consistently Czech eyebrows.

| Scene | Current eyebrow | Likely intent |
|---|---|---|
| `opening / opening-day-arc` | "The day has one arc" | **Translation oversight.** Czech: "Den má jeden oblouk" or "Den vypadá takhle". |
| `opening / opening-day-schedule` | "Today's schedule" | Czech: "Dnešní rozvrh" or "Plán dne". |
| `opening / opening-team-formation` | "Your team" | Czech: "Tvůj tým" (if `ty`) or "Váš tým" (if `vy`). Consistency with the title's `ty` imperatives → "Tvůj tým". |
| `opening / opening-handoff` | "Next" | Czech: "Další" or "Pokračujeme". |

**Note:** `opening-framing` eyebrow is "Harness Lab" which is a brand name — leave. Other phases use eyebrows like "Řemeslo pod povrchem", "Disciplína má jméno", "Odpolední test" which are all Czech. The opening phase is the outlier.

**Also worth noting:** `demo-hold-together` eyebrow "Celý flow" mixes Czech + English ("flow" is an approved English term). This is fine to leave — "Celý flow" reads as Czech developer voice.

---

## Issue 3 — Minor clarity gap in "Return to proof" callouts

Two scenes (`build-1 / build-1-return-to-proof` and `build-2 / build-2a-return-to-proof`) both have a hero body that says:

> Víc promptování vás neodlepí. Couvněte. Odpověď už leží v jednom ze tří míst.

The "tří míst" (three places) is not enumerated anywhere on the visible surface of this scene. Participant-strict clarity rule says: if the reader has to mentally ask "which three places?", the sentence failed.

**Options:**

1. **Enumerate inline** (preferred): "Odpověď už leží v jednom ze tří míst: v `AGENTS.md`, v repu, nebo v tom, co poslední commit říká nahlas."
2. **Add a small bullet list block** after the hero with the three places listed.
3. **Rephrase away from the count**: "Odpověď už leží v repu. Couvněte a najděte ji tam."

This is only mildly visible because facilitators explain the three places live, but the rule applies when participants can read the board alone. Reviewer's call.

---

## Minor voice notes (no action required, flag for reviewer)

These are small things a native reviewer may or may not want to smooth. Not blockers.

### `demo / demo-your-toolkit` callout

> Pokaždé, když zjistíš, že agent udělá chybu, vezmi si čas a postav řešení, aby tu chybu už nikdy neudělal.

**"Vezmi si čas" is a mild calque from English "take the time".** Czech flows better with: "zastav se a postav řešení" or "vyhraď si na to chvíli". Keep "vezmi si čas" only if the voice wants that English-ish texture deliberately.

### `demo / demo-first-ten-minutes` body

> Do deseti minut chci mít každý tým v bodě, kdy mu agent reálně pomáhá psát plán.

**"mít každý tým v bodě, kdy"** is a bit nominal-heavy and indirect. Active alternative: "Do deseti minut chci, aby každému týmu agent reálně pomáhal psát plán." or "Za deset minut by měl mít každý tým agenta, který mu reálně pomáhá psát plán."

### `intermezzo-1 / intermezzo-1-check-in` callout

> Bude to tady pro vaše budoucí já i pro toho, kdo tenhle projekt převezme.

**"Vaše budoucí já"** is an Anglicism (from "your future self"). Czech native forms: "pro vás za týden", "pro vás, až to otevřete podruhé", "pro vaše budoucí vy" (less natural) or restructure: "Bude to tady pro vás za týden i pro toho, kdo tenhle projekt převezme po vás."

### `reveal / reveal-go-use-it` body (beyond the `ty`/`vy` issue)

> Nebudu u toho, až příště otevřeš session s agentem – ale všechno, co potřebuješ, už máš v rukou.

**"Máš v rukou"** is a fine idiom. But combined with the `ty`/`vy` inconsistency I already flagged, the whole body needs a single-lens rewrite anyway. Address both at once.

---

## Spot-check: the other 13 Czech files in scope

These were reviewed in the earlier Phase 8 rollout and have not changed meaningfully since. Layer 1 typography is 0 findings on each. I re-scanned each for obvious Layer 2 regressions.

| File | Layer 2 status | Notes |
|---|---|---|
| `content/challenge-cards/deck.md` | **Clean** | Short, direct, Czech voice consistent. |
| `content/challenge-cards/print-spec.md` | **Clean** | Structural print spec, not prose. |
| `content/facilitation/codex-setup-verification.md` | **Clean** | Checklist-style, direct. |
| `content/facilitation/master-guide.md` | **Clean with one note** | 319 lines of facilitator guide, consistently in voice. One minor note: watch for multi-step instructions where the object is implicit — same participant-strict rule applies to the step lines. |
| `content/project-briefs/code-review-helper.md` | **Clean** | Short brief, handoff-first framing lands. |
| `content/project-briefs/devtoolbox-cli.md` | **Clean** | Same. |
| `content/project-briefs/doc-generator.md` | **Clean** | Same. |
| `content/project-briefs/metrics-dashboard.md` | **Clean** | Same. |
| `content/project-briefs/standup-bot.md` | **Clean** | Same. |
| `content/talks/context-is-king.md` | **Clean** | Czech prose with proper voice. |
| `content/talks/codex-demo-script.md` | **Mixed by design** | Partly Czech, partly English (Two-Folder Setup section). Lockfile spans already handle this correctly. The Czech portions read well. |
| `materials/participant-resource-kit.md` | **Clean** | R2 quote issue fixed in earlier session. |
| `workshop-skill/follow-up-package.md` | **Clean** | Short, direct. |

**Other workshop-skill files (reference.md, setup.md, etc.)** — the D-FU1-5 migration moved the English-canonical versions under `locales/en/**` (excluded from copy-editor scope) and the Czech fallbacks are the ones I already reviewed. No change in status.

---

## Recommended action sequence for a native reviewer

1. **Fix the `ty`/`vy` inconsistencies** in the 6 scenes listed in Issue 1. Do one scene at a time, commit as `Czech review: fix ty/vy consistency in <scene-id>`, flip `cs_reviewed: true` on that scene.
2. **Translate the four English eyebrows** in the opening phase. Single commit: `Czech review: translate opening phase eyebrows`. Flip `cs_reviewed: true` on the four scenes.
3. **Decide and enumerate the "three places"** in the two return-to-proof callouts. Single commit: `Czech review: enumerate return-to-proof three places`. Flip `cs_reviewed: true` on those two scenes.
4. **Look at the minor voice notes** and smooth whichever the reviewer wants to. Nothing here is blocking; handle as editorial polish.
5. **Walk through every remaining unreviewed scene** with fresh eyes and flip `cs_reviewed: true` when it reads well in one breath.

After all 37 scenes have `cs_reviewed: true`, the phase-level flags can flip too:

```bash
jq '.phases |= map(.cs_reviewed = true)' workshop-content/agenda.json > /tmp/a.json && mv /tmp/a.json workshop-content/agenda.json
```

Or update per-phase as each phase's scenes all pass.

## What this review is not

This is **not a native-speaker aesthetic pass**. I am checking against the reject list, voice doctrine, clarity rule, and consistency patterns a tool can see. The final read-aloud quality — whether each hero title feels right in the mouth when said to a Czech audience — needs a Czech native to sit with it. The signal the tool can give is what I've given above.

## Appendix: how this review was produced

- Layer 1 audit clean (0/0/0 after R1b `--fix` pass + agenda.json re-segmentation).
- `workshop-content/agenda.json` visible surfaces extracted via `jq` into `/tmp/cs-review-content.txt` (257 lines) — all hero titles, hero bodies, and top-level callouts across 37 scenes.
- Content read against `content/czech-reject-list.md`, `content/style-guide.md`, and the voice doctrine embedded in `.copy-editor.yaml`.
- Non-agenda files re-scanned individually; no regressions from the earlier Phase 8 rollout state.
- `copy-audit --require-reviewed` currently passes (0 findings, all entries reviewed). Flipping `cs_reviewed: true` on agenda scenes is a separate workflow in the content plan, not a copy-editor gate.
