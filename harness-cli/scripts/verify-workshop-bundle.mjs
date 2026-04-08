import fs from "node:fs/promises";
import path from "node:path";
import {
  createWorkshopBundleManifestFromDirectory,
  createWorkshopBundleManifestFromSource,
  getPackagedWorkshopBundlePath,
  getRepoBundledWorkshopSkillPath,
  getRepoWorkshopSourceRoot,
  pathExists,
} from "../src/workshop-bundle.js";

const ABSOLUTE_REPO_PATH = "/Users/ondrejsvec/projects/Bobo/harness-lab/";
const LINK_PATTERN = /\[[^\]]+\]\(([^)]+)\)/g;

async function listMarkdownFiles(rootPath) {
  const files = [];

  async function walk(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(entryPath);
      }
    }
  }

  await walk(rootPath);
  return files;
}

function normalizeLinkTarget(target) {
  return target.split("#")[0]?.split("?")[0]?.trim() ?? "";
}

function isExternalLink(target) {
  return /^(https?:|mailto:|data:)/.test(target);
}

async function verifyPortableMarkdown(bundleRoot) {
  const markdownFiles = await listMarkdownFiles(bundleRoot);
  const issues = [];

  for (const filePath of markdownFiles) {
    const contents = await fs.readFile(filePath, "utf8");
    if (contents.includes(ABSOLUTE_REPO_PATH)) {
      issues.push(`absolute repo path leaked into ${path.relative(bundleRoot, filePath)}`);
    }

    for (const match of contents.matchAll(LINK_PATTERN)) {
      const rawTarget = String(match[1] ?? "").trim();
      const target = normalizeLinkTarget(rawTarget);
      if (!target || target.startsWith("#") || isExternalLink(target)) {
        continue;
      }

      if (target.startsWith("/")) {
        issues.push(`absolute local link target in ${path.relative(bundleRoot, filePath)}: ${rawTarget}`);
        continue;
      }

      const resolvedPath = path.resolve(path.dirname(filePath), target);
      if (!(await pathExists(resolvedPath))) {
        issues.push(`missing bundled link target in ${path.relative(bundleRoot, filePath)}: ${rawTarget}`);
      }
    }
  }

  if (issues.length > 0) {
    throw new Error(issues.join("\n"));
  }
}

async function verifyBundleManifest(sourceManifest, bundleRoot, label) {
  if (!(await pathExists(bundleRoot))) {
    throw new Error(`${label} bundle is missing at ${bundleRoot}`);
  }

  const bundleManifest = await createWorkshopBundleManifestFromDirectory(bundleRoot);
  if (bundleManifest.contentHash !== sourceManifest.contentHash) {
    throw new Error(
      `${label} bundle is stale. Expected ${sourceManifest.contentHash}, got ${bundleManifest.contentHash}. Run \`npm run sync:workshop-bundle\` in harness-cli.`,
    );
  }
}

const sourceRoot = getRepoWorkshopSourceRoot();
const sourceManifest = await createWorkshopBundleManifestFromSource(sourceRoot);

await verifyBundleManifest(sourceManifest, getPackagedWorkshopBundlePath(), "packaged");
await verifyBundleManifest(sourceManifest, getRepoBundledWorkshopSkillPath(), "repo-local");
await verifyPortableMarkdown(getPackagedWorkshopBundlePath());
await verifyPortableMarkdown(getRepoBundledWorkshopSkillPath());
