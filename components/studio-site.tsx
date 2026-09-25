"use client";

import {
  ArrowDown,
  ArrowRight,
  Check,
  ExternalLink,
  Menu,
  Minus,
  Moon,
  Plus,
  Send,
  Sun,
  X,
} from "@/components/macm-icons";
import { FormEvent, useEffect, useRef, useState } from "react";
import { usePricingCalculator } from "@/hooks/usePricingCalculator";
import { ADDONS, Addon, Currency, INBOX_PRICE, MAINTENANCE_CARE, MAINTENANCE_PRIORITY, TECH_STACKS, formatMoney } from "@/lib/pricing";
import { FAQ_ITEMS } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics";
import { useLanguage } from "@/components/language-provider";
import { CopilotWidget } from "@/components/copilot/copilot-widget";
import { type TranslationKey } from "@/lib/i18n";

const formatMaintenanceMoney = (amount: number, currency: Currency) => formatMoney(amount, currency, currency === "USD" ? 2 : 0);

const NAV_ITEMS: Array<[TranslationKey, string]> = [
  ["nav.services", "#services"],
  ["nav.work", "#work"],
  ["nav.pricing", "#pricing-calculator"],
  ["nav.process", "#process"],
  ["nav.faq", "#faq"],
  ["nav.contact", "#contact"],
];

const SERVICES = [
  {
    index: "01",
    title: "Custom website design",
    copy: "A clear, professional website that explains what you do, builds trust, and helps the right visitors get in touch.",
    tech: "Mobile-ready · Search-friendly · Clear content",
  },
  {
    index: "02",
    title: "Managed WordPress websites",
    copy: "A website your team can update without waiting on a developer, with ongoing care to keep it secure and up to date.",
    tech: "Easy editing · Secure · Ongoing care",
  },
  {
    index: "03",
    title: "Content-managed websites",
    copy: "A flexible content setup for growing teams that want to publish often, keep control, and add new sections over time.",
    tech: "Flexible content · Easy publishing · Ready to grow",
  },
  {
    index: "04",
    title: "Web apps & SaaS development",
    copy: "A custom online tool for the way your business works, with customer accounts, admin areas, payments, and useful automations.",
    tech: "Customer accounts · Admin tools · Integrations",
  },
];

type SampleStatus = "live" | "coming-soon";
import { SAMPLE_PROJECTS, type SampleProject, type SamplePreviewState } from "@/lib/samples";

type SampleMetadata = { description?: string };

const FALLBACK_SAMPLE_STATUSES: Record<string, SamplePreviewState> = Object.fromEntries(
  SAMPLE_PROJECTS.map((project) => [project.domain, project.status === "live" ? "blocked" : "unavailable"]),
);

const PROCESS = [
  {
    no: "01",
    title: "Scope & architecture",
    tag: "10%",
    copy: "We lock the specification, system shape, key screens, and delivery plan before development begins.",
  },
  {
    no: "02",
    title: "Core engineering",
    tag: "BUILD",
    copy: "Your product takes shape in focused milestones, with weekly staging previews and clear progress notes.",
  },
  {
    no: "03",
    title: "Demo review",
    tag: "50%",
    copy: "A functional build goes live on staging for your review, testing, and consolidated feedback.",
  },
  {
    no: "04",
    title: "Production handover",
    tag: "40%",
    copy: "We launch with SSL, domain and mail routing, then transfer the code, assets, and operating notes.",
  },
];

