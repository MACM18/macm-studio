import "server-only";
import { getCopilotConfig } from "./config";
import { COPILOT_TOOLS } from "./tools";
import { searchKnowledge } from "./vector-store";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export type CopilotStreamEvent =
  | { type: "text"; delta: string }
  | { type: "action"; action: string; params: Record<string, unknown> }
  | { type: "error"; message: string }
  | { type: "done" };

const SYSTEM_PROMPT = `You are the MACM Studio Helper Copilot, an engineering advisor and interactive concierge for macm.lk.
MACM is an engineering-led web design and development studio in Sri Lanka, crafting high-performance websites, managed WordPress setups, headless platforms, and full-stack web applications.

CORE CAPABILITIES & TOOLS:
1. 'configure_estimator': MANDATORY whenever you recommend or discuss a website foundation, add-on feature, or budget.
   Valid stackIds:
   - 'static' (Custom Static Build - LKR 45,000 / $150): marketing landing pages, brochures, high conversion.
   - 'wordpress' (Managed WordPress - LKR 60,000 / $200): easy content publishing, blogging, business websites.
   - 'headless' (Headless CMS - LKR 100,000 / $350): premium speed, e-commerce, custom modern stores, decoupled frontends.
   - 'fullstack' (Custom Full-Stack App - LKR 150,000 / $500): custom web apps, client portals, SaaS with admin dashboard.
   Valid addonIds:
   - 'payments' (LKR 35,000 / $120): PayHere or Stripe payment gateway checkout.
   - 'auth' (LKR 45,000 / $150): User accounts, permissions, member portals.
   - 'api' (LKR 30,000 / $100): Custom API & webhooks integration.
   - 'dedicated-backup' (LKR 10,000 / $30): Automated dedicated backup.

2. 'open_sample_preview': MANDATORY whenever the user asks for examples, samples, past work, or industry directions.
   You MUST ONLY use one of the 9 official studio sample project IDs:
   - 'mora-coffee': E-commerce / retail / grocery / coffee brand store concept.
   - 'harbor-hearth': Restaurant / dining / hospitality.
   - 'northline-legal': Corporate / legal / consulting / law firm.
   - 'ceylon-house': Boutique hotel / luxury stay / resort.
   - 'aster-form': Interior design / architecture portfolio.
   - 'luma-health': Wellness clinic / healthcare / medical practice.
   - 'kora-estates': Property development / real estate.
   - 'fieldnote': SaaS product landing page.
   - 'orbit-learning': Education platform / courses / LMS.
   NEVER make up or hallucinate non-existent project names like "Stackline SaaS".

CRITICAL INSTRUCTIONS:
- Whenever you recommend a stack or add-on (e.g. headless for e-commerce, or WordPress with payment gateway), ALWAYS execute 'configure_estimator' with the corresponding stackId and addonIds! Do not just describe it in text; actually call the tool so the visitor's live estimator on the left updates instantly!
- Whenever the user asks to see a sample or work (e.g., choice 1: see sample), ALWAYS execute 'open_sample_preview' with the best-matching sampleId from the 9 valid samples above!
- Pricing: Default to LKR for Sri Lanka, USD for international clients.
- Milestones: 10% kickoff, 50% working demo, 40% handover.
- Speed & Conciseness: Keep responses crisp, practical, and under 3-4 sentences.`;

interface OpenRouterStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string | null;
      tool_calls?: Array<{
        index: number;
        id?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason?: string | null;
  }>;
}

