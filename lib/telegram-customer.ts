import "server-only";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { readPrivateText } from "@/lib/private-data";
import { hashTelegramValue, normalizeTelegramChatId, normalizeTelegramWebhookUpdate } from "@/lib/telegram-utils";

export { hashTelegramValue, normalizeTelegramChatId, normalizeTelegramWebhookUpdate } from "@/lib/telegram-utils";

const LINK_TTL_MS = 10 * 60 * 1000;

export function isTelegramCustomerMessagingConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && botUsername());
}

function botUsername() {
  const value = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  return value && /^[A-Za-z0-9_]{5,64}$/.test(value) ? value : null;
}

export async function createTelegramLink(userId: string) {
  if (!isTelegramCustomerMessagingConfigured()) throw new Error("Telegram customer messaging is not configured.");
  const token = randomBytes(32).toString("base64url");
  await prisma.telegramLinkToken.deleteMany({ where: { userId, OR: [{ usedAt: { not: null } }, { expiresAt: { lt: new Date() } }] } });
  await prisma.telegramLinkToken.create({ data: { userId, tokenHash: hashTelegramValue(token), expiresAt: new Date(Date.now() + LINK_TTL_MS) } });
  const username = botUsername();
  if (!username) throw new Error("Telegram bot username is not configured.");
  return `https://t.me/${username}?start=link_${token}`;
}

export async function disconnectTelegram(userId: string) {
  await prisma.telegramConnection.updateMany({ where: { userId, revokedAt: null }, data: { enabled: false, revokedAt: new Date() } });
}

export async function setTelegramEnabled(userId: string, enabled: boolean) {
  const connection = await prisma.telegramConnection.findFirst({ where: { userId, revokedAt: null } });
  if (!connection) throw new Error("Connect Telegram before changing notifications.");
  await prisma.telegramConnection.update({ where: { id: connection.id }, data: { enabled } });
}

export async function getTelegramConnectionState(userId: string) {
  const connection = await prisma.telegramConnection.findFirst({ where: { userId, revokedAt: null }, select: { enabled: true, connectedAt: true, lastMessageAt: true, username: true, displayName: true } });
  return connection;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Telegram customer messaging is not configured.");
  let response: Response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new Error("Telegram network request failed.");
  }
  if (!response.ok) throw new Error(`Telegram returned HTTP ${response.status}`);
}

export async function sendTelegramCustomerUpdate(input: { updateId: string; userId: string; projectId: string; projectTitle: string; updateTitle: string; updateBody: string }) {
  const eligibleProject = await prisma.project.findFirst({
    where: { id: input.projectId, ownerId: input.userId, visibility: "PUBLISHED", owner: { status: "ACTIVE" } },
    select: { id: true },
  });
  if (!eligibleProject) return false;
  const connection = await prisma.telegramConnection.findFirst({ where: { userId: input.userId, enabled: true, revokedAt: null }, select: { id: true, chatIdEncrypted: true } });
  if (!connection) return false;
  await prisma.projectUpdate.update({ where: { id: input.updateId }, data: { telegramStatus: "PENDING", telegramAttempts: { increment: 1 }, telegramLastError: null } });
  try {
    const chatId = readPrivateText(connection.chatIdEncrypted, null);
    if (!chatId) throw new Error("Telegram chat connection is unavailable.");
    const portalUrl = `${process.env.BETTER_AUTH_URL ?? "https://macm.lk"}/portal/projects/${encodeURIComponent(input.projectId)}`;
    const body = input.updateBody.length > 1200 ? `${input.updateBody.slice(0, 1197)}…` : input.updateBody;
    const message = [
      "📌 <b>MACM project update</b>",
      "",
      `📁 <b>${escapeHtml(input.projectTitle)}</b>`,
      `📝 <b>${escapeHtml(input.updateTitle)}</b>`,
      "",
      escapeHtml(body),
      "",
      `🔗 <a href="${escapeHtml(portalUrl)}">Open project workspace</a>`,
    ].join("\n");
    await sendTelegramMessage(chatId, message);
    await prisma.$transaction([
      prisma.projectUpdate.update({ where: { id: input.updateId }, data: { telegramStatus: "SENT", telegramLastError: null } }),
      prisma.telegramConnection.update({ where: { id: connection.id }, data: { lastMessageAt: new Date() } }),
    ]);
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 500) : "Telegram delivery failed";
    await prisma.$transaction([
      prisma.projectUpdate.update({ where: { id: input.updateId }, data: { telegramStatus: "FAILED", telegramLastError: reason } }),
      prisma.auditLog.create({ data: { action: "telegram.delivery_failed", entityType: "ProjectUpdate", entityId: input.updateId, metadata: { userId: input.userId, projectId: input.projectId, reason } } }),
    ]);
    return false;
  }
}
