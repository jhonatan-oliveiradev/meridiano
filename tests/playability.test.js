import test from "node:test";
import assert from "node:assert/strict";
import { createCountry } from "../dist/country.js";
import {
  makeExperiment,
  syncBranch,
  compareBranches,
} from "../dist/experiments.js";
import {
  startChallenge,
  assessChallenge,
  challengeDefs,
} from "../dist/challenges.js";
import { decisionReview, withoutResponse } from "../dist/decision-review.js";
import {
  projectQuarter,
  advanceTurn,
  decisionFor,
  resolveDecision,
} from "../dist/simulation.js";
import { stateSituation } from "../dist/map-situation.js";

test("experiments preserve an exact origin and isolate branch edits; seed alone is not proof", () => {
  const s = createCountry(),
    before = structuredClone(s),
    e = makeExperiment(s, {
      rootId: "root",
      aId: "a",
      bId: "b",
      name: "Teste",
    });
  assert.deepEqual(s, before);
  assert.deepEqual(e.a.state.metrics, e.b.state.metrics);
  e.a.state.policies.tax = 35;
  assert.notEqual(e.a.state.policies.tax, e.b.state.policies.tax);
  assert.equal(compareBranches(e.a.state, e.b.state).related, true);
  assert.equal(compareBranches(s, { ...s, quarter: 3 }).related, false);
  assert.equal(e.origin.state.experiment, undefined);
  const saved = [e.origin, e.a, e.b],
    next = syncBranch(e.a.state, saved);
  assert.equal(next[1].state.policies.tax, 35);
  assert.equal(saved[1].state.policies.tax, 35);
  assert.notEqual(next[1].state, e.a.state);
});
test("saved branches resume exact state after serialization without overwriting origin or sibling", () => {
  const e = makeExperiment(createCountry(), {
    rootId: "origin",
    aId: "a",
    bId: "b",
    name: "Rotas",
  });
  const saved = JSON.parse(JSON.stringify([e.origin, e.a, e.b]));
  const next = advanceTurn(e.a.state);
  const updated = syncBranch(next, saved);
  assert.deepEqual(updated[0], saved[0]);
  assert.deepEqual(updated[2], saved[2]);
  assert.equal(saved[1].state.quarter, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(updated[1].state)), next);
  next.policies.tax = 49;
  assert.notEqual(updated[1].state.policies.tax, 49);
  const foreign = makeExperiment(createCountry(), {
    rootId: "other",
    aId: "c",
    bId: "d",
    name: "Outra",
  });
  assert.equal(compareBranches(e.a.state, foreign.a.state).related, false);
});
test("map situations prioritize local shortages over works and display deliveries for their quarter", () => {
  const s = {
    systems: {
      regions: [
        {
          water: 3,
          need: 10,
          waterService: 0.6,
          energyService: 1,
          grid: 80,
          backlog: 10,
        },
      ],
    },
    investments: [{ region: 0, phase: "building" }],
  };
  assert.equal(stateSituation(s, 0).level, 3);
  assert.equal(stateSituation(s, 0).issues[0].kind, "water");
  s.systems.regions[0].waterService = 1;
  s.systems.regions[0].water = 20;
  s.investments = [];
  s.investmentReport = { transitions: [{ region: 0, phase: "operating" }] };
  assert.equal(stateSituation(s, 0).issues[0].kind, "delivery");
  assert.equal(stateSituation(s, 1).issues.length, 0);
  delete s.investmentReport;
  assert.equal(stateSituation(s, 0).issues.length, 0);
});
test("challenge results freeze at the deadline while the country continues normally", () => {
  for (const key of ["fiscal", "water", "industry"])
    assert.equal(startChallenge(key).challenge.key, key);
  let s = startChallenge("fiscal");
  s.quarter = 23;
  s.metrics.debt = 20;
  s = advanceTurn(s);
  assert.equal(s.challenge.status, "won");
  const result = structuredClone(s.challenge.result);
  const d = decisionFor(s);
  if (d) s = resolveDecision(s, d.id, d.choices[0].id);
  s.metrics.debt = 250;
  s = advanceTurn(s);
  assert.equal(s.quarter, 25);
  assert.deepEqual(assessChallenge(s), result);
});
test("real event resolution records a single executed expense and retains its review on later turns", () => {
  let s = createCountry({ seed: 719 });
  for (let i = 0; i < 12 && !decisionFor(s); i++) s = advanceTurn(s);
  const d = decisionFor(s);
  assert.ok(d);
  s = resolveDecision(s, d.id, d.choices[0].id);
  s = advanceTurn(s);
  const review = s.lastReport.actionReview;
  assert.equal(review.quarter, s.quarter);
  assert.ok(Object.values(review.delta).every(Number.isFinite));
  assert.equal(s.decisionReviews.length, 1);
  assert.equal(s.scheduledDecision, null);
  s = advanceTurn(s);
  assert.equal(s.lastReport.actionReview, null);
  assert.deepEqual(s.decisionReviews[0], review);
});
test("branch comparison aligns a common quarter rather than comparing different durations", () => {
  const s = createCountry(),
    e = makeExperiment(s, { rootId: "r", aId: "a", bId: "b", name: "T" });
  e.a.state.quarter = 2;
  e.a.state.history.push(
    { ...s.metrics, quarter: 1, gdp: 500 },
    { ...s.metrics, quarter: 2, gdp: 520 },
  );
  e.b.state.quarter = 1;
  e.b.state.history.push({ ...s.metrics, quarter: 1, gdp: 480 });
  const c = compareBranches(e.a.state, e.b.state);
  assert.equal(c.quarter, 1);
  assert.equal(c.a.gdp, 500);
  assert.equal(c.b.gdp, 480);
  assert.equal(c.points.length, 2);
});
test("challenges require sustained targets, have a deadline and do not silently replace a country", () => {
  assert.equal(challengeDefs.length, 3);
  const s = startChallenge("water");
  assert.equal(s.quarter, 0);
  assert.equal(s.challenge.status, "playing");
  assert.equal(assessChallenge(s).status, "playing");
  s.quarter = s.challenge.dueAt;
  s.systems = {
    history: Array.from({ length: 4 }, (_, i) => ({
      quarter: s.quarter - 3 + i,
      water: 1,
      energy: 1,
      backlog: 0,
    })),
  };
  s.metrics.debt = 80;
  assert.equal(assessChallenge(s).status, "won");
  s.systems.history[0].water = 0.5;
  assert.equal(assessChallenge(s).status, "lost");
  assert.throws(() => startChallenge("unknown"));
});
test("a response review distinguishes one-time funding from recurring policy cost and preserves later edits", () => {
  const s = createCountry();
  s.scheduledDecision = {
    id: "x",
    key: "fiscal",
    title: "Contas",
    choice: "Tributar",
    effect: { cost: 0.2 },
    policyUpdates: [{ key: "tax", before: 28, after: 29 }],
  };
  s.policies.tax = 29;
  const c = withoutResponse(s);
  assert.equal(c.policies.tax, 28);
  assert.equal(s.policies.tax, 29);
  const n = projectQuarter(s),
    review = decisionReview(s, n, projectQuarter(c));
  assert.ok(review.cost > 0);
  assert.equal(review.costShare, 0.2);
  assert.ok(review.annualRevenue > 0);
  s.policies.tax = 32;
  assert.equal(withoutResponse(s).policies.tax, 32);
});
