import test from "node:test";
import assert from "node:assert/strict";
import { initialState, advance, regionsOf } from "../dist/model.js";
import { createCountry } from "../dist/country.js";
import {
  createTrade,
  tradeQuarter,
  setTradePolicy,
  quoteAgreement,
  signAgreement,
  sectors,
  resourceAt,
} from "../dist/trade.js";
const enabled = () => {
  const s = initialState();
  s.trade = createTrade(s, regionsOf(s));
  return s;
};
test("resources are seeded, regional and bounded; geography is immutable", () => {
  const s = initialState(),
    copy = structuredClone(s);
  assert.deepEqual(createTrade(s, regionsOf(s)), createTrade(s, regionsOf(s)));
  assert.deepEqual(s, copy);
  const r = createTrade(s, regionsOf(s)).resources;
  assert.ok(new Set(r.map((x) => x.food)).size > 1);
  assert.notDeepEqual(
    r,
    createTrade({ ...s, seed: 123 }, regionsOf(s)).resources,
  );
  for (const x of r)
    for (const k of ["food", "energy", "minerals", "manufactures"])
      assert.ok(x[k] >= 0 && x[k] <= 1);
});
test("trade conserves units including industrial inputs and respects reserves, demand and logistics", () => {
  const s = enabled(),
    copy = structuredClone(s);
  const { report } = tradeQuarter(s);
  assert.deepEqual(s, copy);
  for (const f of report.flows) {
    assert.ok(
      Math.abs(
        f.opening +
          f.production +
          f.imports -
          f.domestic -
          f.inputs -
          f.exports -
          f.closing,
      ) < 1e-8,
      f.key,
    );
    assert.ok(f.exports <= f.demand + 1e-8);
    assert.ok(f.exports <= f.surplus + 1e-8);
    assert.ok(f.closing >= 0);
  }
  const food = report.flows.find((x) => x.key === "food");
  assert.ok(
    food.exports <= Math.max(0, food.production - food.domestic) + 1e-8,
  );
  assert.equal(report.growth, 0);
});
test("reserves restrict exports and imports cannot create manufactured output without inputs", () => {
  let s = enabled();
  for (const d of sectors) s.trade.stocks[d.key] = 0;
  const high = setTradePolicy(s, "food", {
      reserveMonths: 6,
      exportShare: 1,
      imports: true,
    }),
    low = setTradePolicy(s, "food", {
      reserveMonths: 0,
      exportShare: 1,
      imports: true,
    });
  assert.ok(
    tradeQuarter(high).report.flows[0].exports <=
      tradeQuarter(low).report.flows[0].exports,
  );
  for (const d of sectors)
    s = setTradePolicy(s, d.key, { ...s.trade.policy[d.key], imports: false });
  s.trade.resources.forEach((x) => {
    x.energy = 0;
    x.minerals = 0;
  });
  const out = tradeQuarter(s).report;
  assert.ok(out.flows.find((f) => f.key === "manufactures").production >= 0);
  assert.ok(out.flows.find((f) => f.key === "manufactures").inputs === 0);
});
test("contracts are reviewed, bounded, immutable and have no public cash gift", () => {
  let s = enabled();
  for (const d of sectors)
    s = setTradePolicy(s, d.key, {
      reserveMonths: 0,
      exportShare: 1,
      imports: true,
    });
  const key = tradeQuarter(s).report.flows.find((f) => f.exports > 0).key,
    q = quoteAgreement(s, key, 4);
  assert.ok(q.allowed);
  const before = structuredClone(s),
    n = signAgreement(s, q);
  assert.deepEqual(s, before);
  assert.equal(n.metrics.gdp, s.metrics.gdp);
  assert.equal(n.metrics.debt, s.metrics.debt);
  assert.equal(n.trade.contracts.length, 1);
  assert.equal(signAgreement(n, q), n);
  assert.equal(quoteAgreement({ ...s, quarter: 159 }, key, 4).allowed, false);
  assert.equal(quoteAgreement(s, key, 7).allowed, false);
});
test("old scenarios keep the previous engine; new countries have production and replay 40 years", () => {
  const old = initialState();
  assert.equal(old.trade, undefined);
  const raw = advance(old);
  assert.equal(raw.trade, undefined);
  let a = enabled(),
    b = structuredClone(a);
  for (let q = 0; q < 160; q++) {
    a = advance(a);
    b = advance(JSON.parse(JSON.stringify(b)));
    for (const f of a.tradeReport.flows) assert.ok(f.closing >= 0);
    for (const v of Object.values(a.metrics)) assert.ok(Number.isFinite(v));
  }
  assert.deepEqual(a, b);
  assert.ok(createCountry({ seed: 56 }).trade);
});

