import { NextResponse } from "next/server";
import { isWorkshopStateConflictError, isWorkshopStateTargetError } from "./workshop-store";

export function workshopMutationErrorResponse(error: unknown) {
  if (isWorkshopStateTargetError(error)) {
    return NextResponse.json({ ok: false, error: error.code }, { status: 404 });
  }

  if (isWorkshopStateConflictError(error)) {
    return NextResponse.json(
      {
        ok: false,
        error: "workshop_state_conflict",
        message: "Workshop state changed before this update completed. Refresh and retry.",
      },
      { status: 409 },
    );
  }

  throw error;
}
