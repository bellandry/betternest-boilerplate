import { Resend } from 'resend';
import type { EmailDriver } from '../types.js';

// Resend driver. The only file in the monorepo that imports the Resend SDK.
export function createResendDriver(): EmailDriver {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set — cannot send email via Resend. See .env.example.');
  }
  const client = new Resend(apiKey);

  return {
    async send({ from, to, subject, html }) {
      // eslint-disable-next-line no-console
      console.log('[@repo/email] [resend] Dispatching to Resend API...');
      const { data, error } = await client.emails.send({
        from,
        to,
        subject,
        html,
      });
      if (error) {
        // e.g. 403 "You can only send testing emails to your own address"
        throw new Error(`Resend rejected the email: ${error.message}`);
      }
      if (!data?.id) {
        throw new Error(
          'Resend returned neither an error nor an email id — the email was ' +
            'not queued. Check your Resend dashboard quota and domain status.',
        );
      }
      // eslint-disable-next-line no-console
      console.log(
        `[@repo/email] [resend] Queued — email id: ${data.id}. Check status at https://resend.com/emails/${data.id}`,
      );
    },
  };
}
