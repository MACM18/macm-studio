"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { Sparkles, X, Send, RotateCcw, Check, ArrowRight, ExternalLink, Command } from "lucide-react";

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
  actions?: CopilotActionPayload[];
}

const STARTER_PROMPTS = [
  { label: "⚡ Configure Estimator with Payments", query: "Configure the estimator for a Managed WordPress setup with payments in USD" },
  { label: "📐 Compare Stacks & Timelines", query: "What tech stacks do you offer and what are the delivery timeframes?" },
  { label: "🏥 View Clinical & Healthcare Work", query: "Show me healthcare and clinic website samples from your portfolio" },
  { label: "🗓️ Book Discovery Call", query: "When can we book a 30-minute discovery call?" },
];

export function CopilotWidget({ onAction }: CopilotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to MACM Studio. I can answer questions about our engineering standards, search live pricing, show portfolio samples, or configure the project estimator for you.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcut: ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Welcome to MACM Studio. I can answer questions about our engineering standards, search live pricing, show portfolio samples, or configure the project estimator for you.",
      },
    ]);
  };

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
        throw new Error(`HTTP ${response.status}`);
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
            } else if (event.type === "action") {
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
                          m.content + `\n\n*Notice: ${event.message}*`,
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
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content:
                  "Service is momentarily busy. Please ask again or reach us directly via the contact section.",
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
    <>
      {/* Floating Studio Capsule Dock */}
      <div className="copilot-dock">
        <button
          type="button"
          className="copilot-dock-trigger"
          aria-label="Open Studio Assistant"
          onClick={() => setIsOpen(true)}
        >
          <span className="copilot-dock-pulse" />
          <Sparkles size={14} className="copilot-dock-icon" />
          <span className="copilot-dock-title">Studio Assistant</span>
          <span className="copilot-dock-badge">
            <Command size={10} /> K
          </span>
        </button>
      </div>

      {/* Slide-over Studio Palette Drawer */}
      {isOpen && (
        <div className="copilot-drawer-overlay" onClick={() => setIsOpen(false)}>
          <aside
            className="copilot-drawer"
            role="dialog"
            aria-label="MACM Studio Assistant"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <header className="copilot-drawer-header">
              <div className="copilot-drawer-branding">
                <div className="copilot-drawer-avatar">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="copilot-drawer-title">
                    <span>MACM Studio Assistant</span>
                    <span className="copilot-drawer-status">Active</span>
                  </div>
                  <p className="copilot-drawer-desc">Engineering guidance, RAG search & interactive site control</p>
                </div>
              </div>
              <div className="copilot-drawer-actions">
                <button
                  type="button"
                  className="copilot-icon-btn"
                  title="Reset conversation"
                  onClick={handleReset}
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  type="button"
                  className="copilot-icon-btn"
                  title="Close (Esc)"
                  onClick={() => setIsOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            {/* Messages Body */}
            <div className="copilot-drawer-body">
              {messages.map((m) => (
                <div key={m.id} className={`copilot-msg copilot-msg-${m.role}`}>
                  <div className="copilot-msg-bubble">
                    <div className="copilot-msg-text">{m.content}</div>
                    {m.actions && m.actions.length > 0 && (
                      <div className="copilot-action-cards">
                        {m.actions.map((act, idx) => (
                          <div key={idx} className="copilot-action-card">
                            <Check size={12} className="copilot-action-check" />
                            <span>Executed: <strong>{act.action.replace(/_/g, " ")}</strong></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="copilot-msg copilot-msg-assistant">
                  <div className="copilot-msg-bubble copilot-msg-loading">
                    <span className="copilot-dot" />
                    <span className="copilot-dot" />
                    <span className="copilot-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Starter Chips */}
            {messages.length <= 2 && !loading && (
              <div className="copilot-drawer-starters">
                <span className="copilot-starters-label">Suggestions</span>
                <div className="copilot-starters-grid">
                  {STARTER_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="copilot-starter-card"
                      onClick={() => handleSend(item.query)}
                    >
                      <span>{item.label}</span>
                      <ArrowRight size={12} className="copilot-starter-arrow" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <form className="copilot-drawer-form" onSubmit={onSubmit}>
              <div className="copilot-input-container">
                <input
                  ref={inputRef}
                  className="copilot-drawer-input"
                  value={input}
                  placeholder="Ask a question or configure a project..."
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="copilot-drawer-send"
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
