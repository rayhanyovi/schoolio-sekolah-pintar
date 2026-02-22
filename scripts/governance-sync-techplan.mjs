import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const dryRun = args.has("--dry-run");

const isApproved = (value) => /^approved\b/i.test(String(value ?? "").trim());

const parseChecklistStatus = (markdown) => {
  const status = new Map();
  const regex = /^-\s+\[( |x)\]\s+(TP-[A-Z]+-\d{3})\b/gm;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    status.set(match[2], match[1] === "x");
  }
  return status;
};

const parseSectionTableRows = (markdown, heading) => {
  const lines = markdown.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.trim() === heading);
  if (headingIndex < 0) return [];

  const rows = [];
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("## ")) break;
    if (!trimmed.startsWith("|")) continue;
    if (/^\|\s*-+\s*\|/.test(trimmed)) continue;

    rows.push(
      trimmed
        .split("|")
        .slice(1, -1)
        .map((value) => value.trim())
    );
  }

  return rows;
};

const setChecklistValue = (markdown, id, checked) => {
  const regex = new RegExp(`(^-\\s+\\[)(?: |x)(\\]\\s+${id}\\b)`, "m");
  if (!regex.test(markdown)) return markdown;
  return markdown.replace(regex, `$1${checked ? "x" : " "}$2`);
};

const techplanPath = path.resolve(process.cwd(), "techplan.md");
const authzPath = path.resolve(process.cwd(), "AUTHZ_APPROVAL_PACKET.md");
const opsPath = path.resolve(process.cwd(), "OPS_SIGNOFF_PACKET.md");
const decisionPath = path.resolve(process.cwd(), "PRODUCT_DECISION_PACKET.md");

const techplanOriginal = readFileSync(techplanPath, "utf8");
const authzMarkdown = readFileSync(authzPath, "utf8");
const opsMarkdown = readFileSync(opsPath, "utf8");
const decisionMarkdown = readFileSync(decisionPath, "utf8");

const checklist = parseChecklistStatus(techplanOriginal);

const authzRows = parseSectionTableRows(authzMarkdown, "## Approval Record").filter(
  (row) => row[0] !== "Role Approver"
);
const authzDecisionByRole = new Map(authzRows.map((row) => [row[0], row[2] ?? ""]));
const authzApproved =
  isApproved(authzDecisionByRole.get("Product Lead")) &&
  isApproved(authzDecisionByRole.get("Engineering Lead"));

const opsRows = parseSectionTableRows(opsMarkdown, "## Approval Matrix").filter(
  (row) => row[0] !== "Stakeholder"
);
const rel005Approved = opsRows.length > 0 && opsRows.every((row) => isApproved(row[2]));

const decisionRows = parseSectionTableRows(
  decisionMarkdown,
  "## Ringkasan Status"
).filter((row) => /^TP-DEC-\d{3}$/.test(row[0] ?? ""));
const decisionStatusById = new Map(decisionRows.map((row) => [row[0], row[2] ?? ""]));

const techplanDerived = new Map(checklist);
techplanDerived.set("TP-AUTHZ-001", authzApproved);
techplanDerived.set("TP-REL-005", rel005Approved);

const decisionIds = [
  "TP-DEC-001",
  "TP-DEC-003",
  "TP-DEC-004",
  "TP-DEC-005",
  "TP-DEC-006",
];

for (const id of decisionIds) {
  techplanDerived.set(id, isApproved(decisionStatusById.get(id)));
}

const secIds = [...techplanDerived.keys()].filter((id) => id.startsWith("TP-SEC-"));
const authzIds = [...techplanDerived.keys()].filter((id) =>
  id.startsWith("TP-AUTHZ-")
);
const p0RequiredIds = [...new Set([...secIds, ...authzIds, "TP-API-001", "TP-PRN-001"])];
const rel001Approved = p0RequiredIds.every((id) => techplanDerived.get(id));
techplanDerived.set("TP-REL-001", rel001Approved);

let techplanUpdated = techplanOriginal;
for (const id of ["TP-AUTHZ-001", "TP-REL-001", "TP-REL-005", ...decisionIds]) {
  techplanUpdated = setChecklistValue(techplanUpdated, id, techplanDerived.get(id));
}

if (techplanUpdated === techplanOriginal) {
  console.log("[governance-sync-techplan] tidak ada perubahan status checklist");
  process.exit(0);
}

if (checkOnly) {
  console.error(
    "[governance-sync-techplan] out-of-sync: jalankan `npm run governance:sync-techplan` dan commit perubahan techplan"
  );
  process.exit(1);
}

if (dryRun) {
  console.log("[governance-sync-techplan] dry run (tanpa write)");
  process.exit(0);
}

writeFileSync(techplanPath, `${techplanUpdated}\n`, "utf8");
console.log("[governance-sync-techplan] techplan checklist berhasil disinkronkan");
