import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    adapter,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '../generated/prisma/client';

export async function ping(): Promise<void> {
  await prisma.$queryRawUnsafe('SELECT 1');
}

export type SeedUser = { id: string; email: string; role: string };

export async function findUserByEmail(email: string): Promise<SeedUser | null> {
  const record = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true },
  });
  return record ? { ...record, role: String(record.role) } : null;
}

export async function promoteUserToAdmin(email: string): Promise<void> {
  await prisma.user.update({
    where: { email },
    data: { role: 'admin', emailVerified: true },
  });
}

export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect();
}
