---
"create-betternest-app": patch
---

Fix Tailwind v4 shadcn styles not being applied. Consolidated the full theme (@theme, CSS variables, @layer base) into apps/web/app/globals.css alongside the @import 'tailwindcss' + @source directive. Removed duplicate @repo/ui/globals.css import from layout.tsx that was causing a double @theme resolution conflict in the monorepo setup.
