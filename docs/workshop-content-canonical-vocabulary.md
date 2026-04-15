# Canonical Vocabulary — Workshop Content

**Purpose.** This document is the spec against which all participant-facing content aligns. It exists because the 2026-04-12 agenda rewrite (`2046fbc`) and the 2026-04-13 Czech review pass (`d7b9000`) consolidated workshop vocabulary — but downstream artifacts (talk script, coaching codex, resource kit, facilitation guide, challenge cards) had partially drifted.

**Source of truth.** `workshop-content/agenda.json`. If this document and the agenda ever disagree, the agenda wins and this document is out of date.

**Scope.** This document covers participant-facing surfaces: talks, demo script, coaching codex, resource kit, facilitation master-guide, challenge cards, project briefs. It does **not** govern internal docs, engineering prose, or the style reference files in `content/` (`codex-craft.md`, `style-guide.md`, `style-examples.md`).

---

## 1. Canonical habit taxonomy — the five tags

The five tags from `content/challenge-cards/deck.md` are the **single habit taxonomy** across the repo. Every habit, principle-as-habit, or "what to practice after the workshop" surface uses exactly these five names. No synonyms, no parallel taxonomies.

| # | Tag (canonical) | What it means | Primary moment | When it fires |
|---|---|---|---|---|
| 1 | **Map before motion** | Before generating anything, make the repo a place someone can orient in. A short `AGENTS.md`, a plan, a next safe step — not a warehouse. | Build Phase 1 opening, any handoff arrival | "Můžu vygenerovat další funkci." → Stop. Map first. |
| 2 | **Verification is the trust boundary** | When the agent does more, you verify better. Holistic over granular. Tracer bullets, end-to-end checks, done-when criteria — written before the agent runs. | Before delegation, before merge, before handoff | "Agent říká, že je hotovo." → Where's the check? |
| 3 | **Boundaries create speed** | Constraints aren't friction. They're why work goes fast. `/plan` before code, scoped threads, explicit mantinely — agents move faster inside them, not around them. | Delegation, parallel work, mid-session when team is thrashing | "Nemáme čas na plán." → That's why you need one. |
| 4 | **If it is not in the repo, it does not exist** | Ústní pravidla, Slack dovysvětlení, "to si pamatujeme" — to všechno zmizí při rotaci. Move it to `AGENTS.md`, a runbook, a test, a README. | Any time a rule is spoken twice, any time a handoff is imminent | "Team just said a rule out loud." → Into the repo. |
| 5 | **Cleanup is part of build** | Repo maintenance isn't a post-workshop bonus. When you hit repeating chaos, turn it into a check, template, or runbook on the spot. | After any repeated friction, before rotation, before Reveal | "This keeps biting us." → Fix the system, not the symptom. |

**Anti-patterns (do not use).**
- ❌ Six-habit taxonomy from the old `materials/participant-resource-kit.md` "Kdy se návyky spustí" section (to be removed in T6).
- ❌ "Fix the system, not just the symptom" as a named habit — it's the spirit of #5, not a sixth habit.
- ❌ "Minimum viable harness" as a named habit — it's a concept, not a tag.
- ❌ Any habit name invented ad hoc in a rewrite.

---

## 2. Protected phrases — verbatim required

These phrases appear in the agenda verbatim. When downstream content references them, **use the exact wording**. Paraphrasing breaks the meme.

| Phrase | Where it lives in the agenda | Notes |
|---|---|---|
| **Humans steer. Agents execute.** (CS: **Lidé řídí. Agenti vykonávají.**) | Scene `talk-humans-steer`, the core line of the entire workshop | The most protected line of the day. Never paraphrase. |
| **Agent = Model + Harness** | Scene `talk-got-a-name` | Böckeler's equation. Render as equation, not prose. |
| **carries the next move** (CS: **unese další krok**) | Opening hero, `opening-framing` | Hero phrase — describes what a harness does. Must appear on the coaching codex participants take home. |
| **task drift** (CS: **task drift**, loanword) | Demo `demo-same-prompt`, talk `talk-argued-about-prompts` watch-fors | The named failure mode. Keep as English loanword in Czech — it's a term of art. |
| **If it is not in the repo, it does not exist** (CS: **Co není v repu, neexistuje**) | Scene `talk-how-to-build` pillar 1, principles, challenge card tag #4 | Habit #4 verbatim. |
| **Map before motion** | Challenge card tag #1, scene `opening-day-arc` frame | Habit #1. |

