// Load apps/api/.env BEFORE anything imports @repo/auth, because the shared
// betterAuth() instance reads process.env at module-evaluation time.
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  // ── The #1 trap: NestJS's global body parser consumes the request stream.
  // Better Auth's node handler needs the RAW body, so we disable Nest's
  // parser globally and re-add JSON parsing for every route EXCEPT /api/auth.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';

  // ── CORS is a FALLBACK only (mobile apps, Postman, direct API clients).
  // The browser auth flow never triggers CORS because it is same-origin via
  // the Next.js proxy. NEVER use origin '*' with credentials.
  app.enableCors({
    origin: [webUrl],
    credentials: true,
  });

  // Re-apply JSON body parsing to all non-auth routes.
  app.use((req: { originalUrl: string }, res: unknown, next: () => void) => {
    if (req.originalUrl.startsWith('/api/auth')) {
      return next();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return json()(req as any, res as any, next);
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}`);
}

void bootstrap();
