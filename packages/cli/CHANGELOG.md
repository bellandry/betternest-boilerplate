# create-betternest-app

## 0.2.2

### Patch Changes

- 12d1733: Update the `@clack/prompts` runtime dependency to v1. This requires **Node.js 20+** (clack v1 is ESM-only and uses Node 20 APIs), so the CLI's minimum supported Node version is now 20 — matching the Node requirement of the projects it generates.

## 0.2.1

### Patch Changes

- 5de9a11: Fix the generated NestJS API failing to boot in production (`node dist/main.js`):

  - Declare `express` as a direct dependency of `apps/api` (it is imported at runtime in `main.ts`).
  - Compile the internal `@repo/auth` and `@repo/db` packages to CommonJS and point their `exports`/`main`/`types` at `dist/`, so the built API loads compiled JavaScript instead of raw TypeScript source.

## 0.2.0

### Minor Changes

- aee7c2f: Initial CLI release
