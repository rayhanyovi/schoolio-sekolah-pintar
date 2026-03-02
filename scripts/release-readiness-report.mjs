import { readFileSync, writeFileSync } from "node:fs";
import { resolveGovernanceDocPath } from "./governance-doc-paths.mjs";

const args = new Set(process.argv.slice(2));
const warnOnly = args.has("--warn-only");
const shouldWriteReport = args.has("--write");

const ROOT = process.cwd();

const readFile = (relativePath) =>
  readFileSync(resolveGovernanceDocPath(ROOT, relativePath), "utf8");

const toIsoDate = () => new Date().toISOString().slice(0, 10);

const parseChecklistStatus = (markdown) => {
  const status = new Map();
  const checkboxRegex = /^-\s+\[( |x)\]\s+(TP-[A-Z]+-\d{3})\b/gm;
  let match;
  while ((match = checkboxRegex.exec(markdown)) !== null) {
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
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) continue;
    if (trimmed.startsWith("## ")) break;
    if (!trimmed.startsWith("|")) continue;
    if (/^\|\s*-+\s*\|/.test(trimmed)) continue;

    const columns = trimmed
      .split("|")
      .slice(1, -1)
      .map((value) => value.trim());

    if (!columns.length) continue;
    rows.push(columns);
  }

  return rows;
};

const isApproved = (value) => /^approved\b/i.test(value.trim());

const checklistMarkdown = readFile("techplan.md");
const authzPacketMarkdown = readFile("AUTHZ_APPROVAL_PACKET.md");
const opsPacketMarkdown = readFile("OPS_SIGNOFF_PACKET.md");
const decisionPacketMarkdown = readFile("PRODUCT_DECISION_PACKET.md");

const checklist = parseChecklistStatus(checklistMarkdown);

const secIds = [...checklist.keys()].filter((id) => id.startsWith("TP-SEC-"));
const authzIds = [...checklist.keys()].filter((id) =>
  id.startsWith("TP-AUTHZ-")
);
const p0RequiredIds = [
  ...secIds,
  ...authzIds,
  "TP-API-001",
  "TP-PRN-001",
].filter((id, index, list) => list.indexOf(id) === index);

const p0ChecklistBlockers = p0RequiredIds.filter((id) => !checklist.get(id));

const authzApprovalRows = parseSectionTableRows(
  authzPacketMarkdown,
  "## Approval Record"
).filter((row) => row[0] !== "Role Approver");

const authzDecisionByRole = new Map(
  authzApprovalRows.map((row) => [row[0], row[2] ?? ""])
);

const authzRequiredRoles = ["Product Lead", "Engineering Lead"];
const authzApprovalBlockers = authzRequiredRoles.filter(
  (role) => !isApproved(authzDecisionByRole.get(role) ?? "")
);

const opsApprovalRows = parseSectionTableRows(
  opsPacketMarkdown,
  "## Approval Matrix"
).filter((row) => row[0] !== "Stakeholder");

const opsApprovalBlockers = opsApprovalRows
  .filter((row) => !isApproved(row[2] ?? ""))
  .map((row) => row[0]);

const decisionRows = parseSectionTableRows(
  decisionPacketMarkdown,
  "## Ringkasan Status"
).filter((row) => /^TP-DEC-\d{3}$/.test(row[0] ?? ""));

const decisionStatusById = new Map(
  decisionRows.map((row) => [row[0], row[2] ?? ""])
);

const requiredDecisionIds = [
  "TP-DEC-001",
  "TP-DEC-003",
  "TP-DEC-004",
  "TP-DEC-005",
  "TP-DEC-006",
];

const pendingDecisions = requiredDecisionIds.filter(
  (id) => !isApproved(decisionStatusById.get(id) ?? "")
);

const rel001Ready = p0ChecklistBlockers.length === 0 && authzApprovalBlockers.length === 0;
const rel005Ready = opsApprovalBlockers.length === 0;
const decisionGateReady = pendingDecisions.length === 0;
const overallReady = rel001Ready && rel005Ready && decisionGateReady;

const toChecklistLines = (items, formatItem) =>
  items.length
    ? items.map((item) => `- [ ] ${formatItem(item)}`)
    : ["- [x] Tidak ada blocker"];

const reportLines = [
  "# Release Readiness Status",
  "",
  `Tanggal: ${toIsoDate()}`,
  `Overall: ${overallReady ? "READY" : "NOT_READY"}`,
  "",
  "## TP-REL-001 (P0 Completion Gate)",
  `Status: ${rel001Ready ? "READY" : "BLOCKED"}`,
  "",
  "Blocker checklist P0:",
  ...toChecklistLines(p0ChecklistBlockers, (id) => `${id} belum [x] di techplan`),
  "",
  "Blocker approval authz (AUTHZ_APPROVAL_PACKET):",
  ...toChecklistLines(
    authzApprovalBlockers,
    (role) => `${role} belum Approved`
  ),
  "",
  "## TP-REL-005 (SOP Stakeholder Sign-off)",
  `Status: ${rel005Ready ? "READY" : "BLOCKED"}`,
  "",
  "Blocker stakeholder approval SOP:",
  ...toChecklistLines(
    opsApprovalBlockers,
    (stakeholder) => `${stakeholder} belum Approved`
  ),
  "",
  "## TP-DEC Gate",
  `Status: ${decisionGateReady ? "READY" : "BLOCKED"}`,
  "",
  "Keputusan produk yang masih pending:",
  ...toChecklistLines(pendingDecisions, (id) => `${id} belum Approved`),
  "",
];

const report = reportLines.join("\n");
console.log(report);

if (shouldWriteReport) {
  const reportPath = resolveGovernanceDocPath(ROOT, "RELEASE_READINESS_STATUS.md", {
    requireExists: false,
  });
  writeFileSync(
    reportPath,
    `${report}\n`,
    "utf8"
  );
  console.log(`[release-readiness] report ditulis ke ${reportPath}`);
}

if (!overallReady && !warnOnly) {
  process.exit(1);
}
