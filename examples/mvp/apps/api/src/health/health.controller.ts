import { Controller, Get, HttpCode, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ping } from '@repo/db';

@Controller('api/health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

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
      this.logger.error(
        'Database health check failed',
        err instanceof Error ? err.stack : String(err),
      );
      throw new ServiceUnavailableException({
        status: 'error',
        db: 'unreachable',
      });
    }
  }
}
