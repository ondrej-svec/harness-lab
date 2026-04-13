---
title: "Czech review — facilitation docs (master-guide + codex-setup-verification)"
type: review
date: 2026-04-13
scope: "D-phase of refactor-language-flip plan — facilitator-facing CS files"
status: pending-signoff
files:
  - content/facilitation/master-guide.md
  - content/facilitation/codex-setup-verification.md
canonicals:
  - content/facilitation/locales/en/master-guide.md
  - content/facilitation/locales/en/codex-setup-verification.md
---

# Facilitation docs — Czech review

Two CS facilitator-facing files reviewed against their EN canonicals (both
written today in Phase B1/B2 as translations **from** these CS originals), the
canonical vocabulary spec, the style guide, and the reject list.

Findings are advisory. Human reviewer applies fixes; flips
`cs_reviewed: true` in the plan lockfile per file.

## Scope and framing

- **`master-guide.md`** (326 lines) — facilitator-facing. §149 `vy` discipline
  still applies (confirmed by D1 batch systemic finding: facilitator notes are
  bound by the same `vy` rule as participant surfaces).
- **`codex-setup-verification.md`** (54 lines) — hybrid: runbook-style steps
  participants may glance at and a facilitator-decision tail block.

Protected phrases and canonical vocabulary are evaluated per
`docs/workshop-content-canonical-vocabulary.md` §2–§5.

---

## Systemic findings

### S1. `AGENTS.md` map metaphor drifts across the master-guide

Canonical framing (§3): **`AGENTS.md` jako mapa, ne encyklopedie**.

The master-guide uses four different second halves of the metaphor inside one
document:

| Line | Phrasing |
|---|---|
| 60 | `mapa, nebo už se z něj stává dump` |
| 73 | `krátká mapa, ne sklad všeho` |
| 138 | `krátká mapa` (half only) |
| 171 | `krátkou mapu, ne rostoucí skladiště všeho` |

Two issues:

1. **`dump` (line 60)** is a raw English loanword inconsistent with
   `sklad`/`skladiště` used elsewhere in the same file. It is also the kind
   of code-switched noun the reject list flags as an AI/translation
   fingerprint when it appears beside native synonyms. It should be
   `sklad`/`skladiště` or — better — the canonical `encyklopedie`.
2. The canonical second half is **`encyklopedie`**, not `sklad`. Facilitator
   prose can vary, but the variance should be across files, not within one
   file; and at least one occurrence in a doc this central should hit the
   canonical form so facilitators carry the meme verbatim.

**Recommendation:** normalise all four occurrences to the canonical form
`AGENTS.md jako mapa, ne encyklopedie` on first introduction (line 60 or
73), then `krátká mapa` is fine as shorthand afterwards.

### S2. Verification tautology in a checkpoint question

Line 230: `Co dnes ověřujete pomocí spustitelného ověření?`

`ověřujete … ověřením` is a tautological loop produced by translating
"executable check" literally. EN canonical line 229 reads: *"What are you
verifying today with an executable check?"*. In Czech the noun `ověření`
collides with the verb `ověřovat`.

This is a high-visibility line — it is one of three preferred checkpoint
questions facilitators are told to use verbatim at intermezzos.

**Recommendation:** `Co dnes ověřujete spustitelným testem?` or
`Co dnes ověřujete spustitelnou kontrolou?` — use `test` or `kontrola` for
the noun slot so the verb can stay.

### S3. Facilitator-directed imperatives are clean

Scanned every imperative in both files. All forms are `vy`
(`Použijte, Pojmenujte, Nechte, Ukažte, Vracejte, Zasahujte, Rámujte,
Začněte, Needitujte, Nainstalujte, Přihlaste se, Otevřete, Pošlete,
Načtěte, Spusťte, Nečekejte, Nenechte, přejděte, spárujte, použijte`).
**No `ty` leaks** in either file. This is the first facilitation artefact
in the repo this pass where that is true end-to-end; worth noting.

### S4. `Monday` / `pondělí` — clean

Neither file mentions a calendar day. `next-day commitments` section in
master-guide §`next-day commitments` is role-anchored via
`„Až si příště otevřu agenta, udělám [X]…"` — first-person (participant
voice), appropriate for a template sentence the participant writes. The
§5 day-neutral rule is not violated.

### S5. Canonical loanwords — mostly present

