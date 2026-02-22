import { buildGovernanceReadinessSnapshot } from "@/lib/governance-readiness";

describe("governance readiness snapshot", () => {
  it("menghitung status gate berdasarkan checklist dan approval packet", () => {
    const techplanMarkdown = `
- [x] TP-SEC-001 desc
- [x] TP-SEC-002 desc
- [ ] TP-AUTHZ-001 desc
- [x] TP-AUTHZ-002 desc
- [x] TP-API-001 desc
- [x] TP-PRN-001 desc
`.trim();

    const authzPacketMarkdown = `
## Approval Record
| Role Approver | Nama | Keputusan | Tanggal | Catatan |
|---|---|---|---|---|
| Product Lead | A | Approved | 2026-02-22 | ok |
| Engineering Lead | B | Pending | 2026-02-22 | menunggu |
| Security/Compliance | C | Pending | 2026-02-22 | menunggu |
`.trim();

    const opsPacketMarkdown = `
## Approval Matrix
| Stakeholder | Area | Keputusan | Tanggal | Catatan |
|---|---|---|---|---|
| Kepala Sekolah / Operasional Akademik | X | Approved | 2026-02-22 | ok |
| Product Owner | X | Approved | 2026-02-22 | ok |
| Engineering Manager | X | Approved | 2026-02-22 | ok |
| QA Lead | X | Approved | 2026-02-22 | ok |
`.trim();

    const decisionPacketMarkdown = `
## Ringkasan Status
| ID | Keputusan | Status |
|---|---|---|
| TP-DEC-001 | A | Approved |
| TP-DEC-002 | B | Approved |
| TP-DEC-003 | C | Pending |
| TP-DEC-004 | D | Approved |
| TP-DEC-005 | E | Pending |
| TP-DEC-006 | F | Approved |
`.trim();

    const snapshot = buildGovernanceReadinessSnapshot({
      techplanMarkdown,
      authzPacketMarkdown,
      opsPacketMarkdown,
      decisionPacketMarkdown,
    });

    expect(snapshot.overallReady).toBe(false);
    expect(snapshot.rel001.ready).toBe(false);
    expect(snapshot.rel001.blockers).toEqual(
      expect.arrayContaining(["TP-AUTHZ-001", "Engineering Lead"])
    );
    expect(snapshot.rel005.ready).toBe(true);
    expect(snapshot.rel005.blockers).toHaveLength(0);
    expect(snapshot.decisionGate.ready).toBe(false);
    expect(snapshot.decisionGate.blockers).toEqual(
      expect.arrayContaining(["TP-DEC-003", "TP-DEC-005"])
    );
  });
});
