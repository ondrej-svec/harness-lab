import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { hashSecret } from "./participant-event-access-repository";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { FacilitatorIdentityRecord, FacilitatorIdentityRepository } from "./runtime-contracts";

type StoredFacilitatorIdentities = {
  items: FacilitatorIdentityRecord[];
};

function getSampleFacilitatorIdentity(): FacilitatorIdentityRecord {
  return {
    id: "facilitator-sample",
    username: "facilitator",
    displayName: "Sample Facilitator",
    email: "facilitator@example.com",
    passwordHash: hashSecret("secret"),
    authSubject: null,
    status: "active",
  };
}

class FileFacilitatorIdentityRepository implements FacilitatorIdentityRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");
  private readonly identitiesPath =
    process.env.HARNESS_FACILITATOR_IDENTITIES_PATH ?? path.join(this.dataDir, "facilitator-identities.json");

  private async ensureFile() {
    await mkdir(path.dirname(this.identitiesPath), { recursive: true });
    try {
      await readFile(this.identitiesPath, "utf8");
    } catch {
      await writeFile(
        this.identitiesPath,
        JSON.stringify({ items: [getSampleFacilitatorIdentity()] satisfies FacilitatorIdentityRecord[] }, null, 2),
      );
    }
  }

  private async readItems() {
    await this.ensureFile();
    const raw = await readFile(this.identitiesPath, "utf8");
    return (JSON.parse(raw) as StoredFacilitatorIdentities).items;
  }

  async findByUsername(username: string) {
    const items = await this.readItems();
    return items.find((item) => item.username === username) ?? null;
  }

  async findBySubject(subject: string) {
    const items = await this.readItems();
    return items.find((item) => item.authSubject === subject) ?? null;
  }
}

class NeonFacilitatorIdentityRepository implements FacilitatorIdentityRepository {
  private async ensureSeedIdentity() {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO facilitator_identities (id, username, email, display_name, password_hash, auth_subject, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        "facilitator-sample",
        "facilitator",
        "facilitator@example.com",
        "Sample Facilitator",
        hashSecret("secret"),
        null,
        "active",
      ],
    );
  }

  async findByUsername(username: string) {
    const sql = getNeonSql();
    await this.ensureSeedIdentity();
    const rows = (await sql.query(
      `
        SELECT id, username, email, display_name, password_hash, auth_subject, status
        FROM facilitator_identities
        WHERE username = $1
        LIMIT 1
      `,
      [username],
    )) as {
      id: string;
      username: string;
      email: string;
      display_name: string;
      password_hash: string | null;
      auth_subject: string | null;
      status: "active" | "disabled";
    }[];

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      displayName: row.display_name,
      passwordHash: row.password_hash,
      authSubject: row.auth_subject,
      status: row.status,
    };
  }

  async findBySubject(subject: string) {
    const sql = getNeonSql();
    await this.ensureSeedIdentity();
    const rows = (await sql.query(
      `
        SELECT id, username, email, display_name, password_hash, auth_subject, status
        FROM facilitator_identities
        WHERE auth_subject = $1
        LIMIT 1
      `,
      [subject],
    )) as {
      id: string;
      username: string;
      email: string;
      display_name: string;
      password_hash: string | null;
      auth_subject: string | null;
      status: "active" | "disabled";
    }[];

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      displayName: row.display_name,
      passwordHash: row.password_hash,
      authSubject: row.auth_subject,
      status: row.status,
    };
  }
}

export function getFacilitatorIdentityRepository(): FacilitatorIdentityRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon"
    ? new NeonFacilitatorIdentityRepository()
    : new FileFacilitatorIdentityRepository();
}

let overrideRepository: FacilitatorIdentityRepository | null = null;

export function setFacilitatorIdentityRepositoryForTests(repository: FacilitatorIdentityRepository | null) {
  overrideRepository = repository;
}
