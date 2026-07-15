import type { NextConfig } from 'next';

// ── The heart of the anti-CORS design ──
// Every /api/* request the browser makes stays on the Next.js origin
// (http://localhost:3000). Next transparently PROXIES it to the NestJS API.
// Because the browser only ever talks to ONE origin, there is:
//   - no cross-site request  -> no CORS preflight, ever
//   - no cross-site cookie    -> the session cookie is first-party
//   - no trustedOrigins mismatch on the browser side
const API_URL = process.env.API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/ui'],
  async rewrites() {
    return [
      // Auth endpoints (sign-in, callbacks, get-session, sign-out, ...)
      { source: '/api/auth/:path*', destination: `${API_URL}/api/auth/:path*` },
      // Any other API route (e.g. /api/users/me)
      { source: '/api/:path*', destination: `${API_URL}/api/:path*` },
    ];
  },
};

export default nextConfig;
