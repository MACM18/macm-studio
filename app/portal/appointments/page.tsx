import { ExternalLink, Video } from "lucide-react";
import { requireClient } from "@/lib/auth-guards";
import { googleCalendarIsConfigured, getGoogleCalendarTimeZone, listCalendarAppointments, type CalendarAppointment } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

function formatAppointment(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-LK", { dateStyle: "full", timeStyle: "short", timeZone }).format(new Date(value));
}

function AppointmentCard({ appointment, timeZone }: { appointment: CalendarAppointment; timeZone: string }) {
  return <article className="workspace-card appointment-card"><div className="workspace-card-top"><span className={`status-pill status-${appointment.status.toLowerCase()}`}>{appointment.status}</span><span>{formatAppointment(appointment.start, timeZone)}</span></div><h2>{appointment.summary}</h2><p>{formatAppointment(appointment.start, timeZone)} – {new Intl.DateTimeFormat("en-LK", { timeStyle: "short", timeZone }).format(new Date(appointment.end))}</p><div className="appointment-links">{appointment.meetUrl ? <a className="button button-small" href={appointment.meetUrl} target="_blank" rel="noopener noreferrer"><Video size={14} /> Join Google Meet</a> : <span className="appointment-pending">Meet details will appear in your Google Calendar invite.</span>}{appointment.htmlLink ? <a className="table-link" href={appointment.htmlLink} target="_blank" rel="noopener noreferrer">Open calendar event <ExternalLink size={14} /></a> : null}</div></article>;
}

export default async function PortalAppointmentsPage() {
  const { user } = await requireClient();
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
  return <div className="workspace-stack"><section className="section-title-small"><span className="kicker">YOUR CALENDAR</span><h2>Appointments</h2><p>Your MACM planning calls are shown here after Google Calendar confirms them. Changes and cancellations are handled from the calendar invitation.</p></section>{!googleCalendarIsConfigured() ? <div className="workspace-alert" role="status">Calendar appointment visibility is being connected. You can still use the booking page from the meeting area.</div> : null}{error ? <div className="workspace-alert" role="alert">We could not load the calendar right now. Please open the invitation email or try again later.</div> : null}<section><div className="section-title-small"><span className="kicker">UPCOMING</span><h2>Next conversations</h2></div>{upcoming.length ? <div className="appointment-list">{upcoming.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} timeZone={timeZone} />)}</div> : <div className="workspace-empty compact"><p>No upcoming appointments yet. When you are ready, choose a time from <a className="table-link" href="/portal/book">Book a meeting</a>.</p></div>}</section>{past.length ? <section><div className="section-title-small"><span className="kicker">HISTORY</span><h2>Previous conversations</h2></div><div className="appointment-list">{past.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} timeZone={timeZone} />)}</div></section> : null}</div>;
}
