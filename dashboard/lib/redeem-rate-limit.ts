import { createHash } from "node:crypto";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { getRedeemAttemptRepository } from "./redeem-attempt-repository";

const redeemFailureWindowMinutes = 10;
const redeemFailureLimit = 5;

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getClientFingerprint(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent") ?? "unknown-agent";
  const acceptLanguage = request.headers.get("accept-language") ?? "unknown-language";

  return hashValue(forwardedFor || `${userAgent}:${acceptLanguage}`);
}

export async function isRedeemRateLimited(request: Request) {
  const instanceId = getCurrentWorkshopInstanceId();
  const fingerprint = getClientFingerprint(request);
  const since = new Date(Date.now() - redeemFailureWindowMinutes * 60 * 1000).toISOString();
  const failures = await getRedeemAttemptRepository().countRecentFailures(instanceId, fingerprint, since);

  return failures >= redeemFailureLimit;
}

export async function recordRedeemAttempt(request: Request, result: "success" | "failure") {
  await getRedeemAttemptRepository().appendAttempt({
    instanceId: getCurrentWorkshopInstanceId(),
    fingerprint: getClientFingerprint(request),
    result,
    createdAt: new Date().toISOString(),
  });
}
