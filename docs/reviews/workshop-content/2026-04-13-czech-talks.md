---
title: "Czech review — talks (context-is-king.md + codex-demo-script.md)"
type: review
date: 2026-04-13
scope: "D7 of refactor-language-flip plan"
status: pending-signoff
---

# Talks review

## Files covered

1. `content/talks/context-is-king.md` — Czech facilitator delivery script for the Context is King talk. Partially touched in the 2026-04-13 drift-alignment session (engine/chassis section was rewritten in commit `cdce18c`) but this is the first full review pass against the EN canonical.
2. `content/talks/codex-demo-script.md` — Czech Codex demo delivery script. Never fully reviewed against the EN canonical.

EN canonicals: `content/talks/locales/en/context-is-king.md`, `content/talks/locales/en/codex-demo-script.md`.

Both are **facilitator-facing** surfaces, so `czech-reject-list.md` §"Nejasnost a dvojznačnost" applies in the softer presenter profile, but §149 (lowercase `vy` + `vykání`), §"Kalky z angličtiny", §"Nominální řetězy", §"Výplňová slovesa", and §"AI fingerprints" all apply at full strength. Canonical-vocab §2 (protected phrases), §3 (canonical names), §4 (voices), §5 (day-neutral) apply unconditionally.

---

## Systemic findings

### S1. `codex-demo-script.md` is half-translated — large EN-only blocks shipping as CS

This is by far the biggest finding in the batch. **Roughly 40 % of the file is still in English** and was evidently never translated when the locale split landed:

- Lines 13–52 — the whole `## Repo-Readiness Contrast (talk micro-exercise)` section (`Two-Folder Setup`, `Narration flow`, `Honest failure narration`, `Tool-specific realities`, `Open question`) is English prose sitting inside the CS file.
- Line 72 — the `If live contrast drags …` fallback bullet is English-only.

The EN canonical (`locales/en/codex-demo-script.md`) has `cs_reviewed: true` frontmatter. The CS file has no frontmatter at all and reads as a draft that was started after `## Flow (after contrast)` and never backfilled. This must be translated in full before D7 can sign off; everything else in this memo assumes the English blocks will be replaced with canonical Czech per the rewrites proposed in Findings 3.1–3.5.

### S2. `codex-demo-script.md` Flow + Fallbacks are written in `ty` form — systemic §149 violation

Every imperative in `## Flow (after contrast)` and `## Fallbacky` uses `ty` form:

- Flow: `Otevři`, `Spusť`, `ukaž`, `Nech`, `Zavři`, `přejdi`, `použij`, `měj` (lines 56–71).
- Fallbacks: `přejdi`, `použij`, `měj` (lines 69–71).

The EN canonical is imperative/impersonal ("Open Folder B", "Run `/plan`", "Let the agent…"), which is neutral in English but maps to `vy` in Czech per style-guide §149 and the D1/D3 sweep decisions. This is the same systemic pattern D1 flagged in `opening.cs.facilitatorRunner` and D5 flagged in several phase runners — the talks file needs the same fix.

### S3. `context-is-king.md` — zero `ty` leaks, §5 clean, protected phrases intact

Good news on this file. Across all five scenes:

- Every second-person imperative uses `vy` form (`řekněte`, `nechte`, `hlídejte`, `nepřidávejte`, `nečtěte`, `otevřete`, `projděte`, `budete trénovat`, `stanete se`, …). The two "`Ty`" hits on lines 94 and 173 (`Ty jsou v agendě`, `Ty dvě věty`) are the demonstrative pronoun, not second-person — **not** §149 violations, false positives.
- The one `v pondělí ráno` occurrence on line 162 is inside a `Neříkejte` instruction explicitly teaching the facilitator **not** to say it — canonical §5 is actually reinforced here, not violated.
- Protected phrases land verbatim: `Lidé řídí. Agenti vykonávají.` (lines 12, 115, 127, 161, 173), `Agent = Model + Harness` (line 54), `Druhý den, až si otevřete coding agenta …` (lines 119–121), `AGENTS.md jako mapa, ne encyklopedie` (line 87), `čtyři sloupy` (lines 83, 85, 164, 172).
- `guides`, `sensors`, `tracer bullet`, `task drift`, `managing, ne chatování`, `harness engineering` all present as loanwords per §3.
- `task drift` and the whole §3 glossary survive intact.

The remaining findings in `context-is-king.md` are style/register issues, not vocabulary or framing drift.

### S4. `unese další krok` / `carries the next move` is missing from both talk files

