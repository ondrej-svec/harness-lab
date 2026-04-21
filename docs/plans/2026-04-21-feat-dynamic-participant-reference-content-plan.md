---
title: "feat: dynamic participant reference content (CLI-driven, no redeploy)"
type: plan
date: 2026-04-21
status: approved
brainstorm: null
confidence: medium
---

# Dynamic Participant Reference Content

**One-line summary:** Move the participant-facing reference catalog, hosted reference bodies, and a narrow set of section-level copy from compiled-in strings to per-instance overrides, seeded from bilingual authoring sources and editable via `harness` CLI without redeploy.

---

## Problem Statement

Most participant-facing content on `/participant` is **not** currently instance-driven:

- The **reference catalog** (three groups on the participant page: *Workshop materials*, *Setup, skills, plugins*, *External reads*) is hardcoded in `dashboard/lib/public-page-view-model.ts:395–542` via `buildParticipantResourceCatalog()`. Hrefs, titles, descriptions, audience tags are all literals. Adding a new reference link or fixing a bad URL requires a code change + redeploy.
- The **Markdown bodies** behind hosted links (`materials/participant-resource-kit.md`, `workshop-skill/reference.md`, `docs/learner-reference-gallery.md`, etc.) are viewed on GitHub via `buildRepoBlobUrl()`. The dashboard never renders them — so per-event editorial changes require a PR and merge, then participants chase a GitHub link.
- A narrow set of **section-level copy** (e.g. post-workshop welcome card body, section intros) is hardcoded in `getParticipantSurfaceCopy()` and `getPostWorkshopCopy()`. Per-event tone or content tweaks require a code change.

Agenda structure, teams, briefs, challenges, ticker, checkpoints, setup paths, workshop meta, and the feedback form are already instance-driven via `workshop_instances.workshop_state` JSONB (+ the new `feedback_form JSONB NULL` column shipped 2026-04-21). The "content" gap is scoped to reference materials and a curated subset of chrome copy.

**Why this matters now:** as the workshop enters regular cadence, per-event reference/resource changes (new skill doc, replaced link, locale-specific tweak) should not block on a Vercel deployment cycle. The existing `feedback_form` override pattern proved this pattern works cleanly end-to-end (source → seed → instance override → CLI push). This plan extends that same pattern to the last major compiled-in surface.

---

## Target End State

When this plan lands, the following is true:

1. A facilitator can run `harness workshop reference import --file ./my-refs.json` against a live instance and participants see the updated reference list on their next page load, without redeploy.
2. A facilitator can run `harness workshop reference set-body participant-resource-kit --file ./kit.md` and the hosted body for that item re-renders from the new Markdown, without redeploy.
3. A facilitator can run `harness workshop copy set welcomeCard.body "<text>"` to override the post-workshop welcome card, without redeploy.
4. Bilingual authoring source lives at `workshop-content/reference.json` (EN + CS, same shape pattern as `workshop-content/agenda.json`). Build emits `dashboard/lib/generated/reference-{en,cs}.json`. New instances seed from the compiled default for their `contentLang`.
5. Old instances created before this plan continue to work — null `reference_groups` falls back to the compiled default.
6. Hosted reference bodies render at `/participant/reference/[itemId]` via a sanitized Markdown pipeline inside the dashboard. External references still link out as today.
7. No admin UI is added. All content mutations go through CLI + the `workshop` skill.

### Subjective target outcome

Participants never notice the schema change. They notice that references are up-to-date, hosted docs read cleanly inside the dashboard, and per-event content shifts feel native rather than "the GitHub link we couldn't update."

### Anti-goals

- **Not a general CMS.** We are not building a WYSIWYG, draft/publish workflow, or role-based content permissions.
- **Not a plugin marketplace.** Reference groups stay curated (`workshop-materials`, `setup-skills`, `external-reads`). We do not expose dynamic group creation UI.
- **Not full copy overrides.** Button labels, form field labels, status strings, and micro-copy stay compiled — only a small, named set of section-level content is overridable.
- **Not archiving GitHub as source-of-truth.** Markdown bodies still live in `materials/`, `workshop-skill/`, `docs/` — the generator inlines them at build time. The dashboard is a runtime render layer, not the canonical store.

---

## Scope and Non-Goals

### In scope

- New authoring source: `workshop-content/reference.json` (bilingual).
- Extension to `scripts/content/generate-views.ts` to emit `reference-{en,cs}.json` and inline referenced `.md` bodies.
- Two new columns on `workshop_instances`: `reference_groups JSONB NULL`, `participant_copy JSONB NULL`.
- One new sidecar table: `workshop_reference_bodies (instance_id, item_id, body, updated_at)`.
- Runtime resolvers (`resolveEffectiveReferenceGroups`, `resolveEffectiveParticipantCopy`) matching the `feedback_form` pattern.
- New dashboard route `/participant/reference/[itemId]` with client-side sanitized Markdown rendering.
- New `react-markdown` + `rehype-sanitize` dependencies in `dashboard/package.json`.
- New CLI subcommands under `harness workshop reference` and `harness workshop copy`.
- Updated skill docs for facilitators (`workshop-skill/SKILL-facilitator.md`, `workshop-skill/commands.md`).

