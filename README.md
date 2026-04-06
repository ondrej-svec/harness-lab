# Harness Lab

**Praktický workshop pro vývojáře**, kteří chtějí stavět s AI agenty tak, aby práce přežila další iteraci, dalšího člověka i další kontextové okno.

## Co je Harness Lab?

Harness Lab učí, jak kolem AI agentů postavit funkční pracovní systém přímo v repozitáři.

Účastníci si během dne prakticky vyzkouší:
- **Práci s kontextem**: jak psát `AGENTS.md`, skills a runbooky, které zrychlují další práci místo chaosu
- **Strukturovaný workflow**: `brainstorm` → `plan` → implementace → `review`
- **Řízení agentů**: jak zadávat práci, dělit ji a kontrolovat výstupy podobně jako u lidského týmu
- **Dlouhodobost řešení**: jak dostat pravidla, rozhodnutí a provozní know-how z hlavy do repa

## Non-Negotiables

Při práci s coding agenty bereme jako základ:
- **testy před implementací**, když je změna dost důležitá na to, aby stála za automatizaci
- **tracer bullet a e2e ověření** tam, kde nestačí číst jednotlivé soubory
- **kombinaci repeatable browser testů a agent-driven UI kontroly** u důležitých UI flow
- **review a explicitní kritéria hotovo** místo slepé důvěry v agent output

Výchozí UI pattern v tomto repu je:
1. agent exploration v izolovaném lokálním prostředí
2. Playwright regression pro kritický flow
3. human review před potvrzením změny

Repo záměrně neučí „prostě nech model ovládat tvůj běžný přihlášený browser“ jako default. Širší browser autonomy patří jen do sandboxovaného a vědomě omezeného prostředí.

Když člověk kóduje sám, část důvěry stojí na tom, že přesně ví, co napsal. Když necháte větší část práce na agentovi, musíte tuto důvěru nahradit systémem ověřování. Testy nejsou overhead. Jsou to koleje, které drží agenta v mezích zadání.

## Jak workshop funguje

Workshop je postavený jako praktické build prostředí:
- týmy dostanou brief a začnou stavět s AI agenty
- během dne pracují s dashboardem, workshop skillem a vlastním repem
- kvalita kontextu, workflow a dokumentace přímo ovlivňuje, jak snadno lze v práci pokračovat

Smyslem není napsat co nejvíc kódu. Smyslem je vybudovat repo, ve kterém se dá bezpečně pokračovat.

## Co je v repozitáři

- `dashboard/` — live workshop dashboard a základ budoucího facilitator control plane
- `content/` — projektové briefy, challenge karty, talks a facilitační obsah
- `workshop-skill/` — participant-facing skill pro Codex / OpenCode
- `monitoring/` — monitorovací MVP a pomocné skripty pro facilitátora
- `capture/` — šablony a podklady pro rychlý záznam pozorování
- `materials/` — tiskové a provozní materiály
- `docs/` — rozhodnutí a interní architektura workshop systému

## Public vs Private

Repo je navržený jako **public template repo**:
- obsahuje veřejně sdílitelný workshop framework
- používá jen ukázková data pro dashboard
- neobsahuje reálné termíny, místa ani live operační stav

Reálný běh workshopu patří do **private workshop instance layer**:
- workshop instance metadata
- facilitátorský provoz
- checkpointy, monitoring a registry týmových rep

Pravidla jsou popsaná v [public-private-taxonomy.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/public-private-taxonomy.md).

## Resource Layers

Repo záměrně balí tři různé vrstvy:

- **internal harness** — backstage materiály pro maintainery a facilitátory, kteří provozují a rozvíjejí Harness Lab
- **learner resource kit** — participant-facing sada příkladů a artefaktů, které si účastníci mohou odnést do vlastních projektů
- **external reference gallery** — krátký seznam oficiálních dokumentací a kvalitních veřejných repozitářů pro pokračování po workshopu

Vstupní body:
- [internal-harness.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/internal-harness.md)
- [learner-resource-kit.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/learner-resource-kit.md)
- [learner-reference-gallery.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/learner-reference-gallery.md)
- [resource-packaging-model.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/resource-packaging-model.md)

## Dashboard Model

Dashboard má dvě role:
- **participant surface** — orientace během dne, briefy, challenge flow, reference
- **facilitator surface** — chráněný admin a operační řízení workshop instance

Lokálně dnes běží nad file-based store. Produkčně je připravený k přesunu na Vercel + privátní storage.

Deployment-grade env scoping a promotion rules jsou popsané v:
- [private-workshop-instance-env-matrix.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-env-matrix.md)
- [private-workshop-instance-deployment-spec.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-deployment-spec.md)
- [deployment-strategy.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/deployment-strategy.md)

Deploy flow běží přes nativní Git integraci ve Vercelu:
- PR → preview deploy
- push do `main` → production deploy

GitHub Actions CI je sloučené do jednoho workflow `Dashboard CI` a Vercel má čekat na check `Dashboard CI / deploy-ready`.
Workflow zahrnuje build/test/e2e i security gate (`gitleaks` + `Semgrep`).

Kritické je, aby měl Vercel project nastavený root directory na `dashboard`. Detaily jsou v [deployment-strategy.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/deployment-strategy.md).

## Workshop Skill

`workshop-skill/` je zamýšlený jako hlavní participant interface:
- pomáhá se setupem
- vrací briefy a reference
- generuje základní `AGENTS.md`
- připomíná fázi dne a další bezpečný krok

Výchozí doporučení je distribuovat skill z repa, ne přes npm balíček.

## Lokální spuštění

```bash
cd dashboard
npm install
npm run dev
npm run test
npm run test:e2e
```

Volitelné:
- nastav `HARNESS_ADMIN_PASSWORD`, pokud chceš lokálně chránit `/admin`

## Content Style

- Hlas a pravidla participant-facing textů jsou v [style-guide.md](/Users/ondrejsvec/projects/Bobo/harness-lab/content/style-guide.md)
- Praktické příklady formulací jsou v [style-examples.md](/Users/ondrejsvec/projects/Bobo/harness-lab/content/style-examples.md)
