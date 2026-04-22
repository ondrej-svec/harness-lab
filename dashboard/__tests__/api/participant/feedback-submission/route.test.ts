import { beforeEach, describe, expect, it, vi } from "vitest";

const requireParticipantSession = vi.fn();
const getInstance = vi.fn();
const upsert = vi.fn();
const findBySessionKey = vi.fn();
const resolveEffectiveFeedbackTemplate = vi.fn();

vi.mock("@/lib/event-access", () => ({
  requireParticipantSession,
}));

vi.mock("@/lib/workshop-instance-repository", () => ({
  getWorkshopInstanceRepository: () => ({ getInstance }),
}));

vi.mock("@/lib/feedback-submission-repository", () => ({
  getFeedbackSubmissionRepository: () => ({ upsert, findBySessionKey }),
}));

vi.mock("@/lib/workshop-data", () => ({
  resolveEffectiveFeedbackTemplate,
}));

// Not mocking runtime-contracts — we want the real FeedbackSubmissionLockedError.

const routeModulePromise = import("@/app/api/participant/feedback-submission/route");

function buildTemplate() {
  return {
    version: 1,
    questions: [
      {
        id: "overall",
        type: "likert",
        scale: 5,
        prompt: { cs: "Jak to dopadlo?", en: "How was it?" },
      },
      {
        id: "recommend",
        type: "single-choice",
        prompt: { cs: "Doporučili?", en: "Recommend?" },
        options: [
          { id: "yes", label: { cs: "ano", en: "yes" } },
          { id: "no", label: { cs: "ne", en: "no" } },
        ],
      },
      {
        id: "testimonial",
        type: "open-text",
        optional: true,
        prompt: { cs: "Citát?", en: "Quote?" },
      },
    ],
  };
}

function buildAuthedRequest(body: unknown) {
  return new Request("http://localhost/api/participant/feedback-submission", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/participant/feedback-submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireParticipantSession.mockResolvedValue({
      ok: true,
      session: { instanceId: "sample-studio-a", participantId: "p-alice" },
    });
    getInstance.mockResolvedValue({
      id: "sample-studio-a",
      status: "ended",
      feedbackForm: null,
    });
    resolveEffectiveFeedbackTemplate.mockReturnValue(buildTemplate());
    upsert.mockImplementation(async (_instanceId, submission) => submission);
  });

  it("accepts a valid submission → 200", async () => {
    const { POST } = await routeModulePromise;

    const response = await POST(
      buildAuthedRequest({
        answers: [
          { questionId: "overall", type: "likert", value: 4 },
          { questionId: "recommend", type: "single-choice", optionId: "yes" },
        ],
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; submission: unknown };
    expect(body.ok).toBe(true);
    expect(upsert).toHaveBeenCalledWith(
      "sample-studio-a",
      expect.objectContaining({
        sessionKey: "p-alice",
        participantId: "p-alice",
        answers: expect.arrayContaining([
          expect.objectContaining({ questionId: "overall", value: 4 }),
        ]),
      }),
      { allowEditWithinHours: 24 },
    );
  });

  it("rejects when instance is not ended → 404 feedback_not_open", async () => {
    getInstance.mockResolvedValue({
      id: "sample-studio-a",
      status: "running",
      feedbackForm: null,
    });
    const { POST } = await routeModulePromise;

    const response = await POST(buildAuthedRequest({ answers: [] }));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: "feedback_not_open" });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects missing required answer → 400", async () => {
    const { POST } = await routeModulePromise;

    const response = await POST(
      buildAuthedRequest({
        answers: [{ questionId: "overall", type: "likert", value: 4 }],
        // recommend is required but missing
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toContain("recommend");
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects Likert value out of range → 400", async () => {
    const { POST } = await routeModulePromise;

    const response = await POST(
      buildAuthedRequest({
        answers: [
          { questionId: "overall", type: "likert", value: 99 },
          { questionId: "recommend", type: "single-choice", optionId: "yes" },
        ],
      }),
    );

    expect(response.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects invalid optionId for single-choice → 400", async () => {
    const { POST } = await routeModulePromise;

    const response = await POST(
      buildAuthedRequest({
        answers: [
          { questionId: "overall", type: "likert", value: 4 },
          { questionId: "recommend", type: "single-choice", optionId: "maybe" },
        ],
      }),
    );

    expect(response.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("returns 409 when the repository reports a locked row", async () => {
    const { FeedbackSubmissionLockedError } = await import("@/lib/runtime-contracts");
    upsert.mockRejectedValue(new FeedbackSubmissionLockedError("p-alice", "2020-01-01T00:00:00.000Z"));

    const { POST } = await routeModulePromise;

    const response = await POST(
      buildAuthedRequest({
        answers: [
          { questionId: "overall", type: "likert", value: 4 },
          { questionId: "recommend", type: "single-choice", optionId: "yes" },
        ],
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: "submission_locked" });
  });

  it("omits the optional testimonial when not provided", async () => {
    const { POST } = await routeModulePromise;

    const response = await POST(
      buildAuthedRequest({
        answers: [
          { questionId: "overall", type: "likert", value: 5 },
          { questionId: "recommend", type: "single-choice", optionId: "yes" },
        ],
      }),
    );

    expect(response.status).toBe(200);
    const call = upsert.mock.calls[0];
    const submission = call[1] as { answers: Array<{ questionId: string }> };
    expect(submission.answers.some((a) => a.questionId === "testimonial")).toBe(false);
  });

  it("unauthenticated request → 401", async () => {
    requireParticipantSession.mockResolvedValue({
      ok: false,
      response: new Response("no session", { status: 401 }),
    });

    const { POST } = await routeModulePromise;
    const response = await POST(buildAuthedRequest({ answers: [] }));
    expect(response.status).toBe(401);
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("GET /api/participant/feedback-submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireParticipantSession.mockResolvedValue({
      ok: true,
      session: { instanceId: "sample-studio-a", participantId: "p-alice" },
    });
    getInstance.mockResolvedValue({
      id: "sample-studio-a",
      status: "ended",
      feedbackForm: null,
    });
    resolveEffectiveFeedbackTemplate.mockReturnValue(buildTemplate());
    findBySessionKey.mockResolvedValue(null);
  });

  it("returns template + null submission when nothing exists yet", async () => {
    const { GET } = await routeModulePromise;
    const response = await GET(
      new Request("http://localhost/api/participant/feedback-submission"),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { template: unknown; submission: unknown };
    expect(body.template).toBeDefined();
    expect(body.submission).toBeNull();
    expect(findBySessionKey).toHaveBeenCalledWith("sample-studio-a", "p-alice");
  });

  it("returns the existing submission when one exists", async () => {
    findBySessionKey.mockResolvedValue({
      id: "fs-existing",
      instanceId: "sample-studio-a",
      participantId: "p-alice",
      sessionKey: "p-alice",
      answers: [
        { questionId: "overall", type: "likert", value: 5 },
        { questionId: "quote-ok", type: "checkbox", checked: true },
      ],
      submittedAt: "2026-04-21T10:00:00.000Z",
    });

    const { GET } = await routeModulePromise;
    const response = await GET(
      new Request("http://localhost/api/participant/feedback-submission"),
    );
    expect(response.status).toBe(200);
    // Consent now lives inside answers, not on the top-level submission
    // record. Assert the existing submission's quote-ok answer round-trips.
    const body = (await response.json()) as {
      submission: { answers: Array<{ questionId: string; type: string; checked?: boolean }> };
    };
    const consentAnswer = body.submission.answers.find((a) => a.questionId === "quote-ok");
    expect(consentAnswer?.checked).toBe(true);
  });
});