### Explicitly out of scope

- Block-level presenter content overrides (already instance-driven via agenda).
- Brief / challenge content overrides (already instance-driven via blueprint inventory).
- Participant identity / auth changes.
- Admin / facilitator web UI for editing content.
- Multi-language overrides on a single instance (instance stays single-locale per `contentLang`, matching the existing agenda pattern).
- Versioning / history / rollback of overrides (Neon point-in-time recovery covers the floor).
- WYSIWYG or preview-before-publish workflow.
- Mobile-first redesign of the reference section (the current layout stays).

---

## Proposed Solution

Three phases, each independently shippable, each merges to `main` as a stack of small commits (trunk-based per project convention). Every phase preserves backward compatibility via null-override + compiled-default fallback.

### Phase 1 — Reference catalog (structure)

Mirror the `feedback_form` template exactly, but for the reference catalog.

1. **Authoring source.** `workshop-content/reference.json` with bilingual schema:
   ```jsonc
   {
     "schemaVersion": 1,
     "referenceGroups": [
       {
         "id": "workshop-materials",
         "en": { "label": "Workshop materials", "description": "...", "items": [...] },
         "cs": { "label": "Materiály workshopu", "description": "...", "items": [...] },
         "cs_reviewed": true
       }
     ]
   }
   ```
   Each item is a discriminated union:
   ```ts
   type ReferenceItem =
     | { id: string; kind: "external"; label: string; description?: string; audience?: string; href: string }
     | { id: string; kind: "hosted";   label: string; description?: string; audience?: string; bodyPath: string; sourceUrl?: string };
   ```
   `bodyPath` is a repo-relative path to a `.md` file; `sourceUrl` is an optional GitHub blob link preserved for "view source" affordance.

2. **Build step.** Extend `scripts/content/generate-views.ts`:
   - Read `workshop-content/reference.json`, validate (`schemaVersion`, required fields, `cs_reviewed` warning).
   - For each item where `kind === "hosted"`, read the `.md` file from `bodyPath` and inline its raw content into the generated JSON as `body: string`. The file still lives in `materials/` or `workshop-skill/` for git-tracked authoring; the generator snapshots it into the built artifact.
   - Emit `dashboard/lib/generated/reference-en.json` and `reference-cs.json`.
   - Extend the verify-mode diff to cover these files.
   - Wire into `npm run generate:content` and `npm run verify:content`.

3. **DB.** Migration `dashboard/db/migrations/2026-04-22-instance-reference-groups.sql`:
   ```sql
   ALTER TABLE workshop_instances ADD COLUMN reference_groups JSONB NULL;
   ```

4. **Runtime.**
   - `dashboard/lib/workshop-data.ts`: add `ParticipantReferenceGroup` / `ParticipantReferenceItem` types (locale-projected, no `en`/`cs` keys). Add `getDefaultReferenceGroups(contentLang)` reading the generated JSON. Add `resolveEffectiveReferenceGroups(instance, contentLang)` returning `instance.referenceGroups ?? getDefaultReferenceGroups(contentLang)`.
   - `dashboard/lib/workshop-instance-repository.ts`: register `reference_groups` alongside `feedback_form` in column-support probes, factories, and upsert statements.
   - `dashboard/lib/public-page-view-model.ts`: refactor `buildParticipantReferenceGroups()` to consume the resolver output. Keep the resolver call site identical (zero UI change).

5. **API + CLI.**
   - `PATCH /api/workshop/instances/[id]/reference` — body: `{ referenceGroups: ReferenceGroup[] | null }`. Null clears the override.
   - `harness workshop reference list` — prints effective catalog (resolver output).
   - `harness workshop reference import --file <path>` — replaces `reference_groups` verbatim with file contents (after schema validation).
   - `harness workshop reference reset` — sets `reference_groups` to null → default fallback.
   - `harness workshop reference set-item <groupId> <itemId> --label ... --href ...` — surgical edit via deep-clone of current effective catalog, write back as full override.
   - `harness workshop reference add-item <groupId> --kind external|hosted ...`.
   - `harness workshop reference remove-item <groupId> <itemId>`.

### Phase 2 — Hosted reference bodies (render in dashboard)

1. **DB.** Migration `2026-04-23-instance-reference-bodies.sql`:
   ```sql
   CREATE TABLE workshop_reference_bodies (
     instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
     item_id TEXT NOT NULL,
     body TEXT NOT NULL,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     PRIMARY KEY (instance_id, item_id)
   );
   ```
   Sidecar table (not `workshop_state` JSONB) so main-surface reads stay lean; bodies are pulled only when a body route is hit.

