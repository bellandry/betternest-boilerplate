import type { ProviderKind, TemplateStatus } from './types';
import {
  DEFAULT_TEMPLATES_DIR,
  listTemplateIds,
  loadDbManifest,
  loadProviderManifest,
} from './manifests';

// A template choice as surfaced to the CLI. The CLI renders these into prompts;
// it holds NO template knowledge of its own.
export interface CatalogEntry {
  id: string;
  label: string;
  status: TemplateStatus;
  kind?: ProviderKind; // auth providers only
  database?: string; // SQL-engine (PostgreSQL, MySQL, SQLite)
  ormName?: string; // ORM name (Prisma, Drizzle)
}

export interface CatalogOptions {
  templatesDir?: string;
}

// All database-engine choices (deduplicated across ORMs). The CLI's first-phase
// prompt shows one entry per engine, e.g. SQLite / PostgreSQL / MySQL.
export interface DbEngineEntry {
  id: string;
  label: string;
  available: boolean; // at least one ORM combo is selectable
}

export async function listDbEngines(
  opts: CatalogOptions = {},
): Promise<DbEngineEntry[]> {
  const dbCombos = await listDbCombos(opts);
  const seen = new Map<string, DbEngineEntry>();
  for (const combo of dbCombos) {
    const key = combo.database ?? combo.id;
    const hasAvailable = combo.status === 'available';
    if (seen.has(key)) {
      if (hasAvailable) seen.get(key)!.available = true;
    } else {
      seen.set(key, {
        id: key.toLowerCase().replace(/\s+/g, '-'),
        label: combo.database ?? combo.label,
        available: hasAvailable,
      });
    }
  }
  return [...seen.values()].sort((a, b) => {
    // SQLite first (the default), then alphabetical.
    if (a.id === 'sqlite') return -1;
    if (b.id === 'sqlite') return 1;
    return a.label.localeCompare(b.label);
  });
}

// All ORM+database combos. Used by the CLI's second-phase prompt (filtered by
// the engine chosen in phase one) and by --db flag validation.
export async function listDbCombos(
  opts: CatalogOptions = {},
): Promise<CatalogEntry[]> {
  const templatesDir = opts.templatesDir ?? DEFAULT_TEMPLATES_DIR;
  const ids = listTemplateIds(templatesDir, 'db');
  const entries: CatalogEntry[] = [];
  for (const id of ids) {
    const m = await loadDbManifest(templatesDir, id);
    entries.push({
      id: m.id,
      label: m.label,
      status: m.status ?? 'available',
      database: m.database,
      ormName: m.ormName,
    });
  }
  return entries.sort(byAvailableThenLabel);
}

// Kept for backwards compat with existing callers that just want the flat list
// (e.g. --db flag validation).
export async function listDatabases(
  opts: CatalogOptions = {},
): Promise<CatalogEntry[]> {
  return listDbCombos(opts);
}

// All auth providers. Folders prefixed with `_` are internal/disabled and are
// never surfaced (Phase-1 convention, e.g. _placeholder-discord).
export async function listAuthProviders(opts: CatalogOptions = {}): Promise<CatalogEntry[]> {
  const templatesDir = opts.templatesDir ?? DEFAULT_TEMPLATES_DIR;
  const ids = listTemplateIds(templatesDir, 'auth-providers').filter((id) => !id.startsWith('_'));
  const entries: CatalogEntry[] = [];
  for (const id of ids) {
    const m = await loadProviderManifest(templatesDir, id);
    entries.push({
      id: m.id,
      label: m.label,
      status: m.status ?? 'available',
      kind: m.kind,
    });
  }
  return entries.sort(byAvailableThenLabel);
}

function byAvailableThenLabel(a: CatalogEntry, b: CatalogEntry): number {
  if (a.status !== b.status) return a.status === 'available' ? -1 : 1;
  return a.label.localeCompare(b.label);
}
