import test from "node:test";
import assert from "node:assert/strict";
import { initialState, budget, regionalMetrics } from "../dist/model.js";
import { createCountry } from "../dist/country.js";
import {
  createGoal,
  goalsOf,
  goalReading,
  closeGoal,
  validateGoals,
  planSummary,
} from "../dist/government-plan.js";
import {
  advanceTurn,
  resolveDecision,
  decisionFor,
  projectQuarter,
} from "../dist/simulation.js";
import { startInvestment } from "../dist/investments.js";
import { snapshotOf } from "../dist/advisor.js";
import { validateRequest, generateAdvice } from "../server/advisor.js";
const add = (s, extra = {}) =>
  createGoal(s, {
    metric: "access",
    region: 0,
    owner: "infrastructure",
    horizon: 4,
    target: Math.min(
      100,
      regionalMetrics(
        s,
        Number.isInteger(extra.region) && extra.region < 6 ? extra.region : 0,
      ).access + 5,
    ),
    ...extra,
  });
const next = (s) => {
  const d = decisionFor(s);
  return advanceTurn(d ? resolveDecision(s, d.id, d.choices.at(-1).id) : s);
};
test("goals are immutable commitments with no economic or investment side effects; strict creation limits", () => {
  const s = initialState(),
    copy = structuredClone(s),
    n = add(s);
  assert.deepEqual(s, copy);
  assert.deepEqual(budget(n), budget(s));
  assert.equal(n.investments, undefined);
  assert.equal(n.quarter, s.quarter);
  assert.equal(add(n), n);
  assert.equal(add(s, { target: 20 }), s);
  assert.equal(add(s, { region: 99 }), s);
  assert.equal(add(s, { owner: "finance" }), s);
  assert.equal(add(s, { horizon: 5 }), s);
  assert.equal(add(s, { target: NaN }), s);
  assert.equal(add(s, { target: 101 }), s);
  let three = add(n, { region: 1 });
  three = add(three, { region: 2 });
  assert.equal(three.goals.length, 3);
  assert.equal(add(three, { region: 3 }), three);
  const atEnd = { ...s, quarter: 157 };
  assert.equal(add(atEnd), atEnd);
});
test("quarterly samples happen once on real advances, pending events block tracking, forecasts do not mutate plan", () => {
  const s = add(initialState()),
    copy = structuredClone(s);
  projectQuarter(s);
  assert.deepEqual(s, copy);
  let n = advanceTurn(s);
  assert.equal(n.goals[0].samples.length, 2);
  assert.equal(n.goals[0].samples[1].quarter, 1);
  assert.equal(n.goals[0].samples[1].value, regionalMetrics(n, 0).access);
  assert.ok(decisionFor(n));
  assert.equal(advanceTurn(n), n);
  assert.equal(n.goals[0].samples.length, 2);
  for (let i = 0; i < 3; i++) n = next(n);
  assert.equal(n.quarter, 4);
  assert.equal(n.goals[0].closedAt, 4);
  assert.equal(n.goals[0].samples.length, 5);
  assert.equal(n.lastReport.goalUpdates[0].status, "missed");
  assert.ok(
    n.events.some((e) => e.title.startsWith("Prazo da meta encerrado")),
  );
  const closed = structuredClone(n.goals);
  n = next(n);
  assert.deepEqual(n.goals, closed);
  assert.equal(goalReading(n, n.goals[0]).status, "missed");
});
test("reaching a target early can regress; only deadline freezes evaluation, independent of later policies", () => {
  let s = add(initialState(), { target: 65 });
  s.policies.infrastructure = 10;
  assert.equal(goalReading(s, s.goals[0]).status, "reached");
  s.policies.infrastructure = 0;
  assert.notEqual(goalReading(s, s.goals[0]).status, "reached");
  s.policies.infrastructure = 10;
  for (let i = 0; i < 4; i++) s = next(s);
  assert.equal(goalReading(s, s.goals[0]).status, "met");
  const value = goalReading(s, s.goals[0]).current;
  s.policies.infrastructure = 0;
  assert.equal(goalReading(s, s.goals[0]).current, value);
});
test("national goals follow existing metrics, owner scope, cancellation and JSON roundtrip preserve history", () => {
  let s = createGoal(initialState(), {
    metric: "poverty",
    target: 20,
    horizon: 8,
  });
  s = createGoal(s, { metric: "debt", target: 50, horizon: 12 });
  assert.equal(s.goals[0].owner, "nilo");
  assert.equal(s.goals[1].owner, "finance");
  s = next(s);
  assert.equal(s.goals[0].samples.at(-1).value, s.metrics.poverty);
  const n = closeGoal(s, s.goals[0].id);
  assert.equal(n.goals[0].closedReason, "stopped");
  assert.equal(goalsOf(n).length, 2);
  assert.equal(closeGoal(n, n.goals[0].id), n);
  assert.equal(goalReading(n, n.goals[0]).status, "stopped");
  assert.equal(planSummary(n, "health").goals.length, 0);
  assert.equal(planSummary(n, "finance").goals.length, 2);
  assert.deepEqual(goalsOf(JSON.parse(JSON.stringify(n))), n.goals);
  assert.deepEqual(goalsOf(initialState()), []);
});
test("regional program risks and budget use existing motor; saves support twelve completed goals", () => {
  let s = add(startInvestment(initialState(), 0, "water"));
  assert.ok(planSummary(s).deliveryRisks.length);
  assert.equal(planSummary(s).finance.balance, budget(s).balance);
  assert.equal(s.investments.length, 1);
  let n = initialState();
  for (let i = 0; i < 12; i++) {
    n = add(n);
    n = closeGoal(n, n.goals.at(-1).id);
  }
  assert.equal(goalsOf(n).length, 12);
  assert.equal(add(n), n);
  const v2 = add(createCountry({ seed: 40315, population: 67 }));
  assert.equal(goalsOf(v2).length, 1);
  assert.equal(
    goalReading(v2, v2.goals[0]).regionName,
    v2.territory.regions[0].name,
  );
});
test("API bounds and strips goal data, rejects corrupted samples/owners/targets and supplies computed scoped context", async () => {
  let s = add(initialState(), { owner: "health" });
  s = createGoal(s, { metric: "debt", target: 50, horizon: 4 });
  const snapshot = snapshotOf(s);
  snapshot.goals[0].injected = "private";
  const request = validateRequest({
    mode: "question",
    role: "health",
    question: "Como está a meta?",
    snapshot,
  });
  assert.equal(request.snapshot.goals[0].injected, undefined);
  const answer = {
    title: "Metas de acesso",
    summary: "Confira o progresso registrado.",
    observations: [],
    tradeoffs: [],
    nextSteps: [],
  };
  let context;
  const result = await generateAdvice(request, {
    apiKey: "fake",
    fetcher: async (_u, opts) => {
      context = JSON.parse(JSON.parse(opts.body).contents[0].parts[0].text);
      return new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(answer) }] } },
          ],
        }),
      );
    },
  });
  assert.equal(result.role, "health");
  assert.equal(context.governmentPlan.goals.length, 1);
  assert.equal(context.snapshot.goals, undefined);
  assert.equal(context.governmentPlan.goals[0].owner, "health");
  assert.equal(context.governmentPlan.finance.balance, budget(s).balance);
  for (const change of [
    (g) => (g.samples[0].quarter = 99),
    (g) => (g.target = NaN),
    (g) => (g.owner = "unknown"),
    (g) => (g.dueAt = 161),
    (g) => g.samples.push(g.samples[0]),
    (g) => (g.region = 99),
  ]) {
    const bad = structuredClone(snapshot);
    change(bad.goals[0]);
    assert.throws(() => validateRequest({ mode: "analysis", snapshot: bad }));
  }
  const many = structuredClone(snapshot);
  many.goals = Array(13).fill(many.goals[0]);
  assert.throws(() => validateRequest({ mode: "analysis", snapshot: many }));
});