function scrollTo(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function CurrencyToggle({ currency, setCurrency }: { currency: Currency; setCurrency: (value: Currency) => void }) {
  return (
    <div className="currency-toggle" aria-label="Estimate currency">
      {(["LKR", "USD"] as Currency[]).map((item) => (
        <button
          key={item}
          type="button"
          className={currency === item ? "active" : ""}
          aria-pressed={currency === item}
          onClick={() => setCurrency(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function SamplePreview({ project, state, checkingLabel, comingLabel, comingCopy, blockedCopy }: { project: SampleProject; state: SamplePreviewState; checkingLabel: string; comingLabel: string; comingCopy: string; blockedCopy: string }) {
  if (state === "checking") {
    return <div className="sample-preview-checking"><span className="sample-preview-pulse" /><p>{checkingLabel} {project.domain}…</p></div>;
  }

  if (state === "available") {
    return <iframe src={`https://${project.domain}`} title={`${project.name} live website preview`} loading="lazy" />;
  }

  if (state === "blocked") {
    return (
      <div className="sample-preview-blocked">
        <span className="kicker">{project.category}</span>
        <strong>{project.name}</strong>
        <p>{blockedCopy}</p>
      </div>
    );
  }

  return (
              <div className="sample-coming-preview">
      <span className="kicker">{comingLabel}</span>
      <strong>{project.name}</strong>
      <p>{comingCopy}</p>
    </div>
  );
}

export function StudioSite() {
  const { t } = useLanguage();
  const localizedFaqItems = FAQ_ITEMS.map((item, index) => ({
    ...item,
    question: t(`faq.${index + 1}.question` as TranslationKey),
    answer: t(`faq.${index + 1}.answer` as TranslationKey),
  }));
  const pricing = usePricingCalculator();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [selectedSample, setSelectedSample] = useState<SampleProject | null>(null);
  const [sampleStatuses, setSampleStatuses] = useState<Record<string, SamplePreviewState>>(FALLBACK_SAMPLE_STATUSES);
  const [sampleMetadata, setSampleMetadata] = useState<Record<string, SampleMetadata>>({});
  const [scopeLocked, setScopeLocked] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const leadStartedRef = useRef(false);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    projectType: "",
    notes: "",
  });

  const handleCopilotAction = (action: string, params: Record<string, unknown>) => {
    if (action === "configure_estimator") {
      const updates: Record<string, unknown> = {};
      const rawCurr = String(params.currency || "").toUpperCase();
      if (rawCurr === "LKR" || rawCurr === "USD") {
        updates.currency = rawCurr as Currency;
      }

      const rawStack = String(params.stackId || params.stack || "").toLowerCase();
      if (rawStack.includes("head")) updates.stackId = "headless";
      else if (rawStack.includes("word")) updates.stackId = "wordpress";
      else if (rawStack.includes("full") || rawStack.includes("app")) updates.stackId = "fullstack";
      else if (rawStack.includes("stat")) updates.stackId = "static";

      const rawAddons = Array.isArray(params.addonIds)
        ? params.addonIds
        : Array.isArray(params.addons)
        ? params.addons
        : [];
      if (rawAddons.length > 0) {
        const clean: Addon["id"][] = [];
        for (const a of rawAddons) {
          const str = String(a).toLowerCase();
          if (str.includes("pay")) clean.push("payments");
          else if (str.includes("auth") || str.includes("user") || str.includes("account")) clean.push("auth");
          else if (str.includes("api") || str.includes("webhook")) clean.push("api");
          else if (str.includes("backup")) clean.push("dedicated-backup");
        }
        updates.addonIds = Array.from(new Set(clean));
      }

      if (typeof params.fastTrack === "boolean") {
        updates.fastTrack = params.fastTrack;
      }
      if (typeof params.extraInboxes === "number") {
        updates.extraInboxes = params.extraInboxes;
      }
      if (params.maintenancePlan === "none" || params.maintenancePlan === "care") {
        updates.maintenancePlan = params.maintenancePlan;
      }
      if (params.maintenanceBilling === "monthly" || params.maintenanceBilling === "yearly") {
        updates.maintenanceBilling = params.maintenanceBilling;
      }
      if (typeof params.maintenancePriority === "boolean") {
        updates.maintenancePriority = params.maintenancePriority;
      }
      pricing.configureScope(updates);
    } else if (action === "scroll_to_section") {
      if (typeof params.section === "string") {
        scrollTo(params.section);
      }
    } else if (action === "prefill_enquiry_form") {
      setContactForm((prev) => ({
        name: typeof params.name === "string" ? params.name : prev.name,
        email: typeof params.email === "string" ? params.email : prev.email,
        phone: typeof params.phone === "string" ? params.phone : prev.phone,
        projectType: typeof params.projectType === "string" ? params.projectType : prev.projectType,
        notes: typeof params.notes === "string" ? params.notes : prev.notes,
      }));
      scrollTo("#contact");
    } else if (action === "get_booking_schedule") {
      window.location.assign("/portal/book");
    }
  };

  useEffect(() => {
    const stored = window.localStorage.getItem("macm-theme");
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const nextTheme = stored === "light" || stored === "dark"
      ? stored
      : mediaQuery.matches
        ? "light"
        : "dark";

    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;

    const handleDeviceThemeChange = (event: MediaQueryListEvent) => {
      if (!window.localStorage.getItem("macm-theme")) {
        const deviceTheme = event.matches ? "light" : "dark";
        setTheme(deviceTheme);
        document.documentElement.dataset.theme = deviceTheme;
      }
    };

    mediaQuery.addEventListener("change", handleDeviceThemeChange);
    return () => mediaQuery.removeEventListener("change", handleDeviceThemeChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!selectedSample) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedSample(null);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedSample]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/sample-status", { cache: "no-store", signal: controller.signal })
      .then((response) => response.json() as Promise<{ samples?: Record<string, { available?: boolean; embeddable?: boolean; description?: string }> }>)
      .then((result) => {
        if (!result.samples) return;
        const nextStatuses: Record<string, SamplePreviewState> = {};
        const nextMetadata: Record<string, SampleMetadata> = {};
        SAMPLE_PROJECTS.forEach((project) => {
          const liveData = result.samples?.[project.domain];
          nextStatuses[project.domain] = liveData?.available
            ? liveData.embeddable === false ? "blocked" : "available"
            : "unavailable";
          if (liveData?.available && liveData.description) {
            nextMetadata[project.domain] = { description: liveData.description };
          }
        });
        setSampleStatuses(nextStatuses);
        setSampleMetadata(nextMetadata);
      })
      .catch(() => {
        // Keep the catalog fallback if the status endpoint is unavailable.
      });

    return () => controller.abort();
  }, []);

  const selectedSampleStatus = selectedSample
    ? sampleStatuses[selectedSample.domain] ?? "checking"
    : "checking";
  const selectedSampleLiveData = selectedSample ? sampleMetadata[selectedSample.domain] : undefined;

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("macm-theme", nextTheme);
    trackEvent("theme_changed", { theme: nextTheme });
  };

  const handlePlanWebsiteClick = (location: string) => {
    trackEvent("plan_website_click", { location });
    setMenuOpen(false);
    scrollTo("#pricing-calculator");
  };

  const lockScope = () => {
    setScopeLocked(true);
    setStatus("idle");
    trackEvent("scope_locked", {
      project_type: pricing.scope.stack.id,
      currency: pricing.currency,
      maintenance_plan: pricing.scope.maintenance.plan,
      maintenance_priority: pricing.scope.maintenance.priority,
    });
    window.setTimeout(() => scrollTo("#contact"), 80);
  };

  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setStatusMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      website: form.get("website"),
      projectType: form.get("projectType"),
      budgetSummary: form.get("budgetSummary"),
      notes: form.get("notes"),
      scope: pricing.scope,
    };

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null;
      if (!response.ok || result?.ok !== true) {
        setStatus("error");
        setStatusMessage(result?.message || t("contact.unconfirmed"));
        trackEvent("lead_submit_error");
        return;
      }
      setStatus("sent");
      setStatusMessage(result.message || t("contact.sent"));
      trackEvent("lead_submitted", {
        project_type: String(form.get("projectType") || "unspecified"),
        currency: pricing.currency,
        maintenance_plan: pricing.scope.maintenance.plan,
      });
      formElement.reset();
      if (summaryRef.current) summaryRef.current.value = pricing.scope.summary;
    } catch {
      setStatus("error");
      setStatusMessage(t("contact.unconfirmed"));
      trackEvent("lead_submit_error");
    } finally {
      window.clearTimeout(timeout);
    }
  };

  return (
    <div className="site-shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="nav-wrap">
        <nav className="nav container" aria-label={t("nav.primary")}>
          <a className="brand" href="#main" aria-label="MACM home">
            <span>MACM</span><i />
          </a>
          <div className="availability"><span /> {t("nav.available")}</div>
          <div id="mobile-nav" className={`nav-links ${menuOpen ? "open" : ""}`} aria-label={t("nav.primary")}>
            {NAV_ITEMS.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>{t(label)}</a>
            ))}
            <div className="mobile-nav-controls">
              <CurrencyToggle currency={pricing.currency} setCurrency={pricing.setCurrency} />
              <button className="icon-button" type="button" aria-label={theme === "dark" ? t("common.lightMode") : t("common.darkMode")} onClick={toggleTheme}>
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button className="button" type="button" onClick={() => handlePlanWebsiteClick("mobile_navigation")}>{t("nav.plan")} <ArrowRight size={16} /></button>
            </div>
          </div>
          <div className="nav-actions">
            <CurrencyToggle currency={pricing.currency} setCurrency={pricing.setCurrency} />
            <button className="icon-button" type="button" aria-label={theme === "dark" ? t("common.lightMode") : t("common.darkMode")} onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="button button-small desktop-cta" type="button" onClick={() => handlePlanWebsiteClick("desktop_navigation")}>{t("nav.plan")}</button>
            <button className="menu-button" type="button" aria-label={menuOpen ? t("common.closeNav") : t("common.openNav")} aria-controls="mobile-nav" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>
      </header>

      <main id="main">
        <section className="hero section-grid">
          <div className="hero-grid-lines" aria-hidden="true" />
          <div className="container hero-inner">
            <div className="eyebrow"><span>{t("hero.eyebrow")}</span><span className="eyebrow-line" /></div>
            <div className="hero-title-wrap"><h1>{t("hero.title").split(". ").map((line, index) => <span key={line}>{line}{index < 2 ? "." : ""}{index < 2 && <br />}</span>)}</h1></div>
            <div className="hero-bottom">
              <div className="hero-copy-wrap"><p className="hero-copy">{t("hero.copy")}</p></div>
              <div className="hero-actions">
                <button className="button" type="button" onClick={() => handlePlanWebsiteClick("hero")}>{t("nav.plan")} <ArrowDown size={17} /></button>
                <button className="text-link" type="button" onClick={() => scrollTo("#process")}>{t("hero.process")} <ArrowRight size={17} /></button>
              </div>
            </div>
            <div className="metric-strip" aria-label={t("work.copy")}>
              <div><span><strong>{t("hero.websites")}</strong> {t("hero.websitesDetail")}</span></div>
              <div><span><strong>10%</strong> {t("hero.start")}</span></div>
              <div><span><strong>{t("hero.rightSized")}</strong> {t("hero.vps")}</span></div>
            </div>
          </div>
        </section>

        <section className="section" id="services">
          <div className="container">
            <div className="section-heading">
              <div><span className="kicker">{t("services.kicker")}</span><h2>{t("services.title")}</h2></div>
              <p>{t("services.copy")}</p>
            </div>
            <div className="services-grid">
              {SERVICES.map(({ index }, serviceIndex) => (
                <article className="service-card" key={index}>
                  <div className="card-top"><span>{index}</span></div>
                  <h3>{t(`service.${serviceIndex + 1}.title` as TranslationKey)}</h3><p>{t(`service.${serviceIndex + 1}.copy` as TranslationKey)}</p><div className="tech-line">{t(`service.${serviceIndex + 1}.tech` as TranslationKey)}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="work-section" id="standards">
          <div className="container work-grid">
            <div><span className="kicker">{t("standards.kicker")}</span><h2>{t("standards.title")}</h2></div>
            <div className="principles">
              <div><span><strong>{t("standards.one")}</strong>{t("standards.oneCopy")}</span></div>
              <div><span><strong>{t("standards.two")}</strong>{t("standards.twoCopy")}</span></div>
              <div><span><strong>{t("standards.three")}</strong>{t("standards.threeCopy")}</span></div>
            </div>
          </div>
        </section>

        <section className="section showcase-section" id="work">
          <div className="container">
            <div className="section-heading showcase-heading">
              <div><span className="kicker">{t("work.kicker")}</span><h2>{t("work.title")}</h2></div>
              <p>{t("work.copy")}</p>
            </div>
            <div className="sample-grid">
              {SAMPLE_PROJECTS.map((project) => {
                const projectStatus = sampleStatuses[project.domain] ?? "checking";
                const liveData = sampleMetadata[project.domain];
                const projectDescription = liveData?.description || project.description;
                return <button
                  className={`sample-card sample-theme-${project.theme}`}
                  type="button"
                  key={project.id}
                  onClick={() => {
                    setSelectedSample(project);
                    trackEvent("sample_preview_open", { project: project.id, category: project.category });
                  }}
                  aria-label={`${t("work.open")} ${project.name}`}
                >
                  <span className="sample-card-preview" aria-hidden="true">
                    <span className="sample-mini-browser">
                      <span className="sample-mini-top"><span className="sample-mini-dots"><i /><i /><i /></span><span className="sample-mini-domain">{project.domain}</span></span>
                      <span className="sample-mini-content">
                        <span className="sample-mini-kicker">{project.previewLabel}</span>
                        <strong>{project.name}</strong>
                        <span className="sample-mini-lines"><i /><i /><i /></span>
                        <span className="sample-mini-pills"><i>{project.category}</i><i>{projectStatus === "available" || projectStatus === "blocked" ? t("work.live") : projectStatus === "checking" ? t("work.checking") : t("work.soon")}</i></span>
                      </span>
                    </span>
                  </span>
                  <span className="sample-card-info">
                    <span className="sample-card-meta"><span>{project.number} / {project.category}</span><span className={projectStatus === "available" || projectStatus === "blocked" ? "sample-status live" : "sample-status"}>{projectStatus === "available" || projectStatus === "blocked" ? t("work.live") : projectStatus === "checking" ? t("work.checking") : t("work.soon")}</span></span>
                    <strong>{project.name}</strong>
                    <span>{projectDescription}</span>
                    <span className="sample-card-open">{t("work.open")} <ArrowRight size={15} /></span>
                  </span>
                </button>;
              })}
            </div>
            <p className="showcase-footnote"><span /> New samples will appear here as they go live on their own subdomain.</p>
          </div>
        </section>

        <section className="section calculator-section" id="pricing-calculator">
          <div className="container">
            <div className="section-heading calculator-heading">
              <div><span className="kicker">{t("pricing.kicker")}</span><h2>{t("pricing.title")}</h2></div>
              <div><p>{t("pricing.copy")}</p><CurrencyToggle currency={pricing.currency} setCurrency={pricing.setCurrency} /></div>
            </div>
            <div className="calculator-layout">
              <div className="calculator-controls">
                <fieldset className="choice-group">
                  <legend><span>01</span> {t("pricing.foundation")}</legend>
                  <div className="stack-list">
                    {TECH_STACKS.map((stack) => {
                      const selected = pricing.stackId === stack.id;
                      return (
                        <label className={`stack-option ${selected ? "selected" : ""}`} key={stack.id}>
                          <input type="radio" name="stack" value={stack.id} checked={selected} onChange={() => pricing.setStack(stack.id)} />
                          <span className="radio-mark">{selected && <Check size={13} />}</span>
                          <span className="stack-copy"><strong>{stack.name}</strong><small>{stack.description}</small><i>{stack.delivery}</i></span>
                          <b>{formatMoney(stack.price[pricing.currency], pricing.currency)}</b>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset className="choice-group">
                  <legend><span>02</span> {t("pricing.capabilities")}</legend>
                  <div className="addon-grid">
                    {ADDONS.map((addon) => {
                      const selected = pricing.addonIds.includes(addon.id);
                      return (
                        <label className={`addon-option ${selected ? "selected" : ""}`} key={addon.id}>
                          <input type="checkbox" checked={selected} onChange={() => pricing.toggleAddon(addon.id)} />
                          <span className="check-mark">{selected && <Check size={13} />}</span>
                          <span><strong>{addon.name}</strong><small>{addon.detail}</small></span>
                          <b>+{formatMoney(addon.price[pricing.currency], pricing.currency)}</b>
                        </label>
                      );
                    })}
                    <label className={`addon-option fast-track ${pricing.fastTrack ? "selected" : ""}`}>
                      <input type="checkbox" checked={pricing.fastTrack} onChange={pricing.toggleFastTrack} />
                      <span className="check-mark">{pricing.fastTrack && <Check size={13} />}</span>
                      <span><strong>Priority fast-track sprint</strong><small>Reserved delivery capacity for an accelerated launch</small></span>
                      <b>+25%</b>
                    </label>
                  </div>
                </fieldset>

                <fieldset className="choice-group inbox-group">
                  <legend><span>03</span> {t("pricing.email")}</legend>
                  <div className="inbox-panel">
                    <div className="included-inbox"><span><strong>1 custom inbox included</strong><small>name@yourdomain.lk · Roundcube · SPF, DKIM & DMARC</small></span><i>FREE</i></div>
                    <div className="stepper-row">
                      <div><strong>Additional inboxes</strong><small>{formatMoney(INBOX_PRICE[pricing.currency], pricing.currency)} each</small></div>
                      <div className="stepper" aria-label="Additional business inboxes">
                        <button type="button" aria-label="Remove an inbox" onClick={() => pricing.setExtraInboxes(pricing.extraInboxes - 1)} disabled={pricing.extraInboxes === 0}><Minus /></button>
                        <output aria-live="polite">{pricing.extraInboxes}</output>
                        <button type="button" aria-label="Add an inbox" onClick={() => pricing.setExtraInboxes(pricing.extraInboxes + 1)} disabled={pricing.extraInboxes === 20}><Plus /></button>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>

              <aside className="estimate-card" aria-label={t("pricing.estimateAria")}>
                <div className="estimate-top"><span>{t("pricing.liveEstimate")}</span><i><span /> {t("pricing.updating")}</i></div>
                <p>{t("pricing.investment")}</p>
                <h3>{formatMoney(pricing.scope.total, pricing.currency)}</h3>
                <div className="estimate-meta"><span>{pricing.scope.stack.shortName}</span><span>{pricing.scope.stack.delivery}</span></div>
                <div className="scope-summary">
                  <div><span>{t("pricing.foundationLabel")}</span><strong>{formatMoney(pricing.scope.stack.price[pricing.currency], pricing.currency)}</strong></div>
                  <div><span>{t("pricing.addons")}</span><strong>{pricing.scope.addons.length + (pricing.fastTrack ? 1 : 0)}</strong></div>
                  <div><span>{t("pricing.inboxes")}</span><strong>{pricing.extraInboxes + 1}</strong></div>
                </div>
                <div className="milestones">
                  <div className="milestone-title"><span>{t("pricing.payment")}</span><small>10 / 50 / 40</small></div>
                  <div className="milestone">
                    <span className="milestone-dot">01</span><div><strong>Kickoff</strong><small>Scope & architecture lock</small></div><b>{formatMoney(pricing.scope.milestones.kickoff, pricing.currency)}</b>
                  </div>
                  <div className="milestone">
                    <span className="milestone-dot">02</span><div><strong>Working demo</strong><small>Staging build for review</small></div><b>{formatMoney(pricing.scope.milestones.demo, pricing.currency)}</b>
                  </div>
                  <div className="milestone">
                    <span className="milestone-dot">03</span><div><strong>Final handover</strong><small>Production launch & transfer</small></div><b>{formatMoney(pricing.scope.milestones.handover, pricing.currency)}</b>
                  </div>
                </div>
                <button className="button lock-button" type="button" onClick={lockScope}>{scopeLocked ? t("pricing.locked") : t("pricing.lock")}<ArrowRight size={17} /></button>
                <small className="estimate-note">{t("pricing.estimateNote")}</small>
              </aside>
            </div>
            <div className="maintenance-panel">
              <div className="maintenance-heading">
                <div>
                  <span className="kicker">{t("pricing.maintenanceKicker")}</span>
                  <h3>{t("pricing.maintenanceTitle")}</h3>
                  <p>{t("pricing.maintenanceAfter")} {t("pricing.domainRenewal")}.</p>
                </div>
                <div className="maintenance-billing" role="group" aria-label={t("pricing.billingPeriod")}>
                  {(["monthly", "yearly"] as const).map((billing) => (
                    <button key={billing} type="button" className={pricing.maintenanceBilling === billing ? "active" : ""} aria-pressed={pricing.maintenanceBilling === billing} onClick={() => pricing.setMaintenanceBilling(billing)}>
                      {billing === "monthly" ? t("pricing.monthly") : t("pricing.yearly")}
                    </button>
                  ))}
                </div>
              </div>
              <div className="maintenance-grid">
                <button
                  type="button"
                  className={`maintenance-card ${pricing.maintenancePlan === "care" ? "selected" : ""}`}
                  aria-pressed={pricing.maintenancePlan === "care"}
                  onClick={() => {
                    const plan = pricing.maintenancePlan === "care" ? "none" : "care";
                    pricing.setMaintenancePlan(plan);
                    trackEvent("maintenance_plan_selected", { plan, billing: pricing.maintenanceBilling });
                  }}
                >
                  <span className="maintenance-card-top"><span>{t("pricing.recommended")}</span><i>{pricing.maintenancePlan === "care" ? t("pricing.selected") : t("pricing.optional")}</i></span>
                  <strong>{MAINTENANCE_CARE.name}</strong>
                  <span className="maintenance-price">{formatMaintenanceMoney(MAINTENANCE_CARE[pricing.maintenanceBilling === "monthly" ? "monthlyPrice" : "yearlyPrice"][pricing.currency], pricing.currency)}<small>/{pricing.maintenanceBilling === "monthly" ? t("pricing.monthShort") : t("pricing.yearShort")}</small></span>
                  <span className="maintenance-card-copy">{t("pricing.careCopy")}</span>
                  <ul>{MAINTENANCE_CARE.inclusions.map((inclusion, index) => <li key={inclusion}>{t(`pricing.inclusion.${index + 1}` as TranslationKey)}</li>)}</ul>
                </button>
                <label className={`maintenance-priority ${pricing.maintenancePriority ? "selected" : ""} ${pricing.maintenancePlan !== "care" ? "disabled" : ""}`}>
                  <input type="checkbox" checked={pricing.maintenancePriority} disabled={pricing.maintenancePlan !== "care"} onChange={() => { pricing.toggleMaintenancePriority(); trackEvent("maintenance_priority_changed", { enabled: !pricing.maintenancePriority }); }} />
                  <span className="check-mark">{pricing.maintenancePriority && <Check size={13} />}</span>
                  <span className="maintenance-priority-copy"><strong>{MAINTENANCE_PRIORITY.name}</strong><small>+{formatMaintenanceMoney(MAINTENANCE_PRIORITY[pricing.maintenanceBilling === "monthly" ? "monthlyPrice" : "yearlyPrice"][pricing.currency], pricing.currency)} / {pricing.maintenanceBilling === "monthly" ? t("pricing.monthShort") : t("pricing.yearShort")}</small><p>{t("pricing.priorityDetail")}</p><i>{t("pricing.prioritySeparate")}</i></span>
                </label>
              </div>
              <div className="maintenance-footnote">
                <span>{pricing.maintenancePlan === "care" ? `${t("pricing.recurring")}: ${formatMaintenanceMoney(pricing.scope.maintenance.selectedPrice, pricing.currency)} / ${pricing.maintenanceBilling === "monthly" ? "month" : "year"}` : t("pricing.none")}</span>
                <small>{t("pricing.separate")}</small>
              </div>
            </div>
          </div>
        </section>

        <section className="section process-section" id="process">
          <div className="container">
            <div className="section-heading"><div><span className="kicker">{t("process.kicker")}</span><h2>{t("process.title")}</h2></div><p>{t("process.copy")}</p></div>
            <div className="process-grid">
              {PROCESS.map((step, index) => (
                <article className="process-card" key={step.no}>
                  <div className="process-no"><span>{step.no}</span></div>
                  <span className="process-tag">{step.tag}</span><h3>{t(`process.${index === 0 ? "one" : index === 1 ? "two" : index === 2 ? "three" : "four"}` as TranslationKey)}</h3><p>{t(`process.${index === 0 ? "oneCopy" : index === 1 ? "twoCopy" : index === 2 ? "threeCopy" : "fourCopy"}` as TranslationKey)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section faq-section" id="faq">
          <div className="container faq-layout">
            <div className="section-heading faq-heading">
              <div><span className="kicker">{t("faq.kicker")}</span><h2>{t("faq.title")}</h2></div>
              <p>{t("faq.copy")}</p>
            </div>
            <div className="faq-list">
              {localizedFaqItems.map((item) => (
                <details className="faq-item" key={item.question} onToggle={(event) => { if (event.currentTarget.open) trackEvent("faq_opened", { question: item.question }); }}>
                  <summary><span>{item.question}</span><Plus size={18} /></summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="container contact-grid">
            <div className="contact-copy">
              <span className="kicker">{t("contact.kicker")}</span>
              <h2>{t("contact.title")}</h2>
              <p>{t("contact.copy")}</p>
              <div className="contact-points"><span>{t("contact.direct")}</span><span>{t("contact.scope")}</span><span>{t("contact.ownership")}</span></div>
              <a href="mailto:hello@macm.lk" onClick={() => trackEvent("email_contact_click", { location: "contact" })}>hello@macm.lk <ArrowRight /></a>
            </div>
            <form className="lead-form" onSubmit={submitLead} onFocus={() => { if (!leadStartedRef.current) { leadStartedRef.current = true; trackEvent("lead_form_started"); } }}>
              <input className="honeypot" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" />
              <div className="field-row">
                <label><span>{t("contact.name")}</span><input name="name" required maxLength={120} placeholder={t("contact.namePlaceholder")} value={contactForm.name} onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))} /></label>
                <label><span>{t("contact.email")}</span><input type="email" name="email" required maxLength={254} placeholder={t("contact.emailPlaceholder")} value={contactForm.email} onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))} /></label>
              </div>
              <div className="field-row">
                <label><span>{t("contact.phone")}</span><input name="phone" maxLength={40} placeholder={t("contact.phonePlaceholder")} value={contactForm.phone} onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))} /></label>
                <label><span>{t("contact.projectType")}</span><select name="projectType" required value={contactForm.projectType || (scopeLocked ? pricing.scope.stack.name : "")} onChange={(e) => setContactForm((prev) => ({ ...prev, projectType: e.target.value }))}><option value="" disabled>{t("contact.selectProject")}</option>{TECH_STACKS.map((stack) => <option value={stack.name} key={stack.id}>{stack.name}</option>)}</select></label>
              </div>
              <label><span>{t("contact.estimate")}</span><textarea ref={summaryRef} name="budgetSummary" rows={6} readOnly value={scopeLocked ? pricing.scope.summary : t("contact.lockHint")} onChange={() => undefined} /></label>
              <label><span>{t("contact.notes")}</span><textarea name="notes" rows={5} maxLength={4000} placeholder={t("contact.notesPlaceholder")} value={contactForm.notes} onChange={(e) => setContactForm((prev) => ({ ...prev, notes: e.target.value }))} /></label>
              <div className="form-footer">
                <small>{t("contact.sendConsent")}</small>
                <button className="button" type="submit" disabled={status === "sending"}>{status === "sending" ? t("contact.sending") : t("contact.send")}<Send size={16} /></button>
              </div>
              {statusMessage && <div className={`form-status ${status}`} role="status">{statusMessage}</div>}
            </form>
          </div>
        </section>
      </main>

      {selectedSample && (
        <div className="sample-modal-backdrop" role="presentation" onMouseDown={() => setSelectedSample(null)}>
          <div className="sample-modal" role="dialog" aria-modal="true" aria-labelledby="sample-modal-title" onMouseDown={(event) => event.stopPropagation()}>
              <div className={`sample-modal-preview sample-theme-${selectedSample.theme}`}>
              <div className="sample-modal-toolbar"><span className="sample-mini-dots"><i /><i /><i /></span><span>{selectedSample.domain}</span><span className={selectedSampleStatus === "available" || selectedSampleStatus === "blocked" ? "sample-status live" : "sample-status"}>{selectedSampleStatus === "available" || selectedSampleStatus === "blocked" ? t("work.live") : selectedSampleStatus === "checking" ? t("work.checking") : t("work.soon")}</span></div>
              <SamplePreview project={selectedSample} state={selectedSampleStatus} checkingLabel={t("work.checkLive")} comingLabel={t("work.inStudio")} comingCopy={t("work.notLive")} blockedCopy={t("work.embedBlocked")} />
            </div>
            <div className="sample-modal-details">
              <button className="sample-modal-close" type="button" aria-label={t("common.close")} onClick={() => setSelectedSample(null)}><X size={18} /></button>
              <span className="kicker">{selectedSample.number} / {selectedSample.category}</span>
              <h2 id="sample-modal-title">{selectedSample.name}</h2>
              <p className="sample-modal-domain">{selectedSample.domain}</p>
              <p>{selectedSampleLiveData?.description || selectedSample.description}</p>
              <div className="sample-highlights"><span>{t("work.inside")}</span><ul>{selectedSample.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul></div>
              {(selectedSampleStatus === "available" || selectedSampleStatus === "blocked") ? (
                <a className="button sample-live-link" href={`https://${selectedSample.domain}`} target="_blank" rel="noreferrer" onClick={() => trackEvent("sample_live_site_click", { project: selectedSample.id })}>{t("work.openLive")} <ExternalLink size={15} /></a>
              ) : selectedSampleStatus === "checking" ? (
                <span className="sample-coming-note">{t("work.checkLive")}</span>
              ) : (
                <span className="sample-coming-note">{t("work.previewSoon")}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <CopilotWidget
        onAction={handleCopilotAction}
        pricingScope={pricing.scope}
        pricingState={pricing}
        onApplyScope={(scope) => pricing.configureScope(scope)}
        onScrollTo={(sec) => scrollTo(sec)}
        sampleProjects={SAMPLE_PROJECTS}
        onOpenSample={(sampleId) => {
          const found = SAMPLE_PROJECTS.find((p) => p.id === sampleId);
          if (found) setSelectedSample(found);
        }}
      />

      <footer>
        <div className="container footer-grid">
          <div><a className="brand" href="#main"><span>MACM</span><i /></a><p>{t("footer.websites")}</p></div>
          <div><span>{t("footer.localTime")}</span><strong>UTC +05:30 · Colombo</strong></div>
          <div><span>{t("footer.contact")}</span><a href="mailto:hello@macm.lk" onClick={() => trackEvent("email_contact_click", { location: "footer" })}>hello@macm.lk</a><a href="/sign-in" onClick={() => trackEvent("client_portal_click", { location: "footer" })}>{t("footer.signIn")}</a></div>
          <div><span>© {new Date().getFullYear()} MACM</span><button type="button" onClick={() => scrollTo("#main")}>{t("footer.backTop")}</button></div>
        </div>
      </footer>
    </div>
  );
}
