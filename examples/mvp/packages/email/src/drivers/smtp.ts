import nodemailer from 'nodemailer';
import type { EmailDriver } from '../types';

// SMTP driver (nodemailer). Works with any SMTP server: Gmail, Postmark,
// Mailgun, Amazon SES, or a local catcher like Mailpit/Mailhog in development.
export function createSmtpDriver(): EmailDriver {
  const host = process.env.SMTP_HOST;
  if (!host) {
    throw new Error('SMTP_HOST is not set — cannot send email via SMTP. See .env.example.');
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  const transport = nodemailer.createTransport({
    host,
    port,
    // Port 465 is implicit TLS; 587/25 use STARTTLS. Override with SMTP_SECURE.
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  return {
    async send({ from, to, subject, html }) {
      // eslint-disable-next-line no-console
      console.log(`[@repo/email] [smtp] Connecting to ${host}:${port}...`);
      const info = await transport.sendMail({ from, to, subject, html });
      // eslint-disable-next-line no-console
      console.log(`[@repo/email] [smtp] Accepted — messageId: ${info.messageId}`);
    },
  };
}
