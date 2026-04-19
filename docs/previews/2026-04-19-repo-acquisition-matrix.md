# Repo Acquisition Matrix — Participant Surface

Supports:
- `docs/plans/archive/2026-04-19-refactor-participant-surface-cli-independence-plan.md`

Status:
- preview artifact
- operational design input, not runtime truth

## Goal

Define what the participant surface should offer for repo / starter access depending on what kind of artifact the team actually has.

The participant surface must help teams keep moving even when:
- cloning is unfamiliar
- CLI setup is blocked
- GitHub auth is awkward
- the repo is private

## Product rule

The participant surface should expose the **richest safe acquisition set available** for the team.

That means the UI does not hardcode one assumption like "clone the repo". Instead it resolves which actions are available for the team's artifact and shows those actions explicitly.

## Canonical acquisition actions

### Core actions
- **Open repo** — open the repo host page in a new tab
- **Copy repo URL** — copy the raw remote URL
- **Copy clone command** — copy a ready-to-run clone command
- **Download ZIP** — download a browser-safe ZIP when available
- **Download starter bundle** — download a workshop-provided starter archive when ZIP is not realistic or not safe

## Modes

## Mode A — Public GitHub repo

### Typical situation
- repo is public on GitHub
- browser access is easy
- ZIP download is supported by the host

### UI should show
- Open repo
- Copy repo URL
- Copy clone command
- Download ZIP

### Recommended CTA order
1. Open repo
2. Download ZIP
3. Copy clone command
4. Copy repo URL

### Why
- browser-first is easiest for mixed-skill rooms
- ZIP is the strongest no-CLI fallback
- clone remains available for people who prefer local tooling

### Example copy
- EN: "Open the repo, download it as ZIP, or copy the clone command if you're working locally."
- CS: "Otevřete repo, stáhněte si ho jako ZIP nebo si zkopírujte clone command, pokud pracujete lokálně."

## Mode B — Private GitHub repo with participant access

### Typical situation
- repo is private
- some participants may or may not already be authenticated in the browser
- direct ZIP link may fail or prompt for host auth

### UI should show
- Open repo
- Copy repo URL
- Copy clone command
- Download ZIP **only if** the deployment can generate a real authorized download path
- otherwise show Download starter bundle if available

### Recommended CTA order
1. Open repo
2. Copy clone command
3. Download starter bundle
4. Copy repo URL

### Why
- "Download ZIP" is unreliable if it silently depends on GitHub auth state
- a workshop-owned starter bundle is often the more dependable fallback

### Important rule
Do **not** show a dead or misleading ZIP action. If the download cannot be fulfilled reliably for the participant, prefer no ZIP action over a broken promise.

## Mode C — Starter bundle only (no canonical hosted repo yet)

### Typical situation
- teams start from a workshop-owned starter package
- the repo may be created later by the participants
- the workshop needs a zero-setup fallback first

### UI should show
- Download starter bundle
- Copy setup note / unpack note if useful
- optional "Open source template" if a public source repo exists

### Recommended CTA order
1. Download starter bundle
2. Open source template
3. Copy setup note

### Why
- this is the strongest fallback mode for restrictive enterprise rooms
- teams can begin locally without needing clone literacy first

## Mode D — Repo host unknown / facilitator-entered URL only

### Typical situation
- facilitator entered a repo URL manually
- host might be GitHub, GitLab, Bitbucket, internal forge, or something else
- we cannot assume ZIP semantics

### UI should show
- Open repo
- Copy repo URL
- Copy clone command if the URL is clone-compatible

### UI should not assume
- ZIP download
- API-assisted auth
- host-specific actions

### Why
- generic correctness beats host-specific guesswork

## Decision table

| Mode | Open repo | Copy URL | Copy clone command | Download ZIP | Starter bundle |
|---|---|---:|---:|---:|---:|
| Public GitHub repo | Yes | Yes | Yes | Yes | Optional |
| Private GitHub repo | Yes | Yes | Yes | Only if reliable | Preferred fallback |
| Starter bundle only | Optional | Optional | No | No | Yes |
| Unknown / generic repo URL | Yes | Yes | If safe | No | Optional |

## Participant-surface rules

### Rule 1 — Never imply clone is required
The presence of a clone command should not teach that cloning is the workshop gate.

### Rule 2 — Prefer explicit actions over raw links
A naked URL is not enough when the room contains mixed levels of repo literacy.

### Rule 3 — Fallback must be visible, not hidden in prose
If setup is blocked, the participant should immediately see another supported path.

### Rule 4 — Only show actions the system can actually fulfill
Do not render a ZIP button unless the download path is real for the participant.

### Rule 5 — Keep acquisition actions subordinate to the current phase CTA
Repo access is essential, but it supports the workshop move; it should not visually overpower the current phase guidance.

## Recommended Build Phase 1 copy block

### EN
**Get into your team's materials**
- Open the repo if you're ready to work in the browser or in Git locally.
- Download the starter package if local setup is blocked.
- Copy the clone command only if that's the fastest path for your team.

### CS
**Dostaňte se k materiálům svého týmu**
- Otevřete repo, pokud jste připravení pracovat v prohlížeči nebo lokálně v Gitu.
- Stáhněte si starter balíček, pokud vás blokuje lokální setup.
- Clone command si kopírujte jen tehdy, když je to pro váš tým nejrychlejší cesta.

## Data model implication for later implementation

The participant-surface view model likely needs an explicit acquisition object rather than only `repoUrl`.

Suggested shape:

```ts
{
  primaryHref: string | null,
  repoUrl: string | null,
  cloneCommand: string | null,
  zipHref: string | null,
  starterBundleHref: string | null,
  mode: "public-repo" | "private-repo" | "starter-bundle" | "generic-url"
}
```

This keeps the UI from inventing actions from a raw URL alone.

## Acceptance signal for the proof slice

The Build Phase 1 participant surface should be considered correct only if a participant can answer:
- How do I get the team's materials right now?
- What do I click if cloning is not working?
- What is the next supported fallback?
