# Learner Reference Gallery

Tohle je krátký seznam zdrojů pro účastníky po workshopu.

Pravidlo je jednoduché:
- nejdřív oficiální dokumentace
- potom několik silných veřejných repozitářů
- nakonec malý počet patternů přímo relevantních pro Harness Lab

Jakmile tato stránka začne připomínat „awesome list“, je moc dlouhá.

## Oficiální dokumentace

- [OpenAI Codex documentation](https://developers.openai.com/codex)
  Použijte jako hlavní zdroj pro aktuální Codex workflow, skills, `AGENTS.md`, subagenty a bezpečnostní doporučení.

- [OpenAI Codex best practices](https://developers.openai.com/codex/learn/best-practices)
  Nejlepší rychlý vstup pro to, jak Codex používat jako dlouhodobého spolupracovníka: kontext, `AGENTS.md`, review, verification, MCP a automatizace.

- [OpenAI Codex skills documentation](https://developers.openai.com/codex/skills)
  Hodí se ve chvíli, kdy chcete z opakovaných promptů udělat znovupoužitelné skills zapsané přímo v repu.

- [OpenAI Codex plugins](https://developers.openai.com/codex/plugins)
  Dobré pro pochopení, kdy v Codexu použít pluginy a marketplace místo samotných skills zapsaných v repu. Pro workshop je berte jako volitelný Codex akcelerátor, ne jako základní bootstrap.

- [OpenAI Codex build plugins](https://developers.openai.com/codex/plugins/build)
  Hodí se maintainerům, když chtějí pochopit marketplace model, repo-local marketplace nebo balení skills, app integrací a MCP serverů do jednoho Codex balíčku.

- [OpenAI Codex workflows](https://developers.openai.com/codex/workflows)
  Dobré pro převedení workshopových návyků do reálných projektových workflow.

- [OpenAI: Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)
  Dobré pro pochopení, proč má být repo knowledge systémem záznamu a proč jsou plans, review a garbage collection součást engineering discipline, ne bonus navíc.

- [Next.js AI Coding Agents](https://nextjs.org/docs/app/guides/ai-agents)
  Důležité hlavně pro Next.js projekty: ukazuje, proč mají agenti číst version-matched framework docs místo spoléhání na starší paměť modelu.

## Veřejné repozitáře

- [openai/codex](https://github.com/openai/codex)
  Oficiální CLI repozitář a nejlepší kotva pro to, jak se samotný nástroj vyvíjí.

- [openai/skills](https://github.com/openai/skills)
  Oficiální katalog skills a nejlepší reference pro to, jak vypadá Codex-native skill.

- [openai/codex-action](https://github.com/openai/codex-action)
  Silný příklad úzké a bezpečné automatizace kolem Codexu v CI.

- [vercel-labs/skills](https://github.com/vercel-labs/skills)
  Užitečné ve chvíli, kdy chcete skill packaging přenositelný napříč více coding agenty.

- [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
  Dobré příklady kvalitních a praktických skills, hlavně pro frontend a React práci.

## Volitelné workflow packs

- [EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin)
  Silná volitelná volba pro lidi, kteří chtějí explicitní loop `brainstorm -> plan -> work -> review -> compound`. Repo dnes umí instalaci i pro Codex a pi, ale berte to jako akcelerátor nad workshop defaultem, ne jako nutný setup.

## Praktické patterny

- Začněte repo kontextem dřív, než začnete opakovat prompt.
  V praxi: nejdřív přidejte `AGENTS.md`, build/test příkazy a konkrétní definici hotovo.

- Skills používejte pro opakované workflow, ne jako jednorázové chat makro.
  Když se stejný task vrací napříč více sessions nebo repy, je to kandidát na skill.

- Pluginy a marketplace berte jako Codex-specific distribuční vrstvu, ne jako definici workshop metody.
  Když něco učíme jako výchozí přístup v Harness Labu, mělo by to dávat smysl i mimo Codex. Plugin má smysl tam, kde skutečně přidává Codex integrace nebo pohodlnější distribuci.

- Testy, tracer bullets a checklisty berte jako hranici důvěry.
  Čím víc autonomie agent dostane, tím méně stačí „rychle jsem projel diff“.

- Příklady pro účastníky držte menší než backstage systémy.
  Dobrý learner artefakt je kopírovatelný a čitelný, ne vyčerpávající.

## Pravidlo čerstvosti

Tento seznam zrevidujte:
- před každým workshopovým během
- po větší změně Codex capabilities
- když doporučený repozitář zastará, začne být noisy nebo přestane být nejlepší ukázkou
