import test from "node:test";
import assert from "node:assert/strict";
import { initialState, advance, regionsOf } from "../dist/model.js";
import { startInvestment } from "../dist/investments.js";
import {
  renderProjectCard,
  regionalProjectSummary,
} from "../dist/project-card.js";

test("regional summary distinguishes active programs, delivered works and implantation", () => {
  assert.equal(
    regionalProjectSummary([{ phase: "operating" }]),
    "1 programa ativo · obra concluída",
  );
  assert.equal(
    regionalProjectSummary([{ phase: "operating" }, { phase: "operating" }]),
    "2 programas ativos · obras concluídas",
  );
  assert.equal(
    regionalProjectSummary([
      { phase: "operating" },
      { phase: "building" },
      { phase: "ready" },
    ]),
    "1 programa ativo · 1 em implantação · 1 aguardando operação",
  );
  assert.equal(
    regionalProjectSummary([{ phase: "ready" }]),
    "1 obra entregue · operação no próximo trimestre",
  );
  assert.equal(
    regionalProjectSummary([{ phase: "planning" }]),
    "1 em implantação",
  );
  assert.equal(regionalProjectSummary([]), "");
});

function phases() {
  let s = startInvestment(initialState(), 5, "transport");
  const planning = structuredClone(s);
  s = advance(s);
  const building = structuredClone(s);
  while (s.investments[0].phase !== "ready") s = advance(s);
  const ready = structuredClone(s);
  return { planning, building, ready, operating: advance(s) };
}
test("only implantation phases show construction progress", () => {
  const states = phases();
  for (const phase of ["planning", "building"])
    assert.match(
      renderProjectCard(states[phase], states[phase].investments[0]),
      /<progress/,
    );
  for (const phase of ["ready", "operating"])
    assert.doesNotMatch(
      renderProjectCard(states[phase], states[phase].investments[0]),
      /<progress/,
    );
});
test("delivered work distinguishes next-quarter activation from active benefits", () => {
  const { ready, operating } = phases();
  const r = renderProjectCard(ready, ready.investments[0]);
  const o = renderProjectCard(operating, operating.investments[0]);
  assert.match(r, /Aguardando operação/);
  assert.match(r, /Benefícios ao entrar em operação/);
  assert.match(o, /Obra concluída · programa ativo/);
  assert.match(o, /Contribuição ativa/);
  assert.match(o, /Manutenção no próximo trimestre/);
  assert.doesNotMatch(o, /Obras no próximo trimestre/);
  assert.match(o, /Acesso a serviços/);
  assert.match(o, /Crescimento nacional anualizado/);
});
test("card preserves state and safely escapes country data", () => {
  const { operating: s } = phases();
  s.territory = { regions: structuredClone(regionsOf(s)) };
  s.territory.regions[5].name = "<img src=x onerror=alert(1)>";
  const before = structuredClone(s),
    html = renderProjectCard(s, s.investments[0]);
  assert.deepEqual(s, before);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
});
