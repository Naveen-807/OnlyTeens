/* eslint-disable no-console */
import { spawnSync } from "node:child_process";

const steps = ["hardhat:test", "typecheck", "build"];

for (const step of steps) {
  console.log(`Running npm run ${step}...`);
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", step],
    { stdio: "inherit" },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("Repository verification passed.");
