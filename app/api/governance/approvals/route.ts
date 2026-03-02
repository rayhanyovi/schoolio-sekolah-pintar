import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { loadGovernanceReadinessSnapshot } from "@/lib/governance-readiness";

const governanceDecisionSchema = z.enum([
  "Approved",
  "Pending",
  "Deferred",
  "Rejected",
]);

const governanceApprovalPayloadSchema = z
  .object({
    packet: z.enum(["authz", "ops", "decision"]),
    subject: z.string().trim().optional(),
    id: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^TP-DEC-\d{3}$/)
      .optional(),
    decision: governanceDecisionSchema.default("Approved"),
    name: z.string().trim().optional(),
    note: z.string().trim().optional(),
    owner: z.string().trim().optional(),
    dueDate: z.string().trim().optional(),
    date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    actor: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if ((value.packet === "authz" || value.packet === "ops") && !value.subject) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "subject wajib diisi untuk packet authz/ops",
        path: ["subject"],
      });
    }
    if (value.packet === "decision" && !value.id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "id wajib format TP-DEC-XXX untuk packet decision",
        path: ["id"],
      });
    }
  });

const packetPathByType = {
  authz: "AUTHZ_APPROVAL_PACKET.md",
  ops: "OPS_SIGNOFF_PACKET.md",
  decision: "PRODUCT_DECISION_PACKET.md",
} as const;

const normalizeMarkdown = (value: string) => value.replace(/\s+$/, "");

const resolveGovernanceDocPath = (
  rootDir: string,
  filename: string,
  { requireExists = true }: { requireExists?: boolean } = {}
) => {
  const docsPath = path.resolve(rootDir, "docs", filename);
  if (existsSync(docsPath)) return docsPath;

  const rootPath = path.resolve(rootDir, filename);
  if (existsSync(rootPath)) return rootPath;

  if (requireExists) {
    throw new Error(`Governance file not found di docs/ atau root: ${filename}`);
  }

  const docsDir = path.resolve(rootDir, "docs");
  if (existsSync(docsDir)) return docsPath;
  return rootPath;
};

const updateTableRow = ({
  markdown,
  heading,
  matchColumnIndex,
  matchValue,
  mutateColumns,
}: {
  markdown: string;
  heading: string;
  matchColumnIndex: number;
  matchValue: string;
  mutateColumns: (columns: string[]) => void;
}) => {
  const lines = markdown.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.trim() === heading);
  if (headingIndex < 0) {
    throw new Error(`Heading tidak ditemukan: ${heading}`);
  }

  let rowIndex = -1;
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("## ")) break;
    if (!trimmed.startsWith("|")) continue;
    if (/^\|\s*-+\s*\|/.test(trimmed)) continue;

    const columns = trimmed
      .split("|")
      .slice(1, -1)
      .map((column) => column.trim());

    if (columns[matchColumnIndex] !== matchValue) continue;

    mutateColumns(columns);
    lines[index] = `| ${columns.join(" | ")} |`;
    rowIndex = index;
    break;
  }

  if (rowIndex < 0) {
    throw new Error(
      `Row tidak ditemukan di ${heading}: "${matchValue}" pada kolom index ${matchColumnIndex}`
    );
  }

  return lines.join("\n");
};

const ensureHistoryFile = (rootDir: string) => {
  const historyPath = resolveGovernanceDocPath(rootDir, "GOVERNANCE_APPROVAL_HISTORY.md", {
    requireExists: false,
  });
  if (existsSync(historyPath)) return historyPath;

  writeFileSync(
    historyPath,
    [
      "# Governance Approval History",
      "",
      "| Tanggal | Packet | Target | Decision | Actor | Catatan |",
      "|---|---|---|---|---|---|",
      "",
    ].join("\n"),
    "utf8"
  );
  return historyPath;
};

const appendHistoryEntry = ({
  rootDir,
  packet,
  target,
  decision,
  actor,
  note,
  date,
}: {
  rootDir: string;
  packet: string;
  target: string;
  decision: string;
  actor: string;
  note: string;
  date: string;
}) => {
  const historyPath = ensureHistoryFile(rootDir);
  const current = readFileSync(historyPath, "utf8").trimEnd();
  const nextLine = `| ${date || "-"} | ${packet} | ${target} | ${decision} | ${actor || "-"} | ${
    note || "-"
  } |`;
  writeFileSync(historyPath, `${current}\n${nextLine}\n`, "utf8");
};

