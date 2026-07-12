'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { authClient } from '@/lib/auth-client';

export function EmailPasswordSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set when sign-in is blocked because the email hasn't been verified yet, so
  // we can offer a one-click "resend verification email" action.
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    setResent(false);
    setLoading(true);

    const { error } = await authClient.signIn.email({ email, password });

    setLoading(false);
    if (error) {
      // Better Auth answers 403 when requireEmailVerification blocks sign-in.
      if (error.status === 403) {
        setUnverified(true);
      }
      setError(error.message ?? 'Unable to sign in');
      return;
    }
    router.push('/dashboard');
  }

  async function resendVerification() {
    setResent(false);
    await authClient.sendVerificationEmail({ email, callbackURL: '/dashboard' });
    setResent(true);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {unverified ? (
        resent ? (
          <p className="text-sm text-muted-foreground">
            Verification email sent — check your inbox.
          </p>
        ) : (
          <button
            type="button"
            onClick={resendVerification}
            className="text-left text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Resend verification email
          </button>
        )
      ) : null}
      <Button type="submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}

export function EmailPasswordSignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // With requireEmailVerification, sign-up does NOT create a session — the user
  // must verify first — so we show a "check your email" state instead of
  // redirecting to the dashboard.
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await authClient.signUp.email({ name, email, password });

    setLoading(false);
    if (error) {
      setError(error.message ?? 'Unable to sign up');
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Check your email</p>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to {email}. Click it to activate your account, then sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ada Lovelace"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? 'Creating…' : 'Create account'}
      </Button>
    </form>
  );
}
