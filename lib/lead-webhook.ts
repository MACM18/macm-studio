import "server-only";

import { prisma } from "@/lib/db";

export async function deliverLeadWebhook(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found.");
  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (!webhookUrl) {
    await prisma.lead.update({ where: { id: leadId }, data: { webhookStatus: "NOT_ATTEMPTED", webhookLastError: "Webhook is not configured." } });
    return false;
  }

  await prisma.lead.update({ where: { id: leadId }, data: { webhookStatus: "PENDING", webhookAttempts: { increment: 1 }, webhookLastError: null } });
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        leadId: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone ?? "",
        projectType: lead.projectType,
        budgetSummary: lead.budgetSummary ?? "",
        notes: lead.notes ?? "",
        scope: lead.scope,
        submittedAt: lead.submittedAt.toISOString(),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Webhook returned HTTP ${response.status}`);
    await prisma.lead.update({ where: { id: leadId }, data: { webhookStatus: "SENT", webhookLastError: null } });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown webhook failure";
    await prisma.lead.update({ where: { id: leadId }, data: { webhookStatus: "FAILED", webhookLastError: message } });
    return false;
  }
}
