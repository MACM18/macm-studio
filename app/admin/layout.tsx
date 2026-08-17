import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin workspace | MACM", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAdmin();
  return <WorkspaceShell title="Studio overview" eyebrow="ADMIN WORKSPACE" userName={user.name} nav={[{ href: "/admin", label: "Dashboard" }, { href: "/admin/leads", label: "Leads" }, { href: "/admin/clients", label: "Clients" }, { href: "/admin/projects", label: "Projects" }, { href: "/admin/audit", label: "Audit" }]}>{children}</WorkspaceShell>;
}
