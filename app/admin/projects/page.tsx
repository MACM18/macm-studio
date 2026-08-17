import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { calculateProjectProgress } from "@/lib/project-progress";
import { requireAdmin } from "@/lib/auth-guards";

export default async function ProjectsPage() {
  await requireAdmin();
  const projects = await prisma.project.findMany({ include: { owner: { select: { name: true, email: true } }, milestones: { select: { weight: true, progress: true } } }, orderBy: { updatedAt: "desc" } });
  return <section><div className="section-title-small"><span className="kicker">PROJECT DELIVERY</span><h2>Progress, payments, and visibility</h2></div><div className="workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Project</th><th>Client</th><th>Progress</th><th>Status</th><th>Portal</th><th /></tr></thead><tbody>{projects.map((project) => <tr key={project.id}><td><strong>{project.title}</strong><small>Updated {project.updatedAt.toLocaleDateString("en-LK", { dateStyle: "medium" })}</small></td><td>{project.owner.name}<small>{project.owner.email}</small></td><td>{calculateProjectProgress(project.milestones)}%</td><td><span className={`status-pill status-${project.status.toLowerCase()}`}>{project.status.replaceAll("_", " ")}</span></td><td>{project.visibility}</td><td><Link className="table-link" href={`/admin/projects/${project.id}`}>Edit <ArrowUpRight size={14} /></Link></td></tr>)}</tbody></table></div></section>;
}
