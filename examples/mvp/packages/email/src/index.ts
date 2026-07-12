import { Resend } from 'resend';

// ── The single email seam for the whole monorepo ──
// Nothing outside this file imports the Resend SDK. Swapping to Postmark, SMTP,
// SES, ... means rewriting only this module — the Better Auth config and any
// controller keep calling sendEmail() unchanged.

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Instantiated lazily so a missing RESEND_API_KEY never crashes process start
// (e.g. booting the API, health checks) — it only fails if an email is sent.
let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set — cannot send email. See .env.example.');
    }
    client = new Resend(apiKey);
  }
  return client;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  // Resend requires a verified sender. In development you can use
  // "onboarding@resend.dev" without verifying a domain.
  const from = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';
  const { error } = await getClient().emails.send({ from, to, subject, html });
  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
