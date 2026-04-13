---
title: "Czech review — project briefs (5 files)"
type: review
date: 2026-04-13
scope: "Phase D of refactor-language-flip plan — project-briefs batch"
status: pending-signoff
files:
  - content/project-briefs/standup-bot.md
  - content/project-briefs/doc-generator.md
  - content/project-briefs/code-review-helper.md
  - content/project-briefs/devtoolbox-cli.md
  - content/project-briefs/metrics-dashboard.md
en_canonicals: content/project-briefs/locales/en/
---

# Project briefs — Czech review

Scope: the five CS project briefs. The `d7b9000` pass normalised `ty` → `vy`
but did not do a full prose review against the EN canonicals or the canonical
vocabulary spec. This memo is advisory — findings are for a human reviewer to
apply file-by-file.

All five files pass the most expensive checks cleanly: no `ty` leakage,
no `pondělí` / `Monday` framing, no protected-phrase paraphrases (none of
the protected phrases from `workshop-content-canonical-vocabulary.md §2`
appear in these briefs — the briefs sit outside the talk/demo surfaces
where the protected lines live). Canonical loanwords that *do* appear
(`safe move`, `handoff`, `commit`, `mobile-first`, `subcommand`) are
correctly preserved.

What the briefs *do* have is three recurring low-impact patterns plus a
handful of scene-level drifts from the EN canonicals. Details below.

---

## Systemic findings

### 1. Unhyphenated noun+noun anglicisms — word-order calque

Two briefs ship strings where an English noun modifier is pasted in front
of a Czech head noun without either hyphenation or genitive restructuring.
Czech needs `pravidla layoutu` or `layout-pravidla`, not bare `layout
pravidla`. Same shape as the `review hodnoticí schéma` calque (see
`code-review-helper.md`).

Hits:

- `metrics-dashboard.md` line 20: `layout pravidla a způsob ověření`
- `metrics-dashboard.md` line 33: `datový model, komponenty, layout pravidla a kritéria`
- `code-review-helper.md` line 17: `diff → hodnoticí schéma → checklist`
- `code-review-helper.md` line 31: `review hodnoticí schéma`

Preferred shapes: `pravidla layoutu`, `rozbor` or `analýza` (for
`hodnoticí schéma`). See file-by-file for rewrites.

**Why it matters:** `layout pravidla` reads as English SOV pasted into
Czech — a clear AI-generated fingerprint per
`content/czech-reject-list.md §AI-generated fingerprints`. Low stakes
individually, high signal that the text wasn't hand-written by a native.

### 2. Meaning drift in `Hotovo když` bullets vs EN

Three briefs compress or soften the EN done-when criteria in ways that
lose precision. The EN canonicals are recently polished (Phase C) and
carry specific "handoff test" framing on one bullet per file — the CS
drops that annotation and in two cases drops a whole bullet.

Hits:

- `standup-bot.md` drops EN's fifth bullet ("Ingest, processing, and
  presentation are cleanly separated in the code") — the architectural
  separation requirement survives only in Architecture notes.
- `standup-bot.md` last bullet `Je jasné, co je jisté shrnutí a co je
  jen heuristika nebo návrh` — `jisté shrnutí` is odd nominalisation;
  EN: "distinguishes what the tool is certain about from what is only a
  heuristic suggestion". `Shrnutí` is the wrong head noun; it should be
  `tvrzení` or a verbal restructure.
- `metrics-dashboard.md` second bullet `Repo popisuje datové zdroje i
  záložní vzorová data` drifts from EN "README documents which parts
  are real, which are mocked, and which are still missing". CS loses
  the three-way real/mock/missing distinction — material drift because
  that distinction is the whole point of the bullet.
- `doc-generator.md`: CS loses the parenthetical `*(Handoff test —
  provenance is the whole point.)*` annotation. Low stakes (the annotation
  is editorial flavour), but EN consistency across the five briefs is
  worth preserving.
- `code-review-helper.md`: CS loses the explicit `examples/` Done-when
  bullet ("There is at least one concrete example in `examples/`"). The
  requirement is implied in Architecture notes but not in Done when.
- `devtoolbox-cli.md` and `metrics-dashboard.md` also lose the
  `*(Handoff test.)*` annotation on their respective bullets.

### 3. `First step for the agent` — `AGENTS.md` anchor dropped

Two briefs strip the explicit `AGENTS.md` reference from the
First-step-for-agent instruction.

