### Email &amp; Password

Sign-up, sign-in, **email verification**, and **password reset** are all enabled.
Emails are sent through the `@repo/email` package — the only place an email
provider SDK is used, so you can swap providers without touching auth.

Pick a provider with `EMAIL_PROVIDER` and set `EMAIL_FROM` in `apps/api/.env`:

**Resend** (`EMAIL_PROVIDER=resend`, the default)

1. Create an API key at <https://resend.com/api-keys> → set `RESEND_API_KEY`.
2. Verify a domain in Resend and set `EMAIL_FROM` to an address on it
   (e.g. `noreply@myapp.com`). Every send attempt is logged to the API console
   with the Resend email id — click it to check delivery status.

**SMTP / nodemailer** (`EMAIL_PROVIDER=smtp`)

Works with any SMTP server (Gmail, Postmark, Amazon SES, ...). Set `SMTP_HOST`,
`SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` (and `SMTP_SECURE` if needed).
`EMAIL_FROM` must match your SMTP user. For local development, a mail catcher
like [Mailpit](https://github.com/axllent/mailpit) (`SMTP_HOST=localhost`,
`SMTP_PORT=1025`, no auth) lets you inspect every message without delivering.

New sign-ups must click the verification link before they can sign in. The
sign-in screen has a "Forgot password?" link and can resend the verification
email (rate-limited). Every email attempt is logged to the API console.
