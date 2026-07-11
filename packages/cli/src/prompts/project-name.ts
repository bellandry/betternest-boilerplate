import { text } from '@clack/prompts';
import { unwrap } from './util';

// Must be a valid npm package `name` AND a safe folder name.
const NPM_NAME = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export function validateProjectName(name: string): string | undefined {
  const v = name.trim();
  if (!v) return 'Project name is required.';
  if (v.length > 214) return 'Project name must be 214 characters or fewer.';
  if (!NPM_NAME.test(v)) {
    return 'Use lowercase letters, digits and dashes only (no spaces or special characters).';
  }
  return undefined;
}

export async function promptProjectName(initial?: string): Promise<string> {
  const value = await text({
    message: 'Project name?',
    placeholder: 'my-app',
    initialValue: initial,
    validate: (v) => validateProjectName(v ?? ''),
  });
  return unwrap(value).trim();
}
