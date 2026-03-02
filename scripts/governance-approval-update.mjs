import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { resolveGovernanceDocPath } from "./governance-doc-paths.mjs";

const ALLOWED_DECISIONS = new Set(["Approved", "Pending", "Deferred", "Rejected"]);

const normalizeArgValue = (value) =>
  String(value ?? "")
    .trim()
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "");

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }

    const chunks = [];
    let cursor = index + 1;
    while (cursor < argv.length && !argv[cursor].startsWith("--")) {
      chunks.push(argv[cursor]);
      cursor += 1;
    }
    args[key] = normalizeArgValue(chunks.join(" "));
    index = cursor - 1;
  }
  return args;
};

const args = parseArgs(process.argv.slice(2));

const packet = String(args.packet ?? "").trim().toLowerCase();
const subject = String(args.subject ?? "").trim();
const id = String(args.id ?? "").trim().toUpperCase();
const decision = String(args.decision ?? "Approved").trim();
const name = String(args.name ?? "").trim();
const note = String(args.note ?? "").trim();
const owner = String(args.owner ?? "").trim();
const dueDate = String(args["due-date"] ?? "").trim();
const date = String(args.date ?? new Date().toISOString().slice(0, 10)).trim();
const actor = String(args.actor ?? "SYSTEM").trim();
const dryRun = Boolean(args["dry-run"]);

if (!ALLOWED_DECISIONS.has(decision)) {
  console.error(
    `[governance-approval-update] --decision harus salah satu: ${[
      ...ALLOWED_DECISIONS,
    ].join(", ")}`
  );
  process.exit(1);
}

const packetPathByType = {
  authz: "AUTHZ_APPROVAL_PACKET.md",
  ops: "OPS_SIGNOFF_PACKET.md",
  decision: "PRODUCT_DECISION_PACKET.md",
};

if (!packetPathByType[packet]) {
  console.error(
    "[governance-approval-update] --packet wajib: authz | ops | decision"
  );
  process.exit(1);
}

if ((packet === "authz" || packet === "ops") && !subject) {
  console.error(
    "[governance-approval-update] --subject wajib untuk packet authz/ops"
  );
  process.exit(1);
}

if (packet === "decision" && !/^TP-DEC-\d{3}$/.test(id)) {
  console.error(
    "[governance-approval-update] --id wajib format TP-DEC-XXX untuk packet decision"
  );
  process.exit(1);
}

const updateTableRow = ({
  markdown,
  heading,
  matchColumnIndex,
  matchValue,
  mutateColumns,
}) => {
  const lines = markdown.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.trim() === heading);
  if (headingIndex < 0) {
    throw new Error(`Heading tidak ditemukan: ${heading}`);
  }

  let rowIndex = -1;
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

const rootDir = process.cwd();
const targetPath = resolveGovernanceDocPath(
  rootDir,
  packetPathByType[packet]
);
const originalMarkdown = readFileSync(targetPath, "utf8");
let updatedMarkdown = originalMarkdown;

const ensureHistoryFile = () => {
  const historyPath = resolveGovernanceDocPath(
    rootDir,
    "GOVERNANCE_APPROVAL_HISTORY.md",
    { requireExists: false }
  );
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
  packetType,
  target,
  decisionValue,
  actorValue,
  noteValue,
  dateValue,
}) => {
  const historyPath = ensureHistoryFile();
  const nextMarkdown = `${readFileSync(historyPath, "utf8").trimEnd()}\n| ${
    dateValue || "-"
  } | ${packetType} | ${target} | ${decisionValue} | ${actorValue || "-"} | ${
    noteValue || "-"
  } |\n`;
  writeFileSync(historyPath, nextMarkdown, "utf8");
};

if (packet === "authz") {
  updatedMarkdown = updateTableRow({
    markdown: updatedMarkdown,
    heading: "## Approval Record",
    matchColumnIndex: 0,
    matchValue: subject,
    mutateColumns: (columns) => {
      if (name) columns[1] = name;
      columns[2] = decision;
      columns[3] = date;
      columns[4] = note || columns[4] || "-";
    },
  });
}

if (packet === "ops") {
  updatedMarkdown = updateTableRow({
    markdown: updatedMarkdown,
    heading: "## Approval Matrix",
    matchColumnIndex: 0,
    matchValue: subject,
    mutateColumns: (columns) => {
      columns[2] = decision;
      columns[3] = date;
      const noteWithName = name
        ? note
          ? `${name}; ${note}`
          : name
        : note;
      columns[4] = noteWithName || columns[4] || "-";
    },
  });
}

if (packet === "decision") {
  updatedMarkdown = updateTableRow({
    markdown: updatedMarkdown,
    heading: "## Ringkasan Status",
    matchColumnIndex: 0,
    matchValue: id,
    mutateColumns: (columns) => {
      columns[2] = decision;
    },
  });

  updatedMarkdown = updateTableRow({
    markdown: updatedMarkdown,
    heading: "## Approval Record",
    matchColumnIndex: 0,
    matchValue: id,
    mutateColumns: (columns) => {
      if (owner) columns[1] = owner;
      if (dueDate) columns[2] = dueDate;
      columns[3] = decision;
      columns[4] = date;
      columns[5] = note || columns[5] || "-";
    },
  });
}

if (updatedMarkdown === originalMarkdown) {
  console.log("[governance-approval-update] tidak ada perubahan");
  process.exit(0);
}

if (dryRun) {
  console.log("[governance-approval-update] dry run (tanpa write)");
  process.exit(0);
}

writeFileSync(targetPath, `${updatedMarkdown}\n`, "utf8");
console.log(
  `[governance-approval-update] updated ${path.basename(targetPath)}: ${
    packet === "decision" ? id : subject
  } -> ${decision}`
);

appendHistoryEntry({
  packetType: packet.toUpperCase(),
  target: packet === "decision" ? id : subject,
  decisionValue: decision,
  actorValue: actor,
  noteValue: note,
  dateValue: date,
});
