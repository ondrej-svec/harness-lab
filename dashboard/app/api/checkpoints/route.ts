import { NextResponse } from "next/server";
import { sprintUpdates } from "@/lib/workshop-data";

export async function GET() {
  return NextResponse.json({
    items: sprintUpdates,
    storageMode: "seed",
  });
}
