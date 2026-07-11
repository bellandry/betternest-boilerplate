import { select } from '@clack/prompts';
import type { PackageManager } from '../flags';
import { unwrap } from './util';

export const PACKAGE_MANAGERS: PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun'];

export function isPackageManager(value: string): value is PackageManager {
  return (PACKAGE_MANAGERS as string[]).includes(value);
}

// Detect the pm that launched the CLI (via npm_config_user_agent), e.g. when
// run through `pnpm dlx` / `npx` / `yarn dlx` / `bunx`.
export function detectPackageManager(): PackageManager | undefined {
  const ua = process.env.npm_config_user_agent ?? '';
  const name = ua.split('/')[0];
  return isPackageManager(name) ? name : undefined;
}

export async function promptPackageManager(initial?: PackageManager): Promise<PackageManager> {
  const preferred = initial ?? detectPackageManager() ?? 'pnpm';
  const value = await select({
    message: 'Package manager?',
    initialValue: preferred,
    options: [
      { value: 'pnpm', label: 'pnpm', hint: 'recommended' },
      { value: 'npm', label: 'npm' },
      { value: 'yarn', label: 'yarn' },
      { value: 'bun', label: 'bun' },
    ],
  });
  return unwrap(value) as PackageManager;
}

export function installCommand(pm: PackageManager): string {
  return pm === 'yarn' ? 'yarn' : `${pm} install`;
}

// The command to run a package.json script (npm needs `run`).
export function runCommand(pm: PackageManager, script: string): string {
  return pm === 'npm' ? `npm run ${script}` : `${pm} ${script}`;
}
