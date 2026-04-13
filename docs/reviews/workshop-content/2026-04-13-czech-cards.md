---
status: pending-signoff
reviewer: czech-native-review
date: 2026-04-13
files:
  - content/challenge-cards/deck.md
  - content/challenge-cards/print-spec.md
en_canonical:
  - content/challenge-cards/locales/en/deck.md
  - content/challenge-cards/locales/en/print-spec.md
scope: CS vs EN canonical + canonical vocabulary alignment
---

# Czech review — challenge cards (deck.md + print-spec.md)

## Systemic findings

1. **Habit tags — all five verbatim present.** `deck.md` uses the five canonical tags from `docs/workshop-content-canonical-vocabulary.md` §1 without drift: `Map before motion`, `Verification is the trust boundary`, `Boundaries create speed`, `If it is not in the repo, it does not exist`, `Cleanup is part of build`. No non-canonical tags, no invented synonyms, no six-habit leakage. This is the strongest part of both files.

2. **No `ty` leaks.** Every imperative in `deck.md` is vy-form (`vytvořte`, `přidejte`, `použijte`, `dejte`, `vraťte se`, `zapište`, `opravte`, `najděte`, `přepište`). Clean against style-guide §vy-form discipline.

3. **Deck vs print-spec category mismatch is inherited from EN.** `print-spec.md` lists four categories — `Context Engineering`, `Workflow`, `Advanced`, `Meta` — but `deck.md` uses section headings `Před obědem`, `Po rotaci`, `Advanced`, `Meta`. `Context Engineering` and `Workflow` don't appear anywhere in the deck. **This is a cross-file inconsistency that exists identically in the EN canonical.** Not a translation bug. Flag for upstream EN fix (plan change, not this review's scope), then re-sync CS.

4. **One substantive meaning drift in deck.md** — the `Nejmenší užitečné ověření` card diverges from EN in two ways: (a) swaps `unit test` (EN) for `tracer bullet` (a duplicate, since tracer is already listed), dropping the unit-test example; (b) appends a sentence `Holisticky: dokažte, že drží celek.` that has no EN equivalent. The appended sentence is tonally fine and doctrinally on-brand (`holistic beats granular` from canonical vocab §3), but it's not in the source — review needs to decide whether to backport to EN or cut from CS. See file-by-file below.

5. **No reject-list hits in either file.** No `v rámci`, `za účelem`, `v případě, že`, `proaktivně`, `realizovat`, `implementovat`, `jedná se o`, `zajistit, aby`. Slovesný styl holds throughout. `dovysvětlování` (line 15) is the only nominal of note and it's doing real work — no rewrite needed.

6. **Typography clean.** Curly quotes `„ "` used consistently (lines 7, 11, 21, 57, 59). Em-dash `—` with spaces throughout. No straight quotes, no stray ASCII dashes. NBSP usage not checked here — defer to Layer 1 typography gate.

---

## File-by-file

### `content/challenge-cards/deck.md`

**Line 3** — opener.
> Karty nejsou body navíc. Jsou to malé zásahy, které zlepšují způsob práce s agentem i kvalitu handoffu.

EN: "These cards are not bonus points. They are small interventions that improve both the way of working with the agent and the quality of the handoff."

Faithful. `způsob práce s agentem` is slightly nominal but idiomatic — sloveso-centric rewrite (`jak s agentem pracujete`) would be punchier but not required.

- **Alt 1 (current):** `zlepšují způsob práce s agentem i kvalitu handoffu`
- **Alt 2 (verb-forward):** `zlepšují, jak s agentem pracujete i jak předáváte práci dál`
- **Alt 3 (tight):** `zlepšují práci s agentem i kvalitu handoffu`

**Recommendation:** keep Alt 1. Not broken.

---

**Line 15** — `Build/test příkazy`.
> Agent napsal kód, ale neumí ho ověřit bez vašeho ručního dovysvětlování. Přidejte build a test příkazy tak, aby agent i další tým uměl spustit kontrolu sám.

EN: "The agent wrote code but cannot verify it without your manual explanation. Add build and test commands so the agent and the next team can run checks independently."

Faithful. `uměl spustit kontrolu sám` for `run checks independently` is good. Minor: `agent i další tým uměl` — strict grammar would take plural (`uměli`) after `agent i tým`, but the singular works as a collective reading. Not urgent.

- **Alt 1 (current):** `aby agent i další tým uměl spustit kontrolu sám`
- **Alt 2 (plural agreement):** `aby agent i další tým uměli spustit kontrolu sami`
- **Alt 3 (restructure):** `aby si agent i další tým kontrolu spustili sami`

**Recommendation:** Alt 2 or Alt 3 — plural agreement is cleaner. Low priority.

---

