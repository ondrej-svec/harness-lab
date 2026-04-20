import { headers } from "next/headers";
import { checkBotId } from "botid/server";
import { redeemEventCode } from "./event-access";
import { isRedeemRateLimited, recordRedeemAttempt } from "./redeem-rate-limit";
import { isTrustedOrigin } from "./request-integrity";
import { emitRuntimeAlert } from "./runtime-alert";

// Sentinel instanceId used by runtime alerts emitted during redeem
// before the server knows which workshop instance a submitted code
// belongs to. The redeem path scans all active instances, so alerts
// fired here are not tied to a specific instance.
const redeemPreMatchInstanceSentinel = "__redeem__";

export type RedeemGuardFailureReason = "rate_limited" | "untrusted_origin";

export type GuardedRedeemResult =
  | Awaited<ReturnType<typeof redeemEventCode>>
  | { ok: false; reason: RedeemGuardFailureReason };

/**
 * Centralized redeem path. Both the API route and the server-action
 * homepage form funnel every event-code submission through this function,
 * so origin check, bot signal, and rate limit are applied uniformly and
 * every attempt — success or failure — lands in the audit trail.
 */
export async function guardedRedeemEventCode(
  submittedCode: string,
  displayName: string | undefined,
  request: Request,
): Promise<GuardedRedeemResult> {
  if (
    !isTrustedOrigin({
      originHeader: request.headers.get("origin"),
      hostHeader: request.headers.get("host"),
      forwardedHostHeader: request.headers.get("x-forwarded-host"),
      requestUrl: request.url,
    })
  ) {
    return { ok: false as const, reason: "untrusted_origin" as const };
  }

  // Test environments (Playwright Neon mode) bypass the Vercel BotId
  // check because there's no OIDC token issuer locally. The bypass is
  // gated on an explicit env var so production deployments can never
  // accidentally turn off bot protection.
  const botCheck = process.env.HARNESS_BYPASS_BOT_CHECK === "1"
    ? { isBot: false, isHuman: true, isVerifiedBot: false, bypassed: true }
    : await checkBotId();
  if (botCheck.isBot) {
    emitRuntimeAlert({
      category: "participant_redeem_bot_signal",
      severity: "warning",
      instanceId: redeemPreMatchInstanceSentinel,
    });
  }

  if (await isRedeemRateLimited(request)) {
    emitRuntimeAlert({
      category: "participant_redeem_rate_limited",
      severity: "warning",
      instanceId: redeemPreMatchInstanceSentinel,
    });
    return { ok: false as const, reason: "rate_limited" as const };
  }

  const result = await redeemEventCode(submittedCode, displayName);
  await recordRedeemAttempt(request, result.ok ? "success" : "failure");
  return result;
}

/**
 * Server actions don't receive a Request the way route handlers do. Build
 * an equivalent Request from Next.js's ambient header store so the guard
 * path can consume it uniformly.
 */
export async function buildServerActionRequest(): Promise<Request> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost";
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  const forwardedHeaders = new Headers();
  headerStore.forEach((value, key) => {
    forwardedHeaders.set(key, value);
  });
  return new Request(`${proto}://${host}/`, {
    method: "POST",
    headers: forwardedHeaders,
  });
}
