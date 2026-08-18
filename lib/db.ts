import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const configuredConnectionString = process.env.DATABASE_URL;
  if (!configuredConnectionString) throw new Error("DATABASE_URL is required.");
  const sslMode = process.env.DATABASE_SSL_MODE?.trim();
  const supportedSslModes = new Set(["disable", "allow", "prefer", "require", "verify-ca", "verify-full"]);
  if (sslMode && !supportedSslModes.has(sslMode)) throw new Error("DATABASE_SSL_MODE is invalid.");
  const connectionString = sslMode && !/[?&]sslmode=/.test(configuredConnectionString)
    ? `${configuredConnectionString}${configuredConnectionString.includes("?") ? "&" : "?"}sslmode=${encodeURIComponent(sslMode)}`
    : configuredConnectionString;
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
