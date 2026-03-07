import {
  PASSWORD_RESET_TTL_MINUTES,
  generatePasswordResetToken,
  getPasswordResetExpiry,
  hashPasswordResetToken,
  isPasswordResetTokenExpired,
} from "@/lib/password-reset";

describe("password reset helpers", () => {
  it("membuat token acak dan hash deterministik", () => {
    const tokenA = generatePasswordResetToken();
    const tokenB = generatePasswordResetToken();

    expect(tokenA).not.toEqual(tokenB);
    expect(hashPasswordResetToken(tokenA)).toEqual(hashPasswordResetToken(tokenA));
    expect(hashPasswordResetToken(tokenA)).not.toEqual(hashPasswordResetToken(tokenB));
  });

  it("menghitung expiry sesuai TTL", () => {
    const base = new Date("2026-03-07T00:00:00.000Z");
    const expiresAt = getPasswordResetExpiry(base);
    const diffMs = expiresAt.getTime() - base.getTime();
    expect(diffMs).toBe(PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
  });

  it("mengevaluasi token expired", () => {
    const now = new Date("2026-03-07T00:30:00.000Z");
    expect(
      isPasswordResetTokenExpired(new Date("2026-03-07T00:29:59.000Z"), now)
    ).toBe(true);
    expect(
      isPasswordResetTokenExpired(new Date("2026-03-07T00:30:01.000Z"), now)
    ).toBe(false);
  });
});
