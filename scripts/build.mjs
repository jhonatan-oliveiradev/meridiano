import { mkdir, cp, access, rm } from "node:fs/promises";
for (const f of [
  "index.html",
  "cabinet-tools.js",
  "cabinet-panel.js",
  "cabinet.css",
  ...["lia", "caio", "iara"].flatMap((name) =>
    ["neutral", "happy", "thinking"].map(
      (pose) => `assets/${name}-${pose}.svg`,
    ),
  ),
  "investment-ledger.js",
  "investments.js",
  "investment-ui.js",
  "investments.css",
  "style.css",
  "app.js",
  "fit-country-name.js",
  "model.js",
  "geography.js",
  "premium.css",
  "advisor.js",
  "terrain3d.js",
  "studio.css",
  "country.js",
  "interactions.js",
  "playful.css",
  "cabinet-avatar.js",
  "assets/reicon.svg",
  "conversation.css",
  "text-reveal.js",
  "simulation.js",
  "decision-ui.js",
  "decisions.css",
  "ai-blob.js",
  "territory.js",
  "territory.css",
  "atlas-data.js",
  "atlas-map.js",
  "vendor/geography-engine.js",
  "vendor/maplibre-gl-worker.mjs",
  "composer-dock.js",
  "vendor/paper/shaders/warp.js",
])
  await access(new URL("../dist/" + f, import.meta.url));
await rm(new URL("../build", import.meta.url), {
  recursive: true,
  force: true,
});
await mkdir(new URL("../build", import.meta.url), { recursive: true });
await cp(
  new URL("../dist", import.meta.url),
  new URL("../build", import.meta.url),
  { recursive: true },
);
console.log("Static application validated and copied to build/");
