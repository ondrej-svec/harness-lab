import { NextResponse } from "next/server";
import { rotation } from "@/lib/workshop-data";

export async function GET() {
  return NextResponse.json(rotation);
}
