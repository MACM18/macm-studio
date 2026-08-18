import "server-only";

import { createSign } from "node:crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

type GoogleCalendarConfig = {
  calendarId: string;
  serviceAccountEmail: string;
  privateKey: string;
  timeZone: string;
};

type GoogleAttendee = { email?: string; displayName?: string; responseStatus?: string };

type GoogleCalendarEvent = {
  id?: string;
  summary?: string;
  status?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: GoogleAttendee[];
  hangoutLink?: string;
  conferenceData?: { entryPoints?: Array<{ entryPointType?: string; uri?: string }> };
};

type GoogleEventsResponse = { items?: GoogleCalendarEvent[] };

export type CalendarAppointment = {
  id: string;
  summary: string;
  status: string;
  start: string;
  end: string;
  timeZone: string;
  htmlLink: string | null;
  meetUrl: string | null;
  attendeeEmails: string[];
};

let tokenCache: { accessToken: string; expiresAt: number } | null = null;

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function getConfig(): GoogleCalendarConfig {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim();
  if (!serviceAccountEmail || !privateKey || !calendarId) {
    throw new Error("Google Calendar is not configured.");
  }
  return {
    serviceAccountEmail,
    privateKey,
    calendarId,
    timeZone: process.env.GOOGLE_CALENDAR_TIME_ZONE?.trim() || "Asia/Colombo",
  };
}

export function googleCalendarIsConfigured() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim() && process.env.GOOGLE_CALENDAR_ID?.trim());
}

export function getGoogleBookingPageUrl() {
  const value = process.env.GOOGLE_BOOKING_PAGE_URL?.trim();
  return value && /^https:\/\//i.test(value) ? value : null;
}

export function getGoogleCalendarTimeZone() {
  return process.env.GOOGLE_CALENDAR_TIME_ZONE?.trim() || "Asia/Colombo";
}

async function getAccessToken(config: GoogleCalendarConfig) {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;

  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ iss: config.serviceAccountEmail, scope: CALENDAR_SCOPE, aud: GOOGLE_TOKEN_URL, iat: issuedAt, exp: issuedAt + 3600 }));
  const unsignedToken = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256").update(unsignedToken).sign(config.privateKey);
  const assertion = `${unsignedToken}.${base64Url(signature)}`;
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Google Calendar authentication failed.");
  const body = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw new Error("Google Calendar did not return an access token.");
  tokenCache = { accessToken: body.access_token, expiresAt: Date.now() + Math.max(60, body.expires_in ?? 3600) * 1000 };
  return body.access_token;
}

async function listEvents(config: GoogleCalendarConfig, timeMin: Date, timeMax: Date) {
  const accessToken = await getAccessToken(config);
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    showDeleted: "false",
    maxResults: "2500",
  });
  const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(config.calendarId)}/events?${params.toString()}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Google Calendar appointments could not be loaded.");
  return (await response.json()) as GoogleEventsResponse;
}

function toAppointment(event: GoogleCalendarEvent, timeZone: string): CalendarAppointment | null {
  const start = event.start?.dateTime ?? event.start?.date;
  const end = event.end?.dateTime ?? event.end?.date;
  if (!event.id || !start || !end) return null;
  const meetUrl = event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri ?? event.hangoutLink ?? null;
  return {
    id: event.id,
    summary: event.summary?.trim() || "MACM meeting",
    status: event.status?.toUpperCase() || "CONFIRMED",
    start,
    end,
    timeZone: event.start?.timeZone || timeZone,
    htmlLink: event.htmlLink ?? null,
    meetUrl,
    attendeeEmails: (event.attendees ?? []).map((attendee) => attendee.email?.trim().toLowerCase()).filter((email): email is string => Boolean(email)),
  };
}

export async function listCalendarAppointments(options: { email?: string; timeMin?: Date; timeMax?: Date } = {}) {
  const config = getConfig();
  const timeMin = options.timeMin ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const timeMax = options.timeMax ?? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  const requestedEmail = options.email?.trim().toLowerCase();
  const events = await listEvents(config, timeMin, timeMax);
  return (events.items ?? [])
    .map((event) => toAppointment(event, config.timeZone))
    .filter((event): event is CalendarAppointment => Boolean(event))
    .filter((event) => !requestedEmail || event.attendeeEmails.includes(requestedEmail));
}