2. **Repository.** `dashboard/lib/reference-body-repository.ts` — `NeonReferenceBodyRepository` + `FileReferenceBodyRepository`, methods: `get(instanceId, itemId)`, `upsert(instanceId, itemId, body)`, `delete(instanceId, itemId)`, `listForInstance(instanceId)`.

3. **Markdown rendering.** Add `react-markdown@^9` and `rehype-sanitize@^6` to `dashboard/package.json`. Create `dashboard/app/components/markdown-body.tsx` — a Server Component (to keep client bundle lean) that renders sanitized Markdown. Sanitizer schema: GitHub Flavored Markdown minus raw HTML, minus scripts, minus unsafe protocols on links.

4. **Route.** `dashboard/app/participant/reference/[itemId]/page.tsx`:
   - Resolve active workshop instance (same pattern as `participant/page.tsx`).
   - Resolve `item` from `resolveEffectiveReferenceGroups()`.
   - If `item.kind !== "hosted"` → 404 (or redirect to `href`).
   - Read body: instance override from `workshop_reference_bodies`, else compiled default from generated JSON (`body` field inlined at build time).
   - Render inside the participant chrome with a "back to participant" link and optional "view source on GitHub" link (from `sourceUrl`).
   - Add session/auth gating identical to `/participant` (private instance model already enforced).

5. **UI wiring.** Update `buildParticipantReferenceGroups()` and the rendering inside `ParticipantRoomSurface` + `PostWorkshopSurface`:
   - `kind: "external"` → link to `href` (target=_blank, as today).
   - `kind: "hosted"` → link to `/participant/reference/<itemId>` (internal navigation).

6. **Seeding.** Update `createWorkshopStateFromTemplate()` (or a post-construction step in the reset API route) to pre-populate `workshop_reference_bodies` from the compiled defaults for every hosted item. This means a fresh instance has an editable per-instance copy from day one; overrides are additive edits rather than "first set a body."
   - Alternative (simpler): skip seeding; body route reads override-or-default transparently. Decide during implementation based on whether facilitators want to edit incrementally vs. always-have-a-row. **Recommended: skip seeding**, read-through resolver is simpler and matches feedback_form pattern.

7. **API + CLI.**
   - `PUT /api/workshop/instances/[id]/reference/[itemId]/body` — body: raw Markdown string (content-type `text/markdown`).
   - `DELETE /api/workshop/instances/[id]/reference/[itemId]/body` — clears override, falls back to compiled default.
   - `harness workshop reference set-body <itemId> --file <path.md>`.
   - `harness workshop reference reset-body <itemId>`.
   - `harness workshop reference show-body <itemId>` — prints effective body (for diffing).

### Phase 3 — Section-level copy overrides

Narrow, curated, not a free-for-all.

1. **Overridable keys.** Define a small set in `dashboard/lib/workshop-data.ts`:
   ```ts
   type OverridableParticipantCopy = {
     postWorkshop?: {
       welcomeTitle?: string;
       welcomeBody?: string;
       feedbackIntro?: string;
     };
     live?: {
       referenceIntro?: string;
       materialsIntro?: string;
       contextNote?: string; // already partially dynamic; extend
     };
   };
   ```
   All other copy stays compiled.

2. **DB.** Migration `2026-04-24-instance-participant-copy.sql`: `ADD COLUMN participant_copy JSONB NULL`.

3. **Runtime.** `resolveEffectiveParticipantCopy(instance, contentLang)` — returns compiled default (per-locale) deep-merged with non-null keys from `instance.participantCopy`. Unlike `referenceGroups`, this **is** a deep merge (partial override of named keys). Strictly-typed key set means the merge surface is bounded.

4. **Render integration.** Update `getParticipantSurfaceCopy()` and `getPostWorkshopCopy()` consumers to accept the resolved object and prefer override keys where defined. No change to hardcoded keys that aren't in `OverridableParticipantCopy`.

5. **API + CLI.**
   - `PATCH /api/workshop/instances/[id]/copy`.
   - `harness workshop copy show` (effective copy), `copy set <key.path> <value>`, `copy import --file <path>`, `copy reset [key.path]`.

### Preview & rollout

Before Phase 1 migrates the seeded default catalog in CI, produce a preview artifact (see *Required preview artifacts* below) and validate on one live instance.

---

## Implementation Tasks

Dependency-ordered. Check off as each lands. Sub-phases inside each phase can be separate PRs.

### Phase 1 — Reference catalog (structure)

**1a. Authoring source & build**
- [ ] Define Zod/TS schema for `BilingualReferenceSource` + `ReferenceGroup` + `ReferenceItem` (external / hosted discriminated union) in `dashboard/lib/types/bilingual-reference.ts`.
- [ ] Create `workshop-content/reference.json` by porting the current hardcoded catalog (`buildParticipantResourceCatalog()` in `public-page-view-model.ts:395–542`), bilingual EN + CS, items mapped to `external` (external reads + skill docs) and `hosted` (materials/workshop-skill docs with `bodyPath`).
- [ ] Extend `scripts/content/generate-views.ts`:
  - Add `generateReferenceView(source, lang)`.
  - Read each hosted item's `bodyPath`, inline raw MD as `body` string in generated JSON (fail build if file missing).
  - Emit `dashboard/lib/generated/reference-en.json` + `reference-cs.json`.
  - Add verify-mode diff coverage.
