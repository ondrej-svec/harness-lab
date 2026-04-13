---
title: "Czech review — materials (participant-resource-kit + coaching-codex CS)"
type: review
date: 2026-04-13
scope: "D-phase proof slice for refactor-language-flip plan"
status: pending-signoff
---

# Materials review — participant resource kit + coaching codex (CS)

Two files, both participant-facing, both measured against the canonical vocabulary doc (`docs/workshop-content-canonical-vocabulary.md`), `content/style-guide.md` §149–151, and `content/czech-reject-list.md`. `materials/locales/cs/coaching-codex.md` is the **proof slice** the plan's Subjective Contract names: it was newly authored in Phase B6 and is the first file in the D-phase whose review has to justify the whole process. It got the closer read.

## Files covered

1. `materials/participant-resource-kit.md` — CS, partially reviewed today. Participant-facing, strict profile.
2. `materials/locales/cs/coaching-codex.md` — CS, Phase B6. Participant-facing, strict profile. Proof slice.

EN canonicals: `materials/locales/en/participant-resource-kit.md`, `materials/coaching-codex.md`.

Both are participant surfaces — §"Nejasnost a dvojznačnost" and §149 apply at full strength. Canonical-vocab §1 (five habits), §2 (protected phrases), §3 (canonical names), §5 (day-neutral closing) all apply unconditionally.

---

## Systemic findings

### S1. `participant-resource-kit.md` — one `ty` leak in the closing punchline (§149)

Line 98:

> Když se někdo zeptá „proč to děláme?", odpověď je: „Aby se další člověk nemusel ptát **tebe**."

`tebe` is second-person singular. Every other imperative and addressing form in the file is `vy` (`připravte`, `přesuňte`, `přečtěte si`, `chystáte`, `budete`, …). This is a singleton violation and the only §149 hit in either file — but it's the punchline sentence, so it matters more than its word count suggests.

Fix: `Aby se další člověk nemusel ptát vás.`

### S2. `coaching-codex.md` — protected phrases and §3 canonical vocab all land verbatim

Good news on the proof slice: every protected phrase from canonical-vocab §2 lands verbatim in `materials/locales/cs/coaching-codex.md`.

- `unese další krok` (line 5) — §2 hero phrase, present in the opening paragraph as required.
- `task drift` (lines 38, 46) — loanword intact.
- `Co není v repu, neexistuje.` (line 79) — habit #4 verbatim.
- `Lidé řídí. Agenti vykonávají.` (line 83) — the four words verbatim, in a block-quote as the landing line.
- `Druhý den, až si otevřete coding agenta, budete pracovat jinak.` (line 85) — §5 day-neutral closing verbatim.
- `Přestanete být ten, koho se agent ptá, a stanete se tím, kdo staví prostředí, do kterého agent vchází.` (line 85) — §5 role-shift line verbatim.

§3 canonical names present: `harness engineering` (line 5), `tracer bullet` (line 31), `sensor` (line 57), `guide` (line 46), `Celek nad detailem` (line 31). `managing, ne chatování` does not appear — and shouldn't, the EN canonical doesn't mention it in this file either.

**No Monday / pondělí anywhere in either file.** §5 clean on both.

### S3. `participant-resource-kit.md` habit taxonomy matches §1 exactly

Lines 72–79 cite all five canonical tags by English name (as §1 requires) with a CS trigger-line each. All five present, no synonyms, no invented sixth habit, order matches the challenge card deck. This section is the single biggest vocabulary surface in the file and it's clean.

One watch: the file still carries a `Minimum viable harness` section header (line 89) — §1 anti-patterns flag `Minimum viable harness` "as a named habit — it's a concept, not a tag." Here it's used as a section heading for a concept, not presented as a habit in the taxonomy list, and the EN canonical uses the same heading. **Leave as-is.** Flagging for signoff awareness, not for fix.

### S4. Both files have the em-dash-plus-comma pattern inside interjected clauses

Two instances, both minor typography:

- `coaching-codex.md` line 33: `— příkaz, který spustím, nebo soubor, na který se podívám, —` — the closing em dash is preceded by a comma. Czech typography wants either comma **or** dash at the boundary, not both. EN canonical has `— a command I can run or a file I can look at —` with no comma before the closing dash.
- `participant-resource-kit.md` line 26: `„rychle jsem to projel očima"` — straight closing quote after a Czech opening `„`. Should be `"`.

Neither is a D-phase blocker; both belong in the F-phase typography pass.

### S5. `coaching-codex.md` has 2–3 Czech calque / word-choice issues — not vocabulary drift

Issues that pass §1–§5 but would fail a close native read. Detailed with rewrites in §Findings below.

