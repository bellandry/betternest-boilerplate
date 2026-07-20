import { All, Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '@repo/auth';

// Four rate-limited endpoints + a catch-all for everything else
// (get-session, sign-out, OAuth callbacks, ...). Each endpoint delegates
// to Better Auth's native node handler, which does internal routing based
// on the request URL.
@Controller('api/auth')
export class AuthController {
  private readonly handler = toNodeHandler(auth);

  @Post('sign-in/email')
  async signInEmail(@Req() req: Request, @Res() res: Response) {
    await this.handler(req, res);
  }

  @Post('sign-up/email')
  async signUpEmail(@Req() req: Request, @Res() res: Response) {
    await this.handler(req, res);
  }

  @Post('forget-password')
  async forgetPassword(@Req() req: Request, @Res() res: Response) {
    await this.handler(req, res);
  }

  @Post('reset-password')
  async resetPassword(@Req() req: Request, @Res() res: Response) {
    await this.handler(req, res);
  }

  // Catch-all — skipped by the rate limiter (see app.module.ts skipIf).
  @All('*path')
  async handle(@Req() req: Request, @Res() res: Response) {
    await this.handler(req, res);
  }
}
