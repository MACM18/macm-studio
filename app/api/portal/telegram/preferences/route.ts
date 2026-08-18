import { NextResponse } from "next/server";
import { requireClient } from "@/lib/auth-guards";
import { disconnectTelegram, setTelegramEnabled } from "@/lib/telegram-customer";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user } = await requireClient();
  let body: { action?: unknown } = {};
  try { body = (await request.json()) as { action?: unknown }; } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const action = body.action;
  if (action !== "enable" && action !== "disable" && action !== "disconnect") return NextResponse.json({ ok: false }, { status: 400 });
  try {
    if (action === "disconnect") await disconnectTelegram(user.id);
    else await setTelegramEnabled(user.id, action === "enable");
    await prisma.auditLog.create({ data: { actorId: user.id, action: `telegram.${action}`, entityType: "User", entityId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Telegram preference could not be changed." }, { status: 422 });
  }
}
