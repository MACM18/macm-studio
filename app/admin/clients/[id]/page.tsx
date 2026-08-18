import Link from "next/link";
import { notFound } from "next/navigation";
import { revokeClientTelegram, setClientAccess, updateClientProfile } from "@/app/admin/actions";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { readPrivateText } from "@/lib/private-data";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const client = await prisma.user.findFirst({
    where: { id, role: "CLIENT" },
    include: {
      projects: { orderBy: { updatedAt: "desc" } },
      telegramConnection: { select: { enabled: true, connectedAt: true, lastMessageAt: true, username: true, displayName: true, revokedAt: true } },
      _count: { select: { sessions: true } },
    },
  });
  if (!client) notFound();
  const company = readPrivateText(client.companyEncrypted, client.company);
  const phone = readPrivateText(client.phoneEncrypted, client.phone);
  const telegram = client.telegramConnection;
  return (
    <div className="workspace-stack">
      <section className="workspace-card detail-card">
        <div className="detail-card-heading"><div><span className="kicker">CLIENT</span><h2>{client.name}</h2><p>{company || "No company supplied"}</p></div><span className={`status-pill status-${client.status.toLowerCase()}`}>{client.status}</span></div>
        <dl className="detail-grid"><div><dt>Email</dt><dd>{client.email}</dd></div><div><dt>Phone</dt><dd>{phone || "Not provided"}</dd></div><div><dt>Projects</dt><dd>{client.projects.length}</dd></div><div><dt>Active sessions</dt><dd>{client._count.sessions}</dd></div></dl>
      </section>
      <section className="workspace-card form-card">
        <div className="section-title-small"><span className="kicker">CONTACT AND SIGN-IN</span><h2>Manage client details</h2><p>Changing the sign-in email revokes existing sessions and requires a fresh code at the new address.</p></div>
        <form action={updateClientProfile.bind(null, client.id)} className="workspace-form two-column-form"><label>Name<input name="name" required defaultValue={client.name} /></label><label>Sign-in email<input name="email" type="email" required defaultValue={client.email} /></label><label>Company<input name="company" defaultValue={company ?? ""} /></label><label>Phone<input name="phone" defaultValue={phone ?? ""} /></label><button className="button">Save client details</button></form>
      </section>
      <section className="workspace-card form-card">
        <div className="section-title-small"><span className="kicker">TELEGRAM NOTIFICATIONS</span><h2>Customer update delivery</h2><p>Telegram is linked by the customer through the portal. No phone number is collected.</p></div>
        <dl className="detail-grid"><div><dt>Connection</dt><dd>{telegram && !telegram.revokedAt ? "Connected" : "Not connected"}</dd></div><div><dt>Preference</dt><dd>{telegram?.enabled ? "Enabled" : "Disabled"}</dd></div><div><dt>Last delivery</dt><dd>{telegram?.lastMessageAt?.toLocaleString("en-LK") ?? "Not sent"}</dd></div><div><dt>Account</dt><dd>{telegram?.displayName || (telegram?.username ? `@${telegram.username}` : "—")}</dd></div></dl>
        {telegram && !telegram.revokedAt && <form action={revokeClientTelegram.bind(null, client.id)}><button className="button danger-button">Disconnect and revoke Telegram</button></form>}
      </section>
      <div className="admin-action-row">{client.status === "ACTIVE" ? <form action={setClientAccess.bind(null, client.id, "SUSPENDED")}><button className="button danger-button">Suspend and revoke sessions</button></form> : <form action={setClientAccess.bind(null, client.id, "ACTIVE")}><button className="button">Reactivate access</button></form>}</div>
      <section><div className="section-title-small"><span className="kicker">PROJECTS</span><h2>Assigned work</h2></div><div className="project-card-grid">{client.projects.map((project) => <Link href={`/admin/projects/${project.id}`} className="workspace-card compact-project" key={project.id}><span className={`status-pill status-${project.status.toLowerCase()}`}>{project.status.replaceAll("_", " ")}</span><h3>{project.title}</h3><p>{project.visibility} · updated {project.updatedAt.toLocaleDateString("en-LK", { dateStyle: "medium" })}</p></Link>)}</div></section>
    </div>
  );
}