- [ ] Update `package.json` scripts (`generate:content`, `verify:content`) — add reference generation.
- [ ] Commit `dashboard/lib/generated/reference-*.json` — these are build artifacts but checked in per existing `dashboard/lib/generated/agenda-*.json` convention.

**1b. Runtime resolver (pure refactor — participant UI reads defaults, no DB changes yet)**
- [ ] Add `getDefaultReferenceGroups(contentLang)` in `workshop-data.ts`, importing from `./generated/reference-{en,cs}.json`.
- [ ] Refactor `buildParticipantReferenceGroups()` in `public-page-view-model.ts` to consume `getDefaultReferenceGroups()` instead of the hardcoded literals. Same output shape, same call sites.
- [ ] Delete `buildParticipantResourceCatalog()` and its hardcoded catalog.
- [ ] Verify `__tests__/` participant page tests still pass; update any snapshot tests.
- [ ] Ship this as a standalone PR — zero behavior change, purely moves source-of-truth from TSX to JSON.

**1c. DB + repository**
- [ ] Migration `dashboard/db/migrations/2026-04-22-instance-reference-groups.sql`: `ALTER TABLE workshop_instances ADD COLUMN reference_groups JSONB NULL`.
- [ ] Extend `WorkshopInstanceRecord` in `workshop-data.ts` with `referenceGroups: ParticipantReferenceGroup[] | null`.
- [ ] Update `createWorkshopInstanceRecord()` factory with `referenceGroups: input.referenceGroups ?? null`.
- [ ] Extend `NeonWorkshopInstanceRepository` and `FileWorkshopInstanceRepository`: add column-support probe, SELECT/INSERT/UPDATE column lists, row mapper (same places where `feedback_form` was added).

**1d. Resolver + consumer wiring (DB-aware)**
- [ ] Add `resolveEffectiveReferenceGroups(instance, contentLang)` in `workshop-data.ts`.
- [ ] Update `dashboard/app/participant/page.tsx` (both live and post-workshop branches) to resolve via `resolveEffectiveReferenceGroups` and pass the result into surface components.
- [ ] Tests: unit test resolver (null → default, populated → passthrough); integration test participant page with/without override.

**1e. API + CLI**
- [ ] Add `PATCH /api/workshop/instances/[id]/reference` route. Admin-auth gated. Validates payload against schema. Accepts `{ referenceGroups: ReferenceGroup[] | null }`.
- [ ] Extend harness-cli dispatch in `harness-cli/src/run-cli.js`:
  - `workshop reference list` — reads effective via new `GET /api/workshop/instances/[id]/reference`.
  - `workshop reference import --file <path>` — reads file, POSTs as-is.
  - `workshop reference reset` — PATCHes `{ referenceGroups: null }`.
  - `workshop reference set-item <groupId> <itemId>` + `add-item` + `remove-item` — surgical helpers that fetch current + edit + write back.
- [ ] Update `harness-cli/README.md` command reference.
- [ ] Update `workshop-skill/SKILL-facilitator.md` + `workshop-skill/commands.md` to document the new commands.
- [ ] E2E test: import a reference.json via CLI against a local instance, verify `/participant` renders updated list.

### Phase 2 — Hosted reference bodies

**2a. Markdown rendering primitive**
- [ ] Add `react-markdown` and `rehype-sanitize` to `dashboard/package.json`. Pin versions.
- [ ] Create `dashboard/app/components/markdown-body.tsx` — Server Component wrapping `react-markdown` with `rehype-sanitize`. Sanitizer schema: GFM, no raw HTML, no scripts, safe link protocols only (`http`, `https`, `mailto`).
- [ ] Unit test: renders GFM, strips `<script>`, strips `javascript:` hrefs, preserves tables + code blocks.
- [ ] Confirm bundle-size impact is acceptable (report delta in PR).

**2b. DB + repository**
- [ ] Migration `2026-04-23-instance-reference-bodies.sql` — create `workshop_reference_bodies` table with FK cascade delete from `workshop_instances`.
- [ ] Create `dashboard/lib/reference-body-repository.ts` — Neon + File implementations. Methods: `get`, `upsert`, `delete`, `listForInstance`.
- [ ] Unit tests for both repos.

**2c. Body route**
- [ ] Create `dashboard/app/participant/reference/[itemId]/page.tsx`:
  - Resolve instance (same pattern as `/participant`).
  - Resolve effective catalog, find item by id, 404 if not `hosted`.
  - Read body: `referenceBodyRepo.get(instanceId, itemId)` → fallback to `item.body` from compiled default.
  - Render `<MarkdownBody source={body} />` inside participant chrome.
  - Include "back to reference" breadcrumb + conditional "view source" link from `sourceUrl`.
