---
"create-betternest-app": minor
---

Bump all dependencies to latest and migrate Tailwind CSS from v3 to v4.

**Tailwind v4 migration:**
- Removed `tailwind.config.ts` and `tailwind.preset.ts` — config is now CSS-first
  via `@theme` in `globals.css`
- `postcss.config.mjs` uses `@tailwindcss/postcss` instead of the v3 plugin
- `autoprefixer` removed (bundled in Tailwind v4)
- Class-based dark mode preserved via `@custom-variant dark`
- All shadcn-like color tokens and border-radius tokens are now in `@theme`

**Dependency bumps (templates):**
- next: ^16.0.0 → ^16.2.10
- react / react-dom: ^19.0.0 → ^19.2.7
- @nestjs/*: ^11.0.0 → ^11.1.28
- prisma / @prisma/client: ^7.0.0 → ^7.8.0
- drizzle-orm / drizzle-kit: already at latest
- tailwindcss: ^3.4.17 → ^4.3.2
- lucide-react: ^0.468.0 → ^1.24.0
- zod: ^3.24.1 → ^4.4.3
- typescript: ^5.6.3 → ^7.0.2
- eslint: ^9.15.0 → ^10.7.0
- dotenv: ^16.x → ^17.4.2
- express: ^5.0.0 → ^5.2.1
- turbo: ^2.3.3 → ^2.10.5
- prettier: ^3.3.3 → ^3.9.5
- tailwind-merge: ^2.5.5 → ^3.4.0
- @types/node: ^22.10.1 → ^26.1.1
- @types/react + @types/react-dom: updated to ^19.2.7
- @eslint/js, typescript-eslint, eslint-config-prettier, globals: latest
- pg: ^8.13.0 → ^8.22.0
- postcss: ^8.4.49 → ^8.5.19

**Monorepo bumps:**
- jiti: ^2.4.2 → ^2.7.0
- tsup: ^8.3.5 → ^8.5.1
