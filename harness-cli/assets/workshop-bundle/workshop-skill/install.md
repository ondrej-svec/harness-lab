# Workshop Skill Install

## Doporučená distribuce

Výchozí doporučení pro Harness Lab je instalace přes `@harness-lab/cli` do vašeho aktuálního pracovního repa.

Proč:
- skill je pořád repo-native obsah, ale nemá záviset na tom, že máte zrovna klon tohoto veřejného repa
- stejné soubory slouží jako fallback i jako dokumentace
- participant má mít funkční workshop companion přímo v týmovém repu

## Doporučený participant flow

1. otevřít svůj týmový nebo workshopový repo
2. nainstalovat Harness CLI:

```bash
npm install -g @harness-lab/cli
```

3. nainstalovat workshop skill do aktuálního repa:

```bash
harness skill install
```

Volitelně můžete cílit jinam:

```bash
harness skill install --target /cesta/k/repu
```

4. otevřít agent nástroj nad tímto repem
5. ověřit, že fungují minimálně:
   - Codex: `$workshop commands`, `$workshop reference`, `$workshop brief`
   - pi: `/skill:workshop`, potom si říct o `commands`, `reference` nebo `brief`

Po úspěšné instalaci `harness skill install` rovnou vypíše doporučené první kroky, aby účastník věděl, že může začít buď v Codexu přes `$workshop ...`, nebo v pi přes `/skill:workshop`.
Když příkaz pustíte znovu později, CLI zkontroluje, jestli je bundle v cílovém repu aktuální. Pokud je zastaralý, rovnou ho obnoví. `--force` používejte jen tehdy, když chcete vynutit plný reinstall.

## Co čekat dál

`harness skill install` instaluje garantovaný workshop bundle. Neinstaluje za vás další workflow skills ani externí toolkity.

Doporučený další postup:

1. rozběhnout `workshop` skill
2. otevřít `commands`, `reference` a `brief`
3. doplnit `AGENTS.md`
4. podle potřeby použít `brainstorm`, `plan`, `work`, `review` nebo `compound`, pokud je ve svém agent setupu máte k dispozici
5. když chcete participant materiály bez hledání v GitHubu, použít `workshop resources`, `workshop gallery` a `workshop follow-up`

## Poznámka

`harness skill install` vytvoří projektový bundle v `.agents/skills/harness-lab-workshop`, aby skill šel objevit v repu bez další distribuční vrstvy.
Tuto složku berte jako generovaný workshop bundle, ne jako hlavní authoring surface.

Participant login není potřeba pro samotnou existenci skillu. `workshop login` je až krok pro odemčení live event contextu.