---

## 3. Canonical framings — named concepts

These are the concepts the agenda teaches. Downstream content can describe them in its own words, but must use these **names** when naming them.

| Concept | Canonical name (EN / CS) | Do not call it |
|---|---|---|
| The discipline being taught | **harness engineering** | "agent workflow", "AI engineering", "prompt engineering" |
| Steering mechanism that runs before the agent acts | **guides** (CS: **guides**, loanword) | "constraints", "rails", "pravidla" alone |
| Feedback mechanism that catches the agent after it acts | **sensors** (CS: **sensors**, loanword) | "checks", "testy" alone, "monitoring" |
| Holistic verification technique | **tracer** / **tracer bullet** (CS: **tracer bullet**, loanword) | "unit test", "one function plus one test", "smoke test" |
| The structure taught in `talk-how-to-build` | **four pillars** (CS: **čtyři sloupy**) | "principles", "rules" |
| The equation | **Agent = Model + Harness** | "Agent equals..." (prose form) |
| The shift in role | **managing, not chatting** (CS: **managing, ne chatování**) | "driving the agent", "pair programming" |
| End-of-day written commitment | **next-day commitments** (CS: **commitments pro další den u klávesnice**) | "action items", "next steps", "Monday commitments" |
| `AGENTS.md` character | **AGENTS.md as a map, not a warehouse** (CS: **AGENTS.md jako mapa, ne encyklopedie**) | "documentation", "readme" |
| Failure mode in the demo | **task drift** | "hallucination", "going off-track", "wrong answer" |
| Principle on verification scope | **holistic beats granular** (CS: **Celek nad detailem** — "Ověřuj celek, ne detail") | "integration over unit", "holisticky nad granularitou" (literal loanword soup) |

**Guides/sensors origin.** Both terms come from Birgitta Böckeler's `martinfowler.com` article (10 days before the workshop). The agenda credits her explicitly in `talk-argued-about-prompts` and `talk-got-a-name`.

---

## 4. Named voices — the five real-world credits

The five voices cited in `talk-argued-about-prompts`. Downstream content should not invent new voices or swap these out. When a coaching card or runbook wants to reference "the craft's origin", it uses these names.

