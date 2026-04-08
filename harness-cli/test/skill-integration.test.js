import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

test("facilitator skill routes privileged operations through the harness CLI without becoming a secret store", async () => {
  const facilitatorSkillPath = path.resolve(process.cwd(), "..", "workshop-skill", "facilitator.md");
  const skillText = await fs.readFile(facilitatorSkillPath, "utf8");

  assert.match(skillText, /harness auth login/);
  assert.match(skillText, /harness workshop status/);
  assert.match(skillText, /harness workshop create-instance/);
  assert.match(skillText, /harness workshop update-instance/);
  assert.match(skillText, /harness workshop prepare/);
  assert.match(skillText, /harness workshop remove-instance/);
  assert.match(skillText, /Skill nemá být další secret store/);
  assert.match(skillText, /browser\/device auth/);
});
