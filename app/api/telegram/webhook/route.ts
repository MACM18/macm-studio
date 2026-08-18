import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashTelegramValue, normalizeTelegramWebhookUpdate, sendTelegramMessage } from "@/lib/telegram-customer";
import { writePrivateText } from "@/lib/private-data";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!configuredSecret || request.headers.get("x-telegram-bot-api-secret-token") !== configuredSecret) return NextResponse.json({ ok: false }, { status: 401 });
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const update = await normalizeTelegramWebhookUpdate(payload);
  if (!update || !update.text.startsWith("/start link_")) return NextResponse.json({ ok: true });
  const token = update.text.slice("/start link_".length).trim();
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return NextResponse.json({ ok: true });

  const now = new Date();
  try {
    const linkedUserId = await prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.telegramLinkToken.findFirst({ where: { tokenHash: hashTelegramValue(token), usedAt: null, expiresAt: { gt: now } }, select: { id: true, userId: true } });
      if (!tokenRecord) return null;
      const claimed = await tx.telegramLinkToken.updateMany({ where: { id: tokenRecord.id, usedAt: null }, data: { usedAt: now } });
      if (claimed.count !== 1) return null;
      const existingChat = await tx.telegramConnection.findUnique({ where: { chatIdHash: hashTelegramValue(update.chatId) }, select: { userId: true } });
      if (existingChat && existingChat.userId !== tokenRecord.userId) throw new Error("Telegram chat is already linked to another account.");
      const previousConnection = await tx.telegramConnection.findUnique({ where: { userId: tokenRecord.userId }, select: { id: true } });
      await tx.telegramConnection.upsert({
        where: { userId: tokenRecord.userId },
        create: { userId: tokenRecord.userId, chatIdEncrypted: writePrivateText(update.chatId) ?? "", chatIdHash: hashTelegramValue(update.chatId), telegramUserHash: hashTelegramValue(update.telegramUserId), username: update.username, displayName: update.displayName, enabled: false },
        update: { chatIdEncrypted: writePrivateText(update.chatId) ?? "", chatIdHash: hashTelegramValue(update.chatId), telegramUserHash: hashTelegramValue(update.telegramUserId), username: update.username, displayName: update.displayName, enabled: false, revokedAt: null, connectedAt: now },
      });
      await tx.auditLog.create({ data: { action: previousConnection ? "telegram.reconnected" : "telegram.connected", entityType: "User", entityId: tokenRecord.userId, metadata: { replacedConnection: Boolean(previousConnection) } } });
      return tokenRecord.userId;
    });
    if (linkedUserId) await sendTelegramMessage(update.chatId, "✅ <b>Telegram connected to MACM.</b>\n\nReturn to your client profile to enable project-update notifications.");
  } catch {
    // Return 200 so Telegram does not retry malformed, expired, or already-used links.
  }
  return NextResponse.json({ ok: true });
}
