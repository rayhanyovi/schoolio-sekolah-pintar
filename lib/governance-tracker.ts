import { access, readFile } from "node:fs/promises";
import path from "node:path";

export type GovernanceTrackerTaskPacket = "AUTHZ" | "OPS" | "DECISION";

export type GovernanceTrackerTask = {
  id: string;
  packet: GovernanceTrackerTaskPacket;
  target: string;
  owner: string;
  decision: string;
  decisionDate: string | null;
  dueDate: string | null;
  note: string | null;
  isApproved: boolean;
  isOverdue: boolean;
};

export type GovernanceTrackerPendingByPic = {
  pic: string;
  pending: number;
  overdue: number;
  targets: string[];
};

export type GovernanceTrackerHistoryEntry = {
  date: string | null;
  packet: string;
  target: string;
  decision: string;
  actor: string | null;
  note: string | null;
};

export type GovernanceTrackerSnapshot = {
  generatedAt: string;
  totals: {
    total: number;
    approved: number;
    pending: number;
    overdue: number;
  };
  tasks: GovernanceTrackerTask[];
  overdueTasks: GovernanceTrackerTask[];
  pendingByPic: GovernanceTrackerPendingByPic[];
  recentHistory: GovernanceTrackerHistoryEntry[];
};

const isApproved = (value: string) => /^approved\b/i.test(value.trim());

const toNullableCell = (value: string | undefined): string | null => {
  const normalized = String(value ?? "").trim();
  return normalized && normalized !== "-" ? normalized : null;
};

