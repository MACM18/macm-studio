import { beforeEach, describe, expect, it } from "vitest";
import { hashTelegramValue, normalizeTelegramChatId, normalizeTelegramWebhookUpdate } from "../lib/telegram-utils";

describe("Telegram customer linking helpers", () => {
  beforeEach(() => {
    process.env.BETTER_AUTH_SECRET = "test-secret";
  });

  it("accepts chat IDs without turning arbitrary input into destinations", () => {
    expect(normalizeTelegramChatId("-1001234567890")).toBe("-1001234567890");
    expect(normalizeTelegramChatId(12345)).toBe("12345");
    expect(normalizeTelegramChatId("not-a-chat")).toBeNull();
  });

  it("hashes the same linking value deterministically", () => {
    expect(hashTelegramValue("chat-123")).toBe(hashTelegramValue("chat-123"));
    expect(hashTelegramValue("chat-123")).not.toBe(hashTelegramValue("chat-456"));
  });

  it("accepts private start messages and ignores group messages", async () => {
    const update = await normalizeTelegramWebhookUpdate({ update_id: 7, message: { text: "/start link_token", chat: { id: 123, type: "private" }, from: { id: 123, username: "client" } } });
    expect(update?.chatId).toBe("123");
    expect(update?.text).toBe("/start link_token");
    expect(await normalizeTelegramWebhookUpdate({ message: { text: "/start link_token", chat: { id: -1, type: "group" } } })).toBeNull();
  });
});
