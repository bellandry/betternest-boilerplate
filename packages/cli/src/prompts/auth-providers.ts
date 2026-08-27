import { multiselect, log } from '@clack/prompts';
import type { CatalogEntry } from '@repo/generator/catalog';
import { unwrap } from './util';

// The no-OAuth-config fallback: always present so a generated app can always
// authenticate without external credentials.
export const REQUIRED_PROVIDER = 'email-password';

export async function promptAuthProviders(
  entries: CatalogEntry[],
  initial?: string[],
  config: { includeRequired?: boolean; allowEmpty?: boolean } = {},
): Promise<string[]> {
  const includeRequired = config.includeRequired ?? true;
  const availableEntries = entries.filter((e) => includeRequired || e.id !== REQUIRED_PROVIDER);
  const availableIds = new Set(
    availableEntries.filter((e) => e.status === 'available').map((e) => e.id),
  );
  const hasRequired = includeRequired && availableIds.has(REQUIRED_PROVIDER);

  const options = availableEntries.map((e) => ({
    value: e.id,
    label: e.status === 'coming-soon' ? `${e.label} — coming soon` : e.label,
    hint:
      e.status === 'coming-soon'
        ? 'not selectable yet'
        : e.id === REQUIRED_PROVIDER
          ? 'always included'
          : undefined,
  }));

  const base = (initial && initial.length ? initial : [...availableIds]).filter((id) =>
    availableIds.has(id),
  );
  const initialValues =
    hasRequired && !base.includes(REQUIRED_PROVIDER) ? [REQUIRED_PROVIDER, ...base] : base;

  for (;;) {
    const chosen = unwrap(
      await multiselect({
        message: 'Authentication methods? (space to toggle)',
        options,
        initialValues,
        required: !config.allowEmpty,
      }),
    ) as string[];

    const comingSoon = chosen.filter((id) => !availableIds.has(id));
    if (comingSoon.length > 0) {
      log.warn(`${comingSoon.join(', ')} — coming soon, can't be selected yet.`);
      continue;
    }

    if (hasRequired && !chosen.includes(REQUIRED_PROVIDER)) {
      log.info(`${REQUIRED_PROVIDER} is always included as the no-config fallback.`);
      return [REQUIRED_PROVIDER, ...chosen];
    }
    return chosen;
  }
}
