import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { DbManifest, ProviderManifest, Selection } from './types';
import { buildTokens, replaceTokens } from './tokens';
import { copyBaseFiles, toPosix, walkFiles } from './copy-base-files';
import { injectMarkers } from './inject-markers';
import { mergePackageJson } from './merge-package-json';
import { mergeEnvFile } from './merge-env-files';
import { DEFAULT_TEMPLATES_DIR, loadManifest } from './manifests';

// Base files the assembler composes from fragments (POSIX, project-relative,
// .hbs stripped). copyBaseFiles skips these; we write them explicitly.
const COMPOSED = new Set<string>([
  'package.json',
  'README.md',
  '.env.example',
  '.betternest.json',
  'packages/auth/package.json',
  'packages/auth/src/index.ts',
  'apps/web/app/(auth)/sign-in/page.tsx',
  'apps/web/app/(auth)/sign-up/page.tsx',
]);

const OAUTH_WRAPPER_OPEN = '<div className="flex flex-col gap-2">';
const OAUTH_WRAPPER_CLOSE = '</div>';
const DIVIDER_JSX =
  '<div className="flex items-center gap-3 text-xs text-muted-foreground">' +
  '<span className="h-px flex-1 bg-border" /> OR ' +
  '<span className="h-px flex-1 bg-border" /></div>';

const MINIMAL_UI_SHIM = `import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react';

type WithChildren<T> = T & { children?: ReactNode };

export function Button({ asChild, children, className, variant: _variant, size: _size, ...props }: WithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; variant?: string; size?: string }>) {
  if (asChild) return <>{children}</>;
  return <button {...props} className={className}>{children}</button>;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={className} />;
}

export function Label({ className, ...props }: WithChildren<LabelHTMLAttributes<HTMLLabelElement>>) {
  return <label {...props} className={className} />;
}

export function Card({ className, ...props }: WithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props} className={className} />;
}

export function CardHeader({ className, ...props }: WithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props} className={className} />;
}

export function CardContent({ className, ...props }: WithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props} className={className} />;
}

export function CardDescription({ className, ...props }: WithChildren<HTMLAttributes<HTMLParagraphElement>>) {
  return <p {...props} className={className} />;
}

export function CardFooter({ className, ...props }: WithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props} className={className} />;
}

export function CardTitle({ className, ...props }: WithChildren<HTMLAttributes<HTMLHeadingElement>>) {
  return <h2 {...props} className={className} />;
}
`;

const NO_AUTH_APP_MODULE = `import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';

@Module({
  imports: [HealthModule],
})
export class AppModule {}
`;

const NO_AUTH_MARKETING_PAGE = `import type { ReactNode } from 'react';

export default function LandingPage(): ReactNode {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <span className="rounded-full border px-4 py-1 text-sm text-muted-foreground">BetterNest starter</span>
      <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">The {{PROJECT_NAME}} project</h1>
      <p className="max-w-xl text-balance text-lg text-muted-foreground">
        Your web and API foundation is ready. Authentication is disabled in this generated project.
      </p>
    </main>
  );
}
`;

function removeDependencies(content: string, names: string[]): string {
  const value = JSON.parse(content) as {
    dependencies?: Record<string, string>;
  };
  for (const name of names) delete value.dependencies?.[name];
  return JSON.stringify(value, null, 2) + '\n';
}

function replaceUiImports(outDir: string): void {
  const webDir = path.join(outDir, 'apps', 'web');
  for (const file of walkFiles(webDir)) {
    if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file)) continue;
    const source = fs.readFileSync(file, 'utf8');
    const updated = source
      .replaceAll('@repo/ui/button', '@/components/ui')
      .replaceAll('@repo/ui/card', '@/components/ui')
      .replaceAll('@repo/ui/input', '@/components/ui')
      .replaceAll('@repo/ui/label', '@/components/ui');
    if (updated !== source) fs.writeFileSync(file, updated);
  }
}

type LoadedProvider = { manifest: ProviderManifest; dir: string };
type LoadedDb = { manifest: DbManifest; dir: string };