- `standup-bot.md` EN: `…an AGENTS.md a rotating team will open first.`
  CS: `…dokumentaci, kterou nový tým otevře jako první.` — generic
  `dokumentaci` instead of `AGENTS.md`.
- `doc-generator.md` EN: `Write that spec in AGENTS.md.` CS omits the
  `AGENTS.md` sentence entirely.

`devtoolbox-cli.md` and `metrics-dashboard.md` both keep their
`AGENTS.md` references. `code-review-helper.md` has no `AGENTS.md`
reference in either EN or CS — consistent.

**Why it matters:** `AGENTS.md as a map, not a warehouse` is a canonical
framing (vocabulary spec §3). Dropping the filename softens the habit
anchor.

### 4. Minor nominal chains (isolated, low priority)

Not a systemic pattern — just flagging so the reviewer can optionally
loosen these during the sweep:

- `devtoolbox-cli.md` Done-when `popisují lokální spuštění a způsob
  ověření` — `způsob ověření` is a mild nominalisation of EN "how to
  run and verify". Preferred: `popisují, jak projekt spustit a ověřit
  lokálně`.
- `doc-generator.md` line 11 `bez ručního sepisování všeho od nuly` —
  acceptable but EN is cleaner (`without writing everything from
  scratch`). Optional tighten: `bez toho, abyste všechno psali ručně
  od nuly`.

---

## File-by-file

### `standup-bot.md`

**Findings: 4**

#### F1 — Done-when bullet 5 (missing)

EN has five Done-when bullets; CS has five but the CS set drops EN's
architectural-separation bullet and adds a different one.

EN bullet: `Ingest, processing, and presentation are cleanly separated in the code.`

CS (current) ends with: `Je jasné, co je jisté shrnutí a co je jen heuristika nebo návrh.`

The architectural bullet is EN-only. Pull it into CS Done-when to match
the canonical 5-bullet shape.

**Alt 1 (restore verbatim):** add as sixth bullet:
> Ingest, zpracování a prezentace jsou v kódu čistě oddělené.

**Alt 2 (substitute):** replace the weaker `jisté shrnutí` bullet:
> Ingest, zpracování a prezentace jsou v kódu zřetelně oddělené — každá
> část se dá měnit bez dopadu na ostatní.

**Alt 3 (leave, rely on Arch notes):** accept that Arch notes line 19
(`Oddělte ingest, zpracování a prezentaci výstupu.`) already encodes
this; flag `Hotovo když` only as advisory. Defensible if reviewer wants
to keep CS slimmer than EN.

#### F2 — `jisté shrnutí` nominalisation (Done-when, last bullet)

Current: `Je jasné, co je jisté shrnutí a co je jen heuristika nebo návrh.`

`jisté shrnutí` reads as "a certain summary" (adjective + noun) rather
than "what is certain vs heuristic in the summary". EN:
`The output distinguishes what the tool is certain about from what is
only a heuristic suggestion.`

**Alt 1 (verbal restructure):**
> Výstup jasně odliší, co nástroj ví jistě a co je jen heuristický návrh.

**Alt 2 (closer to EN syntax):**
> Je zřetelné, která tvrzení jsou jistá a která jen heuristika nebo návrh.

**Alt 3 (shortest):**
> Jisté závěry a heuristiky jsou v\u00A0souhrnu zřetelně oddělené.

Preferred: **Alt 1**.

#### F3 — First step for agent drops `AGENTS.md`

Current: `dokumentaci, kterou nový tým otevře jako první.`

EN: `an AGENTS.md a rotating team will open first.`

**Alt 1 (swap noun):**
> …a `AGENTS.md`, který nový tým otevře jako první.

**Alt 2 (fuller):**
> …a `AGENTS.md`, do kterého tým po rotaci sáhne první.

**Alt 3 (frame as map):**
> …a `AGENTS.md` jako mapu, do které tým po rotaci sáhne první.
(Uses canonical framing from vocabulary spec §3.)

Preferred: **Alt 1** (minimal change, restores filename).

#### F4 — Problem paragraph softened

Line 5 `návaznosti mezi lidmi nejsou vidět` softens EN "dependencies
between people are invisible". The CS `návaznosti` is broader and
blunter — it can mean sequencing, continuity, or follow-ups. EN
`dependencies` is the specific engineering concept. This is borderline
— if the reviewer wants EN parity:

**Alt 1:** `Blokery zapadnou, závislosti mezi lidmi nejsou vidět`
**Alt 2:** `Blokery zapadnou, dependency mezi lidmi nejsou vidět`
(Loanword path — `dependency` is already accepted in the arch note bullet
three lines down.)
**Alt 3:** leave `návaznosti`. Defensible stylistic choice because
line 12 already uses `dependency` in the developer user story; the
Problem paragraph is deliberately more human-language.

Preferred: **Alt 3** (leave), with Alt 2 as fallback if reviewer wants
strict EN parity.

---

### `doc-generator.md`

**Findings: 3**

#### F1 — First step for agent drops `AGENTS.md`

Current: `Nejdřív napište, jaké signály budete z projektu číst, které
výstupy budou jistota a které jen heuristika. Teprve potom navrhněte
první implementační slice.`

EN: `…Write that spec in AGENTS.md. Only then propose the first
implementation slice.`

The `AGENTS.md` sentence is dropped entirely. Restore.

**Alt 1 (append):**
> Nejdřív napište, jaké signály budete z projektu číst, které výstupy
> budou jistota a které jen heuristika. Tu specifikaci vložte do
> `AGENTS.md`. Teprve potom navrhněte první implementační slice.

**Alt 2 (inline):**
> Nejdřív v\u00A0`AGENTS.md` sepište, jaké signály budete z\u00A0projektu
> číst a které výstupy budou jistota a které jen heuristika. Teprve
> potom navrhněte první implementační slice.

**Alt 3 (minimal):**
> …které jen heuristika — a napište to do `AGENTS.md`. Teprve potom
> navrhněte první implementační slice.

Preferred: **Alt 2** (places `AGENTS.md` up front, matching the spirit
of "the first file the rotating team opens").

#### F2 — `bez dlouhého pátrání po souvislostech`

Current: `chci objevit architekturu projektu bez dlouhého pátrání po
souvislostech.`

EN: `I want to discover the architecture without long detective work.`

Acceptable as-is — `pátrání po souvislostech` is idiomatic Czech. Minor
flag: `pátrání` is a light nominalisation that could go verbal.

**Alt 1 (verbal):** `chci pochopit architekturu projektu, aniž bych musel dlouho pátrat po souvislostech.`
**Alt 2 (keep):** leave as-is — it reads cleanly.
**Alt 3 (tighter):** `chci pochopit architekturu projektu bez dlouhého detektivního pátrání.` (Closer to EN.)

Preferred: **Alt 2** (leave). Defensible stylistic choice.

#### F3 — Done-when first bullet loses provenance framing

Current (line 29): `Reviewer během 10 minut pozná, odkud které tvrzení pochází.`

EN: `A reviewer can read the generated documentation and tell exactly
where each claim came from — within minutes, without opening the
original source. *(Handoff test — provenance is the whole point.)*`

CS loses "without opening the original source" (the load-bearing part
of the handoff test) and the parenthetical annotation.

**Alt 1 (add provenance condition):**
> Reviewer během 10 minut pozná, odkud které tvrzení pochází — aniž by
> musel otevřít původní zdroj. *(Handoff test — provenance je celý
> smysl.)*

**Alt 2 (verbal):**
> Reviewer si přečte vygenerovanou dokumentaci a během 10 minut řekne,
> odkud které tvrzení pochází, aniž by musel otevřít původní kód.

**Alt 3 (keep shortened, add annotation only):**
> Reviewer během 10 minut pozná, odkud které tvrzení pochází. *(Handoff
> test — provenance je celý smysl.)*

Preferred: **Alt 1**.

---

### `code-review-helper.md`

**Findings: 3**

#### F1 — `hodnoticí schéma` (word-order calque, two occurrences)

Line 17: `Důležitý je jasný tok \`diff → hodnoticí schéma → checklist\`.`
Line 31: `Nejdřív napište review hodnoticí schéma, tok vstupů…`