Canonical-vocab §2 lists `carries the next move` / **`unese další krok`** as one of the six protected phrases, anchored in `opening-framing` (not these talks). **Neither talk file uses or echoes it**, and the EN canonical doesn't either. That's probably fine — the phrase lives in the opening hero, not in the Context is King talk — but flagging for signoff. If the facilitator is expected to reinforce the phrase inside the talk, it needs to be added (likely in scene 2 as part of the `Agent = Model + Harness` landing). Recommendation: **leave as-is**; the opening hero carries it.

### S5. Analogy section on lines 58–68 (`context-is-king.md`) reads fine but lost the "shopping cart" contrast structure the EN had

The engine/chassis section was rewritten from canonical EN prose into facilitator notes in commit `cdce18c`. The rewrite is internally clean (no `ty`, no reject-list hits), but it compresses the three-beat contrast differently from EN — see Finding 2.2 below. Not a blocker, but worth noting that the CS version now says things the EN canonical does not, which puts the two files slightly out of drift-alignment the opposite direction from what D1 was fixing.

### S6. Reject-list hit: `implementovat`

Exactly one hit in the whole corpus: line 59 of `codex-demo-script.md`, `Nech agenta implementovat malý kus` — §"Výplňová slovesa" says `implementovat` should be reserved for narrow technical implementation and otherwise replaced with `zavést`, `napsat`, `přidat`. In a demo context with an agent writing a small slice, `napsat` or `doplnit` is stronger. Fold into the Finding 2.4 rewrite.

---

## File-by-file findings

### `content/talks/context-is-king.md`

#### Finding 1.1 — Scéna 1, beat 1: `bez důrazu` is a soft mistranslation of `without emphasis`

**EN:** `"Humans steer. Agents execute." — say it slowly, without emphasis. The first time you say it with emphasis will be in scene 4.`
**CS (line 26):** `Jeho první princip — „Lidé řídí. Agenti vykonávají.“ — řekněte ho pomalu a bez důrazu. Až ho řeknete v scéně 4, bude to poprvé s důrazem.`
**Finding:** `bez důrazu` literally means "without stress/emphasis" but in Czech stage-direction register it reads as "flat, listlessly" rather than "don't sell it yet, let it land unsold". The intent in EN is "deliberately under-delivered so the scene-4 delivery is the first emphatic one". Also `v scéně` should be `ve scéně` (preposition-vocalization rule before `s`+consonant).
**Alt 1:** `Jeho první princip — „Lidé řídí. Agenti vykonávají.“ — řekněte ho pomalu a bez důrazu nakonec. Poprvé ho s důrazem řeknete až ve scéně 4.`
**Alt 2:** `Jeho první princip — „Lidé řídí. Agenti vykonávají.“ — řekněte ho pomalu, neprodávejte ho. Poprvé ho prodáte až ve scéně 4.`
**Alt 3:** `Jeho první princip — „Lidé řídí. Agenti vykonávají.“ — řekněte ho pomalu, bez tlaku v hlase. Ve scéně 4 ho řeknete poprvé s důrazem.`
**Reasoning:** Alt 1 is minimal — adds `nakonec` to disambiguate (no emphasis *at the end*, matching the EN stage direction about intonation) and fixes `v scéně` → `ve scéně`. Alt 2 is more literary; Alt 3 is the most literal reading of what the facilitator does physically.

#### Finding 1.2 — Engine/chassis rewrite (lines 60–66) drifted away from the EN canonical's contrast structure

**EN:** `The key is the contrast: a 400-horsepower engine bolted to a shopping cart versus the same engine bolted to a well-designed chassis. Not "the engine is bad" — the engine is powerful. The chassis makes the power accessible. It makes the power predictable, survivable. The model is the engine. The harness is the chassis.`
**CS (lines 62–66):**
> Plnou prózu má agenda v hero bloku scény — vy doručujete strukturu, ne text. Drží se na třech bodech:
> 1. **Stejný motor, dva podvozky.** Čtyři stovky koní. Přišroubujte je k nákupnímu vozíku — máte drahý způsob, jak rozbít parkoviště. Přišroubujte je k pořádně navrženému podvozku — auto najednou zvládne řídit i někdo, kdo není profík.
> 2. **Motor se nezměnil.** Podvozek ho neoslabil. Tu sílu jenom zpřístupnil — dal jí rám, brzdy, předvídatelnost.
> 3. **Model je motor. Harness je podvozek.** Dvě věty, pauza, dál.
**Finding:** Three separate issues. **(a)** CS says *"i někdo, kdo není profík"* — "even a non-professional can drive it" — which is a human metaphor (amateur driver) the EN canonical does not make. The EN point is *the power becomes accessible/predictable/survivable*, not *a beginner can now drive*. The CS version implies "harness democratizes the agent for juniors", which is a different (and arguably wrong) claim. **(b)** `rozbít parkoviště` ("destroy the parking lot") is a colorful addition the EN doesn't have — it's fine as facilitator flavor but shifts register and makes the rewrite an authored variation, not a translation. **(c)** The CS version has lost the word `survivable` — the whole third claim of the contrast. EN lists three properties: *accessible, predictable, survivable*. CS gives `zpřístupnil … rám, brzdy, předvídatelnost` — missing `survivable` (which is the central safety frame).
**Alt 1 (closest to EN):** `Drží se na třech bodech:`
> 1. **Stejný motor, dva podvozky.** Čtyři stovky koní přišroubované k nákupnímu vozíku — drahý způsob, jak se někde rozbít. Ty stejné čtyři stovky koní přišroubované k pořádnému podvozku — auto, se kterým se dá jet rychle a přežít to.
> 2. **Motor se nezměnil.** Podvozek ho neoslabil, jen tu sílu zpřístupnil — dal jí rám, brzdy, předvídatelnost, přežitelnost.
> 3. **Model je motor. Harness je podvozek.** Dvě věty, pauza, dál.

