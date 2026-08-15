export type Currency = "LKR" | "USD";

export interface TechStack {
  id: "static" | "wordpress" | "headless" | "fullstack";
  name: string;
  shortName: string;
  description: string;
  price: Record<Currency, number>;
  delivery: string;
}

export interface Addon {
  id: "payments" | "auth" | "api" | "vps";
  name: string;
  detail: string;
  price: Record<Currency, number>;
}

export interface MilestoneBreakdown {
  kickoff: number;
  demo: number;
  handover: number;
}

export interface ProjectScopePayload {
  currency: Currency;
  stack: TechStack;
  addons: Addon[];
  fastTrack: boolean;
  extraInboxes: number;
  includedInboxes: number;
  total: number;
  milestones: MilestoneBreakdown;
  summary: string;
}

export const TECH_STACKS: TechStack[] = [
  {
    id: "static",
    name: "Custom Static Build",
    shortName: "Static site",
    description: "A focused, conversion-ready site with a custom design and clean content structure.",
    price: { LKR: 65000, USD: 220 },
    delivery: "1–2 weeks",
  },
  {
    id: "wordpress",
    name: "WordPress (Managed)",
    shortName: "Managed WordPress",
    description: "A tailored, easy-to-manage website with hardened security and ongoing care.",
    price: { LKR: 90000, USD: 300 },
    delivery: "Around 2 weeks",
  },
  {
    id: "headless",
    name: "Headless CMS Build",
    shortName: "Headless CMS",
    description: "A premium publishing experience that keeps editorial workflow separate from the front end.",
    price: { LKR: 160000, USD: 550 },
    delivery: "3–4 weeks",
  },
  {
    id: "fullstack",
    name: "Custom Full-Stack App + Admin Dashboard",
    shortName: "Web app + admin",
    description: "A secure, purpose-built product with business logic, data, accounts, and an admin workspace.",
    price: { LKR: 280000, USD: 950 },
    delivery: "4–6 weeks",
  },
];

export const ADDONS: Addon[] = [
  {
    id: "payments",
    name: "Payment gateway",
    detail: "PayHere or Stripe checkout integration",
    price: { LKR: 35000, USD: 120 },
  },
  {
    id: "auth",
    name: "User accounts & permissions",
    detail: "Secure sign-in and role-based access",
    price: { LKR: 45000, USD: 150 },
  },
  {
    id: "api",
    name: "Custom API & webhooks",
    detail: "Connect your product with other tools",
    price: { LKR: 30000, USD: 100 },
  },
  {
    id: "vps",
    name: "VPS launch & auto backups",
    detail: "Docker/Dokploy setup and recovery plan",
    price: { LKR: 25000, USD: 85 },
  },
];

export const INBOX_PRICE: Record<Currency, number> = { LKR: 1500, USD: 5 };

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === "LKR" ? "en-LK" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
