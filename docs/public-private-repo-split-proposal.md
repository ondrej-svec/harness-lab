# Harness Lab Public/Private Repo Split Proposal

This document turns the current public/private taxonomy into a concrete operating recommendation.

## Current State

Harness Lab is still effectively one public repository with a private workshop-instance concept layered around it.

Today the structure is:

- public repo: workshop method, dashboard code, participant skill, reusable content
- private layer: implied through runtime state, facilitator auth, deployment config, and workshop-instance docs
- team repos: separate repos created during the workshop

That means the boundary is conceptually correct, but only partially enforced by system shape.

## Recommendation

Do **not** split into a separate private GitHub repo yet.

Use this model instead:

1. **Public template repo**
   `harness-lab`
   Holds the reusable workshop system, public-safe content, dashboard code, participant skill, ADRs, plans, and doctrine.

2. **Private workshop-instance layer**
   Not a clone of the template repo.
   Holds workshop-instance records, participant sessions, facilitator credentials, live team registry, live checkpoint state, monitoring outputs, and operational notes.

3. **Team exercise repos**
   Remain separate and event-specific.

This is the right next shape because the real seam is not "public repo vs private repo copy." The real seam is:

- reusable product and method
- private runtime state and operations

If we split into two repos too early, we create duplication pressure before we actually need it.

## Why This Is The Better Default

### Advantages

- one canonical source of truth for the workshop method
- easier iteration on dashboard, skill, and doctrine
- no divergence across per-event repo copies
- preserves low-friction participant onboarding from one public repo
- keeps security where it belongs: runtime auth, storage, and deployment boundaries

### What it avoids

- repo sprawl for every event or client
- drift between public and private copies
- operational mistakes caused by copying docs, code, and content between repos
- using GitHub access as a substitute for application architecture

## What Must Become Structurally Private

These things should not live in the public repo except as fictional demo fixtures:

- real workshop dates, rooms, venues, and client names
- facilitator credentials and admin secrets
- real participant rosters and team assignments
- live repo registry for workshop teams
- live checkpoint and continuation state
- monitoring outputs tied to a real event
- facilitator-only notes that reveal planned moves or room interventions
- post-event exports containing client or participant specifics

## What Must Stay Public

- workshop framing and README
- public-safe facilitation doctrine
- reusable project briefs and challenge cards
- dashboard application code
- participant skill and install path
- ADRs, plans, architectural guidance, and testing doctrine
- fictional sample data and local development fixtures

## Recommended Topology

### Public Repo

Repository:
- `harness-lab`

Responsibilities:
- reusable workshop code and content
- public-safe dashboard UI
- participant skill
- architecture and workflow doctrine
- test harnesses and browser verification practice
- fictional demo data only

### Private Instance Layer

Preferred form:
- hosted private storage plus deployment configuration

Can start as:
- protected JSON or database-backed instance records
- private environment variables
- private admin credentials
- private operational documents outside the public repo

Should expose:
- participant-safe event context APIs
- facilitator-only mutation APIs
- audit-friendly state transitions

Should not become:
- a forked second copy of the whole workshop repo

### Private Ops Workspace

Optional and likely useful:
- one small private repository or private docs workspace for facilitator operations only

Use it for:
- staffing notes
- client-specific prep
- travel/logistics
- per-event retros
- exported monitoring snapshots if they should be retained

This is different from a private code repo clone. It is an ops workspace, not the source of truth for product code.

## Migration Plan

### Phase 1: Enforce the public template boundary in this repo

Do first:

- keep removing real event specifics from tracked source
- keep demo/sample data clearly fictional
- keep participant session and workshop state server-side and out of git
- keep facilitator-only content out of public markdown by default

Exit condition:
- opening the public repo reveals no sensitive event or client information

### Phase 2: Formalize the private workshop-instance backend

Do next:

- define the instance record shape
- define where facilitator auth lives
- define where participant event-code redemption lives
- define where team registry and checkpoint state live
- define archive/export behavior per workshop instance

Exit condition:
- a real event can run entirely from private runtime storage without patching tracked source files

### Phase 3: Create a small private ops workspace if needed

Do when recurring events justify it:

- create one private workspace for facilitator logistics and client-specific notes
- keep it intentionally small and operational
- avoid storing reusable product code there

Exit condition:
- ops artifacts have a home without contaminating the public template repo

### Phase 4: Re-evaluate whether a second private code repo is actually needed

Only do this if one of these becomes true:

- client-specific private extensions to the dashboard become substantial
- deployment logic diverges materially by customer
- private integrations cannot be represented as runtime adapters
- compliance requires hard repo-level segregation of code, not just data

If those conditions appear, then consider:

- `harness-lab` as the public product repo
- `harness-lab-instance` as a thin private adapter repo

That private repo should contain only:

- deployment glue
- private integrations
- private schema/config
- ops automation

It should not become a shadow copy of all workshop code and content.

## What Moves First

Move first into the private instance layer:

1. real workshop metadata
2. participant roster and team assignment data
3. live repo URLs
4. checkpoint state and continuation records
5. facilitator credentials and admin configuration
6. monitoring outputs and post-event exports

Move later only if needed:

1. facilitator logistics documents
2. client-specific prep notes
3. event-specific retrospectives

Do **not** move:

1. public workshop doctrine
2. dashboard product code
3. participant skill
4. reusable prompts, ADRs, and plans
5. fictional example data used for local development

## Architecture Rules To Preserve

The repository split decision should reinforce the workshop doctrine:

- context is designed before agents are asked to produce code
- architecture rules live in-repo and are explicit
- security and trust boundaries are encoded in system shape
- tests, tracer bullets, browser inspection, and human review are separate sensors
- private runtime state stays server-side
- agents can help implement changes, but humans own the harness and the decision rules

## Decision Summary

For now, Harness Lab should operate as:

- one public template repo
- one private workshop-instance runtime layer
- optional small private ops workspace
- many separate team exercise repos

That gives the cleanest boundary with the least duplication.

The wrong next move would be to create a full second private repo that copies the workshop codebase before runtime boundaries are fully exercised.

The right next move is to strengthen the private instance layer and only introduce a second private repo later if private code genuinely appears.
