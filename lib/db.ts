import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from '@prisma/adapter-neon';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // PrismaNeon will happily try to connect with "defaults" if the connection string is missing,
  // which leads to that confusing "host: localhost, user: <your pc user>" error.
  // Failing loudly here makes it obvious what to fix.
  const connectionString =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() || // common alt name on some hosts
    process.env.NEON_DATABASE_URL?.trim(); // another common alias

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is missing. Add it to workflow-builder/.env (or set POSTGRES_URL)."
    );
  }

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
