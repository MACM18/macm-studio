import Link from "next/link";
import { ArrowUpRight, CalendarDays, CircleUserRound } from "lucide-react";
import { requireClient } from "@/lib/auth-guards";
import { updateProfile } from "@/app/portal/actions";
import { prisma } from "@/lib/db";
import { calculateProjectProgress } from "@/lib/project-progress";
import { readPrivateText } from "@/lib/private-data";
import { getServerLocale } from "@/lib/server-locale";
import { translate, translateStatus } from "@/lib/i18n";
import { getTelegramConnectionState } from "@/lib/telegram-customer";
import { TelegramConnect } from "@/components/telegram-connect";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your profile | MACM", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const { user } = await requireClient();
  const locale = await getServerLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const profileUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!profileUser) return null;
  const telegramConnection = await getTelegramConnectionState(user.id);
  const projects = await prisma.project.findMany({
    where: { ownerId: user.id, visibility: { in: ["DRAFT", "PUBLISHED"] } },
    include: {
      milestones: { orderBy: { sortOrder: "asc" } },
      updates: { where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
  const updates = projects.flatMap((project) => project.updates.map((update) => ({ ...update, projectTitle: project.title, displayBody: readPrivateText(update.bodyEncrypted, update.body) ?? "" }))).sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)).slice(0, 5);
  const company = readPrivateText(profileUser.companyEncrypted, profileUser.company);
  const phone = readPrivateText(profileUser.phoneEncrypted, profileUser.phone);
  const averageProgress = projects.length ? Math.round(projects.reduce((total, project) => total + calculateProjectProgress(project.milestones), 0) / projects.length) : 0;

  return <div className="workspace-stack"><section id="profile-details" className="workspace-card workspace-panel-narrow"><div className="panel-heading"><div><span className="kicker">{t("portal.profileDetails")}</span><h2>{t("portal.profileTitle")}</h2></div><p>{t("portal.profileCopy")}</p></div><form action={updateProfile} className="workspace-form two-column-form"><label>{t("portal.fullName")}<input name="name" required defaultValue={profileUser.name} /></label><label>{t("portal.company")}<input name="company" defaultValue={company ?? ""} /></label><label>{t("portal.phone")}<input name="phone" type="tel" defaultValue={phone ?? ""} /></label><label>{t("portal.signinEmail")}<input value={profileUser.email} disabled aria-describedby="locked-email" /></label><small id="locked-email">{t("portal.lockedEmail")}</small><button className="button">{t("portal.saveProfile")}</button></form></section><TelegramConnect initialConnection={telegramConnection ? { ...telegramConnection, connectedAt: telegramConnection.connectedAt.toISOString(), lastMessageAt: telegramConnection.lastMessageAt?.toISOString() ?? null } : null} labels={{ kicker: t("portal.telegramKicker"), title: t("portal.telegramTitle"), copy: t("portal.telegramCopy"), connect: t("portal.telegramConnect"), open: t("portal.telegramOpen"), connected: t("portal.telegramConnected"), enable: t("portal.telegramEnable"), disable: t("portal.telegramDisable"), disconnect: t("portal.telegramDisconnect"), waiting: t("portal.telegramWaiting"), unavailable: t("portal.telegramUnavailable"), lastDelivery: t("portal.telegramLastDelivery"), notSent: t("portal.telegramNotSent") }} /><div className="profile-focus-nav" aria-label={t("portal.profileFocus")}><a href="#profile-details">{t("portal.profileDetails")}</a><a href="#profile-progress">{t("portal.pulse")}</a><a href="#profile-updates">{t("portal.latest")}</a></div><section id="profile-progress"><div className="section-title-small"><span className="kicker">{t("portal.pulse")}</span><h2>{t("portal.pulseTitle")}</h2><p>{t("portal.pulseCopy")}</p></div><div className="profile-pulse-grid"><article className="workspace-card profile-pulse-card"><CircleUserRound size={19} color="rgb(var(--signal))" /><strong>{projects.length}</strong><span>{t("portal.activeProject")}{projects.length === 1 ? "" : "s"}</span></article><article className="workspace-card profile-pulse-card"><CalendarDays size={19} color="rgb(var(--signal))" /><strong>{averageProgress}%</strong><span>{t("portal.average")}</span></article><Link href="/portal/appointments" className="workspace-card profile-pulse-card"><CalendarDays size={19} color="rgb(var(--signal))" /><strong>{t("portal.meetings")}</strong><span>{t("portal.next")} <ArrowUpRight size={14} /></span></Link></div>{projects.length ? <div className="profile-project-list">{projects.map((project) => { const progress = calculateProjectProgress(project.milestones); const nextMilestone = project.milestones.find((milestone) => milestone.progress < 100 && milestone.state !== "COMPLETE"); const latestUpdate = project.updates[0]; return <article className="workspace-card profile-project-card" key={project.id}><div className="profile-project-meta"><span className={`status-pill status-${project.status.toLowerCase()}`}>{translateStatus(locale, project.status)}</span><strong>{progress}% {t("portal.complete")}</strong></div><h3>{project.title}</h3><p>{nextMilestone ? <>{t("portal.nextFocus")}: {nextMilestone.title}{nextMilestone.dueDate ? <> · {t("portal.dueLower")} {nextMilestone.dueDate.toLocaleDateString("en-LK", { dateStyle: "medium" })}</> : null}</> : t("portal.allComplete")}</p><div className="progress-track"><i style={{ width: `${progress}%` }} /></div><div className="project-card-footer"><span>{latestUpdate ? <>{t("portal.latestNote")}: {latestUpdate.title}</> : t("portal.noPublishedNotes")}</span><Link href={`/portal/projects/${project.id}`}>{t("portal.viewProgress")} <ArrowUpRight size={14} /></Link></div></article>; })}</div> : <div className="workspace-empty compact"><p>{t("portal.setupCopy")}</p></div>}</section><section id="profile-updates"><div className="section-title-small"><span className="kicker">{t("portal.updates")}</span><h2>{t("portal.notes")}</h2></div>{updates.length ? <div className="profile-update-list">{updates.map((update) => <article className="workspace-card profile-update-card" key={update.id}><small>{update.projectTitle} · {update.publishedAt?.toLocaleDateString("en-LK", { dateStyle: "medium" })}</small><h3>{update.title}</h3><p>{update.displayBody}</p></article>)}</div> : <div className="workspace-empty compact"><p>{t("portal.noPublished")}</p></div>}</section></div>;
}
