import test from "node:test";
import assert from "node:assert/strict";
import { generateTerritory } from "../dist/territory.js";
import {
  contains,
  pointInMulti,
  multiArea,
  elevation,
} from "../dist/geography.js";
import {
  initialState,
  regionalMetrics,
  municipalMetrics,
  advance,
} from "../dist/model.js";
const sum = (a) => a.reduce((n, v) => n + v, 0);
test("country geometry and demographics replay exactly; landforms differ beyond a coastline phase", () => {
  const a = generateTerritory({ seed: 1042, population: 24.8 });
  assert.deepEqual(a, generateTerritory({ seed: 1042, population: 24.8 }));
  const b = generateTerritory({
      seed: 1042,
      population: 24.8,
      kind: "elongated",
    }),
    c = generateTerritory({ seed: 1042, population: 24.8, kind: "island" });
  const ratio = (t) => {
    const xs = t.land.map((p) => p[0]),
      ys = t.land.map((p) => p[1]);
    return (
      (Math.max(...xs) - Math.min(...xs)) / (Math.max(...ys) - Math.min(...ys))
    );
  };
  assert.ok(Math.abs(ratio(b) - ratio(c)) > 0.15);
});
test("all municipalities are on land and in their state; population, urban/rural and areas conserve totals", () => {
  for (const seed of [1, 2, 17, 119, 1042, 99999]) {
    const t = generateTerritory({
      seed,
      population: seed === 1 ? 1 : seed === 99999 ? 500 : 67,
    });
    assert.ok(t.regions.length >= 3 && t.regions.length <= 12);
    assert.ok(Math.abs(sum(t.regions.map((r) => r.share)) - 1) < 1e-12);
    assert.ok(
      Math.abs(sum(t.cities.map((c) => c.populationShare)) - 1) < 1e-12,
    );
    assert.ok(
      Math.abs(sum(t.cities.map((c) => c.urbanShare + c.ruralShare)) - 1) <
        1e-12,
    );
    assert.ok(Math.abs(sum(t.cities.map((c) => c.areaKm2)) - t.areaKm2) < 1e-6);
    assert.equal(t.cities.filter((c) => c.capital).length, 1);
    for (const r of t.regions) {
      const local = t.cities.filter((c) => t.regions[c.region] === r);
      assert.ok(
        Math.abs(sum(local.map((c) => c.populationShare)) - r.share) < 1e-12,
      );
      assert.ok(Math.abs(sum(local.map((c) => c.areaKm2)) - r.areaKm2) < 1e-6);
      assert.ok(r.areaKm2 > 0 && multiArea(r.shape) > 0);
    }
    for (const c of t.cities) {
      assert.ok(contains(t.land, c.x, c.y));
      assert.ok(pointInMulti(t.regions[c.region].shape, c.x, c.y));
      assert.ok(c.areaKm2 > 0 && multiArea(c.shape) > 0);
    }
  }
});
test("settlement count responds to initial population, while advancing preserves geography and conserves people", () => {
  const t = generateTerritory({ seed: 71, population: 1 }),
    large = generateTerritory({ seed: 71, population: 500 });
  assert.ok(large.cities.length > t.cities.length * 2);
  assert.deepEqual(large.land, t.land);
  let s = initialState({ population: 1, seed: 71 });
  s.territory = t;
  const copy = JSON.stringify(t);
  s = advance(s);
  assert.equal(JSON.stringify(s.territory), copy);
  assert.ok(
    Math.abs(
      sum(s.territory.cities.map((c) => municipalMetrics(s, c).population)) -
        s.metrics.population,
    ) < 1e-9,
  );
  const r = regionalMetrics(s, 0);
  assert.equal(r.density, (r.population * 1e6) / r.areaKm2);
  const a = municipalMetrics(s, t.cities[0]),
    b = municipalMetrics(s, t.cities[1]);
  assert.notEqual(a.population, b.population);
  assert.equal(a.density, (a.population * 1e6) / a.areaKm2);
});
test("legacy state keeps original metrics and six-region distribution", () => {
  const s = initialState();
  assert.equal(s.territory, undefined);
  assert.equal(regionalMetrics(s, 0).population, 24.8 * 0.1);
  assert.equal(regionalMetrics(s, 0).areaKm2, undefined);
});
test("rivers never climb the generated heightfield and configuration is bounded", () => {
  const t = generateTerritory({ seed: 1042, population: 25 });
  for (const path of t.rivers)
    for (let i = 1; i < path.length; i++)
      assert.ok(
        elevation(...path[i], t.seed, t.profile) <=
          elevation(...path[i - 1], t.seed, t.profile) + 1e-8,
      );
  for (const args of [
    { seed: 0, population: 1 },
    { seed: 1, population: 0 },
    { seed: 1, population: 1, areaKm2: -1 },
    { seed: 1, population: 1, kind: "wrong" },
  ])
    assert.throws(() => generateTerritory(args));
});

test("Atlas data uses the same clipped boundaries, populations and finite fictional coordinates", async () => {
  const { atlasData } = await import("../dist/atlas-data.js");
  const t = generateTerritory({ seed: 119, population: 67 }),
    s = initialState({ seed: 119, population: 67 });
  s.territory = t;
  const data = atlasData(s, t.cities);
  assert.equal(data.states.features.length, t.regions.length);
  assert.equal(data.municipalities.features.length, t.cities.length);
  assert.ok(
    Math.abs(
      sum(data.cities.features.map((f) => f.properties.population)) - 67,
    ) < 1e-9,
  );
  for (const f of data.states.features) {
    for (const v of f.geometry.coordinates.flat(3))
      assert.ok(Number.isFinite(v));
  }
  assert.deepEqual(
    data.cities.features[0].geometry.coordinates,
    data.project([t.cities[0].x, t.cities[0].y]),
  );
});

test("v2 incidents reference existing states and survive serialization", async () => {
  const { createCountry } = await import("../dist/country.js");
  const { decisionFor, advanceTurn } = await import("../dist/simulation.js");
  let s = createCountry({ seed: 40315, population: 67 });
  for (let i = 0; i < 16 && !decisionFor(s); i++) s = advanceTurn(s);
  const event = decisionFor(s);
  assert.ok(event);
  assert.ok(s.territory.regions.some((r) => r.name === event.region));
  assert.deepEqual(decisionFor(JSON.parse(JSON.stringify(s))), event);
});

test("resolved default settings reproduce the same geography as implicit settings", () => {
  const a = generateTerritory({ seed: 719, population: 24.8 });
  const b = generateTerritory({
    seed: 719,
    population: 24.8,
    kind: a.kind,
    areaKm2: a.areaKm2,
    urbanization: a.urbanization,
  });
  assert.deepEqual(a, b);
});
