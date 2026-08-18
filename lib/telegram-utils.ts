import { createHmac } from "node:crypto";

function secret() {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value) throw new Error("BETTER_AUTH_SECRET is required for Telegram linking.");
  return value;
}

export function normalizeTelegramChatId(value: unknown) {
  const normalized = typeof value === "number" && Number.isSafeInteger(value) ? String(value) : typeof value === "string" ? value.trim() : "";
  return /^-?\d{1,30}$/.test(normalized) ? normalized : null;
}

export function hashTelegramValue(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function normalizeTelegramWebhookUpdate(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const update = payload as { update_id?: unknown; message?: { text?: unknown; chat?: { id?: unknown; type?: unknown }; from?: { id?: unknown; username?: unknown; first_name?: unknown; last_name?: unknown } } };
  const message = update.message;
  const chatId = normalizeTelegramChatId(message?.chat?.id);
  if (!chatId || message?.chat?.type !== "private" || typeof message.text !== "string") return null;
  const fromId = normalizeTelegramChatId(message.from?.id);
  return {
    updateId: typeof update.update_id === "number" ? update.update_id : null,
    chatId,
    telegramUserId: fromId ?? chatId,
    text: message.text.trim().slice(0, 500),
    username: typeof message.from?.username === "string" ? message.from.username.slice(0, 100) : null,
    displayName: [message.from?.first_name, message.from?.last_name].filter((part): part is string => typeof part === "string").join(" ").slice(0, 160) || null,
  };
}
