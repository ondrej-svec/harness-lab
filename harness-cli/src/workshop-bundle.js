import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const WORKSHOP_SKILL_NAME = "harness-lab-workshop";
export const WORKSHOP_BUNDLE_MANIFEST = "bundle-manifest.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");

const DIRECTORY_COPIES = [
  ["workshop-skill", "workshop-skill"],
  ["content", "content"],
  ["workshop-blueprint", "workshop-blueprint"],
];

// Post-2026-04-13 layout: English is canonical at the root, Czech is the
// reviewed delivery locale under `locales/cs/`. This FILE_COPIES list
// reflects that convention — no `locales/en/` references remain for the
// files that were flipped in the language-architecture refactor.
const FILE_COPIES = [
  ["workshop-skill/SKILL.md", "SKILL.md"],
  ["docs/workshop-event-context-contract.md", "docs/workshop-event-context-contract.md"],
  ["docs/harness-cli-foundation.md", "docs/harness-cli-foundation.md"],
  ["docs/learner-resource-kit.md", "docs/learner-resource-kit.md"],
  ["docs/locales/en/learner-resource-kit.md", "docs/locales/en/learner-resource-kit.md"],
  ["docs/learner-reference-gallery.md", "docs/learner-reference-gallery.md"],
  ["docs/locales/en/learner-reference-gallery.md", "docs/locales/en/learner-reference-gallery.md"],
  ["materials/participant-resource-kit.md", "materials/participant-resource-kit.md"],
  ["materials/locales/cs/participant-resource-kit.md", "materials/locales/cs/participant-resource-kit.md"],
  ["materials/coaching-codex.md", "materials/coaching-codex.md"],
  ["materials/locales/cs/coaching-codex.md", "materials/locales/cs/coaching-codex.md"],
];

// Files that live inside DIRECTORY_COPIES source trees but must not ship to
// participants. These are author/maintainer/copy-editor artifacts that have no
// runtime purpose inside the installed workshop skill. Keep the set minimal —
// every entry should be a file that (a) has no workshop-skill reference and
// (b) is clearly authoring/governance content rather than participant-facing.
const EXCLUDED_BUNDLE_PATHS = new Set([
  "content/style-guide.md",
  "content/style-examples.md",
  "content/czech-reject-list.md",
  "content/czech-editorial-review-checklist.md",
  "workshop-blueprint/edit-boundaries.md",
]);

function isExcludedBundlePath(bundleRelativePath) {
  return EXCLUDED_BUNDLE_PATHS.has(normalizePathForManifest(bundleRelativePath));
}

export function getPackageRoot() {
  return packageRoot;
}

export function getPackagedWorkshopBundlePath() {
  return path.join(packageRoot, "assets", "workshop-bundle");
}

export function getRepoWorkshopSourceRoot() {
  return path.resolve(packageRoot, "..");
}

export function getRepoBundledWorkshopSkillPath() {
  return path.join(getRepoWorkshopSourceRoot(), ".agents", "skills", WORKSHOP_SKILL_NAME);
}

export function getInstalledSkillPath(targetRoot) {
  return path.join(targetRoot, ".agents", "skills", WORKSHOP_SKILL_NAME);
}

export function getClaudeCodeSkillPath(targetRoot) {
  return path.join(targetRoot, ".claude", "skills", "workshop");
}

export function getBundleManifestPath(bundleRoot) {
  return path.join(bundleRoot, WORKSHOP_BUNDLE_MANIFEST);
}

export async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyDirectoryTree(sourceRoot, targetRoot) {
  for (const [sourceRelativePath, targetRelativePath] of DIRECTORY_COPIES) {
    await copyDirectoryRecursive(
      path.join(sourceRoot, sourceRelativePath),
      path.join(targetRoot, targetRelativePath),
      targetRelativePath,
    );
  }
}

async function copyDirectoryRecursive(sourcePath, targetPath, bundleRelativePrefix) {
  const entries = await fs.readdir(sourcePath, { withFileTypes: true });
  await fs.mkdir(targetPath, { recursive: true });

  for (const entry of entries) {
    const sourceEntryPath = path.join(sourcePath, entry.name);
    const targetEntryPath = path.join(targetPath, entry.name);
    const entryBundleRelativePath = bundleRelativePrefix
      ? path.join(bundleRelativePrefix, entry.name)
      : entry.name;

    if (entry.isDirectory()) {
      await copyDirectoryRecursive(sourceEntryPath, targetEntryPath, entryBundleRelativePath);
      continue;
    }

    if (entry.isFile()) {
      if (isExcludedBundlePath(entryBundleRelativePath)) {
        continue;
      }
      await fs.copyFile(sourceEntryPath, targetEntryPath);
    }
  }
}

async function copyBundleFiles(sourceRoot, targetRoot) {
  for (const [sourceRelativePath, targetRelativePath] of FILE_COPIES) {
    const targetPath = path.join(targetRoot, targetRelativePath);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(path.join(sourceRoot, sourceRelativePath), targetPath);
  }
}

function normalizePathForManifest(targetPath) {
  return targetPath.split(path.sep).join("/");
}

