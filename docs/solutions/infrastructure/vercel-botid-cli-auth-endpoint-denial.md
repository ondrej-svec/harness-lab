---
title: "Vercel BotID on a CLI-facing endpoint breaks non-browser auth with misleading `denied`"
type: solution
date: 2026-04-13
domain: infrastructure
component: "dashboard/app/api/event-access/redeem + botid/server"
symptoms:
  - "`harness auth login --code <EVENT_CODE>` fails with `Event code login failed: denied`"
  - "POST /api/event-access/redeem returns `{\"ok\":false,\"error\":\"denied\"}` HTTP 403"
  - "The error is identical whether the code is correct, wrong, expired, or revoked"
  - "The same endpoint succeeds from a real browser under the same origin"
  - "The facilitator panel shows an active code in the DB and the hash matches, yet redeem still denies"
root_cause: "Vercel BotID was added to the participant redeem endpoint via initBotId().protect in instrumentation-client.ts. checkBotId() server-side requires a client-side token minted by botid/client, which only real browsers produce. Any non-browser caller (curl, the harness CLI) is classified as a bot and returns NextResponse.json({ok:false, error:\"denied\"}, {status:403}) — the exact same shape as a credential-mismatch 401, making the failure look like an auth problem instead of a bot-detection problem."
severity: high
related:
  - "../../../dashboard/app/api/event-access/redeem/route.ts"
  - "../../../dashboard/instrumentation-client.ts"
  - "../../../harness-cli/src/client.js"
---

# Vercel BotID on a CLI-facing endpoint breaks non-browser auth with misleading `denied`

## Problem

Participants running `harness auth login --code <EVENT_CODE>` against the live dashboard at `https://lab.ondrejsvec.com` got:

```
Auth Login
==========
[error] Event code login failed: denied
```

Direct curl probes showed exactly:

```
$ curl -sS -X POST https://lab.ondrejsvec.com/api/event-access/redeem \
  -H "content-type: application/json" \
  -H "origin: https://lab.ondrejsvec.com" \
  -d '{"eventCode":"<valid-active-code>"}'
{"ok":false,"error":"denied"}
HTTP 403
```

The failure was *identical* whether the code was:
- the active, unrevoked, DB-verified code for a `prepared` instance
- a wrong code
- an empty string
- a random string

Meanwhile the facilitator panel at `/admin/instances/.../participant-access` displayed the code as active with matching `codeId` (`codeHash.slice(0,12)`), and direct Neon queries confirmed the `participant_event_access` row was present, unrevoked, not expired, and the SHA-256 of the raw code matched `code_hash` exactly.

## Root Cause

`dashboard/instrumentation-client.ts` registered the redeem endpoint under Vercel BotID:

```ts
initBotId({
  protect: [
    { path: "/admin/sign-in", method: "POST" },
    { path: "/api/event-access/redeem", method: "POST" },
  ],
});
```

`dashboard/app/api/event-access/redeem/route.ts` called `checkBotId()` and denied on `isBot`:

```ts
const botCheck = await checkBotId();
if (botCheck.isBot) {
  return NextResponse.json({ ok: false, error: "denied" }, { status: 403 });
}
```

Vercel BotID works by having `botid/client` mint a cryptographic token in real browser contexts. The server-side `checkBotId()` validates that token. **Any caller without the client-side token is classified as a bot** — including `curl`, `fetch` from Node, and the harness CLI which is the primary consumer of this endpoint.

Three things made the failure hard to diagnose:

1. **The error shape matches a credential denial.** Both BotID rejection and `redeemEventCode` rejection return JSON with `error: "denied"` (or similar). Callers assume it's a code/hash problem and dig into the wrong layer.
2. **The status code is 403, not 401.** The `isBot` branch uses 403; the `redeemEventCode` failure branch uses 401. This is the only reliable tell, and it's easy to miss when everything returns "denied".
3. **BotID is configured in two places and both must be removed.** The client-side `initBotId().protect` array registers the endpoint for token minting, and the server-side `checkBotId()` enforces it. Removing one without the other leaves the gate half-active.

Additional confusion: the endpoint is also protected by a trusted-origin check that returns plain-text `"Invalid origin"` (not JSON), so the JSON `denied` shape conclusively rules out the origin check and points at BotID — once you know what to look for.

## Fix

BotID is inherently incompatible with CLI-facing auth endpoints. The real defenses for this endpoint were already in place: per-IP rate limit (`isRedeemRateLimited`), trusted-origin check, 32-char high-entropy bearer token, timing-safe hash compare. BotID was defense-in-depth, not the primary gate.

**Demote BotID from hard gate to telemetry signal** in `dashboard/app/api/event-access/redeem/route.ts`:

```ts
const botCheck = await checkBotId();
if (botCheck.isBot) {
  emitRuntimeAlert({
    category: "participant_redeem_bot_signal",
    severity: "warning",
    instanceId: getCurrentWorkshopInstanceId(),
  });
}
```

And remove the endpoint from `dashboard/instrumentation-client.ts`:

```ts
initBotId({
  protect: [
    { path: "/admin/sign-in", method: "POST" },
  ],
});
```

Also add the new alert category to `dashboard/lib/runtime-alert.ts`:

```ts
type RuntimeAlert = {
  category:
    | "facilitator_auth_failure"
    | "participant_redeem_rate_limited"
    | "participant_redeem_bot_signal"
    | "instance_archive_created";
  ...
};
```

Net effect: bot patterns still get logged (you can watch the alert stream), but the endpoint remains callable by the CLI. Rate limit + origin + high-entropy token are the real defense.

## Prevention

1. **Never put BotID on an endpoint that the harness CLI calls.** Check `harness-cli/src/client.js` before adding `checkBotId()` to any route. The CLI is the *primary* consumer of several endpoints — treating it as hostile traffic breaks every non-browser auth flow.

2. **Design error shapes to distinguish failure layers.** If an endpoint has multiple denial paths (rate limit, origin, bot, credential), each should return a *distinct* error code/string. Then `"denied"` always means one specific thing and the next person can read the code path from the response.

3. **Understand the BotID installation shape before using it.** BotID requires *both* `initBotId({protect:[...]})` on the client AND `checkBotId()` on the server. Removing one without the other leaves a half-active gate that will silently surface later.

4. **Test non-browser callers when adding any new security layer.** Run `curl` and `harness auth login --code` against prod in CI or a smoke test after enabling any new middleware. If the endpoint is a bearer-token endpoint by design, it must accept non-browser clients.

5. **Defense-in-depth for bearer-token endpoints belongs in rate-limit + entropy, not bot detection.** BotID catches drive-by browser bots on public HTML routes. For a POST endpoint guarded by a 32-char random token, the real attack is credential brute force, which the per-IP rate limiter already handles. Adding BotID on top of that provides marginal real security and breaks a supported caller.

## Related

- `dashboard/app/api/event-access/redeem/route.ts` — the route being discussed
- `dashboard/instrumentation-client.ts` — where BotID protect paths are registered
- `harness-cli/src/client.js:160` — the CLI redeem call that was blocked
- Commit `ed04fe9` — "Demote BotID gate on participant redeem to telemetry"
