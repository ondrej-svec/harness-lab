import { NextResponse } from "next/server";
import { briefs } from "@/lib/workshop-data";

export async function GET() {
  return NextResponse.json({
    items: briefs,
  });
}
