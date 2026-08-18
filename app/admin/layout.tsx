import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin workspace | MACM", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAdmin();
  return <WorkspaceShell title="Studio overview" eyebrow="ADMIN WORKSPACE" userName={user.name} nav={[{ href: "/admin", label: "Dashboard", description: "At-a-glance studio view", icon: "dashboard" }, { href: "/admin/leads", label: "Leads", description: "Review new enquiries", icon: "leads" }, { href: "/admin/clients", label: "Clients", description: "Access and contacts", icon: "clients" }, { href: "/admin/projects", label: "Projects", description: "Progress and delivery", icon: "projects" }, { href: "/admin/appointments", label: "Appointments", description: "Calendar bookings", icon: "appointments" }, { href: "/admin/audit", label: "Audit", description: "Changes and history", icon: "audit" }]}>{children}</WorkspaceShell>;
}
