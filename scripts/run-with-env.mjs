import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const separatorIndex = args.indexOf("--");

if (separatorIndex === -1 || separatorIndex === args.length - 1) {
  console.error(
    "Usage: node scripts/run-with-env.mjs <env-file> -- <command> [args...]"
  );
  process.exit(1);
}

const envFilePath = resolve(process.cwd(), args[0]);
const command = args[separatorIndex + 1];
const commandArgs = args.slice(separatorIndex + 2);

const stripWrappingQuotes = (value) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

const parseEnvFile = (filePath) => {
  const raw = readFileSync(filePath, "utf8");
  const parsed = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    parsed[key] = stripWrappingQuotes(value);
  }

  return parsed;
};

const resolveCommand = (rawCommand) => {
  if (rawCommand === "node") {
    return process.execPath;
  }

  if (process.platform !== "win32") {
    return rawCommand;
  }

  if (extname(rawCommand)) {
    return rawCommand;
  }

  const localBinCommand = resolve(
    process.cwd(),
    "node_modules",
    ".bin",
    `${rawCommand}.cmd`
  );

  if (existsSync(localBinCommand)) {
    return localBinCommand;
  }

  return `${rawCommand}.cmd`;
};

const sharedOptions = {
  stdio: "inherit",
  env: {
    ...process.env,
    ...parseEnvFile(envFilePath),
  },
};

const resolvedCommand = resolveCommand(command);
const needsWindowsShell =
  process.platform === "win32" && resolvedCommand.toLowerCase().endsWith(".cmd");

const child = spawn(resolvedCommand, commandArgs, {
  ...sharedOptions,
  shell: needsWindowsShell,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
