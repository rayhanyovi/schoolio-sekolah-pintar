import { spawn } from "node:child_process";

const forwardArgs = process.argv.slice(2);
const nodeCommand = process.execPath;
const npmExecPath = process.env.npm_execpath;

if (!npmExecPath) {
  console.error(
    "[governance-approve-refresh] npm_execpath tidak tersedia di environment"
  );
  process.exit(1);
}

const run = (command, args) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
    });
    child.on("close", (code) => resolve(code ?? 1));
  });

const runAll = async () => {
  const updateCode = await run(nodeCommand, [
    "scripts/governance-approval-update.mjs",
    ...forwardArgs,
  ]);
  if (updateCode !== 0) {
    process.exit(updateCode);
  }

  const refreshCode = await run(nodeCommand, [
    npmExecPath,
    "run",
    "governance:refresh",
  ]);
  process.exit(refreshCode);
};

await runAll();
