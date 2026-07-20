import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';

const THROTTLE_PATHS: Record<string, string> = {
  signIn: '/api/auth/sign-in/email',
  signUp: '/api/auth/sign-up/email',
  forgetPassword: '/api/auth/forget-password',
  resetPassword: '/api/auth/reset-password',
};

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: async () => {
        let storage: unknown;
        if (process.env.REDIS_URL) {
          try {
            const mod = await import('@nest-lab/throttler-storage-redis');
            storage = new mod.ThrottlerStorageRedisService(process.env.REDIS_URL);
          } catch {
            console.warn(
              '[api] REDIS_URL is set but @nest-lab/throttler-storage-redis is not installed. ' +
                'Falling back to in-memory rate limit storage.',
            );
          }
        }

        return {
          storage: storage as never,
          throttlers: Object.entries(THROTTLE_PATHS).map(([name, path]) => ({
            name,
            ttl: () => parseInt(process.env.RATE_LIMIT_WINDOW ?? '900', 10) * 1000,
            limit: () => parseInt(process.env.RATE_LIMIT_MAX ?? '5', 10),
            skipIf: (ctx: { switchToHttp: () => { getRequest: () => { path: string } } }) =>
              ctx.switchToHttp().getRequest().path !== path,
          })),
        };
      },
    }),
    AuthModule,
    HealthModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
