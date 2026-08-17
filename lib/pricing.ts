export type Currency = "LKR" | "USD";
export type MaintenanceBilling = "monthly" | "yearly";
export type MaintenancePlanId = "none" | "care";

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

export interface MaintenanceSelection {
  plan: MaintenancePlanId;
  billing: MaintenanceBilling;
  priority: boolean;
  monthlyPrice: Record<Currency, number>;
  yearlyPrice: Record<Currency, number>;
  selectedPrice: number;
  domainRenewalIncluded: boolean;
  summary: string;
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
  maintenance: MaintenanceSelection;
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

export const MAINTENANCE_CARE = {
  id: "care" as const,
  name: "Website Care",
  monthlyPrice: { LKR: 1500, USD: 3.99 },
  yearlyPrice: { LKR: 15000, USD: 39.9 },
  domainRenewal: "1 standard .com or .lk renewal included each year",
  inclusions: [
    "Routine website updates",
    "Backup checks",
    "Small text or image changes up to 30 minutes per month",
    "Basic domain and DNS coordination",
    "Email support for normal website issues",
  ],
} as const;

export const MAINTENANCE_PRIORITY = {
  name: "Priority response",
  monthlyPrice: { LKR: 2500, USD: 8 },
  yearlyPrice: { LKR: 25000, USD: 83 },
  detail: "24-hour acknowledgement and routine fixes targeted within 1–2 business days where possible.",
} as const;

export function formatMoney(amount: number, currency: Currency, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(currency === "LKR" ? "en-LK" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(amount);
}