EN line 15: `a clear \`diff -> analysis -> checklist\` flow.`
EN line 30: `First write the review rules, define what a good checklist
looks like…`

`hodnoticí schéma` is the reviewer's ad-hoc coinage for EN "analysis",
and `review hodnoticí schéma` is the calque of EN "review rules"
(English adjective + Czech noun, no genitive). Both read as translator
artifacts.

**Line 17 options:**
- **Alt 1:** `jasný tok \`diff → rozbor → checklist\`.` (rozbor = analysis)
- **Alt 2:** `jasný tok \`diff → analýza → checklist\`.` (loanword path)
- **Alt 3:** `jasný tok \`diff → vyhodnocení → checklist\`.`

Preferred for line 17: **Alt 1** (`rozbor` is the cleanest native term).

**Line 31 options:**
- **Alt 1:** `Nejdřív napište pravidla pro review, tok vstupů a definici…`
- **Alt 2:** `Nejdřív napište review pravidla, tok vstupů a definici…`
  (Still calque-ish; avoid.)
- **Alt 3:** `Nejdřív napište, podle jakých pravidel se review dělá, jak
  vypadá tok vstupů a co znamená dobrý checklist.` (Fully verbal.)

Preferred for line 31: **Alt 1**.

#### F2 — Done-when loses `examples/` bullet

