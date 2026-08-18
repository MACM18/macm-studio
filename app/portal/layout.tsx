import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireClient } from "@/lib/auth-guards";
import { getServerLocale } from "@/lib/server-locale";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Client workspace | MACM", robots: { index: false, follow: false } };

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const { user } = await requireClient();
  const locale = await getServerLocale();
  return <WorkspaceShell title={translate(locale, "portal.title")} eyebrow={translate(locale, "portal.workspace")} userName={user.name} showLanguageToggle navigationHeading={translate(locale, "portal.workspace")} navigationOpen={locale === "si" ? "විවෘත කරන්න" : "Menu"} navigationClose={locale === "si" ? "වසන්න" : "Close"} nav={[{ href: "/portal", label: translate(locale, "portal.projects"), description: translate(locale, "portal.projectsDesc"), icon: "projects" }, { href: "/portal/book", label: translate(locale, "portal.book"), description: translate(locale, "portal.bookDesc"), icon: "meeting" }, { href: "/portal/appointments", label: translate(locale, "portal.appointments"), description: translate(locale, "portal.appointmentsDesc"), icon: "appointments" }, { href: "/portal/profile", label: translate(locale, "portal.profile"), description: translate(locale, "portal.profileDesc"), icon: "profile" }]}>{children}</WorkspaceShell>;
}
