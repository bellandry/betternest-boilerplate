import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

// ─────────────────────────────────────────────────────────────────────────────
// MANDATORY PRE-PUBLISH GATE.
//
// Simulates a REAL end-user install of `create-betternest-app`:
//   1. build the CLI bundle
//   2. `pnpm pack` -> a real .tgz (respects the `files` field, npm's ignore
//      rules, dotfile stripping — everything a dev-mode run hides)
//   3. install that tarball AS A DEPENDENCY in a temp project fully isolated
//      from the monorepo (only the published `dependencies` land — like npx)
//   4. run the installed binary with --yes (== DEFAULT_SELECTION)
//   5. assert the generated project matches examples/mvp after the same
//      Prettier normalization used to produce it.
//
// examples/mvp is the committed reference for DEFAULT_SELECTION (prisma +
// email-password + google + github), so we drive the CLI with plain --yes.
// A dev-mode run cannot catch packaging bugs (e.g. npm stripping .gitignore);
// only this real pack round-trip can.
// ─────────────────────────────────────────────────────────────────────────────

const repoRoot = path.resolve(__dirname, '..');
const cliDir = path.join(repoRoot, 'packages', 'cli');
const referenceDir = path.join(repoRoot, 'examples', 'mvp');

// Build artifacts / install output that are not generator output.
const IGNORE = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'build',
  'out',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'next-env.d.ts',
]);

function sh(cmd: string, cwd: string): string {
  console.log(`  $ ${cmd}`);
  return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString();
}

function walk(root: string): string[] {
  const out: string[] = [];
  const rec = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (IGNORE.has(e.name)) continue;
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) rec(abs);
      else out.push(path.relative(root, abs).split(path.sep).join('/'));
    }
  };
  rec(root);
  return out.sort();
}

function normalize(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\s+$/, '') + '\n';
}

function main(): void {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'betternest-pack-'));
  console.log(`Isolated dir: ${tmpRoot}\n`);

  console.log('[1/6] Build CLI');
  sh('pnpm --filter create-betternest-app build', repoRoot);

  console.log('[2/6] Pack the publishable tarball');
  // pnpm pack (not `npm pack`): this is a pnpm workspace, and only pnpm rewrites
  // `workspace:*` specifiers into concrete versions on pack/publish. `npm pack`
  // leaves them raw, producing a tarball that fails `npm install` for consumers
  // (EUNSUPPORTEDPROTOCOL). pnpm pack respects the same `files` field and npm
  // dotfile stripping, so it still exercises the packaging path faithfully.
  execSync(`pnpm pack --pack-destination "${tmpRoot}"`, {
    cwd: cliDir,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const tgzName = fs.readdirSync(tmpRoot).find((f) => f.endsWith('.tgz'));
  if (!tgzName) throw new Error('pnpm pack produced no .tgz');
  const tgz = path.join(tmpRoot, tgzName);
  console.log(`  packed: ${tgz}`);

  console.log('[3/6] Install the tarball as a dependency (true npx semantics)');
  // A real `npx create-betternest-app` installs the package AS A DEPENDENCY:
  // npm pulls its `dependencies` (@clack/prompts, jiti) and never its
  // devDependencies (@repo/generator is inlined at build time, so consumers
  // never need it). Installing into a fresh consumer project reproduces that
  // exactly — and proves the runtime deps declared in package.json suffice.
  const consumerDir = path.join(tmpRoot, 'consumer');
  fs.mkdirSync(consumerDir, { recursive: true });
  fs.writeFileSync(
    path.join(consumerDir, 'package.json'),
    JSON.stringify({ name: 'consumer', version: '1.0.0', private: true }, null, 2),
  );
  sh(`npm install "${tgz}" --no-audit --no-fund`, consumerDir);
  const bin = path.join(
    consumerDir,
    'node_modules',
    'create-betternest-app',
    'dist',
    'index.js',
  );
  if (!fs.existsSync(bin)) throw new Error(`Installed binary not found at ${bin}`);

  console.log('[4/6] Run the packaged binary (--yes)');
  const workDir = path.join(tmpRoot, 'work');
  fs.mkdirSync(workDir, { recursive: true });
  sh(`node "${bin}" my-app --yes --no-install --no-git`, workDir);

  const generatedDir = path.join(workDir, 'my-app');
  if (!fs.existsSync(generatedDir)) {
    throw new Error('Generation produced no project directory.');
  }

  console.log('[5/6] Normalize output (Prettier, as examples/mvp was produced)');
  // Prettier the generated output the same way examples/mvp was produced, so
  // the comparison is about template fidelity, not formatting.
  try {
    execSync(
      `npx prettier --write "${generatedDir.split(path.sep).join('/')}/**/*.{ts,tsx,json,md}" --log-level warn`,
      { cwd: repoRoot, stdio: 'inherit' },
    );
  } catch {
    // best-effort; comparison below is authoritative
  }

  const generated = walk(generatedDir);
  const reference = walk(referenceDir);
  const genSet = new Set(generated);
  const refSet = new Set(reference);

  const missing = reference.filter((f) => !genSet.has(f));
  const extra = generated.filter((f) => !refSet.has(f));
  const differing: string[] = [];
  for (const rel of reference) {
    if (!genSet.has(rel)) continue;
    const a = normalize(fs.readFileSync(path.join(referenceDir, rel), 'utf8'));
    const b = normalize(fs.readFileSync(path.join(generatedDir, rel), 'utf8'));
    if (a !== b) differing.push(rel);
  }

  console.log('[6/6] Diff against examples/mvp');
  const problems = missing.length + extra.length + differing.length;
  if (problems > 0) {
    console.error('\nPACKAGED CLI MISMATCH — the published tarball does not reproduce examples/mvp:');
    if (missing.length) console.error(`\n  Missing (in tarball output, present in reference):\n    ${missing.join('\n    ')}`);
    if (extra.length) console.error(`\n  Extra (in tarball output, absent from reference):\n    ${extra.join('\n    ')}`);
    if (differing.length) console.error(`\n  Content differs:\n    ${differing.join('\n    ')}`);
    console.error(`\n  Isolated dir kept for inspection: ${tmpRoot}`);
    process.exit(1);
  }

  console.log(`\nPACKAGED CLI OK — ${generated.length} files match examples/mvp.`);
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

main();
