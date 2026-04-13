---
title: "Czech review — batch 1 (opening + talk + demo)"
type: review
date: 2026-04-13
scope: "D1 of refactor-language-flip plan"
status: pending-signoff
---

# Batch 1 — opening + talk + demo

This memo covers the opening / talk / demo scenes that the 2026-04-13 Mode A scene-card review did not handle. Findings are advisory — the human reviewer applies fixes scene-by-scene and flips `cs_reviewed: true` per scene.

## Scenes covered in this memo

1. `opening / opening-day-schedule`
2. `talk / talk-argued-about-prompts`
3. `talk / talk-got-a-name`
4. `talk / talk-how-to-build`
5. `talk / talk-humans-steer`
6. `talk / talk-sitting-inside`
7. `demo / demo-hold-together`
8. `demo / demo-your-toolkit`
9. `demo / demo-first-ten-minutes`

Plus phase-level `cs.facilitatorRunner` for the `talk` phase (audited separately, see end of memo) — it was not part of any scene card.

## Scenes skipped (already in Mode A memo)

- `opening / opening-framing`
- `opening / opening-day-arc`
- `opening / opening-team-formation`
- `opening / opening-handoff`
- `demo / demo-same-prompt`

The `demo / demo-same-prompt` scene was the only demo scene Mode A reviewed; the other three demo scenes are new ground for this batch.

---

## Systemic findings

These patterns recur across the batch — fixing them once per file is cheaper than fixing them 9 times.

### 1. `ty`-form leakage in facilitator notes

Style guide §149–151 explicitly mandates lowercase `vy` for **all** surfaces, including `facilitatorNotes` and `facilitatorRunner.say|do|watch|fallback|show`. The agenda's facilitator-runner blocks have not been swept yet. Recurring offenders:

- **Talk phase `facilitatorRunner.say|do|watch`**: `začni`, `nech`, `zeptej se`, `pojmenuj`, `viděl jsi`, `přejdi`, `řekni`, `pošli`, `použij`, `nech`. All `ty` imperatives. Should be `začněte`, `nechte`, `zeptejte se`, `pojmenujte`, `viděli jste`, `přejděte`, `řekněte`, `pošlete`, `použijte`. (The phase-level `facilitatorRunner.do` is **already** mixed: line 1150 says `Spusťte` and `ukažte` — `vy` form — then line 1151 reverts to `přejdi` and `řekni` — `ty`. Inconsistent within one block.)
- **`opening-day-schedule.cs.facilitatorNotes`**: `Umísti to`, `Jednou přečti`. Should be `Umístěte to`, `Jednou přečtěte`.
- **`talk-got-a-name.cs.facilitatorNotes`**: `použij jednou a důsledně … rozšíříš … drž ji`. Should be `použijte jednou a důsledně … rozšíříte … držte ji`.
- **`demo-hold-together.cs.facilitatorNotes`**: `Drž okamžiky ostré`. Should be `Držte okamžiky ostré`.
- **`demo-your-toolkit.cs.facilitatorNotes`**: `Instalaci otestuj ráno před workshopem čerstvě na facilitátorově stroji`. Should be `Instalaci otestujte ráno před workshopem`.
- **`demo-first-ten-minutes` body block `first-ten-agents-md`**: `Nech ho pokládat otázky`. This is a **participant-facing** block, not a facilitator note, and the rest of the same step uses `vy` (`Otevřete`, `napište`, `ověříte`). Should be `Nechte ho pokládat otázky`. **High impact** — visible on participant slide, mid-sentence inconsistency.

### 2. Hero block eyebrow still in English

Mode A flagged this for `opening-day-arc / opening-team-formation / opening-handoff`. The same bug exists in **`opening-day-schedule`**: `cs.blocks.opening-schedule-hero.eyebrow == "Today's schedule"`. Translation oversight. Should be `"Dnešní rozvrh"` (which is already in the scene's top-level `cs.label`-adjacent area? No — it's only set on the scene-level `cs.label`; the block needs its own Czech eyebrow). Suggested: `"Dnešní rozvrh"` or `"Program dne"`.

### 3. Schedule list label leakage

In `opening-day-schedule.cs.blocks.opening-schedule-list.items`, the entry **`"10:05 · Ukážu ti to (demo)"`** uses `ti` (dative `ty`). The whole agenda has been normalized away from `ty`; this slipped through. Must be `"10:05 · Ukážu vám to (demo)"`.

### 4. `Folder A` / `Folder B` capitalization

Agenda Czech uses `ve Folderu B` (`demo-hold-together`, `demo-your-toolkit`). Loanword + Czech declension is fine per style-guide §code-switching, but capitalization is inconsistent across the day. Mode A did not address this. Suggest sweeping to one form — either `Folder B` (proper-noun stage label) or `folder B`. Not a blocker, flagging for awareness.

### 5. `nářadí` for "toolkit"

`demo-your-toolkit` translates "Your toolkit" as `Vaše nářadí`. `Nářadí` is technically correct but reads as physical hand-tools (hammer/screwdriver), not as a developer toolkit. Czech developer voice would expect `nástroje` or just untranslated `toolkit`. The eyebrow already keeps `Workshop skill` in English, so the file is comfortable with loanwords. Recommendation in scene 8 below.

### 6. `okamžik` for "beat"

