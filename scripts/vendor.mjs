import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
const target = new URL("../dist/vendor/", import.meta.url);
await mkdir(target, { recursive: true });
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
