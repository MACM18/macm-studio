"use client";

import { useState } from "react";
import { archiveProject } from "@/app/admin/actions";

export function ProjectArchiveForm({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const [confirmation, setConfirmation] = useState("");
  const matches = confirmation.trim() === projectTitle.trim();
  return <form action={archiveProject.bind(null, projectId)} className="archive-confirmation"><p>To continue, type <strong>{projectTitle}</strong> exactly. This action removes the project from active views but keeps its history and can be restored later.</p><label htmlFor="archive-confirmation">Project title confirmation<input id="archive-confirmation" name="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" placeholder={projectTitle} /></label><button className="button danger-button" type="submit" disabled={!matches}>Archive project</button></form>;
}
