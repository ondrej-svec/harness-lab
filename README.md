# Harness Lab 🔧

**Celodenní workshop pro vývojáře** o harness engineeringu, tedy o tom, jak kolem AI agentů postavit funkční pracovní systém.

## Co je Harness Lab?

Workshop, ve kterém si vývojáři prakticky vyzkouší:
- **Práci s kontextem** — jak psát `AGENTS.md`, skills a runbooky, které agentovi opravdu pomáhají
- **Strukturovaný workflow** — `brainstorm` → `plan` → implementace → `review`
- **Řízení agentů** — jak vést agenty podobně, jako team lead vede tým

## Signaturní cvičení: Tichá pošta

1. **Dopoledne** — tým si vybere projekt a začne ho stavět s AI agenty. Vše důležité musí být v repozitáři, ne jen v hlavách lidí.
2. **Po obědě** — přijde plná rotace týmů. Nový tým zdědí jen to, co je napsané v repu.
3. **Odpoledne** — nový tým pokračuje bez ústního handoffu, jen s dostupným kontextem a agenty.
4. **Reveal** — původní tým uvidí, co jejich projekt po předání unesl a kde se rozpadl.

Týmy s dobrým kontextem drží směr. Týmy bez kontextu zažijí tichou poštu v přímém přenosu.

## Termíny

| # | Datum | Město | Místo | Kapacita |
|---|-------|-------|-------|----------|
| 1 | 21.4. | Brno | Dakar, Okružní 5 | 20 + lektor |
| 2 | 23.4. | Brno | Dakar, Okružní 5 | 20 + lektor |
| 3 | 24.4. | Praha | Saturn 103, Sokolovská 695/115b | 17 + lektor |
| 4 | 29.4. | Praha | Jupiter 104, Sokolovská 695/115b | 17 + lektor |

## Struktura repozitáře

- `dashboard/` — webová stránka workshopu (Next.js, Vercel)
- `content/` — projektové briefy, challenge karty, přednášky, facilitační průvodci
- `workshop-skill/` — skill instalovatelný do Codex/OpenCode
- `monitoring/` — skripty pro sledování týmových repozitářů
- `materials/` — tiskové materiály (karty, referenční listy)

## Aktuální stav

- `dashboard/` už obsahuje funkční workshop shell, admin panel a lokální state pro jednu workshopovou instanci
- `content/` obsahuje první sadu briefů, challenge deck, talk scripts a facilitační podklady v češtině
- `workshop-skill/` obsahuje participant-facing skill kostru, setup flow, recap i template pro `AGENTS.md`
- `monitoring/` a `capture/` pokrývají manuální MVP pro facilitátora

## Content Style

- Hlas a jazyková pravidla pro participant-facing texty jsou v `content/style-guide.md`
- Praktické příklady formulací jsou v `content/style-examples.md`
