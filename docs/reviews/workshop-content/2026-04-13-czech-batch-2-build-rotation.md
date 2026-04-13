---
title: "Czech review — batch 2 (build-1 + intermezzo-1 + lunch-reset + rotation)"
type: review
date: 2026-04-13
scope: "D3 of refactor-language-flip plan"
status: pending-signoff
---

# Batch 2 — build-1 + intermezzo-1 + lunch-reset + rotation

This memo covers scenes in the `build-1`, `intermezzo-1`, `lunch-reset`, and `rotation` phases that neither the 2026-04-13 Mode A scene-card review nor the batch-1 (D1) memo handled. Findings are advisory — the human reviewer applies fixes scene-by-scene and flips `cs_reviewed: true` per scene.

## Scenes covered in this memo

1. `build-1 / build-1-clock-started`
2. `build-1 / build-1-next-65-minutes`
3. `build-1 / build-1-return-to-proof`
4. `intermezzo-1 / intermezzo-1-check-in`
5. `intermezzo-1 / intermezzo-1-thread`

Plus phase-level `cs.facilitatorRunner` blocks for `build-1`, `intermezzo-1`, `lunch-reset`, and `rotation` (audited at the end — none of the Mode A / D1 passes swept phase-level runners).

## Scenes skipped (already covered by Mode A or D1)

- `intermezzo-1 / intermezzo-1-write` — Mode A (bulk ty→vy list)
- `lunch-reset / lunch-back-at` — Mode A (scene card 6)
- `rotation / rotation-not-yours-anymore` — Mode A (scene card 7)
- `rotation / rotation-line-up` — Mode A (bulk list)
- `rotation / rotation-read-the-room` — Mode A (bulk list)

The rotation phase has three scenes; all three are Mode A's. This batch therefore touches rotation only at the phase-level `facilitatorRunner` and at one facilitator-note drift the bulk list did not enumerate.

---

## Systemic findings

### 1. `ty`-form leakage in facilitator notes (continues from D1)

Same pattern D1 flagged. The agenda's scene-level `cs.facilitatorNotes` and phase-level `cs.facilitatorRunner` blocks are still not swept. Style guide §149–151 mandates lowercase `vy` for **all** surfaces, including facilitator-facing ones.

Offenders in this batch:

