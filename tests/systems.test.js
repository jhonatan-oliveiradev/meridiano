import test from "node:test";
import assert from "node:assert/strict";
import { createCountry } from "../dist/country.js";
import {
  createSystems,
  evolveSystems,
  systemFactors,
  eventCandidates,
} from "../dist/systems.js";

test("regional water conserves storage and climate replays without using the external economic context", () => {
  const s = createCountry();
  s.systems = createSystems(s);
  const copy = structuredClone(s),
    a = evolveSystems(s),
    b = evolveSystems({ ...s, external: "sancoes" });
  assert.deepEqual(s, copy);
  assert.deepEqual(
    a.regions.map((r) => r.rain),
    b.regions.map((r) => r.rain),
  );
  assert.deepEqual(a, evolveSystems(JSON.parse(JSON.stringify(s))));
  for (const r of a.regions)
    assert.ok(
      Math.abs(r.opening + r.inflow + r.relief - r.used - r.spill - r.water) <
        1e-8,
    );
});
test("operating water and energy investments improve their networks; planned projects do not", () => {
  const s = createCountry();
  s.systems = createSystems(s);
  s.systems.regions[0].water = 2;
  const base = evolveSystems(s),
    project = { region: 0, type: "water", phase: "planning", coverage: 0.35 };
  assert.equal(
    evolveSystems({ ...s, investments: [project] }).regions[0].water,
    base.regions[0].water,
  );
  const ready = evolveSystems({
    ...s,
    investments: [{ ...project, phase: "operating" }],
  });
  assert.ok(ready.regions[0].water > base.regions[0].water);
  assert.ok(ready.regions[0].storageCapacity > base.regions[0].storageCapacity);
});
test("congestion needs actual cargo pressure and transport clears persistent backlog", () => {
  const s = createCountry();
  s.systems = createSystems(s);
  let a = evolveSystems(s);
  assert.ok(a.regions.every((r) => r.backlog === 0));
  s.tradeReport = { exports: 500, imports: 500, flows: [] };
  a = evolveSystems(s);
  assert.ok(a.regions.some((r) => r.backlog > 0));
  const i = a.regions.findIndex((r) => r.backlog > 0);
  s.systems = a;
  s.tradeReport = { exports: 0, imports: 0, flows: [] };
  const base = evolveSystems(s),
    improved = evolveSystems({
      ...s,
      investments: [
        { region: i, type: "transport", phase: "operating", coverage: 0.4 },
      ],
    });
  assert.ok(improved.regions[i].backlog < base.regions[i].backlog);
});
test("depleted water and grid constraints reduce productive capacity; emergency relief does not build permanent capacity", () => {
  const s = createCountry();
  s.systems = createSystems(s);
  const r = s.systems.regions[0];
  r.waterService = 0.3;
  r.energyService = 0.4;
  r.backlog = 80;
  assert.ok(systemFactors(s, 0).food < 0.6);
  assert.ok(systemFactors(s, 0).manufactures < 0.6);
  const base = evolveSystems(s),
    relief = evolveSystems(s, { water: 25 });
  assert.ok(relief.regions[0].water >= base.regions[0].water);
  assert.equal(
    relief.regions[0].storageCapacity,
    base.regions[0].storageCapacity,
  );
});
test("event selection has factual triggers, cooldown and healthy networks do not invent port or drought crises", () => {
  const s = createCountry();
  s.systems = createSystems(s);
  s.quarter = 20;
  for (const r of s.systems.regions) {
    r.waterService = 1;
    r.energyService = 1;
    r.backlog = 0;
    r.load = 0;
    r.transportCapacity = 1;
  }
  assert.ok(
    !eventCandidates(s).some((e) =>
      ["water", "freight", "energy"].includes(e.key),
    ),
  );
  s.systems.regions[0].waterService = 0.2;
  assert.ok(eventCandidates(s).some((e) => e.key === "water"));
  s.eventMemory = [{ key: "water", quarter: 19 }];
  assert.ok(!eventCandidates(s).some((e) => e.key === "water"));
});

