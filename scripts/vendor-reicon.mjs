import { readFile, writeFile, mkdir } from "node:fs/promises";
const icons = {
  globe: "Global",
  map: "Map",
  policy: "Setting4",
  chart: "Chart",
  layers: "Layer",
  advisor: "ChatRoundDots",
  timer: "Timer",
  bank: "Bank",
  coin: "Coin",
  buildings: "Buildings",
  send: "Send",
  bell: "Notification",
  document: "DocumentText",
  health: "Health",
  people: "People",
  routing: "Routing",
  shield: "ShieldTick",
};
const symbols = [];
for (const [id, name] of Object.entries(icons)) {
  const source = await readFile(
    new URL(`../node_modules/reicon/icons/${name}.js`, import.meta.url),
    "utf8",
  );
  const outline = source.match(/O: `([^`]+)`/s)?.[1];
  const filled = source.match(/F: `([^`]+)`/s)?.[1];
  if (!outline || !filled) throw Error(`Reicon ${name} missing paths`);
  symbols.push(
    `<symbol id="i-${id}" viewBox="0 0 24 24" fill="none">${outline}</symbol>`,
  );
}
const target = new URL("../dist/assets/", import.meta.url);
await mkdir(target, { recursive: true });
await writeFile(
  new URL("reicon.svg", target),
  `<svg xmlns="http://www.w3.org/2000/svg"><!-- Reicon © devchauhan · MIT · see docs/licenses/reicon.txt -->${symbols.join("")}</svg>`,
);
