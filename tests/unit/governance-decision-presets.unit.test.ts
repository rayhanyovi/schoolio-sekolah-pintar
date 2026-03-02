import {
  getGovernanceDecisionPreset,
  getPresetDueDate,
  governanceDecisionPresets,
} from "@/lib/governance-decision-presets";

describe("governance decision presets", () => {
  it("menyediakan preset untuk seluruh TP-DEC yang masih pending", () => {
    const presetIds = new Set(governanceDecisionPresets.map((preset) => preset.id));
    expect(presetIds).toEqual(
      new Set([
        "TP-DEC-001",
        "TP-DEC-003",
        "TP-DEC-004",
        "TP-DEC-005",
        "TP-DEC-006",
      ])
    );
    for (const preset of governanceDecisionPresets) {
      expect(preset.recommendation.length).toBeGreaterThan(0);
      expect(preset.suggestedOwner.length).toBeGreaterThan(0);
      expect(preset.suggestedNote.length).toBeGreaterThan(0);
      expect(preset.suggestedDueInDays).toBeGreaterThan(0);
    }
  });

  it("mengembalikan null untuk ID yang tidak memiliki preset", () => {
    expect(getGovernanceDecisionPreset("TP-DEC-999")).toBeNull();
  });

  it("menghitung default due date berdasarkan offset preset", () => {
    const dueDate = getPresetDueDate("TP-DEC-004", {
      fromDate: new Date("2026-03-02T00:00:00.000Z"),
    });
    expect(dueDate).toBe("2026-03-09");
  });
});
