import {
  buildSandboxEmail,
  buildSandboxIdentifier,
  buildSandboxSchoolCode,
} from "@/lib/demo-sandbox";

describe("demo sandbox identity mapping", () => {
  const instanceId = "demo_1234567890abcdef12345678";

  it("menambahkan suffix unik untuk identifier non-email", () => {
    expect(buildSandboxIdentifier("admin.sekolah", instanceId)).toBe(
      "admin.sekolah.demo.cdef12345678",
    );
  });

  it("menambahkan plus-addressing untuk email sandbox", () => {
    expect(
      buildSandboxEmail("siswa.xmipa1.01@demo.schoolio.id", instanceId),
    ).toBe("siswa.xmipa1.01+demo-cdef12345678@demo.schoolio.id");
  });

  it("membuat kode sekolah sandbox dari template", () => {
    expect(buildSandboxSchoolCode("SCH-ALHIKMAH", instanceId)).toBe(
      "SCH-ALHIKMAH-DEMO-CDEF12345678",
    );
  });
});

