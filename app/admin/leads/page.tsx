import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

export default async function LeadsPage() {
  await requireAdmin();
  const leads = await prisma.lead.findMany({ orderBy: { submittedAt: "desc" }, take: 100 });
  return <section><div className="section-title-small"><span className="kicker">ENQUIRIES</span><h2>Review and approve access</h2><p>Approving a lead creates or activates the client account and prepares a draft project.</p></div><div className="workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Customer</th><th>Project</th><th>Status</th><th>Webhook</th><th>Received</th><th /></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id}><td><strong>{lead.name}</strong><small>{lead.email}</small></td><td>{lead.projectType}</td><td><span className={`status-pill status-${lead.status.toLowerCase()}`}>{lead.status}</span></td><td><span className={`status-pill status-${lead.webhookStatus.toLowerCase()}`}>{lead.webhookStatus.replaceAll("_", " ")}</span></td><td>{lead.submittedAt.toLocaleDateString("en-LK", { dateStyle: "medium" })}</td><td><Link className="table-link" href={`/admin/leads/${lead.id}`}>Review <ArrowUpRight size={14} /></Link></td></tr>)}</tbody></table></div></section>;
}
