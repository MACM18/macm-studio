import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { calculateProjectProgress } from "@/lib/project-progress";
import { requireAdmin } from "@/lib/auth-guards";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ view?: string; archived?: string }> }) {
  await requireAdmin();
  const query = await searchParams;
  const showingArchived = query.view === "archived";
  const projects = await prisma.project.findMany({ where: { visibility: showingArchived ? "ARCHIVED" : { not: "ARCHIVED" } }, include: { owner: { select: { name: true, email: true } }, milestones: { select: { weight: true, progress: true } } }, orderBy: { updatedAt: "desc" } });
  return <section><div className="section-title-small"><span className="kicker">PROJECT DELIVERY</span><h2>{showingArchived ? "Archived project history" : "Progress, payments, and visibility"}</h2><p>{showingArchived ? "Archived projects keep their milestones, updates, links, and audit trail for future reference or restoration." : "Active projects available to the studio team and, where published, to the customer portal."}</p></div>{query.archived === "1" ? <div className="workspace-alert" role="status">Project archived. Its history remains available in this view and can be restored from Project settings.</div> : null}<div className="project-filter"><Link className={!showingArchived ? "is-active" : ""} href="/admin/projects">Active projects</Link><Link className={showingArchived ? "is-active" : ""} href="/admin/projects?view=archived">Archived history</Link></div><div className="workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Project</th><th>Client</th><th>Progress</th><th>Status</th><th>Portal</th><th /></tr></thead><tbody>{projects.length ? projects.map((project) => <tr key={project.id}><td><strong>{project.title}</strong><small>Updated {project.updatedAt.toLocaleDateString("en-LK", { dateStyle: "medium" })}</small></td><td>{project.owner.name}<small>{project.owner.email}</small></td><td>{calculateProjectProgress(project.milestones)}%</td><td><span className={`status-pill status-${project.status.toLowerCase()}`}>{project.status.replaceAll("_", " ")}</span></td><td>{project.visibility}</td><td><Link className="table-link" href={`/admin/projects/${project.id}`}>Edit <ArrowUpRight size={14} /></Link></td></tr>) : <tr><td colSpan={6}>No projects in this view.</td></tr>}</tbody></table></div></section>;
}
