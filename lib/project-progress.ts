export type ProgressMilestone = { weight: number; progress: number };

export function calculateProjectProgress(milestones: ProgressMilestone[]) {
  if (!milestones.length) return 0;
  const weighted = milestones.reduce((total, item) => total + item.weight * Math.min(100, Math.max(0, item.progress)), 0);
  return Math.round(weighted / 100);
}

export function milestoneWeightsAreValid(milestones: Pick<ProgressMilestone, "weight">[]) {
  return milestones.length > 0 && milestones.every((item) => Number.isInteger(item.weight) && item.weight >= 0) && milestones.reduce((total, item) => total + item.weight, 0) === 100;
}
