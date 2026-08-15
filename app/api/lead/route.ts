import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface LeadRequest {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  projectType?: unknown;
  budgetSummary?: unknown;
  notes?: unknown;
  website?: unknown;
  scope?: unknown;
}

function isShortString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

function isEmail(value: unknown): value is string {
  if (!isShortString(value, 254)) return false;
  const at = value.indexOf("@");
  return at > 0 && at === value.lastIndexOf("@") && at < value.length - 3 && value.slice(at + 1).includes(".");
}

export async function POST(request: NextRequest) {
  let body: LeadRequest;

  try {
    body = (await request.json()) as LeadRequest;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (!isShortString(body.name, 120) || !isEmail(body.email) || !isShortString(body.projectType, 160)) {
    return NextResponse.json({ ok: false, message: "Please check the required fields." }, { status: 422 });
  }

  const lead = {
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    phone: typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "",
    projectType: body.projectType.trim(),
    budgetSummary: typeof body.budgetSummary === "string" ? body.budgetSummary.slice(0, 2000) : "",
    notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 4000) : "",
    scope: body.scope,
    submittedAt: new Date().toISOString(),
  };

  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(lead),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`Webhook returned ${response.status}`);
    } catch (error) {
      console.error("Lead webhook delivery failed", error);
      return NextResponse.json(
        { ok: false, message: "Your enquiry could not be delivered. Please try again." },
        { status: 502 },
      );
    }
  } else {
    console.info("Lead received", JSON.stringify(lead));
  }

  return NextResponse.json({ ok: true, message: "Thanks — your project brief is in our queue." }, { status: 202 });
}
