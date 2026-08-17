import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAllowlistedAdmin, normalizeEmail } from "@/lib/identity";

const generic = () => NextResponse.json({ ok: true, message: "If this email has access, a sign-in code will arrive shortly." });

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const expectedOrigin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  if (origin && origin !== expectedOrigin) return generic();

  let email = "";
  try {
    const body = await request.json() as { email?: unknown };
    if (typeof body.email !== "string" || body.email.length > 254) return generic();
    email = normalizeEmail(body.email);
  } catch {
    return generic();
  }

  try {
    if (isAllowlistedAdmin(email)) {
      await prisma.user.upsert({
        where: { email },
        create: { email, name: "MACM Administrator", emailVerified: true, role: "ADMIN", status: "ACTIVE" },
        update: { role: "ADMIN", status: "ACTIVE" },
      });
    }
    // Better Auth returns the same success shape for unknown users when signup is disabled.
    // The delivery callback independently checks active status and the admin allowlist.
    await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" }, headers: request.headers });
  } catch {
    // Always keep the public response generic. Delivery errors remain server-side.
  }
  return generic();
}
