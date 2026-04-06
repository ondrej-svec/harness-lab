# Learner Reference Gallery

Tohle je krátký seznam zdrojů pro účastníky po workshopu.

Pravidlo je jednoduché:
- nejdřív oficiální dokumentace
- potom několik silných veřejných repozitářů
- nakonec malý počet patternů přímo relevantních pro Harness Lab

Jakmile tato stránka začne připomínat „awesome list“, je moc dlouhá.

## Oficiální dokumentace

- [OpenAI Codex documentation](https://developers.openai.com/codex)
  Použijte jako hlavní zdroj pro aktuální Codex workflows, skills, `AGENTS.md`, subagents a security guidance.

- [OpenAI Codex skills documentation](https://developers.openai.com/codex/skills)
  Hodí se ve chvíli, kdy chcete z opakovaných promptů udělat znovupoužitelné repo-native skills.

- [OpenAI Codex `AGENTS.md` documentation](https://developers.openai.com/codex/agents-md)
  Nejlepší výchozí bod pro pochopení toho, jak mají být repo instructions strukturované a scoped.

- [OpenAI Codex workflows](https://developers.openai.com/codex/workflows)
  Dobré pro převedení workshopových návyků do reálných projektových workflow.

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

## Praktické patterny

- Začněte repo kontextem dřív, než začnete opakovat prompt.
  V praxi: nejdřív přidejte `AGENTS.md`, build/test příkazy a konkrétní definici hotovo.

- Skills používejte pro opakované workflow, ne jako jednorázové chat makro.
  Když se stejný task vrací napříč více sessions nebo repy, je to kandidát na skill.

- Testy, tracer bullets a checklisty berte jako hranici důvěry.
  Čím víc autonomie agent dostane, tím méně stačí „rychle jsem projel diff“.

- Participant-facing příklady držte menší než backstage systémy.
  Dobrý learner artefakt je kopírovatelný a čitelný, ne vyčerpávající.

## Pravidlo čerstvosti

Tento seznam zrevidujte:
- před každým workshopovým během
- po větší změně Codex capabilities
- když doporučený repozitář zastará, začne být noisy nebo přestane být nejlepší ukázkou