function readFrag(dir: string, rel: string, tokens: Record<string, string>): string {
  const abs = path.resolve(dir, rel);
  return replaceTokens(fs.readFileSync(abs, 'utf8'), tokens);
}

function readBase(baseDir: string, rel: string, tokens: Record<string, string>): string {
  const abs = path.join(baseDir, rel);
  return replaceTokens(fs.readFileSync(abs, 'utf8'), tokens);
}

function write(outDir: string, rel: string, content: string): void {
  const abs = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

function hashFile(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

export interface GenerateOptions {
  // Root of the templates/ tree. Defaults to the repo-root layout so the
  // Phase-1 scripts work unchanged; the CLI passes its bundled templates dir.
  templatesDir?: string;
}

export async function generateProject(
  selection: Selection,
  outputDir: string,
  options: GenerateOptions = {},
): Promise<void> {
  const templatesDir = options.templatesDir ?? DEFAULT_TEMPLATES_DIR;
  const baseDir = path.join(templatesDir, 'base');
  const tokens = buildTokens(selection.projectName);
  const outDir = path.resolve(outputDir);

  // Fresh output every time (examples/mvp is a generated artifact).
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  // ── Load manifests ──
  const dbDir = path.join(templatesDir, 'db', selection.db);
  const db: LoadedDb = {
    manifest: await loadManifest<DbManifest>(path.join(dbDir, 'manifest.ts')),
    dir: dbDir,
  };

  const skipAuth = Boolean(selection.skipAuth);
  const skipEmail = Boolean(selection.skipEmail || skipAuth);
  const skipUi = Boolean(selection.skipUi);
  const providerIds = skipAuth
    ? []
    : selection.authProviders.filter((id) => !(skipEmail && id === 'email-password'));
  const hasEmailPassword = providerIds.includes('email-password');

  const providers: LoadedProvider[] = [];
  for (const id of providerIds) {
    const dir = path.join(templatesDir, 'auth-providers', id);
    providers.push({
      manifest: await loadManifest<ProviderManifest>(path.join(dir, 'manifest.ts')),
      dir,
    });
  }
  const credentials = providers.filter((p) => p.manifest.kind === 'credential');
  const oauth = providers.filter((p) => p.manifest.kind === 'oauth');

  // DB-derived tokens (used by the README). DB_LABEL is the full catalog label
  // ("Prisma + PostgreSQL"); DB_ORM is just the ORM name ("Prisma"/"Drizzle").
  // DB_DIALECT gives templates the database engine (PostgreSQL/MySQL/SQLite).
  tokens.DB_LABEL = db.manifest.label;
  tokens.DB_ORM = db.manifest.label.split(/[\s+]/).filter(Boolean)[0] ?? db.manifest.label;
  tokens.DB_DIALECT = db.manifest.database;

  const skipPrefixes = [
    ...(skipAuth
      ? [
          'packages/auth',
          'apps/api/src/auth',
          'apps/api/src/users',
          'apps/web/app/(auth)',
          'apps/web/app/(app)',
          'apps/web/lib/auth-client.ts',
          'apps/web/lib/auth-server.ts',
          'apps/web/proxy.ts',
        ]
      : []),
    ...(skipAuth || !hasEmailPassword ? ['apps/api/src/scripts/seed.ts'] : []),
    ...(skipEmail ? ['packages/email'] : []),
    ...(skipUi ? ['packages/ui'] : []),
  ];

  // A small machine-readable contract for future upgrades and diagnostics.
  // It records choices, but never secrets or environment values.
  write(
    outDir,
    '.betternest.json',
    JSON.stringify(
      {
        schemaVersion: 1,
        generatedBy: 'create-betternest-app',
        projectName: selection.projectName,
        packageManager: 'pnpm',
        database: {
          id: selection.db,
          label: db.manifest.label,
          orm: db.manifest.ormName,
          engine: db.manifest.database,
        },
        authProviders: providerIds,
        features: {
          skipAuth,
          skipEmail,
          skipUi,
        },
      },
      null,
      2,
    ) + '\n',
  );

  // ── 1. Base tree (skips composed files) ──
  copyBaseFiles(baseDir, outDir, tokens, COMPOSED, skipPrefixes);

  // ── 1b. docker-compose.yml (optional, only for server databases) ──
  const composeRel = 'docker-compose.yml';
  const composeSrc = path.resolve(db.dir, db.manifest.filesDir, composeRel);
  if (fs.existsSync(composeSrc)) {
    write(outDir, composeRel, replaceTokens(fs.readFileSync(composeSrc, 'utf8'), tokens));
  }

  // ── 2. DB files (packages/db/**) ──
  copyBaseFiles(path.resolve(db.dir, db.manifest.filesDir), outDir, tokens, new Set());

  // ── 2b. Provider files (packages/email/**, extra (auth) pages, ...) ──
  for (const p of providers) {
    if (!p.manifest.filesDir) continue;
    copyBaseFiles(path.resolve(p.dir, p.manifest.filesDir), outDir, tokens, new Set());
  }

  if (skipAuth) {
    write(outDir, 'apps/api/src/app.module.ts', NO_AUTH_APP_MODULE);
    write(
      outDir,
      'apps/web/app/(marketing)/page.tsx',
      replaceTokens(NO_AUTH_MARKETING_PAGE, tokens),
    );
    const config = readBase(baseDir, 'apps/api/src/config.ts', tokens)
      .replace(
        "const REQUIRED_ENV = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'WEB_URL'] as const;",
        "const REQUIRED_ENV = ['DATABASE_URL', 'WEB_URL'] as const;",
      )
      .replace(
        "  const secret = process.env.BETTER_AUTH_SECRET!;\n  if (secret.length < 32) {\n    throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters.');\n  }\n",
        '',
      );
    write(outDir, 'apps/api/src/config.ts', config);
  }

  if (skipUi) {
    write(outDir, 'apps/web/components/ui.tsx', MINIMAL_UI_SHIM);
    replaceUiImports(outDir);
  }

  // ── 2c. packages/auth/package.json (base + provider dependency fragments) ──
  if (!skipAuth) {
    let authPkg = readBase(baseDir, 'packages/auth/package.json', tokens);
    for (const p of providers) {
      if (!p.manifest.authPackageJsonFragmentPath) continue;
      authPkg = mergePackageJson(
        authPkg,
        readFrag(p.dir, p.manifest.authPackageJsonFragmentPath, tokens),
      );
    }
    write(outDir, 'packages/auth/package.json', authPkg);
  }

  // ── 3. packages/auth/src/index.ts ──
  if (!skipAuth) {
    const socialInner = oauth
      .map((p) => readFrag(p.dir, p.manifest.serverConfigFragmentPath, tokens).trim())
      .join('\n');
    const authIndex = injectMarkers(readBase(baseDir, 'packages/auth/src/index.ts.hbs', tokens), {
      DB_ADAPTER_IMPORT: readFrag(db.dir, db.manifest.adapterImportFragmentPath, tokens).trim(),
      DB_ADAPTER_CONFIG: readFrag(db.dir, db.manifest.adapterConfigFragmentPath, tokens).trim(),
      AUTH_PROVIDER_IMPORT: providers
        .filter((p) => p.manifest.serverImportFragmentPath)
        .map((p) => readFrag(p.dir, p.manifest.serverImportFragmentPath as string, tokens).trim())
        .join('\n'),
      CREDENTIAL_PROVIDERS_CONFIG: credentials
        .map((p) => readFrag(p.dir, p.manifest.serverConfigFragmentPath, tokens).trim())
        .join('\n'),
      SOCIAL_PROVIDERS_CONFIG: oauth.length ? `socialProviders: {\n${socialInner}\n},` : '',
    });
    write(outDir, 'packages/auth/src/index.ts', authIndex);
  }

  // ── 4. Auth provider UI component modules ──
  if (!skipAuth)
    for (const p of providers) {
      write(
        outDir,
        p.manifest.clientUiTargetPath,
        readFrag(p.dir, p.manifest.clientUiFragmentPath, tokens),
      );
    }

  // ── 5. sign-in / sign-up pages ──
  if (!skipAuth) {
    const uiImportsFor = (page: 'signIn' | 'signUp') =>
      providers
        .map((p) =>
          page === 'signIn'
            ? (p.manifest.clientUiImportSignIn ?? p.manifest.clientUiImport)
            : (p.manifest.clientUiImportSignUp ?? p.manifest.clientUiImport),
        )
        .join('\n');
    const oauthButtons = oauth.length
      ? `${OAUTH_WRAPPER_OPEN}\n${oauth.map((p) => p.manifest.oauthButtonSlot ?? '').join('\n')}\n${OAUTH_WRAPPER_CLOSE}`
      : '';
    const signInForm = credentials.map((p) => p.manifest.signInSlot ?? '').join('\n');
    const signUpForm = credentials.map((p) => p.manifest.signUpSlot ?? '').join('\n');
    const dividerFor = (form: string) => (form.trim() && oauthButtons.trim() ? DIVIDER_JSX : '');

    write(
      outDir,
      'apps/web/app/(auth)/sign-in/page.tsx',
      injectMarkers(readBase(baseDir, 'apps/web/app/(auth)/sign-in/page.tsx.hbs', tokens), {
        AUTH_UI_IMPORTS: uiImportsFor('signIn'),
        SIGN_IN_FORM: signInForm,
        AUTH_DIVIDER: dividerFor(signInForm),
        OAUTH_BUTTONS: oauthButtons,
      }),
    );
    write(
      outDir,
      'apps/web/app/(auth)/sign-up/page.tsx',
      injectMarkers(readBase(baseDir, 'apps/web/app/(auth)/sign-up/page.tsx.hbs', tokens), {
        AUTH_UI_IMPORTS: uiImportsFor('signUp'),
        SIGN_UP_FORM: signUpForm,
        AUTH_DIVIDER: dividerFor(signUpForm),
        OAUTH_BUTTONS: oauthButtons,
      }),
    );
  }

  if (skipUi) replaceUiImports(outDir);

  // ── 6. .env.example (root skeleton + db + providers) ──
  const dbEnv = db.manifest.envFragmentPath
    ? readFrag(db.dir, db.manifest.envFragmentPath, tokens)
    : '';
  const providerEnvs = providers
    .filter((p) => p.manifest.envFragmentPath)
    .map((p) => readFrag(p.dir, p.manifest.envFragmentPath as string, tokens));
  write(
    outDir,
    '.env.example',
    mergeEnvFile(readBase(baseDir, '.env.example.hbs', tokens), dbEnv, providerEnvs),
  );

  // ── 7. root package.json (base + db scripts fragment) ──
  let rootPkg = readBase(baseDir, 'package.json.hbs', tokens);
  if (db.manifest.packageJsonFragmentPath) {
    rootPkg = mergePackageJson(
      rootPkg,
      readFrag(db.dir, db.manifest.packageJsonFragmentPath, tokens),
    );
  }
  if (skipAuth || !hasEmailPassword) {
    const rootValue = JSON.parse(rootPkg) as { scripts?: Record<string, string> };
    delete rootValue.scripts?.['db:seed'];
    rootPkg = JSON.stringify(rootValue, null, 2) + '\n';
    const apiPackage = JSON.parse(readBase(baseDir, 'apps/api/package.json', tokens)) as {
      dependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    if (skipAuth) {
      for (const dependency of ['@repo/auth', 'better-auth']) {
        delete apiPackage.dependencies?.[dependency];
      }
    }
    if (!hasEmailPassword) delete apiPackage.scripts?.['db:seed'];
    write(outDir, 'apps/api/package.json', JSON.stringify(apiPackage, null, 2) + '\n');
  }
  if (skipUi || skipAuth) {
    const removedWebDependencies = [
      ...(skipUi ? ['@repo/ui'] : []),
      ...(skipAuth ? ['better-auth'] : []),
    ];
    write(
      outDir,
      'apps/web/package.json',
      removeDependencies(
        readBase(baseDir, 'apps/web/package.json', tokens),
        removedWebDependencies,
      ),
    );
  }
  if (skipUi) {
    write(
      outDir,
      'apps/web/next.config.ts',
      readBase(baseDir, 'apps/web/next.config.ts', tokens).replace(
        "  transpilePackages: ['@repo/ui'],\n",
        '',
      ),
    );
  }
  write(outDir, 'package.json', rootPkg);

  // ── 8. README.md (base + provider setup steps) ──
  const setupSteps = providers
    .filter((p) => p.manifest.readmeSetupPath)
    .map((p) => readFrag(p.dir, p.manifest.readmeSetupPath as string, tokens).trim())
    .filter(Boolean)
    .join('\n\n');
  let readme = injectMarkers(readBase(baseDir, 'README.md.hbs', tokens), {
    AUTH_SETUP_STEPS: setupSteps,
    DB_NOTES: db.manifest.readmeFragmentPath
      ? readFrag(db.dir, db.manifest.readmeFragmentPath, tokens).trim()
      : '',
  });
  if (skipAuth) {
    readme = readme
      .replace(
        /^# (.+?) — Next\.js 16 \+ NestJS \+ Better Auth Monorepo/m,
        '# $1 — Next.js 16 + NestJS Monorepo',
      )
      .replace(
        /\n\nA reference monorepo for \*\*cross-app authentication done right\*\*\.[\s\S]*?All\nauth traffic is proxied same-origin through Next\.js rewrites\./,
        '\n\nA reference monorepo for a Next.js frontend and separate NestJS backend without the optional authentication modules. The browser reaches the API through same-origin Next.js rewrites.',
      )
      .replace(/\n\| Auth\s+\| Better Auth\s+\|\n/, '\n')
      .replace(/\n[^\n]*├── packages\/auth[^\n]*\n/, '\n')
      .replace(
        /\n[^\n]*└── apps\/api\/\s+# NestJS\s+\(port 4000\) — Better Auth handler/,
        '\n│   └── apps/api/               # NestJS HTTP API (port 4000)',
      )
      .replace(
        /## The three traps[\s\S]*?\n---\n/,
        '## Request flow\n\nThe browser uses the Next.js origin for API requests. Next.js rewrites `/api/*` to the NestJS service, avoiding direct browser-to-API cross-origin traffic.\n\n---\n',
      )
      .replace(/## Rate limiting[\s\S]*?\n---\n/, '')
      .replace(/\nGenerate a secret for the API:[\s\S]*?```\n/, '\n')
      .replace(/## Notes on Next\.js 16 \/ NestJS 11 wildcards[\s\S]*$/, '')
      .replace(
        /## Auth setup[\s\S]*?\n---\n/,
        '## Authentication\n\nAuthentication is disabled in this project because it was generated with `--skip-auth`.\n\n---\n',
      )
      .replace(
        /## Bootstrap an admin user[\s\S]*?\n## Data model/,
        '## Bootstrap an admin user\n\nNo admin seed is generated when authentication is disabled.\n\n## Data model',
      );
  }
  if (!hasEmailPassword) {
    readme = readme.replace(
      /## Bootstrap an admin user[\s\S]*?\n## Data model/,
      '## Bootstrap an admin user\n\nNo admin seed is generated because the email-password provider is not enabled.\n\n## Data model',
    );
  }
  if (skipUi) {
    readme = readme
      .replace(/, shadcn\/ui/, '')
      .replace(/\n[^\n]*├── ui\/[^\n]*\n/, '\n')
      .replace(/\n[^\n]*├── packages\/ui[^\n]*\n/, '\n')
      .replace(
        /## Repository structure/,
        '## Repository structure\n\nThis output omits the shared `packages/ui` package and uses a small local UI shim at `apps/web/components/ui.tsx`.',
      );
  }
  write(outDir, 'README.md', readme);

  const manifestPath = path.join(outDir, '.betternest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
  manifest.generatedFiles = Object.fromEntries(
    walkFiles(outDir)
      .filter((file) => path.relative(outDir, file) !== '.betternest.json')
      .map((file) => [toPosix(path.relative(outDir, file)), hashFile(file)]),
  );
  write(outDir, '.betternest.json', JSON.stringify(manifest, null, 2) + '\n');
}