**Alt 2 (tighter, drops the "non-professional" drift):**
> 1. **Stejný motor, dva podvozky.** Čtyři stovky koní ve vozíku z baumarktu — drahé nic. Ty stejné koně v pořádném podvozku — použitelná síla.
> 2. **Motor se nezměnil, jen se zpřístupnil.** Podvozek mu dal rám, brzdy, předvídatelnost — a tím i přežitelnost.
> 3. **Model je motor. Harness je podvozek.**
**Alt 3 (preserve facilitator color, add back `survivable`):**
> 1. **Stejný motor, dva podvozky.** Čtyři stovky koní v nákupním vozíku — drahý způsob, jak rozbít parkoviště. Ty stejné čtyři stovky koní v pořádném podvozku — auto, které se dá řídit a se kterým se dá přežít.
> 2. **Motor se nezměnil.** Podvozek ho neoslabil. Tu sílu zpřístupnil — dal jí rám, brzdy, předvídatelnost, přežitelnost.
> 3. **Model je motor. Harness je podvozek.** Dvě věty, pauza, dál.
**Reasoning:** All three restore `přežitelnost` / `survivable` — the missing third property. Alt 1 is closest to EN. Alt 2 strips the flavor. Alt 3 keeps the facilitator's `rozbít parkoviště` color but removes the `i někdo, kdo není profík` clause that imports a claim the EN doesn't make.

#### Finding 1.3 — Line 70 has a translation gap: `reframe callout` → just `callout`

**EN:** `Then the reframe callout: **The gap between models is narrowing. The gap between harnesses is widening.**`
**CS (line 70):** `Pak callout: **Mezera mezi modely se zužuje. Mezera mezi harnessy se prohlubuje.**`
**Finding:** EN qualifies the callout as a *reframe callout* — a framing device. CS just says `callout`, which loses the fact that this line specifically reframes the preceding analogy into a strategic claim. Minor nuance, worth preserving.
**Alt 1:** `Pak reframe callout: **Mezera mezi modely se zužuje. Mezera mezi harnessy se prohlubuje.**`
**Alt 2:** `Pak přerámování: **Mezera mezi modely se zužuje. Mezera mezi harnessy se prohlubuje.**`
**Alt 3:** `Pak callout, který to celé přerámuje: **Mezera mezi modely se zužuje. Mezera mezi harnessy se prohlubuje.**`
**Reasoning:** Alt 1 keeps `reframe` as loanword in a facilitator-facing file — defensible, matches how `harness` and `callout` are already loanwords. Alt 2 uses Czech but is heavier. Alt 3 is explanatory but verbose. Prefer Alt 1.

#### Finding 1.4 — Line 75: `O tom se můžeme bavit …` uses first-person plural where EN has command register

**EN:** `"We can talk about that at the break. Right now, how you build the harness."`
**CS (line 75):** `„O tom se můžeme bavit o přestávce. Teď, jak ten harness postavit.“`
**Finding:** Two small issues. **(a)** `můžeme se bavit` → the word order `se můžeme` is fine but the whole phrase is slightly soft. EN is a deflect-and-steer. **(b)** `Teď, jak ten harness postavit.` is a fragment that reads awkwardly in Czech — the infinitive without subject is EN word-order transplant. Czech prefers either a full clause or a noun phrase.
**Alt 1:** `„O tom si můžeme promluvit o přestávce. Teď jde o to, jak ten harness postavit.“`
**Alt 2:** `„O tom se bavme o přestávce. Teď — jak ten harness postavit.“`
**Alt 3:** `„Tohle si nechme na přestávku. Teď: jak ten harness postavit.“`
**Reasoning:** Alt 1 is the smoothest and keeps the facilitator voice. Alt 2 preserves the EN fragment rhythm with an em-dash. Alt 3 is the tightest and most command-register; closest to the EN deflect-and-pivot.

