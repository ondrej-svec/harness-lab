# Agent UI Testing

Harness Lab teaches a layered UI verification workflow for the coding-agent era.

Default stack:
1. agent exploration in an isolated local app or other low-risk browser environment
2. Playwright regression for the critical flow you do not want to break
3. human review before you treat the change as complete

This is the repo’s safe-by-default recommendation.

## 1. Repeatable browser regression tests

Use Playwright-style tests when you need a stable check that a previously working flow still works.

Best use cases:
- critical participant flows
- protected admin paths
- interactions that must not regress silently
- checks you want to run repeatedly in local development or CI

In this repo:
- `npm run test:e2e`
- [`dashboard/e2e/dashboard.spec.ts`](../dashboard/e2e/dashboard.spec.ts)

These are the tests that answer:
- "did we break something that used to work?"

## 2. Agent-driven exploratory UI testing

Use Codex or other browser-capable agents when you want fast feedback while building.

Best use cases:
- visual inspection
- interaction sanity checks
- checking browser console and page errors
- following a flow quickly while the implementation is still moving
- finding issues before you invest in a permanent test

These workflows are fast because the agent can:
- open the app
- inspect rendered behavior
- click through the flow
- observe failures
- use browser console or page error signals as extra evidence

These are the checks that answer:
- "what looks broken or suspicious right now?"

## Safe-by-default boundary

Do not teach or imply that unrestricted browser autonomy in a developer’s normal authenticated browser is the default workflow.

Prefer:
- isolated local apps
- low-risk browser state
- explicit human review before accepting changes
- executable checks for the flows that matter

Use sandboxed computer use only when the task really needs broader browser or GUI control and the environment is intentionally constrained.

## Emerging practice

The strong pattern is not choosing one tool.

It is:
1. use an agent for fast exploratory feedback during development
2. turn critical flows into repeatable browser regression tests
3. check browser console or page errors while reviewing the flow
4. finish with human review before treating the work as done

## Rule of thumb

- exploratory agent testing is great for discovery
- Playwright-style tests are great for regression protection
- browser console and page-error inspection catch a different class of issues
- human review is still the final trust boundary
- unrestricted computer use is an advanced capability, not the default recommendation
