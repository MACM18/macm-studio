import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireClient } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Client workspace | MACM", robots: { index: false, follow: false } };

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const { user } = await requireClient();
  return <WorkspaceShell title="Your projects" eyebrow="CLIENT WORKSPACE" userName={user.name} nav={[{ href: "/portal", label: "Projects", description: "Your active work", icon: "projects" }, { href: "/portal/book", label: "Book a meeting", description: "Find a suitable time", icon: "meeting" }, { href: "/portal/appointments", label: "Appointments", description: "Upcoming calls", icon: "appointments" }, { href: "/portal/profile", label: "Profile", description: "Details and project pulse", icon: "profile" }]}>{children}</WorkspaceShell>;
}
