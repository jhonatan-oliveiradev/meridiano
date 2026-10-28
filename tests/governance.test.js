import test from "node:test";
import assert from "node:assert/strict";
import { initialState, advance } from "../dist/model.js";
import {
  advanceTurn,
  decisionFor,
  resolveDecision,
  projectQuarter,
} from "../dist/simulation.js";
import {
  quarterDrivers,
  driverMetrics,
  societyGroups,
  cabinetProposals,
  governmentCycles,
} from "../dist/governance.js";
import {
  crisisTracks,
  crisisEffect,
  trackEffect,
  followupFor,
} from "../dist/crisis-followup.js";
import { publicWorks } from "../dist/public-works.js";
import { startInvestment } from "../dist/investments.js";
import { snapshotOf } from "../dist/advisor.js";
import { validateRequest } from "../server/advisor.js";

test("advisor receives bounded continuing effects from validated snapshots", () => {
  let s = advanceTurn(initialState());
  const e = decisionFor(s);
  s = resolveDecision(s, e.id, e.choices.at(-1).id);
  s = projectQuarter(s);
  const body = { mode: "analysis", snapshot: snapshotOf(s) };
  assert.equal(
    validateRequest(body).snapshot.crisisTracks.length,
    crisisTracks(s).length,
  );
  body.snapshot.crisisTracks = [{ id: "bad", key: "water", remaining: 300 }];
  assert.throws(() => validateRequest(body));
});

test("quarter explanations sum to actual changes with edits and investment", () => {
  let s = startInvestment(initialState(), 3, "transport");
  s.policyBaseline = { ...s.policies };
  s.policies.services = 11;
  const copy = structuredClone(s),
    n = projectQuarter(s),
    rows = quarterDrivers(s, n);
  for (const k of driverMetrics)
    assert.ok(
      Math.abs(
        rows.reduce((v, r) => v + r.delta[k], 0) -
          (n.metrics[k] - s.metrics[k]),
      ) < 1e-8,
      k,
    );
  assert.deepEqual(s, copy);
  assert.equal(rows.length, 6);
});
test("new crises persist for bounded turns, never charge follow-up again, and survive serialization", () => {
  let s = advanceTurn(initialState());
  const e = decisionFor(s);
  s = resolveDecision(s, e.id, e.choices.at(-1).id);
  const original = structuredClone(s);
  const n = projectQuarter(s);
  assert.deepEqual(s, original);
  assert.ok(crisisTracks(n).length);
  assert.deepEqual(
    projectQuarter(n),
    projectQuarter(JSON.parse(JSON.stringify(n))),
  );
  assert.equal(crisisEffect(n).cost, undefined);
  let x = { ...n, scheduledDecision: null };
  for (let i = 0; i < 3; i++) x = projectQuarter(x);
  assert.equal(crisisTracks(x).length, 0);
  const legacy = { ...s, scheduledDecision: { ...s.scheduledDecision } };
  delete legacy.scheduledDecision.followup;
  assert.deepEqual(
    projectQuarter(legacy).metrics,
    advance(legacy, legacy.scheduledDecision.effect).metrics,
  );
});
test("resilience shortens follow-up and malformed saved tracks are ignored", () => {
  const s = initialState();
  s.quarter = 1;
  s.capacity = 0.95;
  s.policies.infrastructure = 18;
  s.pendingDecision = { key: "water", id: `${s.seed}:1:water`, quarter: 1 };
  s.investments = [{ type: "water", region: 0, phase: "operating" }];
  const prepared = resolveDecision(s, s.pendingDecision.id, "relief");
  assert.equal(prepared.scheduledDecision.followup.turns, 1);
  assert.deepEqual(
    crisisTracks({
      ...s,
      crisisTracks: [{ id: "bad", key: "water", remaining: 999 }],
    }),
    [],
  );
});
test("social perspectives are bounded and respond differently to policy changes", () => {
  const s = initialState(),
    before = structuredClone(s),
    base = societyGroups(s);
  s.policies.labor = 85;
  s.policies.pension = 90;
  const after = societyGroups(s);
  assert.ok(after.every((g) => g.support >= 0 && g.support <= 100));
  assert.ok(
    after.find((g) => g.id === "workers").support >
      base.find((g) => g.id === "workers").support,
  );
  assert.ok(
    after.find((g) => g.id === "retired").support >
      base.find((g) => g.id === "retired").support,
  );
  assert.notEqual(
    after.find((g) => g.id === "business").support,
    after.find((g) => g.id === "workers").support,
  );
  const copy = structuredClone(s);
  cabinetProposals(s);
  assert.deepEqual(s, copy);
  assert.equal(s.quarter, before.quarter);
});
test("cycles close at 16 quarters without stopping the country, with truthful missing history", () => {
  let s = initialState();
  for (let i = 0; i < 16; i++) s = advance(s);
  const cycles = governmentCycles(s);
  assert.equal(cycles[0].complete, true);
  assert.equal(cycles[0].start, 0);
  assert.equal(cycles[0].end, 16);
  assert.equal(governmentCycles(advance(s)).at(-1).complete, false);
  assert.equal(
    governmentCycles({ ...s, history: [s.history.at(-1)] })[0].before,
    null,
  );
});
test("map equipment uses existing road coordinates and never changes geography", () => {
  const s = initialState();
  s.territory = {
    regions: [{ x: 20, y: 20, name: "A" }],
    roads: [
      [
        [1, 2],
        [3, 4],
      ],
    ],
    cities: [{ x: 20, y: 20, region: 0 }],
  };
  s.investments = [
    { id: "a", region: 0, type: "transport", phase: "building" },
  ];
  const copy = structuredClone(s),
    a = publicWorks(s, s.territory.cities);
  assert.deepEqual(s, copy);
  assert.deepEqual(a[0].path, s.territory.roads[0]);
  assert.equal(a[0].phase, "building");
  assert.deepEqual(publicWorks({ ...s, investments: [] }, []), []);
});

test("preparation reduces adverse tails without weakening positive per-quarter benefits", () => {
  assert.equal(
    trackEffect({ key: "services", choiceId: "teams", strength: 0.35 }).welfare,
    0.3,
  );
  assert.equal(
    trackEffect({ key: "services", choiceId: "teams", strength: 0.35 })
      .servicesPressure,
    -0.4,
  );
  assert.equal(
    trackEffect({ key: "water", choiceId: "wait", strength: 0.35 }).inflation,
    0.2 * 0.35,
  );
  const s = initialState();
  s.history[0].debt = 90;
  assert.ok(
    governmentCycles(s)[0].challenges.includes("Dívida acima de 85% do PIB"),
  );
});

test("a decision without continuing modifiers creates no artificial tracking", () => {
  assert.equal(followupFor(initialState(), "investment", "decline"), null);
});
