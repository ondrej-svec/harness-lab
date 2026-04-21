import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GET } from "@/app/participant/artifact/[artifactId]/route";
import {
  FileArtifactRepository,
  setArtifactRepositoryForTests,
  type ArtifactRecord,
} from "@/lib/artifact-repository";
import {
  FileBlobStorage,
  setBlobStorageForTests,
} from "@/lib/blob-storage";
import { participantSessionCookieName } from "@/lib/event-access";
import {
  setEventAccessRepositoryForTests,
  type EventAccessRepository,
} from "@/lib/event-access-repository";
import { hashSecret } from "@/lib/participant-event-access-repository";
import type { ParticipantSessionRecord } from "@/lib/runtime-contracts";

class MemoryEventAccessRepository implements EventAccessRepository {
  constructor(private sessions: ParticipantSessionRecord[] = []) {}
  async listSessions(instanceId: string) {
    return structuredClone(this.sessions.filter((s) => s.instanceId === instanceId));
  }
  async findSession(instanceId: string, tokenHash: string) {
    return structuredClone(
      this.sessions.find((s) => s.instanceId === instanceId && s.tokenHash === tokenHash) ?? null,
    );
  }
  async findSessionByTokenHash(tokenHash: string) {
    return structuredClone(this.sessions.find((s) => s.tokenHash === tokenHash) ?? null);
  }
  async upsertSession(instanceId: string, session: ParticipantSessionRecord) {
    this.sessions = this.sessions.some((item) => item.tokenHash === session.tokenHash)
      ? this.sessions.map((item) =>
          item.instanceId === instanceId && item.tokenHash === session.tokenHash
            ? structuredClone(session)
            : item,
        )
      : [...this.sessions, structuredClone({ ...session, instanceId })];
  }
  async deleteSession(instanceId: string, tokenHash: string) {
    this.sessions = this.sessions.filter(
      (s) => !(s.instanceId === instanceId && s.tokenHash === tokenHash),
    );
  }
  async deleteExpiredSessions() {}
}

function seedSession(
  repo: MemoryEventAccessRepository,
  instanceId: string,
  rawToken: string,
) {
  const nowIso = new Date().toISOString();
  const futureIso = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  return repo.upsertSession(instanceId, {
    tokenHash: hashSecret(rawToken),
    instanceId,
    createdAt: nowIso,
    expiresAt: futureIso,
    lastValidatedAt: nowIso,
    absoluteExpiresAt: futureIso,
    participantId: null,
  });
}

function requestWithCookie(instanceId: string, artifactId: string, token?: string, query = "") {
  const headers: Record<string, string> = {};
  if (token) {
    headers.cookie = `${participantSessionCookieName}=${encodeURIComponent(token)}`;
  }
  return {
    request: new Request(`http://localhost/participant/artifact/${artifactId}${query}`, {
      headers,
    }),
    params: Promise.resolve({ artifactId }),
    instanceId,
  };
}

