import { describe, expect, it } from "vitest";

import { sortMigrationFilenames } from "./run-migrations.mjs";

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
});
