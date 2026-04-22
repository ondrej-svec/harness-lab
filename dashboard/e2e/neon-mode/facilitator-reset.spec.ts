/**
 * Facilitator-issued reset: one-time code flow (post-Brno hardening).
 *
 * The admin endpoint now returns a 3-word single-use code instead of a
 * plaintext password. The participant exchanges the code (via the new
 * /api/participant/redeem-reset-code endpoint) for a password they
 * choose themselves. The test covers the full round trip.
 *
 * Flow:
 *   1. Establish a participant account via the standard identify flow.
 *   2. Provision a test facilitator + admin role + instance grant in
 *      a separate browser context, sign in via /admin/sign-in.
 *   3. Hit /api/admin/participants/[id]/reset-password from the
 *      facilitator context (Cookie header attached explicitly to
 *      bypass the browser refusal-to-send-Secure-on-HTTP rule).
 *   4. Hit /api/participant/redeem-reset-code with the code and the
 *      participant's new chosen password.
 *   5. Sign back in as the participant with the new password and
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

test("facilitator-issued reset code lets the participant choose a new password", async ({
  page,
  browser,
}) => {
  const email = uniqueTestEmail();
  const initialPassword = "longenoughinitial";
  const chosenNewPassword = "new-chosen-passw0rd";

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

  // Facilitator issues a reset code.
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
  const resetBody = (await resetResp.json()) as { ok: boolean; resetCode: string };
  expect(resetBody.ok).toBe(true);
  expect(resetBody.resetCode).toMatch(/^[a-z]+\d+-[a-z]+\d+-[a-z]+\d+$/);

  await facilitatorCtx.close();

  // Participant redeems the code with their own chosen password.
  const redeemResp = await page.request.post("/api/participant/redeem-reset-code", {
    headers: {
      "content-type": "application/json",
      origin: "http://127.0.0.1:3200",
    },
    data: { code: resetBody.resetCode, newPassword: chosenNewPassword },
  });
  expect(redeemResp.status()).toBe(200);
  const redeemBody = (await redeemResp.json()) as { ok: boolean; participantId: string };
  expect(redeemBody.ok).toBe(true);
  expect(redeemBody.participantId).toBe(participantId);

  // Participant signs back in with the new password.
  await signOutParticipant(page);
  await redeemEventCode(page);
  await page.getByRole("combobox", { name: /your name/i }).fill("Jana");
  await page.getByRole("option", { name: /Jana Nováková/i }).click();
  await expect(page.getByText(/welcome back, Jana/i)).toBeVisible();
  await page.getByPlaceholder("password").fill(chosenNewPassword);
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByText(/welcome back, Jana/i)).toBeHidden({ timeout: 10_000 });
});

test("redeemed reset code cannot be used a second time", async ({ page, browser }) => {
  const email = uniqueTestEmail();
  const initialPassword = "longenoughinitial";

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
  const { resetCode } = (await resetResp.json()) as { resetCode: string };
  await facilitatorCtx.close();

  // First redeem succeeds.
  const first = await page.request.post("/api/participant/redeem-reset-code", {
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:3200" },
    data: { code: resetCode, newPassword: "first-attempt-pw0" },
  });
  expect(first.status()).toBe(200);

  // Second redeem of the same code is rejected.
  const second = await page.request.post("/api/participant/redeem-reset-code", {
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:3200" },
    data: { code: resetCode, newPassword: "second-attempt-pw" },
  });
  expect(second.status()).toBe(401);
  const secondBody = (await second.json()) as { error: string };
  expect(secondBody.error).toBe("unknown");
});
