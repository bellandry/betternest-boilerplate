import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { getServerSession } from '@/lib/auth-server';

// Server Component. Proves the session is retrieved server-side (no client
// fetch) and survives a full page refresh because the cookie is first-party.
export default async function DashboardPage() {
  const session = await getServerSession();
  const name = session?.user.name ?? 'there';

  const stats = [
    { label: 'Projects', value: '3' },
    { label: 'Members', value: '12' },
    { label: 'API calls', value: '1.2k' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {name}</h1>
        <p className="text-muted-foreground">Here is a snapshot of your workspace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
