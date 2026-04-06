import { NextResponse } from "next/server";
import { getParticipantCoreBundle, requireParticipantSession } from "@/lib/event-access";

export async function GET(request: Request) {
  const access = await requireParticipantSession(request);
  if (!access.ok) {
    return access.response;
  }

  return NextResponse.json(await getParticipantCoreBundle());
}