#### Finding 1.5 — Line 88: `Boundaries create speed` loses the reject-list-free reframe in the CS paraphrase

**EN:** `Your headline sentence: **"Boundaries create speed."** Constraints aren't friction. They're why work goes fast.`
**CS (line 88):** `Hlavní věta navíc: **„Boundaries create speed.“** V češtině: **„Mantinely jsou důvod, proč se práce hne rychleji, ne proč se hne pomaleji.“**`
**Finding:** The CS rendering is a wordy double-clause. EN's second sentence is a crisp two-beat: *Constraints aren't friction. They're why work goes fast.* CS turns it into `jsou důvod, proč se práce hne rychleji, ne proč se hne pomaleji` which is nominal (`jsou důvod, proč`), has a comparative contrast where EN has a flat positive claim, and reads as translated. Also canonical-vocab §1 habit #3 is **`Boundaries create speed`** — the Czech translation is the thing that needs to sound memorable as a habit tag, and the current version doesn't.
**Alt 1:** `Hlavní věta navíc: **„Boundaries create speed.“** Česky: **„Mantinely nejsou tření. Jsou důvod, proč se práce hýbe rychle.“**`
**Alt 2:** `Hlavní věta navíc: **„Boundaries create speed.“** Česky: **„Mantinely nezpomalují. Zrychlují.“**`
**Alt 3:** `Hlavní věta navíc: **„Boundaries create speed.“** Česky: **„Mantinely nejsou brzda. Jsou zrychlení.“**`
**Reasoning:** Alt 1 is the direct translation preserving the two-beat rhythm. Alt 2 is the tightest — closest to the EN's emphatic brevity. Alt 3 uses a car metaphor (`brzda`/`zrychlení`) which ties subliminally to the engine/chassis analogy two scenes earlier, if the facilitator wants a callback. Prefer Alt 2.

#### Finding 1.6 — Line 89, pillar 3: nominal chain `jedna funkce vrátila 4`

**EN:** `"When the agent does more, your verification has to prove the whole thing works, not that one function returned 4."`
**CS (line 89):** `**„Když agent dělá víc, vaše ověření musí dokázat, že drží celek, ne že jedna funkce vrátila 4.“**`
**Finding:** CS is close but `drží celek` is weaker than `the whole thing works`. `drží` usually means "holds together / doesn't fall apart"; the EN point is "the whole flow actually works end-to-end". Also `jedna funkce vrátila 4` is literal but drops the contrast rhythm. Minor, defensible.
**Alt 1:** `**„Když agent dělá víc, vaše ověření musí dokázat, že funguje celek — ne že jedna funkce vrátila 4.“**`
**Alt 2:** `**„Když agent dělá víc, ověření musí dokázat, že celý flow projde. Ne že funkce X vrátila 4.“**`
**Alt 3:** `**„Když agent dělá víc, ověřujete celek. Ne že jedna funkce vrátila 4.“**`
**Reasoning:** Alt 1 is the minimal fix (`drží celek` → `funguje celek`). Alt 2 splits into two crisp sentences, closest to the EN contrast rhythm. Alt 3 is the tightest and works best as a slide callout.

#### Finding 1.7 — Line 92, team-lead callout: `Team lead staví systém, ve kterém tým běží`

**EN:** `Then the callout **"A team lead builds the system the team runs in."**`
**CS (line 92):** `Pak callout **„Team lead staví systém, ve kterém tým běží.“**`
**Finding:** `tým běží` is a literal translation of `the team runs` but in Czech it reads as "the team is running" in the sense of `running a process` / `being in motion`, not `runs in an environment`. The EN metaphor is *a runtime environment the team operates inside*. `ve kterém tým běží` works by accident but is not idiomatic — a native reader pauses on it.
**Alt 1:** `Pak callout **„Team lead staví systém, ve kterém tým pracuje.“**`
**Alt 2:** `Pak callout **„Team lead staví prostředí, ve kterém tým funguje.“**`
**Alt 3:** `Pak callout **„Team lead staví systém, ve kterém tým jede.“**`
**Reasoning:** Alt 1 is the safest neutral Czech. Alt 2 introduces `prostředí` which explicitly echoes `prostředí, do kterého agent vchází` from the scene-4 closing — a stealth callback. Alt 3 preserves the motion metaphor via colloquial `jede`, matching the EN verb `runs` more tonally. Prefer Alt 2 for the callback payoff.

