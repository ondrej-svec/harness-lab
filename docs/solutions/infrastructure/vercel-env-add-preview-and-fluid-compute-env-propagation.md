---
title: "Vercel CLI env add: preview-all-branches trap and Fluid Compute env propagation"
type: solution
date: 2026-04-23
domain: infrastructure
component: vercel CLI + Fluid Compute runtime
symptoms:
  - "`vercel env add NAME preview --value X --yes` fails with `action_required: git_branch_required` even though the help text says omitting the branch targets all preview branches"
  - "the CLI suggests the exact failing command back at you under `next[]`, producing a loop"
  - "upgrading Vercel CLI 51.7.0 → 52.0.0 does not fix it"
  - "a newly added env var is visible in `vercel env ls` but the running production deployment does not appear to see it"
root_cause: "Two distinct issues. (1) The CLI's non-interactive flow insists on an explicit branch argument for preview even though `preview` without a branch should mean 'all branches' — the workaround is passing an empty-string positional. (2) Env var changes on Vercel do not force a redeploy; Fluid Compute reuses function instances across concurrent requests, so until the next cold start the runtime keeps reading the pre-change env snapshot. An empty commit to main is the smallest nudge that triggers a fresh build."
severity: medium
related:
  - "../../plans/2026-04-23-feat-facilitator-event-code-reveal-plan.md"
---

# Vercel CLI env add: preview-all-branches trap and Fluid Compute env propagation

## Symptoms

Mid-deploy for a new env var (`HARNESS_EVENT_CODE_REVEAL_KEY`, provisioned alongside shipping AES-GCM event-code reveal):

1. `vercel env add HARNESS_EVENT_CODE_REVEAL_KEY preview --value "…" --yes` kept returning:

   ```json
   {
     "status": "action_required",
     "reason": "git_branch_required",
     "message": "Add HARNESS_EVENT_CODE_REVEAL_KEY to which Git branch for Preview? Pass branch as third argument, or omit for all Preview branches."
   }
   ```

   The `next[]` array suggested two forms, one of which was the exact command that just failed. `--non-interactive`, piping via stdin, and even upgrading CLI 51.7.0 → 52.0.0 made no difference.

2. After the env var was finally set in both Production and Preview, the latest production deploy (`● Ready`, from the code commit that shipped the feature) had already gone live **before** the env var was provisioned. `/api/health` kept returning success and looked fine, but any code path that read the new env would see it as unset.

## Root Cause

### (1) CLI preview-all-branches gate

The `vercel env add` subcommand treats `preview` with no explicit branch argument as "action required, choose a branch." `--yes` does not bypass this — it only skips the sensitive-value confirmation. The help text (`$ vercel env add DB_PASS preview` supposedly = all branches) is misleading in non-interactive mode.

### (2) Fluid Compute snapshots env at cold start

Fluid Compute reuses function instances across concurrent requests to eliminate cold starts. Each instance reads `process.env` once at startup. A Vercel Dashboard env-var change propagates to *new* cold starts only; warm instances never see the new value. Without forcing a rebuild, the running production fleet keeps using the pre-change snapshot until natural churn replaces the instances — which on a low-traffic admin surface can take much longer than anyone expects.

## Solution

### (1) Preview-all-branches: pass empty-string positional

```bash
# FAILS — CLI demands a branch
vercel env add HARNESS_EVENT_CODE_REVEAL_KEY preview --value "<key>" --yes

# WORKS — empty string explicitly means "all preview branches"
vercel env add HARNESS_EVENT_CODE_REVEAL_KEY preview "" --value "<key>" --yes
```

Alternative: target a specific branch if you actually want per-branch scope:

```bash
vercel env add HARNESS_EVENT_CODE_REVEAL_KEY preview my-branch --value "<key>" --yes
```

### (2) Force a redeploy after env-only changes

The repo memory convention is "deploy via git push, not manual `vercel --prod`." So a trivial empty commit nudges a fresh build:

```bash
git commit --allow-empty -m "chore(deploy): rebuild to pick up <ENV_VAR_NAME>"
git push origin main
```

Then watch the deploy with `vercel ls --prod`. The build runs `npm run db:migrate && npm run build`, so this also picks up any pending SQL migration files the env-reliant feature added.

## Prevention

- [ ] **Include an empty-commit rebuild step in any plan task that adds a required env var.** Code-side task and env-provisioning task are easy to complete without realising there's a third beat.
- [ ] When the reveal/decrypt-style feature lives behind an env var: server code should **throw at module load** in production mode if the var is missing (the repo's existing `resolveEventCodeKey` pattern) — so a deploy that went live before the env var was set fails loudly on first invocation instead of silently returning "feature disabled." The new `event-code-reveal-crypto.ts` follows this pattern.
- [ ] Prefer `vercel env add NAME preview "" --value X --yes` as the canonical form in runbooks. Document it; stop rediscovering it.
- [ ] Do not trust `vercel env ls` alone as evidence that the runtime has the value. A passing `/api/health` only proves the deployment is serving traffic, not that its env snapshot is current.

## Related

- Plan: `docs/plans/2026-04-23-feat-facilitator-event-code-reveal-plan.md`
- Fluid Compute background: the Vercel knowledge-update block at session start describes instance reuse and graceful shutdown — the implication for env snapshots is the surprising part.
