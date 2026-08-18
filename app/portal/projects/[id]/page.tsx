import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireClient } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { calculateProjectProgress } from "@/lib/project-progress";
import { readPrivateText } from "@/lib/private-data";

export const metadata = { title: "Project progress | MACM", robots: { index: false, follow: false } };

function money(amount: number | null, currency: string | null) {
  if (amount === null || !currency) return "Not linked to this stage";
  return new Intl.NumberFormat("en-LK", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireClient();
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, ownerId: user.id, visibility: "PUBLISHED" },
    include: {
      milestones: { orderBy: { sortOrder: "asc" } },
      updates: { where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" } },
      links: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!project) notFound();
  const progress = calculateProjectProgress(project.milestones);
  const summary = readPrivateText(project.summaryEncrypted, project.summary);
  return (
    <div className="workspace-stack">
      <section className="workspace-card project-hero-card"><div><span className={`status-pill status-${project.status.toLowerCase()}`}>{project.status.replaceAll("_", " ")}</span><h2>{project.title}</h2><p>{summary}</p></div><div className="progress-orb"><strong>{progress}%</strong><span>overall progress</span></div></section>
      <section><div className="section-title-small"><span className="kicker">MILESTONES</span><h2>What is happening now</h2></div><div className="milestone-list">{project.milestones.map((milestone) => <article className="workspace-card milestone-card" key={milestone.id}><div className="milestone-number">{String(milestone.sortOrder).padStart(2, "0")}</div><div><div className="workspace-card-top"><span className={`status-pill status-${milestone.state.toLowerCase()}`}>{milestone.state.replaceAll("_", " ")}</span><strong>{milestone.progress}%</strong></div><h3>{milestone.title}</h3><p>{milestone.description}</p><div className="progress-track"><i style={{ width: `${milestone.progress}%` }} /></div><dl><div><dt>Due</dt><dd>{milestone.dueDate?.toLocaleDateString("en-LK", { dateStyle: "medium" }) ?? "To be agreed"}</dd></div><div><dt>Payment</dt><dd>{money(milestone.paymentAmount, milestone.paymentCurrency)} · {milestone.paymentStatus.replaceAll("_", " ")}</dd></div></dl></div></article>)}</div></section>
      {project.links.length > 0 && <section><div className="section-title-small"><span className="kicker">IMPORTANT LINKS</span><h2>Project resources</h2></div><div className="resource-grid">{project.links.map((link) => <a className="workspace-card resource-link" href={readPrivateText(link.urlEncrypted, link.url) ?? "#"} target="_blank" rel="noreferrer" key={link.id}>{link.label}<ExternalLink size={17} /></a>)}</div></section>}
      <section><div className="section-title-small"><span className="kicker">UPDATES</span><h2>Notes from the studio</h2></div>{project.updates.length ? <div className="timeline">{project.updates.map((update) => <article key={update.id}><time>{update.publishedAt?.toLocaleDateString("en-LK", { dateStyle: "medium" })}</time><div className="workspace-card"><h3>{update.title}</h3><p>{readPrivateText(update.bodyEncrypted, update.body)}</p></div></article>)}</div> : <div className="workspace-empty compact"><p>Published project updates will appear here.</p></div>}</section>
    </div>
  );
}
