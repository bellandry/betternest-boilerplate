'use client';

import Link from 'next/link';
import { EmailPasswordSignInForm, EmailPasswordSignUpForm } from '@/components/auth/email-password-form';
import { GoogleButton } from '@/components/auth/google-button';
import { GithubButton } from '@/components/auth/github-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/ui/card';

export default function SignInPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
<EmailPasswordSignInForm />
<div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" /></div>
<div className="flex flex-col gap-2">
<GoogleButton />
<GithubButton />
</div>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        No account?&nbsp;
        <Link
          href="/sign-up"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
}