| Voice | Credited with |
|---|---|
| **Ryan Lopopolo** (OpenAI Frontier & Symphony, Feb) | "Humans steer. Agents execute." — core line. 1M lines production beta in 5 months, zero hand-written. Playbook author. |
| **Birgitta Böckeler** (Thoughtworks, 10 days ago on Martin Fowler's site) | Defined **harness engineering**. Wrote the **Agent = Model + Harness** equation. Named **guides** and **sensors** as the two halves. |
| **Charlie Guo** (OpenAI, Feb) | "I'm moving away from chatting with AIs and moving towards managing them." — frames the role shift. |
| **Mitchell Hashimoto** (HashiCorp, early year) | "Anytime an agent makes a mistake, engineer a solution so it never makes that mistake again." — one-sentence definition of a sensor. |
| **Stripe Minions project** | 1000+ PRs/week, no human between task and PR. Not a demo — production. Proof that it ships at scale. |

Optional sixth reference (weather callout only, not a voice): **Simon Willison**, cited for "I'm certain things will change significantly, but unclear as to what those changes will be" and for the ~single-digit hand-written code percentage since Opus 4.5 / GPT-5.2.

---

## 5. Day-neutral closing language

The workshop ends with a role-change promise, not a calendar promise. "Monday" is banned in **both** languages — the facilitator doesn't know when the next-day-at-the-keyboard actually falls for any given participant, and the point is the role shift, not the day of the week.

| Use this | Not this |
|---|---|
| **The next day you open a coding agent, you'll work differently.** (EN) | ~~Monday morning, you'll open your editor~~ |
| **Druhý den, až si otevřete coding agenta, budete pracovat jinak.** (CS) | ~~V pondělí ráno otevřete editor~~ |
| **You'll stop being the person the agent asks questions of, and start being the person who builds the room it walks into.** (EN) | ~~See you Monday~~ |
| **Přestanete být ten, koho se agent ptá, a stanete se tím, kdo staví prostředí, do kterého agent vchází.** (CS) | — |
| **next-day commitments** / **commitments pro další den u klávesnice** | ~~Monday commitments~~ |

**Why "next day"?** Because the workshop runs on any day of the week, and participants sit down to code on different schedules. "The next day you open a coding agent" is role-anchored, not calendar-anchored. It carries the urgency of "soon" without pretending you know when.

**Vy-form discipline.** All Czech participant-facing surfaces use lowercase `vy` (not `ty`, not `Vy`). This is the standing rule from `content/style-guide.md` line 149–151, reinforced by the 2026-04-13 Mode A scene-card review.

---

## 6. Tag verification (T2 output)

Each of the five canonical tags verified against the agenda's principles and scenes.

| Tag | Agenda anchor | Match strength |
|---|---|---|
| **Map before motion** | `talk-how-to-build` pillar 1 "Kontext jako infrastruktura"; `opening-day-arc`; principle `AGENTS.md as a map, not a warehouse` | **Strong.** Verbatim match to principle language. |
| **Verification is the trust boundary** | `talk-how-to-build` pillar 3 "Sensors"; Build Phase 1 milestones around done-when criteria; `verify:content` CI gate framing | **Strong.** "Hranice důvěry" is explicit in current `context-is-king.md` and agenda principles. |
| **Boundaries create speed** | `talk-how-to-build` pillar 2 "Guides"; `talk-team-lead-callout`; Build Phase 2 constraints around scoped work | **Strong.** The "team lead builds the system" frame is exactly this habit. |
| **If it is not in the repo, it does not exist** | `talk-how-to-build` pillar 1; stated as explicit principle across multiple scenes | **Strongest possible.** Verbatim agenda principle. |
| **Cleanup is part of build** | Current `context-is-king.md` section "Repo se udržuje, ne jen plní"; Reveal phase notes on systemic fixes; `reveal-one-thing` commitment frame | **Defensible.** The concept is present in the agenda but not crystallized into a single principle phrase the way the other four are. Keep the tag; it's the weakest of the five but still anchored. |

**Verdict: all five tags survive.** Cleanup is the weakest but defensible — no refinement needed. The five become canonical.

---

## 7. How to use this document

**When rewriting a participant-facing file:**
1. Read the relevant agenda scenes first. They're the source of truth.
2. Read this document. Check the vocabulary against §2–§4.
3. Do not introduce vocabulary that isn't listed here. If a rewrite wants a new term, stop and escalate — that's a plan change, not a rewrite.
4. When a habit needs naming, use §1 tags verbatim.
5. When a concept needs naming, use §3 canonical names.
6. When citing a voice, use §4. Don't swap in other thinkers — the five were chosen for the talk's shape.

**When a canonical phrase from §2 appears nearby, use it verbatim.** Paraphrasing "Humans steer. Agents execute." into "lidé ukazují směr a agenti konají" breaks the meme. The whole point of a protected phrase is that it survives unchanged across files.

**When in doubt about voice or register:** defer to `content/style-guide.md`. This document governs *what* to say. The style guide governs *how*.

---

## 8. Rejection criteria

Content is wrong if:
- It introduces a term not in §3.
- It names a habit that isn't one of the five in §1.
- It paraphrases a §2 protected phrase.
- It cites a voice that isn't in §4 (exception: Simon Willison in the weather callout context).
- It uses "Monday" or any calendar-day framing in any language.
- It uses `ty` form in Czech participant-facing copy.
- It uses pre-rewrite vocabulary: "prompt blob", "one function plus one test", "smart prompt", the six-habit taxonomy, "holisticky nad granularitou".

---

## References

- **Agenda source of truth:** `workshop-content/agenda.json` — commit `2046fbc` (2026-04-12), refined through `ea5ca52` / `d7b9000` / `50e3789` (2026-04-13)
- **Style rules:** `content/style-guide.md`, `content/czech-reject-list.md`
- **Alignment plan:** `docs/plans/archive/2026-04-13-refactor-content-drift-alignment-plan.md`
- **Mode A scene-card review:** `docs/reviews/workshop-content/2026-04-13-czech-mode-a-scene-cards.md`
