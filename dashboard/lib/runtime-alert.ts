type RuntimeAlert = {
  category:
    | "facilitator_auth_failure"
    | "participant_redeem_rate_limited"
    | "participant_redeem_bot_signal"
    | "participant_identify_rebind_attempt"
    | "instance_archive_created"
    | "jsonb_parse_failure"
    | "device_auth_rate_limited";
  severity: "info" | "warning" | "error";
  instanceId: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export function emitRuntimeAlert(alert: RuntimeAlert) {
  const payload = {
    signal: "HARNESS_RUNTIME_ALERT",
    ...alert,
    createdAt: new Date().toISOString(),
  };

  const line = JSON.stringify(payload);
  if (alert.severity === "error") {
    console.error(line);
    return;
  }

  if (alert.severity === "warning") {
    console.warn(line);
    return;
  }

  console.info(line);
}
