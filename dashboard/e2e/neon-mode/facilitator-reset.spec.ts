/**
 * Spec (g) from Phase 5.6 Layer 3 — was deferred when the SDK Origin
 * issue blocked it. The neon-auth-proxy refactor (sibling commit)
 * unblocks the facilitator path: every server-side admin op now goes
 * through raw fetch with explicit Origin, so the facilitator's
 * cookie-bound session validates correctly.
 *
 * Flow:
 *   1. Establish a participant account via the standard identify flow.
 *   2. Provision a test facilitator + admin role + instance grant in
 *      a separate browser context, sign in via /admin/sign-in.
 *   3. Hit /api/admin/participants/[id]/reset-password from the
 *      facilitator context (Cookie header attached explicitly to
 *      bypass the browser refusal-to-send-Secure-on-HTTP rule).
 *   4. Sign back in as the participant with the temp password and
 *      verify they reach the room.
 */

import { neon } from "@neondatabase/serverless";
import {
  expect,
  INSTANCE_ID,
  redeemEventCode,
  signInAsTestFacilitator,
  signOutParticipant,
  test,
  uniqueTestEmail,
} from "./fixtures";

test("facilitator-issued reset rotates the password and the participant signs in with it", async ({
  page,
  browser,
}) => {
  const email = uniqueTestEmail();
  const initialPassword = "longenoughinitial";

  // Establish the participant account.
  await redeemEventCode(page);
  await page.getByRole("combobox", { name: /your name/i }).fill("Jana");
  await page.getByRole("option", { name: /Jana Nováková/i }).click();
  await page.getByPlaceholder(/your email/i).fill(email);
  await page.getByPlaceholder("password").fill(initialPassword);
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByText(/welcome, Jana/i)).toBeHidden({ timeout: 10_000 });

  const sql = neon(process.env.HARNESS_DATABASE_URL!);
  const participantRows = (await sql.query(
    `SELECT id FROM participants WHERE instance_id = $1 AND display_name = 'Jana Nováková' LIMIT 1`,
    [INSTANCE_ID],
  )) as Array<{ id: string }>;
  expect(participantRows).toHaveLength(1);
  const participantId = participantRows[0].id;

  const facilitatorCtx = await browser.newContext({ baseURL: "http://127.0.0.1:3200" });
  await signInAsTestFacilitator(facilitatorCtx);
  const cookies = await facilitatorCtx.cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  const resetResp = await facilitatorCtx.request.post(
    `/api/admin/participants/${encodeURIComponent(participantId)}/reset-password`,
    {
      headers: {
        "content-type": "application/json",
        origin: "http://127.0.0.1:3200",
        cookie: cookieHeader,
      },
      data: { instanceId: INSTANCE_ID },
    },
  );
  expect(resetResp.status()).toBe(200);
  const resetBody = (await resetResp.json()) as { ok: boolean; temporaryPassword: string };
  expect(resetBody.ok).toBe(true);
  expect(resetBody.temporaryPassword).toMatch(/^[a-z]+\d+-[a-z]+\d+-[a-z]+\d+$/);

  await facilitatorCtx.close();

  // Participant signs back in with the temp password.
  await signOutParticipant(page);
  await redeemEventCode(page);
  await page.getByRole("combobox", { name: /your name/i }).fill("Jana");
  await page.getByRole("option", { name: /Jana Nováková/i }).click();
  await expect(page.getByText(/welcome back, Jana/i)).toBeVisible();
  await page.getByPlaceholder("password").fill(resetBody.temporaryPassword);
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByText(/welcome back, Jana/i)).toBeHidden({ timeout: 10_000 });
});
