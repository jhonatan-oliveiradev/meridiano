import { build } from "esbuild";
import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
const out = new URL("../dist/vendor/", import.meta.url);
await mkdir(out, { recursive: true });
await build({
  stdin: {
    contents:
      "export { Delaunay } from 'd3-delaunay'; export { createNoise2D } from 'simplex-noise'; export { default as clipping } from 'polygon-clipping';",
    resolveDir: new URL("..", import.meta.url).pathname,
  },
  bundle: true,
  format: "esm",
  platform: "browser",
  minify: true,
  outfile: new URL("geography-engine.js", out).pathname,
  legalComments: "eof",
});
await copyFile(
  new URL("../node_modules/maplibre-gl/dist/maplibre-gl.mjs", import.meta.url),
  new URL("maplibre-gl.mjs", out),
);
await copyFile(
  new URL(
    "../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs",
    import.meta.url,
  ),
  new URL("maplibre-gl-worker.mjs", out),
);
await copyFile(
  new URL("../node_modules/maplibre-gl/dist/maplibre-gl.css", import.meta.url),
  new URL("maplibre-gl.css", out),
);
for (const [pkg, file] of [
  ["d3-delaunay", "LICENSE"],
  ["delaunator", "LICENSE"],
  ["robust-predicates", "LICENSE"],
  ["simplex-noise", "LICENSE"],
  ["polygon-clipping", "LICENSE.md"],
  ["maplibre-gl", "LICENSE.txt"],
])
  await copyFile(
    new URL(`../node_modules/${pkg}/${file}`, import.meta.url),
    new URL(`${pkg}-LICENSE.txt`, out),
  );

const splayReadme = await readFile(
  new URL("../node_modules/splaytree/Readme.md", import.meta.url),
  "utf8",
);
await writeFile(
  new URL("splaytree-LICENSE.txt", out),
  splayReadme.split("## License")[1].trim() + "\n",
);
