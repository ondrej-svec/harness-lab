---
title: "feat: participant page redesign — workshop context, editable repos, cleaner session"
type: plan
date: 2026-04-10
status: in_progress
confidence: high
---

# Participant Page Redesign

The participant page shows the live phase but misses workshop context (date, place, event name), exposes internal facilitator details, and offers zero write interactions. Participants can't even edit their team's repo URL.

## Problem Statement

The participant opens the dashboard and sees "Build Phase 1" — but no workshop name, no date, no venue. The session sidebar mentions the facilitator admin path. Repo URLs are unclickable plain text. Shared notes are read-only and capped at 3. The only interactive element is logout. The page reads like a monitoring dashboard, not a workshop companion.

Meanwhile, the `WorkshopMeta` already carries `eventTitle`, `dateRange`, `venueName`, `city`, `roomName` — none of it reaches the participant surface.

## Target End State

A participant opening the page immediately sees:
- **Workshop identity** — event title, date, venue (compact header context)
- **Current phase and guidance** — what's happening now, what to focus on (unchanged, this works)
- **Their team's data** — repo URL as a clickable link they can edit inline
- **Room signals** — shared notes, all of them (not capped at 3)
- **Clean session** — just the expiry time and a leave button, no facilitator mentions

## Scope and Non-Goals

**In scope:**
- Workshop context bar (event title, date, venue) in participant header
- Editable team name (display name chosen by participants) via UI and CLI/skill
- Editable team repo URLs via UI and CLI/skill (first participant-writable API route)
- Editable team members (simple names, no PII) via UI and CLI/skill
- Expose `members` in participant team lookup
- Remove facilitator mention from session sidebar
- Simplify session section to expiry + leave button
- Uncap shared notes (show all, not just 3)
- Make repo URLs clickable links
- CLI write commands for team data (`harness workshop team set-repo`, `set-members`)
- Update workshop skill to document write commands

**Non-goals:**
- Participant-writable notes (keep skill-only for now — team rotation makes UI-based notes complex)
- Per-participant identity or team-to-participant binding (shared event code = trusted; any participant edits any team)
- Collecting PII (emails, identifiers) — names only, no follow-up capability
- Briefs/challenges in the UI (skill handles this well)
- Mobile layout redesign (current responsive layout is adequate)

## Proposed Solution

### Phase A: Workshop context bar

Add a compact context strip to the top of the participant room surface showing workshop metadata from `WorkshopState.workshopMeta`:

```
harness lab · developer hackathon praha · 11. dubna 2026 · studio a
```

One line. Lowercase. Uses `eventTitle ?? title`, `dateRange`, `venueName ?? city`. Falls back gracefully when fields are empty.

### Phase B: Clean up session sidebar

Remove the session sidebar entirely as a separate panel. Move the leave-room button into the header or bottom of the main panel. The session expiry (now showing just time) can be a small label near the leave button.

The current sidebar duplicates the current-phase metric from the main panel and adds the facilitator mention — both unnecessary.

### Phase C: Editable team data (repo URL + members)

Add a participant-writable API route:

```
PATCH /api/event-context/teams/[teamId]
Body: { repoUrl?: "https://github.com/...", members?: ["Anna", "David"], displayName?: "Robotníci" }
Auth: participant session required
```

