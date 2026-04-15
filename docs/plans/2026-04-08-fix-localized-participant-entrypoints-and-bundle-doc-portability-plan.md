---
title: "fix: localized participant entrypoints and bundle doc portability"
type: plan
date: 2026-04-08
status: complete
confidence: high
---

# Localized Participant Entrypoints And Bundle Doc Portability Plan

Close the two review findings from the localization work: the top-level participant onboarding path still drops users into Czech-first docs, and the bundled blueprint README now depends on GitHub `main` links for runtime-source references.

## Problem Statement

The workshop content localization work introduced a stronger language contract:

- participant-facing delivery should follow live `contentLang` when runtime context exists
- bundled fallback guidance should prefer a reviewed localized doc when available
- Czech and English should both be intentional delivery paths rather than accidental leaks

Two doc surfaces still break that contract:

1. [`README.md`](../../README.md) sends participants straight to Czech base docs such as [`workshop-skill/install.md`](../../workshop-skill/install.md) and [`workshop-skill/reference.md`](../../workshop-skill/reference.md), even though the skill and bundle now describe locale-aware fallback behavior.
2. [`workshop-blueprint/README.md`](../../workshop-blueprint/README.md) points bundled readers at GitHub `main` for runtime-facing references, which weakens versioned portability and can drift from the installed bundle they are actually reading.

This matters because the repo now claims a deliberate language model. If onboarding still lands English users in Czech, or bundled docs silently jump to a moving remote target, the contract is only partially true.

## Proposed Solution

Fix the documentation contract at the two affected entrypoints:

1. Make participant onboarding locale-safe by changing the first recommended path to a language-neutral entry.
   - Prefer the installed `workshop` skill and its locale-aware commands as the first participant surface.
   - Only mention static docs in a way that does not imply a single default participant language unless that is stated explicitly.

2. Make bundled blueprint docs version-safe.
   - Remove or soften links that jump from a bundled artifact to GitHub `main` as if they were same-version local references.
   - Where a runtime-facing source is intentionally maintainer-only or source-repo-only, say that explicitly.

3. Add enough verification to keep both issues from returning.
   - Cover the participant-facing install/onboarding copy path.
   - Cover the bundled blueprint README so it does not regress back to live-remote links without an explicit decision.

## Plan Level

This is a **standard** plan because the implementation is small but user-facing, and the fix should capture a durable documentation rule rather than only patching two lines.

## Implementation Tasks

- [x] Lock the participant onboarding rule before editing docs.
  - Decide the canonical first participant entrypoint after `harness skill install`.
  - Preferred rule: direct participants to `workshop` commands or locale-aware installed docs, not to a hardcoded Czech base doc path.
  - Note this rule in the touched docs so future edits do not reintroduce a Czech-only default by accident.

- [x] Update the top-level participant entry surfaces to match the language contract.
  - Fix [`README.md`](../../README.md) `Start Here` so the participant path is compatible with both Czech and English delivery.
  - Check adjacent participant-facing orientation copy in [`harness-cli/README.md`](../../harness-cli/README.md) and any nearby install guidance for the same assumption.
  - Keep the wording clear for real workshop use: install the skill, open the agent, then use the locale-aware workshop interface.

- [x] Fix bundle portability in blueprint docs.
  - Update [`workshop-blueprint/README.md`](../../workshop-blueprint/README.md) so bundled readers are not sent to GitHub `main` as if it were a stable local reference.
  - If the runtime-facing source lives outside the portable participant bundle, mark it as maintainer/source-repo context rather than a same-surface link target.
  - Prefer local relative references for shipped docs and plain-text path mentions for non-shipped maintainer sources.

- [x] Add regression checks for the fixed contract.
  - Extend the relevant CLI/install test or bundle verification test to assert the participant-facing entry guidance no longer depends on Czech-only base docs.
  - Add a small assertion around the bundled blueprint README so remote `main` links do not reappear unnoticed.
  - Keep the checks lightweight and tied to the bundle/install surfaces already used in this repo.

- [x] Document the outcome and close the review follow-up cleanly.

## Completion Note

Completed on 2026-04-08.

What changed:

- [`README.md`](../../README.md) now routes participants through the installed locale-aware `workshop` interface instead of hardcoded Czech base docs
- [`harness-cli/README.md`](../../harness-cli/README.md) explicitly states that the installed `workshop` skill is the participant-first entrypoint and resolves guidance through live `contentLang` or the best reviewed bundled locale
- [`workshop-blueprint/README.md`](../../workshop-blueprint/README.md) no longer points bundled readers at GitHub `main` for runtime-facing references and now labels those paths as maintainer/source-repo context
- [`harness-cli/test/run-cli.test.js`](../../harness-cli/test/run-cli.test.js) now locks both the repo README participant entry contract and the installed blueprint README portability rule

