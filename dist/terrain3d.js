import * as THREE from "./vendor/three.module.js";
import { OrbitControls } from "./vendor/OrbitControls.js";
import {
  elevation,
  landPoints,
  contains,
  voronoiCell,
  regionIndexAt,
} from "./geography.js";
import { regionDefs, regionsOf, regionalMetrics, clamp } from "./model.js";

export function buildTerrainGeometry(seed, territory = null) {
  const land = territory?.land ?? landPoints(seed);
  const defs = territory?.regions ?? regionDefs;
  const height = (x, y) => 4 + elevation(x, y, seed, territory?.profile) * 88;
  const positions = [],
    colors = [],
    indices = [],
    owners = [],
    side = 157,
    dx = 680 / (side - 1),
    dy = 650 / (side - 1);
  for (let j = 0; j < side; j++)
    for (let i = 0; i < side; i++) {
      const x = 120 + i * dx,
        y = 55 + j * dy;
      positions.push(x - 460, height(x, y), y - 370);
      colors.push(1, 1, 1);
      const ri = regionIndexAt(defs, x, y);
      owners.push({ region: ri, x, y });
      if (i < side - 1 && j < side - 1) {
        let a = j * side + i,
          b = a + 1,
          c = a + side,
          d = c + 1;
        if (contains(land, x + dx / 3, y + dy / 3)) indices.push(a, c, b);
        if (contains(land, x + (dx * 2) / 3, y + (dy * 2) / 3))
          indices.push(b, c, d);
      }
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return { geometry, owners };
}

export function createTerrain3D(host, { state, cities, onSelect, onError }) {
  let disposed = false,
    raf = 0,
    visible = true,
    selected = 3,
    layer = "relevo",
    dark = document.documentElement.dataset.theme === "dark",
    currentState = state;
  const defs = regionsOf(state);
  const land = state.territory?.land ?? landPoints(state.seed),
    scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute(
    "aria-label",
    "Território 3D. Arraste para girar. Use os controles de região para selecionar.",
  );
  host.append(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(36, 1, 1, 4000);
  camera.position.set(560, 740, 780);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 20, 0);
  controls.enableDamping = false;
  controls.minDistance = 360;
  controls.maxDistance = 1600;
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.maxTargetRadius = 400;
  const ambient = new THREE.HemisphereLight(0xf4faff, 0x738574, 2.4);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff7df, 2.3);
  sun.position.set(-300, 700, -200);
  scene.add(sun);
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(5000, 5000),
    new THREE.MeshBasicMaterial({ color: 0xdce8ee }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -3;
  scene.add(water);
  const height = (x, y) =>
    4 + elevation(x, y, state.seed, state.territory?.profile) * 88;
  const toWorld = (x, y, offset = 0) =>
    new THREE.Vector3(x - 460, height(x, y) + offset, y - 370);
  const { geometry, owners } = buildTerrainGeometry(
    state.seed,
    state.territory,
  );
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const terrain = new THREE.Mesh(geometry, material);
  scene.add(terrain);
  const borders = new THREE.Group();
  scene.add(borders);
  function lineFrom(points, color, opacity) {
    const g = new THREE.BufferGeometry().setFromPoints(points),
      m = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const line = new THREE.LineSegments(g, m);
    borders.add(line);
    return line;
  }
  defs.forEach((r, index) => {
    const rings = r.shape
        ? r.shape.flatMap((poly) => poly)
        : [voronoiCell(r, defs)],
      points = [];
    for (const poly of rings)
      for (let k = 0; k < poly.length; k++) {
        let a = poly[k],
          b = poly[(k + 1) % poly.length],
          steps = Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) / 5);
        for (let t = 0; t < steps; t++) {
          const t1 = t / steps,
            t2 = (t + 1) / steps,
            x1 = a[0] + (b[0] - a[0]) * t1,
            y1 = a[1] + (b[1] - a[1]) * t1,
            x2 = a[0] + (b[0] - a[0]) * t2,
            y2 = a[1] + (b[1] - a[1]) * t2;
          if (contains(land, (x1 + x2) / 2, (y1 + y2) / 2))
            points.push(toWorld(x1, y1, 1.2), toWorld(x2, y2, 1.2));
        }
      }
    const line = lineFrom(points, 0xffffff, 0.5);
    line.userData.region = index;
  });
  // A continuous shoreline masks the tiny triangular edge steps of the terrain mesh.
  const coastPoints = land.map((p) => toWorld(...p, 0.3));
  coastPoints.push(coastPoints[0]);
  const coast = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(coastPoints),
    new THREE.LineBasicMaterial({
      color: 0xa2b5a4,
      transparent: true,
      opacity: 0.7,
    }),
  );
  scene.add(coast);
  const cityGroup = new THREE.Group();
  scene.add(cityGroup);
  const sphere = new THREE.SphereGeometry(1, 8, 6),
    cityMaterials = [
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      new THREE.MeshBasicMaterial({ color: 0xc7ff3d }),
    ];
  cities.forEach((c, i) => {
    const marker = new THREE.Mesh(sphere, cityMaterials[c.capital ? 1 : 0]);
    marker.position.copy(toWorld(c.x, c.y, 4));
    marker.scale.setScalar(c.capital ? 5 : c.major ? 3.5 : 1.8);
    marker.userData.city = i;
    cityGroup.add(marker);
  });
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let down = null;
  function pointerDown(e) {
    down = [e.clientX, e.clientY];
  }
  function pointerUp(e) {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5)
      return;
    down = null;
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const cityHit = raycaster.intersectObjects(cityGroup.children)[0];
    if (cityHit) {
      const city = cities[cityHit.object.userData.city];
      onSelect(city.region, city);
      return;
    }
    const hit = raycaster.intersectObject(terrain)[0];
    if (hit) {
      const x = hit.point.x + 460,
        y = hit.point.z + 370;
      const closest = regionIndexAt(defs, x, y);
      onSelect(closest, null);
    }
  }
  function draw() {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    renderer.render(scene, camera);
  }
  function requestDraw() {
    if (!raf && !disposed && visible && !document.hidden)
      raf = requestAnimationFrame(draw);
  }
  function setTheme(value) {
    dark = value === "dark";
    scene.background = new THREE.Color(dark ? 0x101d19 : 0xe0e9e1);
    water.material.color.copy(scene.background);
    ambient.intensity = dark ? 1.8 : 2.4;
    sun.intensity = dark ? 1.4 : 2.3;
    recolor();
  }
  function recolor() {
    const metrics = defs.map((_, i) => regionalMetrics(currentState, i)),
      maxDensity = Math.max(1, ...metrics.map((m) => m.density ?? 0)),
      maxShare = Math.max(...defs.map((r) => r.share)),
      c = new THREE.Color(),
      low = new THREE.Color(dark ? "#466f64" : "#729b7b"),
      high = new THREE.Color(dark ? "#9aafa4" : "#e7e4cc");
    owners.forEach((v, i) => {
      if (layer === "relevo")
        c.copy(low).lerp(
          high,
          elevation(v.x, v.y, state.seed, state.territory?.profile),
        );
      else {
        const m = metrics[v.region],
          t =
            layer === "populacao"
              ? defs[v.region].share / maxShare
              : layer === "densidade"
                ? Math.log1p(m.density ?? 0) / Math.log1p(maxDensity)
                : layer === "renda"
                  ? (m.income /
                      ((currentState.metrics.gdp /
                        currentState.metrics.population) *
                        1000) -
                      0.5) /
                    0.8
                  : m.welfare / 100;
        c.set(dark ? "#274f64" : "#cfe9db").lerp(
          new THREE.Color(dark ? "#5aade4" : "#267ca4"),
          clamp(t, 0, 1),
        );
      }
      if (v.region === selected) c.lerp(new THREE.Color("#c7ff3d"), 0.13);
      geometry.attributes.color.setXYZ(i, c.r, c.g, c.b);
    });
    geometry.attributes.color.needsUpdate = true;
    borders.children.forEach((b) => {
      b.material.opacity = b.userData.region === selected ? 0.95 : 0.34;
      b.material.color.set(dark ? "#d3e8f6" : "#ffffff");
    });
    requestDraw();
  }
  function resize() {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    requestDraw();
  }
  function visibility() {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else requestDraw();
  }
  function contextLost(e) {
    e.preventDefault();
    onError("A visão 3D foi interrompida. O mapa 2D continua disponível.");
  }
  const resizeObserver = new ResizeObserver(resize),
    intersection = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (!visible) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else requestDraw();
    });
  resizeObserver.observe(host);
  intersection.observe(host);
  controls.addEventListener("change", requestDraw);
  renderer.domElement.addEventListener("pointerdown", pointerDown);
  renderer.domElement.addEventListener("pointerup", pointerUp);
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  document.addEventListener("visibilitychange", visibility);
  resize();
  setTheme(document.documentElement.dataset.theme);
  return {
    setTheme,
    update(s, options = {}) {
      currentState = s;
      selected = options.selected ?? selected;
      layer = options.layer ?? layer;
      recolor();
    },
    zoomBy(factor) {
      camera.position
        .sub(controls.target)
        .multiplyScalar(factor)
        .add(controls.target);
      controls.update();
      requestDraw();
    },
    reset() {
      camera.position.set(560, 740, 780);
      controls.target.set(0, 20, 0);
      controls.update();
      requestDraw();
    },
    focus(index) {
      const r = defs[index];
      controls.target.copy(toWorld(r.x, r.y));
      camera.position
        .copy(controls.target)
        .add(new THREE.Vector3(260, 420, 460));
      controls.update();
      requestDraw();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      controls.dispose();
      const geometries = new Set(),
        materials = new Set();
      scene.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        if (o.material) materials.add(o.material);
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
