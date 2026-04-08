import fs from "node:fs/promises";
import path from "node:path";
import {
  createWorkshopBundleManifestFromDirectory,
  createWorkshopBundleManifestFromSource,
  createWorkshopBundleFromSource,
  getInstalledSkillPath,
  getPackagedWorkshopBundlePath,
  getRepoWorkshopSourceRoot,
  pathExists,
  readWorkshopBundleManifest,
  WORKSHOP_SKILL_NAME,
} from "./workshop-bundle.js";

export class SkillInstallError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "SkillInstallError";
    this.code = options.code ?? "skill_install_failed";
  }
}

async function resolveBundleSource() {
  const packagedBundlePath = getPackagedWorkshopBundlePath();
  if (await pathExists(path.join(packagedBundlePath, "SKILL.md"))) {
    return {
      mode: "packaged_bundle",
      sourcePath: packagedBundlePath,
      sourceRoot: packagedBundlePath,
    };
  }

  const repoSourceRoot = getRepoWorkshopSourceRoot();
  if (await pathExists(path.join(repoSourceRoot, "workshop-skill", "SKILL.md"))) {
    return {
      mode: "repo_source",
      sourcePath: repoSourceRoot,
      sourceRoot: repoSourceRoot,
    };
  }

  return null;
}

async function ensureDirectory(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
  const stat = await fs.stat(targetPath);
  if (!stat.isDirectory()) {
    throw new SkillInstallError(`Install target is not a directory: ${targetPath}`, {
      code: "invalid_target",
    });
  }
}

async function hasInstalledSkill(targetRoot) {
  return pathExists(path.join(getInstalledSkillPath(targetRoot), "SKILL.md"));
}

async function getSourceBundleManifest(resolvedBundle) {
  if (resolvedBundle.mode === "packaged_bundle") {
    const manifest = await readWorkshopBundleManifest(resolvedBundle.sourcePath);
    if (manifest) {
      return manifest;
    }

    return createWorkshopBundleManifestFromDirectory(resolvedBundle.sourcePath);
  }

  return createWorkshopBundleManifestFromSource(resolvedBundle.sourceRoot);
}

async function installFromResolvedBundle(resolvedBundle, installPath) {
  if (resolvedBundle.mode === "packaged_bundle") {
    await fs.cp(resolvedBundle.sourcePath, installPath, { recursive: true });
    return;
  }

  await createWorkshopBundleFromSource(resolvedBundle.sourceRoot, installPath);
}

export async function installWorkshopSkill(startDir, options = {}) {
  const resolvedBundle = await resolveBundleSource();
  if (!resolvedBundle) {
    throw new SkillInstallError(
      "Harness CLI could not find a portable workshop bundle. Reinstall `@harness-lab/cli` or run from a Harness Lab source checkout.",
      { code: "bundle_not_found" },
    );
  }

  const targetRoot = path.resolve(startDir, options.target ?? ".");
  await ensureDirectory(targetRoot);

  const installPath = getInstalledSkillPath(targetRoot);
  const existingInstall = await hasInstalledSkill(targetRoot);
  const sourceManifest = await getSourceBundleManifest(resolvedBundle);

  if (existingInstall && options.force !== true) {
    const installedManifest = await createWorkshopBundleManifestFromDirectory(installPath);
    if (installedManifest.contentHash === sourceManifest.contentHash) {
      return {
        installPath,
        skillName: WORKSHOP_SKILL_NAME,
        mode: "already_current",
        sourceMode: resolvedBundle.mode,
        targetRoot,
      };
    }

    await fs.rm(installPath, { recursive: true, force: true });

    return {
      ...(await installFreshBundle(resolvedBundle, installPath, targetRoot)),
      mode: "refreshed",
    };
  }

  if (existingInstall && options.force === true) {
    await fs.rm(installPath, { recursive: true, force: true });
  }

  const result = await installFreshBundle(resolvedBundle, installPath, targetRoot);
  if (existingInstall && options.force === true) {
    return {
      ...result,
      mode: "refreshed",
    };
  }

  return result;
}

async function installFreshBundle(resolvedBundle, installPath, targetRoot) {
  await fs.mkdir(path.dirname(installPath), { recursive: true });
  await installFromResolvedBundle(resolvedBundle, installPath);

  return {
    installPath,
    skillName: WORKSHOP_SKILL_NAME,
    mode: "installed",
    sourceMode: resolvedBundle.mode,
    targetRoot,
  };
}
