import test from "node:test";
import assert from "node:assert/strict";
import { buildTerrainGeometry } from "../dist/terrain3d.js";
import { landPoints, contains } from "../dist/geography.js";
test("3D geometry is bounded and deterministic without a GPU", () => {
  const a = buildTerrainGeometry(1042),
    b = buildTerrainGeometry(1042);
  try {
    assert.equal(a.geometry.attributes.position.count, 157 * 157);
    assert.ok(a.geometry.index.count < 157 * 157 * 6);
    assert.deepEqual(
      a.geometry.attributes.position.array,
      b.geometry.attributes.position.array,
    );
    for (const v of a.geometry.attributes.normal.array)
      assert.ok(Number.isFinite(v));
    assert.equal(a.owners.length, 157 * 157);
  } finally {
    a.geometry.dispose();
    b.geometry.dispose();
  }
});
test("3D triangles stay on land at their centroids; all states represented", () => {
  const { geometry, owners } = buildTerrainGeometry(9999);
  try {
    const pos = geometry.attributes.position,
      ind = geometry.index.array,
      land = landPoints(9999);
    for (let i = 0; i < ind.length; i += 3) {
      const ids = [ind[i], ind[i + 1], ind[i + 2]],
        x = ids.reduce((n, id) => n + pos.getX(id), 0) / 3 + 460,
        y = ids.reduce((n, id) => n + pos.getZ(id), 0) / 3 + 370;
      assert.ok(contains(land, x, y));
    }
    assert.equal(new Set(owners.map((o) => o.region)).size, 6);
  } finally {
    geometry.dispose();
  }
});
