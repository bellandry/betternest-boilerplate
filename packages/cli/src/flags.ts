import { CliError } from './errors';

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

// Raw, syntactically-parsed flags. Semantic validation (does this db exist?)
// happens later against the generator catalog.
export interface RawFlags {
  projectName?: string; // positional argument
  db?: string;
  auth?: string[];
  pm?: string;
  install?: boolean; // undefined = ask; false via --no-install
  git?: boolean; // undefined = ask; false via --no-git
  yes: boolean;
  verbose: boolean;
  help: boolean;
}

const VALUE_FLAGS = new Set(['db', 'auth', 'pm']);

// Supports `--key=value`, `--key value`, `--flag`, `--no-flag`, `-y`, `-v`, `-h`.
export function parseFlags(argv: string[]): RawFlags {
  const flags: RawFlags = { yes: false, verbose: false, help: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '-y' || arg === '--yes') {
      flags.yes = true;
      continue;
    }
    if (arg === '-v' || arg === '--verbose') {
      flags.verbose = true;
      continue;
    }
    if (arg === '-h' || arg === '--help') {
      flags.help = true;
      continue;
    }
    if (arg === '--no-install') {
      flags.install = false;
      continue;
    }
    if (arg === '--no-git') {
      flags.git = false;
      continue;
    }
    if (arg === '--install') {
      flags.install = true;
      continue;
    }
    if (arg === '--git') {
      flags.git = true;
      continue;
    }

    if (arg.startsWith('--')) {
      const body = arg.slice(2);
      let key: string;
      let value: string | undefined;

      const eq = body.indexOf('=');
      if (eq !== -1) {
        key = body.slice(0, eq);
        value = body.slice(eq + 1);
      } else {
        key = body;
        // Space form: consume next token as value if this is a known value flag.
        if (VALUE_FLAGS.has(key) && i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
          value = argv[++i];
        }
      }

      if (!VALUE_FLAGS.has(key)) {
        throw new CliError(
          `Unknown flag: --${key}`,
          'Run with --help to see available flags.',
        );
      }
      if (value === undefined || value === '') {
        throw new CliError(`Flag --${key} needs a value, e.g. --${key}=...`);
      }

      if (key === 'auth') {
        flags.auth = value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (key === 'db') {
        flags.db = value;
      } else if (key === 'pm') {
        flags.pm = value;
      }
      continue;
    }

    if (arg.startsWith('-')) {
      throw new CliError(`Unknown flag: ${arg}`, 'Run with --help to see available flags.');
    }

    // Positional: project name (first one wins).
    if (flags.projectName === undefined) {
      flags.projectName = arg;
    }
  }

  return flags;
}

export const HELP_TEXT = `
create-betternest-app — scaffold a Next.js + NestJS + Better Auth monorepo

Usage:
  create-betternest-app [project-name] [options]

Options:
  --db=<id>            Database template id (e.g. prisma)
  --auth=<a,b,c>       Comma-separated auth provider ids (e.g. email-password,google,github)
  --pm=<manager>       Package manager: pnpm | npm | yarn | bun
  --no-install         Skip installing dependencies
  --no-git             Skip git init + first commit
  -y, --yes            Use defaults / provided flags, skip all prompts
  -v, --verbose        Print full stack traces on error
  -h, --help           Show this help

Examples:
  create-betternest-app my-app
  create-betternest-app my-app --db=prisma --auth=email-password,google --pm=pnpm --yes
`;
