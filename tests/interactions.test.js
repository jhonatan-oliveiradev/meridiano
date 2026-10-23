import test from "node:test";
import assert from "node:assert/strict";
import { initialState, advance, regionDefs } from "../dist/model.js";
import {
  landPoints,
  generateCities,
  transportNetwork,
  contains,
} from "../dist/geography.js";
import { quarterBulletin } from "../dist/interactions.js";
test("bulletin reports actual model events at their simulated quarter without mutating state", () => {
  const s = advance(initialState()),
    before = JSON.stringify(s),
    items = quarterBulletin(s);
  assert.equal(items.length, s.events.length);
  assert.equal(items[0].title, s.events[0].title);
  assert.equal(items[0].period, "2027 · T2");
  items[0].title = "edited";
  assert.equal(JSON.stringify(s), before);
});
test("fictional road network connects every city and streets stay inland reproducibly", () => {
  const land = landPoints(317),
    cities = generateCities(317, regionDefs, land),
    network = transportNetwork(317, cities, land);
  assert.deepEqual(network, transportNetwork(317, cities, land));
  assert.equal(network.roads.length, cities.length - 1);
  assert.ok(network.streets.length > 0);
  const reached = new Set([cities[0].x + "," + cities[0].y]);
  for (const points of network.roads) {
    assert.ok(reached.has(points[0].join(",")));
    reached.add(points.at(-1).join(","));
  }
  assert.equal(reached.size, cities.length);
  assert.ok(
    network.streets.every((points) =>
      points.every((p) => contains(land, ...p)),
    ),
  );
});
