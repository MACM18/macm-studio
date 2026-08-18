import { NextResponse } from "next/server";
import { requireClient } from "@/lib/auth-guards";
import { createTelegramLink } from "@/lib/telegram-customer";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  const { user } = await requireClient();
  try {
    const url = await createTelegramLink(user.id);
    await prisma.auditLog.create({ data: { actorId: user.id, action: "telegram.link_requested", entityType: "User", entityId: user.id } });
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Telegram is not configured." }, { status: 503 });
  }
}
