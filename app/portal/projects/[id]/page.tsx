import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireClient } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { calculateProjectProgress } from "@/lib/project-progress";
import { readPrivateText } from "@/lib/private-data";
import { getServerLocale } from "@/lib/server-locale";
import { translate, translateStatus } from "@/lib/i18n";

export const metadata = { title: "Project progress | MACM", robots: { index: false, follow: false } };

function money(amount: number | null, currency: string | null, notLinkedLabel: string) {
  if (amount === null || !currency) return notLinkedLabel;
  return new Intl.NumberFormat("en-LK", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireClient();
  const locale = await getServerLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
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
      <section className="workspace-card project-hero-card"><div><span className={`status-pill status-${project.status.toLowerCase()}`}>{translateStatus(locale, project.status)}</span><h2>{project.title}</h2><p>{summary}</p></div><div className="progress-orb"><strong>{progress}%</strong><span>{t("portal.overall")}</span></div></section>
      <section><div className="section-title-small"><span className="kicker">{t("portal.milestones")}</span><h2>{t("portal.happening")}</h2></div><div className="milestone-list">{project.milestones.map((milestone) => <article className="workspace-card milestone-card" key={milestone.id}><div className="milestone-number">{String(milestone.sortOrder).padStart(2, "0")}</div><div><div className="workspace-card-top"><span className={`status-pill status-${milestone.state.toLowerCase()}`}>{translateStatus(locale, milestone.state)}</span><strong>{milestone.progress}%</strong></div><h3>{milestone.title}</h3><p>{milestone.description}</p><div className="progress-track"><i style={{ width: `${milestone.progress}%` }} /></div><dl><div><dt>{t("portal.due")}</dt><dd>{milestone.dueDate?.toLocaleDateString("en-LK", { dateStyle: "medium" }) ?? t("portal.targetToAgree")}</dd></div><div><dt>{t("portal.payment")}</dt><dd>{money(milestone.paymentAmount, milestone.paymentCurrency, t("portal.notLinked"))} · {translateStatus(locale, milestone.paymentStatus)}</dd></div></dl></div></article>)}</div></section>
      {project.links.length > 0 && <section><div className="section-title-small"><span className="kicker">{t("portal.links")}</span><h2>{t("portal.resources")}</h2></div><div className="resource-grid">{project.links.map((link) => <a className="workspace-card resource-link" href={readPrivateText(link.urlEncrypted, link.url) ?? "#"} target="_blank" rel="noreferrer" key={link.id}>{link.label}<ExternalLink size={17} /></a>)}</div></section>}
      <section><div className="section-title-small"><span className="kicker">{t("portal.updates")}</span><h2>{t("portal.notes")}</h2></div>{project.updates.length ? <div className="timeline">{project.updates.map((update) => <article key={update.id}><time>{update.publishedAt?.toLocaleDateString("en-LK", { dateStyle: "medium" })}</time><div className="workspace-card"><h3>{update.title}</h3><p>{readPrivateText(update.bodyEncrypted, update.body)}</p></div></article>)}</div> : <div className="workspace-empty compact"><p>{t("portal.noUpdates")}</p></div>}</section>
    </div>
  );
}
