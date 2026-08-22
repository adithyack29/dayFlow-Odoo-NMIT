import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const rawDbUrl = process.env.DATABASE_URL || 'file:./dev.db';
    const dbPath = rawDbUrl.replace(/^file:/, '');
    const dbFilePath = path.isAbsolute(dbPath)
      ? dbPath
      : path.join(process.cwd(), dbPath.replace(/^\.\//, ''));

    const adapter = new PrismaBetterSqlite3({ url: dbFilePath });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getDb();
    const value = (client as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
