---
title: "feat: cohort-specific artifact uploads (Vercel Blob + participant reference library)"
type: plan
date: 2026-04-21
status: approved
brainstorm: null
confidence: medium
---

# Cohort-Specific Artifacts

**One-line summary:** Let facilitators upload HTML/PDF/image artifacts scoped to a single workshop instance, serve them behind participant auth with cross-cohort isolation and an HTML sandbox header, and surface them in the existing per-instance reference catalog via a new first-class `artifact` kind.

---

## Problem Statement

Three concrete cohort-specific artifacts exist today as HTML pages on a personal Tailscale share server:

- "Codex's model picker, decoded" (static technical reference)
- "16-day harness case study" (cohort-scoped data viz)
- "Participant auth flow v2" (design spec)

They work because they render beautifully — cards, decision trees, charts, theme toggles — but the current delivery path has three problems:

1. **No auth.** Anyone with the share URL sees them. Workshop artifacts should be visible to the cohort's authenticated participants, not the public internet.
2. **Personal infra.** The share server is a Mac Mini on Ondrej's tailnet. It is not production, does not survive cohort handoffs, and has no SLA.
3. **Not discoverable.** Participants have no way to find these from `/participant`. They exist only as URLs pasted into chat.

The existing dynamic reference content plan (`docs/plans/2026-04-21-feat-dynamic-participant-reference-content-plan.md`) addresses **repo-native** content (GitHub-tracked Markdown docs and external URLs). It does not address **cohort-native** content — artifacts that exist only for a specific instance, are not in git, and may never be repo-tracked.

**Why this matters now:** the production instance already has three of these artifacts that participants should see but currently cannot. The pattern — upload a file, scope it to an instance, serve it to authenticated participants — is reusable for any future cohort-specific content (recordings, handouts, per-cohort reports). Building it once well pays forward.

---

## Target End State

When this plan lands, the following is true:

1. A facilitator runs:
   ```bash
   harness workshop artifact upload --file ./case-study.html --label "16-day harness case study"
   harness workshop artifact attach <artifactId> --group defaults
   ```
   and on next `/participant` load, authenticated participants in that cohort see the artifact listed in the `defaults` reference group, click it, and it opens in a new tab.
2. A participant in **cohort B** who requests `/participant/artifact/<artifactId>` for an artifact belonging to **cohort A** gets a 404 — cohort isolation is hard enforced at the serve path, not just implied by the UI.
3. Artifacts are stored in Vercel Blob in private mode, keyed by instance. No public blob URL ever leaves the server.
4. Uploaded HTML executes its own scripts (theme toggles, client-side interactivity work) but cannot touch the dashboard origin — enforced by `Content-Security-Policy: sandbox` on the serve response.
5. A download affordance exists (`?download=1` query param, wired to a small icon next to the primary link).
6. Deleting an instance cascades to both the DB rows (FK) and the blob keys (explicit cleanup hook).
7. Artifacts do **not** appear in `workshop-content/reference.json`. They exist only in per-instance state, because they are inherently cohort-scoped.
8. No admin UI is added. All mutations go through CLI + the `workshop` skill.

### Subjective target outcome

A facilitator preparing a workshop can hand a participant an artifact the same way they would hand them a printed worksheet — drop it in the cohort's reference shelf, participants pick it up, no GitHub PR required, no tailnet URL shared out of band.

### Anti-goals

- **Not a file manager.** No folders, no rename, no versioning. Upload, list, delete.
- **Not a CMS.** Artifact body isn't edited inside the dashboard. Facilitators re-upload when content changes.
- **Not a collaboration platform.** No comments, no likes, no presence, no inline annotations.
- **Not a general attachment system.** This is specifically for cohort-scoped reference artifacts. Teams uploading per-team files, participants uploading submissions, etc. are separate concerns.
- **Not a public-links product.** Blobs are private. No shareable public URLs. If a facilitator wants a public version of an artifact, they publish it separately.

---

## Scope and Non-Goals

### In scope

- New DB table `workshop_artifacts` (sidecar, per-instance, FK cascade from `workshop_instances`).
- New dependency `@vercel/blob` in `dashboard/package.json`.
- Blob storage integration: private mode, keyed by `artifacts/<instanceId>/<artifactId>-<safe-filename>`.
- New participant route `/participant/artifact/[artifactId]` (Route Handler, not a Page), streams blob with appropriate `Content-Type`, `Content-Disposition`, and `Content-Security-Policy: sandbox ...` headers, gated by cohort-matched participant session.
- New admin-auth API endpoints:
  - `POST /api/workshop/instances/[id]/artifacts` — multipart upload
  - `GET /api/workshop/instances/[id]/artifacts` — list
  - `DELETE /api/workshop/instances/[id]/artifacts/[artifactId]` — remove (DB + blob)
- Schema extension in `dashboard/lib/types/bilingual-reference.ts`: new `ArtifactReferenceItemShape` with `kind: "artifact"` + `artifactId` field. Extension is an **override-only** kind — it is **not** allowed in `workshop-content/reference.json`, only in an instance's `reference_groups` JSONB.
- CLI subcommands under `harness workshop artifact`: `upload`, `list`, `remove`, `attach`, `detach`.
- Rendering update in `buildParticipantReferenceGroups()` and the participant UI (reference sections of `ParticipantRoomSurface` + `PostWorkshopSurface`) to render `kind: "artifact"` items with primary link (opens in new tab) and secondary download icon.
- Updated skill docs for facilitators (`workshop-skill/SKILL-facilitator.md`, `workshop-skill/commands.md`).
- E2E test: upload → attach → authenticated participant sees and opens artifact; cross-instance access returns 404.

### Explicitly out of scope

