import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@repo/db';

const isProd = process.env.NODE_ENV === 'production';

// ── The single source of truth for auth in the whole monorepo ──
// Imported ONLY by the NestJS API (packages/auth is server-only: it pulls in
// Prisma). The Next.js front never imports this file — it talks to the auth
// endpoints through the same-origin proxy via lib/auth-client.ts.
export const auth = betterAuth({
  // Base URL of the PUBLIC origin the browser sees = the Next.js app.
  // OAuth callbacks and redirects are built from this, so the browser always
  // stays same-origin and the proxy forwards to this NestJS process.
  baseURL: process.env.WEB_URL ?? 'http://localhost:3000',
  basePath: '/api/auth',

  secret: process.env.BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    // Post-MVP: no email verification / reset password yet.
    requireEmailVerification: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    },
  },

  // Only the Next.js origin may drive the auth flow.
  // NEVER use '*' here — it silently accepts hostile origins.
  trustedOrigins: [process.env.WEB_URL ?? 'http://localhost:3000'],

  user: {
    additionalFields: {
      // RBAC groundwork. `input: false` => a client can't set its own role
      // during sign-up. No UI reads this yet at MVP.
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: false,
      },
    },
  },

  advanced: {
    // The #3 prod trap: cookies that don't survive cross-site.
    // Prod = HTTPS + potential cross-site => SameSite=None; Secure.
    // Dev  = HTTP localhost => SameSite=Lax; not Secure (browsers drop
    // Secure cookies on http://).
    defaultCookieAttributes: isProd
      ? { sameSite: 'none', secure: true, httpOnly: true }
      : { sameSite: 'lax', secure: false, httpOnly: true },
  },
});

export type Auth = typeof auth;
export type Session = Auth['$Infer']['Session'];
