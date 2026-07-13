import { select, log } from '@clack/prompts';
import type { CatalogEntry, DbEngineEntry } from '@repo/generator/catalog';
import { unwrap } from './util';

// Phase 1: pick the SQL engine (PostgreSQL, MySQL, SQLite). Only engines that
// have at least one available ORM combo can be selected.
export async function promptDbEngine(
  engines: DbEngineEntry[],
  initial?: string,
): Promise<string> {
  const available = new Set(engines.filter((e) => e.available).map((e) => e.id));
  const options = engines.map((e) => ({
    value: e.id,
    label: e.available ? e.label : `${e.label} — coming soon`,
    hint: e.available ? undefined : 'no selectable ORM yet',
  }));
  const firstAvailable = engines.find((e) => e.available)?.id;

  for (;;) {
    const chosen = unwrap(
      await select({
        message: 'Which database engine?',
        options,
        initialValue:
          initial && available.has(initial) ? initial : firstAvailable,
      }),
    ) as string;

    if (available.has(chosen)) return chosen;
    log.warn(`"${chosen}" has no selectable ORM yet.`);
  }
}

// Phase 2: given the chosen engine, pick an ORM+engine combo. Entries that
// don't match the engine are excluded from the prompt entirely.
export async function promptDbCombo(
  entries: CatalogEntry[],
  engine: string,
  initial?: string,
): Promise<string> {
  // Match by engine id (e.g. "sqlite") against the database field (e.g.
  // "SQLite") — case-insensitive.
  const filtered = entries.filter(
    (e) => (e.database ?? '').toLowerCase().replace(/\s+/g, '-') === engine,
  );

  if (filtered.length === 0) {
    throw new Error(`No database combos found for engine "${engine}".`);
  }

  const available = new Set(
    filtered.filter((e) => e.status === 'available').map((e) => e.id),
  );
  const options = filtered.map((e) => ({
    value: e.id,
    label:
      e.status === 'coming-soon' ? `${e.label} — coming soon` : e.label,
    hint: e.status === 'coming-soon' ? 'not selectable yet' : undefined,
  }));
  const firstAvailable = filtered.find((e) => e.status === 'available')?.id;

  for (;;) {
    const chosen = unwrap(
      await select({
        message: 'Which ORM?',
        options,
        initialValue:
          initial && available.has(initial) ? initial : firstAvailable,
      }),
    ) as string;

    if (available.has(chosen)) return chosen;
    log.warn(`"${chosen}" is coming soon and can't be selected yet.`);
  }
}

// Kept for backwards compat — the old single-phase prompt that just asks
// "Which database?" from a flat list. No longer used by the interactive path
// but kept for potential direct callers.
export async function promptDatabase(
  entries: CatalogEntry[],
  initial?: string,
): Promise<string> {
  const options = entries.map((e) => ({
    value: e.id,
    label:
      e.status === 'coming-soon' ? `${e.label} — coming soon` : e.label,
    hint: e.status === 'coming-soon' ? 'not selectable yet' : undefined,
  }));

  const available = new Set(
    entries.filter((e) => e.status === 'available').map((e) => e.id),
  );
  const firstAvailable = entries.find((e) => e.status === 'available')?.id;

  for (;;) {
    const chosen = unwrap(
      await select({
        message: 'Which database?',
        options,
        initialValue:
          initial && available.has(initial) ? initial : firstAvailable,
      }),
    ) as string;

    if (available.has(chosen)) return chosen;
    log.warn(`"${chosen}" is coming soon and can't be selected yet.`);
  }
}
