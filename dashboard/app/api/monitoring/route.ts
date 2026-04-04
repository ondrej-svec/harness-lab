import { NextResponse } from "next/server";
import { monitoring } from "@/lib/workshop-data";

export async function GET() {
  return NextResponse.json({
    items: monitoring,
    storageMode: "seed",
  });
}