- [ ] Extend participant session auth to cover this route (should inherit from layout; verify).

**2d. Catalog rendering update**
- [ ] Update reference item rendering (in `public-page-view-model.ts` + `participant-room-surface.tsx` + `post-workshop-surface.tsx`):
  - `kind: "external"` → current behavior (external link).
  - `kind: "hosted"` → link to `/participant/reference/<itemId>`, keep label/description/audience identical.
- [ ] Visual regression check: participant page reference section before/after looks identical for external items; hosted items now link internally.

**2e. API + CLI**
- [ ] `PUT /api/workshop/instances/[id]/reference/[itemId]/body` accepts `text/markdown` body.
- [ ] `DELETE /api/workshop/instances/[id]/reference/[itemId]/body`.
- [ ] `GET /api/workshop/instances/[id]/reference/[itemId]/body` — for CLI `show-body`.
- [ ] CLI: `workshop reference set-body`, `reset-body`, `show-body`.
- [ ] Skill docs updated.

### Phase 3 — Section-level copy overrides

- [ ] Define `OverridableParticipantCopy` type — narrow, documented, per-section.
- [ ] Migration `2026-04-24-instance-participant-copy.sql`: `ADD COLUMN participant_copy JSONB NULL`.
- [ ] Extend `WorkshopInstanceRecord` + factory + repos.
- [ ] Implement `resolveEffectiveParticipantCopy(instance, contentLang)` — deep-merge null-safe, only over the declared key set.
- [ ] Refactor consumers (`PostWorkshopSurface`, `ParticipantRoomSurface` section intros) to prefer override keys where defined.
- [ ] API: `PATCH /api/workshop/instances/[id]/copy`, `GET /api/workshop/instances/[id]/copy`.
- [ ] CLI: `workshop copy show|set|import|reset`.
- [ ] Skill docs updated.
- [ ] Test: set welcome card body via CLI, verify post-workshop page renders it.

### Preview & rollout gate

- [ ] Produce preview artifact (see *Required preview artifacts* below) before Phase 1d ships to `main`.
- [ ] Proof-slice: run Phase 1 (1a–1e) on one real workshop instance end-to-end. Push a custom reference.json via CLI, confirm participants see it, confirm fallback works when cleared.
- [ ] Only after proof-slice succeeds, start Phase 2.
- [ ] Only after Phase 2 ships and is tested on a real instance, start Phase 3.

---

## Acceptance Criteria

**Phase 1 is done when:**
- `workshop-content/reference.json` is the source-of-truth for the default reference catalog; no catalog literals remain in TSX / `public-page-view-model.ts`.
- `harness workshop reference import --file ./refs.json` against a running instance updates the participant page within one reload. Logged in participants see the new catalog.
- `harness workshop reference reset` clears the override; participants see the compiled default.
- Instances created before the migration (null `reference_groups`) render the compiled default without error.
- Build fails if `workshop-content/reference.json` references a missing `bodyPath`.
- Generate-views verify mode catches drift between source and committed generated JSON.

**Phase 2 is done when:**
- Visiting `/participant/reference/participant-resource-kit` (for a hosted item with no override) renders the compiled default MD body, sanitized, inside the participant chrome.
- `harness workshop reference set-body participant-resource-kit --file ./kit.md` updates the route's rendered content on next reload.
- `reset-body` restores the compiled default.
- Malicious Markdown (raw `<script>`, `javascript:` hrefs) is stripped by the sanitizer. Verified with a test.
- External items (e.g. agents.md) still link to their external `href` in a new tab; only hosted items route to `/participant/reference/*`.
- Bundle-size delta from `react-markdown` is documented and accepted.

**Phase 3 is done when:**
- `harness workshop copy set postWorkshop.welcomeBody "custom"` updates the post-workshop welcome card body on next reload.
- Setting a key not in `OverridableParticipantCopy` is rejected with a schema error (CLI + API).
- Instances with no override render compiled defaults unchanged.

---

## Decision Rationale

### Why a dedicated `reference_groups` JSONB column, not inside `workshop_state` JSONB?

`workshop_state` is mutated every time anything on the room moves (ticker, checkpoints, agenda state). Reference data changes rarely. Storing it in its own column keeps the hot-path `workshop_state` read/write smaller and makes override semantics explicit (`feedback_form` pattern). Direct precedent: `allow_walk_ins`, `team_mode_enabled`, `feedback_form` all live as dedicated columns rather than inside `workshop_state`.

### Why a sidecar table for reference bodies, not another JSONB column?

