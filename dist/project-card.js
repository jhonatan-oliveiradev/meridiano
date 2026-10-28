import { regionsOf } from "./model.js";
import {
  projectFor,
  projectProgress,
  remainingTurns,
  investmentFinance,
  investmentEffects,
} from "./investment-ledger.js";

const fmt = (v, d = 1) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: d }).format(v);
const money = (v) => (v >= 1 ? `M$ ${fmt(v, 2)} bi` : `M$ ${fmt(v * 1000)} mi`);
const people = (v) =>
  v >= 1 ? `${fmt(v, 2)} milhões` : `${fmt(v * 1000, 0)} mil`;
const quarter = (q) => `${2027 + Math.floor(q / 4)} · T${(q % 4) + 1}`;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const phases = {
  planning: "Planejamento",
  building: "Em construção",
  ready: "Aguardando operação",
  operating: "Em operação",
};

export function regionalProjectSummary(projects) {
  const active = projects.filter((p) => p.phase === "operating").length;
  const ready = projects.filter((p) => p.phase === "ready").length;
  const building = projects.length - active - ready;
  const label = `${active} programa${active === 1 ? " ativo" : "s ativos"}`;
  if (active && active === projects.length)
    return `${label} · ${active === 1 ? "obra concluída" : "obras concluídas"}`;
  if (ready && ready === projects.length)
    return `${ready} obra${ready === 1 ? " entregue" : "s entregues"} · operação no próximo trimestre`;
  return [
    active ? label : "",
    building ? `${building} em implantação` : "",
    ready ? `${ready} aguardando operação` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function renderProjectCard(s, p) {
  const def = projectFor(p.type),
    r = regionsOf(s)[p.region];
  const f = investmentFinance({ ...s, investments: [p] });
  const operating = p.phase === "operating",
    completed = operating || p.phase === "ready";
  // Same coefficients as the engine, isolated to this contract (not the whole state).
  const scenario = { ...s, investments: [{ ...p, phase: "operating" }] };
  const local = investmentEffects(scenario, p.region),
    national = investmentEffects(scenario);
  const percent = projectProgress(p) * 100;
  const status = operating
    ? `Em operação desde ${quarter(p.operatingAt)}.`
    : p.phase === "ready"
      ? `Operação começa em ${quarter(s.quarter + 1)}, no próximo avanço. Até lá, os benefícios ainda não estão ativos.`
      : `Operação estimada em ${remainingTurns(s, p)} trimestres, à capacidade atual.`;
  const row = (label, value) => `<div><dt>${label}</dt><dd>${value}</dd></div>`;
  return `<article class="project-card" data-project-phase="${p.phase}"><div class="project-card-top"><span class="project-phase">${phases[p.phase]}</span><span>${esc(r.name)}</span></div><h4>${def.name}</h4>
    ${completed ? `<div class="project-completion"><span aria-hidden="true">✓</span>${operating ? "Obra concluída · programa ativo" : "Obra concluída · operação no próximo trimestre"}</div>` : `<div class="project-progress"><progress max="100" value="${percent}" aria-label="Implantação de ${def.name} em ${esc(r.name)}"></progress><span>${fmt(percent, 0)}%</span></div>`}
    <p>${status}</p>
    <section class="project-benefits" aria-label="${operating ? "Contribuição ativa" : "Benefícios ao entrar em operação"}"><h5>${operating ? "Contribuição ativa" : "Benefícios ao entrar em operação"}</h5><dl>${def.productive ? row("Capacidade instalada do setor", "+70% no estado") : ""}${!def.productive ? row("Acesso a serviços", `+${fmt(local.access)} pontos`) + row("Bem-estar", `+${fmt(local.welfare)} pontos`) + row("Pobreza", `−${fmt(local.poverty)} p.p.`) : ""}${national.growth ? row("Crescimento nacional anualizado", `+${fmt(national.growth, 3)} p.p.`) : ""}</dl><p>Modificadores do modelo, sujeitos aos limites dos indicadores. Não representam a variação total observada no estado.</p></section>
    <h5 class="project-cost-heading">${completed ? "Manutenção e implantação" : "Custo da implantação"}</h5><dl>${row(completed ? "Implantação paga" : "Pago / contratado", completed ? money(p.paid) : `${money(p.paid)} / ${money(p.cost)}`)}${!completed ? row("Obras no próximo trimestre", money(f.constructionQuarter)) : ""}${row("Manutenção no próximo trimestre", money(f.upkeepQuarter))}${row(operating ? "Manutenção anual" : "Manutenção anual após entrega", money(p.upkeepAnnual))}${def.productive ? row("Cobertura territorial", `${fmt(p.coverage * 100, 0)}% do estado`) : row("Alcance inicial estimado", people(p.people))}</dl>
    <div class="project-actions"><button class="secondary" data-invest-action="locate" data-invest-region="${p.region}">Ver estado ↗</button>${p.phase === "planning" ? `<button class="secondary" data-invest-action="cancel" data-invest-id="${esc(p.id)}">Cancelar contratação</button>` : ""}</div></article>`;
}
