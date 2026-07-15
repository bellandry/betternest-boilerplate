import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// ── Lightweight edge-safe protection (Next.js 16 `proxy` convention) ──
// The edge runtime can't hit the database, so we only check that a session
// cookie EXISTS here (fast, no DB, no network). The real validation happens
// server-side in the (app) layout via getServerSession(). This two-tier
// pattern is the one Better Auth recommends for Next.js.
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// Only guard the protected (app) group routes.
export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
