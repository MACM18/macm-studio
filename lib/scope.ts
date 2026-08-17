type ScopeRecord = Record<string, unknown>;

function record(value: unknown): ScopeRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ScopeRecord : null;
}

function finiteAmount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

export function paymentMilestonesFromScope(scope: unknown) {
  const root = record(scope);
  const milestones = record(root?.milestones);
  const currency = typeof root?.currency === "string" && root.currency.length <= 8 ? root.currency : null;
  return {
    currency,
    kickoff: finiteAmount(milestones?.kickoff),
    demo: finiteAmount(milestones?.demo),
    handover: finiteAmount(milestones?.handover),
  };
}
