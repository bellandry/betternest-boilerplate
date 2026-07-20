// Load .env from project root BEFORE anything imports @repo/auth, because the
// shared betterAuth() instance reads process.env at module-evaluation time.
import { config } from 'dotenv';
import path from 'node:path';
config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

// Resolve relative file: paths so SQLite always writes to the project root
// regardless of which directory the process was started in.
if (process.env.DATABASE_URL?.startsWith('file:./')) {
  const rel = process.env.DATABASE_URL.slice('file:'.length);
  process.env.DATABASE_URL = `file:${path.resolve(__dirname, '..', '..', '..', rel)}`;
}

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

  // Trust the reverse proxy so req.ip reads X-Forwarded-For — required by
  // the rate limiter to count real client IPs on Railway, Render, Fly, Vercel.
  app.set('trust proxy', 1);

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

  const basePort = Number(process.env.PORT ?? 4000);
  let port = basePort;
  while (port < basePort + 100) {
    try {
      await app.listen(port);
      console.log(`[api] listening on http://localhost:${port}`);
      break;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
        port++;
      } else {
        throw err;
      }
    }
  }
}

void bootstrap();
