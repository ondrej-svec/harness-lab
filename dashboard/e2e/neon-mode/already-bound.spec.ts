/**
 * Spec (i) from Phase 5.6 Layer 3:
 *   already_bound API surface — once a session is bound to one
 *   participant, attempting to bind a different identity is rejected
 *   early (Phase 6) with no side effects. UI handling of the
 *   already_bound view is covered by participant-identify-flow.test.tsx.
 */

import { neon } from "@neondatabase/serverless";
import { expect, INSTANCE_ID, redeemEventCode, test, uniqueTestEmail } from "./fixtures";

test("a bound session can't re-bind to a different participantId — set-password returns 409", async ({ page }) => {
  const email = uniqueTestEmail();
  const password = "longenoughpassword";

  // First-time identify as Jana so the event-code session gets bound.
  await redeemEventCode(page);
  await page.getByRole("combobox", { name: /your name/i }).fill("Jana");
  await page.getByRole("option", { name: /Jana Nováková/i }).click();
  await page.getByPlaceholder(/your email/i).fill(email);
  await page.getByPlaceholder("password").fill(password);
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByText(/welcome, Jana/i)).toBeHidden({ timeout: 10_000 });

  // Reach for a different participant id on the same instance to
  // submit alongside the bound session's cookie.
  const sql = neon(process.env.HARNESS_DATABASE_URL!);
  const rows = (await sql.query(
    `SELECT id FROM participants WHERE instance_id = $1 AND display_name = 'Tomáš Dvořák' LIMIT 1`,
    [INSTANCE_ID],
  )) as Array<{ id: string }>;
  expect(rows).toHaveLength(1);
  const otherParticipantId = rows[0].id;
  const otherEmail = uniqueTestEmail("other");

  // Drive the request through the page's fetch so the bound session
  // cookie is included automatically.
  const response = await page.evaluate(
    async (input) => {
      const r = await fetch("/api/event-access/identify/set-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await r.json().catch(() => ({}));
      return { status: r.status, body };
    },
    { participantId: otherParticipantId, email: otherEmail, password: "longenoughdifferent" },
  );

  expect(response.status).toBe(409);
  expect(response.body).toMatchObject({ ok: false, error: "already_bound" });

  // Defensive: no Neon Auth user was minted for the rejected attempt.
  const probe = (await sql.query(
    `SELECT id FROM neon_auth."user" WHERE email = $1`,
    [otherEmail],
  )) as Array<{ id: string }>;
  expect(probe).toHaveLength(0);
});
