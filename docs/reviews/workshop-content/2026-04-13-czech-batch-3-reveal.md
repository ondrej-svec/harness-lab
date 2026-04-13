---
title: "Czech review — batch 3 (build-2 + intermezzo-2 + build-2-second-push + reveal)"
type: review
date: 2026-04-13
scope: "D5 of refactor-language-flip plan"
status: pending-signoff
---

# Batch 3 — build-2 + intermezzo-2 + build-2-second-push + reveal

This memo covers the four afternoon phases that neither the 2026-04-13 Mode A scene-card review nor the D1 / D3 batch memos handled. Findings are advisory — the human reviewer applies fixes scene-by-scene and flips `cs_reviewed: true` per scene. It follows D1/D3 decisions: `pohyby`/`kroky` not `okamžiky`, `plátně` not `board` (with `participant board` UI carve-out), `Celek nad detailem` not `Holistické vítězí`, `dojmů` not `pocitů`, `managing` loanword not `řízení`, `tracer bullet` / `task drift` / `guides` / `sensors` as loanwords.

## Scenes covered in this memo

1. `build-2 / build-2a-same-clock`
2. `build-2 / build-2a-eighty-five`
3. `build-2 / build-2a-return-to-proof`
4. `intermezzo-2 / intermezzo-2-write`
5. `intermezzo-2 / intermezzo-2-check-in`
6. `intermezzo-2 / intermezzo-2-back-to-work`
7. `build-2-second-push / build-2b-clock-resumes`
8. `build-2-second-push / build-2b-second-push-timeline`
9. `reveal / reveal-1-2-4-all`
10. `reveal / reveal-what-i-saw`

Plus phase-level `cs.facilitatorRunner` blocks for all four phases (audited at the end — D1/D3 already established none of these were swept).

## Scenes skipped (already covered by Mode A)

- `reveal / reveal-show-us` — Mode A scene card 8
- `reveal / reveal-one-thing` — Mode A scene card 9
- `reveal / reveal-go-use-it` — Mode A scene card 10

---

## Systemic findings

These patterns recur across the batch — fixing them once per file is cheaper than fixing them 10 times.

### 1. `ty`-form leakage in facilitator notes and phase runners (continues from D1/D3)

Style guide §149–151 mandates lowercase `vy` for all surfaces — participant view **and** facilitator notes **and** phase-level `facilitatorRunner`. This batch continues the same pattern D1/D3 flagged:

