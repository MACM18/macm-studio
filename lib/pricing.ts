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
  id: "payments" | "auth" | "api" | "dedicated-backup";
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
    price: { LKR: 45000, USD: 150 },
    delivery: "1–2 weeks",
  },
  {
    id: "wordpress",
    name: "WordPress (Managed)",
    shortName: "Managed WordPress",
    description: "A tailored, easy-to-manage website with hardened security and ongoing care.",
    price: { LKR: 60000, USD: 200 },
    delivery: "Around 2 weeks",
  },
  {
    id: "headless",
    name: "Headless CMS Build",
    shortName: "Headless CMS",
    description: "A premium publishing experience that keeps editorial workflow separate from the front end.",
    price: { LKR: 100000, USD: 350 },
    delivery: "3–4 weeks",
  },
  {
    id: "fullstack",
    name: "Custom Full-Stack App + Admin Dashboard",
    shortName: "Web app + admin",
    description: "A secure, purpose-built product with business logic, data, accounts, and an admin workspace.",
    price: { LKR: 150000, USD: 500 },
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
    id: "dedicated-backup",
    name: "Custom dedicated backup",
    detail: "Secure backup of your website",
    price: { LKR: 10000, USD: 30 },
  },
];

export const INBOX_PRICE: Record<Currency, number> = { LKR: 500, USD: 2.49 };

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === "LKR" ? "en-LK" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
