import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SessionGuard } from '../auth/session.guard.js';

// Thin protected resource. Profile *mutations* (e.g. updating the name) go
// through Better Auth's authClient.updateUser on the front — this controller
// only exposes read access as an example of a session-guarded API route.
@Controller('api/users')
@UseGuards(SessionGuard)
export class UsersController {
  @Get('me')
  getMe(@Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (req as any).user;
  }
}
