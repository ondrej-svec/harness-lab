# Participant Data Privacy

Scope: personal data handled by harness-lab's participant layer. Effective from the landing of the participant-management feature (plan: `docs/plans/2026-04-16-feat-participant-management-and-team-formation-plan.md`).

## Principles

1. **Collect only what the event requires.** Display name always; email only if the participant opts in.
2. **Store only as long as the event runs.** All participant data is deleted when the workshop instance is archived.
3. **Never leak into public surfaces.** Fixtures use fictional names. Logs never contain participant identifiers. Public repo never contains real data.
4. **Consent is explicit and separable.** The "OK to email me" checkbox is distinct from joining the event. Saying no to email does not block participation.
5. **The facilitator is the controller.** Harness-lab is a self-hosted tool; the facilitator running the instance is responsible for participant communication and deletion on request.

## Data collected

| Field | Required | When collected | Purpose |
|---|---|---|---|
| `display_name` | Yes | On first redeem (walk-in) or paste-list import (pre-loaded) | Facilitator roster ops, team assignment display, team rotation UX |
| `email` | No (opt-in) | Facilitator enters it with an explicit consent checkbox, or participant self-adds | Post-event retention follow-up (14 / 30 day) |
| `tag` | No | Facilitator enters free-text | Input to cross-level randomize algorithm (e.g. `senior`, `junior`, `mid`) |
| `email_opt_in` | Yes (default false) | Set true only when consent checkbox is ticked | Gates every email-related operation |
| `archived_at` | Auto | On soft-delete | Excludes from active views |

Session data (existing `participant_sessions` table) remains anonymous. A `participant_id` foreign key is added but is NULLABLE; it is a soft binding, not an auth credential.

## Retention

- **Active instance:** participant rows live as long as the workshop instance has `status != archived`.
- **Instance archive:** when the facilitator runs `workshop archive <instanceId>`, all `participants`, `team_members`, and `participant_feedback` rows for that instance are deleted (CASCADE). Fixtures and exports generated before archive remain on the facilitator's local machine; harness-lab does not manage those.
- **On participant request:** during the event, a participant may ask the facilitator to delete their entry. The facilitator uses the admin UI or `DELETE /api/admin/participants/:id`. Soft-delete sets `archived_at` and unassigns from teams; hard-delete is immediate in file-mode and happens on instance archive for Neon.
- **Email opt-outs:** participant can email the facilitator to revoke opt-in. Facilitator flips `email_opt_in` to false via the admin UI. No further emails are sent.

## Storage

- **Neon (primary):** `participants`, `team_members`, `participant_feedback` tables. Scoped per `instance_id` with `ON DELETE CASCADE`.
- **File-mode (fallback):** JSON files under `HARNESS_DATA_DIR/<instanceId>/participants.json` and `team-members.json`. Plain text, not encrypted at rest — file-mode is intended for dev and isolated single-operator events only.
- **Never stored:**
  - In application logs (display names stripped or redacted from any structured log entry)
  - In the public repo (fixtures use clearly-fictional names: `Testovací Účastník 1`, `Sample Participant 1`)
  - In alert payloads, rate-limit records, or telemetry beyond the per-instance database
  - In git history of the public repo (pre-commit guard + `.gitignore` cover `.env*` and data directories)

## Participant rights

During an event, a participant may:

- Request their `display_name` be corrected (facilitator edits via admin UI)
- Request deletion of their entry (soft-delete during event; hard-delete on archive)
- Revoke email opt-in at any time (no further emails sent, email row is nulled)
- Decline to provide a display name at all and remain on the anonymous session path (they join without joining the named pool; no team assignment possible, but the participant surface still works)

Participants do not have a self-serve account page. All rights above are exercised by asking the facilitator, because harness-lab does not maintain per-person credentials or login.

### GDPR Art. 17 & 20 endpoints (facilitator-invoked)

For participants in GDPR jurisdictions (or any participant who requests equivalent treatment), two facilitator-gated endpoints make the rights concrete:

