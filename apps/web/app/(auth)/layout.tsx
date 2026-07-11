import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8 text-lg font-semibold tracking-tight">
        Golden Path
      </Link>
      {children}
    </div>
  );
}
