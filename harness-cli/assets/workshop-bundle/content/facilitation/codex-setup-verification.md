# Codex Setup Verification

## Cíl

Do 10:30 musí mít každý účastník jednu funkční cestu:

- `pi`
- `Codex CLI`
- `Codex App`
- nebo web fallback

Cíl není perfektní instalace. Cíl je dostat každého co nejdřív do práce s agentem.

## Rychlý start

### macOS / Linux

1. Otevřete terminál.
2. Přihlaste se do Codex prostředí podle firemního flow.
3. Otevřete repozitář.
4. Pošlete první prompt.

### pi

1. Nainstalujte `pi`:
   `npm install -g @mariozechner/pi-coding-agent`
2. Přihlaste provider nebo účet, který chcete používat.
3. Otevřete repozitář.
4. Spusťte `pi`.
5. Načtěte workshop skill přes `/skill:workshop` a řekněte si o další krok.

### Windows / macOS

1. Otevřete `Codex App`.
2. Přihlaste se.
3. Otevřete workshop repo nebo týmový projekt.
4. Pošlete první prompt.

### Web fallback

Použijte ho ve chvíli, kdy vás blokuje instalace, firemní politika nebo autentizace. Nečekejte na ideální setup, když už můžete pracovat.

## Troubleshooting checklist

- Nejde login → přejděte na `App` nebo web fallback a pokračujte.
- Nejde CLI instalace → nenechte se blokovat déle než 7 minut.
- Nejde otevřít repo → spárujte se s někým od stolu a vraťte se k tomu později.
- Nevíte, co je další krok → v Codexu použijte `$workshop setup`. V pi načtěte `/skill:workshop` a řekněte si o setup pomoc.

## Facilitátorské rozhodnutí

- 7 minut blokace → fallback nebo pairing.
- 10 minut chaosu → facilitátor dává jeden konkrétní další krok.
- Jakmile má člověk jednu funkční cestu, setup je pro tuto chvíli dost dobrý.
