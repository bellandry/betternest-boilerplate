---
"create-betternest-app": patch
---

Fix Tailwind v4: move @source directive before @import 'tailwindcss' so the scanner detects shadcn classes in packages/ui. Add auto port fallback: API catches EADDRINUSE and tries next port, web uses scripts/dev.mjs to find first free port starting from 3000.
