import { confirm } from '@clack/prompts';
import { listAuthProviders, listDatabases, type CatalogEntry } from '@repo/generator/catalog';
import { DEFAULT_SELECTION } from '@repo/generator/default-selection';
import type { Selection } from '@repo/generator/types';
import { CliError } from './errors';
import type { PackageManager, RawFlags } from './flags';
import { validateProjectName } from './prompts/project-name';
import { promptProjectName } from './prompts/project-name';
import { promptDatabase } from './prompts/database';
import { promptAuthProviders, REQUIRED_PROVIDER } from './prompts/auth-providers';
import {
  detectPackageManager,
  isPackageManager,
  PACKAGE_MANAGERS,
  promptPackageManager,
} from './prompts/package-manager';
import { unwrap } from './prompts/util';

export interface ResolvedPlan {
  selection: Selection;
  pm: PackageManager;
  doInstall: boolean;
  doGit: boolean;
}

const availableIds = (entries: CatalogEntry[]) =>
  entries.filter((e) => e.status === 'available').map((e) => e.id);

function assertValidDb(id: string, dbs: CatalogEntry[]): void {
  const match = dbs.find((d) => d.id === id);
  const valid = availableIds(dbs);
  if (!match) {
    throw new CliError(`Unknown database "${id}".`, `Valid values: ${valid.join(', ')}`);
  }
  if (match.status === 'coming-soon') {
    throw new CliError(`Database "${id}" is coming soon and not selectable yet.`, `Valid values: ${valid.join(', ')}`);
  }
}

function assertValidAuth(ids: string[], providers: CatalogEntry[]): void {
  const valid = availableIds(providers);
  for (const id of ids) {
    const match = providers.find((p) => p.id === id);
    if (!match) {
      throw new CliError(`Unknown auth provider "${id}".`, `Valid values: ${valid.join(', ')}`);
    }
    if (match.status === 'coming-soon') {
      throw new CliError(`Auth provider "${id}" is coming soon and not selectable yet.`, `Valid values: ${valid.join(', ')}`);
    }
  }
}

// Guarantees the no-config fallback is present when it exists in the catalog.
function ensureRequired(ids: string[], providers: CatalogEntry[]): string[] {
  const hasRequired = availableIds(providers).includes(REQUIRED_PROVIDER);
  if (hasRequired && !ids.includes(REQUIRED_PROVIDER)) {
    return [REQUIRED_PROVIDER, ...ids];
  }
  return ids;
}

function resolvePm(flagPm: string | undefined): PackageManager {
  if (flagPm) {
    if (!isPackageManager(flagPm)) {
      throw new CliError(`Unknown package manager "${flagPm}".`, `Valid values: ${PACKAGE_MANAGERS.join(', ')}`);
    }
    return flagPm;
  }
  return detectPackageManager() ?? 'pnpm';
}

// Produces the final plan from flags + catalog, prompting only when needed.
// Provided flags are validated eagerly in BOTH modes so a bad value fails fast.
export async function resolvePlan(flags: RawFlags, templatesDir: string): Promise<ResolvedPlan> {
  const dbs = await listDatabases({ templatesDir });
  const providers = await listAuthProviders({ templatesDir });

  if (flags.projectName !== undefined) {
    const err = validateProjectName(flags.projectName);
    if (err) throw new CliError(`Invalid project name "${flags.projectName}": ${err}`);
  }
  if (flags.db !== undefined) assertValidDb(flags.db, dbs);
  if (flags.auth !== undefined) {
    if (flags.auth.length === 0) throw new CliError('--auth needs at least one provider id.');
    assertValidAuth(flags.auth, providers);
  }
  const pm = resolvePm(flags.pm);

  // ── Non-interactive ──
  if (flags.yes) {
    const selection: Selection = {
      projectName: flags.projectName ?? DEFAULT_SELECTION.projectName,
      db: flags.db ?? DEFAULT_SELECTION.db,
      authProviders: ensureRequired(flags.auth ?? DEFAULT_SELECTION.authProviders, providers),
    };
    return {
      selection,
      pm,
      doInstall: flags.install ?? true,
      doGit: flags.git ?? true,
    };
  }

  // ── Interactive ── (provided flags pre-fill; positional name skips its prompt)
  const projectName = flags.projectName ?? (await promptProjectName());
  const db = await promptDatabase(dbs, flags.db ?? DEFAULT_SELECTION.db);
  const authProviders = ensureRequired(
    await promptAuthProviders(providers, flags.auth ?? DEFAULT_SELECTION.authProviders),
    providers,
  );
  const chosenPm = await promptPackageManager(flags.pm ? (pm as PackageManager) : undefined);
  const doInstall =
    flags.install ??
    unwrap(await confirm({ message: 'Install dependencies now?', initialValue: true }));

  return {
    selection: { projectName, db, authProviders },
    pm: chosenPm,
    doInstall,
    doGit: flags.git ?? true,
  };
}
