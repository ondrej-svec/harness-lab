# Private Workshop-Instance Schema and Lifecycle Design

This document defines the first production schema shape for running many real workshops from one shared Harness Lab deployment.

## Goals

- isolate every real event by `instance_id`
- support one shared deployment with many sequential workshop instances
- keep public template content in the repo and private event state in the runtime layer
- leave file-backed repositories as development adapters only
- support preparation, live operation, archive, and reset flows without mixing instance state

## Design Rules

- every private table must carry `instance_id` unless the record is a global facilitator identity or another explicitly global control-plane record
- repository interfaces must require instance scoping at the boundary rather than letting callers issue unscoped reads
- soft deletion is preferred for operational records that may be needed for incident review or archive export
- archival state must remain queryable without reactivating the instance

## Core Tables

### `workshop_instances`

Canonical record for each real event.

Suggested fields:

- `id`
- `template_id`
- `slug`
- `status` (`created`, `prepared`, `running`, `archived`)
- `display_name`
- `participant_title`
- `event_date`
- `timezone`
- `venue_name`
- `room_name`
- `participant_access_mode`
- `participant_code_hash`
- `participant_code_expires_at`
- `current_phase`
- `created_at`
- `updated_at`
- `prepared_at`
- `started_at`
- `archived_at`
- `reset_source_instance_id` nullable
- `allow_walk_ins` boolean, default `true` — facilitator-controlled toggle. When `true` (default), unknown names on the identify prompt surface a "+ add as new" path that creates a participant + Neon Auth account. When `false`, the same input renders a polite refusal with no participant row created. Added by migration `2026-04-20-participant-auth.sql`. See ADR `2026-04-19-name-first-identify-with-neon-auth.md`.

### `facilitator_identities`

Global facilitator operator records reused across events.

Suggested fields:

- `id`
- `email`
- `display_name`
- `status`
- `password_hash` or external identity subject reference
- `mfa_state`
- `last_login_at`
- `created_at`
- `updated_at`

### `instance_grants`

Per-instance authorization for facilitators.

Suggested fields:

- `id`
- `instance_id`
- `facilitator_identity_id`
- `role` (`owner`, `operator`, `observer`)
- `granted_by_facilitator_identity_id`
- `granted_at`
- `revoked_at`

### `participant_event_access`

Versioned record of participant event-code windows and redemption policy.

Suggested fields:

- `id`
- `instance_id`
- `version`
- `code_hash` — HMAC-SHA256 of the plaintext event code, keyed on `HARNESS_EVENT_CODE_SECRET`. Legacy rows written before the HMAC migration are plain SHA-256 and get upgraded to HMAC in place on the first successful redeem. `HARNESS_EVENT_CODE_SECRET` must be set (≥32 chars) in production and whenever `HARNESS_STORAGE_MODE=neon`.
- `issued_at`
- `expires_at`
- `revoked_at`
- `rotation_reason`

### `participant_sessions`

Short-lived participant sessions redeemed from event access.

Suggested fields:

- `id`
- `instance_id`
- `participant_event_access_id`
- `session_hash`
- `issued_at`
- `expires_at`
- `last_seen_at`
- `revoked_at`
- `issued_ip_hash`
- `issued_user_agent_hash`

### `teams`

Team records for one workshop instance.

Suggested fields:

- `id`
- `instance_id`
- `slug`
- `display_name`
- `repo_url`
- `table_label`
- `status`
- `created_at`
- `updated_at`

### `participants`

Per-instance roster of named participants. A row appears here when a facilitator pastes the roster (pre-entered) or when a walk-in adds themselves through the identify prompt.

Key fields:

- `id`
- `instance_id`
- `display_name`
- `email` nullable — collected at first identify, used as the Neon Auth identifier
- `email_opt_in` boolean — facilitator-set, gates follow-up email delivery
- `tag` nullable — free-form roster tag (team / role / cohort)
- `neon_user_id` nullable — links to `neon_auth."user".id` once the participant sets a password. Unique when set. See ADR `2026-04-19-name-first-identify-with-neon-auth.md`.
- `created_at`, `updated_at`, `archived_at`