Verification completed:

- `node harness-cli/scripts/verify-workshop-bundle.mjs`
- `cd harness-cli && npm test -- --test-name-pattern='skill install creates a portable \\.agents skill bundle in the current repo|skill install refreshes a stale install without requiring force|repo README routes participants through the locale-aware workshop interface|installed workshop blueprint README stays portable and avoids GitHub main drift'`
  - Update the relevant plan or follow-up note that tracked the localization work so the review findings are recorded as closed.
  - Make the next safe move obvious if any deeper documentation cleanup remains out of scope.

## Acceptance Criteria

- A participant following the top-level repo onboarding path is no longer forced into Czech-first docs when English delivery is intended.
- The participant entrypoint described in [`README.md`](../../README.md) matches the locale-aware contract documented in [`workshop-skill/SKILL.md`](../../workshop-skill/SKILL.md).
- The portable bundled copy of [`workshop-blueprint/README.md`](../../workshop-blueprint/README.md) does not rely on GitHub `main` links as if they were version-stable local documentation.
- Any maintainer-only or source-repo-only reference in bundled docs is labeled clearly enough that readers understand the boundary.
- Relevant automated checks cover the onboarding/bundle wording so these regressions are caught in future changes.

## Decision Rationale

### Why the participant entrypoint should be language-neutral

The localization work separated `uiLang` from `contentLang` and added reviewed English fallback content. Sending participants to a Czech base doc from the repo root undoes that work at the first click. The onboarding path should route through the locale-aware workshop interface, not around it.

### Why this should be fixed in docs rather than by introducing more translation logic

The review finding is not a rendering bug. It is a documentation-contract bug. The simplest correct fix is to stop promising a locale-aware experience while documenting a Czech-only first step.

### Why GitHub `main` links are risky in bundled docs

The portable bundle is supposed to be a versioned installable artifact. A bundled README that jumps to `main` can drift from the installed content, fail offline, or create confusion about which version is authoritative. If readers need maintainer-only source-repo context, the doc should say so explicitly instead of masquerading as a local continuation path.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The current review findings are limited to onboarding/docs portability, not deeper runtime localization bugs | Verified | Current review scope and findings |
| The portable bundle is intended to stay useful without requiring live GitHub browsing for core participant understanding | Verified | [`docs/resource-packaging-model.md`](../../docs/resource-packaging-model.md) portability rule |
| The best participant-first path after install is the `workshop` interface rather than a single hardcoded language doc | Verified | [`workshop-skill/SKILL.md`](../../workshop-skill/SKILL.md) defines locale-aware participant delivery |
| There is an existing lightweight test surface for bundle/install copy assertions | Verified | [`harness-cli/test/run-cli.test.js`](../../harness-cli/test/run-cli.test.js) already asserts installed bundle contents |
| The repo should keep both Czech and English delivery possible without duplicating every top-level onboarding doc immediately | Verified | Existing localization architecture and review intent |
| No other top-level docs outside the touched surfaces reintroduce the same Czech-only onboarding assumption | Unverified | Needs a quick scan during implementation |

Unverified assumptions should be resolved during the doc sweep, not left implicit.

## Risk Analysis

### Risk: The fix becomes over-specific to English and just flips the hardcoded default

If the README simply swaps Czech paths for English paths, the repo still teaches the wrong model.

Mitigation:

- route participants through the locale-aware `workshop` surface
- mention static docs as examples or fallbacks, not as the only valid language path

### Risk: Blueprint docs become vague after removing remote links

If the GitHub links are removed without replacement, maintainers may lose an obvious pointer to the runtime-facing source.

Mitigation:

- replace live remote links with explicit boundary language
- name the maintainer/source-repo paths directly where helpful

### Risk: This lands as a doc-only patch without regression protection

If there is no automated check, a later copy edit can reintroduce the same problem silently.

Mitigation:

- extend existing bundle/install assertions
- keep the checks narrow and directly tied to the reviewed failure modes

## References

- Review finding source: current `$review` on 2026-04-08
- [`README.md`](../../README.md)
- [`workshop-skill/SKILL.md`](../../workshop-skill/SKILL.md)
- [`workshop-blueprint/README.md`](../../workshop-blueprint/README.md)
- [`docs/resource-packaging-model.md`](../../docs/resource-packaging-model.md)
- [`harness-cli/test/run-cli.test.js`](../../harness-cli/test/run-cli.test.js)
