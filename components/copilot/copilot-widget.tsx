"use client";

import { useState, useRef, useEffect, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  Command,
  Layers,
  Clock,
  ShieldCheck,
  Calendar,
  CreditCard,
  Maximize2,
  Minimize2,
  Minus,
  CheckCircle2,
  Loader2,
} from "@/components/macm-icons";
import {
  TECH_STACKS,
  ADDONS,
  formatMoney,
  type ProjectScopePayload,
  type Currency,
  type TechStack,
  type Addon,
  type MaintenanceBilling,
} from "@/lib/pricing";

export interface CopilotActionPayload {
  action: string;
  params: Record<string, unknown>;
}

export interface CopilotWidgetProps {
  onAction?: (action: string, params: Record<string, unknown>) => void;
  pricingScope?: ProjectScopePayload;
  pricingState?: {
    currency: Currency;
    stackId: TechStack["id"];
    addonIds: Addon["id"][];
    fastTrack: boolean;
    extraInboxes: number;
    maintenancePlan: "none" | "care";
    maintenanceBilling: MaintenanceBilling;
    maintenancePriority: boolean;
    setCurrency: (c: Currency) => void;
    setStack: (s: TechStack["id"]) => void;
    toggleAddon: (a: Addon["id"]) => void;
    setMaintenancePlan: (p: "none" | "care") => void;
    setMaintenanceBilling: (b: MaintenanceBilling) => void;
    toggleFastTrack: () => void;
  };
  onApplyScope?: (scope: Record<string, unknown>) => void;
  onScrollTo?: (sec: string) => void;
  sampleProjects?: Array<{
    id: string;
    number: string;
    name: string;
    category: string;
    domain: string;
    description: string;
    highlights: string[];
    status: string;
    previewLabel: string;
    theme: string;
  }>;
  onOpenSample?: (sampleId: string) => void;
}

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  sampleIds?: string[];
}

const STARTER_PROMPTS = [
  { label: "⚡ Managed WordPress + Online Payments", query: "I want to set up an online store with WordPress and payments in LKR" },
  { label: "📐 Compare Stacks & Timelines", query: "What tech stacks do you offer and what are the delivery timeframes?" },
  { label: "🏥 View Healthcare & Clinic Samples", query: "Show me healthcare and clinic website samples from your portfolio" },
  { label: "🗓️ Book a 30-Min Discovery Call", query: "When can we book a 30-minute discovery call?" },
];

