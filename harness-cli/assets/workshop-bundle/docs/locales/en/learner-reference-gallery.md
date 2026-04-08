# Learner Reference Gallery

This is a short list of resources for participants after the workshop.

The rule is simple:
- official documentation first
- then a few strong public repos
- and finally a small number of patterns directly relevant to Harness Lab

Once this page starts to look like an “awesome list,” it has become too long.

## Official documentation

- [OpenAI Codex documentation](https://developers.openai.com/codex)
  Use this as the main source for current Codex workflows, skills, `AGENTS.md`, subagents, and security guidance.

- [OpenAI Codex best practices](https://developers.openai.com/codex/learn/best-practices)
  The best fast entry point for using Codex as a long-term collaborator: context, `AGENTS.md`, review, verification, MCP, and automation.

- [OpenAI Codex skills documentation](https://developers.openai.com/codex/skills)
  Useful once you want to turn repeated prompts into reusable repo-native skills.

- [OpenAI Codex plugins](https://developers.openai.com/codex/plugins)
  Good for understanding when to use plugins and marketplace distribution in Codex instead of repo-native skills alone. In this workshop, treat plugins as an optional Codex accelerator, not as the core bootstrap.

- [OpenAI Codex build plugins](https://developers.openai.com/codex/plugins/build)
  Useful for maintainers who want to understand the marketplace model, repo-local marketplace patterns, or bundling skills, app integrations, and MCP servers into one Codex package.

- [OpenAI Codex workflows](https://developers.openai.com/codex/workflows)
  Good for turning workshop habits into real project workflows.

- [OpenAI: Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)
  Useful for understanding why repo knowledge should be the system of record and why plans, review, and garbage collection belong to engineering discipline rather than bonus process.

- [Next.js AI Coding Agents](https://nextjs.org/docs/app/guides/ai-agents)
  Important mainly for Next.js projects: it shows why agents should read version-matched framework docs instead of relying on stale model memory.

## Public repositories

- [openai/codex](https://github.com/openai/codex)
  The official CLI repo and the best anchor for how the tool itself evolves.

- [openai/skills](https://github.com/openai/skills)
  The official skills catalog and the best reference for what a Codex-native skill looks like.

- [openai/codex-action](https://github.com/openai/codex-action)
  A strong example of narrow, safe automation around Codex in CI.

- [vercel-labs/skills](https://github.com/vercel-labs/skills)
  Useful when you want skill packaging that stays portable across more than one coding agent.

- [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
  Good examples of practical, high-quality skills, especially for frontend and React work.

## Optional workflow packs

- [EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin)
  A strong optional choice for people who want an explicit `brainstorm -> plan -> work -> review -> compound` loop. This repo supports installation for both Codex and pi, but treat it as an accelerator on top of the workshop default, not as required setup.

## Practical patterns

- Start with repo context before you start repeating the prompt.
  In practice: first add `AGENTS.md`, build/test commands, and a concrete definition of done.

- Use skills for repeated workflows, not as one-off chat macros.
  If the same task returns across multiple sessions or repos, it is a good skill candidate.

- Treat plugins and marketplace distribution as a Codex-specific delivery layer, not as the definition of the workshop method.
  If something is taught as a Harness Lab default, it should still make sense outside Codex. A plugin makes sense where it genuinely adds Codex integrations or easier distribution.

- Treat tests, tracer bullets, and checklists as the trust boundary.
  The more autonomy the agent gets, the less “I skimmed the diff quickly” is enough.

- Keep participant-facing examples smaller than backstage systems.
  A good learner artifact is copyable and readable, not exhaustive.

## Freshness rule

Review this list:
- before every workshop run
- after a major change in Codex capabilities
- when a recommended repo becomes stale, noisy, or stops being the best example