- Admin / facilitator web UI for upload.
- Artifact editing in the dashboard (edit-in-place, WYSIWYG).
- Public-share URLs for artifacts.
- Versioning / rollback / history of artifacts.
- Image optimization / transcoding / thumbnailing.
- Video support (size limits reject video files at upload).
- Per-team or per-participant artifact uploads.
- Markdown / repo-native `hosted` body rendering — covered by Phase 2 of the sibling plan and deliberately independent.
- Artifact types that must appear in the compiled default catalog (by design, artifacts are cohort-only).
- Migration of the three existing share-server HTMLs is a **follow-up one-off operation**, not part of this plan's CI — uploading them is a manual post-deploy step once the CLI ships.

---

## Proposed Solution

Three phases, each independently shippable as a stack of small commits to `main` (trunk-based per project convention). Each phase is end-to-end verifiable without the next.

### Phase 1 — Storage and upload CLI (no participant surface)

Ship a working blob-backed artifact store with CLI round-trip. No participant-facing changes yet — this phase proves the upload/list/remove loop in isolation.

1. **Dependency.** Add `@vercel/blob` to `dashboard/package.json`. Confirm it works under Fluid Compute (default). No edge-only concerns.

2. **Env.** Ensure `BLOB_READ_WRITE_TOKEN` is pulled via `vercel env pull` for local dev and is set in production. Document in `dashboard/.env.example`.

3. **DB.** Migration `dashboard/db/migrations/2026-04-25-workshop-artifacts.sql`:
   ```sql
   CREATE TABLE workshop_artifacts (
     instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
     id TEXT NOT NULL,
     blob_key TEXT NOT NULL,
     content_type TEXT NOT NULL,
     filename TEXT NOT NULL,
     byte_size INTEGER NOT NULL,
     label TEXT NOT NULL,
     description TEXT,
     uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     PRIMARY KEY (instance_id, id)
   );
   CREATE INDEX IF NOT EXISTS workshop_artifacts_instance_idx
     ON workshop_artifacts(instance_id);
   ```
   Sidecar table (not inside `workshop_instances` or `workshop_state`) because artifact rows change on upload/delete events only, not on every room mutation. Mirrors the `workshop_reference_bodies` pattern from the sibling plan.

4. **Repository.** `dashboard/lib/artifact-repository.ts`:
   - `ArtifactRecord` type (matches row shape, camelCase).
   - `NeonArtifactRepository` + `FileArtifactRepository` (file mode for local dev parity, as with other repos).
   - Methods: `create(record)`, `listForInstance(instanceId)`, `get(instanceId, artifactId)`, `delete(instanceId, artifactId)`.
   - File-mode implementation stores records in a JSON file and blob bytes in a sibling local directory.

5. **Blob service.** `dashboard/lib/blob-storage.ts` — thin wrapper around `@vercel/blob`:
   - `uploadArtifact(instanceId, artifactId, buffer, mime, filename) → blobKey`
   - `deleteArtifact(blobKey)`
   - `streamArtifact(blobKey) → ReadableStream + headers`
   - Key format: `artifacts/<instanceId>/<artifactId>/<sanitized-filename>`. Sanitization rule: lowercase, collapse whitespace to `-`, strip non-[a-z0-9._-], cap at 120 chars. The sanitized filename is also what's returned in `Content-Disposition`.
   - Local/file-mode variant writes to disk under a configured directory.

6. **Upload validation.** A dedicated helper `validateArtifactUpload(file, constraints)`:
   - Max byte size: 25 MB (configurable via env `ARTIFACT_MAX_BYTES`, default hardcoded).
   - MIME allowlist: `text/html`, `application/pdf`, `image/png`, `image/jpeg`, `image/svg+xml`, `image/webp`.
   - Filename sanitization (above).
   - No filename is used to derive a blob path without sanitization; original filename is stored for display only.

7. **API.**
   - `POST /api/workshop/instances/[id]/artifacts` — multipart form body (`file`, `label`, `description?`). Facilitator-session gated (reuses admin API auth). Returns `{ artifactId, label, filename, byteSize, contentType, uploadedAt }`.
   - `GET /api/workshop/instances/[id]/artifacts` — list for CLI / admin views. Returns array (no blob bytes).
   - `DELETE /api/workshop/instances/[id]/artifacts/[artifactId]` — removes DB row, then deletes blob. If the DB delete succeeds but blob delete fails, log and continue — orphaned blob is eventually cleaned by cascade deletion (see phase-3 cleanup).

8. **CLI.** New dispatch branch in `harness-cli/src/run-cli.js` under `workshop artifact`:
   - `harness workshop artifact upload --file <path> --label <str> [--description <str>]` — reads file into buffer, POSTs as multipart to the API; prints returned artifactId.
   - `harness workshop artifact list` — GET and render table (id, label, filename, size, content-type, attached-to-group?).
   - `harness workshop artifact remove <artifactId>` — DELETE, prints confirmation.
   - Session-store provides `instanceId`; no redundant `--instance` flag.

9. **Skill docs.** `workshop-skill/SKILL-facilitator.md` + `workshop-skill/commands.md` gain the new commands.

10. **Instance-delete hook.** Wherever an instance gets deleted (admin route, CLI `workshop end`, cleanup job), after the `workshop_instances` row goes via cascade, iterate the blob keys from `artifacts/<instanceId>/*` and delete them. FK cascades the DB but not the blob storage. Either pre-fetch `blob_key` list before deletion, or list blob keys by prefix and delete the prefix. Chosen: pre-fetch list before cascade, call `deleteArtifact` for each, log per-blob errors and continue.

### Phase 2 — Authenticated serve route with cohort isolation

Ship the participant-facing serve path. Still no reference-catalog integration — phase 2 proves that uploaded artifacts can be served safely, to the right cohort, with HTML sandboxing.