export function normalizeEstimatorArgs(args: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  const rawStack = String(args.stackId || args.stack || "").toLowerCase();
  if (rawStack.includes("head")) normalized.stackId = "headless";
  else if (rawStack.includes("word")) normalized.stackId = "wordpress";
  else if (rawStack.includes("full") || rawStack.includes("app")) normalized.stackId = "fullstack";
  else if (rawStack.includes("stat")) normalized.stackId = "static";

  const rawCurr = String(args.currency || "").toUpperCase();
  if (rawCurr === "USD" || rawCurr === "LKR") normalized.currency = rawCurr;

  const rawAddons = Array.isArray(args.addonIds)
    ? args.addonIds
    : Array.isArray(args.addons)
    ? args.addons
    : [];
  if (rawAddons.length > 0) {
    const clean: string[] = [];
    for (const a of rawAddons) {
      const str = String(a).toLowerCase();
      if (str.includes("pay")) clean.push("payments");
      else if (str.includes("auth") || str.includes("user") || str.includes("account")) clean.push("auth");
      else if (str.includes("api") || str.includes("webhook")) clean.push("api");
      else if (str.includes("backup")) clean.push("dedicated-backup");
    }
    normalized.addonIds = Array.from(new Set(clean));
  }

  if (typeof args.fastTrack === "boolean") normalized.fastTrack = args.fastTrack;
  if (typeof args.extraInboxes === "number") normalized.extraInboxes = args.extraInboxes;
  if (args.maintenancePlan === "care" || args.maintenancePlan === "none") normalized.maintenancePlan = args.maintenancePlan;
  if (args.maintenanceBilling === "monthly" || args.maintenanceBilling === "yearly") normalized.maintenanceBilling = args.maintenanceBilling;

  return normalized;
}

export function normalizeSampleId(raw: string): string {
  const target = String(raw).toLowerCase().trim();
  if (
    target.includes("mora") ||
    target.includes("coffee") ||
    target.includes("store") ||
    target.includes("shop") ||
    target.includes("grocery") ||
    target.includes("e-commerce") ||
    target.includes("ecommerce") ||
    target === "08" ||
    target === "8"
  ) {
    return "mora-coffee";
  }
  if (
    target.includes("harbor") ||
    target.includes("hearth") ||
    target.includes("restaurant") ||
    target.includes("food") ||
    target.includes("dining") ||
    target === "01" ||
    target === "1"
  ) {
    return "harbor-hearth";
  }
  if (
    target.includes("ceylon") ||
    target.includes("hotel") ||
    target.includes("villa") ||
    target.includes("resort") ||
    target.includes("hospitality") ||
    target === "03" ||
    target === "3"
  ) {
    return "ceylon-house";
  }
  if (
    target.includes("northline") ||
    target.includes("legal") ||
    target.includes("law") ||
    target.includes("attorney") ||
    target.includes("consult") ||
    target === "02" ||
    target === "2"
  ) {
    return "northline-legal";
  }
  if (
    target.includes("luma") ||
    target.includes("health") ||
    target.includes("clinic") ||
    target.includes("wellness") ||
    target.includes("doctor") ||
    target === "05" ||
    target === "5"
  ) {
    return "luma-health";
  }
  if (
    target.includes("aster") ||
    target.includes("form") ||
    target.includes("interior") ||
    target.includes("architecture") ||
    target.includes("portfolio") ||
    target === "04" ||
    target === "4"
  ) {
    return "aster-form";
  }
  if (
    target.includes("kora") ||
    target.includes("estate") ||
    target.includes("property") ||
    target.includes("real estate") ||
    target === "06" ||
    target === "6"
  ) {
    return "kora-estates";
  }
  if (
    target.includes("fieldnote") ||
    target.includes("saas") ||
    target.includes("software") ||
    target.includes("stackline") ||
    target.includes("landing") ||
    target === "07" ||
    target === "7"
  ) {
    return "fieldnote";
  }
  if (
    target.includes("orbit") ||
    target.includes("learning") ||
    target.includes("education") ||
    target.includes("course") ||
    target.includes("lms") ||
    target === "09" ||
    target === "9"
  ) {
    return "orbit-learning";
  }
  return "mora-coffee";
}