The route validates:
- Valid participant session
- `teamId` exists in the session's instance
- `repoUrl` is a valid URL when provided (basic validation, not overly strict)
- `members` is an array of strings (simple names, no PII — no emails, no identifiers)
- `displayName` is a non-empty string when provided (team's chosen name — the facilitator pre-creates teams as "Tým 1", "Tým 2" etc., but participants can rename)

Trust model: any participant with a valid event code session can edit any team's data. This is intentional — shared event code = trusted workshop participant. The facilitator retains override capability via admin.

**Team members** use the existing `Team.members: string[]` field (already in the data model, already seeded with names like "Anna", "David"). Members change after team rotation — participants update them after the intermezzo.

On the participant page:
- **Team name**: editable inline (facilitator pre-creates as "Tým 1" etc., participants can rename to something fun)
- **Repo URL**: clickable link + inline edit (click to edit, enter to save)
- **Members**: displayed as a comma-separated list with an edit button to update
- All editable by any participant

### Phase D: CLI/skill write support

Add participant-writable CLI commands so the workshop skill can modify team data:

```bash
harness workshop team set-repo <teamId> <url>     # PATCH repoUrl
harness workshop team set-members <teamId> <names> # PATCH members (comma-separated)
```

The CLI sends the participant session cookie to the same `PATCH /api/event-context/teams/[teamId]` route. The skill can guide participants through team selection ("which team are you on?") and then call the CLI command.

Also expose `members` in the participant team lookup (`getParticipantTeamLookup`) — currently filtered out.

### Phase E: Uncap shared notes

Remove the `ticker.slice(0, 3)` cap. Show all shared notes. They're already rendered as lightweight cards — more of them won't hurt.

## Implementation Tasks

- [ ] **A1.** Add `workshopContextLine` to `buildParticipantPanelState` — derive from `workshopMeta.eventTitle`, `workshopMeta.dateRange`, `workshopMeta.venueName`, `workshopMeta.city`
- [ ] **A2.** Pass `workshopMeta` to `ParticipantRoomSurface` and render context line at top
- [ ] **B1.** Remove the session `<aside>` panel from `ParticipantRoomSurface`
- [ ] **B2.** Move the leave-room `SubmitButton` into the main panel footer (below guidance blocks)
- [ ] **B3.** Show session expiry as a small label near the leave button (not a full metric card)
- [ ] **B4.** Remove `sessionEyebrow`, `sessionBody` (facilitator mention) from the participant render path
- [ ] **B5.** Update `ui-language.ts` copy — remove or repurpose the session sidebar strings
- [ ] **C1.** Add `PATCH /api/event-context/teams/[teamId]` route — accepts `{ name?, repoUrl?, members? }`, requires participant session, updates the team record scoped to session's instance
- [ ] **C2.** Add `updateTeamFromParticipant(teamId, patch, instanceId)` to `workshop-store.ts` — accepts partial `{ name?, repoUrl?, members? }`
- [ ] **C3.** Expose `members` in `getParticipantTeamLookup` (currently filtered out)
- [ ] **C4.** Create `"use client"` `EditableField` component — generic inline edit (click to edit, enter to save, escape to cancel)
- [ ] **C5.** Wire `EditableField` into team cards for team name, repo URL, and members
- [ ] **C6.** API route tests: participant can PATCH name, repoUrl, and members; non-participant gets 401; invalid URL rejected; cross-instance write blocked; unknown teamId returns 404
- [ ] **C7.** Unit test `updateTeamFromParticipant` — partial updates merge correctly, team not found throws
- [ ] **C8.** Component test `EditableField` — renders value, enters edit mode on click, saves on enter, cancels on escape, shows loading state during save
- [ ] **D1.** Add `harness workshop team set-repo <teamId> <url>` CLI command using participant session auth
- [ ] **D2.** Add `harness workshop team set-members <teamId> <names>` CLI command
- [ ] **D3.** Add `harness workshop team set-name <teamId> <name>` CLI command
- [ ] **D4.** Expose participant write methods in the CLI client (`client.js`)
- [ ] **D5.** CLI tests: `set-repo`, `set-members`, `set-name` call correct API route with participant cookie; blocked when no participant session; error message when team not found
- [ ] **D6.** Update workshop skill SKILL.md to document team write commands and guide team selection
- [ ] **E1.** Remove `ticker.slice(0, 3)` cap in `deriveHomePageState`
- [ ] **E2.** Update page test expectations for uncapped notes
- [ ] **E3.** Update E2E test: participant redeems code, sees workshop context bar, editable team fields visible
- [ ] **E4.** Update E2E screenshot baselines for the redesigned participant page
- [ ] **F1.** Commit all changes with descriptive messages (atomic commits per phase)
- [ ] **F2.** Push to main, verify all CI checks green (Dashboard CI including E2E, Content Integrity, CodeQL)
- [ ] **F3.** Verify Vercel production deployment is Ready
- [ ] **F4.** Publish harness CLI to NPM (`npm publish` from `harness-cli/`) — new version includes participant write commands
- [ ] **F5.** Verify the published CLI version is available (`npm info @hog-cli/harness-lab version`)
- [ ] **F6.** Smoke test: redeem event code on production, verify workshop context visible, edit a team field, confirm change persists after reload

## Decision Rationale

**Remove session sidebar vs. simplify it:**
The sidebar duplicates the current-phase metric and adds the facilitator admin mention. Removing it entirely is cleaner than trying to find useful content for it. The leave button belongs near the bottom of the main content, not in a separate panel.

**Participant writes repo URL vs. facilitator-only:**
Someone has to enter the repo URL. If teams create their own repos during the workshop, it's fastest if they enter the URL themselves. The facilitator retains override capability via admin.

**Notes stay skill-only:**
Adding participant-writable notes requires team binding (which participant belongs to which team), which gets complicated after team rotation. The skill can prompt for team context and add notes via the existing facilitator-level API. This is pragmatic — the skill is the right interface for context-rich inputs.

**No briefs/challenges in the UI:**
The skill handles these well with structured prompts and coaching. Duplicating them in the UI would create maintenance burden and a weaker experience than what the skill provides.

## Constraints and Boundaries

- The participant page must NOT expose facilitator-only controls or admin paths (design rules)
- Mobile-first — every section must collapse into clear vertical reading order (design rules)
- Repo URL validation must be lenient — participants paste GitHub URLs, some may include trailing slashes or `.git`
- The `PATCH /api/event-context/teams/[teamId]` route must scope writes to the participant session's instance (cross-instance write protection)

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| `workshopMeta` fields are populated for real instances | Verified | `createWorkshopStateFromInstance` copies all meta fields; facilitator sets them during instance creation |
| Team records can be updated by ID without race conditions | Verified | `upsertTeam` in `workshop-store.ts` uses version-based optimistic locking |
| Participant session carries `instanceId` for scoping writes | Verified | Just implemented — `getParticipantSession` returns `instanceId` from DB |
| `repoUrl` field on `Team` type accepts arbitrary strings | Verified | Type is `string`, no validation constraint in the data model |

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Participant edits wrong team's repo URL | Medium | Low | No team-to-participant binding — any participant can edit any team's URL. Acceptable for a workshop with 4 teams and trust. Facilitator can override. |
| XSS via repo URL input | Low | High | Validate as URL, render with `href` attribute only (React's JSX escaping handles the rest). No `dangerouslySetInnerHTML`. |
| Concurrent repo URL edits | Low | Low | Last-write-wins is fine for workshop context. Optimistic locking on the team record prevents corruption. |

## Acceptance Criteria

- Participant sees workshop title, date, and venue on first load without scrolling
- No mention of "facilitator", "/admin", or admin paths anywhere on the participant page
- Session expiry shows time-only (already fixed) with a compact leave-room button
- Team names are editable inline by participants
- Team repo URLs are clickable links and editable inline by participants
- Team members are displayed and editable by participants (simple names, no PII)
- `harness workshop team set-repo`, `set-members`, `set-name` work with participant session auth
- Shared notes show all items, not capped at 3
- API route tests cover: auth (participant yes, non-participant no), validation (invalid URL, empty name), scoping (cross-instance blocked, unknown team 404)
- Component test covers EditableField lifecycle (display → edit → save/cancel)
- CLI tests cover write commands with participant auth
- E2E tests verify the redesigned participant page renders correctly
- All existing tests pass (with updated snapshots as needed)
- Code committed and pushed to main
- All CI checks green (Dashboard CI, Content Integrity, CodeQL)
- Vercel production deployment Ready
- Harness CLI published to NPM with participant write commands
- Smoke test passes on production
