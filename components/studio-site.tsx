"use client";

import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Code2,
  Database,
  ExternalLink,
  Globe2,
  Layers3,
  Mail,
  Menu,
  Minus,
  Moon,
  Plus,
  Send,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
  Zap,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { usePricingCalculator } from "@/hooks/usePricingCalculator";
import { ADDONS, Currency, INBOX_PRICE, TECH_STACKS, formatMoney } from "@/lib/pricing";

const NAV_ITEMS = [
  ["Services", "#services"],
  ["Work", "#work"],
  ["Pricing", "#pricing-calculator"],
  ["Process", "#process"],
  ["Contact", "#contact"],
] as const;

const SERVICES = [
  {
    index: "01",
    icon: Globe2,
    title: "Custom sites",
    copy: "A clear, professional website that explains what you do, builds trust, and helps the right visitors get in touch.",
    tech: "Mobile-ready · Search-friendly · Clear content",
  },
  {
    index: "02",
    icon: Layers3,
    title: "Managed WordPress",
    copy: "A website your team can update without waiting on a developer, with ongoing care to keep it secure and up to date.",
    tech: "Easy editing · Secure · Ongoing care",
  },
  {
    index: "03",
    icon: Database,
    title: "Headless platforms",
    copy: "A flexible content setup for growing teams that want to publish often, keep control, and add new sections over time.",
    tech: "Flexible content · Easy publishing · Ready to grow",
  },
  {
    index: "04",
    icon: Code2,
    title: "Web apps & SaaS",
    copy: "A custom online tool for the way your business works, with customer accounts, admin areas, payments, and useful automations.",
    tech: "Customer accounts · Admin tools · Integrations",
  },
];

type SampleStatus = "live" | "coming-soon";
type SampleTheme = "hospitality" | "legal" | "hotel" | "creative" | "wellness" | "property" | "saas" | "commerce" | "education" | "events";
type SamplePreviewState = "checking" | "available" | "unavailable";

interface SampleProject {
  id: string;
  number: string;
  name: string;
  category: string;
  domain: string;
  description: string;
  highlights: string[];
  status: SampleStatus;
  theme: SampleTheme;
  previewLabel: string;
}

