import { syncPackagedWorkshopBundle, syncRepoBundledWorkshopSkill } from "../src/workshop-bundle.js";

const packaged = await syncPackagedWorkshopBundle();

console.log(`Synced portable workshop bundle from ${packaged.sourceRoot} to ${packaged.bundleRoot}`);

if (process.argv.includes("--with-repo-bundle")) {
  try {
    const repoBundle = await syncRepoBundledWorkshopSkill();
    console.log(`Synced repo workshop bundle from ${repoBundle.sourceRoot} to ${repoBundle.bundleRoot}`);
  } catch (error) {
    console.warn(`Skipped repo workshop bundle sync: ${error.message}`);
  }
}
