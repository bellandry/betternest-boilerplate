### Email &amp; Password

Sign-up, sign-in, **email verification**, and **password reset** are all enabled.

Verification and reset emails are sent through [Resend](https://resend.com) via
the `@repo/email` package (the only place the Resend SDK is used — swap providers
there without touching auth). Configure two env vars in `apps/api/.env`:

1. Create an API key at <https://resend.com/api-keys> → set `RESEND_API_KEY`.
2. Set `EMAIL_FROM` to a verified sender. In development you can use
   `onboarding@resend.dev` without verifying a domain; in production, verify your
   own domain in Resend and use an address on it.

New sign-ups must click the verification link before they can sign in. The
sign-in screen offers a "Forgot password?" link and can resend the verification
email.
