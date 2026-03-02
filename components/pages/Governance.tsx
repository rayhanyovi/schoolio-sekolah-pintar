"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRoleContext } from "@/hooks/useRoleContext";
import {
  getGovernanceReadiness,
  getGovernanceTracker,
  updateGovernanceApproval,
} from "@/lib/handlers/governance";
import {
  getGovernanceDecisionPreset,
  getPresetDueDate,
} from "@/lib/governance-decision-presets";
import { getSystemMetrics } from "@/lib/handlers/metrics";
import {
  GovernanceApprovalDecision,
  GovernanceApprovalPacket,
  GovernanceReadinessSnapshot,
  GovernanceTrackerSnapshot,
  SystemMetricsSummary,
} from "@/lib/schemas";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

type GateKey = "rel001" | "rel005" | "decisionGate";

type GovernanceApprovalForm = {
  packet: GovernanceApprovalPacket;
  subject: string;
  id: string;
  decision: GovernanceApprovalDecision;
  date: string;
  name: string;
  note: string;
  owner: string;
  dueDate: string;
};

const gateMeta: Record<
  GateKey,
  { title: string; description: string }
> = {
  rel001: {
    title: "TP-REL-001",
    description: "P0 completion gate",
  },
  rel005: {
    title: "TP-REL-005",
    description: "SOP stakeholder sign-off gate",
  },
  decisionGate: {
    title: "TP-DEC Gate",
    description: "Keputusan produk lintas stakeholder",
  },
};

const AUTHZ_SUBJECT_OPTIONS = [
  "Product Lead",
  "Engineering Lead",
  "Security/Compliance",
] as const;

const OPS_SUBJECT_OPTIONS = [
  "Kepala Sekolah / Operasional Akademik",
  "Product Owner",
  "Engineering Manager",
  "QA Lead",
] as const;

const DECISION_ID_OPTIONS = [
  "TP-DEC-001",
  "TP-DEC-003",
  "TP-DEC-004",
  "TP-DEC-005",
  "TP-DEC-006",
] as const;

const DECISION_OPTIONS: GovernanceApprovalDecision[] = [
  "Approved",
  "Pending",
  "Deferred",
  "Rejected",
];

