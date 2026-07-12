# Contributing

This repo is the **template system** behind the BetterNest Boilerplate starter.
It does not contain a runnable app at the root — it contains the fragments and
the generator that assemble one. The runnable reference output lives in
`examples/mvp/` (generated, never hand-edited).

## Layout

```
templates/
  base/                 # files in 100% of generated projects (token-substituted)
  db/<id>/              # a database choice (manifest + fragments + files/)
  auth-providers/<id>/  # an auth method (manifest + fragments)
packages/generator/     # the assembly engine (no CLI, pure logic)
scripts/                # generate-default, smoke-test
examples/mvp/           # committed generated reference (do not edit by hand)
```

Assembly rules the generator relies on:

- **Tokens** — `{{PROJECT_NAME}}`, `{{DB_NAME}}` in `.hbs` (and any text) files,
  replaced by a dumb string substitution. No templating logic/helpers.
- **Markers** — comment lines the generator replaces with concatenated
  fragments. Known markers: `DB_ADAPTER_IMPORT`, `DB_ADAPTER_CONFIG`,
  `CREDENTIAL_PROVIDERS_CONFIG`, `SOCIAL_PROVIDERS_CONFIG` (auth config);
  `AUTH_UI_IMPORTS`, `SIGN_IN_FORM`, `SIGN_UP_FORM`, `AUTH_DIVIDER`,
  `OAUTH_BUTTONS` (auth pages); `DATABASE_ENV`, `AUTH_PROVIDER_ENV` (api env);
  `AUTH_SETUP_STEPS` (README).

## Add a new auth provider

Adding a provider requires **only a new folder** under
`templates/auth-providers/<id>/`. You never touch `packages/generator`.

Checklist — create these files and wire them in `manifest.ts`:

1. **`manifest.ts`** — `export default` a `ProviderManifest`
   (see `packages/generator/src/types.ts`). Set:
   - `id` / `label` / `kind` (`'credential'` or `'oauth'`)
   - `requiredEnvVars`
   - `serverConfigFragmentPath`
   - `clientUiFragmentPath` + `clientUiTargetPath` + `clientUiImport`
   - one of `signInSlot` / `signUpSlot` (credential) or `oauthButtonSlot` (oauth)
   - optional `envFragmentPath`, `readmeSetupPath`
2. **`server-config.fragment.ts`** — the Better Auth config snippet.
   - `credential`: a top-level block, e.g. `emailAndPassword: { enabled: true },`
   - `oauth`: a single inner entry only, e.g.
     `myprovider: { clientId: ..., clientSecret: ... },`
     (the generator wraps all oauth entries in one `socialProviders: {}`).
3. **`client-ui.fragment.tsx`** — a self-contained React component module. It is
   copied to `clientUiTargetPath`; the page renders it via the slot JSX.
4. **`env.fragment.txt`** *(oauth)* — the `.env.example` lines, with a
   `# --- ... ---` section header.
5. **`readme-setup.fragment.md`** — setup instructions injected into the README.

Then add the provider `id` to a `Selection` (e.g. `DEFAULT_SELECTION.ts`).

> See `templates/auth-providers/_placeholder-discord/` for a complete disabled
> example. Folders prefixed with `_` are never auto-included.

To surface a template as a disabled roadmap preview instead of hiding it, set
`status: 'coming-soon'` in its manifest (see `templates/db/drizzle/`). The CLI
shows it disabled and rejects it if passed via a flag.

## Add a new database choice

Create `templates/db/<id>/` with a `manifest.ts` (`DbManifest`),
`adapter-import.fragment.ts`, `adapter-config.fragment.ts`, an optional
`env.fragment.txt` + `package.json.fragment.json`, and a `files/` tree copied
into the project (e.g. `packages/db/**`). See `templates/db/prisma/`.

## Regenerate the reference output

After changing any template, regenerate `examples/mvp/`:

```bash
pnpm generate:default      # wipes + rebuilds examples/mvp, then formats it
```