test("response changes the physical network once; forecasting and reload preserve the chosen cause", async () => {
  const {
    advanceTurn,
    decisionFor,
    resolveDecision,
    projectQuarter,
    forecastPolicies,
  } = await import("../dist/simulation.js");
  let s = createCountry();
  s.systems = createSystems(s);
  s.systems.regions[0].water = 0;
  s.pendingDecision = {
    engine: 2,
    key: "water",
    id: `${s.seed}:0:water`,
    quarter: 0,
    regionIndex: 0,
    regionName: s.systems.regions[0].name,
    cause: "Reserva insuficiente registrada no trimestre.",
  };
  const chosen = resolveDecision(s, s.pendingDecision.id, "relief"),
    copy = structuredClone(chosen);
  forecastPolicies(chosen);
  assert.deepEqual(chosen, copy);
  assert.equal(
    decisionFor(JSON.parse(JSON.stringify(s))).cause,
    s.pendingDecision.cause,
  );
  const next = advanceTurn(chosen);
  assert.equal(next.systems.regions[0].relief, 25);
  const impact = next.systems.response.find((r) => r.region === 0);
  assert.ok(impact);
  assert.ok(
    impact.waterAfter > impact.waterBefore ||
      impact.reserveAfter > impact.reserveBefore,
  );
  assert.equal(next.systems.regions[1].relief, 0);
  assert.deepEqual(next.metrics, projectQuarter(chosen).metrics);
  assert.equal(next.scheduledDecision, null);
  assert.equal(projectQuarter(next).systems.regions[0].relief, 0);
  const free = projectQuarter({
    ...chosen,
    scheduledDecision: { ...chosen.scheduledDecision, effect: { cost: 0 } },
  });
  assert.ok(next.metrics.debt > free.metrics.debt);
});
test("stable networks unlock an industrial opportunity whose production waits for installation", () => {
  const s = createCountry();
  s.systems = createSystems(s);
  s.quarter = 8;
  for (const r of s.systems.regions) {
    r.waterService = 1;
    r.water = 120;
    r.energyService = 1;
    r.readyStreak = 2;
    r.load = 0;
    r.transportCapacity = 1;
  }
  assert.ok(!eventCandidates(s).some((e) => e.key === "investment"));
  s.systems.regions[0].readyStreak = 3;
  assert.ok(eventCandidates(s).some((e) => e.key === "investment"));
  const starting = evolveSystems(s, { region: 0, industry: 0.12 });
  assert.equal(starting.regions[0].privateCapacity, 0);
  assert.equal(starting.regions[0].pipeline.remaining, 2);
  const waiting = evolveSystems({ ...s, quarter: 9, systems: starting });
  assert.equal(waiting.regions[0].privateCapacity, 0);
  const ready = evolveSystems({ ...s, quarter: 10, systems: waiting });
  assert.equal(ready.regions[0].privateCapacity, 0.12);
  assert.equal(ready.regions[0].pipeline, null);
});
test("weather and grid shortages really change production while units still reconcile", async () => {
  const { tradeQuarter } = await import("../dist/trade.js");
  const s = createCountry();
  s.systems = createSystems(s);
  const healthy = tradeQuarter(s).report;
  for (const r of s.systems.regions) {
    r.waterService = 0.2;
    r.energyService = 0.4;
    r.backlog = 120;
  }
  const stressed = tradeQuarter(s).report;
  assert.ok(
    stressed.flows.find((f) => f.key === "food").production <
      healthy.flows.find((f) => f.key === "food").production,
  );
  assert.ok(
    stressed.flows.find((f) => f.key === "manufactures").production <
      healthy.flows.find((f) => f.key === "manufactures").production,
  );
  assert.ok(stressed.logistics < healthy.logistics);
  for (const f of stressed.flows)
    assert.ok(
      Math.abs(
        f.opening +
          f.production +
          f.imports -
          f.domestic -
          f.inputs -
          f.exports -
          f.closing -
          (f.discarded ?? 0),
      ) < 1e-8,
    );
});
test("network summary is bounded and the adviser rejects manipulated physical values", async () => {
  const { systemsSnapshot, validateSystemsSummary } = await import(
    "../dist/systems.js"
  );
  const s = createCountry();
  s.systems = evolveSystems(s);
  s.quarter = 1;
  const summary = systemsSnapshot(s);
  assert.deepEqual(validateSystemsSummary(summary), summary);
  const tampered = structuredClone(summary);
  tampered.regions[0].waterService = 2;
  assert.throws(() => validateSystemsSummary(tampered));
  summary.regions[0].extra = "discard";
  assert.equal(validateSystemsSummary(summary).regions[0].extra, undefined);
});
test("forty years of physical networks, choices and event memory replay exactly without forced quarterly crises", async () => {
  const { advanceTurn, decisionFor, resolveDecision } = await import(
    "../dist/simulation.js"
  );
  const { quarterDrivers, driverMetrics } = await import(
    "../dist/governance.js"
  );
  function run() {
    let s = createCountry({ seed: 1042 });
    let count = 0,
      keys = new Set();
    for (let q = 0; q < 160; q++) {
      const e = decisionFor(s);
      if (e) {
        keys.add(e.key);
        s = resolveDecision(s, e.id, e.choices[0].id);
        count++;
      }
      const before = structuredClone(s);
      s = advanceTurn(s);
      for (const value of Object.values(s.metrics))
        assert.ok(Number.isFinite(value));
      for (const r of s.systems.regions) {
        assert.ok(r.water >= 0 && r.water <= r.storageCapacity);
        assert.ok(r.grid >= 0 && r.grid <= 100);
        assert.ok(r.backlog >= 0 && r.backlog <= 200);
      }
      if (q % 20 === 0)
        for (const k of driverMetrics)
          assert.ok(
            Math.abs(
              quarterDrivers(before, s).reduce((n, d) => n + d.delta[k], 0) -
                (s.metrics[k] - before.metrics[k]),
            ) < 1e-8,
          );
      s = JSON.parse(JSON.stringify(s));
    }
    assert.ok(count < 80);
    assert.ok(keys.has("investment"));
    assert.ok(keys.has("water"));
    assert.equal(s.history.length, 161);
    return s;
  }
  assert.deepEqual(run(), run());
});

