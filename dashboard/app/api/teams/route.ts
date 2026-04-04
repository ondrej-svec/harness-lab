import { NextResponse } from "next/server";
import { teams } from "@/lib/workshop-data";

export async function GET() {
  return NextResponse.json({
    items: teams,
  });
}
