import Link from 'next/link';

import { getServerSession } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8 text-lg font-semibold tracking-tight">
        {{PROJECT_NAME}}
      </Link>
      {children}
    </div>
  );
}
