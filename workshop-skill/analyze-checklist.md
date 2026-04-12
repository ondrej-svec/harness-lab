# Workshop Analyze Checklist

When an agent runs `/workshop analyze`, it should walk through:

- whether `AGENTS.md` exists and how good it is
- whether `AGENTS.md` reads as a map or as an overgrown dump
- whether `AGENTS.md` says what to read first
- whether `AGENTS.md` points at real source-of-truth docs
- whether build and test commands are present
- whether the repo distinguishes finished parts from in-progress parts
- whether a plan or runbook for the next team lives in the repo
- whether it is possible to find what was actually verified
- whether there is a record of the session state — what is verified, what is in progress, what is the next safe move
- how many rules live only in the prompt instead of in the repo
- how easy it would be to continue after rotation without a verbal handoff
- whether the next safe move is obvious

## Output

1. What helped continuation
2. What was missing
3. What to add before the next handoff