EN bullet 5: `There is at least one concrete example in \`examples/\`
that demonstrates the full flow.`

CS has no equivalent. The requirement survives in Arch notes line 19
(`Přidejte seed diff nebo \`examples/\`…`) but not in Done when.

**Alt 1 (restore):** add bullet:
> V\u00A0`examples/` je aspoň jeden konkrétní příklad, který ukazuje
> celý tok.

**Alt 2 (merge into existing "jak přidat nové pravidlo" bullet):**
> Je jasné, jak přidat nové pravidlo nebo heuristiku bez dlouhého
> onboardingu — aspoň jeden konkrétní příklad je v\u00A0`examples/`.

**Alt 3 (leave):** accept that Arch notes carries it. Defensible if
reviewer wants minimal Done-when.

Preferred: **Alt 1**.

#### F3 — Done-when loses EN's "readable/editable by someone who didn't write them" criterion

EN bullet 4: `The review rules themselves are readable and editable by
someone who didn't write them.`

CS covers this only implicitly via `bez dlouhého onboardingu`.

**Alt 1 (restore explicitly):**
> Pravidla review jsou čitelná a upravitelná i pro někoho, kdo je
> nepsal.

**Alt 2 (merge):**
> Je jasné, jak přidat nové pravidlo nebo heuristiku — včetně toho, že
> pravidla jsou čitelná i pro někoho, kdo je nepsal.

**Alt 3 (leave):** defensible — `bez dlouhého onboardingu` covers it.

Preferred: **Alt 1** (EN precision is worth preserving).

---

### `devtoolbox-cli.md`

**Findings: 1**

This brief is the cleanest of the five. No calques, no missed
`AGENTS.md` anchors, no ty-leakage, the "bag of scripts / small system"
EN line is preserved verbatim-equivalent in CS. One minor nominal flag.

#### F1 — `způsob ověření` (mild nominalisation)

Line 26: `\`README\` i \`AGENTS.md\` popisují lokální spuštění a způsob
ověření.`

EN: `\`README\` and \`AGENTS.md\` explain how to run and verify
locally.`

`způsob ověření` is a classic `-í` nominalisation for EN "verify".
Isolated, not a pattern — optional fix.

**Alt 1 (verbal):**
> `README` i `AGENTS.md` popisují, jak projekt spustit a ověřit lokálně.

**Alt 2 (minimal):**
> `README` i `AGENTS.md` popisují lokální spuštění a ověření.
> (Drops `způsob`, keeps both nouns parallel.)

**Alt 3 (leave):** defensible — the phrase is understandable and not
actively ugly.

Preferred: **Alt 1**.

---

### `metrics-dashboard.md`

**Findings: 3**

#### F1 — `layout pravidla` (word-order calque, two occurrences)

Line 20: `aby nový tým rychle pochopil datový model, layout pravidla a
způsob ověření.`

Line 33: `Nejdřív popište datový model, komponenty, layout pravidla a
kritéria \`Hotovo když\`…`

Same shape as `code-review-helper.md` F1. English modifier + Czech head
noun with no genitive. Canonical Czech needs `pravidla layoutu`.

**Line 20 options:**
- **Alt 1:** `datový model, pravidla layoutu a způsob ověření`
- **Alt 2:** `datový model, layout-pravidla a způsob ověření`
  (Hyphenated compound — Czech does this but feels German; avoid.)
- **Alt 3:** `datový model, pravidla pro layout a způsob ověření`

Preferred: **Alt 1**.

**Line 33 options:**
- **Alt 1:** `datový model, komponenty, pravidla layoutu a kritéria
  \`Hotovo když\``
- **Alt 2:** `datový model, hranice komponent, pravidla layoutu a
  kritéria \`Hotovo když\``
  (Closer to EN "component boundaries".)
- **Alt 3:** `datový model, komponenty, rozložení a kritéria \`Hotovo
  když\`` (Native `rozložení` for layout — purist, loses a loanword the
  workshop otherwise accepts.)

