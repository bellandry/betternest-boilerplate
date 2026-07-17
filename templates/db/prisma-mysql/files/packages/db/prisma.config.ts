import { config } from 'dotenv'
import path from 'node:path'
import { defineConfig, env } from 'prisma/config'

config({ path: path.resolve(__dirname, '..', '..', '.env') })

// Resolve relative file: paths so SQLite always writes to the project root.
if (process.env.DATABASE_URL?.startsWith('file:./')) {
  const rel = process.env.DATABASE_URL.slice('file:'.length)
  process.env.DATABASE_URL = `file:${path.resolve(__dirname, '..', '..', rel)}`
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
