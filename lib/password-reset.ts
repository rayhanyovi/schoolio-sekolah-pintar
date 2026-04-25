import { createHash, randomBytes } from "node:crypto";

export const PASSWORD_RESET_TTL_MINUTES = 30;

export const generatePasswordResetToken = () => randomBytes(32).toString("hex");

export const hashPasswordResetToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const getPasswordResetExpiry = (from = new Date()) => {
  const expiresAt = new Date(from);
  expiresAt.setMinutes(expiresAt.getMinutes() + PASSWORD_RESET_TTL_MINUTES);
  return expiresAt;
};

export const isPasswordResetTokenExpired = (
  expiresAt: Date,
  now: Date = new Date()
) => expiresAt.getTime() <= now.getTime();
