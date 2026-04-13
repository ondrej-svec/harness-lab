# Czech Review — Mode A Scene Cards

**Date:** 2026-04-13
**Scope:** The 10 highest-stakes scenes in `workshop-content/agenda.json`. Each card has the English source, the current Czech, drift notes, style-guide findings, and 2–3 alternative rewrites per block with reasoning. You walk the cards, pick one option per block (or compose a hybrid), flip `cs_reviewed: true` per scene.

**Supersedes** the 2026-04-12 Layer 2 sweep on the `ty`/`vy` question. That memo recommended keeping `ty` in personal scenes. **That was wrong.** `content/style-guide.md` line 149-151 explicitly mandates lowercase `vy` for "slides, callouts, participant view, facilitator notes, briefs" — i.e. everything in `agenda.json`. This memo normalises to `vy` across the board.

---

## The pattern that runs through everything

The English source uses "you" throughout. English "you" is both singular and plural; the translator had to pick one Czech form per scene. They picked `ty` in ~14 scenes and `vy` in the rest. The style guide says all of these should be `vy`. So the dominant review output is a systematic `ty` → `vy` normalization, not 6 ad-hoc consistency fixes.

**Beyond `ty`→`vy`**, the secondary findings across the agenda are:

- **English eyebrows in the opening phase.** `opening-day-arc`, `opening-day-schedule`, `opening-team-formation`, `opening-handoff` all have `en.eyebrow == cs.eyebrow == English string`. Translation oversight. Every other phase has Czech eyebrows.
- **Minor meaning drift** in a few bodies where the Czech dropped or shifted a concrete word. Noted per scene where relevant.
- **The `build-1-return-to-proof` / `build-2a-return-to-proof` clarity gap** (three places not enumerated) flagged in the earlier memo — still applies, unchanged.
- **"board" vs "plátně" inconsistency.** `opening-handoff` says "na boardu" (board loanword). Intermezzo scenes say "na plátně" (Czech screen). Unify to `plátně`.

**What I did NOT find** (the good news): no reject-list hits, no nominal chains, no AI fingerprints, no corporate pattern. The prose itself is in voice. The issues are all addressing-form and a few oversights.

---

## Top-10 selection rationale

I picked scenes where my judgment adds the most value: first-impression scenes (opening), emotional beats (rotation, reveal), style-guide violations (any `ty` scene), and ritual/meme-able moments (lunch). I skipped scenes that are facilitator-heavy (the talks), where the facilitator explains live and small text matters less, and scenes that are already consistent `vy` and clean.

| # | Scene | Why top-10 |
|---|---|---|
| 1 | `opening / opening-framing` | First hero the room sees. Voice-setting. Currently `ty`. |
| 2 | `opening / opening-day-arc` | Four-word slogan. Meme-able. Infinitive vs imperative question. |
| 3 | `opening / opening-team-formation` | Active imperative trio, sets room physics. Currently `ty`. |
| 4 | `opening / opening-handoff` | Short, high-visibility transition. Currently `ty`. "board" vs "plátně". |
| 5 | `demo / demo-same-prompt` | The "task drift" reveal. Three blocks, high narrative stakes. |
| 6 | `lunch-reset / lunch-back-at` | Ritual moment. Simple but participant-read. Already `vy`, safe to polish. |
| 7 | `rotation / rotation-not-yours-anymore` | Emotional gut-punch. Currently `ty`. |
| 8 | `reveal / reveal-show-us` | Five minutes per team. Currently `ty` in title, `vy` in body. |
| 9 | `reveal / reveal-one-thing` | Personal commitment. Longest scene. **Entirely `ty`** — biggest mechanical lift. |
| 10 | `reveal / reveal-go-use-it` | Closing. **Oscillates `ty`→`vy`→`ty`.** Must be one voice. |

The other 27 scenes are either already clean `vy` (and just need a read-through) or are facilitator-tool scenes where small Czech voice variance matters less. The end of this memo has a short "bulk ty→vy" action list for the remaining scenes where the only issue is addressing form.

---

# Scene cards

## 1. `opening / opening-framing` — the first hero

**EN source:**
- Title: "Today you learn to shape the work so anyone — or any agent — can carry it"
- Body: "That's the craft underneath all the agent hype. Not better prompts. Not faster typing. A repo, a workflow, a context that carries the next move without you standing over it. By tonight you'll have built one with your hands, handed it to another team, and seen what survives. Monday morning, you'll open your editor and know what to build differently."

**Current Czech:**
- Title: "Dnes se naučíš tvarovat práci tak, aby ji zvládl převzít kdokoli – i agent"
- Body: "To je to řemeslo pod veškerým hypem kolem agentů. Nejde o lepší prompty. Nejde o rychlejší psaní. Jde o repo, workflow a kontext, který unese další krok i bez tebe. Do večera takový systém postavíš vlastníma rukama, předáš ho jinému týmu a uvidíš, co přežije. V pondělí ráno otevřeš editor a budeš vědět, co dělat jinak."

**Findings:**
- **Style guide violation**: `ty` form throughout (`naučíš`, `bez tebe`, `postavíš`, `otevřeš`). Must be `vy`.
- **Minor drift**: EN says "know what to **build** differently" — CS says "co **dělat** jinak". "Build" is more concrete; "dělat" is more abstract. Restoring "build" is worth it because the hero body is about building.
- **Rhythm**: the CS is actually strong — three short "nejde o" sentences, then two longer action sentences. Good.

### Title — alternatives

- **(A)** "Dnes se naučíte tvarovat práci tak, aby ji zvládl převzít kdokoli – i agent"
  - Plain `ty`→`vy` conversion. Preserves rhythm. **My default pick.**
- **(B)** "Dnes se naučíte tvarovat práci, kterou zvládne převzít kdokoli – i agent"
  - Replaces "tak, aby ji zvládl převzít" with "kterou zvládne převzít". Two words shorter, tighter. "Kdokoli – i agent" punch preserved.
