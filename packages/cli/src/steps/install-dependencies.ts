import { execSync } from 'node:child_process';
import { spinner, log } from '@clack/prompts';
import type { PackageManager } from '../flags';
import { installCommand } from '../prompts/package-manager';

export interface InstallResult {
  installed: boolean;
}

// Runs the package manager's install in the generated project. Network / tool
// failures are NON-fatal: we surface an actionable message + the exact command
// to re-run manually, then let the flow finish (never a raw stack trace).
export function installDependencies(
  targetDir: string,
  pm: PackageManager,
  doInstall: boolean,
): InstallResult {
  if (!doInstall) return { installed: false };

  const cmd = installCommand(pm);
  const s = spinner();
  s.start(`Installing dependencies (${cmd})`);
  try {
    execSync(cmd, { cwd: targetDir, stdio: 'ignore' });
    s.stop('Dependencies installed');
    return { installed: true };
  } catch {
    s.stop('Dependency installation failed', 1);
    log.error(
      `Could not install dependencies. Finish manually:\n  cd ${targetDir}\n  ${cmd}`,
    );
    return { installed: false };
  }
}
