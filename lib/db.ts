import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

function createPrismaClient() {
  const rawDbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const dbPath = rawDbUrl.replace(/^file:/, '');
  const dbFilePath = path.isAbsolute(dbPath)
    ? dbPath
    : path.join(process.cwd(), dbPath.replace(/^\.\//, ''));

  const adapter = new PrismaBetterSqlite3({ url: dbFilePath });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