- **(C)** "Dnes se naučíte tvarovat práci, aby ji mohl převzít kdokoli – i agent"
  - "Mohl" instead of "zvládl" — softer, less effortful. Lose a bit of the "carries it" weight. Not as strong.

**Reasoning on the tradeoff:** The EN "can carry it" implies capability under load; "zvládl" carries that. (A) or (B) both work; (B) is tighter but loses the exact "so anyone can carry it" phrasing. **Lean A.**

### Body — alternatives

- **(A)** Full `ty`→`vy` conversion, keep "co dělat jinak":
  > "To je to řemeslo pod veškerým hypem kolem agentů. Nejde o lepší prompty. Nejde o rychlejší psaní. Jde o repo, workflow a kontext, který unese další krok i bez vás. Do večera takový systém postavíte vlastníma rukama, předáte ho jinému týmu a uvidíte, co přežije. V pondělí ráno otevřete editor a budete vědět, co dělat jinak."

- **(B)** Same conversion, restore "build" semantic:
  > "…V pondělí ráno otevřete editor a budete vědět, co **postavit jinak**."
  - Preserves the "build" echo from the title. More concrete. **My pick for the last sentence.**

- **(C)** Same conversion, tighten "bez vás":
  > "…Jde o repo, workflow a kontext, který unese další krok **sám**."
  - Replaces "i bez vás" with "sám" (alone). Shorter, more punch. But loses the "you don't have to stand over it" nuance. I wouldn't go this far.

**Read-aloud note:** Read the body aloud slowly. The rhythm is 5 short beats ("Nejde o lepší prompty. Nejde o rychlejší psaní. Jde o repo, workflow a kontext, který unese další krok sám.") then two longer landing sentences. The rhythm works in both `ty` and `vy`. `vy` adds one syllable per verb, but the lengths balance out.

**Recommended pick:** Title (A), Body (A) with the last sentence from (B) ("co postavit jinak").

---

### Callouts

**Callout 1 — "Hlavní věta pro dnešek":**

EN body: "We are not learning to prompt better. We are learning to build a working system that carries the next move — whether the next reader is a teammate who joined today or a fresh agent you open on Monday."

CS: "Neučíme se lépe promptovat. Učíme se stavět pracovní systém, který unese další krok – ať už ho čte kolega, který dorazil dnes, nebo čerstvý agent, kterého **v pondělí otevřeš** ve vlastním repu."

- **`ty`→`vy`**: "kterého v pondělí **otevřete** ve vlastním repu"
- That's the only fix. The rest is clean.

**Callout 2 — "Co se dnes má změnit":**

EN body: "Monday morning you open a fresh agent in your own repo. That agent arrives without your memory. What you practice today is how you treat every session — not once, for every session."

CS: "V pondělí ráno **otevřeš** čerstvého agenta ve vlastním repu. Ten agent nemá žádnou **tvoji** paměť. To, co dnes trénujeme, je způsob, jakým **přistupuješ** ke každé session – ne jednou, ale pokaždé."

- **`ty`→`vy`**: "otevřete", "vaši", "přistupujete".
- No drift. Clean.

---

## 2. `opening / opening-day-arc` — the day's slogan

**EN source:**
- Eyebrow: "The day has one arc" ← **English!**
- Title: "Learn. Build. Hand off. Continue."
- Body: "This is not a prompting contest. It is a day where you will learn the craft, build something real, hand it to another team, and watch what continues without you."

**Current Czech:**
- Eyebrow: "The day has one arc" ← **same English, not translated**
- Title: "Učit se. Stavět. Předat. Pokračovat."
- Body: "Tohle není soutěž v promptování. Je to den, kdy se **naučíš** řemeslo, **postavíš** něco reálného, **předáš** to jinému týmu a **budeš** sledovat, co přežije i bez tebe."

**Findings:**
- **English eyebrow** — translate it. See alternatives below.
- **Title choice**: infinitive vs imperative. English "Learn. Build. Hand off. Continue." is imperative. Czech "Učit se. Stavět. Předat. Pokračovat." is infinitive ("to learn, to build..."). Both forms exist in Czech headline-speak. Infinitive is more abstract; imperative is more direct. The day-arc is a promise — could go either way. I lean imperative.
- **`ty`→`vy`** in body.

### Eyebrow — alternatives

- **(A)** "Den má jeden oblouk" — literal. Keeps the metaphor.
- **(B)** "Jeden oblouk přes celý den" — shifts the emphasis, "one arc across the whole day". Slightly more elegant.
- **(C)** "Celý den má jeden tvar" — replaces "oblouk" (arc) with "tvar" (shape). Less specific, more idiomatic Czech.

**Lean (A).** "Oblouk" is a fine word; the metaphor is worth keeping because it echoes "craft" and "build".

### Title — alternatives

- **(A)** Keep infinitive: "Učit se. Stavět. Předat. Pokračovat."
  - Already in the file. Czech-natural for slogans.
- **(B)** Switch to imperative `vy`: "Naučte se. Postavte. Předejte. Pokračujte."
  - Direct, commanding. Matches EN better. But reads slightly longer (4 syllables more) and has the slightly-uncomfortable "Naučte se" plural.
- **(C)** Mixed: "Učit se. Postavit. Předat. Pokračovat." (all infinitive, "postavit" instead of "stavět")
  - "Postavit" is perfective (finished action) vs "stavět" (ongoing). The day's arc is about *finishing* a build, so "postavit" is arguably more accurate.

**My lean: (C)** — infinitive form but "postavit" (finished) instead of "stavět" (ongoing). Reasoning: the day's arc is "learn → finish a build → hand it off → keep going". "Postavit" lands the finish.

### Body — alternatives

- **(A)** Plain `ty`→`vy`: "Tohle není soutěž v promptování. Je to den, kdy se **naučíte** řemeslo, **postavíte** něco reálného, **předáte** to jinému týmu a budete sledovat, co přežije i bez vás."
- **(B)** Tighten the ending: "...a **uvidíte**, co přežije i bez vás."
  - "Uvidíte" (you'll see) is tighter than "budete sledovat" (you'll watch). Drops one auxiliary.
