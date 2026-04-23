import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  setAuditLogRepositoryForTests,
  type AuditLogRepository,
} from "@/lib/audit-log-repository";
import {
  setFacilitatorAuthServiceForTests,
  type FacilitatorAuthService,
} from "@/lib/facilitator-auth-service";
import {
  FileBlueprintRepository,
  setBlueprintRepositoryForTests,
} from "@/lib/blueprint-repository";
import type { AuditLogRecord } from "@/lib/runtime-contracts";

export class MemoryAuditLogRepository implements AuditLogRepository {
  public records: AuditLogRecord[] = [];
  async append(record: AuditLogRecord) {
    this.records.push(record);
  }
  async deleteOlderThan(instanceId: string, olderThan: string) {
    void instanceId;
    void olderThan;
  }
}

export class AllowFacilitatorAuthService implements FacilitatorAuthService {
  async hasValidRequestCredentials() {
    return true;
  }
  async hasValidSession() {
    return false;
  }
}

export function jsonRequest(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      host: "localhost",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export type BlueprintTestEnv = {
  audit: MemoryAuditLogRepository;
  tmpDir: string;
  prevDataDir: string | undefined;
};

export function setupBlueprintTestEnv(label: string): BlueprintTestEnv {
  const tmpDir = mkdtempSync(join(tmpdir(), `${label}-`));
  const prevDataDir = process.env.HARNESS_DATA_DIR;
  process.env.HARNESS_DATA_DIR = tmpDir;

  const audit = new MemoryAuditLogRepository();
  setBlueprintRepositoryForTests(new FileBlueprintRepository());
  setAuditLogRepositoryForTests(audit);
  setFacilitatorAuthServiceForTests(new AllowFacilitatorAuthService());

  return { audit, tmpDir, prevDataDir };
}

export function teardownBlueprintTestEnv(env: BlueprintTestEnv) {
  setBlueprintRepositoryForTests(null);
  setAuditLogRepositoryForTests(null);
  setFacilitatorAuthServiceForTests(null);
  if (env.prevDataDir === undefined) {
    delete process.env.HARNESS_DATA_DIR;
  } else {
    process.env.HARNESS_DATA_DIR = env.prevDataDir;
  }
  rmSync(env.tmpDir, { recursive: true, force: true });
}
