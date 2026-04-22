import { NextResponse } from "next/server";
import { requireParticipantSession } from "@/lib/event-access";
import { getNeonSql } from "@/lib/neon-db";
import { getRuntimeStorageMode } from "@/lib/runtime-storage";
import { getWorkshopState } from "@/lib/workshop-store";

type FingerprintPayload = {
  stateVersion: number;
  phaseLabel: string;
};

// Lean polling endpoint for the participant live refresh loop. Returns
// only the minimal pair the client needs to decide whether to call
// router.refresh() — state_version plus the human-readable current phase
// label. Neon mode runs a single SQL query (vs. 4 for getWorkshopState),
// cutting participant polling cost by ~75% at the 30s cadence.
//
// Called at 30s intervals per participant. Any growth in the payload
// should be justified against the poll-storm multiplier.
export async function GET(request: Request) {
  const access = await requireParticipantSession(request);
  if (!access.ok) {
    return access.response;
  }

  const instanceId = access.session.instanceId;
  const payload =
    getRuntimeStorageMode() === "neon"
      ? await readFingerprintFromNeon(instanceId)
      : await readFingerprintFromFile(instanceId);

  return NextResponse.json(payload);
}

async function readFingerprintFromNeon(instanceId: string): Promise<FingerprintPayload> {
  const sql = getNeonSql();
  const rows = (await sql.query(
    `SELECT state_version,
            workshop_state->'workshopMeta'->>'currentPhaseLabel' AS phase_label
       FROM workshop_instances
       WHERE id = $1
       LIMIT 1`,
    [instanceId],
  )) as Array<{ state_version: number | null; phase_label: string | null }>;

  const row = rows[0];
  return {
    stateVersion: row?.state_version ?? 0,
    phaseLabel: row?.phase_label ?? "",
  };
}

async function readFingerprintFromFile(instanceId: string): Promise<FingerprintPayload> {
  const state = await getWorkshopState(instanceId);
  return {
    stateVersion: state.version,
    phaseLabel: state.workshopMeta.currentPhaseLabel ?? "",
  };
}
