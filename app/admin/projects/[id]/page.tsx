import { notFound } from "next/navigation";
import {
  addProjectLink,
  createProjectUpdate,
  deleteProjectLink,
  publishProjectUpdate,
  retryProjectUpdateEmail,
  updateDraftProjectUpdate,
  updateMilestone,
  updateProject,
} from "@/app/admin/actions";
import { prisma } from "@/lib/db";
import { calculateProjectProgress, milestoneWeightsAreValid } from "@/lib/project-progress";
import { requireAdmin } from "@/lib/auth-guards";
import { ProjectArchiveForm } from "@/components/project-archive-form";
import { readPrivateText } from "@/lib/private-data";

const dateValue = (date: Date | null) => date ? date.toISOString().slice(0, 10) : "";
const projectStatuses = ["PLANNING", "IN_PROGRESS", "REVIEW", "ON_HOLD", "COMPLETE", "CANCELLED"] as const;
const visibilityOptions = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const milestoneStates = ["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETE"] as const;
const paymentStatuses = ["PENDING", "PAID", "OVERDUE", "NOT_APPLICABLE"] as const;

export default async function ProjectEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: true,
      milestones: { orderBy: { sortOrder: "asc" } },
      links: { orderBy: { sortOrder: "asc" } },
      updates: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) notFound();
  const progress = calculateProjectProgress(project.milestones);
  const validWeights = milestoneWeightsAreValid(project.milestones);
  const summary = readPrivateText(project.summaryEncrypted, project.summary);
  const links = project.links.map((link) => ({ ...link, displayUrl: readPrivateText(link.urlEncrypted, link.url) ?? "" }));
  const updates = project.updates.map((update) => ({ ...update, displayBody: readPrivateText(update.bodyEncrypted, update.body) ?? "" }));

  return (
    <div className="workspace-stack admin-editor">
      <section className="workspace-card project-editor-summary">
        <div><span className="kicker">PROJECT · {project.owner.name}</span><h2>{project.title}</h2><p>{progress}% complete · milestone weights {validWeights ? "total 100" : "need attention"}</p></div>
        <a className="button button-secondary" href={`/admin/clients/${project.ownerId}`}>View client</a>
      </section>

      <section className="workspace-card form-card">
        <div className="section-title-small"><span className="kicker">PROJECT SETTINGS</span><h2>Details and client visibility</h2></div>
        <form action={updateProject.bind(null, project.id)} className="workspace-form two-column-form">
          <label className="full-field">Project title<input name="title" required defaultValue={project.title} /></label>
          <label className="full-field">Customer-friendly summary<textarea name="summary" rows={4} defaultValue={summary ?? ""} /></label>
          <label>Status<select name="status" defaultValue={project.status}>{projectStatuses.map((status) => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
          <label>Portal visibility<select name="visibility" defaultValue={project.visibility}>{visibilityOptions.map((visibility) => <option value={visibility} key={visibility}>{visibility}</option>)}</select></label>
          <label>Start date<input type="date" name="startDate" defaultValue={dateValue(project.startDate)} /></label>
          <label>Target date<input type="date" name="targetDate" defaultValue={dateValue(project.targetDate)} /></label>
          {!validWeights && <p className="workspace-alert full-field">Milestone weights must total 100 before this project can be published.</p>}
          <button className="button">Save project</button>
        </form>
      </section>

      <section>
        <div className="section-title-small"><span className="kicker">MILESTONES</span><h2>Progress and payment tracking</h2><p>Work weights drive the customer’s overall progress. Payment percentages remain independent.</p></div>
        <div className="admin-milestone-grid">
          {project.milestones.map((milestone) => (
            <form action={updateMilestone.bind(null, milestone.id)} className="workspace-card workspace-form milestone-editor" key={milestone.id}>
              <div className="workspace-card-top"><span className="kicker">STAGE {String(milestone.sortOrder).padStart(2, "0")}</span><strong>{milestone.progress}%</strong></div>
              <label>Title<input name="title" required defaultValue={milestone.title} /></label>
              <label>Description<textarea name="description" rows={3} defaultValue={milestone.description ?? ""} /></label>
              <div className="form-pair"><label>Work weight<input type="number" min="0" max="100" name="weight" required defaultValue={milestone.weight} /></label><label>Progress<input type="number" min="0" max="100" name="progress" required defaultValue={milestone.progress} /></label></div>
              <div className="form-pair"><label>Stage state<select name="state" defaultValue={milestone.state}>{milestoneStates.map((state) => <option value={state} key={state}>{state.replaceAll("_", " ")}</option>)}</select></label><label>Due date<input type="date" name="dueDate" defaultValue={dateValue(milestone.dueDate)} /></label></div>
              <div className="form-pair"><label>Payment amount<input type="number" min="0" name="paymentAmount" defaultValue={milestone.paymentAmount ?? ""} /></label><label>Currency<input name="paymentCurrency" defaultValue={milestone.paymentCurrency ?? ""} placeholder="LKR" /></label></div>
              <label>Payment status<select name="paymentStatus" defaultValue={milestone.paymentStatus}>{paymentStatuses.map((status) => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
              <button className="button button-secondary">Save stage</button>
            </form>
          ))}
        </div>
      </section>

      <section className="workspace-card form-card">
        <div className="section-title-small"><span className="kicker">IMPORTANT LINKS</span><h2>Preview and shared resources</h2></div>
        {links.length > 0 && <div className="admin-link-list">{links.map((link) => <div key={link.id}><a href={link.displayUrl} target="_blank" rel="noreferrer"><strong>{link.label}</strong><small>{link.displayUrl}</small></a><form action={deleteProjectLink.bind(null, link.id)}><button className="text-button danger-text">Remove</button></form></div>)}</div>}
        <form action={addProjectLink.bind(null, project.id)} className="workspace-form inline-form"><label>Label<input name="label" required placeholder="Staging preview" /></label><label>HTTPS URL<input name="url" type="url" required placeholder="https://…" /></label><button className="button">Add link</button></form>
      </section>

      <section className="workspace-card form-card">
        <div className="section-title-small"><span className="kicker">CLIENT UPDATES</span><h2>Draft, publish, and notify</h2><p>Publishing is immediate. If email delivery fails, the update remains visible and can be retried.</p></div>
        <form action={createProjectUpdate.bind(null, project.id)} className="workspace-form"><label>Update title<input name="title" required placeholder="Homepage direction is ready" /></label><label>Message<textarea name="body" rows={5} required placeholder="Explain what changed and what happens next in clear language." /></label><button className="button">Save draft update</button></form>
        {updates.length > 0 && <div className="admin-update-list">{updates.map((update) => <article key={update.id}><div className="workspace-card-top"><span className={`status-pill status-${update.status.toLowerCase()}`}>{update.status}</span><small>{update.createdAt.toLocaleDateString("en-LK", { dateStyle: "medium" })}</small></div>{update.status === "DRAFT" ? <form action={updateDraftProjectUpdate.bind(null, update.id)} className="workspace-form"><label>Title<input name="title" required defaultValue={update.title} /></label><label>Message<textarea name="body" rows={4} required defaultValue={update.displayBody} /></label><button className="button button-secondary button-small">Save draft changes</button></form> : <><h3>{update.title}</h3><p>{update.displayBody}</p></>}<div className="admin-action-row">{update.status === "DRAFT" ? <form action={publishProjectUpdate.bind(null, update.id)}><button className="button button-small">Publish and email</button></form> : <span className={`status-pill status-${update.notificationStatus.toLowerCase()}`}>EMAIL {update.notificationStatus}</span>}{update.notificationStatus === "FAILED" && <form action={retryProjectUpdateEmail.bind(null, update.id)}><button className="button button-secondary button-small">Retry email</button></form>}</div>{update.notificationError && <small className="error-copy">{update.notificationError}</small>}</article>)}</div>}
      </section>

      {project.visibility !== "ARCHIVED" ? <section className="workspace-card form-card danger-zone"><div className="section-title-small"><span className="kicker">DANGER ZONE</span><h2>Archive this project</h2><p>Archiving removes the project from active admin and client views. Milestones, updates, links, payment history, and audit history stay preserved and the visibility can be restored later.</p></div><ProjectArchiveForm projectId={project.id} projectTitle={project.title} /></section> : <section className="workspace-card form-card"><div className="section-title-small"><span className="kicker">ARCHIVED PROJECT</span><h2>This project is archived.</h2><p>Restore it by changing Portal visibility back to Draft or Published in Project settings.</p></div></section>}
    </div>
  );
}
