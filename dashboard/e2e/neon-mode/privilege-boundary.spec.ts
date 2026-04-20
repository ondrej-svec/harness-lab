/**
 * Spec (h) from Phase 5.6 Layer 3:
 *   participant-role Neon session cannot reach facilitator surfaces.
 *
 * This is the live counterpart to lib/privilege-boundary.test.ts —
 * proves the role check Phase 5.5 introduced holds against actual
 * request paths, not just the unit-level grant resolver.
 *
 * The participant logs in via the standard event-code + password
 * flow (which leaves them with a Neon Auth cookie tagged
 * role="participant"), then probes a representative cross-section of
 * /api/admin/* routes. Every one must return 401/403.
 */

import { expect, redeemEventCode, test, uniqueTestEmail } from "./fixtures";

const ADMIN_PROBES = [
  { method: "GET" as const, path: "/api/admin/participants?instanceId=playwright-neon-mode" },
  { method: "POST" as const, path: "/api/admin/team-members", body: { instanceId: "playwright-neon-mode" } },
  { method: "PUT" as const, path: "/api/admin/instances/playwright-neon-mode/walk-in-policy", body: { allowWalkIns: true } },
  { method: "POST" as const, path: "/api/admin/team-formation/randomize", body: { instanceId: "playwright-neon-mode" } },
];

test("a logged-in participant cannot reach any /api/admin/* route", async ({ page, request }) => {
  // Identify as a participant so the browser carries a Neon Auth
  // session cookie tagged role="participant".
  const email = uniqueTestEmail();
  const password = "longenoughpassword";
  await redeemEventCode(page);
  await page.getByRole("combobox", { name: /your name/i }).fill("Jana");
  await page.getByRole("option", { name: /Jana Nováková/i }).click();
  await page.getByPlaceholder(/your email/i).fill(email);
  await page.getByPlaceholder("password").fill(password);
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByText(/welcome, Jana/i)).toBeHidden({ timeout: 10_000 });

  // Probe each admin endpoint via the page's fetch so the
  // participant session cookie is forwarded with the request.
  for (const probe of ADMIN_PROBES) {
    const result = await page.evaluate(
      async ({ method, path, body }) => {
        const r = await fetch(path, {
          method,
          headers: { "content-type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
          credentials: "same-origin",
        });
        return r.status;
      },
      probe,
    );
    expect(
      [401, 403],
      `${probe.method} ${probe.path} should be 401 or 403 for participant-role session, got ${result}`,
    ).toContain(result);
  }

  // Reaching /admin via SSR redirects to /admin/sign-in (or returns
  // a 4xx). Either way, the response should NOT render the admin
  // workspace (which would mean a privilege escalation).
  void request; // request fixture available; we use page.evaluate above
  const adminPageResp = await page.goto("/admin", { waitUntil: "domcontentloaded" });
  // requireFacilitatorPageAccess redirects unauthenticated visits to
  // /admin/sign-in. After that redirect chain settles, we must NOT
  // be looking at the workspace cockpit.
  expect(page.url()).not.toMatch(/\/admin\/instances\//);
  expect(adminPageResp?.status() ?? 0).toBeLessThan(500);
});