- **`build-1-clock-started.cs.facilitatorNotes`**: `Řekni „jedeme" nahlas … a pak přepni na 4.2.` → `Řekněte … přepněte`.
- **`build-1-return-to-proof.cs.facilitatorNotes`**: `Přepni na tuhle scénu, když se tým zasekne, nebo ji promítni celé místnosti` → `Přepněte … promítněte`.
- **`intermezzo-1` phase-level `facilitatorRunner.do`**: `Začni tichou retrieval scénou` → `Začněte`.
- **`intermezzo-1` phase-level `facilitatorRunner.watch`**: `Když někdo začne mluvit během tiché fáze, přesměruj` → `přesměrujte`.
- **`lunch-reset` phase-level `facilitatorRunner.do`**: `Během oběda tiše zkontroluj repo každého týmu. Když je repo opravdu nepoužitelné …, pomozte týmu napsat minimum. Rámujte to jako běžné koučování`. **Mixed within one sentence** — `zkontroluj` is `ty`, `pomozte` / `rámujte` are `vy`. Same kind of in-block drift D1 caught on `talk` phase (line 1150/1151). Normalise to `zkontrolujte`.
- **`rotation-not-yours-anymore.cs.facilitatorNotes`**: `Odhalovací okamžik. Drž ho klidný a přímý.` → `Držte`. (Mode A's card for this scene focused on title/body/callout — the note slipped through.)
- **`rotation-line-up.cs.facilitatorNotes`**: `Pravidlo ticha vynucuj jemně, ale důsledně.` → `vynucujte`. (Mode A's bulk list covered title + callout but did not mention the facilitatorNotes entry.)

### 2. Participant-facing `ty` leak inside `rotation-line-up` steps (under-covered by Mode A)

Mode A's bulk list normalised the `rotation-line-up` **scene title** from `Postav se / odpočítej se / jdi` → `Postavte se / odpočítejte se / jděte` (done — current CS is `Postavte se do řady, rozpočítejte se, jděte ke kotvě`). But the step block `rotation-move-steps.items` still ships `ty`:

- `move-stand.title`: **`Postav se u své staré kotvy.`** → `Postavte se u své staré kotvy.`
- `move-count.body`: **`Zapamatuj si svoje číslo.`** → `Zapamatujte si svoje číslo.`

Both are participant-facing and both are inside a scene Mode A scoped. Flag for human reviewer: Mode A's bulk list is less exhaustive than the cards suggest — step bodies need a second sweep. Not a re-review of the scene, just a note to fix these two strings when the human applies Mode A's rotation edits.

### 3. `okamžik` for "beat" (continues from D1 finding #6)

D1 flagged `čtyři okamžiky` → recommend `čtyři kroky`. Same pattern recurs in this batch:

- **`build-1-next-65-minutes.cs.body`**: `Nemusíte trefit každý okamžik na přesnou minutu.` EN: `You don't have to hit every beat at the exact minute.`
- **`build-1-clock-started.cs.facilitatorNotes`**: `30vteřinový okamžik.` EN: `30-second beat.`

Same treatment as D1: `každý krok` / `30vteřinový krok` or — better for the schedule-beat case — `každý milník`, `každý bod`. Full scene-level suggestions below.

### 4. `board` vs `plátně` — the D1 pattern, plus the "participant board" carve-out

D1 systemic finding normalised `board` → `plátně`. In this batch:

- `intermezzo-1-thread` uses `na plátně` ✅ (canonical — matches D1's Mode A normalisation).
- `build-1-next-65-minutes.cs.facilitatorNotes` uses `na velkém plátně i na participant boardu`. The first is canonical; the second is the UI surface name `participant board` (not the metaphorical "board" D1 cared about). The EN source also writes `participant boards`. **Keep as-is** — `participant board` is a product-term loanword, parallel to `team card`. Flagging only so a human sweep doesn't mistakenly over-correct.
- `intermezzo-1-check-in` body/steps also reference `participant board` — same carve-out.

### 5. Semantic drift in `build-1-return-to-proof` callout

**High-impact.** EN callout body:

> If you leave the conversation with a **spoken solution** but no repo artifact, the problem will come back an hour later.

Current CS:

> Pokud z konverzace odejdete se **ztraceným řešením** bez repo artefaktu, problém se za hodinu vrátí.

`ztracený` means `lost`. EN means `spoken-aloud-only, never written down`. The Czech reader gets the wrong cause. This is the most consequential single finding in the batch — it's not voice, it's meaning drift.

Suggested fixes in the scene card below.

### 6. Imperative-vs-indicative register drift in `intermezzo-1-check-in`

EN step body is imperative across three bullets:

> Go around the table. Read what you wrote out loud to each other. No debate, just listen.

Current CS flips two of the three to present indicative:

> Jdete kolem stolu. Přečtete si navzájem, co jste napsali. Bez debaty, jen posloucháte.

`Jdete` and `Přečtete si` read as descriptions of what's happening ("you are going / you will read"), not as instructions. `posloucháte` same. Participant-facing step instructions should match EN imperative mood. Fix in scene card below.

### 7. Protected-phrase verbatim check

| Phrase | Required CS form | In batch? | Status |
|---|---|---|---|
| Humans steer. Agents execute. | **Lidé řídí. Agenti vykonávají.** | no | n/a |
| carries the next move | **unese další krok** | no | n/a |
| Agent = Model + Harness | (equation) | no | n/a |
| task drift | (loanword) | no | n/a |
| Co není v repu, neexistuje | verbatim | **near-miss** | See note below. |
| Map before motion | n/a in CS | no | n/a |
| Druhý den, až si otevřete coding agenta | verbatim per §5 | no | n/a |

**Near-miss on `Co není v repu, neexistuje`.** `intermezzo-1-check-in` ships the callout `Když to není zapsané, nestalo se to.` — EN `If it's not recorded, it didn't happen.` This is a **distinct proverb** that deliberately echoes the repo rule without claiming to be it (EN makes the same move: `recorded` ≠ `in the repo`). Both languages mirror the move consistently. **Not a violation** — but flagging for the human reviewer so you can consciously decide whether to collapse the two proverbs into one or keep the deliberate echo. The current move is defensible.

### 8. AI-fingerprint and reject-list scan

I ran every CS body in this batch against `content/czech-reject-list.md`. No hits for `v rámci`, `realizovat`, `disponovat`, `dochází k`, `s cílem`, `za účelem`, `přičemž` clusters, `nicméně` overuse, nominal chains of three-plus `-ní`/`-ost`/`-ace` nouns, or participle clusters.

One borderline case:

- **`build-1-next-65-minutes.cs.blocks.build-1-holistic-callout.body`**: `S agenty musí ověření dokázat, že drží celek, ne že jedna funkce vrátila 4. … Čím víc dělá agent, tím holističtější musí být vaše kontroly.` Uses `holističtější` (comparative of `holistický`) — borderline jargon but it matches canonical-vocab §3 (`holistic beats granular` / `Celek nad detailem`). The callout title `Holistické vítězí nad granulárním.` also translates §3's canonical name. **Defensible loanword** per canonical-vocab §3 — it's the named concept. Not a hit, flagging only.

No other reject-list hits. The prose is in voice.

### 9. Phase-level `cs.facilitatorRunner` sweep summary

Short table for the reviewer. `vy` = clean, `ty` = needs fix, `mixed` = both forms in one block.

| Phase | `say` | `do` | `watch` | Notes |
|---|---|---|---|---|
| `build-1` | clean (no `vy`/`ty` imperatives; `Agent, který začne bez mantinelů…`) | empty | empty | ✅ ok |
| `intermezzo-1` | empty | `Začni` (ty) | `přesměruj` (ty) | needs fix |
| `lunch-reset` | empty | **mixed** — `zkontroluj` (ty) + `pomozte`/`rámujte` (vy) | clean | needs fix |
| `rotation` | clean (`Nová session agenta…`) | empty | empty | ✅ ok |

---

## Scene-by-scene findings

### 1. `build-1 / build-1-clock-started`

**EN canonical:**
- Title: `Clock started. You're on.`
- Body: `Team first. Map first. Tracer first. Facilitators are walking — ask for questions, not answers. If you get stuck, the recovery pattern is one flip away. At 11:35, we pause together.`
- `facilitatorNotes`: `30-second beat. Say "go" out loud while this is on screen, then flip to 4.2.`
- Block `build-1-clock-hero`: eyebrow `Build Phase 1 is live`, body `Team first. Map first. Tracer first. Facilitators are walking — ask for questions, not answers. At 11:35, we pause together.`

**CS current:**
- Title: `Čas běží. Jste na řadě.` ✅
- Body: `Nejdřív tým. Pak mapa. Pak tracer. Facilitátoři chodí po místnosti – ptejte se na otázky, ne na odpovědi. Když se zaseknete, recovery pattern je na jedno kliknutí. V 11:35 se zastavíme společně.` ✅
- `facilitatorNotes`: `30vteřinový okamžik. Řekni „jedeme" nahlas, když je tohle na plátně, a pak přepni na 4.2.`
- Block `build-1-clock-hero` body: `Nejdřív tým. Pak mapa. Pak tracer. Facilitátoři chodí – ptejte se na otázky, ne na odpovědi. V 11:35 pauza.` ✅

#### Finding 1.1 — `ty` imperatives in facilitatorNotes

**EN:** `30-second beat. Say "go" out loud while this is on screen, then flip to 4.2.`
**CS:** `30vteřinový okamžik. Řekni „jedeme" nahlas, když je tohle na plátně, a pak přepni na 4.2.`
**Finding:** `Řekni` and `přepni` are `ty` imperatives. Style guide §149 mandates `vy`.
**Alt 1:** `30vteřinový beat. Řekněte „jedeme" nahlas, když je tohle na plátně, a pak přepněte na 4.2.`
**Alt 2:** `30vteřinový krok. Řekněte „jedeme" nahlas, zatímco je tohle na plátně; pak přepněte na 4.2.`
**Alt 3:** `30 vteřin. Nahlas řekněte „jedeme" a přepněte na 4.2.`
**Reasoning:** Alt 1 preserves the English rhythm and keeps `beat` as a loanword (which solves the `okamžik` problem D1 flagged for rhythmic contexts). Alt 2 uses `krok` — D1's preferred replacement. Alt 3 is the most compact.

#### Finding 1.2 — `okamžik` carries the wrong sense

Already covered under systemic finding #3. If you don't take Alt 1's `beat` loanword, use `krok`.

---

### 2. `build-1 / build-1-next-65-minutes`

**EN canonical (high-impact excerpts):**
- Body: `Here's the arc your team is building toward. You don't have to hit every beat at the exact minute. But by lunch, your repo should hold the full shape of the work — not your conversations, not your heads, the repo.`
- `facilitatorNotes`: `Default ambient scene for Build 1 — stays on the big screen and participant boards unless facilitator flips to 4.3.`
- Step `b1-setup.title`: `10:30–10:40 · Set up.`
- Step `b1-plan.body`: `AGENTS.md as a map — goal, context, done-when, pointers. Not a warehouse. A short plan for the first slice. Before you write the code, sketch your first tracer — the thin end-to-end path that will prove the system holds together.`
- Callout `build-1-holistic-callout.title`: `Holistic beats granular.`

**CS current:**
- Body: `Tady je oblouk, na který tým směřuje. Nemusíte trefit každý okamžik na přesnou minutu. Ale do oběda by repo mělo držet celý tvar práce – ne vaše rozhovory, ne vaše hlavy, repo.`
- `facilitatorNotes`: `Výchozí ambient scéna pro Build 1 – zůstává na velkém plátně i na participant boardu, dokud facilitátor nepřepne na 4.3.` ✅
- Step `b1-setup.title`: `10:30–10:40 · Setup.` (loanword — fine)
- Callout title: `Holistické vítězí nad granulárním.`

#### Finding 2.1 — `každý okamžik` for "every beat"

**EN:** `You don't have to hit every beat at the exact minute.`
**CS:** `Nemusíte trefit každý okamžik na přesnou minutu.`
**Finding:** Same `okamžik` ≠ `beat` drift. `Okamžik` is an instant of time; `beat` is a rhythmic marker. The current reading says "you don't have to hit every instant" — which also reads as "you don't have to hit every minute", collapsing the sentence's internal contrast with `na přesnou minutu`.
**Alt 1:** `Nemusíte trefit každý milník na přesnou minutu.` (milestone — the scene itself calls them `milestones` in block id `build-1-milestones`)
**Alt 2:** `Nemusíte trefit každý krok na přesnou minutu.` (parallel with D1's rotation fix)
**Alt 3:** `Nemusíte trefit každý beat na přesnou minutu.` (loanword — keeps the rhythmic image)
**Reasoning:** Alt 1 is cleanest — the scene structure literally labels these `milestones`, and `každý milník` reads right. Alt 3 only works if you've already committed to `beat` as a workshop loanword.

#### Finding 2.2 — `Holistické vítězí nad granulárním` — canonical check

**EN:** `Holistic beats granular.` — canonical §3 name.
**CS:** `Holistické vítězí nad granulárním.`
**Canonical CS per §3:** `Celek nad detailem` (with gloss `"Ověřuj celek, ne detail"`).
**Finding:** The callout currently ships as a literal loanword calque. Canonical-vocab §8 explicitly lists `holisticky nad granularitou` as a rejection example (literal loanword soup). This is close enough to the rejected form to flag.
**Alt 1:** `Celek nad detailem.` — canonical CS per §3.
**Alt 2:** `Ověřuj celek, ne detail.` — canonical gloss (but `ověřuj` is `ty` — would need `Ověřte celek, ne detail.`).
**Alt 3:** Keep `Holistic beats granular.` as an English-loanword callout title if you decide this callout should be untranslated — but that's a canonical-vocab decision, not a rewrite decision.
**Reasoning:** Per canonical-vocab §3, the concept has a named CS form. Use it. The callout body (`S agenty musí ověření dokázat, že drží celek…`) already says `drží celek` — which is the §3 phrasing. The title should match the body.

---

### 3. `build-1 / build-1-return-to-proof`

**EN canonical:**
- Title: `Return to the proof`
- Body: `More prompting won't unstick you. Step back. The answer is already in one of three places.`
- `facilitatorNotes`: `Flip to this scene when a team is stuck, or project room-wide at a checkpoint moment. Coach first, mentor second, teach only as a last resort.`
- Callout `build-1-answer-not-help-callout.title`: `If a facilitator hands you an answer, it didn't help.`
- Callout body: `Ask for a question, not an answer. If you leave the conversation with a spoken solution but no repo artifact, the problem will come back an hour later. Return the fix to the repo.`

**CS current:**
- Title: `Zpátky k důkazu` ✅
- Body: `Víc promptování vás neodlepí. Couvněte. Odpověď už leží v jednom ze tří míst.` ✅ (nice, in voice)
- `facilitatorNotes`: `Přepni na tuhle scénu, když se tým zasekne, nebo ji promítni celé místnosti v checkpoint okamžiku.`
- Callout title: `Když vám facilitátor dá odpověď, nepomohl.`
- Callout body: `Ptejte se na otázku, ne na odpověď. Pokud z konverzace odejdete se ztraceným řešením bez repo artefaktu, problém se za hodinu vrátí. Vraťte opravu do repa.`

#### Finding 3.1 — `Přepni` / `promítni` = `ty`

**EN:** `Flip to this scene when a team is stuck, or project room-wide at a checkpoint moment.`
**CS:** `Přepni na tuhle scénu, když se tým zasekne, nebo ji promítni celé místnosti v checkpoint okamžiku.`
**Finding:** Two `ty` imperatives.
**Alt 1:** `Přepněte na tuhle scénu, když se tým zasekne, nebo ji promítněte celé místnosti v checkpointovém momentu.`
**Alt 2:** `Přepněte na tuhle scénu, když se tým zasekne. Nebo ji promítněte celé místnosti v checkpointovém momentu.`
**Alt 3:** `Flipněte na tuhle scénu, když se tým zasekne. V checkpoint momentu ji promítněte celé místnosti.`
**Reasoning:** Alt 1 is the minimal fix. Alt 2 splits the run-on into two sentences (better rhythm). Alt 3 embraces workshop-loanword register (`flipnout` is how facilitators actually talk) but stretches the style guide.

Also: `v checkpoint okamžiku` is another `okamžik` hit, though less egregious here — `checkpoint moment` is a workshop term of art. I'd take `v checkpoint momentu` or `v checkpointovém momentu`.

#### Finding 3.2 — **`ztracené řešení` for `spoken solution`** — meaning drift

**EN:** `If you leave the conversation with a spoken solution but no repo artifact, the problem will come back an hour later.`
**CS:** `Pokud z konverzace odejdete se ztraceným řešením bez repo artefaktu, problém se za hodinu vrátí.`
**Finding:** `ztracený` = `lost`. EN means "spoken but never written down". The Czech reader gets the opposite cause — they read "you left with a *lost* solution" and hear a conversation that somehow misplaced the answer. The reason the problem comes back is not that the solution was lost; it's that it only ever existed in speech, never in the repo. **This is a meaning drift, not a voice drift.** Highest-impact finding in the batch.
**Alt 1:** `Pokud z konverzace odejdete s mluveným řešením bez repo artefaktu, problém se za hodinu vrátí.`
**Alt 2:** `Pokud z konverzace odejdete s řešením, které zaznělo jen ústně, bez repo artefaktu, problém se za hodinu vrátí.`
**Alt 3:** `Pokud z konverzace odejdete s řešením, které existuje jen v hlavách, problém se za hodinu vrátí.`
**Reasoning:** Alt 1 is the closest to EN. Alt 2 is more explicit about the mode of existence (`zaznělo jen ústně`) and reads slightly more Czech. Alt 3 echoes the repo rule (`jen v hlavách`) which is consistent with the scene's whole argument and the broader `ne vaše rozhovory, ne vaše hlavy, repo` motif that `build-1-next-65-minutes.cs.body` already uses. **Lean Alt 3** — it integrates with the phase's running theme.

#### Finding 3.3 — Callout title subject ambiguity (minor)

**EN:** `If a facilitator hands you an answer, it didn't help.`
**CS:** `Když vám facilitátor dá odpověď, nepomohl.`
**Finding:** EN's `it` is the whole interaction. CS's `nepomohl` has masculine agreement and reads as "*he* didn't help" (the facilitator didn't help). Close in meaning but not identical — and the EN is deliberately depersonalising ("the move didn't help"), not blaming the facilitator.
**Alt 1:** `Když vám facilitátor dá odpověď, nepomohl vám tím.` — adds the instrumental that preserves EN's "the action, not the person" reading.
**Alt 2:** `Když vám facilitátor dá odpověď, nebyla to pomoc.` — completely depersonalises.
**Alt 3:** Leave as-is — it reads fine in Czech and the distinction is subtle.
**Reasoning:** Minor. Only worth fixing if you take other changes in this scene.

---

### 4. `intermezzo-1 / intermezzo-1-check-in`

**EN canonical:**
- Title: `Your team's check-in`
- Body: `Five minutes at your table. Compare what you wrote. Then one person writes the team's check-in into the team card on your participant board. Short, honest — two or three sentences is fine. It becomes part of your team's record.`
- Step `checkin-share.body`: `Go around the table. Read what you wrote out loud to each other. No debate, just listen.`
- Callout title: `If it's not recorded, it didn't happen.`

**CS current:**
- Title: `Check-in vašeho týmu` ✅
- Body: `Pět minut u stolu. Porovnejte, co jste napsali. Potom jeden z vás napíše check-in týmu do karty týmu na participant boardu. Krátce, upřímně – dvě nebo tři věty stačí. Stává se součástí záznamu týmu.` ✅
- Step `checkin-share.body`: `Jdete kolem stolu. Přečtete si navzájem, co jste napsali. Bez debaty, jen posloucháte.`
- Callout title: `Když to není zapsané, nestalo se to.`

#### Finding 4.1 — Present indicative where EN is imperative

**EN:** `Go around the table. Read what you wrote out loud to each other. No debate, just listen.`
**CS:** `Jdete kolem stolu. Přečtete si navzájem, co jste napsali. Bez debaty, jen posloucháte.`
**Finding:** `Jdete` / `Přečtete si` / `posloucháte` are indicative present — they describe, they don't instruct. Every other step in this scene uses imperative (`Porovnejte`, `Shodněte se`, `Napište`). Only this step slipped.
**Alt 1:** `Jděte kolem stolu. Přečtěte si navzájem, co jste napsali. Bez debaty, jen poslouchejte.`
**Alt 2:** `Oběhněte stůl. Přečtěte si navzájem, co jste napsali. Nic nekomentujte, jen poslouchejte.`
**Alt 3:** `U stolu postupně. Každý nahlas přečte, co napsal. Bez debaty — posloucháte.` — keeps the final `posloucháte` in indicative because `posloucháte` here is an observation of what's happening, not an instruction.
**Reasoning:** Alt 1 is the minimal fix — straight imperative conversion. Alt 2 replaces the awkward `Jděte kolem stolu` (which doesn't quite mean "go around the table" in Czech — it reads as "walk around the table") with `Oběhněte stůl` (still not perfect) or the more neutral rephrasing in Alt 3. **Lean Alt 1.**

#### Finding 4.2 — Callout as deliberate echo of `Co není v repu, neexistuje`

Covered under systemic finding #7. **Not a violation.** Flagging for awareness: the move is deliberate in EN and preserved in CS. Keep it.

#### Finding 4.3 — `Jdete kolem stolu` idiom check

Minor. `Jdete kolem stolu` isn't wrong but reads stiffly — Czech would more naturally say `Postupně u stolu` or `Po řadě u stolu`. Already folded into Alt 3 above. Optional polish.

---

### 5. `intermezzo-1 / intermezzo-1-thread`

**EN canonical:**
- Title: `The thread`
- Body: `Your check-ins are on screen. I'm going to read them out loud, one team at a time. Then I'll pull the thread that connects them — one principle point for the morning.`
- `facilitatorNotes`: `The principle point is ad hoc, read from the room. Don't pre-can it. Uses the team-trail chrome preset to render all team check-in trails.`
- Step `thread-carry.title`: `One thing to carry.`
- Step `thread-carry.body`: `What each person takes into the afternoon. Verbal, or written back into the team card — facilitator's call.`
- Callout title: `The principle comes from the screen, not from vibes.`

**CS current:**
- Title: `Nit` ✅
- Body: `Vaše check-iny jsou na plátně. Přečtu je nahlas, tým po týmu. Potom vytáhnu nit, která je spojuje – jeden hlavní princip rána.` ✅ (`na plátně` is canonical per D1)
- `facilitatorNotes`: `Hlavní bod se čte z místnosti, nenacvičuje se dopředu. Používá team-trail chrome preset k vykreslení všech check-in stop.` ✅ (impersonal — safe)
- Step `thread-carry.title`: `Jednu věc si odnést.`
- Step `thread-carry.body`: `Co si každý vezme do odpoledne. Verbálně nebo zpátky do karty týmu – facilitátor rozhodne.`
- Callout title: `Princip jde z plátna, ne z pocitů.` ✅

#### Finding 5.1 — `Jednu věc si odnést.` — infinitive step title

**EN:** `One thing to carry.`
**CS:** `Jednu věc si odnést.`
**Finding:** EN is a noun phrase. CS is an infinitive phrase with an accusative topic before the verb — reads as fragmentary and subtly odd. Other step titles in the scene are `Přečíst check-iny z plátna.` and `Nit.` — also infinitive/fragmentary, so the pattern is consistent within the scene. **Defensible stylistic chunking** (explicitly allowed under "do not flag" in the brief). Not a finding. Flagging only to note I checked.
**Action:** Leave as-is unless a human ear prefers `Jedna věc na cestu.` or `Co si odnesete.` (which would shift to `vy` indicative).

#### Finding 5.2 — `Princip jde z plátna, ne z pocitů.`

**EN:** `The principle comes from the screen, not from vibes.`
**CS:** `Princip jde z plátna, ne z pocitů.`
**Finding:** `pocity` is one valid translation of `vibes` but loses the register — `vibes` is informal, almost slangy. `pocity` is neutral. Other options: `ne z dojmů` (closer to "not from impressions" — the phase-level `watchFors` already uses `dojmů` in `Facilitátor shrne dojmy místo evidence`). **Strong recommendation: use `dojmů` for cross-scene consistency.**
**Alt 1:** `Princip jde z plátna, ne z dojmů.` — matches the phase-level `watchFors`.
**Alt 2:** `Princip jde z plátna, ne z nálad.` — `nálady` is closer to the slangy register of `vibes`.
**Alt 3:** Leave as-is.
**Reasoning:** **Lean Alt 1.** The phase-level prose already established `dojmy` as the anti-pattern. The callout should echo it.

---

## Summary

- **Total scenes reviewed:** 5 (plus 4 phase-level `facilitatorRunner` blocks).
- **Scenes skipped as already covered:** 5 (intermezzo-1-write, lunch-back-at, and all three rotation scenes).
- **Scenes needing human decision:** 5 (all five carry at least one finding).
- **Cross-cutting findings added to the D1 systemic list:** `ty` leakage (build-1 facilitatorNotes, intermezzo-1 + lunch-reset facilitatorRunners, two rotation facilitatorNotes), `okamžik` for `beat` recurring, step-level `ty` leak inside the Mode A-covered `rotation-line-up` scene, imperative→indicative drift in intermezzo-1-check-in.

### Top 3 highest-impact issues

1. **`build-1-return-to-proof` callout: `ztracené řešení` is a meaning drift**, not a voice drift. EN says `spoken solution`; CS says `lost solution`. The Czech reader gets the wrong cause for why the problem returns. Fix per scene 3 Finding 3.2 — recommended Alt 3 (`s řešením, které existuje jen v hlavách`) to integrate with the phase's running `ne vaše rozhovory, ne vaše hlavy, repo` motif.

2. **`build-1-next-65-minutes` callout title: `Holistické vítězí nad granulárním.`** is close to the explicitly rejected form `holisticky nad granularitou` in canonical-vocab §8. Should use the canonical CS form `Celek nad detailem.` per §3. The body of the same callout already speaks in `drží celek` phrasing — the title just needs to match.

3. **`lunch-reset` phase-level `facilitatorRunner.do` is `ty`/`vy` mixed within a single sentence** — `zkontroluj` → `pomozte` → `rámujte`. Same class of in-block inconsistency D1 flagged on the `talk` phase. Normalise to `vy` throughout: `zkontrolujte`. Alongside this, sweep all the other facilitatorNotes / facilitatorRunner `ty` imperatives listed under systemic finding #1 — they're mechanical and can ship as one commit.