Preferred: **Alt 2** (also restores EN's "component boundaries" which
the CS flattens to `komponenty`).

#### F2 — Done-when bullet 2 drifts from "real / mocked / missing"

Current (line 26): `Repo popisuje datové zdroje i záložní vzorová data.`

EN (bullet 5): `The \`README\` documents which parts are real, which
are mocked, and which are still missing.`

CS drops the three-way distinction. This is a material drift — the EN
bullet exists specifically to force participants to surface what's
mocked and what's missing, not just what the data sources are.

**Alt 1 (full restore):**
> `README` popisuje, co už funguje reálně, co je mock a co zatím chybí.

**Alt 2 (keep data-source framing, add distinction):**
> Repo popisuje datové zdroje — co už funguje reálně, co je mock a co
> zatím chybí.

**Alt 3 (minimal):**
> `README` odlišuje reálné části od mocků a od toho, co zatím chybí.

Preferred: **Alt 1**.

#### F3 — Done-when last bullet compresses two EN bullets

CS line 29: `Layout je čitelný na mobilu i na větší obrazovce a je
jasné, jak to ověřit.`

EN has this as one bullet: `The layout stays legible on mobile and on
a large projected screen; the \`README\` says how to test both.`

CS covers it reasonably but loses `projected screen` (important — the
dashboard is used at workshop facilitation, on a projector, not on "a
large screen" generally) and doesn't name `README` as the verification
location.

**Alt 1 (restore both details):**
> Layout je čitelný na mobilu i na velkém projekčním plátně a v\u00A0
> `README` je popsáno, jak obojí ověřit.

**Alt 2 (keep CS structure, add projekce):**
> Layout je čitelný na mobilu i na projekci a je jasné, jak to ověřit.

**Alt 3 (leave):** defensible — "větší obrazovka" covers projection by
implication.

Preferred: **Alt 1** (matches EN precision).

---

## Summary

**Total findings: 14** across 5 files (standup-bot: 4, doc-generator: 3,
code-review-helper: 3, devtoolbox-cli: 1, metrics-dashboard: 3).

**Zero-finding checks (all passing):**
- `ty` form leakage — none (d7b9000 held)
- `pondělí` / `Monday` framing — none
- Protected-phrase paraphrases — none (briefs don't cite protected phrases)
- Canonical loanwords — correctly preserved (`safe move`, `handoff`,
  `commit`, `mobile-first`, `subcommand`, `checklist`)
- Register mismatch with EN — none material; CS holds peer tone cleanly

### Top 3 highest-impact

1. **`metrics-dashboard.md` F2 — Done-when drift from "real / mocked /
   missing"** (line 26). The EN bullet exists specifically to force
   participants to name what's mocked vs missing. CS flattens to generic
   "datové zdroje i záložní vzorová data" and loses the workshop's
   trust-boundary framing. Material drift, not stylistic. **Fix with
   Alt 1.**

2. **`code-review-helper.md` F1 — `hodnoticí schéma` calque (two
   occurrences).** Word-order anglicism (`review hodnoticí schéma`) plus
   an ad-hoc coinage for EN "analysis". Reads as translator artifact on
   the most prominent line of the brief ("Don't start with code" — First
   step for agent). Highest-visibility stylistic fingerprint in the
   batch. **Fix with Alt 1 on both lines.**

3. **`standup-bot.md` F3 + `doc-generator.md` F1 — missing `AGENTS.md`
   anchor in First step for agent.** Two of the five briefs drop the
   explicit `AGENTS.md` reference the EN canonical carries. `AGENTS.md
   as a map, not a warehouse` is a canonical framing from the vocabulary
   spec (§3) — softening it across two briefs weakens the habit link
   participants carry home. Cheap to fix (one sentence each). **Fix with
   Alt 1 (standup) and Alt 2 (doc-generator).**

### Out of scope (not flagged)

- Short-fragment rhythm in Problem paragraphs — all five briefs use the
  deliberate punchy opening style; this is intentional per `style-guide.md`
  "Sentence Style".
- `mock`, `seed`, `slice`, `pipeline`, `framework` as loanwords — all on
  the accepted list.
- `handoff` vs `předání` — both appear and both are fine. The briefs use
  `předání` for the act and would use `handoff` if they named the
  concept; current mix is defensible.
- EN-only parenthetical `*(Handoff test.)*` annotations — flagged in
  Systemic Finding 2 but not marked as file-level findings because
  restoring them is purely editorial consistency with no semantic cost.
