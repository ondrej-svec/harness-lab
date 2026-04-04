import { NextResponse } from "next/server";
import { challenges } from "@/lib/workshop-data";

export async function GET() {
  return NextResponse.json({
    items: challenges,
    storageMode: "seed",
  });
}