`demo-hold-together` translates "four beats" as `čtyři okamžiky`. `Okamžik` means "moment" / "instant" — it has the time-instant meaning but loses the rhythmic, drum-beat metaphor of the English. `čtyři kroky`, `čtyři údery`, `čtyři pohyby`, or even keeping `čtyři beats` would all read more naturally. **Recommend `čtyři kroky`** (parallel to the same scene's later use of "Čtyři pohyby" in `demo-first-ten-minutes`). Note also the inconsistency between scenes — `demo-hold-together` says `okamžiky` for the same idea that `demo-first-ten-minutes` calls `pohyby`.

### 7. Protected-phrase verbatim check

| Phrase | Required CS form | Where it appears | Status |
|---|---|---|---|
| Humans steer. Agents execute. | **Lidé řídí. Agenti vykonávají.** | `talk-humans-steer` title, hero | ✅ verbatim |
| carries the next move | **unese další krok** | not in this batch | n/a |
| Agent = Model + Harness | (loanword equation) | `talk-got-a-name` body, hero | ✅ verbatim |
| task drift | (loanword) | (only in `demo-same-prompt`, Mode A) | n/a |
| Co není v repu, neexistuje | verbatim | `talk-how-to-build` pillar 1 says `Pokud to není v souboru, neexistuje to` — **paraphrase**. See scene 4 finding. |
| Map before motion | n/a in CS | not in this batch | n/a |
| Druhý den, až si otevřete coding agenta, budete pracovat jinak | verbatim per canonical-vocab §5 | `talk-humans-steer.cs.blocks.talk-monday-promise.title` | ✅ verbatim |

The **`Co není v repu, neexistuje`** miss is the only protected-phrase drift in the batch, and it is the most consequential single finding.

### 8. AI-fingerprint and reject-list scan

I ran every `cs` body in this batch against `content/czech-reject-list.md`. Hits:

- **`demo-your-toolkit.cs.blocks.toolkit-reference`** — `taháš` (`ty`) inside an otherwise-`vy` step. Calque-free but addressing-form leak. Should be `taháte`.
- **`demo-first-ten-minutes.cs.blocks.first-ten-agents-md`** — `Nech ho pokládat otázky` (already covered above as systemic finding #1).
- **`talk-sitting-inside.cs.body`** — `je to sales pitch / je to důkaz` is fine. `Workshop skill. Dashboard. Participant board před vámi.` reads as English noun-stack rather than Czech. Hovering close to AI-fingerprint pattern (uniform short fragments with no verbs), but defensible as deliberate stylistic chunking. **Not a hit; flagging only.**

No nominal chains, no `v rámci`, no `realizovat`, no `disponovat`, no `s cílem`, no `dochází k`, no `přičemž` cluster, no `nicméně` overuse. The prose is in voice. The findings are addressing-form, protected-phrase, vocabulary, and a few isolated word choices.

---

## Scene-by-scene findings

### 1. `opening / opening-day-schedule`

**EN canonical (relevant blocks):**
- Hero eyebrow: `"Today's schedule"`
- Body: `"Guides, not deadlines. Lunch timing is negotiated on the day based on room energy."`
- List items: `"10:05 · Let me show you (demo)"`
- `facilitatorNotes`: `"Place this before team formation so teams know what they're joining."`, `"Read the afternoon split once — Build 2 splits around Intermezzo 2."`

**CS current (relevant blocks):**
- Hero eyebrow: `"Today's schedule"` ← still English
- List item: `"10:05 · Ukážu ti to (demo)"` ← `ti` (ty form)
- `facilitatorNotes`: `"Umísti to před formování týmů – účastníci mají vědět, k čemu se připojují."`, `"Jednou přečti odpolední rozdělení – Build 2 se rozpadá kolem Intermezza 2."`

#### Finding 1.1 — English eyebrow

- **What's wrong:** `eyebrow` is verbatim English. Translation oversight; matches the Mode A finding for the other opening scenes.
- **Alt 1:** `"Dnešní rozvrh"` — symmetric with the EN.
- **Alt 2:** `"Program dne"` — slightly more formal Czech idiom; matches the scene-level `cs.label`.
- **Reasoning:** Hero eyebrow is the first thing the room reads. Leaving it in English breaks the bilingual switch.

#### Finding 1.2 — `Ukážu ti to` (dative `ty`)

- **What's wrong:** Style-guide §149 forbids `ty`. `ti` is dative singular of `ty`.
- **Alt 1:** `"10:05 · Ukážu vám to (demo)"` — direct fix.
- **Alt 2:** `"10:05 · Demo: ukážu vám to"` — restructures to lead with the format label, matches Czech-developer rhythm.
- **Reasoning:** This line is on the printed schedule — every participant reads it. Highest-visibility `ty` leak in the agenda.

#### Finding 1.3 — `facilitatorNotes` use `ty`

- **What's wrong:** `Umísti to`, `Jednou přečti` are `ty` imperatives.
- **Alt 1:** `"Umístěte to před formování týmů – účastníci mají vědět, k čemu se připojují."` and `"Přečtěte odpolední rozdělení jednou – Build 2 se rozpadá kolem Intermezza 2."`
- **Alt 2:** Restructure away from imperative: `"Tahle scéna patří před formování týmů — účastníci mají vědět, k čemu se připojují."` and `"Odpolední rozdělení stačí přečíst jednou — Build 2 se rozpadá kolem Intermezza 2."`
- **Reasoning:** Even in facilitator-only views, the style guide is binding. Alt 2 also dodges the imperative entirely, which reads cleaner in note form.

---

### 2. `talk / talk-argued-about-prompts`

**EN body (excerpt):** `"Six months ago the conversation was still about prompts. Today it's about what the agent reads when it opens your repo. The teams that figured that out are shipping in ways that looked impossible last year. Let me show you what changed — then we'll spend the rest of the day practicing it."`

**CS body:** `"Před šesti měsíci se konverzace pořád točila kolem promptů. Dnes je o tom, co agent vidí, když otevře vaše repo. Týmy, které to pochopily, shipují způsoby, které loni vypadaly jako sci-fi. Ukážu vám, co se změnilo – a zbytek dne to budeme trénovat."`

#### Finding 2.1 — `shipují způsoby` is ungrammatical

- **CS:** `"Týmy, které to pochopily, shipují způsoby, které loni vypadaly jako sci-fi."`
- **What's wrong:** `Shipovat něco` takes a direct object — code, a feature, a release — not "ways". The English is `"shipping in ways that looked impossible"`. The Czech turns "ways" into the object of `shipují`, which doesn't compose. Reads like a literal word-by-word render.
- **Alt 1:** `"Týmy, které to pochopily, dnes shipují tempem, které loni vypadalo jako sci-fi."` — `tempem` (instrumental of `tempo`) is the natural Czech for "at a rate / in a way".
- **Alt 2:** `"Týmy, které to pochopily, shipují způsobem, který loni vypadal jako sci-fi."` — singular `způsobem` instead of plural object. Fixes the grammar but keeps `způsob`.
- **Alt 3:** `"Týmy, které to pochopily, shipují tak, jak to loni vypadalo nemožné."` — restructures around `tak`.
- **Reasoning:** This is a hero scene. The current sentence is the most prominent grammatical trip in the batch. **Lean Alt 1.**

#### Finding 2.2 — `loni vypadaly jako sci-fi` softens the EN

- **EN:** `"shipping in ways that looked impossible last year"` — the load-bearing word is `impossible`.
- **CS:** `"vypadaly jako sci-fi"` — `sci-fi` is colorful but loses "impossible" specifically.
- **Alt 1:** `"…které loni vypadalo jako nemožné."` (with the Alt 1 from 2.1 above)
- **Alt 2:** `"…které ještě loni vypadalo nereálně."`
- **Reasoning:** "Sci-fi" is fine prose but softer than the EN. Author's call.

#### Finding 2.3 — `talk-bockeler` step uses inconsistent gloss

- **CS body:** `"…nejčistší definici řemesla pod tím vším. Pojmenovala ho harness engineering…"`
- **What's wrong:** `pod tím vším` is a literal render of `"underneath all of this"` — colloquial in EN, slightly awkward in Czech because the antecedent of `tím vším` is two sentences back. Per `czech-reject-list.md` — pronominal references with no clean antecedent.
- **Alt 1:** `"…nejčistší definici řemesla, které pod tím šumem stojí. Pojmenovala ho harness engineering…"`
- **Alt 2:** `"…nejčistší definici toho, co je pod hypem kolem agentů ve skutečnosti za řemeslo. Pojmenovala ho harness engineering…"` (longer, but unambiguous)
- **Reasoning:** Minor. The talk is facilitator-spoken so the live voice carries it. Worth tightening if rewriting anyway.

#### Finding 2.4 — `talk-hashimoto` step uses `ty`

- **CS:** `"„Pokaždé, když zjistíš, že agent udělá chybu, vezmi si čas a postav takové řešení, aby tu chybu už nikdy neudělal.“"`
- **What's wrong:** `zjistíš`, `vezmi si`, `postav` — all `ty`. Same quote appears in `talk-humans-steer.cs.blocks.talk-hashimoto-quote` and again in `demo-your-toolkit` body and `demo-hashimoto-operationalized` callout. **Three of those four occurrences are `ty`, one is already `vy`** (`demo-hashimoto-operationalized` says `zjistíte … vezměte … postavte`). Inconsistent within the same scene file.
- **Alt 1:** Match `demo-hashimoto-operationalized`: `"„Pokaždé, když zjistíte, že agent udělá chybu, vezměte si čas a postavte takové řešení, aby tu chybu už nikdy neudělal.“"`
- **Alt 2:** Keep the imperative softer with `je třeba`: `"„Pokaždé, když agent udělá chybu, vezměte si čas a postavte řešení tak, aby tu chybu už nikdy neudělal.“"`
- **Reasoning:** Hashimoto's quote is the canonical one-sentence definition of a sensor. It appears in **four scenes** across the day. Cross-scene consistency matters more than per-scene polish. Apply Alt 1 to **all four** appearances.

#### Finding 2.5 — `talk-guo` quote translation drift

- **CS:** `"„Přecházím od chatování s AI k jejich řízení.“"`
- **EN:** `"I'm moving away from chatting with AIs and moving towards managing them."`
- **What's wrong:** Canonical-vocab §3 says CS for the role-shift is `**managing, ne chatování**`. The Czech here uses `chatování` and `řízení` — `řízení` is "steering / driving / managing", but the canonical name for the concept in §3 is `managing`. Inconsistent with the agenda's own framing.
- **Alt 1:** `"„Přecházím od chatování s AI k managingu.“"` — keeps the canonical loanword.
- **Alt 2:** `"„Přecházím od chatování s AI k tomu, abych je řídil.“"` — keeps verb form, parallels `řízení` elsewhere.
- **Reasoning:** This same quote appears verbatim in `talk-how-to-build.cs.blocks.pillar-managing.body` — and there it says `„Přecházím od chatování s AI k jejich řízení.“` (identical). Either both use `managing`, or both keep `řízení` and the canonical-vocab spec is updated. **Recommend Alt 1 in both places** so the §3 canonical name is preserved.

---

### 3. `talk / talk-got-a-name`

**EN hero body:** `"Ten days ago, Birgitta Böckeler published this equation on Martin Fowler's site: Agent = Model + Harness. The model has the power. The harness is what turns that power into useful work instead of drift."`

**CS hero body:** `"Před deseti dny publikovala Birgitta Böckeler na webu Martina Fowlera tuhle rovnici: Agent = Model + Harness. Model má sílu. Harness je to, co tu sílu mění v užitečnou práci místo v drift."`

#### Finding 3.1 — `místo v drift`

- **What's wrong:** `místo v drift` is grammatically odd. `místo` + locative requires the noun to be in locative case (`místo v driftu`), or the construction restructures. As written, `drift` is uninflected accusative-shape after the preposition `v` — Czech grammar wants locative (`v\u00A0driftu`).
- **Alt 1:** `"…co tu sílu mění v užitečnou práci místo v\u00A0drift."` → `"…co tu sílu mění v\u00A0užitečnou práci, ne v\u00A0drift."` (replaces `místo` with `ne` — both shorter and grammatically uncontroversial; `v drift` is still odd but at least the framing isn't `místo`)
- **Alt 2:** `"…co tu sílu mění v\u00A0užitečnou práci, místo aby z\u00A0ní byl drift."` (full restructure)
- **Alt 3:** `"…co tu sílu mění v\u00A0užitečnou práci a ne v\u00A0task drift."` — explicit term link to `task drift` from `demo-same-prompt`. Strongest pedagogically; ties two concepts together early.
- **Reasoning:** The current line is grammatically defensible only if you treat `drift` as an indeclinable English loan, but Czech speakers will hear the missing case. **Lean Alt 3** because it forward-references the demo's named failure mode.

#### Finding 3.2 — `talk-engine-chassis` — long block, mostly clean

- **CS body (excerpt):** `"Představte si syrový motor. Silný – čtyři stovky koní, víc, než většina řidičů zvládne. Přišroubujte ho k\u00A0nákupnímu vozíku a máte velmi drahý způsob, jak rozbít parkoviště. Přišroubujte ho k\u00A0dobře navrženému podvozku – rám, odpružení, brzdy, převodovka, pořádné pneumatiky – a najednou se stane něco neobyčejného. Auto může řídit někdo, kdo není profík. Podvozek neudělal motor slabším. Udělal tu sílu dostupnou, předvídatelnou a přežitelnou. To je model. To je harness."`
- **Status:** Reads well. `vy` form throughout. One micro-finding:
- **Finding:** `"a najednou se stane něco neobyčejného. Auto může řídit někdo, kdo není profík."` — the EN is `"and suddenly the car becomes drivable by someone who isn't a professional"`. The Czech splits the sentence and inserts `něco neobyčejného` ("something extraordinary") which is **added meaning** not in the EN. Mild drift; the original is more matter-of-fact.
- **Alt 1:** Drop the inserted clause: `"…a najednou auto může řídit někdo, kdo není profík."`
- **Alt 2:** Keep the rhythm break but prune the editorial: `"…a najednou je to auto, které může řídit někdo, kdo není profík."`
- **Reasoning:** The EN is dryly mechanical — that's the analogy's whole point. `něco neobyčejného` adds emotion that softens the engineering metaphor. Author's call; lean Alt 1.

#### Finding 3.3 — `talk-reframe-callout`

- **CS title:** `"Mezera mezi modely se zužuje. Mezera mezi harnessy se prohlubuje."`
- **EN title:** `"The gap between models is narrowing. The gap between harnesses is widening."`
- **Finding:** `prohlubuje` means "deepens", not "widens". `Mezera` is "gap / space" — gaps don't deepen, they widen. The natural Czech verb for "gap is widening" is `roste` or `rozšiřuje se`. `prohlubuje se` would be right for `propast` (chasm).
- **Alt 1:** `"Mezera mezi modely se zužuje. Mezera mezi harnessy roste."`
- **Alt 2:** `"Mezera mezi modely se zužuje. Mezera mezi harnessy se rozšiřuje."`
- **Alt 3 (more dramatic, swap noun):** `"Propast mezi modely se zužuje. Propast mezi harnessy se prohlubuje."` — keeps `prohlubuje` by promoting `mezera`→`propast`. Higher rhetorical temperature.
- **Reasoning:** As written, the metaphor is broken and a Czech reader will notice. **Lean Alt 1**, or Alt 3 if the room can take the higher temperature.

---

### 4. `talk / talk-how-to-build`

**EN body (excerpt):** `"Fowler splits it into guides and sensors. … I'm going to give you the four pillars I've watched actually work — across all of those framings. These are the four you'll practice before lunch."`

**CS body:** `"Fowler to dělí na guides a sensors. OpenAI na context, constraints a feedback. Guo to rámuje jako managing místo chatování. Dám vám čtyři sloupy, které jsem viděl reálně fungovat – napříč všemi těmi rámováními. Tyto čtyři budete trénovat před obědem."`

#### Finding 4.1 — Protected phrase paraphrase

- **CS pillar 1 body:** `"Repo je agentova paměť. AGENTS.md, skills, runbooks – týmová infrastruktura, ne dokumentace. Pokud to není v souboru, neexistuje to. Ten standard má jméno – AGENTS.md – a Linux Foundation ho teď spravuje."`
- **What's wrong:** `Pokud to není v souboru, neexistuje to.` is a paraphrase of the protected phrase **`Co není v repu, neexistuje`** (canonical-vocab §2 row 5). Two specific drifts: (a) `souboru` instead of `repu` — the canonical phrase is repo-anchored, not file-anchored; (b) the `Pokud … neexistuje to` structure dilutes the meme.
- **Alt 1:** `"Repo je agentova paměť. AGENTS.md, skills, runbooky – týmová infrastruktura, ne dokumentace. Co není v\u00A0repu, neexistuje. Ten standard má jméno – AGENTS.md – a Linux Foundation ho teď spravuje."` — restores verbatim §2 form.
- **Alt 2:** Same as Alt 1 but reorder: `"Repo je agentova paměť. Co není v\u00A0repu, neexistuje. AGENTS.md, skills, runbooky jsou týmová infrastruktura, ne dokumentace. Standard se jmenuje AGENTS.md a Linux Foundation ho teď spravuje."`
- **Reasoning:** Protected phrases are protected because the same exact words are repeated in the talk, the challenge cards, and the coaching codex. Paraphrasing here breaks the recall in every later moment. **Highest-impact single finding in the batch.** Apply Alt 1 verbatim.

Also note: `runbooks` should be `runbooky` (Czech plural) — the same scene already declines `skills` informally; consistency matters.

#### Finding 4.2 — `pillar-managing` `ty`/`vy` mismatch

- **CS pillar 4 body:** `"Přestáváš být pair-programmer a stáváš se režisérem s\u00A0týmem. „Přecházím od chatování s\u00A0AI k\u00A0jejich řízení.“ – Charlie Guo."`
- **What's wrong:** `Přestáváš`, `stáváš se` — `ty`. The rest of the talk is `vy`.
- **Alt 1:** `"Přestáváte být pair-programmer a stáváte se režisérem s\u00A0týmem. …"`
- **Alt 2:** `"Přestáváte být pair-programmer a stáváte se režisérem celého týmu. …"` — minor tightening of `s týmem`→`celého týmu` for rhythm.
- **Reasoning:** Single isolated `ty` slip in a `vy` scene. Plus see Finding 2.5 for the Guo quote `chatování → managing` consistency question.

#### Finding 4.3 — `pillar-sensors` body — minor

- **CS:** `"…feedback optimalizovaný pro agentovu spotřebu a rámovaný holisticky. Když agent dělá víc, vaše ověření musí dokázat, že drží celek, ne že jedna funkce vrátila 4."`
- **Finding:** `optimalizovaný pro agentovu spotřebu` is grammatically fine but `agentovu spotřebu` reads as nominalization (`spotřeba` is `consumption`, a nominal noun). EN says `optimized for the agent to consume` — the verb-form `to consume` is what makes the EN crisp. Czech can use `aby ho agent zkonzumoval` or restructure.
- **Alt 1:** `"…feedback navržený tak, aby ho agent uměl zpracovat, a rámovaný holisticky. …"`
- **Alt 2:** `"…feedback, který agent přečte celý a zpracuje, rámovaný holisticky. …"`
- **Reasoning:** Minor. Borderline AI-fingerprint nominalization — it's exactly the pattern reject-list §nominal-chains warns against. Worth fixing if the reviewer is in this scene anyway.

#### Finding 4.4 — `talk-team-lead-callout` — clean

`"Team lead staví systém, ve kterém tým běží. Neříká každému developerovi, co má dělat každých třicet vteřin. Staví pravidla, rituály a feedback loops, ve kterých tým běží. Dnes trénujeme přesně tenhle posun – pro agenty."` — reads well, no findings. `feedback loops` as untranslated loan is fine per style-guide §code-switching.

---

### 5. `talk / talk-humans-steer`

**Status of the protected phrase:** The hero title `"Lidé řídí. Agenti vykonávají."` is **verbatim correct** per canonical-vocab §2. Do not touch.

**CS body:** `"Čtyři slova od Ryana Lopopola, inženýra OpenAI, který vedl tým shipující milion řádků produkčního kódu za pět měsíců bez jediného ručně psaného řádku. Tohle je jeho základní princip – ten, o kterém říká, že na něm všechno ostatní stojí. Odneste si tyhle čtyři slova na příště, až si otevřete agenta. Všechno ostatní, co se dnes naučíte, je způsob, jak je uvést do praxe."`

#### Finding 5.1 — `tým shipující milion řádků` — participle as nominal modifier

- **What's wrong:** `tým shipující milion řádků` is grammatically Czech but the active participle (`shipující`) reads as bookish/AI-fingerprint. Reject-list flags participle clusters as one of the most reliable AI fingerprints. Czech-speaking developer would say `tým, který shipnul…`.
- **Alt 1:** `"…inženýra OpenAI, jehož tým shipnul milion řádků produkčního kódu za pět měsíců bez jediného ručně psaného řádku."`
- **Alt 2:** `"…inženýra OpenAI. Vedl tým, který za pět měsíců shipnul milion řádků produkčního kódu – a žádný řádek z\u00A0nich nepsal člověk."`
- **Reasoning:** Alt 2 also breaks the long sentence into two — better speakable rhythm for a talk.

#### Finding 5.2 — `tyhle čtyři slova`

- **What's wrong:** `slovo` is **neuter** in Czech. Plural is `tahle čtyři slova` (neuter), not `tyhle čtyři slova` (which would be feminine). Same in `Odneste si tyhle čtyři slova` and `Čtyři slova` (correct earlier) — but `tyhle čtyři slova` later in the same body uses the wrong gender on `tyhle`. **Grammatical error.**
- **Alt 1:** `"Odneste si tahle čtyři slova s\u00A0sebou na příště, až si otevřete agenta."`
- **Alt 2 (rewriting around the issue):** `"Tahle čtyři slova si vezměte s\u00A0sebou na příště, až si otevřete agenta."`
- **Reasoning:** Native-speaker red flag. Hero scene; this single mismatch will be the first thing a Czech reviewer notices.

#### Finding 5.3 — `na příště, až si otevřete agenta`

- **What's wrong:** `na příště` is fine colloquial Czech but slightly unclear ("for next time" — for next what?). The EN is `"into next week"` — already modified by canonical-vocab §5 ("Monday is banned in both languages, use next-day framing"). The Czech `na příště, až si otevřete agenta` partially honors §5 but `na příště` is ambiguous.
- **Alt 1:** `"…vezměte si je s\u00A0sebou na druhý den, až si otevřete coding agenta."` — exactly mirrors the canonical CS phrase from §5 (`Druhý den, až si otevřete coding agenta`).
- **Alt 2:** `"…vezměte si je s\u00A0sebou na zítřek, až si otevřete agenta."`
- **Reasoning:** §5 is explicit. The promise callout in the same scene already says `Druhý den, až si otevřete coding agenta…` — the body should echo that phrasing, not invent a new one.

#### Finding 5.4 — `talk-monday-promise` callout — already clean

The callout body `Ne s\u00A0novým nástrojem. S\u00A0jinou rolí. Přestanete být ten, koho se agent ptá, a stanete se tím, kdo staví prostředí, do kterého agent vchází.` is **verbatim** the canonical-vocab §5 second protected phrase. Excellent. Do not touch.

#### Finding 5.5 — `talk-lopopolo-quote` — already clean

`"Dejte Codexu mapu, ne tisícistránkový návod."` — clean Czech, `vy` form, captures the EN. Note for a future canonical-vocab update: "Give Codex a map, not a 1,000-page instruction manual" might earn protected-phrase status — flagging.

---

### 6. `talk / talk-sitting-inside`

**EN hero body:** `"The workshop skill, the dashboard, the participant board, the repo you're about to open — all of it was built with agents, using the discipline we just named. What you're about to see in the demo is a working instance, not a promise."`

**CS hero body:** `"Workshop skill, dashboard, participant board, repo, které za chvíli otevřete – to všechno bylo postavené s\u00A0agenty a disciplínou, kterou jsme právě pojmenovali. To, co uvidíte v\u00A0demu, není slib. Je to funkční instance."`

#### Finding 6.1 — `participant board` — Mode A normalization conflict

- **What's wrong:** Mode A's systemic finding §4 normalizes `board` → `plátně` (after the `opening-handoff` pattern). The decision was: **use `plátně`, not `board`**. This scene leaves `participant board` untranslated.
- **Alt 1:** `"Workshop skill, dashboard, participant plátno, repo, které za chvíli otevřete…"` — applies Mode A normalization. (Awkward — `participant plátno` is a hybrid that doesn't read naturally.)
- **Alt 2:** `"Workshop skill, dashboard, plátno před vámi, repo, které za chvíli otevřete…"` — drops `participant` qualifier entirely.
- **Alt 3:** Punt the issue: keep `participant board` as a stable proper-noun-style label. **But:** then Mode A's normalization needs an explicit exception for "participant board" as a UI surface name.
- **Reasoning:** This is a coordination question with Mode A, not a unilateral fix. The reviewer should decide between Alt 2 (apply normalization with restructure) or Alt 3 (carve out a UI exception). **Lean Alt 2.** Note that Mode A scene 4's `opening-handoff` finding says "What does 'board' actually refer to?" — the same question applies here, and the answer for `participant board` is "the participant-facing screen / surface", which lines up with `plátno`.

#### Finding 6.2 — Body opens with English noun stack

- **CS:** `"Workshop skill. Dashboard. Participant board před vámi. Repo, které za chvíli otevřete."` — this is the **scene-level** `cs.body`, separate from the hero body. The block-level hero body has commas.
- **What's wrong:** Two different formattings of the same list across `cs.body` (period-separated fragments) and `cs.blocks.talk-sitting-hero.body` (comma-separated). One should win.
- **Alt 1:** Match the block (commas) in both: `"Workshop skill, dashboard, plátno před vámi, repo, které za chvíli otevřete – to všechno…"`
- **Alt 2:** Match the scene-level (periods, fragment beats) in both: makes a more dramatic stage list. Author's call.
- **Reasoning:** Internal consistency. Pick one rhythm.

#### Finding 6.3 — `Není to sales pitch.`

- **CS:** `"Není to sales pitch. Je to důkaz."`
- **What's wrong:** `sales pitch` is fine as a recognizable English term, but `Není to sales pitch / Je to důkaz` is a calque-y English rhythm. Czech with similar punch: `Není to reklama. Je to důkaz.` or `Není to prodejní řeč. Je to důkaz.`.
- **Alt 1:** `"Není to reklama. Je to důkaz."` — short, punchy, fully Czech.
- **Alt 2:** Keep as is — `sales pitch` is a known phrase in Czech tech-speak. Defensible.
- **Reasoning:** Author's call. Note the EN says "Not as a sales pitch — as proof", and the Czech echoes it well. Minor finding.

---

### 7. `demo / demo-hold-together`

**EN hero body:** `"Four beats. Each one feeds the next. This is the workflow you'll run in your own Folder B in twenty minutes."`

**CS hero body:** `"Čtyři okamžiky. Každý připravuje ten další. Tohle je workflow, který za dvacet minut spustíte ve vlastním Folderu B."`

#### Finding 7.1 — `okamžiky` for "beats" (systemic — see §6 above)

- **Alt 1:** `"Čtyři kroky. Každý připravuje ten další. Tohle je workflow, který za dvacet minut spustíte ve vlastním Folderu B."` — `kroky` parallels `demo-first-ten-minutes` "Čtyři pohyby".
- **Alt 2:** `"Čtyři pohyby. Každý vede k\u00A0dalšímu. Tohle je workflow, který za dvacet minut spustíte ve vlastním Folderu B."` — exactly mirrors `demo-first-ten-minutes`.
- **Alt 3:** `"Čtyři údery. Každý připravuje ten další."` — keeps the drum-beat metaphor.
- **Reasoning:** **Lean Alt 2** for cross-scene consistency with the next demo scene. The day uses `pohyby` already; reusing it strengthens recall.

#### Finding 7.2 — Callout body uses `chytíš` (`ty`)

- **CS callout body:** `"Je to součást workflow. Každý okamžik živí ten další. Když se něco pokazí – a občas se pokazí – chytíš to o\u00A0jeden okamžik dál, ne o\u00A0deset."`
- **What's wrong:** `chytíš` — `ty`. Same word also uses `okamžik` (already flagged 7.1).
- **Alt 1:** `"…chytíte to o\u00A0jeden krok dál, ne o\u00A0deset."` — fixes both `ty` and `okamžik` together.
- **Alt 2:** `"…je to o\u00A0jeden krok dál, kde se to chytne, ne o\u00A0deset."` — restructures around the verb to avoid imperative-y voice.
- **Reasoning:** **Lean Alt 1.**

#### Finding 7.3 — `flow-review` body

- **CS:** `"Review není panická brzda na konci. Je to způsob, jak se agent a tým shodnou na tom, co právě shipnulo."`
- **EN:** `"Review is not a panic brake at the end. It's how the agent and the team agree on what just shipped."`
- **Finding:** `co právě shipnulo` — `shipnulo` is past tense, neuter singular. The implied subject is "the work / what was shipped", which works in EN but is rough in CS. More natural: `co se právě shiplo` (reflexive) or `co se právě dostalo ven`. Or accept the loanword verb form and write `co právě shipnul` (referring to "the team"). Currently the verb is genderless-neuter and reads awkwardly.
- **Alt 1:** `"Review není panická brzda na konci. Je to způsob, jak se agent a tým shodnou na tom, co se právě shiplo."` — reflexive past, idiomatic.
- **Alt 2:** `"Review není panická brzda na konci. Je to způsob, jak se agent a tým shodnou na tom, co tým právě shipnul."` — explicit subject.
- **Reasoning:** Alt 1 is closest to the EN's vague-subject style. Lean Alt 1.

#### Finding 7.4 — `demo-review-callout` title

- **CS title:** `"Review není havarijní brzda."`
- **EN title:** `"Review is not an emergency brake."`
- **Finding:** `havarijní brzda` is the formal Czech term for a railway emergency brake — perfect. No issue. The body says `panická brzda` (panic brake). Internal mismatch: title and body use different metaphors. EN body says `panic brake`, EN title says `emergency brake` — same drift in EN. (May be an EN canonical issue too — flagging.)
- **Alt 1:** Make CS body match CS title: `"Review není havarijní brzda. Je to součást workflow…"`
- **Alt 2:** Make CS title match CS body: `"Review není panická brzda."`
- **Reasoning:** Pick one, apply twice. Author's call; `havarijní brzda` is the more dignified Czech.

---

### 8. `demo / demo-your-toolkit`

**EN hero title:** `"Your toolkit, same discipline"`
**CS hero title:** `"Vaše nářadí, stejná disciplína"`

#### Finding 8.1 — `nářadí` for "toolkit" (systemic — see §5 above)

- **What's wrong:** `nářadí` is correct Czech but reads as physical hand tools. The scene is about a software tool / CLI. Czech developer voice would say `nástroje` (plural, neutral) or just keep `toolkit`.
- **Alt 1:** `"Vaše nástroje, stejná disciplína"` — natural Czech.
- **Alt 2:** `"Váš toolkit, stejná disciplína"` — keeps the loanword. The scene's eyebrow already keeps `Workshop skill` in English, so this fits the file's voice.
- **Alt 3:** `"Vaše nástrojovna, stejná disciplína"` — playful (`nástrojovna` = toolshop). Probably too cute.
- **Reasoning:** **Lean Alt 2.** The whole scene is about a single tool (the workshop skill), not multiple tools, so `nástroje` (plural) is technically also slightly off. `toolkit` is recognized as a developer term in Czech.

Same fix needed in scene-level `cs.label`: `"Vaše nářadí"` → `"Váš toolkit"` or `"Vaše nástroje"`.

#### Finding 8.2 — `toolkit-brief` body

- **CS:** `"Skill ví, který jste tým, jaký máte projekt a v\u00A0jaké jste fázi. Zeptejte se a dostanete, co potřebujete."`
- **EN:** `"The skill knows your team, your project, your phase. Ask it, it hands you what you need."`
- **Finding:** `který jste tým` is grammatically OK but reads bookish. More natural Czech: `jaký jste tým` (parallel to `jaký máte projekt`) — current text actually mismatches its own parallel structure (`který … jaký … jaké`).
- **Alt 1:** `"Skill ví, jaký jste tým, jaký máte projekt a v\u00A0jaké jste fázi. Zeptejte se a dostanete, co potřebujete."` — parallel `jaký / jaký / jaké`.
- **Alt 2:** `"Skill ví, kdo jste, na čem děláte a v\u00A0jaké jste fázi. Zeptejte se a dostanete, co potřebujete."` — restructures around verbs.
- **Reasoning:** Alt 2 is more in voice (less bookish), Alt 1 is the smaller fix.

#### Finding 8.3 — `toolkit-reference` body uses `taháš` (`ty`)

- **CS:** `"Patterns, příklady, kontroly. Ne tutoriál – reference, ze které si taháš v\u00A0okamžiku potřeby."`
- **What's wrong:** `taháš` — `ty`. Single isolated leak in an otherwise-`vy` scene.
- **Alt 1:** `"Patterns, příklady, kontroly. Ne tutoriál – reference, ze které si taháte v\u00A0okamžiku potřeby."`
- **Alt 2:** `"Patterns, příklady, kontroly. Ne tutoriál, ale reference, kterou otevřete ve chvíli, kdy ji potřebujete."` — full restructure, removes the slangy `taháte` if the reviewer wants something more dignified.
- **Reasoning:** Alt 1 is minimum fix. Alt 2 if you want to upgrade voice while you're in there.

#### Finding 8.4 — `toolkit-record` body — long, compound

- **CS:** `"Pokaždé, když najdete chybu, kterou má smysl opravit napříště, žije tady. V\u00A0souboru, v\u00A0repu, pro příštího člověka. Nebo pro příštího vás."`
- **EN:** `"Every time you find a mistake worth fixing for next time, it lives here."` — the EN ends here. The "in a file, in the repo, for the next person, or the next you" sentence is in `demo-hashimoto-operationalized` callout body, **not** in the EN of `toolkit-record`. The CS has merged two separate EN blocks into one.
- **What's wrong:** Translation drift — content from one block has crept into another. The CS `toolkit-record` should end after `žije tady`; the rest belongs in `demo-hashimoto-operationalized`.
- **Alt 1:** `"Pokaždé, když najdete chybu, kterou má smysl opravit napříště, žije tady."` — matches EN scope.
- **Alt 2:** Keep merged but make sure the callout doesn't repeat. Currently both the `toolkit-record` body and the `demo-hashimoto-operationalized` body contain `"Nebo pro příštího vás."` / `"Nebo pro další vás."` — **content duplication** in the participant view. Confirmed by reading the JSON: `toolkit-record.body` ends `"…pro příštího člověka. Nebo pro příštího vás."` and `demo-hashimoto-operationalized.body` ends `"…pro dalšího člověka. Nebo pro další vás."` — slight rewording but same idea, twice on the same scene.
- **Reasoning:** **Highest-impact participant-facing finding in the demo phase.** The duplication makes the scene read as if the same point is being made twice. Lean Alt 1 — restore the EN structure, leave the "next you" line only in the callout.

#### Finding 8.5 — `demo-hashimoto-operationalized` callout

- **CS:** `"Pokaždé, když zjistíte, že agent udělá chybu, vezměte si čas a postavte řešení, aby tu chybu už nikdy neudělal. Tenhle skill je místo, kde to děláte – v\u00A0souboru, v\u00A0repu, pro dalšího člověka. Nebo pro další vás."`
- **Status:** This block is **already** `vy` and clean. **Use it as the canonical Hashimoto-quote phrasing** and back-port it to the three other Hashimoto appearances (see Finding 2.4). The only nit is `další vás` (`vás` here is genitive plural of `vy`) — slightly confusing because Czech doesn't naturally pluralize the second-person across iterations of the same person. EN uses `the next you` which is a singular self-reference.
- **Alt 1:** `"…pro dalšího člověka. Nebo pro vás samotné, až sem příště přijdete."` — full unfolding.
- **Alt 2:** `"…pro dalšího člověka. Nebo pro vás, až k\u00A0tomu příště přijdete."`
- **Alt 3:** Keep `Nebo pro další vás.` and accept the playful loose grammar — it reads as a deliberate stylistic choice.
- **Reasoning:** Author's call. The `další vás` reads cute but is grammatically odd. Worth a beat of thought.

---

### 9. `demo / demo-first-ten-minutes`

**EN hero body:** `"Four moves. Don't skip any of them. In ten minutes I want every team at the point where the agent is actually helping you draft your plan."`

**CS hero body:** `"Čtyři pohyby. Žádný nevynechejte. Do deseti minut chci mít každý tým v\u00A0bodě, kdy mu agent reálně pomáhá psát plán."`

#### Finding 9.1 — `Žádný nevynechejte` — already good `vy` imperative

Hero body is clean.

#### Finding 9.2 — `first-ten-agents-md` body — `ty`/`vy` mid-sentence flip

- **CS:** `"Otevřete session a napište společně tři věci: jak vypadá done, co není v\u00A0scope a co ověříte jako první. Agent je váš první spolupracovník. Nech ho pokládat otázky."`
- **What's wrong:** `Otevřete`, `napište`, `ověříte` — `vy`. Then `Nech ho pokládat otázky` — `ty`. Mid-block flip in a participant-facing step. **Highest-visibility `ty` leak in the demo phase.**
- **Alt 1:** `"…Agent je váš první spolupracovník. Nechte ho pokládat otázky."`
- **Alt 2:** `"…Agent je váš první spolupracovník — pusťte ho do otázek."`
- **Reasoning:** Alt 1 is the minimum fix and preserves rhythm. Apply.

#### Finding 9.3 — `co není v scope` — Czech declension

- **CS:** `"…co není v\u00A0scope a co ověříte jako první."`
- **What's wrong:** `v scope` is missing the locative ending. `scope` is a loanword; in this workshop's voice it should decline (`ve scopu`) or be replaced with a Czech word. Style-guide §code-switching says nesklonné loanwordy that don't take Czech endings stay as-is, but `scope` does morphologically allow a locative.
- **Alt 1:** `"…co není ve\u00A0scopu a co ověříte jako první."` — declines.
- **Alt 2:** `"…co je mimo rozsah a co ověříte jako první."` — full Czech (`rozsah` = "scope"). More dignified.
- **Alt 3:** `"…co do toho nepatří a co ověříte jako první."` — colloquial.
- **Reasoning:** Lean Alt 1 (keeps the loanword consistent with the rest of the file's relaxed tech-speak).

#### Finding 9.4 — `demo-starting-move-callout` title

- **CS title:** `"Nejdřív ladění v\u00A0týmu, potom ladění s\u00A0agentem."`
- **EN title:** `"Align with your team, then align with the agent."`
- **What's wrong:** `ladění` means "tuning / debugging" — not "align". The Czech reads as "first team-debugging, then agent-debugging", which is wrong. The EN sense is closer to `shoda` / `dohoda` / `srovnat se`.
- **Alt 1:** `"Nejdřív se shodněte v\u00A0týmu, potom se shodněte s\u00A0agentem."` — verb form, parallel.
- **Alt 2:** `"Nejdřív dohoda v\u00A0týmu, potom dohoda s\u00A0agentem."` — keeps nominal parallel but changes the noun.
- **Alt 3:** `"Nejdřív tým, potom agent."` — minimalist, drops the `align` entirely. Most punch.
- **Reasoning:** Current is a meaningful translation drift, not just a register issue. **Lean Alt 1.**

#### Finding 9.5 — `demo-ambition-callout` body — `Den potom je pointa.`

- **CS:** `"…ale jakmile drží, jděte tak daleko, jak váš tým dokáže. Den potom je pointa."`
- **EN:** `"…The harness comes first — but once the harness holds, go as far as your team can reach. The day after is the point."`
- **What's wrong:** `Den potom je pointa.` is a literal, terse render of "The day after is the point." It works but feels translated. `Pointa` is fine slang for "point", but the bigger issue is `Den potom` — Czech naturally says `Druhý den` (also: `"Den potom"` echoes neither §5 canonical nor any natural Czech idiom). Per canonical-vocab §5, the agenda's official day-after framing is **`Druhý den, až si otevřete coding agenta…`**. Connect to it.
- **Alt 1:** `"Druhý den u\u00A0klávesnice je pointa."` — connects to §5 framing.
- **Alt 2:** `"Pointa je v\u00A0druhém dni — tom, kdy si otevřete agenta a budete pracovat jinak."` — explicit echo of the §5 canonical phrase.
- **Alt 3:** Keep `Den potom je pointa.` as a deliberate minimalist closing line. Defensible.
- **Reasoning:** §5 was written to give the day-after framing one canonical surface form. Honoring it here ties the callout to the talk's `talk-monday-promise`. **Lean Alt 1.**

#### Finding 9.6 — `Pokud ještě neexistuje` drift in `first-ten-repo`

- **CS:** `"Pokud ještě neexistuje, vytvořte ho ze šablony. Jeden člověk ho otevře pro celý tým."`
- **EN:** `"Create from template if you need to. One person opens it for everyone."`
- **What's wrong:** `Pokud ještě neexistuje` adds "if it doesn't exist yet" which is **not** in the EN. The EN says `if you need to` — softer, leaves the decision to the team, doesn't presume the repo state.
- **Alt 1:** `"V\u00A0případě potřeby ho vytvořte ze šablony. Jeden člověk ho otevře pro celý tým."` — note `v případě potřeby` is on the reject list (calque). Avoid.
- **Alt 2:** `"Pokud potřebujete, vytvořte ho ze šablony. Jeden člověk ho otevře pro celý tým."` — clean, in voice.
- **Alt 3:** `"Když potřebujete, vytvořte ho ze šablony. Jeden člověk ho otevře pro celý tým."` — `když` is shorter than `pokud`, slightly more spoken.
- **Reasoning:** **Lean Alt 2 or 3.**

---

## Phase-level audit — `talk.cs.facilitatorRunner`

This is not a scene but a phase-level block that the dashboard surfaces to the facilitator. It was not part of any scene-card review and contains the most concentrated `ty` violations in the file.

**CS `say`:**
1. `"Začni kontrastem připravenosti repa: stejný prompt, dvě repa. Nech místnost vidět rozdíl dřív, než ho pojmenuješ."`
2. `"Po kontrastu se zeptej: 'Co se změnilo?' Nech promluvit dva hlasy."`
3. `"Pojmenuj, co jsi viděl: agent v\u00A0holém repu dělal uvěřitelná, ale špatná rozhodnutí, protože neměl mantinely. Tohle je task drift."`
4. `"Kontext je páka, ne kosmetika. Práci udělalo repo, ne prompt."`

**CS `show`:**
1. `"Promítni nejdřív kontrast připravenosti repa, pak tezi, pak přechod do buildu."`
2. `"Participant pohled ukaž jen jako potvrzení, že room, dashboard a repo drží stejný moment."`

**CS `do`:**
1. `"Spusťte kontrast: ukažte nejdřív holé repo, pak repo s\u00A0harnessem a stejným promptem."` — **`vy`** ✅
2. `"Když kontrast dosedne, přejdi na tezi. Řekni ji jednou jasně."` — **`ty`** ❌
3. `"Pošli místnost do build fáze 1 s\u00A0jedním očekáváním: nejdřív mapa a ověření, teprve potom práci na funkcích."` — **`ty`** ❌

**CS `watch`:**
- Both items are clean (no imperative).

**CS `fallback`:**
1. `"Když se demo vleče, použij připravené screenshoty. Kontrast je důležitější než živé generování."` — **`ty`** ❌
2. `"Když je pozornost nízko, nech hlavní větu, team-lead analogii a jeden konkrétní build expectation."` — **`ty`** ❌

**Finding (consolidated):** Phase-level facilitatorRunner is overwhelmingly `ty`, with a single `vy` line in `do[0]` (`Spusťte / ukažte`) that proves the inconsistency was an oversight, not a deliberate stylistic choice. **Sweep all to `vy`.** Style-guide §149 binds this surface — facilitator notes are listed by name.

**Suggested rewrites:**
- `say[1]` → `"Začněte kontrastem připravenosti repa: stejný prompt, dvě repa. Nechte místnost vidět rozdíl dřív, než ho pojmenujete."`
- `say[2]` → `"Po kontrastu se zeptejte: ‚Co se změnilo?' Nechte promluvit dva hlasy."` (Also: replace ASCII apostrophes with Czech quotation marks `‚...'`.)
- `say[3]` → `"Pojmenujte, co jste viděli: agent v\u00A0holém repu dělal uvěřitelná, ale špatná rozhodnutí, protože neměl mantinely. Tohle je task drift."`
- `show[1]` → `"Promítněte nejdřív kontrast připravenosti repa, pak tezi, pak přechod do buildu."`
- `show[2]` → `"Participant pohled ukažte jen jako potvrzení, že room, dashboard a repo drží stejný moment."`
- `do[2]` → `"Když kontrast dosedne, přejděte na tezi. Řekněte ji jednou jasně."`
- `do[3]` → `"Pošlete místnost do build fáze 1 s\u00A0jedním očekáváním: nejdřív mapa a ověření, teprve potom práci na funkcích."`
- `fallback[1]` → `"Když se demo vleče, použijte připravené screenshoty. Kontrast je důležitější než živé generování."`
- `fallback[2]` → `"Když je pozornost nízko, nechte hlavní větu, team-lead analogii a jeden konkrétní build expectation."`

Note also: `talk.cs.facilitatorPrompts[2]` says `"Když agent dělá víc, vy musíte lépe ověřovat."` — already `vy`, clean. ✅

---

## Summary

- **Total scenes reviewed:** 9 scenes + 1 phase-level facilitatorRunner block (talk).
- **Scenes with findings:** 9 of 9. (Every scene has at least one finding — typically a mix of `ty` leaks, vocabulary drift, and one or two structural issues. None are entirely clean.)
- **Clean scenes (ready to flip `cs_reviewed: true` after `ty`→`vy` sweep only, no other rewrites required):** none. Every scene has at least one substantive non-`ty` finding worth a human decision.
- **Scenes needing human decision (vocabulary or structural choices, not just mechanical sweeps):**
  - `talk-argued-about-prompts` — `shipují způsoby` rewrite, Hashimoto cross-scene unification, Guo `chatování → managing` consistency call.
  - `talk-got-a-name` — `prohlubuje` → `roste` decision, `místo v drift` → restructure decision.
  - `talk-how-to-build` — restore protected phrase `Co není v repu, neexistuje` (mandatory, not optional), `pillar-managing` Guo quote consistency.
  - `talk-humans-steer` — `tyhle čtyři slova` gender error (mandatory fix), `na příště` → §5 canonical framing.
  - `talk-sitting-inside` — `participant board` decision (Mode A normalization or carve-out exception).
  - `demo-hold-together` — `okamžiky` → `pohyby/kroky` decision, `havarijní brzda` vs `panická brzda` consistency.
  - `demo-your-toolkit` — `nářadí` → `toolkit/nástroje` decision, **`toolkit-record` content drift / duplication with `demo-hashimoto-operationalized`** (highest-impact in this scene).
  - `demo-first-ten-minutes` — `ladění` → `shoda` (translation error, mandatory fix), `Den potom je pointa` → §5 framing.
  - `opening-day-schedule` — English eyebrow, `Ukážu ti to` (both mandatory).
- **Phase-level work:** `talk.cs.facilitatorRunner` needs a full `ty`→`vy` sweep (9 lines).

### Top 3 highest-impact issues

1. **`talk-how-to-build` Finding 4.1 — Protected phrase paraphrase.** `"Pokud to není v souboru, neexistuje to."` violates canonical-vocab §2 row 5. The protected form is `"Co není v repu, neexistuje."` — verbatim required, repeated across talk + challenge cards + coaching codex. **This is the single most consequential finding in the batch.**

2. **`demo-your-toolkit` Finding 8.4 — Content drift and duplication between `toolkit-record` and `demo-hashimoto-operationalized`.** The CS has merged content from two separate EN blocks, leaving the same "for the next person / for the next you" closing repeated twice in the same scene. Visible to participants. The fix is to restore the EN block scope.

3. **`talk-humans-steer` Finding 5.2 — Gender error `tyhle čtyři slova`.** `slovo` is neuter; `tyhle` is feminine. Native-speaker red flag in the scene that carries the workshop's most protected line. Plus Finding 5.3 (`na příště` → `Druhý den, až si otevřete coding agenta`) lines up the same scene's body with its own callout's canonical §5 phrasing — a one-shot upgrade.

**Honourable mention #4:** `demo-first-ten-minutes` Finding 9.4 — `ladění` for "align" is a translation error. Easily missed because the sentence reads grammatically Czech, but the meaning is wrong (`tuning/debugging` instead of `aligning`). Mandatory fix.
