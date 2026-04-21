# Post-workshop feedback — default template copy table (v1 for review)

**Purpose of this doc:** side-by-side CS + EN copy for every string in the default feedback template, with voice-rule annotations. This is the preview artifact the Phase 6 gate requires. Review line-by-line; anything you flag loops back before code merges.

**Voice rules applied** (from `~/.claude/projects/-Users-ondrejsvec-projects-Bobo-harness-lab/memory/feedback_participant_copy_voice.md`):

1. **Defocus rescue/survives motif.** No `přežije bez záchrany` / `survives without rescue`. Use positive/concrete phrasings.
2. **Name the triad (when describing continuation scope).** Team mode: `další tým, člověk nebo agent` / `another team, teammate, or agent`. Participant mode: `další účastník, člověk nebo agent` / `another participant, teammate, or agent`.
3. **Consent defaults to false** for any testimonial-quotable content. Explicit opt-in only.

**Scope:** all copy on the participant post-workshop surface (hero, form header, every question prompt, anchors, placeholders, submit button, status messages, consent checkbox, resources heading, logout). Admin summary labels are listed at the end.

---

## 1 · Hero (above the form)

| key | CS | EN |
|---|---|---|
| `eyebrow` | workshop doběhl | workshop ended |
| `title` | Díky, že jste byli u toho. | Thanks for being here. |
| `body` | Workshop skončil, ale místnost ještě chvíli zůstává otevřená. Nejjednodušší věc, kterou teď můžete udělat: nechat nám krátkou zpětnou vazbu. Pomáhá to nejen tomuto, ale hlavně dalšímu workshopu. | The workshop is over, but the room stays open for a bit. The quickest thing you can do: leave us a short piece of feedback below. It shapes the next workshop, not just this one. |

**Voice check:** no rescue motif; positive forward-looking frame ("pomáhá... hlavně dalšímu workshopu" / "shapes the next workshop, not just this one"). Triad not invoked here — hero sets the scene, not the transfer thesis. See optional footer below.

---

## 2 · Form header

| key | CS | EN |
|---|---|---|
| `feedbackEyebrow` | zpětná vazba | feedback |
| `feedbackTitle` | Jak to dopadlo? | How did it land? |
| `feedbackBody` | Krátké a upřímné je lepší než uhlazené. Cokoli nesedí, přeskočte. Do 24 hodin se můžete vrátit a upravit. | Short and honest beats polished. Skip anything that does not fit. You can come back and edit within 24 hours. |

**Voice check:** permissive tone ("cokoli nesedí, přeskočte" / "skip anything that does not fit") counters the HR-survey default. No mandatory framing.

---

## 3 · Questions (default template — 9 total)

### Q1 — Overall quality (Likert 1–4, forced choice — no middle)

| slot | CS | EN |
|---|---|---|
| prompt | Jak to celkově dopadlo? | Overall, how was the workshop? |
| anchor min | špatně | poorly |
| anchor max | výborně | excellent |

### Q2 — Theme fit (Likert 1–4, forced choice)

| slot | CS | EN |
|---|---|---|
| prompt | Jak vám sedlo téma? | How well did the theme land? |
| anchor min | vůbec | not at all |
| anchor max | úplně | completely |

### Q3 — Facilitation quality (Likert 1–4, forced choice)

| slot | CS | EN |
|---|---|---|
| prompt | Jak vám sedla facilitace? | How was the facilitation? |
| anchor min | špatně | poorly |
| anchor max | výborně | excellent |

**Note on scale:** 4-point forced choice. No neutral midpoint — participants must commit to a direction. Anchors are tuned per question so the endpoint labels match the question's verb ("dopadlo" does not pair naturally with "vůbec").

### Q4 — Takeaway (open text)

| slot | CS | EN |
|---|---|---|
| prompt | Jedna věc, kterou si z dneška odnášíte? | One thing you're taking with you from today? |
| placeholder | Jedna věta, která vám zůstane. | One sentence that stays with you. |

### Q5 — Most valuable part (open text)

| slot | CS | EN |
|---|---|---|
| prompt | Co pro vás bylo nejcennější? | What was the most valuable part? |
| placeholder | *(none — optional guidance if reviewer wants)* | *(same)* |

**Reviewer option:** add placeholder `Co vám to otevřelo.` / `What opened up for you.`? Currently the mockup uses that. Not set in the v1 code — a Phase-6-merge decision.

### Q6 — What could be better (open text)

| slot | CS | EN |
|---|---|---|
| prompt | Co by šlo udělat líp? | What could be better? |
| placeholder | *(none — optional)* | *(same)* |

**Reviewer option:** add placeholder `Krátká a konkrétní poznámka pomáhá nejvíc.` / `Short and concrete helps most.`?

### Q7 — Recommend (single-choice)

| slot | CS | EN |
|---|---|---|
| prompt | Doporučili byste to kolegovi nebo kolegyni? | Would you recommend this to a colleague? |
| option yes | ano | yes |
| option maybe | možná | maybe |
| option no | ne | no |

### Q8 — Testimonial (open text, optional)

| slot | CS | EN |
|---|---|---|
| prompt | Máte pár vět, které bychom mohli použít jako citát? | A sentence or two we could quote as a testimonial? |
| optional hint | nepovinné | optional |
| placeholder | Jen pokud chcete. | Only if you'd like. |

### Q9 — Quote-by-name consent (checkbox)

| slot | CS | EN |
|---|---|---|
| prompt | Souhlasím, aby byl citát zveřejněn pod mým jménem. | You can quote me by name in marketing materials. |
| default | **unchecked** | **unchecked** |

