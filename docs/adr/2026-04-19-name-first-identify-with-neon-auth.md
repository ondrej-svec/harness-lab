# ADR 2026-04-19: Name-first participant identify with Neon Auth

## Status

Accepted

## Context

The original workshop event-access model (`2026-04-06-workshop-event-access-model.md`) treated every participant session as anonymous. That worked for walk-in workshops but produced two failure modes once we added a pre-pasted roster:

1. Two "Jan"s on the roster silently merged because identify never disambiguated — a real data-integrity bug visible in the participant list.
2. Re-login (cookie cleared, new device, closed tab) meant re-walking-in as a fresh identity. If the roster carried any meaning at all (assignments, follow-ups, history) it was lost the second time the participant arrived.

The 2026-04-16 brainstorm (Q5) resolved that participant identity should survive a browser close *when* the facilitator has pre-loaded a roster. That requires real account credentials — not just a cookie.

## Decision

Adopt a **name-first identify flow backed by Neon Auth participant accounts**:

1. **Event code stays the room key.** The room is the first gate. Without the event code, no identify surface renders, no participant account can be minted.
2. **Name-first picker.** Participant types their name, the suggest endpoint returns up to 5 prefix matches scoped to the session's instance, response shape `{ id, displayName, hasPassword, disambiguator? }` — nothing more. No raw email, no roster preview, no count.
3. **Real Neon Auth accounts** with `role = "participant"`. The privilege boundary (`hasFacilitatorPlatformAccess` checks `role === "admin"`) keeps participants out of facilitator surfaces by schema-level discriminator.
4. **Account creation flows entirely through `NEON_API_KEY`** at the Neon control-plane (`POST /projects/{id}/branches/{id}/auth/users`). Public signup at the Neon Auth instance is *permanently disabled*. No SDK-driven signup, no service-admin user, no email delivery dependency.
5. **First password set via the reset-token bypass.** Server inserts a `reset-password:<random>` row into `neon_auth.verification`, then calls the standard `/auth/reset-password` endpoint with that token plus the participant's chosen password. Email never enters the loop.
6. **Walk-in policy is per-instance.** `workshop_instance.allow_walk_ins` (default `true`) controls whether unknown names get an "+ add as new" path or a polite "ask your facilitator to add you" refusal.
7. **Returning identify** = pick name → enter password → signin (raw fetch with explicit Origin against `/sign-in/email` because the Neon Auth SDK doesn't reliably forward Origin headers in server-side use).

## Consequences

**Positive:**

- Participant identity survives browser-close. Facilitator-pasted rosters retain meaning across sessions.
- One credential surface (`NEON_API_KEY`) — no service-admin user to provision, rotate, or compromise.
- Public signup stays closed forever. The blast radius of "internet users find the auth URL" is zero — there is no signup path.
- Email delivery is never on the happy path. Workshops with poor mail deliverability still work.
- Roster paste path and walk-in path collapse to one wrapper call (`createParticipantAccount`).
- The Neon-canonical pattern: management API + `disableSignUp:true` is what Neon themselves recommend for multi-tenant SaaS with admin-managed users.

**Negative:**

- `NEON_API_KEY` is a heavy credential — it grants project-wide access (databases, branches, auth). Tight Vercel-secret discipline required; never committed; periodic rotation. Mitigation: scope tightly, log nothing, rotate.
- We reach into one private better-auth surface — the `neon_auth.verification` table — to mint reset-password tokens server-side. The token format (`reset-password:<random>`) is documented across better-auth issues and stable across the 1.x line. If the format changes, the integration test (Phase 5.6 Layer 3 happy-path) breaks loudly. Acceptable risk; the alternative was email infrastructure.
- The schema enforces `UNIQUE (instance_id, lower(display_name))` so the disambiguator code in `lib/participant-disambiguator.ts` covers a case the schema currently prevents from existing. Kept as defensive code in case the constraint relaxes; documented in the seeder header.
- Two Neon Auth roles in one project's auth store. The privilege boundary holds via `hasFacilitatorPlatformAccess` (Phase 5.5 hardened the role check to run before grant lookup, not after) but operators must keep that guard in mind on every new admin surface.

## Rejected alternatives

**Enable `signUp.email` at the Neon Auth instance, gate at our server.** Rejected because Neon Auth has no `before`-hook surface for instance-level instances. Public signup would expose the URL even if our server never calls it. Orphan-account risk + auditability harder. Permanent `disableSignUp:true` is cleaner.

**Service-admin Neon Auth user, sign in server-side, call `admin.createUser`.** Rejected because:
- Adds a second privileged credential to manage.
- Cookie isolation between the service admin's session and the participant's response is fragile.
- Solved nothing the control-plane API didn't solve more cleanly.

**Magic links / OTP for first-login proof.** Rejected because workshop reality: participants are in the room, email deliverability is variable, and the event code already proves "you're allowed to be here." A second per-participant code or email link adds friction without strengthening the threat model.

**Better-auth organizations plugin for multi-tenancy.** Rejected because `workshop_instance` is already the tenant. Adopting orgs would double the source of truth and add four tables we don't need.

## Cross-references

- Phase 5.0 spike (revised): `docs/brainstorms/2026-04-20-neon-auth-participant-role-spike.md`
- Plan: `docs/plans/2026-04-19-feat-participant-auth-hardening-and-identify-plan.md`
- Privilege boundary regression: `dashboard/lib/privilege-boundary.test.ts`
- Implementation: `dashboard/lib/auth/admin-create-user.ts`, `dashboard/lib/auth/server-set-password.ts`, `dashboard/lib/participant-auth.ts`
- ADR `2026-04-06-private-workshop-instance-auth-boundary.md` — extended by this ADR to note `neon_auth."user".role` is the privilege discriminator.