**Line 19** — `Pravidlo z hovoru do repa`.
> Tým právě řekl nahlas nějaké pravidlo podruhé. Převeďte ho do AGENTS.md, README, runbooku nebo testu — co není v repu, neexistuje.

EN: "The team just said a rule out loud for the second time. Move it into AGENTS.md, README, a runbook, or a test — if it is not in the repo, it does not exist."

Faithful. `nějaké pravidlo` is a slight softening (`some rule`) where EN has just `a rule`; the indefinite is implied in Czech anyway. Keep.

---

**Line 25** — `/plan před kódováním`.
> Tým se chce rovnou pustit do kódu, ale nikdo nevidí celkový plán. Použijte /plan, ukažte kroky, co plníte a jaký je další bezpečný krok.

EN: "Use /plan, show the steps, what you are executing, and what the next safe move is."

`co plníte` is a light drift from `what you are executing` — `plnit` in Czech is closer to `fulfilling / carrying out` than `executing`. Minor semantic softening but intelligible.

- **Alt 1 (current):** `ukažte kroky, co plníte a jaký je další bezpečný krok`
- **Alt 2 (closer to EN):** `ukažte kroky, co právě děláte a jaký je další bezpečný krok`
- **Alt 3 (action verb):** `ukažte kroky, který z nich teď řešíte a jaký je další bezpečný krok`

**Recommendation:** Alt 2. `co právě děláte` matches EN more directly and reads as natural Czech.

---

**Line 29** — `Delegujte a kontrolujte výsledek`.
> Skáčete agentovi do každého kroku. Dejte mu úkol s jasnými mantinely a vraťte se za 10 minut zkontrolovat výsledek, ne proces.

EN: "You are jumping into every agent step. Give it a task with clear constraints and come back in 10 minutes to check the result, not the process."

Faithful and punchy. `mantinely` is the canonical vocabulary word for `constraints` (per §3 where `guides` / mantinely is the steering-mechanism term). Good.

---

**Line 31** — `Nejmenší užitečné ověření`. **<< primary drift >>**
> Agent říká, že je hotovo, ale nemáte jak to ověřit. Zapište done criteria jako spustitelný check (tracer bullet, end-to-end check nebo browser test) dřív, než agent dostane víc autonomie. Holisticky: dokažte, že drží celek.

EN: "The agent says it is done but you have no way to verify. Write done criteria as an executable check (unit test, tracer bullet, or browser check) before the agent gets more autonomy."

Two deltas:

1. **Example list swap.** EN: `unit test, tracer bullet, or browser check`. CS: `tracer bullet, end-to-end check nebo browser test`. The CS list drops `unit test` and inserts `end-to-end check`. This matters because the card is *about* holistic verification — the `unit test` item in EN is arguably the weaker example. Canonical vocab §3 elevates `tracer bullet` as the holistic-verification term and describes `unit test` as an anti-pattern framing. **CS is actually more doctrinally correct than EN here.** Recommendation: backport the CS examples into EN, not the other way round.

2. **Trailing sentence `Holisticky: dokažte, že drží celek.`** Has no EN equivalent. It restates the card's theme one more time. Doctrinally on-brand (`holistic beats granular` / `Celek nad detailem` from canonical vocab §3). But it's an addition, not a translation. Two options:
   - Backport to EN: add "Holistically: prove it holds together." as the closing line of the EN card.
   - Cut from CS: delete the sentence to keep deck content parallel.

- **Alt 1 (current CS):** keep both deltas, backport to EN.
- **Alt 2 (cut the holistic sentence, keep the better examples):** `… dřív, než agent dostane víc autonomie.` — match EN body, only diverge on the example list, and backport example swap.
- **Alt 3 (full parity to EN):** `… (unit test, tracer bullet nebo browser test) dřív, než agent dostane víc autonomie.` — accept EN examples, drop the holistic sentence, take the loss on doctrinal crispness.

**Recommendation:** Alt 1 — the CS version is stronger. Flag as EN-update-needed rather than CS-fix-needed.

---

**Lines 57–60** — closing "Jak s kartami pracovat".
> Před obědem má každý tým splnit aspoň jednu kartu z části „Před obědem: postavte pracovní systém".

`splnit kartu` is slightly odd as collocation — you complete a task from a card, not the card itself. But in the context of "challenge cards = tasks" it reads naturally. EN: `complete at least one card` has the same metonymy.

- **Alt 1 (current):** `splnit aspoň jednu kartu`
- **Alt 2 (verbified task):** `udělat aspoň jednu kartu`
- **Alt 3 (explicit):** `dokončit aspoň jednu výzvu z karet`

**Recommendation:** keep Alt 1. Consistent with EN metonymy, and `splnit` reads fine.

---

