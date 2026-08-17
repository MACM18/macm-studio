"use client";

import { useMemo, useReducer } from "react";
import {
  ADDONS,
  Addon,
  Currency,
  INBOX_PRICE,
  MAINTENANCE_CARE,
  MAINTENANCE_PRIORITY,
  MaintenanceBilling,
  MaintenanceSelection,
  MilestoneBreakdown,
  ProjectScopePayload,
  TECH_STACKS,
  TechStack,
  formatMoney,
} from "@/lib/pricing";

interface PricingState {
  currency: Currency;
  stackId: TechStack["id"];
  addonIds: Addon["id"][];
  fastTrack: boolean;
  extraInboxes: number;
  maintenancePlan: "none" | "care";
  maintenanceBilling: MaintenanceBilling;
  maintenancePriority: boolean;
}

type PricingAction =
  | { type: "SET_CURRENCY"; currency: Currency }
  | { type: "SET_STACK"; stackId: TechStack["id"] }
  | { type: "TOGGLE_ADDON"; addonId: Addon["id"] }
  | { type: "TOGGLE_FAST_TRACK" }
  | { type: "SET_INBOXES"; count: number }
  | { type: "SET_MAINTENANCE_PLAN"; plan: "none" | "care" }
  | { type: "SET_MAINTENANCE_BILLING"; billing: MaintenanceBilling }
  | { type: "TOGGLE_MAINTENANCE_PRIORITY" };

const initialState: PricingState = {
  currency: "LKR",
  stackId: "static",
  addonIds: [],
  fastTrack: false,
  extraInboxes: 0,
  maintenancePlan: "none",
  maintenanceBilling: "monthly",
  maintenancePriority: false,
};

function reducer(state: PricingState, action: PricingAction): PricingState {
  switch (action.type) {
    case "SET_CURRENCY":
      return { ...state, currency: action.currency };
    case "SET_STACK":
      return { ...state, stackId: action.stackId };
    case "TOGGLE_ADDON":
      return {
        ...state,
        addonIds: state.addonIds.includes(action.addonId)
          ? state.addonIds.filter((id) => id !== action.addonId)
          : [...state.addonIds, action.addonId],
      };
    case "TOGGLE_FAST_TRACK":
      return { ...state, fastTrack: !state.fastTrack };
    case "SET_INBOXES":
      return { ...state, extraInboxes: Math.max(0, Math.min(20, action.count)) };
    case "SET_MAINTENANCE_PLAN":
      return {
        ...state,
        maintenancePlan: action.plan,
        maintenancePriority: action.plan === "care" ? state.maintenancePriority : false,
      };
    case "SET_MAINTENANCE_BILLING":
      return { ...state, maintenanceBilling: action.billing };
    case "TOGGLE_MAINTENANCE_PRIORITY":
      return state.maintenancePlan === "care"
        ? { ...state, maintenancePriority: !state.maintenancePriority }
        : state;
    default:
      return state;
  }
}

function milestoneMath(total: number): MilestoneBreakdown {
  const kickoff = Math.round(total * 0.1);
  const demo = Math.round(total * 0.5);
  return { kickoff, demo, handover: total - kickoff - demo };
}

