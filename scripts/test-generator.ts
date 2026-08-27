import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { listAuthProviders, listDbCombos } from '../packages/generator/src/catalog';
import { generateProject } from '../packages/generator/src/assemble';
import { deepMerge } from '../packages/generator/src/merge-package-json';
import { injectMarkers } from '../packages/generator/src/inject-markers';
import { replaceTokens } from '../packages/generator/src/tokens';
import { validateEnvironment } from '../templates/base/apps/api/src/config';
import { parseFlags } from '../packages/cli/src/flags';
import { resolvePlan } from '../packages/cli/src/resolve-selection';

const templatesDir = path.resolve(__dirname, '..', 'templates');

async function main(): Promise<void> {
  assert.deepEqual(replaceTokens('Hello {{ NAME }}', { NAME: 'world' }), 'Hello world');
  assert.equal(replaceTokens('Keep {{UNKNOWN}}', {}), 'Keep {{UNKNOWN}}');
  assert.equal(injectMarkers('before\n// EMPTY\nafter', { EMPTY: '' }), 'before\nafter');
  assert.deepEqual(deepMerge({ scripts: { dev: 'dev' }, name: 'base' }, { scripts: { build: 'build' } }), {
    scripts: { dev: 'dev', build: 'build' },
    name: 'base',
  });

  const validEnv = {
    DATABASE_URL: 'file:./data.db',
    BETTER_AUTH_SECRET: 'test-secret-with-at-least-32-characters-long',
    WEB_URL: 'http://localhost:3000',
    PORT: '4000',
    RATE_LIMIT_MAX: '5',
    RATE_LIMIT_WINDOW: '900',
  };
  const originalEnv = { ...process.env };
  Object.assign(process.env, validEnv);
  validateEnvironment();
  delete process.env.BETTER_AUTH_SECRET;
  assert.throws(() => validateEnvironment(), /BETTER_AUTH_SECRET/);
  for (const [key, value] of Object.entries(originalEnv)) process.env[key] = value;
  for (const key of Object.keys(validEnv)) {
    if (!(key in originalEnv)) delete process.env[key];
  }

  await assert.rejects(
    () => resolvePlan(parseFlags(['fixture', '--pm=npm', '--yes']), templatesDir),
    /Unknown package manager/,
  );

  const dbs = await listDbCombos({ templatesDir });
  assert.deepEqual(
    dbs.map((db) => db.id).sort(),
    [
      'drizzle-mysql',
      'drizzle-postgresql',
      'drizzle-sqlite',
      'prisma-mysql',
      'prisma-postgresql',
      'prisma-sqlite',
    ],
  );
  const providers = await listAuthProviders({ templatesDir });
  assert.deepEqual(providers.map((provider) => provider.id), ['email-password', 'github', 'google']);

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'betternest-generator-test-'));
  try {
    for (const db of dbs) {
      const out = path.join(tmpRoot, db.id);
      await generateProject(
        { projectName: `fixture-${db.id}`, db: db.id, authProviders: ['email-password'] },
        out,
        { templatesDir },
      );
      const dbPackage = JSON.parse(
        fs.readFileSync(path.join(out, 'packages/db/package.json'), 'utf8'),
      ) as { scripts?: Record<string, string> };
      const rootPackage = JSON.parse(fs.readFileSync(path.join(out, 'package.json'), 'utf8')) as {
        scripts?: Record<string, string>;
      };
      assert.equal(dbPackage.scripts?.['db:migrate:deploy'], db.id.includes('prisma') ? 'prisma migrate deploy' : 'drizzle-kit migrate');
      assert.equal(rootPackage.scripts?.['db:migrate:deploy'], 'pnpm --filter @repo/db db:migrate:deploy');
      assert.ok(fs.existsSync(path.join(out, '.gitignore')));
      assert.ok(fs.existsSync(path.join(out, '.env.example')));
      const projectManifest = JSON.parse(
        fs.readFileSync(path.join(out, '.betternest.json'), 'utf8'),
      ) as { database?: { id?: string }; packageManager?: string };
      assert.equal(projectManifest.database?.id, db.id);
      assert.equal(projectManifest.packageManager, 'pnpm');
      assert.ok(!fs.readFileSync(path.join(out, 'packages/auth/src/index.ts'), 'utf8').includes('DB_ADAPTER_'));
      const signInPage = fs.readFileSync(path.join(out, 'apps/web/app/(auth)/sign-in/page.tsx'), 'utf8');
      const signUpPage = fs.readFileSync(path.join(out, 'apps/web/app/(auth)/sign-up/page.tsx'), 'utf8');
      assert.match(signInPage, /EmailPasswordSignInForm/);
      assert.doesNotMatch(signInPage, /EmailPasswordSignUpForm.*from/);
      assert.match(signUpPage, /EmailPasswordSignUpForm/);
      assert.doesNotMatch(signUpPage, /EmailPasswordSignInForm.*from/);
    }
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }

  console.log(`Generator tests passed for ${dbs.length} database variants.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
