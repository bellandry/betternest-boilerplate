import { outro, note } from '@clack/prompts';
import type { PackageManager } from '../flags';
import { installCommand, runCommand } from '../prompts/package-manager';

export interface NextStepsInput {
  projectName: string;
  relativeDir: string; // what to `cd` into
  pm: PackageManager;
  db: string;
  installed: boolean;
  hasOAuth: boolean;
}

export function printNextSteps(input: NextStepsInput): void {
  const { relativeDir, pm, db, installed, hasOAuth } = input;
  const needsDocker = !db.endsWith('-sqlite');

  const lines: string[] = [`cd ${relativeDir}`];
  if (!installed) lines.push(installCommand(pm));

  // Shared runtime settings live in root .env; Next.js-only settings live in
  // apps/web/.env because Next resolves env files relative to the app root.
  lines.push('cp .env.example .env');
  lines.push('cp apps/web/.env.example apps/web/.env');
  lines.push('# set BETTER_AUTH_SECRET in .env (openssl rand -base64 32)');
  if (needsDocker) lines.push('docker compose up -d');
  else lines.push('# SQLite selected: Docker is not required');
  lines.push(runCommand(pm, 'db:push'));
  lines.push(runCommand(pm, 'dev'));
  lines.push('');
  lines.push('# in another terminal, verify the generated project:');
  lines.push('curl -fsS http://localhost:3000/api/health');
  lines.push('curl -fsS http://localhost:3000/api/health/db');

  note(lines.join('\n'), 'Next steps');

  if (hasOAuth) {
    note(
      'Google/GitHub need OAuth credentials. See the "Auth setup" section in the\n' +
        'generated README.md for the exact callback URLs and env vars.',
      'OAuth',
    );
  }

  outro(
    'Generated. Your first success signal is a 200 response from /api/health and /api/health/db. Happy building — auth, cross-app, without the CORS pain.',
  );
}
