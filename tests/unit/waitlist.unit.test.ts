import {
  normalizeWaitlistEmail,
  waitlistSubmitSchema,
} from "@/lib/waitlist";

describe("waitlist helper", () => {
  it("menormalisasi email dengan trim dan lowercase", () => {
    expect(normalizeWaitlistEmail("  Admin@School.SCH.ID  ")).toBe(
      "admin@school.sch.id",
    );
  });

  it("menerima source waitlist yang didukung", () => {
    expect(
      waitlistSubmitSchema.parse({
        email: "school@email.sch.id",
        source: "landing_demo",
      }),
    ).toEqual({
      email: "school@email.sch.id",
      source: "landing_demo",
    });
  });

  it("menolak source waitlist yang tidak dikenal", () => {
    expect(() =>
      waitlistSubmitSchema.parse({
        email: "school@email.sch.id",
        source: "manual_email",
      }),
    ).toThrow();
  });
});