- **(C)** Replace "Tohle není soutěž v promptování" with a shorter opener: "Tohle není promptovací soutěž."
  - Shorter, but "promptovací" is an adjective that Czech ear may find slightly awkward. Stick with (A)/(B) opener.

**Recommended pick:** Eyebrow (A). Title (C). Body (B).

---

## 3. `opening / opening-team-formation` — room physics

**EN source:**
- Eyebrow: "Your team" ← **English**
- Title: "Form the line. Count off. Claim your anchor."
- Body: "Nine minutes. This is how we form teams for the day — by experience line and count-off, the same mechanic we'll use again at rotation after lunch."

**Current Czech:**
- Eyebrow: "Your team"
- Title: "Postav se do řady. Odpočítej se. Zaber si kotvu." (ty)
- Body: "Devět minut. Takhle si dnes tvoříme týmy – podle řady zkušeností a odpočítávání. Stejný mechanismus použijeme znovu při rotaci po obědě."

**Findings:**
- English eyebrow
- Title `ty` imperatives
- Body is 1st-person plural ("tvoříme"), fine
- "Mechanismus" is slightly technical; "postup" is softer

### Eyebrow — alternatives

- **(A)** "Váš tým" (literal, vy)
- **(B)** "Vaše trojice" / "Vaše čtyřka" — too committed to a team size
- **(C)** "Formace týmu" — nominal, avoid

**Lean (A).** "Váš tým" is the literal peer-tone translation.

### Title — alternatives

- **(A)** `ty`→`vy`: "Postavte se do řady. Odpočítejte se. Zaberte si kotvu."
  - Four-syllable bump on "Postavte se" but still reads clean. The three-beat rhythm holds.
- **(B)** Tighten to two beats: "Do řady. Odpočítejte se. Ke kotvě."
  - Drops the verb on the first and third. Very terse. Works for a signage-style hero. Might feel too imperative/staccato for a voice-reading.
- **(C)** "Stoupněte si do řady. Odpočítejte se. Vezměte si kotvu."
  - "Stoupněte si" (stand up in line) instead of "Postavte se" (form the line). Slightly more physical. "Vezměte si" (take one) instead of "Zaberte si" (claim/grab).

**Lean (A).** The three beats need verb on each to match EN punch. "Postavte se / Odpočítejte se / Zaberte si" has the right rhythm. `Zaberte si` is perfect Czech colloquial for "claim/grab".

### Body — alternative

- **(A)** Keep as is, only soften "mechanismus": "...Stejný **postup** použijeme znovu při rotaci po obědě."
- **(B)** Keep "mechanismus" — it's accurate for a mechanical process.

**Lean (A).** "Postup" is softer and more Czech-natural. "Mechanismus" is a loanword that fits but feels a touch technical for a participant-facing body.

---

## 4. `opening / opening-handoff` — transition to talk

**EN source:**
- Eyebrow: "Next" ← **English**
- Title: "Your team is on the board. Look up."
- Body: "Next: the talk. We start by naming the craft underneath all the agent hype."

**Current Czech:**
- Eyebrow: "Next"
- Title: "Tým máš na boardu. Dívej se nahoru." (ty, "boardu")
- Body: "Další krok: talk. Začínáme tím, že pojmenujeme řemeslo pod veškerým hypem kolem agentů."

**Findings:**
- English eyebrow
- `ty` imperative
- "Na boardu" vs "na plátně" inconsistency — intermezzo scenes use "plátně", opening uses "board"

### Eyebrow — alternatives

- **(A)** "Další" (next)
- **(B)** "Pokračujeme" (we continue)
- **(C)** "Dál" (onward) — ultra-short, punchy

**Lean (A) or (C).** Both are clean. "Dál" is more colloquial and matches the one-word EN "Next" punch.

### Title — alternatives

- **(A)** `ty`→`vy` + board → plátně: "Váš tým je na plátně. Podívejte se nahoru."
- **(B)** Keep "board": "Váš tým je na boardu. Podívejte se nahoru."
  - "Board" is workshop vocabulary across the product. Acceptable.
- **(C)** Restructure: "Podívejte se nahoru. Váš tým je na plátně."
  - Leads with the action, explains why second. More imperative-first.

**Lean (A) or (C).** "Plátně" matches the other scenes. The word "board" is OK as a loanword but inconsistent with the rest of agenda.json.

### Body — alternative

- **(A)** Keep as is, change nothing: "Další krok: talk. Začínáme tím, že pojmenujeme řemeslo pod veškerým hypem kolem agentů."
  - Already clean `vy` (implied). "Talk" is fine as a loanword.
- **(B)** Tighten: "Teď talk. Začínáme tím, že řemeslu pod veškerým hypem dáme jméno."
  - "Dáme jméno" (give it a name) is more active than "pojmenujeme" (we name). Slight nuance: jméno→name is a slight softening.

**Lean (A).** Don't break what works.

---

## 5. `demo / demo-same-prompt` — the task drift reveal

**EN source:**
- Title: "Same prompt. Two repos. Watch what happens."
- Body: "I'm going to run the same simple prompt in two repos — one bare, one with a harness. Same words. Same model. Watch what changes."

**Current Czech:**
- Title: "Stejný prompt. Dvě repa. Sledujte, co se stane."
- Body: "Spustím stejný jednoduchý prompt ve dvou repech – jedno holé, jedno s harnessem. Stejná slova. Stejný model. Sledujte, co se změní."

**Findings:**
- Already clean `vy`
- Rhythm is excellent — three short sentences, one longer action sentence, two short.
- The three callouts below need attention: one "task drift" reveal, one "prompt didn't change" landing, both currently fine but worth polish.

### Title — already good

**Leave as is.** The title is already strong Czech. "Stejný prompt. Dvě repa. Sledujte, co se stane." matches the EN rhythm beat for beat.

