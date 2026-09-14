"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { MessageSquare, X, Send, Sparkles, Bot, ChevronDown, Check, ArrowUpRight } from "lucide-react";

export interface CopilotActionPayload {
  action: string;
  params: Record<string, unknown>;
}

export interface CopilotWidgetProps {
  onAction?: (action: string, params: Record<string, unknown>) => void;
}

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  actions?: CopilotActionPayload[];
}

const STARTER_PROMPTS = [
  "What is the cost of a full-stack app with payments?",
  "Show me healthcare & clinic website samples",
  "How does the 3-stage milestone payment work?",
  "Configure estimator for managed WordPress in USD",
];

export function CopilotWidget({ onAction }: CopilotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your MACM Studio Copilot. I can answer questions about our engineering process, search our pricing models, explore portfolio samples, or configure the project estimator for you in real time.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSend = async (userText: string) => {
    const text = userText.trim();
    if (!text || loading) return;

    const userMessage: MessageItem = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };

    const assistantMessageId = `a-${Date.now()}`;
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Placeholder assistant message
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: "assistant", content: "", actions: [] },
    ]);

    try {
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to reach assistant`);
      }

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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

          try {
            const event = JSON.parse(dataStr);
            if (event.type === "text") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: m.content + event.delta }
                    : m
                )
              );
            } else if (event.type === "model") {
              setActiveModel(event.model);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId ? { ...m, model: event.model } : m
                )
              );
            } else if (event.type === "action") {
              // Trigger client action bridge
              onAction?.(event.action, event.params);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        actions: [
                          ...(m.actions || []),
                          { action: event.action, params: event.params },
                        ],
                      }
                    : m
                )
              );
            } else if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content:
                          m.content + `\n\n*(Notice: ${event.message})*`,
                      }
                    : m
                )
              );
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content:
                  "I encountered a connection error. Please verify the OpenRouter API configuration and try again.",
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="copilot-root">
      {!isOpen && (
        <button
          type="button"
          className="copilot-launcher"
          aria-label="Open Studio Copilot assistant"
          onClick={() => setIsOpen(true)}
        >
          <span className="copilot-launcher-glow" />
          <Bot size={18} className="copilot-launcher-icon" />
          <span className="copilot-launcher-label">Copilot</span>
          <span className="copilot-launcher-pill">Free AI</span>
        </button>
      )}

      {isOpen && (
        <aside className="copilot-window" aria-label="MACM Studio Helper Copilot">
          <header className="copilot-header">
            <div className="copilot-identity">
              <div className="copilot-avatar">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="copilot-name">
                  <strong>Studio Copilot</strong>
                  <span className="copilot-status-dot" />
                </div>
                <small className="copilot-subtitle">
                  {activeModel
                    ? activeModel.split("/").pop()?.replace(":free", " (free)")
                    : "Free OpenRouter fallback router"}
                </small>
              </div>
            </div>
            <button
              type="button"
              className="copilot-close-btn"
              aria-label="Minimize Copilot window"
              onClick={() => setIsOpen(false)}
            >
              <ChevronDown size={18} />
            </button>
          </header>

          <div className="copilot-messages">
            {messages.map((m) => (
              <div key={m.id} className={`copilot-bubble copilot-bubble-${m.role}`}>
                <div className="copilot-bubble-content">
                  {m.content}
                  {m.actions && m.actions.length > 0 && (
                    <div className="copilot-action-badges">
                      {m.actions.map((act, idx) => (
                        <span key={idx} className="copilot-action-badge">
                          <Check size={12} /> Action: {act.action.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {m.model && (
                  <div className="copilot-model-tag">
                    {m.model.split("/").pop()}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="copilot-bubble copilot-bubble-assistant copilot-typing">
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && !loading && (
            <div className="copilot-starters">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="copilot-starter-pill"
                  onClick={() => handleSend(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form className="copilot-form" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              className="copilot-input"
              value={input}
              placeholder="Ask about pricing, tech, samples, or scope..."
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="copilot-send-btn"
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </aside>
      )}
    </div>
  );
}
