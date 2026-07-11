import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '@repo/auth';

// Validates the Better Auth session server-side by reading the request cookies.
// Attaches the resolved user + session to the request for controllers to use.
@Injectable()
export class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      throw new UnauthorizedException('No active session');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).user = session.user;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).session = session.session;
    return true;
  }
}
