# Monitoring MVP

Manuální fallback pro facilitátora:

- ověř `AGENTS.md`
- spočítej commity za posledních 30 minut
- najdi `SKILL.md` nebo `.agents/skills`
- ověř `README`
- poznamenej, jestli jsou vidět testy nebo architektonické dokumenty

Dashboard shell už obsahuje seed data a API kontrakt pro monitoring snapshot. Další krok je nahradit seed data skutečným scannerem repozitářů.

## Použití

1. Zkopíruj `team-repos.example.tsv` na `team-repos.tsv`
2. Doplň lokální cesty ke klonům týmových repozitářů
3. Spusť:

```bash
./monitoring/scan-registered-repos.sh > monitoring/latest-monitoring.md
./monitoring/intermezzo-brief.sh monitoring/latest-monitoring.md
```

První skript vytvoří rychlý scan pro všechny týmy. Druhý z něj udělá 5-bodový brief pro další intermezzo.