1. **Route.** `dashboard/app/participant/artifact/[artifactId]/route.ts` — Route Handler (not a Page; this is a binary stream, not HTML chrome).
   ```ts
   export async function GET(
     request: Request,
     { params }: { params: Promise<{ artifactId: string }> }
   ) {
     const session = await getParticipantSessionFromCookieStore();
     if (!session?.instanceId) return new Response("Not found", { status: 404 });
     const { artifactId } = await params;
     const artifact = await artifactRepo.get(session.instanceId, artifactId);
     if (!artifact) return new Response("Not found", { status: 404 });
     const { stream, size } = await blobStorage.streamArtifact(artifact.blobKey);
     const url = new URL(request.url);
     const asDownload = url.searchParams.get("download") === "1";
     const disposition = asDownload
       ? `attachment; filename="${artifact.filename}"`
       : `inline; filename="${artifact.filename}"`;
     return new Response(stream, {
       headers: {
         "Content-Type": artifact.contentType,
         "Content-Length": String(size),
         "Content-Disposition": disposition,
         "Content-Security-Policy": "sandbox allow-scripts allow-same-origin; default-src 'self'",
         "X-Content-Type-Options": "nosniff",
         "Cache-Control": "private, max-age=0, must-revalidate",
       },
     });
   }
   ```
   **Critical:** the lookup is always `artifactRepo.get(session.instanceId, artifactId)`. Never `get(artifactId)` without the session-derived instance id. That is the cohort isolation boundary.

2. **Sandbox CSP nuance.** `sandbox allow-scripts allow-same-origin` lets the artifact's own JS run (theme toggles, interactivity) while still isolating it from scripting the dashboard. Drop `allow-same-origin` if later audit requires stricter isolation — at cost of breaking any artifact that uses `fetch` to its own assets. Start permissive, tighten if needed.

3. **SVG handling.** SVG files can carry scripts. Serve `image/svg+xml` with the same sandbox CSP header. (Option to later strip SVG via sanitization is deferred — facilitator-trusted model stands for now.)

4. **HTML handling specifically.** HTML is not sanitized server-side. The sandbox header is the security boundary. An uploaded HTML can contain arbitrary scripts, which is the intended behavior for the three artifacts at hand. Document this explicitly in the skill docs and upload API: **"HTML artifacts run their own scripts in an isolated sandbox. Only upload HTML you trust."**

5. **Auth gating detail.** The serve route does not redirect to login on no-session — it returns 404. Rationale: we do not want to leak "this artifact id exists" to unauthenticated users. A 404 for both "artifact doesn't exist" and "you aren't in the right cohort" is indistinguishable.

6. **Rate limiting.** Not added in this phase. Facilitator-auth gates upload; participant route is GET-only on already-validated artifacts. If abuse emerges, add downstream.

7. **Test.** E2E test:
   - Upload an HTML artifact to instance A.
   - As a participant authenticated to instance A, fetch `/participant/artifact/<id>` → 200 + expected content-type + sandbox header.
   - As a participant authenticated to instance B, fetch the same URL → 404.
   - As an unauthenticated user → 404.
   - With `?download=1` → `Content-Disposition: attachment`.

### Phase 3 — Reference catalog integration (participant UI)

Ship the schema addition and UI surface so participants discover artifacts through the existing reference list. Builds on the `reference_groups` JSONB override that Phase 1c of the sibling plan shipped.

1. **Type extension.** In `dashboard/lib/types/bilingual-reference.ts`:
   ```ts
   export type ArtifactReferenceItemShape = ReferenceItemBase & {
     kind: "artifact";
     artifactId: string;
   };
   export type ReferenceItemShape =
     | ExternalReferenceItemShape
     | RepoBlobReferenceItemShape
     | RepoTreeReferenceItemShape
     | RepoRootReferenceItemShape
     | ArtifactReferenceItemShape;
   ```
   Add a doc comment: **"The `artifact` kind is override-only — it MUST NOT appear in `workshop-content/reference.json`. The bilingual source schema rejects it; only the per-instance `reference_groups` override allows it."** Enforce this in the build-step validator: reject any `kind === "artifact"` in `workshop-content/reference.json` at validation time.

2. **Generated view.** `GeneratedReferenceItem` inherits the new kind automatically since the union extends `ReferenceItemShape`. Generated JSON from the bilingual source will never contain `artifact` items (rejected in step 1). Instance-override JSONB payloads may contain them.

3. **Href resolution.** `dashboard/lib/repo-links.ts` currently resolves `repo-blob` → GitHub URL. Extend with an `artifact` case: `/participant/artifact/<artifactId>`. Add a sibling helper `buildArtifactDownloadHref(artifactId)` returning `/participant/artifact/<artifactId>?download=1`.

4. **View model.** `buildParticipantReferenceGroups()` in `dashboard/lib/public-page-view-model.ts` passes through `artifact` items. The rendered item shape gains a `downloadHref?` field (only set for `artifact` kind) that the UI renders as a small download icon next to the primary link.

5. **UI render.** In `ParticipantRoomSurface` and `PostWorkshopSurface` reference section renderers:
   - `artifact` item primary link: `target="_blank" rel="noopener"`, href resolved above.
   - Secondary affordance: download icon linking to `?download=1`, `target="_blank" rel="noopener"` (browser handles the attachment).
   - Reuse existing label/description rendering; no new visual primitives.

6. **Per-instance-only validation (API).** The `PATCH /api/workshop/instances/[id]/reference` endpoint (from sibling plan) accepts an `artifact` item. Validate that the referenced `artifactId` exists in `workshop_artifacts` for this `instanceId`; reject if not. Prevents attaching a phantom id or an id from another cohort.

7. **Catalog CLI.** Two new subcommands under `workshop artifact`:
   - `harness workshop artifact attach <artifactId> --group <groupId> [--label <str>] [--description <str>]` — fetches current effective `reference_groups`, appends an `{ kind: "artifact", artifactId, label, description }` item to the named group (pulling label/description from the artifact record if flags omitted), writes back as a full override via the sibling `PATCH /reference` endpoint.
   - `harness workshop artifact detach <artifactId>` — fetches current override, removes any item with matching `artifactId`, writes back.

