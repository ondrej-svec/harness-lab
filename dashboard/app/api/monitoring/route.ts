import { NextResponse } from "next/server";
import type { MonitoringSnapshot } from "@/lib/workshop-data";
import { getWorkshopState, replaceMonitoring } from "@/lib/workshop-store";

export async function GET() {
  const state = await getWorkshopState();
  return NextResponse.json({
    items: state.monitoring,
    storageMode: "file",
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { items?: MonitoringSnapshot[] };
  if (!body.items) {
    return NextResponse.json({ ok: false, error: "items are required" }, { status: 400 });
  }

  const state = await replaceMonitoring(body.items);
  return NextResponse.json({ ok: true, items: state.monitoring });
}
