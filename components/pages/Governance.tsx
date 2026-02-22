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
import { useRoleContext } from "@/hooks/useRoleContext";
import { getGovernanceReadiness } from "@/lib/handlers/governance";
import { GovernanceReadinessSnapshot } from "@/lib/schemas";
import { CheckCircle2, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";

type GateKey = "rel001" | "rel005" | "decisionGate";

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

export default function Governance() {
  const { role } = useRoleContext();
  const [snapshot, setSnapshot] = useState<GovernanceReadinessSnapshot | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAdmin = role === "ADMIN";

  const loadSnapshot = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const nextSnapshot = await getGovernanceReadiness();
      setSnapshot(nextSnapshot);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat governance status";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void loadSnapshot();
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
