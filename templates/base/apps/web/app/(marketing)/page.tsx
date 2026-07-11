import Link from 'next/link';
import { Button } from '@repo/ui/button';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <span className="rounded-full border px-4 py-1 text-sm text-muted-foreground">
        Next.js 16 · NestJS · Better Auth
      </span>
      <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
        The {{PROJECT_NAME}} starter
      </h1>
      <p className="max-w-xl text-balance text-lg text-muted-foreground">
        Cross-app authentication that just works. Same-origin proxy, session cookies that survive
        production, and zero CORS headaches — solved structurally, not patched.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/sign-up">Get started</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}
