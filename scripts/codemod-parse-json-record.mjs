import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve("app/api");

const SKIP_FILES = new Set([
  path.resolve("app/api/auth/login/route.ts"),
  path.resolve("app/api/uploads/intents/[id]/content/route.ts"),
]);

const walk = (directory) => {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolutePath));
      continue;
    }
    if (absolutePath.endsWith(".ts")) {
      files.push(absolutePath);
    }
  }
  return files;
};

const ensureApiImport = (source) => {
  const apiImportRegex =
    /import\s*\{([^}]+)\}\s*from\s*"@\/lib\/api";/;
  const match = source.match(apiImportRegex);
  if (!match) return source;
  const imports = match[1];
  if (imports.includes("parseJsonRecordBody")) {
    return source;
  }

  const cleaned = imports
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  cleaned.push("parseJsonRecordBody");
  cleaned.sort((a, b) => a.localeCompare(b));

  const replacement = `import { ${cleaned.join(
    ", "
  )} } from "@/lib/api";`;
  return source.replace(apiImportRegex, replacement);
};

const replaceBodyParsing = (source) => {
  let updated = source;
  const replacements = [
    /const body = await request\.json\(\);/g,
    /const body = \(await request\.json\(\)\) as Record<string, unknown>;/g,
    /const body = await request\.json\(\)\.catch\(\(\) => \(\{\}\)\);/g,
  ];

  for (const pattern of replacements) {
    updated = updated.replace(
      pattern,
      [
        "const parsedRequestBody = await parseJsonRecordBody(request);",
        "  if (parsedRequestBody instanceof Response) return parsedRequestBody;",
        "  const body = parsedRequestBody;",
      ].join("\n")
    );
  }

  return updated;
};

const hasWriteHandler = (source) =>
  /export async function (POST|PATCH|PUT)\b/.test(source);

let updatedFiles = 0;

for (const filePath of walk(ROOT)) {
  if (SKIP_FILES.has(filePath)) continue;

  const source = readFileSync(filePath, "utf8");
  if (!hasWriteHandler(source)) continue;
  if (!source.includes("request.json(")) continue;

  const withReplacedBody = replaceBodyParsing(source);
  if (withReplacedBody === source) continue;

  const withImport = ensureApiImport(withReplacedBody);
  if (withImport !== source) {
    writeFileSync(filePath, withImport, "utf8");
    updatedFiles += 1;
  }
}

console.log(`[codemod] updated files: ${updatedFiles}`);
