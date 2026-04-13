# Participant Resource Kit

Post-workshop reference — krátká sada artefaktů, které si můžete odnést z Harness Lab do vlastního projektu: odkazy, šablony a pět pracovních návyků. Pro in-session coaching moves (co říct, když agent sklouzává) sáhněte po [`coaching-codex.md`](../../coaching-codex.md).

Cíl kitu: postavit si vlastní **harness** — repo, workflow a kontext, který **unese další krok** bez vás.

## 1. Začněte `AGENTS.md`

Použijte tento základ:
- `goal`
- `context`
- `constraints`
- `done when`

Výchozí šablona:
- [`workshop-skill/template-agents.md`](../../../workshop-skill/template-agents.md)

## 2. Přidejte jeden zdroj důvěry

Vyberte si alespoň jeden:
- build/test příkazy
- spustitelné ověření — tracer bullet, end-to-end check, holistický test. **Celek nad detailem.**
- review checklist

Když agent dělá větší kus práce, nestačí „rychle jsem to projel očima“.

Checklist pro handoff:
- [`workshop-skill/analyze-checklist.md`](../../../workshop-skill/analyze-checklist.md)

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

Ve výchozím nastavení nenechávejte model ovládat váš běžný přihlášený browser bez sandboxu a kontroly.

## 6. Co si projít po workshopu

- [`workshop-skill/reference.md`](../../../workshop-skill/reference.md)
- [`workshop-skill/recap.md`](../../../workshop-skill/recap.md)
- [`docs/learner-reference-gallery.md`](../../../docs/learner-reference-gallery.md)
- [`content/codex-craft.md`](../../../content/codex-craft.md) — Codex-specific craft (approval módy, sandboxing, long-horizon drift, před/po příklad, failure recovery)
- [`materials/coaching-codex.md`](../../coaching-codex.md) — jednostránkový pocket card konverzačních tahů pro coaching agenta

Poznámka:
- `workshop` skill je garantovaný výchozí nástroj workshopu
- další workflow skills a veřejné toolkity berte jako volitelné akcelerátory, ne povinný setup

## Kdy se návyky spustí — pět návyků, pět spouštěčů

Každý z pěti pracovních návyků má svůj spouštěč — moment ve vašem běžném pracovním dni, kdy se návyk aktivuje. Jsou to ty samé tagy, které uvidíte na challenge kartách v repu.

- Když **otevíráte nový repo, nový úkol nebo novou agent session** → **Map before motion** — uděláte z repa mapu, než začnete generovat.
- Když **agent dostává úkol a vy chystáte prompt** → **Boundaries create speed** — napíšete omezení dřív než prompt. Mantinely jsou důvod, proč práce jede rychleji, ne proč jede pomaleji.
- Když **cítíte dost jistoty na to, abyste šli dál** → **Verification is the trust boundary** — ta jistota je spouštěč k ověření, ne k přeskočení. Holisticky: dokažte, že drží celek, ne že jedna funkce vrátila 4.
- Když **zavíráte chat, končíte hovor nebo pairing, kde padlo rozhodnutí** → **If it is not in the repo, it does not exist** — zapíšete rozhodnutí do repa — do zítřka by se jinak rozplynulo.
- Když **se stejná třecí plocha, ruční krok nebo drobnost objeví podruhé** → **Cleanup is part of build** — proměníte to v check, template nebo pravidlo na místě, ne „později".

## Výzva na příště

Až si **příště otevřete coding agenta**:

1. Přidejte `AGENTS.md` do jednoho reálného projektu — goal, context, constraints, done when. Mapa, ne encyklopedie.
2. Přesuňte jedno trvalé pravidlo z promptu do repa. Pokud ho říkáte podruhé, patří tam.
3. Přidejte jeden review nebo handoff checklist. Nejmenší funkční verze stačí.

## Minimum viable harness pro váš tým

Nemusíte tým přesvědčovat o „harness engineeringu." Stačí ukázat užitečný `AGENTS.md`, který ušetřil 20 minut onboardingu.

Nejmenší verze, která přežije skeptické code review:

1. **Jeden `AGENTS.md`** — goal, build/test příkazy, jedno explicitní omezení. **Mapa, ne encyklopedie.** Nic víc.
2. **Jeden spustitelný check** — tracer bullet nebo end-to-end smoke test, který ověří, že celek drží. Ne jednu funkci.

Když se někdo zeptá „proč to děláme?“, odpověď je: „Aby se další člověk nemusel ptát vás.“

Jednou za měsíc si přečtěte svůj `AGENTS.md` skeptickým okem. Smažte, co už není nosné. Přidejte, co tým říká nahlas podruhé.

## Co číst po workshopu, abyste zůstali aktuální

Codex a další kódovací agenti se mění měsíčně. Tenhle kit není zmrazená reference — je to startovní harness pro vaši vlastní čtecí praxi.

- **Codex CLI release notes** — čtěte při každém vydání. Změny v approval módech a sandboxingu jsou ty nejdůležitější.
- **Simon Willison's blog** ([simonwillison.net](https://simonwillison.net/)) — praktický zdroj o Codexu, Claude Code a dalších agentech. Píše z vlastní každodenní praxe.
- **OpenAI Harness Engineering articles** — viz `docs/learner-reference-gallery.md` pro odkazy.
- **Anthropic engineering blog** — když pracujete s Claude Code, sledujte oficiální posts.
- **Vlastní `AGENTS.md` jako živý dokument** — každé čtvrtletí si ho znovu přečtěte skeptickým okem. Smažte, co už není nosné. Jednoduchost je součást harnessu.
- **Vlastní `docs/solutions/` nebo runbook** — když narazíte na failure mode ve své práci, zapište si ho. Váš tým se má učit ze svých vlastních chyb, ne jen z tohoto kitu.
