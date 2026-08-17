import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/identity";
import { deliverLeadWebhook } from "@/lib/lead-webhook";

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

function safeJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    const encoded = JSON.stringify(value);
    if (encoded.length > 30_000) return undefined;
    return JSON.parse(encoded) as Prisma.InputJsonValue;
  } catch {
    return undefined;
  }
}

function throttleKey(kind: "ip" | "email", value: string) {
  const pepper = process.env.BETTER_AUTH_SECRET ?? "lead-rate-limit";
  return `${kind}:${createHash("sha256").update(`${pepper}:${value}`).digest("hex")}`;
}

async function consumeLimit(key: string, maximum: number) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 60 * 60 * 1000);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.leadSubmissionLimit.findUnique({ where: { key } });
    if (!existing || existing.windowStart < cutoff) {
      await tx.leadSubmissionLimit.upsert({ where: { key }, create: { key, count: 1, windowStart: now }, update: { count: 1, windowStart: now } });
      return true;
    }
    if (existing.count >= maximum) return false;
    await tx.leadSubmissionLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return true;
  });
}

export async function POST(request: NextRequest) {
  let body: LeadRequest;
  try {
    body = (await request.json()) as LeadRequest;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.length > 0) return NextResponse.json({ ok: true });
  if (!isShortString(body.name, 120) || !isEmail(body.email) || !isShortString(body.projectType, 160)) {
    return NextResponse.json({ ok: false, message: "Please check the required fields." }, { status: 422 });
  }

  const email = normalizeEmail(body.email);
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = forwarded || request.headers.get("x-real-ip") || "unknown";

  try {
    const [ipAllowed, emailAllowed] = await Promise.all([
      consumeLimit(throttleKey("ip", clientIp), 5),
      consumeLimit(throttleKey("email", email), 3),
    ]);
    if (!ipAllowed || !emailAllowed) {
      return NextResponse.json({ ok: false, message: "Too many enquiries were sent. Please try again later." }, { status: 429 });
    }

    const lead = await prisma.lead.create({
      data: {
        name: body.name.trim(),
        email,
        phone: typeof body.phone === "string" ? body.phone.trim().slice(0, 40) || null : null,
        projectType: body.projectType.trim(),
        budgetSummary: typeof body.budgetSummary === "string" ? body.budgetSummary.slice(0, 4000) || null : null,
        notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 4000) || null : null,
        scope: safeJson(body.scope),
      },
    });

    await deliverLeadWebhook(lead.id);
    return NextResponse.json({ ok: true, leadId: lead.id, message: "Thanks — your project brief has been received safely." }, { status: 202 });
  } catch {
    return NextResponse.json({ ok: false, message: "We could not save your enquiry. Please try again shortly." }, { status: 503 });
  }
}
