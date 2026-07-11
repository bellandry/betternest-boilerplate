import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '@repo/auth';

// Catch-all controller. EVERY /api/auth/* request (sign-in, sign-up, OAuth
// callbacks, get-session, sign-out, ...) is delegated to Better Auth's native
// node handler. The Next.js proxy forwards the browser's same-origin requests
// here, so the browser never sees this port directly.
@Controller('api/auth')
export class AuthController {
  private readonly handler = toNodeHandler(auth);

  // '*path' = Express 5 named wildcard (Nest 11). Matches any sub-path.
  @All('*path')
  async handle(@Req() req: Request, @Res() res: Response) {
    // Body parser is disabled for this route (see main.ts) — the handler
    // reads the raw request stream itself.
    await this.handler(req, res);
  }
}
