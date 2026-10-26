// Rebuild the native social artwork with the app's procedural territory and fonts.
// Open /og-preview.html in the local preview, wait for fonts, then capture 1200×630.
// Export as dist/og-image.jpg; remove the preview HTML before the production build.
import { writeFile } from "node:fs/promises";
import { generateTerritory } from "../dist/territory.js";
import { polygonPath, multiPath, elevation } from "../dist/geography.js";
const t = generateTerritory({ seed: 1042, population: 24.8, kind: "island" });
const coast = polygonPath(t.land);
let contours = "";
for (let level = 0.15; level < 0.95; level += 0.065) {
  let d = "";
  for (let y = 60; y < 700; y += 8)
    for (let x = 100; x < 850; x += 8) {
      const pts = [
          [x, y],
          [x + 8, y],
          [x + 8, y + 8],
          [x, y + 8],
        ],
        v = pts.map((p) => elevation(...p, t.seed, t.profile)),
        hits = [];
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        if (v[i] < level !== v[j] < level) {
          const a = (level - v[i]) / (v[j] - v[i]);
          hits.push([
            pts[i][0] + a * (pts[j][0] - pts[i][0]),
            pts[i][1] + a * (pts[j][1] - pts[i][1]),
          ]);
        }
      }
      for (let i = 0; i + 1 < hits.length; i += 2)
        d += `M${hits[i].map((n) => n.toFixed(1))}L${hits[i + 1].map((n) => n.toFixed(1))}`;
    }
  contours += `<path d="${d}" fill="none" stroke="#d5e5bf" stroke-opacity=".18" stroke-width=".8"/>`;
}
const states = t.regions
  .map(
    (r, i) =>
      `<path d="${multiPath(r.shape)}" fill="${i === 3 ? "#8eac49" : ["#202c1c", "#293522", "#1c281b", "#35412a"][i % 4]}" stroke="${i === 3 ? "#c7ff3e" : "#809268"}" stroke-width="${i === 3 ? 2 : 1}" stroke-opacity="${i === 3 ? 1 : 0.5}"/>`,
  )
  .join("");
const cities = t.cities
  .filter((c, i) => i % 7 === 0)
  .map(
    (c, i) =>
      `<circle cx="${c.x}" cy="${c.y}" r="${i === 3 ? 5 : 2.6}" fill="${i === 3 ? "#c7ff3e" : "#dfe8d0"}"/><circle cx="${c.x}" cy="${c.y}" r="${i === 3 ? 11 : 6}" fill="none" stroke="#c7ff3e" stroke-opacity="${i === 3 ? 0.5 : 0.14}"/>`,
  )
  .join("");
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Meridiano · arte social</title><style>
@font-face{font-family:Space;src:url('/fonts/space-grotesk-latin-wght-normal.woff2');font-weight:300 700}
@font-face{font-family:Manrope;src:url('/fonts/manrope-latin-wght-normal.woff2');font-weight:200 800}
*{box-sizing:border-box}body{margin:0;background:#0c100b}main{position:relative;width:1200px;height:630px;overflow:hidden;background:#0c100b;color:#f1f4e9}.map{position:absolute;inset:0}.copy{position:absolute;left:76px;top:129px}.mark{width:48px;height:48px;margin-bottom:27px;color:#c7ff3e}h1{font:600 82px/1.05 Space,sans-serif;letter-spacing:-5px;margin:0 0 17px}h2{font:500 26px/1.4 Manrope,sans-serif;letter-spacing:-.7px;margin:0;color:#c7ff3e}p{font:400 21px/1.65 Manrope,sans-serif;color:#b0bba3;margin:27px 0 0}.url{position:absolute;left:76px;bottom:57px;font:500 15px Manrope,sans-serif;letter-spacing:.2px;color:#95a185}.caption{font:500 11px Manrope,sans-serif;letter-spacing:2px;fill:#8d9d7c}.rule{position:absolute;left:76px;right:76px;bottom:99px;height:1px;background:#30382a}</style><main>
<svg class="map" width="1200" height="630" viewBox="0 0 1200 630" aria-hidden="true"><defs><pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#728365" stroke-opacity=".08"/></pattern><clipPath id="country"><path d="${coast}"/></clipPath></defs><rect x="575" width="625" height="630" fill="url(#grid)"/><g transform="translate(508,4) scale(.85)"><path d="${coast}" transform="translate(0,9)" fill="#050805" stroke="#111a0c" stroke-width="3"/>${states}<g clip-path="url(#country)">${contours}${cities}</g><path d="${coast}" fill="none" stroke="#b2cf85" stroke-width="1.8"/><text class="caption" x="480" y="690" text-anchor="middle">TERRITÓRIO FICTÍCIO</text></g></svg>
<div class="copy"><svg class="mark" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.5"><circle cx="32" cy="32" r="25"/><ellipse cx="32" cy="32" rx="11" ry="25"/><path d="M7 32h50"/></svg><h1>meridiano</h1><h2>Simulador geopolítico</h2><p>Crie seu país, defina políticas<br>e acompanhe as consequências.</p></div><div class="rule"></div><div class="url">meridiano.jhonatanoliveira.com</div></main></html>`;
await writeFile(new URL("../dist/og-preview.html", import.meta.url), html);
console.log("Social artwork source: dist/og-preview.html (1200×630).");
