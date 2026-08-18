"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Activity, BriefcaseBusiness, CalendarDays, ClipboardList, FileClock, Inbox, LayoutDashboard, Menu, UserRound, UsersRound, X } from "lucide-react";
import type { WorkspaceNavIcon, WorkspaceNavItem } from "@/components/workspace-shell";

const icons: Record<WorkspaceNavIcon, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  leads: Inbox,
  clients: UsersRound,
  projects: BriefcaseBusiness,
  appointments: CalendarDays,
  audit: FileClock,
  profile: UserRound,
  meeting: ClipboardList,
};

export function WorkspaceNavigation({ eyebrow, nav, heading = "Workspace", openLabel = "Menu", closeLabel = "Close" }: { eyebrow: string; nav: WorkspaceNavItem[]; heading?: string; openLabel?: string; closeLabel?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="workspace-navigation">
      <button className="workspace-nav-toggle" type="button" aria-expanded={open} aria-controls="workspace-nav-panel" aria-label={open ? `${closeLabel} ${heading}` : `${openLabel} ${heading}`} onClick={() => setOpen((value) => !value)}>
        {open ? <X size={18} /> : <Menu size={18} />}<span>{open ? closeLabel : openLabel}</span>
      </button>
      <button className={`workspace-nav-backdrop${open ? " is-visible" : ""}`} type="button" aria-label={`${closeLabel} ${heading}`} onClick={() => setOpen(false)} />
      <div id="workspace-nav-panel" className={`workspace-nav-panel${open ? " is-open" : ""}`}>
        <div className="workspace-nav-heading"><span>{heading}</span><Activity size={14} /></div>
        <nav aria-label={`${eyebrow} navigation`} className="workspace-nav-list">
          {nav.map((item) => {
            const Icon = icons[item.icon];
            const active = pathname === item.href || (item.href !== "/admin" && item.href !== "/portal" && pathname.startsWith(`${item.href}/`));
            return <Link href={item.href} key={item.href} className={`workspace-nav-item${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}><span className="workspace-nav-icon"><Icon size={17} /></span><span><strong>{item.label}</strong><small>{item.description}</small></span></Link>;
          })}
        </nav>
      </div>
    </div>
  );
}
