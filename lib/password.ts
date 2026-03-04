import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SALT_BYTES = 16;
const DERIVED_KEY_BYTES = 64;

const toHex = (value: Buffer | Uint8Array) => Buffer.from(value).toString("hex");

export const hashPassword = async (password: string) => {
  const salt = randomBytes(SALT_BYTES);
  const derived = (await scrypt(password, salt, DERIVED_KEY_BYTES)) as Buffer;
  return {
    passwordSalt: toHex(salt),
    passwordHash: toHex(derived),
  };
};

export const verifyPassword = async (
  password: string,
  passwordSalt: string,
  passwordHash: string
) => {
  try {
    const salt = Buffer.from(passwordSalt, "hex");
    const expected = Buffer.from(passwordHash, "hex");
    const derived = (await scrypt(password, salt, expected.length)) as Buffer;
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
};
