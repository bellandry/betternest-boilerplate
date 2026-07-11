import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { generateProject } from '../packages/generator/src/assemble';
import { DEFAULT_SELECTION } from '../packages/generator/DEFAULT_SELECTION';

// CI guard: generate the default selection into a THROWAWAY temp dir, then
// install + build + lint. Never touches the committed examples/mvp.
async function main() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'betternest-smoke-'));
  const out = path.join(tmpRoot, DEFAULT_SELECTION.projectName);
  console.log(`Smoke test dir: ${out}`);

  await generateProject(DEFAULT_SELECTION, out);

  const run = (cmd: string) => {
    console.log(`\n$ ${cmd}`);
    execSync(cmd, { cwd: out, stdio: 'inherit' });
  };

  run('pnpm install');
  run('pnpm build');
  run('pnpm lint');

  console.log('\nSMOKE OK');
  console.log(`(leftover dir: ${out})`);
}

main().catch((err) => {
  console.error('\nSMOKE FAILED');
  console.error(err);
  process.exit(1);
});