### Body — alternatives

- **(A)** Leave as is.
- **(B)** Tighten "jeden holé, jedno s harnessem" → "jedno holé, druhé s harnessem"
  - "Druhé" (second) is more natural than "jedno... jedno" when pairing two things.

**Lean (B)** for the "druhé" tweak.

### Callout 1 — "To byl task drift" — alternatives

EN body: "The agent started without constraints and made plausible but wrong decisions. Without a harness, it filled in the blanks with its own assumptions. This is what happens in every repo without AGENTS.md. It has a name: task drift. Once you can name it, you can build for it."

CS body: "Agent začal bez constraints a udělal věrohodná, ale špatná rozhodnutí. Bez harnessu si prázdná místa vyplnil vlastními předpoklady. Přesně tohle se děje v každém repu bez AGENTS.md. Má to jméno: task drift. **Jakmile to umíš pojmenovat, umíš to i ošetřit**."

- **Finding:** `ty` in the closing sentence ("umíš", "umíš"). Convert to `vy`.

- **(A)** Plain conversion: "Jakmile to **umíte** pojmenovat, **umíte** to i ošetřit."
- **(B)** Tighter: "Když to umíte pojmenovat, zvládnete to i ošetřit."
  - "Zvládnete" is slightly softer than "umíte" for the second clause. Variation.
- **(C)** Reframe: "Pojmenování je první krok ošetření." (one sentence, naming is nominal → bad)
  - Don't do (C). It nominalises.

**Lean (A).**

### Callout 2 — "Prompt se nezměnil" — already good

CS: "Stejná slova, stejný model, jiný harness, jiný výsledek. Celý dnešek za třicet vteřin."

- Clean parallel construction. No findings. Keep as is.

---

## 6. `lunch-reset / lunch-back-at` — ritual moment

**EN source:**
- Title: "Back at [return-time]"
- Body: "Eat. Walk. Breathe. See you at [return-time] sharp."

**Current Czech:**
- Title: "Zpět v [return-time]"
- Body: "Najezte se. Projděte se. Nadechněte se. Vidíme se v [return-time] přesně."

**Findings:**
- Already clean `vy`.
- Three short imperatives land well.
- The only polish question is whether "přesně" (exactly/sharp) or "na minutu" (to the minute) punches harder at the end.

### Body — alternatives

- **(A)** Keep as is.
- **(B)** Tighter ending: "Vidíme se v [return-time]."
  - Drop "přesně". Less emphatic but cleaner.
- **(C)** Punchier ending: "V [return-time] začínáme."
  - "We start at X." Reframes from "see you" to "we start". More imperative.

**Lean (A).** The current form is warm and specific. Don't over-polish a working scene.

### Callout — already good

CS: "Kdyby vám vypadla hlavní věta rána. **Lidé řídí. Agenti vykonávají.** – Ryan Lopopolo, OpenAI Frontier & Symphony"

Perfect. The quote is the emotional anchor and it's correctly attributed.

---

## 7. `rotation / rotation-not-yours-anymore` — the emotional gut-punch

**EN source:**
- Title: "Your repo is not yours anymore"
- Body: "For the rest of the day, you are working in the repo another team built this morning. Another team is working in yours. Everything you left in the repo at lunch is everything the new team has."

**Current Czech:**
- Title: "Tvoje repo už není tvoje" (ty)
- Body: "Po zbytek dne pracujete v repu, které postavil jiný tým ráno. Jiný tým pracuje ve vašem. Všechno, co jste v obědě nechali v repu, je všechno, co nový tým má."

**Findings:**
- **The scene has a ty/vy split inside itself**: title is `ty` ("tvoje... tvoje"), body is `vy` ("pracujete / ve vašem / jste nechali"). Already inconsistent.
- Style guide → `vy` throughout.
- Body is good otherwise.

### Title — alternatives

- **(A)** `vy`: "Vaše repo už není vaše."
  - Plain conversion. Loses a bit of the gut-punch intimacy that `ty` gave, but matches style guide and the rest of the scene.
- **(B)** Passive/impersonal: "Vaše repo už nepatří vám."
  - "Belongs to you no more" — slightly more poetic, similar punch.
- **(C)** Inverted: "To repo už není vaše."
  - "That repo is no longer yours." The demonstrative "to" adds distance (pointing at it as if from outside). Close to the sentiment.

**Lean (A).** Keeps the direct "your repo is not yours" punch. Native Czech will feel the gut-punch even in `vy`.

### Body — already `vy`, keep as is

"Po zbytek dne pracujete v repu, které postavil jiný tým ráno. Jiný tým pracuje ve vašem. Všechno, co jste v obědě nechali v repu, je všechno, co nový tým má."

Good. **Minor polish:** "v obědě" is slightly awkward — better "před obědem" (before lunch) or "o obědě" (at lunch). Actually "v obědě" is valid colloquial Czech for "during the lunch interval". Keep if authentic; swap to "před obědem" if formal.

### Callout — "Není to podraz. Je to test."

EN body: "The opening said you would hand off and inherit. Lunch was the gate. Whatever you left in the repo at noon is everything the new team has. Whatever is still in your heads — they will never hear it. This is what we practiced for."

CS body: "Úvod řekl, že budete předávat a přebírat. Oběd byl brána. Cokoli jste v poledne nechali v repu, je všechno, co nový tým má. Cokoli vám zůstalo v hlavě – oni to nikdy neuslyší. Na tohle jsme trénovali."

Clean `vy`. **One drift note:** EN says "Whatever is still in **your heads**" (plural heads) → CS says "Cokoli vám zůstalo v hlavě" (singular "v hlavě", "in head"). The singular is actually idiomatic Czech — "to mám v hlavě" is more natural than "v hlavách". Keep.

**No changes needed on this callout.** The title already lands: "Není to podraz. Je to test."

---

## 8. `reveal / reveal-show-us` — the demo moment

