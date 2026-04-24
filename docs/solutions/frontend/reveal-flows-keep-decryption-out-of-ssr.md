---
title: "Reveal-on-click flows: keep decryption out of SSR state"
type: solution
date: 2026-04-23
domain: frontend
component: admin server components + reveal server actions
symptoms:
  - "The natural refactor embeds plaintext in the server-rendered HTML on every admin page load"
  - "Audit log fires on page load, not on user click, so the intent of 'reveal = audited event' is lost"
  - "Over-the-shoulder or screenshot capture leaks the plaintext even when the user never clicked reveal"
  - "Unit tests that assert `currentCode === issuedCode` pass while the production UX leaks the plaintext"
root_cause: "When 'facilitator can reveal a secret on click' is added to a page that already has a server-side state object, the path of least resistance is to decrypt inside the state resolver (e.g. `getFacilitatorParticipantAccessState`). That path runs in an RSC/server component during rendering, so the plaintext ends up in the SSR payload — which is exactly the threat model the reveal pattern is supposed to defeat. The audit log then fires on render, not on click, which collapses the audit signal."
severity: high
related:
  - "../../plans/2026-04-23-feat-facilitator-event-code-reveal-plan.md"
  - "../infrastructure/vercel-env-add-preview-and-fluid-compute-env-propagation.md"
---

# Reveal-on-click flows: keep decryption out of SSR state

## Symptoms

Implementing the facilitator-reveal-event-code feature, an earlier draft of
`getFacilitatorParticipantAccessState` did something like this:

```ts
// WRONG — decryption in the SSR-state path
const recoverable = resolveRecoverableCurrentCode(
  access.codeHash,
  access.sampleCode,
  access.codeCiphertext, // <— naturally added when the column arrived
);

return {
  // ...
  currentCode: recoverable.currentCode, // ends up in the SSR payload
  canRevealCurrent: Boolean(recoverable.currentCode),
};
```

Tests pass (`state.currentCode === issued.issuedCode`), typecheck clean, product
request met — but the plaintext is now in the HTML document every admin load.
`curl /admin/instances/<id> | grep <code>` would find it. The audit log entry
was attached to the server action, but the server action was now redundant —
the plaintext was already on the page before the user clicked anything.

## Root Cause

In an App-Router / RSC codebase, server-side state resolvers feel like "just a
server function," so decrypting inside them feels identical to decrypting inside
a server action. The crucial difference: **state resolvers run on every render;
server actions run on explicit user intent.** Whatever you put in state gets
serialized into the HTML payload; whatever you compute in an action only runs
on the wire in response to a button click.

Symptom that the refactor went wrong: the server action you wrote is never
actually needed, because the caller already has the value. If that happens,
the decrypt has leaked up into SSR.

## Solution

Split the two concerns cleanly:

- The state resolver computes a **boolean gate** only — "would a reveal succeed
  if requested" — based on whether the ciphertext exists and the key is
  configured. It never decrypts.
- A dedicated server action decrypts on demand, authorises the caller, writes
  the audit row, and returns the plaintext in JSON.
- The client component (`"use client"`) holds the plaintext in local component
  state, with an auto-hide timer. Never in a `data-*` attribute, hidden input,
  or anywhere the DOM would serialise it back into HTML.

```ts
// Server state — gate only, no plaintext
const canRevealViaCiphertext =
  Boolean(access.codeCiphertext) && isEventCodeRevealConfigured();

return {
  // ...
  currentCode: recoverable.currentCode, // kept null for production-issued codes
  canRevealCurrent: Boolean(recoverable.currentCode) || canRevealViaCiphertext,
};
```

```ts
// Server action — auth, decrypt, audit, return
export async function revealParticipantEventCodeAction(instanceId: string) {
  await requireFacilitatorActionAccess(instanceId);
  const access = await repo.getActiveAccess(instanceId);
  if (!access?.codeCiphertext) {
    await auditFailure("not-revealable");
    return { ok: false, reason: "not-revealable" };
  }
  const plaintext = decryptEventCodeForReveal(access.codeCiphertext);
  if (!plaintext) {
    await auditFailure("decrypt-failed");
    return { ok: false, reason: "decrypt-failed" };
  }
  await auditSuccess({ codeId: access.codeHash.slice(0, 12), version: access.version });
  return { ok: true, plaintext };
}
```

```tsx
// Client chip — plaintext lives only in component state
const [plaintext, setPlaintext] = useState<string | null>(null);
startTransition(async () => {
  const result = await revealParticipantEventCodeAction(instanceId);
  if (result.ok) setPlaintext(result.plaintext);
});
```

## Prevention

- [ ] **When adding a reveal-on-click affordance, `curl` the rendered admin page and grep for the secret value before declaring it shipped.** It's the only reliable proof the plaintext isn't in SSR.
- [ ] **If a server action is the right primitive but the client never calls it, something drifted.** Audit the state resolver — the value it should be requesting on click is probably already on the page.
- [ ] **Test the absence, not just the presence.** Alongside `canRevealCurrent === true`, assert `currentCode === null` for the ciphertext path. The "recovers the raw code via state" test in this repo was inverted early and still passed — it was testing the wrong thing.
- [ ] **Leave dev-only recoverable paths (sample/bootstrap) in place, but treat them as the exception.** The production path should never have a `currentCode` on the server.
- [ ] **Audit events happen per click, not per render.** If your audit volume suddenly spikes to match page-load volume, the decrypt has moved into render.

## Related

- Plan: `docs/plans/2026-04-23-feat-facilitator-event-code-reveal-plan.md` (Decision Rationale: "Why store plaintext server-action response, not SSR?")
- Participant-access management: `dashboard/lib/participant-access-management.ts:resolveRecoverableCurrentCode`
- Reveal action: `dashboard/app/admin/instances/[id]/_actions/access.ts:revealParticipantEventCodeAction`
- Client chip: `dashboard/app/admin/instances/[id]/_components/run-access-reveal-chip.tsx`
