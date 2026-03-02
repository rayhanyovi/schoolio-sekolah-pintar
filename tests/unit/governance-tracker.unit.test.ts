import { buildGovernanceTrackerSnapshot } from "@/lib/governance-tracker";

describe("governance tracker snapshot builder", () => {
  it("menghitung pending, overdue, dan blocker per PIC", () => {
    const snapshot = buildGovernanceTrackerSnapshot({
      authzPacketMarkdown: `
## Approval Record
| Role Approver | Nama | Keputusan | Tanggal | Catatan |
|---|---|---|---|---|
| Product Lead | Rina PM | Pending | - | - |
| Engineering Lead | - | Approved | 2026-03-01 | - |
`,
      opsPacketMarkdown: `
## Approval Matrix
| Stakeholder | Area | Keputusan | Tanggal | Catatan |
|---|---|---|---|---|
| QA Lead | Verifikasi | Pending | - | - |
`,
      decisionPacketMarkdown: `
## Approval Record
| ID | Owner Keputusan | Due Date | Keputusan Final | Tanggal | Catatan |
|---|---|---|---|---|---|
| TP-DEC-001 | Product + Engineering | 2026-02-20 | Pending | - | - |
| TP-DEC-003 | Product Akademik | 2026-03-10 | Approved | 2026-03-01 | - |
`,
      historyMarkdown: `
| Tanggal | Packet | Target | Decision | Actor | Catatan |
|---|---|---|---|---|---|
| 2026-03-01 | AUTHZ | Engineering Lead | Approved | admin-1 | ok |
| 2026-02-20 | DECISION | TP-DEC-001 | Pending | admin-1 | waiting |
`,
      baselineDate: "2026-03-02",
    });

    expect(snapshot.totals.total).toBe(5);
    expect(snapshot.totals.approved).toBe(2);
    expect(snapshot.totals.pending).toBe(3);
    expect(snapshot.totals.overdue).toBe(1);
    expect(snapshot.overdueTasks.map((task) => task.target)).toContain("TP-DEC-001");
    expect(snapshot.pendingByPic[0].pending).toBeGreaterThan(0);
    expect(snapshot.recentHistory[0].date).toBe("2026-03-01");
  });
});
