---
title: "feat: facilitator-revealable event codes via AES-256-GCM"
type: plan
date: 2026-04-23
status: shipped
confidence: high
---

# feat: Facilitator-revealable event codes via AES-256-GCM

Add an admin-side "reveal current event code" affordance without
weakening the existing hash-based comparison. The plaintext is stored
only as ciphertext encrypted with a server-side key the DB itself
doesn't know.

## Problem Statement

Event codes are stored as HMAC-SHA256 hashes (`1e1f865`) — an
intentional security win for the DB-leak threat model. The side
effect is that the admin UI literally cannot show the current code:
the chip in the Run topbar renders `participantAccessUnavailableValue`
("unavailable" / "nedostupné") any time `canRevealCurrent` is false,
which is every real production instance.

For the closed **seyfor-brno** workshop, the facilitator (Ondrej)
wants to give a stragglers the code so they can still submit
feedback. Today the only path is "issue new code" — which mints a
fresh code shown once on a flash redirect, discarding the old hash
and forcing any participants mid-login to request the new value.
That's user-hostile for a tiny recovery need.

Beyond the immediate ask, the copy itself is misleading: "participant
access · unavailable" reads as "feature broken" when it really means
"plaintext not recoverable from hash." That confuses the facilitator
during a live workshop.

## Target End State

- Facilitator opens the Run topbar and sees a code chip that reads
  `••••••` (or similar hidden placeholder) plus a "reveal" button.
- Clicking reveal triggers a server round-trip that (a) re-checks
  facilitator auth, (b) decrypts the ciphertext, (c) writes an
  `participant_event_access_revealed` audit row with actor + code
  version + codeId, (d) returns the plaintext to the client.
- The plaintext appears in the chip plus a "copy" button, then
  auto-hides after 30 s or on manual click.
- No plaintext enters the server-rendered HTML. View-source on the
  admin page shows `••••••` and a hidden input carrying only the
  code id and version.
- For new issues from this change forward, the DB stores
  `code_ciphertext` alongside `code_hash`. Both are derived from the
  same plaintext at issue time.
- Missing `HARNESS_EVENT_CODE_REVEAL_KEY` in dev remains
  non-fatal — issue flow works, reveal simply reports
  "reveal key not configured." In Neon-mode production the key is
  required at runtime, parallel to `HARNESS_EVENT_CODE_SECRET`.

## Scope and Non-Goals

**In scope:**
- AES-256-GCM encrypt/decrypt helper with env-configured key.
- Schema + repository changes to persist `code_ciphertext` alongside
  the existing `code_hash` on `participant_event_access`.
- Issue-flow update: encrypt and store on every new issue.
- Server action + client component for reveal (audit-logged).
- Copy updates for CS + EN.
- Tests for crypto round-trip, graceful key-missing behaviour,
  tampered-ciphertext rejection, issue-writes-ciphertext,
  reveal-audit-logged.

**Non-goals:**
- **No retro-reveal of historical codes.** The hash is one-way; the
  Seyfor code cannot be recovered. Facilitator must rotate once to
  get a revealable code. A one-time migration that mints a
  revealable replacement for every active instance is a separate
  follow-up unit; this plan does not include it.
- **No key rotation tooling.** First key lands; rotation is a
  follow-up. Document the constraint (lost key → lost reveal for
  ciphertexts issued under that key).
- **No reveal-on-load (SSR plaintext).** Plaintext is never in
  rendered HTML; always fetched through a server action.
- **No plaintext in audit metadata.** Reveal events log actor +
  version + codeId only.

## Proposed Solution

### Crypto primitive

`dashboard/lib/event-code-reveal-crypto.ts`

```ts
// AES-256-GCM: 12-byte random nonce, 16-byte auth tag.
// Serialised as "v1:" + base64url(nonce) + "." + base64url(ciphertext) + "." + base64url(tag)
// `v1:` prefix leaves room to rotate algorithm or key scheme later.

export function encryptEventCodeForReveal(plaintext: string): string
export function decryptEventCodeForReveal(payload: string): string | null
export function isEventCodeRevealConfigured(): boolean
```