| Canonical | master-guide | codex-setup |
|---|---|---|
| `guides` / `sensors` | ✓ line 91, glossed inline (Böckeler credited) | n/a |
| `tracer bullet` | ✓ lines 141, 156, 165 | n/a |
| `harness engineering` | ✓ line 39 | n/a |
| `task drift` | ✓ lines 107, 111 | n/a |
| `managing, ne chatování` | ✗ absent (team-lead frame is there in spirit at line 92, but the canonical term does not land) | n/a |
| `next-day commitments` | ✓ §title line 314 | n/a |
| `harness skill install` / `/skill:workshop` / `$workshop setup` | ✓ lines 127, 187 | ✓ lines 26–30, 48 |
| `AGENTS.md jako mapa, ne encyklopedie` | ~ drifted (see S1) | n/a |

The only outright canonical gap is **`managing, ne chatování`**. The
master-guide makes the role-shift point obliquely ("Team lead nestojí
modelu za zády…") but never hands facilitators the named term, which means
they cannot reinforce it in coaching. This is a weaker miss than S1
because the master-guide is not a teaching doc and the term lives in the
talk script — still worth one callout in the *Context is King talk*
section (around line 91, right after `guides`/`sensors`).

---

## File-by-file

### `content/facilitation/master-guide.md`

#### F1.1 — Semantic reversal: "výsledek změnil kontext" (line 117)

Current:

> „Nenechte to sklouznout do debaty o tom, který model je chytřejší. Pointa
> je, že výsledek změnil kontext v repu, ne prompt."

Problem: In Czech, `výsledek změnil kontext` reads actively: *the outcome
changed the context*. The intended reading is the opposite — *the context
changed the outcome*. EN canonical line 117 is unambiguous: *"the outcome
changed because the context in the repo changed — not the prompt"*.
Because Czech SVO is flexible, the current sentence is actually reversible
in reader interpretation; under fast facilitator reading it will be misread
at least once per cohort.

This is the **highest-impact fix** in the master-guide: it sits inside the
Repo-readiness contrast, the micro-exercise that anchors the whole
Context-is-King talk delivery.

**Alt 1 (clearest, matches EN):**
> Pointa je, že výstup se změnil, protože se změnil kontext v repu — ne
> prompt.

**Alt 2 (subject-first, keeps the punch):**
> Pointa je, že výstup změnil kontext v repu, ne prompt.
> *(swap `výsledek` → `výstup` for rhythm; same reversibility problem —
> reject.)*

**Alt 3 (passive, unambiguous but heavier):**
> Pointa je, že výsledek se změnil kvůli kontextu v repu, ne kvůli promptu.

Take **Alt 1**. It mirrors the Czech punchline at line 115 ("Prompt se
nezměnil. Repo ano.") and removes the reversibility entirely.

#### F1.2 — Typo: `planem` → `plánem` (line 268)

> „Začněte `README`, `AGENTS.md` a planem."

Missing háček. Under the participant-facing section **Instrukce pro nový
tým** (§Rotace), this is a line a facilitator reads aloud and a participant
may glance at. **Hard typo — fix unconditionally.**

**Alt 1:** `Začněte `README`em, `AGENTS.md` a plánem.`
**Alt 2:** `Začněte u `README`, `AGENTS.md` a plánu.` *(avoids instrumental
on a code-fence, reads more naturally for Czech readers who stumble on
`READMEem`)*
**Alt 3:** `Začněte tím, že si projdete `README`, `AGENTS.md` a plán.`
*(explicit verb; softest for a tired facilitator reading aloud)*

Take **Alt 2** — it is the lowest-risk fix and sidesteps the ugly
`READMEem` instrumental.

#### F1.3 — `dump` (line 60) — see S1

Facilitator's rolling question, meant to be repeated verbatim at tables:

> „Je `AGENTS.md` mapa, nebo už se z něj stává dump?"

**Alt 1 (canonical):** `„Je `AGENTS.md` mapa, nebo už se z něj stává
encyklopedie?"`
**Alt 2 (native):** `„Je `AGENTS.md` mapa, nebo už se z něj stává
sklad všeho?"`
**Alt 3 (punchier):** `„Je `AGENTS.md` pořád mapa, nebo už je to sklad?"`

Prefer **Alt 1**. This is the line facilitators literally repeat to teams,
and putting the canonical meme into their mouth is the whole point of the
facilitator-questions block. Alt 2 is the safety net if Alt 1 feels too
bookish in delivery.

#### F1.4 — `sloganku` (line 99)

> „…neříká je dřív než ve scéně 4 a nedělá z nich motivační sloganku."

`sloganka` is not a standard Czech word — neither a diminutive nor a
gender-flipped form that natively exists. It reads as an ad-hoc coinage
and produces a tiny stumble on a line that is otherwise the most protected
block in the doc (the paragraph guarding **Lidé řídí. Agenti vykonávají.**).

**Alt 1:** `…a nedělá z nich motivační slogan.`
**Alt 2:** `…a nedělá z toho motivační hlášku.`
**Alt 3:** `…a nedělá z toho nálepku ani motivační slogan.`

Take **Alt 1**. Pure hygiene fix. Do not overthink this one.

#### F1.5 — `retrieval cvičení` as an invariable noun (lines 204–220)

The doc says `tiché retrieval cvičení`, `retrieval cvičení`, and
`přínos retrieval cvičení` — using `retrieval` as an indeclinable left
modifier of a Czech noun. This is one of the reject-list AI fingerprints
(English noun pinned in front of a Czech noun without morphological
integration, producing a noun-noun stack).

**Alt 1 (Czech adjective, loanword preserved):**
`tiché retrievalové cvičení`, `retrievalové cvičení`,
`přínos retrievalového cvičení`.
**Alt 2 (native noun, loanword dropped):**
`tiché cvičení na vybavování`, `cvičení na vybavování`. *(Loses the
term-of-art signal; `retrieval practice` is a named pedagogical technique.)*
**Alt 3 (rephrase around the verb):**
First occurrence: `Každé intermezzo začíná 3minutovým tichým vybavováním
(retrieval practice).` Subsequent: `tiché vybavování`.

Take **Alt 1** — cheapest, keeps the term-of-art, makes the phrase
morphologically Czech. Low impact; systemic.

#### F1.6 — `akcelerují nejistotu` (line 237)

> „…bez ověření jen akcelerují nejistotu."

`akcelerovat` is not on the reject list but `zrychlovat` is the native
verb and the sentence reads heavier than it needs to.

**Alt 1:** `…bez ověření jen zrychlují nejistotu.`
**Alt 2:** `…bez ověření jen zrychlují svoji nejistotu.`
**Alt 3:** `…bez ověření jen přidávají rychlost k nejistotě.`

Take **Alt 1**. Low impact, one-word swap.

#### F1.7 — `4 elementy` in the example commitment (line 324)

> „…do AGENTS.md svého hlavního repa napíšu 4 elementy: goal, context,
> constraints, done when"

Two small hits: `4` numerical where spelled is more natural
(`čtyři`), and `elementy` is an Anglicism where `prvky` reads more
native. This is an **example** commitment facilitators show participants —
it is not a protected phrase and it does not need to be perfect, but it is
one that participants may literally copy.

**Alt 1:** `…napíšu čtyři prvky: goal, context, constraints, done when`
**Alt 2:** `…napíšu čtyři části: goal, context, constraints, done when`
**Alt 3:** leave as-is — accept as facilitator speech register.

Take **Alt 1**. Optional; low impact.

#### F1.8 — Missing `managing, ne chatování` callout — see S5

Adding one line to the Context-is-King talk section (after line 92) is
enough. Suggested insert:

> Pojmenovaná slovní zásoba z Böckeler: **guides** (mantinely, které agenta
> směrují dřív, než něco udělá) a **sensors** (ověření, které agenta chytí
> potom). A z Charlie Guo (OpenAI, únor): **managing, ne chatování** — role
> team leada, ne spolupachatele u klávesnice. Všechny tři termíny zazní
> v talku; facilitátor je pak v coachingu používá.

Optional. Low-to-medium impact. Helps facilitator use the canonical term
in-room instead of improvising a Czech paraphrase.

#### F1.9 — Other nits (not worth individual blocks)

- Line 174 `převod opakovaných připomínek` — nominal; prefer
  `převádět opakované připomínky do repa`.
- Line 199 `continuation-ready` — ungLossed Anglicism in a CS body. One-shot
  fix: `continuation-ready (připravený pro pokračování)` on first use, or
  replace with `aby na něj další tým mohl navázat`.
- Lines 148, 306 `backstage Harness Lab` / `vodítko v blueprintu` — mixed
  code-switching is fine in facilitator prose; flagged only for awareness.

### `content/facilitation/codex-setup-verification.md`

Tight file. Two phrasing issues, nothing structural.

#### F2.1 — `Přihlaste provider nebo účet` (line 26)

Current:

> „Přihlaste provider nebo účet, který chcete používat."

`přihlásit` is reflexive in Czech for "sign in" — `přihlásit se`. The
non-reflexive `přihlásit provider` reads as *"enroll the provider"*, which
is semantically wrong (the provider isn't the one being signed in). EN
canonical line 26: *"Sign in with the provider or account you want to use"*.

**Alt 1:** `Přihlaste se přes providera nebo účet, který chcete používat.`
**Alt 2:** `Přihlaste se k provideru nebo účtu, který chcete používat.`
**Alt 3:** `Přihlaste se do providera nebo účtu, který chcete používat.`

Take **Alt 2** — `přihlásit se k` is the native CS collocation for
account-style sign-in. Alt 1 also works and is slightly more conversational.

#### F2.2 — `řekněte si o setup pomoc` (line 48)

> „V pi načtěte `/skill:workshop` a řekněte si o setup pomoc."

`setup pomoc` is a raw English-left-modifier stack on a Czech noun —
same pattern as F1.5. Also, the idiom `řekněte si o X` wants `X` in
accusative; `setup pomoc` is not declinable as-is.

**Alt 1:** `V pi načtěte `/skill:workshop` a požádejte o pomoc se setupem.`
**Alt 2:** `V pi načtěte `/skill:workshop` a řekněte si o pomoc se setupem.`
**Alt 3:** `V pi načtěte `/skill:workshop` a nechte skill provést vás
setupem.` *(rewrites the action.)*

Take **Alt 2** — keeps the `řekněte si o` rhythm that matches line 30 in
the same file, and fixes the noun stack.

#### F2.3 — `firemního flow` (line 20)

Borderline. `flow` is an unglossed Anglicism in the middle of a
participant-facing setup step. In speech it is natural; on a read-only
runbook surface, `postup` would be safer.

**Alt 1:** `…podle firemního postupu.`
**Alt 2:** leave as-is (accept as developer-register code-switching).
**Alt 3:** `…podle firemního onboarding flow.` *(makes the anglicism
explicit — worse.)*

Take **Alt 1** if the file is strictly participant-facing; accept Alt 2 if
it is treated as facilitator reference only. Low impact.

---

## Summary — top 3 highest-impact

1. **Fix the semantic reversal at master-guide line 117** (`výsledek změnil
   kontext` → Alt 1: `výstup se změnil, protože se změnil kontext v repu`).
   This sits at the punchline of the Repo-readiness contrast, which is the
   whole point of the Context-is-King bridge into Build Phase 1. A reversible
   sentence on the scene's punchline is the one defect in this review that
   actively teaches the wrong thing.
2. **Fix `planem` → `plánem` (line 268)** and **normalise the `AGENTS.md`
   map metaphor to the canonical `mapa, ne encyklopedie`** at least at
   line 60 (drop `dump`). One hard typo on a participant-adjacent line plus
   one canonical-vocabulary drift that repeats four times in the same doc.
   Low effort, high signal for facilitators who carry the meme in-room.
3. **Fix the tautological checkpoint question at line 230**
   (`ověřujete pomocí spustitelného ověření` → `ověřujete spustitelným
   testem`). This is one of three preferred questions facilitators are told
   to use verbatim at every intermezzo. Any line marked "use this verbatim"
   must survive being read aloud without stumbling.

Everything else — `sloganku`, `retrieval cvičení` declension, the
`managing, ne chatování` insert, the two setup-verification phrasings —
is hygiene. Worth doing in the same pass but nobody's afternoon breaks if
they ship.

## Verdict

Both files pass the `ty`-leak and `Monday` gates end-to-end. The
master-guide carries one meaning-drift defect (F1.1), one typo (F1.2), and
one canonical-vocabulary drift (S1 / F1.3). The setup-verification file
carries two minor phrasings. Neither file needs restructuring — this is a
surgical pass, not a rewrite.

Recommend: flip `cs_reviewed: true` for both files after F1.1, F1.2,
F1.3, S2, F2.1, and F2.2 are applied. Remaining nits can be held for a
layer-2 sweep.
