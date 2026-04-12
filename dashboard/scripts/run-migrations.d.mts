export type MigrationSnapshot = {
  tables: Set<string>;
  columns: Map<string, Set<string>>;
};

export function sortMigrationFilenames(filenames: string[]): string[];

export function detectPreviouslyAppliedMigrations(snapshot: MigrationSnapshot): string[];