#### Finding 1.8 — Line 132 has `v scéně` (non-vocalized preposition)

**EN:** `Never saying it again in scene 5. Scene 5 is the bridge, not the echo.`
**CS (line 132):** `Ji neřekne podruhé v scéně 5. Scéna 5 je most, ne echo.`
**Finding:** Czech vocalizes `v` → `ve` before words beginning with consonant clusters like `sc-`, `st-`, `sp-`, `sk-`. So `v scéně` → **`ve scéně`**. Same issue likely on line 26 (`v scéně 4, bude to poprvé`) — see Finding 1.1.
**Alt 1:** `Ji neřekne podruhé ve scéně 5. Scéna 5 je most, ne echo.`
**Alt 2:** (same, plus ordering) `Nevrátí se k ní ve scéně 5. Scéna 5 je most, ne echo.`
**Alt 3:** `Ve scéně 5 ji neřekne podruhé. Scéna 5 je most, ne echo.`
**Reasoning:** This is a hard typographic rule, not judgment — Alt 1 is mandatory (or Alt 2/3). The `Ji neřekne` fronting in Alt 1 is archaic; Alt 3 rearranges to put the locative first, which is more natural Czech.

#### Finding 1.9 — Line 137: `hraniční` is a false friend for `the upper limit`

**EN:** `Two quotes in sequence is the upper limit; one is fine.`
**CS (line 137):** `Dva citáty po sobě jsou hraniční, jeden stačí.`
**Finding:** `hraniční` means "borderline/marginal" in Czech — it implies "not quite okay, on the edge". EN says `the upper limit` which means "the maximum you can do, not more". The nuance drifts: CS warns the facilitator that two quotes is risky, EN says two is the ceiling. Close enough but wrong direction.
**Alt 1:** `Dva citáty po sobě jsou maximum, jeden stačí.`
**Alt 2:** `Dva citáty po sobě jsou strop, jeden stačí.`
**Alt 3:** `Dva citáty po sobě jsou horní hranice, jeden stačí.`
**Reasoning:** Alt 1 is cleanest Czech. Alt 2 is colloquial and keeps the facilitator voice. Alt 3 is the most literal. Prefer Alt 1.

#### Finding 1.10 — Lines 176–183: the `Co si odnesete do build fáze` closing section has mixed register

**EN:** See lines 175–185 of EN canonical.
**CS (lines 176–185):**
> Po tomhle talku se tým nemá vracet k repu s pocitem, že potřebuje jen chytřejší prompt. Má se vracet s **jedním jasným očekáváním**: nejdřív mapa a ověření, teprve potom práce na funkcích.
> - Pokud ještě nemají workshop skill: `harness skill install` …
**Finding:** Small but noticeable: `nejdřív mapa a ověření, teprve potom práce na funkcích` translates the EN `map and verification first, feature motion second` but drops the EN rhyme structure (first / second). In CS the second clause says `teprve potom práce na funkcích` which is heavier. Not a blocker, just a polish opportunity.
**Alt 1:** `Má se vracet s **jedním jasným očekáváním**: nejdřív mapa a ověření, pak teprve funkce.`
**Alt 2:** `Má se vracet s **jedním jasným očekáváním**: mapa a ověření napřed, funkce potom.`
**Alt 3:** `Má se vracet s **jedním jasným očekáváním**: nejdřív mapa a ověření, až potom feature motion.`
**Reasoning:** Alt 2 is the cleanest rhyme-preserving version. Alt 3 preserves `feature motion` as a loanword, which is a judgment call — not in the canonical vocabulary as a protected term, so prefer Alt 2.

---

### `content/talks/codex-demo-script.md`

#### Finding 2.1 — Untranslated EN block: `## Repo-Readiness Contrast` section (lines 13–52)

**EN:** The full `## Repo-Readiness Contrast (talk micro-exercise)` section in the EN canonical.
**CS:** Identical English prose, untranslated, sitting inside the `.cs.md` file (well, the unsuffixed file which is now CS-by-default after the locale split).
**Finding:** This section needs a full CS translation. The whole `Two-Folder Setup`, `Narration flow`, `Honest failure narration`, `Tool-specific realities to mention during the demo`, and `Open question` subsections are English. This is the single largest content debt in D7.
**Alt 1 (full translation, canonical CS — reference draft):**

