---
title: "Harness Economics"
last_verified: 2026-04-14
---

# Harness Economics

Per-agent hard limits, cache windows, and how to measure them. This doc exists to complete the principle in [`../content/codex-craft.md`](../content/codex-craft.md) section 4 — *"treat context budget the way a performance engineer treats latency — as a constraint you measure and optimize."* Measurement needs numbers.

**This is a reference, not enforcement.** There is no linter or check that reads from here. Vendor numbers drift; treat everything on this page as suspect after its `last_verified` date and re-check at the sources linked below before acting on any specific value.

## Why this exists

Context budget shows up in Harness Lab sessions as "the file got re-read 41 times", "analyze output got truncated", "the session forgot a constraint after the 30th turn". All three are measurable if you know the budget. Making the budget concrete lets a facilitator say *"you are burning 1,200 tokens per Read call on a file you have already read three times, and your cache window expires in 60 seconds"* instead of *"try to use less context."*

The workshop teaches context budget as a craft rule. This page makes the craft rule quantifiable.

## Per-agent hard limits

| Agent                | Context window     | Doc bundle cap         | Auto-loads on startup                 | Source                                        |
| -------------------- | ------------------ | ---------------------- | ------------------------------------- | --------------------------------------------- |
| OpenAI Codex CLI     | model-dependent    | **`project_doc_max_bytes = 32 KiB`** (configurable) | yes, `AGENTS.md` walked from git root | [Codex CLI AGENTS.md docs][codex-agents-md]   |
| Claude Code          | model-dependent    | no documented hard cap | yes, `CLAUDE.md` from project + user  | [Anthropic Claude Code docs][claude-code]     |
| Cursor               | model-dependent    | no documented hard cap | yes, `.cursor/rules` + `.cursorrules` | [Cursor docs][cursor-docs]                    |
| Aider                | model-dependent    | no documented hard cap | yes, `.aider.conf.yml` + `CONVENTIONS.md` | [Aider docs][aider-docs]                      |

**The 32 KiB Codex cap is load-bearing.** If your root `AGENTS.md` plus the nested files Codex walks downward from the cwd exceed 32 KiB, Codex silently stops concatenating. The symptom is "the agent didn't read the rule I put in the map" and the root cause is "your map didn't fit." Codex's concatenation order is root-first with closer-to-cwd overriding, so the thing you lose when the bundle overflows is the most-local context — exactly the guidance that should matter most.

Claude Code has no documented equivalent, but "no hard cap" is not "unlimited budget." Very long `CLAUDE.md` files still compete with conversation history and tool results for the effective context window.

## Prompt cache windows

Prompt caching makes repeated reads of the same prefix cheap, but only inside a time window. Once the window closes, the next request re-tokenizes everything and you pay full price.

| Provider  | TTL / window | What resets it                            | Source                                            |
| --------- | ------------ | ----------------------------------------- | ------------------------------------------------- |
| Anthropic | **5 minutes** from last use (extendable with explicit long-ttl block) | any request touching the cached prefix | [Anthropic prompt caching docs][anthropic-cache] |
| OpenAI    | varies by model and tier; typically minutes | any request touching the cached prefix | [OpenAI prompt caching docs][openai-cache]       |

**Practical implication:** if a session is blocked waiting on human input for more than five minutes, the next Claude turn pays full price on the entire accumulated context. Long-running `/work` sessions that checkpoint frequently stay hot; sessions that stall between turns eat full prices.

## How to measure context budget in practice

Measurement does not require vendor APIs. You can estimate well enough from session artifacts:

- **Claude Code session transcripts.** Stored at `~/.claude/projects/<slug>/*.jsonl`. One line per event. Sort by `wc -l` and by file size. Sessions over ~2 MB have typically blown past a healthy budget.
- **Codex session transcripts.** Stored under `~/.codex/sessions/`. Same shape, same signal.
- **Per-file Read counts in a session.** `jq -r 'select(.type=="tool_use" and .tool=="Read") | .input.file_path' session.jsonl | sort | uniq -c | sort -rn`. Any file with a count over 3 is a candidate for "summarize and work from the summary" rather than re-reading.
- **Tool-result output sizes.** Large `gh run view`, `npm test`, or `playwright test` results eat context that could have been trimmed with `| tail -n 200`.
- **Cache hit rate.** Anthropic API returns `cache_read_input_tokens` in response metadata when you use the API directly. Claude Code uses it under the hood but does not surface it per-turn in the TUI — check `~/.claude/` session files if you need the numbers.

None of these require instrumentation. They're all after-the-fact readouts from what the harness already writes to disk.

## Revalidation

The numbers on this page drift whenever vendors update their products. Re-verify at each of the following moments:

- Before running a new cohort of Harness Lab.
- When an agent surfaces unexpected context behavior (missing rule, truncated output, cache miss where a hit was expected).
- When a vendor announces a model or CLI update that touches context handling.

Update `last_verified` in the frontmatter above when you re-check. Numbers without a recent verification date are folklore, not doctrine.

[codex-agents-md]: https://developers.openai.com/codex/guides/agents-md
[claude-code]: https://docs.claude.com/en/docs/claude-code/overview
[cursor-docs]: https://docs.cursor.com/context/rules
[aider-docs]: https://aider.chat/docs/config/options.html
[anthropic-cache]: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
[openai-cache]: https://platform.openai.com/docs/guides/prompt-caching