- `GET /api/admin/participants/{id}/export?instanceId={instanceId}` — right to portability (Art. 20). Returns a JSON dump of every row linked to the participant across the tables in the cascade list below, plus audit-log entries that reference them in metadata. `Content-Disposition: attachment; filename=participant-<id>-<instanceId>.json`. Audit-logged with `action: "participant.export"`.
- `DELETE /api/admin/participants/{id}` with body `{instanceId, confirm: true, confirmDisplayName: "<current displayName>"}` — right to erasure (Art. 17). Hard-deletes every row across the cascade tables and removes (or PII-strips) the Neon Auth user. `confirmDisplayName` must match the current `participants.display_name` to guard against mistyped IDs. Audit-logged with `action: "participant.gdpr_delete"` including a pre-delete snapshot of the participant row.

The default `DELETE /api/admin/participants/{id}` (no `confirm` in body) remains the reversible soft-archive path; hard-delete is opt-in.

### Cascade contract

The cascade tables list MUST be kept in sync with every column whose FK targets `participants.id`. Changes to the schema that add a new `participant_id` FK require updating `dashboard/lib/participant-data-deletion.ts` in the same slice.

Current cascade (as of 2026-04-22):

- `team_members`
- `participant_sessions`
- `team_composition_history`
- `participant_feedback`
- `participant_poll_responses`
- `checkpoints`
- `workshop_feedback_submissions`
- `participants` (the target row itself)

Plus the Neon Auth user (via control-plane `DELETE`, falling back to PII strip on unsupported). The export walks the same table list.

### Retention

Participant-authored content has a 90-day wall-clock retention floor on top of per-instance archival:

- `participant_feedback` rows older than 90 days are deleted by `applyRuntimeRetentionPolicy`
- `workshop_feedback_submissions` older than 90 days are deleted by the same sweep

This is a backstop for long-running test instances — typical workshop rows get cleaned up when the facilitator archives the instance.

## Facilitator responsibilities

The facilitator running an instance is the data controller. They agree to:

1. Communicate the scope of data collection to participants before the event starts (suggested copy lives in `workshop-content/participant-consent-blurb.md`, shipped in Phase 5 of the plan).
2. Honor deletion and opt-out requests within the event window.
3. Not export participant data outside the event's purpose. The CSV email export (`POST /api/admin/participants/export-emails`) is intended for sending the 14-day and 30-day follow-ups and nothing else.
4. Archive the instance after the event so the data is removed from the runtime.
5. Not add pre-loaded participants who have not consented to attend. Pasting a roster implies the facilitator has attendee consent to include them.

## Public-private taxonomy alignment

Classification per `docs/private-workshop-instance-data-classification.md`:

- `display_name`, `email`, `tag`, `email_opt_in` → **participant-private**. Visible only after event-code redemption to the facilitator-gated admin UI and to the participant themselves.
- `participant_feedback` responses → **participant-private**. Visible to the facilitator of the owning instance only.
- Fixtures in `dashboard/data/sample-studio-a/` → **public**, because they contain fictional data only.

Any changes to this classification require an ADR.

## Incident handling

If a privacy incident occurs (accidental commit of real data, log leak, export mishap):

1. Stop the event or event-adjacent data flow immediately.
2. Assess scope — which rows, which instance, which downstream copies.
3. Rotate any related secrets (event code, session tokens for affected instance).
4. Purge affected rows and notify affected participants via the facilitator.
5. Capture the incident in `capture/notes/` with date, scope, fix, and one-line preventive rule.

## Out of scope

Not covered by this document:

- GDPR / CCPA formal data-processing agreements (harness-lab is a tool, not a SaaS; the facilitator's employing organization handles legal paperwork when relevant)
- Cross-border data transfer rules (applicability depends on where the facilitator hosts their Neon instance)
- Long-term analytics across cohorts (explicit non-goal in plan; no cross-instance participant identity)
- Right-to-portability (no export-to-me flow for participants; facilitator can provide a copy on request)

## References

- `docs/adr/2026-04-06-workshop-event-access-model.md`
- `docs/adr/2026-04-06-private-workshop-instance-auth-boundary.md`
- `docs/private-workshop-instance-data-classification.md`
- `docs/public-private-taxonomy.md`
- `docs/plans/2026-04-16-feat-participant-management-and-team-formation-plan.md`