### `content/challenge-cards/print-spec.md`

**Line 7** — layout spec.
> velký nadpis, 1 krátký popis, 1 ikonický štítek kategorie

EN: "large title, 1 short description, 1 category label"

`ikonický` is an addition — EN just says `category label`. Minor decorative drift, not meaning-changing.

- **Alt 1 (current):** `velký nadpis, 1 krátký popis, 1 ikonický štítek kategorie`
- **Alt 2 (parity with EN):** `velký nadpis, 1 krátký popis, 1 štítek kategorie`
- **Alt 3 (richer CS but intentional):** keep `ikonický` and backport `iconic` to EN if the design genuinely uses an iconography-driven label

**Recommendation:** Alt 2. Drop `ikonický` unless the design actually uses icons — otherwise it's translator elaboration.

---

**Lines 9–14** — color coding categories. **<< systemic flag, not a CS bug >>**
> - Context Engineering: písková / žlutá
> - Workflow: modrozelená
> - Advanced: cihlová
> - Meta: šedá

EN is identical structure. But `deck.md` has no cards tagged `Context Engineering` or `Workflow` — its sections are `Před obědem`, `Po rotaci`, `Advanced`, `Meta`. So when a printer lays out cards, which color does a `Před obědem` card get? The spec doesn't say.

This is a **deck-vs-spec inconsistency that exists in both languages identically.** Not introduced by the Czech pass. Needs an upstream fix in EN (either rename deck sections to `Context Engineering` / `Workflow`, or rename print-spec colors to `Před obědem` / `Po rotaci`). Do not fix in CS alone — that would create a CS/EN divergence.

- **Alt 1:** leave CS as-is, file EN alignment ticket.
- **Alt 2:** preemptively rename CS categories to `Před obědem` / `Po rotaci` / `Advanced` / `Meta` — but only after EN is fixed.
- **Alt 3:** preemptively rename CS categories to `Kontextové inženýrství` / `Workflow` / `Advanced` / `Meta` and add those as section headings in `deck.md` — bigger rewrite, needs approval.

**Recommendation:** Alt 1. Flag upstream, don't fix in CS review.

---

**Line 6** — double-sided printing.
> oboustranný tisk není potřeba

EN: "double-sided printing isn't required"

Clean. Matter-of-fact register matches EN.

---

**Line 22–24** — bottom labels.
> - `Před obědem`
> - `Po rotaci`
> - `Kdykoliv`

EN: `Before lunch` / `After rotation` / `Anytime`. Parity perfect. `Kdykoliv` is the right register — colloquial but not sloppy.

---

**Line 28** — print note.
> Pokud se tisk nestihne, primární kanál je dashboard a `/workshop challenges`. Tisk je bonus, ne závislost workshopu.

EN: "If printing doesn't happen in time, the primary channel is the dashboard and `/workshop challenges`. Print is a bonus, not a dependency for the workshop."

Faithful. `ne závislost workshopu` is a calqued-ish construction (`not a dependency for the workshop`) but it reads fine in the context — `závislost` has legitimate technical register here.

- **Alt 1 (current):** `Tisk je bonus, ne závislost workshopu.`
- **Alt 2 (more natural):** `Tisk je bonus, workshop na něm nestojí.`
- **Alt 3 (closest to EN):** `Tisk je bonus, ne nutnost pro workshop.`

**Recommendation:** Alt 2 — more Czech-native, keeps the meaning, and fits the action-oriented register of the rest of the file.

---

## Summary — top 3 highest-impact items

1. **`deck.md` line 31 — `Nejmenší užitečné ověření` drift from EN.** CS drops `unit test` and adds a trailing `Holisticky: dokažte, že drží celek.` sentence. The CS version is actually more doctrinally correct (aligns with canonical vocab §3 on `holistic beats granular`). **Action:** backport CS to EN, not the reverse. This is an EN update, not a CS fix.

2. **`print-spec.md` vs `deck.md` category mismatch (cross-file, both languages).** Print spec lists `Context Engineering` / `Workflow` as categories; deck uses `Před obědem` / `Po rotaci`. Identical bug in EN canonical — inherited, not introduced. **Action:** file upstream EN alignment ticket. Do not fix in CS alone.

3. **`print-spec.md` line 7 — `ikonický štítek kategorie` is translator elaboration.** EN has just `category label`. **Action:** drop `ikonický` unless the design genuinely uses an icon-driven label. Lowest-impact of the three but the only outright CS-translation-issue in both files.

**Overall verdict:** both files are in strong shape. All five canonical habit tags are verbatim. No `ty` leaks. No reject-list hits. No nominal-chain drift. The two real issues are doctrinal/upstream, not translation quality. Recommended status after top-3 resolution: **approved for ship**.
