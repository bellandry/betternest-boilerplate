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

export default function SignUpPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Create account</CardTitle>
        <CardDescription>Start with email, or use a social provider.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
<EmailPasswordSignUpForm />
<div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" /></div>
<div className="flex flex-col gap-2">
<GoogleButton />
<GithubButton />
</div>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have an account?&nbsp;
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
