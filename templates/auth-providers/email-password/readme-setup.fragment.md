### Email &amp; Password

Sign-up, sign-in, **email verification**, and **password reset** are all enabled.
Emails are sent through the `@repo/email` package — the only place an email
provider SDK is used, so you can swap providers without touching auth.

Pick a provider with `EMAIL_PROVIDER` and set `EMAIL_FROM` in `apps/api/.env`:

**Resend** (`EMAIL_PROVIDER=resend`, the default)

1. Create an API key at <https://resend.com/api-keys> → set `RESEND_API_KEY`.
2. Set `EMAIL_FROM` to a verified sender. The dev address `onboarding@resend.dev`
   works **only if the recipient is your own Resend account email** — sending to
   anyone else returns a 403 and no email is delivered. To email real users,
   verify a domain in Resend and send from an address on it.

**SMTP / nodemailer** (`EMAIL_PROVIDER=smtp`)

Works with any SMTP server (Gmail, Postmark, Amazon SES, ...). Set `SMTP_HOST`,
`SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` (and `SMTP_SECURE` if needed). For local
development, a mail catcher like [Mailpit](https://github.com/axllent/mailpit)
(`SMTP_HOST=localhost`, `SMTP_PORT=1025`) lets you inspect every message without
delivering it — handy for testing arbitrary recipients.

New sign-ups must click the verification link before they can sign in. The
sign-in screen has a "Forgot password?" link and can resend the verification
email (rate-limited). Email sends that fail are logged to the API console.