async function listFilesRecursive(rootPath) {
  const entries = [];

  async function walk(currentPath, relativePrefix = "") {
    const dirEntries = await fs.readdir(currentPath, { withFileTypes: true });
    dirEntries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of dirEntries) {
      const entryRelativePath = relativePrefix ? path.join(relativePrefix, entry.name) : entry.name;
      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await walk(entryPath, entryRelativePath);
        continue;
      }

      if (entry.isFile()) {
        entries.push({
          absolutePath: entryPath,
          relativePath: normalizePathForManifest(entryRelativePath),
        });
      }
    }
  }

  await walk(rootPath);
  return entries;
}

async function readPackageVersion() {
  const packageJson = JSON.parse(await fs.readFile(path.join(packageRoot, "package.json"), "utf8"));
  return String(packageJson.version);
}

async function createManifestFromEntries(entries) {
  const bundleVersion = await readPackageVersion();
  const files = [];

  for (const entry of entries) {
    const contents = await fs.readFile(entry.absolutePath);
    const sha256 = crypto.createHash("sha256").update(contents).digest("hex");
    files.push({
      path: entry.relativePath,
      sha256,
    });
  }

  files.sort((left, right) => left.path.localeCompare(right.path));

  const contentHash = crypto
    .createHash("sha256")
    .update(
      files
        .map((file) => `${file.path}:${file.sha256}`)
        .join("\n"),
    )
    .digest("hex");

  return {
    manifestVersion: 1,
    bundleName: WORKSHOP_SKILL_NAME,
    bundleVersion,
    contentHash,
    files,
  };
}

export async function createWorkshopBundleManifestFromDirectory(bundleRoot) {
  const files = await listFilesRecursive(bundleRoot);
  return createManifestFromEntries(
    files.filter((file) => file.relativePath !== WORKSHOP_BUNDLE_MANIFEST),
  );
}

export async function createWorkshopBundleManifestFromSource(sourceRoot) {
  const entries = [];

  for (const [sourceRelativePath, targetRelativePath] of DIRECTORY_COPIES) {
    const sourceDirectory = path.join(sourceRoot, sourceRelativePath);
    const sourceFiles = await listFilesRecursive(sourceDirectory);

    for (const file of sourceFiles) {
      const targetRelative = normalizePathForManifest(path.join(targetRelativePath, file.relativePath));
      if (targetRelative === "workshop-skill/SKILL.md") {
        continue;
      }
      if (isExcludedBundlePath(targetRelative)) {
        continue;
      }

      entries.push({
        absolutePath: file.absolutePath,
        relativePath: targetRelative,
      });
    }
  }

  for (const [sourceRelativePath, targetRelativePath] of FILE_COPIES) {
    entries.push({
      absolutePath: path.join(sourceRoot, sourceRelativePath),
      relativePath: normalizePathForManifest(targetRelativePath),
    });
  }

  return createManifestFromEntries(entries);
}

export async function readWorkshopBundleManifest(bundleRoot) {
  try {
    const manifest = JSON.parse(await fs.readFile(getBundleManifestPath(bundleRoot), "utf8"));
    if (!manifest || typeof manifest.contentHash !== "string") {
      return null;
    }
    return manifest;
  } catch {
    return null;
  }
}

async function writeWorkshopBundleManifest(bundleRoot, manifest) {
  await fs.writeFile(
    getBundleManifestPath(bundleRoot),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

async function pruneBundleFiles(bundleRoot, manifest) {
  const expectedFiles = new Set([
    WORKSHOP_BUNDLE_MANIFEST,
    ...manifest.files.map((file) => file.path),
  ]);
  const currentFiles = await listFilesRecursive(bundleRoot);

  for (const file of currentFiles) {
    if (!expectedFiles.has(file.relativePath)) {
      await fs.rm(file.absolutePath, { force: true });
    }
  }
}

export async function createWorkshopBundleFromSource(sourceRoot, targetRoot, options = {}) {
  if (options.clean === true) {
    await fs.rm(targetRoot, { recursive: true, force: true });
  }
  await fs.mkdir(targetRoot, { recursive: true });
  await copyDirectoryTree(sourceRoot, targetRoot);
  await fs.rm(path.join(targetRoot, "workshop-skill", "SKILL.md"), { force: true });
  await copyBundleFiles(sourceRoot, targetRoot);
  const manifest = await createWorkshopBundleManifestFromSource(sourceRoot);
  if (options.prune === true) {
    await pruneBundleFiles(targetRoot, manifest);
  }
  await writeWorkshopBundleManifest(targetRoot, manifest);
}

export async function syncPackagedWorkshopBundle() {
  const sourceRoot = getRepoWorkshopSourceRoot();
  const bundleRoot = getPackagedWorkshopBundlePath();
  await createWorkshopBundleFromSource(sourceRoot, bundleRoot, { clean: true });
  return {
    sourceRoot,
    bundleRoot,
  };
}

export async function syncRepoBundledWorkshopSkill() {
  const sourceRoot = getRepoWorkshopSourceRoot();
  const bundleRoot = getRepoBundledWorkshopSkillPath();
  await createWorkshopBundleFromSource(sourceRoot, bundleRoot, { prune: true });
  return {
    sourceRoot,
    bundleRoot,
  };
}
