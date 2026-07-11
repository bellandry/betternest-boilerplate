'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/button';
import { authClient } from '@/lib/auth-client';

// signIn.social triggers the full-page OAuth redirect flow, which returns to
// the same-origin callback (/api/auth/callback/github) via the Next.js proxy.
export function GithubButton({ callbackURL = '/dashboard' }: { callbackURL?: string }) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      await authClient.signIn.social({ provider: 'github', callbackURL });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" disabled={loading} onClick={handle}>
      {loading ? 'Redirecting…' : 'Continue with GitHub'}
    </Button>
  );
}
