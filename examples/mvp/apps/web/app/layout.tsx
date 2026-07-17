import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'my-app — Next.js + NestJS + Better Auth',
  description: 'Cross-app authentication starter with a same-origin auth proxy.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
