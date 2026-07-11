import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';

// Protected layout. Middleware already blocked users without a session cookie;
// here we do the REAL server-side validation (hits the API + DB) and expose
// the session to child Server Components implicitly via getServerSession.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            {{PROJECT_NAME}}
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/profile" className="text-muted-foreground hover:text-foreground">
              Profile
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