**EN source:**
- Title: "Show us what you built"
- Body: "Five minutes per team. Share your screen. Run what runs. Walk the repo."

**Current Czech:**
- Title: "Ukaž, co jsi postavil" (ty)
- Body: "Pět minut na tým. Sdílejte obrazovku. Spusťte, co běží. Projděte repo." (vy)

**Findings:**
- Title `ty`, body `vy`. **Inconsistent.** Body is the team action; body `vy` is correct. Title should be `vy`.

### Title — alternatives

- **(A)** Plain `vy`: "Ukažte, co jste postavili."
  - Matches body. Plural "postavili" because the team collectively built it.
- **(B)** Tighter: "Ukažte, co máte."
  - "Show us what you have." Shorter, less specific.
- **(C)** Leading with the outcome: "Ukažte výsledek."
  - "Show the result." Very terse.

**Lean (A).** Don't lose "postavili" — the day is about building.

### Body — already good. Leave as is.

### Callout — already good

"Dvacet minut v 1-2-4-All jste trávili tím, že jste zjistili, co jste se naučili. Demo není o hledání slov – ta už máte. Je o ukázání té věci, na kterou slova míří."

Clean `vy`. "Ukázání" is nominal but idiomatic; not worth rewriting. **Leave.**

---

## 9. `reveal / reveal-one-thing` — the commitment moment

**This is the biggest scene to fix.** Title, body, and all four callouts are `ty`. It's also the scene with the highest personal-commitment weight — getting the voice right here matters most.

**EN title:** "The one thing you'll change"
**CS title:** "Jedna věc, kterou změníš" (ty)

**EN body:** "One sentence. Specific enough that you could tell, a week from now, whether you actually did it."
**CS body:** "Jedna věta. Dost konkrétní na to, abys za týden poznal, jestli jsi ji opravdu udělal." (ty)

### Title — alternatives

- **(A)** `vy`: "Jedna věc, kterou změníte."
  - Plain conversion. "Změníte" (you-plural will change).
- **(B)** With emphasis: "Jedna věc, kterou od zítřka změníte."
  - "From tomorrow." Adds the when-it-starts. More concrete.
- **(C)** Reframe as a decision: "Jedna věc k rozhodnutí."
  - "One thing to decide." Loses the "change" verb. Less committal.

**Lean (A).** Keep the punch, matches EN exactly.

### Body — alternatives

- **(A)** Plain `vy`: "Jedna věta. Dost konkrétní na to, **abyste** za týden **poznali**, jestli jste ji opravdu udělali."
- **(B)** Tighter: "Jedna věta. Dost konkrétní, abyste za týden věděli, jestli jste ji udělali."
  - Drops "poznali" (recognize) for "věděli" (know). Cleaner.
- **(C)** Recast as a check: "Jedna věta. Za týden se podíváte – a buď jste ji udělali, nebo ne."
  - More narrative, less imperative. Longer. Changes the voice.

**Lean (A) or (B).** (B) is tighter but (A) preserves the "recognize/tell" nuance from EN "could tell".

### Callout 1 — "Čtyři možnosti – vyber jednu"

**This is a long multi-line callout.** EN:

> Pick whichever actually fits how you work: (1) The workshop skill on your machine — save the commitment with the skill's notes command; it lives with the skill you just practiced. (2) A physical card — we handed these out at the start of Reveal. (3) An email to yourself — send it now; it lands in your inbox tonight with today's context still fresh. (4) Wherever you already keep your own notes. Pick one. Do not pick none.

CS currently (all `ty`):

> Vyber tu, která sedí na tvůj styl práce: (1) Workshop skill na tvém stroji – ulož závazek přes notes command skillu; žije s nástrojem, který jsi právě používal. (2) Fyzická kartička – rozdali jsme je na začátku Revealu. (3) E-mail sám sobě – pošli ho teď; večer ti přistane do schránky s čerstvým kontextem dneška. (4) Kamkoli, kde si už vedeš vlastní poznámky. Vyber jednu. Nevybírat není varianta.

- **(A)** Straight `ty`→`vy`:

  > Vyberte tu, která sedí na váš styl práce: (1) Workshop skill na vašem stroji – uložte závazek přes notes command skillu; žije s nástrojem, který jste právě používali. (2) Fyzická kartička – rozdali jsme je na začátku Revealu. (3) E-mail sobě samému – pošlete ho teď; večer vám přistane do schránky s čerstvým kontextem dneška. (4) Kamkoli, kde si už vedete vlastní poznámky. Vyberte jednu. Nevybírat není varianta.

  - "E-mail sám sobě" → "E-mail sobě samému" is more grammatically correct but slightly stiffer. Alternative: just "E-mail sobě" — shorter and colloquial.

- **(B)** Minor tightening of the opener: "Vyberte tu, která vám sedí: (1)..."
  - "Která vám sedí" (that suits you) drops "na váš styl práce" (to your style of work). Shorter but loses the "how you actually work" nuance from EN.

**Lean (A)** with "E-mail sám sobě" → "E-mail sobě" for colloquial punch.

### Callout 2 — "Dost konkrétní, abys to mohl zkontrolovat" (warning tone)

CS: "Ne: „Budu s agenty pracovat líp." Ano: „Až příště začnu úkol s agentem, napíšu Goal, Context, Constraints a Done-When do AGENTS.md dřív, než do promptu napíšu cokoli." Když za týden **nepoznáš**, jestli **jsi** to udělal, věta ještě není dost konkrétní.

- **Note:** The two quoted examples (`"Budu s agenty..."` and `"Až příště začnu..."`) are first-person singular (participant speaking). **Leave them in first-person.**
- **Fix:** title and frame text → `vy`:
  - Title: "Dost konkrétní, abyste to mohli zkontrolovat."
  - Frame: "Když za týden nepoznáte, jestli jste to udělali, věta ještě není dost konkrétní."

**No alternatives needed — this is a straight conversion.**

### Callout 3 — "Nezávislé na nástroji"

