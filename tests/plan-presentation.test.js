import test from "node:test";
import assert from "node:assert/strict";
import { initialState, regionalMetrics, budget } from "../dist/model.js";
import { createGoal } from "../dist/government-plan.js";
import { goalPresentation, planHighlights } from "../dist/plan-presentation.js";
import { startInvestment } from "../dist/investments.js";
test("presentation distinguishes improvement and deterioration by metric and never claims a rounded target was met", () => {
  let s = createGoal(initialState(), {
    metric: "poverty",
    target: 20,
    horizon: 4,
  });
  s.metrics.poverty += 1;
  let p = goalPresentation(s, s.goals[0]);
  assert.equal(p.tone, "negative");
  assert.equal(p.delta, 1);
  assert.ok(p.distance > 5);
  s.metrics.poverty = 19;
  assert.equal(goalPresentation(s, s.goals[0]).tone, "positive");
  assert.equal(goalPresentation(s, s.goals[0]).gap, "Alvo atingido");
  s.metrics.poverty = 20.04;
  p = goalPresentation(s, s.goals[0]);
  assert.ok(p.distance > 0);
  assert.match(p.gap, /menos de 0,1 p.p./);
  let n = createGoal(initialState(), {
    metric: "welfare",
    target: 70,
    horizon: 4,
  });
  n.metrics.welfare = 69;
  assert.equal(
    goalPresentation(n, n.goals[0]).gap,
    "Falta 1 ponto para a meta",
  );
  n.metrics.welfare = 68;
  assert.equal(
    goalPresentation(n, n.goals[0]).gap,
    "Faltam 2 pontos para a meta",
  );
});
test("Nilo prioritizes a shorter deadline among equally tracked goals without changing commitments", () => {
  let s = createGoal(initialState(), {
    metric: "welfare",
    target: 70,
    horizon: 12,
  });
  s = createGoal(s, { metric: "poverty", target: 20, horizon: 4 });
  const before = structuredClone(s);
  const notes = planHighlights(s);
  assert.match(notes[0].text, /Pobreza/);
  assert.match(notes[0].text, /4 trimestres/);
  assert.deepEqual(s, before);
  assert.equal(notes.length, 5);
});
test("secretariat highlights use contracted programs and deadline risks; finance compares actual and next payments", () => {
  let s = startInvestment(initialState(), 0, "water");
  s = createGoal(s, {
    metric: "access",
    region: 0,
    owner: "infrastructure",
    target: regionalMetrics(s, 0).access + 5,
    horizon: 4,
  });
  const notes = planHighlights(s);
  assert.match(
    notes.find((n) => n.id === "infrastructure").text,
    /após o prazo/,
  );
  assert.match(notes.find((n) => n.id === "health").text, /Nenhum programa/);
  assert.match(notes.find((n) => n.id === "finance").text, /Próximo trimestre/);
  assert.equal(budget(s).balance, budget(structuredClone(s)).balance);
  s.investmentReport = { constructionQuarter: 10, upkeepQuarter: 0 };
  assert.match(
    planHighlights(s).find((n) => n.id === "finance").text,
    /a menos/,
  );
});
