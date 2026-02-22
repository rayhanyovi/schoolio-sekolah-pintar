import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_OBJECT_STORAGE_ROOT = ".tmp/object-storage";

const normalizeKey = (storageKey: string) =>
  storageKey.replaceAll("\\", "/").replace(/^\/+/, "");

const ensureSafePath = (absolutePath: string, root: string) => {
  const normalizedRoot = path.resolve(root);
  const normalizedPath = path.resolve(absolutePath);
  if (!normalizedPath.startsWith(normalizedRoot)) {
    throw new Error("storageKey berada di luar root object storage");
  }
};

export const getObjectStorageRoot = () =>
  path.resolve(
    process.env.OBJECT_STORAGE_ROOT?.trim() || DEFAULT_OBJECT_STORAGE_ROOT
  );

export const getObjectStoragePath = (storageKey: string) => {
  const safeKey = normalizeKey(storageKey);
  const root = getObjectStorageRoot();
  const absolutePath = path.join(root, safeKey);
  ensureSafePath(absolutePath, root);
  return absolutePath;
};

export const putObject = async (storageKey: string, payload: Buffer) => {
  const absolutePath = getObjectStoragePath(storageKey);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, payload);
};

export const readObject = async (storageKey: string) => {
  const absolutePath = getObjectStoragePath(storageKey);
  return fs.readFile(absolutePath);
};

export const statObject = async (storageKey: string) => {
  const absolutePath = getObjectStoragePath(storageKey);
  return fs.stat(absolutePath);
};

export const computeSha256 = (payload: Buffer) =>
  createHash("sha256").update(payload).digest("hex");
