import { NextResponse } from "next/server";
import { getWorkshopState } from "@/lib/workshop-store";

export async function GET() {
  const state = await getWorkshopState();
  return NextResponse.json({
    items: state.briefs,
  });
}
