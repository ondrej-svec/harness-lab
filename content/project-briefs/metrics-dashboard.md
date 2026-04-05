# Metrics Dashboard

## Problém

Týmy mají data, ale chybí jim přehledná vizualizace, která podporuje rychlé rozhodování a sdílené porozumění.

## User stories

- Jako tým chci zobrazit několik metrik na jedné obrazovce.
- Jako facilitátor chci snadno měnit seed data bez zásahu do UI logiky.
- Jako nový tým po rotaci chci pochopit strukturu dat a obrazovek během několika minut.

## Architektonické poznámky

- Seed data a UI oddělte hned od prvního commitu.
- Mobile-first je výhoda, ale dashboard musí být čitelný i na projekci.
- README a monitoring mají vysvětlit, co už funguje a co zatím ne.

## Hotovo když

- Dashboard ukáže alespoň 3 metriky a jeden trend.
- Repo popisuje datové zdroje i mock fallback.
- Nový tým umí přidat další metriku bez rozbití layoutu.

## První krok pro agenta

Navrhni dashboard, který zvládne handoff. Nejdřív popiš datový model, komponenty a kritéria hotovo, teprve potom stav UI.
