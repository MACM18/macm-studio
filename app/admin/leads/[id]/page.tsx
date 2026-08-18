import { notFound } from "next/navigation";
import { approveLead, rejectLead, retryLeadNotifications, returnLeadToPending } from "@/app/admin/actions";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { readPrivateText } from "@/lib/private-data";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id }, include: { project: true, approvedCustomer: true } });
  if (!lead) notFound();
  const phone = readPrivateText(lead.phoneEncrypted, lead.phone);
  const notes = readPrivateText(lead.notesEncrypted, lead.notes);
  const budgetSummary = readPrivateText(lead.budgetSummaryEncrypted, lead.budgetSummary);
  return <div className="workspace-stack"><section className="workspace-card detail-card"><div className="detail-card-heading"><div><span className="kicker">LEAD {lead.id.slice(-8).toUpperCase()}</span><h2>{lead.name}</h2><p>{lead.projectType}</p></div><span className={`status-pill status-${lead.status.toLowerCase()}`}>{lead.status}</span></div><dl className="detail-grid"><div><dt>Email</dt><dd>{lead.email}</dd></div><div><dt>Phone</dt><dd>{phone || "Not provided"}</dd></div><div><dt>Received</dt><dd>{lead.submittedAt.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })}</dd></div><div><dt>Admin email</dt><dd>{lead.emailStatus.replaceAll("_", " ")} · {lead.emailAttempts} attempt(s)</dd></div><div><dt>Telegram</dt><dd>{lead.telegramStatus.replaceAll("_", " ")} · {lead.telegramAttempts} attempt(s)</dd></div></dl>{notes && <div className="detail-copy"><h3>Customer notes</h3><p>{notes}</p></div>}{budgetSummary && <div className="detail-copy"><h3>Selected scope</h3><pre>{budgetSummary}</pre></div>}{lead.emailLastError && <p className="workspace-alert">Email delivery: {lead.emailLastError}</p>}{lead.telegramLastError && <p className="workspace-alert">Telegram delivery: {lead.telegramLastError}</p>}</section><div className="admin-action-row">{lead.status === "PENDING" && !lead.project && <><form action={approveLead.bind(null, lead.id)}><button className="button">Approve and create project</button></form><form action={rejectLead.bind(null, lead.id)}><button className="button button-secondary">Reject lead</button></form></>}{lead.status === "REJECTED" && <form action={returnLeadToPending.bind(null, lead.id)}><button className="button button-secondary">Return to pending</button></form>}{lead.project && <a className="button" href={`/admin/projects/${lead.project.id}`}>Open project</a>}<form action={retryLeadNotifications.bind(null, lead.id)}><button className="button button-secondary">Retry failed notifications</button></form></div></div>;
}
