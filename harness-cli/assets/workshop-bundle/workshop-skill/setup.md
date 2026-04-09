# Workshop Setup

## Cíl

Do 10:30 potřebujete jednu funkční cestu do Codexu nebo pi. Ne perfektní setup. Funkční cestu.

První cíl po setupu není feature. Je to orientace:

- otevřít repo
- načíst workshopové pokyny
- vytvořit krátké `AGENTS.md`
- pojmenovat první ověřitelný krok

Garantovaný výchozí nástroj pro dnešek je `workshop` skill. Další workflow skills nebo externí toolkity jsou volitelné zrychlení, ne podmínka účasti.

## Nejrychlejší volba

- terminálový, hackovatelný multi-model setup: `pi`
- macOS / Linux: `Codex CLI`
- Windows nebo macOS: `Codex App`
- Když se zaseknete: web fallback nebo pairing s někým, komu už setup běží

## pi

1. Nainstalujte `pi`:

```bash
npm install -g @mariozechner/pi-coding-agent
```

2. Přihlaste provider nebo účet, který chcete používat.
3. Otevřete repozitář.
4. Spusťte `pi`.
5. Načtěte workshop skill přes `/skill:workshop` a řekněte si o `setup`, `reference` nebo `brief`.

## Codex CLI

1. Ověřte, že máte přístup ke svému Codex účtu.
2. Nainstalujte CLI podle interního setup flow vaší organizace.
3. Přihlaste se.
4. Otevřete repozitář.
5. Pošlete první smysluplný prompt a ověřte, že dostáváte odpověď.

## Codex App

1. Nainstalujte aplikaci.
2. Přihlaste se stejným účtem.
3. Otevřete workshop repo nebo týmový projekt.
4. Pošlete první prompt.
5. Ověřte, že můžete pokračovat bez další blokace.

## Když něco nefunguje

- Neztrácejte 20 minut sólo debugováním setupu.
- Po 7 minutách blokace přepněte na App, web fallback nebo pairing.
- Když nefunguje autentizace, pokračujte s někým od stolu a vraťte se k vlastnímu setupu později.
- Když si nejste jistí dalším krokem, použijte v Codexu `$workshop setup`. V pi načtěte `/skill:workshop` a řekněte si o setup pomoc. Nebo si zavolejte facilitátora.

## Prvních 15 minut po setupu

1. Spusťte `workshop` reference:
   - Codex: `$workshop reference`
   - pi: `/skill:workshop`, potom si řekněte o `reference`
   - když chcete rychlý přehled toho, co skill umí: `Codex: $workshop commands`
2. Otevřete brief:
   - Codex: `$workshop brief`
   - pi: `/skill:workshop`, potom si řekněte o `brief`
3. Doplňte krátké `AGENTS.md`:
   - Codex: `$workshop template`
4. Pojmenujte první bezpečný krok:
   - ideálně přes `$plan`, případně `brainstorm`, když scope ještě není jasný
5. Přidejte jedno spustitelné ověření:
   - unit test, tracer bullet nebo aspoň jasný review/checklist krok
6. Když chcete materiály i po workshopu:
   - `Codex: $workshop resources`
   - `Codex: $workshop gallery`
   - `Codex: $workshop follow-up`

## Hotovo když

- Umíte otevřít repo.
- Umíte poslat prompt.
- Máte jednu funkční cestu, jak během workshopu pracovat s agentem.
- Víte, jaký je první bezpečný krok v repu po setupu.