const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: "harbor-hearth",
    number: "01",
    name: "Harbor & Hearth",
    category: "Restaurant",
    domain: "sample1.macm.lk",
    description: "A warm, editorial restaurant website built to make the menu, story, and next reservation easy to find.",
    highlights: ["Hero dish photography", "Menu preview", "Chef story", "Opening hours and location", "Reservation CTA", "Mobile-first menu navigation"],
    status: "live",
    theme: "hospitality",
    previewLabel: "Seasonal dining / Colombo",
  },
  {
    id: "northline-legal",
    number: "02",
    name: "Northline Legal",
    category: "Professional Services",
    domain: "sample2.macm.lk",
    description: "A calm, trustworthy website concept for a law or consulting firm that needs to explain expertise clearly.",
    highlights: ["Practice areas", "Attorney profiles", "Client process", "Frequently asked questions", "Consultation CTA", "Trust-focused typography"],
    status: "coming-soon",
    theme: "legal",
    previewLabel: "Counsel / clarity / trust",
  },
  {
    id: "ceylon-house",
    number: "03",
    name: "Ceylon House",
    category: "Boutique Hotel",
    domain: "sample3.macm.lk",
    description: "An elegant hospitality website concept that gives the stay, the setting, and the booking journey room to breathe.",
    highlights: ["Rooms and suites", "Amenities", "Gallery", "Experiences", "Location guide", "Booking enquiry CTA"],
    status: "coming-soon",
    theme: "hotel",
    previewLabel: "Stay slowly / island light",
  },
  {
    id: "aster-form",
    number: "04",
    name: "Aster & Form",
    category: "Interior Design Studio",
    domain: "sample4.macm.lk",
    description: "A portfolio-led creative site concept designed to let the work speak first while still making enquiries feel effortless.",
    highlights: ["Large project gallery", "Case-study pages", "Services", "Studio profile", "Testimonials", "Project enquiry form"],
    status: "coming-soon",
    theme: "creative",
    previewLabel: "Objects / rooms / atmosphere",
  },
  {
    id: "luma-health",
    number: "05",
    name: "Luma Health",
    category: "Wellness Clinic",
    domain: "sample5.macm.lk",
    description: "A friendly, reassuring clinic website concept that helps new patients understand their options and take the next step.",
    highlights: ["Treatments", "Practitioner profiles", "New-patient information", "FAQs", "Appointment CTA", "Contact and location details"],
    status: "coming-soon",
    theme: "wellness",
    previewLabel: "Care / balance / wellbeing",
  },
  {
    id: "kora-estates",
    number: "06",
    name: "Kora Estates",
    category: "Property Development",
    domain: "sample6.macm.lk",
    description: "A high-end property marketing concept built to turn a place, its details, and its potential into a confident enquiry.",
    highlights: ["Featured property", "Floor plans", "Amenities", "Location map", "Image gallery", "Enquiry form"],
    status: "coming-soon",
    theme: "property",
    previewLabel: "A better address / coming home",
  },
  {
    id: "fieldnote",
    number: "07",
    name: "Fieldnote",
    category: "SaaS Product Landing Page",
    domain: "sample7.macm.lk",
    description: "A polished product website concept for a productivity app, showing how a digital service can explain its value simply.",
    highlights: ["Product explanation", "Feature sections", "Pricing cards", "Customer quotes", "FAQ", "Free-trial CTA"],
    status: "coming-soon",
    theme: "saas",
    previewLabel: "Make space for good work",
  },
  {
    id: "mora-coffee",
    number: "08",
    name: "Mora Coffee",
    category: "E-commerce Concept",
    domain: "sample8.macm.lk",
    description: "A static storefront concept for a coffee and lifestyle brand, ready to grow into a complete shopping experience.",
    highlights: ["Product cards", "Product detail sections", "Subscription concept", "Brand story", "Delivery information", "WhatsApp order CTA"],
    status: "coming-soon",
    theme: "commerce",
    previewLabel: "Small batch / daily ritual",
  },
  {
    id: "orbit-learning",
    number: "09",
    name: "Orbit Learning",
    category: "Education Platform",
    domain: "sample9.macm.lk",
    description: "A structured course and training website concept that makes programmes, outcomes, and enrolment easy to understand.",
    highlights: ["Course categories", "Instructor profiles", "Learning outcomes", "Student testimonials", "Enrollment CTA", "FAQ section"],
    status: "coming-soon",
    theme: "education",
    previewLabel: "Learn with direction",
  },
  {
    id: "sora-events",
    number: "10",
    name: "Sora Events",
    category: "Wedding and Events Studio",
    domain: "sample10.macm.lk",
    description: "A visual, emotional event-planning concept with a softer voice and a clear path from inspiration to availability enquiry.",
    highlights: ["Event packages", "Gallery", "Planning process", "Testimonials", "Availability enquiry", "WhatsApp CTA"],
    status: "coming-soon",
    theme: "events",
    previewLabel: "Gather beautifully",
  },
];

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

function SamplePreview({ project, onStatusChange }: { project: SampleProject; onStatusChange: (status: SamplePreviewState) => void }) {
  const [state, setState] = useState<SamplePreviewState>("checking");

  useEffect(() => {
    const controller = new AbortController();
    setState("checking");
    onStatusChange("checking");

    fetch(`/api/sample-status?url=${encodeURIComponent(`https://${project.domain}`)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => response.json() as Promise<{ available?: boolean }>)
      .then((result) => {
        const nextState = result.available ? "available" : "unavailable";
        setState(nextState);
        onStatusChange(nextState);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState("unavailable");
          onStatusChange("unavailable");
        }
      });

    return () => controller.abort();
  }, [onStatusChange, project.domain]);

  if (state === "checking") {
    return <div className="sample-preview-checking"><span className="sample-preview-pulse" /><p>Checking {project.domain}…</p></div>;
  }

  if (state === "available") {
    return <iframe src={`https://${project.domain}`} title={`${project.name} live website preview`} loading="lazy" />;
  }

  return (
    <div className="sample-coming-preview">
      <span className="kicker">IN THE STUDIO</span>
      <strong>{project.name}</strong>
      <p>This subdomain is not live yet. Once it is deployed, the live preview will appear here automatically.</p>
    </div>
  );
}

