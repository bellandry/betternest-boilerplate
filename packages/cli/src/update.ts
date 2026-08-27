import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateProject } from '@repo/generator';
import type { Selection } from '@repo/generator/types';
import { CliError } from './errors';
import type { RawFlags } from './flags';

interface ProjectManifest {
  schemaVersion?: number;
  generatedBy?: string;
  projectName?: string;
  packageManager?: string;
  database?: { id?: string };
  authProviders?: string[];
  features?: {
    skipAuth?: boolean;
    skipEmail?: boolean;
    skipUi?: boolean;
  };
  generatedFiles?: Record<string, string>;
}

type ChangeKind = 'added' | 'updated' | 'conflict';
type Change = { path: string; kind: ChangeKind };

function toPosix(value: string): string {
  return value.split(path.sep).join('/');
}

function hashFile(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function listFiles(root: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') continue;
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...listFiles(absolute));
    else result.push(absolute);
  }
  return result;
}

function readManifest(targetDir: string): ProjectManifest {
  const manifestPath = path.join(targetDir, '.betternest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new CliError(
      'This directory is not a BetterNest generated project.',
      'Run update from the project root containing .betternest.json.',
    );
  }
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as ProjectManifest;
  } catch (error) {
    throw new CliError(
      'The .betternest.json manifest is invalid.',
      'Fix the JSON before running update.',
      error,
    );
  }
}

function projectNameFrom(targetDir: string, manifest: ProjectManifest): string {
  if (manifest.projectName) return manifest.projectName;
  const packagePath = path.join(targetDir, 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { name?: string };
    if (packageJson.name) return packageJson.name;
  }
  return path.basename(targetDir);
}

function selectionFromManifest(targetDir: string, manifest: ProjectManifest): Selection {
  if (!manifest.database?.id) {
    throw new CliError(
      'The BetterNest manifest does not contain a database id.',
      'Regenerate the project before running update.',
    );
  }
  return {
    projectName: projectNameFrom(targetDir, manifest),
    db: manifest.database.id,
    authProviders: manifest.authProviders ?? [],
    skipAuth: manifest.features?.skipAuth,
    skipEmail: manifest.features?.skipEmail,
    skipUi: manifest.features?.skipUi,
  };
}

function printChanges(changes: Change[]): void {
  if (changes.length === 0) {
    console.log('No template changes detected.');
    return;
  }
  for (const change of changes) console.log(`${change.kind.padEnd(8)} ${change.path}`);
}

export async function runUpdate(
  flags: RawFlags,
  targetDir: string,
  templatesDir: string,
): Promise<void> {
  const resolvedTarget = path.resolve(targetDir);
  if (!fs.existsSync(resolvedTarget) || !fs.statSync(resolvedTarget).isDirectory()) {
    throw new CliError(`Project directory not found: ${resolvedTarget}`);
  }

  const manifest = readManifest(resolvedTarget);
  if (manifest.generatedBy !== undefined && manifest.generatedBy !== 'create-betternest-app') {
    throw new CliError('The manifest was not produced by create-betternest-app.');
  }
  const selection = selectionFromManifest(resolvedTarget, manifest);
  const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'betternest-update-'));

  try {
    await generateProject(selection, temporaryDir, { templatesDir });
    const baseline = manifest.generatedFiles ?? {};
    const changes: Change[] = [];
    const safeChanges: Change[] = [];

    for (const absolute of listFiles(temporaryDir)) {
      const relative = toPosix(path.relative(temporaryDir, absolute));
      if (relative === '.betternest.json') continue;
      const current = path.join(resolvedTarget, relative);
      if (!fs.existsSync(current)) {
        const change = { path: relative, kind: 'added' as const };
        changes.push(change);
        safeChanges.push(change);
        continue;
      }
      if (hashFile(current) === hashFile(absolute)) continue;

      const wasGeneratedUnmodified =
        baseline[relative] !== undefined && baseline[relative] === hashFile(current);
      const change = {
        path: relative,
        kind: wasGeneratedUnmodified ? ('updated' as const) : ('conflict' as const),
      };
      changes.push(change);
      if (change.kind === 'updated') safeChanges.push(change);
    }

    console.log(`BetterNest update preview for ${resolvedTarget}`);
    printChanges(changes);
    const conflicts = changes.filter((change) => change.kind === 'conflict');
    if (conflicts.length > 0) {
      console.log(
        `\n${conflicts.length} conflict(s) require manual review; no conflicting file will be overwritten.`,
      );
    }
    if (flags.dryRun) {
      console.log('\nDry run complete. No files were changed.');
      return;
    }

    for (const change of safeChanges) {
      const source = path.join(temporaryDir, change.path);
      const destination = path.join(resolvedTarget, change.path);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(source, destination);
    }

    if (conflicts.length === 0) {
      const updatedManifest: ProjectManifest = {
        ...manifest,
        projectName: selection.projectName,
        generatedFiles: Object.fromEntries(
          listFiles(temporaryDir)
            .filter((file) => path.relative(temporaryDir, file) !== '.betternest.json')
            .map((file) => [toPosix(path.relative(temporaryDir, file)), hashFile(file)]),
        ),
      };
      fs.writeFileSync(
        path.join(resolvedTarget, '.betternest.json'),
        JSON.stringify(updatedManifest, null, 2) + '\n',
      );
    }
    console.log(`\nApplied ${safeChanges.length} safe change(s).`);
  } finally {
    fs.rmSync(temporaryDir, { recursive: true, force: true });
  }
}

export const UPDATE_HELP_TEXT = `
create-betternest-app update — safely update an existing generated project

Usage:
  create-betternest-app update [project-path] [--dry-run]

Behavior:
  New files are added automatically.
  Files that match the last generated snapshot are updated automatically.
  User-modified files are reported as conflicts and are never overwritten.
  The manifest is refreshed only when no conflicts remain.

Options:
  --dry-run            Preview changes without writing files
  -v, --verbose        Print full stack traces on error
  -h, --help           Show this help
`;
