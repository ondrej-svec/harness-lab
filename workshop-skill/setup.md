# Workshop Setup

## Cíl

Do 10:30 potřebujete jednu funkční cestu do Codexu nebo pi. Ne perfektní setup. Funkční cestu.

První cíl po setupu není feature. Je to orientace:

- otevřít repo
- načíst workshop guidance
- vytvořit krátké `AGENTS.md`
- pojmenovat první ověřitelný krok

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

## Hotovo když

- Umíte otevřít repo.
- Umíte poslat prompt.
- Máte jednu funkční cestu, jak během workshopu pracovat s agentem.
- Víte, jaký je první safe move v repu po setupu.
