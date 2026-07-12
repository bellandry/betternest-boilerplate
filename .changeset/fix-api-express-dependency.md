---
"create-betternest-app": patch
---

Fix the generated NestJS API failing to boot in production (`node dist/main.js`):

- Declare `express` as a direct dependency of `apps/api` (it is imported at runtime in `main.ts`).
- Compile the internal `@repo/auth` and `@repo/db` packages to CommonJS and point their `exports`/`main`/`types` at `dist/`, so the built API loads compiled JavaScript instead of raw TypeScript source.
