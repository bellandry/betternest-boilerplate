import type { EmailDriver, EmailPayload } from './types.js';
import { createResendDriver } from './drivers/resend.js';
import { createSmtpDriver } from './drivers/smtp.js';

export type { EmailPayload } from './types.js';

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
      throw new Error(`Unknown EMAIL_PROVIDER "${provider}". Supported values: "resend", "smtp".`);
  }
  return driver;
}

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<void> {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error(
      'EMAIL_FROM is not set — a verified sender address is required. ' +
        'For Resend: a verified domain (e.g. noreply@yourdomain.com). ' +
        'For SMTP/Gmail: your Gmail address. See apps/api/.env.example.',
    );
  }

  // Warn once if the default from the .env.example was never changed.
  if (from === 'onboarding@resend.dev') {
    // eslint-disable-next-line no-console
    console.warn(
      '[@repo/email] EMAIL_FROM is still "onboarding@resend.dev" — this ' +
        'Resend testing address only delivers to your own Resend account ' +
        'email. Set EMAIL_FROM to a verified domain to reach real users.',
    );
  }

  const provider = (process.env.EMAIL_PROVIDER ?? 'resend').toLowerCase();
  // eslint-disable-next-line no-console
  console.log(`[@repo/email] Sending to ${to} via ${provider} from ${from}`);

  try {
    await getDriver().send({ from, to, subject, html });
    // eslint-disable-next-line no-console
    console.log(`[@repo/email] Email accepted by ${provider} for ${to}`);
  } catch (err) {
    // Better Auth swallows errors thrown from its email callbacks, so without
    // this an email misconfiguration is invisible (no email, no trace). Make
    // the real cause loud in the server logs.
    // eslint-disable-next-line no-console
    console.error('[@repo/email] Failed to send email:', err);
    throw err;
  }
}
