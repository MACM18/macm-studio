import { ExternalLink, Video } from "lucide-react";
import { requireClient } from "@/lib/auth-guards";
import { googleCalendarIsConfigured, getGoogleCalendarTimeZone, listCalendarAppointments, type CalendarAppointment } from "@/lib/google-calendar";
import { getServerLocale } from "@/lib/server-locale";
import { translate, translateStatus } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function formatAppointment(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-LK", { dateStyle: "full", timeStyle: "short", timeZone }).format(new Date(value));
}

function AppointmentCard({ appointment, timeZone, locale }: { appointment: CalendarAppointment; timeZone: string; locale: "en" | "si" }) {
  return <article className="workspace-card appointment-card"><div className="workspace-card-top"><span className={`status-pill status-${appointment.status.toLowerCase()}`}>{translateStatus(locale, appointment.status)}</span><span>{formatAppointment(appointment.start, timeZone)}</span></div><h2>{appointment.summary}</h2><p>{formatAppointment(appointment.start, timeZone)} – {new Intl.DateTimeFormat("en-LK", { timeStyle: "short", timeZone }).format(new Date(appointment.end))}</p><div className="appointment-links">{appointment.meetUrl ? <a className="button button-small" href={appointment.meetUrl} target="_blank" rel="noopener noreferrer"><Video size={14} /> {translate(locale, "common.joinMeet")}</a> : <span className="appointment-pending">{translate(locale, "common.meetPending")}</span>}{appointment.htmlLink ? <a className="table-link" href={appointment.htmlLink} target="_blank" rel="noopener noreferrer">{translate(locale, "common.openCalendar")} <ExternalLink size={14} /></a> : null}</div></article>;
}

export default async function PortalAppointmentsPage() {
  const { user } = await requireClient();
  const locale = await getServerLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const timeZone = getGoogleCalendarTimeZone();
  let appointments: CalendarAppointment[] = [];
  let error = false;
  if (googleCalendarIsConfigured()) {
    try {
      appointments = await listCalendarAppointments({ email: user.email });
    } catch {
      error = true;
    }
  }
  const upcoming = appointments.filter((appointment) => new Date(appointment.end).getTime() >= Date.now());
  const past = appointments.filter((appointment) => new Date(appointment.end).getTime() < Date.now()).reverse();
  return <div className="workspace-stack"><section className="section-title-small"><span className="kicker">{t("portal.calendarKicker")}</span><h2>{t("portal.appointments")}</h2><p>{t("portal.calendarIntro")}</p></section>{!googleCalendarIsConfigured() ? <div className="workspace-alert" role="status">{t("portal.calendarConnecting")}</div> : null}{error ? <div className="workspace-alert" role="alert">{t("portal.calendarError")}</div> : null}<section><div className="section-title-small"><span className="kicker">{t("portal.upcoming")}</span><h2>{t("portal.next")}</h2></div>{upcoming.length ? <div className="appointment-list">{upcoming.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} timeZone={timeZone} locale={locale} />)}</div> : <div className="workspace-empty compact"><p>{t("portal.noAppointments")} {t("portal.whenReady")} <a className="table-link" href="/portal/book">{t("portal.book")}</a>.</p></div>}</section>{past.length ? <section><div className="section-title-small"><span className="kicker">{t("portal.history")}</span><h2>{t("portal.previous")}</h2></div><div className="appointment-list">{past.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} timeZone={timeZone} locale={locale} />)}</div></section> : null}</div>;
}
