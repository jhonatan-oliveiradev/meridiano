import test from "node:test";
import assert from "node:assert/strict";
import { initialState, budget } from "../dist/model.js";
import {
  forecastPolicies,
  projectQuarter,
  advanceTurn,
  resolveDecision,
  decisionFor,
} from "../dist/simulation.js";

test("forecast compares edited policies with baseline without mutating or advancing the country", () => {
  const s = initialState();
  s.policyBaseline = { ...s.policies };
  s.policies.income = 400;
  const copy = structuredClone(s),
    f = forecastPolicies(s);
  assert.deepEqual(s, copy);
  assert.equal(f.horizon, 4);
  assert.equal(f.changes.length, 1);
  assert.equal(
    f.annualCost,
    budget(s).spending - budget({ ...s, policies: s.policyBaseline }).spending,
  );
  assert.ok(f.delta.poverty < 0);
  assert.ok(f.delta.debt > 0);
  assert.deepEqual(f.next, projectQuarter(s).metrics);
});
test("legacy states forecast without invented edits; projections stop at the horizon", () => {
  const s = initialState();
  assert.equal(forecastPolicies(s).changes.length, 0);
  assert.deepEqual(Object.values(forecastPolicies(s).delta), [0, 0, 0]);
  s.quarter = 159;
  assert.equal(forecastPolicies(s).horizon, 1);
  s.quarter = 160;
  assert.equal(advanceTurn(s), s);
  assert.equal(forecastPolicies(s).horizon, 0);
});
test("pending decisions block advancement and survive serialization; invalid or repeated choices do nothing", () => {
  const s = advanceTurn(initialState());
  assert.ok(s.pendingDecision);
  assert.equal(advanceTurn(s), s);
  assert.equal(resolveDecision(s, "wrong", "wrong"), s);
  const event = decisionFor(s),
    copy = structuredClone(s);
  assert.ok(event.choices.length >= 3);
  const loaded = JSON.parse(JSON.stringify(s));
  assert.deepEqual(decisionFor(loaded), event);
  const selected = resolveDecision(loaded, event.id, event.choices[0].id);
  assert.deepEqual(s, copy);
  assert.equal(selected.pendingDecision, null);
  assert.ok(selected.scheduledDecision);
  assert.equal(
    resolveDecision(selected, event.id, event.choices[1].id),
    selected,
  );
});
test("a decision is executed once next quarter, with exact forecast and bounded history", () => {
  const s = advanceTurn(initialState()),
    event = decisionFor(s);
  const selected = resolveDecision(s, event.id, event.choices[0].id);
  const forecast = projectQuarter(selected);
  const next = advanceTurn(selected);
  assert.deepEqual(next.metrics, forecast.metrics);
  assert.deepEqual(next.history.at(-1), {
    quarter: next.quarter,
    ...next.metrics,
  });
  assert.equal(next.scheduledDecision, null);
  assert.equal(next.lastReport.decision.id, event.id);
  assert.equal(advanceTurn(next).lastReport.decision, null);
  assert.ok(next.events.some((e) => e.title.includes(event.choices[0].label)));
});
test("same seed and choices replay for 40 years without loss or nonfinite results", () => {
  function run() {
    let s = initialState({ external: "sancoes" });
    for (let q = 0; q < 160; q++) {
      if (s.pendingDecision) {
        const event = decisionFor(s);
        s = resolveDecision(
          s,
          event.id,
          event.choices[q % event.choices.length].id,
        );
      }
      s = advanceTurn(s);
      for (const value of Object.values(s.metrics))
        assert.ok(Number.isFinite(value));
    }
    assert.equal(s.quarter, 160);
    assert.equal(s.history.length, 161);
    assert.equal(s.pendingDecision, null);
    return s;
  }
  assert.deepEqual(run(), run());
});
test("cost is one-time, projection does not consume the scheduled decision, and final quarter cannot accept new events", () => {
  let s = advanceTurn(initialState());
  const e = decisionFor(s);
  s = resolveDecision(s, e.id, e.choices[0].id);
  const copy = structuredClone(s);
  forecastPolicies(s);
  assert.deepEqual(s, copy);
  const paid = projectQuarter(s),
    free = projectQuarter({ ...s, scheduledDecision: null });
  assert.ok(paid.metrics.debt > free.metrics.debt);
  s.quarter = 159;
  const last = advanceTurn(s);
  assert.equal(last.pendingDecision, null);
  assert.equal(last.lastReport.quarter, 160);
});

test("quarterly report records applied policy edits and resets the baseline for the next turn", () => {
  let s = initialState();
  s.policyBaseline = { ...s.policies };
  s.policies.income = 100;
  s.policies.tax = 30;
  const f = forecastPolicies(s);
  s = advanceTurn(s);
  assert.deepEqual(s.lastReport.expected, f.next);
  assert.deepEqual(s.lastReport.after, f.next);
  assert.equal(s.lastReport.changes.length, 2);
  assert.deepEqual(s.policyBaseline, s.policies);
  assert.equal(forecastPolicies(s).changes.length, 0);
  const e = decisionFor(s);
  s = resolveDecision(s, e.id, e.choices.at(-1).id);
  assert.ok(
    !s.events.some((item) => item.detail.includes("aguardando sua escolha")),
  );
  assert.equal(advanceTurn(s).lastReport.changes.length, 0);
});