async function collectStream(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

describe("participant/artifact/[artifactId] route", () => {
  let tmpDir: string;
  let prevDataDir: string | undefined;
  let eventAccess: MemoryEventAccessRepository;
  let artifactRepo: FileArtifactRepository;
  let blobStorage: FileBlobStorage;

  const INSTANCE_A = "inst-a";
  const INSTANCE_B = "inst-b";
  const TOKEN_A = "token-a-".padEnd(32, "x");
  const TOKEN_B = "token-b-".padEnd(32, "x");

  let artifactA: ArtifactRecord;
  const bytesA = Buffer.from("<html><body>hello cohort A</body></html>", "utf8");

  beforeEach(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "participant-artifact-"));
    prevDataDir = process.env.HARNESS_DATA_DIR;
    process.env.HARNESS_DATA_DIR = tmpDir;

    eventAccess = new MemoryEventAccessRepository();
    artifactRepo = new FileArtifactRepository();
    blobStorage = new FileBlobStorage();

    setEventAccessRepositoryForTests(eventAccess);
    setArtifactRepositoryForTests(artifactRepo);
    setBlobStorageForTests(blobStorage);

    await seedSession(eventAccess, INSTANCE_A, TOKEN_A);
    await seedSession(eventAccess, INSTANCE_B, TOKEN_B);

    const uploaded = await blobStorage.upload({
      instanceId: INSTANCE_A,
      artifactId: "abc123",
      filename: "case-study.html",
      contentType: "text/html",
      data: bytesA,
    });
    artifactA = await artifactRepo.create({
      instanceId: INSTANCE_A,
      id: "abc123",
      blobKey: uploaded.blobKey,
      contentType: "text/html",
      filename: "case-study.html",
      byteSize: uploaded.byteSize,
      label: "Case study",
    });
  });

  afterEach(() => {
    setEventAccessRepositoryForTests(null);
    setArtifactRepositoryForTests(null);
    setBlobStorageForTests(null);
    if (prevDataDir === undefined) {
      delete process.env.HARNESS_DATA_DIR;
    } else {
      process.env.HARNESS_DATA_DIR = prevDataDir;
    }
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("serves the artifact to an authenticated participant of the same instance", async () => {
    const { request, params } = requestWithCookie(INSTANCE_A, artifactA.id, TOKEN_A);
    const response = await GET(request, { params });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html");
    expect(response.headers.get("content-length")).toBe(String(bytesA.byteLength));
    expect(response.headers.get("content-disposition")).toBe(
      'inline; filename="case-study.html"',
    );
    const csp = response.headers.get("content-security-policy") ?? "";
    expect(csp).toContain("sandbox");
    expect(csp).toContain("allow-scripts");
    // Must NOT carry allow-same-origin — that flag would re-attach the
    // document to the dashboard origin and defeat the isolation goal.
    expect(csp).not.toContain("allow-same-origin");
    // Must NOT pin default-src 'self' — it would block the inline
    // <style>/<script> blocks the uploaded artifacts rely on; the
    // sandbox itself is the security boundary.
    expect(csp).not.toContain("default-src");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("cache-control")).toContain("private");

    const body = await collectStream(response.body as ReadableStream<Uint8Array>);
    expect(body.equals(bytesA)).toBe(true);
  });

  it("returns 404 with no session (existence must not leak)", async () => {
    const { request, params } = requestWithCookie(INSTANCE_A, artifactA.id);
    const response = await GET(request, { params });
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
  });

  it("returns 404 for a cohort-B participant trying to read cohort-A's artifact", async () => {
    const { request, params } = requestWithCookie(INSTANCE_B, artifactA.id, TOKEN_B);
    const response = await GET(request, { params });
    expect(response.status).toBe(404);
  });

  it("returns 404 for a nonexistent artifactId under the session's own cohort", async () => {
    const { request, params } = requestWithCookie(INSTANCE_A, "does-not-exist", TOKEN_A);
    const response = await GET(request, { params });
    expect(response.status).toBe(404);
  });

  it("flips Content-Disposition to attachment when ?download=1 is present", async () => {
    const { request, params } = requestWithCookie(
      INSTANCE_A,
      artifactA.id,
      TOKEN_A,
      "?download=1",
    );
    const response = await GET(request, { params });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="case-study.html"',
    );
  });

  it("sanitises filename header against CRLF/quote injection", async () => {
    // Seed an artifact whose *stored* filename contains characters that
    // would break the header if echoed verbatim.
    const uploaded = await blobStorage.upload({
      instanceId: INSTANCE_A,
      artifactId: "weird-id",
      filename: "normal.pdf",
      contentType: "application/pdf",
      data: Buffer.from("%PDF-1.4"),
    });
    const mischievous = await artifactRepo.create({
      instanceId: INSTANCE_A,
      id: "weird-id",
      blobKey: uploaded.blobKey,
      contentType: "application/pdf",
      filename: 'bad"name\r\nX-Evil: yes.pdf',
      byteSize: uploaded.byteSize,
      label: "bad",
    });

    const { request, params } = requestWithCookie(INSTANCE_A, mischievous.id, TOKEN_A);
    const response = await GET(request, { params });
    expect(response.status).toBe(200);
    const disposition = response.headers.get("content-disposition") ?? "";
    expect(disposition).not.toContain("\r");
    expect(disposition).not.toContain("\n");
    expect(disposition).toMatch(/^inline; filename="bad_name__X-Evil: yes\.pdf"$/);
  });

  it("returns 404 when the blob is missing on disk even if the row exists", async () => {
    // Delete the blob but leave the row — simulates storage drift. The
    // route must fail closed (404), not crash.
    await blobStorage.delete(artifactA.blobKey);
    const { request, params } = requestWithCookie(INSTANCE_A, artifactA.id, TOKEN_A);
    const response = await GET(request, { params });
    expect(response.status).toBe(404);
  });

  it("preserves content-type from the artifact row (PDFs stay PDFs)", async () => {
    const pdfBytes = Buffer.from("%PDF-1.4\n...");
    const uploaded = await blobStorage.upload({
      instanceId: INSTANCE_A,
      artifactId: "pdf-1",
      filename: "handout.pdf",
      contentType: "application/pdf",
      data: pdfBytes,
    });
    await artifactRepo.create({
      instanceId: INSTANCE_A,
      id: "pdf-1",
      blobKey: uploaded.blobKey,
      contentType: "application/pdf",
      filename: "handout.pdf",
      byteSize: uploaded.byteSize,
      label: "Handout",
    });
    const { request, params } = requestWithCookie(INSTANCE_A, "pdf-1", TOKEN_A);
    const response = await GET(request, { params });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-length")).toBe(String(pdfBytes.byteLength));
  });
});
