import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { POST as postGovernanceApproval } from "@/app/api/governance/approvals/route";
import { requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { loadGovernanceReadinessSnapshot } from "@/lib/governance-readiness";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireAuth: vi.fn(),
    requireRole: vi.fn(),
  };
});

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

vi.mock("@/lib/governance-readiness", () => ({
  loadGovernanceReadinessSnapshot: vi.fn(),
}));

const authzPacketTemplate = `# Authorization Approval Packet

## Approval Record

| Role Approver | Nama | Keputusan | Tanggal | Catatan |
|---|---|---|---|---|
| Product Lead | - | Pending | - | - |
| Engineering Lead | - | Pending | - | - |
| Security/Compliance | - | Pending | - | - |
`;

describe("POST /api/governance/approvals", () => {
  const originalCwd = process.cwd();
  let tempRoot = "";

  beforeEach(() => {
    vi.resetAllMocks();
    tempRoot = mkdtempSync(path.join(tmpdir(), "governance-approvals-"));
    mkdirSync(path.join(tempRoot, "docs"), { recursive: true });
    mkdirSync(path.join(tempRoot, "scripts"), { recursive: true });
    writeFileSync(
      path.join(tempRoot, "docs", "AUTHZ_APPROVAL_PACKET.md"),
      authzPacketTemplate,
      "utf8"
    );
    process.chdir(tempRoot);

    vi.mocked(requireAuth).mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    vi.mocked(requireRole).mockReturnValue(null);
    vi.mocked(loadGovernanceReadinessSnapshot).mockResolvedValue({
      generatedAt: "2026-03-02T00:00:00.000Z",
      overallReady: false,
      rel001: { ready: false, blockers: ["TP-AUTHZ-001"] },
      rel005: { ready: false, blockers: ["Product Owner"] },
      decisionGate: { ready: false, blockers: ["TP-DEC-001"] },
    } as never);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("mengupdate authz packet, menulis history, dan menjalankan refresh script", async () => {
    const response = await postGovernanceApproval(
      new Request("http://localhost/api/governance/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packet: "authz",
          subject: "Product Lead",
          decision: "Approved",
          name: "Rina PM",
          note: "Matrix sesuai pilot",
          date: "2026-03-02",
        }),
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.packet).toBe("authz");
    expect(payload.data.target).toBe("Product Lead");
    expect(payload.data.decision).toBe("Approved");

    const updatedPacket = readFileSync(
      path.join(tempRoot, "docs", "AUTHZ_APPROVAL_PACKET.md"),
      "utf8"
    );
    expect(updatedPacket).toContain(
      "| Product Lead | Rina PM | Approved | 2026-03-02 | Matrix sesuai pilot |"
    );

    const history = readFileSync(
      path.join(tempRoot, "docs", "GOVERNANCE_APPROVAL_HISTORY.md"),
      "utf8"
    );
    expect(history).toContain(
      "| 2026-03-02 | AUTHZ | Product Lead | Approved | admin-1 | Matrix sesuai pilot |"
    );

    expect(execFileSync).toHaveBeenCalledTimes(2);
  });

  it("mengembalikan validation error untuk payload decision tanpa id", async () => {
    const response = await postGovernanceApproval(
      new Request("http://localhost/api/governance/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packet: "decision",
          decision: "Approved",
        }),
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(payload.error.message).toContain("id wajib format TP-DEC-XXX");
    expect(execFileSync).not.toHaveBeenCalled();
  });
});
