'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { authClient } from '@/lib/auth-client';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (session?.user.name) setName(session.user.name);
  }, [session?.user.name]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    // Profile mutation goes through Better Auth directly (same-origin proxy).
    await authClient.updateUser({ name });
    setSaving(false);
    setSaved(true);
  }

  async function onSignOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push('/sign-in');
  }

  if (isPending) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  const user = session?.user;

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-medium">
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="text-sm">
              <p className="font-medium">{user?.email}</p>
              <p className="text-muted-foreground">
                Role: {(user as { role?: string })?.role ?? 'user'}
              </p>
            </div>
          </div>

          <form onSubmit={onSave} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              {saved ? <span className="text-sm text-muted-foreground">Saved</span> : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <Button variant="destructive" onClick={onSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </div>
  );
}
