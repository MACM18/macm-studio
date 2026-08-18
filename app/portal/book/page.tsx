import { ArrowUpRight, CalendarClock, Clock3, Video } from "lucide-react";
import { requireClient } from "@/lib/auth-guards";
import { getGoogleBookingPageUrl, getGoogleCalendarTimeZone } from "@/lib/google-calendar";
import { getServerLocale } from "@/lib/server-locale";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function BookMeetingPage() {
  await requireClient();
  const locale = await getServerLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const bookingPageUrl = getGoogleBookingPageUrl();
  const timeZone = getGoogleCalendarTimeZone();

  return (
    <div className="workspace-stack">
      <section className="workspace-card booking-hero-card">
        <div>
          <span className="kicker">{t("portal.bookingKicker")}</span>
          <h2>{t("portal.bookingTitle")}</h2>
          <p>{t("portal.bookingCopy")}</p>
          {bookingPageUrl ? (
            <a className="button" href={bookingPageUrl} target="_blank" rel="noopener noreferrer">
              {t("portal.chooseTime")} <ArrowUpRight size={16} />
            </a>
          ) : (
            <div className="workspace-alert" role="status">{t("portal.bookingMissing")}</div>
          )}
          {bookingPageUrl ? <p className="booking-fallback">{t("portal.bookingFallback")} <a href={bookingPageUrl} target="_blank" rel="noopener noreferrer">↗</a>.</p> : null}
        </div>
        <div className="booking-hero-icon" aria-hidden="true"><CalendarClock size={54} /></div>
      </section>

      <section className="booking-info-grid" aria-label={t("portal.meetingDetails")}>
        <article className="workspace-card booking-info-card"><Clock3 size={20} /><div><strong>{t("portal.thirtyMinutes")}</strong><p>{t("portal.thirtyCopy")}</p></div></article>
        <article className="workspace-card booking-info-card"><Video size={20} /><div><strong>{t("portal.meetIncluded")}</strong><p>{t("portal.meetCopy")}</p></div></article>
      </section>

      <section className="workspace-card booking-windows-card">
        <div className="section-title-small"><span className="kicker">{t("portal.windows")}</span><h2>{t("portal.whenAvailable")}</h2><p>{t("portal.windowsCopy")} {timeZone}. {t("portal.calendarChecks")}</p></div>
        <div className="booking-window-grid">
          <div><span>{t("portal.weekdays")}</span><strong>8:00 PM – 9:30 PM</strong><small>{t("portal.weekdaysStarts")}</small></div>
          <div><span>{t("portal.saturday")}</span><strong>5:00 PM – 9:00 PM</strong><small>{t("portal.saturdayStarts")}</small></div>
          <div><span>{t("portal.sunday")}</span><strong>8:00 AM – 6:00 PM</strong><small>{t("portal.sundayStarts")}</small></div>
        </div>
      </section>
    </div>
  );
}
