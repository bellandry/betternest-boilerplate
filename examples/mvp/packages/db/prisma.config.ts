import { config } from 'dotenv';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

const resolve = (...segments: string[]) => path.resolve(__dirname, '..', '..', ...segments);

config({ path: resolve('.env') });
config({ path: resolve('apps', 'api', '.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
