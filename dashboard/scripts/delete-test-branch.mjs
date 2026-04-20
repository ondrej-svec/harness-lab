#!/usr/bin/env node
/**
 * Delete a Neon test branch created by create-test-branch.mjs.
 *
 * Usage:
 *   node dashboard/scripts/delete-test-branch.mjs [--name <branch>] [--project-id <id>]
 *
 * If --name is omitted, reads HARNESS_TEST_BRANCH_NAME from
 * dashboard/.env.test.local. Removes the file after a successful delete
 * so subsequent test runs don't accidentally point at a dead branch.
 *
 * Idempotent: missing branch / missing env file is logged and exits 0.
 */

import { spawn } from "node:child_process";
import { readFile, rm, stat } from "node:fs/promises";
import path from "node:path";

const DEFAULT_PROJECT_ID = process.env.HARNESS_NEON_PROJECT_ID ?? "broad-smoke-45468927";
const ENV_PATH = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
  ".env.test.local",
);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case "--name":
        args.name = argv[++index];
        break;
      case "--project-id":
        args.projectId = argv[++index];
        break;
      case "--help":
      case "-h":
        printUsageAndExit(0);
        break;
      default:
        console.error(`unknown argument: ${token}`);
        printUsageAndExit(1);
    }
  }
  return args;
}

function printUsageAndExit(code) {
  console.error("usage: delete-test-branch.mjs [--name <branch>] [--project-id <id>]");
  process.exit(code);
}

async function readEnvBranch() {
  try {
    await stat(ENV_PATH);
  } catch {
    return null;
  }
  const raw = await readFile(ENV_PATH, "utf8");
  for (const line of raw.split("\n")) {
    const match = line.match(/^HARNESS_TEST_BRANCH_NAME=(.+)$/);
    if (match) return match[1].trim();
  }
  return null;
}

function runNeonctl(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("neonctl", args, { stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      const stderrText = Buffer.concat(stderr).toString("utf8");
      if (code !== 0) {
        if (stderrText.toLowerCase().includes("not found") || stderrText.includes("404")) {
          resolve({ ok: false, missing: true, output: stderrText });
          return;
        }
        reject(new Error(`neonctl ${args.join(" ")} exited with code ${code}\n${stderrText}`));
        return;
      }
      resolve({ ok: true, output: Buffer.concat(stdout).toString("utf8") });
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = args.projectId ?? DEFAULT_PROJECT_ID;
  const branchName = args.name ?? (await readEnvBranch());

  if (!branchName) {
    console.log("no branch name supplied and .env.test.local missing — nothing to delete");
    return;
  }

  if (branchName === "main" || branchName === "production") {
    console.error(`refusing to delete protected branch: ${branchName}`);
    process.exit(2);
  }

  const result = await runNeonctl([
    "branches",
    "delete",
    branchName,
    "--project-id",
    projectId,
  ]);

  if (result.missing) {
    console.log(`branch ${branchName} not found — already deleted, removing env file`);
  } else {
    console.log(`branch ${branchName} deleted`);
  }

  await rm(ENV_PATH, { force: true });
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
