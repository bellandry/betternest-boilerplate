import path from 'node:path';
import { execSync } from 'node:child_process';
import { generateProject } from '../packages/generator/src/assemble';
import { DEFAULT_SELECTION } from '../packages/generator/DEFAULT_SELECTION';

// Produces the committed reference output examples/mvp/.
async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const out = path.join(repoRoot, 'examples', 'mvp');

  await generateProject(DEFAULT_SELECTION, out);

  // Deterministic formatting so the committed output has no spurious diffs.
  try {
    execSync(`npx prettier --write "examples/mvp/**/*.{ts,tsx,json,md}" --log-level warn`, {
      cwd: repoRoot,
      stdio: 'inherit',
    });
  } catch {
    // Prettier is best-effort; never fail generation on formatting.
  }

  console.log(`\nGenerated '${DEFAULT_SELECTION.projectName}' -> ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
