# Dashboard Testing Strategy

Harness Lab teaches that agentic work needs explicit verification. The dashboard should model that directly.

## Testing Pyramid

### 1. Unit tests

Fast checks around pure logic:
- workshop template shaping
- auth and protection rules
- state transitions that can be expressed without rendering a page

Current examples:
- [`workshop-data.test.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-data.test.ts)
- [`admin-auth.test.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/admin-auth.test.ts)

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

These do not need to be broad. They should cover the highest-risk room-day paths.

Current entry point:
- `cd dashboard && npm run test:e2e`

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

## Current Gaps

- no tracer-bullet tests for route handlers yet
- browser-level coverage exists for one participant flow and one authenticated admin flow, but it is still intentionally thin
- no automated verification for store mutation flows beyond pure template shaping

Those are the next coverage priorities.
