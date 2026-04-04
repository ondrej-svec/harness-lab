import { NextResponse } from "next/server";
import { agenda, workshopMeta } from "@/lib/workshop-data";

export async function GET() {
  const current = agenda.find((item) => item.status === "current") ?? null;

  return NextResponse.json({
    phase: current,
    title: workshopMeta.title,
    items: agenda,
  });
}
