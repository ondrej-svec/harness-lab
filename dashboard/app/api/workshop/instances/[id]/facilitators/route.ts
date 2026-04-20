import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getInstanceGrantRepository } from "@/lib/instance-grant-repository";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { getNeonSql } from "@/lib/neon-db";
import { getRuntimeStorageMode } from "@/lib/runtime-storage";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: instanceId } = await params;
  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) return denied;

  const grants = await getInstanceGrantRepository().listActiveGrants(instanceId);

  return NextResponse.json({ ok: true, grants });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: instanceId } = await params;
  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) return denied;

  const facilitator = await getFacilitatorSession(instanceId);
  if (!facilitator || facilitator.grant.role !== "owner") {
    return NextResponse.json({ ok: false, error: "owner role required" }, { status: 403 });
  }

  const body = (await request.json()) as { email?: string; role?: string };
  const email = body.email?.trim();
  const role = body.role as "owner" | "operator" | "observer" | undefined;

  if (!email || !role || !["owner", "operator", "observer"].includes(role)) {
    return NextResponse.json(
      { ok: false, error: "email and role (owner|operator|observer) required" },
      { status: 400 },
    );
  }

  if (getRuntimeStorageMode() !== "neon") {
    return NextResponse.json({ ok: false, error: "grant management requires neon mode" }, { status: 400 });
  }

  // Look up Neon Auth user by email
  const sql = getNeonSql();
  const users = (await sql.query(
    `SELECT id::text, name, email FROM neon_auth."user" WHERE email = $1 LIMIT 1`,
    [email],
  )) as { id: string; name: string; email: string }[];

  if (users.length === 0) {
    return NextResponse.json(
      { ok: false, error: "no Neon Auth user found with that email — they must sign up first" },
      { status: 404 },
    );
  }

  const neonUser = users[0];
  const repo = getInstanceGrantRepository();

  // Check if already granted
  const existing = await repo.getActiveGrantByNeonUserId(instanceId, neonUser.id);
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "facilitator already has an active grant on this instance" },
      { status: 409 },
    );
  }

  const grant = await repo.createGrant(instanceId, neonUser.id, role);

  await getAuditLogRepository().append({
    id: `audit-${Date.now()}`,
    instanceId,
    actorKind: "facilitator",
    action: "facilitator_grant_created",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: {
      grantedByNeonUserId: facilitator.neonUserId,
      grantedToEmail: email,
      grantedToNeonUserId: neonUser.id,
      role,
    },
  });

  return NextResponse.json({
    ok: true,
    grant: {
      id: grant.id,
      neonUserId: neonUser.id,
      role: grant.role,
      userName: neonUser.name,
      userEmail: neonUser.email,
    },
  });
}
