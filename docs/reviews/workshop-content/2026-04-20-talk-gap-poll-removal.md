# Workshop-content review — 2026-04-20 — talk gap poll removal

**Scope:** remove the authored poll from `talk-note-one-gap` and keep the moment as a simple prompt to name one real repo gap before `Build 1`.

## Files under review

- `workshop-content/agenda.json`
- `dashboard/e2e/participant-signal-flow.spec.ts`
- `dashboard/lib/workshop-data.test.ts`
- `dashboard/lib/workshop-store.test.ts`

## Locale coverage

- English and Czech participant-facing copy changed in the talk proof slice.

## Why this changed

- In room use, the poll read as forced and low-value.
- The moment already has a clear job without an extra tap: name one concrete repo gap before the build starts.
- Poll capability still exists in the runtime, but the public template no longer forces it into this scene.

## Layer 1

- typography audit:
  - `dashboard/npm run verify:content` passed, including `verify-copy-editor` on the reviewed Czech markdown scope
  - direct `copy-audit` on `workshop-content/agenda.json` still reports broad pre-existing file-wide findings in the mixed bilingual source, so it is a run record, not a clean closeable gate for this slice

## Layer 2 suggestions considered

- yes
- English hero copy no longer explains or defends the interaction
- Czech hero copy no longer uses `poll` on a visible participant surface
- The participant moment now stands on its own as a concrete instruction

## Human reviewer signoff

- pending Czech-fluent review

## Next safe move

1. Regenerate agenda outputs and verify content sync.
2. Keep poll coverage at the runtime/test layer until a room moment clearly earns an authored poll again.
3. If agenda-json Czech is going to become a hard deterministic gate, fix the existing file-wide typography debt or narrow the audit to a locale-aware path first.