```markdown
## Repo-Readiness Contrast (talk micro-exercise)

Facilitátor před samotným demo ukazuje krátký kontrast: **stejný prompt, dvě repa, jiný výsledek**.

### Two-Folder Setup

Připravte si před workshopem dvě složky:

**Složka A: holé repo**
- Jen zadání projektu (krátký popis úkolu)
- Žádný AGENTS.md
- Žádné kontextové soubory, žádné mantinely, žádný plán
- Agent dostane jednoduchý prompt a driftuje — udělá věrohodná, ale špatná architektonická rozhodnutí.

**Složka B: repo s harnessem**
- Stejné zadání projektu
- AGENTS.md s Goal, Context, Constraints, Done When
- Krátký plán nebo seznam kroků
- Workshop skill nainstalovaný (`harness skill install`)
- Agent dostane stejný prompt a vytvoří zarovnaný výstup.

### Narration flow

1. Nejdřív ukažte Složku A. Spusťte jednoduchý prompt. Nechte agenta viditelně driftovat.
2. Pojmenujte, co vidíte: „Tohle je **task drift**. Agent udělal věrohodná rozhodnutí, ale bez mantinelů se vydal špatným směrem."
3. Ukažte Složku B. Spusťte přesně ten stejný prompt. Nechte agenta vytvořit zarovnaný výstup.
4. Pauza. Zeptejte se místnosti: „Co se změnilo?"
5. Nechte odpovědět dva hlasy, teprve potom to pojmenujte.
6. Doručte tezi: „Prompt se nezměnil. Repo ano."

### Honest failure narration

Když ukazujete Variantu A, explicitně pojmenujte způsob, jakým to selhalo:
- „Agent začal bez mantinelů a udělal věrohodná, ale špatná architektonická rozhodnutí."
- „Tohle se stane v každém repu bez AGENTS.md — agent si doplní mezery vlastními předpoklady."
- Používejte termín **task drift** — přesně pojmenovává ten vzor.

### Tool-specific realities to mention during the demo

- Codex nemá rewind/undo — jakmile agent commitne, musíte zpátky přes git.
- MCP servery vs. skills: jiné balení, stejná myšlenka (strukturované schopnosti).
- Principy jsou tool-agnostic: AGENTS.md funguje s Codexem, Claude Codem, Cursorem i Copilotem.

### Open question

Jestli má `harness` CLI mít `demo-setup` příkaz, který obě složky vygeneruje automaticky.
```

**Alt 2:** Ship Alt 1 verbatim.
**Alt 3:** Ship Alt 1 with `Složka A / Složka B` replaced by `Folder A / Folder B` to match EN naming in the repo (more consistent with code references, less Czech-ified).
**Reasoning:** Alt 1 is the canonical draft. `task drift` stays as loanword per §2/§3. `tool-agnostic`, `rewind/undo`, `MCP servery`, `skills` stay as loanwords per existing workshop code-switching convention. `Goal, Context, Constraints, Done When` kept in English because those are literal `AGENTS.md` section headers and must match the repo. Prefer Alt 1 or Alt 3 depending on whether Folder naming matches repo paths — check the `tracks/` folders to decide.

#### Finding 2.2 — Untranslated EN bullet in Fallbacky (line 72)

**EN:** `**If the live contrast drags: use pre-prepared screenshots. The contrast matters more than live generation.**`
**CS (line 72):** Identical English, unbolded formatting preserved.
**Finding:** Translate to CS.
**Alt 1:** `- **Pokud živý kontrast vázne: použijte připravené screenshoty. Kontrast je důležitější než živé generování.**`
**Alt 2:** `- **Když se živý kontrast táhne: sáhněte po připravených screenshotech. Kontrast je důležitější než živé generování.**`
**Alt 3:** `- **Pokud live kontrast nejede: použijte připravené screenshoty. Na kontrastu záleží víc než na tom, jestli to generujete naživo.**`
**Reasoning:** Alt 1 is the direct translation. Alt 2 is more colloquial (`sáhněte po`). Alt 3 preserves `live` as loanword, which is consistent with other code-switching in the file. Prefer Alt 1.

#### Finding 2.3 — `## Flow (after contrast)` imperatives in `ty` form (lines 56–65)