export function usePricingCalculator() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const scope = useMemo<ProjectScopePayload>(() => {
    const stack = TECH_STACKS.find((item) => item.id === state.stackId) ?? TECH_STACKS[0];
    const addons = ADDONS.filter((item) => state.addonIds.includes(item.id));
    const baseSubtotal =
      stack.price[state.currency] +
      addons.reduce((total, addon) => total + addon.price[state.currency], 0) +
      state.extraInboxes * INBOX_PRICE[state.currency];
    const total = Math.round(baseSubtotal * (state.fastTrack ? 1.25 : 1));
    const milestones = milestoneMath(total);
    const addonSummary = addons.length ? addons.map((addon) => addon.name).join(", ") : "No optional add-ons";
    const monthlyMaintenancePrice = {
      LKR: state.maintenancePlan === "care" ? MAINTENANCE_CARE.monthlyPrice.LKR + (state.maintenancePriority ? MAINTENANCE_PRIORITY.monthlyPrice.LKR : 0) : 0,
      USD: state.maintenancePlan === "care" ? MAINTENANCE_CARE.monthlyPrice.USD + (state.maintenancePriority ? MAINTENANCE_PRIORITY.monthlyPrice.USD : 0) : 0,
    };
    const yearlyMaintenancePrice = {
      LKR: state.maintenancePlan === "care" ? MAINTENANCE_CARE.yearlyPrice.LKR + (state.maintenancePriority ? MAINTENANCE_PRIORITY.yearlyPrice.LKR : 0) : 0,
      USD: state.maintenancePlan === "care" ? MAINTENANCE_CARE.yearlyPrice.USD + (state.maintenancePriority ? MAINTENANCE_PRIORITY.yearlyPrice.USD : 0) : 0,
    };
    const selectedMaintenancePrice = (state.maintenanceBilling === "monthly" ? monthlyMaintenancePrice : yearlyMaintenancePrice)[state.currency];
    const maintenance: MaintenanceSelection = {
      plan: state.maintenancePlan,
      billing: state.maintenanceBilling,
      priority: state.maintenancePlan === "care" && state.maintenancePriority,
      monthlyPrice: monthlyMaintenancePrice,
      yearlyPrice: yearlyMaintenancePrice,
      selectedPrice: selectedMaintenancePrice,
      domainRenewalIncluded: state.maintenancePlan === "care",
      summary: state.maintenancePlan === "care"
        ? `Website Care — ${formatMoney(selectedMaintenancePrice, state.currency, state.currency === "USD" ? 2 : 0)}/${state.maintenanceBilling === "monthly" ? "month" : "year"}${state.maintenancePriority ? " · Priority response" : ""}`
        : "Not selected",
    };
    const summary = [
      stack.name,
      `Add-ons: ${addonSummary}`,
      `Business inboxes: ${state.extraInboxes + 1} total (${state.extraInboxes} extra)`,
      `Fast-track: ${state.fastTrack ? "Yes" : "No"}`,
      `Estimate: ${formatMoney(total, state.currency)}`,
      `Payments: 10% ${formatMoney(milestones.kickoff, state.currency)} · 50% ${formatMoney(milestones.demo, state.currency)} · 40% ${formatMoney(milestones.handover, state.currency)}`,
      ...(state.maintenancePlan === "care" ? [
        `Maintenance: Website Care — ${formatMoney(selectedMaintenancePrice, state.currency, state.currency === "USD" ? 2 : 0)}/${state.maintenanceBilling === "monthly" ? "month" : "year"}`,
        `Priority response: ${state.maintenancePriority ? "Included" : "Not selected"}`,
        "Domain renewal: 1 standard .com or .lk included",
      ] : []),
    ].join("\n");

    return {
      currency: state.currency,
      stack,
      addons,
      fastTrack: state.fastTrack,
      extraInboxes: state.extraInboxes,
      includedInboxes: 1,
      total,
      milestones,
      maintenance,
      summary,
    };
  }, [state]);

  return {
    ...state,
    scope,
    setCurrency: (currency: Currency) => dispatch({ type: "SET_CURRENCY", currency }),
    setStack: (stackId: TechStack["id"]) => dispatch({ type: "SET_STACK", stackId }),
    toggleAddon: (addonId: Addon["id"]) => dispatch({ type: "TOGGLE_ADDON", addonId }),
    toggleFastTrack: () => dispatch({ type: "TOGGLE_FAST_TRACK" }),
    setExtraInboxes: (count: number) => dispatch({ type: "SET_INBOXES", count }),
    setMaintenancePlan: (plan: "none" | "care") => dispatch({ type: "SET_MAINTENANCE_PLAN", plan }),
    setMaintenanceBilling: (billing: MaintenanceBilling) => dispatch({ type: "SET_MAINTENANCE_BILLING", billing }),
    toggleMaintenancePriority: () => dispatch({ type: "TOGGLE_MAINTENANCE_PRIORITY" }),
  };
}