function MarkdownView({ content }: { content: string }) {
  const cleaned = content.replace(/Executed:\s*[a-zA-Z0-9_\s]+/gi, "").trim();
  const paragraphs = cleaned.split(/\n\n+/);

  return (
    <div className="copilot-prose">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
        const isBulletList = lines.length > 0 && lines.every((l) => l.startsWith("- ") || l.startsWith("* "));
        const isNumberedList = lines.length > 0 && lines.every((l) => /^\d+\.\s/.test(l));

        if (isBulletList) {
          return (
            <ul key={pIdx} className="copilot-prose-ul">
              {lines.map((line, lIdx) => (
                <li key={lIdx}>{renderInlineMarkdown(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={pIdx} className="copilot-prose-ol">
              {lines.map((line, lIdx) => (
                <li key={lIdx}>{renderInlineMarkdown(line.replace(/^\d+\.\s+/, ""))}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={pIdx} className="copilot-prose-p">
            {lines.map((line, lIdx) => (
              <span key={lIdx}>
                {renderInlineMarkdown(line)}
                {lIdx < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="copilot-strong">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="copilot-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function CopilotWidget({
  onAction,
  pricingScope,
  pricingState,
  onApplyScope,
  onScrollTo,
  sampleProjects,
  onOpenSample,
}: CopilotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "chat">("chat");
  const [mouseActive, setMouseActive] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [justConfigured, setJustConfigured] = useState(false);
  const configureTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerConfiguredEffect = () => {
    setJustConfigured(true);
    if (configureTimerRef.current) clearTimeout(configureTimerRef.current);
    configureTimerRef.current = setTimeout(() => {
      setJustConfigured(false);
    }, 2500);
  };

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to MACM Studio. I am your engineering advisor. Tell me what you want to build, and I will recommend the right technology stack, generate an instant price breakdown, and configure the project estimator for you.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMouseMove = () => {
      setMouseActive(true);
      if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
      mouseTimeoutRef.current = setTimeout(() => {
        setMouseActive(true);
      }, 4000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
    };
  }, []);

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
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen, messages]);

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Welcome to MACM Studio. I am your engineering advisor. Tell me what you want to build, and I will recommend the right technology stack, generate an instant price breakdown, and configure the project estimator for you.",
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
    setLoadingStatus("Analyzing project requirements...");

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
              setMessages((prev) => {
                const exists = prev.some((m) => m.id === assistantMessageId);
                if (exists) {
                  return prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: m.content + event.delta }
                      : m
                  );
                }
                return [
                  ...prev,
                  { id: assistantMessageId, role: "assistant", content: event.delta },
                ];
              });
            } else if (event.type === "status") {
              setLoadingStatus(event.message);
            } else if (event.type === "action") {
              if (event.action !== "open_sample_preview") onAction?.(event.action, event.params);

              if (event.action === "configure_estimator") {
                triggerConfiguredEffect();
              }

              if (event.action === "open_sample_preview") {
                const sid = String(event.params.sampleId || event.params.sample || "").toLowerCase().trim();
                let matched = sampleProjects?.find(
                  (p) =>
                    p.id.toLowerCase() === sid ||
                    p.number === sid ||
                    p.name.toLowerCase().includes(sid) ||
                    p.category.toLowerCase().includes(sid)
                );
                if (!matched) {
                  if (
                    sid.includes("mora") ||
                    sid.includes("coffee") ||
                    sid.includes("store") ||
                    sid.includes("grocery") ||
                    sid.includes("shop") ||
                    sid.includes("ecommerce") ||
                    sid.includes("e-commerce")
                  ) {
                    matched = sampleProjects?.find((p) => p.id === "mora-coffee");
                  } else if (sid.includes("saas") || sid.includes("software") || sid.includes("stackline") || sid.includes("landing")) {
                    matched = sampleProjects?.find((p) => p.id === "fieldnote");
                  } else if (sid.includes("restaurant") || sid.includes("hearth") || sid.includes("food")) {
                    matched = sampleProjects?.find((p) => p.id === "harbor-hearth");
                  } else if (sid.includes("hotel") || sid.includes("ceylon") || sid.includes("villa")) {
                    matched = sampleProjects?.find((p) => p.id === "ceylon-house");
                  } else if (sid.includes("legal") || sid.includes("law")) {
                    matched = sampleProjects?.find((p) => p.id === "northline-legal");
                  } else if (sid.includes("health") || sid.includes("clinic")) {
                    matched = sampleProjects?.find((p) => p.id === "luma-health");
                  } else if (sid.includes("interior") || sid.includes("design")) {
                    matched = sampleProjects?.find((p) => p.id === "aster-form");
                  } else if (sid.includes("estate") || sid.includes("property")) {
                    matched = sampleProjects?.find((p) => p.id === "kora-estates");
                  } else if (sid.includes("learn") || sid.includes("course")) {
                    matched = sampleProjects?.find((p) => p.id === "orbit-learning");
                  }
                }
                if (matched) {
                  const matchedId = matched.id;
                  setMessages((prev) => {
                    const exists = prev.some((m) => m.id === assistantMessageId);
                    if (exists) {
                      return prev.map((m) => m.id === assistantMessageId
                        ? { ...m, sampleIds: Array.from(new Set([...(m.sampleIds ?? []), matchedId])) }
                        : m);
                    }
                    return [...prev, { id: assistantMessageId, role: "assistant", content: "", sampleIds: [matchedId] }];
                  });
                }
              }
            } else if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: m.content + `\n\n*Notice: ${event.message}*` }
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
                  "I experienced a temporary connection hiccup. Please ask again or review our calculator options directly.",
              }
            : m
        )
      );
    } finally {
      setLoading(false);
      setLoadingStatus(null);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const currentStackId = pricingState?.stackId ?? pricingScope?.stack.id ?? "static";
  const currentStack =
    TECH_STACKS.find((s) => s.id === currentStackId) ??
    pricingScope?.stack ??
    TECH_STACKS[0];

  const currentCurrency: Currency = pricingScope?.currency ?? pricingState?.currency ?? "LKR";
  const currentTotal = pricingScope?.total ?? currentStack.price[currentCurrency];
  const currentMilestones = pricingScope?.milestones ?? {
    kickoff: Math.round(currentTotal * 0.1),
    demo: Math.round(currentTotal * 0.5),
    handover: currentTotal - Math.round(currentTotal * 0.1) - Math.round(currentTotal * 0.5),
  };

  return (
    <>
      {/* Bottom-Center Floating AI Capsule Trigger */}
      {!isOpen && (
        <div className={`copilot-floating-dock ${mouseActive ? "is-active" : ""}`}>
          <div className="copilot-dock-capsule">
            <button
              type="button"
              className="copilot-dock-btn"
              aria-label="Open MACM Studio AI Assistant"
              onClick={() => setIsOpen(true)}
            >
              <div className="copilot-ai-icon-wrapper">
                <Image
                  src="/ai-icon.jpg"
                  alt="AI Assistant"
                  width={34}
                  height={34}
                  className="copilot-ai-img"
                  priority
                />
                <span className="copilot-ai-dot" />
              </div>

              <div className="copilot-hover-tooltip" role="tooltip">
                <span className="copilot-tooltip-text">AI</span>
                <span className="copilot-tooltip-sub">Click to open · ⌘K</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* macOS-Style Window Overlay */}
      {isOpen && (
        <div className="copilot-overlay" onClick={() => setIsOpen(false)}>
          <div
            className={`copilot-mac-window ${isMaximized ? "is-maximized" : ""}`}
            role="dialog"
            aria-label="MACM Studio Copilot Window"
            onClick={(e) => e.stopPropagation()}
          >
            {/* macOS Window Titlebar */}
            <header className="copilot-window-bar">
              <div className="copilot-traffic-lights">
                <button
                  type="button"
                  className="copilot-traffic-btn copilot-close-btn"
                  title="Close (Esc)"
                  onClick={() => setIsOpen(false)}
                >
                  <X size={8} className="copilot-light-icon" />
                </button>
                <button
                  type="button"
                  className="copilot-traffic-btn copilot-minimize-btn"
                  title="Minimize"
                  onClick={() => setIsOpen(false)}
                >
                  <Minus size={8} className="copilot-light-icon" />
                </button>
                <button
                  type="button"
                  className="copilot-traffic-btn copilot-zoom-btn"
                  title={isMaximized ? "Restore Window" : "Maximize Window"}
                  onClick={() => setIsMaximized(!isMaximized)}
                >
                  {isMaximized ? (
                    <Minimize2 size={8} className="copilot-light-icon" />
                  ) : (
                    <Maximize2 size={8} className="copilot-light-icon" />
                  )}
                </button>
              </div>

              <div className="copilot-window-title">
                <span className="copilot-window-title-main">MACM Studio Copilot</span>
                <span className="copilot-window-badge">Interactive Workspace</span>
              </div>

              <div className="copilot-window-controls">
                <button
                  type="button"
                  className="copilot-top-action"
                  title="Reset conversation"
                  onClick={handleReset}
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
                <div className="copilot-shortcut-hint">
                  <Command size={10} />
                  <span>K</span>
                </div>
              </div>
            </header>

            {/* Mobile Tab Toggle */}
            <div className="copilot-mobile-tabs">
              <button
                type="button"
                className={`copilot-tab-btn ${activeTab === "preview" ? "is-active" : ""}`}
                onClick={() => setActiveTab("preview")}
              >
                <Layers size={14} />
                <span>Estimate & Preview</span>
              </button>
              <button
                type="button"
                className={`copilot-tab-btn ${activeTab === "chat" ? "is-active" : ""}`}
                onClick={() => setActiveTab("chat")}
              >
                <Sparkles size={14} />
                <span>AI Chat ({messages.length})</span>
              </button>
            </div>

            {/* macOS Window 2-Column Split Workspace */}
            <div className="copilot-window-workspace">
              {/* LEFT COLUMN: Live Preview & Suggestion Stage */}
              <section className={`copilot-col-preview ${activeTab === "preview" ? "mobile-show" : ""}`}>
                <div className="copilot-preview-header">
                  <div className="copilot-preview-tag">
                    <Sparkles size={13} />
                    <span>Live Studio Proposal & Scope</span>
                    {justConfigured && (
                      <span className="copilot-updated-pill">✨ Auto-Configured</span>
                    )}
                  </div>
                  <div className="copilot-currency-pills">
                    <button
                      type="button"
                      className={`copilot-currency-pill ${currentCurrency === "LKR" ? "is-active" : ""}`}
                      onClick={() => pricingState?.setCurrency("LKR")}
                    >
                      LKR
                    </button>
                    <button
                      type="button"
                      className={`copilot-currency-pill ${currentCurrency === "USD" ? "is-active" : ""}`}
                      onClick={() => pricingState?.setCurrency("USD")}
                    >
                      USD
                    </button>
                  </div>
                </div>

                <div className="copilot-preview-content">
                  {/* Scope Price Card */}
                  <div className={`copilot-scope-card ${justConfigured ? "is-updated-pulse" : ""}`}>
                    <div className="copilot-scope-header">
                      <div>
                        <span className="copilot-scope-label">Selected Foundation</span>
                        <h3 className="copilot-scope-title">{currentStack.name}</h3>
                      </div>
                      <div className="copilot-scope-price-box">
                        <span className="copilot-scope-price-label">Estimated Total</span>
                        <strong className="copilot-scope-price">
                          {formatMoney(currentTotal, currentCurrency)}
                        </strong>
                      </div>
                    </div>

                    <p className="copilot-scope-desc">{currentStack.description}</p>

                    <div className="copilot-scope-meta">
                      <div className="copilot-meta-item">
                        <Clock size={13} />
                        <span>Timeline: <strong>{currentStack.delivery}</strong></span>
                      </div>
                      <div className="copilot-meta-item">
                        <ShieldCheck size={13} />
                        <span>Handover: <strong>Full Ownership</strong></span>
                      </div>
                    </div>

                    {/* Milestone Payment Breakdown */}
                    <div className="copilot-milestone-panel">
                      <span className="copilot-panel-heading">3-Stage Milestone Payments</span>
                      <div className="copilot-milestone-grid">
                        <div className="copilot-milestone-col">
                          <span className="copilot-ms-step">10% Kickoff</span>
                          <strong className="copilot-ms-val">
                            {formatMoney(currentMilestones.kickoff, currentCurrency)}
                          </strong>
                        </div>
                        <div className="copilot-milestone-col">
                          <span className="copilot-ms-step">50% Demo</span>
                          <strong className="copilot-ms-val">
                            {formatMoney(currentMilestones.demo, currentCurrency)}
                          </strong>
                        </div>
                        <div className="copilot-milestone-col">
                          <span className="copilot-ms-step">40% Handover</span>
                          <strong className="copilot-ms-val">
                            {formatMoney(currentMilestones.handover, currentCurrency)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Selected Add-ons */}
                    <div className="copilot-addons-section">
                      <span className="copilot-panel-heading">Configured Add-ons</span>
                      <div className="copilot-addons-chips">
                        {ADDONS.map((addon) => {
                          const isSelected = pricingState?.addonIds.includes(addon.id) ?? false;
                          return (
                            <button
                              key={addon.id}
                              type="button"
                              className={`copilot-addon-chip ${isSelected ? "is-selected" : ""}`}
                              onClick={() => pricingState?.toggleAddon(addon.id)}
                            >
                              <CheckCircle2 size={12} className="copilot-chip-check" />
                              <span>{addon.name}</span>
                              <small>+{formatMoney(addon.price[currentCurrency], currentCurrency)}</small>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Foundation Switcher */}
                    <div className="copilot-stack-switcher">
                      <span className="copilot-panel-heading">Switch Foundation</span>
                      <div className="copilot-stack-grid">
                        {TECH_STACKS.map((stack) => (
                          <button
                            key={stack.id}
                            type="button"
                            className={`copilot-stack-btn ${currentStack.id === stack.id ? "is-active" : ""}`}
                            onClick={() => pricingState?.setStack(stack.id)}
                          >
                            <strong>{stack.shortName}</strong>
                            <small>{formatMoney(stack.price[currentCurrency], currentCurrency)}</small>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action Bridge Buttons */}
                    <div className="copilot-scope-actions">
                      <button
                        type="button"
                        className="copilot-btn-primary"
                        onClick={() => {
                          setIsOpen(false);
                          onScrollTo?.("#pricing-calculator");
                        }}
                      >
                        <span>Apply & View on Site Calculator</span>
                        <ArrowRight size={14} />
                      </button>
                      <button
                        type="button"
                        className="copilot-btn-secondary"
                        onClick={() => {
                          setIsOpen(false);
                          onScrollTo?.("#contact");
                        }}
                      >
                        <CreditCard size={13} />
                        <span>Prefill Contact Form</span>
                      </button>
                      <a
                        href="/portal/book"
                        className="copilot-btn-ghost"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Calendar size={13} />
                        <span>Schedule 30-Min Discovery Call</span>
                      </a>
                    </div>
                  </div>
                </div>
              </section>

              {/* RIGHT COLUMN: Conversational Stream */}
              <section className={`copilot-col-chat ${activeTab === "chat" ? "mobile-show" : ""}`}>
                <div className="copilot-chat-feed">
                  {messages
                    .filter((m) => m.content.trim().length > 0 || (m.sampleIds?.length ?? 0) > 0)
                    .map((m) => (
                      <div key={m.id} className={`copilot-chat-row copilot-row-${m.role}`}>
                        {m.role === "assistant" && (
                          <div className="copilot-chat-avatar">
                            <Image
                              src="/ai-icon.jpg"
                              alt="AI"
                              width={24}
                              height={24}
                              className="copilot-avatar-img"
                            />
                          </div>
                        )}
                        <div className="copilot-chat-bubble">
                          {m.content.trim() && <MarkdownView content={m.content} />}
                          {m.sampleIds?.length ? (
                            <div className="copilot-sample-suggestions" aria-label="Suggested sample previews">
                              {m.sampleIds.map((sampleId) => {
                                const sample = sampleProjects?.find((project) => project.id === sampleId);
                                if (!sample) return null;
                                return (
                                  <button
                                    key={sample.id}
                                    type="button"
                                    className={`copilot-sample-suggestion sample-theme-${sample.theme}`}
                                    onClick={() => {
                                      onOpenSample?.(sample.id);
                                      setIsOpen(false);
                                    }}
                                  >
                                    <span className="copilot-suggestion-copy">
                                      <span className="copilot-suggestion-category">{sample.category}</span>
                                      <strong>{sample.name}</strong>
                                      <span className="copilot-suggestion-label">{sample.previewLabel}</span>
                                    </span>
                                    <span className="copilot-suggestion-action">View sample <ExternalLink size={13} /></span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}

                  {loading && (
                    <div className="copilot-chat-row copilot-row-assistant">
                      <div className="copilot-chat-avatar">
                        <Image
                          src="/ai-icon.jpg"
                          alt="AI"
                          width={24}
                          height={24}
                          className="copilot-avatar-img"
                        />
                      </div>
                      <div className="copilot-loading-chip">
                        <Loader2 size={13} className="copilot-loading-spinner" />
                        <span className="copilot-loading-label">
                          {loadingStatus || "Engineering advisor is thinking..."}
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {messages.length <= 2 && !loading && (
                  <div className="copilot-starters-tray">
                    <span className="copilot-starters-tray-label">Quick Prompts</span>
                    <div className="copilot-starters-tray-list">
                      {STARTER_PROMPTS.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="copilot-starters-chip"
                          onClick={() => handleSend(item.query)}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <footer className="copilot-chat-footer">
                  <form className="copilot-chat-input-bar" onSubmit={onSubmit}>
                    <input
                      ref={inputRef}
                      className="copilot-main-input"
                      value={input}
                      placeholder="Ask about pricing, tech, samples, or requirements..."
                      onChange={(e) => setInput(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      className="copilot-main-send"
                      disabled={!input.trim() || loading}
                      aria-label="Send message"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                  <div className="copilot-input-hint">
                    <span>Press <strong>Enter ↵</strong> to send · Type requirements naturally</span>
                  </div>
                </footer>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
