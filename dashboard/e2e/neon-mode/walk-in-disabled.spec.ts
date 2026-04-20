/**
 * Spec (f) from Phase 5.6 Layer 3:
 *   walk-in disabled → unknown name → polite refusal, no participant
 *   row created, no Neon Auth account created.
 *
 * Toggles allow_walk_ins=false on the test instance via the existing
 * admin endpoint (hit directly with the NEON_API_KEY-derived facilitator
 * isn't available in Layer 3, so we update the database directly).
 */

import { neon } from "@neondatabase/serverless";
import { expect, INSTANCE_ID, redeemEventCode, test } from "./fixtures";

function getDatabaseUrl(): string {
  const url = process.env.HARNESS_DATABASE_URL;
  if (!url) throw new Error("HARNESS_DATABASE_URL must be set for the Neon-mode suite");
  return url;
}

// Note: the `page` fixture re-seeds the instance, which restores
// allow_walk_ins=true. So we toggle inside the test body, AFTER the
// fixture has run, instead of via test.beforeEach (which would race).

test("walk-in disabled: unknown name yields the refusal state, no row is created", async ({ page }) => {
  const sql = neon(getDatabaseUrl());
  await sql.query(
    `UPDATE workshop_instances SET allow_walk_ins = false WHERE id = $1`,
    [INSTANCE_ID],
  );

  await redeemEventCode(page);

  const walkInName = `Stranger ${Date.now().toString().slice(-6)}`;
  await page.getByRole("combobox", { name: /your name/i }).fill(walkInName);

  // No "+ add as new" sentinel because allow_walk_ins=false. Submitting
  // routes to the walk_in_refused view.
  const sentinel = page.getByText(new RegExp(`add "${walkInName}" as a new participant`, "i"));
  await expect(sentinel).toHaveCount(0);

  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByText(/not on the roster/i)).toBeVisible();
  await expect(page.getByText(/ask your facilitator to add you/i)).toBeVisible();

  // No participant row was created for this stranger.
  const rows = (await sql.query(
    `SELECT id FROM participants WHERE instance_id = $1 AND display_name = $2`,
    [INSTANCE_ID, walkInName],
  )) as Array<{ id: string }>;
  expect(rows).toHaveLength(0);
});
