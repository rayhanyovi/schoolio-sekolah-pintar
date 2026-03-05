import {
  generateParentInviteCode,
  hashParentInviteCode,
  isParentInviteExpired,
  verifyParentInviteCodeHash,
} from "@/lib/parent-invite-code";

describe("parent invite code helper", () => {
  it("menghasilkan kode invite dengan format tersegmentasi", () => {
    const code = generateParentInviteCode();
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("memvalidasi hash kode yang benar", () => {
    const code = "ABCD-EFGH-JKLM";
    const hash = hashParentInviteCode(code);
    expect(verifyParentInviteCodeHash(code, hash)).toBe(true);
    expect(verifyParentInviteCodeHash("XXXX-YYYY-ZZZZ", hash)).toBe(false);
  });

  it("mengevaluasi status kadaluarsa dengan benar", () => {
    const now = new Date("2026-03-05T10:00:00.000Z");
    expect(isParentInviteExpired(new Date("2026-03-05T09:59:59.000Z"), now)).toBe(true);
    expect(isParentInviteExpired(new Date("2026-03-05T10:00:01.000Z"), now)).toBe(false);
  });
});

