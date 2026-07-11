import fs from 'node:fs';
import { confirm } from '@clack/prompts';
import { CancelError, CliError } from '../errors';
import { unwrap } from '../prompts/util';

function isNonEmptyDir(dir: string): boolean {
  if (!fs.existsSync(dir)) return false;
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) return true; // a file at that path is a conflict
  return fs.readdirSync(dir).length > 0;
}

// Guards against silent overwrite. Interactive: confirm (no => cancel).
// Non-interactive: hard error (never overwrite without an explicit human yes).
export async function validateTargetDir(
  targetDir: string,
  displayName: string,
  interactive: boolean,
): Promise<void> {
  if (!isNonEmptyDir(targetDir)) return;

  if (!interactive) {
    throw new CliError(
      `Target directory "${displayName}" already exists and is not empty.`,
      'Choose another name, remove the directory, or run interactively (without --yes) to confirm overwrite.',
    );
  }

  const proceed = unwrap(
    await confirm({
      message: `"${displayName}" already exists and is not empty. Overwrite its contents?`,
      initialValue: false,
    }),
  );

  if (!proceed) {
    throw new CancelError();
  }
}
