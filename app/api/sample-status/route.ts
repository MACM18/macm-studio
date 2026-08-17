import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAMPLE_DOMAINS = [
  "sample1.macm.lk",
  "sample2.macm.lk",
  "sample3.macm.lk",
  "sample4.macm.lk",
  "sample5.macm.lk",
  "sample6.macm.lk",
  "sample7.macm.lk",
  "sample8.macm.lk",
  "sample9.macm.lk",
  "sample10.macm.lk",
];

const SAMPLE_HOST_PATTERN = /^sample(?:[1-9]|10)\.macm\.lk$/;
const CACHE_TTL_MS = 5 * 60 * 1000;

type SampleStatus = { available: boolean; status: number; title?: string; description?: string };
type SampleStatusMap = Record<string, SampleStatus>;

let cachedStatuses: { expiresAt: number; statuses: SampleStatusMap } | null = null;
let statusRefresh: Promise<SampleStatusMap> | null = null;

function isAllowedSampleUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !SAMPLE_HOST_PATTERN.test(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

async function checkSample(domain: string): Promise<SampleStatus> {
  try {
    const response = await fetch(`https://${domain}/`, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: { accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(5000),
    });

    const finalHost = new URL(response.url).hostname;
    const sameSampleHost = SAMPLE_HOST_PATTERN.test(finalHost);
    const html = response.ok ? (await response.text()).slice(0, 200_000) : "";
    const normalizedHtml = html.toLowerCase();
    const isHostingPlaceholder = [
      "this is a placeholder for the subdomain",
      "placeholder for the subdomain",
    ].some((marker) => normalizedHtml.includes(marker));
    const available = sameSampleHost && response.ok && !isHostingPlaceholder;

    if (!available) return { available, status: response.status };

    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
      ?.replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
    const description = html.match(/<meta\b[^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*content=["']([^"']*)["'][^>]*>/i)?.[1]
      ?.replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220);

    return {
      available,
      status: response.status,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    };
  } catch {
    return { available: false, status: 0 };
  }
}

async function getAllStatuses(): Promise<SampleStatusMap> {
  if (cachedStatuses && cachedStatuses.expiresAt > Date.now()) return cachedStatuses.statuses;

  if (!statusRefresh) {
    statusRefresh = Promise.all(
      SAMPLE_DOMAINS.map(async (domain) => [domain, await checkSample(domain)] as const),
    )
      .then((entries) => {
        const statuses = Object.fromEntries(entries);
        cachedStatuses = { expiresAt: Date.now() + CACHE_TTL_MS, statuses };
        return statuses;
      })
      .finally(() => {
        statusRefresh = null;
      });
  }

  return statusRefresh;
}

export async function GET(request: NextRequest) {
  const requestedUrl = request.nextUrl.searchParams.get("url");

  if (requestedUrl) {
    const url = isAllowedSampleUrl(requestedUrl);
    if (!url) return NextResponse.json({ available: false, status: 400 }, { status: 400 });

    const statuses = await getAllStatuses();
    const result = statuses[url.hostname] ?? { available: false, status: 0 };
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }

  const statuses = await getAllStatuses();
  return NextResponse.json(
    { samples: statuses },
    { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } },
  );
}
