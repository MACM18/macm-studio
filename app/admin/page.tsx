import Link from "next/link";
import { AlertCircle, ArrowUpRight, BriefcaseBusiness, CircleDollarSign, Inbox } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

export default async function AdminDashboard() {
  await requireAdmin();
  const now = new Date();
  const [pendingLeads, activeProjects, overdueMilestones, failedLeadNotifications, failedUpdateNotifications, recentUpdates] = await Promise.all([
    prisma.lead.count({ where: { status: "PENDING" } }),
    prisma.project.count({ where: { status: { in: ["PLANNING", "IN_PROGRESS", "REVIEW", "ON_HOLD"] } } }),
    prisma.projectMilestone.count({ where: { OR: [{ paymentStatus: "OVERDUE" }, { dueDate: { lt: now }, state: { not: "COMPLETE" } }] } }),
    prisma.lead.count({ where: { OR: [{ emailStatus: "FAILED" }, { telegramStatus: "FAILED" }] } }),
    prisma.projectUpdate.count({ where: { notificationStatus: "FAILED" } }),
    prisma.projectUpdate.findMany({ where: { status: "PUBLISHED" }, include: { project: { select: { title: true } }, author: { select: { name: true } } }, orderBy: { publishedAt: "desc" }, take: 6 }),
  ]);
  const metrics = [
    { label: "Pending leads", value: pendingLeads, icon: Inbox, href: "/admin/leads" },
    { label: "Active projects", value: activeProjects, icon: BriefcaseBusiness, href: "/admin/projects" },
    { label: "Overdue items", value: overdueMilestones, icon: CircleDollarSign, href: "/admin/projects" },
    { label: "Failed notifications", value: failedLeadNotifications + failedUpdateNotifications, icon: AlertCircle, href: "/admin/leads" },
  ];
  return <div className="workspace-stack"><section className="metric-grid">{metrics.map(({ label, value, icon: Icon, href }) => <Link className="workspace-card metric-card" href={href} key={label}><Icon size={20} /><strong>{value}</strong><span>{label}</span><ArrowUpRight size={15} /></Link>)}</section><section><div className="section-title-small"><span className="kicker">RECENT ACTIVITY</span><h2>Published client updates</h2></div>{recentUpdates.length ? <div className="workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Update</th><th>Project</th><th>Published</th><th>Delivery</th></tr></thead><tbody>{recentUpdates.map((update) => <tr key={update.id}><td><strong>{update.title}</strong><small>by {update.author.name}</small></td><td>{update.project.title}</td><td>{update.publishedAt?.toLocaleDateString("en-LK", { dateStyle: "medium" })}</td><td><span className={`status-pill status-${update.notificationStatus.toLowerCase()}`}>{update.notificationStatus}</span></td></tr>)}</tbody></table></div> : <div className="workspace-empty compact"><p>No client updates have been published yet.</p></div>}</section></div>;
}
