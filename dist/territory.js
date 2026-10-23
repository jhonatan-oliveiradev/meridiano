import { Delaunay, clipping } from "./vendor/geography-engine.js";
import {
  rng,
  coastRadius,
  elevation,
  contains,
  multiArea,
  pointInMulti,
  transportNetwork,
} from "./geography.js";
export const landforms = {
  island: "Ilha",
  continental: "Continental",
  elongated: "Alongado",
  peninsula: "Península",
};
const names = [
  "Veredas",
  "Aurora",
  "Cedros",
  "Montes Claros",
  "Campo Alto",
  "Rio Sereno",
  "Serra Azul",
  "Porto Claro",
  "Boa Esperança",
  "Vale Novo",
  "Ponta Verde",
  "Santa Luz",
  "Águas Altas",
  "Horizonte",
  "Pedra Branca",
  "Jardim do Sul",
  "Monte Belo",
  "Lagoa Nova",
  "Santa Rosa",
  "Vila Serena",
  "Sol Nascente",
  "Campo Verde",
  "Rio Branco",
  "Nova Estrela",
];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sum = (a) => a.reduce((n, v) => n + v, 0);
function closed(points) {
  return [...points, points[0]];
}
function normalize(values) {
  const total = sum(values);
  const result = values.map((v) => v / total);
  result[result.length - 1] += 1 - sum(result);
  return result;
}
function boundaryDistance(ring, p) {
  let distance = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i],
      b = ring[(i + 1) % ring.length],
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      t = clamp(
        ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / (dx * dx + dy * dy || 1),
        0,
        1,
      );
    distance = Math.min(
      distance,
      Math.hypot(p.x - a[0] - t * dx, p.y - a[1] - t * dy),
    );
  }
  return distance;
}
function intersect(a, b) {
  // Snap shared boundaries before boolean operations to avoid near-coincident edges.
  const snap = (shape, precision) =>
    shape.map((poly) =>
      poly.map((ring) =>
        ring.map((p) => p.map((v) => Math.round(v * precision) / precision)),
      ),
    );
  try {
    return clipping.intersection(snap(a, 1e6), snap(b, 1e6));
  } catch {
    return clipping.intersection(snap(a, 1e4), snap(b, 1e4));
  }
}
export function generateTerritory({
  seed,
  population,
  areaKm2,
  kind,
  urbanization,
} = {}) {
  if (
    !Number.isInteger(seed) ||
    seed < 1 ||
    seed > 99999 ||
    !Number.isFinite(population) ||
    population < 1 ||
    population > 500
  )
    throw new RangeError("Semente ou população inválida");
  if (
    areaKm2 !== undefined &&
    (!Number.isFinite(areaKm2) || areaKm2 < 5000 || areaKm2 > 8000000)
  )
    throw new RangeError("Área inválida");
  if (kind !== undefined && !landforms[kind])
    throw new RangeError("Formato inválido");
  const rand = rng(seed + 4701),
    pick = (a) => a[Math.floor(rand() * a.length)];
  kind ??= pick(Object.keys(landforms));
  areaKm2 ??=
    Math.round(Math.exp(Math.log(35000) + rand() * Math.log(70)) / 100) * 100;
  urbanization ??= 0.42 + rand() * 0.47;
  if (
    !Number.isFinite(urbanization) ||
    urbanization < 0.2 ||
    urbanization > 0.95
  )
    throw new RangeError("Urbanização inválida");
  const profile = {
    kind,
    cx: 0,
    cy: 0,
    rx: kind === "elongated" ? 340 : kind === "peninsula" ? 300 : 270,
    ry: kind === "elongated" ? 145 : kind === "peninsula" ? 205 : 245,
    rotation: rand() * Math.PI,
    phase: rand() * Math.PI * 2,
    waves: [0.08 + rand() * 0.16, 0.04 + rand() * 0.08, 0.015 + rand() * 0.045],
    ridgeAngle: rand() * Math.PI,
    ridgeOffset: (rand() - 0.5) * 0.6,
  };
  const raw = Array.from({ length: 240 }, (_, i) => {
    const t = (i / 240) * Math.PI * 2,
      r = coastRadius(t, profile),
      x = Math.cos(t) * profile.rx * r,
      y = Math.sin(t) * profile.ry * r;
    return [
      x * Math.cos(profile.rotation) - y * Math.sin(profile.rotation),
      x * Math.sin(profile.rotation) + y * Math.cos(profile.rotation),
    ];
  });
  const xs = raw.map((p) => p[0]),
    ys = raw.map((p) => p[1]),
    minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys),
    scale = Math.min(630 / (maxX - minX), 570 / (maxY - minY));
  profile.cx = 460 - ((minX + maxX) / 2) * scale;
  profile.cy = 370 - ((minY + maxY) / 2) * scale;
  profile.rx *= scale;
  profile.ry *= scale;
  const land = raw.map(([x, y]) => [
    profile.cx + x * scale,
    profile.cy + y * scale,
  ]);
  const countryPoly = [[closed(land)]],
    kmPerUnit = Math.sqrt(areaKm2 / multiArea(countryPoly));
  // A bounded sample field for settlement suitability; geometry areas use clipped polygons.
  const points = [];
  for (let y = 82; y < 664; y += 12)
    for (let x = 142; x < 790; x += 12)
      if (contains(land, x, y)) {
        const h = elevation(x, y, seed, profile),
          slope = Math.hypot(
            elevation(x + 3, y, seed, profile) - h,
            elevation(x, y + 3, seed, profile) - h,
          );
        points.push({ x, y, h, slope });
      }
  const rivers = [];
  for (const source of [...points]
    .sort((a, b) => b.h - a.h)
    .filter((_, i) => i % 5 === 0)) {
    if (rivers.length >= 3) break;
    if (
      source.h < 0.45 ||
      rivers.some(
        (path) => Math.hypot(path[0][0] - source.x, path[0][1] - source.y) < 90,
      )
    )
      continue;
    let x = source.x,
      y = source.y,
      height = source.h,
      path = [[x, y]];
    for (let i = 0; i < 150; i++) {
      let best = null;
      for (let j = 0; j < 16; j++) {
        const t = (j * Math.PI) / 8,
          nx = x + Math.cos(t) * 7,
          ny = y + Math.sin(t) * 7,
          z = elevation(nx, ny, seed, profile);
        if (z < height - 0.00001 && (!best || z < best.h))
          best = { x: nx, y: ny, h: z };
      }
      if (!best) break;
      if (!contains(land, best.x, best.y)) break;
      x = best.x;
      y = best.y;
      height = best.h;
      path.push([x, y]);
    }
    if (path.length > 10) rivers.push(path);
  }
  for (const p of points) {
    const coast = boundaryDistance(land, p);
    let water = coast;
    for (const river of rivers)
      for (const q of river)
        water = Math.min(water, Math.hypot(q[0] - p.x, q[1] - p.y));
    p.coast = coast;
    p.water = water;
    p.weight =
      (0.15 + 1.5 * Math.exp(-water / 70)) *
      (1 - 0.75 * p.h) *
      Math.exp(-p.slope * 8);
  }
  const count = clamp(
    Math.round(
      2 +
        Math.log10(areaKm2 / 5000) * 1.8 +
        Math.log2(population + 1) * 0.45 +
        (rand() - 0.5) * 2,
    ),
    3,
    12,
  );
  // Farthest viable sites spread administrations, rather than fixing six anchors.
  const candidates = points.filter((p) => p.coast > 4);
  const sites = [candidates.reduce((a, b) => (a.weight > b.weight ? a : b))];
  while (sites.length < count) {
    let best = null,
      value = -1;
    for (const p of candidates) {
      const d = Math.min(...sites.map((s) => Math.hypot(s.x - p.x, s.y - p.y)));
      const v = d * (0.45 + p.weight);
      if (v > value) {
        value = v;
        best = p;
      }
    }
    sites.push(best);
  }
  const delaunay = Delaunay.from(
      sites,
      (p) => p.x,
      (p) => p.y,
    ),
    voronoi = delaunay.voronoi([0, 0, 1000, 760]);
  const regions = sites.map((p, i) => ({
    id: `s${i}`,
    name: `${names[(seed + i * 7) % names.length]}${i >= names.length ? " " + i : ""}`,
    x: p.x,
    y: p.y,
    capital: names[(seed + i * 5 + 3) % names.length],
    shape: intersect(countryPoly, [[voronoi.cellPolygon(i)]]),
    color: `hsl(${75 + i * 13} 22% 58%)`,
  }));
  const regionalPoints = regions.map(() => []);
  for (const p of points) {
    p.region = delaunay.find(p.x, p.y);
    regionalPoints[p.region].push(p);
  }
  const shares = normalize(
    regionalPoints.map((a) => sum(a.map((p) => p.weight))),
  );
  const regionAreas = regions.map((r) => multiArea(r.shape) * kmPerUnit ** 2);
  regionAreas[regionAreas.length - 1] += areaKm2 - sum(regionAreas);
  regions.forEach((r, i) => {
    const local = regionalPoints[i],
      avgH = sum(local.map((p) => p.h)) / local.length;
    r.share = shares[i];
    r.areaKm2 = regionAreas[i];
    r.terrain = 1 + avgH * 0.9;
    r.access = clamp(
      0.8 - avgH * 0.5 + Math.exp(-sites[i].water / 70) * 0.12,
      0.35,
      0.95,
    );
    r.income = 0.6 + r.access * 0.65 + (sites[i].coast < 35 ? 0.12 : 0);
    r.sector =
      sites[i].coast < 35
        ? "Portos, comércio e serviços"
        : avgH > 0.5
          ? "Mineração e turismo de montanha"
          : sites[i].water < 35
            ? "Agricultura e serviços"
            : "Agroindústria e comércio";
    r.description = `${r.sector}. ${avgH > 0.5 ? "Relevo elevado e ocupação dispersa." : sites[i].coast < 35 ? "Litoral com acesso ao comércio." : "Cidades e áreas rurais no interior."}`;
  });
  const meanIncome = sum(regions.map((r) => r.income * r.share));
  for (const r of regions) r.income /= meanIncome;
  const totalCities = clamp(
      Math.round(12 + 10 * Math.sqrt(population)),
      20,
      240,
    ),
    cities = [];
  const counts = regions.map((r) =>
    Math.max(2, Math.floor(totalCities * r.share)),
  );
  while (sum(counts) < totalCities) counts[Math.floor(rand() * count)]++;
  while (sum(counts) > totalCities) {
    const i = counts.indexOf(Math.max(...counts));
    counts[i]--;
  }
  regions.forEach((r, i) => {
    const local = regionalPoints[i],
      eligible = local.filter(
        (p) =>
          pointInMulti(r.shape, p.x, p.y) &&
          r.shape.every((poly) =>
            poly.every((ring) => boundaryDistance(ring, p) > 2),
          ),
      ),
      chosen = [sites[i]];
    while (chosen.length < counts[i]) {
      let best = null,
        score = -1;
      for (const p of eligible) {
        const d = Math.min(
          ...chosen.map((c) => Math.hypot(p.x - c.x, p.y - c.y)),
        );
        const value = d * (0.12 + p.weight);
        if (value > score) {
          best = p;
          score = value;
        }
      }
      if (score <= 0) break;
      chosen.push(best);
    }
    const cityD = Delaunay.from(
        chosen,
        (p) => p.x,
        (p) => p.y,
      ),
      cityV = cityD.voronoi([0, 0, 1000, 760]);
    const ruralWeights = chosen.map(() => 0);
    for (const p of local) ruralWeights[cityD.find(p.x, p.y)] += p.weight;
    const urban = normalize(
        chosen.map((p, j) => (0.8 + rand() * 0.4) / (j + 1) ** 1.18),
      ),
      rural = normalize(ruralWeights);
    const shapes = chosen.map((p, j) =>
      intersect(r.shape, [[cityV.cellPolygon(j)]]),
    );
    const areas = shapes.map((shape) => multiArea(shape) * kmPerUnit ** 2);
    areas[areas.length - 1] += r.areaKm2 - sum(areas);
    chosen.forEach((p, j) => {
      const urbanShare = r.share * urbanization * urban[j],
        ruralShare = r.share * (1 - urbanization) * rural[j],
        share = urbanShare + ruralShare;
      const urbanAreaKm2 = Math.min(
        areas[j] * 0.8,
        (urbanShare * population * 1e6) / (1800 + rand() * 4200),
      );
      cities.push({
        id: `m${i}-${j}`,
        x: p.x,
        y: p.y,
        region: i,
        name:
          j === 0
            ? r.capital
            : `${names[(seed + j * 5 + i * 7) % names.length]} ${["do Norte", "do Sul", "da Serra", "do Vale", "das Águas", "do Campo", "da Costa", "do Oeste"][(Math.floor(j / 24) + i) % 8]}`,
        major: j === 0,
        capital: false,
        populationShare: share,
        urbanShare,
        ruralShare,
        areaKm2: areas[j],
        urbanAreaKm2,
        shape: shapes[j],
        access: clamp(
          r.access + (p.weight - sites[i].weight) * 0.12,
          0.3,
          0.98,
        ),
      });
    });
  });
  const totalShare = sum(cities.map((c) => c.populationShare));
  cities.at(-1).populationShare += 1 - totalShare;
  cities.at(-1).ruralShare += 1 - totalShare;
  const capital = cities.reduce((a, b) =>
    a.populationShare > b.populationShare ? a : b,
  );
  capital.capital = true;
  const network = transportNetwork(seed, cities, land);
  // Two shared, invertible shears curve every administrative boundary together.
  // Sites, coastline, water and routes use the same transform; the terrain inverts it.
  const warpRandom = rng(seed + 300);
  profile.warp = {
    a: 10 + warpRandom() * 7,
    b: 7 + warpRandom() * 6,
    f: 0.025,
    phase: warpRandom() * Math.PI * 2,
  };
  const warp = ([x, y]) => {
    x += profile.warp.a * Math.sin(y * profile.warp.f + profile.warp.phase);
    y +=
      profile.warp.b * Math.sin(x * profile.warp.f * 0.8 + profile.warp.phase);
    return [x, y];
  };
  const curve = (path) => {
    const out = [];
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i],
        b = path[i + 1],
        steps = Math.max(
          1,
          Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) / 5),
        );
      for (let j = 0; j < steps; j++)
        out.push(
          warp([
            a[0] + ((b[0] - a[0]) * j) / steps,
            a[1] + ((b[1] - a[1]) * j) / steps,
          ]),
        );
    }
    out.push(warp(path.at(-1)));
    return out;
  };
  const warpedLand = curve(closed(land)).slice(0, -1);
  for (const item of [...regions, ...cities]) {
    [item.x, item.y] = warp([item.x, item.y]);
    item.shape = item.shape.map((poly) => poly.map(curve));
  }
  for (const r of regions) {
    const points = r.shape.flat(2);
    r.bounds = [
      Math.min(...points.map((p) => p[0])),
      Math.min(...points.map((p) => p[1])),
      Math.max(...points.map((p) => p[0])),
      Math.max(...points.map((p) => p[1])),
    ];
  }
  const warpedScale = Math.sqrt(areaKm2 / multiArea([[closed(warpedLand)]]));
  return {
    version: 2,
    seed,
    populationAtCreation: population,
    areaKm2,
    kind,
    urbanization,
    profile,
    land: warpedLand,
    regions,
    cities,
    rivers: rivers.map(curve),
    roads: network.roads.map(curve),
    streets: network.streets.map(curve),
    kmPerUnit: warpedScale,
    capitalRegion: capital.region,
  };
}
