# Participant Surface CLI-Independence Audit — 2026-04-19

Supports:
- `docs/plans/archive/2026-04-19-refactor-participant-surface-cli-independence-plan.md`

Status:
- preview artifact / audit memo
- not runtime truth
- intended to drive Phase 1 content and doctrine edits

## Audit goal

Identify the exact files, scenes, and copy patterns that still make the workshop depend too strongly on:

1. participant phones / participant board for live in-room exercises
2. CLI / workshop skill success as a prerequisite for progress
3. the participant surface as orientation-only instead of a complete operating surface

## A. Exact scene and doc targets

### 1. `workshop-content/agenda.json`

#### `opening-team-formation-room`

**Why it is a problem**
- Room-facing copy tells people to look at their phones / participant board for the full instructions.
- This is wrong for facilitator-led team formation and teaches the participant surface as a procedural dependency where a wall anchor is sufficient.

**Current problematic lines**
- EN facilitator note: "Participants work from the steps on their phones; the wall is the shared anchor the whole room can glance at."
- EN callout title: "Check your phone."
- EN callout body: "Full instructions are on the participant board in front of you."
- CS equivalents: "Účastníci postupují podle kroků na telefonu..." / "Mrkněte na telefon." / "Celé zadání máte na participant boardu před sebou."

**Recommended rewrite direction**
- Wall screen is the shared anchor.
- Facilitator leads the room directly.
- Participant surface may mirror the state, but it is not the instruction dependency for this moment.

**Suggested EN rewrite**
- facilitator note: "The wall holds the shared steps for the room; facilitate the sequence live."
- callout title: "Follow the room."
- callout body: "This screen is the shared anchor while the facilitator forms the teams live."

**Suggested CS rewrite**
- facilitator note: "Plátno drží společné kroky pro celý sál; průběh veďte živě z místnosti."
- callout title: "Řiďte se děním v sále."
- callout body: "Tahle obrazovka je společná kotva, zatímco facilitátor skládá týmy živě."

---

#### `opening-team-formation`

**Why it is a problem**
- Less broken than the room-facing scene, but still worth reviewing so the participant-view version does not imply that the page itself is the canonical instruction source.

**Recommended rewrite direction**
- Participant surface mirrors the room state and helps late readers catch up.
- It should not teach "look here instead of listening to the room."

---

#### `demo-your-toolkit`

**Why it is a problem**
- The scene currently frames the workshop skill as "the one tool that ties it together".
- This overstates the skill's role and makes the workshop feel shell-first.

**Current problematic lines**
- EN body: "Here's the one tool that ties it together — the workshop skill."
- EN hero: "One tool that ties the morning together."
- CS equivalents mirror the same message.

**Recommended rewrite direction**
- Reframe as "support surfaces" rather than "one tying tool".
- Participant surface is the always-available operating surface.
- Skill is the fast lane when local setup is ready.

**Suggested EN rewrite**
- body: "Here are the support surfaces for today. The participant board keeps everyone moving; the workshop skill is the fast lane if your setup is ready."
- hero body: "One room-facing operating surface for everyone, plus an optional accelerator on your own machine."

**Suggested CS rewrite**
- body: "Tady jsou podpůrné plochy pro dnešek. Participant plocha drží všechny v pohybu; workshop skill je rychlejší cesta, když máte připravený vlastní setup."
- hero body: "Jedna společná pracovní plocha pro místnost a k tomu volitelný akcelerátor na vašem vlastním stroji."

---

#### `demo-first-ten-minutes`

**Why it is a problem**
- The current step sequence still makes skill installation one of the four essential opening moves.
- That keeps Build Phase 1 too dependent on local setup success.

**Current problematic lines**
- EN step 2 title: "Install the workshop skill."
- EN step 3 body: "Ask the skill for the list of prepared briefs..."
- CS equivalents mirror the same dependency.

**Recommended rewrite direction**
- Build Phase 1 should be survivable from the participant surface.
- The first ten minutes should prioritize repo access, brief confirmation, team alignment, and AGENTS.md drafting.
- Skill should be presented as optional acceleration.

**Suggested EN structure**
1. Open your team's repo or starter package.
2. Confirm your brief on the participant surface.
3. Align on goal / scope / first verification.
4. If your setup is ready, install or use the workshop skill as the faster path.

**Suggested CS structure**
1. Otevřete repo nebo starter balíček svého týmu.
2. Potvrďte si zadání na participant ploše.
3. Srovnejte si cíl, scope a první ověření.
4. Když máte připravený setup, použijte workshop skill jako rychlejší cestu.

