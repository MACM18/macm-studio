import "server-only";

import { prisma } from "@/lib/db";
import { sendLeadNotificationEmail } from "@/lib/email";
import { sendLeadTelegramAlert } from "@/lib/telegram";

type StoredLead = NonNullable<Awaited<ReturnType<typeof prisma.lead.findUnique>>>;
type NotificationLead = Omit<StoredLead, "phone" | "budgetSummary" | "notes" | "scope"> & {
  phone: string | null;
  budgetSummary: string | null;
  notes: string | null;
  scope: unknown;
};

function notificationLead(lead: StoredLead): NotificationLead {
  return {
    ...lead,
    // Keep notification payloads intentionally minimal. The complete brief is
    // available only after an administrator authenticates in the workspace.
    phone: null,
    budgetSummary: null,
    notes: null,
    scope: null,
  };
}

async function deliverEmail(lead: NotificationLead, retryOnly: boolean) {
  if (retryOnly && lead.emailStatus === "SENT") return true;
  if (!process.env.LEAD_NOTIFICATION_EMAIL) {
    await prisma.lead.update({ where: { id: lead.id }, data: { emailStatus: "NOT_ATTEMPTED", emailLastError: "Lead notification email is not configured." } });
    return false;
  }
  await prisma.lead.update({ where: { id: lead.id }, data: { emailStatus: "PENDING", emailAttempts: { increment: 1 }, emailLastError: null } });
  try {
    await sendLeadNotificationEmail(lead);
    await prisma.lead.update({ where: { id: lead.id }, data: { emailStatus: "SENT", emailLastError: null } });
    return true;
  } catch (error) {
    await prisma.lead.update({ where: { id: lead.id }, data: { emailStatus: "FAILED", emailLastError: error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed" } });
    return false;
  }
}

async function deliverTelegram(lead: NotificationLead, retryOnly: boolean) {
  if (retryOnly && lead.telegramStatus === "SENT") return true;
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    await prisma.lead.update({ where: { id: lead.id }, data: { telegramStatus: "NOT_ATTEMPTED", telegramLastError: "Telegram lead alerts are not configured." } });
    return false;
  }
  await prisma.lead.update({ where: { id: lead.id }, data: { telegramStatus: "PENDING", telegramAttempts: { increment: 1 }, telegramLastError: null } });
  try {
    await sendLeadTelegramAlert(lead);
    await prisma.lead.update({ where: { id: lead.id }, data: { telegramStatus: "SENT", telegramLastError: null } });
    return true;
  } catch (error) {
    await prisma.lead.update({ where: { id: lead.id }, data: { telegramStatus: "FAILED", telegramLastError: error instanceof Error ? error.message.slice(0, 500) : "Telegram delivery failed" } });
    return false;
  }
}

export async function deliverLeadNotifications(leadId: string, options: { retryOnly?: boolean } = {}) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found.");
  const safeLead = notificationLead(lead);
  const [email, telegram] = await Promise.all([
    deliverEmail(safeLead, options.retryOnly ?? false),
    deliverTelegram(safeLead, options.retryOnly ?? false),
  ]);
  return { email, telegram };
}
