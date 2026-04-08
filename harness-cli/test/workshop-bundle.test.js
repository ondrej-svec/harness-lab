import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  WORKSHOP_BUNDLE_MANIFEST,
  createWorkshopBundleFromSource,
  getRepoWorkshopSourceRoot,
  readWorkshopBundleManifest,
} from "../src/workshop-bundle.js";

test("createWorkshopBundleFromSource can rebuild the same target repeatedly", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "harness-cli-bundle-"));
  const targetRoot = path.join(tempRoot, "bundle");
  const sourceRoot = getRepoWorkshopSourceRoot();

  await createWorkshopBundleFromSource(sourceRoot, targetRoot, { clean: true });
  await createWorkshopBundleFromSource(sourceRoot, targetRoot, { clean: true });

  const manifest = await readWorkshopBundleManifest(targetRoot);

  assert.ok(manifest, "expected bundle manifest to be written");
  assert.equal(await fs.stat(path.join(targetRoot, "SKILL.md")).then(() => true), true);
  assert.equal(
    await fs
      .stat(path.join(targetRoot, WORKSHOP_BUNDLE_MANIFEST))
      .then(() => true),
    true,
  );
});
