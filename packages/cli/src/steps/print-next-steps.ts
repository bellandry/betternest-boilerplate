import { outro, note } from '@clack/prompts';
import type { PackageManager } from '../flags';
import { installCommand, runCommand } from '../prompts/package-manager';

export interface NextStepsInput {
  projectName: string;
  relativeDir: string; // what to `cd` into
  pm: PackageManager;
  installed: boolean;
  hasOAuth: boolean;
}

export function printNextSteps(input: NextStepsInput): void {
  const { relativeDir, pm, installed, hasOAuth } = input;

  const lines: string[] = [`cd ${relativeDir}`];
  if (!installed) lines.push(installCommand(pm));

  // Env setup (root .env feeds docker-compose; per-app .env for the runtime).
  lines.push('cp .env.example .env');
  lines.push('cp apps/api/.env.example apps/api/.env');
  lines.push('cp apps/web/.env.example apps/web/.env');
  lines.push('# set BETTER_AUTH_SECRET in apps/api/.env (openssl rand -base64 32)');
  lines.push('docker compose up -d');
  lines.push(runCommand(pm, 'db:push'));
  lines.push(runCommand(pm, 'dev'));

  note(lines.join('\n'), 'Next steps');

  if (hasOAuth) {
    note(
      'Google/GitHub need OAuth credentials. See the "Auth setup" section in the\n' +
        'generated README.md for the exact callback URLs and env vars.',
      'OAuth',
    );
  }

  outro('Done. Happy building — auth, cross-app, without the CORS pain.');
}
