import { access, readFile } from "node:fs/promises";
import path from "node:path";

export type GovernanceReadinessSection = {
  ready: boolean;
  blockers: string[];
};

export type GovernanceReadinessSnapshot = {
  generatedAt: string;
  overallReady: boolean;
  rel001: GovernanceReadinessSection;
  rel005: GovernanceReadinessSection;
  decisionGate: GovernanceReadinessSection;
};

type ChecklistStatusMap = Map<string, boolean>;

const isApproved = (value: string) => /^approved\b/i.test(value.trim());

const parseChecklistStatus = (markdown: string): ChecklistStatusMap => {
  const status = new Map<string, boolean>();
  const checkboxRegex = /^-\s+\[( |x)\]\s+(TP-[A-Z]+-\d{3})\b/gm;
  let match: RegExpExecArray | null;
  while ((match = checkboxRegex.exec(markdown)) !== null) {
    status.set(match[2], match[1] === "x");
  }
  return status;
};

const parseSectionTableRows = (markdown: string, heading: string): string[][] => {
  const lines = markdown.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.trim() === heading);
  if (headingIndex < 0) return [];

  const rows: string[][] = [];
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;
    if (line.startsWith("## ")) break;
    if (!line.startsWith("|")) continue;
    if (/^\|\s*-+\s*\|/.test(line)) continue;
    rows.push(
      line
        .split("|")
        .slice(1, -1)
        .map((value) => value.trim())
    );
  }
  return rows;
};

const unique = (values: string[]) => [...new Set(values)];

const resolveGovernanceDocPath = async (rootDir: string, filename: string) => {
  const docsPath = path.resolve(rootDir, "docs", filename);
  try {
    await access(docsPath);
    return docsPath;
  } catch {
    // fallback to legacy root location
  }

  const legacyPath = path.resolve(rootDir, filename);
  try {
    await access(legacyPath);
    return legacyPath;
  } catch {
    throw new Error(
      `Governance file not found di docs/ atau root: ${filename}`
    );
  }
};

export const buildGovernanceReadinessSnapshot = ({
  techplanMarkdown,
  authzPacketMarkdown,
  opsPacketMarkdown,
  decisionPacketMarkdown,
}: {
  techplanMarkdown: string;
  authzPacketMarkdown: string;
  opsPacketMarkdown: string;
  decisionPacketMarkdown: string;
}): GovernanceReadinessSnapshot => {
  const checklist = parseChecklistStatus(techplanMarkdown);

  const secIds = [...checklist.keys()].filter((id) => id.startsWith("TP-SEC-"));
  const authzIds = [...checklist.keys()].filter((id) => id.startsWith("TP-AUTHZ-"));
  const p0RequiredIds = unique([...secIds, ...authzIds, "TP-API-001", "TP-PRN-001"]);
  const p0ChecklistBlockers = p0RequiredIds.filter((id) => !checklist.get(id));

  const authzApprovalRows = parseSectionTableRows(
    authzPacketMarkdown,
    "## Approval Record"
  ).filter((row) => row[0] !== "Role Approver");
  const authzDecisionByRole = new Map(
    authzApprovalRows.map((row) => [row[0], row[2] ?? ""])
  );
  const authzApprovalBlockers = ["Product Lead", "Engineering Lead"].filter(
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
  const decisionIds = [
    "TP-DEC-001",
    "TP-DEC-003",
    "TP-DEC-004",
    "TP-DEC-005",
    "TP-DEC-006",
  ];
  const pendingDecisions = decisionIds.filter(
    (id) => !isApproved(decisionStatusById.get(id) ?? "")
  );

  const rel001Blockers = [...p0ChecklistBlockers, ...authzApprovalBlockers];
  const rel005Blockers = opsApprovalBlockers;
  const decisionBlockers = pendingDecisions;

  const rel001Ready = rel001Blockers.length === 0;
  const rel005Ready = rel005Blockers.length === 0;
  const decisionReady = decisionBlockers.length === 0;
  const overallReady = rel001Ready && rel005Ready && decisionReady;

  return {
    generatedAt: new Date().toISOString(),
    overallReady,
    rel001: {
      ready: rel001Ready,
      blockers: rel001Blockers,
    },
    rel005: {
      ready: rel005Ready,
      blockers: rel005Blockers,
    },
    decisionGate: {
      ready: decisionReady,
      blockers: decisionBlockers,
    },
  };
};

export const loadGovernanceReadinessSnapshot = async (
  rootDir = process.cwd()
): Promise<GovernanceReadinessSnapshot> => {
  const [techplanPath, authzPath, opsPath, decisionPath] = await Promise.all([
    resolveGovernanceDocPath(rootDir, "techplan.md"),
    resolveGovernanceDocPath(rootDir, "AUTHZ_APPROVAL_PACKET.md"),
    resolveGovernanceDocPath(rootDir, "OPS_SIGNOFF_PACKET.md"),
    resolveGovernanceDocPath(rootDir, "PRODUCT_DECISION_PACKET.md"),
  ]);

  const [techplanMarkdown, authzPacketMarkdown, opsPacketMarkdown, decisionPacketMarkdown] =
    await Promise.all([
      readFile(techplanPath, "utf8"),
      readFile(authzPath, "utf8"),
      readFile(opsPath, "utf8"),
      readFile(decisionPath, "utf8"),
    ]);

  return buildGovernanceReadinessSnapshot({
    techplanMarkdown,
    authzPacketMarkdown,
    opsPacketMarkdown,
    decisionPacketMarkdown,
  });
};
