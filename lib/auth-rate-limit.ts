import "server-only";

import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db";

export async function consumeAuthEmailLimit(email: string, maximum: number, windowSeconds: number) {
  const secret = process.env.BETTER_AUTH_SECRET ?? "development-auth-rate-limit";
  const digest = createHmac("sha256", secret).update(email).digest("hex");
  const key = `portal-email:${digest}`;
  const now = BigInt(Date.now());
  const cutoff = now - BigInt(windowSeconds * 1000);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimit.findUnique({ where: { key } });
    if (!existing || existing.lastRequest < cutoff) {
      await tx.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, lastRequest: now },
        update: { count: 1, lastRequest: now },
      });
      return true;
    }
    if (existing.count >= maximum) return false;
    await tx.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return true;
  });
}
