import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { requireClient } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { calculateProjectProgress } from "@/lib/project-progress";
import { readPrivateText } from "@/lib/private-data";

export default async function PortalPage() {
  const { user } = await requireClient();
  const projects = await prisma.project.findMany({
    where: { ownerId: user.id, visibility: { in: ["DRAFT", "PUBLISHED"] } },
    include: { milestones: { orderBy: { sortOrder: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  if (!projects.length) return <div className="workspace-empty"><span>Access approved</span><h2>Your workspace is being prepared.</h2><p>We have your details. Your first project will appear here after the initial setup is complete.</p></div>;
  return (
    <div className="project-card-grid">
      {projects.map((project) => {
        const progress = calculateProjectProgress(project.milestones);
        const published = project.visibility === "PUBLISHED";
        return (
          <article className="workspace-card project-summary-card" key={project.id}>
            <div className="workspace-card-top"><span className={`status-pill status-${project.status.toLowerCase()}`}>{project.status.replaceAll("_", " ")}</span><span>{progress}%</span></div>
            <h2>{project.title}</h2><p>{readPrivateText(project.summaryEncrypted, project.summary) || "Your project details are being organised."}</p>
            <div className="progress-track" aria-label={`${progress}% complete`}><i style={{ width: `${progress}%` }} /></div>
            <div className="project-card-footer"><span><CalendarDays size={15} /> {project.targetDate ? `Target ${project.targetDate.toLocaleDateString("en-LK", { dateStyle: "medium" })}` : "Target date to be agreed"}</span>{published ? <Link href={`/portal/projects/${project.id}`}>View progress <ArrowUpRight size={15} /></Link> : <span>Setup in progress</span>}</div>
          </article>
        );
      })}
    </div>
  );
}
