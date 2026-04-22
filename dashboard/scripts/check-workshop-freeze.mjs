#!/usr/bin/env node
// Aborts a Vercel build when HARNESS_WORKSHOP_ACTIVE=true is set on the
// deployment environment. Wired into vercel.json buildCommand so a commit
// pushed during a live workshop does not auto-promote.
//
// Flip the env var off in the Vercel dashboard to allow deploys to resume.
// See docs/workshop-instance-runbook.md for the freeze/thaw playbook.

const flag = (process.env.HARNESS_WORKSHOP_ACTIVE ?? "").trim().toLowerCase();
if (flag === "true") {
  console.error("[workshop-freeze] HARNESS_WORKSHOP_ACTIVE=true — aborting deploy.");
  console.error("[workshop-freeze] Flip the env var off in Vercel dashboard to resume.");
  process.exit(1);
}

console.log("[workshop-freeze] no freeze active — continuing build.");
