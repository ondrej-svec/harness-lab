# Capture MVP

Nejrychlejší fungující varianta:

1. Ondřej nadiktuje poznámku do telefonu nebo Wispr Flow.
2. Přepis vloží do markdown souboru.
3. Agent z poznámky vytáhne:
   - který tým se týká
   - co se stalo
   - na jaký princip to ukazuje
   - co použít v příštím intermezzu

Automatizace může přijít později. Pro workshop je důležitější spolehlivost než elegance.

## Doporučený flow

1. Vytvoř nový markdown soubor v `capture/notes/`
2. Použij `capture/templates/observation.md`
3. Vyplň tým, pozorování, princip a jednu větu pro intermezzo
4. `monitoring/intermezzo-brief.sh` si vytáhne nejnovější poznámku jako vstup
