import path from 'node:path';
import { intro, note, log, cancel } from '@clack/prompts';
import { parseFlags, HELP_TEXT, type RawFlags } from './flags';
import { isCancelError, isCliError } from './errors';
import { resolvePlan } from './resolve-selection';
import { validateTargetDir } from './steps/validate-target-dir';
import { runGenerator } from './steps/run-generator';
import { initGit } from './steps/init-git';
import { installDependencies } from './steps/install-dependencies';
import { printNextSteps } from './steps/print-next-steps';

// Templates are copied next to this bundle at build time (see tsup.config.ts).
const TEMPLATES_DIR = path.join(__dirname, 'templates');

async function run(flags: RawFlags): Promise<void> {
  intro('create-betternest-app — Next.js + NestJS + Better Auth, zero CORS/cookie/trustedOrigins pain');

  const plan = await resolvePlan(flags, TEMPLATES_DIR);
  const targetDir = path.resolve(process.cwd(), plan.selection.projectName);

  await validateTargetDir(targetDir, plan.selection.projectName, !flags.yes);

  note(
    [
      `Project    ${plan.selection.projectName}`,
      `Database   ${plan.selection.db}`,
      `Auth       ${plan.selection.authProviders.join(', ')}`,
      `Manager    ${plan.pm}`,
      `Install    ${plan.doInstall ? 'yes' : 'no'}`,
      `Git init   ${plan.doGit ? 'yes' : 'no'}`,
    ].join('\n'),
    'Summary',
  );

  await runGenerator(plan.selection, targetDir, TEMPLATES_DIR);
  initGit(targetDir, plan.doGit);
  const { installed } = installDependencies(targetDir, plan.pm, plan.doInstall);

  const hasOAuth = plan.selection.authProviders.some((id) => id !== 'email-password');
  printNextSteps({
    projectName: plan.selection.projectName,
    relativeDir: plan.selection.projectName,
    pm: plan.pm,
    installed,
    hasOAuth,
  });
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));
  if (flags.help) {
    process.stdout.write(`${HELP_TEXT}\n`);
    return;
  }
  await run(flags);
}

// ── The single, centralized exit handler. No process.exit() lives anywhere
// else in the codebase; every predictable failure is a CliError. ──
main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');

    if (isCancelError(err)) {
      cancel('Operation cancelled.');
      process.exit(130);
    }

    if (isCliError(err)) {
      log.error(err.message);
      if (err.hint) log.info(err.hint);
      if (verbose && err.cause) console.error(err.cause);
    } else {
      log.error(`Unexpected error: ${(err as Error).message ?? String(err)}`);
      log.info(
        'This looks like a bug. Please open an issue:\n  https://github.com/anomalyco/betternest/issues',
      );
      if (verbose) console.error(err);
    }
    process.exit(1);
  });
