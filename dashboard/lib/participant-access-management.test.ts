import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

function makeRevealKey() {
  return randomBytes(32).toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

describe("participant-access-management", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;
  const originalSecret = process.env.HARNESS_EVENT_CODE_SECRET;
  const originalRevealKey = process.env.HARNESS_EVENT_CODE_REVEAL_KEY;
  const originalAuditPath = process.env.HARNESS_AUDIT_LOG_PATH;
  const originalSeedCode = process.env.HARNESS_EVENT_CODE;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-access-mgmt-"));
    process.env.HARNESS_DATA_DIR = tempDir;
    process.env.HARNESS_AUDIT_LOG_PATH = path.join(tempDir, "audit.json");
    process.env.HARNESS_EVENT_CODE_SECRET = "test-event-code-secret-at-least-32-chars-long";
    delete process.env.HARNESS_EVENT_CODE_REVEAL_KEY;
    delete process.env.HARNESS_EVENT_CODE;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    process.env.HARNESS_AUDIT_LOG_PATH = originalAuditPath;
    if (originalSecret === undefined) {
      delete process.env.HARNESS_EVENT_CODE_SECRET;
    } else {
      process.env.HARNESS_EVENT_CODE_SECRET = originalSecret;
    }
    if (originalRevealKey === undefined) {
      delete process.env.HARNESS_EVENT_CODE_REVEAL_KEY;
    } else {
      process.env.HARNESS_EVENT_CODE_REVEAL_KEY = originalRevealKey;
    }
    if (originalSeedCode === undefined) {
      delete process.env.HARNESS_EVENT_CODE;
    } else {
      process.env.HARNESS_EVENT_CODE = originalSeedCode;
    }
    await rm(tempDir, { recursive: true, force: true });
  });

  it("writes a non-null ciphertext on issue when the reveal key is configured", async () => {
    process.env.HARNESS_EVENT_CODE_REVEAL_KEY = makeRevealKey();
    process.env.HARNESS_EVENT_CODE = "seed1-seed2-seed3";

    const mgmt = await import("./participant-access-management");
    const repoMod = await import("./participant-event-access-repository");
    const result = await mgmt.issueParticipantEventAccess({}, "inst-a");
    expect(result.ok).toBe(true);

    const saved = await new repoMod.FileParticipantEventAccessRepository().getActiveAccess("inst-a");
    expect(saved?.codeCiphertext).toBeTruthy();
    expect(saved?.codeCiphertext).toMatch(/^v1:/);
  });

  it("gates canRevealCurrent on ciphertext + key without leaking plaintext into SSR state", async () => {
    process.env.HARNESS_EVENT_CODE_REVEAL_KEY = makeRevealKey();
    process.env.HARNESS_EVENT_CODE = "seed1-seed2-seed3";

    const mgmt = await import("./participant-access-management");
    const issued = await mgmt.issueParticipantEventAccess({}, "inst-b");
    expect(issued.ok).toBe(true);

    const state = await mgmt.getFacilitatorParticipantAccessState("inst-b");
    expect(state.canRevealCurrent).toBe(true);
    // Plaintext must not ride along with SSR state — the reveal chip
    // fetches it via its own server action.
    expect(state.currentCode).toBeNull();
  });

  it("writes null ciphertext on issue when the reveal key is not configured", async () => {
    process.env.HARNESS_EVENT_CODE = "seed1-seed2-seed3";

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mgmt = await import("./participant-access-management");
    const repoMod = await import("./participant-event-access-repository");
    const result = await mgmt.issueParticipantEventAccess({}, "inst-c");
    expect(result.ok).toBe(true);

    const saved = await new repoMod.FileParticipantEventAccessRepository().getActiveAccess("inst-c");
    expect(saved?.codeCiphertext).toBeNull();
    warn.mockRestore();
  });
});