export function StudioSite() {
  const pricing = usePricingCalculator();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [selectedSample, setSelectedSample] = useState<SampleProject | null>(null);
  const [samplePreviewState, setSamplePreviewState] = useState<SamplePreviewState>("checking");
  const [scopeLocked, setScopeLocked] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const summaryRef = useRef<HTMLTextAreaElement>(null);

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
    setSamplePreviewState("checking");
  }, [selectedSample]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("macm-theme", nextTheme);
  };

  const lockScope = () => {
    setScopeLocked(true);
    setStatus("idle");
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

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Unable to send your enquiry.");
      setStatus("sent");
      setStatusMessage(result.message || "Your project brief has been sent.");
      formElement.reset();
      if (summaryRef.current) summaryRef.current.value = pricing.scope.summary;
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Unable to send your enquiry.");
    }
  };

  return (
    <div className="site-shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="nav-wrap">
        <nav className="nav container" aria-label="Primary navigation">
          <a className="brand" href="#main" aria-label="MACM home">
            <span>MACM</span><i />
          </a>
          <div className="availability"><span /> Available for Q3/Q4 projects</div>
          <div id="mobile-nav" className={`nav-links ${menuOpen ? "open" : ""}`} aria-label="Site navigation">
            {NAV_ITEMS.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <div className="mobile-nav-controls">
              <CurrencyToggle currency={pricing.currency} setCurrency={pricing.setCurrency} />
              <button className="icon-button" type="button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={toggleTheme}>
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button className="button" type="button" onClick={() => { setMenuOpen(false); scrollTo("#pricing-calculator"); }}>Plan my website <ArrowRight size={16} /></button>
            </div>
          </div>
          <div className="nav-actions">
            <CurrencyToggle currency={pricing.currency} setCurrency={pricing.setCurrency} />
            <button className="icon-button" type="button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="button button-small desktop-cta" type="button" onClick={() => scrollTo("#pricing-calculator")}>Plan my website</button>
            <button className="menu-button" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-controls="mobile-nav" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>
      </header>

      <main id="main">
        <section className="hero section-grid">
          <div className="hero-grid-lines" aria-hidden="true" />
          <div className="container hero-inner">
            <div className="eyebrow"><span>01 / WEB DEVELOPMENT STUDIO</span><span className="eyebrow-line" /></div>
            <h1>Websites that<br /><em>work.</em><br />Built with care.</h1>
            <div className="hero-bottom">
              <p className="hero-copy">Web design, web development, and custom web applications — shaped around your business, not a template.</p>
              <div className="hero-actions">
                <button className="button" type="button" onClick={() => scrollTo("#pricing-calculator")}>Plan my website <ArrowDown size={17} /></button>
                <button className="text-link" type="button" onClick={() => scrollTo("#process")}>See our web development process <ArrowRight size={17} /></button>
              </div>
            </div>
            <div className="metric-strip" aria-label="Project highlights">
              <div><Globe2 /><span><strong>Websites first</strong> Clear, useful experiences</span></div>
              <div><CircleDollarSign /><span><strong>10%</strong> to start</span></div>
              <div><ServerCog /><span><strong>Right-sized</strong> VPS deployment</span></div>
            </div>
          </div>
        </section>

        <section className="section" id="services">
          <div className="container">
            <div className="section-heading">
              <div><span className="kicker">WHAT WE BUILD</span><h2>Small studio.<br />Useful websites.</h2></div>
              <p>From a first website to the online tools behind your business, every engagement starts with a clear goal and removes everything unnecessary.</p>
            </div>
            <div className="services-grid">
              {SERVICES.map(({ index, icon: Icon, title, copy, tech }) => (
                <article className="service-card" key={title}>
                  <div className="card-top"><span>{index}</span><Icon size={22} /></div>
                  <h3>{title}</h3><p>{copy}</p><div className="tech-line">{tech}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="work-section" id="standards">
          <div className="container work-grid">
            <div><span className="kicker">THE STANDARD</span><h2>Clean on the surface.<br />Rigorous underneath.</h2></div>
            <div className="principles">
              <div><Zap /><span><strong>Thoughtful foundations</strong>Clear interfaces, sensible loading, dependable infrastructure.</span></div>
              <div><ShieldCheck /><span><strong>Built for ownership</strong>Clean handover, documented systems, no platform lock-in.</span></div>
              <div><Sparkles /><span><strong>Useful by design</strong>Every screen and workflow earns its place.</span></div>
            </div>
          </div>
        </section>

        <section className="section showcase-section" id="work">
          <div className="container">
            <div className="section-heading showcase-heading">
              <div><span className="kicker">SELECTED DIRECTIONS</span><h2>Websites for<br />different worlds.</h2></div>
              <p>Explore the kinds of websites MACM can shape. One sample is live today; the rest are in the studio queue and ready to become real.</p>
            </div>
            <div className="sample-grid">
              {SAMPLE_PROJECTS.map((project) => (
                <button
                  className={`sample-card sample-theme-${project.theme}`}
                  type="button"
                  key={project.id}
                  onClick={() => setSelectedSample(project)}
                  aria-label={`Open ${project.name} sample project preview`}
                >
                  <span className="sample-card-preview" aria-hidden="true">
                    <span className="sample-mini-browser">
                      <span className="sample-mini-top"><span className="sample-mini-dots"><i /><i /><i /></span><span className="sample-mini-domain">{project.domain}</span></span>
                      <span className="sample-mini-content">
                        <span className="sample-mini-kicker">{project.previewLabel}</span>
                        <strong>{project.name}</strong>
                        <span className="sample-mini-lines"><i /><i /><i /></span>
                        <span className="sample-mini-pills"><i>{project.category}</i><i>{project.status === "live" ? "LIVE" : "SOON"}</i></span>
                      </span>
                    </span>
                  </span>
                  <span className="sample-card-info">
                    <span className="sample-card-meta"><span>{project.number} / {project.category}</span><span className={project.status === "live" ? "sample-status live" : "sample-status"}>{project.status === "live" ? "LIVE SAMPLE" : "COMING SOON"}</span></span>
                    <strong>{project.name}</strong>
                    <span>{project.description}</span>
                    <span className="sample-card-open">Open preview <ArrowRight size={15} /></span>
                  </span>
                </button>
              ))}
            </div>
            <p className="showcase-footnote"><span /> New samples will appear here as they go live on their own subdomain.</p>
          </div>
        </section>

        <section className="section calculator-section" id="pricing-calculator">
          <div className="container">
            <div className="section-heading calculator-heading">
              <div><span className="kicker">SCOPE YOUR PROJECT</span><h2>A clear estimate,<br />before the first call.</h2></div>
              <div><p>Select what you need. Your estimate and milestone plan update instantly.</p><CurrencyToggle currency={pricing.currency} setCurrency={pricing.setCurrency} /></div>
            </div>
            <div className="calculator-layout">
              <div className="calculator-controls">
                <fieldset className="choice-group">
                  <legend><span>01</span> Choose the foundation</legend>
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
                  <legend><span>02</span> Add the capabilities</legend>
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
                  <legend><span>03</span> Set up business email</legend>
                  <div className="inbox-panel">
                    <div className="included-inbox"><Mail /><span><strong>1 custom inbox included</strong><small>name@yourdomain.lk · Roundcube · SPF, DKIM & DMARC</small></span><i>FREE</i></div>
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

              <aside className="estimate-card" aria-label="Live project estimate">
                <div className="estimate-top"><span>LIVE ESTIMATE</span><i><span /> Updating</i></div>
                <p>Estimated investment</p>
                <h3>{formatMoney(pricing.scope.total, pricing.currency)}</h3>
                <div className="estimate-meta"><span>{pricing.scope.stack.shortName}</span><span>{pricing.scope.stack.delivery}</span></div>
                <div className="scope-summary">
                  <div><span>Foundation</span><strong>{formatMoney(pricing.scope.stack.price[pricing.currency], pricing.currency)}</strong></div>
                  <div><span>Selected add-ons</span><strong>{pricing.scope.addons.length + (pricing.fastTrack ? 1 : 0)}</strong></div>
                  <div><span>Business inboxes</span><strong>{pricing.extraInboxes + 1}</strong></div>
                </div>
                <div className="milestones">
                  <div className="milestone-title"><span>Payment milestones</span><small>10 / 50 / 40</small></div>
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
                <button className="button lock-button" type="button" onClick={lockScope}>{scopeLocked ? "Scope added to enquiry" : "Lock in this scope"}<ArrowRight size={17} /></button>
                <small className="estimate-note">Planning estimate only. Final scope is confirmed after a short discovery call.</small>
              </aside>
            </div>
          </div>
        </section>

        <section className="section process-section" id="process">
          <div className="container">
            <div className="section-heading"><div><span className="kicker">HOW WE DELIVER</span><h2>Four steps.<br />No black boxes.</h2></div><p>Clear gates keep the project predictable. You see a working website or web app early and only pay the next milestone when it is earned.</p></div>
            <div className="process-grid">
              {PROCESS.map((step, index) => (
                <article className="process-card" key={step.no}>
                  <div className="process-no"><span>{step.no}</span>{index < PROCESS.length - 1 && <ChevronRight />}</div>
                  <span className="process-tag">{step.tag}</span><h3>{step.title}</h3><p>{step.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="container contact-grid">
            <div className="contact-copy">
              <span className="kicker">START A CONVERSATION</span>
              <h2>Bring us the<br />hard problem.</h2>
              <p>Tell us what you are building and where you are stuck. We’ll reply with practical next steps — usually within one business day.</p>
              <div className="contact-points"><span><CheckCircle2 /> Direct access to the engineer</span><span><CheckCircle2 /> Clear scope before commitment</span><span><CheckCircle2 /> Your code, infrastructure, and data</span></div>
              <a href="mailto:hello@macm.lk">hello@macm.lk <ArrowRight /></a>
            </div>
            <form className="lead-form" onSubmit={submitLead}>
              <input className="honeypot" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" />
              <div className="field-row">
                <label><span>Your name *</span><input name="name" required maxLength={120} placeholder="How should we address you?" /></label>
                <label><span>Work email *</span><input type="email" name="email" required maxLength={254} placeholder="you@company.com" /></label>
              </div>
              <div className="field-row">
                <label><span>WhatsApp / phone</span><input name="phone" maxLength={40} placeholder="+94 7X XXX XXXX" /></label>
                <label><span>Project type *</span><select name="projectType" required defaultValue={scopeLocked ? pricing.scope.stack.name : ""} key={`${scopeLocked}-${pricing.scope.stack.id}`}><option value="" disabled>Select a project type</option>{TECH_STACKS.map((stack) => <option value={stack.name} key={stack.id}>{stack.name}</option>)}</select></label>
              </div>
              <label><span>Estimate & milestones</span><textarea ref={summaryRef} name="budgetSummary" rows={6} readOnly value={scopeLocked ? pricing.scope.summary : "Use the project calculator above, then select ‘Lock in this scope’ to add your estimate here."} onChange={() => undefined} /></label>
              <label><span>What do you need this product to achieve?</span><textarea name="notes" rows={5} maxLength={4000} placeholder="A little context about the business, users, timeline, and the problem you want to solve..." /></label>
              <div className="form-footer">
                <small>By sending this form, you agree to be contacted about this project. No mailing lists.</small>
                <button className="button" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send project brief"}<Send size={16} /></button>
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
              <div className="sample-modal-toolbar"><span className="sample-mini-dots"><i /><i /><i /></span><span>{selectedSample.domain}</span><span className={samplePreviewState === "available" ? "sample-status live" : "sample-status"}>{samplePreviewState === "available" ? "LIVE SAMPLE" : samplePreviewState === "checking" ? "CHECKING" : "COMING SOON"}</span></div>
              <SamplePreview project={selectedSample} onStatusChange={setSamplePreviewState} />
            </div>
            <div className="sample-modal-details">
              <button className="sample-modal-close" type="button" aria-label="Close sample preview" onClick={() => setSelectedSample(null)}><X size={18} /></button>
              <span className="kicker">{selectedSample.number} / {selectedSample.category}</span>
              <h2 id="sample-modal-title">{selectedSample.name}</h2>
              <p className="sample-modal-domain">{selectedSample.domain}</p>
              <p>{selectedSample.description}</p>
              <div className="sample-highlights"><span>Inside the concept</span><ul>{selectedSample.highlights.map((highlight) => <li key={highlight}><Check size={14} />{highlight}</li>)}</ul></div>
              {samplePreviewState === "available" ? (
                <a className="button sample-live-link" href={`https://${selectedSample.domain}`} target="_blank" rel="noreferrer">Open live site <ExternalLink size={15} /></a>
              ) : samplePreviewState === "checking" ? (
                <span className="sample-coming-note">Checking live sample</span>
              ) : (
                <span className="sample-coming-note">Live preview coming soon</span>
              )}
            </div>
          </div>
        </div>
      )}

      <footer>
        <div className="container footer-grid">
          <div><a className="brand" href="#main"><span>MACM</span><i /></a><p>Websites and web development, built with care in Sri Lanka.</p></div>
          <div><span>LOCAL TIME</span><strong>UTC +05:30 · Colombo</strong></div>
          <div><span>CONTACT</span><a href="mailto:hello@macm.lk">hello@macm.lk</a></div>
          <div><span>© {new Date().getFullYear()} MACM</span><button type="button" onClick={() => scrollTo("#main")}>Back to top ↑</button></div>
        </div>
      </footer>
    </div>
  );
}
