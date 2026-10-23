import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  advance,
  budget,
  regionalMetrics,
} from "../dist/model.js";
import {
  quoteInvestment,
  startInvestment,
  cancelInvestment,
} from "../dist/investments.js";
import {
  investmentFinance,
  investmentEffects,
} from "../dist/investment-ledger.js";
import {
  projectQuarter,
  advanceTurn,
  decisionFor,
  resolveDecision,
} from "../dist/simulation.js";
const begin = () => startInvestment(initialState(), 5, "water");
test("quote and contract are deterministic, additional, bounded and do not mutate source", () => {
  const s = initialState(),
    copy = structuredClone(s),
    q = quoteInvestment(s, 5, "water"),
    n = begin();
  assert.deepEqual(s, copy);
  assert.ok(
    q.allowed &&
      q.cost > 0 &&
      q.people > 0 &&
      q.operationTurns > q.deliveryTurns,
  );
  assert.deepEqual(n, begin());
  assert.equal(n.investments.length, 1);
  assert.ok(budget(n).spending > budget(s).spending);
  assert.equal(startInvestment(n, 5, "water"), n);
  assert.equal(startInvestment(s, 99, "water"), s);
  assert.equal(startInvestment(s, 0, "unknown"), s);
  assert.deepEqual(cancelInvestment(n, n.investments[0].id).investments, []);
});
test("construction pays exactly once, no early benefit; upkeep and benefits start after delivery", () => {
  let s = begin(),
    paid = 0,
    delivered;
  const cost = s.investments[0].cost,
    upkeep = s.investments[0].upkeepAnnual;
  for (let i = 0; i < 40; i++) {
    const f = investmentFinance(s),
      before = s;
    assert.equal(f.upkeepQuarter, delivered ? upkeep / 4 : 0);
    s = advance(s);
    paid += f.constructionQuarter;
    if (s.investments[0].phase === "ready") {
      delivered = true;
      assert.equal(investmentEffects(s).welfare, 0);
      assert.equal(s.investments[0].paid, cost);
      assert.equal(cancelInvestment(s, s.investments[0].id), s);
    }
    if (s.investments[0].phase === "operating") {
      assert.ok(investmentEffects(s).welfare > 0);
      assert.ok(
        regionalMetrics(s, 5).access >
          regionalMetrics({ ...s, investments: [] }, 5).access,
      );
      assert.ok(
        s.metrics.welfare >
          advance({ ...before, investments: [] }).metrics.welfare,
      );
      assert.ok(Math.abs(paid - cost) < 1e-9);
      assert.equal(investmentFinance(s).constructionQuarter, 0);
      assert.equal(investmentFinance(s).upkeepQuarter, upkeep / 4);
      return;
    }
    assert.equal(investmentEffects(s).growth, 0);
  }
  assert.fail("project never entered operation");
});
test("low capacity slows progress without overbilling and old scenarios stay unchanged", () => {
  const s = initialState();
  assert.equal(investmentFinance(s).constructionQuarter, 0);
  assert.equal(budget(s).projects, 0);
  assert.deepEqual(
    advance(s).metrics,
    advance({ ...s, investments: [] }).metrics,
  );
  const low = { ...s, capacity: 0.35 },
    high = { ...s, capacity: 0.95 };
  assert.ok(
    quoteInvestment(low, 5, "transport").operationTurns >
      quoteInvestment(high, 5, "transport").operationTurns,
  );
  let a = startInvestment(low, 5, "transport"),
    b = startInvestment(high, 5, "transport");
  for (let i = 0; i < 4; i++) {
    a = advance(a);
    b = advance(b);
  }
  assert.ok(a.investments[0].work < b.investments[0].work);
  for (let i = 0; i < 40; i++) a = advance(a);
  assert.equal(a.investments[0].paid, a.investments[0].cost);
});
test("three active contracts, horizon and pending decisions are respected; forecasts replay save/load", () => {
  let s = initialState();
  for (const type of ["water", "health", "education"])
    s = startInvestment(s, 0, type);
  assert.equal(startInvestment(s, 1, "transport"), s);
  assert.equal(
    quoteInvestment({ ...initialState(), quarter: 159 }, 0, "water").allowed,
    false,
  );
  const copy = JSON.stringify(s),
    expected = projectQuarter(s),
    actual = advanceTurn(JSON.parse(copy));
  assert.equal(JSON.stringify(s), copy);
  assert.deepEqual(actual.metrics, expected.metrics);
  assert.deepEqual(actual.investments, expected.investments);
  assert.ok(decisionFor(actual));
  assert.equal(advanceTurn(actual), actual);
  const event = decisionFor(actual),
    chosen = resolveDecision(actual, event.id, event.choices[0].id);
  assert.deepEqual(
    projectQuarter(chosen).investments,
    advanceTurn(chosen).investments,
  );
});
test("capital invoice enters the debt equation once, without a second extraordinary charge", () => {
  const a = initialState(),
    b = begin(),
    base = advance(a),
    next = advance(b);
  const growth = base.metrics.gdp / a.metrics.gdp;
  const invoice = investmentFinance(b).constructionQuarter;
  assert.ok(
    Math.abs(
      (next.metrics.debt - base.metrics.debt) * growth -
        (invoice / a.metrics.gdp) * 100,
    ) < 1e-9,
  );
});

test("MapLibre and state/municipal indices reflect the same operational portfolio", async () => {
  const { createCountry } = await import("../dist/country.js");
  const { atlasData } = await import("../dist/atlas-data.js");
  const { municipalMetrics } = await import("../dist/model.js");
  let s = startInvestment(createCountry({ seed: 1042 }), 0, "health");
  for (let i = 0; i < 20 && s.investments[0].phase !== "operating"; i++)
    s = advance(s);
  const d = atlasData(s, s.territory.cities),
    c = s.territory.cities.find((c) => c.region === 0);
  assert.equal(d.projects.features[0].properties.operating, 1);
  assert.equal(d.projects.features[0].properties.count, 1);
  assert.ok(
    municipalMetrics(s, c).access >
      municipalMetrics({ ...s, investments: [] }, c).access,
  );
  assert.equal(
    d.states.features[0].properties.access,
    regionalMetrics(s, 0).access,
  );
});
