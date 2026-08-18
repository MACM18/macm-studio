import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { requireClient } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { calculateProjectProgress } from "@/lib/project-progress";
import { readPrivateText } from "@/lib/private-data";
import { getServerLocale } from "@/lib/server-locale";
import { translate, translateStatus } from "@/lib/i18n";

export default async function PortalPage() {
  const { user } = await requireClient();
  const locale = await getServerLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const projects = await prisma.project.findMany({
    where: { ownerId: user.id, visibility: { in: ["DRAFT", "PUBLISHED"] } },
    include: { milestones: { orderBy: { sortOrder: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  if (!projects.length) return <div className="workspace-empty"><span>{t("portal.accessApproved")}</span><h2>{t("portal.setup")}</h2><p>{t("portal.setupCopy")}</p></div>;
  return (
    <div className="project-card-grid">
      {projects.map((project) => {
        const progress = calculateProjectProgress(project.milestones);
        const published = project.visibility === "PUBLISHED";
        return (
          <article className="workspace-card project-summary-card" key={project.id}>
            <div className="workspace-card-top"><span className={`status-pill status-${project.status.toLowerCase()}`}>{translateStatus(locale, project.status)}</span><span>{progress}%</span></div>
            <h2>{project.title}</h2><p>{readPrivateText(project.summaryEncrypted, project.summary) || t("portal.detailsOrganising")}</p>
            <div className="progress-track" aria-label={`${progress}% ${t("portal.progressComplete")}`}><i style={{ width: `${progress}%` }} /></div>
            <div className="project-card-footer"><span><CalendarDays size={15} /> {project.targetDate ? `${t("portal.target")} ${project.targetDate.toLocaleDateString("en-LK", { dateStyle: "medium" })}` : t("portal.targetToAgree")}</span>{published ? <Link href={`/portal/projects/${project.id}`}>{t("portal.viewProgress")} <ArrowUpRight size={15} /></Link> : <span>{t("portal.setupProgress")}</span>}</div>
          </article>
        );
      })}
    </div>
  );
}
