import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

export default async function AuditPage() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({ include: { actor: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return <section><div className="section-title-small"><span className="kicker">ACCOUNTABILITY</span><h2>Administrative history</h2><p>Recent approvals, access changes, project edits, publications, and retries.</p></div><div className="workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Action</th><th>Entity</th><th>Administrator</th><th>Time</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td><strong>{log.action}</strong></td><td>{log.entityType}<small>{log.entityId}</small></td><td>{log.actor?.name || "System"}<small>{log.actor?.email}</small></td><td>{log.createdAt.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })}</td></tr>)}</tbody></table></div></section>;
}