### 2. `content/facilitation/master-guide.md`

**Why it is a problem**
- Still teaches `harness skill install` as the default rescue / next move at several points.
- That is useful guidance, but too central for the new product rule.

**Priority passages to update**
- "if the team doesn't have the workshop skill yet, this is the moment for `harness skill install`..."
- "a short anchor for the workshop skill... why it saves a verbal rescue later"

**Rewrite direction**
- Replace with a dual-path rule:
  - participant surface first for guaranteed movement
  - skill path when the environment is ready

**Suggested wording**
- EN: "If local setup is ready, the workshop skill is the faster path. If not, keep moving from the participant surface and come back to local tooling only when it is worth the time."
- CS: "Když je lokální setup připravený, workshop skill je rychlejší cesta. Když ne, pokračujte z participant plochy a k lokálnímu toolingu se vraťte teprve tehdy, když to stojí za čas."

### 3. `content/talks/context-is-king.md`

**Why it is a problem**
- The current bridge from talk to demo names the workshop skill as one of the real artifacts built with agents, which is fine.
- The later guidance still nudges too easily toward skill-install as a default next move.

**Priority passages to update**
- "If they don't have the workshop skill yet: `harness skill install`..."
- any line that implies Build Phase 1 starts with skill install rather than with map + brief + verification

**Rewrite direction**
- Keep the skill in the story.
- Remove the idea that it is required to enter the workshop's core workflow.

### 4. `workshop-blueprint/control-surfaces.md`

**Why it is a problem**
- Participant surface is still described primarily as orientation.
- That is now too weak for the workshop's required operating model.

**Required doctrinal change**
- participant surface = orientation + essential execution support
- skill = conversational accelerator over the same model
- core workshop progression must be possible from either path

### 5. `docs/dashboard-surface-model.md`

**Why it is a problem**
- Participant surface responsibilities still read like a passive information surface.
- The new job needs to name brief access, repo access, phase actions, and recovery path explicitly.

**Required doctrinal change**
Add responsibilities like:
- phase-aware next-step CTA
- brief access
- repo/starter access
- challenge access
- setup-failure fallback guidance

### 6. `workshop-skill/SKILL.md`

**Why it is a problem**
- The skill is described as the primary participant interface.
- That is no longer the right framing if the participant surface must be sufficient by itself.

**Rewrite direction**
- skill = primary conversational interface when using an agent
- participant surface = guaranteed workshop operating surface
- both point at the same workshop model

## B. Product-gap audit for the participant UI

## Current participant surface strengths

The current page already does these well:
- clear current phase context
- readable calm visual hierarchy
- team cards and check-ins
- shared room notes
- mobile-safe stacked layout

## Missing capabilities for CLI independence

### 1. Brief access
Participants should not need the skill to discover or re-open their brief.

### 2. Challenge-card access
Participants should not need the skill to see today's required or optional challenge prompts.

### 3. Repo acquisition help
A raw repo URL is not enough for many rooms. The UI should support the richest safe set available:
- open repo
- copy URL
- copy clone command
- download ZIP / starter bundle when available

### 4. Setup-failure recovery
The participant surface needs one explicit line that normalizes fallback:
- "If your local setup is blocked, continue from this page and ask for help after X minutes."

### 5. Stronger primary CTA hierarchy
The page needs a dominant answer to: "What should we do now?"

## C. Priority order for Phase 1 edits

1. `workshop-content/agenda.json`
   - `opening-team-formation-room`
   - `demo-your-toolkit`
   - `demo-first-ten-minutes`
2. `content/facilitation/master-guide.md`
3. `content/talks/context-is-king.md`
4. `workshop-blueprint/control-surfaces.md`
5. `docs/dashboard-surface-model.md`
6. `workshop-skill/SKILL.md`

## D. Rejection criteria for Phase 1

Phase 1 is wrong if:
- any opening team-formation scene still tells participants to use phones as the primary instruction dependency
- Build Phase 1 still effectively starts with skill install
- control-surface docs still treat participant UI as orientation-only
- the wording makes fallback feel like failure rather than a supported path

## E. Output of this audit

This audit authorizes the next slice:
- doctrinal rewrites in the blueprint + surface-model docs
- content rewrites in agenda / facilitation / talk docs
- Build Phase 1 participant-surface preview and implementation proof slice
