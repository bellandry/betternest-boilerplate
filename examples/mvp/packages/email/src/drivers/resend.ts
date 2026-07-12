import { Resend } from 'resend';
import type { EmailDriver } from '../types';

// Resend driver. The only file in the monorepo that imports the Resend SDK.
export function createResendDriver(): EmailDriver {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set — cannot send email via Resend. See .env.example.');
  }
  const client = new Resend(apiKey);

  return {
    async send({ from, to, subject, html }) {
      const { error } = await client.emails.send({ from, to, subject, html });
      if (error) {
        // e.g. 403 "You can only send testing emails to your own address"
        // when EMAIL_FROM is onboarding@resend.dev and `to` is someone else.
        throw new Error(`Resend rejected the email: ${error.message}`);
      }
    },
  };
}
