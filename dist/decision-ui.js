import { goalDef } from "./government-plan.js";
import {
  forecastPolicies,
  decisionFor,
  resolveDecision,
} from "./simulation.js";
import { projectFor } from "./investment-ledger.js";
import { regionsOf, policyDefs } from "./model.js";
import { renderQuarterExplanation } from "./governance-ui.js";
import { trackEffect } from "./crisis-followup.js";
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (n, d = 2) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n);
const money = (n) =>
  n >= 1 ? `M$ ${fmt(n, 2)} bi` : `M$ ${fmt(n * 1000, 2)} mi`;
const signed = (n) => `${n > 0 ? "+" : ""}${fmt(Math.abs(n) < 0.005 ? 0 : n)}`;
const period = (q) => `${2027 + Math.floor(q / 4)} · T${(q % 4) + 1}`;
const policyValue = (key, n) => {
  const p = policyDefs.find((p) => p.key === key);
  return p.unit === "M$"
    ? `M$ ${fmt(n, 0)}`
    : `${fmt(n, p.step < 1 ? 1 : 0)}${p.unit}`;
};
export const policyGuidance = {
  security: [
    "Equipes de investigação, perícia e policiamento.",
    "Gasto adicional no próximo trimestre; capacidade se acumula antes de reduzir a violência.",
  ],
  prevention: [
    "Rede de prevenção, jovens e comunidades.",
    "Financiamento recorrente; a rede cresce mais devagar que a capacidade policial.",
  ],
  oversight: [
    "Policiais, vítimas e população atendida.",
    "Gasto recorrente e confiança gradual; reduz o custo de confiança das operações intensas.",
  ],
  enforcement: [
    "Moradores e equipes nos locais das operações.",
    "Depende da investigação já instalada; intensidade alta pode reduzir confiança. Não representa aumento de penas.",
  ],
  income: [
    "Toda a população; maior proteção relativa para quem tem menos renda.",
    "Transferência no próximo trimestre; pobreza ajusta gradualmente.",
  ],
  pension: [
    "População idosa coberta pelo benefício.",
    "Gasto no próximo trimestre; proteção social melhora gradualmente.",
  ],
  labor: [
    "Trabalhadores e empregadores.",
    "Proteção e custos de contratação atuam a partir do próximo trimestre.",
  ],
  tax: [
    "Produção e orçamento público; sem faixas de renda neste modelo.",
    "Receita no próximo trimestre; alíquotas acima de 32% também afetam o crescimento.",
  ],
  services: [
    "Usuários de saúde e educação; regiões partem de acessos diferentes.",
    "Gasto no próximo trimestre; capacidade e bem-estar acumulam efeitos.",
  ],
  infrastructure: [
    "Moradores e empresas; o relevo limita os ganhos de acesso.",
    "Gasto no próximo trimestre; execução melhora com investimento continuado.",
  ],
};
function effectText(effect, showCost = true) {
  const names = {
    growth: ["Crescimento anualizado", "p.p."],
    inflation: ["Inflação", "p.p."],
    poverty: ["Pobreza", "p.p."],
    welfare: ["Bem-estar", "pontos"],
    crime: ["Violência", "pontos"],
    trust: ["Confiança na polícia", "pontos"],
    servicesPressure: ["Pressão nos serviços", "pontos"],
  };
  const lines = Object.entries(names)
    .filter(([k]) => effect[k])
    .map(
      ([k, [name, unit]]) =>
        `<span>${name}<b>${signed(effect[k])} ${unit}</b></span>`,
    )
    .join("");
  return `<div class="choice-effects">${showCost ? `<span>Gasto extraordinário<b>${fmt(effect.cost ?? 0, 1)}% do PIB</b></span>` : ""}${lines || "<span>Sem efeito extraordinário nos indicadores.</span>"}</div>`;
}
export function initDecisionUI({
  getState,
  setState,
  openModal,
  closeModal,
  setView,
  notify,
}) {
  function renderForecast() {
    const s = getState(),
      f = forecastPolicies(s),
      root = $("#policyForecast");
    root.innerHTML = `<div class="cycle-heading"><div><span class="eyebrow">ANTES DE AVANÇAR</span><h4>${f.changes.length ? `${f.changes.length} ${f.changes.length === 1 ? "política alterada" : "políticas alteradas"}` : "Explore uma mudança de política"}</h4></div>${f.changes.length ? '<button class="secondary" data-cycle-action="reset">Desfazer ajustes</button>' : '<span class="cycle-period">Mesmo ponto de partida</span>'}</div><p>${f.horizon ? `Comparação até ${period(f.toQuarter)} · ${f.horizon} trimestre${f.horizon > 1 ? "s" : ""} com estas políticas, frente às do início do trimestre.` : "O cenário atingiu o limite de 40 anos."}</p><div class="forecast-grid">${[
      ["poverty", "Pobreza", "p.p."],
      ["welfare", "Bem-estar", "pontos"],
      ["debt", "Dívida / PIB", "p.p."],
      ["crime", "Violência", "pontos"],
      ["trust", "Confiança na polícia", "pontos"],
      ["servicesPressure", "Pressão nos serviços", "pontos"],
    ]
      .map(
        ([key, label, unit]) =>
          `<div><span>${label}</span><strong class="${Math.abs(f.delta[key]) < 0.005 ? "" : (["welfare", "trust"].includes(key) ? f.delta[key] > 0 : f.delta[key] < 0) ? "cycle-positive" : "cycle-negative"}">${signed(f.delta[key])}<small> ${unit}</small></strong><span>${fmt(f.baseline[key], 1)} → ${fmt(f.current[key], 1)}${["welfare", "trust", "crime", "servicesPressure"].includes(key) ? "/100" : "%"}</span></div>`,
      )
      .join(
        "",
      )}</div><div class="forecast-finance"><span>Variação do gasto anual <b>${signed(f.annualCost)}% do PIB</b></span><span>Variação da receita anual <b>${signed(f.annualRevenue)}% do PIB</b></span></div><details class="forecast-details"><summary>Como ler esta comparação</summary><p>As duas trajetórias partem do país atual. Uma mantém as políticas do início do trimestre; a outra usa seus ajustes. Os efeitos se acumulam e dependem da capacidade de execução. Acontecimentos futuros e respostas ainda não escolhidas não entram na projeção. São resultados das regras deste jogo, sem calibração econômica real.</p><p><b>No próximo trimestre:</b> pobreza ${fmt(f.next.poverty)}%, bem-estar ${fmt(f.next.welfare)}/100 e dívida ${fmt(f.next.debt)}% do PIB.</p>${f.changes.map((p) => `<p><b>${p.name}</b>: ${policyValue(p.key, p.before)} → ${policyValue(p.key, p.after)}</p>`).join("")}</details>${s.scheduledDecision ? `<p class="scheduled-note"><b>Próximo trimestre:</b> ${esc(s.scheduledDecision.choice)} · gasto extraordinário de ${fmt(s.scheduledDecision.effect.cost ?? 0, 1)}% do PIB, além do orçamento anual.</p>` : ""}${decisionFor(s) ? '<button class="decision-link" data-cycle-action="decision">Há um acontecimento para resolver antes do avanço ↗</button>' : ""}`;
  }
  function planReport(s) {
    const goals = s.lastReport?.goalUpdates;
    if (!goals?.length) return "";
    const labels = {
      tracking: "Em acompanhamento",
      behind: "Abaixo do ritmo",
      reached: "Meta alcançada",
      met: "Cumprida no prazo",
      missed: "Prazo encerrado",
      stopped: "Encerrada",
    };
    return `<div class="investment-report"><h4>Plano de governo</h4>${goals
      .map((g) => {
        const d = goalDef(g.metric);
        return `<p><b>${esc(g.region === null ? "País" : regionsOf(s)[g.region].name)} · ${d.name}</b>: ${fmt(g.value)}${d.unit} / meta ${fmt(g.target)}${d.unit}. ${labels[g.status]}.</p>`;
      })
      .join(
        "",
      )}<button class="secondary" data-close data-view="plano">Abrir plano de governo ↗</button></div>`;
  }
  function reportHTML(s, full = false) {
    const r = s.lastReport,
      event = decisionFor(s);
    if (!r)
      return `<div class="cycle-heading"><div><span class="eyebrow">SEU PRIMEIRO TRIMESTRE</span><h4>Escolha por onde começar</h4></div><button class="secondary" data-view="politicas">Revisar políticas ↗</button></div><p>Ajuste uma política e consulte a comparação antes de avançar. O primeiro balanço aparecerá aqui.</p>`;
    return `<div class="cycle-heading"><div><span class="eyebrow">${period(r.quarter)}</span><h${full ? '3 id="modalTitle"' : "4"}>Balanço do trimestre</h${full ? "3" : "4"}></div>${!full ? '<button class="secondary" data-cycle-action="report">Ver balanço ↗</button>' : ""}</div><div class="report-grid">${[
      ["poverty", "Pobreza", "p.p."],
      ["welfare", "Bem-estar", "pontos"],
      ["debt", "Dívida / PIB", "p.p."],
      ["crime", "Violência", "pontos"],
      ["trust", "Confiança na polícia", "pontos"],
      ["servicesPressure", "Pressão nos serviços", "pontos"],
    ]
      .filter(
        ([key]) =>
          Number.isFinite(r.after[key]) && Number.isFinite(r.before[key]),
      )
      .map(([key, label, unit]) => {
        const d = r.after[key] - r.before[key];
        return `<div><span>${label}</span><strong>${fmt(r.after[key], 1)}${["welfare", "trust", "crime", "servicesPressure"].includes(key) ? "<small>/100</small>" : "<small>%</small>"}</strong><span class="${Math.abs(d) < 0.005 ? "" : (["welfare", "trust"].includes(key) ? d > 0 : d < 0) ? "cycle-positive" : "cycle-negative"}">${signed(d)} ${unit} no trimestre</span></div>`;
      })
      .join("")}</div>${
      full
        ? `<div class="report-changes"><h4>O que entrou em vigor</h4>${r.changes.length ? r.changes.map((p) => `<p><b>${p.name}</b><span>${policyValue(p.key, p.before)} → ${policyValue(p.key, p.after)}</span></p>`).join("") : "<p>As políticas do trimestre anterior foram mantidas.</p>"}${r.decision ? `<p><b>${esc(r.decision.choice)}</b><span>${fmt(r.decision.effect.cost ?? 0, 1)}% do PIB em gasto extraordinário</span></p><small>Executado uma vez neste trimestre. Os efeitos seguintes dependem da evolução do país.</small>` : ""}</div>${s.investmentReport && s.investments?.length ? `<div class="investment-report"><h4>Investimentos regionais</h4><p>Obras: ${money(s.investmentReport.constructionQuarter)} · operação: ${money(s.investmentReport.upkeepQuarter)} neste trimestre.</p>${s.investmentReport.transitions.map((p) => `<p>${esc(projectFor(p.type).name)} · ${esc(regionsOf(s)[p.region].name)}: ${p.phase === "operating" ? "operação iniciada" : p.phase === "ready" ? "entrega concluída" : "construção iniciada"}.</p>`).join("")}</div>` : ""}<details><summary>Projeção e resultado</summary><p>Projeção de um trimestre, com as políticas e decisões conhecidas antes do avanço. Neste motor determinístico, as mesmas condições produzem os mesmos resultados.</p><div class="comparison"><table><thead><tr><th>Indicador</th><th>Projetado</th><th>Realizado</th></tr></thead><tbody>${[
            ["poverty", "Pobreza (%)"],
            ["welfare", "Bem-estar"],
            ["debt", "Dívida / PIB (%)"],
          ]
            .map(
              ([k, label]) =>
                `<tr><td>${label}</td><td>${fmt(r.expected[k])}</td><td>${fmt(r.after[k])}</td></tr>`,
            )
            .join("")}</tbody></table></div></details>`
        : ""
    }${s.preventionReport ? `<div class="proposal-tradeoff"><h4>A prevenção funcionou</h4><p>${esc(s.preventionReport.regionName)}: a estrutura absorveu o acontecimento. Proteção ${fmt(s.preventionReport.protection * 100, 0)}/100 · pressão ${fmt(s.preventionReport.intensity * 100, 0)}/100. Nenhuma resposta ou despesa emergencial foi necessária. A manutenção dos programas continua no orçamento.</p></div>` : ""}${full ? renderQuarterExplanation(s) + planReport(s) : ""}${event ? `<div class="decision-callout"><div><span class="eyebrow">DECISÃO PENDENTE · ${esc(event.region)}</span><b>${esc(event.title)}</b></div><button class="primary" data-cycle-action="decision">Avaliar opções ↗</button></div>` : `<div class="cycle-next"><span>${s.scheduledDecision ? "Resposta escolhida para o próximo trimestre." : "Pronto para o próximo trimestre."}</span>${full ? '<button class="secondary" data-cycle-action="policies">Revisar políticas ↗</button>' : ""}</div>`}`;
  }
  function showReport() {
    const s = getState();
    if (s.lastReport)
      openModal(
        `<div class="cycle-dialog">${reportHTML(s, true)}<div class="modal-actions"><button class="secondary" data-close>Voltar ao país</button></div></div>`,
      );
  }
  function showDecision() {
    const s = getState(),
      e = decisionFor(s);
    if (!e) return;
    openModal(
      `<div class="cycle-dialog"><span class="eyebrow">ACONTECIMENTO · ${esc(e.region)}</span><h3 id="modalTitle">${esc(e.title)}</h3><p>${esc(e.detail)}</p><p class="decision-deadline">Escolha uma resposta para avançar. Os efeitos abaixo entram no próximo trimestre e se somam às políticas do país. Nesta etapa, os modificadores atuam nos indicadores nacionais.</p>${e.prevention ? `<div class="proposal-tradeoff"><h4>Preparação de ${esc(e.region)}</h4><p>Proteção ${fmt(e.prevention.protection * 100, 0)}/100 · pressão deste acontecimento ${fmt(e.prevention.intensity * 100, 0)}/100. Os impactos adversos e gastos abaixo já consideram a proteção existente.</p>${e.prevention.program ? `<button class="secondary" data-invest-action="offers" data-invest-region="${e.prevention.region}">Avaliar prevenção duradoura ↗</button><p>Programas em operação reduzem a recorrência e os impactos. Contratar uma obra não resolve esta emergência: escolha uma resposta após revisar o investimento.</p>` : `<button class="secondary" data-cycle-action="policies">Revisar prevenção e investigação ↗</button>`}</div>` : ""}<div class="decision-options">${e.choices.map((c) => `<article><h4>${esc(c.label)}</h4><p>${esc(c.detail)}</p>${effectText(c.effect)}${c.followup ? `<details><summary>Acompanhamento por ${c.followup.turns} trimestre${c.followup.turns === 1 ? "" : "s"} após a resposta</summary><p>Modificadores por trimestre de acompanhamento, sem repetir o gasto extraordinário:</p>${effectText(trackEffect(c.followup), false)}<p>A preparação do país ajusta a intensidade e a duração. Estes efeitos posteriores são adicionais aos do primeiro trimestre.</p></details>` : ""}<button class="secondary" data-cycle-action="choose" data-event="${esc(e.id)}" data-choice="${c.id}">Escolher: ${esc(c.label)}</button></article>`).join("")}</div><p class="cycle-footnote">O gasto extraordinário é financiado por dívida uma única vez. Variações em p.p. são modificadores do trimestre; os resultados finais também incluem as políticas e o contexto do país.</p><div class="modal-actions"><button class="secondary" data-close>Decidir depois</button></div></div>`,
    );
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cycle-action]");
    if (!b) return;
    const s = getState();
    switch (b.dataset.cycleAction) {
      case "reset":
        setState({ ...s, policies: { ...(s.policyBaseline ?? s.policies) } });
        $("#policy-income").focus();
        notify("Ajustes deste trimestre desfeitos.");
        break;
      case "report":
        showReport();
        break;
      case "decision":
        showDecision();
        break;
      case "policies":
        closeModal();
        setView("politicas");
        break;
      case "choose": {
        const n = resolveDecision(s, b.dataset.event, b.dataset.choice);
        if (n === s) return;
        setState(n);
        closeModal();
        notify(
          `${n.scheduledDecision.choice}. A resposta entra no próximo trimestre.`,
        );
        break;
      }
    }
  });
  return {
    renderForecast,
    showReport,
    showDecision,
    update() {
      renderForecast();
      $("#quarterReview").innerHTML = reportHTML(getState());
      const s = getState(),
        e = decisionFor(s),
        b = $("#turnReview");
      b.hidden = !e && !s.lastReport;
      b.textContent = e ? "Decisão pendente ↗" : "Balanço do trimestre ↗";
      b.dataset.cycleAction = e ? "decision" : "report";
      b.classList.toggle("has-decision", !!e);
    },
  };
}