Estimated body sizes: 5–15 KB per hosted doc × ~6 hosted items = up to 90 KB if inlined. `workshop_instances` rows are read on every participant page load. Reference bodies are read only when a body route is hit. Keeping them in a sidecar keeps the hot row lean and lets body updates not bloat the main row. Alternative considered: single `reference_bodies JSONB NULL` column on `workshop_instances`. Rejected because it couples unrelated read paths. If the sidecar proves overkill in practice, collapsing to a JSONB column is a one-migration follow-up.

### Why `react-markdown` + `rehype-sanitize`, not build-time HTML rendering?

Two options were on the table:
- **A. Build-time:** render MD → HTML at build with `marked`, store HTML strings in generated JSON. Pro: zero runtime render cost, zero client bundle cost. Con: per-instance overrides can't reuse the compiled HTML — we'd need to run the Markdown pipeline at runtime anyway for override content, so we'd end up with two rendering paths.
- **B. Runtime `react-markdown` (RSC):** render MD → React tree server-side on every request, sanitize inline. Pro: one rendering path for both compiled defaults and runtime overrides. Con: adds a Node-side dependency, small client bundle cost from `react-markdown`.

Chose B. Uniform rendering path matters more than shaving a few ms of SSR; it also keeps the authoring loop (edit MD → push via CLI → see rendered) trivially simple. **rehype-sanitize** is non-negotiable — facilitators push arbitrary MD from CLI, so HTML injection must be impossible.

### Why single-language per instance (not bilingual at runtime)?

Matches the existing agenda pattern. `contentLang` is set at instance creation and the whole surface (agenda, briefs, feedback form) projects to one locale. Keeping reference single-language per instance avoids a new concept (bilingual runtime state) and matches user's explicit request ("workshop will be in one language").

### Why verbatim override (not deep-merge) for `reference_groups`?

Deep-merging structured arrays (groups/items) is ambiguous — does a group in the override replace-by-id, append, or reorder? Verbatim override is predictable: "what you push is what you see." The compiled default acts as the starting point (exported via `reference list`), authors edit locally, push full state. Same model as `feedback_form`.

### Why deep-merge for `participant_copy` (different from the above)?

`participant_copy` is a bounded flat-ish object of named string keys (not arrays). Deep merge over a typed whitelist is safe and expected — facilitators should be able to override one string without rewriting the whole copy tree. Verbatim would force them to serialize every compiled default string.

### Why no admin UI?

Explicit user request. CLI + skill is the primary interface. Admin UI is future work if demand emerges.

### Why Phase 1b as a pure refactor PR (no DB changes)?

Decoupling the move-to-JSON step from the add-override step de-risks both. If the JSON migration breaks rendering, we find out before touching DB. If the DB migration surfaces a repo/column issue, rendering already stands on the new JSON source.

---

## Constraints and Boundaries

- **Trunk-based.** Each phase = small commits to `main`, no feature branches (per project memory).
- **Deploy via git push only.** No `vercel --prod` (per project memory).
- **Bilingual source, locale-split build.** Mirrors `agenda.json` → `agenda-{en,cs}.json`. No deviation.
- **Backward compatibility.** Null override → compiled default. Old instances must work unchanged through all three phases.
- **No admin UI added.**
- **Participant auth unchanged.** New routes inherit the same gating as `/participant`.
- **Sanitization is load-bearing.** No hosted-body PR lands without rehype-sanitize and a malicious-input test.
- **Voice preservation.** When porting the hardcoded catalog into JSON, copy stays byte-identical to current participant UI — no editorial rewrite mixed into the migration. Editorial changes ship as a separate content PR after structural migration lands.
- **Participant Czech voice rules** (per memory `feedback_participant_copy_voice.md`): the drop-surviving/rescue motif stays banned; the "team, teammate/human, agent" triad stays named when describing continuation. Applies to any new participant-facing copy keys in Phase 3.

### Tone / taste rules (Phase 3)

- Curated key set only — resist pressure to expose "all the copy."
- Overridable keys are section-level or card-level bodies, not button micro-copy.
- New keys added to `OverridableParticipantCopy` require a code review comment justifying why this string needs per-event flexibility.

### Rejection criteria

- A hosted reference body that renders raw `<script>` or `<iframe>` from facilitator input = immediate revert.
- An override that crashes rendering for instances with null override = revert.
- A generated JSON diff that changes participant UI behavior when the intent was "pure refactor" (Phase 1b) = revert.
- A Phase 3 key addition that exposes button labels or form field labels = reject in review.

