import { spawn } from "node:child_process";

const targetTests = [
  "tests/integration/authz-sensitive.integration.test.ts",
  "tests/integration/schedule-conflict.integration.test.ts",
  "tests/integration/attendance-duplicate.integration.test.ts",
  "tests/integration/forum-lock.integration.test.ts",
  "tests/integration/role-parent.e2e.test.ts",
];

const run = () =>
  new Promise((resolve) => {
    const command = `npx vitest run ${targetTests.join(" ")}`;
    const child = spawn(
      command,
      [],
      {
        shell: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env,
      }
    );

    let combinedOutput = "";
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stderr.write(text);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.error(
          `[release-gate] gagal: suite authz/integrity exit code ${code}`
        );
        resolve(1);
        return;
      }
      if (/severity=CRITICAL/i.test(combinedOutput)) {
        console.error(
          "[release-gate] gagal: ditemukan log severity=CRITICAL pada suite authz/integrity"
        );
        resolve(1);
        return;
      }
      console.log(
        "[release-gate] lulus: suite authz/integrity pass tanpa severity=CRITICAL"
      );
      resolve(0);
    });
  });

const exitCode = await run();
process.exit(exitCode);