test("productive construction grants capacity only in operation and transport improves logistics", async () => {
  const { startInvestment } = await import("../dist/investments.js");
  let s = enabled();
  const n = startInvestment(s, 0, "agriculture");
  assert.notEqual(n, s);
  const before = tradeQuarter(s).report.flows[0].capacity;
  assert.equal(tradeQuarter(n).report.flows[0].capacity, before);
  n.investments[0].phase = "operating";
  assert.ok(tradeQuarter(n).report.flows[0].capacity > before);
  const connected = startInvestment(s, 0, "transport");
  connected.investments[0].phase = "operating";
  assert.ok(
    tradeQuarter(connected).report.logistics > tradeQuarter(s).report.logistics,
  );
});
test("contract expires after its last delivery and tampered horizon cannot be applied", () => {
  let s = enabled();
  for (const d of sectors)
    s = setTradePolicy(s, d.key, {
      reserveMonths: 0,
      exportShare: 1,
      imports: true,
    });
  const q = quoteAgreement(s, "manufactures", 4);
  assert.ok(q.allowed);
  s = signAgreement(s, { ...q, endsAt: 999 });
  assert.equal(s.trade.contracts[0].endsAt, 4);
  for (let i = 0; i < 4; i++) s = advance(s);
  assert.equal(s.trade.contracts.length, 0);
  assert.equal(s.trade.closed.length, 1);
  assert.ok(
    s.tradeReport.flows.find((f) => f.key === "manufactures").agreements
      .length === 1,
  );
});
test("advisor accepts only bounded sector summaries and strips extra fields", async () => {
  const { snapshotOf } = await import("../dist/advisor.js"),
    { validateRequest } = await import("../server/advisor.js");
  const body = { mode: "analysis", snapshot: snapshotOf(enabled()) };
  assert.ok(validateRequest(body).snapshot.tradeSummary);
  assert.equal(
    validateRequest(body).snapshot.tradeSummary.flows[0].capacity,
    body.snapshot.tradeSummary.flows[0].capacity,
  );
  body.snapshot.tradeSummary.flows[0].production = -1;
  assert.throws(() => validateRequest(body));
});
test("prices respond to demand and industrial inputs reconcile against available supply", () => {
  const s = enabled(),
    base = tradeQuarter(s).report,
    boom = tradeQuarter({ ...s, external: "expansao" }).report;
  assert.ok(boom.flows[0].price > base.flows[0].price);
  const f = base.flows.find((f) => f.key === "manufactures");
  assert.ok(
    Math.abs(
      base.flows.find((f) => f.key === "energy").inputs - f.production * 0.12,
    ) < 1e-8,
  );
  assert.ok(
    Math.abs(
      base.flows.find((f) => f.key === "minerals").inputs - f.production * 0.22,
    ) < 1e-8,
  );
});
test("complete gameplay replays with policies, crises and contracts for forty years", async () => {
  const { advanceTurn, decisionFor, resolveDecision } = await import(
    "../dist/simulation.js"
  );
  function run() {
    let s = enabled();
    s = setTradePolicy(s, "manufactures", {
      reserveMonths: 0,
      exportShare: 1,
      imports: true,
    });
    s = signAgreement(s, quoteAgreement(s, "manufactures", 4));
    for (let q = 0; q < 160; q++) {
      const event = decisionFor(s);
      if (event) s = resolveDecision(s, event.id, event.choices[0].id);
      s = advanceTurn(s);
      for (const f of s.tradeReport.flows)
        assert.ok(
          Math.abs(
            f.opening +
              f.production +
              f.imports -
              f.domestic -
              f.inputs -
              f.exports -
              f.discarded -
              f.closing,
          ) < 1e-7,
          f.key,
        );
      for (const key of ["gdp", "debt", "inflation"])
        assert.ok(Number.isFinite(s.metrics[key]));
      for (const k of ["gdp", "debt", "inflation"])
        assert.ok(
          Math.abs(
            s.lastReport.drivers.reduce((n, r) => n + r.delta[k], 0) -
              (s.lastReport.after[k] - s.lastReport.before[k]),
          ) < 1e-7,
        );
      s = JSON.parse(JSON.stringify(s));
    }
    assert.equal(s.quarter, 160);
    return s;
  }
  assert.deepEqual(run(), run());
});
test("productive programs remain quotable by the validated cabinet snapshot", async () => {
  const { snapshotOf } = await import("../dist/advisor.js"),
    { validateRequest } = await import("../server/advisor.js"),
    { quoteInvestment } = await import("../dist/investments.js");
  const snapshot = validateRequest({
    mode: "analysis",
    snapshot: snapshotOf(enabled()),
  }).snapshot;
  assert.equal(quoteInvestment(snapshot, 0, "agriculture").allowed, true);
});
