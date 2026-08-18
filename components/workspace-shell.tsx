import Link from "next/link";
import type { ReactNode } from "react";
import { WorkspaceNavigation } from "@/components/workspace-navigation";
import { WorkspaceTheme, SignOutButton } from "@/components/workspace-controls";
import { LanguageToggle } from "@/components/language-toggle";

export type WorkspaceNavIcon = "dashboard" | "leads" | "clients" | "projects" | "appointments" | "audit" | "profile" | "meeting";

export type WorkspaceNavItem = {
  href: string;
  label: string;
  description: string;
  icon: WorkspaceNavIcon;
};

export function WorkspaceShell({ children, title, eyebrow, userName, nav, showLanguageToggle = false, navigationHeading = "Workspace", navigationOpen = "Menu", navigationClose = "Close" }: { children: ReactNode; title: string; eyebrow: string; userName: string; nav: WorkspaceNavItem[]; showLanguageToggle?: boolean; navigationHeading?: string; navigationOpen?: string; navigationClose?: string }) {
  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#workspace-main">Skip to content</a>
      <aside className="workspace-sidebar">
        <div className="workspace-sidebar-top">
          <Link href="/" className="brand" aria-label="MACM home">MACM<i /></Link>
          <div className="workspace-identity"><span>{eyebrow}</span><strong>{userName}</strong></div>
        </div>
        <WorkspaceNavigation eyebrow={eyebrow} nav={nav} heading={navigationHeading} openLabel={navigationOpen} closeLabel={navigationClose} />
        <div className="workspace-sidebar-actions">{showLanguageToggle ? <LanguageToggle compact /> : null}<WorkspaceTheme englishOnly={!showLanguageToggle} /><SignOutButton englishOnly={!showLanguageToggle} /></div>
      </aside>
      <div className="workspace-content">
        <div className="workspace-mobile-bar"><Link href="/" className="brand" aria-label="MACM home">MACM<i /></Link><span>{eyebrow}</span></div>
        <main id="workspace-main" className="workspace-main">
          <div className="workspace-title"><span className="kicker">{eyebrow}</span><h1>{title}</h1></div>
          {children}
        </main>
      </div>
    </div>
  );
}
