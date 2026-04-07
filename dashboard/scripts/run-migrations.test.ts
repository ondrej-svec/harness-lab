import { describe, expect, it } from "vitest";

import { detectPreviouslyAppliedMigrations, sortMigrationFilenames } from "./run-migrations.mjs";

describe("run-migrations", () => {
  it("applies the base runtime schema before dependent cleanup migrations", () => {
    const ordered = sortMigrationFilenames([
      "2026-04-06-drop-facilitator-identities.sql",
      "2026-04-07-instance-lifecycle-and-agenda-authoring.sql",
      "2026-04-06-private-workshop-instance-runtime.sql",
      "2026-04-07-facilitator-cli-device-auth.sql",
      "2026-04-06-facilitator-identity-simplification.sql",
    ]);

    expect(ordered).toEqual([
      "2026-04-06-private-workshop-instance-runtime.sql",
      "2026-04-06-facilitator-identity-simplification.sql",
      "2026-04-06-drop-facilitator-identities.sql",
      "2026-04-07-facilitator-cli-device-auth.sql",
      "2026-04-07-instance-lifecycle-and-agenda-authoring.sql",
    ]);
  });

  it("keeps unknown migrations after the pinned runtime sequence", () => {
    const ordered = sortMigrationFilenames([
      "2026-04-08-follow-up.sql",
      "2026-04-06-private-workshop-instance-runtime.sql",
      "2026-04-09-another-follow-up.sql",
    ]);

    expect(ordered).toEqual([
      "2026-04-06-private-workshop-instance-runtime.sql",
      "2026-04-08-follow-up.sql",
      "2026-04-09-another-follow-up.sql",
    ]);
  });

  it("bootstraps an already-migrated schema without replaying legacy files", () => {
    const snapshot = {
      tables: new Set([
        "workshop_instances",
        "instance_grants",
        "participant_sessions",
        "facilitator_device_auth",
        "facilitator_cli_sessions",
      ]),
      columns: new Map([
        [
          "instance_grants",
          new Set(["id", "instance_id", "neon_user_id", "role", "granted_at", "revoked_at"]),
        ],
        [
          "workshop_instances",
          new Set([
            "id",
            "template_id",
            "workshop_meta",
            "workshop_state",
            "status",
            "created_at",
            "updated_at",
            "blueprint_id",
            "blueprint_version",
            "imported_at",
            "removed_at",
          ]),
        ],
      ]),
    };

    expect(detectPreviouslyAppliedMigrations(snapshot)).toEqual([
      "2026-04-06-private-workshop-instance-runtime.sql",
      "2026-04-06-facilitator-identity-simplification.sql",
      "2026-04-06-drop-facilitator-identities.sql",
      "2026-04-07-facilitator-cli-device-auth.sql",
      "2026-04-07-instance-lifecycle-and-agenda-authoring.sql",
    ]);
  });

  it("leaves pending migrations on a fresh schema snapshot", () => {
    expect(
      detectPreviouslyAppliedMigrations({
        tables: new Set(),
        columns: new Map(),
      }),
    ).toEqual([]);
  });
});
