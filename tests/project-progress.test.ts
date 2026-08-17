import { describe, expect, it } from "vitest";
import { calculateProjectProgress, milestoneWeightsAreValid } from "../lib/project-progress";

describe("project progress", () => {
  it("uses milestone work weights rather than a simple average", () => {
    expect(calculateProjectProgress([{ weight: 20, progress: 100 }, { weight: 60, progress: 50 }, { weight: 20, progress: 0 }])).toBe(50);
  });

  it("bounds progress values before calculating", () => {
    expect(calculateProjectProgress([{ weight: 50, progress: 150 }, { weight: 50, progress: -10 }])).toBe(50);
  });

  it("requires integer weights that total exactly 100", () => {
    expect(milestoneWeightsAreValid([{ weight: 20 }, { weight: 60 }, { weight: 20 }])).toBe(true);
    expect(milestoneWeightsAreValid([{ weight: 10 }, { weight: 50 }, { weight: 30 }])).toBe(false);
  });
});