CS: "Všechno, co **jsi** dnes **trénoval**, funguje s jakýmkoli coding agentem..."

- Straight conversion: "Všechno, co **jste** dnes **trénovali**, funguje s jakýmkoli coding agentem..."

**No alternatives needed.**

---

## 10. `reveal / reveal-go-use-it` — closing

**This is the biggest voice-consistency fix in the whole agenda.**

**EN source:**
- Title: "Go use it"
- Body: "This is where my part ends and yours continues. You built something today that a stranger continued without you — that was the test, and you passed. The craft you practiced is yours. I won't be in the room next time you open an agent session — but everything you need is already in your hands."

**Current Czech:**
- Title: "Jdi a použij to" (ty)
- Body: "Tady moje část končí a **vaše** pokračuje. **Postavili jste** dnes něco, v čem cizinec pokračoval **bez vás** – to byl test a **vy jste ho prošli**. Řemeslo, které **jste trénovali**, je vaše. Nebudu u toho, až příště **otevřeš** session s agentem – ale všechno, co **potřebuješ**, už **máš** v rukou."

**Findings:**
- Title `ty` ("Jdi", "použij")
- First half of body `vy` ("vaše pokračuje", "Postavili jste", "bez vás", "vy jste ho prošli", "jste trénovali", "je vaše")
- Second half of body `ty` ("otevřeš", "potřebuješ", "máš")
- **This oscillation is the worst in the agenda.** Must be unified.

### Title — alternatives

- **(A)** `vy`: "Jděte a použijte to."
  - Sounds slightly wooden in Czech. Not terrible but not elegant.
- **(B)** Simpler: "Použijte to."
  - Just "use it". Loses the "go" direction.
- **(C)** Reframe: "A teď vy." ("And now you.")
  - Very short. Very punchy. Says "it's your turn" implicitly. But doesn't literally say "use it".
- **(D)** Reframe: "Odneste si to."
  - "Take it with you." Idiomatic Czech for "carry this forward". Warmer than (A).

**Lean (D).** "Odneste si to" is the most natural Czech closing gesture. It says "take this with you" and doesn't fight with Czech imperative form.

### Body — alternatives (all body `vy`)

- **(A)** Direct `vy`:

  > "Tady moje část končí a vaše pokračuje. Postavili jste dnes něco, v čem cizinec pokračoval bez vás – to byl test a prošli jste ho. Řemeslo, které jste trénovali, je vaše. Nebudu u toho, až příště **otevřete** session s agentem – ale všechno, co **potřebujete**, už **máte** v rukou."

  - Minimal change. Removes the ty→vy→ty oscillation.

- **(B)** Same but tighten "vy jste ho prošli" → "prošli jste ho":

  > "...to byl test a prošli jste ho. Řemeslo, které jste trénovali, je vaše."

  - Drops the emphasised "vy". Less theatrical. Reads as confident statement, not declaration.

- **(C)** Rewrite the closing sentence for extra punch:

  > "Nebudu u toho, až příště otevřete session s agentem. Nemusím. Všechno, co potřebujete, už máte."

  - Splits into three beats: won't be there / don't need to be / you have what you need. Stronger rhythm. Drops "v rukou" (in your hands) which is a slight nuance loss.

**Lean (A) with (B)'s tightening** for the body. (C) is tempting but "v rukou" carries the physical "this is yours to hold" weight — don't drop it.

### Callout — "Follow-up balíček"

CS: "Workshop skill a referenční materiály zůstávají **s tebou** i po dnešku. Když si chceš vytáhnout vzorec, kontrolu nebo připomínku, **zeptej se** skillu. Ví, **co ses naučil**, protože **jsi byl** součástí jeho vzniku."

- Straight conversion to `vy`:

  > "Workshop skill a referenční materiály zůstávají **s vámi** i po dnešku. Když si **chcete** vytáhnout vzorec, kontrolu nebo připomínku, **zeptejte se** skillu. Ví, **co jste se naučili**, protože **jste byli** součástí jeho vzniku."

**No alternatives — this is a direct conversion.**

---

# The bulk `ty` → `vy` action list (for the other scenes)

These are the remaining scenes where the only issue is `ty`→`vy`. No deep card needed; the fix is mechanical.

| Scene | Current | Target |
|---|---|---|
| `intermezzo-1-write` title + body | "Napiš / ti přichází na mysl" | "Pište / vám přichází na mysl" |
| `intermezzo-1-write` callout | "proti které píšete" (already vy) | leave |
| `rotation-line-up` title | "Postav se / odpočítej se / jdi" | "Postavte se / odpočítejte se / jděte" |
| `rotation-line-up` callout | "Tvoje staré repo / Nepomáhej / Opouštíš / tě / tebe" | "Vaše staré repo / Nepomáhejte / Opouštíte / vás / vás" |
| `rotation-read-the-room` eyebrow | "Teď sedíš" | "Teď sedíte" |
| `build-2a-same-clock` body | "zachyť, co tě podrazilo" | "zachyťte, co vás zaskočilo" |
| `intermezzo-2-write` title | "Napiš, než promluvíš" | "Pište, než promluvíte" |
| `intermezzo-2-write` callout | "Co tě / chceš / Zatím nemluv" | "Co vás / chcete / Zatím nemluvte" |
| `intermezzo-2-check-in` callout | "Neber to / Ber to" | "Neberte to / Berte to" |

**14 scenes total need `ty`→`vy` attention.** 10 covered by cards above, 9 in this bulk list (some overlap). The bulk list is mechanical — verbs to `vy` form, possessives `tvoje→vaše`, `tebe/tě→vás/vás`, object forms adjusted.

---

# Suggested commit sequence

