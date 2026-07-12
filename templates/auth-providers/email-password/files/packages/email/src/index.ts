import type { EmailDriver, EmailPayload } from './types';
import { createResendDriver } from './drivers/resend';
import { createSmtpDriver } from './drivers/smtp';

export type { EmailPayload } from './types';

// ── The single email seam for the whole monorepo ──
// Nothing outside this package imports a provider SDK (Resend, nodemailer, ...).
// Swapping providers = flip EMAIL_PROVIDER (or add a driver under drivers/);
// the Better Auth config and controllers keep calling sendEmail() unchanged.

// Instantiated lazily so a missing/incomplete provider config never crashes
// process start (booting the API, health checks) — it only fails when an email
// is actually sent.
let driver: EmailDriver | null = null;

function getDriver(): EmailDriver {
  if (driver) return driver;
  const provider = (process.env.EMAIL_PROVIDER ?? 'resend').toLowerCase();
  switch (provider) {
    case 'resend':
      driver = createResendDriver();
      break;
    case 'smtp':
      driver = createSmtpDriver();
      break;
    default:
      throw new Error(
        `Unknown EMAIL_PROVIDER "${provider}". Supported values: "resend", "smtp".`,
      );
  }
  return driver;
}

export async function sendEmail({
  to,
  subject,
  html,
}: EmailPayload): Promise<void> {
  // Resend requires a verified sender. In development you can use
  // "onboarding@resend.dev" (Resend) — but it only delivers to your own Resend
  // account address; use SMTP (e.g. Mailpit) to test arbitrary recipients.
  const from = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';
  try {
    await getDriver().send({ from, to, subject, html });
  } catch (err) {
    // Better Auth swallows errors thrown from its email callbacks, so without
    // this an email misconfiguration is invisible (no email, no trace). Make
    // the real cause loud in the server logs.
    console.error('[@repo/email] Failed to send email:', err);
    throw err;
  }
}