---

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| `feedback_form JSONB NULL` column pattern is production-proven end-to-end | Verified | Shipped 2026-04-21 (`2026-04-21-workshop-feedback.sql`, `resolveEffectiveFeedbackTemplate`) |
| `scripts/content/generate-views.ts` validate-and-emit pattern extends cleanly to a sibling source | Verified | Explicitly designed for bilingual multi-view generation (see `unified-bilingual-content-model-plan`, shipped) |
| No Markdown renderer exists in the dashboard today | Verified | Grep across `dashboard/` finds no `remark`/`rehype`/`marked`/`react-markdown` imports |
| `NeonWorkshopInstanceRepository` and `FileWorkshopInstanceRepository` both accept new JSONB columns via the existing column-support probe mechanism | Verified | `feedback_form`, `allow_walk_ins`, `team_mode_enabled` all added via this mechanism (see `workshop-instance-repository.ts:189–391`) |
| `harness-cli` session-store carries `instanceId` so new subcommands don't need a redundant `--instance` flag | Verified | `harness-cli/src/session-store.js` + existing `workshop team set-repo` etc. already rely on it |
| `react-markdown` + `rehype-sanitize` work inside Next.js App Router RSC without client-component flag | Unverified | Need to confirm via a spike in Phase 2a. `react-markdown@9` supports RSC; sanitize plugin should pass through. Fallback: client component with `"use client"`. |
| Bundle-size cost of `react-markdown` (~30KB gz when client) is acceptable | Unverified | Measure during Phase 2a; if client-side render, document delta. If RSC, irrelevant. |
| Facilitators will accept CLI-only workflow (no admin UI) for reference editing | Verified | Explicit user answer in planning conversation |
| Instance `contentLang` is stable over instance lifetime (no runtime language flip) | Verified | Existing agenda pattern — reset is required to change language |
| Inlining MD file bodies into generated JSON at build time doesn't blow up JSON size past practical limits | Unverified | Rough estimate: 6 hosted docs × ~10 KB avg = ~60 KB per locale file. Measure in Phase 1a. |
| Seeding hosted bodies into `workshop_reference_bodies` on reset is optional (read-through resolver handles defaults) | Verified | Matches `feedback_form` pattern — null override = read default |
| Old instances with `reference_groups IS NULL` correctly render the compiled default | Planned-verified | Core acceptance criterion; must be tested explicitly |

**Unverified assumptions are tracked as investigation tasks in the phase where they block work.** The `react-markdown` RSC compatibility and bundle size specifically must be resolved in Phase 2a before the body route lands.

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Facilitator pushes malformed `reference.json` via CLI → breaks participant page | Medium | High | Validate schema server-side at API ingress. Reject invalid payloads with a clear error. Never write invalid JSON to DB. |
| Malicious Markdown injection (XSS) via facilitator-pushed body | Low (facilitator is trusted) but unbounded blast radius | Critical | `rehype-sanitize` with strict allowlist. No raw HTML. Explicit test covering `<script>` + `javascript:` + `data:` URIs. |
| `react-markdown` doesn't work in RSC → forced to client component → bundle bloat | Medium | Medium | Spike in Phase 2a. Fallback: isolate to one route's loader, measure bundle delta, document acceptance or use build-time rendering as escape valve. |
| Build-time MD inlining explodes generated JSON size → slow cold starts | Low | Medium | Measure after Phase 1a. If problematic, split to on-demand load (read MD file at runtime from generated artifact). Current estimate (~60 KB) is well within tolerance. |
| Migration deploys before generator runs → build fails because code expects `reference-en.json` that doesn't exist | Medium | Medium | Order: ship authoring source + generator (1a) → regenerate → commit generated files → then ship runtime consumer (1b). Never mix in one PR. |
| Repository column-support probe miss → old DB doesn't have `reference_groups` column → error on read | Medium | High | Probe-and-fallback pattern proven (all 3 prior columns). Add defensive `?? null` in row mapper as belt-and-suspenders. |
| Seeded-default drift: facilitator edits `workshop-content/reference.json`, forgets to run generator, pushes stale generated JSON | Medium | Low | Verify-content step in CI catches drift (existing precedent). |
| Instance bodies table grows unbounded as instances accumulate | Low | Low | FK cascade delete on `workshop_instances` cleans up on instance removal. Normal lifecycle. |
| Phase 3 scope creep — facilitators keep asking for one more overridable key | High | Medium | Plan explicitly names the key set. Adding one = code review + justification. Default answer to "can we override X?" is "no, open an issue." |
| Participant session doesn't carry across to `/participant/reference/[itemId]` → 401 loop | Medium | High | Route inherits participant layout; confirm with E2E test before shipping. Same middleware guard as `/participant`. |
| CLI `import --file` accidentally overwrites live instance's custom edits | Low | High | CLI prints current-effective before overwrite and requires `--confirm` flag for non-interactive mode. Interactive mode shows diff and prompts. |
| Old participant bookmarks to GitHub blob URLs (current hosted links) break | Low | Low | External reads that weren't hosted before stay external. Hosted items gain a new URL but keep `sourceUrl` link affordance. Bookmark breakage is negligible (nobody bookmarks these). |

---

## Phased Implementation

### Phase 1 exit criteria
- All Phase 1 tasks checked off.
- Preview artifact produced, reviewed.
- One real instance proof-slice completed: custom reference.json pushed, observed on participant page, reset restores default.
- No test regressions.
- Documented in the relevant skill docs.

