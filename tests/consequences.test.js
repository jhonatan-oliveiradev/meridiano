import test from "node:test";
import assert from "node:assert/strict";
import { initialState, advance, budget, policyDefs } from "../dist/model.js";
import {
  consequenceDefaults,
  safetyCost,
  consequenceStep,
  migrateConsequences,
} from "../dist/consequences.js";
import {
  forecastPolicies,
  projectQuarter,
  advanceTurn,
  decisionFor,
  resolveDecision,
} from "../dist/simulation.js";
import { snapshotOf } from "../dist/advisor.js";
import { validateRequest } from "../server/advisor.js";
import { runCabinetTool } from "../dist/cabinet-tools.js";
import { createGoal, validateGoals } from "../dist/government-plan.js";
const trajectory = (s, n = 16) => {
  for (let i = 0; i < n; i++) s = advance(s);
  return s;
};
test("additional recurring costs enter annual budget and quarterly debt exactly once", () => {
  const s = initialState(),
    b = budget(s);
  Object.assign(s.policies, { security: 2, prevention: 1, oversight: 0.5 });
  assert.equal(safetyCost(s), 3.5);
  assert.ok(Math.abs(budget(s).spending - b.spending - 3.5) < 1e-10);
  const n = advance(s),
    growth = n.metrics.gdp / s.metrics.gdp;
  assert.ok(
    Math.abs(
      n.metrics.debt - (s.metrics.debt - budget(s).balance / 4) / growth,
    ) < 1e-10,
  );
});
test("capacity forms before reducing violence; prevention accumulates and costs persist", () => {
  const a = initialState(),
    b = structuredClone(a);
  b.policies.security = 3;
  b.policies.prevention = 2;
  assert.equal(advance(a).metrics.crime, advance(b).metrics.crime);
  assert.ok(
    advance(b).metrics.investigation > advance(a).metrics.investigation,
  );
  const an = trajectory(a),
    bn = trajectory(b);
  assert.ok(bn.metrics.crime < an.metrics.crime);
  assert.ok(bn.metrics.preventionCapacity > an.metrics.preventionCapacity);
});
test("intense operations trade trust for immediate effect; oversight softens trust loss", () => {
  const a = initialState(),
    b = structuredClone(a),
    c = structuredClone(a);
  b.policies.enforcement = c.policies.enforcement = 100;
  c.policies.oversight = 1;
  const an = advance(a),
    bn = advance(b),
    cn = advance(c);
  assert.ok(bn.metrics.crime < an.metrics.crime);
  assert.ok(bn.metrics.trust < an.metrics.trust);
  assert.ok(cn.metrics.trust > bn.metrics.trust);
});
test("recorded index can rise while violence falls when reporting confidence improves", () => {
  const s = initialState();
  s.metrics.crime = 50;
  s.metrics.trust = 30;
  s.metrics.reportedCrime = 25;
  s.policies.oversight = 1;
  s.metrics.investigation = 65;
  const n = consequenceStep(s);
  assert.ok(n.next.crime < s.metrics.crime);
  assert.ok(n.next.reportedCrime > s.metrics.reportedCrime);
});
test("every driver decomposition conserves actual delta, including clamps and reporting", () => {
  for (const mode of [0, 1]) {
    let s = initialState();
    for (const d of policyDefs) s.policies[d.key] = mode ? d.max : d.min;
    for (let i = 0; i < 160; i++) {
      const r = consequenceStep(s);
      for (const [k, parts] of Object.entries(r.drivers))
        assert.ok(
          Math.abs(
            r.before[k] + parts.reduce((n, p) => n + p.value, 0) - r.next[k],
          ) < 1e-8,
          k,
        );
      s = advance(s);
      for (const k of Object.keys(consequenceDefaults))
        assert.ok(
          Number.isFinite(s.metrics[k]) &&
            s.metrics[k] >= 0 &&
            s.metrics[k] <= 100,
          k,
        );
    }
  }
});
test("high violence and service pressure feed activity and welfare; ideology itself has no effect", () => {
  const a = initialState(),
    b = structuredClone(a),
    c = initialState({ government: "Ditadura", economy: "Socialista" });
  b.metrics.crime = 80;
  b.metrics.servicesPressure = 80;
  assert.ok(advance(b).metrics.gdp < advance(a).metrics.gdp);
  assert.ok(advance(b).metrics.welfare < advance(a).metrics.welfare);
  assert.deepEqual(advance(a).metrics, advance(c).metrics);
});
test("legacy saves gain neutral defaults at current quarter without fabricated earlier history", () => {
  let s = advance(initialState());
  for (const k of Object.keys(consequenceDefaults)) {
    delete s.metrics[k];
    s.history.forEach((h) => delete h[k]);
  }
  for (const k of ["security", "prevention", "oversight", "enforcement"])
    delete s.policies[k];
  const before = structuredClone(s),
    n = migrateConsequences(s);
  assert.deepEqual(s, before);
  assert.equal(n.history[0].crime, undefined);
  assert.equal(n.history.at(-1).crime, 45);
  assert.equal(safetyCost(n), 0);
  const raw = snapshotOf(s);
  raw.previous = { ...s.history[0] };
  assert.equal(
    validateRequest({ mode: "analysis", snapshot: raw }).snapshot.previous
      .crime,
    undefined,
  );
  assert.ok(Number.isFinite(advanceTurn(s).metrics.crime));
  assert.equal(
    validateRequest({ mode: "analysis", snapshot: snapshotOf(s) }).snapshot
      .metrics.crime,
    45,
  );
});
test("preview is immutable and equals realized next turn, reports survive JSON save/load", () => {
  let s = initialState();
  s.policies.security = 2;
  const before = structuredClone(s),
    preview = projectQuarter(s),
    n = advanceTurn(s);
  assert.deepEqual(s, before);
  assert.deepEqual(preview.metrics, n.metrics);
  assert.deepEqual(
    JSON.parse(JSON.stringify(n)).consequenceReport,
    n.consequenceReport,
  );
  const f = forecastPolicies(s);
  assert.equal(f.next.crime, n.metrics.crime);
  assert.deepEqual(s, before);
});
test("security tools are read-only and scoped; API rejects nonfinite and out-of-range new fields", () => {
  const s = initialState(),
    before = structuredClone(s);
  const tool = runCabinetTool(s, "security", {
    name: "inspect_security",
    args: {},
  });
  assert.equal(tool.kind, "security");
  assert.deepEqual(s, before);
  assert.equal(
    runCabinetTool(s, "health", { name: "inspect_security", args: {} }).kind,
    "notice",
  );
  assert.equal(
    runCabinetTool(s, "security", {
      name: "prepare_investment",
      args: { region: 0, program: "health" },
    }).kind,
    "notice",
  );
  assert.equal(
    runCabinetTool(s, "security", {
      name: "inspect_security",
      args: { region: 0 },
    }).kind,
    "notice",
  );
  for (const [key, value] of [
    ["crime", 101],
    ["trust", NaN],
    ["investigation", -1],
  ]) {
    const raw = snapshotOf(s);
    raw.metrics[key] = value;
    assert.throws(() =>
      validateRequest({ mode: "analysis", role: "security", snapshot: raw }),
    );
  }
  const raw = snapshotOf(s);
  raw.policies.security = Infinity;
  assert.throws(() => validateRequest({ mode: "analysis", snapshot: raw }));
});
test("violence goals belong to security and preserve validated quarterly samples", () => {
  const s = createGoal(initialState(), {
    metric: "crime",
    target: 35,
    horizon: 4,
  });
  assert.equal(s.goals[0].owner, "security");
  assert.equal(validateGoals(s.goals, s).length, 1);
  const n = advanceTurn(s);
  assert.equal(n.goals[0].samples.at(-1).value, n.metrics.crime);
});
test("security incident blocks time, applies its response once and survives save/load", () => {
  let s;
  for (let seed = 1; seed <= 40; seed++) {
    const raw = initialState({ seed });
    raw.metrics.crime = 70;
    raw.metrics.trust = 30;
    const n = advanceTurn(raw);
    if (decisionFor(n)?.key === "security") {
      s = n;
      break;
    }
  }
  assert.ok(s);
  assert.equal(advanceTurn(s), s);
  const event = decisionFor(s);
  const selected = resolveDecision(s, event.id, "investigate");
  const restored = JSON.parse(JSON.stringify(selected)),
    expected = projectQuarter(selected),
    real = advanceTurn(restored);
  assert.deepEqual(real.metrics, expected.metrics);
  assert.equal(real.scheduledDecision, null);
  assert.equal(real.lastReport.decision.effect.cost, 0.4);
  assert.equal(
    real.consequenceReport.drivers.trust.find(
      (p) => p.label === "Resposta ao acontecimento",
    ).value,
    0.5,
  );
  const after = advance(real);
  assert.equal(
    after.consequenceReport.drivers.trust.find(
      (p) => p.label === "Resposta ao acontecimento",
    ).value,
    0,
  );
});
