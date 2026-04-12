---
title: "ADR: Workshop skill reference docs are English-canonical, not bilingually maintained"
type: adr
date: 2026-04-12
status: accepted
supersedes: partial section of 2026-04-08-feat-workshop-content-localization-and-canonical-english-authoring-plan.md
---

# Context

The Harness Lab workshop has two kinds of content:

1. **Participant-facing workshop copy** — agenda scene titles, hero bodies, callouts, project briefs, challenge cards. This is what a Czech participant reads on a presenter screen with their own eyes. Low-quality Czech here is directly visible and undermines the workshop.
2. **Skill reference docs** — `workshop-skill/reference.md`, `commands.md`, `recap.md`, `setup.md`, `follow-up-package.md`, etc. These are consumed by an AI coding agent (Codex, Claude Code, pi) on the participant's machine. The participant reads the agent's reply, not the source file.

Before this ADR, both kinds were being maintained bilingually — Czech root files in `workshop-skill/*.md` and parallel English files in `workshop-skill/locales/en/*.md`. `SKILL.md` line 76 explicitly stated that "the root-level files in `workshop-skill/` are the Czech-authored source."

That arrangement predated the 2026-04-08 canonical-English decision for workshop content and was never reconciled with it. It also produces a maintenance trap: every content edit needs a native-speaker translation pass, and the temptation to machine-paraphrase English into Czech produces calque-ridden output ("Holistické bije granulární") that a native Czech reader finds worse than the English source.

This came to a head during the 2026-04-12 Phase B content rewrite. The verification ladder reference doc (Phase D4) was appended to the Czech root `reference.md` in English by mistake, then re-translated into Czech by a non-native agent, producing low-quality output. The user called it out and asked whether parallel locales for skill docs are actually needed at all.

# Decision

**Skill reference docs are English-canonical, single-source, no parallel Czech.**

Rationale:

- **Agents translate naturally.** When a Czech participant asks the workshop skill a question, Claude Code / Codex / pi reads the English source and replies in Czech. That is exactly what a language model does well. The skill reference is not rendered to a screen — it is paraphrased by an agent.
- **Parallel locale trees invite drift and calques.** Machine-authored Czech translations produce exactly the kind of word-for-word English-shaped prose that a native speaker immediately notices. The right Czech-speaker review workflow exists for agenda content; applying it to skill reference docs means a native speaker reviews the same text twice (once in the agenda, once in the skill).
- **`SKILL.md` already points this direction.** Section "Language Resolution" says "command semantics stay in English" and "the authored language of a supporting doc does not decide the reply language by itself." The old root-is-Czech rule contradicted its own framing.
- **Participant-facing presenter copy is different.** Scene titles, hero bodies, callouts, and brief descriptions appear verbatim on a screen. Those still need reviewed Czech translations via the existing `cs_reviewed: false` governance on `workshop-content/agenda.json` and `content/project-briefs/`. This ADR does not touch that boundary.

# Consequences

**What changes:**

- `workshop-skill/reference.md` becomes the single canonical English source. All new skill reference content goes here and nowhere else.
- `workshop-skill/SKILL.md` is updated to remove the "root files are Czech-authored" rule and point contributors at the English-canonical model.
- The Phase D4 verification ladder content lands in `workshop-skill/reference.md` in English, full stop.
- A follow-up cleanup session retires the `workshop-skill/locales/` parallel tree and migrates the remaining Czech root files (`commands.md`, `recap.md`, `setup.md`, `follow-up-package.md`, `analyze-checklist.md`) to English canonical form. That is tracked in the 2026-04-12 content plan's follow-up list, not in this ADR.

**What does not change:**

- Participant-facing workshop copy that is rendered verbatim — agenda scenes, project briefs, challenge cards — remains bilingual with reviewed Czech translations via `cs_reviewed` governance.
- The `contentLang` concept in `SKILL.md` still applies to live workshop delivery, not to the authored language of reference files.
- The Phase B deferred-Czech-review workstream on `workshop-content/agenda.json` is unaffected. That content still needs a native-speaker translation pass before the first real workshop runs.

**Tradeoffs accepted:**

- A Czech participant asking the skill for reference content receives an agent-translated reply rather than pre-reviewed Czech prose. This is acceptable because (a) the reference material is coaching content, not memorable slide copy, and (b) the alternative — maintaining parallel Czech skill docs — produced visibly lower-quality results than agent-on-the-fly translation.
- Tests that previously asserted on specific Czech strings in the installed skill bundle are updated to match English canonical content.
