import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import "./vendor-reicon.mjs";
import "./vendor-geography.mjs";
const target = new URL("../dist/vendor/", import.meta.url);
await mkdir(target, { recursive: true });
const paper = new URL("paper/", target);
await mkdir(new URL("shaders/", paper), { recursive: true });
for (const file of [
  "shader-mount.js",
  "vertex-shader.js",
  "shader-utils.js",
  "shader-sizing.js",
  "get-shader-color-from-string.js",
  "get-shader-noise-texture.js",
  "shaders/warp.js",
])
  await copyFile(
    new URL(
      "../node_modules/@paper-design/shaders/dist/" + file,
      import.meta.url,
    ),
    new URL(file, paper),
  );
for (const file of ["LICENSE", "NOTICE"])
  await copyFile(
    new URL("../node_modules/@paper-design/shaders/" + file, import.meta.url),
    new URL(file, paper),
  );
for (const file of ["three.module.js", "three.core.js"])
  await copyFile(
    new URL("../node_modules/three/build/" + file, import.meta.url),
    new URL(file, target),
  );
const controls = await readFile(
  new URL(
    "../node_modules/three/examples/jsm/controls/OrbitControls.js",
    import.meta.url,
  ),
  "utf8",
);
await writeFile(
  new URL("OrbitControls.js", target),
  controls.replace("from 'three'", "from './three.module.js'"),
);
await copyFile(
  new URL("../node_modules/three/LICENSE", import.meta.url),
  new URL("THREE-LICENSE.txt", target),
);
const fonts = new URL("../dist/fonts/", import.meta.url);
await mkdir(fonts, { recursive: true });
for (const family of ["manrope", "space-grotesk"]) {
  await copyFile(
    new URL(
      `../node_modules/@fontsource-variable/${family}/files/${family}-latin-wght-normal.woff2`,
      import.meta.url,
    ),
    new URL(`${family}-latin-wght-normal.woff2`, fonts),
  );
  await copyFile(
    new URL(
      `../node_modules/@fontsource-variable/${family}/LICENSE`,
      import.meta.url,
    ),
    new URL(`${family}-LICENSE.txt`, fonts),
  );
}
