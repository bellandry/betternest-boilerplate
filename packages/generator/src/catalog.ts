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
}

export interface CatalogOptions {
  templatesDir?: string;
}

// All database choices, e.g. prisma (available), drizzle (coming-soon).
export async function listDatabases(opts: CatalogOptions = {}): Promise<CatalogEntry[]> {
  const templatesDir = opts.templatesDir ?? DEFAULT_TEMPLATES_DIR;
  const ids = listTemplateIds(templatesDir, 'db');
  const entries: CatalogEntry[] = [];
  for (const id of ids) {
    const m = await loadDbManifest(templatesDir, id);
    entries.push({ id: m.id, label: m.label, status: m.status ?? 'available' });
  }
  return entries.sort(byAvailableThenLabel);
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