const normalizeDate = (value: string | null): string | null => {
  if (!value) return null;
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  return normalized;
};

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const isDateOverdue = (dueDate: string | null, baselineDate = todayIsoDate()) => {
  if (!dueDate) return false;
  return dueDate < baselineDate;
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

const parseFirstTableRows = (markdown: string): string[][] => {
  const lines = markdown.split(/\r?\n/);
  const tableStart = lines.findIndex((line) => line.trim().startsWith("|"));
  if (tableStart < 0) return [];

  const rows: string[][] = [];
  for (let index = tableStart; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      if (rows.length > 0) break;
      continue;
    }
    if (!line.startsWith("|")) {
      if (rows.length > 0) break;
      continue;
    }
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

const resolveGovernanceDocPath = async (rootDir: string, filename: string) => {
  const docsPath = path.resolve(rootDir, "docs", filename);
  try {
    await access(docsPath);
    return docsPath;
  } catch {
    // fallback to legacy root path
  }

  const legacyPath = path.resolve(rootDir, filename);
  try {
    await access(legacyPath);
    return legacyPath;
  } catch {
    throw new Error(`Governance file not found di docs/ atau root: ${filename}`);
  }
};

const buildAuthzTasks = (
  authzPacketMarkdown: string,
  baselineDate: string
): GovernanceTrackerTask[] => {
  const rows = parseSectionTableRows(authzPacketMarkdown, "## Approval Record").filter(
    (row) => row[0] !== "Role Approver"
  );
  return rows.map((row) => {
    const target = row[0] ?? "";
    const owner = toNullableCell(row[1]) ?? target;
    const decision = row[2] ?? "Pending";
    const dueDate = null;
    const approved = isApproved(decision);
    return {
      id: `AUTHZ:${target}`,
      packet: "AUTHZ",
      target,
      owner,
      decision,
      decisionDate: normalizeDate(toNullableCell(row[3])),
      dueDate,
      note: toNullableCell(row[4]),
      isApproved: approved,
      isOverdue: !approved && isDateOverdue(dueDate, baselineDate),
    };
  });
};

const buildOpsTasks = (
  opsPacketMarkdown: string,
  baselineDate: string
): GovernanceTrackerTask[] => {
  const rows = parseSectionTableRows(opsPacketMarkdown, "## Approval Matrix").filter(
    (row) => row[0] !== "Stakeholder"
  );
  return rows.map((row) => {
    const target = row[0] ?? "";
    const decision = row[2] ?? "Pending";
    const dueDate = null;
    const approved = isApproved(decision);
    return {
      id: `OPS:${target}`,
      packet: "OPS",
      target,
      owner: target,
      decision,
      decisionDate: normalizeDate(toNullableCell(row[3])),
      dueDate,
      note: toNullableCell(row[4]),
      isApproved: approved,
      isOverdue: !approved && isDateOverdue(dueDate, baselineDate),
    };
  });
};

const buildDecisionTasks = (
  decisionPacketMarkdown: string,
  baselineDate: string
): GovernanceTrackerTask[] => {
  const rows = parseSectionTableRows(
    decisionPacketMarkdown,
    "## Approval Record"
  ).filter((row) => /^TP-DEC-\d{3}$/.test(row[0] ?? ""));

  return rows.map((row) => {
    const target = row[0] ?? "";
    const owner = toNullableCell(row[1]) ?? target;
    const dueDate = normalizeDate(toNullableCell(row[2]));
    const decision = row[3] ?? "Pending";
    const approved = isApproved(decision);
    return {
      id: `DECISION:${target}`,
      packet: "DECISION",
      target,
      owner,
      decision,
      decisionDate: normalizeDate(toNullableCell(row[4])),
      dueDate,
      note: toNullableCell(row[5]),
      isApproved: approved,
      isOverdue: !approved && isDateOverdue(dueDate, baselineDate),
    };
  });
};

const buildHistory = (historyMarkdown: string): GovernanceTrackerHistoryEntry[] => {
  const rows = parseFirstTableRows(historyMarkdown).filter((row) => row[0] !== "Tanggal");
  return rows
    .map((row) => ({
      date: normalizeDate(toNullableCell(row[0])),
      packet: row[1] ?? "-",
      target: row[2] ?? "-",
      decision: row[3] ?? "-",
      actor: toNullableCell(row[4]),
      note: toNullableCell(row[5]),
    }))
    .sort((left, right) => (right.date ?? "").localeCompare(left.date ?? ""));
};

const buildPendingByPic = (tasks: GovernanceTrackerTask[]): GovernanceTrackerPendingByPic[] => {
  const pendingTasks = tasks.filter((task) => !task.isApproved);
  const map = new Map<
    string,
    { pending: number; overdue: number; targets: Set<string> }
  >();

  for (const task of pendingTasks) {
    const key = task.owner || task.target;
    const existing = map.get(key) ?? {
      pending: 0,
      overdue: 0,
      targets: new Set<string>(),
    };
    existing.pending += 1;
    if (task.isOverdue) existing.overdue += 1;
    existing.targets.add(task.target);
    map.set(key, existing);
  }

  return [...map.entries()]
    .map(([pic, value]) => ({
      pic,
      pending: value.pending,
      overdue: value.overdue,
      targets: [...value.targets].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((left, right) => {
      if (right.pending !== left.pending) return right.pending - left.pending;
      if (right.overdue !== left.overdue) return right.overdue - left.overdue;
      return left.pic.localeCompare(right.pic);
    });
};

export const buildGovernanceTrackerSnapshot = ({
  authzPacketMarkdown,
  opsPacketMarkdown,
  decisionPacketMarkdown,
  historyMarkdown,
  baselineDate = todayIsoDate(),
}: {
  authzPacketMarkdown: string;
  opsPacketMarkdown: string;
  decisionPacketMarkdown: string;
  historyMarkdown: string;
  baselineDate?: string;
}): GovernanceTrackerSnapshot => {
  const authzTasks = buildAuthzTasks(authzPacketMarkdown, baselineDate);
  const opsTasks = buildOpsTasks(opsPacketMarkdown, baselineDate);
  const decisionTasks = buildDecisionTasks(decisionPacketMarkdown, baselineDate);
  const tasks = [...authzTasks, ...opsTasks, ...decisionTasks];
  const overdueTasks = tasks.filter((task) => task.isOverdue);
  const approved = tasks.filter((task) => task.isApproved).length;
  const pending = tasks.length - approved;

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      total: tasks.length,
      approved,
      pending,
      overdue: overdueTasks.length,
    },
    tasks,
    overdueTasks,
    pendingByPic: buildPendingByPic(tasks),
    recentHistory: buildHistory(historyMarkdown).slice(0, 20),
  };
};

export const loadGovernanceTrackerSnapshot = async (
  rootDir = process.cwd()
): Promise<GovernanceTrackerSnapshot> => {
  const [authzPath, opsPath, decisionPath, historyPath] = await Promise.all([
    resolveGovernanceDocPath(rootDir, "AUTHZ_APPROVAL_PACKET.md"),
    resolveGovernanceDocPath(rootDir, "OPS_SIGNOFF_PACKET.md"),
    resolveGovernanceDocPath(rootDir, "PRODUCT_DECISION_PACKET.md"),
    resolveGovernanceDocPath(rootDir, "GOVERNANCE_APPROVAL_HISTORY.md"),
  ]);

  const [authzPacketMarkdown, opsPacketMarkdown, decisionPacketMarkdown, historyMarkdown] =
    await Promise.all([
      readFile(authzPath, "utf8"),
      readFile(opsPath, "utf8"),
      readFile(decisionPath, "utf8"),
      readFile(historyPath, "utf8"),
    ]);

  return buildGovernanceTrackerSnapshot({
    authzPacketMarkdown,
    opsPacketMarkdown,
    decisionPacketMarkdown,
    historyMarkdown,
  });
};
