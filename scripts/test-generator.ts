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
import { runUpdate } from '../packages/cli/src/update';

const templatesDir = path.resolve(__dirname, '..', 'templates');

async function main(): Promise<void> {
  assert.deepEqual(replaceTokens('Hello {{ NAME }}', { NAME: 'world' }), 'Hello world');
  assert.equal(replaceTokens('Keep {{UNKNOWN}}', {}), 'Keep {{UNKNOWN}}');
  assert.equal(injectMarkers('before\n// EMPTY\nafter', { EMPTY: '' }), 'before\nafter');
  assert.deepEqual(
    deepMerge({ scripts: { dev: 'dev' }, name: 'base' }, { scripts: { build: 'build' } }),
    {
      scripts: { dev: 'dev', build: 'build' },
      name: 'base',
    },
  );

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
  const skipAuthPlan = await resolvePlan(
    parseFlags(['fixture', '--skip-auth', '--yes']),
    templatesDir,
  );
  assert.deepEqual(skipAuthPlan.selection.authProviders, []);
  assert.equal(skipAuthPlan.selection.skipEmail, true);
  const skipEmailPlan = await resolvePlan(
    parseFlags(['fixture', '--skip-email', '--yes']),
    templatesDir,
  );
  assert.equal(skipEmailPlan.selection.authProviders.includes('email-password'), false);
  await assert.rejects(
    () =>
      resolvePlan(parseFlags(['fixture', '--skip-auth', '--auth=github', '--yes']), templatesDir),
    /cannot be combined/,
  );
  await assert.rejects(
    () =>
      resolvePlan(
        parseFlags(['fixture', '--skip-email', '--auth=email-password', '--yes']),
        templatesDir,
      ),
    /cannot be combined/,
  );

  const dbs = await listDbCombos({ templatesDir });
  assert.deepEqual(dbs.map((db) => db.id).sort(), [
    'drizzle-mysql',
    'drizzle-postgresql',
    'drizzle-sqlite',
    'prisma-mysql',
    'prisma-postgresql',
    'prisma-sqlite',
  ]);
  const providers = await listAuthProviders({ templatesDir });
  assert.deepEqual(
    providers.map((provider) => provider.id),
    ['email-password', 'github', 'google'],
  );

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
      assert.equal(
        dbPackage.scripts?.['db:migrate:deploy'],
        db.id.includes('prisma') ? 'prisma migrate deploy' : 'drizzle-kit migrate',
      );
      assert.equal(
        rootPackage.scripts?.['db:migrate:deploy'],
        'pnpm --filter @repo/db db:migrate:deploy',
      );
      assert.equal(rootPackage.scripts?.['db:seed'], 'pnpm --filter api db:seed');
      assert.equal(dbPackage.scripts?.['db:seed'], undefined);
      const seedSource = fs.readFileSync(path.join(out, 'apps/api/src/scripts/seed.ts'), 'utf8');
      assert.match(seedSource, /ADMIN_EMAIL/);
      assert.match(seedSource, /ADMIN_PASSWORD/);
      assert.doesNotMatch(seedSource, /admin123/);
      assert.ok(fs.existsSync(path.join(out, '.gitignore')));
      assert.ok(fs.existsSync(path.join(out, '.env.example')));
      const projectManifest = JSON.parse(
        fs.readFileSync(path.join(out, '.betternest.json'), 'utf8'),
      ) as { database?: { id?: string }; packageManager?: string };
      assert.equal(projectManifest.database?.id, db.id);
      assert.equal(projectManifest.packageManager, 'pnpm');
      const authSource = fs.readFileSync(path.join(out, 'packages/auth/src/index.ts'), 'utf8');
      assert.ok(!authSource.includes('DB_ADAPTER_'));
      assert.match(authSource, /Reset your password/);
      assert.match(authSource, /Verify your email address/);
      const signInPage = fs.readFileSync(
        path.join(out, 'apps/web/app/(auth)/sign-in/page.tsx'),
        'utf8',
      );
      const signUpPage = fs.readFileSync(
        path.join(out, 'apps/web/app/(auth)/sign-up/page.tsx'),
        'utf8',
      );
      assert.match(signInPage, /EmailPasswordSignInForm/);
      assert.doesNotMatch(signInPage, /EmailPasswordSignUpForm.*from/);
      assert.match(signUpPage, /EmailPasswordSignUpForm/);
      assert.doesNotMatch(signUpPage, /EmailPasswordSignInForm.*from/);
      assert.match(
        fs.readFileSync(path.join(out, 'apps/api/docker-entrypoint.sh'), 'utf8'),
        /SEED_ADMIN_ON_STARTUP/,
      );
    }

    const skipAuthOut = path.join(tmpRoot, 'skip-auth');
    await generateProject(
      {
        projectName: 'skip-auth',
        db: 'prisma-sqlite',
        authProviders: [],
        skipAuth: true,
        skipEmail: true,
      },
      skipAuthOut,
      { templatesDir },
    );
    assert.equal(fs.existsSync(path.join(skipAuthOut, 'packages/auth')), false);
    assert.equal(fs.existsSync(path.join(skipAuthOut, 'packages/email')), false);
    assert.equal(fs.existsSync(path.join(skipAuthOut, 'apps/web/app/(auth)')), false);
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(skipAuthOut, 'apps/api/package.json'), 'utf8'))
        .dependencies?.['@repo/auth'],
      undefined,
    );
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(skipAuthOut, 'package.json'), 'utf8')).scripts?.[
        'db:seed'
      ],
      undefined,
    );
    const skipAuthReadme = fs.readFileSync(path.join(skipAuthOut, 'README.md'), 'utf8');
    assert.match(skipAuthReadme, /authentication is disabled/i);
    assert.doesNotMatch(
      skipAuthReadme,
      /Better Auth Monorepo|The three traps|Rate limiting|BETTER_AUTH_SECRET/,
    );

    const skipEmailOut = path.join(tmpRoot, 'skip-email');
    await generateProject(
      {
        projectName: 'skip-email',
        db: 'prisma-sqlite',
        authProviders: ['github'],
        skipEmail: true,
      },
      skipEmailOut,
      { templatesDir },
    );
    assert.equal(fs.existsSync(path.join(skipEmailOut, 'packages/email')), false);
    assert.equal(fs.existsSync(path.join(skipEmailOut, 'apps/api/src/scripts/seed.ts')), false);
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(skipEmailOut, 'package.json'), 'utf8')).scripts?.[
        'db:seed'
      ],
      undefined,
    );
    assert.doesNotMatch(
      fs.readFileSync(path.join(skipEmailOut, 'packages/auth/src/index.ts'), 'utf8'),
      /sendEmail/,
    );
    assert.match(
      fs.readFileSync(path.join(skipEmailOut, 'README.md'), 'utf8'),
      /No admin seed is generated because the email-password provider is not enabled/,
    );

    const skipUiOut = path.join(tmpRoot, 'skip-ui');
    await generateProject(
      {
        projectName: 'skip-ui',
        db: 'prisma-sqlite',
        authProviders: ['email-password'],
        skipUi: true,
      },
      skipUiOut,
      { templatesDir },
    );
    assert.equal(fs.existsSync(path.join(skipUiOut, 'packages/ui')), false);
    assert.ok(fs.existsSync(path.join(skipUiOut, 'apps/web/components/ui.tsx')));
    assert.doesNotMatch(
      fs.readFileSync(path.join(skipUiOut, 'apps/web/app/(marketing)/page.tsx'), 'utf8'),
      /@repo\/ui/,
    );
    assert.match(fs.readFileSync(path.join(skipUiOut, 'README.md'), 'utf8'), /local UI shim/);

    const updateOut = path.join(tmpRoot, 'update-fixture');
    await generateProject(
      { projectName: 'update-fixture', db: 'prisma-sqlite', authProviders: ['email-password'] },
      updateOut,
      { templatesDir },
    );
    const updateReadme = path.join(updateOut, 'README.md');
    fs.rmSync(updateReadme);
    await runUpdate(parseFlags([]), updateOut, templatesDir);
    assert.ok(fs.existsSync(updateReadme));
    const userFile = path.join(updateOut, 'notes.txt');
    fs.writeFileSync(userFile, 'User-owned notes\n');
    await runUpdate(parseFlags([]), updateOut, templatesDir);
    const refreshedManifest = JSON.parse(
      fs.readFileSync(path.join(updateOut, '.betternest.json'), 'utf8'),
    ) as { generatedFiles?: Record<string, string> };
    assert.equal(refreshedManifest.generatedFiles?.['notes.txt'], undefined);
    fs.writeFileSync(updateReadme, '# User-owned README\n');
    await runUpdate(parseFlags(['--dry-run']), updateOut, templatesDir);
    assert.equal(fs.readFileSync(updateReadme, 'utf8'), '# User-owned README\n');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }

  console.log(`Generator tests passed for ${dbs.length} database variants.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