**EN:** `1. Open Folder B and show … 2. Run \`/plan\` … 3. Briefly show … 4. Let the agent implement … 5. Run \`/review\` and show … 6. Briefly show … 7. Close with this line …`
**CS (lines 56–65):**
> 1. Otevři Folder B a ukaž `README`, `AGENTS.md`, rozpad práce do kroků a způsob kontroly změny.
> 2. Spusť `/plan`, aby agent rozpadl práci na kroky.
> 3. Krátce ukaž, jak se v repu propisuje záměr …
> 4. Nech agenta implementovat malý kus.
> 5. Spusť `/review` a ukaž …
> 6. Krátce ukaž workshop skill …
> 7. Zavři to větou …
**Finding:** Every imperative is `ty` form — style-guide §149 violation across the whole section. Also line 59 contains the `implementovat` reject-list hit (see S6).
**Alt 1 (minimal fix — `vy` form, keep imperative rhythm, resolve `implementovat`):**
> 1. Otevřete Folder B a ukažte `README`, `AGENTS.md`, rozpad práce do kroků a způsob kontroly změny.
> 2. Spusťte `/plan`, aby agent rozpadl práci na kroky.
> 3. Krátce ukažte, jak se v repu propisuje záměr: kde je mapa, kde je další bezpečný krok a kde je vidět, že tenhle repozitář vznikal jako continuation-ready systém.
> 4. Nechte agenta napsat malý kus.
> 5. Spusťte `/review` a ukažte, že kontrola je součást workflow, ne nouzová brzda na konci.
> 6. Krátce ukažte workshop skill:
>    - jak se instaluje přes `harness skill install`
>    - jak z něj plyne první použitelný krok v Codexu nebo v pi
> 7. Zavřete to větou:
>    - „Nástroj sám nestačí. Rozhoduje pracovní systém kolem něj."

**Alt 2:** Same as Alt 1 but with `Folder B` → `Složku B` (Czech gender — pairs with the Finding 2.1 Alt 1 choice; consistency question for signoff).
**Alt 3:** Same as Alt 1 but using subjectless infinitives (`Otevřít`, `Spustit`, `Ukázat` …) which is a third valid Czech stage-direction register, neutral between `vy` and `ty`.
**Reasoning:** Alt 1 is the safest — matches D1/D3 sweep decisions (explicit `vy` form in facilitator runners). Alt 3 is Czech theatre convention and would work in a stage-manager file, but breaks consistency with the rest of `context-is-king.md` which uses `vy`. Prefer Alt 1.

#### Finding 2.4 — Fallbacky imperatives in `ty` form (lines 69–71)

**EN:** `If the CLI is not working: switch to the Codex App. If the App is not working: use the web fallback. If the demo is slow: have a repo snapshot ready after every step.`
**CS (lines 69–71):**
> - Když nefunguje CLI: přejdi na Codex App
> - Když nefunguje App: použij web fallback
> - Když je demo pomalé: měj připravený repo snapshot po každém kroku
**Finding:** Three `ty` imperatives in three bullets — §149 violation, same pattern as Finding 2.3.
**Alt 1:**
> - Když nefunguje CLI: přejděte na Codex App.
> - Když nefunguje App: použijte web fallback.
> - Když je demo pomalé: mějte připravený repo snapshot po každém kroku.
**Alt 2:**
> - CLI nejede → Codex App.
> - App nejede → web fallback.
> - Demo se vleče → repo snapshot po každém kroku musíte mít po ruce.
**Alt 3:**
> - Když nefunguje CLI, sáhněte po Codex Appu.
> - Když nefunguje Codex App, sáhněte po web fallbacku.
> - Když se demo vleče, mějte po ruce repo snapshot po každém kroku.
**Reasoning:** Alt 1 is the minimal fix — add final `.` on each bullet (the EN bullets end with periods), fix `vy`. Alt 2 is the tightest stage-manager shorthand with arrows — fine in a facilitator file but changes rhythm noticeably. Alt 3 uses `sáhnout po` twice which is too much. Prefer Alt 1.

#### Finding 2.5 — Line 65 (closing line quote): wrong closing-quote character

**EN:** `"The tool alone is not enough. The working system around it is what decides."`
**CS (line 65):** `„Nástroj sám nestačí. Rozhoduje pracovní systém kolem něj."`
**Finding:** The opening quote is `„` (Czech low-9) but the closing quote is `"` (straight ASCII) instead of `"` (Czech high-left — `U+201C`). Czech typography uses `„…"` as the canonical pair. This is a deterministic typography issue that the copy-editor Layer 1 should have caught — flag for the typography sweep.
**Alt 1:** `„Nástroj sám nestačí. Rozhoduje pracovní systém kolem něj."`
**Alt 2:** Same content, re-typed through the typography hook to ensure all quotes are Czech pairs.
**Alt 3:** (n/a — this is purely typographic)
**Reasoning:** Also applies to line 32 (`"This is task drift. …"` inside the untranslated block — that will be fixed when 2.1 is translated). Run Layer 1 across the whole file after the translation lands.

#### Finding 2.6 — `## Pointa pro místnost` closing has nominal bloat and a false friend

