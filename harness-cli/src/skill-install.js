import fs from "node:fs/promises";
import path from "node:path";

export class SkillInstallError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "SkillInstallError";
    this.code = options.code ?? "skill_install_failed";
  }
}

const SKILL_NAME = "harness-lab-workshop";

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function findHarnessLabRepoRoot(startDir) {
  let currentDir = path.resolve(startDir);

  while (true) {
    if (await pathExists(path.join(currentDir, "workshop-skill", "SKILL.md"))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

export function getInstalledSkillPath(repoRoot) {
  return path.join(repoRoot, ".agents", "skills", SKILL_NAME);
}

export async function installWorkshopSkill(startDir, options = {}) {
  const repoRoot = await findHarnessLabRepoRoot(startDir);
  if (!repoRoot) {
    throw new SkillInstallError(
      "Harness CLI could not find `workshop-skill/SKILL.md`. Run this command inside a Harness Lab repo checkout.",
      { code: "repo_not_found" },
    );
  }

  const installPath = getInstalledSkillPath(repoRoot);
  if ((await pathExists(installPath)) && options.force !== true) {
    throw new SkillInstallError(
      `Skill already installed at ${installPath}. Re-run with --force to replace it.`,
      { code: "already_installed" },
    );
  }

  if (options.force === true) {
    await fs.rm(installPath, { recursive: true, force: true });
  }

  await fs.mkdir(installPath, { recursive: true });
  await fs.cp(path.join(repoRoot, "workshop-skill"), path.join(installPath, "workshop-skill"), { recursive: true });
  await fs.cp(path.join(repoRoot, "content"), path.join(installPath, "content"), { recursive: true });
  await fs.cp(path.join(repoRoot, "workshop-blueprint"), path.join(installPath, "workshop-blueprint"), { recursive: true });
  await fs.mkdir(path.join(installPath, "docs"), { recursive: true });
  await fs.copyFile(path.join(repoRoot, "workshop-skill", "SKILL.md"), path.join(installPath, "SKILL.md"));
  await fs.copyFile(
    path.join(repoRoot, "docs", "workshop-event-context-contract.md"),
    path.join(installPath, "docs", "workshop-event-context-contract.md"),
  );
  await fs.copyFile(
    path.join(repoRoot, "docs", "harness-cli-foundation.md"),
    path.join(installPath, "docs", "harness-cli-foundation.md"),
  );

  return { repoRoot, installPath, skillName: SKILL_NAME };
}