test("delivered water networks reduce shortages over the same climate sequence", () => {
  const a = createCountry();
  a.systems = createSystems(a);
  let b = structuredClone(a);
  b.investments = b.systems.regions.map((r) => ({
    region: r.region,
    type: "water",
    phase: "operating",
    coverage: 0.35,
  }));
  let basic = 0,
    protectedLoss = 0;
  for (let q = 0; q < 80; q++) {
    a.quarter = q;
    b.quarter = q;
    a.systems = evolveSystems(a);
    b.systems = evolveSystems(b);
    for (let i = 0; i < a.systems.regions.length; i++) {
      const x = a.systems.regions[i],
        y = b.systems.regions[i];
      assert.equal(x.rain, y.rain);
      basic += 1 - x.waterService;
      protectedLoss += 1 - y.waterService;
    }
  }
  assert.ok(protectedLoss < basic * 0.6);
});
test("advisor transport validates real network context and rejects quarter or value tampering", async () => {
  const { snapshotOf } = await import("../dist/advisor.js");
  const { validateRequest } = await import("../server/advisor.js");
  const { advanceTurn } = await import("../dist/simulation.js");
  const s = advanceTurn(createCountry());
  const body = { mode: "analysis", snapshot: snapshotOf(s) };
  assert.equal(
    validateRequest(body).snapshot.systemsSummary.quarter,
    s.quarter,
  );
  const wrong = structuredClone(body);
  wrong.snapshot.systemsSummary.quarter = 150;
  assert.throws(() => validateRequest(wrong));
  body.snapshot.systemsSummary.regions[0].energyService = -1;
  assert.throws(() => validateRequest(body));
});

test("rations reduce physical demand for one turn without manufacturing permanent network repair", () => {
  const s = createCountry();
  s.systems = createSystems(s);
  const plain = evolveSystems(s),
    ration = evolveSystems(s, { region: 0, ration: 1, energyRation: 1 });
  assert.ok(ration.regions[0].need < plain.regions[0].need);
  assert.ok(ration.regions[0].energyDemand < plain.regions[0].energyDemand);
  assert.equal(
    ration.regions[0].storageCapacity,
    plain.regions[0].storageCapacity,
  );
  assert.equal(ration.regions[1].need, plain.regions[1].need);
  const later = evolveSystems({ ...s, systems: ration, quarter: 1 });
  assert.equal(later.regions[0].energyRation, false);
  assert.equal(later.regions[0].waterRation, false);
});

test("emergency food imports temporarily override a regular suspension without duplicating goods", async () => {
  const { tradeQuarter } = await import("../dist/trade.js");
  const s = createCountry();
  s.systems = createSystems(s);
  s.trade.policy.food.imports = false;
  for (const r of s.systems.regions) r.waterService = 0.2;
  const base = tradeQuarter(s).report.flows.find((f) => f.key === "food");
  assert.equal(base.imports, 0);
  const helped = tradeQuarter({
    ...s,
    scheduledDecision: { systems: { food: 1 } },
  }).report.flows.find((f) => f.key === "food");
  assert.ok(helped.imports > base.imports);
  assert.ok(helped.unmet < base.unmet);
  assert.ok(
    Math.abs(
      helped.opening +
        helped.production +
        helped.imports -
        helped.domestic -
        helped.inputs -
        helped.exports -
        helped.closing -
        (helped.discarded ?? 0),
    ) < 1e-8,
  );
  assert.equal(
    tradeQuarter(s).report.flows.find((f) => f.key === "food").imports,
    0,
  );
});

test("fiscal, employment, prices, services and security occurrences require their own measured pressures", async () => {
  const { decisionFor } = await import("../dist/simulation.js");
  const s = createCountry();
  s.systems = createSystems(s);
  s.quarter = 20;
  s.systems.fiscal = { balance: -4 };
  Object.assign(s.metrics, {
    debt: 155,
    unemployment: 21,
    inflation: 16,
    crime: 75,
    servicesPressure: 85,
  });
  const list = eventCandidates(s);
  for (const key of ["fiscal", "employment", "prices", "security", "services"])
    assert.ok(list.some((e) => e.key === key));
  for (const c of list) {
    const e = decisionFor({
      ...s,
      pendingDecision: {
        engine: 2,
        key: c.key,
        id: `${s.seed}:${s.quarter}:${c.key}`,
        quarter: s.quarter,
        regionIndex: c.region,
        regionName: c.regionName,
        cause: c.cause,
      },
    });
    assert.ok(e);
    assert.ok(e.choices.length >= 3);
    assert.equal(e.cause, c.cause);
  }
});
test("opportunities are not offered when installation would exceed the game horizon", () => {
  const s = createCountry();
  s.systems = createSystems(s);
  s.quarter = 158;
  for (const r of s.systems.regions) {
    r.readyStreak = 5;
    r.waterService = 1;
    r.energyService = 1;
  }
  assert.ok(!eventCandidates(s).some((e) => e.key === "investment"));
});
