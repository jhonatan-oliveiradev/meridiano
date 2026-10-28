import assert from "node:assert/strict";
import { createCountry } from "../dist/country.js";
import {
  advanceTurn,
  decisionFor,
  resolveDecision,
} from "../dist/simulation.js";
import { startInvestment, quoteInvestment } from "../dist/investments.js";
import { regionsOf } from "../dist/model.js";
import { startChallenge, assessChallenge } from "../dist/challenges.js";

// Synthetic, deterministic play tests. No real-world economic calibration.
const seeds = [719, 40315, 75101, 91731];
function build(s, types) {
  for (const type of types)
    for (let i = 0; i < regionsOf(s).length; i++)
      if (
        (type !== "industry" ||
          (s.investments?.filter((p) => p.type === "industry").length ?? 0) <
            2) &&
        quoteInvestment(s, i, type).allowed
      )
        s = startInvestment(s, i, type);
  return s;
}
function run(initial, profile, turns) {
  let s = structuredClone(initial),
    waterLoss = 0,
    energyLoss = 0,
    construction = 0,
    upkeep = 0,
    emergency = 0;
  const events = {},
    timing = {};
  for (let q = 0; q < turns; q++) {
    if (profile === "prepared" || profile === "industry")
      s = build(
        s,
        profile === "industry"
          ? (s.investments?.filter((p) => p.type === "industry").length ?? 0) <
            2
            ? ["industry"]
            : ["water", "energy"]
          : ["water", "energy", "transport"],
      );
    const d = decisionFor(s);
    if (d) {
      events[d.key] = (events[d.key] ?? 0) + 1;
      (timing[d.key] ??= []).push(s.quarter);
      s = resolveDecision(s, d.id, d.choices[0].id);
    }
    s = advanceTurn(s);
    assert.equal(s.quarter, q + 1);
    assert.ok(Object.values(s.metrics).every(Number.isFinite));
    const h = s.systems.history.at(-1);
    waterLoss += 1 - h.water;
    energyLoss += 1 - h.energy;
    construction += s.investmentReport?.constructionQuarter ?? 0;
    upkeep += s.investmentReport?.upkeepQuarter ?? 0;
    emergency += s.lastReport?.actionReview?.cost ?? 0;
  }
  return {
    seed: s.seed,
    profile,
    turns,
    waterLoss,
    energyLoss,
    construction,
    upkeep,
    emergency,
    events,
    timing,
    gdp: s.metrics.gdp,
    debt: s.metrics.debt,
    welfare: s.metrics.welfare,
    operating:
      s.investments?.filter((p) => p.phase === "operating").length ?? 0,
    challenge: assessChallenge(s),
  };
}
const runs = [];
for (const seed of seeds) {
  const base = createCountry({ seed });
  Object.assign(base.policies, { tax: 32, services: 8, infrastructure: 4 });
  for (const profile of ["reactive", "prepared", "spending", "austerity"]) {
    const s = structuredClone(base);
    if (profile === "spending")
      Object.assign(s.policies, {
        tax: 20,
        services: 18,
        infrastructure: 10,
        income: 800,
      });
    if (profile === "austerity")
      Object.assign(s.policies, { tax: 36, services: 4, infrastructure: 0 });
    runs.push(run(s, profile, 48));
  }
}
const challenges = ["fiscal", "water", "industry"].map((key) => {
  const s = startChallenge(key);
  if (key === "fiscal")
    Object.assign(s.policies, { tax: 38, services: 8, infrastructure: 4 });
  return run(
    s,
    key === "industry" ? "industry" : key === "water" ? "prepared" : "reactive",
    s.challenge.dueAt,
  );
});
for (const seed of seeds) {
  const a = runs.find((r) => r.seed === seed && r.profile === "reactive"),
    b = runs.find((r) => r.seed === seed && r.profile === "prepared");
  assert.ok(
    b.waterLoss < a.waterLoss,
    `Prevention should reduce water loss: ${seed}`,
  );
  assert.ok(b.construction > 0 && b.upkeep > 0);
}
assert.ok(
  challenges.every((r) => r.challenge.status === "won"),
  "All challenges need a feasible played strategy",
);
for (const r of runs) {
  const all = Object.values(r.timing)
    .flat()
    .sort((a, b) => a - b);
  for (let i = 1; i < all.length; i++) assert.ok(all[i] - all[i - 1] >= 2);
  for (const [key, dates] of Object.entries(r.timing))
    for (let i = 1; i < dates.length; i++)
      assert.ok(dates[i] - dates[i - 1] >= (key === "investment" ? 12 : 6));
}
for (const seed of seeds) {
  const find = (profile) =>
    runs.find((r) => r.seed === seed && r.profile === profile);
  assert.ok(find("spending").debt > find("reactive").debt);
  assert.ok(find("austerity").energyLoss > find("reactive").energyLoss);
}
console.log(
  JSON.stringify(
    {
      method:
        "four seeds; 48 quarters; first event choice; real project phases and charges",
      runs,
      challenges,
    },
    null,
    2,
  ),
);
