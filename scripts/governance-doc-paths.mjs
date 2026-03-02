import { existsSync } from "node:fs";
import path from "node:path";

const DOCS_DIR = "docs";

const resolveRootPath = (rootDir, filename) =>
  path.resolve(rootDir, filename);

const resolveDocsPath = (rootDir, filename) =>
  path.resolve(rootDir, DOCS_DIR, filename);

export const resolveGovernanceDocPath = (
  rootDir,
  filename,
  { requireExists = true } = {}
) => {
  const docsPath = resolveDocsPath(rootDir, filename);
  if (existsSync(docsPath)) return docsPath;

  const rootPath = resolveRootPath(rootDir, filename);
  if (existsSync(rootPath)) return rootPath;

  if (requireExists) {
    throw new Error(
      `[governance-doc-paths] File tidak ditemukan di docs/ atau root: ${filename}`
    );
  }

  if (existsSync(path.resolve(rootDir, DOCS_DIR))) {
    return docsPath;
  }

  return rootPath;
};

