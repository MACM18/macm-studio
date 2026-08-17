import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

export default async function ClientsPage() {
  await requireAdmin();
  const clients = await prisma.user.findMany({ where: { role: "CLIENT" }, include: { _count: { select: { projects: true, sessions: true } } }, orderBy: { createdAt: "desc" } });
  return <section><div className="section-title-small"><span className="kicker">CLIENT ACCESS</span><h2>Customers and their projects</h2></div><div className="workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Client</th><th>Company</th><th>Projects</th><th>Sessions</th><th>Status</th><th /></tr></thead><tbody>{clients.map((client) => <tr key={client.id}><td><strong>{client.name}</strong><small>{client.email}</small></td><td>{client.company || "—"}</td><td>{client._count.projects}</td><td>{client._count.sessions}</td><td><span className={`status-pill status-${client.status.toLowerCase()}`}>{client.status}</span></td><td><Link className="table-link" href={`/admin/clients/${client.id}`}>Manage <ArrowUpRight size={14} /></Link></td></tr>)}</tbody></table></div></section>;
}
