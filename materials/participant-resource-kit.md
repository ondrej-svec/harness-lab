# Participant Resource Kit

Krátká sada artefaktů, které si můžete odnést z Harness Lab do vlastního projektu.

## 1. Začněte `AGENTS.md`

Použijte tento základ:
- `goal`
- `context`
- `constraints`
- `done when`

Výchozí šablona:
- [`workshop-skill/template-agents.md`](../workshop-skill/template-agents.md)

## 2. Přidejte jeden zdroj důvěry

Vyberte si alespoň jeden:
- build/test příkazy
- spustitelné ověření (unit test nebo tracer bullet)
- review checklist

Když agent dělá větší kus práce, nestačí „rychle jsem to projel očima“.

Checklist pro handoff:
- [`workshop-skill/analyze-checklist.md`](../workshop-skill/analyze-checklist.md)

## 3. Používejte malý workflow, ne chaos

Doporučený základ:
- `workshop` pro orientaci a další bezpečný krok
- `/brainstorm`, když ještě není jasný scope nebo první slice
- `/plan` před větší implementací
- `/work` nebo jiný úzký implementační loop, když už víte co stavíte
- test nebo jiné spustitelné ověření před důležitou změnou
- `/review` po větším kusu práce
- `/compound` nebo krátká poznámka zapsaná přímo v repu, když objev udělá další práci levnější
- průběžný úklid: build/test příkazy, omezení a handoff poznámky přesouvejte z chatu do repa

## 4. Přesuňte jedno pravidlo z chatu do repa

Typické kandidáty:
- build/test příkazy
- bezpečnostní omezení
- definice hotovo
- pravidlo pro handoff

## 5. Pro UI práci držte bezpečný postup

Výchozí pattern:
- `agent exploration`
- `Playwright regression`
- `human review`

Nenechávejte model jako výchozí volbu ovládat váš běžný přihlášený browser bez sandboxu a kontroly.

## 6. Co si projít po workshopu

- [`workshop-skill/reference.md`](../workshop-skill/reference.md)
- [`workshop-skill/recap.md`](../workshop-skill/recap.md)
- [`docs/learner-reference-gallery.md`](../docs/learner-reference-gallery.md)
- [`content/codex-craft.md`](../content/codex-craft.md) — Codex-specific craft (approval módy, sandboxing, long-horizon drift, před/po příklad, failure recovery)
- [`materials/coaching-codex.md`](coaching-codex.md) — jednostránkový pocket card konverzačních tahů pro coaching agenta

Poznámka:
- `workshop` skill je garantovaný výchozí nástroj workshopu
- další workflow skills a veřejné toolkity berte jako volitelné akcelerátory, ne povinný setup

## Kdy se návyky spustí

Každý z pěti pracovních návyků má svůj spouštěč — moment ve vašem běžném pracovním týdnu, kdy se návyk aktivuje:

- Když **otevíráte nový repo, nový úkol nebo novou agent session** → Map before motion (udělám z repa mapu, než začnu generovat)
- Když **zavíráte chat, končíte hovor nebo pairing kde padlo rozhodnutí** → If it is not in the repo, it does not exist (zapíšu rozhodnutí do repa)
- Když **cítím dost jistoty na to, abych šel dál** → Verification is the trust boundary (ta jistota je spouštěč k ověření, ne k přeskočení)
- Když **chystám úkol pro agenta** → Boundaries create speed (napíšu omezení dřív než prompt)
- Když **se stejná připomínka, třecí plocha nebo ruční krok objeví podruhé** → Cleanup is part of build (proměním to v check, template nebo pravidlo)
- Když **se stejný problém opakuje** → Fix the system, not just the symptom (neopravím výstup — opravím systém)

## Výzva na příští týden

1. Přidejte `AGENTS.md` do jednoho reálného projektu.
2. Přesuňte jedno trvalé pravidlo z promptu do repa.
3. Přidejte jeden review nebo handoff checklist.

## Minimum viable harness pro váš tým

Nemusíte tým přesvědčovat o „harness engineeringu." Stačí ukázat užitečný `AGENTS.md`, který ušetřil 20 minut onboardingu.

Nejmenší verze, která přežije skeptické code review:

1. **Jeden `AGENTS.md`** — goal, build/test příkazy, jedno explicitní omezení. Nic víc.
2. **Jeden spustitelný check** — unit test, tracer bullet, nebo jednoduchý smoke test.

Když se někdo zeptá „proč to děláme?“, odpověď je: „Aby se další člověk nemusel ptát tebe.“

Měsíční rytmus: každý měsíc si přečtěte svůj `AGENTS.md` skeptickým okem. Smažte, co už není nosné. Přidejte, co tým říká nahlas podruhé.

## Co číst po workshopu, abyste zůstali aktuální

Codex a další kódovací agenti se mění měsíčně. Tenhle kit není zmrazená reference — je to startovní harness pro vaši vlastní čtecí praxi.

- **Codex CLI release notes** — čtěte při každém vydání. Změny v approval módech a sandboxingu jsou ty nejdůležitější.
- **Simon Willison's blog** ([simonwillison.net](https://simonwillison.net/)) — praktický zdroj o Codexu, Claude Code a dalších agentech. Píše z vlastní každodenní praxe.
- **OpenAI Harness Engineering articles** — viz `docs/learner-reference-gallery.md` pro odkazy.
- **Anthropic engineering blog** — když pracujete s Claude Code, sledujte oficiální posts.
- **Vlastní `AGENTS.md` jako živý dokument** — každé čtvrtletí si je znovu přečtěte skeptickým okem. Smažte, co už není nosné. Jednoduchost je součást harnessu.
- **Vlastní `docs/solutions/` nebo runbook** — když narazíte na failure mode ve své práci, zapište si ho. Váš tým se má učit ze svých vlastních chyb, ne jen z tohoto kitu.
