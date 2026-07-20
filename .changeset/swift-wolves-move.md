---
"create-betternest-app": patch
---

Add built-in rate limiting on auth endpoints (sign-in, sign-up, forget-password, reset-password). 5 attempts per IP per 15-minute sliding window per endpoint. Configurable via RATE_LIMIT_MAX / RATE_LIMIT_WINDOW env vars with hot reload. Optional Redis storage for multi-instance deploys.