- Line 17: `z pocitu zpátky do reality` — `pocit` (feeling) mistranslates `confidence`.
- Line 33: `done kriteria` — grammar mismatch between the English loan `done` and a Czech plural noun.
- Line 40: `Je levné přesměrovat plán. Je drahé přesměrovat 300 řádků kódu.` — `je + adjective + infinitive` is a classic calque of "it's cheap/expensive to".

### S6. `participant-resource-kit.md` has one awkward impersonal ("než se na něj do zítřka zapomene") and one word-order calque

See 1.4 and 1.5 below. Neither is vocabulary drift; both are nominalization-adjacent style drift the reject-list is built to catch.

---

## File 1 — `materials/participant-resource-kit.md`

### 1.1  Line 98 — `ty`-form in the punchline (S1)

Current:
> Když se někdo zeptá „proč to děláme?", odpověď je: „Aby se další člověk nemusel ptát **tebe**."

EN canonical (line 98):
> When someone asks "why are we doing this?", the answer is: "So the next person doesn't have to ask you."

**Alt 1 — minimal fix, swap to vy:**
> Když se někdo zeptá „proč to děláme?", odpověď je: „Aby se další člověk nemusel ptát vás."

**Alt 2 — restructure to avoid the pronoun:**
> Když se někdo zeptá „proč to děláme?", odpověď je: „Aby se další člověk nemusel ptát."

**Alt 3 — reframe around the team:**
> Když se někdo zeptá „proč to děláme?", odpověď je: „Aby se další člověk v týmu nemusel ptát znovu."

**Recommendation: Alt 1.** Preserves the EN punch (the pronoun `vás` carries the point). Alt 2 loses the "you, specifically" pivot. Alt 3 drifts from EN.

### 1.2  Line 57 — calque "model jako výchozí volbu"

Current:
> Nenechávejte model jako výchozí volbu ovládat váš běžný přihlášený browser bez sandboxu a kontroly.

EN canonical (line 57):
> Do not let the model drive your normal signed-in browser by default without sandboxing and control.

`model jako výchozí volbu` calques `the model … by default` with a phantom apposition. A Czech reader parses "the model as the default choice" and stalls.

**Alt 1 — adverb placement:**
> Ve výchozím nastavení nenechávejte model ovládat váš běžný přihlášený browser bez sandboxu a kontroly.

**Alt 2 — restructure around the verb:**
> Nedovolte, aby model ve výchozím stavu ovládal váš běžný přihlášený browser bez sandboxu a kontroly.

**Alt 3 — split into two clauses:**
> Model nemá ve výchozím stavu ovládat váš běžný přihlášený browser. Potřebuje sandbox a kontrolu.

**Recommendation: Alt 1.** Minimal change, fronts the adverb where Czech wants it, preserves the full EN warning in one sentence.

### 1.3  Line 78 — impersonal reflexive stumbles on a time marker

Current:
> zapíšete rozhodnutí do repa, než se na něj **do zítřka zapomene**.

EN canonical (line 78):
> write the decision into the repo before it evaporates by tomorrow.

`než se na něj do zítřka zapomene` forces the Czech reflexive `se zapomene` to take both an indirect object (`na něj`) and a time adverbial (`do zítřka`). The result reads as translationese.

**Alt 1 — drop the time adverbial:**
> zapíšete rozhodnutí do repa, než se na něj zapomene.

**Alt 2 — active verb with generic subject:**
> zapíšete rozhodnutí do repa, než ho do zítřka vygumujete.

**Alt 3 — keep the time anchor, move the verb:**
> zapíšete rozhodnutí do repa — do zítřka by se jinak rozplynulo.

**Recommendation: Alt 3.** Closest to EN "evaporates by tomorrow", keeps the time anchor, avoids the stacked reflexive.

### 1.4  Line 100 — "Měsíční rytmus … každý měsíc" redundancy

Current:
> Měsíční rytmus: každý měsíc si přečtěte svůj `AGENTS.md` skeptickým okem.

EN canonical (line 100):
> Monthly rhythm: once a month, read your `AGENTS.md` with a skeptical eye.

`Měsíční rytmus` + `každý měsíc` repeats the cadence inside ten words.

**Alt 1 — trim the repetition:**
> Měsíční rytmus: přečtěte si `AGENTS.md` skeptickým okem.

**Alt 2 — drop the label, keep the adverb:**
> Jednou za měsíc si přečtěte svůj `AGENTS.md` skeptickým okem.

**Alt 3 — reverse the structure:**
> Každý měsíc si svůj `AGENTS.md` přečtěte znovu — skeptickým okem.

