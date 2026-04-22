import { NextResponse } from "next/server";
import { getNeonSql } from "@/lib/neon-db";
import { getRuntimeStorageMode } from "@/lib/runtime-storage";

// Unauthenticated by design. Payload MUST NOT leak instance IDs, DB URLs,
// or storage diagnostics beyond the binary `ok` and enum `mode` fields.
// Used by external uptime monitoring (UptimeRobot) at 5-minute cadence.
export async function GET() {
  const mode = getRuntimeStorageMode();
  const ts = new Date().toISOString();

  if (mode === "file") {
    return NextResponse.json({ ok: true, mode, ts });
  }

  try {
    const sql = getNeonSql();
    await sql`SELECT 1`;
    return NextResponse.json({ ok: true, mode, ts });
  } catch {
    return NextResponse.json({ ok: false, mode, ts }, { status: 503 });
  }
}
