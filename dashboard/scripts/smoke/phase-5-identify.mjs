#!/usr/bin/env node
/**
 * Phase 5 identify smoke — one happy-path round-trip a human or
 * coding agent can run between commits to confirm the participant
 * flow still works end-to-end against live Neon Auth.
 *
 * What it does:
 *   1. Reseeds the playwright-neon-mode test instance + roster
 *   2. POSTs to /api/event-access/redeem (form mode → 303 with cookie)
 *   3. POSTs to /api/event-access/identify/suggest, asserts Jana matches
 *   4. POSTs to /api/event-access/identify/set-password with a unique
 *      email + a long-enough password
 *   5. POSTs to /api/event-access/identify/authenticate with the same
 *      credentials, asserts ok=true
 *
 * Designed to run against the same prod Next server the Playwright
 * Neon project boots: HARNESS_STORAGE_MODE=neon, HARNESS_DATABASE_URL,
 * NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET, NEON_API_KEY in env.
 *
 * Usage:
 *   PORT=3200 node dashboard/scripts/smoke/phase-5-identify.mjs
 *
 * Exit code 0 = pass, non-zero = fail with a summary on stderr.
 * Output is brief by design — re-run between commits.
 */

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";

const PORT = process.env.PORT ?? "3200";
const ORIGIN = `http://127.0.0.1:${PORT}`;
const EVENT_CODE = "lantern8-context4-handoff2";

const log = (label, ok, extra = "") => {
  const symbol = ok ? "✓" : "✗";
  process.stdout.write(`  ${symbol} ${label}${extra ? ` — ${extra}` : ""}\n`);
};

function fail(msg) {
  process.stderr.write(`smoke failed: ${msg}\n`);
  process.exit(1);
}

async function main() {
  console.log(`phase-5-identify smoke against ${ORIGIN}`);

  // 1. Reseed
  const seedScript = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "seed-neon-test-instance.mjs");
  execFileSync("node", [seedScript, "--reset"], { stdio: "inherit" });

  // 2. Redeem (JSON path so we can capture the cookie deterministically)
  const redeemResp = await fetch(`${ORIGIN}/api/event-access/redeem`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, host: `127.0.0.1:${PORT}` },
    body: JSON.stringify({ eventCode: EVENT_CODE }),
  });
  if (!redeemResp.ok) fail(`redeem returned ${redeemResp.status}`);
  const sessionCookieHeader = redeemResp.headers.getSetCookie?.() ?? [];
  const eventCookie = sessionCookieHeader.find((c) => c.startsWith("harness_event_session="));
  if (!eventCookie) fail("redeem returned no harness_event_session cookie");
  const cookie = eventCookie.split(";")[0];
  log("redeem", true, `${redeemResp.status}`);

  // 3. Suggest
  const suggestResp = await fetch(`${ORIGIN}/api/event-access/identify/suggest?q=Jana`, {
    headers: { cookie },
  });
  const suggestBody = await suggestResp.json();
  if (!suggestResp.ok) fail(`suggest returned ${suggestResp.status}`);
  if (!suggestBody.matches?.some((m) => m.displayName === "Jana Nováková")) {
    fail(`suggest body did not include Jana: ${JSON.stringify(suggestBody)}`);
  }
  const participantId = suggestBody.matches.find((m) => m.displayName === "Jana Nováková").id;
  log("suggest", true, `participantId=${participantId.slice(0, 12)}…`);

  // 4. Set password
  const email = `pw-smoke-${randomUUID().slice(0, 8)}@harness-lab-test.invalid`;
  const password = "longenoughsmoke";
  const setResp = await fetch(`${ORIGIN}/api/event-access/identify/set-password`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie, origin: ORIGIN, host: `127.0.0.1:${PORT}` },
    body: JSON.stringify({ participantId, email, password }),
  });
  const setBody = await setResp.json();
  if (!setResp.ok || !setBody.ok) {
    fail(`set-password returned ${setResp.status} ${JSON.stringify(setBody)}`);
  }
  log("set-password", true, `neonUserId=${setBody.neonUserId.slice(0, 8)}…`);

  // 5. Authenticate (sign-out the current binding by clearing cookie,
  //    re-redeem to get a fresh anonymous session, then authenticate.)
  const reRedeemResp = await fetch(`${ORIGIN}/api/event-access/redeem`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, host: `127.0.0.1:${PORT}` },
    body: JSON.stringify({ eventCode: EVENT_CODE }),
  });
  const reCookie = (reRedeemResp.headers.getSetCookie?.() ?? [])
    .find((c) => c.startsWith("harness_event_session="))?.split(";")[0];
  if (!reCookie) fail("re-redeem returned no cookie");

  const authResp = await fetch(`${ORIGIN}/api/event-access/identify/authenticate`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: reCookie, origin: ORIGIN, host: `127.0.0.1:${PORT}` },
    body: JSON.stringify({ participantId, password }),
  });
  const authBody = await authResp.json();
  if (!authResp.ok || !authBody.ok) {
    fail(`authenticate returned ${authResp.status} ${JSON.stringify(authBody)}`);
  }
  log("authenticate", true, `${authResp.status}`);

  console.log("smoke passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
