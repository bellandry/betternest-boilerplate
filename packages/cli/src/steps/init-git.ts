import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { log } from '@clack/prompts';

// Is any ancestor directory already a git repo? Avoids creating a nested repo.
function insideExistingRepo(startDir: string): boolean {
  let dir = startDir;
  for (;;) {
    if (fs.existsSync(path.join(dir, '.git'))) return true;
    const parent = path.dirname(dir);
    if (parent === dir) return false;
    dir = parent;
  }
}

export function initGit(targetDir: string, doGit: boolean): void {
  if (!doGit) return;

  if (insideExistingRepo(path.dirname(targetDir))) {
    log.info('Skipped git init (already inside a git repository).');
    return;
  }

  try {
    const opts = { cwd: targetDir, stdio: 'ignore' as const };
    execSync('git init', opts);
    execSync('git add -A', opts);
    execSync('git commit -m "chore: initial commit from create-betternest-app"', opts);
    log.success('Initialized a git repository.');
  } catch {
    // Git missing or commit failed — non-fatal, the project is still valid.
    log.warn('Could not initialize git (is git installed?). Skipping.');
  }
}
