---
"create-betternest-app": minor
---

Add email verification and password reset to the email-password provider. Generated projects now ship a new swappable `@repo/email` package with pluggable drivers — **Resend** or **SMTP/nodemailer**, selected via `EMAIL_PROVIDER` — plus forgot-password / reset-password pages, verification-aware sign-in and sign-up (with a rate-limited "resend verification" action), failed-send logging, and email env config. All of it is added only when the email-password provider is selected.