8. **Skill docs.** Updated.

9. **E2E test.** Upload → attach → load `/participant` as authenticated participant → see item in reference group → click → opens in new tab → download icon works.

### Rollout

Before Phase 3 merges to `main`, manual proof-slice:
- Upload all three target artifacts (Codex picker, case study, auth flow) to the production instance.
- Attach each to the appropriate reference group.
- Load `/participant` as a cohort participant, click through, confirm visual fidelity and download.

---

## Implementation Tasks

Dependency-ordered. Sub-phases inside each phase can be separate PRs.

### Phase 1 — Storage and upload CLI

**1a. Dependency and env**
- [x] Add `@vercel/blob` to `dashboard/package.json`. Pin version. _(landed `@vercel/blob@^2.3.3`)_
- [x] Document `BLOB_READ_WRITE_TOKEN` in `dashboard/.env.example`.
- [ ] Confirm token is present in Vercel project env (preview + production) before first upload. _(operational, not a code task)_

**1b. DB + repository**
- [x] Migration `dashboard/db/migrations/2026-04-25-workshop-artifacts.sql` (idempotent `CREATE TABLE IF NOT EXISTS` + index).
- [x] Create `dashboard/lib/artifact-repository.ts` with `ArtifactRecord` type, `NeonArtifactRepository`, `FileArtifactRepository`.
- [x] Methods: `create`, `listForInstance`, `get`, `delete`. FileAdapter writes records to JSON; blob bytes handled by `blob-storage.ts`.
- [x] Unit tests (11 cases) covering round-trip, cross-cohort isolation, id collision rejection, unsafe-id rejection.

**1c. Blob service**
- [x] Create `dashboard/lib/blob-storage.ts` — thin wrapper over `@vercel/blob`.
- [x] Implement `upload`, `stream`, `delete`.
- [x] Local `FileBlobStorage` variant for dev (bytes under `HARNESS_DATA_DIR/<blobKey>`).
- [x] Unit tests (6 cases) against file mode covering upload round-trip, delete, path-traversal rejection.
- [x] `dashboard/lib/artifact-filename.ts` helper (sanitize + `buildArtifactBlobKey`) with 9 unit tests.

**1d. Upload validation**
- [x] Implement `validateArtifactUpload(input, constraints)` with size cap, MIME allowlist, filename + label shape.
- [x] 15 unit tests covering oversized rejection (413), unsupported MIME, empty file, missing label/filename, over-long label/description, env-override precedence, trim/normalise behaviour.

**1e. API endpoints**
- [x] `POST /api/workshop/instances/[id]/artifacts` — multipart handler, validation, repo + blob service calls, orphan-blob cleanup on DB failure, returns created record (201).
- [x] `GET /api/workshop/instances/[id]/artifacts` — returns list (blob keys hidden).
- [x] `DELETE /api/workshop/instances/[id]/artifacts/[artifactId]` — cohort-isolated composite lookup, removes row + blob (best-effort), returns `{ ok, artifactId }`.
- [x] 12 API tests covering happy path, validation branches (400/413/404), unauthorised access, cross-instance DELETE refusal.

**1f. CLI**
- [x] Add `workshop artifact upload|list|remove` branches in `harness-cli/src/run-cli.js`.
- [x] Multipart upload via `Blob` + `FormData` in `harness-cli/src/client.js` (Node 18+).
- [x] Human-readable list output (id, label, filename, size, uploaded).
- [x] Help text updated in `run-cli.js`.
- [x] `harness-cli/README.md` documents all three verbs.

**1g. Instance-delete blob cleanup**
- [x] Centralized helper `dashboard/lib/instance-artifact-cleanup.ts` (`deleteInstanceArtifactsAndBlobs`) for hard-delete flows.
- [x] Soft-remove (`removeWorkshopInstance`) deliberately does NOT call this — artifacts remain available through archive/restore.
- [x] Per-blob error isolation: one bad key does not leak the rest; errors counted and logged.
- [x] 3 tests covering zero-artifact case, multi-artifact removal, cross-instance protection, missing-blob tolerance.

**1h. Skill docs**
- [x] `workshop-skill/SKILL-facilitator.md` has a dedicated `workshop facilitator artifact upload|list|remove` section.
- [ ] `workshop-skill/commands.md` update _(skipped — participant-facing skill doc, not facilitator surface)_.

### Phase 2 — Authenticated serve route

