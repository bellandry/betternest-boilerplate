import { headers } from 'next/headers';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
};

export type ServerSession = {
  user: SessionUser;
  session: { id: string; expiresAt: string };
} | null;

// Server-side session retrieval for Server Components / protected layouts.
// This runs on the server, so it calls the NestJS API DIRECTLY (server-to-
// server, internal API_URL) and forwards the incoming browser cookies. No CORS
// applies because this is not a browser request.
export async function getServerSession(): Promise<ServerSession> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:4000';
  const cookie = (await headers()).get('cookie') ?? '';

  const res = await fetch(`${apiUrl}/api/auth/get-session`, {
    headers: { cookie },
    cache: 'no-store',
  });

  if (!res.ok) return null;

  const data = (await res.json()) as ServerSession;
  if (!data || !data.user) return null;
  return data;
}
