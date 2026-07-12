# Security Policy

BetterNest Boilerplate scaffolds authentication-critical infrastructure
(Better Auth, session cookies, OAuth flows, database access). Because generated
projects handle real user credentials, we take the security of both the
generator and the code it emits seriously.

## Supported versions

Security fixes land on the latest published release of
[`create-betternest-app`](https://www.npmjs.com/package/create-betternest-app).
Always scaffold new projects with the newest version (`npm create betternest-app@latest`)
and keep already-generated projects up to date with their own dependency updates.

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| older   | :x:                |

## Reporting a vulnerability

**Please do _not_ open a public GitHub issue, pull request, or Discussion for a
security vulnerability.** Public disclosure before a fix is available puts every
downstream project at risk.

Instead, report it privately through **GitHub Security Advisories**:

1. Go to the repository's **[Security](https://github.com/bellandry/betternest-boilerplate/security)** tab.
2. Click **Report a vulnerability** (this opens a private advisory draft visible
   only to you and the maintainers).
3. Describe the issue with as much detail as you can:
   - affected component (the CLI/generator, a specific template, or generated code),
   - the version of `create-betternest-app` used and the choices made during
     generation (database, auth providers),
   - reproduction steps or a proof of concept,
   - the impact you foresee.

If you cannot use GitHub Security Advisories, contact the maintainer directly
through their [GitHub profile](https://github.com/bellandry) and request a
private channel before sharing any details.

## Our commitment

- We will **acknowledge your report within 5 business days**.
- We will keep you informed of our progress as we investigate and work on a fix.
- We will credit you in the advisory once a fix is released, unless you prefer to
  remain anonymous.
- We ask that you give us a reasonable window to release a fix before any public
  disclosure (coordinated disclosure).

## Handling sensitive credentials

This starter generates projects that rely on secrets such as
`BETTER_AUTH_SECRET` and OAuth client secrets (Google, GitHub, ...). Whether you
are contributing here or using a generated project, follow these practices:

- **Never commit a `.env` file.** Generated projects ship a `.gitignore` that
  excludes it and an `.env.example` documenting the required variables — commit
  only the example.
- **Generate a strong `BETTER_AUTH_SECRET`** (e.g. `openssl rand -base64 32`) and
  use a distinct value per environment (local, staging, production).
- **Never paste real secrets** into issues, Discussions, pull requests, or logs.
- **Rotate immediately on suspected leak.** If a secret is exposed (committed by
  mistake, leaked in a log, shared accidentally):
  1. rotate/revoke it at the source (regenerate `BETTER_AUTH_SECRET`, revoke and
     reissue OAuth client secrets in the provider console),
  2. invalidate active sessions if the auth secret changed,
  3. purge the secret from git history (e.g. `git filter-repo`) — remember that
     rotation, not deletion, is what actually neutralizes a leaked secret.
- **Keep dependencies patched.** Watch the automated dependency PRs (Dependabot)
  and apply security updates for `better-auth`, `next`, `@nestjs/*`, and
  `prisma` promptly.

Thank you for helping keep BetterNest Boilerplate and its users safe.
