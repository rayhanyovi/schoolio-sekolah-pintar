import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEFAULT_PARTS = 3;
const DEFAULT_PART_LENGTH = 4;

const randomCodePart = (length: number) => {
  const bytes = randomBytes(length);
  let result = "";
  for (let index = 0; index < length; index += 1) {
    const charIndex = bytes[index] % CODE_ALPHABET.length;
    result += CODE_ALPHABET[charIndex];
  }
  return result;
};

export const normalizeParentInviteCode = (value: string) =>
  value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

export const generateParentInviteCode = (
  partCount = DEFAULT_PARTS,
  partLength = DEFAULT_PART_LENGTH
) => {
  const parts: string[] = [];
  for (let index = 0; index < partCount; index += 1) {
    parts.push(randomCodePart(partLength));
  }
  return parts.join("-");
};

export const hashParentInviteCode = (rawCode: string) =>
  createHash("sha256")
    .update(normalizeParentInviteCode(rawCode))
    .digest("hex");

export const verifyParentInviteCodeHash = (
  rawCode: string,
  expectedHash: string
) => {
  try {
    const actual = Buffer.from(hashParentInviteCode(rawCode), "hex");
    const expected = Buffer.from(expectedHash, "hex");
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
};

export const isParentInviteExpired = (
  expiresAt: Date,
  now: Date = new Date()
) => expiresAt.getTime() <= now.getTime();

