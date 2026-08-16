import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAMPLE_HOST_PATTERN = /^sample(?:[1-9]|10)\.macm\.lk$/;

function isAllowedSampleUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !SAMPLE_HOST_PATTERN.test(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

async function requestSample(url: URL, method: "HEAD" | "GET") {
  const response = await fetch(url, {
    method,
    redirect: "follow",
    cache: "no-store",
    headers: { accept: "text/html,application/xhtml+xml" },
    signal: AbortSignal.timeout(5000),
  });

  const finalHost = new URL(response.url).hostname;
  const sameSampleHost = SAMPLE_HOST_PATTERN.test(finalHost);
  let isHostingPlaceholder = false;

  if (method === "GET" && response.ok) {
    const html = (await response.text()).slice(0, 200_000).toLowerCase();
    isHostingPlaceholder = [
      "this is a placeholder for the subdomain",
      "placeholder for the subdomain",
    ].some((marker) => html.includes(marker));
  }

  return {
    available: sameSampleHost && response.ok && !isHostingPlaceholder,
    status: response.status,
  };
}

export async function GET(request: NextRequest) {
  const requestedUrl = request.nextUrl.searchParams.get("url");
  const url = requestedUrl ? isAllowedSampleUrl(requestedUrl) : null;

  if (!url) {
    return NextResponse.json({ available: false, status: 400 }, { status: 400 });
  }

  try {
    let result = await requestSample(url, "HEAD");

    // Some static hosts do not implement HEAD even though the page is live.
    // A GET is also required when HEAD returns 200 so DirectAdmin's default
    // subdomain placeholder can be distinguished from a deployed website.
    if (result.status === 405 || result.status === 501 || result.available) {
      result = await requestSample(url, "GET");
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json(
      { available: false, status: 0 },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
