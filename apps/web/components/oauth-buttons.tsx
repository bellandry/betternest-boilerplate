'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/button';
import { authClient } from '@/lib/auth-client';

// Shared "Continue with Google / GitHub" buttons.
// signIn.social triggers the full-page OAuth redirect flow, which returns to
// the same-origin callback (/api/auth/callback/<provider>) via the proxy.
export function OAuthButtons({ callbackURL = '/dashboard' }: { callbackURL?: string }) {
  const [loading, setLoading] = useState<'google' | 'github' | null>(null);

  async function handle(provider: 'google' | 'github') {
    setLoading(provider);
    try {
      await authClient.signIn.social({ provider, callbackURL });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={loading !== null}
        onClick={() => handle('google')}
      >
        {loading === 'google' ? 'Redirecting…' : 'Continue with Google'}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={loading !== null}
        onClick={() => handle('github')}
      >
        {loading === 'github' ? 'Redirecting…' : 'Continue with GitHub'}
      </Button>
    </div>
  );
}