1. **`Czech review: translate opening phase eyebrows`** — 4 eyebrows in opening phase (see scene 2, 3, 4 above).
2. **`Czech review: ty→vy normalisation in opening scenes`** — opening-framing + opening-day-arc + opening-team-formation + opening-handoff.
3. **`Czech review: ty→vy in rotation scenes`** — rotation-not-yours-anymore + rotation-line-up + rotation-read-the-room.
4. **`Czech review: ty→vy in intermezzos`** — intermezzo-1-write + intermezzo-2-write + intermezzo-2-check-in + build-2a-same-clock.
5. **`Czech review: ty→vy in reveal scenes`** — reveal-show-us + reveal-one-thing + reveal-go-use-it.
6. **`Czech review: opening-handoff board→plátně consistency`** (if you pick that change).
7. **`Czech review: opening-framing polish`** (if you take the "co postavit jinak" tweak).
8. **`Czech review: opening-day-arc title polish`** (if you take "Postavit" over "Stavět").
9. **`Czech review: flip cs_reviewed true on reviewed scenes`** — one commit per phase or per batch.

After each commit, run `npm run verify:copy-editor` to confirm the gate stays green. It should — `vy`→`ty` conversion is char-level edits that don't affect typography findings.

---

# Adversarial review — second opinion from a harsh Czech critic

I spawned a sub-agent with a "ruthless Czech editor" prompt and fed it my scene cards. It agreed with most of my recommendations, disagreed with several, and found 7 things I missed. This section captures the disagreements and the catches. **The disagreements are where your judgment is load-bearing** — I'm flagging them honestly rather than picking a side.

**Summary:** 3 scenes are safe-to-ship after the minor tweaks I already flagged (`demo-same-prompt`, `lunch-back-at`, `reveal-show-us`). The other 7 need a human call. Critic's catches on those 7 are below.

## Scene 1 — `opening-framing`

**Disagreement on body verb choice.**

- My pick: "co postavit jinak" (keep "build" semantic)
- Critic: "co dělat jinak" (original). Reasoning: "postavit" + "otevřete editor" in the same breath has a weak semantic link in Czech; forcing "build" adds a beat that doesn't earn its place. If you want to keep the build echo, use **"co stavět jinak"** (imperfective, matches ongoing practice) — but critic would drop it entirely.

**One thing I missed: "tvarovat práci" is borderline calque.** Native ear hears it as translated. Critic suggests **"připravit práci"** or **"nachystat práci"**.

- **Your call:** Is "tvarovat" a Czech-native verb for "shape" in this abstract sense? My read: it exists, but leans literary. "Nachystat" is more peer-tone.
- **Impact:** The very first hero title. Voice-defining. Worth a minute.

---

## Scene 2 — `opening-day-arc`

**Disagreement on the title verb.**

- My pick: "Postavit" (perfective, finished action)
- Critic: **"Stavět" (imperfective), keep the original.** Reasoning: in a 4-beat infinitive slogan, "Postavit" has 3 syllables while "Stavět" has 2 — it breaks rhythm. Also the day's arc is about the *practice* of building, not the delivery, which the imperfective matches better.

**Your call:** Read both aloud:
- "Učit se. Stavět. Předat. Pokračovat." (current)
- "Učit se. Postavit. Předat. Pokračovat." (my alt)

Which rhythm feels right? Critic's point about syllables is objectively correct — 2+2+2+3 vs 2+3+2+3 is measurably different.

**One thing I missed: "oblouk" for eyebrow is cold.** Critic says Czechs don't naturally say "den má oblouk" — it's a translator's word. Suggests **"Den má jeden rytmus"** or **"Den má jednu linku"**. "Linka" is punchier and keeps the line/arc metaphor without the stiffness.

- **Your call:** Is "oblouk" workshop vocabulary you've committed to, or a translator artefact? If it echoes something facilitators say live, keep it. If not, "linka" is probably better.

---

## Scene 3 — `opening-team-formation`

**One thing I missed (potentially a real bug): "Odpočítejte se" may be the wrong verb.**

- Current: "Odpočítej se" / "Odpočítejte se" (odpočítat = count *down*, as in 10…9…8)
- Critic's claim: the correct verb for "count off" (as in "1, 2, 3, 1, 2, 3" to split people into groups) is **"Rozpočítejte se"** (from "rozpočítat se").
- **Your call:** What's the actual mechanic? If teams call numbers in sequence to split into groups, the critic is right and "odpočítat" is semantically wrong. This is a real linguistic distinction — "odpočítat" is countdown, "rozpočítat" is distribute-by-counting.
- **Impact:** If wrong, this bug persists in every appearance of the count-off mechanic (at least 2 scenes: opening-team-formation and rotation-line-up).

---

## Scene 4 — `opening-handoff`

**Disagreements on three things.**

1. **Eyebrow: "Dál" is too bare.**
   - My pick: "Dál" or "Další"
   - Critic: **"A teď"** (two beats, forward motion, peer tone). Ship that instead.

2. **Title: don't assume `plátně` is correct.**
   - My pick: "Váš tým je na plátně."
   - Critic: "plátno" = canvas/projection screen. If "board" in the source refers to a whiteboard or Notion/digital board (team names listed), "plátno" is **wrong**. "Tabule" (blackboard-style) is an option, or leave as "board" if it's workshop vocabulary.
   - **Your call:** What is the "board" actually? Projected slide? Physical whiteboard? Something else? Match the Czech word to the real referent. Don't unify across scenes if the referents are different.

3. **Word order in title.**
   - My pick: "Váš tým je na plátně. Podívejte se nahoru."
   - Critic: Czech prefers **"Na boardu máte svůj tým. Podívejte se nahoru."** or **"Tým máte na boardu."** The "X is on Y" English construction translates awkwardly; Czech prefers "máte X na Y" (you have X on Y).
   - **Your call:** Read both aloud. Critic's instinct is probably right for Czech; "je na X" reads as translated stative.

---

## Scene 5 — `demo-same-prompt`

**Agreed, ship-after-tweaks.**

**One thing I missed: "Sledujte, co se stane" is textbook.** Critic suggests **"Dívejte se, co se stane"** for slightly more immediacy. Not a blocker; "sledujte" is safe. Your call on whether you want textbook-safe or more immediate.

