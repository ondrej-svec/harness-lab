---
title: "Public Homepage Copy"
type: brainstorm
date: 2026-04-07
participants: [Ondrej, Codex]
related:
  - ../../dashboard/lib/ui-language.ts
  - ../../content/style-guide.md
  - ../../content/style-examples.md
  - 2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md
---

# Public Homepage Copy

## Problem Statement

The current public homepage copy explains internal mechanics better than it explains Harness Lab itself.

It overuses `repo` as the visible frame of the workshop, even though `repo clarity` is a supporting practice, not the core promise. It also uses internal-facing phrasing such as "veřejná vstupní vrstva" and "reálný repozitář," which may be accurate inside the system model but make the public page sound abstract, technical, and slightly machine-written.

The actual job of the homepage is:

- explain clearly what Harness Lab is
- show that it is about real team work with AI coding agents, not generic AI hype
- make the method feel disciplined, durable, and distinct without sounding like a manifesto or sales page

## Context

Current copy in [`dashboard/lib/ui-language.ts`](../../dashboard/lib/ui-language.ts) has several issues:

- the hero leads with "kontext, workflow a spolupráce ... v reálném repozitáři," which makes the artifact feel more important than the work
- the principles section uses "repo před improvizací" as a headline, which is memorable but too narrow and too artifact-centered
- the footer line "Veřejná vstupní vrstva..." sounds like architecture documentation, not homepage copy
- multiple lines are true from a system-design perspective but weak from a human-reading perspective

Voice guidance in [`content/style-guide.md`](../../content/style-guide.md) and [`content/style-examples.md`](../../content/style-examples.md) reinforces:

- natural Czech first
- practical, peer-level tone
- no corporate abstraction
- no overtranslated or AI-sounding phrasing

Related workshop framing already points toward a stronger message:

- Harness Lab is about working well with AI coding agents as a team
- the important distinction is not "AI" but "disciplined, maintainable software work with AI agents"
- `context`, `verification`, `handoff`, and `repo clarity` are enabling practices, not the homepage headline

## Approaches Explored

### Approach 1: Repository-first framing

Example direction:

"Celodenní workshop o kontextu, workflow a spolupráci s AI coding agenty v reálném repozitáři."

What it optimizes for:

- consistency with internal workshop doctrine
- explicit mention of `repo` and durable artifacts

What it costs:

- feels narrower than the real workshop
- sounds more like process infrastructure than team practice
- drifts toward internal language

Verdict:

Rejected as the primary framing. `Repo` should remain visible, but as support, not as the workshop's identity.

### Approach 2: Teamwork-with-agents framing

Example direction:

"Celodenní workshop o tom, jak týmy pracují s AI coding agenty na skutečném softwaru."

What it optimizes for:

- clarity
- human-centered framing
- immediate understanding of what the workshop is about

What it costs:

- on its own it may sound slightly generic
- needs a stronger second line to express what makes Harness Lab different

Verdict:

Strong base layer. Best candidate for the main sentence.

### Approach 3: Anti-chaos / operating-system framing

Example direction:

"Praktický workshop o tom, jak pracovat s AI coding agenty bez chaosu, bez improvizace a tak, aby se na práci dalo navázat."

What it optimizes for:

- distinctiveness
- emotional clarity
- strong contrast with shallow AI workflows and one-shot demo behavior

What it costs:

- too negative if used alone
- can become slogan-heavy if overused

Verdict:

Best used as the differentiating layer underneath the main explanation, not as the headline itself.

## Chosen Approach

Use a combined framing:

- first explain Harness Lab as a workshop about how teams work with AI coding agents
- then immediately define the differentiator: disciplined, maintainable, reviewable software work instead of agent chaos
- keep `repo`, `context`, `verification`, and `handoff` language in supporting copy, not in the first sentence

## Why This Approach

This approach keeps the message aligned with the real substance of the workshop.

It explains the workshop in human terms first:

- teams
- software work
- AI coding agents

Then it earns distinctiveness through the way of working:

- less improvisation
- better context
- ongoing verification
- work another team can continue

This also matches the user's critique:

- the page should not sound like architecture notes
- the page should not over-rotate into `repo` language
- the page can be a bit courageous, but the Czech must stay precise and natural

## Key Design Decisions

### Q1: What should the homepage say Harness Lab is? — RESOLVED

**Decision:** The homepage should describe Harness Lab as a workshop about how teams work with AI coding agents on real software.

**Rationale:** This is the clearest and broadest true statement. It describes the workshop itself, not just one of its methods.

**Alternatives considered:** A `repo`-first explanation was rejected because it shrinks the workshop into one artifact. A pure `context engineering` explanation was rejected because it is too internal and too narrow as the lead frame.

### Q2: What should make the workshop feel distinct? — RESOLVED

**Decision:** Distinctiveness should come from the anti-chaos, long-term, maintainable way of working, not from jargon.

**Rationale:** The strongest contrast is not "we use agents" but "we use them without turning the work into chaos, disposable output, or demo theater."

**Alternatives considered:** Leaning on "harness engineering" in the hero was rejected because it is important but not self-explanatory enough for the front page.

### Q3: What role should `repo` language play? — RESOLVED

**Decision:** `Repo` should appear as a practical consequence of the method, not as the top-level message.

**Rationale:** The workshop does care about what survives in the repo, but readers should first understand the kind of work and collaboration the workshop teaches.

