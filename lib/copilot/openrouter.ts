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
  | { type: "model"; model: string }
  | { type: "action"; action: string; params: Record<string, unknown> }
  | { type: "error"; message: string }
  | { type: "done" };

const SYSTEM_PROMPT = `You are the MACM Studio Helper Copilot, an AI engineering advisor and interactive concierge for macm.lk.
MACM is an engineering-led web design and web development studio based in Sri Lanka, creating thoughtful websites, managed WordPress setups, headless publishing platforms, and custom full-stack web applications for local businesses and remote teams worldwide.

Core Principles:
- Tone: Professional, clear, concise, transparent, engineering-first, and respectful. Avoid marketing fluff or sales exaggeration.
- Knowledge Retrieval: Use 'search_studio_knowledge' whenever answering questions about pricing, stack features, deliverables, process stages, SLAs, or FAQs to provide 100% accurate information from the studio's database.
- Interactive Site Guidance: When the user describes a project requirement, budget question, or wants to explore samples:
  1. Use 'configure_estimator' to automatically set up the on-screen calculator so the visitor can see their real-time cost breakdown.
  2. Use 'open_sample_preview' when the visitor asks to see portfolio work or relevant industry examples (e.g. restaurant, clinic, hotel, legal, SaaS).
  3. Use 'scroll_to_section' to guide them to relevant sections (#services, #work, #pricing-calculator, #process, #faq, #contact).
  4. Use 'prefill_enquiry_form' if they want to submit an enquiry or ask you to save their brief.
  5. Use 'get_booking_schedule' if they want to schedule a 30-minute discovery call.
- Dual Currency: In Sri Lanka, pricing is in LKR. For international clients, pricing is in USD.
- Milestone Payment Structure: 10% kickoff, 50% working demo, 40% handover.
- Language: English.

Always confirm action execution naturally (e.g. "I've configured the estimator above for a Managed WordPress setup with payments...").`;

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
            temperature: 0.3,
          }),
          signal: AbortSignal.timeout(20000),
        });

        if (response.ok && response.body) {
          yield { type: "model", model: selectedModel };
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
      // No further tools to call, finish stream
      yield { type: "done" };
      return;
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
        yield { type: "action", action: toolCall.name, params: args };
      } else {
        // UI Action tools: emit to frontend and acknowledge
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
    // Loop back to let the model incorporate the tool results into a final text response
  }

  yield { type: "done" };
}
