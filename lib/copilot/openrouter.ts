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

Guidelines:
- Speed & Conciseness: Be crisp, direct, and concise (2-3 sentences typically). Never output internal thinking tokens or wordy preambles. Give immediate, helpful answers.
- Knowledge Retrieval: Use 'search_studio_knowledge' to fetch exact pricing, stack deliverables, SLAs, or FAQs from the studio database whenever asked.
- Interactive Site Guidance: Trigger site actions proactively:
  1. 'configure_estimator': Immediately update the on-screen project calculator when the user mentions stack/addons/currency.
  2. 'open_sample_preview': Open sample preview modal when user asks for work/portfolio/industry samples.
  3. 'scroll_to_section': Scroll to sections (#services, #work, #pricing-calculator, #process, #faq, #contact).
  4. 'prefill_enquiry_form': Prefill contact form when user wants to reach out.
  5. 'get_booking_schedule': Show discovery call schedule.
- Pricing: LKR for Sri Lanka, USD for international clients.
- Milestones: 10% kickoff, 50% working demo, 40% handover.
- Language: English.`;

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
