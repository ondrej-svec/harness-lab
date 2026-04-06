# Workshop Skill Install

## Doporučená distribuce

Výchozí doporučení pro Harness Lab je instalace z veřejného repozitáře, ne přes npm balíček.

Proč:
- skill je primárně repo-native obsah
- stejné soubory slouží jako fallback i jako dokumentace
- veřejný repo install snižuje operativní overhead před workshopem

## Doporučený participant flow

1. otevřít veřejný workshop repo
2. otevřít `workshop-skill/`
3. nainstalovat nebo připojit skill podle pravidel konkrétního nástroje
4. ověřit, že fungují minimálně:
   - `/workshop`
   - `/workshop setup`
   - `/workshop brief`
   - `/workshop reference`

## Poznámka

Pokud se někdy ukáže, že repo-based install je pro účastníky opakovaně bolestivý, může později vzniknout distribuční wrapper. Není to ale výchozí cesta.