**Alternatives considered:** Keeping headlines such as "repo před improvizací" was rejected because it makes the artifact sound like the protagonist.

### Q4: How bold should the page sound? — RESOLVED

**Decision:** The page should be mostly calm and precise, with selective boldness in contrast lines.

**Rationale:** That keeps it credible and avoids sounding like AI-generated brand copy, while still giving the page a point of view.

**Alternatives considered:** A fully neutral tone was rejected because it would flatten the message. A fully manifesto-like tone was rejected because it would sound like a sales page.

## Assumption Audit

Assumption audit for the chosen approach:

- ✓ **Bedrock:** The homepage needs to explain Harness Lab clearly before it explains architecture or boundaries.
- ✓ **Bedrock:** The current copy over-indexes on `repo` framing relative to the actual workshop promise.
- ✓ **Bedrock:** The workshop is centrally about team work with AI coding agents, not just prompting or one-off generation.
- ? **Unverified:** Public-facing language such as "bez chaosu" will feel sharp and useful rather than too rhetorical.
- ? **Unverified:** Readers will understand "AI coding agenti" immediately enough without extra anchoring.
- ? **Unverified:** The homepage can hint at `harness engineering` without introducing too much terminology too early.
- ✗ **Weak:** "If the architecture wording is true, it belongs on the homepage." This is weak because truth is not the same as good framing.

The unverified assumptions are acceptable for the rewrite, but should be checked by reading the draft out loud and pressure-testing it against "would a Czech developer say this naturally?"

## Draft Direction

### Hero direction A

**Eyebrow:** workshop pro týmy, které pracují s AI coding agenty

**Lead:** Celodenní workshop o tom, jak s AI coding agenty stavět software tak, aby po nich nezůstal chaos.

**Body:** Nejde o demo promptů ani o jednorázové hacky. Jde o kontext, rozhodnutí, ověřování a způsob práce, na který může navázat další člověk i další agent.

Why it works:

- clear
- distinct
- natural spoken Czech

Risk:

- "po nich nezůstal chaos" is strong and should be kept only if the page wants some edge

### Hero direction B

**Eyebrow:** jak v týmu pracovat s AI coding agenty

**Lead:** Praktický workshop o týmové práci s AI coding agenty na skutečném softwaru.

**Body:** Jak nastavit kontext, pravidla a workflow tak, aby agenti práci zrychlovali, ale nerozbíjeli kvalitu, návaznost a možnost pokračovat dál.

Why it works:

- more restrained
- still specific
- avoids internal architecture vocabulary

Risk:

- less memorable than direction A unless paired with stronger principles

### Hero direction C

**Eyebrow:** pracovní systém pro éru AI coding agentů

**Lead:** Harness Lab ukazuje, jak dělat týmovou softwarovou práci s AI coding agenty tak, aby byla čitelná, ověřitelná a udržitelná.

**Body:** Kontext, rozhodnutí, testy, review a handoff tu nejsou administrativa navíc. Jsou to věci, díky kterým se s agenty dá pracovat dobře i zítra.

Why it works:

- most conceptually complete
- best bridge toward harness engineering

Risk:

- nearest to abstract language if not edited carefully

## Principle Direction

The principle cards should shift from artifact-first to work-first framing.

Recommended direction:

- **nejdřív vyjasnit, pak generovat**
  Agent bez záměru a omezení nezačne tvořit, ale improvizovat. Dřív než pustíte další krok, ujasněte si, co má vzniknout a podle čeho poznáte, že to dává smysl.

- **ověřujte dřív, než jdete dál**
  Každý důležitý posun co nejdřív opřete o důkaz. Menší ověřený krok je cennější než rychlý postup, který se později rozpadne.

- **pracujte tak, aby se dalo navázat**
  Další člověk ani další agent nemá hádat, co se stalo. Z práce má být jasné, co platí, co je křehké a jaký je bezpečný další krok.

## Other Copy Notes

### Footer

Current:

"Veřejná vstupní vrstva workshopu o kontextovém inženýrství, práci s repozitářem a spolupráci s ai agenty."

Recommended direction:

- "Veřejný přehled workshopu o týmové práci s AI coding agenty."
- or "Veřejný přehled Harness Labu. Konkrétní kontext vaší místnosti odemyká až event code."

### Details section

The public details section should stay factual, but still speak in human terms.

Recommended `co to je` direction:

"Harness Lab je praktický workshop o tom, jak používat AI coding agenty při skutečné týmové práci na softwaru. Důraz je na způsob práce, který zůstává srozumitelný, ověřitelný a použitelný i po dalším předání."

## Open Questions

- Should the public page use the word "chaos" explicitly, or keep that contrast implied?
- Should "harness engineering" appear on the homepage at all, or only in blueprint / deeper explanatory surfaces?
- Should the lead sentence say "stavět software" or "pracovat na softwaru"?
- How much of the anti-hype / anti-demo stance should appear publicly versus being left implicit?

## Out of Scope

- final UI implementation
- English copy rewrite
- section order or layout changes
- visual redesign

## Next Steps

- Rewrite the homepage copy in [`dashboard/lib/ui-language.ts`](../../dashboard/lib/ui-language.ts) using the chosen direction
- Read the Czech copy out loud and cut anything that sounds translated or overdesigned
- Consider a small follow-up note or ADR if the homepage framing changes the stable product language across the repo
- `$plan` if the copy rewrite should be paired with structural page changes
