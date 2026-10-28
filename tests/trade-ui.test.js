import test from "node:test";
import assert from "node:assert/strict";
import { initialState, regionsOf } from "../dist/model.js";
import { createTrade, tradeQuarter, sectors } from "../dist/trade.js";
import { initTradeUI } from "../dist/trade-ui.js";

test("resource controls remain available for sectors without exports and without a selected state", (t) => {
  // Minimal DOM boundary: inspect markup rendered by the real UI controller.
  const nodes = new Map();
  const element = () => ({
    innerHTML: "",
    hidden: false,
    classList: { toggle() {} },
    setAttribute() {},
    addEventListener() {},
    after(node) {
      nodes.set(`#${node.id}`, node);
    },
    append(node) {
      nodes.set(`#${node.id}`, node);
    },
  });
  const previous = globalThis.document;
  globalThis.document = {
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, element());
      return nodes.get(selector);
    },
    createElement: element,
    createElementNS: element,
    addEventListener() {},
  };
  t.after(() => {
    globalThis.document = previous;
  });
  const state = initialState();
  state.trade = createTrade(state, regionsOf(state));
  state.tradeReport = tradeQuarter(state).report;
  state.tradeReport.flows.forEach((flow) => {
    flow.exports = 0;
  });
  let layer = "food",
    selected = 0;
  const ui = initTradeUI({
    getState: () => state,
    getSelected: () => selected,
    getLayer: () => layer,
  });
  for (selected of [0, -1]) {
    for (const sector of sectors) {
      layer = sector.key;
      ui.updateMap();
      const panel = nodes.get("#mapEconomyPanel");
      assert.equal(panel.hidden, false);
      assert.match(panel.innerHTML, /RECURSOS DO TERRITÓRIO/);
      assert.equal((panel.innerHTML.match(/aria-pressed=/g) ?? []).length, 4);
      assert.match(
        panel.innerHTML,
        new RegExp(`data-sector="${layer}" aria-pressed="true"`),
      );
      assert.doesNotMatch(
        nodes.get("#economicOverlay").innerHTML,
        /class="economic-routes"/,
      );
    }
  }
  layer = "relevo";
  ui.updateMap();
  assert.equal(nodes.get("#mapEconomyPanel").hidden, true);
});
