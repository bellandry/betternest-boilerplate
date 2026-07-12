export type ProviderKind = 'credential' | 'oauth';

// Availability of a template in the catalog. `coming-soon` entries are shown
// (disabled) in the CLI as a roadmap preview but can never be selected.
export type TemplateStatus = 'available' | 'coming-soon';

// A single auth method (email/password, Google, GitHub, ...).
// Adding a new provider = adding a folder under templates/auth-providers/ that
// exports a manifest shaped like this. The generator never hardcodes provider
// ids — it only reads these manifests.
export interface ProviderManifest {
  id: string;
  label: string;
  kind: ProviderKind;
  // Defaults to 'available' when omitted.
  status?: TemplateStatus;
  // Env vars this provider needs (for future CLI validation / docs).
  requiredEnvVars: string[];

  // Better Auth server config injected into packages/auth/src/index.ts:
  //  - credential kind -> a top-level block (e.g. `emailAndPassword: {...},`)
  //  - oauth kind      -> a single inner entry that the generator wraps inside
  //    one shared `socialProviders: { ... }` object.
  serverConfigFragmentPath: string;

  // Self-contained React component module copied into the generated web app.
  clientUiFragmentPath: string;
  clientUiTargetPath: string; // where it lands under apps/web/components/auth/
  clientUiImport: string; // import line added to the auth pages

  // JSX injected into the page markers (only the relevant ones per kind).
  signInSlot?: string; // credential -> the sign-in form element
  signUpSlot?: string; // credential -> the sign-up form element
  oauthButtonSlot?: string; // oauth -> the button element

  // Optional top-level import line(s) injected into packages/auth/src/index.ts
  // at the AUTH_PROVIDER_IMPORT marker (e.g. `import { sendEmail } from
  // '@repo/email';`). Kept separate from serverConfigFragment because that one
  // is injected *inside* the betterAuth({ ... }) call, not at module scope.
  serverImportFragmentPath?: string;

  // Optional package.json fragment deep-merged into packages/auth/package.json
  // (e.g. to add a `@repo/email` workspace dependency). Only applied when this
  // provider is selected, so OAuth-only projects stay lean.
  authPackageJsonFragmentPath?: string;

  // Optional directory copied verbatim into the project root when this provider
  // is selected (same semantics as DbManifest.filesDir): .hbs files are
  // token-substituted + de-suffixed. Used to ship provider-only packages
  // (packages/email) and pages (reset-password) without bloating other setups.
  filesDir?: string;

  // Optional .env.example snippet + README setup instructions.
  envFragmentPath?: string;
  readmeSetupPath?: string;
}

// A database choice (Prisma, Drizzle, ...).
export interface DbManifest {
  id: string;
  label: string;
  // Defaults to 'available' when omitted.
  status?: TemplateStatus;
  // Directory whose contents are copied verbatim into the project root
  // (e.g. packages/db/**). .hbs files are token-substituted + de-suffixed.
  filesDir: string;
  // Deep-merged into the generated root package.json (adds db:* scripts).
  packageJsonFragmentPath?: string;
  // Injected into the api .env.example DATABASE_ENV marker.
  envFragmentPath?: string;
  // Injected into packages/auth/src/index.ts DB markers.
  adapterImportFragmentPath: string;
  adapterConfigFragmentPath: string;
}

export interface Selection {
  projectName: string;
  db: string; // db manifest id, e.g. 'prisma'
  authProviders: string[]; // provider manifest ids (folder names under templates/auth-providers)
}