Unique constraint: `(instance_id, lower(display_name)) WHERE archived_at IS NULL`. Two active participants in the same instance cannot share a normalized display name.

### `team_members`

Active assignments of participants to teams within an instance.

Key fields: `id`, `instance_id`, `team_id`, `participant_id`, `created_at`. Soft-deletable via the team-composition history table, which logs every assign/unassign event.

### `team_assignments`

Links participants or facilitators to a team when that identity layer exists.

Suggested fields:

- `id`
- `instance_id`
- `team_id`
- `assignment_type`
- `external_subject`
- `display_name`
- `created_at`

### `workshop_state`

Current instance-level control-plane state.

Suggested fields:

- `instance_id`
- `agenda_phase`
- `continuation_window_revealed_at`
- `active_brief_key`
- `active_challenge_set_key`
- `announcements_json`
- `last_operator_identity_id`
- `updated_at`

### `checkpoints`

Structured team or instance checkpoint feed.

Suggested fields:

- `id`
- `instance_id`
- `team_id` nullable
- `checkpoint_type`
- `payload_json`
- `created_by_kind`
- `created_by_identity_id` nullable
- `created_at`

### `monitoring_snapshots`

Private monitoring and scan output for facilitators.

Suggested fields:

- `id`
- `instance_id`
- `team_id` nullable
- `snapshot_type`
- `summary`
- `payload_json`
- `captured_at`
- `captured_by`

### `instance_archives`

Archive metadata and export references.

Suggested fields:

- `id`
- `instance_id`
- `archive_status`
- `storage_uri`
- `created_at`
- `created_by_facilitator_identity_id`
- `retention_until`
- `notes`

### `audit_log`

Cross-cutting record for auth and privileged state changes.

Suggested fields:

- `id`
- `instance_id` nullable for global auth events
- `actor_kind`
- `actor_id`
- `action`
- `target_kind`
- `target_id`
- `result`
- `request_id`
- `metadata_json`
- `created_at`

## Lifecycle

### `created`

- instance record exists
- template binding is chosen
- no participant access is active yet
- facilitator grants may be assigned

### `prepared`

- participant event access is issued
- dashboard and skill entry paths are verified
- teams may be pre-created if needed
- the instance is confirmed clean and ready for a live event

### `running`

- participant sessions may be redeemed
- checkpoint and monitoring writes are active
- facilitator live-control mutations are allowed

### `archived`

- participant access is revoked
- facilitator mutations become read-only except archive metadata maintenance
- archived exports and post-event review remain available to authorized facilitators

## Reset Rules

- reset does not delete history from the archived instance
- a reset creates a new instance or clean successor state with a reference to `reset_source_instance_id`
- archived team, checkpoint, session, and monitoring records remain attached to the original instance

## Retention and Cleanup

- participant sessions should expire quickly and be purged on a scheduled retention window
- monitoring snapshots should keep only the minimum duration needed for facilitation review and incident follow-up
- archive records should define an explicit `retention_until` date rather than remaining forever by accident
- audit logs should follow a longer retention window than participant sessions because they support incident analysis

## Repository Interface Seams

The dashboard implementation should converge on explicit interfaces such as:

- `WorkshopInstanceRepository`
- `ParticipantAccessRepository`
- `ParticipantSessionRepository`
- `FacilitatorGrantRepository`
- `WorkshopStateRepository`
- `CheckpointRepository`
- `MonitoringSnapshotRepository`
- `ArchiveRepository`
- `AuditLogRepository`

Development adapters may remain file-backed. Production adapters must target the private runtime layer and enforce scoping at the repository boundary.

## Template Composition Rule

- public content continues to be addressed by stable keys such as `template_id`, brief keys, challenge-set keys, or agenda keys
- the private database stores only the keys and runtime choices needed to compose that public content with instance state
- duplicate copies of public markdown/content should not be stored in the private runtime database unless an explicit snapshot/export requirement needs them
