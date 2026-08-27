import { config } from 'dotenv';
import path from 'node:path';

// The seed runs from apps/api, while the shared .env lives at the project root.
// Load and normalize it before importing Better Auth or the database client,
// because both read process.env during module evaluation.
config({ path: path.resolve(__dirname, '..', '..', '..', '..', '.env') });
if (process.env.DATABASE_URL?.startsWith('file:./')) {
  const rel = process.env.DATABASE_URL.slice('file:'.length);
  process.env.DATABASE_URL = `file:${path.resolve(__dirname, '..', '..', '..', '..', rel)}`;
}
// Better Auth otherwise schedules a verification email during sign-up. The seed
// verifies the account itself immediately, so it uses this process-local flag
// to avoid requiring a mail transport for a controlled bootstrap.
process.env.BETTERNEST_ADMIN_SEED = 'true';

let closeDatabase: (() => Promise<void>) | undefined;

async function main(): Promise<void> {
  const [{ auth }, db] = await Promise.all([import('@repo/auth'), import('@repo/db')]);
  closeDatabase = db.closeDatabase;
  const { findUserByEmail, promoteUserToAdmin } = db;

  function requiredEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
      throw new Error(`${name} is required to seed an admin user.`);
    }
    return value;
  }

  function validateEmail(email: string): void {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error('ADMIN_EMAIL must be a valid email address.');
    }
  }

  const email = requiredEnv('ADMIN_EMAIL').toLowerCase();
  const password = requiredEnv('ADMIN_PASSWORD');
  const name = process.env.ADMIN_NAME?.trim() || 'Administrator';

  validateEmail(email);
  if (password.length < 8 || password.length > 128) {
    throw new Error('ADMIN_PASSWORD must contain between 8 and 128 characters.');
  }

  const existing = await findUserByEmail(email);
  if (!existing) {
    try {
      await auth.api.signUpEmail({
        body: {
          name,
          email,
          password,
          callbackURL: '/',
        },
      });
    } catch (error) {
      throw new Error(
        `Could not create ${email}. Ensure the email-password auth provider is enabled and the database is migrated. ${(error as Error).message}`,
        { cause: error },
      );
    }
    console.log(`[seed] Created user ${email}.`);
  } else {
    console.log(`[seed] User ${email} already exists; keeping the existing password.`);
  }

  await promoteUserToAdmin(email);
  console.log(`[seed] User ${email} is an admin and has a verified email.`);
}

main()
  .catch((error: unknown) => {
    console.error('[seed] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase?.();
  });
