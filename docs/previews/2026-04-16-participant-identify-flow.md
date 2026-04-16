# Participant Identify Flow — 2026-04-16

Structural preview for the participant self-identify UX introduced in Phase 4 of `docs/plans/2026-04-16-feat-participant-management-and-team-formation-plan.md`.

This is a reviewer-facing preview artifact, not the runtime source of truth. No component code until sign-off.

## Principle

The participant surface never says "participant," "roster," "pool," or "assignment." Those are facilitator-side concepts. The participant sees: event → their name → their team → their work.

## State machine

```
                      ┌─────────────────────────┐
                      │  A. No session cookie   │
                      │      (fresh browser)    │
                      └───────────┬─────────────┘
                                  │  enter event code
                                  ▼
                      ┌─────────────────────────┐
              ┌───────┤  B. Session created,    │
              │       │     no participant_id   │
              │       │     bound              │
              │       └───────────┬─────────────┘
   has name  │                    │  submit name
   pre-filled│                    ▼
   (API call)│       ┌─────────────────────────┐
              │       │  C. Name prompt         │
              │       │     (single field)      │◄──┐ re-prompt
              │       └───────────┬─────────────┘    │ if cookie lost
              │                   │                  │
              │                   │  submit          │
              │                   ▼                  │
              │       ┌─────────────────────────┐    │
              └──────►│  D. Session bound to    │    │
                      │     participant_id      │────┘
                      └───────────┬─────────────┘
                                  │
                                  │ normal use
                                  ▼
                       team view, brief, challenges…
```

Three routes into state D:

1. **Walk-in path:** A → B → C → D (redeem without name, self-identify).
2. **Shortcut path:** A → C → D (redeem with name in same POST).
3. **Facilitator-added-then-joined path:** participant pre-exists in pool; they redeem; if display name already matches something in the pool, facilitator can match them by hand (admin UI). Not a participant-self-serve flow in v1.

## Participant-visible screens

### Screen 1 — name prompt (State C)

Minimal. Single field. No explanation text. No logo chrome beyond the existing participant layout.

```
┌─────────────────────────────────────────────┐
│  Harness Lab · Studio A                     │
│                                             │
│                                             │
│                                             │
│              What's your name?              │
│              Jak se jmenujete?              │
│                                             │
│         ┌─────────────────────────┐         │
│         │                         │         │
│         └─────────────────────────┘         │
│                                             │
│                [  Continue  ]               │
│                [  Pokračovat ]              │
│                                             │
│                                             │
│   cookie · session · anonymní               │
└─────────────────────────────────────────────┘
```

Rules:

- One input, one button. Nothing else above the fold.
- Placeholder is empty (do not pre-fill with a suggested name).
- Submit on Enter.
- On submit, POST `/api/event-access/identify` with `{ displayName }`.
- On 200, reload the participant home. Session is now bound.
- On 409 `already_bound`, silently skip the prompt and go to home (edge case: duplicate tab submitting stale state).
- On 400 `invalid_display_name`, show inline error below the input (`Vyplňte prosím jméno.` / `Please enter a name.`); keep input focused.
- On 401 `no_session`, redirect to the event-code page.

### Screen 2 — home with name (State D)

Existing participant home gains a single extra element — the bound name appears in the header. No new navigation.

```
┌─────────────────────────────────────────────┐
│  Harness Lab · Studio A       ·  Ada L.  ⌄ │
│                                             │
│  Your team                                  │
│  ─────────                                  │
│  Tým jedna · standup-bot · github.com/…     │
│  Ada · Linus · Grace                        │
│                                             │
│  Brief                                      │
│  ─────                                      │
│  [ brief content, unchanged ]               │
│                                             │
│  ...                                        │
└─────────────────────────────────────────────┘
```

Rules:

- Header shows first name + last initial when the display name is >1 token, otherwise the full name, truncated to 24 chars.
- The dropdown (`⌄`) only offers `Odhlásit / Sign out`. No profile page, no name-edit. Name changes during the event go through the facilitator.
- Team member list still reads from `teams.payload.members` (the denormalized projection). Ordering = insertion order.
- If the participant is not yet assigned to a team, show a placeholder: `Čekáte na přiřazení. / Waiting for team assignment.`

### Screen 3 — cookie lost (State C, re-entered)

If the session cookie disappears (private browsing, different device, expired), the participant re-enters the code and re-identifies. They type the same display name; the backend matches on `(instance_id, display_name)` case-insensitive, reuses the existing `participant_id`, and creates a fresh session bound to it. From the participant's perspective: nothing changed. They land back on home.

Subtlety: if two people typed the same display name by accident (e.g. two "Jan"s), the second one will bind to whichever row was created first. The facilitator can disambiguate later by editing names to `Jan K.` and `Jan P.`. Accepted limitation for v1.

## Copy (EN + CS)

| Surface | English | Czech |
|---|---|---|
| Prompt label | What's your name? | Jak se jmenujete? |
| Submit button | Continue | Pokračovat |
| Empty-name error | Please enter a name. | Vyplňte prosím jméno. |
| Generic failure | Couldn't save your name. Try again. | Uložení jména se nezdařilo. Zkuste to prosím znovu. |
| Unassigned placeholder | Waiting for team assignment. | Čekáte na přiřazení do týmu. |
| Dropdown · sign out | Sign out | Odhlásit |

All copy lands in `dashboard/lib/ui-language` before Phase 4 ships.

## Accessibility

- Input has `aria-label` matching the visible label.
- Inline error uses `role="alert"` and is associated via `aria-describedby`.
- Submit button has `aria-disabled="true"` while posting.
- Keyboard: Enter submits, Escape clears the input, Tab order is input → button.
- Mobile: input uses `autocapitalize="words"`, `autocorrect="off"`, `enterkeyhint="done"`.

## Anti-goals

Out of scope for this flow:

- Asking for email here. Email collection happens facilitator-side with explicit consent; never in the participant join flow.
- Asking for seniority/tag here. That's a facilitator observation, not a participant self-label.
- Asking for a photo, avatar, or any social-profile-coded field.
- Multi-step onboarding carousels ("What brings you here?" "What do you hope to learn?"). The event code already screened intent.
- Sending a welcome email. No email is sent until the post-event opt-in follow-up.
- Persistence of this identity across events. Each instance gets a fresh pool.

## Rejection criteria

The screen is wrong if any of the following is true when a reviewer looks at the built version:

- The prompt screen contains more than one input.
- The prompt explains harness-lab, the methodology, or why we're asking.
- The participant ever sees the word "participant" or "roster."
- Submit takes > 1 second on a normal connection (the call is a single DB insert; anything slower indicates extra work).
- A second tab or refresh loses the binding.
- Name change during event requires the participant to do anything other than ask the facilitator.
