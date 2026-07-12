import fs from 'node:fs';
import path from 'node:path';
import { replaceTokens } from './tokens';

// Recursively copies templates/base into the output dir.
//  - directories are created as needed
//  - files ending in .hbs are token-substituted and written WITHOUT the .hbs
//  - all other files are copied verbatim (still token-substituted if text)
// Certain files are skipped here because the assembler composes them from
// fragments (they are passed in `skip`, as project-relative POSIX paths).

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.mdx',
  '.css', '.yaml', '.yml', '.prisma', '.hbs', '.txt', '.example', '.gitignore',
  '.prettierrc', '.env',
]);

// npm strips any file literally named `.gitignore` from a published tarball, so
// template authors store it under a pack-safe name (`gitignore`) and we rename
// it back on write. Same trick create-next-app uses. Keyed by basename.
const PACK_SAFE_RENAMES: Record<string, string> = {
  gitignore: '.gitignore',
};

function isTextFile(file: string): boolean {
  const base = path.basename(file);
  if (base in PACK_SAFE_RENAMES) return true;
  const ext = path.extname(file);
  if (TEXT_EXTENSIONS.has(ext)) return true;
  // dotfiles without extension we treat as text (.gitignore, .prettierrc)
  return ext === '' && base.startsWith('.');
}

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

export function walkFiles(dir: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walkFiles(full));
    else result.push(full);
  }
  return result;
}

export function copyBaseFiles(
  baseDir: string,
  outDir: string,
  tokens: Record<string, string>,
  skip: Set<string>,
): void {
  for (const abs of walkFiles(baseDir)) {
    const relFromBase = toPosix(path.relative(baseDir, abs));
    // Destination relative path: strip a trailing .hbs suffix, then map any
    // pack-safe filename back to its real (npm-stripped) name.
    let destRel = relFromBase.endsWith('.hbs')
      ? relFromBase.slice(0, -'.hbs'.length)
      : relFromBase;
    const destBase = destRel.slice(destRel.lastIndexOf('/') + 1);
    if (destBase in PACK_SAFE_RENAMES) {
      destRel = destRel.slice(0, destRel.length - destBase.length) + PACK_SAFE_RENAMES[destBase];
    }

    if (skip.has(destRel)) continue;

    const destAbs = path.join(outDir, destRel);
    fs.mkdirSync(path.dirname(destAbs), { recursive: true });

    if (isTextFile(abs)) {
      const raw = fs.readFileSync(abs, 'utf8');
      fs.writeFileSync(destAbs, replaceTokens(raw, tokens));
    } else {
      fs.copyFileSync(abs, destAbs);
    }
  }
}

export { toPosix, isTextFile };