export default function Governance() {
  const { role } = useRoleContext();
  const [snapshot, setSnapshot] = useState<GovernanceReadinessSnapshot | null>(
    null
  );
  const [metrics, setMetrics] = useState<SystemMetricsSummary | null>(null);
  const [tracker, setTracker] = useState<GovernanceTrackerSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metricsErrorMessage, setMetricsErrorMessage] = useState<string | null>(
    null
  );
  const [trackerErrorMessage, setTrackerErrorMessage] = useState<string | null>(
    null
  );
  const [approvalForm, setApprovalForm] = useState<GovernanceApprovalForm>({
    packet: "authz",
    subject: AUTHZ_SUBJECT_OPTIONS[0],
    id: DECISION_ID_OPTIONS[0],
    decision: "Approved",
    date: "",
    name: "",
    note: "",
    owner: "",
    dueDate: "",
  });
  const [isUpdatingApproval, setIsUpdatingApproval] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [approvalErrorMessage, setApprovalErrorMessage] = useState<string | null>(
    null
  );
  const [approvalSuccessMessage, setApprovalSuccessMessage] = useState<
    string | null
  >(null);
  const [bulkActionMessage, setBulkActionMessage] = useState<string | null>(null);

  const isAdmin = role === "ADMIN";
  const isApprovalBusy = isUpdatingApproval || isBulkSubmitting;

  const selectedDecisionPreset = useMemo(() => {
    if (approvalForm.packet !== "decision") return null;
    return getGovernanceDecisionPreset(approvalForm.id);
  }, [approvalForm.packet, approvalForm.id]);

  const pendingDecisionIds = useMemo(() => {
    const allowedIds = new Set<string>(DECISION_ID_OPTIONS);
    const trackedPending =
      tracker?.tasks
        .filter(
          (task) =>
            task.packet === "DECISION" &&
            !task.isApproved &&
            allowedIds.has(task.target)
        )
        .map((task) => task.target) ?? [];
    return [...new Set(trackedPending)];
  }, [tracker]);

  const bulkDecisionTargets = useMemo(
    () =>
      pendingDecisionIds.length > 0
        ? pendingDecisionIds
        : [...DECISION_ID_OPTIONS],
    [pendingDecisionIds]
  );

  const applyApprovalPacket = useCallback((packet: GovernanceApprovalPacket) => {
    setApprovalForm((current) => ({
      ...current,
      packet,
      subject:
        packet === "authz"
          ? AUTHZ_SUBJECT_OPTIONS[0]
          : packet === "ops"
          ? OPS_SUBJECT_OPTIONS[0]
          : "",
      id: packet === "decision" ? DECISION_ID_OPTIONS[0] : "",
    }));
  }, []);

  const loadSnapshot = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setMetricsErrorMessage(null);
    setTrackerErrorMessage(null);

    const [governanceResult, metricsResult, trackerResult] = await Promise.allSettled([
      getGovernanceReadiness(),
      getSystemMetrics(),
      getGovernanceTracker(),
    ]);
    if (governanceResult.status === "fulfilled") {
      setSnapshot(governanceResult.value);
    } else {
      const message =
        governanceResult.reason instanceof Error
          ? governanceResult.reason.message
          : "Gagal memuat governance status";
      setErrorMessage(message);
    }
    if (metricsResult.status === "fulfilled") {
      setMetrics(metricsResult.value);
    } else {
      const message =
        metricsResult.reason instanceof Error
          ? metricsResult.reason.message
          : "Gagal memuat metrik upload scan";
      setMetricsErrorMessage(message);
    }
    if (trackerResult.status === "fulfilled") {
      setTracker(trackerResult.value);
    } else {
      const message =
        trackerResult.reason instanceof Error
          ? trackerResult.reason.message
          : "Gagal memuat governance tracker";
      setTrackerErrorMessage(message);
    }

    setIsLoading(false);
  }, []);

  const toPresetAppliedForm = useCallback(
    (form: GovernanceApprovalForm): GovernanceApprovalForm => {
      if (form.packet !== "decision") return form;
      const preset = getGovernanceDecisionPreset(form.id);
      if (!preset) return form;
      return {
        ...form,
        decision: preset.suggestedDecision,
        owner: preset.suggestedOwner,
        note: preset.suggestedNote,
        dueDate: form.dueDate || getPresetDueDate(form.id) || "",
      };
    },
    []
  );

  const submitApproval = useCallback(
    async (
      form: GovernanceApprovalForm,
      {
        successPrefix,
      }: {
        successPrefix?: string;
      } = {}
    ) => {
      setApprovalErrorMessage(null);
      setApprovalSuccessMessage(null);
      setBulkActionMessage(null);
      setIsUpdatingApproval(true);

      const trimmedName = form.name.trim();
      const trimmedNote = form.note.trim();
      const trimmedOwner = form.owner.trim();
      const trimmedDueDate = form.dueDate.trim();
      const trimmedDate = form.date.trim();

      try {
        const result = await updateGovernanceApproval({
          packet: form.packet,
          subject:
            form.packet === "authz" || form.packet === "ops"
              ? form.subject
              : undefined,
          id: form.packet === "decision" ? form.id : undefined,
          decision: form.decision,
          date: trimmedDate || undefined,
          name: trimmedName || undefined,
          note: trimmedNote || undefined,
          owner: form.packet === "decision" ? trimmedOwner || undefined : undefined,
          dueDate: form.packet === "decision" ? trimmedDueDate || undefined : undefined,
        });
        setSnapshot(result.snapshot);
        await loadSnapshot();
        const prefix = successPrefix ? `${successPrefix} ` : "";
        setApprovalSuccessMessage(
          `${prefix}${result.packet.toUpperCase()} ${result.target} diset ke ${result.decision}.`
        );
      } catch (error) {
        setApprovalErrorMessage(
          error instanceof Error
            ? error.message
            : "Gagal memutakhirkan approval governance"
        );
      } finally {
        setIsUpdatingApproval(false);
      }
    },
    [loadSnapshot]
  );

  const applyDecisionPreset = useCallback(() => {
    if (!selectedDecisionPreset) return;
    setApprovalForm((current) => toPresetAppliedForm(current));
    setApprovalErrorMessage(null);
    setApprovalSuccessMessage(
      `Preset ${selectedDecisionPreset.id} diterapkan ke form approval.`
    );
  }, [selectedDecisionPreset, toPresetAppliedForm]);

  const applyAndSubmitDecisionPreset = useCallback(async () => {
    if (!selectedDecisionPreset) return;
    const nextForm = toPresetAppliedForm(approvalForm);
    setApprovalForm(nextForm);
    await submitApproval(nextForm, { successPrefix: "Preset diterapkan." });
  }, [approvalForm, selectedDecisionPreset, submitApproval, toPresetAppliedForm]);

  const submitAllPendingDecisionPresets = useCallback(async () => {
    if (isApprovalBusy) return;

    setApprovalErrorMessage(null);
    setApprovalSuccessMessage(null);
    setBulkActionMessage(null);
    setIsBulkSubmitting(true);

    let successCount = 0;
    const failedTargets: string[] = [];

    for (const targetId of bulkDecisionTargets) {
      const preset = getGovernanceDecisionPreset(targetId);
      if (!preset) {
        failedTargets.push(`${targetId} (preset tidak ditemukan)`);
        continue;
      }

      try {
        await updateGovernanceApproval({
          packet: "decision",
          id: targetId,
          decision: preset.suggestedDecision,
          owner: preset.suggestedOwner,
          note: preset.suggestedNote,
          dueDate: getPresetDueDate(targetId) ?? undefined,
        });
        successCount += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "gagal update approval";
        failedTargets.push(`${targetId} (${message})`);
      }
    }

    await loadSnapshot();

    if (failedTargets.length === 0) {
      setBulkActionMessage(
        `Bulk submit berhasil untuk ${successCount} decision target.`
      );
    } else {
      setApprovalErrorMessage(
        `Bulk submit selesai: ${successCount} berhasil, ${failedTargets.length} gagal.`
      );
      setBulkActionMessage(
        `Target gagal: ${failedTargets.slice(0, 2).join(" | ")}${
          failedTargets.length > 2 ? " | ..." : ""
        }`
      );
    }

    setIsBulkSubmitting(false);
  }, [bulkDecisionTargets, isApprovalBusy, loadSnapshot]);

  const handleApprovalSubmit = useCallback(async () => {
    await submitApproval(approvalForm);
  }, [approvalForm, submitApproval]);

  useEffect(() => {
    if (!isAdmin) return;
    const timer = setTimeout(() => {
      void loadSnapshot();
    }, 0);
    return () => clearTimeout(timer);
  }, [isAdmin, loadSnapshot]);

  const gateCards = useMemo(() => {
    if (!snapshot) return [];
    return (Object.keys(gateMeta) as GateKey[]).map((key) => {
      const gate = snapshot[key];
      return {
        key,
        title: gateMeta[key].title,
        description: gateMeta[key].description,
        ready: gate.ready,
        blockers: gate.blockers,
      };
    });
  }, [snapshot]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Akses Terbatas
          </h2>
          <p className="text-sm text-muted-foreground">
            Hanya Administrator yang dapat mengakses halaman ini
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Governance Readiness</h1>
          <p className="text-muted-foreground">
            Monitor blocker sign-off release dan keputusan produk
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void loadSnapshot()}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {isLoading ? "Memuat..." : "Refresh"}
        </Button>
      </div>

      {errorMessage ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Gagal Memuat Status</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {snapshot?.overallReady ? (
              <ShieldCheck className="h-5 w-5 text-success" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-warning" />
            )}
            Overall Release Readiness
          </CardTitle>
          <CardDescription>
            Snapshot terakhir:{" "}
            {snapshot
              ? new Date(snapshot.generatedAt).toLocaleString("id-ID")
              : "-"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant={snapshot?.overallReady ? "default" : "destructive"}>
            {snapshot?.overallReady ? "READY" : "NOT READY"}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Upload Scan Queue
          </CardTitle>
          <CardDescription>
            Snapshot metrik:{" "}
            {metrics
              ? new Date(metrics.timestamp).toLocaleString("id-ID")
              : "-"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {metricsErrorMessage ? (
            <p className="text-sm text-destructive">{metricsErrorMessage}</p>
          ) : null}
          {metrics?.uploadScanQueue ? (
            <>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    metrics.uploadScanQueue.alertState === "CRITICAL"
                      ? "destructive"
                      : metrics.uploadScanQueue.alertState === "WARNING"
                      ? "secondary"
                      : "default"
                  }
                >
                  {metrics.uploadScanQueue.alertState}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  oldest pending:{" "}
                  {metrics.uploadScanQueue.oldestPendingMinutes === null
                    ? "-"
                    : `${metrics.uploadScanQueue.oldestPendingMinutes} menit`}
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold">
                    {metrics.uploadScanQueue.totalJobs}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg font-semibold">
                    {metrics.uploadScanQueue.pendingJobs}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Failed</p>
                  <p className="text-lg font-semibold">
                    {metrics.uploadScanQueue.failedJobs}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Infected</p>
                  <p className="text-lg font-semibold">
                    {metrics.uploadScanQueue.infectedJobs}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Clean</p>
                  <p className="text-lg font-semibold">
                    {metrics.uploadScanQueue.cleanJobs}
                  </p>
                </div>
              </div>
              {metrics.uploadScanQueue.alerts.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Active Alerts
                  </p>
                  <ul className="space-y-1 text-sm list-disc pl-5">
                    {metrics.uploadScanQueue.alerts.map((alert) => (
                      <li key={alert.code}>
                        <span className="font-medium">{alert.level}</span>{" "}
                        {alert.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-success">Tidak ada alert aktif.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada data metrik.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approval Action</CardTitle>
          <CardDescription>
            Update approval packet governance, lalu sistem otomatis sinkronkan
            `techplan` dan `release readiness`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="governance-packet">Packet</Label>
              <Select
                value={approvalForm.packet}
                onValueChange={(value) =>
                  applyApprovalPacket(value as GovernanceApprovalPacket)
                }
              >
                <SelectTrigger id="governance-packet">
                  <SelectValue placeholder="Pilih packet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="authz">AUTHZ</SelectItem>
                  <SelectItem value="ops">OPS</SelectItem>
                  <SelectItem value="decision">Decision</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {approvalForm.packet === "decision" ? (
              <div className="space-y-2">
                <Label htmlFor="governance-id">Decision ID</Label>
                <Select
                  value={approvalForm.id}
                  onValueChange={(value) =>
                    setApprovalForm((current) => ({ ...current, id: value }))
                  }
                >
                  <SelectTrigger id="governance-id">
                    <SelectValue placeholder="Pilih decision ID" />
                  </SelectTrigger>
                  <SelectContent>
                    {DECISION_ID_OPTIONS.map((id) => (
                      <SelectItem key={id} value={id}>
                        {id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="governance-subject">Approver</Label>
                <Select
                  value={approvalForm.subject}
                  onValueChange={(value) =>
                    setApprovalForm((current) => ({ ...current, subject: value }))
                  }
                >
                  <SelectTrigger id="governance-subject">
                    <SelectValue placeholder="Pilih approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {(approvalForm.packet === "authz"
                      ? AUTHZ_SUBJECT_OPTIONS
                      : OPS_SUBJECT_OPTIONS
                    ).map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="governance-decision">Decision</Label>
              <Select
                value={approvalForm.decision}
                onValueChange={(value) =>
                  setApprovalForm((current) => ({
                    ...current,
                    decision: value as GovernanceApprovalDecision,
                  }))
                }
              >
                <SelectTrigger id="governance-decision">
                  <SelectValue placeholder="Pilih decision" />
                </SelectTrigger>
                <SelectContent>
                  {DECISION_OPTIONS.map((decision) => (
                    <SelectItem key={decision} value={decision}>
                      {decision}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="governance-name">Nama Approver (opsional)</Label>
              <Input
                id="governance-name"
                value={approvalForm.name}
                onChange={(event) =>
                  setApprovalForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Contoh: Rina PM"
              />
            </div>
            {approvalForm.packet === "decision" ? (
              <div className="space-y-2">
                <Label htmlFor="governance-owner">Owner Keputusan (opsional)</Label>
                <Input
                  id="governance-owner"
                  value={approvalForm.owner}
                  onChange={(event) =>
                    setApprovalForm((current) => ({
                      ...current,
                      owner: event.target.value,
                    }))
                  }
                  placeholder="Contoh: Product Akademik + Kurikulum"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="governance-date">Tanggal (opsional)</Label>
                <Input
                  id="governance-date"
                  type="date"
                  value={approvalForm.date}
                  onChange={(event) =>
                    setApprovalForm((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                />
              </div>
            )}
          </div>

          {approvalForm.packet === "decision" ? (
            <div className="space-y-2">
              <Label htmlFor="governance-due-date">Due Date (opsional)</Label>
              <Input
                id="governance-due-date"
                type="date"
                value={approvalForm.dueDate}
                onChange={(event) =>
                  setApprovalForm((current) => ({
                    ...current,
                    dueDate: event.target.value,
                  }))
                }
              />
            </div>
          ) : null}

          {approvalForm.packet === "decision" && selectedDecisionPreset ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    Preset Rekomendasi {selectedDecisionPreset.id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedDecisionPreset.title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={applyDecisionPreset}
                    disabled={isApprovalBusy}
                  >
                    Apply Recommended
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void applyAndSubmitDecisionPreset()}
                    disabled={isApprovalBusy}
                  >
                    Apply + Submit
                  </Button>
                </div>
              </div>
              <p className="text-sm">
                Rekomendasi: {selectedDecisionPreset.recommendation}
              </p>
              <p className="text-xs text-muted-foreground">
                Owner: {selectedDecisionPreset.suggestedOwner} • Decision:{" "}
                {selectedDecisionPreset.suggestedDecision}
              </p>
              <p className="text-xs text-muted-foreground">
                Due date default: {getPresetDueDate(selectedDecisionPreset.id) ?? "-"}
              </p>
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void submitAllPendingDecisionPresets()}
                  disabled={isApprovalBusy}
                >
                  {isBulkSubmitting
                    ? "Bulk processing..."
                    : `Submit All Pending (${bulkDecisionTargets.length})`}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="governance-note">Catatan (opsional)</Label>
            <Textarea
              id="governance-note"
              value={approvalForm.note}
              onChange={(event) =>
                setApprovalForm((current) => ({
                  ...current,
                  note: event.target.value,
                }))
              }
              placeholder="Catatan approval / konteks keputusan"
            />
          </div>

          {approvalErrorMessage ? (
            <p className="text-sm text-destructive">{approvalErrorMessage}</p>
          ) : null}
          {approvalSuccessMessage ? (
            <p className="text-sm text-success">{approvalSuccessMessage}</p>
          ) : null}
          {bulkActionMessage ? (
            <p className="text-sm text-muted-foreground">{bulkActionMessage}</p>
          ) : null}

          <div className="flex justify-end">
            <Button
              onClick={() => void handleApprovalSubmit()}
              disabled={isApprovalBusy}
            >
              {isApprovalBusy ? "Memproses..." : "Submit Approval"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approval SLA Monitor</CardTitle>
          <CardDescription>
            Monitoring pending approval, overdue due date, dan progres sign-off.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {trackerErrorMessage ? (
            <p className="text-sm text-destructive">{trackerErrorMessage}</p>
          ) : null}
          {tracker ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Total {tracker.totals.total}</Badge>
                <Badge variant="default">Approved {tracker.totals.approved}</Badge>
                <Badge variant="secondary">Pending {tracker.totals.pending}</Badge>
                <Badge
                  variant={tracker.totals.overdue > 0 ? "destructive" : "default"}
                >
                  Overdue {tracker.totals.overdue}
                </Badge>
              </div>
              {tracker.overdueTasks.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Overdue Tasks
                  </p>
                  <ul className="space-y-1 text-sm list-disc pl-5">
                    {tracker.overdueTasks.slice(0, 8).map((task) => (
                      <li key={task.id}>
                        <span className="font-medium">{task.target}</span>{" "}
                        ({task.packet}) - due {task.dueDate}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-success">Tidak ada due date yang overdue.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada data tracker.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Blocker per PIC</CardTitle>
            <CardDescription>Distribusi pending approval per owner.</CardDescription>
          </CardHeader>
          <CardContent>
            {tracker?.pendingByPic.length ? (
              <ul className="space-y-2">
                {tracker.pendingByPic.map((item) => (
                  <li
                    key={item.pic}
                    className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{item.pic}</span>
                    <span className="text-muted-foreground">
                      {item.pending} pending / {item.overdue} overdue
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tidak ada blocker per PIC.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Approval History</CardTitle>
            <CardDescription>
              Riwayat approval terbaru dari governance packet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tracker?.recentHistory.length ? (
              <ul className="space-y-2">
                {tracker.recentHistory.slice(0, 8).map((entry, index) => (
                  <li
                    key={`${entry.packet}:${entry.target}:${entry.date ?? "no-date"}:${index}`}
                    className="border rounded-lg px-3 py-2 text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{entry.target}</span>
                      <span className="text-xs text-muted-foreground">
                        {entry.date ?? "-"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.packet} - {entry.decision}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada histori approval.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {gateCards.map((gate) => (
          <Card key={gate.key}>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{gate.title}</CardTitle>
                <Badge variant={gate.ready ? "default" : "secondary"}>
                  {gate.ready ? "Ready" : "Blocked"}
                </Badge>
              </div>
              <CardDescription>{gate.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {gate.blockers.length === 0 ? (
                <div className="text-sm text-success flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Tidak ada blocker
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Blockers
                  </p>
                  <ul className="space-y-1 text-sm text-foreground list-disc pl-5">
                    {gate.blockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
