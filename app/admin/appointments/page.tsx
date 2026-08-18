import { ExternalLink, Video } from "lucide-react";
import { requireAdmin } from "@/lib/auth-guards";
import { googleCalendarIsConfigured, getGoogleCalendarTimeZone, listCalendarAppointments, type CalendarAppointment } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

function formatAppointment(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(value));
}

export default async function AdminAppointmentsPage() {
  await requireAdmin();
  const timeZone = getGoogleCalendarTimeZone();
  let appointments: CalendarAppointment[] = [];
  let error = false;
  if (googleCalendarIsConfigured()) {
    try {
      appointments = await listCalendarAppointments();
    } catch {
      error = true;
    }
  }
  return <section><div className="section-title-small"><span className="kicker">GOOGLE CALENDAR</span><h2>Client appointments</h2><p>Read-only view of the configured booking calendar. Google remains the source of truth for invitations, Meet links, changes, and cancellations.</p></div>{!googleCalendarIsConfigured() ? <div className="workspace-alert" role="status">Add the Google Calendar service-account settings to enable appointment visibility. The booking page URL separately enables customer bookings.</div> : null}{error ? <div className="workspace-alert" role="alert">Google Calendar could not be reached. Check the service-account access and try again.</div> : null}<div className="workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Meeting</th><th>Time ({timeZone})</th><th>Attendees</th><th>Google Meet</th><th>Calendar</th></tr></thead><tbody>{appointments.length ? appointments.map((appointment) => <tr key={appointment.id}><td><strong>{appointment.summary}</strong><small><span className={`status-pill status-${appointment.status.toLowerCase()}`}>{appointment.status}</span></small></td><td>{formatAppointment(appointment.start, timeZone)}<small>Ends {formatAppointment(appointment.end, timeZone)}</small></td><td>{appointment.attendeeEmails.length ? appointment.attendeeEmails.join(", ") : "No attendee details"}</td><td>{appointment.meetUrl ? <a className="table-link" href={appointment.meetUrl} target="_blank" rel="noopener noreferrer"><Video size={14} /> Join</a> : "Pending"}</td><td>{appointment.htmlLink ? <a className="table-link" href={appointment.htmlLink} target="_blank" rel="noopener noreferrer">Open <ExternalLink size={14} /></a> : "—"}</td></tr>) : <tr><td colSpan={5}>No appointments found in the configured calendar window.</td></tr>}</tbody></table></div></section>;
}