**2a. Route handler**
- [x] Create `dashboard/app/participant/artifact/[artifactId]/route.ts` with GET handler.
- [x] Resolve participant session via `getParticipantSessionFromRequest` (new helper that reads the cookie from the Request, not next/headers async storage).
- [x] Stream blob with `Content-Type`, `Content-Disposition`, `Content-Security-Policy: sandbox allow-scripts allow-same-origin allow-popups allow-forms; default-src 'self'`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Cache-Control: private, max-age=0, must-revalidate`.
- [x] Handle `?download=1` → `Content-Disposition: attachment` with sanitised filename.

**2b. Auth and isolation tests**
- [x] Unit: upload to instance A, fetch as participant-A → 200 + all headers asserted.
- [x] Unit: fetch as participant-B → 404.
- [x] Unit: fetch unauthenticated → 404.
- [x] Unit: fetch nonexistent artifactId as participant-A → 404.
- [x] Unit: sandbox + nosniff + frame-deny headers present on every variant.
- [x] Bonus: CRLF/quote injection in filename is sanitised to underscores.
- [x] Bonus: blob missing on disk → 404 (fail closed).

**2c. HTML sandbox smoke** _(manual operator step — not in code)_
- [ ] Manually upload one of the three target HTMLs to a preview instance.
- [ ] Open in new tab — verify theme toggle works, scripts execute, page renders as on the share server.
- [ ] Verify the artifact cannot read `document.cookie` of the dashboard origin (quick devtools check).
- [ ] Verify SVG artifact with embedded script renders as image but script does not execute against dashboard origin.

**2d. Size and stream correctness**
- [x] Test: preserves `Content-Length` that matches byte size on PDF + HTML variants.
- [x] `streamArtifact` returns a `ReadableStream<Uint8Array>` (never buffers the whole body). File mode uses `Readable.toWeb`; Vercel mode uses the SDK's stream directly.

### Phase 3 — Catalog integration

**3a. Schema extension**
- [x] Extend `ReferenceItemShape` union in `dashboard/lib/types/bilingual-reference.ts` with `ArtifactReferenceItemShape`.
- [x] Add explicit doc comment: override-only kind. Split `BilingualReferenceItemShape` (authoring source, excludes artifact) from the full `ReferenceItemShape` so TS enforces the split at compile time.
- [x] Update the bilingual source validator in `scripts/content/generate-views.ts` to reject `kind === "artifact"` with a pointed error message.
- [ ] Unit test for generator rejection _(skipped — type-system enforcement + runtime `case` reject both cover it; the generator is a CLI, not an exported module, so a unit test would require restructuring)_.

**3b. Resolver and href**
- [x] Extend `dashboard/lib/repo-links.ts` with `buildParticipantArtifactHref(artifactId)` and `buildParticipantArtifactDownloadHref(artifactId)`.
- [x] Extend `buildParticipantReferenceGroups()` / `toReferenceEntry()` to pass through artifact items with resolved href + downloadHref. `ParticipantReferenceEntry` gains an optional `downloadHref` field.
- [x] 3 unit tests: artifact kind → expected hrefs; non-artifact kinds leave `downloadHref` undefined; url-encoded for unsafe artifactIds.

**3c. UI render**
- [x] Update reference item render in `ParticipantRoomSurface` and `PostWorkshopSurface` to handle artifact kind: primary link `target=_blank`, secondary download icon (absolutely positioned top-right) with `?download=1`.
- [x] Non-artifact items render byte-identical to before (`downloadHref` undefined → no icon).
- [x] Accessibility: download icon has `aria-label` + `title` from locale copy (`downloadLinkLabel` — CS "stáhnout" / EN "download").

**3d. API validation**
- [x] Extend `parseReferenceItem` in `lib/workshop-instance-api.ts` to accept `kind: "artifact"` with required non-empty `artifactId`.
- [x] Extend `PATCH /api/workshop/instances/[id]/reference` route handler with `validateArtifactReferences` that checks each artifact item's `artifactId` exists in `workshop_artifacts` for the TARGET instance.
- [x] 3 tests: missing artifactId → 400, same-cohort artifact → 200, cross-cohort artifact → 400 with pointed error.

**3e. Attach/detach CLI**
- [x] `harness workshop artifact attach <artifactId> --group <groupId> [--label TEXT] [--description TEXT]` fetches the artifact metadata, resolves the current effective catalog, replaces-or-appends a `{ kind: "artifact" }` item (namespaced as `artifact-<artifactId>` so it cannot collide with other item ids), writes back via PATCH.
- [x] `harness workshop artifact detach <artifactId>` filters every group's items and writes the reduced catalog back. Idempotent — detaching an unattached artifact exits OK with "nothing to detach".
- [ ] E2E upload→attach→participant→detach _(covered by combined unit + integration tests; full end-to-end flow requires a preview instance)_.

**3f. Skill docs and README**
- [x] `workshop-skill/SKILL-facilitator.md` documents attach/detach + the participant-side experience (open + download icon).
- [x] `harness-cli/README.md` example block and narrative cover attach/detach with the cohort-isolation note.

### Preview & rollout gate

- [x] After Phase 1 ships: facilitator round-trip smoke — Phase 1 shipped to prod via `git push`; migration already applied.
- [ ] After Phase 2 ships: auth + isolation automated tests green (done); manual sandbox smoke on a preview instance with a real target HTML _(operator step)_.
- [ ] Before Phase 3 merges: preview artifact showing `/participant` with an attached artifact item _(operator step — can be captured by uploading one of the target HTMLs to the production instance once BLOB_READ_WRITE_TOKEN is set)_.
- [ ] After Phase 3 ships: manual proof-slice on production — upload all three target HTMLs, attach to `defaults`, verify cohort participants see + open them.

---

## Acceptance Criteria

**Phase 1 is done when:**
- `harness workshop artifact upload --file ./something.html --label "..."` round-trips end-to-end on a live instance, returning an `artifactId`.
- `harness workshop artifact list` shows the uploaded artifact with correct size, content-type, filename, label.
- `harness workshop artifact remove <artifactId>` removes the DB row and the blob; subsequent list omits it.
- Oversized (> 25 MB) or disallowed-MIME uploads are rejected with a clear error.
- Deleting an instance removes all its artifacts from DB and blob storage.
- No participant-facing surface has changed (regression check).

**Phase 2 is done when:**
- `/participant/artifact/<id>` returns the blob with the correct `Content-Type`, `Content-Disposition` (inline by default, attachment with `?download=1`), and a strict `Content-Security-Policy: sandbox ...` header.
- A cohort-B participant requesting a cohort-A artifact id gets 404 (not 403, not 200) — verified by automated test.
- An unauthenticated request gets 404 — verified by automated test.
- An uploaded HTML artifact renders correctly in a new tab with its own scripts running, but cannot read or write anything on the dashboard origin (manual devtools check captured in the PR).
- `Content-Length` matches body size on every variant.

**Phase 3 is done when:**
- A facilitator can run `harness workshop artifact attach <id> --group defaults` and the cohort's participants see the new item on next `/participant` load.
- Clicking the item opens it in a new tab; the download icon triggers a downloaded file with the correct original filename.
- `workshop-content/reference.json` build fails if the source includes an `artifact` kind (validator rejection verified by test).
- Attaching an artifact from the wrong instance is rejected by the API (verified by test).
- `harness workshop artifact detach <id>` removes the item from the participant view on next load.
- All three target HTMLs have been uploaded and attached to the production instance, and authenticated cohort participants can open them.

---

## Decision Rationale

### Why Vercel Blob, not S3 / R2 / existing share server?

Vercel Blob is first-party on the platform the dashboard already ships on. Env wiring is automatic once the integration is added. No extra vendor, no separate IAM, no new region decision. S3/R2 are cheaper at scale but this is workshop-scale — tens of megabytes per cohort, not gigabytes. The share server is not production. The marginal savings of S3 are not worth the extra surface area at this scale.

### Why private blob + proxy route, not signed URLs?

Signed URLs leak the blob URL to the client, even if they expire. Once a participant has the URL, they can share it outside the cohort during the expiry window. The proxy route makes every fetch re-validate cohort membership against the participant session. Additionally, the proxy is where we attach the `Content-Security-Policy: sandbox` header, which is non-optional for serving user-uploaded HTML. Signed URLs would serve from the blob CDN where we can't inject that header.

### Why a sidecar `workshop_artifacts` table, not `workshop_instances.artifacts JSONB`?

Main-row reads on `workshop_instances` happen on every participant page load. Inlining the artifact list (including 200+ bytes of label/description per artifact) would bloat that read. Artifacts are only listed on upload/attach-management flows, not on every participant render. Sidecar table keeps the hot path lean. Same reasoning as `workshop_reference_bodies` in the sibling plan.

### Why `artifact` kind is override-only, not allowed in `workshop-content/reference.json`?

Artifacts are inherently cohort-specific — they reference a blob id that exists for one instance only. Permitting them in the bilingual source would require a cross-instance artifact registry (shared blobs referenced by multiple instances), which this plan explicitly rejects as out of scope. Making the kind override-only at the schema level prevents a footgun where a facilitator edits the source and the build would then fail at runtime on other instances. Clear error at build time > mysterious runtime failure.

### Why a Route Handler, not a Page?

Route Handler (`route.ts`) streams a binary response with custom headers. A Page (`page.tsx`) renders HTML. The artifact is not dashboard chrome — it is the artifact itself, full-tab, with its own styling. Route Handler is the right primitive.

### Why `Content-Security-Policy: sandbox allow-scripts allow-same-origin`?

The three target HTMLs ship their own client-side JS (theme toggles, chart rendering). Stripping `allow-scripts` breaks them. `sandbox` without further flags blocks scripts and same-origin entirely. `allow-scripts allow-same-origin` lets the artifact be a normal-looking self-contained page while preventing it from scripting any other origin — specifically the dashboard origin, since the artifact is served from a different iframe-like sandbox context even when on the same URL host. If a future audit shows `allow-same-origin` is too permissive, drop it; expect some artifacts to break at that point.

### Why 404 on cross-cohort access, not 403?

A 403 confirms "this artifact id exists, you just can't read it." A 404 is indistinguishable from "this artifact id does not exist." The latter leaks no information. Same reasoning applies to unauthenticated requests.

### Why start with a narrow MIME allowlist?

HTML is load-bearing (the three target artifacts). PDF is the natural static reference format. Images cover diagrams and screenshots. Everything else can be added later on demand. Starting narrow means we don't accidentally accept a type (e.g. Office docs, zip archives) whose security properties we haven't thought through.

### Why separate `upload` and `attach` instead of one combined verb?

They are separate concerns. Upload is a storage action — the file now exists in blob. Attach is a curation action — the facilitator has decided this artifact belongs in the cohort's reference shelf. Combining them forces visibility on every upload; separating them lets a facilitator upload, review, and attach only when ready. `harness workshop artifact list` shows attached-vs-orphaned state so mistakes are visible.

### Why CLI-only, no admin UI?

Matches the sibling plan's explicit stance and the project's overall "CLI + skill is the primary facilitator interface" direction. An admin UI is future work if demand emerges.

### Why no rate limiting in Phase 1/2?

Upload is facilitator-auth gated. A misbehaving facilitator is a trust issue, not a rate-limiting issue. The participant serve route is GET-only on already-validated artifacts; abuse would manifest as bandwidth spikes from one cohort, which is visible in Vercel's metrics and addressable reactively. Adding rate limits now is premature optimization against a risk that has not yet manifested.

---

## Constraints and Boundaries

- **Trunk-based.** Each phase = small commits to `main`, no feature branches (per project memory).
- **Deploy via git push only.** No `vercel --prod` (per project memory).
- **Backward compatibility.** Instances that never upload an artifact render exactly as today. The new kind is additive; existing kinds are untouched.
- **No admin UI added.**
- **Participant auth unchanged.** New serve route inherits the cookie-based session; no new auth surface.
- **Sanitization-by-isolation, not sanitization-by-rewrite.** We do not rewrite HTML. We serve it with `Content-Security-Policy: sandbox`. No hosted-HTML PR lands without the sandbox header and a test covering it.
- **Artifacts are not repo-tracked.** They live in Blob. The repo never contains cohort-specific blobs. The migration operation for the three existing HTMLs is manual and one-shot.
- **Voice and copy rules from project memory apply** to any new participant-facing copy added in Phase 3 UI (team/teammate/agent triad; no drop-surviving/rescue motif).

### Tone / taste rules (Phase 3 UI)

- Download icon is a *secondary* affordance. Primary click opens in new tab; download is discoverable but not emphasized.
- Artifact items should look at home next to existing reference items. No new visual primitive that says "this one is special" — the list's semantic uniformity is the point.
- Labels should be cohort-meaningful, not filename-echoes. Facilitators are encouraged (via CLI help text) to set a descriptive label at upload time.

### Rejection criteria

- Any variant of the serve route response that lacks the `Content-Security-Policy: sandbox` header = immediate revert.
- A cross-cohort artifact access that succeeds = immediate revert.
- A generator accepting `kind: "artifact"` in the bilingual source = revert (silent bug; would break at runtime for other instances).
- A successful upload of a disallowed MIME or oversized file = revert of the validation layer.
- An instance deletion that leaves orphaned blob keys in storage = fix-forward (not revert, but must be addressed within the same release).

---

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| `@vercel/blob` works under Fluid Compute (default Node runtime) | Verified (via plugin knowledge update) | Vercel platform docs; blob SDK is Node-compatible, not edge-only |
| Private-mode blobs can be streamed server-side from a Route Handler without additional signing | Unverified | SDK provides `get` returning a stream/URL; confirm shape in Phase 1c spike |
| 25 MB covers all three target HTMLs plus typical PDF handouts | Verified (via artifact sizes) | Three target HTMLs are all < 1 MB; typical workshop PDFs are < 10 MB |
| `sandbox allow-scripts allow-same-origin` permits the theme toggle JS on the target HTMLs to run | Probable (by CSP semantics) | Tested manually as part of Phase 2c; if it breaks, relax sandbox further or serve from a sibling subdomain |
| Participant session cookie carries `instanceId` reliably | Verified | `getParticipantSessionFromCookieStore()` returns `{ instanceId, participantId }` and is used by `/participant/page.tsx` today |
| `workshop_artifacts` sidecar table pattern works identically to `workshop_reference_bodies` | Verified (planned) | Same shape, same FK cascade, same repo layering |
| `harness-cli` can send multipart/form-data uploads from Node 18+ runtime | Probable | Node 18+ ships `File` and `FormData`; confirmed via quick spike before Phase 1f |
| Vercel Blob pricing on our plan accommodates workshop-scale usage (~10s of MB per cohort) | Probable | Vercel Blob free tier includes multi-GB storage; workshop scale is negligible |
| No existing dashboard code competes for the `/participant/artifact/*` path | Verified | Grep shows no routes under `dashboard/app/participant/artifact` |
| Instance deletion happens via a known set of call sites (not ad-hoc SQL in many places) | To verify in Phase 1g | If false, the blob-cleanup hook must be centralized — e.g. a `deleteInstance(id)` helper that both DB cascade and blob cleanup call through |

**Unverified assumptions are tracked as investigation tasks in the phase where they block.** The private-blob streaming shape and the instance-deletion call-site set are the two items that need explicit verification before the respective phase ships.

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| An uploaded HTML artifact exploits a missing CSP header to steal participant session cookies | Low (sandbox is load-bearing and tested) | Critical | Phase 2 test asserts CSP header presence on every response variant. Add a second test that simulates a cookie-read attempt and confirms isolation. |
| Cross-cohort artifact access via URL guessing | Low (lookup is always scoped by `session.instanceId`) | Critical | Phase 2 explicit test. Code review requires reviewer to confirm the lookup uses the session's instanceId, not a path param alone. |
| Orphaned blobs after instance deletion | Medium (requires all deletion call sites to use the hook) | Medium | Centralize via a `deleteInstanceAndArtifacts(id)` helper in Phase 1g. Periodic blob-cleanup cron job as belt-and-suspenders (not in-scope for this plan; log for future). |
| Blob quota / bandwidth overage | Low at current scale | Low | Workshop scale is negligible; monitor via Vercel dashboard. Hard-cap upload size at 25 MB prevents single-file blowouts. |
| Facilitator uploads a malicious HTML that breaks a participant's browser | Low (facilitator is trusted) but nonzero | Medium | Sandbox CSP isolates from dashboard origin. Tab-level damage (infinite loops, huge DOMs) is possible; documented in skill docs as a responsibility of the uploader. |
| `@vercel/blob` SDK changes shape / is deprecated | Low | Medium | Thin wrapper in `blob-storage.ts` isolates the SDK from the rest of the codebase. Swap to S3/R2 later behind the same interface if needed. |
| Multipart upload from CLI hits some Node FormData inconsistency | Medium | Low | Phase 1f spike before implementation. Fallback: use `formdata-node` or `undici`'s FormData. |
| HTML artifact with `allow-same-origin` sandbox can call `fetch("/api/...")` with dashboard session cookies | Low (facilitator-trusted) but unbounded blast radius | High | Drop `allow-same-origin` if any facilitator-uploaded HTML turns out to need it; measure impact on the target HTMLs in Phase 2c. Acceptable for now because upload is admin-auth gated. |
| A participant bookmarks the artifact URL, logs out, comes back later, sees 404, thinks the artifact is broken | Medium | Low | Expected behavior (404-on-unauth is explicit design). Skill docs note: "artifacts are scoped to your workshop session; bookmark the cohort page, not the artifact." |
| Schema validator does not reject `kind: "artifact"` in `workshop-content/reference.json`, generator produces a broken build artifact | Medium | High | Phase 3a explicit test. Validator is the gate. |
| API accepts an artifact item referencing a nonexistent or wrong-instance artifactId | Medium | High | Phase 3d validator + test. Reject at ingress, not discovery at render. |
| `react` / Next.js route handler streaming semantics differ from plain Response | Low | Medium | Phase 1c / 2a spikes confirm `new Response(stream, { headers })` works under current Next.js version. |
| Participant URL pattern collides with a future `/participant/<route>` page | Low | Low | `/participant/artifact/` is prefix-specific and unlikely to conflict. If it does, rename with a 308 redirect. |

---

## Phased Implementation

### Phase 1 entry criteria
- `@vercel/blob` approved as dependency (no external review needed; first-party platform SDK).
- `BLOB_READ_WRITE_TOKEN` available in local + preview + production env.

### Phase 1 exit criteria
- All Phase 1 tasks checked off.
- CLI round-trip (upload + list + remove) verified on a preview instance.
- Instance-delete blob cleanup verified.
- No participant-facing surface change.

### Phase 2 entry criteria
- Phase 1 shipped.
- Spike confirming `streamArtifact` semantics work in Route Handler context.

### Phase 2 exit criteria
- All Phase 2 tasks checked off.
- Auth + isolation E2E tests green.
- Manual HTML sandbox smoke: target HTMLs render correctly in new tab, cannot read dashboard origin.

### Phase 3 entry criteria
- Phase 2 shipped.
- Generator validator for override-only kind designed and tested.

### Phase 3 exit criteria
- All Phase 3 tasks checked off.
- All three production-instance artifacts uploaded, attached, and verified visible to authenticated cohort participants.
- Preview artifact (screenshot of `/participant` with attached artifact) captured in the Phase 3 PR.

---

## Subjective Contract (design-sensitive scope)

### Target outcome

A facilitator running the production cohort opens the terminal:
```
harness workshop artifact upload --file ./case-study.html --label "16-day harness case study"
harness workshop artifact upload --file ./codex-picker.html --label "Codex's model picker, decoded"
harness workshop artifact upload --file ./auth-flow.html --label "Participant auth flow v2"
harness workshop artifact attach <id1> --group defaults
harness workshop artifact attach <id2> --group explore
harness workshop artifact attach <id3> --group defaults
```

…and on the next `/participant` load, authenticated cohort participants see the three artifacts in their reference shelf, click them, and they open in new tabs looking identical to how they render on the share server today — but gated by auth, scoped to the cohort, not dependent on a Mac Mini. The UI feels like the existing reference list, not a new feature.

### Anti-goals (restated, shorter)

- Not a file manager. Not a CMS. Not a public-share product. Not a video host. Not an editor. Not an admin UI.

### References (positive models)

- `dashboard/db/migrations/2026-04-21-workshop-feedback.sql` and sibling plan — sidecar table pattern for instance-scoped content.
- `dashboard/app/api/event-access/identify/*` — existing pattern for participant-session-gated API routes.
- `dashboard/lib/types/bilingual-reference.ts` — discriminated-union kind pattern to extend.
- `harness-cli/src/run-cli.js` team and reference subcommands — `workshop X Y` dispatch shape.

### Anti-references

- Any instinct to inline artifact bytes into `workshop_instances` (resist — sidecar).
- Any instinct to serve blobs via signed CDN URLs (resist — sandbox header lives on the proxy).
- Any instinct to expose artifact kinds in `workshop-content/reference.json` (resist — override-only).
- Any instinct to build an admin UI (resist — CLI only).

### Required preview artifacts

Before Phase 3 merges to `main`:

1. **Preview A — participant page with attached artifact.** `/participant` screenshot (or static HTML export) of the reference section showing one artifact item alongside existing external + repo-blob items. Primary link + download icon both visible. Must look visually uniform with other items (no "this is special" treatment).
2. **Preview B — artifact render in new tab.** Screenshot of one target HTML artifact rendered via the serve route, confirming theme toggle works and no console errors from CSP. Include devtools network tab showing the `Content-Security-Policy: sandbox ...` header on the response.

Both previews captured in the Phase 3 PR or in a shared preview location. No mandatory remote share.

### Rollout rule

- Phase 1 ships when CLI round-trip works on a preview instance and blob cleanup on instance delete is verified.
- Phase 2 ships when auth + isolation tests are green and sandbox smoke confirms target HTML works.
- Phase 3 ships when preview artifacts pass subjective review AND all three production-instance artifacts are uploaded, attached, and opened by a test cohort participant.

### Rejection criteria (restated)

The plan fails (revert, not rollforward) if any of:
- Serve route response missing CSP sandbox header.
- A cross-cohort artifact access succeeds in any variant.
- An uploaded file bypasses MIME or size validation.
- `workshop-content/reference.json` successfully contains a `kind: "artifact"` item after build.
- Instance deletion leaves orphaned blobs (must be addressed before closing the release).

---

## References

- Sibling plan (builds on Phase 1c shipped, parallel to Phase 2 in progress): `docs/plans/2026-04-21-feat-dynamic-participant-reference-content-plan.md`.
- Current reference catalog schema: `dashboard/lib/types/bilingual-reference.ts`.
- Reference override migration (shipped): `dashboard/db/migrations/2026-04-22-instance-reference-groups.sql`.
- Participant session API: `dashboard/lib/event-access.ts` (`getParticipantSessionFromCookieStore`), `dashboard/app/participant/page.tsx`.
- CLI dispatch pattern: `harness-cli/src/run-cli.js` (`workshop team`, `workshop reference` branches).
- Bilingual content generator: `scripts/content/generate-views.ts`.
- Sidecar-table pattern precedent: `dashboard/db/migrations/2026-04-21-workshop-feedback.sql`, `resolveEffectiveFeedbackTemplate` in `dashboard/lib/workshop-data.ts`.
- Vercel Blob SDK: `@vercel/blob` (private mode, Node runtime via Fluid Compute).
- Three target artifacts (share-server URLs, to be uploaded manually post-deploy):
  - `https://ondrejs-mac-mini.tailbc79e3.ts.net/s/artifact--2026-04-20--8a07c4a9/` (Codex model picker)
  - `https://ondrejs-mac-mini.tailbc79e3.ts.net/s/artifact--2026-04-20--b1ee9860/` (16-day harness case study)
  - `https://ondrejs-mac-mini.tailbc79e3.ts.net/s/artifact--2026-04-20--63c8c85b/` (Participant auth flow v2)
