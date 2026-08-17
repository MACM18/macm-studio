import "server-only";

function escapeTelegram(value: string) {
  return value.replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character] ?? character);
}

export async function sendLeadTelegramAlert(input: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  projectType: string;
  budgetSummary: string | null;
  notes: string | null;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error("Telegram lead alerts are not configured.");

  const adminUrl = `${process.env.BETTER_AUTH_URL ?? "https://macm.lk"}/admin/leads/${encodeURIComponent(input.id)}`;
  const budget = escapeTelegram((input.budgetSummary || "No calculator summary").slice(0, 1500));
  const notes = escapeTelegram((input.notes || "No additional notes").slice(0, 900));
  const message = [
    "🚀 <b>New MACM website enquiry</b>",
    "",
    `👤 <b>${escapeTelegram(input.name)}</b>`,
    `✉️ <code>${escapeTelegram(input.email)}</code>`,
    `📞 ${escapeTelegram(input.phone || "Not provided")}`,
    `🧭 <b>${escapeTelegram(input.projectType)}</b>`,
    "",
    "💰 <b>Selected scope</b>",
    `<pre>${budget}</pre>`,
    "📝 <b>Customer notes</b>",
    notes,
    "",
    `🔗 <a href="${escapeTelegram(adminUrl)}">Review and approve in MACM</a>`,
  ].join("\n");

  const threadId = Number(process.env.TELEGRAM_MESSAGE_THREAD_ID);
  let response: Response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...(Number.isInteger(threadId) && threadId > 0 ? { message_thread_id: threadId } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new Error("Telegram network request failed.");
  }
  if (!response.ok) throw new Error(`Telegram returned HTTP ${response.status}`);
}
