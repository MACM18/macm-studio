const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-82X4D9K6PB";

type AnalyticsValue = string | number | boolean;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, parameters: Record<string, AnalyticsValue> = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function" || !GA_MEASUREMENT_ID) return;
  window.gtag("event", name, parameters);
}

export { GA_MEASUREMENT_ID };
