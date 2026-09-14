import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { streamCopilotChat } from "@/lib/copilot/openrouter";

export const runtime = "nodejs";

function throttleKey(ip: string) {
  const pepper = process.env.BETTER_AUTH_SECRET ?? "copilot-rate-limit";
  return `copilot:${createHash("sha256").update(`${pepper}:${ip}`).digest("hex")}`;
}

async function consumeCopilotLimit(key: string, maximum = 30) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 10 * 60 * 1000); // 10 minute window

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.leadSubmissionLimit.findUnique({ where: { key } });
      if (!existing || existing.windowStart < cutoff) {
        await tx.leadSubmissionLimit.upsert({
          where: { key },
          create: { key, count: 1, windowStart: now },
          update: { count: 1, windowStart: now },
        });
        return true;
      }
      if (existing.count >= maximum) return false;
      await tx.leadSubmissionLimit.update({
        where: { key },
        data: { count: { increment: 1 } },
      });
      return true;
    });
  } catch {
    return true; // fail open if rate limit table has temporary lock
  }
}

export async function POST(request: NextRequest) {
  let body: { messages?: Array<{ role: unknown; content: unknown }> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "A non-empty messages array is required." }, { status: 422 });
  }

  const validMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const m of body.messages) {
    if (
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim().length > 0
    ) {
      validMessages.push({
        role: m.role,
        content: m.content.slice(0, 4000),
      });
    }
  }

  if (validMessages.length === 0) {
    return NextResponse.json({ error: "No valid user messages found." }, { status: 422 });
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = forwarded || request.headers.get("x-real-ip") || "unknown";

  const allowed = await consumeCopilotLimit(throttleKey(clientIp), 35);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes before chatting again." },
      { status: 429 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of streamCopilotChat(validMessages)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message: err instanceof Error ? err.message : "Unexpected stream error",
            })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
