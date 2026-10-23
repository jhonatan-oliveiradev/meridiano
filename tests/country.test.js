import test from "node:test";
import assert from "node:assert/strict";
import { randomCountry, cabinetFor, governments } from "../dist/country.js";
import { initialState, advance, policyDefs } from "../dist/model.js";
import { validateRequest } from "../server/advisor.js";
import { snapshotOf } from "../dist/advisor.js";
test("random country is reproducible and varies actual initial metrics and policies", () => {
  assert.deepEqual(randomCountry(1042), randomCountry(1042));
  const a = randomCountry(1),
    b = randomCountry(2);
  assert.notEqual(a.name, b.name);
  assert.notDeepEqual(a.metrics, b.metrics);
  assert.notDeepEqual(a.policies, b.policies);
  assert.deepEqual(a.history[0], { quarter: 0, ...a.metrics });
  assert.equal(a.generated.seed, 1);
});
test("generated countries satisfy API, policy and simulation invariants", () => {
  for (let seed = 1; seed <= 120; seed++) {
    let s = randomCountry(seed);
    assert.ok(s.metrics.population >= 1 && s.metrics.population <= 500);
    assert.ok(governments.includes(s.government));
    for (const def of policyDefs) {
      assert.ok(
        s.policies[def.key] >= def.min && s.policies[def.key] <= def.max,
      );
    }
    assert.doesNotThrow(() =>
      validateRequest({ mode: "analysis", snapshot: snapshotOf(s) }),
    );
    for (let i = 0; i < 12; i++) s = advance(s);
    for (const v of Object.values(s.metrics)) assert.ok(Number.isFinite(v));
  }
});
test("cabinet title follows government without ideological economic bonuses", () => {
  assert.equal(
    cabinetFor("Monarquia constitucional").title,
    "Primeiro-ministro",
  );
  assert.equal(
    cabinetFor("República parlamentarista").title,
    "Primeiro-ministro",
  );
  assert.equal(
    cabinetFor("República democrática").title,
    "Ministro da Fazenda",
  );
  assert.equal(cabinetFor("Democracia direta").short, "Conselho");
  assert.equal(cabinetFor("Regime autoritário").short, "Planejamento");
  const a = initialState(),
    b = initialState({ government: "República parlamentarista" });
  assert.deepEqual(advance(a).metrics, advance(b).metrics);
});