**Recommendation: Alt 2.** EN canonical doesn't name the cadence as a concept; it just uses the adverbial. CS should do the same.

### 1.5  Line 110 — parallel structure drift in the bullet

Current:
> **Vlastní `AGENTS.md` jako živý dokument** — každé čtvrtletí si je znovu přečtěte skeptickým okem.

EN canonical (line 110):
> **Your own `AGENTS.md` as a living document** — re-read them every quarter with a skeptical eye.

`si je znovu přečtěte` — `je` is plural, referring to "your AGENTS.md files" (plural implied in EN `them`). In CS the noun is singular (`AGENTS.md`). Pronominal agreement is broken. Also `znovu přečtěte` vs `re-read` — the prefix-free rephrasing works, but "si je" is the snag.

**Alt 1 — drop the plural pronoun:**
> **Vlastní `AGENTS.md` jako živý dokument** — každé čtvrtletí si ho znovu přečtěte skeptickým okem.

**Alt 2 — reflexive without object pronoun:**
> **Vlastní `AGENTS.md` jako živý dokument** — každé čtvrtletí ho znovu čtěte skeptickým okem.

**Alt 3 — restructure to the subject-first pattern:**
> **Vlastní `AGENTS.md` jako živý dokument** — každé čtvrtletí projděte skeptickým okem, co je ještě nosné.

**Recommendation: Alt 1.** Smallest change that fixes the agreement. Alt 3 is richer but invents content.

---

## File 2 — `materials/locales/cs/coaching-codex.md` (proof slice)

### 2.1  Line 17 — "z pocitu zpátky do reality" mistranslates `confidence`

Current:
> **Jaký je nejmenší check, který tuhle práci vrátí z pocitu zpátky do reality?**

EN canonical (line 17):
> **What is the smallest check that returns this work from confidence back to reality?**

`pocit` = feeling. `confidence` here means unearned conviction — the state of believing the work is done without proof. `z pocitu` loses the specific thing the check is pulling you out of.

**Alt 1 — closest semantic match:**
> Jaký je nejmenší check, který tuhle práci vrátí z domněnky zpátky do reality?

**Alt 2 — keep the EN axis ("jistota"):**
> Jaký je nejmenší check, který tuhle práci vrátí z jistoty zpátky do reality?

**Alt 3 — restructure around the pair:**
> Jaký je nejmenší check, který z jistoty o téhle práci udělá zase fakt?

**Recommendation: Alt 2.** `jistota` carries the right axis — the whole point of the meta-skill is that you thought you were sure. The check tests the sureness.

### 2.2  Line 33 — `done kriteria` grammar mismatch

Current:
> **„Jaká je done kriteria — příkaz, který spustím, nebo soubor, na který se podívám, — který nám řekne, že je hotovo?"**

EN canonical (line 33):
> **"What's the done criteria — a command I can run or a file I can look at — that tells us this is finished?"**

Two problems stacked:

1. `done kriteria` — EN `done criteria` is a noun phrase where `done` is an adjective. In CS the word `kriteria` (plural) forces grammatical agreement — `Jaká jsou`, not `Jaká je`. But `done kriteria` itself reads as half-translated.
2. The surrounding dashes: `— příkaz, který spustím, nebo soubor, na který se podívám, —` — closing em dash has a comma before it; Czech typography wants the comma dropped when an em dash closes.

**Alt 1 — translate the loanword, fix the agreement:**
> „Jaká je definice hotovo — příkaz, který spustím, nebo soubor, na který se podívám — a která nám řekne, že je skutečně hotovo?"

**Alt 2 — keep the English term, fix the agreement and the dash:**
> „Jaká jsou done criteria — příkaz, který spustím, nebo soubor, na který se podívám — a která nám řeknou, že je hotovo?"

**Alt 3 — restructure around "hotovo":**
> „Co přesně znamená, že je to hotovo — jaký příkaz spustím nebo na jaký soubor se podívám?"

**Recommendation: Alt 1.** `definice hotovo` is the idiomatic CS rendering used elsewhere in the repo for `done criteria / definition of done` and it's a feminine singular, so the `Jaká je` landing from the current draft survives. Alt 2 keeps the loanword but leaves CS readers parsing English grammar mid-sentence.

### 2.3  Line 40 — calque "Je levné/drahé přesměrovat"

Current:
> Je levné přesměrovat plán. Je drahé přesměrovat 300 řádků kódu.

EN canonical (line 40):
> Cheap to redirect a plan. Expensive to redirect 300 lines of code.

