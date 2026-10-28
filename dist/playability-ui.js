import {
  challengeDefs,
  startChallenge,
  assessChallenge,
} from "./challenges.js";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (v, d = 1) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: d }).format(v);
const date = (q) => `${2027 + Math.floor(q / 4)} · T${(q % 4) + 1}`;
const money = (v) =>
  Math.abs(v) >= 1 ? `M$ ${fmt(v, 2)} bi` : `M$ ${fmt(v * 1000)} mi`;
const target = (r) =>
  `${r.min !== undefined ? "≥" : "≤"} ${fmt(["water", "energy"].includes(r.key) ? (r.min ?? r.max) * 100 : (r.min ?? r.max))}${r.unit}`;
export function renderDecisionReview(s) {
  const r = s.lastReport?.actionReview ?? s.decisionReviews?.at(-1);
  if (!r) return "";
  const changes = [
    ["poverty", "Pobreza", "p.p."],
    ["welfare", "Bem-estar", "pontos"],
    ["gdp", "PIB", "bi M$"],
    ["inflation", "Inflação", "p.p."],
    ["debt", "Dívida / PIB", "p.p."],
  ].filter(([k]) => Math.abs(r.delta[k] ?? 0) > 0.0001);
  const ongoing = (s.crisisTracks ?? []).filter((c) => c.id === r.id);
  return `<section class="decision-review"><span class="eyebrow">SUA RESPOSTA · EXECUTADA EM ${date(r.quarter)}</span><h4>${esc(r.choice)}</h4><p>${esc(r.title)} · ${esc(r.region ?? "País")}</p><div class="review-costs">${[
    ["Gasto único executado", r.cost],
    ["Alteração anual de despesa recorrente", r.annualSpending],
    ["Alteração anual de receita recorrente", r.annualRevenue],
  ]
    .map(([k, v]) => `<div><span>${k}</span><strong>${money(v)}</strong></div>`)
    .join(
      "",
    )}</div><p class="review-method">Diferença entre executar e não executar esta resposta no mesmo trimestre e contexto. Não é a variação total do país. Valores anuais de políticas não são uma nova cobrança emergencial.</p><div class="review-deltas">${changes.map(([k, label, unit]) => `<span>${label}<b>${r.delta[k] > 0 ? "+" : ""}${fmt(r.delta[k], 3)} ${unit}</b></span>`).join("") || "<p>Sem diferença direta mensurável nos indicadores nacionais neste trimestre.</p>"}</div>${r.networks?.length ? `<div class="network-response">${r.networks.map((n) => `<p>${esc(s.systems?.regions[n.region]?.name ?? `Estado ${n.region + 1}`)}: água atendida ${fmt(n.waterBefore * 100, 0)}% sem a medida → ${fmt(n.waterAfter * 100, 0)}% com ela; reserva ${fmt(n.reserveBefore)} → ${fmt(n.reserveAfter)} u.a.; energia ${fmt(n.energyBefore * 100, 0)}% → ${fmt(n.energyAfter * 100, 0)}%; fila ${fmt(n.backlogBefore, 0)} → ${fmt(n.backlogAfter, 0)}/200.${n.installation ? " Implantação iniciada; capacidade depende da conclusão." : ""}</p>`).join("")}</div>` : ""}<p class="review-method">Situação atual: ${ongoing.length ? `${ongoing.length} acompanhamento(s) desta resposta ainda ativo(s).` : "Sem modificador temporário desta resposta em acompanhamento."} Reservas e capacidade continuam sujeitas a consumo, manutenção e clima.</p><details><summary>Últimas respostas executadas</summary>${(
    s.decisionReviews ?? []
  )
    .slice(-8)
    .reverse()
    .map(
      (x) =>
        `<p>${date(x.quarter)} · ${esc(x.choice)} · gasto único ${money(x.cost)}</p>`,
    )
    .join("")}</details></section>`;
}
export function initPlayabilityUI({ getState, openModal, onStart }) {
  function showChallenges() {
    openModal(
      `<div class="cycle-dialog"><span class="eyebrow">MISSÕES DE GOVERNO</span><h3 id="modalTitle">Desafios</h3><p>Cada partida tem condições próprias e um prazo. O país atual será guardado antes de começar.</p><div class="challenge-catalog">${challengeDefs.map((d) => `<article><span>${d.turns} trimestres · ${d.turns / 4} anos</span><h4>${d.name}</h4><p>${d.description}</p><ul>${d.rules.map((r) => `<li>${r.label}: ${target(r)}</li>`).join("")}</ul><button class="secondary" data-challenge-review="${d.key}">Ver regras ↗</button></article>`).join("")}</div></div>`,
    );
  }
  function showChallenge(key) {
    const d = challengeDefs.find((d) => d.key === key);
    if (!d) return;
    openModal(
      `<div class="cycle-dialog"><span class="eyebrow">NOVO PAÍS · DESAFIO</span><h3 id="modalTitle">${d.name}</h3><p>${d.description}</p><p>${d.hint}</p><div class="network-response"><p>Condições iniciais: dívida ${d.setup.debt}% do PIB; tributação ${d.setup.tax}%; serviços ${d.setup.services}%; infraestrutura ${d.setup.infrastructure}%.</p><p>Prazo: ${d.turns} trimestres. Dívida em 200% ou bem-estar abaixo de 35/100 encerram o desafio antes. O país pode continuar no modo livre.</p></div><ul>${d.rules.map((r) => `<li>${r.label}: ${target(r)}</li>`).join("")}</ul><p id="challengeError" role="status"></p><div class="modal-actions"><button class="secondary" data-close>Voltar ao país atual</button><button class="primary" data-challenge-start="${key}">Guardar país atual e iniciar desafio</button></div></div>`,
    );
  }
  function update() {
    const root = document.querySelector("#challengeStatus"),
      c = assessChallenge(getState());
    root.innerHTML = c
      ? `<section class="challenge-progress"><span class="eyebrow">DESAFIO · ${c.status === "playing" ? `${c.remaining} TRIMESTRES RESTANTES` : c.status === "won" ? "CONCLUÍDO" : "ENCERRADO"}</span><h3>${c.name}</h3><p>${c.status === "playing" ? c.hint : c.status === "won" ? "Critérios cumpridos no prazo. O resultado está guardado; continue este país no modo livre." : "O resultado foi guardado. Você pode continuar o país ou iniciar outra partida."}</p><div class="challenge-rules">${c.rows.map((r) => `<div><span>${r.label}</span><b>${r.value === null ? "Aguardando 4 trimestres" : fmt(["water", "energy"].includes(r.key) ? r.value * 100 : r.value)} <small>/ ${target(r)}</small></b><span>${r.met ? "Critério atendido" : "Em aberto"}</span></div>`).join("")}</div><p>Prazo: ${date(c.dueAt)}. ${c.reason}</p><button class="secondary" data-challenge-catalog>Escolher outro desafio ↗</button></section>`
      : "";
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-challenge-catalog]")) showChallenges();
    const review = e.target.closest("[data-challenge-review]");
    if (review) showChallenge(review.dataset.challengeReview);
    const start = e.target.closest("[data-challenge-start]");
    if (start) {
      try {
        onStart(startChallenge(start.dataset.challengeStart));
      } catch (err) {
        document.querySelector("#challengeError").textContent = err.message;
      }
    }
  });
  return { update, showChallenges };
}
