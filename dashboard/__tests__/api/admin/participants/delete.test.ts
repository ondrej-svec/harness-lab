import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireFacilitatorRequest = vi.fn();
const findParticipant = vi.fn();
const archiveParticipant = vi.fn();
const upsertParticipant = vi.fn();
const unassignMember = vi.fn();
const recordTeamUnassignmentHistory = vi.fn();
const rebuildTeamMembersProjection = vi.fn();
const deleteParticipantAndLinkedData = vi.fn();
const appendAudit = vi.fn();

vi.mock("@/lib/facilitator-access", () => ({
  requireFacilitatorRequest,
}));

vi.mock("@/lib/participant-repository", () => ({
  getParticipantRepository: () => ({
    findParticipant,
    archiveParticipant,
    upsertParticipant,
  }),
}));

vi.mock("@/lib/team-member-repository", () => ({
  getTeamMemberRepository: () => ({
    unassignMember,
  }),
}));

vi.mock("@/lib/team-composition-history", () => ({
  recordTeamUnassignmentHistory,
}));

vi.mock("@/lib/team-members-projection", () => ({
  rebuildTeamMembersProjection,
}));

vi.mock("@/lib/participant-data-deletion", () => ({
  deleteParticipantAndLinkedData,
}));

vi.mock("@/lib/audit-log-repository", () => ({
  getAuditLogRepository: () => ({
    append: appendAudit,
  }),
}));

function makeParticipant() {
  return {
    id: "p-1",
    instanceId: "i-1",
    displayName: "Jana Nováková",
    email: "jana@example.com",
    emailOptIn: false,
    tag: null,
    createdAt: "2026-04-22T00:00:00.000Z",
    updatedAt: "2026-04-22T00:00:00.000Z",
    archivedAt: null,
    neonUserId: "neon-u-1",
    hasPassword: true,
  };
}

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/admin/participants/p-1", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const context = { params: Promise.resolve({ id: "p-1" }) };

describe("DELETE /api/admin/participants/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireFacilitatorRequest.mockResolvedValue(null);
    findParticipant.mockResolvedValue(makeParticipant());
    unassignMember.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.resetModules();
    delete process.env.HARNESS_STORAGE_MODE;
  });

  it("soft-archives when confirm flag is absent", async () => {
    const { DELETE } = await import("@/app/api/admin/participants/[id]/route");
    const res = await DELETE(makeRequest({ instanceId: "i-1" }), context);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, mode: "archive" });
    expect(archiveParticipant).toHaveBeenCalledOnce();
    expect(deleteParticipantAndLinkedData).not.toHaveBeenCalled();
  });

  it("rejects GDPR delete in file mode", async () => {
    const { DELETE } = await import("@/app/api/admin/participants/[id]/route");
    const res = await DELETE(
      makeRequest({ instanceId: "i-1", confirm: true, confirmDisplayName: "Jana Nováková" }),
      context,
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: "gdpr_delete_requires_neon_mode" });
    expect(deleteParticipantAndLinkedData).not.toHaveBeenCalled();
  });

  it("rejects GDPR delete when confirmDisplayName does not match", async () => {
    process.env.HARNESS_STORAGE_MODE = "neon";
    const { DELETE } = await import("@/app/api/admin/participants/[id]/route");
    const res = await DELETE(
      makeRequest({ instanceId: "i-1", confirm: true, confirmDisplayName: "Wrong Name" }),
      context,
    );
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ error: "confirmation_mismatch" });
    expect(deleteParticipantAndLinkedData).not.toHaveBeenCalled();
  });

  it("runs the GDPR cascade + audit when confirm + matching name are provided", async () => {
    process.env.HARNESS_STORAGE_MODE = "neon";
    deleteParticipantAndLinkedData.mockResolvedValue({
      deletedRowsByTable: { participants: 1, team_members: 2, participant_feedback: 1 },
      neonAuthUser: { ok: true, method: "control_plane_delete" },
    });

    const { DELETE } = await import("@/app/api/admin/participants/[id]/route");
    const res = await DELETE(
      makeRequest({ instanceId: "i-1", confirm: true, confirmDisplayName: "Jana Nováková" }),
      context,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { mode: string; deletedRowsByTable: Record<string, number> };
    expect(body.mode).toBe("gdpr_delete");
    expect(body.deletedRowsByTable.participants).toBe(1);

    expect(deleteParticipantAndLinkedData).toHaveBeenCalledWith("p-1", "i-1");
    expect(appendAudit).toHaveBeenCalledOnce();
    const entry = appendAudit.mock.calls[0]?.[0];
    expect(entry.action).toBe("participant.gdpr_delete");
    expect(entry.metadata.participantId).toBe("p-1");
    expect(entry.metadata.deletedRowsTotal).toBe(4);
  });
});
