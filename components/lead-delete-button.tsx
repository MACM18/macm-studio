"use client";

import { deleteLead } from "@/app/admin/actions";

export function LeadDeleteButton({ leadId, leadName }: { leadId: string; leadName: string }) {
  return (
    <form action={deleteLead.bind(null, leadId)} onSubmit={(event) => {
      if (!window.confirm(`Permanently delete the lead request from ${leadName}? This cannot be undone.`)) {
        event.preventDefault();
      }
    }}>
      <button className="button danger-button button-small" type="submit">Delete</button>
    </form>
  );
}