const runGovernanceScript = (rootDir: string, scriptFile: string, args: string[] = []) => {
  const scriptPath = path.resolve(rootDir, "scripts", scriptFile);
  execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: rootDir,
    stdio: "pipe",
  });
};

const runGovernanceRefresh = (rootDir: string) => {
  runGovernanceScript(rootDir, "governance-sync-techplan.mjs");
  runGovernanceScript(rootDir, "release-readiness-report.mjs", [
    "--warn-only",
    "--write",
  ]);
};

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const parsedBody = await parseJsonBody(request, governanceApprovalPayloadSchema);
  if (parsedBody instanceof Response) return parsedBody;

  const rootDir = process.cwd();
  const packet = parsedBody.packet;
  const targetPath = resolveGovernanceDocPath(rootDir, packetPathByType[packet]);
  const originalMarkdown = readFileSync(targetPath, "utf8");
  const decisionDate = parsedBody.date ?? new Date().toISOString().slice(0, 10);
  const note = parsedBody.note ?? "";
  const approverName = parsedBody.name ?? "";

  let updatedMarkdown = originalMarkdown;
  let targetLabel = "";

  try {
    if (packet === "authz") {
      targetLabel = parsedBody.subject ?? "";
      updatedMarkdown = updateTableRow({
        markdown: updatedMarkdown,
        heading: "## Approval Record",
        matchColumnIndex: 0,
        matchValue: targetLabel,
        mutateColumns: (columns) => {
          if (approverName) columns[1] = approverName;
          columns[2] = parsedBody.decision;
          columns[3] = decisionDate;
          columns[4] = note || columns[4] || "-";
        },
      });
    }

    if (packet === "ops") {
      targetLabel = parsedBody.subject ?? "";
      updatedMarkdown = updateTableRow({
        markdown: updatedMarkdown,
        heading: "## Approval Matrix",
        matchColumnIndex: 0,
        matchValue: targetLabel,
        mutateColumns: (columns) => {
          columns[2] = parsedBody.decision;
          columns[3] = decisionDate;
          const noteWithName = approverName
            ? note
              ? `${approverName}; ${note}`
              : approverName
            : note;
          columns[4] = noteWithName || columns[4] || "-";
        },
      });
    }

    if (packet === "decision") {
      targetLabel = parsedBody.id ?? "";
      updatedMarkdown = updateTableRow({
        markdown: updatedMarkdown,
        heading: "## Ringkasan Status",
        matchColumnIndex: 0,
        matchValue: targetLabel,
        mutateColumns: (columns) => {
          columns[2] = parsedBody.decision;
        },
      });
      updatedMarkdown = updateTableRow({
        markdown: updatedMarkdown,
        heading: "## Approval Record",
        matchColumnIndex: 0,
        matchValue: targetLabel,
        mutateColumns: (columns) => {
          if (parsedBody.owner) columns[1] = parsedBody.owner;
          if (parsedBody.dueDate) columns[2] = parsedBody.dueDate;
          columns[3] = parsedBody.decision;
          columns[4] = decisionDate;
          columns[5] = note || columns[5] || "-";
        },
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(
      "CONFLICT",
      `Gagal memutakhirkan approval packet: ${message}`,
      409
    );
  }

  const changed = normalizeMarkdown(updatedMarkdown) !== normalizeMarkdown(originalMarkdown);
  if (changed) {
    writeFileSync(targetPath, `${updatedMarkdown}\n`, "utf8");
    appendHistoryEntry({
      rootDir,
      packet: packet.toUpperCase(),
      target: targetLabel,
      decision: parsedBody.decision,
      actor: parsedBody.actor ?? auth.userId,
      note,
      date: decisionDate,
    });
  }

  try {
    runGovernanceRefresh(rootDir);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(
      "CONFLICT",
      `Approval berhasil diupdate, tetapi sinkronisasi governance gagal: ${message}`,
      500
    );
  }

  let snapshot;
  try {
    snapshot = await loadGovernanceReadinessSnapshot(rootDir);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(
      "CONFLICT",
      `Approval berhasil diupdate, tetapi gagal memuat readiness snapshot: ${message}`,
      500
    );
  }

  return jsonOk({
    changed,
    packet,
    target: targetLabel,
    decision: parsedBody.decision,
    date: decisionDate,
    snapshot,
  });
}
