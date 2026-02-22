import fs from "node:fs";
import path from "node:path";

const ALLOWED_CODES = new Set([
  "UNAUTHORIZED",
  "FORBIDDEN",
  "VALIDATION_ERROR",
  "CONFLICT",
  "NOT_FOUND",
]);

const collectRouteFiles = (rootDir: string): string[] => {
  const files: string[] = [];
  const stack = [rootDir];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (entry.isFile() && fullPath.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  }
  return files;
};

describe("API error code standardization", () => {
  it("menggunakan kode error standar pada semua route app/api", () => {
    const apiRoot = path.join(process.cwd(), "app", "api");
    const routeFiles = collectRouteFiles(apiRoot);
    const unknownCodes = new Set<string>();
    const matchedCodes = new Set<string>();

    for (const filePath of routeFiles) {
      const content = fs.readFileSync(filePath, "utf8");
      for (const match of content.matchAll(/jsonError\(\s*"([A-Z_]+)"/g)) {
        const code = match[1];
        matchedCodes.add(code);
        if (!ALLOWED_CODES.has(code)) {
          unknownCodes.add(`${code} @ ${path.relative(process.cwd(), filePath)}`);
        }
      }
    }

    expect(matchedCodes.has("UNAUTHORIZED")).toBe(true);
    expect(matchedCodes.has("FORBIDDEN")).toBe(true);
    expect(matchedCodes.has("VALIDATION_ERROR")).toBe(true);
    expect(matchedCodes.has("CONFLICT")).toBe(true);
    expect(matchedCodes.has("NOT_FOUND")).toBe(true);
    expect(Array.from(unknownCodes)).toEqual([]);
  });
});
