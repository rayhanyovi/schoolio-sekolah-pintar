import type { GovernanceApprovalDecision } from "@/lib/schemas";

export type GovernanceDecisionPreset = {
  id: string;
  title: string;
  recommendation: string;
  suggestedDecision: GovernanceApprovalDecision;
  suggestedOwner: string;
  suggestedNote: string;
  suggestedDueInDays: number;
};

export const governanceDecisionPresets: GovernanceDecisionPreset[] = [
  {
    id: "TP-DEC-001",
    title: "Model Auth Final",
    recommendation: "Hybrid (internal + SSO dengan fallback admin internal).",
    suggestedDecision: "Approved",
    suggestedOwner: "Product + Engineering",
    suggestedNote:
      "Gunakan model hybrid sesuai rekomendasi packet untuk transisi bertahap dan mitigasi lockout.",
    suggestedDueInDays: 14,
  },
  {
    id: "TP-DEC-003",
    title: "Co-teaching/Substitute Grading Authority",
    recommendation: "Owner + delegated dengan audit trail wajib.",
    suggestedDecision: "Approved",
    suggestedOwner: "Product Akademik",
    suggestedNote:
      "Setujui owner + delegated; catat delegationReason, grantedBy, grantedAt di audit.",
    suggestedDueInDays: 10,
  },
  {
    id: "TP-DEC-004",
    title: "Late Submission/Remedial/Resubmission",
    recommendation: "Configurable late window sebagai default v1.",
    suggestedDecision: "Approved",
    suggestedOwner: "Product Akademik + Kurikulum",
    suggestedNote:
      "Setujui configurable late window; remedial terpisah dipertimbangkan di fase berikutnya.",
    suggestedDueInDays: 7,
  },
  {
    id: "TP-DEC-005",
    title: "Policy Rollover Tahun Ajaran",
    recommendation: "Freeze + clone classes untuk fase pilot.",
    suggestedDecision: "Approved",
    suggestedOwner: "Operasional Akademik + Engineering",
    suggestedNote:
      "Setujui freeze + clone classes; promotion otomatis ditunda sampai rule akademik final.",
    suggestedDueInDays: 21,
  },
  {
    id: "TP-DEC-006",
    title: "Data Retention + Export Compliance",
    recommendation: "Regulatory retention dengan tiered policy.",
    suggestedDecision: "Approved",
    suggestedOwner: "Compliance + Product + Engineering",
    suggestedNote:
      "Setujui regulatory retention tiered policy untuk data operasional, akademik final, dan audit log.",
    suggestedDueInDays: 30,
  },
];

const presetById = new Map(governanceDecisionPresets.map((preset) => [preset.id, preset]));

export const getGovernanceDecisionPreset = (id: string) =>
  presetById.get(id) ?? null;

const pad = (value: number) => String(value).padStart(2, "0");

export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const getPresetDueDate = (
  id: string,
  { fromDate = new Date() }: { fromDate?: Date } = {}
) => {
  const preset = getGovernanceDecisionPreset(id);
  if (!preset) return null;
  const dueDate = new Date(fromDate);
  dueDate.setDate(dueDate.getDate() + preset.suggestedDueInDays);
  return toIsoDate(dueDate);
};
