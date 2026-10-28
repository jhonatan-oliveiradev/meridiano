import test from "node:test";
import assert from "node:assert/strict";
import { initialState, regionsOf } from "../dist/model.js";
import {
  preventionAt,
  assessPrevention,
  reduceAdverse,
} from "../dist/prevention.js";
import { startInvestment } from "../dist/investments.js";
import {
  advanceTurn,
  decisionFor,
  resolveDecision,
  projectQuarter,
} from "../dist/simulation.js";
const equipped = (type = "water", seed = 1042) => {
  let s = initialState({ seed });
  for (let i = 0; i < regionsOf(s).length; i++) {
    const n = startInvestment(s, i, type);
    s = n;
    s.investments.at(-1).phase = "operating";
  }
  return s;
};
test("prevention depends on local delivered coverage, not another state or a building site", () => {
  const s = startInvestment(initialState(), 0, "water"),
    base = preventionAt(s, "water", 0).protection;
  assert.equal(preventionAt(s, "water", 0).protection, base);
  s.investments[0].phase = "operating";
  assert.ok(preventionAt(s, "water", 0).protection > base);
  assert.equal(
    preventionAt(s, "water", 1).protection,
    preventionAt(initialState(), "water", 1).protection,
  );
  s.investments[0].coverage /= 2;
  s.investments[0].people /= 2;
  assert.ok(preventionAt(s, "water", 0).protection < base + 0.6);
});
test("prevention reduces emergency recurrence over the same 40-year schedule and preserves hazards", () => {
  const base = initialState(),
    ready = equipped();
  let a = 0,
    b = 0;
  for (let q = 1; q < 160; q += 3) {
    const x = assessPrevention({ ...base, quarter: q }, "water"),
      y = assessPrevention({ ...ready, quarter: q }, "water");
    a += !x.contained;
    b += !y.contained;
    assert.equal(x.intensity, y.intensity);
  }
  assert.ok(b < a);
  assert.ok(b > 0);
  assert.equal(
    assessPrevention({ ...ready, quarter: 1 }, "water").region,
    assessPrevention(
      { ...JSON.parse(JSON.stringify(ready)), quarter: 1 },
      "water",
    ).region,
  );
});
test("prevention preserves positive effects and reduces adverse effects, including emergency cost", () => {
  assert.deepEqual(
    reduceAdverse(
      { cost: 0.6, growth: -1, welfare: 0.5, poverty: -0.2, inflation: 0.4 },
      0.5,
    ),
    { cost: 0.3, growth: -0.5, welfare: 0.5, poverty: -0.2, inflation: 0.2 },
  );
});
test("new events retain their reviewed exposure; legacy pending and scheduled responses preserve old effects", () => {
  let s = advanceTurn(initialState()),
    e = decisionFor(s);
  const copy = structuredClone(s);
  assert.ok(e.prevention);
  const n = resolveDecision(s, e.id, e.choices[0].id);
  assert.deepEqual(s, copy);
  assert.deepEqual(n.scheduledDecision.effect, e.choices[0].effect);
  const legacy = { ...s, pendingDecision: { ...s.pendingDecision } };
  delete legacy.pendingDecision.prevention;
  const old = decisionFor(legacy);
  assert.equal(old.prevention, undefined);
  assert.deepEqual(
    projectQuarter(n),
    projectQuarter(JSON.parse(JSON.stringify(n))),
  );
});
test("operating health and transport projects protect only their corresponding risks", () => {
  const h = equipped("health"),
    t = equipped("transport");
  assert.ok(
    preventionAt(h, "services", 0).protection >
      preventionAt(t, "services", 0).protection,
  );
  assert.ok(
    preventionAt(t, "freight", 0).protection >
      preventionAt(h, "freight", 0).protection,
  );
});

test("a contained event is a bulletin, does not block time or charge emergency spending", () => {
  let checked = false;
  for (let seed = 1; seed <= 100; seed++) {
    const s = equipped("water", seed),
      n = advanceTurn(s);
    if (n.preventionReport?.key !== "water") continue;
    assert.equal(n.pendingDecision, null);
    assert.equal(decisionFor(n), null);
    assert.deepEqual(n.metrics, projectQuarter(s).metrics);
    assert.ok(n.events.some((e) => e.title.startsWith("Prevenção funcionou")));
    assert.equal(n.lastReport.decision, null);
    assert.equal(advanceTurn(n).quarter, n.quarter + 1);
    checked = true;
    break;
  }
  assert.ok(checked, "a normal scheduled water event should be absorbed");
});
test("population growth dilutes delivered coverage rather than granting permanent immunity", () => {
  const s = equipped(),
    before = preventionAt(s, "water", 0).protection;
  const grown = structuredClone(s);
  grown.metrics.population *= 2;
  assert.ok(preventionAt(grown, "water", 0).protection < before);
  assert.ok(before <= 0.92);
});
