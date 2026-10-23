import test from "node:test";
import assert from "node:assert/strict";
import { initialState, budget, regionsOf } from "../dist/model.js";
import { createCountry } from "../dist/country.js";
import { runCabinetTool, cabinetBriefs } from "../dist/cabinet-tools.js";
import { startInvestment } from "../dist/investments.js";
const call = (s, role, name, args = {}) =>
  runCabinetTool(s, role, { name, args });
test("investigation orders actual engine indices, preserves the scenario and handles legacy density", () => {
  const s = initialState(),
    before = JSON.stringify(s),
    r = call(s, "nilo", "investigate_states");
  assert.equal(r.kind, "states");
  assert.equal(r.data.rows.length, 3);
  assert.ok(r.data.rows[0].access <= r.data.rows[1].access);
  assert.equal(JSON.stringify(s), before);
  assert.equal(
    call(s, "health", "investigate_states", { metric: "density" }).kind,
    "notice",
  );
  const v2 = createCountry({ seed: 1042 });
  assert.ok(
    call(v2, "nilo", "investigate_states", {
      metric: "density",
    }).data.rows.every((r) => r.density > 0),
  );
});
test("specialists have bounded responsibilities and cannot mutate through tools", () => {
  const s = initialState();
  for (const name of [
    "startInvestment",
    "advance",
    "fetch",
    "eval",
    "change_policy",
  ])
    assert.equal(call(s, "nilo", name).kind, "notice");
  assert.equal(
    call(s, "health", "prepare_investment", { region: 0, program: "water" })
      .kind,
    "notice",
  );
  assert.equal(
    call(s, "infrastructure", "prepare_investment", {
      region: 0,
      program: "health",
    }).kind,
    "notice",
  );
  assert.equal(call(s, "health", "inspect_budget").kind, "notice");
  assert.equal(
    call(s, "finance", "inspect_budget").data.balance,
    budget(s).balance,
  );
  assert.equal(call(s, "nilo", "inspect_budget").department, "finance");
  assert.equal(
    call(s, "nilo", "prepare_investment", { region: 0, program: "health" })
      .department,
    "health",
  );
});
test("proposals and comparisons are computed and opening blocked or repeated projects stays read-only", () => {
  let s = initialState();
  const r = call(s, "health", "prepare_investment", {
    region: 0,
    program: "health",
  });
  assert.ok(r.data.quotes[0].allowed && r.data.quotes[0].cost > 0);
  assert.equal(s.investments, undefined);
  s = startInvestment(s, 0, "health");
  assert.equal(
    call(s, "health", "prepare_investment", { region: 0, program: "health" })
      .data.quotes[0].allowed,
    false,
  );
  const c = call(s, "nilo", "compare_investments", {
    regions: [0, 1, 2],
    programs: ["water", "health"],
  });
  assert.equal(c.data.quotes.length, 6);
  assert.equal(s.investments.length, 1);
  assert.equal(cabinetBriefs(s).length, 3);
});
test("tool arguments reject extra fields, invalid numbers, excess candidates and nonexistent states", () => {
  const s = initialState();
  for (const args of [
    { region: -1, program: "water" },
    { region: regionsOf(s).length, program: "water" },
    { region: 1.1, program: "water" },
    { region: 0, program: "water", cost: 0 },
  ])
    assert.equal(call(s, "nilo", "prepare_investment", args).kind, "notice");
  for (const args of [
    { limit: 6 },
    { metric: "unmodeled" },
    { limit: NaN },
    { direction: "random" },
  ])
    assert.equal(call(s, "nilo", "investigate_states", args).kind, "notice");
  assert.equal(
    call(s, "nilo", "compare_investments", {
      regions: [0, 0],
      programs: ["water"],
    }).kind,
    "notice",
  );
  assert.equal(
    call(s, "health", "compare_investments", {
      regions: [0],
      programs: ["water"],
    }).kind,
    "notice",
  );
});
