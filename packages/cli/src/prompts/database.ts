import { select, log } from '@clack/prompts';
import type { CatalogEntry } from '@repo/generator/catalog';
import { unwrap } from './util';

// Single-select DB. coming-soon entries are shown (as a roadmap preview) but
// selecting one re-prompts — clack has no native "disabled option", so we
// enforce availability in a loop.
export async function promptDatabase(entries: CatalogEntry[], initial?: string): Promise<string> {
  const options = entries.map((e) => ({
    value: e.id,
    label: e.status === 'coming-soon' ? `${e.label} — coming soon` : e.label,
    hint: e.status === 'coming-soon' ? 'not selectable yet' : undefined,
  }));

  const available = new Set(entries.filter((e) => e.status === 'available').map((e) => e.id));
  const firstAvailable = entries.find((e) => e.status === 'available')?.id;

  for (;;) {
    const chosen = unwrap(
      await select({
        message: 'Which database?',
        options,
        initialValue: initial && available.has(initial) ? initial : firstAvailable,
      }),
    ) as string;

    if (available.has(chosen)) return chosen;
    log.warn(`"${chosen}" is coming soon and can't be selected yet.`);
  }
}