**Note:** Czech rewritten to avoid the `Můžeme` / `Můžete` echo between Q8's prompt and Q9's consent. Q8 now invites ("Máte pár vět…?"); Q9 is explicit consent ("Souhlasím…").

**Consent rule:** default must be false. v1 admin summary shows a "quote consent" badge next to consented-to testimonial responses; no participant names are rendered at all in v1 (stricter than the consent rule requires — safer default).

---

## 4 · Submission states

| key | CS | EN |
|---|---|---|
| `submitLabel` | Odeslat zpětnou vazbu | Send feedback |
| `submittingLabel` | Odesílám… | Sending… |
| `successMessage` | Díky — čteme každou. | Thanks — we read every one of these. |
| `genericError` | Zpětnou vazbu se nepodařilo odeslat. Zkuste to prosím znovu. | Could not send the feedback. Please try again. |
| `lockedMessage` | Vaše dřívější odpověď je uzamčena. Ještě jednou díky za zpětnou vazbu. | Your earlier submission is locked. Thanks again for the feedback. |

---

## 5 · Resources section (below the form)

| key | CS | EN |
|---|---|---|
| `referenceTitle` | podklady | reference |
| `referenceBody` | Workshopové materiály tu zůstávají dostupné, dokud je potřebujete. | The workshop materials stay reachable here for as long as you need them. |

Reference group items come from the same generator as the running-workshop room — they're re-used, no bilingual text needed here.

---

## 6 · Optional footer line (triad reinforcement — reviewer-choice)

Mentioned in the mockup under voice notes; not in v1 code.

| key | CS | EN |
|---|---|---|
| `triadFooter` (proposal) | Díky tomu, co nám napíšete, víme, jak příští workshop posunout dál — pro dalšího účastníka, člověka i agenta. | What you write here shapes the next workshop — for another participant, teammate, or agent. |

**Reviewer decision:** include, drop, or reword? Triad rule suggests we should name it somewhere. Hero doesn't feel right. Form footer might.

---

## 7 · Admin summary labels (included for completeness — reviewer sanity-check)

| key | CS | EN |
|---|---|---|
| `navSummary` | zpětná vazba | feedback |
| `summaryEyebrow` | zpětná vazba | feedback |
| `summaryTitle` | shrnutí z workshopu | workshop summary |
| `summaryDescription` | Agregát odpovědí účastníků. Otevřený text je anonymní; u otázky pro citát je označené, kdo souhlasil s jmenovitým citováním. | Aggregated participant responses. Open-text is anonymous; the testimonial question marks who consented to be quoted by name. |
| `summaryResponseCounter` | {submitted} odpovědí z {total} přístupů | {submitted} responses of {total} issued access |
| `summaryAverageLabel` | průměr | avg |
| `summaryQuoteConsentBadge` | souhlas s citací | quote consent |
| `summaryEmptyTitle` | shrnutí se otevře po ukončení workshopu | summary opens once the workshop ends |
| `summaryEmptyBody` | Zatím žádná zpětná vazba. Uzavřete workshop v sekci nastavení a účastníci dostanou formulář. | No feedback yet. End the workshop from the settings section to open the form to participants. |

Admin copy is facilitator-facing so the participant voice rules apply less strictly — factual, clear labels.

---

## 8 · End-workshop admin panel (for completeness)

| key | CS | EN |
|---|---|---|
| `endWorkshopEyebrow` | uzavřít workshop | close the workshop |
| `endWorkshopTitle` | ukončit a otevřít zpětnou vazbu | end and open feedback |
| `endWorkshopDescription` | Přepne instanci do stavu 'doběhlo'. Rozhraní účastníků se přesune na podklady a formulář zpětné vazby. V1 je to jednosměrný krok. | Flips the instance to 'ended'. The participant surface pivots to resources and the feedback form. One-way in v1. |
| `endWorkshopButton` | uzavřít workshop | end workshop |
| `endWorkshopConfirmHint` | Pro potvrzení napište id instance. | Type the instance id to confirm. |

---

## 9 · Event-code expiration labels

| key | CS | EN |
|---|---|---|
| `participantAccessExpiresInLabel` | platnost | valid for |
| `participantAccessExpiresIn1Day` | 1 den | 1 day |
| `participantAccessExpiresIn7Days` | 7 dní | 7 days |
| `participantAccessExpiresIn14Days` | 14 dní | 14 days |
| `participantAccessExpiresIn30Days` | 30 dní | 30 days |
| `participantAccessExpiresInHint` | Kolik dní má nový kód platit. Pro zpětnou vazbu po workshopu nechte delší platnost, aby se účastníci mohli vrátit a vyplnit formulář. | How long the new code stays valid. For post-workshop feedback, keep it longer so participants can come back and fill in the form. |

---

## Review checklist for Phase 6 sign-off

- [ ] Hero copy lands warm + forward-looking in both languages
- [ ] Likert anchors read cleanly at endpoints
- [ ] All 9 question prompts pass reject-list (no `tým` / `team` / `teammate` / `parťák`; no rescue/survives)
- [ ] Open-text placeholders (Q4 confirmed; Q5 + Q6 decide) make sense or reviewer picks "none"
- [ ] Testimonial opt-in copy doesn't pressure
- [ ] Consent default **false** confirmed
- [ ] Triad footer — include / drop / reword?
- [ ] Admin summary labels read cleanly to a facilitator scanning responses
- [ ] End-workshop panel copy doesn't feel scary or irreversible-heavy (though it IS one-way)

When the checklist is green, code merges with these strings. Anything flagged loops back to the copy table before Phase 6 ships.