### Phase 2 entry criteria
- Phase 1 fully shipped and has soaked for ≥ 1 workshop cycle (or explicit facilitator sign-off on skipping soak).
- `react-markdown` RSC spike complete (assumption resolved).

### Phase 2 exit criteria
- All Phase 2 tasks checked off.
- Sanitizer test suite green.
- Bundle-size delta documented.
- One real instance proof-slice: edit a hosted body via CLI, observe updated render at `/participant/reference/<id>`, reset restores default.

### Phase 3 entry criteria
- Phase 2 shipped and soaked.
- Concrete list of `OverridableParticipantCopy` keys agreed.

### Phase 3 exit criteria
- All Phase 3 tasks checked off.
- Copy override round-trip verified on a real instance.

---

## Subjective Contract (design-sensitive scope)

### Target outcome

A facilitator preparing Thursday's workshop in Brno runs:
```
harness workshop reference import --file ./brno-refs.json
harness workshop reference set-body participant-resource-kit --file ./brno-kit.md
harness workshop copy set postWorkshop.welcomeBody "..."
```
…and when participants load `/participant` on Thursday, the references, hosted resource kit, and welcome card all read as if they were written for Brno. No deploy, no PR. The UI feels identical in shape; only content shifted.

### Anti-goals (restated from earlier section, shorter)

- Not a CMS. Not a marketplace. Not full copy control. Not bilingual-per-instance. Not an admin UI.

### References (positive models)

- `dashboard/lib/workshop-data.ts:1767` — `resolveEffectiveFeedbackTemplate` as the exact template to copy.
- `workshop-content/agenda.json` + `scripts/content/generate-views.ts` — bilingual source → generated view flow.
- `docs/plans/archive/2026-04-10-feat-api-primary-instance-content-plan.md` — "blueprint inventory replaces hardcoded seed" is the same architectural move applied to reference catalog.
- `docs/plans/2026-04-21-feat-post-workshop-feedback-plan.md` — recent proof of the full-stack (migration → runtime → CLI) pattern.

### Anti-references

- Hardcoded catalog in `public-page-view-model.ts:395–542` (what we're replacing).
- Any instinct to merge reference data into `workshop_state` JSONB (resist).
- Any instinct to build a UI editor (resist).
- Any `getParticipantSurfaceCopy()` key being added to override without justification (Phase 3 discipline).

### Required preview artifacts

Before Phase 1d (the consumer-wiring PR) merges to `main`:

1. **Preview A — HTML rendering:** `/participant` screenshot (or static HTML export) of the reference section rendered from `workshop-content/reference.json` (compiled default), with a side-by-side comparison against current production render. Must be visually indistinguishable.
2. **Preview B — Override in action:** same screenshot with a hand-crafted `reference_groups` override showing: (a) renamed group, (b) new external item, (c) removed item, (d) swapped hosted item link. Prove the override path works visually.
3. Both previews live in a preview branch or local harness. No mandatory remote share.

For Phase 2c (hosted body route), one preview artifact showing a rendered MD body inside the `/participant/reference/[itemId]` chrome, with a malicious-input test snapshot showing `<script>` stripped.

### Rollout rule

- Phase 1 ships when both previews pass subjective review.
- Phase 2 ships when sanitizer test suite is green and one real instance proof-slice is done.
- Phase 3 keys added one-at-a-time, each with its own preview if it changes visible text in a section.

### Rejection criteria (restated)

The plan fails (revert, not rollforward) if any of:
- Hosted-body route renders unsanitized HTML.
- Null-override instances render differently from today.
- Participant UI shape / IA changes visibly during the "pure refactor" step (Phase 1b).
- CLI successfully writes invalid schema to DB.

---

## References

- Prior plans (reuse patterns): `docs/plans/2026-04-21-feat-post-workshop-feedback-plan.md`, `docs/plans/archive/2026-04-10-feat-api-primary-instance-content-plan.md`, `docs/plans/archive/2026-04-10-refactor-unified-bilingual-content-model-plan.md`, `docs/plans/2026-04-19-feat-recommended-tooling-catalog-and-surface-alignment-plan.md`.
- Current hardcoded catalog: `dashboard/lib/public-page-view-model.ts:395–542`.
- Template pattern: `dashboard/lib/workshop-data.ts:1767` (`resolveEffectiveFeedbackTemplate`), `dashboard/db/migrations/2026-04-21-workshop-feedback.sql`.
- Build pipeline: `scripts/content/generate-views.ts`, `workshop-content/agenda.json`.
- Repository column-support pattern: `dashboard/lib/workshop-instance-repository.ts:189–391`.
- CLI dispatch: `harness-cli/src/run-cli.js` (single-file dispatch, `workshop <action> <subaction>` pattern).
- Participant UI surfaces: `dashboard/app/components/participant-room-surface.tsx:560–583`, `dashboard/app/components/post-workshop-surface.tsx:88–123`, `dashboard/app/participant/page.tsx:114–159`.
