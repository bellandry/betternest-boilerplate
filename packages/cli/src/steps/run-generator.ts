import { spinner } from '@clack/prompts';
import { generateProject } from '@repo/generator';
import type { Selection } from '@repo/generator/types';
import { CliError } from '../errors';

// Thin wrapper around the generator — the only place the CLI touches assembly.
// All template knowledge stays in @repo/generator.
export async function runGenerator(
  selection: Selection,
  targetDir: string,
  templatesDir: string,
): Promise<void> {
  const s = spinner();
  s.start('Generating project');
  try {
    await generateProject(selection, targetDir, { templatesDir });
    s.stop('Project generated');
  } catch (err) {
    s.stop('Generation failed');
    throw new CliError(
      `Project generation failed: ${(err as Error).message}`,
      'Re-run with --verbose for the full stack trace.',
      err,
    );
  }
}
