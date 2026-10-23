import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
for (const dir of ["dist", "api", "server", "scripts"])
  for (const file of await readdir(dir)) {
    if (!/\.(mjs|js)$/.test(file)) continue;
    const r = spawnSync(process.execPath, ["--check", dir + "/" + file], {
      stdio: "inherit",
    });
    if (r.status !== 0) process.exit(1);
  }
console.log("Syntax checks passed.");
