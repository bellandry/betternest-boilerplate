import { Controller, Get, HttpCode, ServiceUnavailableException } from '@nestjs/common';
import { ping } from '@repo/db';

@Controller('api/health')
export class HealthController {
  @Get()
  @HttpCode(200)
  check() {
    return { status: 'ok' };
  }

  @Get('db')
  async dbCheck() {
    try {
      await ping();
      return { status: 'ok', db: 'connected' };
    } catch (err) {
      throw new ServiceUnavailableException({
        status: 'error',
        db: 'unreachable',
        message: (err as Error).message,
      });
    }
  }
}