**EN:** `The point is not to show "a magic result." The point is to show how fast quality grows once you add context, a plan, review, and a repository built so that work can actually be continued.`
**CS (line 83):** `Nejde o to ukázat „kouzelný výsledek". Jde o to ukázat, jak rychle roste kvalita, když přidáme kontext, plán, review a repozitář postavený tak, aby se v něm dalo pokračovat.`
**Finding:** Two issues. **(a)** `repozitář postavený tak, aby se v něm dalo pokračovat` is a nominal chain that translates EN's `a repository built so that work can actually be continued` literally. In Czech it reads as translation. **(b)** Closing-quote character on `výsledek".` is straight ASCII — same typography issue as Finding 2.5. **(c)** The `kouzelný výsledek` phrasing is slightly literal — EN `magic result` is common idiom, CS `kouzelný výsledek` is not, `zázračný výsledek` or `magický výsledek` is more idiomatic.
**Alt 1:** `Nejde o to ukázat „zázračný výsledek". Jde o to ukázat, jak rychle roste kvalita, když přidáte kontext, plán, review a repo, ve kterém se dá pokračovat.`
**Alt 2:** `Nejde o to ukázat „magický výsledek". Jde o to, jak rychle kvalita roste, když přidáte kontext, plán, review a repo, které je postavené pro pokračování.`
**Alt 3:** `Nejde o to ukázat „kouzlo". Jde o to ukázat, jak rychle roste kvalita, jakmile přidáte kontext, plán, review a repo, ve kterém se dá navázat.`
**Reasoning:** Alt 1 fixes all three issues minimally and tightens `repozitář postavený tak, aby se v něm dalo pokračovat` → `repo, ve kterém se dá pokračovat` (slovesná vazba, one level less nominal). Alt 2 preserves `postavené pro pokračování` which is still nominal. Alt 3 uses `kouzlo` alone which drops `result` (the contrast EN makes). Prefer Alt 1. Also change `přidáme` → `přidáte` (vy-form, consistency with the rest of the file).

#### Finding 2.7 — `## Co explicitně neukazovat` (lines 76–79): list is fine but formatting drops a `repo → ve kterém`

**EN:** `- five different modes of working / - a complicated feature tour / - long waiting for generation / - a demo disconnected from the repository the workshop is running in`
**CS (lines 76–79):**
> - pět různých režimů práce
> - složitou přehlídku funkcí
> - dlouhé čekání na generování
> - demo odtržené od repa, ve kterém právě workshop běží
**Finding:** Clean, no fix needed. Flagging only: `pět různých režimů práce` — the D1 review's systemic finding was that `režim` should be `mód` where it maps to an agent mode, but here it refers to *ways of working*, not workshop modes. Keep as-is. ✅

---

## Summary

- **Total findings: 16** (10 in `context-is-king.md`, 6 in `codex-demo-script.md`) plus 6 systemic findings (S1–S6).
- **Findings per file:**
  - `context-is-king.md`: 10 findings, all style/register polish. **Zero** `ty` leaks, **zero** §5 violations, **all** protected phrases intact, **all** §3 canonical loanwords present. This file is in good shape and the drift-alignment commit `cdce18c` held up; the only substantive content issue is Finding 1.2 (engine/chassis rewrite diverged from EN canonical, dropping `survivable` and adding the "non-professional driver" claim).
  - `codex-demo-script.md`: 6 findings on top of the systemic translation debt. **This file is not ready to ship.** About 40 % of the content is still English, and the Czech portions that exist are written in `ty` form throughout. It was clearly started as a locale split and never completed.

### Top 3 highest-impact findings

1. **S1 + Finding 2.1 — `codex-demo-script.md` untranslated EN block** (lines 13–52). The entire `Repo-Readiness Contrast` section plus the `Tool-specific realities` bullets are English-only and must be translated before D7 can close. This is the largest content debt in the whole D-phase and probably a 20–30 minute write. See Finding 2.1 Alt 1 for a ready-to-land draft.
2. **S2 + Findings 2.3, 2.4 — `codex-demo-script.md` `ty` form throughout Flow and Fallbacky.** Every imperative in the two surviving CS sections uses `ty`. This is the same systemic pattern D1 flagged in `opening.cs.facilitatorRunner` and D5 flagged in several phase runners. Needs a full sweep of the `vy` fix once Finding 2.1 lands, so both passes happen together.
3. **Finding 1.2 — `context-is-king.md` engine/chassis rewrite drifted from EN canonical.** The drift-alignment rewrite (`cdce18c`) compressed the EN analogy but dropped `survivable` (the safety-frame property) and added a "non-professional driver" claim the EN canonical never makes. This is the only case in the two talk files where the CS version teaches a slightly different point than the EN version, which puts the two sides out of drift-alignment in the opposite direction from what D1 was fixing. See Finding 1.2 Alt 3 for a fix that preserves the facilitator color while restoring `přežitelnost` and removing the drift.
