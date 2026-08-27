import type { PackageManager } from '../flags';

// The generated project is a pnpm workspace (`pnpm-workspace.yaml`). Other
// package managers can still run the CLI itself via npx/yarn dlx/bunx, but they
// are not supported for installing or running the generated monorepo.
export const PACKAGE_MANAGERS: PackageManager[] = ['pnpm'];

export function isPackageManager(value: string): value is PackageManager {
  return value === 'pnpm';
}

export function detectPackageManager(): PackageManager | undefined {
  const ua = process.env.npm_config_user_agent ?? '';
  return ua.startsWith('pnpm/') ? 'pnpm' : undefined;
}

export function promptPackageManager(initial?: PackageManager): PackageManager {
  return initial ?? 'pnpm';
}

export function installCommand(_pm: PackageManager): string {
  return 'pnpm install';
}

export function runCommand(_pm: PackageManager, script: string): string {
  return `pnpm ${script}`;
}
