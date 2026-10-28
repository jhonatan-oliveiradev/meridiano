import test from "node:test";
import assert from "node:assert/strict";
import { bootGame, renderBootState } from "../dist/boot.js";

test("slow startup stays recoverable and becomes ready only after the game initializes", async () => {
  const states = [];
  let resolve,
    tick,
    cancelled = false;
  const ready = new Promise((done) => {
    resolve = done;
  });
  const boot = bootGame({
    load: () => ready,
    ui: (state) => states.push(state),
    schedule: (fn) => {
      tick = fn;
      return 1;
    },
    cancel: () => {
      cancelled = true;
    },
  });
  assert.deepEqual(states, ["loading"]);
  tick();
  assert.deepEqual(states, ["loading", "slow"]);
  resolve();
  assert.equal(await boot, true);
  assert.equal(states.at(-1), "ready");
  assert.equal(cancelled, true);
  tick();
  assert.equal(states.at(-1), "ready");
});
test("an import or initialization failure becomes an explicit error rather than empty active controls", async () => {
  const states = [];
  let tick;
  const result = await bootGame({
    load: async () => {
      throw Error("failed dependency");
    },
    ui: (state) => states.push(state),
    schedule: (fn) => {
      tick = fn;
    },
    cancel: () => {},
  });
  assert.equal(result, false);
  assert.deepEqual(states, ["loading", "failed"]);
  tick();
  assert.equal(states.at(-1), "failed");
});
test("startup UI blocks game actions until ready and offers recovery after failure", () => {
  const nodes = new Map();
  const get = (id) => {
    if (!nodes.has(id))
      nodes.set(id, {
        disabled: false,
        hidden: true,
        textContent: "",
        setAttribute() {},
        focus() {},
      });
    return nodes.get(id);
  };
  const doc = {
    body: { dataset: {}, classList: { add() {}, remove() {} } },
    getElementById: get,
    querySelector: (selector) => get(selector.replace(/^#/, "")),
  };
  renderBootState(doc, "loading");
  assert.equal(get("welcomePlay").disabled, true);
  assert.equal(get("welcomeRetry").hidden, true);
  assert.match(get("welcomeBootText").textContent, /Preparando/);
  renderBootState(doc, "slow");
  assert.equal(get("welcomeRetry").hidden, false);
  assert.equal(get("welcomePlay").disabled, true);
  renderBootState(doc, "ready");
  for (const id of ["welcomePlay", "welcomeNew", "welcomeLearn"])
    assert.equal(get(id).disabled, false);
  assert.equal(get("welcomeRetry").hidden, true);
  renderBootState(doc, "failed");
  assert.equal(get("welcomePlay").disabled, true);
  assert.equal(get("welcome").hidden, false);
  assert.equal(get(".app").inert, true);
  assert.equal(get("welcomeRetry").hidden, false);
  assert.match(get("welcomeBootDetail").textContent, /salvos serão mantidos/);
});