- **`build-2a-eighty-five.cs.facilitatorNotes`**: `Hlídej past self-validation.` → `Hlídejte past self-validation.`
- **`build-2a-eighty-five.cs.blocks.build-2a-timeline.items.b2a-quiet.body`** (participant-facing!): `Přečti repo, napiš diagnózu a nové složení týmu do karty.` Two `ty` imperatives inside an otherwise-`vy` step list. The other five timeline items use `vy` (`Zachyťte tření`, `Iterujte`, `Rozhodněte`, `Commitni` — wait, `Commitni` is also `ty` — see below). **High impact** — visible on participant slide.
- **`build-2a-eighty-five.cs.blocks.build-2a-timeline.items.b2a-pause.body`**: `Couvni s místností, udělej check-in, a pak zpátky do týmu.` Two `ty` imperatives (`Couvni`, `udělej`).
- **`build-2a-eighty-five.cs.blocks.build-2a-timeline.items.b2a-cleanup.body`**: `Commitni. Udělej repo čitelné. Rozhodni, co ukážeš na Závěru.` Three `ty` imperatives + one `ty` indicative (`ukážeš`). Rest of the scene's step bodies mix forms — this item is pure `ty`.
- **`build-2a-return-to-proof`** — body is clean `vy`, step bodies clean `vy`. ✅
- **`intermezzo-2-write.cs.body`**: `nejdřív vyrobíš, pak sdílíš.` Two `ty` present indicatives inside an otherwise-`vy` body (`Napište`, `chcete`). Same kind of in-block drift D1/D3 caught elsewhere.
- **`intermezzo-2-check-in.cs.blocks.intermezzo-2-checkin-steps.items.i2-share.body`**: `Jdete kolem stolu. Přečtete si navzájem, co jste napsali.` — same present-indicative-where-EN-is-imperative drift D3 caught on `intermezzo-1-check-in`. Carbon copy of the earlier bug.
- **`intermezzo-2-back-to-work.cs.facilitatorNotes`**: `Nedovol, aby se z Intermezza 2 stal mini-Závěr. Drž okamžik svižný.` → `Nedovolte … Držte …` (and `okamžik` problem — see finding #4).
- **`build-2b-clock-resumes.cs.facilitatorNotes`**: `Drž tempo, které místnost už zná …` → `Držte tempo`.
- **`reveal-what-i-saw.cs.facilitatorNotes`**: `Připrav se čtením karet týmů během bufferu před Závěrem, ne obecnými závěrečnými poznámkami.` → `Připravte se`.
- **Phase-level `reveal.cs.facilitatorRunner.say`**: `Když v pondělí budete pracovat s jiným toolchainem, principy platí` — **`v pondělí` is a §5 violation** (see finding #5). The `vy` form itself is clean here, but the day-anchoring is banned.
- **Phase-level `build-2.cs.facilitatorRunner` / `intermezzo-2.cs.facilitatorRunner` / `build-2-second-push.cs.facilitatorRunner`** — all clean `vy` (`Nepomáhejte`, `Pojmenujte`, `Začněte`, `přesměrujte`, `Aplikujte`, `Commitněte`, `Rozhodněte`, `Walk the room` is in English etc.). ✅ Good news — the D1/D3 sweep on phase runners has been partly applied for these phases. The only phase runner with a finding is `reveal` — but it's a §5 finding, not a `ty` finding.

### 2. Meaning drift — `past self-validation` is fine, but `frikce`/`tření` is inconsistent

`build-2a-eighty-five.cs.body` uses `frikce` once (`Zachycování frikce je, jak se staví…`) and `tření` twice in nearby blocks (`zachyť to tření`, `zachytávej tření`). EN uses `friction` uniformly. The CS file oscillates between the loanword `frikce` and the calque `tření`. Both are defensible but picking one avoids a hidden register shift inside one scene. D1/D3 didn't rule on this; flagging for awareness. **Lean `tření`** — it's already dominant and doesn't smell like a loanword. If you take `frikce`, the English-facing register is slightly colder.

Also in the same body: `když tě zděděné repo podrazí` is `ty` (`tě`), and the sentence that follows uses `ses` (`aby ses o totéž podrazil dvakrát`). The whole body paragraph is a `ty` island inside a `vy` scene. See scene 2 for full fix.

### 3. Semantic drift — `podrazí dvakrát` for `trip on the same thing twice`

**High-impact.** EN: `Capturing friction is how you build without tripping on the same thing twice.` Current CS: `Zachycování frikce je, jak se staví bez toho, aby ses o totéž podrazil dvakrát.` `Podrazit se` means *to trip yourself up* or *to be betrayed* — Czech doesn't really use `podrazit se o něco`. The reading is muddled. Simpler is better. Fix in scene 2.

### 4. `okamžik` for `beat` / `moment` (continues from D1/D3 finding)

D1 flagged this. D3 flagged this. The pattern recurs in batch 3:

- **`build-2b-clock-resumes.cs.facilitatorNotes`**: `30vteřinový okamžik. Drž tempo…` EN: `30-second beat.` Same bug D3 caught on `build-1-clock-started`. Same fix: `30vteřinový beat.` or `30vteřinový krok.`
- **`intermezzo-2-check-in.cs.blocks.intermezzo-2-checkin-steps.items.i2-write.body`**: `diagnóze z prvního okamžiku Buildu 2.` EN: `Build 2 first-beat diagnosis.` Here `okamžik` reads as "instant" — the EN means "first beat of Build 2". **Lean `z prvního beatu Buildu 2`** or `z diagnózy na začátku Buildu 2`.
- **`intermezzo-2-back-to-work.cs.facilitatorNotes`**: `Drž okamžik svižný.` EN: `Keep it brisk.` The `okamžik` is not a beat here — it's a stand-in for "this intermezzo". The whole clause reads oddly in CS. Suggest: `Držte ho svižný.` or `Držte tempo svižné.`
- **`reveal-what-i-saw.cs.facilitatorNotes`**: `Nejtěžší okamžik celého dne.` EN: `This is the hardest beat in the day.` Here `okamžik` collides with the `beat` sense, but is not wrong in Czech (`nejtěžší okamžik dne` is idiomatic for "hardest moment of the day"). **Defensible.** Flagging only — `beat` is the rhythmic metaphor but `okamžik` reads right in this particular sentence. If the human sweep is unifying around `beat` as a loanword for rhythmic contexts, swap to `Nejtěžší beat dne.` Otherwise leave.

### 5. `v pondělí` — §5 day-neutral framing violation

Canonical-vocab §5 bans `Monday` / `pondělí` in both languages. The phase-level **`reveal.cs.facilitatorRunner.say`** ships:

> Tyhle postupy jsou nezávislé na nástroji. Když v pondělí budete pracovat s jiným toolchainem, principy platí: kontext v trasovaných artefaktech, plán před pohybem, ověření před důvěrou.

EN source for the same runner block is:

> These practices are tool-agnostic. The next time you pick up any toolchain, the principles transfer: context in tracked artifacts, plan before motion, verification before trust.

**EN is day-neutral. CS inserted `v pondělí` that isn't in the source.** Double violation — it's both a day-anchor and a translation drift. **Highest-impact single finding in the batch.** Same phase's runner `do` block also says `Po W3 spusťte pondělní závazky` — EN source is `run the next-day commitments`. Second `pondělí` in the same runner. Canonical CS per §5 is `commitments pro další den u klávesnice` or at minimum `závazky pro další den`.

### 6. `board` vs `plátně` — D1 pattern holds; participant board carve-out applies

Clean in this batch. `intermezzo-2-back-to-work.cs.body` uses `na plátně` ✅. `intermezzo-2-check-in.cs.blocks.intermezzo-2-checkin-steps.items.i2-write.body` uses `Na participant boardu` — carve-out applies (product term), matches EN `participant board`. ✅

### 7. `Závěr` / `Reveal` — scene name translation

The CS translates `Reveal` as `Závěr` throughout (`na Závěru`, `dorazí na Závěr`, `Co ukážete na Závěr`). `Reveal` is the agenda's actual phase id and it's a named ritual moment. `Závěr` means "conclusion / closing" — which is also how the phase-level `en.label` reads (`Reveal and reflection` → `Závěr a reflexe`). The translation is consistent across the batch, and phase-level label is `Závěr a reflexe`. **Defensible and consistent.** Flagging only so the human reviewer is aware the workshop's ritual noun in CS is `Závěr` and not the loanword `Reveal`. Mode A cards for reveal scenes didn't flag this either, so assume it's settled.

### 8. Protected-phrase verbatim check

| Phrase | Required CS form | In batch? | Status |
|---|---|---|---|
| Humans steer. Agents execute. | **Lidé řídí. Agenti vykonávají.** | no | n/a |
| carries the next move | **unese další krok** | no | n/a |
| Agent = Model + Harness | (equation) | no | n/a |
| task drift | (loanword) | no | n/a |
| Co není v repu, neexistuje | verbatim | **echo only** | `build-2a-eighty-five.b2a-base-next`: `Co dál – v repu, ne v hlavách.` — deliberate echo of the repo rule, consistent with EN `in the repo, not in your heads`. Defensible, not a paraphrase. |
| Map before motion | n/a in CS | no | n/a |
| §5 day-neutral closing | — | **VIOLATED** (reveal phase runner — see finding #5) | ❌ |

The **§5 `v pondělí`** violation is the only protected-framing drift in the batch, and it is by far the most consequential single finding.

### 9. AI-fingerprint and reject-list scan

I ran every `cs` body in this batch against `content/czech-reject-list.md`. No hits for `v rámci`, `realizovat`, `disponovat`, `s cílem`, `za účelem`, `dochází k`, `přičemž` clusters, `nicméně` overuse, or three-plus `-ní`/`-ost`/`-ace` nominal chains. The prose is in voice.

Borderline cases flagged but not hits:

- `build-2a-eighty-five.cs.blocks.build-2a-self-validation-callout.body`: `průchod` for `pass` — borderline jargon. The word is Czech but in this register (testing / CI) it reads as a calque. `Je to tichá past. Většina týmů do ní jednou spadne.` is perfect voice. Later: `jeden průchod píše kontrolu, druhý průchod píše kód.` The `průchod` feels mechanical. Alternatives: `jeden běh píše kontrolu` or just `jeden krok píše kontrolu`. Defensible, flagging.
- `reveal-what-i-saw.cs.blocks.reveal-what-i-saw-callout.body`: `Konkrétní signály, konkrétní překvapení, konkrétní vzorce.` — triple fragment is deliberate rhythm, not an AI fingerprint. Good.
- `intermezzo-2-check-in.cs.blocks.intermezzo-2-mid-callout.body`: uses `commit message` as loanword — fine.
- Phase-level `build-2.cs.watchFors`: `Tým jen opravuje chaos, ale neproměňuje ho v lepší návod pro další práci.` — phrase `neproměňuje ho v` is a mild nominal calque of `turn it into`. Defensible, flagging.

No `dojmy` vs `pocity` hits in this batch (D1 normalised that on the reveal facilitator prompts — and `reveal.cs.facilitatorPrompts` here ships `obecné dojmy` ✅, which is the canonical form).

### 10. Phase-level `cs.facilitatorRunner` sweep summary

Short table for the reviewer. `vy` = clean, `ty` = needs fix, `mixed` = both forms in one block, `§5` = day-anchor violation.

| Phase | `say` | `do` | `watch` | Notes |
|---|---|---|---|---|
| `build-2` | clean (`Když agent generuje testy… vy jste napsali…`) | clean (`Začněte codifikační pauzou.`) | empty | ✅ ok |
| `intermezzo-2` | empty | clean (`Začněte tichou retrieval scénou.`) | clean (`přesměrujte`) | ✅ ok |
| `build-2-second-push` | *(CS facilitatorRunner has no `say`/`show`/`do`/`watch`/`fallback` — CS block only inherits `goal` label then nothing. See note below.)* | — | — | See finding #11. |
| `reveal` | `vy` **BUT** `v pondělí` § 5 violation | `pondělní závazky` §5 violation | empty | needs fix |

### 11. `build-2-second-push.cs.facilitatorRunner` — translation gap

**High-impact structural finding.** The EN `build-2-second-push` phase has a full `facilitatorRunner` block with `say` (3 items), `show` (1 item), `do` (1 item), `watch` (2 items), `fallback` (1 item). The CS phase has *only* the `goal` field — none of the `say` / `show` / `do` / `watch` / `fallback` arrays made it into Czech.

Looking at the CS phase block (lines 4518–4561), I actually can't see a closing `cs.facilitatorRunner` at all — the `cs` object closes after `sourceRefs`. **The CS phase is missing the `facilitatorRunner` block entirely.** This is a translation gap, not a drift. D1/D3 didn't catch it because those memos didn't touch this phase.

The human reviewer (or Phase B follow-up) should port the five runner arrays. Suggested CS based on EN:

- `say`: `Čtyřicet minut. Zpátky k práci.` / `Aplikujte, co jste zvedli v intermezzu.` / `V 15:30 commitněte a rozhodněte, co ukážete.`
- `show`: `Ambientní timeline scéna. Recovery pattern na jedno kliknutí.`
- `do`: `Procházejte místnost. Hlídejte týmy, které vynechávají final cleanup.`
- `watch`: `Týmy místo čistého uzavření slice přepíšou příliš mnoho.` / `Self-validation past se vrací ve druhém pushi.`
- `fallback`: `Když tým ztratí nit, přepněte na recovery scénu a koučujte ho zpátky k důkazu.`

All in `vy`. None of this is a review finding per se — it's reporting a gap that needs filling before the Phase F lockfile gate.

---

## Scene-by-scene findings

### 1. `build-2 / build-2a-same-clock`

**EN canonical:**
- Title: `Same clock, new context`
- Body: `You're at a new anchor, with a new team, in a new repo. Ten minutes of reading first — no keyboard. Then capture what tripped you, so the next hour is clean. Then build. Eighty-five minutes of work, split by a twenty-minute pause at 14:30. Facilitators walking, recovery one flip away.`
- `facilitatorNotes`: `30-second kickoff. Mirrors Scene 4.1.`

**CS current:**
- Title: `Stejné hodiny, nový kontext` ✅
- Body: `Jste u nové kotvy, s novým týmem, v novém repu. Deset minut nejdřív čtení – bez klávesnice. Potom zachyťte to, co vás zaskočilo, aby další hodina byla čistá. Potom stavět. Osmdesát pět minut práce, rozdělené dvacetiminutovou pauzou ve 14:30. Facilitátoři chodí, recovery na jedno kliknutí.` ✅ (in voice, clean `vy`, `recovery` loanword fine)
- `facilitatorNotes`: `30vteřinový kickoff. Zrcadlí Scénu 4.1.` ✅

#### No findings.

The scene is clean. Flag only: `Potom stavět` is an infinitive — reads as a voice choice, matches the scene's chunked rhythm. Not a finding.

---

### 2. `build-2 / build-2a-eighty-five`

The largest scene in the batch. Multiple findings.

**EN canonical (high-impact excerpts):**
- Body: `Same goal as this morning — ship a working slice, verified, committed. Same discipline — team first, map first, tracer first. One new move: when the inherited repo trips you, capture the friction into the repo as you go. Eighty-five minutes of building, split by a twenty-minute pause in the middle. Build is the goal. Capturing friction is how you build without tripping on the same thing twice.`
- `facilitatorNotes`: `Default ambient scene for Build 2 first push. Watch for the self-validation trap.`
- Step `b2a-quiet.body`: `Ten minutes, no keyboard. Read the repo, write your diagnosis and new team composition on the team card.`
- Step `b2a-pause.body`: `Twenty minutes. Step back with the room, check in, then back to your team. This is a pause, not an ending.`
- Step `b2a-cleanup.body`: `Ten minutes. Commit. Make your repo readable. Decide what you will show at Reveal.`

**CS current:**
- Body: `Stejný cíl jako ráno – shipnout funkční slice, ověřený, commitnutý. Stejná disciplína – nejdřív tým, pak mapa, pak tracer. Jeden nový pohyb: když tě zděděné repo podrazí, zachyť to tření rovnou do repa. Osmdesát pět minut stavění, rozdělené dvacetiminutovou pauzou uprostřed. Build je cíl. Zachycování frikce je, jak se staví bez toho, aby ses o totéž podrazil dvakrát.`
- `facilitatorNotes`: `Výchozí ambient scéna pro první push Buildu 2. Hlídej past self-validation.`
- Step `b2a-quiet.body`: `Deset minut, bez klávesnice. Přečti repo, napiš diagnózu a nové složení týmu do karty.`
- Step `b2a-pause.body`: `Dvacet minut. Couvni s místností, udělej check-in, a pak zpátky do týmu. Je to pauza, ne konec.`
- Step `b2a-cleanup.body`: `Deset minut. Commitni. Udělej repo čitelné. Rozhodni, co ukážeš na Závěru.`

#### Finding 2.1 — `ty` island in the scene body

**EN:** `when the inherited repo trips you, capture the friction into the repo as you go … capturing friction is how you build without tripping on the same thing twice.`
**CS:** `když tě zděděné repo podrazí, zachyť to tření rovnou do repa … aby ses o totéž podrazil dvakrát.`
**Finding:** `tě`, `zachyť`, `ses`, `podrazil` are all `ty`. Every other body on this scene card uses `vy`.
**Alt 1:** `Jeden nový pohyb: když vás zděděné repo podrazí, zachyťte to tření rovnou do repa, jak jdete. Osmdesát pět minut stavění, rozdělené dvacetiminutovou pauzou uprostřed. Build je cíl. Zachytávat tření je to, co vás udrží, abyste se na stejné věci nezasekli dvakrát.`
**Alt 2:** `Jeden nový pohyb: když vás zděděné repo podrazí, zapisujte tření rovnou do repa. Osmdesát pět minut stavění s dvacetiminutovou pauzou uprostřed. Build je cíl. Zachytávání tření je, jak stavíte, aniž byste o totéž zakopli dvakrát.`
**Alt 3:** `Jeden nový pohyb: když vás zděděné repo podrazí, zachyťte tření přímo v repu. Osmdesát pět minut práce, rozdělených dvacetiminutovou pauzou. Build je cíl. Tření, které zapíšete, už vás podruhé nepodrazí.`
**Reasoning:** Alt 1 is the minimal `ty→vy` sweep plus keeping `tření` (not `frikce`). Alt 2 replaces the awkward `zachyť` with `zapisujte` (more Czech) and fixes the `podrazit se o něco` non-idiom with `zakopli`. Alt 3 collapses the last sentence into a clean parallel — the "captured friction" subject is doing the work, matches the EN cause-and-effect rhythm without forcing Czech into an English participial construction. **Lean Alt 3** — it fixes the meaning drift flagged in systemic finding #3 at the same time.

#### Finding 2.2 — `Hlídej` in facilitator notes

**EN:** `Watch for the self-validation trap.`
**CS:** `Hlídej past self-validation.`
**Finding:** `ty` imperative.
**Alt 1:** `Hlídejte past self-validation.`
**Alt 2:** `Sledujte self-validation past.`
**Alt 3:** `Pozor na past self-validation.` (impersonal)
**Reasoning:** Alt 1 is minimal. Alt 3 dodges the form question entirely.

#### Finding 2.3 — `Přečti` / `napiš` in `b2a-quiet` step body

**EN:** `Ten minutes, no keyboard. Read the repo, write your diagnosis and new team composition on the team card.`
**CS:** `Deset minut, bez klávesnice. Přečti repo, napiš diagnózu a nové složení týmu do karty.`
**Finding:** Two `ty` imperatives in a participant-facing step body. Every other step body in the scene mixes forms — see 2.4 / 2.5. This one is pure `ty`.
**Alt 1:** `Deset minut, bez klávesnice. Přečtěte repo, napište diagnózu a nové složení týmu do karty.`
**Alt 2:** `Deset minut. Klávesnice pryč. Přečtěte repo a napište do karty diagnózu plus nové složení týmu.`
**Alt 3:** `Deset minut, bez klávesnice. Přečtěte si repo. Napište diagnózu a nové složení týmu do karty.`
**Reasoning:** Alt 1 is minimal. Alt 2 restructures slightly for rhythm. Alt 3 splits into two sentences — probably cleanest for slide reading.

#### Finding 2.4 — `Couvni` / `udělej` in `b2a-pause` step body

**EN:** `Twenty minutes. Step back with the room, check in, then back to your team. This is a pause, not an ending.`
**CS:** `Dvacet minut. Couvni s místností, udělej check-in, a pak zpátky do týmu. Je to pauza, ne konec.`
**Finding:** Two `ty` imperatives.
**Alt 1:** `Dvacet minut. Couvněte s místností, udělejte check-in, a pak zpátky do týmu. Je to pauza, ne konec.`
**Alt 2:** `Dvacet minut. Couvněte společně s místností, udělejte check-in, pak zpátky do týmu. Je to pauza, ne konec.`
**Alt 3:** `Dvacet minut. Krok zpátky s celou místností, check-in, pak zpátky do týmu. Je to pauza, ne konec.` — impersonal via noun phrase.
**Reasoning:** Alt 1 is minimal. Alt 3 is most compact and avoids the form question entirely.

#### Finding 2.5 — `Commitni` / `Udělej` / `Rozhodni` / `ukážeš` in `b2a-cleanup` step body

**EN:** `Ten minutes. Commit. Make your repo readable. Decide what you will show at Reveal.`
**CS:** `Deset minut. Commitni. Udělej repo čitelné. Rozhodni, co ukážeš na Závěru.`
**Finding:** Four `ty` verbs (three imperatives + one indicative).
**Alt 1:** `Deset minut. Commitněte. Udělejte repo čitelné. Rozhodněte, co ukážete na Závěru.`
**Alt 2:** `Deset minut. Commit. Udělejte repo čitelné pro cizince. Rozhodněte, co ukážete na Závěru.` (drops the imperative `Commitněte` to a nominal `Commit` — matches the scene's chunked fragments)
**Alt 3:** `Deset minut. Commitněte, udělejte repo čitelné, rozhodněte, co ukážete.` — trimmed parallel.
**Reasoning:** Alt 1 is minimal. Alt 2 is interesting because it matches the `b2b-cleanup` parallel scene (which is already `vy`), and the nominal `Commit` is defensible. Alt 3 is the tightest rhythm.

#### Finding 2.6 — `frikce` vs `tření` inconsistency (systemic finding #2)

Body uses `tření` twice, `frikce` once. Pick one. **Lean `tření`** — see systemic finding #2.

#### Finding 2.7 — `zachytávat tření` / `Zachycování frikce` (flag only)

The gerundal `zachycování` in `Zachycování frikce je, jak se staví…` is a nominalisation — borderline register drift toward nominal style. Alt 3 in 2.1 fixes this by rewriting the whole sentence.

---

### 3. `build-2 / build-2a-return-to-proof`

**EN canonical:** (parallel to `build-1-return-to-proof` with trimmed callout body)
- Title: `Return to the proof`
- Body: `More prompting won't unstick you. Step back. The answer is already in one of three places.`
- Step `b2a-return-state.body`: `Out loud, at the table. If the team can't answer, that is the block.`
- Step `b2a-return-blind.body`: `The place the repo can't answer your question is the place to fix.`
- Step `b2a-return-check.body`: `A test. A tracer bullet. Any executable signal beats more guessing.`
- Callout title: `If a facilitator hands you an answer, it didn't help.`
- Callout body: `Ask for a question, not an answer. Return the fix to the repo.`

**CS current:**
- Title: `Zpátky k důkazu` ✅
- Body: `Víc promptování vás neodlepí. Couvněte. Odpověď už leží v jednom ze tří míst.` ✅ (clean `vy`, in voice)
- Step `b2a-return-state.body`: `U stolu, nahlas. Když tým neumí odpovědět, právě tam je blok.` ✅
- Step `b2a-return-blind.body`: `Místo, kde vám repo neodpoví na otázku, je místo, které opravit.` ⚠️ (reads stiffly — see 3.1)
- Step `b2a-return-check.body`: `Test. Tracer bullet. Jakýkoli spustitelný signál je lepší než další hádání.` ✅
- Callout title: `Když vám facilitátor dá odpověď, nepomohl.` — same subject ambiguity D3 flagged on the Build 1 version.
- Callout body: `Ptejte se na otázku, ne na odpověď. Vraťte opravu do repa.` ✅

#### Finding 3.1 — `je místo, které opravit` — infinitive awkwardness

**EN:** `The place the repo can't answer your question is the place to fix.`
**CS:** `Místo, kde vám repo neodpoví na otázku, je místo, které opravit.`
**Finding:** `místo, které opravit` is a Czech-awkward calque of the English `the place to fix`. Czech doesn't pair a neuter relative pronoun with a bare infinitive that way. The construction works in English (`place + to-infinitive`) but lands wrong in Czech.
**Alt 1:** `Místo, kde vám repo neodpoví na otázku, je místo, které musíte opravit.`
**Alt 2:** `Kde repo nedá odpověď na vaši otázku, tam je co opravit.`
**Alt 3:** `Místo, kde vám repo neodpoví, je to místo, které je potřeba opravit.`
**Reasoning:** Alt 1 is minimal. Alt 2 restructures toward a more idiomatic Czech "wherever X, there is Y" pattern. Alt 3 is the longest but most explicit.

#### Finding 3.2 — Callout subject ambiguity (carry-over from D3 finding 3.3)

Same `nepomohl` vs impersonal issue D3 flagged on the Build 1 version. Apply the same fix in parallel — whatever the human reviewer picks for Build 1, mirror here. **Consistency is the goal** — the two scenes are meant to be identical.

---

### 4. `intermezzo-2 / intermezzo-2-write`

**EN canonical:**
- Title: `Write before you speak`
- Body: `Three minutes. Individual. No talking. Same rule as the first intermezzo — you produce before you share. This is a pause, not an ending. Write something you'd actually want to act on in the next forty minutes.`
- Callout body: `What surprised you about the inherited repo so far — and what do you want to try differently in the second push? Three minutes. Don't talk yet.`

**CS current:**
- Title: `Pište, než promluvíte` ✅
- Body: `Tři minuty. Sami. Nemluvíme. Stejné pravidlo jako u prvního intermezza – nejdřív vyrobíš, pak sdílíš. Tohle je pauza, ne konec. Napište něco, s čím chcete v příštích čtyřiceti minutách něco udělat.`
- Callout body: `Co vás dosud zděděné repo překvapilo – a co chcete zkusit jinak ve druhém pushi? Tři minuty. Zatím nemluvte.` ✅

#### Finding 4.1 — `vyrobíš` / `sdílíš` = `ty` island in body

**EN:** `Same rule as the first intermezzo — you produce before you share.`
**CS:** `Stejné pravidlo jako u prvního intermezza – nejdřív vyrobíš, pak sdílíš.`
**Finding:** Two `ty` indicatives inside an otherwise-`vy` body. The rest of the body uses `Napište` / `chcete`.
**Alt 1:** `Stejné pravidlo jako u prvního intermezza – nejdřív vyrobíte, pak sdílíte.`
**Alt 2:** `Stejné pravidlo jako u prvního intermezza – nejdřív produkce, pak sdílení.` (nominal, impersonal — matches the rule-stating rhythm)
**Alt 3:** `Stejné pravidlo jako u prvního intermezza – nejdřív píšete sami, pak sdílíte.`
**Reasoning:** Alt 1 is minimal. Alt 2 removes the addressing-form question entirely by nominalising the rule — works because the sentence is stating a principle, not giving an instruction. Alt 3 is the most concrete. **Lean Alt 2** — a principle statement reads better as a noun pair than as a second-person indicative.

#### Finding 4.2 — `Nemluvíme` vs `Nemluvte`

**EN:** `No talking.`
**CS:** `Nemluvíme.`
**Finding:** `Nemluvíme` is first-person plural indicative ("we aren't talking") — reads as a warm collective statement. EN's `No talking` is a rule. Not wrong, just a register shift. **Defensible stylistic chunking.** Flagging only — if the human reviewer prefers the rule-rhythm, swap to `Bez mluvení.` (nominal) or `Neříkejte nic.` (imperative). Otherwise leave — the collective voice fits the scene.

---

### 5. `intermezzo-2 / intermezzo-2-check-in`

**EN canonical:**
- Body: `Five minutes at your table. Compare what you wrote. Then one person writes the team's check-in on your team card. Short, honest — two or three sentences is fine. Another entry in the story the card is telling.`
- Step `i2-share.body`: `Go around the table. Read it out loud. No debate.`
- Step `i2-write.body`: `On the participant board, appended to the team card alongside the Intermezzo 1 check-in and the Build 2 first-beat diagnosis.`
- Callout body: `The team card is accumulating a story. Intermezzo 1 check-in, rotation diagnosis, now this, and maybe more. Don't treat it like a final report. Treat it like a commit message — a small honest note about where your team is right now.`

**CS current:**
- Body: ✅ clean
- Step `i2-share.body`: `Jdete kolem stolu. Přečtete si navzájem, co jste napsali. Bez debaty.`
- Step `i2-write.body`: `Na participant boardu, připojené k check-inu z Intermezza 1 a k diagnóze z prvního okamžiku Buildu 2.`
- Callout body: ✅ clean

#### Finding 5.1 — Present indicative where EN is imperative (carbon copy of D3 finding 6)

**EN:** `Go around the table. Read it out loud. No debate.`
**CS:** `Jdete kolem stolu. Přečtete si navzájem, co jste napsali. Bez debaty.`
**Finding:** `Jdete` / `Přečtete si` are indicative present — they describe, they don't instruct. D3 caught the identical bug in `intermezzo-1-check-in`. This is the Intermezzo 2 twin. Apply the same fix.
**Alt 1:** `Jděte kolem stolu. Přečtěte si navzájem, co jste napsali. Bez debaty.`
**Alt 2:** `Oběhněte stůl. Přečtěte si navzájem, co jste napsali. Bez debaty.`
**Alt 3:** `U stolu postupně. Každý nahlas přečte, co napsal. Bez debaty.`
**Reasoning:** Whatever the reviewer picks for D3's Intermezzo 1 version, mirror here. **Consistency is the goal.**

Also — EN is shorter (`Read it out loud. No debate.`), CS is longer (`Přečtete si navzájem, co jste napsali. Bez debaty.`). The CS added `co jste napsali` — defensible expansion since Czech needs the object more than English does. Not a finding.

#### Finding 5.2 — `z prvního okamžiku Buildu 2` — `okamžik` drift (systemic #4)

**EN:** `the Build 2 first-beat diagnosis`
**CS:** `diagnóze z prvního okamžiku Buildu 2`
**Finding:** `okamžik` collides with `beat`. The EN `first-beat` is literally the `b2a-quiet` + `b2a-friction` diagnosis step — i.e. the first rhythmic beat of Build 2. `prvního okamžiku` reads as "first instant" which loses the rhythmic framing.
**Alt 1:** `diagnóze z prvního beatu Buildu 2`
**Alt 2:** `diagnóze z úvodu Buildu 2`
**Alt 3:** `diagnóze ze začátku Buildu 2`
**Reasoning:** Alt 1 matches the `beat` loanword D1 already recommended. Alt 2/3 paraphrase the structural meaning. **Lean Alt 1** if the human sweep is unifying around `beat` as workshop vocabulary, otherwise Alt 2.

---

### 6. `intermezzo-2 / intermezzo-2-back-to-work`

**EN canonical:**
- Title: `Back to the work`
- Body: `Your check-ins are on screen. I'll read them, pull the thread, and send you back to your team with one thing to try in the second push.`
- `facilitatorNotes`: `Don't let Intermezzo 2 become a mini-Reveal. Keep it brisk.`
- Step `i2-thread-back.body`: `No extended reflection, no closing framing. Closing line: "Forty more minutes. Back to your teams."`
- Callout body: `Same rhythm as the first intermezzo — retrieve, share, move on. No carrying home yet. That is for later. Right now: what is working, what is not, and what you want to do in the next forty minutes.`

**CS current:**
- Title: `Zpátky k práci` ✅
- Body: `Vaše check-iny jsou na plátně. Přečtu je, vytáhnu nit a pošlu vás zpátky do týmu s jednou věcí, kterou chcete ve druhém pushi zkusit.` ✅ (`plátně` canonical per D1)
- `facilitatorNotes`: `Nedovol, aby se z Intermezza 2 stal mini-Závěr. Drž okamžik svižný.`
- Step `i2-thread-back.body`: `Žádná rozšířená reflexe, žádné závěrečné rámování. Poslední věta: „Ještě čtyřicet minut. Zpátky do týmů."` ✅
- Callout body: `Stejný rytmus jako první intermezzo – retrieve, sdílet, jít dál. Ještě neodnášet domů. To přijde později. Právě teď: co funguje, co ne a co chcete udělat v příštích čtyřiceti minutách.` ✅ (in voice, `retrieve` loanword defensible because the scene's instruction pattern is loanword-heavy)

#### Finding 6.1 — `Nedovol` / `Drž` in facilitator notes

**EN:** `Don't let Intermezzo 2 become a mini-Reveal. Keep it brisk.`
**CS:** `Nedovol, aby se z Intermezza 2 stal mini-Závěr. Drž okamžik svižný.`
**Finding:** Two `ty` imperatives. Plus `Drž okamžik svižný` is an `okamžik` drift (systemic #4) — EN's `it` refers to the intermezzo as a whole, not to a beat/moment.
**Alt 1:** `Nedovolte, aby se z Intermezza 2 stal mini-Závěr. Držte tempo svižné.`
**Alt 2:** `Nedovolte, aby se z Intermezza 2 stal mini-Závěr. Držte ho svižný.`
**Alt 3:** `Ať se z Intermezza 2 nestane mini-Závěr. Svižné tempo.` (impersonal + nominal)
**Reasoning:** Alt 1 is the minimal `ty→vy` sweep plus replacing `okamžik` with `tempo` — which matches the EN's rhythmic intent. Alt 2 is even more minimal (`ho` refers back to `Intermezzo 2`). Alt 3 is impersonal — fits facilitator-notes register, dodges both problems.

---

### 7. `build-2-second-push / build-2b-clock-resumes`

**EN canonical:**
- Title: `Second push. Forty minutes. Back to the work.`
- Body: `Apply whatever you surfaced in the intermezzo. Iterate, extend, push further. At 15:30, commit, make your repo readable, decide what you'll show at Reveal.`
- `facilitatorNotes`: `30-second beat. Keep the tempo the room already knows from Build 1 and Build 2 first push.`

**CS current:**
- Title: `Druhý push. Čtyřicet minut. Zpátky k práci.` ✅
- Body: `Aplikujte, co jste zvedli v intermezzu. Iterujte, rozšiřujte, tlačte dál. V 15:30 commit, udělejte repo čitelné, rozhodněte, co ukážete na Závěru.` ✅ (clean `vy`, `commit` as nominal loanword is fine here — matches scene rhythm)
- `facilitatorNotes`: `30vteřinový okamžik. Drž tempo, které místnost už zná z Buildu 1 a z prvního pushe Buildu 2.`

#### Finding 7.1 — `Drž` + `okamžik` in facilitator notes

**EN:** `30-second beat. Keep the tempo the room already knows from Build 1 and Build 2 first push.`
**CS:** `30vteřinový okamžik. Drž tempo, které místnost už zná z Buildu 1 a z prvního pushe Buildu 2.`
**Finding:** `Drž` is `ty`. `30vteřinový okamžik` is the `beat→okamžik` drift D1 flagged on `build-1-clock-started`. Both bugs in one sentence.
**Alt 1:** `30vteřinový beat. Držte tempo, které místnost už zná z Buildu 1 a z prvního pushe Buildu 2.`
**Alt 2:** `30vteřinový krok. Držte tempo, které místnost zná z Buildu 1 a z prvního pushe Buildu 2.`
**Alt 3:** `30 vteřin. Udržujte tempo, které místnost zná z Buildu 1 a z prvního pushe Buildu 2.`
**Reasoning:** Alt 1 uses `beat` loanword — preferred per D1. Alt 2 uses D1's fallback `krok`. Alt 3 dodges both by compacting.

---

### 8. `build-2-second-push / build-2b-second-push-timeline`

**EN canonical:**
- Title: `Forty minutes left. Make it count.`
- Body: `The work is the same discipline. The test is whether you can take the signal from the intermezzo and act on it. If you get stuck, the recovery pattern is one flip away — it's the same scene as the morning.`
- `facilitatorNotes`: `Default ambient scene for the second push.`, `Reuses the stuck-recovery pattern from Build 1 and Build 2 first push.`
- Step `b2b-iterate.body`: `Thirty minutes of building. Apply what the intermezzo surfaced. Push further than the first push did.`
- Step `b2b-cleanup.body`: `Ten minutes. Commit. Make your repo readable. Decide what you will show at Reveal.`
- Callout title: `Stuck? Return to the proof.`
- Callout body: `Same recovery pattern as the morning. State what you're trying to prove. Find the blind spot in the repo. Add the smallest check. Any executable signal beats more guessing.`

**CS current:**
- Title: `Čtyřicet minut zbývá. Využijte je.` ✅
- Body: `Práce je stejná disciplína. Test je, jestli umíte vzít signál z intermezza a jednat podle něj. Když se zaseknete, recovery pattern je na jedno kliknutí – je to stejná scéna jako ráno.` ✅
- `facilitatorNotes`: `Výchozí ambient scéna pro druhý push.`, `Znovupoužívá stuck-recovery pattern z Buildu 1 a prvního pushe Buildu 2.` ✅
- Step `b2b-iterate.body`: `Třicet minut stavění. Aplikujte, co zvedlo intermezzo. Tlačte dál, než dotáhl první push.` ✅
- Step `b2b-cleanup.body`: `Deset minut. Commit. Udělejte repo čitelné. Rozhodněte, co ukážete na Závěru.` ✅ (contrast with Finding 2.5 — this scene's cleanup is already `vy` + nominal `Commit`. Mirror the same fix to `b2a-cleanup`.)
- Callout title: `Zaseknutí? Zpátky k důkazu.` ✅
- Callout body: `Stejný recovery pattern jako ráno. Řekněte, co se snažíte dokázat. Najděte slepé místo v repu. Přidejte nejmenší možnou kontrolu. Jakýkoli spustitelný signál je lepší než další hádání.` ✅

#### No findings.

Clean scene. **Use this scene as the template for unifying the other cleanup/recovery scenes in this batch.** Specifically:

1. `b2b-cleanup.body` solves the form question for `b2a-cleanup.body` — see Finding 2.5 Alt 2.
2. Callout body parallels `build-2a-return-to-proof` and `build-1-return-to-proof` — all three should converge on the same wording.

---

### 9. `reveal / reveal-1-2-4-all`

**EN canonical:**
- Body: `Four layers of reflection. Each one a little wider than the last. This is the most important twenty minutes of the day — do not rush it.`
- Step `reveal-alone.body`: `Individual writing. What signal helped you continue after rotation? What was missing? What's the one thing from today you actually want in your own work next time?`
- Step `reveal-pairs.body`: `Turn to one neighbor. Compare what you wrote. Find the one thing between the two of you that's most worth sharing.`
- Step `reveal-fours.body`: `Two pairs become a four. Compare again. Find the signal, the gap, or the insight that the four of you think the whole room needs to hear.`
- Step `reveal-all.body`: `One thing per group of four, shared with the whole room. Brief. Specific. Honest. No summaries, no rankings.`
- Callout title: `This isn't about winners.`
- Callout body: `We're looking for the signals that helped work survive handoff and the ones that still break under pressure. Every repeated pain across teams is a candidate for a better template, check, or runbook — not a team failure.`

**CS current:** All blocks clean `vy` and in voice. `Otočte se k jednomu sousedovi` ✅, `Porovnejte` ✅, `Najděte` ✅, `Nejde o výherce.` ✅ (callout title lands nicely).

#### Finding 9.1 — Flag only: `Porovnejte znovu` / `Porovnejte`

Three scene blocks use `Porovnejte` as the imperative for `Compare`. EN varies (`Compare what you wrote` / `Compare again`). CS is consistent. **Defensible repetition.** Not a finding.

#### Finding 9.2 — Flag only: `jednu věc, která stojí za sdílení víc než ostatní`

**EN:** `Find the one thing between the two of you that's most worth sharing.`
**CS:** `Najděte jednu věc, která stojí za sdílení víc než ostatní.`
**Finding:** The CS loses `between the two of you` — EN's social framing is that the pair decides together. CS reads as "find one thing worth sharing more than others", dropping the "between the two of you" constraint. Minor drift.
**Alt 1:** `Mezi vámi dvěma najděte tu jednu věc, která nejvíc stojí za sdílení.`
**Alt 2:** `Společně najděte jednu věc z vašich dvou, která nejvíc stojí za sdílení.`
**Alt 3:** Leave as-is — the scene's structural logic ("páry" → "čtyřky" → "všichni") makes the "between you two" constraint implicit.
**Reasoning:** Alt 1 is cleanest. Alt 3 is defensible.

#### Finding 9.3 — `Sám, páry, čtyřky, všichni` title

**EN:** `Alone, pairs, fours, all`
**CS:** `Sám, páry, čtyřky, všichni`
**Finding:** `Sám` is masculine singular — literally "alone (male)". EN `Alone` is gender-neutral; CS `Sám` forces a masculine reading for every participant. The scene's step block uses `Sám · 3 minuty` and then the step body uses `vy` plural (`Jaký signál vám pomohl`). So the scene has a gendered title-word and a plural body.
**Alt 1:** `Samostatně, páry, čtyřky, všichni` — `Samostatně` is adverbial, genderless.
**Alt 2:** `Samy, páry, čtyřky, všichni` — neuter plural.
**Alt 3:** Leave `Sám` — defensible as a generic "one person" reading, matches the meme-able rhythm of the EN four-word list.
**Reasoning:** This is a style-guide call, not a grammar call. The style guide leans inclusive. **Lean Alt 1** — `Samostatně` preserves the rhythm and removes the gendering. The step title inside the scene (`Sám · 3 minuty.`) should match whatever the scene title picks.

---

### 10. `reveal / reveal-what-i-saw`

**EN canonical:**
- Body: `Now my part. I walked the room all day. I read every team's card as the afternoon moved. Here's what I saw from outside — the patterns, the surprises, the things everyone collectively figured out that maybe nobody felt individually.`
- `facilitatorNotes`: `This is the hardest beat in the day. Prepare by reading team cards during the pre-Reveal buffer, not by preparing generic remarks.`, `Uses the team-trail chrome preset so facilitator can point at specific team card entries as evidence.`
- Hero body: `Two or three patterns, one or two surprises, and the craft observation — what this group did well. Grounded, specific, honest. Not a pep talk.`
- Callout body: `The facilitator's observations should be grounded in what's on the team cards and what was just shared in the 1-2-4-All and the demos. Not general encouragement. Specific signals, specific surprises, specific patterns. If you can't point at it, don't say it.`

**CS current:**
- Body: `Teď moje část. Celý den jsem chodil po místnosti. Četl jsem kartu každého týmu, jak odpoledne postupovalo. Tady je to, co jsem viděl zvenčí – vzorce, překvapení a věci, které jste společně vyřešili, i když je možná nikdo necítil sám.` ✅ (in voice; facilitator first-person singular is fine because this is the facilitator *speaking*)
- `facilitatorNotes`: `Nejtěžší okamžik celého dne. Připrav se čtením karet týmů během bufferu před Závěrem, ne obecnými závěrečnými poznámkami.`, `Používá team-trail chrome preset, takže facilitátor může ukazovat na konkrétní zápisy v kartách jako důkaz.`
- Hero body: `Dva nebo tři vzorce, jedno nebo dvě překvapení a řemeslná poznámka – co tahle skupina udělala dobře. Konkrétně, věcně, upřímně. Ne pep talk.` ✅
- Callout body: `Facilitátorovy poznámky se musí opírat o to, co je na kartách týmů a co právě zaznělo v 1-2-4-All a v demech. Ne obecné povzbuzení. Konkrétní signály, konkrétní překvapení, konkrétní vzorce. Když na to neumíte ukázat, nemluvte o tom.` ✅ (clean `vy`)

#### Finding 10.1 — `Připrav se` = `ty`

**EN:** `Prepare by reading team cards during the pre-Reveal buffer, not by preparing generic remarks.`
**CS:** `Připrav se čtením karet týmů během bufferu před Závěrem, ne obecnými závěrečnými poznámkami.`
**Finding:** `ty` imperative.
**Alt 1:** `Připravte se čtením karet týmů během bufferu před Závěrem, ne obecnými závěrečnými poznámkami.`
**Alt 2:** `Příprava: čtení karet týmů během bufferu před Závěrem, ne obecné závěrečné poznámky.` (nominal, impersonal)
**Alt 3:** `Přípravou je čtení karet týmů během bufferu před Závěrem, ne obecné závěrečné poznámky.`
**Reasoning:** Alt 1 is minimal. Alt 2 is impersonal — reads as facilitator-prep instruction without the addressing form, which is cleaner in facilitator notes register.

#### Finding 10.2 — `Nejtěžší okamžik` (borderline, see systemic #4)

**EN:** `This is the hardest beat in the day.`
**CS:** `Nejtěžší okamžik celého dne.`
**Finding:** `okamžik` collides with `beat`. But unlike other `okamžik` hits, this one reads naturally in Czech — `nejtěžší okamžik dne` is a common idiom. **Defensible.** Flagging only. If unifying around `beat` loanword, swap to `Nejtěžší beat celého dne.`

#### Finding 10.3 — `řemeslná poznámka` for `the craft observation`

**EN:** `the craft observation — what this group did well`
**CS:** `řemeslná poznámka – co tahle skupina udělala dobře`
**Finding:** `řemeslná poznámka` is a valid literal but slightly cold. EN's `craft observation` is specifically the facilitator's read on *the craft* — the discipline of harness engineering. `řemeslná poznámka` could read as "a hand-craft-y note" or "an artisanal note". Minor drift.
**Alt 1:** `pozorování z řemesla – co tahle skupina udělala dobře`
**Alt 2:** `pohled z řemesla – co tahle skupina udělala dobře`
**Alt 3:** Leave — defensible, and `řemeslo` is the canonical CS word for `craft` across the agenda.
**Reasoning:** Alt 3 is fine. The scene doesn't hinge on this phrase. Minor polish.

---

## Summary

**Scenes reviewed:** 10 (3 in build-2, 3 in intermezzo-2, 2 in build-2-second-push, 2 in reveal).
**Total scene-level findings:** 14 actionable findings + ~7 flag-only observations.
**Phase-level findings:** 2 (reveal §5 violation + build-2-second-push missing `facilitatorRunner` block entirely).
**Scenes clean with no findings:** 2 (`build-2a-same-clock`, `build-2b-second-push-timeline`).

### Top 3 highest-impact findings

1. **`reveal.cs.facilitatorRunner` §5 day-neutral violation** (systemic finding #5). The CS runner ships `Když v pondělí budete pracovat s jiným toolchainem…` and `Po W3 spusťte pondělní závazky…`. Both `pondělí` instances are translation drift — EN source is day-neutral (`The next time you pick up any toolchain`, `next-day commitments`). This violates canonical-vocab §5, which explicitly bans `pondělí` in both languages. It is the single most consequential finding in the batch because it appears in the facilitator script for the closing ritual of the whole day — exactly where §5 was written to protect.

2. **`build-2-second-push.cs.facilitatorRunner` translation gap** (systemic finding #11). The EN `build-2-second-push` phase has a full `facilitatorRunner` with `say` / `show` / `do` / `watch` / `fallback` arrays. The CS phase has *none of them* — only the `goal` field made it. This is a structural translation gap the D1/D3 sweeps didn't catch. Needs a Phase B follow-up port, not a voice review. Flagged as high-impact because any lockfile gate that checks for runner-block parity will fail on this phase.

3. **`build-2a-eighty-five` body `ty` island + meaning drift** (scene 2, findings 2.1–2.5). The largest participant-facing scene in the batch has a `ty` island in the main body (`tě zděděné repo podrazí`, `aby ses o totéž podrazil dvakrát`) *and* a semantic drift on the `tripping on the same thing twice` clause (the `podrazit se o něco` construction is non-idiomatic Czech). Plus three of the six step bodies in the timeline leak `ty` (`Přečti`, `napiš`, `Couvni`, `udělej`, `Commitni`, `Udělej`, `Rozhodni`, `ukážeš`). Eight `ty` imperatives in one scene. This is the largest mechanical lift in the batch and the only scene with combined voice + meaning drift. Alt 3 on finding 2.1 fixes both bugs at once by rewriting the body's final clause.