`Je + adjective + infinitive` is a direct loan of the English `It's cheap/expensive to …` pattern. `czech-reject-list.md` §"AI fingerprints" flags this family (`Pro + abstract noun`, `je důležité + infinitive`). Live CS prose prefers an active verb with a subject.

**Alt 1 — subject-fronted:**
> Plán přesměrujete levně. 300 řádků kódu draze.

**Alt 2 — restructure around cost:**
> Přesměrovat plán stojí minutu. Přesměrovat 300 řádků kódu stojí odpoledne.

**Alt 3 — keep the rhetorical pair, drop the calque frame:**
> Plán se přesměruje levně. 300 řádků kódu už ne.

**Recommendation: Alt 2.** Preserves the rhetorical beat (cheap vs expensive), grounds both halves in a concrete unit, and fixes the calque. Alt 1 is tighter but loses the time metaphor the EN canonical is going for.

### 2.4  Line 46 — "řešení není lepší prompt; řešení je chybějící guide" — the semicolon is fine but the parallel repeats `řešení` twice unnecessarily

Not a blocker; flagging because the EN canonical (line 46) uses `The fix is never a better prompt; the fix is a missing guide.` with the same doubling. If a future pass wants to tighten this, `Řešení není lepší prompt. Je to chybějící guide.` reads more naturally in CS. **Leave as-is for D-phase;** the parallel structure is rhetorical and matches EN.

### 2.5  Line 62 — `nenechali jste za sebou harness; nechali jste suť` — crisp, but check

EN canonical (line 62):
> you haven't left a harness; you've left debris.

CS `suť` (rubble, debris) lands the metaphor well and is native. **No change.** Flagging only because `suť` is slightly unexpected — a native reviewer might push for `trosky` — but `suť` is correct and more physical, which fits the metaphor. Recommendation: **keep**.

### 2.6  Line 77 — `Chovejte se podle toho` — EN `Act accordingly` lands in CS with a slight register drop

Current:
> Jediná paměť, kterou sdílíte, je repo. Chovejte se podle toho.

EN canonical (line 77):
> The only memory you share is the repo. Act accordingly.

`Chovejte se podle toho` reads a touch parental in CS. EN `Act accordingly` is neutral-instructional.

**Alt 1 — more active:**
> Jediná paměť, kterou sdílíte, je repo. Podle toho i jednejte.

**Alt 2 — sharper close:**
> Jediná paměť, kterou sdílíte, je repo. Podle toho.

**Alt 3 — keep as-is.**

**Recommendation: Alt 2.** Short, punchy, matches the density of the surrounding one-rule block. Alt 1 is fine but longer.

### 2.7  Line 5 — opening paragraph carries the protected phrase and the `harness engineering` frame correctly

Quoting for signoff evidence:

> Workshop učí harness engineering: repo, workflow a kontext, který **unese další krok** bez toho, abyste u toho museli stát.

All three of the canonical anchors (`harness engineering`, `unese další krok`, `vy`-form `abyste`) are in a single opening sentence. This is the sentence that makes the proof slice a proof slice: the newly-written Phase B6 file put the right vocabulary in the right place on first pass. **No change.**

---

## Summary — top 3 highest-impact

1. **`participant-resource-kit.md` line 98 — fix `tebe` → `vás` (Alt 1).** The only §149 violation in either file and it sits inside the closing punchline quote. Cheap fix, load-bearing for the `vy`-form sweep.
2. **`coaching-codex.md` line 33 — fix `done kriteria` → `definice hotovo` (Alt 1) and drop the comma before the closing em dash.** Grammar + typography problem inside the most-referenced protocol on the card. Highest visibility issue in the proof slice.
3. **`coaching-codex.md` line 17 — fix `z pocitu` → `z jistoty` (Alt 2).** The meta-skill's third question is the intellectual spine of the whole card, and `pocit` flattens `confidence` into something vaguer than the EN means. Fixing it restores the specific failure mode the question is built to catch.

## Proof-slice verdict

`materials/locales/cs/coaching-codex.md` — **the D-phase process works.** Every protected phrase from §2 lands verbatim. All §3 canonical names are in their right slots. §5 closing language is intact and day-neutral. No `ty` leaks. No habit-tag drift. No AI fingerprints beyond the one `je + adjective + infinitive` calque at line 40. The seven findings above are style refinements, not structural failures — which is the signal the plan's Subjective Contract was looking for. The file should ship after the Alt-1 fixes in §§2.1–2.3 and 2.6.

`materials/participant-resource-kit.md` — **one real fix (§1.1) plus four style refinements.** The habit taxonomy section and the §2 protected phrases are clean. Ship after §1.1 + §1.3, with the other three folded into the F-phase polish pass.
