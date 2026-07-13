import fs from 'node:fs';
import path from 'node:path';
import type { DbManifest, ProviderManifest, Selection } from './types';
import { buildTokens, replaceTokens } from './tokens';
import { copyBaseFiles } from './copy-base-files';
import { injectMarkers } from './inject-markers';
import { mergePackageJson } from './merge-package-json';
import { mergeEnvFile } from './merge-env-files';
import { DEFAULT_TEMPLATES_DIR, loadManifest } from './manifests';

// Base files the assembler composes from fragments (POSIX, project-relative,
// .hbs stripped). copyBaseFiles skips these; we write them explicitly.
const COMPOSED = new Set<string>([
  'package.json',
  'README.md',
  'apps/api/.env.example',
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

  const providers: LoadedProvider[] = [];
  for (const id of selection.authProviders) {
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

  // ── 1. Base tree (skips composed files) ──
  copyBaseFiles(baseDir, outDir, tokens, COMPOSED);

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

  // ── 2c. packages/auth/package.json (base + provider dependency fragments) ──
  let authPkg = readBase(baseDir, 'packages/auth/package.json', tokens);
  for (const p of providers) {
    if (!p.manifest.authPackageJsonFragmentPath) continue;
    authPkg = mergePackageJson(
      authPkg,
      readFrag(p.dir, p.manifest.authPackageJsonFragmentPath, tokens),
    );
  }
  write(outDir, 'packages/auth/package.json', authPkg);

  // ── 3. packages/auth/src/index.ts ──
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
    SOCIAL_PROVIDERS_CONFIG: oauth.length
      ? `socialProviders: {\n${socialInner}\n},`
      : '',
  });
  write(outDir, 'packages/auth/src/index.ts', authIndex);

  // ── 4. Auth provider UI component modules ──
  for (const p of providers) {
    write(
      outDir,
      p.manifest.clientUiTargetPath,
      readFrag(p.dir, p.manifest.clientUiFragmentPath, tokens),
    );
  }

  // ── 5. sign-in / sign-up pages ──
  const uiImports = providers.map((p) => p.manifest.clientUiImport).join('\n');
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
      AUTH_UI_IMPORTS: uiImports,
      SIGN_IN_FORM: signInForm,
      AUTH_DIVIDER: dividerFor(signInForm),
      OAUTH_BUTTONS: oauthButtons,
    }),
  );
  write(
    outDir,
    'apps/web/app/(auth)/sign-up/page.tsx',
    injectMarkers(readBase(baseDir, 'apps/web/app/(auth)/sign-up/page.tsx.hbs', tokens), {
      AUTH_UI_IMPORTS: uiImports,
      SIGN_UP_FORM: signUpForm,
      AUTH_DIVIDER: dividerFor(signUpForm),
      OAUTH_BUTTONS: oauthButtons,
    }),
  );

  // ── 6. apps/api/.env.example (base skeleton + db + providers) ──
  const dbEnv = db.manifest.envFragmentPath ? readFrag(db.dir, db.manifest.envFragmentPath, tokens) : '';
  const providerEnvs = providers
    .filter((p) => p.manifest.envFragmentPath)
    .map((p) => readFrag(p.dir, p.manifest.envFragmentPath as string, tokens));
  write(
    outDir,
    'apps/api/.env.example',
    mergeEnvFile(readBase(baseDir, 'apps/api/.env.example.hbs', tokens), dbEnv, providerEnvs),
  );

  // ── 7. root package.json (base + db scripts fragment) ──
  let rootPkg = readBase(baseDir, 'package.json.hbs', tokens);
  if (db.manifest.packageJsonFragmentPath) {
    rootPkg = mergePackageJson(rootPkg, readFrag(db.dir, db.manifest.packageJsonFragmentPath, tokens));
  }
  write(outDir, 'package.json', rootPkg);

  // ── 8. README.md (base + provider setup steps) ──
  const setupSteps = providers
    .filter((p) => p.manifest.readmeSetupPath)
    .map((p) => readFrag(p.dir, p.manifest.readmeSetupPath as string, tokens).trim())
    .filter(Boolean)
    .join('\n\n');
  write(
    outDir,
    'README.md',
    injectMarkers(readBase(baseDir, 'README.md.hbs', tokens), {
      AUTH_SETUP_STEPS: setupSteps,
      DB_NOTES: db.manifest.readmeFragmentPath
        ? readFrag(db.dir, db.manifest.readmeFragmentPath, tokens).trim()
        : '',
    }),
  );
}
