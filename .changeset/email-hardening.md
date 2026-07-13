---
"create-betternest-app": patch
---

Harden the email pipeline against silent delivery failures:

- `sendEmail` now **requires** `EMAIL_FROM` to be explicitly set (no more silent `onboarding@resend.dev` fallback) and warns if the testing address is still used.
- Both drivers and `sendEmail` now log every attempt to the API console — you see exactly whether `sendEmail` was called, which driver handled it, and (for Resend) the email id in the Resend dashboard.
- The Resend driver now checks both the `error` and `data` fields from the API response; a missing email id is treated as a failure.
- Callback‑entry logs in the server config so you know Better Auth invoked the email callback.
- `.env.example` and README updated to document `EMAIL_FROM` per provider; `onboarding@resend.dev` is no longer a hidden default.
