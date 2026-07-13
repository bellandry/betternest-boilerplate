import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

const rootEnv = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
});
