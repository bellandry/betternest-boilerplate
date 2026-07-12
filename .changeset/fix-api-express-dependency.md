---
"create-betternest-app": patch
---

Fix the generated API failing to boot with "Cannot find module 'express'" by declaring `express` as a direct dependency (it is imported at runtime in `main.ts`).
