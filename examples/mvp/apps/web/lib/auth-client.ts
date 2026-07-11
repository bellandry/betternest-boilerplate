import { createAuthClient } from 'better-auth/react';

// ── Same-origin by construction, without hardcoding the API ──
// Better Auth validates baseURL with `new URL()`, so it MUST be absolute — a
// relative string like '/api/auth' throws. The same-origin guarantee is kept
// by pointing the client at the CURRENT ORIGIN (the Next.js app), never at the
// API port:
//   - browser: window.location.origin  -> e.g. http://localhost:3000
//   - server (SSR): the app's own public URL (NEXT_PUBLIC_APP_URL)
// Combined with basePath, every request goes to <web-origin>/api/auth/* and is
// then proxied to NestJS by next.config.ts. The browser NEVER talks to the API
// port directly, so there is still no cross-site request, no CORS, no cookie
// pain.
const baseURL =
  typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
    : window.location.origin;

export const authClient = createAuthClient({
  baseURL,
  basePath: '/api/auth',
});
