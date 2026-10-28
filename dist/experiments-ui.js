import { policyDefs } from "./model.js";
import { makeExperiment, compareBranches, branchInfo } from "./experiments.js";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(v);
const date = (q) => `${2027 + Math.floor(q / 4)} · T${(q % 4) + 1}`;
const defs = [
  ["gdp", "PIB", "bi M$"],
  ["poverty", "Pobreza", "%"],
  ["welfare", "Bem-estar", "/100"],
  ["debt", "Dívida / PIB", "%"],
  ["unemployment", "Desemprego", "%"],
  ["inflation", "Inflação", "%"],
];
export function initExperimentsUI({
  getState,
  getSaved,
  saveRecords,
  activate,
  openModal,
}) {
  let comparison = null;
  function showNew() {
    openModal(
      `<div class="cycle-dialog"><span class="eyebrow">DOIS CAMINHOS · MESMO PAÍS</span><h3 id="modalTitle">Criar experimento</h3><p>Vamos guardar este ponto de partida e abrir dois caminhos independentes. Cada caminho ativo será atualizado automaticamente neste navegador.</p><p>O ponto inclui estoque, redes, obras e decisões pendentes. Você começa no Caminho A; encontre o Caminho B em Cenários salvos.</p><form id="experimentForm"><label for="experimentName">Nome do experimento</label><input id="experimentName" required maxlength="60" value="Estratégias para ${esc(getState().name.slice(0, 30))}"><p id="experimentError" role="status"></p><div class="modal-actions"><button type="button" class="secondary" data-close>Cancelar</button><button class="primary">Guardar origem e criar A/B</button></div></form></div>`,
    );
    document.querySelector("#experimentForm").onsubmit = (e) => {
      e.preventDefault();
      try {
        if (getSaved().length > 17)
          throw Error(
            "O experimento precisa de três vagas entre os 20 cenários. Exclua cópias que não precisa antes de continuar.",
          );
        const id = () =>
          crypto.randomUUID?.() ??
          Date.now().toString(36) + Math.random().toString(36).slice(2);
        const x = makeExperiment(getState(), {
          rootId: id(),
          aId: id(),
          bId: id(),
          name: document.querySelector("#experimentName").value.trim(),
        });
        saveRecords([x.origin, x.a, x.b, ...getSaved()]);
        activate(x.a.state);
      } catch (err) {
        document.querySelector("#experimentError").textContent = err.message;
      }
    };
  }
  function chart(metric) {
    const c = comparison.data,
      points = c.points.filter(
        (p) => Number.isFinite(p.a[metric]) && Number.isFinite(p.b[metric]),
      );
    if (!points.length) return "Sem amostras comuns.";
    if (points.length === 1)
      return `<p class="review-method">Só há o ponto de partida em comum. Avance os dois caminhos para visualizar suas trajetórias.</p><p>Atual: ${fmt(points[0].a[metric])} · salvo: ${fmt(points[0].b[metric])}.</p>`;
    const values = points.flatMap((p) => [p.a[metric], p.b[metric]]),
      lo = Math.min(...values),
      hi = Math.max(...values),
      pad = Math.max(0.5, (hi - lo) * 0.12),
      min = lo - pad,
      max = hi + pad;
    const line = (key) =>
      points
        .map(
          (p, i) =>
            `${40 + (i / Math.max(1, points.length - 1)) * 600},${180 - ((p[key][metric] - min) / (max - min)) * 145}`,
        )
        .join(" ");
    return `<svg class="experiment-chart" viewBox="0 0 680 230" role="img" aria-label="Trajetórias dos dois caminhos; valores exatos na tabela abaixo"><text x="8" y="24">${fmt(max)}</text><text x="8" y="203">${fmt(min)}</text><path d="M40 30V190H645" fill="none" stroke="currentColor" opacity=".3"/><polyline points="${line("a")}" fill="none" stroke="#80b62c" stroke-width="3"/><polyline points="${line("b")}" fill="none" stroke="#dd7f3d" stroke-width="3" stroke-dasharray="6 4"/><text x="40" y="222">${date(c.originQuarter)}</text><text x="640" y="222" text-anchor="end">${date(c.quarter)}</text></svg><div class="governance-table"><table><caption>Últimas ${Math.min(12, points.length)} amostras comuns</caption><thead><tr><th>Trimestre</th><th>Atual</th><th>Caminho salvo</th></tr></thead><tbody>${points
      .slice(-12)
      .map(
        (p) =>
          `<tr><th>${date(p.quarter)}</th><td>${fmt(p.a[metric])}</td><td>${fmt(p.b[metric])}</td></tr>`,
      )
      .join("")}</tbody></table></div>`;
  }
  function compare(item) {
    const s = getState(),
      c = compareBranches(s, item.state);
    if (!c.related) return false;
    comparison = { data: c, item };
    openModal(
      `<div class="cycle-dialog"><span class="eyebrow">EXPERIMENTO A/B</span><h3 id="modalTitle">Decisões a partir do mesmo ponto</h3><p>Origem: ${date(c.originQuarter)}. Comparação alinhada em <b>${date(c.quarter)}</b>. O atual tem ${c.extraA} trimestre(s) extra(s); o salvo, ${c.extraB}. Esses períodos extras não entram nos resultados abaixo.</p><p>Atual: ${esc(branchInfo(s).label)} · salvo: ${esc(item.name)}. A linha contínua representa o atual; a tracejada, o salvo. Resultados descrevem estes caminhos; não isolam automaticamente o efeito de cada política.</p><label for="experimentMetric">Indicador<select id="experimentMetric">${defs.map(([k, n, u]) => `<option value="${k}">${n} · ${u}</option>`).join("")}</select></label><div id="experimentChart">${chart("gdp")}</div><h4>Resultados no trimestre comum</h4><div class="governance-table"><table><thead><tr><th>Indicador</th><th>Atual</th><th>Salvo</th><th>Diferença</th></tr></thead><tbody>${defs.map(([k, n, u]) => `<tr><th>${n}</th><td>${fmt(c.a[k])} ${u}</td><td>${fmt(c.b[k])} ${u}</td><td>${fmt(c.a[k] - c.b[k])} ${u === "%" ? "p.p." : u === "/100" ? "pontos" : u}</td></tr>`).join("")}</tbody></table></div><details><summary>Diferenças atuais nas políticas</summary>${
        Object.keys(s.policies)
          .filter((k) => s.policies[k] !== item.state.policies[k])
          .map(
            (k) =>
              `<p>${esc(policyDefs.find((p) => p.key === k)?.name ?? "Política")}: ${fmt(s.policies[k])} / ${fmt(item.state.policies[k])}</p>`,
          )
          .join("") ||
        "<p>As políticas atuais são iguais; decisões anteriores ainda podem diferir.</p>"
      }<p>As políticas desta lista são as posições atuais, não todo o percurso.</p></details><div class="modal-actions"><button class="primary" data-close>Fechar comparação</button></div></div>`,
    );
    document.querySelector("#experimentMetric").onchange = (e) => {
      document.querySelector("#experimentChart").innerHTML = chart(
        e.target.value,
      );
    };
    return true;
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-experiment-new]")) showNew();
  });
  return { compare, showNew };
}
