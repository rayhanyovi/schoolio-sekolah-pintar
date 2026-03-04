import { hashPassword, verifyPassword } from "@/lib/password";

describe("password helper", () => {
  it("menghasilkan salt dan hash dari password", async () => {
    const result = await hashPassword("password-rahasia");

    expect(result.passwordSalt).toBeTruthy();
    expect(result.passwordHash).toBeTruthy();
    expect(result.passwordSalt).not.toBe(result.passwordHash);
  });

  it("memvalidasi password yang benar", async () => {
    const rawPassword = "kata-sandi-kuat";
    const hashed = await hashPassword(rawPassword);

    const verified = await verifyPassword(
      rawPassword,
      hashed.passwordSalt,
      hashed.passwordHash
    );

    expect(verified).toBe(true);
  });

  it("menolak password yang salah", async () => {
    const hashed = await hashPassword("password-benar");

    const verified = await verifyPassword(
      "password-salah",
      hashed.passwordSalt,
      hashed.passwordHash
    );

    expect(verified).toBe(false);
  });
});