export async function* streamCopilotChat(
  clientMessages: Array<{ role: "user" | "assistant"; content: string }>
): AsyncGenerator<CopilotStreamEvent> {
  const config = getCopilotConfig();
  if (!config.openRouterApiKey) {
    yield { type: "error", message: "OpenRouter API key is not configured in server environment." };
    return;
  }

  const conversation: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...clientMessages.slice(-10),
  ];

  let currentModelIndex = 0;
  const models = config.models;
  let maxToolLoops = 4;
  const emittedActions = new Set<string>();
  let totalAssistantText = "";

  while (maxToolLoops > 0) {
    maxToolLoops--;
    let response: Response | null = null;
    let selectedModel = models[currentModelIndex];

    while (currentModelIndex < models.length) {
      selectedModel = models[currentModelIndex];
      try {
        response = await fetch(`${config.openRouterBaseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.openRouterApiKey}`,
            "HTTP-Referer": "https://macm.lk",
            "X-Title": "MACM Studio Copilot",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: conversation,
            tools: COPILOT_TOOLS,
            tool_choice: "auto",
            stream: true,
            temperature: 0.2,
          }),
          signal: AbortSignal.timeout(35000),
        });

        if (response.ok && response.body) {
          break;
        }

        // If rate limited (429), unavailable (503/502), or bad model, try next model
        currentModelIndex++;
      } catch {
        currentModelIndex++;
      }
    }

    if (!response || !response.ok || !response.body) {
      yield {
        type: "error",
        message: "All free AI model paths are currently busy or unavailable. Please try again shortly.",
      };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulatedContent = "";
    const accumulatedToolCalls: Record<
      number,
      { id: string; name: string; arguments: string }
    > = {};

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.replace(/^data:\s*/, "");
          if (dataStr === "[DONE]") continue;

          try {
            const chunk = JSON.parse(dataStr) as OpenRouterStreamChunk;
            const delta = chunk.choices?.[0]?.delta;
            if (!delta) continue;

            if (delta.content) {
              accumulatedContent += delta.content;
              totalAssistantText += delta.content;
              yield { type: "text", delta: delta.content };
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!accumulatedToolCalls[idx]) {
                  accumulatedToolCalls[idx] = {
                    id: tc.id || `call_${Date.now()}_${idx}`,
                    name: tc.function?.name || "",
                    arguments: "",
                  };
                }
                if (tc.id) accumulatedToolCalls[idx].id = tc.id;
                if (tc.function?.name) accumulatedToolCalls[idx].name += tc.function.name;
                if (tc.function?.arguments) accumulatedToolCalls[idx].arguments += tc.function.arguments;
              }
            }
          } catch {
            // Ignore malformed stream chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    const toolCallList = Object.values(accumulatedToolCalls);
    if (toolCallList.length === 0) {
      break;
    }

    // Add assistant tool calls to message history
    conversation.push({
      role: "assistant",
      content: accumulatedContent,
      tool_calls: toolCallList.map((t) => ({
        id: t.id,
        type: "function",
        function: {
          name: t.name,
          arguments: t.arguments,
        },
      })),
    });

    // Execute tool calls
    for (const toolCall of toolCallList) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(toolCall.arguments || "{}");
      } catch {
        args = {};
      }

      let toolResult = "";

      if (toolCall.name === "search_studio_knowledge") {
        const query = String(args.query || "");
        const category = args.category ? String(args.category) : undefined;
        const matches = await searchKnowledge(query, { category, limit: 3 });
        toolResult = JSON.stringify(
          matches.map((m) => ({
            title: m.title,
            category: m.category,
            content: m.content,
            metadata: m.metadata,
          }))
        );
      } else if (toolCall.name === "configure_estimator") {
        const normalized = normalizeEstimatorArgs(args);
        emittedActions.add("configure_estimator");
        yield { type: "action", action: "configure_estimator", params: normalized };
        toolResult = JSON.stringify({ status: "success", configured: normalized });
      } else if (toolCall.name === "open_sample_preview") {
        const rawId = String(args.sampleId || args.sample || "");
        const cleanId = normalizeSampleId(rawId);
        emittedActions.add("open_sample_preview");
        yield { type: "action", action: "open_sample_preview", params: { sampleId: cleanId } };
        toolResult = JSON.stringify({ status: "success", openedSampleId: cleanId });
      } else if (toolCall.name === "get_booking_schedule") {
        toolResult = JSON.stringify({
          duration: "30 minutes via Google Meet",
          bookingUrl: "/portal/book",
          availability: {
            weekdays: "8:00 PM – 9:30 PM (Asia/Colombo)",
            saturday: "5:00 PM – 9:00 PM (Asia/Colombo)",
            sunday: "8:00 AM – 6:00 PM (Asia/Colombo)",
          },
          notice: "Automated Google Calendar invite and private Meet link generated instantly upon confirmation.",
        });
        emittedActions.add("get_booking_schedule");
        yield { type: "action", action: toolCall.name, params: args };
      } else {
        // UI Action tools: emit to frontend and acknowledge
        emittedActions.add(toolCall.name);
        yield { type: "action", action: toolCall.name, params: args };
        toolResult = JSON.stringify({ status: "success", executedAction: toolCall.name, parameters: args });
      }

      conversation.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: toolCall.name,
        content: toolResult,
      });
    }
  }

  // Fallback Intent Detection:
  // If the model discussed a stack or sample in plain text without explicitly triggering the tool call,
  // we intelligently extract and emit the action so the visitor's Left Workspace preview updates automatically!
  const lastUserText = clientMessages.filter((m) => m.role === "user").pop()?.content || "";
  const combinedContext = `${lastUserText} ${totalAssistantText}`.toLowerCase();

  if (!emittedActions.has("configure_estimator")) {
    let fallbackStack: string | null = null;
    if (combinedContext.includes("headless")) {
      fallbackStack = "headless";
    } else if (
      combinedContext.includes("full-stack") ||
      combinedContext.includes("fullstack") ||
      combinedContext.includes("web app")
    ) {
      fallbackStack = "fullstack";
    } else if (combinedContext.includes("wordpress")) {
      fallbackStack = "wordpress";
    } else if (combinedContext.includes("static")) {
      fallbackStack = "static";
    }

    const fallbackAddons: string[] = [];
    if (
      combinedContext.includes("payment") ||
      combinedContext.includes("checkout") ||
      combinedContext.includes("payhere") ||
      combinedContext.includes("stripe") ||
      combinedContext.includes("grocery") ||
      combinedContext.includes("store") ||
      combinedContext.includes("shop") ||
      combinedContext.includes("e-commerce") ||
      combinedContext.includes("ecommerce")
    ) {
      fallbackAddons.push("payments");
    }
    if (
      combinedContext.includes("auth") ||
      combinedContext.includes("account") ||
      combinedContext.includes("login") ||
      combinedContext.includes("permission")
    ) {
      fallbackAddons.push("auth");
    }
    if (combinedContext.includes("api") || combinedContext.includes("webhook")) {
      fallbackAddons.push("api");
    }

    if (fallbackStack) {
      yield {
        type: "action",
        action: "configure_estimator",
        params: {
          stackId: fallbackStack,
          addonIds: fallbackAddons,
          currency: combinedContext.includes("usd") || combinedContext.includes("$") ? "USD" : "LKR",
        },
      };
    }
  }

  if (!emittedActions.has("open_sample_preview")) {
    if (
      combinedContext.includes("sample") ||
      combinedContext.includes("portfolio") ||
      combinedContext.includes("showcase") ||
      combinedContext.includes("grocery") ||
      combinedContext.includes("restaurant") ||
      combinedContext.includes("hotel") ||
      combinedContext.includes("clinic") ||
      combinedContext.includes("coffee")
    ) {
      const sampleId = normalizeSampleId(combinedContext);
      yield {
        type: "action",
        action: "open_sample_preview",
        params: { sampleId },
      };
    }
  }

  yield { type: "done" };
}