Key sourced from `HARNESS_EVENT_CODE_REVEAL_KEY` (required format:
base64url, exactly 32 decoded bytes). Validation at module load for
neon-mode prod parity with `resolveEventCodeKey`. Dev-mode fallback
= no encryption (returns null-ish, logged once).

### Data model

New nullable column `code_ciphertext TEXT` on
`participant_event_access`:

```sql
-- db/migrations/2026-04-23-event-code-reveal-ciphertext.sql
ALTER TABLE participant_event_access
  ADD COLUMN code_ciphertext TEXT;
```

File-mode JSON records get an optional `codeCiphertext?: string | null`.
Missing on legacy rows = not revealable (chip shows "rotate to
enable reveal").

Type update in `runtime-contracts.ts`:

```ts
export type ParticipantEventAccessRecord = {
  id: string;
  instanceId: WorkshopInstanceId;
  version: number;
  codeHash: string;
  codeCiphertext?: string | null;   // NEW
  expiresAt: string;
  revokedAt: string | null;
  sampleCode?: string | null;
};
```

### Issue flow

`issueParticipantEventAccess` in `participant-access-management.ts`
gains one line:

```ts
const nextAccess = {
  // ...existing fields...
  codeCiphertext: isEventCodeRevealConfigured()
    ? encryptEventCodeForReveal(nextCode.value)
    : null,
};
```

Bootstrap/seed code in `FileParticipantEventAccessRepository.
buildSeedAccess` similarly encrypts the seed plaintext if key
configured.

### Reveal flow

New server action `revealParticipantEventCodeAction`:

```
1. requireFacilitatorActionAccess(instanceId)
2. Fetch active access record
3. If codeCiphertext is null → return { ok: false, reason: "not-revealable" }
4. decryptEventCodeForReveal(codeCiphertext)
5. If decrypt fails → audit with result: "failure", return { ok: false, reason: "decrypt-failed" }
6. Audit: participant_event_access_revealed (success, actor + version + codeId)
7. Return { ok: true, plaintext }
```

Client component `RunAccessRevealChip` renders:
- Default state: `••••••` + "zobrazit kód" / "reveal code" button
- On click → `useTransition` → server action → plaintext state
- Revealed state: `{plaintext}` + "kopírovat" / "copy" button +
  "skrýt" / "hide" button + 30s auto-hide timer
- Error state: shows friendly message, logs to console

### UI composition

Split `RunAccessStrip` into:
- `RunAccessStrip` (server) — still renders walk-ins policy and
  rotate-button
- `RunAccessRevealChip` (`"use client"`) — owns the hidden/revealed
  state for the code pill

The rotate button's existing flash-cookie flow continues to work
(shows new plaintext once after issuance); the reveal chip covers
the steady-state need.

## Decision Rationale

**Why AES-256-GCM and not a library like libsodium or Vercel KMS?**
- Node's built-in `crypto` already exposes AES-256-GCM. Zero new
  dependencies, zero supply-chain surface, FIPS-approved primitive.
- KMS is overkill: we're protecting a handful of 14-day codes per
  workshop, not long-lived secrets. Adding Vercel KMS (or AWS KMS)
  would introduce a cold-path latency, per-call cost, and another
  failure mode on the reveal button click.
- libsodium would give us XChaCha20-Poly1305 which is marginally
  nicer for nonce misuse resistance, but we're generating a fresh
  CSPRNG nonce per encryption and never reusing keys, so GCM's
  nonce-misuse failure mode doesn't apply.

**Why a new env var (`HARNESS_EVENT_CODE_REVEAL_KEY`) rather than
reusing `HARNESS_EVENT_CODE_SECRET`?**
- The HMAC secret has different compromise semantics from the
  encryption key. If the HMAC secret leaks, attackers can forge
  event-code hashes (bad, but limited to pre-image attacks on
  leaked hashes). If the encryption key leaks, attackers can
  decrypt every live code in the DB (worse).
- Keeping them separate lets operators rotate independently and
  gives future-us room to move the encryption key to KMS without
  touching the HMAC path.

**Why store plaintext server-action response, not SSR?**
- SSR would embed the plaintext in the HTML document every time
  the admin loads — effectively "always on" reveal. The audit log
  would be meaningless (it would fire on every page load, not every
  intentional reveal).
- The server-action round-trip gives us a clean audit event per
  click, and the plaintext lives only in JS memory briefly. Harder
  for a screenshot / over-the-shoulder viewer to catch accidentally.

**Why no retro-reveal for Seyfor?**
- Hashes are genuinely one-way. There is no key we can add later
  that recovers the plaintext of a code issued before this column
  existed.
- A one-time "mint revealable replacement for each live instance"
  migration is feasible (rotate every active code in place, leaving
  old sessions intact) but it's a distinct operational unit with
  its own risks (duplicate-issue audit noise, rollback considered
  separately). Defer.

**Alternatives considered and rejected:**
- **Store plaintext alongside hash.** Simpler, but any DB leak now
  leaks every live workshop code. User explicitly rejected this.
- **Reversible hash (e.g., encrypt codeHash with key).** The hash
  is already a one-way function; encrypting its output doesn't help
  because you still can't get the plaintext back. Conceptually
  confused.
- **Reveal via CLI-only, no admin UI button.** Keeps the admin
  surface simpler but makes the facilitator leave the admin to
  recover a code during a live workshop. UX regression.

## Constraints and Boundaries

- Trunk-based: commit to main, no feature branches.
- Every commit must keep tests green.
- No key in the repo, no key in `.env.example` (placeholder only —
  `HARNESS_EVENT_CODE_REVEAL_KEY=<base64-32-bytes>`).
- Migration is additive (nullable column) — no down-migration
  needed.
- The Neon-mode production path requires the key set; failing fast
  at module load is preferred over silent "reveal always returns
  failure."
- Audit-log every reveal, success AND failure. Separate from the
  existing `participant_event_access_issued` / `_redeemed` events.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| Node's built-in `crypto.createCipheriv("aes-256-gcm", ...)` is available on the Vercel Node runtime | Verified | Standard Node API; already used elsewhere (`createHash`, `createHmac`) |
| `HARNESS_EVENT_CODE_REVEAL_KEY` can be plumbed into Vercel + Neon-mode production via existing env-var flow | Verified | Same pattern as `HARNESS_EVENT_CODE_SECRET` and `NEON_*` vars |
| Existing `requireFacilitatorActionAccess(instanceId)` is sufficient auth for reveal | Verified | Already used on `issueParticipantAccessAction` in the same file |
| Audit log (`getAuditLogRepository().append`) tolerates new action names without schema change | Verified | `action: string` in `AuditLogRecord` is free-form |
| File-mode JSON repository tolerates a new optional field without migration | Verified | `sampleCode?: string \| null` demonstrates the pattern |
| Neon SQL column addition can land without downtime | Verified (usual) | Nullable column addition is Postgres-safe online |
| Client component's `useTransition` + server action is the right primitive for the reveal round-trip | Verified | Used elsewhere in `_components/sections/*` client files |
| 30-second auto-hide is adequate (not too short, not too long) | Unverified — product call | No hard evidence; reasonable default, can tune after shipping |

The only Unverified item is UX taste (auto-hide duration). Not a
risk worth a blocking task — ship, observe, tune.

## Risk Analysis

| Risk | Severity | Mitigation |
|---|---|---|
| Key lost / rotated without migration → existing ciphertexts become undecryptable | Medium | Document explicitly: "Losing `HARNESS_EVENT_CODE_REVEAL_KEY` means losing reveal for codes issued under it. Rotate codes alongside keys." Surface via `canRevealCurrent = false` + a distinct UI hint: "key rotated, rotate code to reveal." |
| Dev forgets to set the key in local `.env.local` → reveal silently broken in dev | Low | Surface clear console warning on module load; `isEventCodeRevealConfigured()` returns `false` and chip shows "reveal key not configured" instead of a confusing error. |
| Audit log noise: if facilitator spam-clicks reveal, the audit table grows | Low | Rate-limit client-side (disable button during transition, debounce). Server-side also protected by existing auth cost. |
| View-source or screenshot captures revealed plaintext | Low | Revealed plaintext is only in client state while visible. Auto-hide after 30 s. Copy-button writes to clipboard but doesn't put it in a `data-*` attribute. |
| Tampered `code_ciphertext` in DB → auth tag fails → reveal returns null | Low | AES-GCM's auth tag catches tampering; decrypt returns null, audit logs `result: "failure"`. No silent plaintext substitution possible. |
| Migration rollback complexity if we need to revert | Low | Additive nullable column; revert is `ALTER TABLE ... DROP COLUMN code_ciphertext;` — safe. Code changes revert cleanly since `codeCiphertext` is optional everywhere. |
| Test suite needs real crypto key → CI coverage for issue+reveal path | Low | Tests supply their own 32-byte key via env fixture; no prod secret involvement. |

## Implementation Tasks

Dependency-ordered. Each task is a commit candidate (some group
naturally).

### Stage 1 — Crypto foundation

- [x] **1.1** Create `dashboard/lib/event-code-reveal-crypto.ts`
  with `encryptEventCodeForReveal`, `decryptEventCodeForReveal`,
  `isEventCodeRevealConfigured`. Key parsing supports base64url and
  rejects malformed lengths. `v1:` prefix on payloads.
- [x] **1.2** Add test file
  `dashboard/lib/event-code-reveal-crypto.test.ts` covering: encrypt
  → decrypt round-trip, wrong key → null, tampered ciphertext →
  null, missing key → `isConfigured` false and encrypt throws, `v1:`
  prefix present.

### Stage 2 — Data model plumbing

- [x] **2.1** Add `codeCiphertext?: string \| null` to
  `ParticipantEventAccessRecord` in `runtime-contracts.ts`.
- [x] **2.2** Create migration
  `dashboard/db/migrations/2026-04-23-event-code-reveal-ciphertext.sql`
  adding the `code_ciphertext TEXT` column (nullable).
- [x] **2.3** Update `NeonParticipantEventAccessRepository` to
  SELECT and UPSERT `code_ciphertext` in `getActiveAccess`,
  `listAllActiveAccess`, `saveAccess`, and `ensureSeedAccess`.
- [x] **2.4** Update `FileParticipantEventAccessRepository` — no
  structural change needed; JSON serialisation already passes
  through optional fields. Add a focused test that a saved record
  round-trips `codeCiphertext`.

### Stage 3 — Issue-flow encryption

- [x] **3.1** Update `issueParticipantEventAccess` in
  `participant-access-management.ts` to compute `codeCiphertext`
  when `isEventCodeRevealConfigured()` returns true.
- [x] **3.2** Update the file-mode seed path
  (`buildSeedAccess`) to encrypt the seed plaintext.
- [x] **3.3** Update the Neon seed path (`ensureSeedAccess`)
  similarly.
- [x] **3.4** Extend `getFacilitatorParticipantAccessState` with a
  new derived flag — `canRevealCurrent` becomes true when
  `codeCiphertext` is present and decrypt-able. Keep the existing
  sample/bootstrap paths intact for dev.
- [x] **3.5** Test: issue flow writes non-null ciphertext when key
  configured; writes null when not configured; decrypt of the
  stored ciphertext recovers the plaintext.

### Stage 4 — Reveal action + audit

- [x] **4.1** Create
  `dashboard/app/admin/instances/[id]/_actions/access.ts`
  addition: `revealParticipantEventCodeAction(formData)` server
  action. Auth via `requireFacilitatorActionAccess`; audit via
  `getAuditLogRepository().append({ action:
  "participant_event_access_revealed", result, metadata: { actorNeonUserId,
  version, codeId } })`; returns `{ ok: true, plaintext }` or
  `{ ok: false, reason }`.
- [x] **4.2** Tests: action audits on success; action audits
  `failure` when decrypt fails; action rejects without facilitator
  auth.

### Stage 5 — UI

- [x] **5.1** Add copy to `ui-language.ts` (CS + EN):
  `participantAccessHiddenValue`, `participantAccessRevealButton`,
  `participantAccessHideButton`, `participantAccessCopyButton`,
  `participantAccessRevealError`, `participantAccessKeyNotConfigured`.
- [x] **5.2** Replace the current "unavailable" branch in
  `RunAccessStrip` with a new client component
  `RunAccessRevealChip` (`"use client"`). State machine: hidden →
  revealing → revealed → hidden. Auto-hide after 30 s. Copy button
  uses `navigator.clipboard.writeText`.
- [x] **5.3** Keep the `issue new event code` button shape; the
  flash-cookie path for newly-issued plaintext continues unchanged.

### Stage 6 — Docs, env, ship

- [x] **6.1** Document `HARNESS_EVENT_CODE_REVEAL_KEY` in
  `docs/ENVIRONMENT.md` (or equivalent) — purpose, format
  (base64url, 32 bytes), generation command
  (`openssl rand -base64 32 | tr '+/' '-_' | tr -d '='`), rotation
  policy, impact of loss.
- [x] **6.2** Add `HARNESS_EVENT_CODE_REVEAL_KEY=` placeholder to
  `.env.example` with a comment pointing at the docs.
- [x] **6.3** Typecheck clean; all tests pass; CI green.
- [ ] **6.4** Generate a 32-byte key locally, add to Vercel env
  (Preview + Production). *(manual — requires Vercel dashboard access)*
- [ ] **6.5** Ship: commit to main, push, verify Vercel deploy
  promotes. *(push performed here; deploy verification is manual)*
- [ ] **6.6** Manual smoke on the live admin: issue a fresh code
  on a throwaway instance, click reveal, verify plaintext matches
  what the flash cookie showed during issuance. Check audit table
  has the reveal row. *(manual post-deploy smoke test)*

## Acceptance Criteria

- Typecheck: zero errors.
- Tests: all existing pass; new tests for crypto, issue flow,
  reveal action.
- `npm run verify:content` + `npm run verify:workshop-bundle` still
  pass.
- CI on main reaches `deploy-ready = success`.
- On live admin after deploy:
  - A freshly-issued code shows `••••••` in the chip with "reveal"
    button.
  - Clicking reveal returns the plaintext that matches the
    one-shot flash from issuance.
  - An audit row exists with `action:
    "participant_event_access_revealed"`, `actorKind:
    "facilitator"`, and metadata `{ version, codeId, actorNeonUserId }`.
  - Legacy codes (issued before the column existed) show a clear
    "rotate to enable reveal" affordance, not a broken state.
- Production is set up with `HARNESS_EVENT_CODE_REVEAL_KEY`; Preview
  env uses a distinct key; dev fallback stays non-fatal without it.
- No plaintext appears in the server-rendered HTML (curl the admin
  page, grep for the code value — should be absent).

## References

- Prior hash migration: `1e1f865 feat: hmac-hash event codes with
  legacy sha256 migration`
- Existing server action pattern:
  `dashboard/app/admin/instances/[id]/_actions/access.ts:issueParticipantAccessAction`
- Existing auth helper: `dashboard/lib/facilitator-access.ts:requireFacilitatorActionAccess`
- Audit log shape: `dashboard/lib/runtime-contracts.ts:AuditLogRecord`
- HMAC key pattern (mirror for encryption key): `dashboard/lib/participant-event-access-repository.ts:resolveEventCodeKey`
- Flash-cookie on-issue pattern:
  `dashboard/app/admin/instances/[id]/_lib/participant-access-flash.ts`
- Trigger conversation (brainstorm-equivalent): in-session transcript 2026-04-23 — user rejected plaintext-alongside-hash, approved AES-GCM approach explicitly.
