import {
  consequenceMetrics,
  safetyValues,
  consequenceStep,
  safetyCost,
} from "./consequences.js";
import { projectQuarter } from "./simulation.js";
import { budget, regionsOf } from "./model.js";
import { projectFor } from "./investment-ledger.js";
import { goalsOf, goalDef } from "./government-plan.js";
const esc = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (v, d = 2) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: d }).format(v);
const money = (n) =>
  n >= 1
    ? `M$ ${fmt(n)} bi`
    : n >= 0.001 || n === 0
      ? `M$ ${fmt(n * 1000)} mi`
      : `M$ ${fmt(n * 1e6)} mil`;
const signed = (v) => `${v > 0 ? "+" : ""}${fmt(v)}`;
const date = (q) => `${2027 + Math.floor(q / 4)} · T${(q % 4) + 1}`;
export function initConsequenceUI({
  getState,
  openModal,
  closeModal,
  onAdvance,
  onPolicies,
}) {
  function showPreview() {
    const s = getState();
    if (s.quarter >= 160) return;
    const n = projectQuarter(s),
      b = budget(s),
      v = safetyValues(s);
    const stamp = JSON.stringify(s);
    const due = goalsOf(s).filter(
      (g) => g.closedAt === undefined && g.dueAt <= s.quarter + 1,
    );
    openModal(
      `<div class="cycle-dialog consequence-dialog"><span class="eyebrow">ANTES DE AVANÇAR · ${date(s.quarter + 1)}</span><h3 id="modalTitle">O próximo trimestre</h3><p>Prévia com suas políticas, a resposta escolhida e a hipótese de chuva do modelo. Novos acontecimentos ainda não entram nesta conta.</p><div class="preview-finance"><span>Obras e manutenção <b>${money(b.investment.constructionQuarter + b.investment.upkeepQuarter)}</b></span><span>Reforço de segurança e prevenção <b>${fmt(safetyCost(s))}% do PIB ao ano</b></span><span>Saldo anualizado <b>${signed(b.balance)}% do PIB</b></span></div><p><b>País no fechamento:</b> pobreza ${fmt(n.metrics.poverty, 1)}%, bem-estar ${fmt(n.metrics.welfare, 1)}/100 e dívida ${fmt(n.metrics.debt, 1)}% do PIB.</p><h4>Segurança e serviços no fechamento</h4><div class="consequence-preview">${consequenceMetrics
        .filter(([k]) => k !== "reportedCrime")
        .map(
          ([k, label, , direction]) =>
            `<article><span>${label}</span><strong>${fmt(n.metrics[k], 1)}<small>/100</small></strong><span class="${(n.metrics[k] - v[k]) * direction > 0.005 ? "cycle-positive" : (n.metrics[k] - v[k]) * direction < -0.005 ? "cycle-negative" : ""}">${signed(n.metrics[k] - v[k])} pontos</span></article>`,
        )
        .join(
          "",
        )}</div><h4>Entregas e prazos</h4>${n.investmentReport.transitions.length ? n.investmentReport.transitions.map((p) => `<p>${esc(projectFor(p.type).name)} · ${esc(regionsOf(s)[p.region].name)}: ${p.phase === "operating" ? "início da operação" : p.phase === "ready" ? "entrega da obra; benefícios no trimestre seguinte" : "início da construção"}.</p>`).join("") : "<p>Nenhuma mudança de fase prevista nas obras contratadas.</p>"}${due.length ? due.map((g) => `<p class="plan-warning">${esc(goalDef(g.metric).name)}: prazo final neste avanço. O resultado será avaliado no fechamento.</p>`).join("") : "<p>Nenhuma meta vence neste avanço.</p>"}${s.scheduledDecision ? `<p><b>Resposta a executar:</b> ${esc(s.scheduledDecision.choice)} · ${fmt(s.scheduledDecision.effect.cost ?? 0)}% do PIB em gasto único, além do orçamento anual.</p>` : ""}<p class="cycle-footnote">Índices sintéticos de 0 a 100. Violência e pressão: menor é melhor. Capacidade e confiança: maior é melhor. O reforço de segurança é adicional à estrutura já incluída nos gastos fixos.</p><div class="modal-actions"><button class="secondary" id="previewPolicies">Revisar políticas</button><button class="secondary" data-close>Voltar</button><button class="primary" id="confirmQuarter">Avançar para ${date(s.quarter + 1)}</button></div></div>`,
    );
    document.querySelector("#previewPolicies").onclick = () => {
      closeModal();
      onPolicies();
    };
    document.querySelector("#confirmQuarter").onclick = () => {
      if (stamp !== JSON.stringify(getState())) {
        showPreview();
        return;
      }
      closeModal();
      onAdvance();
    };
  }
  function showExplanation() {
    const s = getState(),
      key = document.querySelector("#chartMetric").value;
    const spec = consequenceMetrics.find(([k]) => k === key);
    const r =
      s.consequenceReport?.quarter === s.quarter ? s.consequenceReport : null;
    const d = spec && r?.drivers[key];
    const fallback = {
      poverty:
        "Transferências, previdência, proteção trabalhista, serviços, programas em operação e desemprego compõem o alvo da pobreza. O índice percorre 13% da distância até esse alvo a cada trimestre.",
      welfare:
        "Serviços, proteção social, acesso, inflação e programas em operação compõem o alvo. Violência acima de 45 e pressão nos serviços acima de 35 reduzem esse alvo. O bem-estar percorre 10% da distância por trimestre.",
      debt: "O saldo anualizado, dividido por quatro, financia o trimestre. Gastos extraordinários entram uma vez; o crescimento também muda a razão dívida/PIB.",
      unemployment:
        "O desemprego reage ao crescimento anualizado e aos custos de contratação previstos nas regras. A resposta é gradual.",
      gdp: "Infraestrutura, serviços, tributação, proteção trabalhista, transferências, contexto externo, dívida e ciclo determinístico compõem o crescimento. Violência acima de 45 acrescenta uma perda de atividade.",
      inflation:
        "Déficit, transferências, tributação e contexto externo compõem o alvo; a inflação percorre 16% da distância por trimestre.",
    };
    const report = s.lastReport;
    const label =
      spec?.[1] ??
      document.querySelector("#chartMetric option:checked").textContent;
    openModal(
      `<div class="cycle-dialog consequence-dialog"><span class="eyebrow">COMO O MOTOR CALCULA</span><h3 id="modalTitle">${esc(label)}</h3>${
        d
          ? `<p>Fechamento de ${date(s.quarter)}: ${fmt(r.before[key])} → ${fmt(r.next[key])}/100.</p><div class="driver-list">${
              d
                .filter((p) => Math.abs(p.value) >= 0.000001)
                .map(
                  (p) =>
                    `<p><span>${esc(p.label)}</span><b>${signed(p.value)} pontos</b></p>`,
                )
                .join("") || "<p>Sem variação neste fechamento.</p>"
            }</div><p>As parcelas somam a variação do índice, antes do arredondamento.</p>`
          : spec
            ? "<p>Avance um trimestre para ver a decomposição. O acompanhamento começa no trimestre em que estes indicadores foram incluídos no cenário.</p>"
            : `<p>${fallback[key] ?? "Consulte as regras do modelo."}</p>${report ? `<p>Último fechamento: ${fmt(report.before[key])} → ${fmt(report.after[key])}. Esta lista explica os fatores usados; não atribui a mudança a uma causa isolada.</p>` : ""}`
      }<p>${key === "reportedCrime" ? "Registros combinam violência e disposição para denunciar. Podem subir com a confiança mesmo quando a violência cai. Este índice não é contagem de crimes nem taxa por habitante." : spec ? "Segurança depende da capacidade já instalada. O gasto de hoje forma equipes e redes para os próximos trimestres; não reduz a violência instantaneamente." : ""}</p><details><summary>Limites desta leitura</summary><p>Regras ilustrativas do jogo, sem coeficientes estimados para países reais. Rótulos de governo e ideologia não aplicam bônus ou punições automáticos. Estes índices não representam taxas de homicídio nem perfis individuais.</p></details><div class="modal-actions"><button class="primary" data-close>Voltar aos indicadores</button></div></div>`,
    );
  }
  const select = document.querySelector("#chartMetric");
  for (const [key, label] of consequenceMetrics) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = label;
    select.append(option);
  }
  const explain = document.createElement("button");
  explain.className = "secondary explain-metric";
  explain.textContent = "Entender este indicador ↗";
  explain.onclick = showExplanation;
  select.closest(".chart-heading")?.append(explain);
  if (!explain.isConnected) select.parentElement.append(explain);
  return { showPreview, showExplanation };
}
