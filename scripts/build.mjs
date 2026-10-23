import { mkdir, cp, access, rm } from "node:fs/promises";
for (const f of [
  "index.html",
  "style.css",
  "app.js",
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
