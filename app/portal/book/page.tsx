import { ArrowUpRight, CalendarClock, Clock3, Video } from "lucide-react";
import { requireClient } from "@/lib/auth-guards";
import { getGoogleBookingPageUrl, getGoogleCalendarTimeZone } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export default async function BookMeetingPage() {
  await requireClient();
  const bookingPageUrl = getGoogleBookingPageUrl();
  const timeZone = getGoogleCalendarTimeZone();

  return (
    <div className="workspace-stack">
      <section className="workspace-card booking-hero-card">
        <div>
          <span className="kicker">MACM WEBSITE PLANNING CALL</span>
          <h2>Find a time that works.</h2>
          <p>Choose a 30-minute conversation about your website, next steps, and the right way to move the project forward. Google will add the calendar invite and a private Google Meet link after you confirm.</p>
          {bookingPageUrl ? (
            <a className="button" href={bookingPageUrl} target="_blank" rel="noopener noreferrer">
              Choose a meeting time <ArrowUpRight size={16} />
            </a>
          ) : (
            <div className="workspace-alert" role="status">The booking page is being connected. Please check back soon or contact MACM directly.</div>
          )}
          {bookingPageUrl ? <p className="booking-fallback">If the booking page does not open, <a href={bookingPageUrl} target="_blank" rel="noopener noreferrer">open it in a new tab</a>.</p> : null}
        </div>
        <div className="booking-hero-icon" aria-hidden="true"><CalendarClock size={54} /></div>
      </section>

      <section className="booking-info-grid" aria-label="Meeting details">
        <article className="workspace-card booking-info-card"><Clock3 size={20} /><div><strong>30 minutes</strong><p>A focused call with enough room to understand your goals and agree on a useful next step.</p></div></article>
        <article className="workspace-card booking-info-card"><Video size={20} /><div><strong>Google Meet included</strong><p>Your invite includes the meeting link automatically, so there is nothing extra to arrange.</p></div></article>
      </section>

      <section className="workspace-card booking-windows-card">
        <div className="section-title-small"><span className="kicker">BOOKING WINDOWS</span><h2>When MACM is available</h2><p>All times are shown in {timeZone}. Google also checks the calendar for existing commitments before offering a slot.</p></div>
        <div className="booking-window-grid">
          <div><span>Monday–Friday</span><strong>8:00 PM – 9:30 PM</strong><small>Three 30-minute starts</small></div>
          <div><span>Saturday</span><strong>5:00 PM – 9:00 PM</strong><small>Eight 30-minute starts</small></div>
          <div><span>Sunday</span><strong>8:00 AM – 6:00 PM</strong><small>Twenty 30-minute starts</small></div>
        </div>
      </section>
    </div>
  );
}
