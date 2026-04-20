# Dashboard Testing Strategy

Harness Lab teaches that agentic work needs explicit verification. The dashboard should model that directly.

## Testing Pyramid

### 1. Unit tests

Fast checks around pure logic:
- workshop template shaping
- auth and protection rules
- state transitions that can be expressed without rendering a page

Current examples:
- [`workshop-data.test.ts`](../dashboard/lib/workshop-data.test.ts)
- [`admin-auth.test.ts`](../dashboard/lib/admin-auth.test.ts)
- [`public-page-view-model.ts`](../dashboard/lib/public-page-view-model.ts)
- [`admin-page-view-model.ts`](../dashboard/lib/admin-page-view-model.ts)

### 2. Tracer-bullet integration tests

Small end-to-end-ish checks around critical flows, without a full browser stack:
- participant-facing reads return expected shapes
- facilitator writes mutate the store correctly
- auth boundaries reject unsafe access without credentials

Target flows:
- reset workshop instance
- move agenda phase
- update checkpoint
- complete challenge
- reveal/hide continuation window

### 3. Critical-path browser tests

Reserved for the flows where rendered behavior matters:
- participant dashboard loads on mobile-sized viewport
- admin route protection works in a real request flow
- critical participant information remains visible after data changes
- browser console and page-error inspection stay clean on the dominant workshop flows
- designated room-facing presenter scenes that are meant to read as one beat should fit the presenter baseline viewport without unintended scroll

These do not need to be broad. They should cover the highest-risk room-day paths.

Current entry point:
- `cd dashboard && npm run test:e2e`

### 4. Thin page and action tests

Use direct tests for server actions and small App Router pages when they contain meaningful branch logic but do not justify a browser flow:
- sign-in and password-reset redirects
- facilitator device approval actions
- small route edge cases and status codes

This sits between pure helper tests and Playwright. The goal is to verify page-local decision logic without snapshotting whole trees.

During exploratory review, also check:
- browser console errors
- unhandled page errors
- whether the first screen still answers "where are we, what should we do now, what matters next?"

## Default Rule for New Changes

If a dashboard change alters:
- participant-facing behavior
- facilitator controls
- auth boundaries
- workshop state transitions

then the change is incomplete until it ships with executable verification.

## RED → GREEN Expectation

Preferred workflow:

1. write the failing test or tracer bullet first
2. implement the smallest change that makes it pass
3. refactor only after the behavior is pinned down

This is not ceremony. It is how we keep agent-generated code aligned with intent.

## Test Isolation: Neon-mode tests run on throwaway branches

**Hard rule:** every test that needs real Neon Postgres or real Neon
Auth (integration tests, the Neon-mode Playwright project, the agentic
browser smoke script) runs against a dedicated Neon branch — never
against `main`. Production participant rows, facilitator grants, audit
log entries, and seeded event codes must not be touched by an
automated test run.

### One-liner setup + teardown

```bash
# Spin up a throwaway branch off main, write
# dashboard/.env.test.local with HARNESS_TEST_DATABASE_URL +
# HARNESS_TEST_BRANCH_NAME / _ID:
node dashboard/scripts/create-test-branch.mjs

# Run the layers that need it (integration / Playwright Neon project /
# smoke). They auto-skip when HARNESS_TEST_DATABASE_URL is absent.
cd dashboard && npm run test -- --run
cd dashboard && HARNESS_STORAGE_MODE=neon HARNESS_DATABASE_URL=$(grep ^HARNESS_TEST_DATABASE_URL .env.test.local | cut -d= -f2-) npm run test:e2e

# Tear the branch down:
node dashboard/scripts/delete-test-branch.mjs
```

### What goes against the test branch

- `*.integration.test.ts` — gated on `HARNESS_TEST_DATABASE_URL`
- Neon-mode Playwright project — gated on the same env var
- `scripts/smoke/phase-5-identify.mjs` — agentic browser happy path

### What stays mocked

- Unit tests under `lib/**/*.test.ts` and `app/**/*.test.ts` — Neon
  Auth client is mocked, no network.
- Anything that runs in CI's default fast lane — branch creation is
  scheduled nightly only.

If you need to debug against a long-lived branch, pass `--name <slug>`
to the create script and `--keep` to skip writing the env file.

## Coverage Boundaries

- Include `app/**/*.ts`, `app/**/*.tsx`, and `lib/**/*.ts` because those files hold real product behavior.
- Exclude generated files, test-only mocks, and contracts-only files where line coverage is not meaningful.
- In the current dashboard setup, [`runtime-contracts.ts`](../dashboard/lib/runtime-contracts.ts) is excluded because it is a type contract module with no executable runtime behavior.

## Current Gaps

- the two large page shells in [`app/page.tsx`](../dashboard/app/page.tsx) and [`app/admin/page.tsx`](../dashboard/app/admin/page.tsx) are still under-covered because most remaining lines are render composition
- browser-level coverage exists for the key participant and facilitator flows, but it remains intentionally thin
- several repository adapters still need either focused tests or an explicit decision about whether they are part of the trusted coverage boundary

Those are the next coverage priorities.
