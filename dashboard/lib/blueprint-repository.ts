import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import { parseBlueprintBodyShape } from "./schemas/blueprint-schema";
import { blueprintDefaultSeed } from "./blueprint-default-seed";

/**
 * A named reusable workshop blueprint. The runtime source of truth for
 * "what does a workshop look like" before an instance materialises from
 * it. Every blueprint edit goes through this repository — never through
 * direct SQL from request handlers.
 */
export type BlueprintRecord = {
  id: string;
  name: string;
  version: number;
  body: Record<string, unknown>;
  metadata: Record<string, unknown>;
  language: string;
  teamMode: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpsertBlueprintInput = {
  id: string;
  name?: string;
  body: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  language?: string;
  teamMode?: boolean;
  expectedVersion?: number;
};

export class BlueprintNotFoundError extends Error {
  constructor(id: string) {
    super(`blueprint '${id}' not found`);
    this.name = "BlueprintNotFoundError";
  }
}

export class BlueprintConflictError extends Error {
  constructor(id: string) {
    super(`blueprint version mismatch for '${id}'`);
    this.name = "BlueprintConflictError";
  }
}

export interface BlueprintRepository {
  list(): Promise<BlueprintRecord[]>;
  get(id: string): Promise<BlueprintRecord | null>;
  put(input: UpsertBlueprintInput): Promise<BlueprintRecord>;
  delete(id: string): Promise<void>;
  fork(sourceId: string, newId: string, newName?: string): Promise<BlueprintRecord>;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function nowIso() {
  return new Date().toISOString();
}

function extractLanguageFromBody(body: Record<string, unknown>): string | undefined {
  const value = body.language;
  return typeof value === "string" ? value : undefined;
}

function extractTeamModeFromBody(body: Record<string, unknown>): boolean | undefined {
  const value = body.teamMode;
  return typeof value === "boolean" ? value : undefined;
}

function normalizeFromShape(
  id: string,
  name: string,
  version: number,
  body: unknown,
  metadata: Record<string, unknown>,
  language: string,
  teamMode: boolean,
  createdAt: string,
  updatedAt: string,
): BlueprintRecord {
  const shaped = parseBlueprintBodyShape(body, { blueprintId: id });
  const resolvedBody = (shaped ?? (body as Record<string, unknown>)) ?? {};
  return {
    id,
    name,
    version,
    body: resolvedBody as Record<string, unknown>,
    metadata,
    language,
    teamMode,
    createdAt,
    updatedAt,
  };
}

// ---------------------------------------------------------------------------
// File-backed implementation
// ---------------------------------------------------------------------------

type StoredBlueprints = {
  version: 1;
  blueprints: BlueprintRecord[];
};

function createEmptyStore(): StoredBlueprints {
  return { version: 1, blueprints: [] };
}

function createSeededStore(): StoredBlueprints {
  const createdAt = nowIso();
  return {
    version: 1,
    blueprints: [
      {
        id: blueprintDefaultSeed.id,
        name: blueprintDefaultSeed.name,
        version: blueprintDefaultSeed.version,
        body: blueprintDefaultSeed.body,
        metadata: {},
        language: blueprintDefaultSeed.language,
        teamMode: blueprintDefaultSeed.teamMode,
        createdAt,
        updatedAt: createdAt,
      },
    ],
  };
}

export class FileBlueprintRepository implements BlueprintRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private get filePath() {
    return path.join(this.dataDir, "blueprints.json");
  }

  private async ensureFile(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    try {
      await readFile(this.filePath, "utf8");
    } catch {
      await writeFile(this.filePath, JSON.stringify(createSeededStore(), null, 2));
    }
  }

  private async readStore(): Promise<StoredBlueprints> {
    await this.ensureFile();
    const raw = await readFile(this.filePath, "utf8");
    const parsed = JSON.parse(raw) as StoredBlueprints;
    if (!parsed || !Array.isArray(parsed.blueprints)) {
      return createEmptyStore();
    }
    return parsed;
  }

  private async writeStore(store: StoredBlueprints): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    const temp = `${this.filePath}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(store, null, 2));
    await rename(temp, this.filePath);
  }

  async list(): Promise<BlueprintRecord[]> {
    const store = await this.readStore();
    return [...store.blueprints].sort((a, b) => a.id.localeCompare(b.id));
  }

  async get(id: string): Promise<BlueprintRecord | null> {
    const store = await this.readStore();
    return store.blueprints.find((row) => row.id === id) ?? null;
  }

  async put(input: UpsertBlueprintInput): Promise<BlueprintRecord> {
    const store = await this.readStore();
    const now = nowIso();
    const existing = store.blueprints.find((row) => row.id === input.id);

    if (existing) {
      if (
        typeof input.expectedVersion === "number" &&
        existing.version !== input.expectedVersion
      ) {
        throw new BlueprintConflictError(input.id);
      }
      const next: BlueprintRecord = {
        ...existing,
        name: input.name ?? existing.name,
        version: existing.version + 1,
        body: input.body,
        metadata: input.metadata ?? existing.metadata,
        language: input.language ?? extractLanguageFromBody(input.body) ?? existing.language,
        teamMode:
          input.teamMode ??
          extractTeamModeFromBody(input.body) ??
          existing.teamMode,
        updatedAt: now,
      };
      const blueprints = store.blueprints.map((row) => (row.id === input.id ? next : row));
      await this.writeStore({ ...store, blueprints });
      return next;
    }

    const created: BlueprintRecord = {
      id: input.id,
      name: input.name ?? input.id,
      version: 1,
      body: input.body,
      metadata: input.metadata ?? {},
      language: input.language ?? extractLanguageFromBody(input.body) ?? "en",
      teamMode:
        input.teamMode ??
        extractTeamModeFromBody(input.body) ??
        true,
      createdAt: now,
      updatedAt: now,
    };
    await this.writeStore({ ...store, blueprints: [...store.blueprints, created] });
    return created;
  }

  async delete(id: string): Promise<void> {
    const store = await this.readStore();
    const blueprints = store.blueprints.filter((row) => row.id !== id);
    if (blueprints.length === store.blueprints.length) return;
    await this.writeStore({ ...store, blueprints });
  }

  async fork(sourceId: string, newId: string, newName?: string): Promise<BlueprintRecord> {
    const source = await this.get(sourceId);
    if (!source) {
      throw new BlueprintNotFoundError(sourceId);
    }
    if (await this.get(newId)) {
      throw new Error(`blueprint '${newId}' already exists`);
    }
    return this.put({
      id: newId,
      name: newName ?? newId,
      body: source.body,
      metadata: source.metadata,
      language: source.language,
      teamMode: source.teamMode,
    });
  }
}

// ---------------------------------------------------------------------------
// Neon-backed implementation
// ---------------------------------------------------------------------------

type NeonBlueprintRow = {
  id: string;
  name: string;
  version: number;
  body: unknown;
  metadata: unknown;
  language: string;
  team_mode: boolean;
  created_at: string;
  updated_at: string;
};

function mapNeonRow(row: NeonBlueprintRow): BlueprintRecord {
  return normalizeFromShape(
    row.id,
    row.name,
    Number(row.version),
    row.body,
    (row.metadata as Record<string, unknown>) ?? {},
    row.language,
    Boolean(row.team_mode),
    new Date(row.created_at).toISOString(),
    new Date(row.updated_at).toISOString(),
  );
}

export class NeonBlueprintRepository implements BlueprintRepository {
  async list(): Promise<BlueprintRecord[]> {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT id, name, version, body, metadata, language, team_mode,
               created_at, updated_at
        FROM blueprints
        ORDER BY id ASC
      `,
      [],
    )) as NeonBlueprintRow[];
    return rows.map(mapNeonRow);
  }

  async get(id: string): Promise<BlueprintRecord | null> {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT id, name, version, body, metadata, language, team_mode,
               created_at, updated_at
        FROM blueprints
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    )) as NeonBlueprintRow[];
    const row = rows[0];
    return row ? mapNeonRow(row) : null;
  }

  async put(input: UpsertBlueprintInput): Promise<BlueprintRecord> {
    const sql = getNeonSql();
    const language = input.language ?? extractLanguageFromBody(input.body) ?? "en";
    const teamMode =
      input.teamMode ?? extractTeamModeFromBody(input.body) ?? true;
    const metadata = input.metadata ?? {};
    const name = input.name ?? input.id;

    if (typeof input.expectedVersion === "number") {
      const rows = (await sql.query(
        `
          UPDATE blueprints
          SET name = $2,
              version = version + 1,
              body = $3::jsonb,
              metadata = $4::jsonb,
              language = $5,
              team_mode = $6,
              updated_at = NOW()
          WHERE id = $1
            AND version = $7
          RETURNING id, name, version, body, metadata, language, team_mode,
                    created_at, updated_at
        `,
        [
          input.id,
          name,
          JSON.stringify(input.body),
          JSON.stringify(metadata),
          language,
          teamMode,
          input.expectedVersion,
        ],
      )) as NeonBlueprintRow[];
      const row = rows[0];
      if (!row) {
        throw new BlueprintConflictError(input.id);
      }
      return mapNeonRow(row);
    }

    const rows = (await sql.query(
      `
        INSERT INTO blueprints (id, name, version, body, metadata, language, team_mode)
        VALUES ($1, $2, 1, $3::jsonb, $4::jsonb, $5, $6)
        ON CONFLICT (id) DO UPDATE
          SET name = EXCLUDED.name,
              version = blueprints.version + 1,
              body = EXCLUDED.body,
              metadata = EXCLUDED.metadata,
              language = EXCLUDED.language,
              team_mode = EXCLUDED.team_mode,
              updated_at = NOW()
        RETURNING id, name, version, body, metadata, language, team_mode,
                  created_at, updated_at
      `,
      [
        input.id,
        name,
        JSON.stringify(input.body),
        JSON.stringify(metadata),
        language,
        teamMode,
      ],
    )) as NeonBlueprintRow[];
    const row = rows[0];
    if (!row) {
      throw new Error(`upsert for blueprint '${input.id}' returned no row`);
    }
    return mapNeonRow(row);
  }

  async delete(id: string): Promise<void> {
    const sql = getNeonSql();
    await sql.query(`DELETE FROM blueprints WHERE id = $1`, [id]);
  }

  async fork(sourceId: string, newId: string, newName?: string): Promise<BlueprintRecord> {
    const source = await this.get(sourceId);
    if (!source) {
      throw new BlueprintNotFoundError(sourceId);
    }
    if (await this.get(newId)) {
      throw new Error(`blueprint '${newId}' already exists`);
    }
    return this.put({
      id: newId,
      name: newName ?? newId,
      body: source.body,
      metadata: source.metadata,
      language: source.language,
      teamMode: source.teamMode,
    });
  }
}

// ---------------------------------------------------------------------------
// Repository resolution
// ---------------------------------------------------------------------------

let overrideRepository: BlueprintRepository | null = null;

export function getBlueprintRepository(): BlueprintRepository {
  if (overrideRepository) {
    return overrideRepository;
  }
  return getRuntimeStorageMode() === "neon"
    ? new NeonBlueprintRepository()
    : new FileBlueprintRepository();
}

export function setBlueprintRepositoryForTests(
  repository: BlueprintRepository | null,
): void {
  overrideRepository = repository;
}
