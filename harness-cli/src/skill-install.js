import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
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

const MIN_NODE_MAJOR = 22;

export class SkillInstallError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "SkillInstallError";
    this.code = options.code ?? "skill_install_failed";
  }
}

function assertSupportedNodeVersion() {
  const raw = process.versions?.node;
  if (!raw) {
    return;
  }
  const major = Number.parseInt(raw.split(".")[0], 10);
  if (Number.isFinite(major) && major < MIN_NODE_MAJOR) {
    throw new SkillInstallError(
      `Harness CLI requires Node.js ${MIN_NODE_MAJOR} or newer. This process is running Node.js ${raw}. Upgrade with your version manager (for example \`nvm install --lts\`) and re-run \`harness skill install\`.`,
      { code: "unsupported_node_version" },
    );
  }
}

function translateFileSystemError(error, context) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const targetPath = error.path ? ` (${error.path})` : "";

  if (error.code === "EACCES" || error.code === "EPERM") {
    return new SkillInstallError(
      `Harness CLI could not ${context}${targetPath} because the current user does not have write permission. Try running from a directory you own, or adjust the directory permissions. On macOS and Linux, that usually means avoiding system paths like /usr. On Windows, avoid running from a protected location such as C:\\Program Files.`,
      { code: "install_permission_denied" },
    );
  }

  if (error.code === "ENOSPC") {
    return new SkillInstallError(
      `Harness CLI could not ${context}${targetPath} because the disk is full. Free some space and re-run \`harness skill install\`.`,
      { code: "install_no_space" },
    );
  }

  if (error.code === "ENAMETOOLONG" || error.code === "ENOTDIR") {
    return new SkillInstallError(
      `Harness CLI could not ${context}${targetPath}. The target path is too long or part of it is not a directory. On Windows, this often happens when the repository lives in a deeply nested folder — move the repo closer to the drive root (for example C:\\repos\\your-project) and try again.`,
      { code: "install_path_invalid" },
    );
  }

  if (error.code === "EROFS") {
    return new SkillInstallError(
      `Harness CLI could not ${context}${targetPath} because the file system is read-only. Re-run \`harness skill install\` from a writable directory.`,
      { code: "install_read_only" },
    );
  }

  if (error.code === "EBUSY") {
    return new SkillInstallError(
      `Harness CLI could not ${context}${targetPath} because the target is busy (another process may hold it open). Close editors or agents pointing at \`.agents/skills/\` and re-run \`harness skill install\`.`,
      { code: "install_target_busy" },
    );
  }

  return null;
}

async function fsWithActionableError(operation, context) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof SkillInstallError) {
      throw error;
    }
    const translated = translateFileSystemError(error, context);
    if (translated) {
      translated.cause = error;
      throw translated;
    }
    throw error;
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
  await fsWithActionableError(
    () => fs.mkdir(targetPath, { recursive: true }),
    `create the install target directory`,
  );
  const stat = await fsWithActionableError(
    () => fs.stat(targetPath),
    `inspect the install target directory`,
  );
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
    await fsWithActionableError(
      () => fs.cp(resolvedBundle.sourcePath, installPath, { recursive: true }),
      `copy the workshop bundle into the install target`,
    );
    return;
  }

  await fsWithActionableError(
    () => createWorkshopBundleFromSource(resolvedBundle.sourceRoot, installPath),
    `build the workshop bundle from source into the install target`,
  );
}

export async function installWorkshopSkill(startDir, options = {}) {
  assertSupportedNodeVersion();

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

    await fsWithActionableError(
      () => fs.rm(installPath, { recursive: true, force: true }),
      `remove the previous workshop bundle before refreshing it`,
    );

    return {
      ...(await installFreshBundle(resolvedBundle, installPath, targetRoot)),
      mode: "refreshed",
    };
  }

  if (existingInstall && options.force === true) {
    await fsWithActionableError(
      () => fs.rm(installPath, { recursive: true, force: true }),
      `remove the previous workshop bundle before reinstalling`,
    );
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
  await fsWithActionableError(
    () => fs.mkdir(path.dirname(installPath), { recursive: true }),
    `create the parent directory for the installed skill`,
  );
  await installFromResolvedBundle(resolvedBundle, installPath);

  return {
    installPath,
    skillName: WORKSHOP_SKILL_NAME,
    mode: "installed",
    sourceMode: resolvedBundle.mode,
    targetRoot,
  };
}
