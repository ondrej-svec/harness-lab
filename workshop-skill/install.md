# Workshop Skill Install

## Doporučená distribuce

Výchozí doporučení pro Harness Lab je instalace z veřejného repozitáře, ne přes npm balíček.

Proč:
- skill je primárně repo-native obsah
- stejné soubory slouží jako fallback i jako dokumentace
- veřejný repo install snižuje operativní overhead před workshopem

## Doporučený participant flow

1. otevřít veřejný workshop repo
2. nainstalovat Harness CLI:

```bash
npm install -g @harness-lab/cli
```

3. nainstalovat skill přímo z repa příkazem:

```bash
harness skill install
```

4. otevřít agent nástroj nad tímto repem
5. ověřit, že fungují minimálně:
   - Codex: `$workshop reference`, `$workshop setup`, `$workshop brief`
   - OpenCode: `/workshop reference`, `/workshop setup`, `/workshop brief`

Po úspěšné instalaci `harness skill install` rovnou vypíše doporučené první kroky, aby účastník věděl, že má v Codexu začít přes `$workshop ...` a v OpenCode přes `/workshop ...`.

## Poznámka

`harness skill install` vytvoří projektový bundle v `.agents/skills/harness-lab-workshop`, aby skill našly Codex i OpenCode ve stejném repu.

Pokud se někdy ukáže, že repo-based install je pro účastníky opakovaně bolestivý, může později vzniknout distribuční wrapper. Není to ale výchozí cesta.
