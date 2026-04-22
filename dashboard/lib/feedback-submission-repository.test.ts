import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import type { FeedbackSubmissionRecord } from "./runtime-contracts";

// Using vi.resetModules in beforeEach means the module the repository
// imports may be a DIFFERENT instance than a top-level import here.
// Assert on error.name rather than instanceof to stay robust.
const LOCKED_ERROR_NAME = "FeedbackSubmissionLockedError";

function makeSubmission(overrides: Partial<FeedbackSubmissionRecord> = {}): FeedbackSubmissionRecord {
  return {
    id: "fs-1",
    instanceId: "instance-a",
    participantId: "p-alice",
    sessionKey: "p-alice",
    answers: [
      { questionId: "overall", type: "likert", value: 5 },
      { questionId: "takeaway", type: "open-text", text: "Agents hand off better than teammates sometimes." },
      { questionId: "recommend", type: "single-choice", optionId: "yes" },
    ],
    submittedAt: "2026-04-21T10:00:00.000Z",
    ...overrides,
  };
}

describe("feedback-submission-repository (file mode)", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-feedback-"));
    process.env.HARNESS_DATA_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./feedback-submission-repository");
    mod.setFeedbackSubmissionRepositoryForTests(null);
  });

  it("upserts the first submission and reads it back", async () => {
    const { FileFeedbackSubmissionRepository } = await import("./feedback-submission-repository");
    const repo = new FileFeedbackSubmissionRepository();

    const written = await repo.upsert("instance-a", makeSubmission(), { allowEditWithinHours: 24 });

    expect(written).toMatchObject({
      instanceId: "instance-a",
      sessionKey: "p-alice",
    });
    expect(written.submittedAt).not.toBe("2026-04-21T10:00:00.000Z"); // refreshed to now

    const listed = await repo.list("instance-a");
    expect(listed).toHaveLength(1);
    expect(listed[0].answers).toHaveLength(3);
  });

  it("updates the existing submission within the lock window", async () => {
    const { FileFeedbackSubmissionRepository } = await import("./feedback-submission-repository");
    const repo = new FileFeedbackSubmissionRepository();

    const first = await repo.upsert("instance-a", makeSubmission(), { allowEditWithinHours: 24 });

    const revised = await repo.upsert(
      "instance-a",
      makeSubmission({
        answers: [
          { questionId: "overall", type: "likert", value: 3 },
          { questionId: "quote-ok", type: "checkbox", checked: true },
        ],
      }),
      { allowEditWithinHours: 24 },
    );

    expect(revised.id).toBe(first.id); // same row
    const listed = await repo.list("instance-a");
    expect(listed).toHaveLength(1);
    expect(listed[0].answers).toEqual([
      { questionId: "overall", type: "likert", value: 3 },
      { questionId: "quote-ok", type: "checkbox", checked: true },
    ]);
  });

  it("throws FeedbackSubmissionLockedError when the window has elapsed", async () => {
    const { FileFeedbackSubmissionRepository } = await import("./feedback-submission-repository");
    const repo = new FileFeedbackSubmissionRepository();

    // Write the first submission 48 hours ago — outside the 24h window.
    await repo.upsert(
      "instance-a",
      makeSubmission({ submittedAt: "2026-04-21T10:00:00.000Z" }),
      { allowEditWithinHours: 24 },
    );

    // Simulate the write happening 48 hours ago by overwriting the stored
    // submittedAt directly via a second upsert that passes lock-window=0
    // to forcibly expire it for this test.
    // A cleaner way: re-import with a patched Date.now, but that's more
    // machinery than needed. Instead, use allowEditWithinHours = 0 so the
    // next upsert treats anything non-zero as past-lock.
    const err = await repo
      .upsert("instance-a", makeSubmission(), { allowEditWithinHours: 0 })
      .catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).name).toBe(LOCKED_ERROR_NAME);
  });

  it("findBySessionKey returns the right submission and null for unknown", async () => {
    const { FileFeedbackSubmissionRepository } = await import("./feedback-submission-repository");
    const repo = new FileFeedbackSubmissionRepository();

    await repo.upsert("instance-a", makeSubmission(), { allowEditWithinHours: 24 });

    const found = await repo.findBySessionKey("instance-a", "p-alice");
    expect(found?.sessionKey).toBe("p-alice");

    const missing = await repo.findBySessionKey("instance-a", "p-bob");
    expect(missing).toBeNull();
  });

  it("two different participants get separate rows", async () => {
    const { FileFeedbackSubmissionRepository } = await import("./feedback-submission-repository");
    const repo = new FileFeedbackSubmissionRepository();

    await repo.upsert(
      "instance-a",
      makeSubmission({ id: "fs-alice", sessionKey: "p-alice", participantId: "p-alice" }),
      { allowEditWithinHours: 24 },
    );
    await repo.upsert(
      "instance-a",
      makeSubmission({ id: "fs-bob", sessionKey: "p-bob", participantId: "p-bob" }),
      { allowEditWithinHours: 24 },
    );

    const listed = await repo.list("instance-a");
    expect(listed).toHaveLength(2);
    expect(listed.map((s) => s.sessionKey).sort()).toEqual(["p-alice", "p-bob"]);
  });
});

describe("feedback-submission-repository (Neon mode — query shape)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("upsert issues INSERT ... ON CONFLICT with the right columns and lock check", async () => {
    const query = vi.fn();
    // findBySessionKey result: no existing row → proceed with insert.
    query.mockResolvedValueOnce([]);
    // INSERT resolves with empty array (sql tag behavior).
    query.mockResolvedValueOnce([]);

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const { NeonFeedbackSubmissionRepository } = await import("./feedback-submission-repository");
    const repo = new NeonFeedbackSubmissionRepository();

    await repo.upsert("instance-a", makeSubmission(), { allowEditWithinHours: 24 });

    // Second call is the INSERT.
    const insertCall = query.mock.calls[1];
    expect(insertCall[0]).toContain("INSERT INTO workshop_feedback_submissions");
    expect(insertCall[0]).toContain("ON CONFLICT (instance_id, session_key)");
    expect(insertCall[0]).toContain("answers");
    // Consent now rides inside the answers jsonb as a checkbox answer — no
    // out-of-band column. Assert the column has been removed from the
    // persistence path.
    expect(insertCall[0]).not.toContain("allow_quote_by_name");
  });

  it("upsert rejects when existing row is outside the lock window", async () => {
    const query = vi.fn();
    // findBySessionKey returns an OLD submission.
    query.mockResolvedValueOnce([
      {
        id: "fs-existing",
        instance_id: "instance-a",
        participant_id: "p-alice",
        session_key: "p-alice",
        answers: [],
        submitted_at: "2020-01-01T00:00:00.000Z",
      },
    ]);

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const { NeonFeedbackSubmissionRepository } = await import("./feedback-submission-repository");
    const repo = new NeonFeedbackSubmissionRepository();

    const err = await repo
      .upsert("instance-a", makeSubmission(), { allowEditWithinHours: 24 })
      .catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).name).toBe(LOCKED_ERROR_NAME);

    // Only the SELECT ran; no INSERT happened.
    expect(query).toHaveBeenCalledTimes(1);
  });
});
