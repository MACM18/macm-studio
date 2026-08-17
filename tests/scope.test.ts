import { describe, expect, it } from "vitest";
import { paymentMilestonesFromScope } from "../lib/scope";

describe("lead pricing scope", () => {
  it("extracts the existing 10/50/40 payment amounts", () => {
    expect(paymentMilestonesFromScope({ currency: "LKR", milestones: { kickoff: 9000, demo: 45000, handover: 36000 } })).toEqual({ currency: "LKR", kickoff: 9000, demo: 45000, handover: 36000 });
  });

  it("does not trust malformed values", () => {
    expect(paymentMilestonesFromScope({ currency: "LKR", milestones: { kickoff: -1, demo: "45000" } })).toEqual({ currency: "LKR", kickoff: null, demo: null, handover: null });
  });
});