Also flagged: double-check "dvě repa" plural consistency across the agenda — if elsewhere the content uses "repozitáře" (full Czech), don't mix. I didn't spot an inconsistency in my pass.

---

## Scene 6 — `lunch-back-at`

**One thing I missed: word order on "přesně".**

- Current (and my recommendation): "Vidíme se v [return-time] **přesně**."
- Critic: This lands schoolteacher-ish. Peer tone would put the adverb first: **"Vidíme se přesně v [return-time]."**

The difference is subtle but real. "X přesně" at the end lands like "be on time, kids". "Přesně v X" lands like "we restart at exactly X". **Critic is probably right.** Small but important voice calibration.

---

## Scene 7 — `rotation-not-yours-anymore`

**Disagreement: "v obědě" is substandard, not just awkward.**

- My note: flagged it as "slightly awkward", suggested "před obědem" if formal.
- Critic: **"v obědě"** is substandard (dialectal / colloquial-negative). The native Czech idiom for "over lunch / during the lunch break" is **"přes oběd"**. "Před obědem" only works if the action literally happened *before* lunch, which it didn't.
- **Your call:** "Přes oběd" is almost certainly correct. I should have caught this.

**Also: potential alt for title punch.** Critic suggests **"Tohle repo už není vaše"** — names the object with "tohle" (this one), then yanks ownership. Adds a beat of distance before the reveal. Optional; my plain conversion is fine.

---

## Scene 8 — `reveal-show-us`

**Agreed on the vy conversion, but one thing I missed.**

- My pick: "Ukažte, co jste postavili."
- Critic: **"Ukažte, co máte"** is more native and peer-toned. "Postavit" again rings slightly calque-y for a repo/harness. "Show what you've got" is the native register.
- **Your call:** "Co jste postavili" preserves the "built" semantic from the day's theme (build → show). "Co máte" loses the theme echo but sounds more native. Tradeoff.

---

## Scene 9 — `reveal-one-thing`

**Multiple calques in the "four options" callout.** This is where the critic landed hardest.

1. **"Nevybírat není varianta"** — calque of "not choosing is not an option". Czech would say **"Nevybrat si není možnost"** or punchier: **"Musíte si vybrat."** The double negative + "varianta" is English syntax in Czech clothes.

2. **"Workshop skill na vašem stroji"** — "stroj" for "machine" is industrial. Czech native: **"na vašem počítači"** or just **"u sebe"** (at your own place).

3. **"rozdali jsme je na začátku Revealu"** — capitalised "Revealu" mid-sentence is English-style proper-noun treatment. Czech section names are usually lowercase unless formally titled. Either **"na začátku revealu"** (lowercase) or rephrase to avoid declension: **"dostali jste ji na začátku"**.

- **Your call on all three.** These are real catches I missed. The callout needs a more careful rewrite than my plain `ty`→`vy` conversion.

---

## Scene 10 — `reveal-go-use-it`

**Disagreement on the title.**

- My pick: "Odneste si to." (idiomatic "take it with you")
- Critic: **"Použijte to."** (just two words). Reasoning: "Odneste si to" shifts from "go use it" (active deployment) to "take it with you" (passive possession). EN is a command to *act*, not to *keep*. Critic's "Použijte to." is two words, peer, direct, matches EN intent without padding.
- **Your call:** I actually think critic is right here. "Odneste si to" was clever but drifted. Ship **"Použijte to."**

**Two things I missed in the body:**

1. **"otevřete session s agentem"** — "session" is English mid-sentence and doesn't decline cleanly. If "session" is on your loanword whitelist, keep it. If not, **"až příště spustíte agenta"** sidesteps entirely and is punchier. Check `content/style-examples.md#approved-english-terms` to confirm.

2. **"všechno, co potřebujete, už máte v rukou"** — "v rukou" is a calque of "in your hands". Czech idiom: **"už to máte"** or **"všechno máte u sebe"**. "V rukou" is understandable but translated-sounding.

- **Your call on both.** The critic is probably right that "v rukou" is a calque, but it's also a phrase Czechs *do* use. The loanword question on "session" is factual — check the approved terms list.

---

## Consolidated high-stakes judgment calls for you

The 7 decisions where your ear is load-bearing:

1. **`opening-framing`**: "tvarovat práci" keep or swap to "nachystat práci"? "co dělat jinak" or "co postavit jinak"?
2. **`opening-day-arc`**: "Stavět" or "Postavit"? "oblouk" or "linka"?
3. **`opening-team-formation`**: "Odpočítat" or "Rozpočítat"? (Might be a factual bug about the mechanic.)
4. **`opening-handoff`**: What does "board" actually refer to? (Determines whether "plátno", "tabule", or "board" is right.) And the word-order preference.
5. **`rotation-not-yours-anymore`**: "v obědě" (substandard) → "přes oběd" (critic is likely correct, just confirm).
6. **`reveal-one-thing` four-options callout**: three calques to rewrite ("nevybírat", "stroj", "Revealu" capitalisation).
7. **`reveal-go-use-it`**: title "Použijte to." (critic) vs "Odneste si to." (me)? "v rukou" idiom or calque?

## Safe-to-ship after my straight `vy` conversions

- `demo-same-prompt` (with critic's optional "druhé" tweak and "Dívejte se" consideration)
- `lunch-back-at` (with critic's word-order fix on "přesně")
- `reveal-show-us` (you pick: "postavili" or "máte")

## What I still haven't done

- **Read-aloud TTS test** via the `babel-fish:audio` skill. If you want to actually hear each hero title spoken in Czech, I can run each one through ElevenLabs. Useful for the 3–4 scenes where rhythm is the deciding factor (opening-day-arc especially).
- **Full `style-examples.md` read** to verify which English loanwords are approved (matters for the `reveal-go-use-it` "session" question).

Both are optional polish. The scene cards + this adversarial section are the complete Mode A output. You can walk the 7 high-stakes decisions in ~15 minutes of reading-aloud judgment and commit as you go.
