import Link from "next/link";
import type { ReactNode } from "react";
import { WorkspaceTheme, SignOutButton } from "@/components/workspace-controls";

type NavItem = { href: string; label: string };

export function WorkspaceShell({ children, title, eyebrow, userName, nav }: { children: ReactNode; title: string; eyebrow: string; userName: string; nav: NavItem[] }) {
  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#workspace-main">Skip to content</a>
      <header className="workspace-header">
        <div className="workspace-header-inner">
          <Link href="/" className="brand" aria-label="MACM home">MACM<i /></Link>
          <div className="workspace-identity"><span>{eyebrow}</span><strong>{userName}</strong></div>
          <div className="workspace-header-actions"><WorkspaceTheme /><SignOutButton /></div>
        </div>
        <nav className="workspace-nav" aria-label={`${eyebrow} navigation`}>
          {nav.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
      </header>
      <main id="workspace-main" className="workspace-main">
        <div className="workspace-title"><span className="kicker">{eyebrow}</span><h1>{title}</h1></div>
        {children}
      </main>
    </div>
  );
}
