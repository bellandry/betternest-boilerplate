// Type-only declaration for the optional rate-limit Redis storage.
// The package itself (@nest-lab/throttler-storage-redis) is NOT installed
// by default — it is only needed when REDIS_URL is set in production.
declare module '@nest-lab/throttler-storage-redis' {
  import type { ThrottlerStorage } from '@nestjs/throttler';

  export class ThrottlerStorageRedisService implements ThrottlerStorage {
    constructor(redisUrl: string);
    getRecord(key: string): Promise<number[]>;
    addRecord(key: string, ttl: number): Promise<void>;
  }
}
