const REQUIRED_ENV = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'WEB_URL'] as const;

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateEnvironment(): void {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const webUrl = process.env.WEB_URL!;
  if (!isAbsoluteHttpUrl(webUrl)) {
    throw new Error('WEB_URL must be an absolute http(s) URL.');
  }
  if (process.env.NODE_ENV === 'production' && !webUrl.startsWith('https://')) {
    throw new Error('WEB_URL must use https:// in production.');
  }

  const secret = process.env.BETTER_AUTH_SECRET!;
  if (secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters.');
  }

  const port = Number(process.env.PORT ?? '4000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const rateLimitMax = Number(process.env.RATE_LIMIT_MAX ?? '5');
  const rateLimitWindow = Number(process.env.RATE_LIMIT_WINDOW ?? '900');
  if (!Number.isInteger(rateLimitMax) || rateLimitMax < 1) {
    throw new Error('RATE_LIMIT_MAX must be a positive integer.');
  }
  if (!Number.isInteger(rateLimitWindow) || rateLimitWindow < 1) {
    throw new Error('RATE_LIMIT_WINDOW must be a positive integer in seconds.');
  }
}
