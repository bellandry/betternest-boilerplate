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
