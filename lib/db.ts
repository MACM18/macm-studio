import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const requestedPoolSize = Number(process.env.DATABASE_POOL_MAX ?? 5);
  const poolSize = Number.isInteger(requestedPoolSize) ? Math.min(10, Math.max(1, requestedPoolSize)) : 5;

  const adapter = new PrismaPg({
    connectionString,
    max: poolSize,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