Then verify a clean generation still installs, builds and lints in a throwaway
dir (never touches `examples/mvp`):

```bash
pnpm smoke-test
```

Commit the regenerated `examples/mvp/` alongside your template change so the
committed reference never drifts from the templates.

## Test the CLI locally (before publishing)

The CLI (`packages/cli`) wraps the generator behind prompts/flags. It ships as a
`tsup` bundle with `templates/` copied into `dist/templates`, so it must be
built before running.

```bash
# Build + run in one step (fastest iteration):
pnpm cli:dev my-test-app

# Non-interactive (matches CI usage):
pnpm cli:build
node packages/cli/dist/index.js my-test-app --yes --db=prisma --auth=email-password,google,github --no-install --no-git
```

To exercise the exact `npx` experience of a published package:

```bash
cd packages/cli
pnpm build
pnpm link --global
create-betternest-app my-test-app
pnpm unlink --global
```

Rebuild (`pnpm cli:build`) after changing templates — the bundle reads its own
copied `dist/templates`, not the repo `templates/`. See `packages/cli/README.md`
for the full flag reference.

## MANDATORY: verify the packaged CLI before publishing

A local run (`pnpm cli:dev`) reads templates straight from the repo and **cannot**
catch packaging bugs. Only a real tarball round-trip can, so this is a required
gate before any `pnpm publish`:

```bash
pnpm test:pack
```

`scripts/test-packaged-cli.ts` does what a real `npx create-betternest-app` does:

1. builds the CLI bundle,
2. `pnpm pack` → a real `.tgz` (not `npm pack`: only pnpm rewrites the
   `workspace:*` specifier into a concrete version; a raw `npm pack` ships a
   tarball that fails `npm install` with `EUNSUPPORTEDPROTOCOL`),
3. installs that tarball **as a dependency** in a throwaway project fully
   isolated from the monorepo (so only the published `dependencies` are present,
   exactly like npx),
4. runs the installed binary with `--yes`,
5. diffs the generated project against `examples/mvp` (Prettier-normalized).

It exits non-zero on any missing, extra, or differing file.

> ### Packaging gotcha: `.gitignore`
>
> npm **strips any file literally named `.gitignore`** from a published tarball.
> Template dotfiles that must survive packing are therefore stored under a
> pack-safe name and renamed on write by the generator
> (`packages/generator/src/copy-base-files.ts`, `PACK_SAFE_RENAMES`). The base
> ignore file lives at `templates/base/gitignore` (no dot) and is emitted as
> `.gitignore`. If you add another npm-stripped dotfile to a template, add it to
> that map — `pnpm test:pack` will fail loudly if you forget.

## Versioning & releases (changesets)

Versioning is managed with [changesets](https://github.com/changesets/changesets).
**After any change that affects `packages/cli` or `packages/generator`, add a
changeset before opening your PR:**

```bash
pnpm changeset
```

- Pick the appropriate semver bump:
  - **patch** — bug fix, no behavior change for the user (e.g. a template typo).
  - **minor** — new capability (e.g. a new auth provider or database choice).
  - **major** — a breaking change to generated projects or CLI flags.
- Describe the change in **one user-facing sentence** — what the change does for
  someone scaffolding a project, not how it's implemented internally.
  - Good: "Add Discord as an auth provider choice."
  - Avoid: "Refactor provider manifest loader to use jiti."

> `packages/generator` is `private` and never published on its own. Because it is
> inlined into the CLI bundle at build time, changes to it ship inside the CLI —
> so a generator change still warrants a changeset on `create-betternest-app`.
> Selecting the CLI in the `pnpm changeset` prompt is the right choice.

Only `packages/cli` (`create-betternest-app`) is publishable; every `private`
package is skipped automatically. Verify what a PR will release with:

```bash
pnpm changeset status
```

Maintainers cut a release by applying the accumulated changesets and publishing:

```bash
pnpm version-packages   # changeset version — bumps versions + writes CHANGELOG
pnpm release            # builds the CLI, then changeset publish
```


