# ADR 2026-04-08: Portable Participant Skill Distribution

## Status

Accepted

## Context

Harness Lab wants the participant `workshop` skill to be a real workshop companion, not a repo-local trick that only works if the public source repo is cloned first.

The previous model had three problems:

- `harness skill install` assumed the current directory was inside a Harness Lab source checkout
- participants usually work from their own team repo during the workshop
- the skill needs public-safe local fallback content even before participant login or when the dashboard is unavailable

At the same time, the accepted event access model already defines the correct auth boundary:

- public-first participant surface
- participant login only for live event context
- facilitator auth on a separate path

## Decision

Harness Lab will distribute the participant workshop skill as a portable public-safe bundle shipped inside `@harness-lab/cli`.

Rules:

- the canonical authored source remains in the main repo directories such as `workshop-skill/`, selected learner-kit docs, public-safe materials, content, and blueprint files
- the CLI package contains a portable bundle assembled from that authored source
- `harness skill install` installs that portable bundle into the participant's current repo or an explicit target path
- baseline participant commands must work without participant auth and without requiring the public repo clone
- `workshop login` remains the boundary for live event-private context only
- the repo-local `.agents/skills/harness-lab-workshop` copy is an optional generated development bundle, gitignored in this repo, and not an independent authored source of truth

## Consequences

- participants can install the skill from any working repo
- relative paths inside the installed bundle still work because the bundle carries its own local docs and materials
- the package/release pipeline must verify portable bundle contents explicitly
- contributor tooling must keep the packaged bundle canonical and may generate a repo-local dev bundle on demand from the same source
- public repo wayfinding becomes part of the same product surface, because GitHub should explain the project clearly even though runtime participant help should not depend on GitHub browsing
